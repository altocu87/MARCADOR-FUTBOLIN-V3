import { useEffect, useState } from 'react'
import type { PlayerProgression } from '../../progression/xp'
import type { ProgressionRepository } from '../../services/persistence/ProgressionRepository'
import { errorMessage } from '../../app/useData'

export function ProgressionPanel({ repository, playerId, online, revision }: {
  repository: ProgressionRepository | null; playerId: string; online: boolean; revision: string
}) {
  const [progression, setProgression] = useState<PlayerProgression | null>(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    setProgression(null); setMessage('')
    if (!online || !repository) return
    const controller = new AbortController()
    void repository.getPlayerProgression(playerId, controller.signal).then(value => {
      if (!controller.signal.aborted) setProgression(value)
    }).catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)) })
    return () => controller.abort()
  }, [repository, playerId, online, revision])
  const value = online ? progression : null
  return <section className="xp-panel" aria-label="Experiencia y nivel">
    {value?.enabled ? <>
      <div className="xp-heading"><strong>NIVEL {value.level}</strong><span>{value.xp.toLocaleString('es-ES')} XP CONFIRMADOS</span></div>
      {value.baseXp !== undefined && <p>Partidos: {value.baseXp.toLocaleString('es-ES')} XP · Logros: {value.achievementXp!.toLocaleString('es-ES')} XP</p>}
      <progress aria-label="Progreso al siguiente nivel" max={value.nextThreshold === null ? 1 : value.nextThreshold - value.currentThreshold} value={value.nextThreshold === null ? 1 : value.xp - value.currentThreshold} />
      <p>{value.nextThreshold === null ? `NIVEL MÁXIMO ${value.maxLevel} · Los XP siguen acumulándose.` : `${(value.nextThreshold - value.xp).toLocaleString('es-ES')} XP para nivel ${value.level + 1} · Umbral total ${value.nextThreshold.toLocaleString('es-ES')} XP`}</p>
      <p className="statistics-note">{value.confirmedMatches} partidos confirmados · Progresión total, independiente de los filtros del análisis. Prueba y pendientes no conceden XP.</p>
    </> : <p role={message ? 'alert' : 'status'}>{!online ? 'XP SIN VERIFICAR · Conecta para consultar tu progresión confirmada.' : message ? `No se pudo verificar XP: ${message}` : !repository ? 'XP no disponible.' : value ? 'CONCESIÓN XP DESACTIVADA' : 'Consultando XP confirmado…'}</p>}
  </section>
}
