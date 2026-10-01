import { useEffect, useRef, useState } from 'react'
import type { MatchRepository } from '../../services/persistence/MatchRepository'
import type { MatchDocument, MatchSummary } from '../../services/persistence/models'
import { errorMessage } from '../../app/useData'

const modeLabel = (mode: string) => mode === 'QUICK' ? 'RÁPIDO' : mode === 'CHAOS' ? 'CAOS' : 'CLASIFICATORIO'
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
const labels: Record<string, string> = { goal: 'GOL', score_correction: 'CORRECCIÓN −1', undo: 'DESHACER', period_start: 'INICIO DE PARTE', period_end: 'FINAL DE PARTE', extra_time_start: 'PRÓRROGA', penalty: 'PENALTI', match_end: 'FINAL', pause: 'PAUSA', resume: 'CONTINUAR' }

export function HistoryScreen({ repository, userId, online, playerId, playerName, onBack, onStatistics }: {
  repository: MatchRepository | null; userId: string | null; online: boolean; playerId?: string; playerName?: string
  onBack?: () => void; onStatistics?: () => void
}) {
  const [matches, setMatches] = useState<MatchSummary[]>([])
  const [detail, setDetail] = useState<MatchDocument | null>(null)
  const [offset, setOffset] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [version, setVersion] = useState(0)
  const detailRequest = useRef<AbortController | null>(null)
  useEffect(() => {
    setMatches([]); setDetail(null)
    if (!repository || !userId) { setBusy(false); return }
    if (!online) { setBusy(false); setMessage('SIN CONEXIÓN · El historial remoto requiere conexión. Los pendientes están en AJUSTES.'); return }
    const controller = new AbortController()
    setBusy(true); setMessage('')
    void repository.getMatches(offset, { playerId, signal: controller.signal }).then(data => { if (!controller.signal.aborted) setMatches(data) }).catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)) }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => { controller.abort(); detailRequest.current?.abort(); detailRequest.current = null }
  }, [repository, userId, playerId, offset, version, online])
  const open = async (id: string) => {
    if (!repository || busy || !online) return
    const controller = new AbortController()
    detailRequest.current = controller
    setBusy(true)
    try {
      const document = await repository.getMatchById(id)
      if (controller.signal.aborted || detailRequest.current !== controller) return
      if (playerId && !document.participants.some(p => p.player_id === playerId)) throw new Error('El partido no pertenece al historial de este jugador.')
      setDetail(document); setMessage('')
    } catch (error) { if (!controller.signal.aborted && detailRequest.current === controller) setMessage(errorMessage(error)) } finally { if (!controller.signal.aborted && detailRequest.current === controller) setBusy(false) }
  }
  return <section className="data-screen"><header className="data-heading"><h1>{detail ? 'DETALLE DEL PARTIDO' : 'HISTORIAL'}</h1><div>{onStatistics && <button type="button" onClick={onStatistics}>ESTADÍSTICAS</button>}{onBack && <button type="button" onClick={onBack}>VOLVER AL PERFIL</button>}<button type="button" disabled={busy} onClick={() => detail ? setDetail(null) : setVersion(value => value + 1)}>{detail ? 'VOLVER' : 'ACTUALIZAR'}</button></div></header>
    {playerName && <p className="history-player-label">JUGADOR · {playerName}</p>}
    {!userId ? <div className="empty-state">Inicia sesión en AJUSTES para consultar tus partidos.</div> : detail ? <>
      <div className="history-summary"><b>BLANCO {detail.match.white_score} — {detail.match.blue_score} AZUL</b><span>{modeLabel(detail.match.match_type)} · {detail.match.victory_condition} · {detail.match.goal_limit} goles / {time(detail.match.time_limit_seconds)}</span><span>{detail.participants.map(p => `${p.team === 'WHITE' ? 'BLANCO' : 'AZUL'}: ${p.player_name}`).join(' · ')}</span>{detail.match.went_to_penalties && <span>Penaltis: {detail.match.penalty_white_score} — {detail.match.penalty_blue_score}</span>}</div>
      <div className="scroll-panel event-list">{detail.events.map(event => <div key={event.sequence}><span>{event.sequence} · {time(event.match_time_seconds)} · {event.period}</span><b>{labels[event.event_type]} {event.team === 'WHITE' ? 'BLANCO' : event.team === 'BLUE' ? 'AZUL' : ''}{event.event_type === 'penalty' ? event.penalty_scored ? ' · GOL' : ' · FALLO' : ''}</b><span>{event.white_score} — {event.blue_score}</span></div>)}</div>
    </> : <><div className="scroll-panel history-list">{busy ? <p>Cargando…</p> : message ? <p>No se pudo cargar esta consulta.</p> : matches.length === 0 ? <p>No hay partidos guardados.</p> : matches.map(match => <button type="button" key={match.id} onClick={() => void open(match.id)}><span>{new Date(match.finished_at).toLocaleString('es-ES')} · {modeLabel(match.match_type)}</span><b>BLANCO {match.white_score} — {match.blue_score} AZUL · {match.winner_team ? `GANA ${match.winner_team === 'WHITE' ? 'BLANCO' : 'AZUL'}` : 'EMPATE'}</b><small>{match.participants.map(p => `${p.team === 'WHITE' ? 'B' : 'A'}: ${p.player_name}`).join(' · ')}{match.went_to_extra_time ? ' · PRÓRROGA' : ''}{match.went_to_penalties ? ' · PENALTIS' : ''}</small></button>)}</div><div className="panel-toolbar"><button type="button" disabled={busy || !online || offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))}>ANTERIORES</button><button type="button" disabled={busy || !online || matches.length < 20} onClick={() => setOffset(value => value + 20)}>SIGUIENTES</button></div></>}
    {message && <p className="notice" role="alert">{message}</p>}
  </section>
}
