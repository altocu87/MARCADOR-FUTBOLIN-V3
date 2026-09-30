import assert from 'node:assert/strict'
import { MatchEngine } from '../src/match-engine/MatchEngine'

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

engine.dispatch('FORZAR_PENALTIS')
assert.equal(engine.getState().status, 'PENALTIES')
engine.dispatch('PENALTI_BLANCO_GOL')
engine.dispatch('PENALTI_AZUL_FALLO')
assert.equal(engine.getState().penalty?.whiteGoals, 1)
assert.equal(engine.getState().penalty?.blueAttempts, 1)

console.log('MatchEngine: todas las pruebas funcionales superadas.')
