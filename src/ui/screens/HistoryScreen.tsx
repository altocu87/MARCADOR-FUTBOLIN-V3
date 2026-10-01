import { useEffect, useState } from 'react'
import type { MatchRepository } from '../../services/persistence/MatchRepository'
import type { MatchDocument, MatchSummary } from '../../services/persistence/models'
import { errorMessage } from '../../app/useData'

const modeLabel = (mode: string) => mode === 'QUICK' ? 'RÁPIDO' : mode === 'CHAOS' ? 'CAOS' : 'CLASIFICATORIO'
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
const labels: Record<string, string> = { goal: 'GOL', score_correction: 'CORRECCIÓN −1', undo: 'DESHACER', period_start: 'INICIO DE PARTE', period_end: 'FINAL DE PARTE', extra_time_start: 'PRÓRROGA', penalty: 'PENALTI', match_end: 'FINAL', pause: 'PAUSA', resume: 'CONTINUAR' }

export function HistoryScreen({ repository, userId }: { repository: MatchRepository | null; userId: string | null }) {
  const [matches, setMatches] = useState<MatchSummary[]>([])
  const [detail, setDetail] = useState<MatchDocument | null>(null)
  const [offset, setOffset] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!repository || !userId) return
    let alive = true
    setBusy(true); setMessage('')
    void repository.getMatches(offset).then(data => { if (alive) setMatches(data) }).catch(error => { if (alive) setMessage(errorMessage(error)) }).finally(() => { if (alive) setBusy(false) })
    return () => { alive = false }
  }, [repository, userId, offset, version])
  const open = async (id: string) => {
    if (!repository || busy) return
    setBusy(true)
    try { setDetail(await repository.getMatchById(id)); setMessage('') } catch (error) { setMessage(errorMessage(error)) } finally { setBusy(false) }
  }
  return <section className="data-screen"><header className="data-heading"><h1>{detail ? 'DETALLE DEL PARTIDO' : 'HISTORIAL'}</h1><button type="button" disabled={busy} onClick={() => detail ? setDetail(null) : setVersion(value => value + 1)}>{detail ? 'VOLVER' : 'ACTUALIZAR'}</button></header>
    {!userId ? <div className="empty-state">Inicia sesión en AJUSTES para consultar tus partidos.</div> : detail ? <>
      <div className="history-summary"><b>BLANCO {detail.match.white_score} — {detail.match.blue_score} AZUL</b><span>{modeLabel(detail.match.match_type)} · {detail.match.victory_condition} · {detail.match.goal_limit} goles / {time(detail.match.time_limit_seconds)}</span><span>{detail.participants.map(p => `${p.team === 'WHITE' ? 'BLANCO' : 'AZUL'}: ${p.player_name}`).join(' · ')}</span>{detail.match.went_to_penalties && <span>Penaltis: {detail.match.penalty_white_score} — {detail.match.penalty_blue_score}</span>}</div>
      <div className="scroll-panel event-list">{detail.events.map(event => <div key={event.sequence}><span>{event.sequence} · {time(event.match_time_seconds)} · {event.period}</span><b>{labels[event.event_type]} {event.team === 'WHITE' ? 'BLANCO' : event.team === 'BLUE' ? 'AZUL' : ''}{event.event_type === 'penalty' ? event.penalty_scored ? ' · GOL' : ' · FALLO' : ''}</b><span>{event.white_score} — {event.blue_score}</span></div>)}</div>
    </> : <><div className="scroll-panel history-list">{busy ? <p>Cargando…</p> : matches.length === 0 ? <p>No hay partidos guardados.</p> : matches.map(match => <button type="button" key={match.id} onClick={() => void open(match.id)}><span>{new Date(match.finished_at).toLocaleString('es-ES')} · {modeLabel(match.match_type)}</span><b>BLANCO {match.white_score} — {match.blue_score} AZUL · {match.winner_team ? `GANA ${match.winner_team === 'WHITE' ? 'BLANCO' : 'AZUL'}` : 'EMPATE'}</b><small>{match.participants.map(p => `${p.team === 'WHITE' ? 'B' : 'A'}: ${p.player_name}`).join(' · ')}{match.went_to_extra_time ? ' · PRÓRROGA' : ''}{match.went_to_penalties ? ' · PENALTIS' : ''}</small></button>)}</div><div className="panel-toolbar"><button type="button" disabled={busy || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))}>ANTERIORES</button><button type="button" disabled={busy || matches.length < 20} onClick={() => setOffset(value => value + 20)}>SIGUIENTES</button></div></>}
    {message && <p className="notice" role="alert">{message}</p>}
  </section>
}
