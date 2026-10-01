-- V1: private personal scoreboard. Authentication is separate from player identity.
create table public.players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 80),
  nickname text check (length(nickname) <= 40),
  photo_url text check (photo_url is null or photo_url ~ '^https://'),
  active boolean not null default true,
  level integer not null default 0 check (level >= 0),
  xp bigint not null default 0 check (xp >= 0),
  elo integer not null default 1200,
  max_elo integer not null default 1200,
  classified_matches integer not null default 0 check (classified_matches >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create table public.matches (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  match_type text not null check (match_type in ('QUICK', 'CHAOS', 'RANKED')),
  status text not null check (status = 'MATCH_END'),
  victory_condition text not null check (victory_condition in ('GOALS', 'TIME', 'BOTH')),
  goal_limit integer not null check (goal_limit between 1 and 20),
  time_limit_seconds integer not null check (time_limit_seconds between 60 and 1800),
  white_score integer not null check (white_score >= 0),
  blue_score integer not null check (blue_score >= 0),
  winner_team text check (winner_team in ('WHITE', 'BLUE')),
  started_at timestamptz not null,
  finished_at timestamptz not null check (finished_at >= started_at),
  went_to_extra_time boolean not null,
  went_to_penalties boolean not null,
  penalty_white_score integer check (penalty_white_score >= 0),
  penalty_blue_score integer check (penalty_blue_score >= 0),
  penalty_white_attempts integer check (penalty_white_attempts >= 0),
  penalty_blue_attempts integer check (penalty_blue_attempts >= 0),
  test_mode boolean not null default false check (test_mode = false),
  engine_version integer not null default 1,
  payload_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id),
  check (went_to_penalties = (penalty_white_score is not null and penalty_blue_score is not null
    and penalty_white_attempts is not null and penalty_blue_attempts is not null))
);
create table public.match_participants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  match_id uuid not null,
  player_id uuid not null,
  player_name text not null check (length(btrim(player_name)) between 1 and 80),
  team text not null check (team in ('WHITE', 'BLUE')),
  position integer not null check (position in (1, 2)),
  created_at timestamptz not null default now(),
  foreign key (match_id, owner_id) references public.matches(id, owner_id) on delete cascade,
  foreign key (player_id, owner_id) references public.players(id, owner_id) on delete restrict,
  unique (match_id, player_id),
  unique (match_id, team, position)
);
create table public.match_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  match_id uuid not null,
  event_type text not null check (event_type in ('goal', 'score_correction', 'undo', 'period_start', 'period_end', 'extra_time_start', 'penalty', 'match_end', 'pause', 'resume')),
  team text check (team in ('WHITE', 'BLUE')),
  period text not null check (period in ('FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES')),
  match_time_seconds integer not null check (match_time_seconds >= 0),
  period_time_seconds integer not null check (period_time_seconds >= 0),
  white_score integer not null check (white_score >= 0),
  blue_score integer not null check (blue_score >= 0),
  sequence integer not null check (sequence > 0),
  penalty_scored boolean,
  metadata jsonb not null default '{}' check (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  foreign key (match_id, owner_id) references public.matches(id, owner_id) on delete cascade,
  unique (match_id, sequence),
  check ((event_type not in ('goal', 'penalty')) or team is not null),
  check ((event_type = 'penalty') = (penalty_scored is not null))
);
create index players_owner_active_idx on public.players(owner_id, active, name);
create index matches_owner_finished_idx on public.matches(owner_id, finished_at desc);
create index participants_player_owner_idx on public.match_participants(player_id, owner_id);
create index participants_owner_idx on public.match_participants(owner_id);
create index events_owner_idx on public.match_events(owner_id);

create function public.set_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
create trigger players_updated before update on public.players for each row execute function public.set_updated_at();
create trigger matches_updated before update on public.matches for each row execute function public.set_updated_at();

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_participants enable row level security;
alter table public.match_events enable row level security;
revoke all on public.players, public.matches, public.match_participants, public.match_events from anon, authenticated;
grant select, insert, update, delete on public.players to authenticated;
grant select, insert on public.matches, public.match_participants, public.match_events to authenticated;
create policy players_read on public.players for select to authenticated using (owner_id = (select auth.uid()));
create policy players_create on public.players for insert to authenticated with check (owner_id = (select auth.uid()));
create policy players_edit on public.players for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy players_delete_unused on public.players for delete to authenticated using (
  owner_id = (select auth.uid()) and not exists (select 1 from public.match_participants p where p.player_id = players.id)
);
create policy matches_read on public.matches for select to authenticated using (owner_id = (select auth.uid()));
create policy matches_create on public.matches for insert to authenticated with check (owner_id = (select auth.uid()));
create policy participants_read on public.match_participants for select to authenticated using (owner_id = (select auth.uid()));
create policy participants_create on public.match_participants for insert to authenticated with check (owner_id = (select auth.uid()));
create policy events_read on public.match_events for select to authenticated using (owner_id = (select auth.uid()));
create policy events_create on public.match_events for insert to authenticated with check (owner_id = (select auth.uid()));

-- Single transaction, invoker RLS and idempotency for safe offline retries.
create function public.save_match_v1(document jsonb) returns uuid
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
  if jsonb_typeof(document->'participants') <> 'array' or jsonb_typeof(document->'events') <> 'array' then
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
  if last_event->>'event_type' <> 'match_end'
    or (last_event->>'white_score')::integer <> (m->>'white_score')::integer
    or (last_event->>'blue_score')::integer <> (m->>'blue_score')::integer then raise exception 'Resultado inconsistente'; end if;
  if exists (select 1 from jsonb_array_elements(document->'events') with ordinality e(value, n)
    where (value->>'sequence')::integer <> n) then raise exception 'Secuencia inválida'; end if;

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
