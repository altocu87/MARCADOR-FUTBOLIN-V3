import type { MatchSummary, Player } from '../services/persistence/models'
import { playerStatistics } from '../statistics/playerStatistics'

export const categoryNames = ['BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE', 'ÉLITE'] as const
export type Category = typeof categoryNames[number]
export interface EloRules {
  version: number; enabled: boolean; initial: 1200; eligibleFrom: string | null
  provisionalMatches: number; provisionalK: number; establishedK: number
  rounding: 'nearest-away'; categoryThresholds: readonly number[]; hysteresis: number
  /** Indices 0..5: draw, margin 1, 2, 3, 4, 5+. Shootouts always use 1. */
  marginMultipliers: readonly number[]
}
export interface CompetitivePlayer {
  playerId: string; name: string; nickname: string | null; active: boolean
  elo: number; maxElo: number; classifiedMatches: number; category: Category | null
  rank: number | null; enabled: boolean; rulesVersion: number
}
export interface EloAdjustment {
  matchId: string; playerId: string; before: number; after: number; delta: number; k: number
  expectation: number; multiplier: number; category: Category; maxElo: number
}
const integer = (n: number) => Number.isSafeInteger(n)
export function validateEloRules(r: EloRules): void {
  if (!integer(r.version) || r.version < 1 || typeof r.enabled !== 'boolean' || r.initial !== 1200
    || r.eligibleFrom !== null && !Number.isFinite(Date.parse(r.eligibleFrom))
    || !integer(r.provisionalMatches) || r.provisionalMatches < 1 || r.provisionalMatches > 1000
    || [r.provisionalK, r.establishedK].some(k => !integer(k) || k < 1 || k > 1000)
    || r.rounding !== 'nearest-away' || r.categoryThresholds.length !== 6 || r.categoryThresholds[0] !== 0
    || r.categoryThresholds.some((n, i) => !integer(n) || i > 0 && n <= r.categoryThresholds[i - 1])
    || !integer(r.hysteresis) || r.hysteresis < 0 || r.hysteresis > 100
    || r.marginMultipliers.length !== 6 || r.marginMultipliers[0] !== 1
    || r.marginMultipliers.some(n => !Number.isFinite(n) || n < 0.1 || n > 2)) throw new Error('Configuración ELO incompatible.')
}
export function roundEloAdjustment(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Ajuste ELO incompatible.')
  return Math.sign(value) * Math.floor(Math.abs(value) + 0.5)
}
export function categoryIndex(elo: number, previous: number | null, thresholds: readonly number[], hysteresis: number): number {
  let index = previous ?? 0
  while (index < thresholds.length - 1 && elo >= thresholds[index + 1]) index++
  while (index > 0 && elo < thresholds[index] - hysteresis) index--
  return index
}
function instant(date: string): bigint {
  const match = date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{1,6}))?(?:Z|[+-]\d{2}:\d{2})$/)
  const ms = Date.parse(date)
  if (!match || !Number.isFinite(ms)) throw new Error('Fecha ELO incompatible.')
  const fraction = (match[1] ?? '').padEnd(6, '0')
  return BigInt(ms) * 1000n + BigInt(fraction.slice(3))
}
/** Reference replay over complete CONFIRMED history. Never used to grant ELO
 * in the browser: production reads the invoker/RLS server snapshot.
 * Finished timestamp (microseconds), then immutable UUID, decide replay order.
 */
export function rebuildCompetition(players: readonly Pick<Player, 'id' | 'name' | 'nickname' | 'active'>[], history: readonly MatchSummary[], rules: EloRules) {
  validateEloRules(rules)
  const state = new Map<string, CompetitivePlayer>()
  const categories = new Map<string, number>()
  for (const p of players) {
    if (!p.id || state.has(p.id)) throw new Error('Identidad competitiva duplicada.')
    const index = categoryIndex(1200, null, rules.categoryThresholds, 0)
    categories.set(p.id, index)
    state.set(p.id, { playerId: p.id, name: p.name, nickname: p.nickname, active: p.active,
      elo: 1200, maxElo: 1200, classifiedMatches: 0, category: rules.enabled ? categoryNames[index] : null,
      rank: null, enabled: rules.enabled, rulesVersion: rules.version })
  }
  const unique = new Map<string, { match: MatchSummary; date: bigint; fingerprint: string }>()
  if (rules.enabled) for (const match of history) {
    if (match.match_type !== 'RANKED' || match.test_mode !== false || match.status !== 'MATCH_END') continue
    if (rules.eligibleFrom !== null && instant(match.started_at) < instant(rules.eligibleFrom)) continue
    const date = instant(match.finished_at)
    if (instant(match.started_at) > date || !match.id || ![2, 4].includes(match.participants.length)
      || new Set(match.participants.map(p => p.player_id)).size !== match.participants.length
      || match.participants.filter(p => p.team === 'WHITE').length * 2 !== match.participants.length) throw new Error('Equipos ELO incompatibles.')
    for (const p of match.participants) {
      if (!state.has(p.player_id) || ![1, 2].includes(p.position) || match.participants.length === 2 && p.position !== 1) throw new Error('Identidad ELO incompatible.')
      playerStatistics([match], p.player_id)
    }
    if (new Set(match.participants.map(p => `${p.team}:${p.position}`)).size !== match.participants.length) throw new Error('Plazas ELO duplicadas.')
    const fingerprint = JSON.stringify([String(date), String(instant(match.started_at)), match.white_score, match.blue_score,
      match.winner_team, match.went_to_penalties, match.penalty_white_score, match.penalty_blue_score,
      match.participants.map(p => [p.player_id, p.team, p.position]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))])
    const old = unique.get(match.id)
    if (old && old.fingerprint !== fingerprint) throw new Error('Resultados ELO distintos para el mismo partido.')
    unique.set(match.id, { match, date, fingerprint })
  }
  const adjustments: EloAdjustment[] = []
  const ordered = [...unique.values()].sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.match.id.localeCompare(b.match.id))
  for (const { match } of ordered) {
    const mean = (team: string) => {
      const ids = match.participants.filter(p => p.team === team)
      return ids.reduce((total, p) => total + state.get(p.player_id)!.elo, 0) / ids.length
    }
    // Both averages and expectations are fixed BEFORE any teammate is updated.
    const whiteExpectation = 1 / (1 + 10 ** ((mean('BLUE') - mean('WHITE')) / 400))
    const multiplier = match.went_to_penalties || match.winner_team === null ? 1
      : rules.marginMultipliers[Math.min(5, Math.abs(match.white_score - match.blue_score))]
    for (const p of match.participants) {
      const row = state.get(p.player_id)!
      const expectation = p.team === 'WHITE' ? whiteExpectation : 1 - whiteExpectation
      const result = match.winner_team === null ? 0.5 : match.winner_team === p.team ? 1 : 0
      const k = row.classifiedMatches < rules.provisionalMatches ? rules.provisionalK : rules.establishedK
      const before = row.elo
      const delta = roundEloAdjustment(k * multiplier * (result - expectation))
      row.elo += delta; row.classifiedMatches++
      if (!integer(row.elo)) throw new Error('ELO fuera del rango seguro.')
      row.maxElo = Math.max(row.maxElo, row.elo)
      const index = categoryIndex(row.elo, categories.get(p.player_id)!, rules.categoryThresholds, rules.hysteresis)
      categories.set(p.player_id, index); row.category = categoryNames[index]
      adjustments.push({ matchId: match.id, playerId: p.player_id, before, after: row.elo, delta, k, expectation, multiplier, category: row.category, maxElo: row.maxElo })
    }
  }
  const rows = [...state.values()].sort((a, b) => Number(b.classifiedMatches > 0) - Number(a.classifiedMatches > 0) || b.elo - a.elo || a.playerId.localeCompare(b.playerId))
  let lastElo: number | null = null, rank = 0
  rows.forEach((row, i) => { if (row.classifiedMatches) { if (row.elo !== lastElo) rank = i + 1; row.rank = rank; lastElo = row.elo } })
  return { rows, adjustments }
}
