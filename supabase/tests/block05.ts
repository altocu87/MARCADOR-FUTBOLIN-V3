/** Read-only SQL proof for active badge tiers and proposed records. JSON fixtures live only in CTEs/variables;
 * no INSERT/UPDATE/DDL, account creation or reward activation.
 * node --import tsx supabase/tests/block05.ts > /tmp/futbolin-block05.sql
 * Execute whole output via the connector against the authorized project.
 */
import { readFileSync } from 'node:fs'
import { draftCatalog, reviewHonours, type HistoryInput } from '../../tests/block05Prototype'
import { eloFixture, eloFixtures, eloPlayers, testEloRules } from '../../tests/eloFixtures'
import { xpFixtures, xpPlayers } from '../../tests/xpFixtures'
import type { MatchSummary, Player } from '../../src/services/persistence/models'

const rules = { ...testEloRules, version: 2, marginMultipliers: [1, 1, 1, 1, 1, 1] }
const summary = (d: ReturnType<typeof eloFixture>): MatchSummary => ({ ...d.match, participants: d.participants })
const makeCase = (name: string, matches: MatchSummary[], players = eloPlayers, extra: HistoryInput[] = []) => {
  const inputs: HistoryInput[] = [{ source: 'confirmed', complete: true, matches }, ...extra]
  const rows = reviewHonours(players, inputs, rules).rows
  return { name, players: players.map(p => ({ id: p.id })), inputs, expected: rows.map(r => ({
    id: r.player.id, metrics: r.metrics, proposedExtraXp: r.proposedExtraXp, grantedExtraXp: 0,
    achievements: r.achievements.map(a => ({ id: a.id, progress: a.progress, matchId: a.evidence?.matchId ?? null })).sort((a, b) => a.id.localeCompare(b.id)),
    records: Object.fromEntries(r.records.filter(a => !['current_elo', 'max_elo'].includes(a.id)).map(a => [a.id, a.value])),
  })).sort((a, b) => a.id.localeCompare(b.id)) }
}
const base = eloFixtures().map(summary)
const edited = structuredClone(base); edited[0].winner_team = 'BLUE'; edited[0].white_score = 0; edited[0].blue_score = 1
const casual = summary(eloFixture(40, 4, 'WHITE', 5)); casual.match_type = 'CHAOS'; casual.participants = casual.participants.filter(p => p.team === 'BLUE' || p.position === 1)
const microA = summary(eloFixture(41)), microB = summary(eloFixture(42))
microA.finished_at = '2026-10-02T00:00:00.000002Z'; microB.finished_at = '2026-10-02T00:00:00.000001Z'
const cases = [makeCase('base', base), makeCase('retry', [...base, ...base]), makeCase('edited', edited),
  makeCase('deleted', base.slice(1)), makeCase('empty', []), makeCase('casual_1v2', [casual]),
  makeCase('microseconds', [microA, microB]), makeCase('long_history', Array.from({ length: 25 }, (_, i) => summary(eloFixture(i, 2, 'WHITE', 4)))),
  makeCase('pending_practice_excluded', [], eloPlayers, [{ source: 'pending', complete: true, matches: base }, { source: 'practice', complete: true, matches: base }]),
  makeCase('extra_and_penalties', xpFixtures().map(summary), xpPlayers as Player[]),
  ...[1, 4, 5, 49, 50, 249, 250, 999, 1000].map(goals => makeCase(`team_goals_${goals}`, [summary(eloFixture(50, 2, 'WHITE', goals))])),
]
const json = (value: unknown) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`
const security = readFileSync(new URL('./block05_readonly.sql', import.meta.url), 'utf8')
// Both checks belong to the same repeatable read/read-only transaction.
console.log(security.replace(/select 'PASS:[\s\S]*?rollback;\s*$/, '') + `
do $draft$
declare
  cases jsonb := ${json(cases)};
  catalog jsonb := ${json(draftCatalog)};
  scenario jsonb; actual jsonb;
begin
  for scenario in select value from jsonb_array_elements(cases) loop
    with players as (select value->>'id' id from jsonb_array_elements(scenario->'players')),
    confirmed as (
      select distinct m.value doc from jsonb_array_elements(scenario->'inputs') i
      cross join lateral jsonb_array_elements(i->'matches') m
      where i->>'source'='confirmed' and (i->>'complete')::boolean
        and m.value->>'status'='MATCH_END' and (m.value->>'test_mode')::boolean=false
    ), perspectives as (
      select doc->>'id' match_id, (doc->>'finished_at')::timestamptz finished_at,
        p->>'player_id' player_id, doc->>'match_type' mode,
        coalesce(doc->>'winner_team'=p->>'team',false) won,
        case when p->>'team'='WHITE' then (doc->>'white_score')::int else (doc->>'blue_score')::int end gf,
        case when p->>'team'='WHITE' then (doc->>'blue_score')::int else (doc->>'white_score')::int end ga,
        (doc->>'went_to_extra_time')::boolean extra, (doc->>'went_to_penalties')::boolean penalties
      from confirmed cross join lateral jsonb_array_elements(doc->'participants') p
    ), grouped as (
      select *, sum((not won)::int) over(partition by player_id order by finished_at,match_id) streak_group from perspectives
    ), running as (
      select *, count(*) over w played, sum(won::int) over w wins,
        sum((mode='RANKED')::int) over w ranked_played, sum((mode='RANKED' and won)::int) over w ranked_wins,
        sum(gf) over w team_goals, sum((won and gf>0 and ga=0)::int) over w clean_win,
        sum((won and extra and not penalties)::int) over w extra_win, sum((won and penalties)::int) over w penalty_win,
        sum(won::int) over(partition by player_id,streak_group order by finished_at,match_id) consecutive
      from grouped window w as (partition by player_id order by finished_at,match_id)
    ), facts as (
      select *, jsonb_build_object('played',played,'wins',wins,'ranked_played',ranked_played,'ranked_wins',ranked_wins,
        'team_goals',team_goals,'clean_win',clean_win,'extra_win',extra_win,'penalty_win',penalty_win,
        'streak',max(consecutive) over(partition by player_id order by finished_at,match_id)) metrics from running
    ), first_evidence as (
      select distinct on(player_id,c->>'id') player_id,c->>'id' achievement_id,match_id
      from facts cross join jsonb_array_elements(catalog) c where (metrics->>(c->>'metric'))::bigint >= (c->>'threshold')::int
      order by player_id,c->>'id',finished_at,match_id
    ), totals as (
      select p.id, coalesce((select metrics from facts f where f.player_id=p.id order by finished_at desc,match_id desc limit 1),
        '{"played":0,"wins":0,"streak":0,"ranked_played":0,"ranked_wins":0,"team_goals":0,"clean_win":0,"extra_win":0,"penalty_win":0}'::jsonb) metrics
      from players p
    ), rows as (
      select t.id,t.metrics,
        coalesce((select sum((c->>'xp')::int) from jsonb_array_elements(catalog) c join first_evidence e on e.achievement_id=c->>'id' and e.player_id=t.id),0) proposed_xp,
        (select jsonb_agg(jsonb_build_object('id',c->>'id','progress',least((t.metrics->>(c->>'metric'))::bigint,(c->>'threshold')::int),'matchId',e.match_id) order by c->>'id')
          from jsonb_array_elements(catalog) c left join first_evidence e on e.achievement_id=c->>'id' and e.player_id=t.id) achievements,
        jsonb_build_object('most_played',nullif((t.metrics->>'played')::int,0),
          'most_wins',case when (t.metrics->>'played')::int>0 then (t.metrics->>'wins')::int end,
          'best_streak',case when (t.metrics->>'played')::int>0 then (t.metrics->>'streak')::int end,
          'biggest_margin',(select max(gf-ga) from perspectives f where f.player_id=t.id and won),
          'most_team_goals',(select max(gf) from perspectives f where f.player_id=t.id),
          'best_win_rate',case when (t.metrics->>'played')::int>=20 then (t.metrics->>'wins')::numeric/(t.metrics->>'played')::numeric*100 end) records
      from totals t
    ) select jsonb_agg(jsonb_build_object('id',id,'metrics',metrics,'proposedExtraXp',proposed_xp,'grantedExtraXp',0,'achievements',achievements,'records',records) order by id) into actual from rows;
    if actual is distinct from scenario->'expected' then raise exception 'FAIL badge tiers/records SQL/TS parity: %',scenario->>'name'; end if;
  end loop;
end $draft$;
select 'PASS: block05 read-only security and ${cases.length} badge tiers/records SQL/TS scenarios; no XP or schema writes' as result;
rollback;
`)
