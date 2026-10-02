import assert from 'node:assert/strict'
import { test } from 'node:test'
import { categoryIndex, rebuildCompetition, roundEloAdjustment, validateEloRules } from '../src/competition/elo'
import { eloFixture, eloFixtures, eloPlayers, testEloRules } from './eloFixtures'
import type { MatchDocument } from '../src/services/persistence/models'
const replay = (docs: MatchDocument[], rules = testEloRules) => rebuildCompetition(eloPlayers, docs.map(d => ({ ...d.match, participants: d.participants })), rules)

test('Initial 1200, private identities and disabled calculation', () => {
  assert.ok(replay([]).rows.every(p => p.elo === 1200 && p.maxElo === 1200 && p.category === 'ORO' && p.rank === null))
  assert.ok(replay(eloFixtures(), { ...testEloRules, enabled: false }).rows.every(p => !p.enabled && p.category === null && p.classifiedMatches === 0 && p.elo === 1200))
  assert.equal(replay([]).rows.filter(p => p.name === 'HOMÓNIMO ELO').length, 2)
  assert.throws(() => rebuildCompetition([eloPlayers[0], eloPlayers[0]], [], testEloRules))
})
test('Exact independent win/loss, goal margin and symmetric half rounding', () => {
  assert.deepEqual(replay([eloFixture(0)]).adjustments.map(a => a.delta), [20, -20])
  assert.deepEqual(replay([eloFixture(0, 2, 'WHITE', 3)]).adjustments.map(a => a.delta), [22, -22])
  assert.equal(roundEloAdjustment(10.5), 11); assert.equal(roundEloAdjustment(-10.5), -11)
  assert.equal(roundEloAdjustment(0.5), 1); assert.equal(roundEloAdjustment(-0.5), -1)
  assert.ok(replay([eloFixture(0, 2, 'BLUE')]).adjustments[0].delta < 0)
})
test('Experience counts before result: tenth K40, eleventh K20; 2v2 has individual K', () => {
  const docs = Array.from({ length: 10 }, (_, i) => eloFixture(i))
  const value = replay([...docs, eloFixture(10, 4)])
  assert.equal(value.adjustments.filter(a => a.playerId === eloPlayers[0].id)[9].k, 40)
  assert.deepEqual(value.adjustments.slice(-4).map(a => a.k), [20, 20, 40, 40])
  const [a,b,c,d] = value.adjustments.slice(-4)
  assert.equal(a.expectation, c.expectation); assert.equal(b.expectation, d.expectation)
  assert.equal(a.expectation, 1 - b.expectation)
  assert.equal(a.delta, roundEloAdjustment(20 * (1 - a.expectation)))
  assert.equal(c.delta, roundEloAdjustment(40 * (1 - c.expectation)))
})
test('2v2 uses both team averages before updates and keeps all teammates adjustments', () => {
  const value = replay([eloFixture(0, 4)])
  assert.deepEqual(value.adjustments.map(a => a.delta), [20,-20,20,-20])
  assert.equal(value.rows.filter(p => p.rank === 1).length, 2)
  assert.equal(value.rows.filter(p => p.rank === 3).length, 2)
})
test('Draw and shootout expectations; kicks never magnify goal difference', () => {
  const docs = eloFixtures()
  const penalty = replay([docs[13]])
  assert.deepEqual(penalty.adjustments.map(a => a.delta), [-20,20,-20,20])
  assert.ok(penalty.adjustments.every(a => a.multiplier === 1))
  assert.ok(replay([docs[14]]).adjustments.every(a => a.delta === 0 && a.k === 40))
  assert.equal(replay([eloFixture(0), docs[14]]).adjustments.at(-4)!.delta, -1)
})
test('Category thresholds, exact hysteresis boundaries and multi-category jumps', () => {
  const t = testEloRules.categoryThresholds
  for (let i = 1; i < 6; i++) {
    assert.equal(categoryIndex(t[i], i - 1, t, 25), i)
    assert.equal(categoryIndex(t[i] - 25, i, t, 25), i)
    assert.equal(categoryIndex(t[i] - 26, i, t, 25), i - 1)
  }
  assert.equal(categoryIndex(1800,0,t,25),5); assert.equal(categoryIndex(-20,5,t,25),0)
  assert.equal(categoryIndex(1199,2,t,0),1)
})
test('Retries/order do not duplicate; full replay handles late inserts, edits and deletions', () => {
  const docs = eloFixtures(), baseline = replay(docs)
  assert.deepEqual(replay([...docs].reverse()), baseline)
  assert.deepEqual(replay([...docs,...structuredClone(docs)]),baseline)
  const edited = structuredClone(docs); edited[0].match.white_score=0; edited[0].match.blue_score=1; edited[0].match.winner_team='BLUE'
  assert.notDeepEqual(replay(edited),baseline)
  assert.notDeepEqual(replay(docs.slice(1)),baseline)
  const peak = replay([eloFixture(0)]).rows.find(p => p.playerId === eloPlayers[0].id)!
  assert.equal(peak.maxElo,1220); assert.equal(replay([]).rows[0].maxElo,1200)
  assert.throws(() => replay([...docs,edited[0]]), /distintos/)
})
test('Microseconds, timezone offsets and UUID provide deterministic chronological replay', () => {
  const a=eloFixture(0),b=eloFixture(1,2,'BLUE')
  a.match.finished_at='2026-09-01T01:00:00.000002+01:00'; b.match.finished_at='2026-09-01T00:00:00.000001Z'
  a.match.started_at=b.match.started_at='2026-08-31T23:00:00Z'
  assert.equal(replay([a,b]).adjustments[0].matchId,b.match.id)
  a.match.finished_at=b.match.finished_at
  assert.equal(replay([b,a]).adjustments[0].matchId,a.match.id)
})
test('Quick, Chaos, trial, unfinished and excluded history do not confirm ELO', () => {
  const docs=eloFixtures(),trial=eloFixture(20),pending=eloFixture(21)
  trial.match.test_mode=true
  Object.assign(pending.match,{status:'PLAYING'})
  assert.equal(replay([docs[15],docs[16],trial,pending]).adjustments.length,0)
  assert.equal(replay(docs,{...testEloRules,eligibleFrom:'2026-10-01T00:00:00Z'}).adjustments.length,0)
})
test('Reject incomplete teams, unknown identity, conflicting results and invalid parameters', () => {
  const doc=eloFixture(0); doc.participants[1].player_id=eloPlayers[0].id
  assert.throws(()=>replay([doc])); doc.participants[1].player_id='unknown';assert.throws(()=>replay([doc]))
  for(const rule of [{provisionalK:0},{rounding:'floor'},{categoryThresholds:[0,1000,1000,1400,1600,1800]},{marginMultipliers:[1,NaN,1,1,1,1]}]) {
    assert.throws(()=>validateEloRules({...testEloRules,...rule} as typeof testEloRules))
  }
})
