export type Team = 'WHITE' | 'BLUE'
export type MatchMode = 'QUICK' | 'CHAOS' | 'RANKED'
export type VictoryCondition = 'GOALS' | 'TIME' | 'BOTH'
export type MatchPeriod = 'FIRST_HALF' | 'SECOND_HALF' | 'EXTRA_TIME' | 'PENALTIES'
export type MatchStatus = 'IDLE' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'PERIOD_END' | 'MATCH_END' | 'PENALTIES'
export type GoalEffect = 'flash' | 'explosion' | 'waves' | 'particles' | 'speed-lines'

export interface MatchConfiguration {
  mode: MatchMode
  victoryCondition: VictoryCondition
  goalLimit: number
  halfDurationMinutes: number
}

export interface GoalEvent {
  id: string
  team: Team
  period: MatchPeriod
  elapsedSeconds: number
  timestamp: string
  scoreWhite: number
  scoreBlue: number
  effect: GoalEffect
}

export interface PenaltyState {
  whiteGoals: number
  blueGoals: number
  whiteAttempts: number
  blueAttempts: number
  suddenDeath: boolean
}

export interface MatchState {
  status: MatchStatus
  period: MatchPeriod
  config: MatchConfiguration | null
  whiteGoals: number
  blueGoals: number
  remainingSeconds: number
  elapsedSeconds: number
  periodInitialSeconds: number
  countdownValue: number | null
  goalInputLocked: boolean
  goalLockRemainingMs: number
  goals: GoalEvent[]
  lastGoal: GoalEvent | null
  penalty: PenaltyState | null
  periodResult: { whiteGoals: number; blueGoals: number } | null
}

export type MatchEvent =
  | 'GOL_BLANCO' | 'GOL_AZUL' | 'DESHACER' | 'PAUSA' | 'CONTINUAR'
  | 'QUITAR_GOL_BLANCO' | 'QUITAR_GOL_AZUL' | 'FINALIZAR_PARTE'
  | 'FORZAR_PRORROGA' | 'FORZAR_PENALTIS'
  | 'PENALTI_BLANCO_GOL' | 'PENALTI_BLANCO_FALLO'
  | 'PENALTI_AZUL_GOL' | 'PENALTI_AZUL_FALLO'

export type MatchStateListener = (state: Readonly<MatchState>) => void

/** Datos del motor necesarios para recuperar un partido y poder deshacer goles. */
export interface MatchCheckpoint {
  state: MatchState
  undoStack: MatchState[]
  sequence: number
}

export function getMatchWinner(state: Readonly<MatchState>): Team | null {
  if (state.penalty && state.status === 'MATCH_END' && state.penalty.whiteGoals !== state.penalty.blueGoals) {
    return state.penalty.whiteGoals > state.penalty.blueGoals ? 'WHITE' : 'BLUE'
  }
  if (state.whiteGoals === state.blueGoals) return null
  return state.whiteGoals > state.blueGoals ? 'WHITE' : 'BLUE'
}
