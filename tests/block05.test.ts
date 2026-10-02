import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MatchSummary } from '../src/services/persistence/models'
import { draftCatalog, reviewHonours } from './block05Prototype'
import { eloFixture, eloFixtures, eloPlayers, testEloRules } from './eloFixtures'
import { xpFixtures, xpPlayers } from './xpFixtures'

const rules = { ...testEloRules, version: 2, marginMultipliers: [1, 1, 1, 1, 1, 1] }
const summarize = (d: ReturnType<typeof eloFixture>): MatchSummary => ({ ...d.match, participants: d.participants })
const replay = (matches: MatchSummary[]) => reviewHonours(eloPlayers, [{ source: 'confirmed', complete: true, matches }], rules)
const achievement = (rows: ReturnType<typeof replay>['rows'], id: string, player = 0) => rows[player].achievements.find(a => a.id === id)!
const record = (rows: ReturnType<typeof replay>['rows'], id: string, player = 0) => rows[player].records.find(r => r.id === id)!

test('catálogo con 45 tiers únicos; ningún premio real, incluso si cumple todos los umbrales', () => {
  assert.equal(draftCatalog.length, 45)
  assert.equal(new Set(draftCatalog.map(a => a.id)).size, 45)
  const history = Array.from({ length: 250 }, (_, i) => summarize(eloFixture(i, 2, 'WHITE', 4)))
  const result = replay(history)
  assert.equal(result.approved, false)
  assert.equal(result.rows[0].grantedExtraXp, 0)
  assert.ok(achievement(result.rows, 'team_goals:tier_5').evidence)
  assert.ok(achievement(result.rows, 'wins:tier_5').evidence)
  assert.equal(result.rows[1].metrics.team_goals, 0)
})

test('umbrales exactos, primera evidencia y retry/recarga no duplican XP propuesto', () => {
  const matches = Array.from({ length: 5 }, (_, i) => summarize(eloFixture(i)))
  const before = replay(matches.slice(0, 4))
  assert.equal(achievement(before.rows, 'played:tier_2').evidence, null)
  const result = replay(matches.reverse())
  assert.equal(achievement(result.rows, 'played:tier_2').evidence?.matchId, matches[0].id)
  assert.deepEqual(replay([...matches, ...structuredClone(matches)]), result)
  assert.deepEqual(replay(matches), result)
  assert.equal(new Set(result.rows[0].achievements.map(a => a.identity)).size, 45)
})

test('pendiente final válido, práctica y datos no completos quedan fuera por procedencia', () => {
  const match = summarize(eloFixture(0))
  const result = reviewHonours(eloPlayers, [
    { source: 'pending', complete: true, matches: [match] },
    { source: 'practice', complete: false, matches: [match] },
  ], rules)
  assert.equal(result.rows[0].proposedExtraXp, 0)
  assert.ok(result.hall.every(r => r.leaders.length === 0))
  assert.throws(() => reviewHonours(eloPlayers, [{ source: 'confirmed', complete: false, matches: [match] }], rules), /incompleto/)
  const practice = { ...match, test_mode: true }
  const active = { ...match, status: 'PLAYING' } as unknown as MatchSummary
  assert.equal(replay([practice, active]).rows[0].metrics.played, 0)
})

test('prórroga y tanda distintas; un 0–0 por tanda no es victoria a cero ni goles individuales', () => {
  const docs = xpFixtures()
  const result = reviewHonours(xpPlayers, [{ source: 'confirmed', complete: true, matches: docs.map(summarize) }], rules)
  assert.ok(achievement(result.rows, 'extra_win:tier_1', 1).evidence)
  assert.ok(achievement(result.rows, 'penalty_win:tier_1', 1).evidence)
  const penalty = docs.find(d => d.match.went_to_penalties)!
  const only = reviewHonours(xpPlayers, [{ source: 'confirmed', complete: true, matches: [summarize(penalty)] }], rules)
  const winning = penalty.participants.find(p => p.team === penalty.match.winner_team)!
  const row = only.rows.find(row => row.player.id === winning.player_id)!
  assert.equal(row.achievements.find(a => a.id === 'clean_win:tier_1')!.evidence, null)
  assert.equal(row.achievements.find(a => a.id === 'extra_win:tier_1')!.evidence, null)
  assert.equal(row.metrics.team_goals, 0)
  assert.equal(row.records.find(r => r.id === 'biggest_margin')!.value, 0)
})

test('empate corta racha y penaltis cuentan como victoria', () => {
  const matches = [0, 1, 2].map(i => summarize(eloFixture(i)))
  const draw = structuredClone(matches[1]); draw.white_score = draw.blue_score = 1; draw.winner_team = null
  assert.equal(replay([matches[0], draw, matches[2]]).rows[0].metrics.streak, 1)
  const penalty = structuredClone(matches[1]); penalty.white_score = penalty.blue_score = 0
  penalty.went_to_extra_time = penalty.went_to_penalties = true; penalty.penalty_white_score = 3; penalty.penalty_blue_score = 0
  assert.ok(achievement(replay([matches[0], penalty, matches[2]]).rows, 'streak:tier_2').evidence)
})

test('2v2 y 1v2 casual comparten goles de equipo y premios completos; 1v2 ranked se rechaza', () => {
  const match = summarize(eloFixture(0, 4, 'WHITE', 5))
  const duo = replay([match])
  assert.equal(duo.rows[0].metrics.team_goals, 5)
  assert.equal(duo.rows[2].metrics.team_goals, 5)
  assert.equal(duo.rows[0].proposedExtraXp, duo.rows[2].proposedExtraXp)
  for (const soloTeam of ['WHITE', 'BLUE']) {
    const casual = { ...match, match_type: 'CHAOS' as const, participants: match.participants.filter(p => p.team !== soloTeam || p.position === 1) }
    const result = replay([casual])
    for (const p of casual.participants) assert.equal(result.rows.find(r => r.player.id === p.player_id)!.metrics.played, 1)
    assert.ok(result.hall.find(r => r.id === 'current_elo')!.leaders.length === 0)
    assert.throws(() => replay([{ ...casual, match_type: 'RANKED' }]), /Equipos/)
  }
})

test('conflictos de resultado, tiempo, banderas y plazas abortan sin análisis parcial', () => {
  const match = summarize(eloFixture(0))
  for (const change of [{ white_score: 2 }, { went_to_extra_time: true }, { finished_at: '2026-11-01T00:00:00Z' }]) {
    assert.throws(() => replay([match, { ...match, ...change }]))
  }
  assert.throws(() => replay([{ ...match, winner_team: 'BLUE' }]))
  assert.throws(() => replay([{ ...match, participants: [match.participants[0], match.participants[0]] }]))
  assert.throws(() => replay([{ ...match, started_at: '2027-01-01T00:00:00Z' }]))
  assert.throws(() => reviewHonours([eloPlayers[0]], [{ source: 'confirmed', complete: true, matches: [match] }], rules))
})

test('renombrados, homónimos y bajas conservan identidad; Hall incluye todos los líderes empatados', () => {
  const match = summarize(eloFixture(0, 4, 'WHITE', 5))
  const players = eloPlayers.map((p, i) => ({ ...p, nickname: i === 0 ? '<script>alias</script>' : null, active: i !== 2 }))
  const original = replay([match])
  const result = reviewHonours(players, [{ source: 'confirmed', complete: true, matches: [match] }], rules)
  assert.deepEqual(result.rows.map(r => r.achievements), original.rows.map(r => r.achievements))
  assert.deepEqual(result.hall.find(r => r.id === 'biggest_margin')!.leaders.map(p => p.id), [players[0].id, players[2].id])
  assert.equal(result.hall.find(r => r.id === 'biggest_margin')!.leaders[1].active, false)
})

test('edición/eliminación de fixtures recalcula; volver a cumplir no crea otro premio', () => {
  const matches = [0, 1, 2].map(i => summarize(eloFixture(i)))
  const full = replay(matches)
  const deleted = replay(matches.slice(0, 2))
  assert.equal(achievement(deleted.rows, 'streak:tier_2').evidence, null)
  assert.equal(full.rows[0].proposedExtraXp - deleted.rows[0].proposedExtraXp, 0)
  const edited = structuredClone(matches); edited[1].white_score = 0; edited[1].blue_score = 1; edited[1].winner_team = 'BLUE'
  assert.equal(achievement(replay(edited).rows, 'streak:tier_2').evidence, null)
  assert.deepEqual(replay([...matches.slice(0, 2), matches[2], matches[2]]), full)
})

test('porcentaje requiere 20; igualdad exacta y ELO inicial sin partidos no crean líderes', () => {
  const nineteen = Array.from({ length: 19 }, (_, i) => summarize(eloFixture(i)))
  assert.equal(record(replay(nineteen).rows, 'best_win_rate').value, null)
  const history = Array.from({ length: 20 }, (_, i) => summarize(eloFixture(i, 4, i < 15 ? 'WHITE' : 'BLUE')))
  const result = replay(history)
  assert.equal(record(result.rows, 'best_win_rate').value, 75)
  assert.equal(result.hall.find(r => r.id === 'best_win_rate')!.leaders.length, 2)
  assert.equal(record(result.rows, 'current_elo', 4).value, null)
  const disabled = reviewHonours(eloPlayers, [{ source: 'confirmed', complete: true, matches: history }], { ...rules, enabled: false })
  assert.equal(disabled.hall.find(r => r.id === 'max_elo')!.leaders.length, 0)
})

test('orden de microsegundos/UUID decide la primera evidencia, sin inferir duración', () => {
  const a = summarize(eloFixture(0)), b = summarize(eloFixture(1))
  a.finished_at = '2026-10-02T00:00:00.000002Z'; b.finished_at = '2026-10-02T00:00:00.000001Z'
  assert.equal(achievement(replay([a, b]).rows, 'played:tier_1').evidence?.matchId, b.id)
  b.finished_at = a.finished_at
  assert.equal(achievement(replay([b, a]).rows, 'played:tier_1').evidence?.matchId, a.id)
  assert.ok(replay([a]).rows[0].records.every(r => !/time|fast|comeback/.test(r.id)))
})

test('Hall empata fracciones equivalentes con distinto número de partidos', () => {
  const first = Array.from({ length: 20 }, (_, i) => summarize(eloFixture(i, 2, i < 15 ? 'WHITE' : 'BLUE')))
  const second = Array.from({ length: 40 }, (_, i) => {
    const match = summarize(eloFixture(i + 20, 2, i < 30 ? 'WHITE' : 'BLUE'))
    match.participants = match.participants.map((p, n) => ({ ...p, player_id: eloPlayers[n + 2].id }))
    return match
  })
  const result = replay([...first, ...second])
  assert.deepEqual(result.hall.find(r => r.id === 'best_win_rate')!.leaders.map(p => p.id), [eloPlayers[0].id, eloPlayers[2].id])
})

test('todos los partidos que igualan el récord siguen como evidencia; mejorar no da XP por récord', () => {
  const matches = [0, 1].map(i => summarize(eloFixture(i, 2, 'WHITE', 5)))
  const before = replay(matches)
  assert.deepEqual(record(before.rows, 'biggest_margin').matchIds, matches.map(m => m.id))
  const after = replay([...matches, summarize(eloFixture(2, 2, 'WHITE', 6))])
  assert.equal(record(after.rows, 'biggest_margin').value, 6)
  assert.equal(after.rows[0].grantedExtraXp, 0)
  assert.equal(after.rows[0].proposedExtraXp - before.rows[0].proposedExtraXp, 0) // badge tiers never grant XP
  assert.equal(eloFixtures().length, 17)
})
