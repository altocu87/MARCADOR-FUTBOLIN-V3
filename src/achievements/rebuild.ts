import type { MatchSummary } from '../services/persistence/models'
import { preparePlayerResults } from '../statistics/playerAnalysis'
import { ACHIEVEMENT_CATALOG_VERSION, achievementCatalog, type AchievementMetric } from './catalog'

export interface AchievementHistory {
  accountId: string
  playerId: string
  source: 'confirmed' | 'pending' | 'practice'
  complete: boolean
  matches: readonly MatchSummary[]
}

/** Read-only badges reconstructed from the entire RLS-confirmed history.
 * No counters, writes, XP contributions or locally pending results. */
export function rebuildAchievements(history: AchievementHistory) {
  if (!history.accountId || !history.playerId || history.source !== 'confirmed' || !history.complete) {
    throw new Error('Los logros necesitan el historial confirmado completo.')
  }
  const unique = new Map<string, { match: MatchSummary; fingerprint: string }>()
  for (const match of history.matches) {
    if (match.status !== 'MATCH_END' || match.test_mode !== false) continue
    if (typeof match.went_to_extra_time !== 'boolean' || typeof match.went_to_penalties !== 'boolean') throw new Error('Hechos de prórroga o tanda incompatibles.')
    const fingerprint = JSON.stringify([match.match_type, match.white_score, match.blue_score, match.winner_team,
      match.finished_at, match.went_to_extra_time, match.went_to_penalties, match.penalty_white_score, match.penalty_blue_score,
      match.participants.map(p => [p.player_id, p.team, p.position]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))])
    const previous = unique.get(match.id)
    if (previous && previous.fingerprint !== fingerprint) throw new Error('Hechos distintos para el mismo partido.')
    unique.set(match.id, { match, fingerprint })
  }
  const results = preparePlayerResults([...unique.values()].map(row => row.match), history.playerId)
  const metrics: Record<AchievementMetric, number> = { played: 0, wins: 0, streak: 0, ranked_played: 0, ranked_wins: 0, team_goals: 0, clean_win: 0, extra_win: 0, penalty_win: 0 }
  const evidence = new Map<string, { matchId: string; finishedAt: string }>()
  let consecutive = 0
  for (const result of results) {
    const won = result.outcome === 'WIN'
    metrics.played++; metrics.wins += Number(won); metrics.team_goals += result.goalsFor
    consecutive = won ? consecutive + 1 : 0
    metrics.streak = Math.max(metrics.streak, consecutive)
    metrics.ranked_played += Number(result.match.match_type === 'RANKED')
    metrics.ranked_wins += Number(won && result.match.match_type === 'RANKED')
    metrics.clean_win += Number(won && result.goalsFor > 0 && result.goalsAgainst === 0)
    metrics.extra_win += Number(won && result.match.went_to_extra_time && !result.match.went_to_penalties)
    metrics.penalty_win += Number(won && result.match.went_to_penalties)
    for (const family of achievementCatalog) family.thresholds.forEach((threshold, index) => {
      const id = `${family.id}:tier_${index + 1}`
      if (!evidence.has(id) && metrics[family.id] >= threshold) evidence.set(id, { matchId: result.match.id, finishedAt: result.match.finished_at })
    })
  }
  const families = achievementCatalog.map(family => {
    const identity = `${history.accountId}:${history.playerId}:${family.id}`
    const value = metrics[family.id]
    const tiers = family.thresholds.map((threshold, index) => {
      const id = `${family.id}:tier_${index + 1}`
      return { id, level: index + 1, threshold, identity: `${identity}:tier_${index + 1}`,
        evidence: evidence.get(id) ?? null, progress: Math.min(value, threshold) }
    })
    const level = tiers.filter(tier => tier.evidence !== null).length
    return { ...family, identity, value, level, tiers, next: tiers[level] ?? null }
  })
  return { catalogVersion: ACHIEVEMENT_CATALOG_VERSION, families, metrics,
    stars: families.reduce((total, family) => total + family.level, 0), grantedExtraXp: 0 as const }
}

export type AchievementSnapshot = Omit<ReturnType<typeof rebuildAchievements>, 'grantedExtraXp'> & { grantedExtraXp: number }
