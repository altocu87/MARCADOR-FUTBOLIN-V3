import assert from 'node:assert/strict'
import { test } from 'node:test'
import { achievementCatalog } from '../src/achievements/catalog'
import { rebuildAchievements } from '../src/achievements/rebuild'
import type { MatchSummary } from '../src/services/persistence/models'
import { eloFixture, eloPlayers } from './eloFixtures'

const summary = (i: number, goals = 1): MatchSummary => {
  const doc = eloFixture(i, 2, 'WHITE', goals)
  return { ...doc.match, participants: doc.participants }
}
const replay = (matches: MatchSummary[], accountId = 'account-A', playerId = eloPlayers[0].id) =>
  rebuildAchievements({ accountId, playerId, source: 'confirmed', complete: true, matches })
const family = (matches: MatchSummary[], id: string) => replay(matches).families.find(row => row.id === id)!

test('nueve familias ascendentes con cinco estrellas; goles empieza en 1, 5, 50', () => {
  assert.equal(achievementCatalog.length, 9)
  assert.deepEqual(achievementCatalog.find(row => row.id === 'team_goals')!.thresholds, [1, 5, 50, 250, 1000])
  for (const row of achievementCatalog) {
    assert.equal(row.thresholds.length, 5)
    assert.ok(row.thresholds.every((n, i) => n > 0 && (!i || n > row.thresholds[i - 1])))
    assert.equal(family([], row.id).level, 0)
  }
})

test('cada frontera exacta sube un nivel; saltos conceden todas las estrellas anteriores una vez', () => {
  for (const goals of [1, 5, 50, 250, 1000]) {
    const expected = [1, 5, 50, 250, 1000].indexOf(goals) + 1
    const at = family([summary(0, goals)], 'team_goals')
    assert.equal(at.level, expected)
    if (goals > 1) assert.equal(family([summary(0, goals - 1)], 'team_goals').level, expected - 1)
    assert.equal(at.tiers.filter(tier => tier.evidence).length, expected)
    assert.ok(at.tiers.slice(0, expected).every(tier => tier.evidence!.matchId === summary(0).id))
    assert.equal(at.next?.level ?? null, expected === 5 ? null : expected + 1)
  }
})

test('reintento, recarga y cambio de alias no crean otra identidad; cuenta y jugador aíslan badges', () => {
  const matches = [summary(0), summary(1, 5)]
  const first = replay(matches)
  assert.deepEqual(replay([...matches, ...structuredClone(matches)].reverse()), first)
  const identities = first.families.flatMap(row => row.tiers.map(tier => tier.identity))
  assert.equal(new Set(identities).size, 45)
  assert.notDeepEqual(replay(matches, 'account-B').families.map(row => row.identity), first.families.map(row => row.identity))
  assert.notDeepEqual(replay(matches, 'account-A', eloPlayers[1].id).families.map(row => row.identity), first.families.map(row => row.identity))
  assert.ok(identities.every(id => !id.includes('tiers-v2')))
  assert.equal(first.grantedExtraXp, 0)
})

test('sin historial y prueba no dan estrellas; procedencia pendiente o lectura incompleta se rechaza', () => {
  assert.equal(replay([]).stars, 0)
  assert.equal(replay([{ ...summary(0), test_mode: true }]).stars, 0)
  for (const source of ['pending', 'practice'] as const) assert.throws(() => rebuildAchievements({ accountId: 'A', playerId: eloPlayers[0].id, source, complete: true, matches: [summary(0)] }), /confirmado completo/)
  assert.throws(() => rebuildAchievements({ accountId: 'A', playerId: eloPlayers[0].id, source: 'confirmed', complete: false, matches: [summary(0)] }), /confirmado completo/)
})

test('edición/eliminación retira estrellas sin hechos vigentes y recuperarlas conserva identidad', () => {
  const matches = [summary(0, 2), summary(1, 3)]
  const original = family(matches, 'team_goals')
  assert.equal(original.level, 2)
  assert.equal(original.tiers[1].evidence!.matchId, matches[1].id)
  assert.equal(family(matches.slice(0, 1), 'team_goals').level, 1)
  assert.equal(family([{ ...matches[1], white_score: 1 }], 'team_goals').level, 1)
  assert.deepEqual(family([...matches, matches[1]], 'team_goals'), original)
})

test('conflictos en banderas o resultado fallan; hechos ausentes no se inventan', () => {
  const match = summary(0)
  assert.throws(() => replay([match, { ...match, went_to_extra_time: true }]), /distintos/)
  assert.throws(() => replay([{ ...match, went_to_extra_time: undefined } as unknown as MatchSummary]), /incompatibles/)
  assert.equal(family([match], 'extra_win').value, 0)
  assert.equal(family([match], 'penalty_win').value, 0)
  assert.ok(replay([match]).families.every(row => !/tournament|individual|time|comeback/.test(row.id)))
})
