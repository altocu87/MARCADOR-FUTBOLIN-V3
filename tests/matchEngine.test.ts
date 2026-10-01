import assert from 'node:assert/strict'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { ScreenMatchInput } from '../src/inputs/ScreenMatchInput'

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

// Each case has its own clock: a correction/transition must not restart or erase
// the original three-second deadline. Direct dispatch represents another adapter.
for (const scenario of ['undo', 'minus', 'pause-undo', 'period-undo', 'next-period', 'extra-time', 'golden-undo', 'penalties-return'] as const) {
  let time = 0
  const match = new MatchEngine(() => time, () => 'flash')
  const touch = new ScreenMatchInput(match)
  match.createMatch({ ...config, goalLimit: scenario === 'period-undo' || scenario === 'next-period' ? 1 : 5 })
  match.skipCountdown()
  if (scenario === 'golden-undo') { match.dispatch('FORZAR_PRORROGA'); match.skipCountdown() }
  touch.emit('GOL_BLANCO')
  time = 500
  switch (scenario) {
    case 'undo': case 'period-undo': case 'golden-undo': match.dispatch('DESHACER'); break
    case 'minus': match.dispatch('QUITAR_GOL_BLANCO'); break
    case 'pause-undo': match.dispatch('PAUSA'); match.dispatch('DESHACER'); match.dispatch('CONTINUAR'); break
    case 'next-period': match.continueToNextPeriod(); match.skipCountdown(); break
    case 'extra-time': match.dispatch('FORZAR_PRORROGA'); match.skipCountdown(); break
    case 'penalties-return': match.dispatch('FORZAR_PENALTIS'); match.dispatch('FORZAR_PRORROGA'); match.skipCountdown(); break
  }
  assert.equal(match.getState().status, 'PLAYING', scenario)
  assert.equal(match.getState().goalInputLocked, true, `${scenario}: conserva bloqueo visual`)
  assert.equal(match.getState().goalLockRemainingMs, 2_500, `${scenario}: conserva plazo original`)
  const events = match.getState().events.length
  time = 2_999
  touch.emit('GOL_AZUL'); match.dispatch('GOL_BLANCO')
  assert.equal(match.getState().blueGoals, 0, `${scenario}: rechaza cualquier fuente antes de 3s`)
  assert.equal(match.getState().events.length, events, `${scenario}: rechazo no genera eventos`)
  time = 3_000
  match.dispatch('GOL_AZUL')
  assert.equal(match.getState().blueGoals, 1, `${scenario}: acepta exactamente a los 3s sin tick externo`)
}

// Normal countdown can outlast the lock; a brand-new match starts clean.
const transition = new MatchEngine(() => currentTime)
transition.createMatch({ ...config, goalLimit: 1 }); transition.skipCountdown()
transition.dispatch('GOL_BLANCO'); transition.continueToNextPeriod()
currentTime += 3_000; transition.tick()
assert.equal(transition.getState().goalInputLocked, false)
transition.dispatch('GOL_AZUL')
assert.equal(transition.getState().blueGoals, 1)
transition.createMatch(config); transition.skipCountdown(); transition.dispatch('GOL_BLANCO')
assert.equal(transition.getState().whiteGoals, 1, 'Una nueva partida no hereda bloqueo anterior')

for (const golden of [false, true]) {
  let time = 0
  const resumed = new MatchEngine(() => time)
  resumed.createMatch({ ...config, goalLimit: 1 }); resumed.skipCountdown()
  if (golden) { resumed.dispatch('FORZAR_PRORROGA'); resumed.skipCountdown() }
  time = 1_000; resumed.dispatch('GOL_BLANCO')
  time = 11_000; resumed.dispatch('DESHACER'); resumed.tick()
  assert.equal(resumed.getState().elapsedSeconds, 1, 'Deshacer desde un final no cuenta el tiempo de descanso')
  time = 12_000; resumed.tick()
  assert.equal(resumed.getState().elapsedSeconds, 2, 'El reloj continúa sin retroceder ni saltar')
}

console.log('MatchEngine: pruebas funcionales, ocho regresiones de bloqueo y reloj al reanudar superadas.')
