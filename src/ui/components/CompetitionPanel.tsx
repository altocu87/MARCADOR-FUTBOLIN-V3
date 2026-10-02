import { useEffect, useState } from 'react'
import type { CompetitivePlayer } from '../../competition/elo'
import type { CompetitionRepository } from '../../services/persistence/CompetitionRepository'
import { errorMessage } from '../../app/useData'

export function CompetitionPanel({ repository, playerId, online, revision }: {
  repository: CompetitionRepository | null; playerId: string; online: boolean; revision: string
}) {
  const [row, setRow] = useState<CompetitivePlayer | null>(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    setRow(null); setMessage('')
    if (!online || !repository) return
    const controller = new AbortController()
    void repository.getRanking(controller.signal).then(rows => {
      if (controller.signal.aborted) return
      const value = rows.find(p => p.playerId === playerId)
      if (!value) throw new Error('Jugador no encontrado en la clasificación privada.')
      setRow(value)
    }).catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)) })
    return () => controller.abort()
  }, [repository, playerId, online, revision])
  const value = online ? row : null
  return <section className="competition-panel" aria-label="ELO y categoría">
    {value?.enabled ? <>
      <dl className="competition-metrics"><div><dt>ELO ACTUAL</dt><dd>{value.elo}</dd></div><div><dt>MÁXIMO HISTÓRICO</dt><dd>{value.maxElo}</dd></div><div><dt>CATEGORÍA</dt><dd>{value.category}</dd></div></dl>
      <p className="statistics-note">{value.classifiedMatches} clasificatorias confirmadas · {value.rank === null ? 'SIN CLASIFICATORIAS' : `PUESTO ${value.rank}`} · Total independiente de los filtros. Prueba, Rápido, Caos y pendientes no conceden ELO.</p>
    </> : <p role={message ? 'alert' : 'status'}>{!online ? 'ELO SIN VERIFICAR · Conecta para consultar la clasificación confirmada.' : message ? `No se pudo verificar ELO: ${message}` : !repository ? 'ELO no disponible.' : value ? 'ELO PENDIENTE DE APROBACIÓN · Inicio 1200. Ajustes y categorías desactivados.' : 'Consultando ELO confirmado…'}</p>}
  </section>
}
