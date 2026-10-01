import React from 'react'
import type { DisplayMode } from '../layout/displayMode'

export function DisplaySettings({ mode, onChange }: { mode: DisplayMode; onChange: (mode: DisplayMode) => void }) {
  return <div className="display-settings">
    <h2>VISTA DE PANTALLA</h2>
    <div className="display-picker" role="group" aria-label="Vista de pantalla">
      <button type="button" aria-pressed={mode === 'adaptive'} onClick={() => onChange('adaptive')}>WEB ADAPTABLE</button>
      <button type="button" aria-pressed={mode === 'physical'} onClick={() => onChange('physical')}>PANTALLA 800×480</button>
    </div>
    <p>{mode === 'adaptive' ? 'Se adapta al tamaño y orientación de tu pantalla.' : 'Referencia física exacta, centrada y escalada si no cabe.'}</p>
  </div>
}
