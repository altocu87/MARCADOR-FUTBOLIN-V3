import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePlayerName, validatePlayerName } from '../src/domain/Player'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { LocalRepository, STORAGE_KEY, StorageConflictError, parseLocalData, type MatchSession, type StoragePort } from '../src/services/persistence/LocalRepository'

class MemoryStorage implements StoragePort {
  value: string | null = null
  fail = false
  getItem() { return this.value }
  setItem(_key: string, value: string) {
    if (this.fail) throw new Error('QuotaExceededError')
    this.value = value
  }
}
const players = [
  { id: 'ana', name: 'Ana', tint: '#ea7c6c' },
  { id: 'luis', name: 'Luis', tint: '#69a8e9' },
]
const config = { mode: 'QUICK' as const, victoryCondition: 'BOTH' as const, goalLimit: 5, halfDurationMinutes: 5 }
function fixture() {
  const storage = new MemoryStorage()
  const repository = new LocalRepository(storage)
  const engine = new MatchEngine(() => 1000, () => 'flash')
  engine.createMatch(config)
  engine.skipCountdown()
  const session: MatchSession = { id: 'match-1', startedAt: 1000, players, checkpoint: engine.exportCheckpoint() }
  return { storage, repository, engine, session }
}

test('normaliza nombres y rechaza vacíos, duplicados y nombres largos', () => {
  assert.equal(normalizePlayerName('  Ana   María  '), 'Ana María')
  assert.equal(normalizePlayerName('Jose\u0301'), 'José')
  assert.ok(validatePlayerName('Jose\u0301', [{ id: 'jose', name: 'José', tint: '#ffffff' }]))
  assert.ok(validatePlayerName('   ', players))
  assert.ok(validatePlayerName('  ANA ', players))
  assert.ok(validatePlayerName('x'.repeat(33), players))
  assert.equal(validatePlayerName('ANA', players, 'ana'), null)
})

test('crea y edita jugadores, conservándolos en una instancia nueva', () => {
  const { repository, storage } = fixture()
  repository.savePlayer({ ...players[0], name: '  Ana  ' })
  repository.savePlayer(players[1])
  repository.savePlayer({ ...players[0], name: 'Ana María' })
  assert.deepEqual(new LocalRepository(storage).read().players.map((player) => player.name), ['Ana María', 'Luis'])
  assert.throws(() => repository.savePlayer({ id: 'other', name: 'ANA MARÍA', tint: '#ffffff' }), /Ya existe/)
  const copy = repository.read()
  copy.players[0].name = 'Mutado'
  assert.equal(repository.read().players[0].name, 'Ana María')
})

test('guarda participantes, goles y datos de recuperación sin compartir referencias', () => {
  const { repository, engine, storage, session } = fixture()
  engine.dispatch('GOL_BLANCO')
  session.checkpoint = engine.exportCheckpoint()
  repository.saveSession(session)
  session.players = [{ ...players[0], name: 'Alterado' }, players[1]]
  const loaded = new LocalRepository(storage).read().active!
  assert.equal(loaded.players[0].name, 'Ana')
  assert.equal(loaded.checkpoint.state.whiteGoals, 1)
  assert.equal(loaded.checkpoint.undoStack.length, 1)
})

test('archiva una sola vez y conserva los nombres aunque se edite el jugador', () => {
  const { repository, engine, storage, session } = fixture()
  repository.savePlayer(players[0])
  engine.dispatch('FORZAR_PRORROGA')
  engine.skipCountdown()
  engine.dispatch('GOL_BLANCO')
  session.checkpoint = engine.exportCheckpoint()
  repository.saveSession(session, 2000)
  repository.saveSession(session, 3000)
  repository.savePlayer({ ...players[0], name: 'Ana nueva' })
  const loaded = new LocalRepository(storage).read()
  assert.equal(loaded.history.length, 1)
  assert.equal(loaded.history[0].finishedAt, 2000)
  assert.equal(loaded.history[0].players[0].name, 'Ana')
  assert.equal(loaded.players[0].name, 'Ana nueva')
  repository.clearCompleted()
  assert.equal(repository.read().active, null)
  assert.equal(repository.read().history.length, 1)
})

test('no permite borrar ni sustituir un partido pendiente', () => {
  const { repository, session } = fixture()
  repository.saveSession(session)
  assert.throws(() => repository.clearCompleted(), /pendiente/)
  assert.throws(() => repository.saveSession({ ...session, id: 'another' }), /pendiente/)
})

test('no permite reabrir un resultado que ya está archivado', () => {
  const { repository, engine, session } = fixture()
  const before = engine.exportCheckpoint()
  engine.dispatch('FORZAR_PRORROGA'); engine.skipCountdown(); engine.dispatch('GOL_BLANCO')
  repository.saveSession({ ...session, checkpoint: engine.exportCheckpoint() }, 2000)
  assert.throws(() => repository.saveSession({ ...session, checkpoint: before }), /finalizado/)
})

test('un resultado ya archivado no permite cambiar sus participantes', () => {
  const { repository, engine, session } = fixture()
  engine.dispatch('FORZAR_PRORROGA'); engine.skipCountdown(); engine.dispatch('GOL_BLANCO')
  session.checkpoint = engine.exportCheckpoint()
  repository.saveSession(session, 2000)
  assert.throws(() => repository.saveSession({ ...session, players: [{ ...players[0], name: 'Otro' }, players[1]] }), /no puede cambiar/)
})

test('rechaza estados y equipos malformados antes de escribir', () => {
  const { repository, session, storage } = fixture()
  const malformed = structuredClone(session)
  malformed.checkpoint.state.whiteGoals = 7
  assert.throws(() => repository.saveSession(malformed), /no válido/)
  assert.throws(() => repository.saveSession({ ...session, players: [players[0], players[0]] }), /no válido/)
  assert.throws(() => repository.saveSession({ ...session, players: [...players, { id: 'third', name: 'Eva', tint: '#ffffff' }] }), /no válido/)
  assert.throws(() => repository.saveSession({ ...session, startedAt: Number.MAX_SAFE_INTEGER }), /no válido/)
  assert.equal(storage.value, null)
})

test('conserva datos corruptos o de versiones desconocidas y bloquea sobrescrituras', () => {
  for (const raw of ['{broken', '{}', JSON.stringify({ version: 99, players: [], active: null, history: [] })]) {
    const storage = new MemoryStorage()
    storage.value = raw
    const repository = new LocalRepository(storage)
    assert.ok(repository.loadError)
    assert.throws(() => repository.savePlayer(players[0]))
    assert.equal(storage.value, raw)
  }
})

test('rechaza una copia manipulada sin perder el documento anterior', () => {
  const { repository, session, storage } = fixture()
  repository.saveSession(session)
  const data = JSON.parse(storage.value!)
  data.active.checkpoint.state.remainingSeconds = -3
  assert.throws(() => parseLocalData(JSON.stringify(data)))
  data.active.checkpoint.state.remainingSeconds = 300
  data.active.checkpoint.state.config.halfDurationMinutes = '5'
  assert.throws(() => parseLocalData(JSON.stringify(data)))
})

test('un fallo de escritura deja intactos los datos y permite reintentar', () => {
  const { repository, storage } = fixture()
  repository.savePlayer(players[0])
  const before = storage.value
  storage.fail = true
  assert.throws(() => repository.savePlayer(players[1]), /Quota/)
  assert.equal(storage.value, before)
  assert.equal(repository.read().players.length, 1)
  storage.fail = false
  repository.savePlayer(players[1])
  assert.equal(repository.read().players.length, 2)
})

test('detecta escrituras desde otra pestaña y no pisa sus datos', () => {
  const storage = new MemoryStorage()
  const first = new LocalRepository(storage)
  const second = new LocalRepository(storage)
  first.savePlayer(players[0])
  const before = storage.value
  assert.throws(() => second.savePlayer(players[1]), StorageConflictError)
  assert.equal(storage.value, before)
  assert.equal(new LocalRepository(storage).read().players.length, 1)
})

test('maneja almacenamiento ausente y errores de lectura sin lanzar durante el arranque', () => {
  const repository = new LocalRepository(null)
  assert.ok(repository.loadError)
  assert.throws(() => repository.savePlayer(players[0]))
  const denied = new LocalRepository({ getItem() { throw new Error('SecurityError') }, setItem() {} })
  assert.ok(denied.loadError)
  assert.equal(STORAGE_KEY, 'marcador-futbolin-v3:local:v1')
})
