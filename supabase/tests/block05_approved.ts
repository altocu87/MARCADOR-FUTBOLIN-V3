/** Verify the exact migration SELECT bodies against in-memory JSON fixtures.
 * Only fixture table bindings change. READ ONLY + ROLLBACK, no business writes,
 * Auth users or DDL. Also inspect the installed objects under authenticated RLS.
 * node --import tsx supabase/tests/block05_approved.ts > /tmp/block05-approved-proof.sql
 */
import { readFileSync } from 'node:fs'
import { honoursAccount, honoursRaw } from '../../tests/honoursFixtures'
import { eloFixture, eloFixtures, eloPlayers, testEloRules } from '../../tests/eloFixtures'
import { xpFixtures, xpPlayers } from '../../tests/xpFixtures'
import { rebuildCompetition } from '../../src/competition/elo'
import type { MatchSummary, Player } from '../../src/services/persistence/models'
const sql = readFileSync(new URL('../migrations/20261002161602_approved_block05_honours_xp_v2.sql',import.meta.url),'utf8')
const bind = (s:string) => s.replaceAll('public.players','fixture_players').replaceAll('public.match_participants','fixture_participants').replaceAll('public.matches','fixture_matches')
  .replaceAll('public.player_honour_results_v1','fixture_results').replaceAll('public.player_achievement_tiers_v1','fixture_tiers').replaceAll('public.player_progression_v1','fixture_progression')
const view = (name:string) => bind(sql.match(new RegExp(`(?:create|create or replace) view public\\.${name} with \\(security_invoker=true\\) as\\n([\\s\\S]*?);`))![1])
const snapshotQuery = bind(sql.slice(sql.indexOf('  with competitive as'),sql.indexOf('  return result;')).replace('select * from public.get_ranking_v1()','select * from fixture_competitive').replace(' into result','').trim().replace(/;$/,''))
const summary=(d:ReturnType<typeof eloFixture>):MatchSummary=>({...d.match,participants:d.participants})
const base=eloFixtures().map(summary)
const casual=summary(eloFixture(40,4,'WHITE',5));casual.match_type='CHAOS';casual.participants=casual.participants.filter(p=>p.team==='BLUE'||p.position===1)
const corrected=structuredClone(base);corrected[0].white_score=0;corrected[0].blue_score=2;corrected[0].winner_team='BLUE'
const microA=summary(eloFixture(41)),microB=summary(eloFixture(42));microA.finished_at='2026-10-02T00:00:00.000002Z';microB.finished_at='2026-10-02T00:00:00.000001Z'
const cases:{name:string;matches:MatchSummary[];players:Player[]}[]=[
  {name:'base',matches:base,players:eloPlayers},{name:'retry',matches:[...base,...base],players:eloPlayers},
  {name:'corrected',matches:corrected,players:eloPlayers},{name:'deleted',matches:base.slice(1),players:eloPlayers},
  {name:'empty',matches:[],players:eloPlayers},{name:'casual_1v2',matches:[casual],players:eloPlayers},
  {name:'microseconds',matches:[microA,microB],players:eloPlayers},
  {name:'historical_250',matches:Array.from({length:250},(_,i)=>summary(eloFixture(i,2,'WHITE',4))),players:eloPlayers},
  {name:'practice_excluded',matches:base.map(m=>({...m,test_mode:true})),players:eloPlayers},
  {name:'extra_penalties_draw',matches:xpFixtures().map(summary),players:xpPlayers as Player[]},
  ...[1,4,5,49,50,249,250,999,1000].map(goals=>({name:`goal_boundary_${goals}`,matches:[summary(eloFixture(50,2,'WHITE',goals))],players:eloPlayers})),
]
const scenarios=cases.map(c=>{
  const expected=honoursRaw(c.players,c.matches)
  const competition=rebuildCompetition(c.players,c.matches,{...testEloRules,version:2,marginMultipliers:[1,1,1,1,1,1]}).rows.map(p=>({player_id:p.playerId,elo:p.elo,max_elo:p.maxElo,classified_matches:p.classifiedMatches,enabled:p.enabled}))
  // Only relational columns consumed by the production projections.
  const matches=c.matches.map(m=>({id:m.id,owner_id:honoursAccount,match_type:m.match_type,status:m.status,test_mode:m.test_mode,finished_at:m.finished_at,started_at:m.started_at,white_score:m.white_score,blue_score:m.blue_score,winner_team:m.winner_team,went_to_extra_time:m.went_to_extra_time,went_to_penalties:m.went_to_penalties,participants:m.participants.map(p=>({player_id:p.player_id,team:p.team}))}))
  return {name:c.name,players:c.players.map(p=>({id:p.id,owner_id:honoursAccount,name:p.name,nickname:p.nickname,photo_url:p.photoUrl,active:p.active})),matches,competition,expected}
})
const literal=(v:unknown)=>`'${JSON.stringify(v).replaceAll("'","''")}'::jsonb`
const installed=readFileSync(new URL('./block05_readonly.sql',import.meta.url),'utf8').replace(/select 'PASS:[\s\S]*?rollback;\s*$/,'')
console.log(installed+`
reset role;
do $installed05$
declare operator_id uuid; snapshot jsonb; again jsonb;
begin
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
    and c.relname in ('player_honour_results_v1','player_achievement_tiers_v1','player_progression_v1')
    and not ('security_invoker=true'=any(c.reloptions))) then raise exception 'Honours view bypasses RLS'; end if;
  if exists(select 1 from pg_proc p where p.oid='public.get_honours_snapshot_v1()'::regprocedure
    and (p.prosecdef or p.provolatile<>'s' or not ('search_path=""'=any(p.proconfig)))) then raise exception 'RPC contract insecure'; end if;
  if has_function_privilege('anon','public.get_honours_snapshot_v1()','EXECUTE')
    or has_table_privilege('anon','public.player_achievement_tiers_v1','SELECT')
    or has_table_privilege('authenticated','public.player_achievement_tiers_v1','UPDATE') then raise exception 'Honours permissions insecure'; end if;
  select owner_id into operator_id from public.players limit 1;
  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  set local role authenticated;
  snapshot:=public.get_honours_snapshot_v1(); again:=public.get_honours_snapshot_v1();
  if snapshot<>again or snapshot->>'accountId'<>operator_id::text or not (snapshot->>'complete')::boolean then raise exception 'Unstable/private snapshot'; end if;
  if exists(select 1 from public.player_progression_v1 where xp<>base_xp+achievement_xp) then raise exception 'XP breakdown mismatch'; end if;
  perform set_config('request.jwt.claim.sub','ee050000-0000-4000-8000-000000000099',true);
  if public.get_honours_snapshot_v1()->'rows'<>'[]'::jsonb or exists(select 1 from public.player_achievement_tiers_v1) then raise exception 'Other owner sees honours'; end if;
  reset role;
end $installed05$;

do $fixtures05$
declare scenarios jsonb := ${literal(scenarios)}; scenario jsonb; actual jsonb; r jsonb; expected_row jsonb; a jsonb; e jsonb; actual_badges jsonb; expected_badges jsonb;
begin
  perform set_config('request.jwt.claim.sub','${honoursAccount}',true);
  for scenario in select value from jsonb_array_elements(scenarios) loop
    with fixture_players as (select * from jsonb_to_recordset(scenario->'players') as p(id uuid,owner_id uuid,name text,nickname text,photo_url text,active boolean)),
    docs as (select distinct value doc from jsonb_array_elements(scenario->'matches')),
    fixture_matches as (select m.* from docs cross join lateral jsonb_to_record(doc) as m(id uuid,owner_id uuid,match_type text,status text,test_mode boolean,finished_at timestamptz,started_at timestamptz,white_score integer,blue_score integer,winner_team text,went_to_extra_time boolean,went_to_penalties boolean)),
    fixture_participants as (select (doc->>'id')::uuid match_id,(doc->>'owner_id')::uuid owner_id,p.* from docs cross join lateral jsonb_to_recordset(doc->'participants') as p(player_id uuid,team text)),
    fixture_competitive as (select * from jsonb_to_recordset(scenario->'competition') as e(player_id uuid,elo integer,max_elo integer,classified_matches integer,enabled boolean)),
    fixture_results as (${view('player_honour_results_v1')}),
    fixture_tiers as (${view('player_achievement_tiers_v1')}),
    fixture_progression as (${view('player_progression_v1')}),
    snapshot as (${snapshotQuery}) select * into actual from snapshot;
    if jsonb_array_length(actual->'rows')<>jsonb_array_length(scenario->'expected'->'rows') then raise exception 'Rows mismatch %',scenario->>'name'; end if;
    for r in select value from jsonb_array_elements(actual->'rows') loop
      select value into expected_row from jsonb_array_elements(scenario->'expected'->'rows') where value->>'id'=r->>'id';
      if r->'records' is distinct from expected_row->'records' or r->'evidence' is distinct from expected_row->'evidence'
        or ((r->'progression') - array['name','nickname','photo_url','active']) is distinct from expected_row->'progression' then raise exception 'Records/XP mismatch %, %',scenario->>'name',r->>'id'; end if;
      select jsonb_agg(value-'finishedAt' order by value->>'family',(value->>'tier')::int) into actual_badges from jsonb_array_elements(r->'badges');
      select jsonb_agg(value-'finishedAt' order by value->>'family',(value->>'tier')::int) into expected_badges from jsonb_array_elements(expected_row->'badges');
      if actual_badges is distinct from expected_badges then raise exception 'Tier mismatch %, %',scenario->>'name',r->>'id'; end if;
      for a in select value from jsonb_array_elements(r->'badges') loop
        select value into e from jsonb_array_elements(expected_row->'badges') where value->>'family'=a->>'family' and value->'tier'=a->'tier';
        if (a->>'finishedAt')::timestamptz is distinct from (e->>'finishedAt')::timestamptz then raise exception 'Evidence time mismatch %',scenario->>'name'; end if;
      end loop;
    end loop;
  end loop;
end $fixtures05$;
select 'PASS: installed invoker/RLS/XP/retry and ${scenarios.length} exact migration SELECT parity scenarios, READ ONLY, no accounts/match writes' result;
rollback;
`)
