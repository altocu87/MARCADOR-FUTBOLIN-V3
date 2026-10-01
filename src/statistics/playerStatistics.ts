import type { MatchSummary } from '../services/persistence/models'

export interface PlayerStatistics {
  played: number; wins: number; losses: number; draws: number
  winRate: number; goalsFor: number; goalsAgainst: number; goalDifference: number
}

/** Derived, not incremented: a retried match ID contributes exactly once.
 * Goals belong to the player's team; shootout kicks never inflate them.
 */
export function playerStatistics(matches: readonly MatchSummary[], playerId: string): PlayerStatistics {
  const result: PlayerStatistics = { played: 0, wins: 0, losses: 0, draws: 0, winRate: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0 }
  const seen = new Map<string, string>()
  for (const match of matches) {
    if (match.test_mode !== false || match.status !== 'MATCH_END') continue
    const participants = match.participants.filter(p => p.player_id === playerId)
    if (!participants.length) continue
    const participant = participants[0]
    const validScore = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    if (participants.length !== 1 || !['WHITE', 'BLUE'].includes(participant.team) || !match.id || !validScore(match.white_score) || !validScore(match.blue_score)) throw new Error('Resultado incompatible. No se muestran estadísticas parciales.')
    const white = match.went_to_penalties ? match.penalty_white_score : match.white_score
    const blue = match.went_to_penalties ? match.penalty_blue_score : match.blue_score
    if (!validScore(white) || !validScore(blue) || match.went_to_penalties && (match.white_score !== match.blue_score || white === blue)) throw new Error('Resultado de penaltis incompatible.')
    const winner = white === blue ? null : white > blue ? 'WHITE' : 'BLUE'
    if (match.winner_team !== winner) throw new Error('Ganador incompatible con el resultado.')
    const fingerprint = JSON.stringify([participant.team, match.white_score, match.blue_score, winner, match.went_to_penalties, white, blue])
    if (seen.has(match.id)) {
      if (seen.get(match.id) !== fingerprint) throw new Error('Hay dos resultados distintos para el mismo partido.')
      continue
    }
    seen.set(match.id, fingerprint)
    result.played++
    if (!winner) result.draws++
    else if (winner === participant.team) result.wins++
    else result.losses++
    result.goalsFor += participant.team === 'WHITE' ? match.white_score : match.blue_score
    result.goalsAgainst += participant.team === 'WHITE' ? match.blue_score : match.white_score
  }
  result.winRate = result.played ? Math.round(result.wins / result.played * 1_000) / 10 : 0
  result.goalDifference = result.goalsFor - result.goalsAgainst
  return result
}
