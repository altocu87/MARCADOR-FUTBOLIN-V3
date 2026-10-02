import type { HonoursRepository } from '../../honours/model'
import { formatRecord, recordCatalog } from '../../honours/model'
import { useHonours } from '../../honours/useHonours'
import { AchievementCards } from './AchievementsPanel'

export function HonoursPanel({ repository, accountId, playerId, online, revision }: {
  repository: HonoursRepository; accountId: string; playerId: string; online: boolean; revision: string
}) {
  const review = useHonours(repository,accountId,online,revision)
  const row = review.snapshot?.rows.find(r => r.player.id === playerId)
  return <>
    <details className="achievements-panel"><summary>LOGROS{row && ` · ${row.achievements.stars}/45 estrellas`}</summary>
      <p>Una familia, cinco niveles. Todos tus partidos confirmados, independiente de los filtros.</p>
      {row ? <><AchievementCards snapshot={row.achievements} /><p className="statistics-note">{row.progression.achievementXp?.toLocaleString('es-ES')} XP de logros confirmados · Cada nivel cuenta una vez. Prueba y pendientes excluidos. Los goles corresponden a tu equipo.</p></> : <p role={review.error ? 'alert' : 'status'}>{review.snapshot ? 'Jugador no disponible en esta cuenta.' : review.status}</p>}
    </details>
    <details className="achievements-panel records-panel"><summary>RÉCORDS PERSONALES</summary>
      {row ? <dl className="records-grid">{recordCatalog.map(([id,title]) => {
        const record = row.records.find(r => r.id === id)!
        return <div key={id}><dt>{title}</dt><dd>{formatRecord(record)}</dd>{record.matchIds.length > 0 && <details><summary>PARTIDOS QUE COMPARTEN LA MARCA · {record.matchIds.length}</summary>{record.matchIds.map(matchId => <p key={matchId}>Partido {matchId}</p>)}</details>}</div>
      })}</dl> : <p role={review.error ? 'alert' : 'status'}>{review.status}</p>}
      <p className="statistics-note">Récords: 0 XP. Porcentaje actual con al menos 20 partidos; ELO solo con Clasificatorios. Las marcas se recalculan desde el historial confirmado.</p>
    </details>
  </>
}
