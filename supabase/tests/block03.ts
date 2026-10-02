/** Execute whole output in a single transaction ending in ROLLBACK.
 * Uses an existing account, no Auth operations. Proposed rules ONLY in rollback.
 * node --import tsx supabase/tests/block03.ts > /tmp/futbolin-block03.sql
 */
import { rebuildCompetition } from '../../src/competition/elo'
import { eloFixtures, eloPlayers, testEloRules } from '../../tests/eloFixtures'
const documents=eloFixtures().reverse()
const replay=(docs=documents,rules=testEloRules)=>rebuildCompetition(eloPlayers,docs.map(d=>({...d.match,participants:d.participants})),rules).rows
const json=(value:unknown)=>`'${JSON.stringify(value).replaceAll("'","''")}'::jsonb`
const checks=documents.map((_,i)=>replay(documents.slice(0,i+1)))
const edited=structuredClone(documents);const last=edited.at(-1)!
last.match.white_score=0;last.match.blue_score=1;last.match.winner_team='BLUE'
const policies=[{...testEloRules,marginMultipliers:[1,1,1,1,1,1]}, {...testEloRules,hysteresis:0},
  {...testEloRules,eligibleFrom:'2026-09-01T00:20:00Z'}]
console.log(`begin;
set local lock_timeout='3s'; set local statement_timeout='30s';
do $elo$
declare
  operator_id uuid;
  docs jsonb := ${json(documents)};
  fixture_players jsonb := ${json(eloPlayers)};
  checks jsonb := ${json(checks)};
  extra_policies jsonb := ${json(policies.map(r=>({rules:r,expected:replay(documents,r)})))};
  before_state jsonb; after_state jsonb; snapshot jsonb; before_snapshot jsonb;
  item jsonb; doc jsonb; policy jsonb; expected_row jsonb; actual_row jsonb;
  n integer:=0; rejected boolean; fixture_id uuid;
begin
  select id into operator_id from auth.users where email_confirmed_at is not null order by created_at limit 1;
  if operator_id is null then raise exception 'Existing confirmed operator required'; end if;
  select jsonb_build_object('players',(select jsonb_agg(to_jsonb(p) order by id) from public.players p),
    'matches',(select jsonb_agg(to_jsonb(m) order by id) from public.matches m),
    'participants',(select jsonb_agg(to_jsonb(p) order by id) from public.match_participants p),
    'events',(select jsonb_agg(to_jsonb(e) order by id) from public.match_events e),
    'xp_config',(select to_jsonb(x) from public.xp_rules_v1 x),
    'xp_projection',(select jsonb_agg(to_jsonb(x) order by id) from public.player_progression_v1 x)) into before_state;
  -- Abort on fixture collision; no ON CONFLICT or Auth mutations.
  for item in select value from jsonb_array_elements(fixture_players) loop
    insert into public.players(id,owner_id,name) values((item->>'id')::uuid,operator_id,item->>'name');
  end loop;
  -- Unapproved empty config cannot be enabled accidentally.
  update public.elo_rules_v1 set enabled=false,provisional_matches=null,provisional_k=null,established_k=null,
    rounding=null,category_thresholds=null,hysteresis=null,margin_multipliers=null;
  rejected:=false;
  begin update public.elo_rules_v1 set enabled=true; exception when check_violation then rejected:=true; end;
  if not rejected then raise exception 'FAIL empty settings activation gate'; end if;
  -- Test parameters are never committed. These do not approve product settings.
  update public.elo_rules_v1 set enabled=true,provisional_matches=10,provisional_k=40,established_k=20,
    rounding='nearest-away',category_thresholds=array[0,1000,1200,1400,1600,1800],hysteresis=25,
    margin_multipliers=array[1,1,1.05,1.1,1.15,1.2]::numeric[],eligible_from=null;
  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  set local role authenticated;
  for doc in select value from jsonb_array_elements(docs) loop
    doc:=doc || jsonb_build_object('owner_id',operator_id);
    perform public.save_match_v1(doc);
    set constraints all immediate; set constraints all deferred;
    snapshot:=public.get_competition_snapshot_v1();
    for expected_row in select value from jsonb_array_elements(checks->n) loop
      select value into actual_row from jsonb_array_elements(snapshot) where value->>'player_id'=expected_row->>'playerId';
      if actual_row is null or (actual_row->>'elo')::integer<>(expected_row->>'elo')::integer
        or (actual_row->>'max_elo')::integer<>(expected_row->>'maxElo')::integer
        or (actual_row->>'classified_matches')::integer<>(expected_row->>'classifiedMatches')::integer
        or actual_row->>'category' is distinct from expected_row->>'category'
        or (actual_row->>'ranking_position')::integer is distinct from (expected_row->>'rank')::integer
        then raise exception 'FAIL chronological SQL/TS parity at insertion %',n; end if;
    end loop;
    before_snapshot:=snapshot;
    perform public.save_match_v1(doc);
    if public.get_competition_snapshot_v1() is distinct from before_snapshot then raise exception 'FAIL duplicate adjustment'; end if;
    rejected:=false;
    begin perform public.save_match_v1(jsonb_set(doc,'{match,winner_team}',
      case when doc->'match'->>'winner_team'='BLUE' then '"WHITE"'::jsonb else '"BLUE"'::jsonb end));
    exception when others then rejected:=true; end;
    if not rejected then raise exception 'FAIL conflicting retry'; end if;
    rejected:=false;
    begin perform public.save_match_v1(jsonb_set(jsonb_set(doc,'{match,id}',to_jsonb(gen_random_uuid())),'{match,test_mode}','true'));
    exception when others then rejected:=true; end;
    if not rejected then raise exception 'FAIL test-mode persistence'; end if;
    n:=n+1;
  end loop;
  fixture_id:=(fixture_players->0->>'id')::uuid;
  snapshot:=public.get_competition_snapshot_v1();
  update public.players set name='Current alias source',nickname='ALIAS ELO',active=false where id=fixture_id;
  if not exists(select 1 from public.get_ranking_v1() where player_id=fixture_id and nickname='ALIAS ELO'
    and elo=(select (value->>'elo')::integer from jsonb_array_elements(snapshot) where value->>'player_id'=fixture_id::text)) then raise exception 'FAIL stable identity'; end if;
  for item in select value from jsonb_array_elements(fixture_players) loop
    update public.players set active=(item->>'active')::boolean where id=(item->>'id')::uuid;
  end loop;
  rejected:=false;
  begin update public.players set elo=999,max_elo=999,classified_matches=50 where id=fixture_id; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL protected ELO columns'; end if;
  rejected:=false;
  begin update public.elo_rules_v1 set enabled=false; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL config write'; end if;
  rejected:=false;
  begin update public.matches set white_score=99 where id=(docs->0->'match'->>'id')::uuid; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL administration permission'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if public.get_competition_snapshot_v1()<>'[]'::jsonb then raise exception 'FAIL other account isolation'; end if;
  perform set_config('request.jwt.claim.sub','',true); rejected:=false;
  begin perform public.get_competition_snapshot_v1(); exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL missing identity'; end if;
  reset role; set local role anon;
  rejected:=false; begin perform public.get_competition_snapshot_v1(); exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL anonymous execute'; end if;
  rejected:=false; begin perform * from public.elo_rules_v1; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL anonymous settings read'; end if;
  reset role; perform set_config('request.jwt.claim.sub',operator_id::text,true);
  -- Independent policies and rounding configured only within ROLLBACK.
  for policy in select value from jsonb_array_elements(extra_policies) loop
    update public.elo_rules_v1 set hysteresis=(policy->'rules'->>'hysteresis')::integer,
      eligible_from=(policy->'rules'->>'eligibleFrom')::timestamptz,
      margin_multipliers=array(select value::numeric from jsonb_array_elements_text(policy->'rules'->'marginMultipliers'));
    snapshot:=public.get_competition_snapshot_v1();
    for expected_row in select value from jsonb_array_elements(policy->'expected') loop
      select value into actual_row from jsonb_array_elements(snapshot) where value->>'player_id'=expected_row->>'playerId';
      if (actual_row->>'elo')::integer<>(expected_row->>'elo')::integer
        or (actual_row->>'max_elo')::integer<>(expected_row->>'maxElo')::integer
        or (actual_row->>'classified_matches')::integer<>(expected_row->>'classifiedMatches')::integer
        or actual_row->>'category' is distinct from expected_row->>'category' then raise exception 'FAIL alternate policy parity'; end if;
    end loop;
  end loop;
  update public.elo_rules_v1 set eligible_from=null,hysteresis=25,margin_multipliers=array[1,1,1.05,1.1,1.15,1.2]::numeric[];
  for n in 1..3 loop
    rejected:=false;
    begin
      if n=1 then update public.elo_rules_v1 set provisional_k=0;
      elsif n=2 then update public.elo_rules_v1 set category_thresholds=array[0,1000,1000,1400,1600,1800];
      else update public.elo_rules_v1 set margin_multipliers=array[1,1,'NaN',1,1,1]::numeric[]; end if;
    exception when check_violation then rejected:=true; end;
    if not rejected then raise exception 'FAIL invalid competitive settings'; end if;
  end loop;
  -- Simulate future administrative edits on fixtures only; no new API/grants.
  update public.matches set white_score=0,blue_score=1,winner_team='BLUE' where id=(docs->16->'match'->>'id')::uuid;
  update public.match_events set white_score=0,blue_score=1,team='BLUE' where match_id=(docs->16->'match'->>'id')::uuid and event_type='match_end';
  snapshot:=public.get_competition_snapshot_v1();
  for expected_row in select value from jsonb_array_elements(${json(replay(edited))}) loop
    select value into actual_row from jsonb_array_elements(snapshot) where value->>'player_id'=expected_row->>'playerId';
    if (actual_row->>'elo')::integer<>(expected_row->>'elo')::integer or (actual_row->>'max_elo')::integer<>(expected_row->>'maxElo')::integer
      or actual_row->>'category' is distinct from expected_row->>'category' then raise exception 'FAIL edited history replay'; end if;
  end loop;
  delete from public.matches where id=(docs->16->'match'->>'id')::uuid;
  snapshot:=public.get_competition_snapshot_v1();
  for expected_row in select value from jsonb_array_elements(${json(replay(documents.slice(0,-1)))}) loop
    select value into actual_row from jsonb_array_elements(snapshot) where value->>'player_id'=expected_row->>'playerId';
    if (actual_row->>'elo')::integer<>(expected_row->>'elo')::integer or (actual_row->>'max_elo')::integer<>(expected_row->>'maxElo')::integer
      or (actual_row->>'classified_matches')::integer<>(expected_row->>'classifiedMatches')::integer then raise exception 'FAIL deleted history replay'; end if;
  end loop;
  update public.elo_rules_v1 set enabled=false;
  if exists(select 1 from public.get_ranking_v1() where elo<>1200 or max_elo<>1200 or classified_matches<>0 or category is not null) then raise exception 'FAIL disabled gate'; end if;
  delete from public.matches where id in(select (value->'match'->>'id')::uuid from jsonb_array_elements(docs));
  delete from public.players where id in(select (value->>'id')::uuid from jsonb_array_elements(fixture_players));
  select jsonb_build_object('players',(select jsonb_agg(to_jsonb(p) order by id) from public.players p),
    'matches',(select jsonb_agg(to_jsonb(m) order by id) from public.matches m),
    'participants',(select jsonb_agg(to_jsonb(p) order by id) from public.match_participants p),
    'events',(select jsonb_agg(to_jsonb(e) order by id) from public.match_events e),
    'xp_config',(select to_jsonb(x) from public.xp_rules_v1 x),
    'xp_projection',(select jsonb_agg(to_jsonb(x) order by id) from public.player_progression_v1 x)) into after_state;
  if after_state is distinct from before_state then raise exception 'FAIL existing data or XP changed'; end if;
end $elo$;
select 'PASS block 03: chronological SQL/TS parity, late inserts, K/2v2, margins, draws/penalties, retries, RLS, protected columns/config, edit/delete replay, disabled gate, XP/data preserved. ROLLBACK.' as result;
rollback;`)
