import assert from 'node:assert/strict'
import test from 'node:test'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { getMatchWinner } from '../src/match-engine/types'

let currentTime = 0
const engine = new MatchEngine(() => currentTime, () => 'flash')
const config = { mode: 'QUICK' as const, victoryCondition: 'BOTH' as const, goalLimit: 5, halfDurationMinutes: 5 }

engine.createMatch(config)
assert.equal(engine.getState().status, 'COUNTDOWN')
engine.dispatch('GOL_BLANCO')
assert.equal(engine.getState().whiteGoals, 0, 'No registra goles durante la cuenta atrás')

currentTime = 3_000
engine.tick()
assert.equal(engine.getState().status, 'PLAYING')
engine.dispatch('GOL_BLANCO')
assert.equal(engine.getState().whiteGoals, 1)
assert.equal(engine.getState().goals.length, 1)
assert.equal(engine.getState().goalInputLocked, true)
engine.dispatch('GOL_AZUL')
assert.equal(engine.getState().blueGoals, 0, 'El bloqueo de tres segundos rechaza nuevas entradas')

currentTime = 6_001
engine.tick()
assert.equal(engine.getState().goalInputLocked, false)
engine.dispatch('GOL_AZUL')
assert.equal(engine.getState().blueGoals, 1)
engine.dispatch('DESHACER')
assert.equal(engine.getState().blueGoals, 0, 'Deshacer restaura el último gol')
assert.equal(engine.getState().goals.length, 1)

engine.dispatch('PAUSA')
const pausedTime = engine.getState().remainingSeconds
currentTime += 10_000
engine.tick()
assert.equal(engine.getState().remainingSeconds, pausedTime, 'La pausa detiene el reloj')
engine.dispatch('CONTINUAR')
engine.dispatch('FINALIZAR_PARTE')
assert.equal(engine.getState().status, 'PERIOD_END')
engine.continueToNextPeriod()
assert.equal(engine.getState().period, 'SECOND_HALF')
assert.equal(engine.getState().status, 'COUNTDOWN')

engine.dispatch('FORZAR_PRORROGA')
assert.equal(engine.getState().period, 'EXTRA_TIME')
engine.skipCountdown()
engine.dispatch('GOL_BLANCO')
assert.equal(engine.getState().status, 'MATCH_END', 'El gol de oro termina la prórroga')

engine.createMatch(config)
engine.dispatch('FORZAR_PENALTIS')
assert.equal(engine.getState().status, 'PENALTIES')
engine.dispatch('PENALTI_BLANCO_GOL')
engine.dispatch('PENALTI_AZUL_FALLO')
assert.equal(engine.getState().penalty?.whiteGoals, 1)
assert.equal(engine.getState().penalty?.blueAttempts, 1)

console.log('MatchEngine: todas las pruebas funcionales superadas.')

test('recupera pausado, sin consumir tiempo, conserva deshacer y evita IDs duplicados', () => {
  let now = 1000
  const original = new MatchEngine(() => now, () => 'flash')
  original.createMatch(config); original.skipCountdown()
  now += 4000; original.tick(); original.dispatch('GOL_BLANCO')
  const checkpoint = original.exportCheckpoint()
  now += 600_000
  const restored = new MatchEngine(() => now, () => 'flash')
  restored.restore(checkpoint)
  assert.equal(restored.getState().status, 'PAUSED')
  restored.tick()
  assert.equal(restored.getState().remainingSeconds, 296)
  restored.dispatch('DESHACER')
  assert.equal(restored.getState().status, 'PAUSED')
  assert.equal(restored.getState().whiteGoals, 0)
  restored.dispatch('CONTINUAR'); restored.dispatch('GOL_AZUL')
  assert.equal(restored.getState().goals[0].id, 'goal-2')
  now += 1000; restored.tick()
  assert.equal(restored.getState().remainingSeconds, 295)
  assert.equal(checkpoint.state.whiteGoals, 1)
})

test('recupera cuenta atrás pausada, descansos y penaltis sin saltar de fase', () => {
  const first = new MatchEngine(() => 1000)
  first.createMatch(config)
  const restored = new MatchEngine(() => 9000)
  restored.restore(first.exportCheckpoint())
  assert.equal(restored.getState().status, 'PAUSED')
  assert.equal(restored.getState().remainingSeconds, 300)
  first.skipCountdown(); first.dispatch('FINALIZAR_PARTE')
  restored.restore(first.exportCheckpoint())
  assert.equal(restored.getState().status, 'PERIOD_END')
  first.dispatch('FORZAR_PENALTIS'); first.dispatch('PENALTI_BLANCO_GOL')
  restored.restore(first.exportCheckpoint())
  assert.equal(restored.getState().status, 'PENALTIES')
  assert.equal(restored.getState().penalty?.whiteGoals, 1)
})

test('deshacer conserva el tiempo actual y no revive una parte o un partido cerrado', () => {
  let now = 0
  const game = new MatchEngine(() => now, () => 'flash')
  game.createMatch(config); game.skipCountdown(); game.dispatch('GOL_BLANCO')
  now = 8000; game.tick(); game.dispatch('DESHACER')
  assert.equal(game.getState().remainingSeconds, 292)
  game.dispatch('GOL_BLANCO'); game.dispatch('FINALIZAR_PARTE'); game.dispatch('DESHACER')
  assert.equal(game.getState().status, 'PERIOD_END')
  game.continueToNextPeriod(); game.skipCountdown(); game.dispatch('DESHACER')
  assert.equal(game.getState().whiteGoals, 1)
  game.dispatch('FORZAR_PRORROGA'); game.skipCountdown(); game.dispatch('GOL_BLANCO'); game.dispatch('DESHACER')
  assert.equal(game.getState().status, 'MATCH_END')
})

test('quitar y deshacer un gol mantienen los marcadores de todos los eventos coherentes', () => {
  let now = 0
  const game = new MatchEngine(() => now, () => 'flash')
  game.createMatch(config); game.skipCountdown(); game.dispatch('GOL_BLANCO')
  now = 4000; game.tick(); game.dispatch('GOL_AZUL')
  game.dispatch('QUITAR_GOL_BLANCO')
  assert.equal(game.getState().goals[0].scoreWhite, 0)
  assert.equal(game.getState().goals[0].scoreBlue, 1)
  game.dispatch('DESHACER')
  assert.equal(game.getState().whiteGoals, 1)
  assert.equal(game.getState().goals.length, 2)
})

test('el modo por goles no termina por tiempo, pero la prórroga sí tiene límite', () => {
  let now = 0
  const game = new MatchEngine(() => now)
  game.createMatch({ ...config, victoryCondition: 'GOALS' }); game.skipCountdown()
  now = 400_000; game.tick()
  assert.equal(game.getState().status, 'PLAYING')
  game.dispatch('FORZAR_PRORROGA'); game.skipCountdown()
  now += 60_000; game.tick()
  assert.equal(game.getState().status, 'PERIOD_END')
  game.continueToNextPeriod()
  assert.equal(game.getState().status, 'PENALTIES')
})

test('pausar justo al terminar el reloj no reabre una parte terminada', () => {
  let now = 0
  const game = new MatchEngine(() => now)
  game.createMatch(config); game.skipCountdown(); now = 300_000
  game.dispatch('PAUSA')
  assert.equal(game.getState().status, 'PERIOD_END')
})

test('penaltis respetan turnos y deciden el ganador al completar cinco rondas', () => {
  const game = new MatchEngine(() => 0)
  game.createMatch(config); game.dispatch('FORZAR_PENALTIS')
  game.dispatch('PENALTI_AZUL_GOL')
  assert.equal(game.getState().penalty?.blueAttempts, 0)
  for (let index = 0; index < 5; index++) {
    game.dispatch('PENALTI_BLANCO_GOL')
    game.dispatch('PENALTI_BLANCO_GOL')
    assert.equal(game.getState().penalty?.whiteAttempts, index + 1)
    game.dispatch(index < 4 ? 'PENALTI_AZUL_GOL' : 'PENALTI_AZUL_FALLO')
  }
  assert.equal(game.getState().status, 'MATCH_END')
  assert.equal(getMatchWinner(game.getState()), 'WHITE')
})

test('penaltis finalizan anticipadamente cuando el rival ya no puede empatar', () => {
  const game = new MatchEngine(() => 0)
  game.createMatch(config); game.dispatch('FORZAR_PENALTIS')
  for (let i = 0; i < 3; i++) { game.dispatch('PENALTI_BLANCO_GOL'); game.dispatch('PENALTI_AZUL_FALLO') }
  assert.equal(game.getState().status, 'MATCH_END')
  assert.equal(getMatchWinner(game.getState()), 'WHITE')
})

test('la muerte súbita espera una pareja completa de lanzamientos', () => {
  const game = new MatchEngine(() => 0)
  game.createMatch(config); game.dispatch('FORZAR_PENALTIS')
  for (let i = 0; i < 5; i++) { game.dispatch('PENALTI_BLANCO_GOL'); game.dispatch('PENALTI_AZUL_GOL') }
  assert.equal(game.getState().penalty?.suddenDeath, true)
  game.dispatch('PENALTI_BLANCO_FALLO')
  assert.equal(game.getState().status, 'PENALTIES')
  game.dispatch('PENALTI_AZUL_GOL')
  assert.equal(game.getState().status, 'MATCH_END')
  assert.equal(getMatchWinner(game.getState()), 'BLUE')
})

test('rechaza configuraciones imposibles', () => {
  const game = new MatchEngine()
  assert.throws(() => game.createMatch({ ...config, goalLimit: 0 }), /no válida/)
  assert.throws(() => game.createMatch({ ...config, halfDurationMinutes: -1 }), /no válida/)
})

test('no registra un gol si el reloj ya ha terminado antes del siguiente tick', () => {
  let now = 0
  const game = new MatchEngine(() => now)
  game.createMatch(config); game.skipCountdown()
  now = 300_001
  game.dispatch('GOL_BLANCO')
  assert.equal(game.getState().status, 'PERIOD_END')
  assert.equal(game.getState().whiteGoals, 0)
})

test('los eventos no pueden modificar un partido que ya ha terminado', () => {
  const game = new MatchEngine(() => 0)
  game.createMatch(config); game.dispatch('FORZAR_PRORROGA'); game.skipCountdown(); game.dispatch('GOL_BLANCO')
  const before = game.exportCheckpoint()
  for (const event of ['FORZAR_PRORROGA', 'FORZAR_PENALTIS', 'GOL_AZUL', 'QUITAR_GOL_BLANCO', 'DESHACER'] as const) game.dispatch(event)
  assert.deepEqual(game.exportCheckpoint(), before)
})

test('los partidos por goles conservan tiempo transcurrido y marcas de gol tras recuperar', () => {
  let now = 0
  const game = new MatchEngine(() => now, () => 'flash')
  game.createMatch({ ...config, victoryCondition: 'GOALS' }); game.skipCountdown()
  now = 600_000; game.dispatch('GOL_BLANCO')
  assert.equal(game.getState().goals[0].timestamp, '10:00')
  assert.equal(game.getState().elapsedSeconds, 600)
  const saved = game.exportCheckpoint()
  now += 600_000
  game.restore(saved); game.dispatch('CONTINUAR')
  now += 5000; game.dispatch('GOL_AZUL')
  assert.equal(game.getState().goals[1].timestamp, '10:05')
  assert.equal(game.getState().remainingSeconds, 0)
})

test('pausar o recargar no permite saltarse el bloqueo de entradas tras un gol', () => {
  let now = 0
  const game = new MatchEngine(() => now, () => 'flash')
  game.createMatch(config); game.skipCountdown(); game.dispatch('GOL_BLANCO'); game.dispatch('PAUSA')
  now = 20_000
  game.restore(game.exportCheckpoint()); game.dispatch('CONTINUAR'); game.dispatch('GOL_AZUL')
  assert.equal(game.getState().blueGoals, 0)
  assert.equal(game.getState().goalInputLocked, true)
  now += 3000; game.dispatch('GOL_AZUL')
  assert.equal(game.getState().blueGoals, 1)
})
