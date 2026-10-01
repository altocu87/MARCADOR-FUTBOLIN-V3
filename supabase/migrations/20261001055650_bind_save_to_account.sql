-- Prevent an in-flight offline retry from moving to a different logged-in account.
revoke insert, update on public.players from authenticated;
grant insert (name, nickname, photo_url) on public.players to authenticated;
grant update (name, nickname, photo_url, active) on public.players to authenticated;
create or replace function public.save_match_v1(document jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  m jsonb := document->'match';
  match_uuid uuid := (m->>'id')::uuid;
  caller uuid := auth.uid();
  hash text := md5(document::text);
  existing_hash text;
  participant_count integer;
  white_count integer;
  blue_count integer;
  last_event jsonb;
begin
  if caller is null then raise exception 'Inicia sesión para guardar'; end if;
  if (document->>'owner_id')::uuid is distinct from caller then
    raise exception 'La cuenta no coincide con la que inició el partido';
  end if;
  if jsonb_typeof(document->'participants') is distinct from 'array' or jsonb_typeof(document->'events') is distinct from 'array' then
    raise exception 'Agregado incompleto';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(match_uuid::text, 0));
  select payload_hash into existing_hash from public.matches where id = match_uuid;
  if found then
    if existing_hash <> hash then raise exception 'El ID ya existe con otro contenido'; end if;
    return match_uuid;
  end if;
  select count(*), count(*) filter (where p->>'team' = 'WHITE'), count(*) filter (where p->>'team' = 'BLUE')
    into participant_count, white_count, blue_count from jsonb_array_elements(document->'participants') p;
  if participant_count not in (2, 4) or white_count <> blue_count then raise exception 'Equipos inválidos'; end if;
  if exists (select 1 from jsonb_array_elements(document->'participants') p
    where not exists (select 1 from public.players where id = (p->>'player_id')::uuid and owner_id = caller)) then
    raise exception 'Jugador inexistente o de otro propietario';
  end if;
  if jsonb_array_length(document->'events') = 0 then raise exception 'Falta cronología'; end if;
  last_event := (document->'events')->-1;
  if last_event->>'event_type' is distinct from 'match_end'
    or (last_event->>'white_score')::integer <> (m->>'white_score')::integer
    or (last_event->>'blue_score')::integer <> (m->>'blue_score')::integer then raise exception 'Resultado inconsistente'; end if;
  if exists (select 1 from jsonb_array_elements(document->'events') with ordinality e(value, n)
    where (value->>'sequence')::integer is distinct from n) then raise exception 'Secuencia inválida'; end if;

  insert into public.matches (id, owner_id, match_type, status, victory_condition, goal_limit, time_limit_seconds,
    white_score, blue_score, winner_team, started_at, finished_at, went_to_extra_time, went_to_penalties,
    penalty_white_score, penalty_blue_score, penalty_white_attempts, penalty_blue_attempts, test_mode, payload_hash)
  values (match_uuid, caller, m->>'match_type', m->>'status', m->>'victory_condition', (m->>'goal_limit')::integer,
    (m->>'time_limit_seconds')::integer, (m->>'white_score')::integer, (m->>'blue_score')::integer, m->>'winner_team',
    (m->>'started_at')::timestamptz, (m->>'finished_at')::timestamptz, (m->>'went_to_extra_time')::boolean,
    (m->>'went_to_penalties')::boolean, (m->>'penalty_white_score')::integer, (m->>'penalty_blue_score')::integer,
    (m->>'penalty_white_attempts')::integer, (m->>'penalty_blue_attempts')::integer, (m->>'test_mode')::boolean, hash);
  insert into public.match_participants (owner_id, match_id, player_id, player_name, team, position)
  select caller, match_uuid, (p->>'player_id')::uuid, p->>'player_name', p->>'team', (p->>'position')::integer
  from jsonb_array_elements(document->'participants') p;
  insert into public.match_events (owner_id, match_id, event_type, team, period, match_time_seconds, period_time_seconds,
    white_score, blue_score, sequence, penalty_scored, metadata, occurred_at)
  select caller, match_uuid, e->>'event_type', e->>'team', e->>'period', (e->>'match_time_seconds')::integer,
    (e->>'period_time_seconds')::integer, (e->>'white_score')::integer, (e->>'blue_score')::integer,
    (e->>'sequence')::integer, (e->>'penalty_scored')::boolean, coalesce(e->'metadata', '{}'), (e->>'occurred_at')::timestamptz
  from jsonb_array_elements(document->'events') e;
  return match_uuid;
end; $$;
revoke execute on function public.save_match_v1(jsonb) from public, anon;
grant execute on function public.save_match_v1(jsonb) to authenticated;
