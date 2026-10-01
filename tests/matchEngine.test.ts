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

// Current GOALS: target belongs to a team, a single untimed period.
for (const winner of ['WHITE', 'BLUE'] as const) {
  let time = 0
  const match = new MatchEngine(() => time)
  match.createMatch({ ...config, victoryCondition: 'GOALS', goalLimit: 3, halfDurationMinutes: 1 })
  match.skipCountdown()
  time = 600_000; match.tick()
  assert.equal(match.getState().status, 'PLAYING', 'Diez minutos no terminan un partido por goles')
  assert.equal(match.getState().elapsedSeconds, 600)
  assert.equal(match.getState().periodInitialSeconds, 0, 'No hay duración límite oculta')
  for (const event of ['FINALIZAR_PARTE', 'FORZAR_PRORROGA', 'FORZAR_PENALTIS'] as const) match.dispatch(event)
  assert.equal(match.getState().period, 'FIRST_HALF')
  assert.equal(match.getState().status, 'PLAYING')
  const score = (team: 'WHITE' | 'BLUE') => { match.dispatch(team === 'WHITE' ? 'GOL_BLANCO' : 'GOL_AZUL'); time += 3_000 }
  score('WHITE'); score('BLUE'); score('WHITE'); score('BLUE')
  assert.equal(match.getState().status, 'PLAYING', '2–2 no alcanza el objetivo de tres por equipo')
  match.dispatch('PAUSA'); const elapsed = match.getState().elapsedSeconds
  time += 60_000; match.tick(); match.dispatch('CONTINUAR')
  assert.equal(match.getState().elapsedSeconds, elapsed, 'Pausa excluida del tiempo jugado')
  const published: string[] = []
  match.subscribe(state => published.push(state.status))
  score(winner)
  assert.equal(published.at(-1), 'MATCH_END')
  assert.equal(published.includes('PERIOD_END'), false)
  assert.equal(Math.max(match.getState().whiteGoals, match.getState().blueGoals), 3)
  const events = match.getState().events.length
  match.continueToNextPeriod(); match.skipCountdown(); time += 60_000; match.dispatch('GOL_BLANCO')
  assert.equal(match.getState().events.length, events, 'Un final no admite más goles ni otra parte')
  match.dispatch('DESHACER'); match.tick()
  assert.equal(match.getState().status, 'PLAYING', 'Anular el gol decisivo reabre la misma parte')
  assert.equal(match.getState().elapsedSeconds, elapsed, 'El descanso del final no suma tiempo')
  score(winner)
  assert.equal(match.getState().status, 'MATCH_END')
}

{
  let time = 0
  const match = new MatchEngine(() => time)
  match.createMatch({ ...config, victoryCondition: 'TIME', goalLimit: 1, halfDurationMinutes: 1 })
  match.skipCountdown(); match.dispatch('GOL_BLANCO')
  time = 3_000; match.dispatch('GOL_BLANCO')
  assert.equal(match.getState().status, 'PLAYING', 'Por tiempo los goles no cierran la parte')
  time = 60_000; match.tick(); match.continueToNextPeriod(); match.skipCountdown()
  assert.equal(match.getState().period, 'SECOND_HALF')
  assert.equal(match.getState().whiteGoals, 2, 'El marcador se acumula entre partes')
  time = 63_000; match.dispatch('GOL_AZUL')
  time = 120_000; match.tick(); match.continueToNextPeriod()
  assert.equal(match.getState().status, 'MATCH_END')
  assert.deepEqual([match.getState().whiteGoals, match.getState().blueGoals], [2, 1])
  assert.equal(match.getState().events.at(-1)?.matchTimeSeconds, 120)
}

// BOTH: a team reaches the target within this half, or the clock expires.
// The match winner always comes from the two halves' cumulative score.
for (const byClock of [false, true]) {
  let time = 0
  const match = new MatchEngine(() => time)
  match.createMatch({ ...config, halfDurationMinutes: 1 }); match.skipCountdown()
  const score = (team: 'WHITE' | 'BLUE') => { match.dispatch(team === 'WHITE' ? 'GOL_BLANCO' : 'GOL_AZUL'); time += 3_000 }
  score('WHITE'); score('BLUE'); score('WHITE'); score('BLUE'); score('WHITE')
  assert.equal(match.getState().status, 'PLAYING', '3–2 no alcanza cinco por equipo')
  if (byClock) { time = 60_000; match.tick() }
  else { score('BLUE'); score('WHITE'); score('BLUE'); score('WHITE') }
  assert.equal(match.getState().status, 'PERIOD_END', 'Cierra la parte, todavía no hay ganador del partido')
  assert.equal(match.getState().finishedAt, null)
  match.continueToNextPeriod(); match.skipCountdown()
  const secondStarted = time
  assert.equal(match.getState().period, 'SECOND_HALF')
  if (byClock) { score('WHITE'); time = secondStarted + 60_000; match.tick() }
  else {
    for (let i = 0; i < 4; i++) score('BLUE')
    assert.equal(match.getState().status, 'PLAYING', 'El acumulado azul supera cinco pero su parcial todavía es cuatro')
    score('BLUE')
  }
  assert.equal(match.getState().status, 'PERIOD_END')
  match.continueToNextPeriod()
  assert.equal(match.getState().status, 'MATCH_END')
  assert.deepEqual([match.getState().whiteGoals, match.getState().blueGoals], byClock ? [4, 2] : [5, 9])
}

{
  let time = 0
  const match = new MatchEngine(() => time)
  match.createMatch({ ...config, halfDurationMinutes: 1 }); match.skipCountdown()
  time = 60_000; match.dispatch('GOL_BLANCO')
  assert.equal(match.getState().status, 'PERIOD_END')
  assert.equal(match.getState().whiteGoals, 0, 'Un gol al vencer el tiempo ya no entra en esa parte')
}

console.log('MatchEngine: modalidades actuales, bloqueo, correcciones, reloj y compatibilidad superados.')
