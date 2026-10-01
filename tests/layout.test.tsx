import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { canvasScale, parseDisplayMode } from '../src/ui/layout/displayMode'
import { TopMenu } from '../src/ui/components/TopMenu'
import { DisplaySettings } from '../src/ui/components/DisplaySettings'
import { NewMatchScreen } from '../src/ui/screens/NewMatchScreen'

assert.equal(parseDisplayMode(null), 'adaptive')
assert.equal(parseDisplayMode('adaptive'), 'adaptive')
assert.equal(parseDisplayMode('physical'), 'physical')
assert.equal(parseDisplayMode('{invalid}'), 'adaptive')
assert.equal(canvasScale(800, 480), 1)
assert.equal(canvasScale(2560, 1440), 1, 'No ampliar la referencia física')
assert.equal(canvasScale(390, 844), 390 / 800)
assert.equal(canvasScale(844, 390), 390 / 480)
for (const size of [NaN, Infinity, -1, 0]) assert.equal(canvasScale(size, 480), 1)

const items = [{ id: 'new-match', label: 'NUEVO PARTIDO' }, { id: 'tournament', label: 'TORNEO' }, { id: 'ranking', label: 'RANKING' }, { id: 'settings', label: 'AJUSTES' }]
const menu = renderToStaticMarkup(<TopMenu items={items} activeItem="settings" onSelect={() => {}} />)
assert.equal((menu.match(/<button/g) ?? []).length, 4)
assert.equal((menu.match(/aria-current="page"/g) ?? []).length, 1)
assert.match(menu, /Navegación principal/)
assert.equal((menu.match(/aria-hidden="true"/g) ?? []).length, 5, 'Iconos decorativos no duplican el nombre accesible')
for (const item of items) assert.ok(menu.includes(item.label))
for (const mode of ['adaptive', 'physical'] as const) {
  const settings = renderToStaticMarkup(<DisplaySettings mode={mode} onChange={() => {}} />)
  assert.equal((settings.match(/aria-pressed="true"/g) ?? []).length, 1)
  assert.match(settings, /WEB ADAPTABLE/); assert.match(settings, /PANTALLA 800×480/)
}
const modes = renderToStaticMarkup(<NewMatchScreen onSelect={() => {}} />)
assert.equal((modes.match(/<button/g) ?? []).length, 3)
for (const mode of ['quick', 'chaos', 'ranked']) assert.ok(modes.includes(`mode-${mode}`))
console.log('Presentación: modo web por defecto, preferencia válida, escala física, navegación accesible y tres modos conservados.')
