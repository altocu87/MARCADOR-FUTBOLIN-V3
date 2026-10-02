// Generated with an exact build allowlist. No runtime/API/user-data caching.
const CACHE_PREFIX = 'marcador-shell-v1-'
const CACHE_NAME = CACHE_PREFIX + __BUILD_VERSION__
const FILES = __PRECACHE_FILES__.map(path => new URL(path, self.registration.scope).href)
const HTML = new Set(FILES.filter(path => new URL(path).pathname.endsWith('.html')))
const ROOT = new URL('./', self.registration.scope).href
const INDEX = new URL('index.html', self.registration.scope).href

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME)
      // Protected Preview assets need this origin's access cookie. The exact
      // static allowlist excludes Auth/API/user data; reject login redirects.
      await cache.addAll(FILES.map(url => new Request(url, { cache: 'reload', credentials: 'same-origin', redirect: 'error' })))
    } catch (error) {
      await caches.delete(CACHE_NAME)
      throw error
    }
    // Never skipWaiting: new versions wait until the old app is closed.
  })())
})
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) await caches.delete(key)
    }
    await self.clients.claim()
  })())
})
self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('Authorization') || request.headers.has('Range')) return
  const clean = url.origin + url.pathname
  const key = request.mode === 'navigate' && clean === ROOT ? INDEX : clean
  const navigation = request.mode === 'navigate' && HTML.has(key)
  if (!navigation && (url.search || !FILES.includes(key))) return
  if (request.mode === 'navigate' && !navigation) return
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(key)
    return cached ?? fetch(request) // No dynamic writes, even on cache miss.
  })())
})
self.addEventListener('message', event => {
  if (event.data?.type !== 'CHECK_OFFLINE' || !event.ports[0]) return
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    const ready = (await Promise.all(FILES.map(url => cache.match(url)))).every(Boolean)
    event.ports[0].postMessage({ type: 'OFFLINE_STATUS', ready })
  })())
})
