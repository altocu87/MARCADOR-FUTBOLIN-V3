import type { MatchSummary, Player } from '../src/services/persistence/models'
import { preparePlayerResults } from '../src/statistics/playerAnalysis'
import { achievementCatalog, type AchievementMetric } from '../src/achievements/catalog'
import { rebuildAchievements } from '../src/achievements/rebuild'
import { matchFormat } from '../src/statistics/matchFormat'
import { rebuildCompetition, type EloRules } from '../src/competition/elo'

/** Records/Hall remain a proposal. Badge tiers use the production catalogue. */
export type Metric = AchievementMetric
export interface DraftAchievement { id: string; metric: Metric; threshold: number; xp: number; title: string }
export const draftCatalog: readonly DraftAchievement[] = achievementCatalog.flatMap(family =>
  family.thresholds.map((threshold, i) => ({ id: `${family.id}:tier_${i + 1}`, metric: family.id, threshold, xp: 0, title: `${family.title} · Nivel ${i + 1}` })))

export type RecordId = 'most_played' | 'most_wins' | 'best_streak' | 'biggest_margin' | 'most_team_goals' | 'best_win_rate' | 'current_elo' | 'max_elo'
export interface DraftRecord {
  id: RecordId; value: number | null; matchIds: string[]
  /** Exact ratio comparison; display rounding never determines ties. */
  ratio?: { wins: number; played: number }
}
export interface HistoryInput {
  source: 'confirmed' | 'pending' | 'practice'
  complete: boolean
  matches: readonly MatchSummary[]
}

export function reviewHonours(players: readonly Player[], inputs: readonly HistoryInput[], eloRules: EloRules) {
  const ids = new Set(players.map(p => p.id))
  if (ids.size !== players.length || players.some(p => !p.id)) throw new Error('Identidades incompatibles.')
  const confirmed = inputs.filter(input => input.source === 'confirmed')
  if (confirmed.some(input => !input.complete)) throw new Error('Historial confirmado incompleto.')
  const unique = new Map<string, { match: MatchSummary; fingerprint: string }>()
  for (const match of confirmed.flatMap(input => [...input.matches])) {
    if (match.status !== 'MATCH_END' || match.test_mode !== false) continue
    matchFormat(match)
    if (match.participants.some(p => !ids.has(p.player_id)) || typeof match.went_to_extra_time !== 'boolean' || typeof match.went_to_penalties !== 'boolean'
      || !Number.isFinite(Date.parse(match.started_at)) || Date.parse(match.started_at) > Date.parse(match.finished_at)) throw new Error('Hechos incompatibles.')
    // Validate all participants, results and timestamps, even outside selection.
    for (const p of match.participants) preparePlayerResults([match], p.player_id)
    const fingerprint = JSON.stringify([match.match_type, match.white_score, match.blue_score, match.winner_team,
      match.finished_at, match.started_at, match.went_to_extra_time, match.went_to_penalties,
      match.penalty_white_score, match.penalty_blue_score,
      match.participants.map(p => [p.player_id, p.team, p.position]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))])
    const old = unique.get(match.id)
    if (old && old.fingerprint !== fingerprint) throw new Error('Hechos distintos para el mismo partido.')
    unique.set(match.id, { match, fingerprint })
  }
  const history = [...unique.values()].map(row => row.match)
  const competitive = rebuildCompetition(players, history, eloRules).rows
  const rows = players.map(player => {
    const results = preparePlayerResults(history, player.id)
    const badges = rebuildAchievements({ accountId: 'fixture-account', playerId: player.id, source: 'confirmed', complete: true, matches: history })
    const metrics = badges.metrics
    const achievements = badges.families.flatMap(family => family.tiers.map(tier => ({
      ...draftCatalog.find(item => item.id === tier.id)!, progress: tier.progress,
      evidence: tier.evidence, identity: tier.identity,
    })))
    const maxFrom = (id: RecordId, select: (r: typeof results[number]) => number | null): DraftRecord => {
      const candidates = results.map(r => ({ id: r.match.id, value: select(r) })).filter((r): r is { id: string; value: number } => r.value !== null)
      const value = candidates.length ? Math.max(...candidates.map(r => r.value)) : null
      return { id, value, matchIds: candidates.filter(r => r.value === value).map(r => r.id) }
    }
    const elo = competitive.find(row => row.playerId === player.id)!
    const records: DraftRecord[] = [
      { id: 'most_played', value: metrics.played || null, matchIds: [] },
      { id: 'most_wins', value: metrics.played ? metrics.wins : null, matchIds: [] },
      { id: 'best_streak', value: metrics.played ? metrics.streak : null, matchIds: [] },
      maxFrom('biggest_margin', r => r.outcome === 'WIN' ? r.goalsFor - r.goalsAgainst : null),
      maxFrom('most_team_goals', r => r.goalsFor),
      { id: 'best_win_rate', value: metrics.played >= 20 ? metrics.wins / metrics.played * 100 : null,
        matchIds: [], ratio: { wins: metrics.wins, played: metrics.played } },
      { id: 'current_elo', value: elo.enabled && elo.classifiedMatches > 0 ? elo.elo : null, matchIds: [] },
      { id: 'max_elo', value: elo.enabled && elo.classifiedMatches > 0 ? elo.maxElo : null, matchIds: [] },
    ]
    return { player, achievements, records, metrics,
      proposedExtraXp: achievements.reduce((xp, a) => xp + (a.evidence ? a.xp : 0), 0),
      grantedExtraXp: 0 as const }
  })
  const hall = rows[0]?.records.map(record => {
    const candidates = rows.map(row => ({ player: row.player, record: row.records.find(r => r.id === record.id)! })).filter(row => row.record.value !== null)
    const compare = (a: DraftRecord, b: DraftRecord) => {
      const difference = record.id === 'best_win_rate'
        ? BigInt(a.ratio!.wins) * BigInt(b.ratio!.played) - BigInt(b.ratio!.wins) * BigInt(a.ratio!.played)
        : a.value! - b.value!
      return difference > 0 ? 1 : difference < 0 ? -1 : 0
    }
    candidates.sort((a, b) => compare(a.record, b.record) > 0 ? -1 : compare(a.record, b.record) < 0 ? 1 : a.player.id.localeCompare(b.player.id))
    const first = candidates[0]
    return { id: record.id, value: first?.record.value ?? null,
      leaders: first ? candidates.filter(row => compare(row.record, first.record) === 0).map(row => row.player) : [] }
  }) ?? []
  return { rows, hall, catalogVersion: 'tiers-v2' as const, approved: false as const }
}
