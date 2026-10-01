import type { MatchState } from '../../match-engine/types'
import type { MatchDocument, Participant, Player } from './models'

export function participantsFor(players: Player[]): Participant[] {
  if (![2, 4].includes(players.length) || new Set(players.map(p => p.id)).size !== players.length || players.some(p => !p.active)) {
    throw new Error('Selecciona dos o cuatro jugadores activos y distintos.')
  }
  return players.map((player, index) => ({ player_id: player.id, player_name: player.nickname || player.name,
    team: index % 2 === 0 ? 'WHITE' : 'BLUE', position: Math.floor(index / 2) + 1 }))
}

export function mapMatch(state: Readonly<MatchState>, players: Player[], id: string, testMode: boolean): MatchDocument {
  if (state.status !== 'MATCH_END' || !state.config || !state.startedAt || !state.finishedAt) throw new Error('El partido todavía no ha finalizado.')
  const penalty = state.penalty
  const white = penalty?.whiteGoals ?? state.whiteGoals
  const blue = penalty?.blueGoals ?? state.blueGoals
  return {
    match: { id, match_type: state.config.mode, status: 'MATCH_END', victory_condition: state.config.victoryCondition,
      goal_limit: state.config.goalLimit, time_limit_seconds: state.config.halfDurationMinutes * 60,
      white_score: state.whiteGoals, blue_score: state.blueGoals, winner_team: white === blue ? null : white > blue ? 'WHITE' : 'BLUE',
      started_at: state.startedAt, finished_at: state.finishedAt,
      went_to_extra_time: state.events.some(e => e.period === 'EXTRA_TIME'), went_to_penalties: penalty !== null,
      penalty_white_score: penalty?.whiteGoals ?? null, penalty_blue_score: penalty?.blueGoals ?? null,
      penalty_white_attempts: penalty?.whiteAttempts ?? null, penalty_blue_attempts: penalty?.blueAttempts ?? null, test_mode: testMode },
    participants: participantsFor(players),
    events: state.events.map(event => ({ event_type: event.eventType, team: event.team, period: event.period,
      match_time_seconds: event.matchTimeSeconds, period_time_seconds: event.periodTimeSeconds,
      white_score: event.whiteScore, blue_score: event.blueScore, sequence: event.sequence, penalty_scored: event.penaltyScored,
      metadata: event.metadata, occurred_at: event.occurredAt })),
  }
}
