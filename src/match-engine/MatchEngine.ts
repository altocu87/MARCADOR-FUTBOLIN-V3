import type { GoalEffect, GoalEvent, MatchCheckpoint, MatchConfiguration, MatchEvent, MatchPeriod, MatchState, MatchStateListener, PenaltyState, Team, TimelineEventType } from './types'
import { validateCheckpoint } from './checkpoint'

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
  private sequence = 0
  private completedTimeSeconds = 0

  constructor(
    private readonly now: Now = () => Date.now(),
    private readonly pickEffect: () => GoalEffect = () => effects[Math.floor(Math.random() * effects.length)],
  ) {}

  getState = (): Readonly<MatchState> => this.state

  getCheckpoint(): MatchCheckpoint {
    return { version: 1, state: structuredClone(this.state), completedTimeSeconds: this.completedTimeSeconds,
      goalSequence: this.sequence, capturedAtMs: this.now(), goalLockRemainingMs: Math.max(0, this.goalLockUntil - this.now()) }
  }

  restoreCheckpoint(checkpoint: unknown): void {
    validateCheckpoint(checkpoint)
    const copy = structuredClone(checkpoint)
    const now = this.now()
    this.completedTimeSeconds = copy.completedTimeSeconds
    this.sequence = copy.goalSequence
    // Wall time only expires the anti-bounce lock, never advances match time.
    this.goalLockUntil = now + Math.max(0, copy.goalLockRemainingMs - Math.max(0, now - copy.capturedAtMs))
    this.clockStartedAt = now - copy.state.elapsedSeconds * 1_000
    this.countdownUntil = now + COUNTDOWN_MS
    this.state = { ...copy.state, ...this.goalLockState(['PLAYING', 'PAUSED', 'PERIOD_END', 'MATCH_END'].includes(copy.state.status)) }
    if (copy.state.status === 'PLAYING') {
      this.state = { ...this.state, status: 'PAUSED' }
      this.record('pause', null, { recovered: true })
    } else if (copy.state.status === 'COUNTDOWN') this.state = { ...this.state, countdownValue: 3 }
    this.emit()
  }

  createMatch(config: MatchConfiguration): void {
    this.completedTimeSeconds = 0
    this.sequence = 0
    this.goalLockUntil = 0
    this.state = { startedAt: new Date(this.now()).toISOString(), finishedAt: null, events: [], elapsedSeconds: 0,
      status: 'COUNTDOWN', period: 'FIRST_HALF', config, whiteGoals: 0, blueGoals: 0,
      remainingSeconds: config.halfDurationMinutes * 60, periodInitialSeconds: config.halfDurationMinutes * 60,
      countdownValue: 3, goalInputLocked: false, goalLockRemainingMs: 0, goals: [], lastGoal: null, penalty: null, periodResult: null }
    this.countdownUntil = this.now() + COUNTDOWN_MS
    this.emit()
  }

  dispatch(event: MatchEvent): void {
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
      this.state = { ...this.state, elapsedSeconds, remainingSeconds, goalInputLocked, goalLockRemainingMs }
      this.emit()
    }
    if (remainingSeconds === 0 && (this.state.period === 'EXTRA_TIME' || this.state.config?.victoryCondition !== 'GOALS')) this.endPeriod()
  }

  skipCountdown(): void { if (this.state.status === 'COUNTDOWN') this.beginPeriod(this.now()) }

  continueToNextPeriod(): void {
    if (this.state.status !== 'PERIOD_END') return
    if (this.state.period === 'FIRST_HALF') this.preparePeriod('SECOND_HALF')
    else if (this.state.period === 'SECOND_HALF' && this.state.whiteGoals === this.state.blueGoals) this.startExtraTime()
    else if (this.state.period === 'EXTRA_TIME') this.startPenalties()
    else this.finishMatch()
  }

  subscribe(listener: MatchStateListener): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener) }

  private registerGoal(team: Team): void {
    this.tick()
    if (this.state.status !== 'PLAYING' || this.state.goalInputLocked || this.now() < this.goalLockUntil) return
    const now = this.now()
    const whiteGoals = this.state.whiteGoals + (team === 'WHITE' ? 1 : 0)
    const blueGoals = this.state.blueGoals + (team === 'BLUE' ? 1 : 0)
    const elapsedSeconds = this.state.elapsedSeconds
    const goal: GoalEvent = { id: `goal-${++this.sequence}`, team, period: this.state.period, elapsedSeconds,
      timestamp: this.formatTime(elapsedSeconds), scoreWhite: whiteGoals, scoreBlue: blueGoals, effect: this.pickEffect() }
    this.goalLockUntil = now + GOAL_LOCK_MS
    this.state = { ...this.state, whiteGoals, blueGoals, goals: [...this.state.goals, goal], lastGoal: goal, goalInputLocked: true, goalLockRemainingMs: GOAL_LOCK_MS }
    this.record('goal', team, { goalId: goal.id, effect: goal.effect })
    if (this.state.period === 'EXTRA_TIME') this.finishMatch()
    else if (this.hasReachedGoalLimit()) this.endPeriod()
    else this.emit() // Subscribers only checkpoint the settled state of an action.
  }

  private hasReachedGoalLimit(): boolean {
    const config = this.state.config
    if (!config || (config.victoryCondition !== 'GOALS' && config.victoryCondition !== 'BOTH')) return false
    return this.state.goals.filter((goal) => goal.period === this.state.period).length >= config.goalLimit
  }

  private pause(): void {
    if (this.state.status !== 'PLAYING') return
    this.tick()
    if (this.state.status !== 'PLAYING') return
    this.state = { ...this.state, status: 'PAUSED', ...this.goalLockState(true) }
    this.record('pause')
    this.emit()
  }

  private continue(): void {
    if (this.state.status !== 'PAUSED') return
    this.clockStartedAt = this.now() - this.state.elapsedSeconds * 1_000
    this.state = { ...this.state, status: 'PLAYING', ...this.goalLockState() }
    this.record('resume')
    this.emit()
  }

  private endPeriod(): void {
    if (this.state.status !== 'PLAYING' && this.state.status !== 'PAUSED') return
    this.state = { ...this.state, status: 'PERIOD_END', ...this.goalLockState(true),
      periodResult: { whiteGoals: this.state.whiteGoals, blueGoals: this.state.blueGoals } }
    this.record('period_end')
    this.emit()
  }

  private preparePeriod(period: MatchPeriod): void {
    this.completedTimeSeconds += this.state.elapsedSeconds
    const seconds = period === 'EXTRA_TIME' ? EXTRA_TIME_SECONDS : (this.state.config?.halfDurationMinutes ?? 5) * 60
    this.state = { ...this.state, period, status: 'COUNTDOWN', elapsedSeconds: 0, remainingSeconds: seconds, periodInitialSeconds: seconds, countdownValue: 3,
      ...this.goalLockState(), periodResult: null }
    this.countdownUntil = this.now() + COUNTDOWN_MS
    this.emit()
  }

  private startExtraTime(): void { if (this.state.config) this.preparePeriod('EXTRA_TIME') }

  private startPenalties(): void {
    if (!this.state.config) return
    this.completedTimeSeconds += this.state.elapsedSeconds
    this.state = { ...this.state, elapsedSeconds: 0, period: 'PENALTIES', status: 'PENALTIES', ...this.goalLockState(),
      penalty: { whiteGoals: 0, blueGoals: 0, whiteAttempts: 0, blueAttempts: 0, suddenDeath: false } }
    this.record('period_start')
    this.emit()
  }

  private registerPenalty(event: MatchEvent): void {
    if (this.state.status !== 'PENALTIES' || !this.state.penalty) return
    const white = event === 'PENALTI_BLANCO_GOL' || event === 'PENALTI_BLANCO_FALLO'
    const blue = event === 'PENALTI_AZUL_GOL' || event === 'PENALTI_AZUL_FALLO'
    if (!white && !blue) return
    const isGoal = event.endsWith('_GOL')
    const penalty: PenaltyState = { ...this.state.penalty }
    if (white && penalty.whiteAttempts !== penalty.blueAttempts) return
    if (blue && penalty.blueAttempts >= penalty.whiteAttempts) return
    if (white) { penalty.whiteAttempts += 1; if (isGoal) penalty.whiteGoals += 1 }
    if (blue) { penalty.blueAttempts += 1; if (isGoal) penalty.blueGoals += 1 }
    if (penalty.whiteAttempts >= 5 && penalty.blueAttempts >= 5 && penalty.whiteGoals === penalty.blueGoals) penalty.suddenDeath = true
    this.state = { ...this.state, penalty }
    this.record('penalty', white ? 'WHITE' : 'BLUE', { whiteAttempts: penalty.whiteAttempts, blueAttempts: penalty.blueAttempts, whiteGoals: penalty.whiteGoals, blueGoals: penalty.blueGoals }, isGoal)
    if (this.penaltyIsDecided(penalty)) this.finishMatch()
    else this.emit()
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
    const removedId = this.state.goals[index].id
    const goals = this.state.goals.filter((_, goalIndex) => goalIndex !== index)
    this.state = { ...this.state, whiteGoals: this.state.whiteGoals - (team === 'WHITE' ? 1 : 0), blueGoals: this.state.blueGoals - (team === 'BLUE' ? 1 : 0), goals, lastGoal: goals.at(-1) ?? null, ...this.goalLockState(this.state.status === 'PAUSED') }
    this.record('score_correction', team, { goalId: removedId, delta: -1 })
    this.emit()
  }

  private undo(): void {
    if (!['PLAYING', 'PAUSED', 'PERIOD_END', 'MATCH_END'].includes(this.state.status) || this.state.period === 'PENALTIES') return
    const goal = this.state.goals.at(-1)
    if (!goal || goal.period !== this.state.period) return
    const current = this.state
    if (current.status === 'PERIOD_END' || current.status === 'MATCH_END') {
      this.clockStartedAt = this.now() - current.elapsedSeconds * 1_000
    }
    const goals = current.goals.slice(0, -1)
    this.state = { ...current, goals, lastGoal: goals.at(-1) ?? null,
      whiteGoals: current.whiteGoals - (goal.team === 'WHITE' ? 1 : 0), blueGoals: current.blueGoals - (goal.team === 'BLUE' ? 1 : 0),
      status: current.status === 'PAUSED' ? 'PAUSED' : 'PLAYING', ...this.goalLockState(current.status === 'PAUSED'), finishedAt: null }
    this.record('undo', goal.team, { goalId: goal.id })
    this.emit()
  }
  private beginPeriod(now: number): void {
    this.clockStartedAt = now
    this.state = { ...this.state, status: 'PLAYING', countdownValue: null, ...this.goalLockState(false, now) }
    this.record(this.state.period === 'EXTRA_TIME' ? 'extra_time_start' : 'period_start')
    this.emit()
  }
  private finishMatch(): void {
    this.state = { ...this.state, status: 'MATCH_END', finishedAt: new Date(this.now()).toISOString(), ...this.goalLockState(true) }
    this.record('match_end')
    this.emit()
  }
  /** Corrections and period transitions preserve the accepted goal's deadline. */
  private goalLockState(blocked = false, now = this.now()): Pick<MatchState, 'goalInputLocked' | 'goalLockRemainingMs'> {
    const goalLockRemainingMs = Math.max(0, this.goalLockUntil - now)
    return { goalInputLocked: blocked || goalLockRemainingMs > 0, goalLockRemainingMs }
  }
  private record(eventType: TimelineEventType, team: Team | null = null, metadata: Record<string, string | number | boolean | null> = {}, penaltyScored: boolean | null = null): void {
    this.state = { ...this.state, events: [...this.state.events, { sequence: this.state.events.length + 1, eventType, team,
      period: this.state.period, matchTimeSeconds: this.completedTimeSeconds + this.state.elapsedSeconds, periodTimeSeconds: this.state.elapsedSeconds,
      whiteScore: this.state.whiteGoals, blueScore: this.state.blueGoals, penaltyScored, occurredAt: new Date(this.now()).toISOString(), metadata }] }
  }
  private createIdleState(): MatchState { return { startedAt: null, finishedAt: null, events: [], elapsedSeconds: 0, status: 'IDLE', period: 'FIRST_HALF', config: null, whiteGoals: 0, blueGoals: 0, remainingSeconds: 0, periodInitialSeconds: 0, countdownValue: null, goalInputLocked: false, goalLockRemainingMs: 0, goals: [], lastGoal: null, penalty: null, periodResult: null } }
  private formatTime(seconds: number): string { return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}` }
  private emit(): void { this.listeners.forEach((listener) => listener(this.state)) }
}
