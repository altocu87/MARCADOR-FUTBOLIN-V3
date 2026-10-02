-- No unapproved parameters are stored/activated. This row initially has NULL
-- competitive settings. XP configuration, business rows and save_match_v1 stay intact.
create function public.valid_elo_settings_v1(thresholds integer[], multipliers numeric[])
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare i integer;
begin
  if thresholds is null or multipliers is null or cardinality(thresholds)<>6 or cardinality(multipliers)<>6
    or array_lower(thresholds,1)<>1 or array_lower(multipliers,1)<>1
    or thresholds[1] is distinct from 0 or multipliers[1] is distinct from 1 then return false; end if;
  for i in 1..6 loop
    if thresholds[i] is null or (i>1 and thresholds[i]<=thresholds[i-1])
      or multipliers[i] is null or multipliers[i]<'0.1'::numeric or multipliers[i]>2
      or multipliers[i]::text in ('NaN','Infinity','-Infinity') then return false; end if;
  end loop;
  return true;
end; $$;
revoke all on function public.valid_elo_settings_v1(integer[],numeric[]) from public,anon,authenticated;

create table public.elo_rules_v1 (
  singleton boolean primary key default true check(singleton),
  version integer not null check(version>0),
  enabled boolean not null default false,
  initial_elo integer not null default 1200 check(initial_elo=1200),
  eligible_from timestamptz,
  provisional_matches integer,
  provisional_k integer,
  established_k integer,
  rounding text,
  category_thresholds integer[],
  hysteresis integer,
  margin_multipliers numeric[],
  constraint elo_enabled_settings check(not enabled or coalesce(
    provisional_matches between 1 and 1000 and provisional_k between 1 and 1000
    and established_k between 1 and 1000 and rounding='nearest-away'
    and hysteresis between 0 and 100
    and public.valid_elo_settings_v1(category_thresholds,margin_multipliers),false))
);
alter table public.elo_rules_v1 enable row level security;
revoke all on public.elo_rules_v1 from public,anon,authenticated;
grant select on public.elo_rules_v1 to authenticated;
create policy elo_rules_read on public.elo_rules_v1 for select to authenticated using(true);
insert into public.elo_rules_v1(singleton,version,enabled) values(true,1,false);

-- Read-only replay in one caller snapshot. No parameters, counters, writes,
-- SECURITY DEFINER, auth metadata, locks, triggers or replacement of old RPCs.
create function public.get_ranking_v1()
returns table(player_id uuid,name text,nickname text,active boolean,
  elo integer,max_elo integer,classified_matches integer,category text,
  ranking_position bigint,enabled boolean,rules_version integer)
language plpgsql stable security invoker set search_path = '' as $$
declare
  operator_id uuid := auth.uid();
  cfg public.elo_rules_v1%rowtype;
  player_row record;
  game record;
  participant jsonb;
  states jsonb := '{}'::jsonb;
  current_state jsonb;
  identifier text;
  white_mean numeric; blue_mean numeric; white_expectation numeric; expectation numeric;
  result numeric; multiplier numeric; k integer; delta integer; next_elo integer; category_index integer;
  team_size integer;
  labels text[] := array['BRONCE','PLATA','ORO','PLATINO','DIAMANTE','ÉLITE'];
begin
  if operator_id is null then raise exception 'Authenticated operator required' using errcode='42501'; end if;
  select * into strict cfg from public.elo_rules_v1 where singleton;
  -- Explicit owner filters complement, never replace, caller RLS.
  for player_row in select p.id from public.players p where p.owner_id=operator_id loop
    category_index:=1;
    if cfg.enabled then
      while category_index<6 and cfg.initial_elo>=cfg.category_thresholds[category_index+1] loop
        category_index:=category_index+1;
      end loop;
    end if;
    states:=states || jsonb_build_object(player_row.id::text,jsonb_build_object(
      'elo',cfg.initial_elo,'max',cfg.initial_elo,'count',0,'category',category_index));
  end loop;
  if cfg.enabled then
    for game in
      select m.*, team.participants from public.matches m
      cross join lateral (select jsonb_agg(jsonb_build_object('id',p.player_id,'team',p.team,'position',p.position)
        order by p.team,p.position) as participants
        from public.match_participants p where p.match_id=m.id and p.owner_id=m.owner_id) team
      where m.owner_id=operator_id and m.match_type='RANKED' and m.status='MATCH_END' and not m.test_mode
        and (cfg.eligible_from is null or m.started_at>=cfg.eligible_from)
      order by m.finished_at,m.id
    loop
      if game.participants is null or jsonb_array_length(game.participants) not in (2,4)
        or (select count(distinct item->>'id') from jsonb_array_elements(game.participants) item)<>jsonb_array_length(game.participants)
        or (select count(*) from jsonb_array_elements(game.participants) item where item->>'team'='WHITE')*2<>jsonb_array_length(game.participants)
        or game.winner_team is distinct from (case
          when game.went_to_penalties then case when game.penalty_white_score>game.penalty_blue_score then 'WHITE' else 'BLUE' end
          when game.white_score>game.blue_score then 'WHITE' when game.blue_score>game.white_score then 'BLUE' else null end)
        then raise exception 'Invalid confirmed competitive aggregate'; end if;
      white_mean:=0; blue_mean:=0; team_size:=jsonb_array_length(game.participants)/2;
      for participant in select value from jsonb_array_elements(game.participants) loop
        if not states ? (participant->>'id') then raise exception 'Invalid competitive identity'; end if;
        if participant->>'team'='WHITE' then white_mean:=white_mean+(states->(participant->>'id')->>'elo')::integer;
        else blue_mean:=blue_mean+(states->(participant->>'id')->>'elo')::integer; end if;
      end loop;
      white_mean:=white_mean/team_size; blue_mean:=blue_mean/team_size;
      -- Saturate only expectation beyond numerical relevance, never rating.
      white_expectation:=case when blue_mean-white_mean>16000 then 0 when blue_mean-white_mean< -16000 then 1
        else 1/(1+power(10::numeric,(blue_mean-white_mean)/400)) end;
      multiplier:=case when game.went_to_penalties or game.winner_team is null then 1
        else cfg.margin_multipliers[least(5,abs(game.white_score-game.blue_score))+1] end;
      for participant in select value from jsonb_array_elements(game.participants) loop
        identifier:=participant->>'id'; current_state:=states->identifier;
        expectation:=case when participant->>'team'='WHITE' then white_expectation else 1-white_expectation end;
        result:=case when game.winner_team is null then 0.5 when game.winner_team=participant->>'team' then 1 else 0 end;
        k:=case when (current_state->>'count')::integer<cfg.provisional_matches then cfg.provisional_k else cfg.established_k end;
        delta:=round(k*multiplier*(result-expectation))::integer;
        next_elo:=(current_state->>'elo')::integer+delta;
        category_index:=(current_state->>'category')::integer;
        while category_index<6 and next_elo>=cfg.category_thresholds[category_index+1] loop category_index:=category_index+1; end loop;
        while category_index>1 and next_elo<cfg.category_thresholds[category_index]-cfg.hysteresis loop category_index:=category_index-1; end loop;
        states:=jsonb_set(states,array[identifier],jsonb_build_object('elo',next_elo,
          'max',greatest((current_state->>'max')::integer,next_elo),
          'count',(current_state->>'count')::integer+1,'category',category_index));
      end loop;
    end loop;
  end if;
  return query with projections as (
    select p.id,p.name,p.nickname,p.active,(states->p.id::text->>'elo')::integer as rating,
      (states->p.id::text->>'max')::integer as peak,(states->p.id::text->>'count')::integer as games,
      case when cfg.enabled then labels[(states->p.id::text->>'category')::integer] else null end as label
    from public.players p where p.owner_id=operator_id
  ), ranked as (
    select r.id,rank() over(order by r.rating desc) as position from projections r where r.games>0
  ) select p.id,p.name,p.nickname,p.active,p.rating,p.peak,p.games,p.label,r.position,cfg.enabled,cfg.version
    from projections p left join ranked r on p.id=r.id
    order by r.position nulls last,p.rating desc,p.id;
end; $$;
revoke all on function public.get_ranking_v1() from public,anon,authenticated;
grant execute on function public.get_ranking_v1() to authenticated;
