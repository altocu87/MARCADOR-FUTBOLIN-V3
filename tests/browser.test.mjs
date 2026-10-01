import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

// Built application + isolated in-memory fixture. Never registers an account
// or writes to Supabase. Each case gets its own browser storage/session.
const base = 'http://127.0.0.1:5197'
const fixture = base + '/tests/ui-fixture.html'
let browser, server
async function startServer() {
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'tmp/pwa-test', '--host', '127.0.0.1', '--port', '5197', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] })
  let output = ''
  server.stdout.on('data', data => { output += data })
  server.stderr.on('data', data => { output += data })
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Preview no preparado: ' + output)), 10_000)
    server.once('exit', code => { clearTimeout(timer); reject(new Error('Preview terminó: ' + code + ' ' + output)) })
    server.stdout.on('data', () => { if (output.includes(base)) { clearTimeout(timer); resolve() } })
  })
  await ready
  assert.equal((await fetch(base + '/connection.json')).ok, true)
}
async function stopServer() {
  const child = server
  server = null
  if (!child || child.exitCode !== null) return
  const closed = new Promise(resolve => child.once('exit', resolve))
  child.kill('SIGTERM')
  await closed
}
before(async () => {
  await startServer()
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined)
  browser = await chromium.launch({ executablePath, headless: true })
})
after(async () => { await browser?.close(); await stopServer() })

async function withPage(action) {
  const context = await browser.newContext({ viewport: { width: 800, height: 480 } })
  const errors = []
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
  // Prevent accidental real data traffic even if public variables are provided.
  await context.route('https://**.supabase.co/**', route => route.abort())
  const page = await context.newPage()
  page.setDefaultTimeout(10_000)
  try { await action(page, context); assert.deepEqual(errors, [], 'Sin errores de ejecución de la app') }
  finally { await context.close() }
}
async function visible(page, text) { await page.getByText(text, { exact: true }).waitFor({ state: 'visible' }) }
async function settings(page) { await page.getByRole('button', { name: 'AJUSTES', exact: true }).click() }
async function realMode(page) {
  await settings(page)
  await page.getByRole('button', { name: 'ON · NO GUARDAR PARTIDOS', exact: true }).click()
  await page.getByRole('button', { name: 'NUEVO PARTIDO', exact: true }).click()
}
async function selection(page, count = 2, goalLimit = 1) {
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
  await page.getByRole('button', { name: /POR GOLES/ }).click()
  for (let i = 5; i > goalLimit; i--) await page.getByRole('button', { name: 'Reducir GOLES POR PARTE' }).click()
  await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
  for (let i = 0; i < count; i++) await page.locator('.player-card').nth(i).click()
}
async function start(page) {
  await page.getByRole('button', { name: /COMENZAR/ }).click()
  await page.getByRole('button', { name: /PREPARADOS/ }).click()
}
async function whiteGoal(page) {
  const button = page.getByRole('button', { name: /BLANCO \d+ TOCAR PARA GOL/ })
  await page.waitForFunction(() => !document.querySelector('.white-score')?.disabled)
  await button.click()
}
async function finish(page) {
  await whiteGoal(page)
  await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).click()
  await page.getByRole('button', { name: /PREPARADOS/ }).click()
  await whiteGoal(page)
  await page.getByRole('button', { name: 'VER RESULTADO ›' }).click()
  await visible(page, 'FINAL DEL PARTIDO')
}
async function noOverflow(page) {
  // Resize events update React's visual viewport state on the next frame.
  await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight), true, 'Sin scroll general')
}
async function matchStorage(page) {
  return page.evaluate(() => Object.keys(localStorage).filter(key => key.includes(':active-match:') || key.includes(':pending:')).map(key => [key, localStorage.getItem(key)]))
}

test('build sin sesión: navegación responsive y preferencia física persistente', async () => withPage(async page => {
  await page.goto(base)
  for (const [width, height] of [[390, 844], [800, 480], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height })
    await settings(page)
    await page.getByRole('textbox', { name: 'Correo' }).waitFor()
    await noOverflow(page)
  }
  await page.getByRole('button', { name: 'PANTALLA 800×480' }).click()
  const box = await page.locator('.physical-canvas').boundingBox()
  assert.deepEqual({ width: box.width, height: box.height, x: box.x, y: box.y }, { width: 800, height: 480, x: 320, y: 210 })
  await page.reload()
  await page.locator('.physical-canvas').waitFor()
  await noOverflow(page)
}))

test('modo prueba: partido completo sin cola ni checkpoint', async () => withPage(async page => {
  await page.goto(fixture)
  await selection(page)
  await start(page)
  await finish(page)
  await visible(page, 'MODO PRUEBA · NO SE HA GUARDADO NADA')
  assert.deepEqual(await matchStorage(page), [])
  await page.getByRole('button', { name: 'RANKING', exact: true }).click()
  await visible(page, 'No hay partidos guardados.')
}))

test('2v2: selección exacta, bloqueo, recarga en pausa y misma identidad del partido', async () => withPage(async page => {
  await page.goto(fixture)
  await realMode(page)
  await selection(page, 3, 3)
  assert.equal(await page.getByRole('button', { name: /COMENZAR/ }).isDisabled(), true)
  await page.locator('.player-card').nth(3).click()
  await start(page)
  await whiteGoal(page)
  assert.equal(await page.locator('.blue-score').isDisabled(), true)
  const original = await page.evaluate(() => JSON.parse(localStorage.getItem('marcador-ui-fixture:active-match:v1:fixture')))
  await page.reload()
  await visible(page, 'PARTIDO POR RECUPERAR')
  await page.getByRole('button', { name: 'RECUPERAR PARTIDO', exact: true }).click()
  await page.locator('.pause-overlay').waitFor()
  assert.equal(await page.locator('.white-score strong').textContent(), '1')
  const recovered = await page.evaluate(() => JSON.parse(localStorage.getItem('marcador-ui-fixture:active-match:v1:fixture')))
  assert.equal(recovered.id, original.id)
  assert.equal(recovered.checkpoint.state.elapsedSeconds, original.checkpoint.state.elapsedSeconds)
  assert.equal(recovered.players.length, 4)
  for (const [width, height] of [[390, 844], [844, 390], [800, 480]]) {
    await page.setViewportSize({ width, height })
    await noOverflow(page)
    assert.equal(await page.locator('.white-score strong').textContent(), '1')
  }
}))

test('resultado pendiente: recarga, reintento automático, historial sin duplicados', async () => withPage(async page => {
  await page.goto(fixture + '?save=offline')
  await realMode(page)
  await selection(page)
  await start(page)
  await finish(page)
  await page.getByText(/PENDIENTE EN ESTE DISPOSITIVO/).first().waitFor()
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('marcador-ui-fixture:pending:v1:fixture')).length), 1)
  assert.equal(await page.evaluate(() => localStorage.getItem('marcador-ui-fixture:active-match:v1:fixture')), '')
  await page.goto(fixture)
  await page.waitForFunction(() => localStorage.getItem('marcador-ui-fixture:pending:v1:fixture') === '[]')
  await page.getByRole('button', { name: 'RANKING', exact: true }).click()
  await page.locator('.history-list button').waitFor()
  assert.equal(await page.locator('.history-list button').count(), 1)
  await page.locator('.history-list button').click()
  await visible(page, 'DETALLE DEL PARTIDO')
  assert.equal(await page.locator('.event-list > div').count(), 7)
}))

function metric(page, label) { return page.locator('.statistics-grid > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd') }
async function profile(page, name) {
  await page.getByRole('button', { name: 'RANKING', exact: true }).click()
  await page.getByRole('button', { name: 'ESTADÍSTICAS', exact: true }).click()
  await page.locator('.statistics-players button').filter({ hasText: name }).click()
  await page.locator('.statistics-grid').waitFor()
}
test('perfil tras guardado/reintento: perspectiva, edición y snapshot histórico', async () => withPage(async page => {
  await page.goto(fixture)
  await realMode(page); await selection(page, 4); await start(page); await finish(page)
  await page.getByText('PARTIDO GUARDADO EN SUPABASE', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'REINTENTAR GUARDADO' }).click()
  await profile(page, 'BLANCO DOS')
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '1')
  assert.equal(await metric(page, 'VICTORIAS').textContent(), '1')
  assert.equal(await metric(page, 'GOLES A FAVOR').textContent(), '2')
  await page.getByRole('button', { name: 'JUGADORES', exact: true }).click()
  await page.locator('.statistics-players button').filter({ hasText: 'AZUL DOS' }).click()
  await page.locator('.statistics-grid').waitFor()
  assert.equal(await metric(page, 'DERROTAS').textContent(), '1')
  assert.equal(await metric(page, 'GOLES EN CONTRA').textContent(), '2')
  await settings(page)
  await page.getByRole('button', { name: 'JUGADORES', exact: true }).click()
  const row = page.locator('.player-list-row').filter({ hasText: 'AZUL DOS' })
  await row.getByRole('button', { name: 'EDITAR', exact: true }).click()
  await page.getByRole('textbox', { name: 'Alias', exact: true }).fill('AZUL RENOMBRADO')
  await page.getByRole('button', { name: 'GUARDAR JUGADOR' }).click()
  await page.locator('.player-list-row').filter({ hasText: 'AZUL RENOMBRADO' }).getByRole('button', { name: 'PERFIL' }).click()
  await page.locator('.statistics-grid').waitFor()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '1')
  await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).click()
  await page.locator('.history-list button').waitFor()
  assert.equal(await page.locator('.history-list button').count(), 1)
  assert.match(await page.locator('.history-list button').textContent(), /AZUL DOS/)
  await page.locator('.history-list button').click()
  await visible(page, 'DETALLE DEL PARTIDO')
  assert.match(await page.locator('.history-summary').textContent(), /BLANCO UNO.*AZUL UNO.*BLANCO DOS.*AZUL DOS/)
}))

test('perfil completo: 25 resultados, inactivos, penaltis, historial paginado y ambas vistas', async () => withPage(async page => {
  await page.goto(fixture + '?statistics=seed')
  await profile(page, 'AZUL DOS')
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '25')
  assert.equal(await metric(page, 'VICTORIAS').textContent(), '2')
  assert.equal(await metric(page, 'DERROTAS').textContent(), '23')
  assert.equal(await metric(page, 'GOLES A FAVOR').textContent(), '3')
  assert.equal(await metric(page, 'GOLES EN CONTRA').textContent(), '48')
  assert.equal(await metric(page, 'VICTORIAS %').textContent(), '8%')
  for (const [width, height] of [[390, 844], [800, 480], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height }); await noOverflow(page)
  }
  await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).click()
  await page.locator('.history-list button').first().waitFor()
  assert.equal(await page.locator('.history-list button').count(), 20)
  await page.getByRole('button', { name: 'SIGUIENTES' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.history-list button').length === 5)
  await page.getByRole('button', { name: 'VOLVER AL PERFIL' }).click()
  await page.locator('.statistics-grid').waitFor()
  await page.getByRole('button', { name: 'JUGADORES', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Buscar jugador' }).fill('SIN PARTIDOS')
  await page.locator('.statistics-players button').click()
  await visible(page, 'No hay partidos guardados para este jugador.')
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '0')
  await settings(page)
  await page.getByRole('button', { name: 'PANTALLA 800×480' }).click()
  await profile(page, 'AZUL DOS')
  await page.locator('.physical-canvas').waitFor(); await noOverflow(page)
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '25')
  const historyButton = await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).boundingBox()
  assert.ok(historyButton.y + historyButton.height <= await page.locator('.app-content').evaluate(el => el.getBoundingClientRect().bottom), 'Historial accesible sin desplazar los controles')
  await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).click()
  await page.locator('.history-list button').first().waitFor()
  await noOverflow(page)
}))

test('perfil con error o sin red: no mostrar ceros como datos reales', async () => withPage(async (page, context) => {
  await page.goto(fixture + '?statistics=error')
  await page.getByRole('button', { name: 'RANKING', exact: true }).click()
  await page.getByRole('button', { name: 'ESTADÍSTICAS', exact: true }).click()
  await page.locator('.statistics-players button').filter({ hasText: 'BLANCO UNO' }).click()
  await page.getByText(/Error de consulta simulado/).first().waitFor()
  assert.equal(await page.locator('.statistics-grid').count(), 0)
  await context.setOffline(true)
  await page.waitForFunction(() => document.querySelector('.system-status')?.textContent.includes('SIN CONEXIÓN'))
  await page.getByText(/Las estadísticas necesitan consultar/).waitFor()
  assert.equal(await page.locator('.statistics-grid').count(), 0)
}))

test('PWA real: servidor apagado, reapertura y recuperación offline', async () => withPage(async (page, context) => {
  await page.goto(fixture + '?network=real')
  await realMode(page)
  await settings(page)
  await visible(page, 'OFFLINE DISPONIBLE EN ESTE DISPOSITIVO')
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  await page.getByRole('button', { name: 'NUEVO PARTIDO', exact: true }).click()
  await selection(page, 2, 3)
  await start(page)
  await whiteGoal(page)
  await stopServer()
  await page.close()
  try {
    const reopened = await context.newPage()
    await reopened.goto(fixture + '?network=real')
    await visible(reopened, 'PARTIDO POR RECUPERAR')
    await reopened.getByRole('button', { name: 'RECUPERAR PARTIDO', exact: true }).click()
    await reopened.locator('.pause-overlay').waitFor()
    assert.equal(await reopened.locator('.white-score strong').textContent(), '1')
    await noOverflow(reopened)
  } finally { await startServer() }
}))
