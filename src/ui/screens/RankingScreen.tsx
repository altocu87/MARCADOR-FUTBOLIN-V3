import { useEffect, useState } from 'react'
import type { CompetitivePlayer } from '../../competition/elo'
import type { CompetitionRepository } from '../../services/persistence/CompetitionRepository'
import { errorMessage } from '../../app/useData'

export function RankingScreen({ repository, userId, online, revision, onBack, onProfile }: {
  repository: CompetitionRepository | null; userId: string | null; online: boolean; revision: string | null
  onBack: () => void; onProfile: (id: string) => void
}) {
  const [rows, setRows] = useState<CompetitivePlayer[] | null>(null)
  const [message, setMessage] = useState('')
  const [version, setVersion] = useState(0)
  useEffect(() => {
    setRows(null); setMessage('')
    if (!online || !repository || !userId) return
    const controller = new AbortController()
    void repository.getRanking(controller.signal).then(value => { if (!controller.signal.aborted) setRows(value) })
      .catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)) })
    return () => controller.abort()
  }, [repository, userId, online, revision, version])
  const values = online && userId ? rows : null
  return <section className="data-screen ranking-screen">
    <header className="data-heading"><h1>CLASIFICACIÓN PRIVADA</h1><button type="button" onClick={onBack}>HISTORIAL</button></header>
    <div className="scroll-panel ranking-content">
      {!userId ? <p>Inicia sesión desde el acceso superior para consultar tu clasificación.</p> : !online ? <p role="status">ELO SIN VERIFICAR · La clasificación confirmada necesita conexión y sesión verificada.</p> : message ? <p role="alert">No se pudo verificar la clasificación: {message}</p> : !repository ? <p>ELO no disponible.</p> : !values ? <p role="status">Consultando clasificación confirmada…</p> : !values.length ? <p>No hay jugadores en esta cuenta.</p> : <>
        {!values[0].enabled && <p className="notice" role="status">ELO PENDIENTE DE APROBACIÓN · Inicio 1200. Ajustes y categorías desactivados.</p>}
        <ol className="ranking-list" aria-label="Clasificación de jugadores">{values.map(p => <li key={p.playerId}>
          <button type="button" className="ranking-player" onClick={() => onProfile(p.playerId)} aria-label={`Ver perfil de ${p.nickname || p.name}`}>
            <span className="ranking-position" aria-label={p.rank === null ? 'Sin puesto' : `Puesto ${p.rank}`}>{p.rank ?? '—'}</span>
            <span className="ranking-name"><strong>{p.nickname || p.name}</strong><small>{p.active ? 'ACTIVO' : 'INACTIVO'} · {p.classifiedMatches ? `${p.classifiedMatches} clasificatorias` : p.enabled ? 'SIN CLASIFICATORIAS' : 'ELO DESACTIVADO'}</small></span>
            <span className="ranking-rating"><strong>{p.elo}</strong><small>{p.enabled ? 'ELO' : 'INICIAL'}</small></span>
            <span className="ranking-category"><strong>{p.category ?? 'PENDIENTE'}</strong><small>MÁXIMO {p.maxElo}</small></span>
          </button>
        </li>)}</ol>
      </>}
      <p className="statistics-note">Solo jugadores de esta cuenta, incluidos inactivos. Empates de ELO comparten puesto; sin clasificatorias no hay puesto. Identidad por jugador, independiente de alias. Los pendientes solo cuentan cuando se confirman en Supabase.</p>
    </div>
    <div className="panel-toolbar"><button type="button" disabled={!userId || !online || !repository || rows === null && !message} onClick={() => setVersion(v => v + 1)}>ACTUALIZAR CLASIFICACIÓN</button></div>
  </section>
}
