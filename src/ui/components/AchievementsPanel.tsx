import { tierXp } from '../../honours/model'
import { useMemo } from 'react'
import { rebuildAchievements, type AchievementSnapshot } from '../../achievements/rebuild'
import type { MatchSummary } from '../../services/persistence/models'

export function AchievementCards({ snapshot }: { snapshot: AchievementSnapshot }) {
  return <div className="achievement-cards">{snapshot.families.map(family => <article className="achievement-card" key={family.id} data-achievement={family.id}>
    <h3>{family.title}</h3>
    <p className="achievement-stars" aria-label={`${family.level} de ${family.tiers.length} estrellas`}>
      <span aria-hidden="true">{'★'.repeat(family.level)}{'☆'.repeat(family.tiers.length - family.level)}</span>
      <span className="achievement-level">Nivel {family.level}/{family.tiers.length}</span>
    </p>
    <p>{family.description}</p>
    {family.next ? <><p className="achievement-progress">{family.value.toLocaleString('es-ES')} / {family.next.threshold.toLocaleString('es-ES')} · Faltan {(family.next.threshold - family.value).toLocaleString('es-ES')} para el nivel {family.next.level}</p>
      <progress aria-label={`${family.title}: progreso al nivel ${family.next.level}`} value={family.value} max={family.next.threshold} />
    </> : <p className="achievement-progress">Todos los niveles completados · {family.value.toLocaleString('es-ES')}</p>}
    <details className="achievement-tiers"><summary>VER NIVELES</summary><ol>{family.tiers.map(tier => <li key={tier.id} data-tier={tier.id}>
      <strong>Nivel {tier.level} · {tier.threshold.toLocaleString('es-ES')}</strong> — {tier.evidence ? 'Conseguido' : 'En progreso'} · {tierXp[tier.level - 1]} XP
      {tier.evidence && <span className="achievement-evidence">Hecho confirmado: {new Date(tier.evidence.finishedAt).toLocaleDateString('es-ES')} · Partido {tier.evidence.matchId}</span>}
    </li>)}</ol></details>
  </article>)}</div>
}

export function AchievementsPanel({ accountId, playerId, matches, online, busy, message }: {
  accountId: string; playerId: string; matches: readonly MatchSummary[] | null; online: boolean; busy: boolean; message: string
}) {
  const review = useMemo(() => {
    if (!online || busy || message || !matches) return { snapshot: null, error: '' }
    try { return { snapshot: rebuildAchievements({ accountId, playerId, source: 'confirmed', complete: true, matches }), error: '' } }
    catch { return { snapshot: null, error: 'No se puede reconstruir el historial completo. Actualiza para consultar los logros.' } }
  }, [accountId, playerId, matches, online, busy, message])
  return <details className="achievements-panel"><summary>LOGROS{review.snapshot && ` · ${review.snapshot.stars}/45 estrellas`}</summary>
    <p>Una familia, cinco niveles. Progreso de todos tus partidos confirmados, independiente de los filtros.</p>
    {review.snapshot ? <><AchievementCards snapshot={review.snapshot} /><p className="statistics-note">XP de logros: consulta confirmada del servidor necesaria. Prueba y pendientes excluidos. Los goles corresponden a tu equipo.</p></> : <p role="status">{!online ? 'Sin conexión. Conecta para consultar tus logros confirmados.' : busy ? 'Consultando el historial completo…' : review.error || (message ? 'No se ha podido consultar el historial completo. Actualiza para ver los logros.' : 'Preparando consulta…')}</p>}
  </details>
}
