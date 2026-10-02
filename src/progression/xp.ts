import type { MatchSummary, Participant } from '../services/persistence/models'
import { matchFormat } from '../statistics/matchFormat'
import { playerStatistics } from '../statistics/playerStatistics'

export interface XpRules {
  version: number
  enabled: boolean
  /** null includes all valid history; otherwise compare match start time. */
  eligibleFrom: string | null
  complete: number; win: number; draw: number; loss: number
  rankedWin: number; extraTimeWin: number; penaltiesWin: number
  /** Index is the level, value is cumulative XP. Persist exact integers. */
  thresholds: readonly number[]
}
export const approvedXpRules: XpRules = {
  version: 1, enabled: true, eligibleFrom: null,
  complete: 50, win: 100, draw: 60, loss: 25, rankedWin: 50, extraTimeWin: 25, penaltiesWin: 25,
  thresholds: Array.from({ length: 101 }, (_, level) => Math.ceil(100 * level ** 1.35)),
}
export interface PlayerProgression {
  playerId: string; xp: number; level: number; currentThreshold: number
  nextThreshold: number | null; maxLevel: number; confirmedMatches: number
  rulesVersion: number; enabled: boolean
}
const integer = (value: number) => Number.isSafeInteger(value) && value >= 0
export function validateXpRules(rules: XpRules): void {
  if (!integer(rules.version) || rules.version === 0 || typeof rules.enabled !== 'boolean'
    || [rules.complete, rules.win, rules.draw, rules.loss, rules.rankedWin, rules.extraTimeWin, rules.penaltiesWin].some(n => !integer(n))
    || rules.eligibleFrom !== null && !Number.isFinite(Date.parse(rules.eligibleFrom))
    || rules.thresholds.length < 2 || rules.thresholds.length > 1001 || rules.thresholds[0] !== 0
    || rules.thresholds.some((n, i) => !integer(n) || i > 0 && n <= rules.thresholds[i - 1])) throw new Error('Configuración XP incompatible.')
}
export function levelProgression(xp: number, thresholds: readonly number[]) {
  if (!integer(xp)) throw new Error('XP fuera del rango seguro.')
  let level = 0
  while (level + 1 < thresholds.length && xp >= thresholds[level + 1]) level++
  return { xp, level, currentThreshold: thresholds[level], nextThreshold: thresholds[level + 1] ?? null, maxLevel: thresholds.length - 1 }
}
function reward(match: MatchSummary, participant: Participant, rules: XpRules): number {
  if (match.winner_team === null) return rules.complete + rules.draw
  if (match.winner_team !== participant.team) return rules.complete + rules.loss
  return rules.complete + rules.win + (match.match_type === 'RANKED' ? rules.rankedWin : 0)
    + (match.went_to_penalties ? rules.penaltiesWin : match.went_to_extra_time ? rules.extraTimeWin : 0)
}
/** Reference recalculation from a complete CONFIRMED history, never a local queue.
 * Used for verification/fixtures; production reads the server's RLS projection.
 */
export function rebuildProgression(matches: readonly MatchSummary[], playerId: string, rules: XpRules): PlayerProgression {
  validateXpRules(rules)
  const seen = new Map<string, string>()
  let xp = 0, confirmedMatches = 0
  if (rules.enabled) for (const match of matches) {
    if (match.test_mode !== false || match.status !== 'MATCH_END' || !match.participants.some(p => p.player_id === playerId)) continue
    if (rules.eligibleFrom !== null && Date.parse(match.started_at) < Date.parse(rules.eligibleFrom)) continue
    // Reuse final score/winner/identity checks, then reject conflicting retries.
    playerStatistics([match], playerId)
    matchFormat(match)
    if (!['QUICK', 'CHAOS', 'RANKED'].includes(match.match_type) || !Number.isFinite(Date.parse(match.started_at))) throw new Error('Partido incompatible con XP.')
    const fingerprint = JSON.stringify([match.match_type, match.winner_team, match.went_to_extra_time, match.went_to_penalties,
      match.started_at, match.white_score, match.blue_score, match.penalty_white_score, match.penalty_blue_score,
      match.participants.map(p => [p.player_id, p.team, p.position]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))])
    if (seen.has(match.id)) {
      if (seen.get(match.id) !== fingerprint) throw new Error('Resultados XP distintos para el mismo partido.')
      continue
    }
    seen.set(match.id, fingerprint)
    xp += reward(match, match.participants.find(p => p.player_id === playerId)!, rules)
    confirmedMatches++
  }
  return { playerId, ...levelProgression(xp, rules.thresholds), confirmedMatches, rulesVersion: rules.version, enabled: rules.enabled }
}
