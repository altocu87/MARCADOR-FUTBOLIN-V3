import { useState } from 'react'
import type { MatchDocument } from '../../services/persistence/models'

const modeLabel = (mode: string) => mode === 'QUICK' ? 'RÁPIDO' : mode === 'CHAOS' ? 'CAOS' : 'CLASIFICATORIO'
const labels: Record<string, string> = { goal: 'GOL', score_correction: 'CORRECCIÓN −1', undo: 'DESHACER', period_start: 'INICIO DE PARTE', period_end: 'FINAL DE PARTE', extra_time_start: 'PRÓRROGA', penalty: 'PENALTI', match_end: 'FINAL', pause: 'PAUSA', resume: 'CONTINUAR' }

export function PendingMatchesScreen({ documents, online, busy, message, onRetry, onBack }: {
  documents: MatchDocument[]; online: boolean; busy: boolean; message: string; onRetry: () => Promise<void>; onBack: () => void
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const detail = documents.find(document => document.match.id === selected)
  return <section className="data-screen">
    <header className="data-heading"><h1>{detail ? 'RESULTADO PENDIENTE' : 'PENDIENTES DE SINCRONIZAR'}</h1><button type="button" onClick={() => detail ? setSelected(null) : onBack()}>VOLVER</button></header>
    <p className="notice">Conservados solo en este navegador/cuenta. No borres sus datos hasta sincronizar.</p>
    {detail ? <>
      <div className="history-summary"><b>BLANCO {detail.match.white_score} — {detail.match.blue_score} AZUL</b><span>{detail.participants.map(p => `${p.team === 'WHITE' ? 'B' : 'A'}: ${p.player_name}`).join(' · ')}</span>{detail.match.went_to_penalties && <span>PENALTIS {detail.match.penalty_white_score} — {detail.match.penalty_blue_score}</span>}</div>
      <div className="scroll-panel event-list">{detail.events.map(event => <div key={event.sequence}><span>{event.sequence} · {Math.floor(event.match_time_seconds / 60)}:{String(event.match_time_seconds % 60).padStart(2, '0')}</span><b>{labels[event.event_type]} {event.team === 'WHITE' ? 'BLANCO' : event.team === 'BLUE' ? 'AZUL' : ''}{event.event_type === 'penalty' ? event.penalty_scored ? ' · GOL' : ' · FALLO' : ''}</b><span>{event.white_score} — {event.blue_score}</span></div>)}</div>
    </> : <div className="scroll-panel history-list">{documents.length === 0 ? <p>No hay resultados pendientes.</p> : documents.map(document => <button type="button" key={document.match.id} onClick={() => setSelected(document.match.id)}><span>{new Date(document.match.finished_at).toLocaleString('es-ES')} · {modeLabel(document.match.match_type)}</span><b>BLANCO {document.match.white_score} — {document.match.blue_score} AZUL · {document.match.winner_team ? `GANA ${document.match.winner_team === 'WHITE' ? 'BLANCO' : 'AZUL'}` : 'EMPATE'}</b><small>{document.participants.map(p => `${p.team === 'WHITE' ? 'B' : 'A'}: ${p.player_name}`).join(' · ')}{document.match.went_to_extra_time ? ' · PRÓRROGA' : ''}{document.match.went_to_penalties ? ' · PENALTIS' : ''}</small></button>)}</div>}
    <div className="panel-toolbar"><button type="button" disabled={busy || !online || documents.length === 0} onClick={() => void onRetry()}>{busy ? 'SINCRONIZANDO…' : `REINTENTAR ${documents.length} PENDIENTES`}</button></div>
    {message && <p className="notice" role="status">{message}</p>}
  </section>
}
