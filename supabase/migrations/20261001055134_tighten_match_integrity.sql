-- Cover complete composite FKs (not only their first column).
create index participants_match_owner_idx on public.match_participants(match_id, owner_id);
create index events_match_owner_idx on public.match_events(match_id, owner_id);

alter table public.matches add constraint coherent_penalties check (
  (not went_to_penalties and penalty_white_score is null and penalty_blue_score is null
    and penalty_white_attempts is null and penalty_blue_attempts is null)
  or (went_to_penalties and penalty_white_score <= penalty_white_attempts
    and penalty_blue_score <= penalty_blue_attempts and penalty_white_score <> penalty_blue_score)
);
alter table public.matches add constraint coherent_winner check (
  winner_team is not distinct from case
    when coalesce(penalty_white_score, white_score) > coalesce(penalty_blue_score, blue_score) then 'WHITE'
    when coalesce(penalty_blue_score, blue_score) > coalesce(penalty_white_score, white_score) then 'BLUE'
    else null end
);

-- Deferred checks protect atomicity even when a caller bypasses the RPC.
-- Invoker privileges and RLS stay active; no elevated access is granted.
create function public.check_complete_match() returns trigger
language plpgsql security invoker set search_path = '' as $$
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
  if n not in (2, 4) or w <> b then raise exception 'Participantes incompletos'; end if;
  if exists (select 1 from public.match_participants where match_id = match_uuid and position > n / 2) then
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
end; $$;
revoke execute on function public.check_complete_match() from public, anon, authenticated;
create constraint trigger matches_complete after insert on public.matches
  deferrable initially deferred for each row execute function public.check_complete_match();
create constraint trigger participants_complete after insert on public.match_participants
  deferrable initially deferred for each row execute function public.check_complete_match();
create constraint trigger events_complete after insert on public.match_events
  deferrable initially deferred for each row execute function public.check_complete_match();
