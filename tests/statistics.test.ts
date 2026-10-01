import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import { playerStatistics } from '../src/statistics/playerStatistics'
import { loadPlayerStatistics } from '../src/statistics/loadPlayerStatistics'
import { SupabaseMatchRepository } from '../src/services/supabase/repositories'
import type { Database } from '../src/services/supabase/database.types'
import type { MatchRepository } from '../src/services/persistence/MatchRepository'
import type { MatchSummary, Player } from '../src/services/persistence/models'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { mapMatch } from '../src/services/persistence/mapMatch'

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const players: Player[] = [1, 2, 3, 4].map(n => ({ id: uuid(n), name: `Jugador ${n}`, nickname: null, photoUrl: null, active: true, level: 0 }))
function match(overrides: Partial<MatchSummary> = {}, size = 2): MatchSummary {
  return { id: uuid(100), status: 'MATCH_END', match_type: 'QUICK', victory_condition: 'GOALS', goal_limit: 1,
    time_limit_seconds: 60, white_score: 2, blue_score: 0, winner_team: 'WHITE', started_at: '2026-10-01T00:00:00.000Z', finished_at: '2026-10-01T00:02:00.000Z',
    went_to_extra_time: false, went_to_penalties: false, penalty_white_score: null, penalty_blue_score: null, penalty_white_attempts: null, penalty_blue_attempts: null, test_mode: false,
    participants: players.slice(0, size).map((p, i) => ({ player_id: p.id, player_name: p.name, team: i % 2 ? 'BLUE' : 'WHITE', position: Math.floor(i / 2) + 1 })), ...overrides }
}
function repository(getMatches: MatchRepository['getMatches']): MatchRepository {
  return { getMatches, async saveMatch() { throw new Error('Statistics must be read-only') }, async getMatchById() { throw new Error('No events needed') } }
}

test('sin historial: ceros finitos, sin NaN ni división por cero', () => {
  assert.deepEqual(playerStatistics([], uuid(1)), { played: 0, wins: 0, losses: 0, draws: 0, winRate: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 })
})
test('1v1: perspectiva blanco y azul, sin goleadores individuales', () => {
  assert.deepEqual(playerStatistics([match()], uuid(1)), { played: 1, wins: 1, losses: 0, draws: 0, winRate: 100, goalsFor: 2, goalsAgainst: 0, goalDifference: 2 })
  assert.deepEqual(playerStatistics([match()], uuid(2)), { played: 1, wins: 0, losses: 1, draws: 0, winRate: 0, goalsFor: 0, goalsAgainst: 2, goalDifference: -2 })
})
test('2v2: compañeros comparten resultado, sin repartir goles arbitrariamente', () => {
  const game = match({}, 4)
  assert.deepEqual(playerStatistics([game], uuid(1)), playerStatistics([game], uuid(3)))
  assert.deepEqual(playerStatistics([game], uuid(2)), playerStatistics([game], uuid(4)))
  assert.equal(playerStatistics([game], uuid(3)).played, 1)
})
test('empates y porcentaje con todos los partidos como denominador', () => {
  const games = [match(), match({ id: uuid(101), white_score: 1, blue_score: 1, winner_team: null }), match({ id: uuid(102), white_score: 0, blue_score: 3, winner_team: 'BLUE' })]
  assert.deepEqual(playerStatistics(games, uuid(1)), { played: 3, wins: 1, draws: 1, losses: 1, winRate: 33.3, goalsFor: 3, goalsAgainst: 4, goalDifference: -1 })
})
test('modo prueba, no finalizados y jugadores ajenos no contribuyen', () => {
  const unfinished = { ...match(), status: 'PLAYING' } as unknown as MatchSummary
  assert.equal(playerStatistics([match({ test_mode: true }), unfinished], uuid(1)).played, 0)
  assert.equal(playerStatistics([match()], uuid(99)).played, 0)
})
test('ID estable: reintentos y páginas solapadas no duplican estadísticas', () => {
  const game = match()
  assert.deepEqual(playerStatistics([game, structuredClone(game)], uuid(1)), playerStatistics([game], uuid(1)))
  assert.throws(() => playerStatistics([game, { ...game, white_score: 3 }], uuid(1)), /dos resultados/)
})
test('renombrado/baja lógica: vínculo por ID, nombre histórico conservado', () => {
  const games = [match(), match({ id: uuid(101), participants: match().participants.map(p => ({ ...p, player_name: 'Alias posterior' })) })]
  assert.equal(playerStatistics(games, players[0].id).played, 2)
  assert.equal(games[0].participants[0].player_name, 'Jugador 1')
})
test('penaltis: ganador azul sobre empate, intentos no suman goles', () => {
  const game = match({ white_score: 2, blue_score: 2, winner_team: 'BLUE', went_to_extra_time: true, went_to_penalties: true, penalty_white_score: 4, penalty_blue_score: 5 })
  assert.equal(playerStatistics([game], uuid(1)).losses, 1)
  assert.equal(playerStatistics([game], uuid(2)).wins, 1)
  assert.equal(playerStatistics([game], uuid(2)).goalsFor, 2)
  assert.equal(playerStatistics([game], uuid(2)).goalsAgainst, 2)
})
test('datos incompatibles: no presentar totales parciales silenciosos', () => {
  for (const broken of [match({ white_score: -1 }), match({ winner_team: 'BLUE' }), match({ participants: [...match().participants, match().participants[0]] }), match({ went_to_penalties: true }), match({ white_score: NaN })]) {
    assert.throws(() => playerStatistics([broken], uuid(1)))
  }
})
test('cálculo puro: no modifica resultados ni participantes', () => {
  const game = match({}, 4), before = structuredClone(game)
  playerStatistics([game], uuid(1))
  assert.deepEqual(game, before)
})

for (const size of [2, 4]) test(`motor real ${size === 2 ? '1v1' : '2v2'}: objetivo por equipo y goles finales`, () => {
  let now = 0
  const engine = new MatchEngine(() => now)
  engine.createMatch({ mode: 'QUICK', victoryCondition: 'GOALS', goalLimit: 2, halfDurationMinutes: 1 })
  engine.skipCountdown(); engine.dispatch('GOL_BLANCO')
  now += 3_000; engine.dispatch('GOL_BLANCO')
  const doc = mapMatch(engine.getState(), players.slice(0, size), uuid(100), false)
  assert.equal(playerStatistics([{ ...doc.match, participants: doc.participants }], uuid(1)).goalsFor, 2)
})
for (const shootout of [false, true]) test(`motor real: ${shootout ? 'penaltis anticipados' : 'prórroga y gol de oro'}`, () => {
  let now = 0
  const engine = new MatchEngine(() => now)
  engine.createMatch({ mode: 'QUICK', victoryCondition: 'TIME', goalLimit: 1, halfDurationMinutes: 1 })
  engine.skipCountdown(); engine.dispatch('GOL_BLANCO'); engine.dispatch('FINALIZAR_PARTE'); engine.continueToNextPeriod(); engine.skipCountdown()
  now += 3_000; engine.dispatch('GOL_AZUL'); engine.dispatch('FINALIZAR_PARTE'); engine.continueToNextPeriod(); engine.skipCountdown()
  if (shootout) {
    now += 60_000; engine.tick(); engine.continueToNextPeriod()
    for (let i = 0; i < 3; i++) { engine.dispatch('PENALTI_BLANCO_FALLO'); engine.dispatch('PENALTI_AZUL_GOL') }
  } else { now += 3_000; engine.dispatch('GOL_AZUL') }
  const doc = mapMatch(engine.getState(), players, uuid(100), false)
  const stats = playerStatistics([{ ...doc.match, participants: doc.participants }], uuid(2))
  assert.equal(stats.wins, 1); assert.equal(stats.goalsFor, shootout ? 1 : 2)
})
test('más de 20 partidos: recorre todas las páginas con cursor y deduplica', async () => {
  const games = Array.from({ length: 25 }, (_, i) => match({ id: uuid(100 + i) }))
  let calls = 0
  const result = await loadPlayerStatistics(repository(async (offset, query) => {
    assert.equal(offset, 0); assert.equal(query?.playerId, uuid(1))
    calls++
    if (calls === 1) return games.slice(0, 20)
    assert.deepEqual(query?.before, { finishedAt: games[19].finished_at, id: games[19].id })
    return [games[19], ...games.slice(20)]
  }), uuid(1))
  assert.equal(result.played, 25); assert.equal(result.goalsFor, 50); assert.equal(calls, 2)
})
test('fallo de página posterior: rechaza en vez de mostrar los primeros 20', async () => {
  let calls = 0
  await assert.rejects(loadPlayerStatistics(repository(async () => { if (calls++) throw new Error('network'); return Array.from({ length: 20 }, (_, i) => match({ id: uuid(100 + i) })) }), uuid(1)), /network/)
})
test('repositorio sin avance: no bucle infinito', async () => {
  await assert.rejects(loadPlayerStatistics(repository(async () => Array.from({ length: 20 }, (_, i) => match({ id: uuid(100 + i) }))), uuid(1)), /no avanza/)
})
test('cancelación: no completar estadísticas después de abandonar el perfil', async () => {
  const controller = new AbortController()
  controller.abort()
  let calls = 0
  await assert.rejects(loadPlayerStatistics(repository(async () => { calls++; return [] }), uuid(1), controller.signal), { name: 'AbortError' })
  assert.equal(calls, 0)
})
test('cancelación durante petición: ignora la respuesta tardía', async () => {
  const controller = new AbortController()
  let release!: (page: MatchSummary[]) => void
  const response = new Promise<MatchSummary[]>(resolve => { release = resolve })
  const pending = loadPlayerStatistics(repository(() => response), uuid(1), controller.signal)
  controller.abort(); release([match()])
  await assert.rejects(pending, { name: 'AbortError' })
})
test('exactamente 20 partidos: consulta página vacía final antes de dar totales', async () => {
  let calls = 0
  const stats = await loadPlayerStatistics(repository(async () => calls++ ? [] : Array.from({ length: 20 }, (_, i) => match({ id: uuid(100 + i) }))), uuid(1))
  assert.equal(calls, 2); assert.equal(stats.played, 20)
})
test('dos partidos con idéntica fecha: ambos contribuyen por sus IDs distintos', () => {
  assert.equal(playerStatistics([match(), match({ id: uuid(101) })], uuid(1)).played, 2)
})
test('penaltis de muerte súbita: mismo tratamiento de resultado y goles', () => {
  const game = match({ white_score: 0, blue_score: 0, winner_team: 'WHITE', went_to_penalties: true, penalty_white_score: 8, penalty_blue_score: 7, penalty_white_attempts: 9, penalty_blue_attempts: 9 })
  const stats = playerStatistics([game], uuid(1))
  assert.equal(stats.wins, 1); assert.equal(stats.goalsFor, 0); assert.equal(stats.goalsAgainst, 0)
})
test('corrección y deshacer: se calcula desde el marcador final, no suma el journal', () => {
  let now = 0
  const engine = new MatchEngine(() => now)
  engine.createMatch({ mode: 'QUICK', victoryCondition: 'TIME', goalLimit: 5, halfDurationMinutes: 1 })
  engine.skipCountdown(); engine.dispatch('GOL_BLANCO')
  now = 3_000; engine.dispatch('GOL_AZUL'); engine.dispatch('DESHACER')
  now = 6_000; engine.dispatch('GOL_BLANCO'); engine.dispatch('QUITAR_GOL_BLANCO')
  engine.dispatch('FINALIZAR_PARTE'); engine.continueToNextPeriod(); engine.skipCountdown()
  engine.dispatch('FINALIZAR_PARTE'); engine.continueToNextPeriod()
  const doc = mapMatch(engine.getState(), players, uuid(100), false)
  assert.equal(doc.events.filter(e => e.event_type === 'goal').length, 3)
  assert.equal(playerStatistics([{ ...doc.match, participants: doc.participants }], uuid(1)).goalsFor, 1)
})
test('SDK oficial: filtro por jugador conserva todos los participantes, sin escrituras', async () => {
  const urls: URL[] = []
  const client = createClient<Database>('https://statistics-fixture.example', 'fixture-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      assert.equal(init?.method ?? 'GET', 'GET')
      urls.push(new URL(String(input)))
      return new Response(JSON.stringify([match({}, 4)]), { status: 200, headers: { 'Content-Type': 'application/json' } })
    } },
  })
  const repo = new SupabaseMatchRepository(client)
  const result = await repo.getMatches(20, { playerId: uuid(1), before: { finishedAt: '2026-10-01T00:02:00.123456+00:00', id: uuid(100) } })
  const params = urls[0].searchParams
  assert.match(params.get('select')!, /participants:match_participants\(\*\)/)
  assert.match(params.get('select')!, /player_filter:match_participants!inner\(player_id\)/)
  assert.equal(params.get('player_filter.player_id'), `eq.${uuid(1)}`)
  assert.equal(params.get('test_mode'), 'eq.false'); assert.equal(params.get('status'), 'eq.MATCH_END')
  assert.equal(params.get('order'), 'finished_at.desc,id.desc')
  assert.match(params.get('or')!, /123456\+00:00/)
  assert.equal(params.get('offset'), '20'); assert.equal(params.get('limit'), '20')
  assert.equal(result[0].participants.length, 4)
  const calls = urls.length
  for (const query of [{ playerId: 'bad-id' }, { before: { id: uuid(100), finishedAt: 'bad,and(test_mode.eq.true)' } }]) await assert.rejects(repo.getMatches(0, query), /válid/)
  assert.equal(urls.length, calls, 'Validar antes de enviar una expresión inválida')
})
