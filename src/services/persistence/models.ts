import type { MatchMode, MatchPeriod, Team, TimelineEventType, VictoryCondition } from '../../match-engine/types'

export interface Player {
  id: string
  name: string
  nickname: string | null
  photoUrl: string | null
  active: boolean
  level: number
}
export interface PlayerDraft { name: string; nickname: string; photoUrl: string }
export interface Participant { player_id: string; player_name: string; team: Team; position: number }
export interface MatchRecord {
  id: string
  match_type: MatchMode
  status: 'MATCH_END'
  victory_condition: VictoryCondition
  goal_limit: number
  time_limit_seconds: number
  white_score: number
  blue_score: number
  winner_team: Team | null
  started_at: string
  finished_at: string
  went_to_extra_time: boolean
  went_to_penalties: boolean
  penalty_white_score: number | null
  penalty_blue_score: number | null
  penalty_white_attempts: number | null
  penalty_blue_attempts: number | null
  test_mode: boolean
}
export interface StoredEvent {
  event_type: TimelineEventType
  team: Team | null
  period: MatchPeriod
  match_time_seconds: number
  period_time_seconds: number
  white_score: number
  blue_score: number
  sequence: number
  penalty_scored: boolean | null
  metadata: Record<string, string | number | boolean | null>
  occurred_at: string
}
export interface MatchDocument { match: MatchRecord; participants: Participant[]; events: StoredEvent[]; owner_id?: string }
export interface MatchSummary extends MatchRecord { participants: Participant[] }
export const activePlayers = (players: Player[]) => players.filter(player => player.active)
