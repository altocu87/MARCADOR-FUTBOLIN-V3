import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MatchSummary } from '../src/services/persistence/models'
import { loadPlayerMatches } from '../src/statistics/loadPlayerStatistics'
import { emptyAnalysisFilter, preparePlayerResults } from '../src/statistics/playerAnalysis'
import { directEvidence, predictionDraft, rankedForm } from './block04Prototype'
import { eloFixture, eloFixtures, eloPlayers } from './eloFixtures'

const [a, b, c, d] = eloPlayers.map(p => p.id)
const summary = (i: number, size = 2): MatchSummary => {
  const doc = eloFixture(i, size)
  return { ...doc.match, participants: doc.participants }
}
const fixtures = () => eloFixtures().map(doc => ({ ...doc.match, participants: doc.participants }))

test('04: ningún cálculo numérico de predicción se activa en el prototipo', () => {
  assert.equal(predictionDraft.status, 'WAITING_BLOCK03')
  assert.equal(predictionDraft.probability, null); assert.equal(predictionDraft.confidence, null)
  assert(Object.isFrozen(predictionDraft))
})
test('H2H 1v1: perspectiva inversa, goles por equipo y exclusión de 2v2/Rápido/Caos', () => {
  const own = directEvidence(fixtures(), [a], [b]).totals
  const rival = directEvidence(fixtures(), [b], [a]).totals
  assert.equal(own.played, 11)
  assert.equal(own.played, rival.played); assert.equal(own.wins, rival.losses)
  assert.equal(own.losses, rival.wins); assert.equal(own.draws, rival.draws)
  assert.equal(own.goalsFor, rival.goalsAgainst); assert.equal(own.goalsAgainst, rival.goalsFor)
})
test('propuesta 2v2: pareja exacta sin orden/color; compañeros y cruces no son rivales exactos', () => {
  const game = summary(0, 4)
  const switched = { ...summary(1, 4), participants: summary(1, 4).participants.map(p => ({ ...p, team: p.team === 'WHITE' ? 'BLUE' as const : 'WHITE' as const })) }
  const own = directEvidence([game, switched], [c, a], [d, b]).totals
  assert.deepEqual([own.played, own.wins, own.losses], [2, 1, 1])
  assert.equal(directEvidence([game], [a, b], [c, d]).totals.played, 0)
  assert.equal(directEvidence([game], [a], [c]).totals.played, 0)
  assert.equal(directEvidence([game, summary(2)], [a, c], [b, d]).totals.played, 1)
})
test('forma: cinco clasificatorios confirmados, perspectiva y orden estable', () => {
  const games = fixtures()
  const own = rankedForm([...games].reverse(), a), rival = rankedForm(games, b)
  assert.equal(own.length, 5)
  assert.deepEqual(own.map(r => r.match.id), games.filter(m => m.match_type === 'RANKED').slice(-5).reverse().map(m => m.id))
  assert.deepEqual(own.map(r => r.outcome), rival.map(r => r.outcome === 'WIN' ? 'LOSS' : r.outcome === 'LOSS' ? 'WIN' : 'DRAW'))
  assert.equal(rankedForm(games, eloPlayers[4].id).length, 0)
})
test('empates y tanda: cuentan resultados almacenados, nunca lanzamientos como goles', () => {
  const selected = fixtures().slice(13, 15)
  const totals = directEvidence(selected, [a, c], [b, d]).totals
  assert.deepEqual([totals.played, totals.wins, totals.losses, totals.draws], [2, 0, 1, 1])
  assert.deepEqual([totals.goalsFor, totals.goalsAgainst], [1, 1])
  assert.deepEqual(rankedForm(selected, a).map(r => r.outcome), ['DRAW', 'LOSS'])
})
test('reconstrucción: reintento idéntico no duplica; edición/eliminación altera evidencia y forma', () => {
  const game = summary(0), duplicate = structuredClone(game)
  assert.equal(directEvidence([game, duplicate], [a], [b]).totals.played, 1)
  const edited = { ...game, white_score: 0, blue_score: 1, winner_team: 'BLUE' as const }
  assert.equal(directEvidence([edited], [a], [b]).totals.losses, 1)
  assert.equal(rankedForm([edited], a)[0].outcome, 'LOSS')
  assert.equal(directEvidence([], [a], [b]).totals.played, 0)
  assert.throws(() => directEvidence([game, edited], [a], [b]), /distintos/)
  assert.deepEqual(game, duplicate)
})
test('identidad: homónimos/bajas conservan trayectoria sin filtrar el histórico por activo', () => {
  assert.equal(eloPlayers[0].name, eloPlayers[1].name)
  assert.equal(eloPlayers[3].active, false)
  assert.equal(directEvidence(fixtures(), [a, c], [b, d]).totals.played, 4)
  assert.equal(rankedForm(fixtures(), d).length, 4)
})
test('muestra insuficiente/prueba/incompletos: no completar cinco con resultados ficticios', () => {
  const game = summary(0)
  const games = [game, { ...summary(1), test_mode: true }, { ...summary(2), status: 'PLAYING' } as unknown as MatchSummary]
  assert.equal(rankedForm(games, a).length, 1)
  assert.equal(directEvidence(games, [a], [b]).totals.played, 1)
  assert.equal(predictionDraft.probability, null)
})
test('lectura confirmada completa por repositorio: más de 20, cola local ausente y cancelación', async () => {
  const confirmed = Array.from({ length: 25 }, (_, i) => summary(i)).reverse()
  const pending = summary(26)
  let calls = 0
  const repository = {
    async saveMatch() { throw new Error('Sin escrituras') },
    async getMatchById() { throw new Error('Sin detalle') },
    async getMatches(_offset = 0, query: { before?: { id: string } } = {}) {
      calls++
      const start = query.before ? confirmed.findIndex(m => m.id === query.before?.id) + 1 : 0
      return confirmed.slice(start, start + 20)
    },
  }
  const loaded = await loadPlayerMatches(repository, a)
  assert.equal(calls, 2); assert.equal(loaded.length, 25)
  assert(!loaded.some(m => m.id === pending.id))
  assert.equal(directEvidence(loaded, [a], [b]).totals.played, 25)
  const controller = new AbortController(); controller.abort()
  await assert.rejects(loadPlayerMatches(repository, a, controller.signal), /abort/i)
})
test('filtros H2H reutilizados, forma competitiva completa independiente del filtro', () => {
  const games = [summary(0), summary(1), summary(2)]
  const date = games[1].finished_at.slice(0, 10)
  assert.equal(directEvidence(games, [a], [b], { ...emptyAnalysisFilter, from: date, to: date, format: '2v2' }).totals.played, 0)
  assert.equal(rankedForm(games, a).length, 3)
  assert.throws(() => directEvidence(games, [a], [b], { ...emptyAnalysisFilter, from: '2026-02-30' }), /Fecha/)
})
test('rechaza selección inválida y resultados incompatibles antes de presentar evidencia parcial', () => {
  for (const [own, rivals] of [[[], [b]], [[a], [a]], [[a, a], [b, d]], [[a], [b, b]]]) assert.throws(() => directEvidence([], own, rivals), /incompatible/)
  assert.throws(() => directEvidence([{ ...summary(0), winner_team: 'BLUE' }], [a], [b]), /Ganador/)
})
test('últimos cinco conservan microsegundos/zonas y desempate UUID', () => {
  const games = [
    { ...summary(0), finished_at: '2026-10-02T12:00:00.123456Z' },
    { ...summary(1), finished_at: '2026-10-02T14:00:00.123455+02:00' },
    { ...summary(2), finished_at: '2026-10-02T12:00:00.123456Z' },
  ]
  assert.deepEqual(rankedForm(games, a).map(r => r.match.id), [games[2].id, games[0].id, games[1].id])
})

test('1v2 casual: ambas orientaciones, XP completo, H2H exacto y forma sin clasificatorias', async () => {
  const { MatchEngine } = await import('../src/match-engine/MatchEngine')
  const { mapMatch, participantsFor } = await import('../src/services/persistence/mapMatch')
  const { rebuildProgression, approvedXpRules } = await import('../src/progression/xp')
  const { ActiveMatchStore } = await import('../src/services/persistence/ActiveMatchStore')
  for (const mode of ['QUICK', 'CHAOS'] as const) for (const soloTeam of ['WHITE', 'BLUE'] as const) {
    const players = eloPlayers.slice(0, 3).map(p => ({ ...p, active: true }))
    let now = Date.parse('2026-10-02T12:00:00Z')
    const engine = new MatchEngine(() => now)
    engine.createMatch({ mode, soloTeam, victoryCondition: 'GOALS', goalLimit: 2, halfDurationMinutes: 1 })
    engine.skipCountdown(); engine.dispatch('GOL_BLANCO'); now += 3000
    const data = new Map<string, string>()
    const store = new ActiveMatchStore({ getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v) } }, 'test04', 'owner')
    store.save({ version: 1, id: 'ee040000-0000-4000-8000-000000000001', ownerId: 'owner', testMode: false, players, checkpoint: engine.getCheckpoint() })
    const restored = new MatchEngine(() => now)
    restored.restoreCheckpoint(store.load()!.checkpoint)
    assert.equal(restored.getState().config!.soloTeam, soloTeam)
    assert.deepEqual(participantsFor(store.load()!.players, soloTeam).map(p => p.team), soloTeam === 'WHITE' ? ['BLUE', 'WHITE', 'BLUE'] : ['WHITE', 'BLUE', 'WHITE'])
    restored.dispatch('CONTINUAR'); restored.dispatch('GOL_BLANCO')
    const doc = mapMatch(restored.getState(), players, 'ee040000-0000-4000-8000-000000000001', false)
    const match = { ...doc.match, participants: doc.participants }
    const white = doc.participants.filter(p => p.team === 'WHITE').map(p => p.player_id)
    const blue = doc.participants.filter(p => p.team === 'BLUE').map(p => p.player_id)
    assert.equal(directEvidence([match], white, blue, emptyAnalysisFilter).totals.wins, 1)
    assert.equal(directEvidence([match], blue, white, emptyAnalysisFilter).totals.losses, 1)
    for (const p of doc.participants) assert.equal(rebuildProgression([match, match], p.player_id, approvedXpRules).xp, p.team === 'WHITE' ? 150 : 75)
    assert.deepEqual(rankedForm([match], players[0].id), [])
    assert.throws(() => preparePlayerResults([{ ...match, match_type: 'RANKED' }], players[0].id), /Equipos/)
    assert.throws(() => mapMatch({ ...restored.getState(), config: { ...restored.getState().config!, mode: 'RANKED' } }, players, doc.match.id, false), /Clasificatorio/)
  }
})
