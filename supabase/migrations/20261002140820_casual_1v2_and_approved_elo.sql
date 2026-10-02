-- Three-player QUICK/CHAOS only. Existing invoker/RLS/grants/idempotency preserved.
CREATE OR REPLACE FUNCTION public.save_match_v1(document jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
  if white_count not between 1 and 2 or blue_count not between 1 and 2
    or participant_count <> white_count + blue_count
    or (participant_count = 3 and m->>'match_type' not in ('QUICK','CHAOS')) then
    raise exception 'Equipos inválidos'; end if;
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
end; $function$;

CREATE OR REPLACE FUNCTION public.check_complete_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  match_uuid uuid;
  m public.matches%rowtype;
  last_event public.match_events%rowtype;
  n integer;
  w integer;
  b integer;
  event_count integer;
begin
  if tg_table_name = 'matches' then match_uuid := new.id; else match_uuid := new.match_id; end if;
  select * into m from public.matches where id = match_uuid;
  if not found then raise exception 'Partido inexistente'; end if;
  select count(*), count(*) filter (where team = 'WHITE'), count(*) filter (where team = 'BLUE')
    into n, w, b from public.match_participants where match_id = match_uuid;
  if w not between 1 and 2 or b not between 1 and 2 or n <> w + b
    or (n = 3 and m.match_type not in ('QUICK','CHAOS')) then raise exception 'Participantes incompletos'; end if;
  if exists (select 1 from public.match_participants where match_id = match_uuid and position > (select count(*) from public.match_participants other where other.match_id = match_uuid and other.team = match_participants.team)) then
    raise exception 'Posición inválida';
  end if;
  select count(*) into event_count from public.match_events where match_id = match_uuid;
  select * into last_event from public.match_events where match_id = match_uuid order by sequence desc limit 1;
  if event_count = 0 or last_event.event_type <> 'match_end' or last_event.sequence <> event_count
    or last_event.white_score <> m.white_score or last_event.blue_score <> m.blue_score then
    raise exception 'Cronología incompleta';
  end if;
  if exists (select 1 from (
    select sequence, row_number() over(order by sequence) as ordinal,
      match_time_seconds, lag(match_time_seconds) over(order by sequence) as previous_time,
      occurred_at, lag(occurred_at) over(order by sequence) as previous_at
    from public.match_events where match_id = match_uuid) e
    where sequence <> ordinal or match_time_seconds < previous_time or occurred_at < previous_at
      or occurred_at < m.started_at or occurred_at > m.finished_at) then
    raise exception 'Orden de eventos inválido';
  end if;
  if m.went_to_extra_time <> exists (select 1 from public.match_events where match_id = match_uuid and period = 'EXTRA_TIME')
    or m.went_to_penalties <> exists (select 1 from public.match_events where match_id = match_uuid and event_type = 'penalty') then
    raise exception 'Periodos incoherentes';
  end if;
  return null;
end; $function$;

-- Explicit owner approval in this conversation: 40/20, nearest-away, categories/25,
-- no goal multiplier, all confirmed ranked history. No business rows modified.
do $approval$
begin
  if not exists (select 1 from public.elo_rules_v1 where singleton and version=1 and not enabled
    and provisional_k is null and category_thresholds is null) then
    raise exception 'ELO configuration changed; inspect before activation';
  end if;
  update public.elo_rules_v1 set version=2, enabled=true, eligible_from=null,
    provisional_matches=10, provisional_k=40, established_k=20, rounding='nearest-away',
    category_thresholds=array[0,1000,1200,1400,1600,1800], hysteresis=25,
    margin_multipliers=array[1,1,1,1,1,1]::numeric[] where singleton;
end $approval$;

