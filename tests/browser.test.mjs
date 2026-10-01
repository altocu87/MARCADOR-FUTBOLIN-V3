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
async function selection(page, count = 2, goalLimit = 2) {
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
  await page.getByRole('button', { name: /POR GOLES/ }).click()
  for (let i = 5; i > goalLimit; i--) await page.getByRole('button', { name: 'Reducir GOLES PARA GANAR' }).click()
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
  await whiteGoal(page)
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

test('por goles: objetivo por equipo, cronómetro sin límite, sin partes y detalle guardado', async () => withPage(async page => {
  await page.clock.install()
  await page.goto(fixture)
  await realMode(page); await selection(page)
  await start(page)
  await page.clock.fastForward(600_000)
  await visible(page, 'POR GOLES · PRIMERO A 2 GOLES')
  await visible(page, 'TIEMPO JUGADO')
  assert.equal(await page.locator('.clock-panel strong').textContent(), '10:00')
  await whiteGoal(page); await page.clock.runFor(3_100)
  await page.locator('.blue-score').click()
  assert.equal(await page.locator('.match-board').count(), 1, '1–1 no termina con objetivo de dos')
  for (const [width, height] of [[320, 568], [390, 844], [800, 480]]) {
    await page.setViewportSize({ width, height }); await page.clock.runFor(100); await noOverflow(page)
  }
  await page.screenshot({ path: '/tmp/futbolin-single-goal-period.png' })
  await page.clock.runFor(3_100); await whiteGoal(page)
  await visible(page, 'FINAL DEL PARTIDO'); await visible(page, 'GANA BLANCO')
  await page.getByText('PARTIDO GUARDADO EN SUPABASE', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'RANKING', exact: true }).click()
  await page.locator('.history-list button').click()
  await visible(page, 'DETALLE DEL PARTIDO')
  assert.match(await page.locator('.history-summary').textContent(), /Primero a 2 · Sin partes · Sin límite de tiempo/)
  assert.equal(await page.locator('.event-list > div').count(), 5)
  assert.doesNotMatch(await page.locator('.event-list').textContent(), /SECOND_HALF|FINAL DE PARTE|PRÓRROGA|PENALTI/)
}))

test('ambas: objetivo total entre dos partes, recuperación y ganador acumulado', async () => withPage(async page => {
  await page.clock.install()
  await page.goto(fixture); await realMode(page)
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
  await page.getByRole('button', { name: /AMBAS/ }).click()
  for (let i = 5; i > 1; i--) await page.getByRole('button', { name: 'Reducir DURACIÓN DE CADA PARTE' }).click()
  for (const [width, height] of [[320, 568], [390, 844], [800, 480]]) {
    await page.setViewportSize({ width, height }); await page.clock.runFor(100); await noOverflow(page)
    await page.getByRole('button', { name: 'Reducir DURACIÓN DE CADA PARTE' }).scrollIntoViewIfNeeded()
  }
  await page.screenshot({ path: '/tmp/futbolin-combined-configuration.png' })
  await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
  for (let i = 0; i < 2; i++) await page.locator('.player-card').nth(i).click()
  await start(page); await whiteGoal(page); await page.clock.runFor(3_100)
  await page.locator('.blue-score').click()
  assert.equal(await page.locator('.match-board').count(), 1, '1–1 no alcanza cinco goles por equipo')
  await page.clock.runFor(3_100); await whiteGoal(page)
  await page.clock.runFor(3_100); await page.locator('.blue-score').click()
  await page.clock.runFor(3_100); await whiteGoal(page)
  await visible(page, 'OBJETIVO TOTAL 5')
  assert.equal(await page.locator('.white-score strong').textContent(), '3')
  await page.clock.fastForward(60_000)
  await visible(page, 'FINAL DE LA 1ª PARTE')
  await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).click()
  await page.getByRole('button', { name: /PREPARADOS/ }).click()
  await whiteGoal(page)
  await visible(page, 'OBJETIVO TOTAL 5')
  assert.equal(await page.locator('.white-score strong').textContent(), '4')
  assert.equal(await page.locator('.blue-score strong').textContent(), '2')
  await page.clock.runFor(1_300)
  await page.screenshot({ path: '/tmp/futbolin-combined-global-target.png' })
  await page.reload(); await visible(page, 'PARTIDO POR RECUPERAR')
  const copy = await page.evaluate(() => JSON.parse(localStorage.getItem('marcador-ui-fixture:active-match:v1:fixture')))
  assert.equal(copy.checkpoint.version, 4)
  await page.getByRole('button', { name: 'RECUPERAR PARTIDO', exact: true }).click()
  await page.locator('.pause-overlay').getByRole('button', { name: 'CONTINUAR' }).click()
  await page.clock.runFor(3_100); await whiteGoal(page)
  await visible(page, 'FINAL DEL PARTIDO'); await visible(page, 'GANA BLANCO')
  await page.getByText('PARTIDO GUARDADO EN SUPABASE', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'RANKING', exact: true }).click()
  await page.locator('.history-list button').click()
  assert.match(await page.locator('.history-summary').textContent(), /BLANCO 5 — 2 AZUL.*AMBAS · Primero a 5 goles en total o dos partes de 1:00/)
}))

test('ambas: alcanzar el objetivo total en primera parte finaliza el partido', async () => withPage(async page => {
  await page.clock.install()
  await page.goto(fixture); await realMode(page)
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
  await page.getByRole('button', { name: /AMBAS/ }).click()
  for (let i = 5; i > 2; i--) await page.getByRole('button', { name: 'Reducir GOLES PARA GANAR EL PARTIDO' }).click()
  await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
  for (let i = 0; i < 2; i++) await page.locator('.player-card').nth(i).click()
  await start(page); await whiteGoal(page)
  await page.clock.runFor(3_100); await page.locator('.blue-score').click()
  await page.clock.runFor(3_100); await whiteGoal(page)
  await visible(page, 'FINAL DEL PARTIDO'); await visible(page, 'GANA BLANCO')
  assert.equal(await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).count(), 0)
  await page.getByText('PARTIDO GUARDADO EN SUPABASE', { exact: true }).waitFor()
}))

test('por tiempo: dos partes completas, marcador acumulado y victoria 2–1', async () => withPage(async page => {
  await page.clock.install()
  await page.goto(fixture); await realMode(page)
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
  await page.getByRole('button', { name: /POR TIEMPO/ }).click()
  assert.equal(await page.getByRole('button', { name: 'Reducir GOLES PARA GANAR' }).count(), 0)
  for (let i = 5; i > 1; i--) await page.getByRole('button', { name: 'Reducir DURACIÓN DE CADA PARTE' }).click()
  await page.screenshot({ path: '/tmp/futbolin-two-game-rules.png' })
  await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
  for (let i = 0; i < 2; i++) await page.locator('.player-card').nth(i).click()
  await start(page); await whiteGoal(page); await page.clock.runFor(3_100); await whiteGoal(page)
  await visible(page, '1ª PARTE')
  await page.clock.fastForward(60_000)
  await visible(page, 'FINAL DE LA 1ª PARTE')
  await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).click()
  await page.getByRole('button', { name: /PREPARADOS/ }).click()
  await visible(page, '2ª PARTE')
  assert.equal(await page.locator('.white-score strong').textContent(), '2')
  await page.locator('.blue-score').click()
  await page.clock.fastForward(60_000)
  await visible(page, 'FINAL DEL PARTIDO'); await visible(page, 'GANA BLANCO')
  assert.equal(await page.getByRole('button', { name: 'VER RESULTADO ›' }).count(), 0)
  await noOverflow(page)
  await page.screenshot({ path: '/tmp/futbolin-direct-final.png' })
  await page.getByText('PARTIDO GUARDADO EN SUPABASE', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'RANKING', exact: true }).click()
  await page.locator('.history-list button').click()
  assert.match(await page.locator('.history-summary').textContent(), /BLANCO 2 — 1 AZUL.*POR TIEMPO · Dos partes de 1:00/)
}))

test('ambas: segunda parte agotada sin alcanzar objetivo muestra ganador directamente', async () => withPage(async page => {
  await page.clock.install()
  await page.goto(fixture)
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
  await page.getByRole('button', { name: /AMBAS/ }).click()
  for (let i = 5; i > 1; i--) await page.getByRole('button', { name: 'Reducir DURACIÓN DE CADA PARTE' }).click()
  await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
  for (let i = 0; i < 2; i++) await page.locator('.player-card').nth(i).click()
  await start(page); await page.locator('.blue-score').click()
  await page.clock.fastForward(60_000); await visible(page, 'FINAL DE LA 1ª PARTE')
  await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).click()
  await page.getByRole('button', { name: /PREPARADOS/ }).click()
  await page.clock.fastForward(60_000)
  await visible(page, 'FINAL DEL PARTIDO'); await visible(page, 'GANA AZUL')
  assert.equal(await page.getByRole('button', { name: 'VER RESULTADO ›' }).count(), 0)
  await visible(page, 'MODO PRUEBA · NO SE HA GUARDADO NADA')
  assert.deepEqual(await matchStorage(page), [])
}))

// Checklist 5: natural tied halves, golden goal and a full overtime to penalties.
for (const condition of ['POR TIEMPO', 'AMBAS']) {
  for (const goldenGoal of [true, false]) {
    test(`${condition}: empate lleva a prórroga y ${goldenGoal ? 'gol de oro' : 'penaltis alternos'}`, async () => withPage(async page => {
      await page.clock.install()
      await page.goto(fixture)
      await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
      await page.getByRole('button', { name: new RegExp(condition) }).click()
      for (let i = 5; i > 1; i--) await page.getByRole('button', { name: 'Reducir DURACIÓN DE CADA PARTE' }).click()
      await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
      for (let i = 0; i < 2; i++) await page.locator('.player-card').nth(i).click()
      await start(page)
      await page.clock.fastForward(60_000); await visible(page, 'FINAL DE LA 1ª PARTE')
      await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).click()
      await page.getByRole('button', { name: /PREPARADOS/ }).click()
      await page.clock.fastForward(60_000); await visible(page, 'FINAL DE LA 2ª PARTE')
      await page.getByRole('button', { name: 'IR A PRÓRROGA ›' }).click()
      await page.getByRole('button', { name: /PREPARADOS/ }).click()
      await visible(page, 'PRÓRROGA · GOL DE ORO')
      assert.equal(await page.locator('.clock-panel strong').textContent(), '01:00')
      if (goldenGoal) {
        await page.locator('.blue-score').click()
        await visible(page, 'FINAL DEL PARTIDO'); await visible(page, 'GANA AZUL')
        assert.match(await page.locator('.result-score').textContent(), /BLANCO 0.*1 AZUL/)
        await page.screenshot({ path: `/tmp/futbolin-${condition === 'AMBAS' ? 'both' : 'time'}-golden-goal.png` })
      } else {
        await page.clock.fastForward(60_000); await visible(page, 'FINAL DE LA PRÓRROGA')
        await page.getByRole('button', { name: 'IR A PENALTIS ›' }).click()
        await page.getByRole('heading', { name: 'PENALTIS', exact: true }).waitFor()
        const white = page.locator('.white-penalty'), blue = page.locator('.blue-penalty')
        for (let kick = 0; kick < 3; kick++) {
          assert.equal(await white.getByRole('button', { name: 'GOL', exact: true }).isEnabled(), true)
          assert.equal(await blue.getByRole('button', { name: 'GOL', exact: true }).isDisabled(), true)
          await white.getByRole('button', { name: 'GOL', exact: true }).click()
          assert.equal(await white.getByRole('button', { name: 'GOL', exact: true }).isDisabled(), true)
          assert.equal(await blue.getByRole('button', { name: 'FALLO', exact: true }).isEnabled(), true)
          await blue.getByRole('button', { name: 'FALLO', exact: true }).click()
        }
        await visible(page, 'FINAL DEL PARTIDO'); await visible(page, 'GANA BLANCO')
        await visible(page, 'PENALTIS · BLANCO 3 — 0 AZUL')
        assert.match(await page.locator('.result-score').textContent(), /BLANCO 0.*0 AZUL/)
        await noOverflow(page)
        await page.screenshot({ path: `/tmp/futbolin-${condition === 'AMBAS' ? 'both' : 'time'}-penalties.png` })
      }
      await visible(page, 'MODO PRUEBA · NO SE HA GUARDADO NADA')
      assert.deepEqual(await matchStorage(page), [])
    }))
  }
}

test('vista protegida: cookie del mismo origen habilita acceso, sin cookie sigue bloqueado', async () => withPage(async (page, context) => {
  const probeRequests = []
  await context.route(base + '/connection.json', async route => {
    const cookies = (await route.request().allHeaders()).cookie ?? ''
    probeRequests.push(cookies.includes('preview-access-fixture=granted'))
    await route.fulfill(probeRequests.at(-1)
      ? { status: 200, contentType: 'application/json', body: JSON.stringify({ application: 'marcador-futbolin-v3' }) }
      : { status: 401, contentType: 'text/html', body: '<h1>Protected preview</h1>' })
  })
  await page.goto(fixture + '?auth=guest')
  await settings(page)
  await page.getByRole('textbox', { name: 'Correo' }).fill('operator@example.invalid')
  await page.getByLabel('Contraseña', { exact: true }).fill('fixture-password-123')
  await page.waitForFunction(() => document.querySelector('.system-status')?.textContent.includes('SIN CONEXIÓN'))
  assert.equal(await page.getByRole('button', { name: 'ENTRAR', exact: true }).isDisabled(), true)
  assert.equal(await page.getByRole('button', { name: 'CREAR CUENTA', exact: true }).isDisabled(), true)
  await page.getByText(/El acceso está bloqueado porque/).waitFor()
  for (const [width, height] of [[320, 568], [390, 844], [800, 480]]) {
    await page.setViewportSize({ width, height })
    await noOverflow(page)
    await page.getByRole('button', { name: 'ENTRAR', exact: true }).scrollIntoViewIfNeeded()
  }
  await page.getByRole('button', { name: 'PANTALLA 800×480' }).click()
  await noOverflow(page)
  const register = page.getByRole('button', { name: 'CREAR CUENTA', exact: true })
  await register.scrollIntoViewIfNeeded()
  assert.equal(await register.evaluate(el => {
    const box = el.getBoundingClientRect()
    return document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2) === el
  }), true, 'El aviso no tapa el botón en la referencia física')
  await context.addCookies([{ name: 'preview-access-fixture', value: 'granted', domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' }])
  await page.getByRole('button', { name: 'COMPROBAR CONEXIÓN', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('.system-status')?.textContent.includes('SISTEMA ONLINE'))
  assert.equal(await page.getByRole('button', { name: 'ENTRAR', exact: true }).isDisabled(), false)
  assert.equal(await page.getByRole('button', { name: 'CREAR CUENTA', exact: true }).isDisabled(), false)
  assert.ok(probeRequests.includes(false) && probeRequests.includes(true))
  // No Auth submission or real account creation; test only the UI prerequisite.
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
  assert.equal(original.checkpoint.version, 2)
  await page.reload()
  await visible(page, 'PARTIDO POR RECUPERAR')
  assert.match(await page.locator('.recovery-meta').textContent(), /POR GOLES · PRIMERO A 3 GOLES/)
  await page.getByRole('button', { name: 'RECUPERAR PARTIDO', exact: true }).click()
  await page.locator('.pause-overlay').waitFor()
  assert.equal(await page.locator('.white-score strong').textContent(), '1')
  const recovered = await page.evaluate(() => JSON.parse(localStorage.getItem('marcador-ui-fixture:active-match:v1:fixture')))
  assert.equal(recovered.id, original.id)
  assert.equal(recovered.checkpoint.version, 2)
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
  assert.equal(await page.locator('.event-list > div').count(), 4)
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

test('análisis: rachas, formatos, filtros coherentes, historial y evolución', async () => withPage(async (page, context) => {
  await page.goto(fixture + '?statistics=analysis')
  await profile(page, 'BLANCO UNO')
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '12')
  assert.equal(await metric(page, 'VICTORIAS').textContent(), '4')
  assert.equal(await metric(page, 'DERROTAS').textContent(), '8')
  assert.match(await page.locator('.streak-grid').textContent(), /2 · DERROTA/)
  assert.equal(await page.locator('.format-table tbody tr').count(), 2)
  assert.equal(await page.locator('.format-table tbody tr').first().locator('td').first().textContent(), '6')
  assert.equal(await page.locator('.recent-results li').count(), 5)
  assert.match(await page.locator('.recent-results li').first().textContent(), /DERROTA · 1–1 · PENALTIS/)
  await page.getByText('FILTRAR ANÁLISIS', { exact: true }).click()
  await page.getByLabel('Desde', { exact: true }).fill('2026-10-04')
  await page.getByLabel('Hasta', { exact: true }).fill('2026-10-10')
  await page.getByLabel('Modalidad', { exact: true }).selectOption('QUICK')
  await page.getByLabel('Formato', { exact: true }).selectOption('2v2')
  // Draft changes do not silently change totals before applying.
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '12')
  await page.getByRole('button', { name: 'APLICAR FILTROS', exact: true }).click()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '2')
  assert.equal(await metric(page, 'VICTORIAS %').textContent(), '100%')
  assert.match(await page.locator('.streak-grid').textContent(), /2 · VICTORIA/)
  assert.equal(await page.locator('.recent-results li').count(), 2)
  assert.equal(await page.locator('.format-table tbody tr').first().locator('td').first().textContent(), '0')
  await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.history-list button').length === 2)
  await page.locator('.history-list button').first().click()
  await visible(page, 'DETALLE DEL PARTIDO')
  assert.match(await page.locator('.history-summary').textContent(), /BLANCO DOS.*AZUL DOS/)
  await page.getByRole('button', { name: 'VOLVER AL PERFIL' }).click()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '2')
  await page.getByLabel('Desde', { exact: true }).fill('2026-10-11')
  await page.getByRole('button', { name: 'APLICAR FILTROS', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: /Desde debe/ }).waitFor()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '2', 'Rango inválido conserva filtro anterior')
  await page.getByRole('button', { name: 'QUITAR FILTROS', exact: true }).click()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '12')
  await page.getByRole('button', { name: 'ACTUALIZAR', exact: true }).click()
  await page.locator('.statistics-grid').waitFor()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '12')
  await page.getByText('VER ÚLTIMOS 10 VALORES', { exact: true }).click()
  assert.equal(await page.locator('.evolution-values tbody tr').count(), 10)
  assert.equal(await page.locator('.evolution-values tbody tr').last().locator('td').last().textContent(), '33,3%')
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [800, 480], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width, height }); await noOverflow(page)
    await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).click()
    await page.locator('.history-list button').first().waitFor()
    await noOverflow(page)
    await page.getByRole('button', { name: 'VOLVER AL PERFIL' }).click()
  }
  await settings(page)
  await page.getByRole('button', { name: 'PANTALLA 800×480' }).click()
  await profile(page, 'BLANCO UNO')
  await page.getByText('FILTRAR ANÁLISIS', { exact: true }).click()
  await page.getByLabel('Formato', { exact: true }).selectOption('1v1')
  await page.getByRole('button', { name: 'APLICAR FILTROS', exact: true }).click()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '6')
  await noOverflow(page)
  await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).click()
  await page.locator('.history-list button').first().waitFor()
  await context.setOffline(true)
  await page.getByText(/Las estadísticas necesitan consultar/).waitFor()
  assert.equal(await page.locator('.statistics-grid').count(), 0)
  assert.equal(await page.locator('.analysis-details').count(), 0)
  await context.setOffline(false)
  await page.locator('.statistics-grid').waitFor()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '6', 'Reconectar conserva el filtro y vuelve a leer')
}))

test('filtro sin resultados: ceros legítimos, sin gráfico y se puede quitar', async () => withPage(async page => {
  await page.goto(fixture + '?statistics=analysis')
  await profile(page, 'BLANCO UNO')
  await page.getByText('FILTRAR ANÁLISIS', { exact: true }).click()
  await page.getByLabel('Desde', { exact: true }).fill('2027-01-01')
  await page.getByRole('button', { name: 'APLICAR FILTROS', exact: true }).click()
  await visible(page, 'No hay partidos que coincidan con estos filtros.')
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '0')
  assert.equal(await page.locator('.victory-trend').count(), 0)
  await page.getByRole('button', { name: 'VER HISTORIAL DEL JUGADOR' }).click()
  await visible(page, 'No hay partidos guardados.')
  assert.equal(await page.locator('.history-list button').count(), 0)
  await page.getByRole('button', { name: 'VOLVER AL PERFIL' }).click()
  await page.getByRole('button', { name: 'QUITAR FILTROS', exact: true }).click()
  assert.equal(await metric(page, 'PARTIDOS').textContent(), '12')
  assert.equal(await page.locator('.victory-trend').count(), 1)
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
