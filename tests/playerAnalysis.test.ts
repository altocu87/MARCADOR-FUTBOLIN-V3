import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { AnalysisDetails } from '../src/ui/components/AnalysisDetails'
import { analyzePlayerResults, preparePlayerResults, validateAnalysisFilter, emptyAnalysisFilter } from '../src/statistics/playerAnalysis'
import { loadPlayerMatches } from '../src/statistics/loadPlayerStatistics'
import type { MatchSummary } from '../src/services/persistence/models'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
function match(n: number, outcome: 'WIN' | 'LOSS' | 'DRAW' = 'WIN', size = 2): MatchSummary {
  return { id: id(100 + n), status: 'MATCH_END', match_type: 'QUICK', victory_condition: 'GOALS', goal_limit: 1, time_limit_seconds: 60,
    white_score: outcome === 'LOSS' ? 0 : 2, blue_score: outcome === 'WIN' ? 0 : 2, winner_team: outcome === 'DRAW' ? null : outcome === 'WIN' ? 'WHITE' : 'BLUE',
    started_at: '2026-10-01T00:00:00Z', finished_at: `2026-10-${String(n).padStart(2, '0')}T12:00:00Z`, test_mode: false, went_to_extra_time: false, went_to_penalties: false,
    penalty_white_score: null, penalty_blue_score: null, penalty_white_attempts: null, penalty_blue_attempts: null,
    participants: Array.from({ length: size }, (_, i) => ({ player_id: id(i + 1), player_name: `Jugador ${i + 1}`, team: i % 2 ? 'BLUE' : 'WHITE', position: Math.floor(i / 2) + 1 })) }
}
const analyze = (games: MatchSummary[], filter = emptyAnalysisFilter) => analyzePlayerResults(preparePlayerResults(games, id(1)), id(1), filter)

test('análisis vacío: sin racha, sin evolución y ambos formatos sin partidos', () => {
  const a = analyze([])
  assert.deepEqual(a.currentStreak, { outcome: null, length: 0 }); assert.equal(a.bestWinStreak, 0)
  assert.deepEqual(a.recent, []); assert.deepEqual(a.evolution, []); assert.deepEqual(a.byFormat.map(r => r.totals.played), [0, 0])
})
test('orden cronológico, últimos cinco y acumulado sobre todos los partidos', () => {
  const games = ['WIN', 'WIN', 'LOSS', 'DRAW', 'WIN', 'LOSS', 'LOSS'].map((r, i) => match(i + 1, r as 'WIN' | 'LOSS' | 'DRAW'))
  const a = analyze([...games].reverse())
  assert.deepEqual(a.recent.map(r => r.match.id), games.slice(-5).reverse().map(r => r.id))
  assert.deepEqual(a.currentStreak, { outcome: 'LOSS', length: 2 }); assert.equal(a.bestWinStreak, 2)
  assert.deepEqual(a.evolution.map(r => r.winRate), [100, 100, 66.7, 50, 60, 50, 42.9])
  assert.equal(a.evolution.at(-1)?.winRate, a.totals.winRate)
})
test('empate corta victorias/derrotas, racha actual de empates explícita', () => {
  const a = analyze([match(1), match(2), match(3, 'DRAW'), match(4, 'DRAW')])
  assert.deepEqual(a.currentStreak, { outcome: 'DRAW', length: 2 }); assert.equal(a.bestWinStreak, 2)
  assert.equal(analyze([match(1, 'LOSS'), match(2, 'WIN')]).currentStreak.length, 1)
})
test('1v1 y 2v2 se separan por participantes, misma perspectiva para compañeros', () => {
  const games = [match(1), match(2, 'LOSS', 4), match(3, 'WIN', 4)]
  const a = analyze(games)
  assert.deepEqual(a.byFormat.map(r => [r.totals.played, r.totals.wins, r.totals.losses]), [[1, 1, 0], [2, 1, 1]])
  const teammate = analyzePlayerResults(preparePlayerResults(games, id(3)), id(3))
  assert.deepEqual(teammate.totals, a.byFormat[1].totals)
})
test('filtros combinados: todas las secciones e historial usan el mismo subconjunto', () => {
  const games = Array.from({ length: 12 }, (_, i) => ({ ...match(i + 1, i % 2 ? 'LOSS' : 'WIN', i % 2 ? 4 : 2), match_type: i % 3 ? 'CHAOS' as const : 'QUICK' as const }))
  const a = analyze(games, { from: '2026-10-03', to: '2026-10-11', mode: 'CHAOS', format: '1v1' })
  assert.deepEqual(a.matches.map(m => m.finished_at.slice(0, 10)), ['2026-10-11', '2026-10-09', '2026-10-05', '2026-10-03'])
  assert.equal(a.totals.played, 4); assert.equal(a.currentStreak.length, 4); assert.equal(a.bestWinStreak, 4)
  assert.equal(a.recent.length, 4); assert.equal(a.evolution.length, 4); assert.equal(a.byFormat[1].totals.played, 0)
})
test('periodo sin coincidencias no altera los datos ni inventa una racha', () => {
  const games = [match(1)], original = structuredClone(games)
  const results = preparePlayerResults(games, id(1))
  const a = analyzePlayerResults(results, id(1), { ...emptyAnalysisFilter, mode: 'RANKED' })
  assert.equal(a.totals.played, 0); assert.equal(a.currentStreak.outcome, null)
  assert.equal(analyzePlayerResults(results, id(1)).totals.played, 1)
  assert.deepEqual(games, original)
})
test('fechas inclusivas: medianoche inicial y último microsegundo, no día siguiente', () => {
  const previous = process.env.TZ; process.env.TZ = 'UTC'
  try {
    const dates = ['2026-10-01T23:59:59.999999Z', '2026-10-02T00:00:00Z', '2026-10-02T23:59:59.999999Z', '2026-10-03T00:00:00Z']
    const a = analyze(dates.map((finished_at, i) => ({ ...match(i + 1), finished_at })), { ...emptyAnalysisFilter, from: '2026-10-02', to: '2026-10-02' })
    assert.equal(a.totals.played, 2)
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous }
})
test('fechas locales: desfase horario y días DST de 23/25 horas', () => {
  const previous = process.env.TZ; process.env.TZ = 'Europe/Madrid'
  try {
    const spring = validateAnalysisFilter({ ...emptyAnalysisFilter, from: '2026-03-29', to: '2026-03-29' })
    const autumn = validateAnalysisFilter({ ...emptyAnalysisFilter, from: '2026-10-25', to: '2026-10-25' })
    assert.equal(spring.to - spring.from, 23 * 3_600_000); assert.equal(autumn.to - autumn.from, 25 * 3_600_000)
    assert.equal(analyze([{ ...match(1), finished_at: '2026-10-01T22:30:00Z' }], { ...emptyAnalysisFilter, from: '2026-10-02', to: '2026-10-02' }).totals.played, 1)
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous }
})
test('validación: rango invertido, fecha imposible y filtros desconocidos', () => {
  for (const filter of [{ ...emptyAnalysisFilter, from: '2026-10-03', to: '2026-10-02' }, { ...emptyAnalysisFilter, from: '2026-02-30' }, { ...emptyAnalysisFilter, to: 'bad' }, { ...emptyAnalysisFilter, mode: 'OTHER' }, { ...emptyAnalysisFilter, format: '3v3' }]) {
    assert.throws(() => validateAnalysisFilter(filter as typeof emptyAnalysisFilter), /Fecha|fecha|Filtro/)
  }
})
test('timestamps con microsegundos/desfase y UUID: orden determinista para rachas', () => {
  const games = [
    { ...match(1, 'LOSS'), finished_at: '2026-10-01T12:00:00.123456Z' },
    { ...match(2), finished_at: '2026-10-01T14:00:00.123455+02:00' },
    { ...match(3), finished_at: '2026-10-01T12:00:00.123456Z' },
  ]
  assert.deepEqual(preparePlayerResults(games, id(1)).map(r => r.match.id), [id(102), id(101), id(103)])
  assert.deepEqual(analyze(games).currentStreak, { outcome: 'WIN', length: 1 })
})
test('reintentos se deduplican; conflictos de fecha/modalidad/equipos se rechazan', () => {
  const game = match(1)
  assert.equal(analyze([game, structuredClone(game)]).evolution.length, 1)
  for (const changed of [{ ...game, match_type: 'CHAOS' as const }, { ...game, finished_at: match(2).finished_at }, { ...game, participants: [...game.participants, ...match(1, 'WIN', 4).participants.slice(2)] }]) {
    assert.throws(() => preparePlayerResults([game, changed], id(1)), /Datos distintos/)
  }
})
test('equipos, modalidad o fecha incompatibles no producen un análisis parcial', () => {
  for (const game of [{ ...match(1), finished_at: 'not-a-date' }, { ...match(1), match_type: 'UNKNOWN' }, { ...match(1), participants: match(1).participants.map(p => ({ ...p, team: 'WHITE' })) }]) {
    assert.throws(() => preparePlayerResults([game as MatchSummary], id(1)), /incompatible/)
  }
})
test('prácticas, incompletos y jugador ajeno no afectan rachas/evolución', () => {
  const games = [match(1), { ...match(2, 'LOSS'), test_mode: true }, { ...match(3, 'LOSS'), status: 'PLAYING' } as unknown as MatchSummary]
  assert.equal(analyze(games).currentStreak.length, 1)
  assert.equal(preparePlayerResults(games, id(99)).length, 0)
})
test('penaltis: victoria en rachas y últimos resultados, goles de campo empatados', () => {
  const game = { ...match(1, 'DRAW'), winner_team: 'WHITE' as const, went_to_penalties: true, penalty_white_score: 8, penalty_blue_score: 7 }
  const a = analyze([game])
  assert.equal(a.currentStreak.outcome, 'WIN'); assert.equal(a.recent[0].goalsFor, 2); assert.equal(a.recent[0].goalsAgainst, 2)
})
test('lectura completa reutilizable: no pide eventos ni escribe, más de 20 resultados', async () => {
  const games = Array.from({ length: 25 }, (_, i) => match(i + 1))
  let calls = 0
  const loaded = await loadPlayerMatches({ async getMatches(offset, query) { assert.equal(offset, 0); assert.equal(query?.playerId, id(1)); return calls++ ? games.slice(20) : games.slice(0, 20) }, async saveMatch() { throw new Error('No writes') }, async getMatchById() { throw new Error('No events') } }, id(1))
  const a = analyze(loaded)
  assert.equal(calls, 2); assert.equal(a.evolution.length, 25); assert.equal(a.bestWinStreak, 25)
})

test('gráfico acotado: calcula 200 partidos, dibuja 60 puntos y conserva extremos', () => {
  const games = Array.from({ length: 200 }, (_, i) => ({ ...match(1, i % 2 ? 'LOSS' : 'WIN'), id: id(100 + i), finished_at: new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString() }))
  const a = analyze(games)
  const html = renderToStaticMarkup(createElement(AnalysisDetails, { analysis: a, players: [] }))
  assert.equal(a.evolution.length, 200)
  const coordinates = html.match(/<polyline points="([^"]+)"/)![1].split(' ')
  assert.equal(coordinates.length, 60); assert.equal(coordinates[0], '20,20'); assert.equal(coordinates.at(-1), '300,70')
  assert.match(html, /Inicio 100%; final 50%/)
  assert.match(html, /<th scope="row">200<\/th>/)
})
test('gráfico de un único resultado: punto visible y descripción accesible', () => {
  const html = renderToStaticMarkup(createElement(AnalysisDetails, { analysis: analyze([match(1)]), players: [] }))
  assert.match(html, /role="img" aria-label="Porcentaje acumulado/)
  assert.match(html, /<circle cx="160" cy="20" r="4"/)
})

test('nombres actuales por ID: homónimos, inactivos y fallback sin alterar resultados', () => {
  const game = match(1, 'WIN', 4)
  game.participants[0].player_name = 'Nombre antiguo compartido'
  game.participants[1].player_name = 'Nombre antiguo compartido'
  const original = structuredClone(game)
  const analysis = analyze([game])
  const players = [
    { id: id(1), name: 'Nombre compartido', nickname: '<Alias blanco>', photoUrl: null, active: true, level: 0 },
    { id: id(2), name: 'Azul actual', nickname: null, photoUrl: null, active: false, level: 0 },
  ]
  const html = renderToStaticMarkup(createElement(AnalysisDetails, { analysis, players }))
  assert.match(html, /B: &lt;Alias blanco&gt; · A: Azul actual · B: Jugador 3 · A: Jugador 4/)
  assert.doesNotMatch(html, /Nombre antiguo compartido/)
  assert.deepEqual(game, original)
  assert.equal(analysis.totals.played, 1)
  assert.equal(analysis.totals.wins, 1)
})
