import React from 'react'
import type { MatchMode } from '../../match-engine/types'

const modes: { id: MatchMode; title: string; description: string; visual: string }[] = [
  { id: 'QUICK', title: 'PARTIDO RÁPIDO', description: 'Entra al campo y juega una partida directa.', visual: '⚡' },
  { id: 'CHAOS', title: 'PARTIDO CAOS', description: 'Un formato intenso para partidas imprevisibles.', visual: '✦' },
  { id: 'RANKED', title: 'PARTIDO CLASIFICATORIO', description: 'Modo preparado para la clasificación futura.', visual: '◈' },
]

export function NewMatchScreen({ onSelect }: { onSelect: (mode: MatchMode) => void }) {
  return <section className="new-match-screen screen-stack"><header className="screen-heading"><p className="eyebrow">ZONA DE JUEGO</p><h1>NUEVO PARTIDO</h1><p>Selecciona una modalidad para configurar el encuentro.</p></header><div className="mode-grid">{modes.map((mode) => <button className={`mode-card mode-${mode.id.toLowerCase()}`} type="button" key={mode.id} onClick={() => onSelect(mode.id)}><span className="mode-visual">{mode.visual}</span><strong>{mode.title}</strong><small>{mode.description}</small><span className="mode-action">TOCAR PARA ELEGIR <b>›</b></span></button>)}</div></section>
}
