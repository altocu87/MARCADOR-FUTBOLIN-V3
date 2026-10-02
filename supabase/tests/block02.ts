/** Real RPC/RLS/progression checks. Run the WHOLE output; ends with rollback.
 * Uses an existing confirmed operator, no credentials/accounts; fixtures only.
 * node --import tsx supabase/tests/block02.ts > /tmp/futbolin-block02.sql
 */
import { approvedXpRules, rebuildProgression } from '../../src/progression/xp'
import { xpFixtures, xpPlayers } from '../../tests/xpFixtures'
const docs=xpFixtures(), games=docs.map(d=>({...d.match,participants:d.participants}))
const expected=xpPlayers.map(p=>rebuildProgression(games,p.id,approvedXpRules))
const json=(v:unknown)=>`'${JSON.stringify(v).replaceAll("'","''")}'::jsonb`
console.log(`begin;
set local lock_timeout='3s';
set local statement_timeout='30s';
do $xp$
declare
  operator_id uuid;
  documents jsonb := ${json(docs)};
  fixture_players jsonb := ${json(xpPlayers)};
  expected jsonb := ${json(expected)};
  before_state jsonb;
  doc jsonb;
  item jsonb;
  changed jsonb;
  rejected boolean;
  before_xp bigint;
  curve bigint[];
  n integer;
  delta integer;
begin
  select id into operator_id from auth.users where email_confirmed_at is not null order by created_at limit 1;
  if operator_id is null then raise exception 'Existing confirmed operator required'; end if;
  select jsonb_build_object('matches',(select jsonb_agg(to_jsonb(m) order by id) from public.matches m),
    'players',(select jsonb_agg(to_jsonb(p) order by id) from public.players p),
    'participants',(select jsonb_agg(to_jsonb(p) order by id) from public.match_participants p),
    'events',(select jsonb_agg(to_jsonb(e) order by id) from public.match_events e)) into before_state;
  -- Do not create or alter any operator. All fixture rows rollback.
  for item in select value from jsonb_array_elements(fixture_players) loop
    insert into public.players(id,owner_id,name) values((item->>'id')::uuid,operator_id,item->>'name');
  end loop;
  if exists(select 1 from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid and xp<>0) then
    raise exception 'FAIL initial state'; end if;
  select thresholds into curve from public.xp_rules_v1;
  update public.xp_rules_v1 set enabled=true;
  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  set local role authenticated;
  for doc in select value from jsonb_array_elements(documents) loop
    doc := doc || jsonb_build_object('owner_id',operator_id);
    perform public.save_match_v1(doc);
    set constraints all immediate;
    set constraints all deferred;
    select xp into before_xp from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid;
    perform public.save_match_v1(doc);
    if (select xp from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid)<>before_xp then
      raise exception 'FAIL duplicate reward'; end if;
    rejected := false;
    begin perform public.save_match_v1(jsonb_set(doc,'{match,test_mode}','true')); exception when others then rejected:=true; end;
    if not rejected then raise exception 'FAIL conflicting retry'; end if;
    rejected := false;
    begin perform public.save_match_v1(jsonb_set(jsonb_set(doc,'{match,id}',to_jsonb(gen_random_uuid())),'{match,test_mode}','true'));
    exception when others then rejected:=true; end;
    if not rejected then raise exception 'FAIL test mode'; end if;
  end loop;
  for item in select value from jsonb_array_elements(expected) loop
    if not exists(select 1 from public.player_progression_v1 where id=(item->>'playerId')::uuid
      and xp=(item->>'xp')::bigint and level=(item->>'level')::integer
      and current_threshold=(item->>'currentThreshold')::bigint and next_threshold=(item->>'nextThreshold')::bigint
      and confirmed_matches=(item->>'confirmedMatches')::bigint) then raise exception 'FAIL SQL/TS parity'; end if;
  end loop;
  rejected:=false;
  begin update public.players set xp=999 where id=(fixture_players->0->>'id')::uuid; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL protected XP column'; end if;
  rejected:=false;
  begin update public.xp_rules_v1 set enabled=false; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL client configuration write'; end if;
  rejected:=false;
  begin update public.player_progression_v1 set xp=999; exception when others then rejected:=true; end;
  if not rejected then raise exception 'FAIL projection write'; end if;
  update public.players set name='Renamed inactive XP fixture',active=false where id=(fixture_players->0->>'id')::uuid;
  if (select xp from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid)<>835 then raise exception 'FAIL stable identity'; end if;
  perform set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
  if exists(select 1 from public.player_progression_v1) then raise exception 'FAIL other account RLS'; end if;
  reset role;
  set local role anon;
  rejected:=false;
  begin perform * from public.player_progression_v1; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL anonymous read'; end if;
  reset role;
  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  -- Future edits/deletions simulated by administrator on FIXTURES only.
  update public.matches set white_score=0,blue_score=1,winner_team='BLUE' where id=(documents->0->'match'->>'id')::uuid;
  if (select xp from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid)<>760 then raise exception 'FAIL edit recalculation'; end if;
  delete from public.matches where id=(documents->0->'match'->>'id')::uuid;
  if (select xp from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid)<>685 then raise exception 'FAIL delete recalculation'; end if;
  -- Configuration cutoff and disabled gate; no rewards remain cached.
  update public.xp_rules_v1 set eligible_from='2026-10-07T00:00:00Z';
  if (select xp from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid)<>110 then raise exception 'FAIL cutoff'; end if;
  update public.xp_rules_v1 set eligible_from=null,enabled=false;
  if exists(select 1 from public.player_progression_v1 where xp<>0 or level<>0) then raise exception 'FAIL disabled'; end if;
  update public.xp_rules_v1 set enabled=true,thresholds=array[0,100,200]::bigint[];
  if not exists(select 1 from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid and level=2 and next_threshold is null and xp=685) then raise exception 'FAIL max level'; end if;
  rejected:=false;
  begin update public.xp_rules_v1 set thresholds=array[0,100,100]::bigint[]; exception when check_violation then rejected:=true; end;
  if not rejected then raise exception 'FAIL invalid curve'; end if;
  -- All 100 exact boundaries through the actual SQL view; one eligible draw.
  update public.xp_rules_v1 set thresholds=curve,eligible_from='2026-10-07T00:00:00Z',
    win=0,draw=0,loss=0,ranked_win=0,extra_time_win=0,penalties_win=0;
  for n in 2..101 loop
    for delta in -1..1 loop
      update public.xp_rules_v1 set complete=curve[n]+delta;
      if not exists(select 1 from public.player_progression_v1 where id=(fixture_players->0->>'id')::uuid
        and xp=curve[n]+delta and level=case when delta=-1 then n-2 else n-1 end) then
        raise exception 'FAIL SQL boundary % delta %',n,delta;
      end if;
    end loop;
  end loop;
  -- Restore/drop only this transaction's fixture rows, then compare every business row.
  delete from public.matches where id in(select (value->'match'->>'id')::uuid from jsonb_array_elements(documents));
  delete from public.players where id in(select (value->>'id')::uuid from jsonb_array_elements(fixture_players));
  select jsonb_build_object('matches',(select jsonb_agg(to_jsonb(m) order by id) from public.matches m),
    'players',(select jsonb_agg(to_jsonb(p) order by id) from public.players p),
    'participants',(select jsonb_agg(to_jsonb(p) order by id) from public.match_participants p),
    'events',(select jsonb_agg(to_jsonb(e) order by id) from public.match_events e)) into changed;
  if changed is distinct from before_state then raise exception 'FAIL existing business data changed'; end if;
end $xp$;
select 'PASS block 02: real save_match_v1, TS/SQL parity, 1v1/2v2, all rewards, retries, trial/conflicts, RLS, protected columns, recalculation, configuration, preserved business rows. ROLLBACK.' as result;
rollback;`)
