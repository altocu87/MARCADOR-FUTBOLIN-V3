import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { chromium } from 'playwright'

const baseURL = process.env.MARCADOR_TEST_URL ?? 'http://127.0.0.1:5173'
const storageKey = 'marcador-futbolin-v3:local:v1'
let browser

before(async () => {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined })
})
after(async () => { await browser?.close() })

async function setup(t, options = {}) {
  const context = await browser.newContext({ viewport: { width: 800, height: 480 }, ...options })
  t.after(() => context.close())
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  t.after(() => assert.deepEqual(errors, [], 'No debe haber errores JavaScript'))
  await page.goto(baseURL)
  await page.getByRole('navigation', { name: 'Navegación principal' }).waitFor()
  return { page, context }
}

async function addPlayers(page, names = ['Ana', 'Luis', 'Marta', 'Pablo']) {
  await page.getByRole('button', { name: 'JUGADORES', exact: true }).click()
  for (const name of names) {
    await page.getByLabel('Nombre', { exact: true }).fill(name)
    await page.getByRole('button', { name: 'CREAR JUGADOR', exact: true }).click()
    await page.getByRole('button', { name: `Editar ${name.trim().replace(/\s+/gu, ' ')}`, exact: true }).waitFor()
  }
}

async function configure(page, goalLimit = false) {
  await page.getByRole('button', { name: 'NUEVO PARTIDO', exact: true }).first().click()
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).click()
  if (goalLimit) {
    await page.getByRole('button', { name: /POR GOLES/ }).click()
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Reducir GOLES POR PARTE' }).click()
  }
  await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
}

async function start(page, names = ['Luis', 'Ana'], goalLimit = false) {
  await configure(page, goalLimit)
  for (const name of names) await page.locator('.player-card').filter({ has: page.getByText(name, { exact: true }) }).click()
  await page.getByRole('button', { name: 'COMENZAR PARTIDO ›' }).click()
  await page.getByText('TOCA PARA SALTAR', { exact: true }).click()
}

async function readData(page) { return page.evaluate((key) => JSON.parse(localStorage.getItem(key)), storageKey) }

test('jugadores: creación, validación, edición y conservación tras recargar', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page, ['  Ana   María  ', 'Luis'])
  await page.getByLabel('Nombre', { exact: true }).fill('ANA MARÍA')
  await page.getByRole('button', { name: 'CREAR JUGADOR', exact: true }).click()
  assert.match(await page.locator('#player-error').textContent(), /Ya existe/)
  assert.equal((await readData(page)).players.length, 2)
  await page.getByRole('button', { name: 'Editar Luis', exact: true }).click()
  await page.getByLabel('Nombre', { exact: true }).fill('Luis García')
  await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'JUGADORES', exact: true }).click()
  await page.getByRole('button', { name: 'Editar Luis García', exact: true }).waitFor()
  assert.deepEqual((await readData(page)).players.map((player) => player.name), ['Ana María', 'Luis García'])
})

test('equipos: respeta el orden de selección y solo permite 2 o 4 participantes', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page)
  await configure(page)
  assert.equal(new Set((await readData(page)).players.map((player) => player.tint)).size, 4)
  const startButton = page.getByRole('button', { name: 'COMENZAR PARTIDO ›' })
  assert.equal(await startButton.isEnabled(), false)
  for (const name of ['Pablo', 'Marta', 'Luis']) await page.locator('.player-card').filter({ has: page.getByText(name, { exact: true }) }).click()
  assert.equal(await startButton.isEnabled(), false)
  await page.locator('.player-card').filter({ has: page.getByText('Ana', { exact: true }) }).click()
  assert.equal(await startButton.isEnabled(), true)
  assert.match(await page.locator('.team-preview').textContent(), /BLANCO: Pablo \/ Luis · AZUL: Marta \/ Ana/)
  await startButton.click()
  await page.getByText('TOCA PARA SALTAR', { exact: true }).click()
  assert.deepEqual((await readData(page)).active.players.map((player) => player.name), ['Pablo', 'Marta', 'Luis', 'Ana'])
  assert.match(await page.locator('.white-line').textContent(), /Pablo.*Luis/)
  assert.match(await page.locator('.blue-line').textContent(), /Marta.*Ana/)
})

test('recupera el marcador pausado, conserva deshacer y protege el partido al navegar', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page)
  await start(page)
  await page.locator('.white-score').click()
  assert.equal((await readData(page)).active.checkpoint.state.whiteGoals, 1)
  await page.reload()
  await page.locator('.pause-overlay').waitFor()
  const before = (await readData(page)).active.checkpoint.state.remainingSeconds
  await page.waitForTimeout(1200)
  assert.equal((await readData(page)).active.checkpoint.state.remainingSeconds, before)
  await page.locator('.pause-overlay button').click()
  await page.getByRole('button', { name: 'DESHACER', exact: true }).first().click()
  assert.equal((await readData(page)).active.checkpoint.state.whiteGoals, 0)
  await page.getByRole('button', { name: 'HISTORIAL', exact: true }).click()
  await page.getByRole('button', { name: 'NUEVO PARTIDO', exact: true }).first().click()
  await page.getByRole('heading', { name: 'RECUPERAR PARTIDO' }).waitFor()
  assert.equal(await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).count(), 0)
  await page.getByRole('button', { name: 'VOLVER AL PARTIDO' }).click()
  await page.locator('.pause-overlay').waitFor()
})

test('partido completo: archiva una vez, muestra goles y conserva nombres históricos', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page)
  await start(page, ['Luis', 'Ana'], true)
  await page.locator('.white-score').click()
  await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).click()
  await page.getByText('TOCA PARA SALTAR', { exact: true }).click()
  await page.locator('.white-score').click()
  await page.getByRole('button', { name: 'VER RESULTADO ›' }).click()
  await page.getByRole('heading', { name: 'GANA BLANCO' }).waitFor()
  assert.equal((await readData(page)).history.length, 1)
  await page.reload()
  await page.getByRole('heading', { name: 'GANA BLANCO' }).waitFor()
  assert.equal((await readData(page)).history.length, 1)
  await page.getByRole('button', { name: 'JUGADORES', exact: true }).click()
  await page.getByRole('button', { name: 'Editar Luis', exact: true }).click()
  await page.getByLabel('Nombre', { exact: true }).fill('Luis nuevo')
  await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  await page.getByRole('button', { name: 'HISTORIAL', exact: true }).click()
  await page.locator('.history-item').click()
  await page.getByRole('heading', { name: 'RESULTADO DEL PARTIDO' }).waitFor()
  assert.match(await page.locator('.history-teams').textContent(), /Luis/)
  assert.doesNotMatch(await page.locator('.history-teams').textContent(), /Luis nuevo/)
  assert.equal(await page.locator('.goal-history li').count(), 2)
  const data = await readData(page)
  assert.equal(data.history[0].state.whiteGoals, 2)
  assert.equal(data.history[0].players[0].name, 'Luis')
  await page.getByRole('button', { name: 'NUEVO PARTIDO', exact: true }).first().click()
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).waitFor()
})

test('penaltis: recupera turnos y muestra y archiva el ganador correcto', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page)
  await start(page)
  await page.locator('.developer-controls summary').click()
  await page.locator('.developer-controls').getByRole('button', { name: 'PENALTIS', exact: true }).click()
  const white = page.locator('.white-penalty')
  const blue = page.locator('.blue-penalty')
  await white.getByRole('button', { name: 'GOL', exact: true }).click()
  assert.equal(await white.getByRole('button', { name: 'GOL', exact: true }).isEnabled(), false)
  await page.reload()
  await page.getByRole('heading', { name: 'PENALTIS', exact: true }).waitFor()
  assert.equal(await blue.getByRole('button', { name: 'GOL', exact: true }).isEnabled(), true)
  await blue.getByRole('button', { name: 'GOL', exact: true }).click()
  for (let i = 1; i < 5; i++) {
    await white.getByRole('button', { name: 'GOL', exact: true }).click()
    await blue.getByRole('button', { name: i < 4 ? 'GOL' : 'FALLO', exact: true }).click()
  }
  await page.getByRole('heading', { name: 'GANA BLANCO' }).waitFor()
  assert.equal((await readData(page)).history[0].state.penalty.whiteGoals, 5)
  await page.getByRole('button', { name: 'HISTORIAL', exact: true }).click()
  assert.match(await page.locator('.history-item').textContent(), /PEN\. 5–4/)
})

test('datos corruptos: avisa y conserva el contenido original', async (t) => {
  const { page } = await setup(t)
  await page.evaluate((key) => localStorage.setItem(key, '{broken'), storageKey)
  await page.reload()
  await page.getByRole('dialog').waitFor()
  assert.match(await page.getByRole('alert').textContent(), /sin sobrescribir/)
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), storageKey), '{broken')
})

test('fallo de guardado: bloquea el avance, reintenta y conserva el gol recuperado pausado', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page)
  await start(page)
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    window.failStorage = true
    Storage.prototype.setItem = function (...args) {
      if (window.failStorage) throw new DOMException('Storage full', 'QuotaExceededError')
      return original.apply(this, args)
    }
  })
  await page.locator('.white-score').click()
  await page.getByRole('dialog').waitFor()
  assert.equal((await readData(page)).active.checkpoint.state.whiteGoals, 0)
  await page.evaluate(() => { window.failStorage = false })
  await page.getByRole('button', { name: 'REINTENTAR GUARDADO' }).click()
  await page.locator('.pause-overlay').waitFor()
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert.equal((await readData(page)).active.checkpoint.state.whiteGoals, 1)
  assert.equal((await readData(page)).active.checkpoint.state.status, 'PAUSED')
})

test('otra pestaña: impide sobrescribir los datos de jugadores recién editados', async (t) => {
  const { page, context } = await setup(t)
  await addPlayers(page, ['Ana', 'Luis'])
  const other = await context.newPage()
  await other.goto(baseURL)
  await other.getByRole('button', { name: 'JUGADORES', exact: true }).click()
  await other.getByRole('button', { name: 'Editar Ana', exact: true }).click()
  await other.getByLabel('Nombre', { exact: true }).fill('Ana editada')
  await other.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  assert.match(await page.getByRole('alert').textContent(), /otra pestaña/)
  assert.equal((await readData(page)).players[0].name, 'Ana editada')
})

test('cerrar y reabrir la pestaña recupera los participantes y el marcador', async (t) => {
  const { page, context } = await setup(t)
  await addPlayers(page, ['Ana', 'Luis'])
  await start(page)
  await page.locator('.blue-score').click()
  const matchId = (await readData(page)).active.id
  await page.close()
  const reopened = await context.newPage()
  const errors = []
  reopened.on('pageerror', (error) => errors.push(error.message))
  t.after(() => assert.deepEqual(errors, []))
  await reopened.goto(baseURL)
  await reopened.locator('.pause-overlay').waitFor()
  const data = await readData(reopened)
  assert.equal(data.active.id, matchId)
  assert.equal(data.active.checkpoint.state.blueGoals, 1)
  assert.deepEqual(data.active.players.map((player) => player.name), ['Luis', 'Ana'])
})

test('cambiar la hora del sistema no altera el reloj del partido ni el guardado', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page, ['Ana', 'Luis'])
  await start(page)
  await page.locator('.white-score').click()
  await page.evaluate(() => { const original = Date.now; Date.now = () => original() - 3_600_000 })
  await page.waitForTimeout(1200)
  const data = await readData(page)
  assert.equal(await page.getByRole('dialog').count(), 0)
  assert.equal(data.active.checkpoint.state.status, 'PLAYING')
  assert.ok(data.active.checkpoint.state.remainingSeconds >= 297 && data.active.checkpoint.state.remainingSeconds < 300)
  assert.equal(data.active.checkpoint.state.whiteGoals, 1)
})

test('gestionar jugadores o volver a configuración conserva selección y reglas del partido', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page, ['Ana', 'Luis'])
  await configure(page, true)
  for (const name of ['Luis', 'Ana']) await page.locator('.player-card').filter({ has: page.getByText(name, { exact: true }) }).click()
  await page.getByRole('button', { name: 'GESTIONAR JUGADORES' }).click()
  await page.getByRole('button', { name: 'Editar Luis', exact: true }).click()
  await page.getByLabel('Nombre', { exact: true }).fill('Luis García')
  await page.getByRole('button', { name: 'GUARDAR CAMBIOS', exact: true }).click()
  await page.getByRole('button', { name: 'VOLVER', exact: true }).click()
  assert.match(await page.locator('.team-preview').textContent(), /BLANCO: Luis García · AZUL: Ana/)
  await page.getByRole('button', { name: 'VOLVER', exact: true }).click()
  assert.match(await page.locator('.choice-button.selected').textContent(), /POR GOLES/)
  assert.match(await page.locator('.stepper strong').textContent(), /^1/)
  await page.getByRole('button', { name: 'SELECCIONAR JUGADORES ›' }).click()
  assert.equal(await page.locator('.player-card.selected').count(), 2)
  await page.getByRole('button', { name: 'COMENZAR PARTIDO ›' }).click()
  assert.deepEqual((await readData(page)).active.players.map((player) => player.name), ['Luis García', 'Ana'])
  assert.equal((await readData(page)).active.checkpoint.state.config.goalLimit, 1)
})

test('reintentar nuevo partido después de un fallo no vuelve a activar el resultado anterior', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page, ['Ana', 'Luis'])
  await start(page, ['Luis', 'Ana'], true)
  await page.locator('.white-score').click()
  await page.getByRole('button', { name: 'CONTINUAR 2ª PARTE ›' }).click()
  await page.getByText('TOCA PARA SALTAR', { exact: true }).click()
  await page.locator('.white-score').click()
  await page.getByRole('button', { name: 'VER RESULTADO ›' }).click()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    window.failStorage = true
    Storage.prototype.setItem = function (...args) {
      if (window.failStorage) throw new DOMException('Storage full', 'QuotaExceededError')
      return original.apply(this, args)
    }
  })
  await page.getByRole('button', { name: 'NUEVO PARTIDO', exact: true }).last().click()
  await page.getByRole('dialog').waitFor()
  await page.evaluate(() => { window.failStorage = false })
  await page.getByRole('button', { name: 'REINTENTAR GUARDADO' }).click()
  await page.getByRole('button', { name: /PARTIDO RÁPIDO/ }).waitFor()
  assert.equal((await readData(page)).active, null)
  assert.equal((await readData(page)).history.length, 1)
})

test('lienzo táctil: listados largos y controles accesibles en 800×480 y 400×240', async (t) => {
  const { page } = await setup(t)
  await addPlayers(page, Array.from({ length: 12 }, (_, index) => `Jugador ${index + 1}`))
  await configure(page)
  await page.locator('.selection-list').evaluate((element) => { element.scrollTop = element.scrollHeight })
  await page.locator('.player-card').filter({ has: page.getByText('Jugador 12', { exact: true }) }).click()
  for (const viewport of [{ width: 800, height: 480 }, { width: 400, height: 240 }]) {
    await page.setViewportSize(viewport)
    await page.waitForFunction(() => document.querySelector('.fixed-canvas').getBoundingClientRect().width <= innerWidth + 1)
    for (const name of ['VOLVER', 'GESTIONAR JUGADORES', 'COMENZAR PARTIDO ›']) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox()
      assert.ok(box && box.x >= 0 && box.x + box.width <= viewport.width + 1 && box.y >= 0 && box.y + box.height <= viewport.height + 1, `${name} debe caber en ${viewport.width}×${viewport.height}: ${JSON.stringify(box)}`)
    }
  }
})
