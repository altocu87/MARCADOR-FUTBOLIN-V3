/** Generate a rollback-only real RPC check from the actual engine and mapper.
 * node --import tsx supabase/tests/block01.ts > /tmp/futbolin-block01.sql
 * Run the entire output as administrator; it never commits or creates accounts.
 */
import assert from 'node:assert/strict'
import { MatchEngine } from '../../src/match-engine/MatchEngine'
import { mapMatch } from '../../src/services/persistence/mapMatch'
import type { Player, MatchDocument } from '../../src/services/persistence/models'
import { playerStatistics } from '../../src/statistics/playerStatistics'

const players: Player[] = [1, 2, 3, 4].map(n => ({ id: `00000000-0000-4000-8000-00000000000${n}`,
  name: `Fixture bloque 01 ${n}`, nickname: null, photoUrl: null, active: true, level: 0 }))
const documents: MatchDocument[] = []
for (const condition of ['GOALS', 'TIME', 'BOTH', 'PENALTIES'] as const) {
  let clock = Date.parse('2026-10-01T00:00:00Z')
  const engine = new MatchEngine(() => clock, () => 'flash')
  engine.createMatch({ mode: 'QUICK', victoryCondition: condition === 'PENALTIES' ? 'TIME' : condition,
    goalLimit: condition === 'BOTH' ? 5 : 3, halfDurationMinutes: 1 })
  engine.skipCountdown()
  const goal = (team: 'WHITE' | 'BLUE') => { clock += 3_000; engine.dispatch(team === 'WHITE' ? 'GOL_BLANCO' : 'GOL_AZUL') }
  const expire = () => { clock += 60_000; engine.tick() }
  const next = () => { engine.continueToNextPeriod(); engine.skipCountdown() }
  if (condition === 'GOALS') { goal('WHITE'); goal('BLUE'); goal('WHITE'); goal('WHITE') }
  if (condition === 'TIME') { goal('WHITE'); expire(); next(); goal('BLUE'); goal('BLUE'); expire(); next() }
  if (condition === 'BOTH') {
    goal('WHITE'); goal('BLUE'); goal('WHITE'); goal('BLUE'); goal('WHITE')
    assert.equal(engine.getState().status, 'PLAYING')
    expire(); next(); goal('WHITE'); goal('WHITE')
  }
  if (condition === 'PENALTIES') {
    expire(); next(); expire(); next(); expire(); next()
    for (let i = 0; i < 3; i++) { engine.dispatch('PENALTI_BLANCO_FALLO'); engine.dispatch('PENALTI_AZUL_GOL') }
  }
  assert.equal(engine.getState().status, 'MATCH_END')
  const doc = mapMatch(engine.getState(), condition === 'BOTH' ? players : players.slice(0, 2),
    `00000000-0000-4000-8000-${String(documents.length + 100).padStart(12, '0')}`, false)
  documents.push(doc)
}
assert.deepEqual(documents.map(d => [d.match.white_score, d.match.blue_score, d.match.winner_team]),
  [[3, 1, 'WHITE'], [1, 2, 'BLUE'], [5, 2, 'WHITE'], [0, 0, 'BLUE']])
const profiles = players.map(p => ({ id: p.id, ...playerStatistics(documents.map(d => ({ ...d.match, participants: d.participants })), p.id) }))
const sqlJson = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`
console.log(`-- Whole script only. Existing operator selected internally; no credentials/accounts.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '30s';
do $block01$
declare
  operator_id uuid;
  doc jsonb;
  bad jsonb;
  expected jsonb;
  affected integer;
  rejected boolean;
  documents jsonb := ${sqlJson(documents)};
begin
  select id into operator_id from auth.users where email_confirmed_at is not null order by created_at limit 1;
  if operator_id is null then raise exception 'An existing confirmed operator is required'; end if;
  for expected in select value from jsonb_array_elements(${sqlJson(players)}) loop
    insert into public.players(id, owner_id, name) values ((expected->>'id')::uuid, operator_id, expected->>'name');
  end loop;
  perform set_config('request.jwt.claim.sub', operator_id::text, true);
  set local role authenticated;
  for doc in select value from jsonb_array_elements(documents) loop
    doc := jsonb_set(doc, '{match,id}', to_jsonb(gen_random_uuid()));
    doc := doc || jsonb_build_object('owner_id', operator_id);
    perform public.save_match_v1(doc);
    perform public.save_match_v1(doc);
    set constraints all immediate;
    set constraints all deferred;
    if (select count(*) from public.matches where id = (doc->'match'->>'id')::uuid
      and to_jsonb(matches) @> ((doc->'match') - array['started_at','finished_at'])
      and started_at=(doc->'match'->>'started_at')::timestamptz and finished_at=(doc->'match'->>'finished_at')::timestamptz) <> 1
      or (select count(*) from public.match_participants where match_id = (doc->'match'->>'id')::uuid) <> jsonb_array_length(doc->'participants')
      or (select jsonb_agg(to_jsonb(e) - array['id','owner_id','match_id','created_at','occurred_at'] order by sequence) from public.match_events e where match_id = (doc->'match'->>'id')::uuid)
        <> (select jsonb_agg(e - 'occurred_at' order by (e->>'sequence')::integer) from jsonb_array_elements(doc->'events') e)
      or exists(select 1 from jsonb_array_elements(doc->'events') e where not exists (
        select 1 from public.match_events me where match_id=(doc->'match'->>'id')::uuid and sequence=(e->>'sequence')::integer and occurred_at=(e->>'occurred_at')::timestamptz))
      or exists (select 1 from jsonb_array_elements(doc->'participants') p where not exists (
        select 1 from public.match_participants mp where match_id = (doc->'match'->>'id')::uuid and to_jsonb(mp) @> p)) then
      raise exception 'FAIL aggregate or idempotency';
    end if;
    bad := jsonb_set(doc, '{events,0,metadata,rulesVersion}', '99');
    rejected := false;
    begin perform public.save_match_v1(bad); exception when others then rejected := true; end;
    if not rejected then raise exception 'FAIL conflicting payload'; end if;
    bad := jsonb_set(doc, '{match,id}', to_jsonb(gen_random_uuid()));
    bad := jsonb_set(bad, '{match,test_mode}', 'true');
    rejected := false;
    begin perform public.save_match_v1(bad); exception when others then rejected := true; end;
    if not rejected or exists(select 1 from public.matches where id = (bad->'match'->>'id')::uuid) then
      raise exception 'FAIL test mode rollback';
    end if;
  end loop;
  for expected in select value from jsonb_array_elements(${sqlJson(profiles)}) loop
    if not exists (select 1 from (
      select count(*) as played, count(*) filter (where winner_team = p.team) as wins,
        count(*) filter (where winner_team is not null and winner_team <> p.team) as losses,
        sum(case when p.team='WHITE' then white_score else blue_score end) as gf,
        sum(case when p.team='WHITE' then blue_score else white_score end) as ga
      from public.matches m join public.match_participants p on p.match_id=m.id
      where p.player_id=(expected->>'id')::uuid and not m.test_mode and m.status='MATCH_END'
    ) s where played=(expected->>'played')::integer and wins=(expected->>'wins')::integer
      and losses=(expected->>'losses')::integer and gf=(expected->>'goalsFor')::integer and ga=(expected->>'goalsAgainst')::integer) then
      raise exception 'FAIL real profile vs application calculation';
    end if;
  end loop;
  update public.players set name='Renamed fixture', active=false where id='${players[0].id}';
  if exists(select 1 from public.match_participants where player_id='${players[0].id}' and player_name <> '${players[0].name}') then
    raise exception 'FAIL historical snapshot';
  end if;
  delete from public.players where id='${players[0].id}';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL history protection'; end if;
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  if exists(select 1 from public.match_participants where player_id='${players[0].id}') then raise exception 'FAIL account isolation'; end if;
  reset role;
end $block01$;
select 'PASS block 01: GOALS/TIME/AMBAS/penalties, aggregates, profiles, test mode, idempotency, RLS, snapshots. ROLLBACK.' as result;
rollback;`)
