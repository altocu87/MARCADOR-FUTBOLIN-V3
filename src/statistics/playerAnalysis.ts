import { matchFormat, type MatchFormat } from './matchFormat'
import type { MatchMode } from '../match-engine/types'
import type { MatchSummary } from '../services/persistence/models'
import { playerStatistics, type PlayerStatistics } from './playerStatistics'

export interface AnalysisFilter {
  from: string
  to: string
  mode: 'ALL' | MatchMode
  format: 'ALL' | MatchFormat
}
export const emptyAnalysisFilter: AnalysisFilter = { from: '', to: '', mode: 'ALL', format: 'ALL' }
export type Outcome = 'WIN' | 'LOSS' | 'DRAW'
export interface PlayerResult {
  match: MatchSummary
  outcome: Outcome
  format: MatchFormat
  goalsFor: number
  goalsAgainst: number
  timestamp: number
  fraction: string
}
export interface PlayerAnalysis {
  totals: PlayerStatistics
  matches: MatchSummary[]
  recent: PlayerResult[]
  currentStreak: { outcome: Outcome | null; length: number }
  bestWinStreak: number
  byFormat: { format: MatchFormat; totals: PlayerStatistics }[]
  evolution: { id: string; finishedAt: string; played: number; winRate: number }[]
}

/** Calendar dates in the device timezone. The upper bound is exclusive and
 * advances a calendar day (not 24 hours), including days affected by DST. */
function dateBoundary(value: string, nextDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Fecha no válida.')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year, month - 1, day); date.setHours(0, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error('Fecha no válida.')
  if (nextDay) date.setDate(date.getDate() + 1)
  return date.getTime()
}

export function validateAnalysisFilter(filter: AnalysisFilter) {
  if (!['ALL', 'QUICK', 'CHAOS', 'RANKED'].includes(filter.mode) || !['ALL', '1v1', '1v2', '2v2'].includes(filter.format)) throw new Error('Filtro no válido.')
  const from = filter.from ? dateBoundary(filter.from) : -Infinity
  const to = filter.to ? dateBoundary(filter.to, true) : Infinity
  if (from >= to) throw new Error('La fecha Desde debe ser anterior o igual a Hasta.')
  return { from, to }
}

export function preparePlayerResults(matches: readonly MatchSummary[], playerId: string): PlayerResult[] {
  // Share the existing result validation, including shootouts and conflicts.
  playerStatistics(matches, playerId)
  const seen = new Map<string, string>()
  const results: PlayerResult[] = []
  for (const match of matches) {
    if (match.test_mode !== false || match.status !== 'MATCH_END') continue
    const participant = match.participants.find(p => p.player_id === playerId)
    if (!participant) continue
    const format = matchFormat(match)
    const timestamp = Date.parse(match.finished_at)
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(match.finished_at) || !Number.isFinite(timestamp) ||
      !['QUICK', 'CHAOS', 'RANKED'].includes(match.match_type)) throw new Error('Fecha o modalidad del partido incompatible.')
    // Beyond milliseconds, compare fractions too; UUID breaks exact time ties.
    const fraction = (match.finished_at.match(/\.(\d+)/)?.[1] ?? '').padEnd(3, '0').slice(3)
    const fingerprint = JSON.stringify([timestamp, fraction.replace(/0+$/, ''), match.match_type,
      [...match.participants].map(p => [p.player_id, p.team]).sort((a, b) => a[0].localeCompare(b[0]))])
    if (seen.has(match.id)) {
      if (seen.get(match.id) !== fingerprint) throw new Error('Datos distintos para el mismo partido.')
      continue
    }
    seen.set(match.id, fingerprint)
    results.push({ match, timestamp, fraction, format,
      outcome: match.winner_team === null ? 'DRAW' : match.winner_team === participant.team ? 'WIN' : 'LOSS',
      goalsFor: participant.team === 'WHITE' ? match.white_score : match.blue_score,
      goalsAgainst: participant.team === 'WHITE' ? match.blue_score : match.white_score })
  }
  return results.sort((a, b) => a.timestamp - b.timestamp ||
    a.fraction.padEnd(Math.max(a.fraction.length, b.fraction.length), '0').localeCompare(b.fraction.padEnd(Math.max(a.fraction.length, b.fraction.length), '0')) || a.match.id.localeCompare(b.match.id))
}

/** Every section uses the same filtered set, sorted oldest to newest. */
export function analyzePlayerResults(results: readonly PlayerResult[], playerId: string, filter: AnalysisFilter = emptyAnalysisFilter): PlayerAnalysis {
  const { from, to } = validateAnalysisFilter(filter)
  const selected = results.filter(r => r.timestamp >= from && r.timestamp < to &&
    (filter.mode === 'ALL' || r.match.match_type === filter.mode) && (filter.format === 'ALL' || r.format === filter.format))
  let bestWinStreak = 0, consecutiveWins = 0, wins = 0
  const currentStreak: PlayerAnalysis['currentStreak'] = { outcome: null, length: 0 }
  const evolution = selected.map((r, i) => {
    if (r.outcome === 'WIN') { wins++; consecutiveWins++ } else consecutiveWins = 0
    bestWinStreak = Math.max(bestWinStreak, consecutiveWins)
    currentStreak.length = currentStreak.outcome === r.outcome ? currentStreak.length + 1 : 1
    currentStreak.outcome = r.outcome
    return { id: r.match.id, finishedAt: r.match.finished_at, played: i + 1, winRate: Math.round(wins / (i + 1) * 1_000) / 10 }
  })
  const matches = selected.map(r => r.match)
  return { totals: playerStatistics(matches, playerId), matches: [...matches].reverse(), recent: selected.slice(-5).reverse(),
    currentStreak, bestWinStreak, evolution,
    byFormat: (['1v1', '1v2', '2v2'] as const).map(format => ({ format, totals: playerStatistics(selected.filter(r => r.format === format).map(r => r.match), playerId) })) }
}
