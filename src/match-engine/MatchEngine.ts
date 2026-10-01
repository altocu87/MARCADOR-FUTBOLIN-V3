import type { GoalEffect, GoalEvent, MatchCheckpoint, MatchConfiguration, MatchEvent, MatchPeriod, MatchState, MatchStateListener, PenaltyState, Team } from './types'

const GOAL_LOCK_MS = 3_000
const COUNTDOWN_MS = 3_000
const EXTRA_TIME_SECONDS = 60
const effects: GoalEffect[] = ['flash', 'explosion', 'waves', 'particles', 'speed-lines']
type Now = () => number

/** Motor puro: no conoce React, el DOM ni el hardware. */
export class MatchEngine {
  private state: MatchState = this.createIdleState()
  private listeners = new Set<MatchStateListener>()
  private goalLockUntil = 0
  private countdownUntil = 0
  private clockStartedAt = 0
  private undoStack: MatchState[] = []
  private sequence = 0

  constructor(
    private readonly now: Now = () => Date.now(),
    private readonly pickEffect: () => GoalEffect = () => effects[Math.floor(Math.random() * effects.length)],
  ) {}

  getState = (): Readonly<MatchState> => this.state

  exportCheckpoint(): MatchCheckpoint {
    return structuredClone({ state: this.state, undoStack: this.undoStack, sequence: this.sequence })
  }

  /** Recuperar no consume tiempo mientras la aplicación está cerrada. */
  restore(checkpoint: MatchCheckpoint): void {
    const saved = structuredClone(checkpoint)
    this.state = saved.state
    this.undoStack = saved.undoStack
    this.sequence = saved.sequence
    this.goalLockUntil = 0
    this.countdownUntil = 0
    this.clockStartedAt = 0
    if (['PLAYING', 'COUNTDOWN', 'PAUSED'].includes(this.state.status)) {
      this.state = { ...this.state, status: 'PAUSED', countdownValue: null, goalInputLocked: true }
    }
    this.emit()
  }

  createMatch(config: MatchConfiguration): void {
    if (!['QUICK', 'CHAOS', 'RANKED'].includes(config.mode) || !['GOALS', 'TIME', 'BOTH'].includes(config.victoryCondition)
      || !Number.isInteger(config.goalLimit) || config.goalLimit < 1 || config.goalLimit > 20
      || !Number.isInteger(config.halfDurationMinutes) || config.halfDurationMinutes < 1 || config.halfDurationMinutes > 30) {
      throw new Error('Configuración de partido no válida.')
    }
    this.undoStack = []
    this.sequence = 0
    this.goalLockUntil = 0
    this.state = { status: 'COUNTDOWN', period: 'FIRST_HALF', config, whiteGoals: 0, blueGoals: 0,
      remainingSeconds: config.halfDurationMinutes * 60, elapsedSeconds: 0, periodInitialSeconds: config.halfDurationMinutes * 60,
      countdownValue: 3, goalInputLocked: false, goalLockRemainingMs: 0, goals: [], lastGoal: null, penalty: null, periodResult: null }
    this.countdownUntil = this.now() + COUNTDOWN_MS
    this.emit()
  }

  dispatch(event: MatchEvent): void {
    if (this.state.status === 'IDLE' || this.state.status === 'MATCH_END') return
    switch (event) {
      case 'GOL_BLANCO': this.registerGoal('WHITE'); return
      case 'GOL_AZUL': this.registerGoal('BLUE'); return
      case 'DESHACER': this.undo(); return
      case 'QUITAR_GOL_BLANCO': this.removeLatestTeamGoal('WHITE'); return
      case 'QUITAR_GOL_AZUL': this.removeLatestTeamGoal('BLUE'); return
      case 'PAUSA': this.pause(); return
      case 'CONTINUAR': this.continue(); return
      case 'FINALIZAR_PARTE': if (this.state.status === 'PLAYING' || this.state.status === 'PAUSED') this.endPeriod(); return
      case 'FORZAR_PRORROGA': this.startExtraTime(); return
      case 'FORZAR_PENALTIS': this.startPenalties(); return
      default: this.registerPenalty(event)
    }
  }

  /** La UI llama a tick periódicamente; el cálculo de tiempo permanece dentro del motor. */
  tick(): void {
    const now = this.now()
    if (this.state.status === 'COUNTDOWN') {
      const countdownValue = Math.max(0, Math.ceil((this.countdownUntil - now) / 1_000))
      if (countdownValue !== this.state.countdownValue) {
        this.state = { ...this.state, countdownValue }
        this.emit()
      }
      if (now >= this.countdownUntil) this.beginPeriod(now)
      return
    }
    if (this.state.status !== 'PLAYING') return
    const goalLockRemainingMs = Math.max(0, this.goalLockUntil - now)
    const goalInputLocked = goalLockRemainingMs > 0
    const elapsedSeconds = Math.max(0, Math.floor((now - this.clockStartedAt) / 1_000))
    const remainingSeconds = Math.max(0, this.state.periodInitialSeconds - elapsedSeconds)
    if (elapsedSeconds !== this.state.elapsedSeconds || remainingSeconds !== this.state.remainingSeconds || goalInputLocked !== this.state.goalInputLocked || Math.ceil(goalLockRemainingMs / 100) !== Math.ceil(this.state.goalLockRemainingMs / 100)) {
      this.state = { ...this.state, remainingSeconds, elapsedSeconds, goalInputLocked, goalLockRemainingMs }
      this.emit()
    }
    if (remainingSeconds === 0 && (this.state.period === 'EXTRA_TIME' || this.state.config?.victoryCondition !== 'GOALS')) this.endPeriod()
  }

  skipCountdown(): void { if (this.state.status === 'COUNTDOWN') this.beginPeriod(this.now()) }

  continueToNextPeriod(): void {
    if (this.state.status !== 'PERIOD_END') return
    if (this.state.period === 'FIRST_HALF') this.preparePeriod('SECOND_HALF')
    else if (this.state.period === 'SECOND_HALF' && this.state.whiteGoals === this.state.blueGoals) this.startExtraTime()
    else if (this.state.period === 'EXTRA_TIME' && this.state.whiteGoals === this.state.blueGoals) this.startPenalties()
    else this.finishMatch()
  }

  subscribe(listener: MatchStateListener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }

  private registerGoal(team: Team): void {
    this.tick()
    if (this.state.status !== 'PLAYING' || this.state.goalInputLocked || this.now() < this.goalLockUntil) return
    this.undoStack.push(this.snapshot())
    const now = this.now()
    const whiteGoals = this.state.whiteGoals + (team === 'WHITE' ? 1 : 0)
    const blueGoals = this.state.blueGoals + (team === 'BLUE' ? 1 : 0)
    const elapsedSeconds = this.state.elapsedSeconds
    const goal: GoalEvent = { id: `goal-${++this.sequence}`, team, period: this.state.period, elapsedSeconds,
      timestamp: this.formatTime(elapsedSeconds), scoreWhite: whiteGoals, scoreBlue: blueGoals, effect: this.pickEffect() }
    this.goalLockUntil = now + GOAL_LOCK_MS
    this.state = { ...this.state, whiteGoals, blueGoals, goals: [...this.state.goals, goal], lastGoal: goal, goalInputLocked: true, goalLockRemainingMs: GOAL_LOCK_MS }
    this.emit()
    if (this.state.period === 'EXTRA_TIME') this.finishMatch()
    else if (this.hasReachedGoalLimit()) this.endPeriod()
  }

  private hasReachedGoalLimit(): boolean {
    const config = this.state.config
    if (!config || (config.victoryCondition !== 'GOALS' && config.victoryCondition !== 'BOTH')) return false
    return this.state.goals.filter((goal) => goal.period === this.state.period).length >= config.goalLimit
  }

  private pause(): void {
    if (this.state.status === 'COUNTDOWN') {
      this.state = { ...this.state, status: 'PAUSED', countdownValue: null, goalInputLocked: true, goalLockRemainingMs: 0 }
      this.emit()
      return
    }
    if (this.state.status !== 'PLAYING') return
    this.tick()
    if (this.state.status !== 'PLAYING') return
    const goalLockRemainingMs = Math.max(0, this.goalLockUntil - this.now())
    this.goalLockUntil = 0
    this.state = { ...this.state, status: 'PAUSED', goalInputLocked: true, goalLockRemainingMs }
    this.emit()
  }

  private continue(): void {
    if (this.state.status !== 'PAUSED') return
    this.clockStartedAt = this.now() - this.state.elapsedSeconds * 1_000
    this.goalLockUntil = this.now() + this.state.goalLockRemainingMs
    this.state = { ...this.state, status: 'PLAYING', goalInputLocked: this.state.goalLockRemainingMs > 0 }
    this.emit()
  }

  private endPeriod(): void {
    if (this.state.status !== 'PLAYING' && this.state.status !== 'PAUSED') return
    this.goalLockUntil = 0
    this.state = { ...this.state, status: 'PERIOD_END', goalInputLocked: true, goalLockRemainingMs: 0,
      periodResult: { whiteGoals: this.state.whiteGoals, blueGoals: this.state.blueGoals } }
    this.emit()
  }

  private preparePeriod(period: MatchPeriod): void {
    this.undoStack = []
    const seconds = period === 'EXTRA_TIME' ? EXTRA_TIME_SECONDS : (this.state.config?.halfDurationMinutes ?? 5) * 60
    this.goalLockUntil = 0
    this.state = { ...this.state, period, status: 'COUNTDOWN', remainingSeconds: seconds, elapsedSeconds: 0, periodInitialSeconds: seconds, countdownValue: 3,
      goalInputLocked: false, goalLockRemainingMs: 0, periodResult: null, penalty: null }
    this.countdownUntil = this.now() + COUNTDOWN_MS
    this.emit()
  }

  private startExtraTime(): void { if (this.state.config) this.preparePeriod('EXTRA_TIME') }

  private startPenalties(): void {
    if (!this.state.config) return
    this.undoStack = []
    this.goalLockUntil = 0
    this.state = { ...this.state, period: 'PENALTIES', status: 'PENALTIES', goalInputLocked: false, goalLockRemainingMs: 0,
      penalty: { whiteGoals: 0, blueGoals: 0, whiteAttempts: 0, blueAttempts: 0, suddenDeath: false } }
    this.emit()
  }

  private registerPenalty(event: MatchEvent): void {
    if (this.state.status !== 'PENALTIES' || !this.state.penalty) return
    const white = event === 'PENALTI_BLANCO_GOL' || event === 'PENALTI_BLANCO_FALLO'
    const blue = event === 'PENALTI_AZUL_GOL' || event === 'PENALTI_AZUL_FALLO'
    if (!white && !blue) return
    // El blanco lanza primero; no se permite que un equipo adelante dos turnos.
    if ((white && this.state.penalty.whiteAttempts !== this.state.penalty.blueAttempts)
      || (blue && this.state.penalty.whiteAttempts !== this.state.penalty.blueAttempts + 1)) return
    const isGoal = event.endsWith('_GOL')
    const penalty: PenaltyState = { ...this.state.penalty }
    if (white) { penalty.whiteAttempts += 1; if (isGoal) penalty.whiteGoals += 1 }
    if (blue) { penalty.blueAttempts += 1; if (isGoal) penalty.blueGoals += 1 }
    if (penalty.whiteAttempts >= 5 && penalty.blueAttempts >= 5 && penalty.whiteGoals === penalty.blueGoals) penalty.suddenDeath = true
    this.state = { ...this.state, penalty }
    this.emit()
    if (this.penaltyIsDecided(penalty)) this.finishMatch()
  }

  private penaltyIsDecided(penalty: PenaltyState): boolean {
    if (penalty.whiteAttempts < 5 || penalty.blueAttempts < 5) {
      return penalty.whiteGoals > penalty.blueGoals + 5 - penalty.blueAttempts || penalty.blueGoals > penalty.whiteGoals + 5 - penalty.whiteAttempts
    }
    return penalty.whiteAttempts === penalty.blueAttempts && penalty.whiteGoals !== penalty.blueGoals
  }

  private removeLatestTeamGoal(team: Team): void {
    if (this.state.status !== 'PLAYING' && this.state.status !== 'PAUSED') return
    const index = this.state.goals.map((goal) => goal.team).lastIndexOf(team)
    if (index < 0) return
    if (this.state.goals[index].period !== this.state.period) return
    this.undoStack.push(this.snapshot())
    let white = 0
    let blue = 0
    const goals = this.state.goals.filter((_, goalIndex) => goalIndex !== index).map((goal) => {
      if (goal.team === 'WHITE') white += 1
      else blue += 1
      return { ...goal, scoreWhite: white, scoreBlue: blue }
    })
    this.state = { ...this.state, whiteGoals: this.state.whiteGoals - (team === 'WHITE' ? 1 : 0), blueGoals: this.state.blueGoals - (team === 'BLUE' ? 1 : 0), goals, lastGoal: goals.at(-1) ?? null }
    this.emit()
  }

  private undo(): void {
    if (this.state.status !== 'PLAYING' && this.state.status !== 'PAUSED') return
    const previous = this.undoStack.pop()
    if (!previous) return
    this.goalLockUntil = 0
    this.state = { ...previous, status: this.state.status, remainingSeconds: this.state.remainingSeconds, elapsedSeconds: this.state.elapsedSeconds,
      countdownValue: null, goalInputLocked: this.state.status === 'PAUSED', goalLockRemainingMs: 0 }
    this.emit()
  }
  private beginPeriod(now: number): void { this.clockStartedAt = now; this.state = { ...this.state, status: 'PLAYING', countdownValue: null, goalInputLocked: false }; this.emit() }
  private finishMatch(): void { this.goalLockUntil = 0; this.state = { ...this.state, status: 'MATCH_END', goalInputLocked: true, goalLockRemainingMs: 0 }; this.emit() }
  private snapshot(): MatchState { return { ...this.state, goals: [...this.state.goals], penalty: this.state.penalty ? { ...this.state.penalty } : null } }
  private createIdleState(): MatchState { return { status: 'IDLE', period: 'FIRST_HALF', config: null, whiteGoals: 0, blueGoals: 0, remainingSeconds: 0, elapsedSeconds: 0, periodInitialSeconds: 0, countdownValue: null, goalInputLocked: false, goalLockRemainingMs: 0, goals: [], lastGoal: null, penalty: null, periodResult: null } }
  private formatTime(seconds: number): string { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }
  private emit(): void { this.listeners.forEach((listener) => listener(this.state)) }
}
