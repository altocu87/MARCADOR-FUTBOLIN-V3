import assert from 'node:assert/strict'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { validateCheckpoint } from '../src/match-engine/checkpoint'
import type { MatchCheckpoint } from '../src/match-engine/types'
import { ActiveMatchStore, type ActiveMatchCopy } from '../src/services/persistence/ActiveMatchStore'
import { SaveCoordinator, type KeyValueStorage } from '../src/services/persistence/SaveCoordinator'
import { mapMatch } from '../src/services/persistence/mapMatch'
import type { Player, MatchDocument } from '../src/services/persistence/models'
import type { MatchRepository } from '../src/services/persistence/MatchRepository'

const config = { mode: 'QUICK' as const, victoryCondition: 'GOALS' as const, goalLimit: 3, halfDurationMinutes: 1 }
const players: Player[] = [1, 2].map(i => ({ id: `00000000-0000-4000-8000-00000000000${i}`, name: `Jugador ${i}`, nickname: null, photoUrl: null, active: true, level: 0 }))
const id = '00000000-0000-4000-8000-000000000010'

// A timer expiry must publish only a settled period, never a recoverable
// PLAYING snapshot at 00:00. A delayed browser tick cannot add overtime.
for (const victoryCondition of ['TIME', 'BOTH'] as const) {
  let clock = 0
  const timed = new MatchEngine(() => clock)
  timed.createMatch({ ...config, victoryCondition }); timed.skipCountdown()
  const published: MatchCheckpoint[] = []
  timed.subscribe(() => published.push(timed.getCheckpoint()))
  clock = 90_000; timed.tick()
  assert.deepEqual(published.map(c => c.state.status), ['PERIOD_END'], 'El reloj solo publica el estado de cierre definitivo')
  assert.equal(timed.getState().elapsedSeconds, 60, 'Un tick tardío no añade tiempo después del límite')
  assert.equal(timed.getState().events.at(-1)?.matchTimeSeconds, 60)
  for (const copy of published) {
    validateCheckpoint(copy)
    new MatchEngine(() => clock).restoreCheckpoint(copy)
  }
}

// Legacy v1 copies could contain an expired PLAYING period after a delayed tick.
// Preserve their journal timestamps instead of retroactively shortening them.
{
  let clock = 0
  const legacy = new MatchEngine(() => clock)
  legacy.createMatch({ ...config, victoryCondition: 'TIME' }); legacy.skipCountdown()
  const copy = legacy.getCheckpoint()
  copy.state.elapsedSeconds = 90; copy.state.remainingSeconds = 0
  clock = 90_000; legacy.restoreCheckpoint(copy)
  legacy.dispatch('CONTINUAR'); legacy.tick()
  assert.equal(legacy.getState().status, 'PERIOD_END')
  assert.equal(legacy.getState().elapsedSeconds, 90)
  validateCheckpoint(legacy.getCheckpoint())
}

let now = 0
const engine = new MatchEngine(() => now, () => 'flash')
engine.createMatch(config); engine.skipCountdown()
now = 5_000; engine.dispatch('GOL_BLANCO')
const checkpoint = engine.getCheckpoint()
validateCheckpoint(checkpoint)
const recovered = new MatchEngine(() => now, () => 'flash')
now = 5_500; recovered.restoreCheckpoint(checkpoint)
assert.equal(recovered.getState().status, 'PAUSED')
assert.equal(recovered.getState().whiteGoals, 1)
assert.equal(recovered.getState().elapsedSeconds, 5)
assert.equal(recovered.getState().goalLockRemainingMs, 2_500)
assert.equal(recovered.getState().events.at(-1)?.eventType, 'pause')
recovered.dispatch('GOL_AZUL'); assert.equal(recovered.getState().blueGoals, 0)
recovered.dispatch('CONTINUAR'); now = 7_999; recovered.dispatch('GOL_AZUL')
assert.equal(recovered.getState().blueGoals, 0, 'Recuperación no elimina el bloqueo del último gol')
now = 8_000; recovered.dispatch('GOL_AZUL')
assert.equal(recovered.getState().blueGoals, 1)
assert.equal(recovered.getState().goals.at(-1)?.id, 'goal-2', 'Conserva el contador de IDs')
recovered.dispatch('DESHACER'); assert.equal(recovered.getState().blueGoals, 0)
const twice = recovered.getCheckpoint(); validateCheckpoint(twice)
now += 86_400_000; recovered.restoreCheckpoint(twice)
const pausedSeconds = recovered.getState().elapsedSeconds
now += 10_000; recovered.tick()
assert.equal(recovered.getState().elapsedSeconds, pausedSeconds, 'Cerrar o esperar en pausa no suma reloj')
recovered.dispatch('CONTINUAR'); now += 1_000; recovered.tick()
assert.equal(recovered.getState().elapsedSeconds, pausedSeconds + 1)
now += 3_000; recovered.dispatch('GOL_AZUL')
assert.equal(recovered.getState().goals.at(-1)?.id, 'goal-3', 'Un ID anulado no se reutiliza tras recuperar')
recovered.dispatch('PAUSA')
const pausedCopy = recovered.getCheckpoint()
recovered.restoreCheckpoint(pausedCopy)
assert.deepEqual(recovered.getState().events, pausedCopy.state.events, 'Recuperar una pausa no añade otra pausa')

// Recover count-down/half-time, extra time and alternating penalties.
const phases = new MatchEngine(() => now, () => 'flash')
phases.createMatch({ ...config, victoryCondition: 'BOTH', goalLimit: 1 })
phases.restoreCheckpoint(phases.getCheckpoint()); assert.equal(phases.getState().status, 'COUNTDOWN')
const settledStatuses: string[] = []
const stopSettled = phases.subscribe(() => settledStatuses.push(phases.getState().status))
phases.skipCountdown(); phases.dispatch('GOL_BLANCO')
assert.deepEqual(settledStatuses, ['PLAYING', 'PERIOD_END'], 'El gol de cierre solo publica el estado final de la acción')
stopSettled()
phases.restoreCheckpoint(phases.getCheckpoint()); assert.equal(phases.getState().status, 'PERIOD_END')
phases.continueToNextPeriod(); phases.skipCountdown(); now += 3_000
phases.dispatch('GOL_AZUL'); phases.continueToNextPeriod()
assert.equal(phases.getState().period, 'EXTRA_TIME')
phases.skipCountdown(); now += 60_000; phases.tick(); phases.continueToNextPeriod()
phases.dispatch('PENALTI_BLANCO_GOL')
const shootout = phases.getCheckpoint(); validateCheckpoint(shootout)
phases.restoreCheckpoint(shootout)
assert.equal(phases.getState().status, 'PENALTIES')
phases.dispatch('PENALTI_BLANCO_GOL'); assert.equal(phases.getState().penalty?.whiteAttempts, 1)
phases.dispatch('PENALTI_AZUL_FALLO')
assert.equal(phases.getState().penalty?.blueAttempts, 1)
for (let i = 0; i < 2; i++) { phases.dispatch('PENALTI_BLANCO_GOL'); phases.dispatch('PENALTI_AZUL_FALLO') }
assert.equal(phases.getState().status, 'MATCH_END')
const finalCopy = phases.getCheckpoint(); validateCheckpoint(finalCopy)
const beforeDocument = mapMatch(phases.getState(), players, id, false)
phases.restoreCheckpoint(finalCopy)
assert.deepEqual(mapMatch(phases.getState(), players, id, false), beforeDocument, 'Final recuperado conserva el agregado idempotente exacto')

// Invalid copies cannot partially mutate a running engine.
// Old v1 GOALS copies retain summed goals per period, even after another reload.
{
  let clock = 0
  const old = new MatchEngine(() => clock)
  old.createMatch({ ...config, victoryCondition: 'BOTH', goalLimit: 2 }); old.skipCountdown()
  const copy = old.getCheckpoint()
  copy.version = 1; delete copy.state.config!.rulesVersion
  copy.state.config!.victoryCondition = 'GOALS'
  for (const event of copy.state.events) delete event.metadata.rulesVersion
  old.restoreCheckpoint(copy); old.dispatch('CONTINUAR')
  old.dispatch('GOL_BLANCO'); clock += 3_000; old.dispatch('GOL_AZUL')
  assert.equal(old.getState().status, 'PERIOD_END', 'Una partida antigua no cambia sus reglas al recuperar')
  assert.equal(old.getCheckpoint().version, 1)
  old.restoreCheckpoint(old.getCheckpoint()); old.continueToNextPeriod()
  assert.equal(old.getState().period, 'SECOND_HALF')
  old.createMatch(config)
  assert.equal(old.getCheckpoint().version, 2, 'El siguiente partido sí usa las nuevas reglas')
}
// Current untimed goal matches survive closure and preserve their exact final document.
// V2 BOTH retains summed goals; V3 counts by team and restarts the target each half.
for (const version of [2, 3] as const) {
  let clock = 0
  const match = new MatchEngine(() => clock)
  match.createMatch({ ...config, victoryCondition: 'BOTH', goalLimit: 2 }); match.skipCountdown()
  const initial = match.getCheckpoint()
  initial.version = version; initial.state.config!.rulesVersion = version
  initial.state.events[0].metadata.rulesVersion = version
  match.restoreCheckpoint(initial); match.dispatch('CONTINUAR')
  match.dispatch('GOL_BLANCO'); clock += 3_000; match.dispatch('GOL_AZUL')
  assert.equal(match.getState().status, version === 2 ? 'PERIOD_END' : 'PLAYING')
  const copy = match.getCheckpoint(); validateCheckpoint(copy)
  clock += 86_400_000; match.restoreCheckpoint(copy)
  assert.equal(match.getCheckpoint().version, version)
  if (version === 3) {
    match.dispatch('CONTINUAR'); match.dispatch('GOL_BLANCO')
    assert.equal(match.getState().status, 'PERIOD_END')
  }
  match.continueToNextPeriod(); match.skipCountdown(); clock += 3_000
  match.dispatch('GOL_AZUL')
  assert.equal(match.getState().status, 'PLAYING', 'El objetivo se reinicia al pasar de parte')
  clock += 3_000; match.dispatch('GOL_AZUL'); match.continueToNextPeriod()
  assert.equal(match.getState().status, 'MATCH_END')
  const final = match.getCheckpoint(); validateCheckpoint(final)
  const document = mapMatch(match.getState(), players, id, false)
  match.restoreCheckpoint(final)
  assert.deepEqual(mapMatch(match.getState(), players, id, false), document)
  if (version === 3) {
    const broken = structuredClone(final); broken.state.events[0].metadata.rulesVersion = 2
    assert.throws(() => match.restoreCheckpoint(broken), /dañada/)
  }
}

{
  let clock = 0
  const match = new MatchEngine(() => clock)
  match.createMatch({ ...config, goalLimit: 2 }); match.skipCountdown()
  clock = 90_000; match.dispatch('GOL_AZUL')
  const copy = match.getCheckpoint(); validateCheckpoint(copy)
  clock += 86_400_000; match.restoreCheckpoint(copy)
  assert.equal(match.getState().elapsedSeconds, 90)
  match.dispatch('CONTINUAR'); clock += 3_000; match.dispatch('GOL_AZUL')
  assert.equal(match.getState().status, 'MATCH_END')
  const final = match.getCheckpoint(); validateCheckpoint(final)
  const document = mapMatch(match.getState(), players, id, false)
  match.restoreCheckpoint(final)
  assert.deepEqual(mapMatch(match.getState(), players, id, false), document)
  for (const mutate of [
    (c: MatchCheckpoint) => { c.version = 1 },
    (c: MatchCheckpoint) => { c.state.period = 'SECOND_HALF' },
    (c: MatchCheckpoint) => { c.state.status = 'PERIOD_END' },
    (c: MatchCheckpoint) => { c.state.config!.goalLimit = 3 },
    (c: MatchCheckpoint) => { c.state.goals[0].period = 'SECOND_HALF'; c.state.lastGoal = c.state.goals.at(-1)! },
    (c: MatchCheckpoint) => { delete c.state.events[0].metadata.rulesVersion },
  ]) {
    const broken = structuredClone(final); mutate(broken)
    const before = match.getState()
    assert.throws(() => match.restoreCheckpoint(broken), /dañada/)
    assert.equal(match.getState(), before)
  }
}

const mutations: ((copy: MatchCheckpoint) => void)[] = [
  c => { c.state.whiteGoals++ }, c => { c.goalSequence = 0 }, c => { c.state.elapsedSeconds = -1 },
  c => { c.state.goals[0].team = 'BLUE' }, c => { c.state.events[0].sequence = 99 },
  c => { c.goalLockRemainingMs = 9_000 }, c => { c.state.config!.goalLimit = 0 },
]
for (const mutate of mutations) {
  const broken = structuredClone(checkpoint); mutate(broken)
  const stateBefore = recovered.getState()
  assert.throws(() => recovered.restoreCheckpoint(broken), /dañada/)
  assert.equal(recovered.getState(), stateBefore)
}
const detached = engine.getCheckpoint(); detached.state.whiteGoals = 99
assert.equal(engine.getState().whiteGoals, 1, 'Exportar no entrega referencias mutables del motor')

class MemoryStorage implements KeyValueStorage {
  values = new Map<string, string>(); writes = 0
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value); this.writes++ }
}
const storage = new MemoryStorage()
const store = new ActiveMatchStore(storage, 'project-a', 'owner-a')
const copy: ActiveMatchCopy = { version: 1, id, ownerId: 'owner-a', testMode: false, players, checkpoint }
store.save({ ...copy, testMode: true }); assert.equal(storage.writes, 0)
store.save(copy)
assert.deepEqual(new ActiveMatchStore(storage, 'project-a', 'owner-a').load(), copy)
assert.equal(new ActiveMatchStore(storage, 'project-a', 'owner-b').load(), null)
assert.equal(new ActiveMatchStore(storage, 'project-b', 'owner-a').load(), null)
assert.throws(() => store.save({ ...copy, id: '00000000-0000-4000-8000-000000000011' }), /otro partido/)
store.clear('different-id'); assert.deepEqual(store.load(), copy)
const restoredEngine = new MatchEngine(() => now)
restoredEngine.restoreCheckpoint(checkpoint)
store.save({ ...copy, checkpoint: restoredEngine.getCheckpoint() })
assert.throws(() => store.save(copy), /otra pestaña/, 'Una copia antigua no pisa eventos nuevos')
const activeKey = 'project-a:active-match:v1:owner-a'
const previousRaw = storage.getItem(activeKey)
storage.values.set(activeKey, '{broken')
assert.throws(() => store.load(), /No se ha borrado/)
assert.throws(() => store.save(copy), /No se ha borrado/)
assert.equal(storage.getItem(activeKey), '{broken')
store.save({ ...copy, testMode: true }); assert.equal(storage.getItem(activeKey), '{broken')
storage.values.set(activeKey, previousRaw!)
assert.throws(() => store.save({ ...copy, ownerId: 'owner-b' }))

// Final result handoff: preserve recovery until write-ahead queue succeeds.
const final: ActiveMatchCopy = { ...copy, checkpoint: finalCopy }
store.clear(id); store.save(final)
let calls = 0
const saved = new Map<string, MatchDocument>()
const repository: MatchRepository = {
  async saveMatch(doc) { calls++; saved.set(doc.match.id, doc) },
  async getMatches() { return [] }, async getMatchById(matchId) { return saved.get(matchId)! },
}
const denied: KeyValueStorage = { getItem: () => null, setItem() { throw new Error('quota') } }
await assert.rejects(new SaveCoordinator(repository, denied, 'pending').save(beforeDocument), /quota/)
assert.equal(calls, 0); assert.deepEqual(store.load(), final)
const queue = new SaveCoordinator(repository, storage, 'pending')
assert.equal(await queue.save(beforeDocument), 'saved')
store.clear(id); assert.equal(store.load(), null)
assert.equal(saved.size, 1)
store.save(final)
const offlineRepository: MatchRepository = { ...repository, async saveMatch() { throw new Error('offline') } }
const offlineQueue = new SaveCoordinator(offlineRepository, storage, 'pending-offline')
assert.equal(await offlineQueue.save(beforeDocument), 'pending')
store.clear(id)
assert.equal(store.load(), null, 'La cola durable sustituye la copia activa, también sin Internet')
const reopenedQueue = new SaveCoordinator(repository, storage, 'pending-offline')
assert.equal(reopenedQueue.getPending()[0].match.id, id)
assert.deepEqual(await reopenedQueue.retry(), ['saved'])
assert.equal(reopenedQueue.getPending().length, 0)
assert.equal(saved.size, 1, 'El reintento conserva el ID y no duplica el resultado')
const deniedActive = new ActiveMatchStore(denied, 'project-a', 'owner-a')
assert.throws(() => deniedActive.save(copy), /quota/)

console.log('Recuperación: reloj, pausa, bloqueo, IDs, partes, prórroga, penaltis, validación, aislamiento, modo prueba y entrega final superados.')
