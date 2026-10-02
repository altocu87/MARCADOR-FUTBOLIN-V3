/** Reference design for block 04 ONLY. No imports from production UI/services.
 * Pair policy is a proposal, not an approved competitive rule.
 * Input must be a complete confirmed repository read; never merge local queues.
 */
import type { MatchSummary } from '../src/services/persistence/models'
import { analyzePlayerResults, emptyAnalysisFilter, preparePlayerResults, type AnalysisFilter } from '../src/statistics/playerAnalysis'

export function rankedForm(confirmed: readonly MatchSummary[], playerId: string) {
  return analyzePlayerResults(preparePlayerResults(confirmed, playerId), playerId,
    { ...emptyAnalysisFilter, mode: 'RANKED' }).recent
}

export function directEvidence(confirmed: readonly MatchSummary[], own: readonly string[], rival: readonly string[], filter: AnalysisFilter = emptyAnalysisFilter) {
  const size = own.length
  if (![1, 2].includes(size) || rival.length !== size || new Set([...own, ...rival]).size !== size * 2 ||
    [...own, ...rival].some(id => !id)) throw new Error('Enfrentamiento incompatible.')
  // Validate the whole perspective before filtering: conflicting copies must not
  // disappear just because one of them falls outside the selected pairing.
  const results = preparePlayerResults(confirmed, own[0])
  const exact = results.filter(result => {
    const match = result.match
    const team = match.participants.find(p => p.player_id === own[0])!.team
    return match.participants.length === size * 2 &&
      own.every(id => match.participants.some(p => p.player_id === id && p.team === team)) &&
      rival.every(id => match.participants.some(p => p.player_id === id && p.team !== team))
  })
  return analyzePlayerResults(exact, own[0], { ...filter, mode: 'RANKED' })
}

// Intentionally no enabled branch, percentages, weights, ELO estimates or
// production defaults. Decisions and closure of 03 are still required.
export const predictionDraft = Object.freeze({
  status: 'WAITING_BLOCK03' as const,
  probability: null,
  confidence: null,
  message: 'Previsión pendiente: cierre competitivo de 03 y reglas de 04.',
})
