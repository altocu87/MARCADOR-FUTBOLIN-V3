import assert from 'node:assert/strict'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { mapMatch, participantsFor } from '../src/services/persistence/mapMatch'
import { activePlayers, type MatchDocument, type Player } from '../src/services/persistence/models'
import { SaveCoordinator, type KeyValueStorage } from '../src/services/persistence/SaveCoordinator'
import type { MatchRepository } from '../src/services/persistence/MatchRepository'

const players: Player[] = [1, 2, 3, 4].map(n => ({ id: `00000000-0000-4000-8000-00000000000${n}`, name: `Jugador ${n}`, nickname: null, photoUrl: null, active: true, level: 0 }))
assert.deepEqual(participantsFor(players.slice(0, 2)).map(p => [p.team, p.position]), [['WHITE', 1], ['BLUE', 1]])
assert.deepEqual(participantsFor(players).map(p => [p.team, p.position]), [['WHITE', 1], ['BLUE', 1], ['WHITE', 2], ['BLUE', 2]])
for (const invalid of [[], players.slice(0, 3), [players[0], players[0]], [{ ...players[0], active: false }, players[1]]]) assert.throws(() => participantsFor(invalid))
assert.equal(activePlayers([...players, { ...players[0], active: false }]).length, 4)

let now = Date.parse('2026-10-01T00:00:00Z')
const engine = new MatchEngine(() => now, () => 'flash')
engine.createMatch({ mode: 'QUICK', victoryCondition: 'GOALS', goalLimit: 2, halfDurationMinutes: 1 })
assert.throws(() => mapMatch(engine.getState(), players, 'unfinished', false))
engine.skipCountdown()
now += 61_000; engine.tick()
assert.equal(engine.getState().status, 'PLAYING', 'Modo GOALS no termina por tiempo')
engine.dispatch('GOL_BLANCO'); now += 3_001
engine.dispatch('GOL_AZUL'); engine.dispatch('DESHACER')
assert.equal(engine.getState().elapsedSeconds, 64, 'Deshacer no retrocede reloj')
engine.dispatch('QUITAR_GOL_BLANCO')
engine.dispatch('PAUSA'); now += 10_000; engine.dispatch('CONTINUAR')
engine.dispatch('GOL_BLANCO'); now += 3_001; engine.dispatch('GOL_BLANCO')
assert.equal(engine.getState().status, 'MATCH_END', 'El primer equipo en llegar al objetivo termina el partido')
const document = mapMatch(engine.getState(), players, '00000000-0000-4000-8000-000000000010', false)
assert.equal(document.match.white_score, 2)
assert.equal(document.match.blue_score, 0)
assert.equal(document.match.winner_team, 'WHITE')
assert.equal(document.participants.length, 4)
assert.equal(document.events.at(-1)?.event_type, 'match_end')
assert.ok(['goal', 'undo', 'score_correction', 'pause', 'resume', 'period_start'].every(type => document.events.some(e => e.event_type === type)))
assert.ok(document.events.every(e => e.period === 'FIRST_HALF' && e.event_type !== 'period_end'))
assert.equal(document.events[0].metadata.rulesVersion, 2)
document.events.forEach((e, i) => {
  assert.equal(e.sequence, i + 1)
  if (i) assert.ok(e.match_time_seconds >= document.events[i - 1].match_time_seconds)
})
assert.equal(document.events.filter(e => e.event_type === 'goal').length, 4, 'La cronología conserva los goles anulados')
assert.ok(document.events.every(e => !('player_id' in e)), 'Los goles pertenecen al equipo')
const renamed = players.map(p => ({ ...p, name: 'Nuevo nombre' }))
assert.notEqual(document.participants[0].player_name, participantsFor(renamed)[0].player_name)

const tie = new MatchEngine(() => now)
tie.createMatch({ mode: 'QUICK', victoryCondition: 'TIME', goalLimit: 5, halfDurationMinutes: 1 })
tie.skipCountdown(); now += 60_000; tie.tick(); tie.continueToNextPeriod()
tie.skipCountdown(); now += 60_000; tie.tick(); tie.continueToNextPeriod()
assert.equal(tie.getState().period, 'EXTRA_TIME')
tie.skipCountdown(); now += 60_000; tie.tick(); tie.continueToNextPeriod()
assert.equal(tie.getState().status, 'PENALTIES')
for (let i = 0; i < 5; i++) { tie.dispatch('PENALTI_BLANCO_GOL'); tie.dispatch(i === 4 ? 'PENALTI_AZUL_FALLO' : 'PENALTI_AZUL_GOL') }
assert.equal(tie.getState().status, 'MATCH_END', 'Tanda 5–4 termina sin exigir muerte súbita')
const penalties = mapMatch(tie.getState(), players.slice(0, 2), 'penalties', false)
assert.equal(penalties.match.winner_team, 'WHITE')
assert.equal(penalties.match.white_score, 0)
assert.equal(penalties.match.penalty_white_score, 5)
assert.equal(penalties.match.went_to_extra_time, true)
assert.equal(penalties.events.filter(e => e.event_type === 'penalty').length, 10)

class MemoryStorage implements KeyValueStorage {
  values = new Map<string, string>(); writes = 0
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.writes++; this.values.set(key, value) }
}
let calls = 0; let offline = true
const saved = new Map<string, MatchDocument>()
const repo: MatchRepository = {
  async saveMatch(doc) { calls++; if (offline) throw new Error('offline'); saved.set(doc.match.id, doc) },
  async getMatches() { return [] }, async getMatchById(id) { return saved.get(id)! },
}
const storage = new MemoryStorage()
const queue = new SaveCoordinator(repo, storage, 'owner-1')
assert.equal(await queue.save({ ...document, match: { ...document.match, test_mode: true } }), 'test')
assert.equal(calls, 0); assert.equal(storage.writes, 0, 'Prueba no escribe ni siquiera cola local')
assert.equal(await queue.save(document), 'pending')
assert.equal(queue.getPending().length, 1)
assert.deepEqual(queue.getPending()[0], document, 'Fallo conserva agregado completo')
assert.equal(new SaveCoordinator(repo, storage, 'owner-2').getPending().length, 0, 'Colas aisladas por cuenta')
offline = false
assert.deepEqual(await queue.retry(), ['saved'])
assert.equal(queue.getPending().length, 0); assert.equal(saved.size, 1)
const before = calls
await Promise.all([queue.save(document), queue.save(document)])
assert.equal(calls, before + 1, 'Deduplicación de guardados simultáneos')
storage.values.set('owner-1', '[{"broken":true}]')
await assert.rejects(queue.save(document), /No se ha sobrescrito/)
assert.equal(storage.values.get('owner-1'), '[{"broken":true}]')
const deniedStorage: KeyValueStorage = { getItem: () => null, setItem: () => { throw new Error('quota') } }
const beforeDenied = calls
await assert.rejects(new SaveCoordinator(repo, deniedStorage, 'denied').save(document), /quota/)
assert.equal(calls, beforeDenied, 'No se solicita guardar sin copia local segura')
// A reload uses a new coordinator with exactly the persisted aggregate.
const recoveryStorage = new MemoryStorage()
const secondDocument: MatchDocument = { ...document, match: { ...document.match, id: '00000000-0000-4000-8000-000000000011' } }
offline = true
const initialQueue = new SaveCoordinator(repo, recoveryStorage, 'project-a:owner-a')
await initialQueue.save(document); await initialQueue.save(secondDocument)
const recoveredQueue = new SaveCoordinator(repo, recoveryStorage, 'project-a:owner-a')
assert.deepEqual(recoveredQueue.getPending(), [document, secondDocument], 'Recarga conserva dos agregados completos')
assert.equal(new SaveCoordinator(repo, recoveryStorage, 'project-b:owner-a').getPending().length, 0, 'Aislamiento también por proyecto')
assert.deepEqual(await recoveredQueue.retry(), ['pending', 'pending'])
assert.equal(recoveredQueue.getPending().length, 2, 'Reintentar sin red no pierde ni duplica resultados')

const partialRepo: MatchRepository = { ...repo, async saveMatch(doc) {
  if (doc.match.id === document.match.id) throw new Error('Sesión o red no disponible')
  saved.set(doc.match.id, doc)
} }
assert.deepEqual(await new SaveCoordinator(partialRepo, recoveryStorage, 'project-a:owner-a').retry(), ['pending', 'saved'])
assert.deepEqual(recoveredQueue.getPending(), [document], 'Un fallo no impide recuperar otro resultado')
offline = false
assert.deepEqual(await recoveredQueue.retry(), ['saved'])
assert.equal(recoveredQueue.getPending().length, 0)

// Out-of-order acknowledgements must remove only their own match.
const concurrentStorage = new MemoryStorage()
const complete = new Map<string, () => void>()
const delayedRepo: MatchRepository = { ...repo, saveMatch(doc) {
  return new Promise<void>(resolve => complete.set(doc.match.id, resolve))
} }
const concurrentQueue = new SaveCoordinator(delayedRepo, concurrentStorage, 'concurrent')
const firstSave = concurrentQueue.save(document)
const secondSave = concurrentQueue.save(secondDocument)
assert.equal(concurrentQueue.getPending().length, 2, 'Ambas copias existen antes de confirmar la red')
complete.get(secondDocument.match.id)!()
assert.equal(await secondSave, 'saved')
assert.deepEqual(concurrentQueue.getPending(), [document])
complete.get(document.match.id)!()
assert.equal(await firstSave, 'saved')
assert.equal(concurrentQueue.getPending().length, 0)

// An unresponsive request releases the UI; late success never destroys recovery.
const timeoutStorage = new MemoryStorage()
let acknowledgeLate: () => void = () => { throw new Error('Petición no iniciada') }
const hangingRepo: MatchRepository = { ...repo, saveMatch() { return new Promise<void>(resolve => { acknowledgeLate = resolve }) } }
const timedQueue = new SaveCoordinator(hangingRepo, timeoutStorage, 'timeout', 5)
assert.equal(await timedQueue.save(document), 'pending', 'Petición colgada finaliza como pendiente')
assert.deepEqual(timedQueue.getPending(), [document])
acknowledgeLate(); await Promise.resolve()
assert.deepEqual(timedQueue.getPending(), [document], 'Respuesta tardía deja copia para reintento idempotente')
assert.deepEqual(await new SaveCoordinator(repo, timeoutStorage, 'timeout').retry(), ['saved'])
assert.equal(timedQueue.getPending().length, 0)
assert.throws(() => new SaveCoordinator(repo, timeoutStorage, 'invalid', 0), /positivo/)

// If the server acknowledges but local cleanup fails, retain the original copy.
const cleanupValues = new MemoryStorage()
let cleanupWrites = 0
const cleanupStorage: KeyValueStorage = {
  getItem: key => cleanupValues.getItem(key),
  setItem(key, value) { if (++cleanupWrites === 2) throw new Error('quota al limpiar'); cleanupValues.setItem(key, value) },
}
const cleanupQueue = new SaveCoordinator(repo, cleanupStorage, 'cleanup')
await assert.rejects(cleanupQueue.save(document), /quota al limpiar/)
assert.deepEqual(cleanupQueue.getPending(), [document])
assert.deepEqual(await cleanupQueue.retry(), ['saved'], 'Reintenta sin duplicar tras confirmación remota y fallo local')

console.log('Persistencia: mapeo, equipos, cronología, penaltis, modo prueba, recuperación offline, concurrencia, timeout e aislamiento superados.')
