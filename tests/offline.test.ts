import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import { inflateSync } from 'node:zlib'
import { renderServiceWorker, scoreboardIcon } from '../tooling/pwa'
import { ConnectionMonitor, probeConnection } from '../src/system/ConnectionMonitor'
import { OfflineIdentityStore } from '../src/services/persistence/OfflineIdentityStore'
import { SaveCoordinator } from '../src/services/persistence/SaveCoordinator'
import type { MatchDocument } from '../src/services/persistence/models'

// Execute the actual worker with fake browser primitives, not a separate policy copy.
const origin = 'https://marker.example'
const files = ['index.html', 'assets/app.js', 'assets/app.css', 'manifest.webmanifest']
const stores = new Map<string, Map<string, Response>>()
const handlers = new Map<string, (event: WorkerEvent) => void>()
let network = true, failInstall = false, claims = 0, skips = 0
interface WorkerEvent { request?: unknown; data?: unknown; ports?: unknown[]; waitUntil: (p: Promise<unknown>) => void; respondWith: (p: Promise<Response>) => void }
const cacheApi = {
  async open(key: string) {
    let entries = stores.get(key)
    if (!entries) { entries = new Map(); stores.set(key, entries) }
    return {
      async addAll(requests: Request[]) {
        for (const request of requests) {
          assert.equal(request.credentials, 'same-origin'); assert.equal(request.cache, 'reload')
          assert.equal(request.redirect, 'error', 'La precarga no sigue enlaces hacia una pantalla de acceso')
          assert.equal(new URL(request.url).origin, origin)
          assert.equal(request.headers.has('Authorization'), false, 'No añade tokens Supabase a la precarga')
          if (failInstall) throw new Error('incomplete install')
          entries.set(request.url, new Response('APP SHELL: ' + request.url))
        }
      },
      async match(url: string) { return entries.get(url)?.clone() },
    }
  },
  async keys() { return [...stores.keys()] },
  async delete(key: string) { return stores.delete(key) },
}
const installWorker = (version: string) => {
  runInNewContext(renderServiceWorker(files, version), {
    self: { registration: { scope: origin + '/' }, location: { origin }, clients: { async claim() { claims++ } },
      skipWaiting() { skips++ }, addEventListener(type: string, fn: (event: WorkerEvent) => void) { handlers.set(type, fn) } },
    caches: cacheApi, URL, Request, fetch: async () => { if (!network) throw new Error('offline'); return new Response('NETWORK ONLY') },
  })
}
async function lifecycle(type: string) {
  const promises: Promise<unknown>[] = []
  handlers.get(type)!({ waitUntil: p => { promises.push(p) }, respondWith() {} })
  await Promise.all(promises)
}
async function request(path: string, mode = 'cors', method = 'GET', authorization = false) {
  let response: Promise<Response> | null = null
  handlers.get('fetch')!({ request: { url: new URL(path, origin).href, mode, method, headers: new Headers(authorization ? { Authorization: 'test-only' } : {}) },
    waitUntil() {}, respondWith: p => { response = p } })
  return response ? (await response).text() : null
}
installWorker('one'); await lifecycle('install'); await lifecycle('activate')
assert.equal(claims, 1); assert.equal(skips, 0, 'No actualización forzada durante un partido')
assert.equal(stores.get('marcador-shell-v1-one')?.size, files.length)
network = false
assert.match((await request('/', 'navigate'))!, /APP SHELL/)
assert.match((await request('/?callback=not-cached', 'navigate'))!, /index.html/)
assert.match((await request('/assets/app.js'))!, /APP SHELL/)
for (const path of ['/connection.json', '/rest/v1/players', '/auth/v1/token', '/api/matches', '/.env', '/unknown', '/assets/app.js?token=private', 'https://supabase.example/rest/v1/matches']) assert.equal(await request(path), null, 'No interceptar ' + path)
assert.equal(await request('/assets/app.js', 'cors', 'POST'), null)
assert.equal(await request('/assets/app.js', 'cors', 'GET', true), null)
assert.equal(await request('/unknown', 'navigate'), null)
assert.equal(stores.get('marcador-shell-v1-one')?.size, files.length, 'No escrituras dinámicas')
let status: { ready: boolean } | undefined
const statusTasks: Promise<unknown>[] = []
handlers.get('message')!({ data: { type: 'CHECK_OFFLINE' }, ports: [{ postMessage(value: { ready: boolean }) { status = value } }], waitUntil: p => { statusTasks.push(p) }, respondWith() {} })
await Promise.all(statusTasks); assert.equal(status?.ready, true)
stores.set('other-application', new Map())
installWorker('two'); await lifecycle('install')
assert.ok(stores.has('marcador-shell-v1-one'), 'Instalar la actualización no borra el build en uso')
await lifecycle('activate')
assert.equal(stores.has('marcador-shell-v1-one'), false)
assert.equal(stores.has('other-application'), true)
failInstall = true; installWorker('broken'); await assert.rejects(lifecycle('install'), /incomplete/)
assert.equal(stores.has('marcador-shell-v1-broken'), false)
assert.ok(stores.has('marcador-shell-v1-two'), 'Fallo al actualizar conserva build anterior')

for (const size of [192, 512]) {
  const png = scoreboardIcon(size)
  assert.deepEqual([...png.subarray(0, 8)], [137,80,78,71,13,10,26,10])
  assert.equal(png.readUInt32BE(16), size); assert.equal(png.readUInt32BE(20), size)
  let offset = 8
  while (offset < png.length) {
    const length = png.readUInt32BE(offset), type = png.subarray(offset + 4, offset + 8).toString()
    if (type === 'IDAT') assert.equal(inflateSync(png.subarray(offset + 8, offset + 8 + length)).length, size * (size * 4 + 1))
    offset += length + 12
  }
}
let reachable = false
const monitor = new ConnectionMonitor(async () => reachable)
assert.equal(monitor.getSnapshot(), 'checking')
await monitor.check(); assert.equal(monitor.getSnapshot(), 'offline')
reachable = true; await monitor.check(); assert.equal(monitor.getSnapshot(), 'online')
monitor.disconnected(); assert.equal(monitor.getSnapshot(), 'offline')
let resolve: (value: boolean) => void = () => {}
const delayed = new ConnectionMonitor(() => new Promise<boolean>(done => { resolve = done }))
const checking = delayed.check(); delayed.disconnected(); resolve(true); await checking
assert.equal(delayed.getSnapshot(), 'offline', 'Una respuesta antigua no invierte un evento offline posterior')

// The web probe needs the Preview's own access cookie, never a Supabase token.
const originalFetch = globalThis.fetch
try {
  globalThis.fetch = async (input, init) => {
    assert.equal(input, '/connection.json')
    assert.equal(init?.credentials, 'same-origin')
    assert.equal(init?.cache, 'no-store')
    assert.equal(init?.redirect, 'error')
    assert.ok(init?.signal instanceof AbortSignal)
    assert.equal(new Headers(init?.headers).has('Authorization'), false)
    return new Response(JSON.stringify({ application: 'marcador-futbolin-v3' }))
  }
  assert.equal(await probeConnection(), true, 'Sonda usa cookies únicamente del propio origen')
  for (const response of [new Response(JSON.stringify({ application: 'other' })), new Response(JSON.stringify({ application: 'marcador-futbolin-v3' }), { status: 401 })]) {
    globalThis.fetch = async () => response
    assert.equal(await probeConnection(), false, 'Respuesta ajena/no autorizada no equivale a conexión')
  }
  for (const response of [new Response('<h1>Login required</h1>'), null]) {
    globalThis.fetch = async () => { if (!response) throw new TypeError('Redirect blocked'); return response }
    const rejected = new ConnectionMonitor(probeConnection)
    await rejected.check()
    assert.equal(rejected.getSnapshot(), 'offline', 'HTML/redirect/error no habilita acceso')
  }
} finally { globalThis.fetch = originalFetch }

const values = new Map<string, string>()
const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
const identity = new OfflineIdentityStore(storage, 'project')
identity.remember({ id: 'account-one', email: 'never-cache-this@example.invalid' })
assert.equal(identity.load()?.id, 'account-one')
assert.equal(JSON.stringify([...values.values()]).includes('@'), false)
assert.equal(new OfflineIdentityStore(storage, 'other-project').load(), null)
identity.forget(); assert.equal(identity.load(), null)
values.set('project:offline-owner:v1', '{broken')
assert.throws(() => identity.load())
assert.equal(values.get('project:offline-owner:v1'), '{broken')

// Observer failures must not change durability or idempotency of the existing queue.
const document = { match: { id: 'stable-id', test_mode: false }, participants: [], events: [] } as unknown as MatchDocument
let calls = 0
const coordinator = new SaveCoordinator({ async saveMatch() { calls++ }, async getMatches() { return [] }, async getMatchById() { return document } }, storage, 'pending')
const notifications: (string | undefined)[] = []
const stop = coordinator.subscribe(savedId => notifications.push(savedId))
coordinator.subscribe(() => { throw new Error('bad UI observer') })
assert.equal(await coordinator.save(document), 'saved'); assert.equal(calls, 1)
assert.deepEqual(notifications, [undefined, 'stable-id']); assert.equal(coordinator.getPending().length, 0)
stop(); await coordinator.save({ ...document, match: { ...document.match, test_mode: true } })
assert.equal(calls, 1); assert.equal(notifications.length, 2)
console.log('Offline: worker real, allowlist, privacidad, navegación sin red, actualización segura, iconos, alcance de identidad, conectividad y cola superados.')
