import type { MatchSummary } from '../services/persistence/models'
import { analyzePlayerResults, emptyAnalysisFilter, preparePlayerResults, type AnalysisFilter, type PlayerResult } from './playerAnalysis'

export function rankedForm(confirmed: readonly MatchSummary[], playerId: string) {
  return analyzePlayerResults(preparePlayerResults(confirmed, playerId), playerId, { ...emptyAnalysisFilter, mode: 'RANKED' }).recent
}
export function directEvidence(confirmed: readonly MatchSummary[], own: readonly string[], rival: readonly string[], filter: AnalysisFilter = { ...emptyAnalysisFilter, mode: 'RANKED' }) {
  if (![1, 2].includes(own.length) || ![1, 2].includes(rival.length) || new Set([...own, ...rival]).size !== own.length + rival.length || [...own, ...rival].some(id => !id)) throw new Error('Enfrentamiento incompatible.')
  const results = preparePlayerResults(confirmed, own[0])
  return evidenceFromResults(results, own, rival, filter)
}
export function evidenceFromResults(results: readonly PlayerResult[], own: readonly string[], rival: readonly string[], filter: AnalysisFilter) {
  const exact = results.filter(({ match }) => {
    const team = match.participants.find(p => p.player_id === own[0])?.team
    return team && match.participants.length === own.length + rival.length &&
      own.every(id => match.participants.some(p => p.player_id === id && p.team === team)) &&
      rival.every(id => match.participants.some(p => p.player_id === id && p.team !== team))
  })
  return analyzePlayerResults(exact, own[0], filter)
}
export function matchups(results: readonly PlayerResult[], playerId: string) {
  const pairs = new Map<string, { key: string; own: string[]; rival: string[] }>()
  for (const { match } of results) {
    const team = match.participants.find(p => p.player_id === playerId)!.team
    const own = match.participants.filter(p => p.team === team).map(p => p.player_id).sort()
    const rival = match.participants.filter(p => p.team !== team).map(p => p.player_id).sort()
    const key = JSON.stringify([own, rival])
    pairs.set(key, { key, own, rival })
  }
  return [...pairs.values()]
}
