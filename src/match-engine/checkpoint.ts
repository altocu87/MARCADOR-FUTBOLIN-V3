import type { MatchCheckpoint } from './types'

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const date = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))
const team = (value: unknown) => value === 'WHITE' || value === 'BLUE'
const period = (value: unknown) => ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES'].includes(String(value))
const score = (value: unknown): value is Record<string, unknown> & { whiteGoals: number; blueGoals: number } => object(value) && integer(value.whiteGoals) && integer(value.blueGoals)
const goal = (value: unknown): value is Record<string, unknown> => object(value) && typeof value.id === 'string' && /^goal-[1-9]\d*$/.test(value.id) && team(value.team) && period(value.period) && integer(value.elapsedSeconds) && typeof value.timestamp === 'string' && integer(value.scoreWhite) && integer(value.scoreBlue) && ['flash', 'explosion', 'waves', 'particles', 'speed-lines'].includes(String(value.effect))
const eventTypes = new Set(['goal', 'score_correction', 'undo', 'period_start', 'period_end', 'extra_time_start', 'penalty', 'match_end', 'pause', 'resume'])

/** Reject incompatible/corrupt copies before changing the live engine. */
export function validateCheckpoint(value: unknown): asserts value is MatchCheckpoint {
  const invalid = () => { throw new Error('Copia de partido incompatible o dañada. Se conserva sin sobrescribir.') }
  if (!object(value) || ![1, 2].includes(Number(value.version)) || typeof value.version !== 'number' || !object(value.state) || !integer(value.completedTimeSeconds) || !integer(value.goalSequence) || !integer(value.capturedAtMs) || !integer(value.goalLockRemainingMs) || value.goalLockRemainingMs > 3_000) return invalid()
  const state = value.state
  const config = state.config
  if (!object(config) || !['QUICK', 'CHAOS', 'RANKED'].includes(String(config.mode)) || !['GOALS', 'TIME', 'BOTH'].includes(String(config.victoryCondition)) || !integer(config.goalLimit) || config.goalLimit < 1 || config.goalLimit > 20 || !integer(config.halfDurationMinutes) || config.halfDurationMinutes < 1 || config.halfDurationMinutes > 30) return invalid()
  if ((config.rulesVersion ?? 1) !== value.version) return invalid()
  const singleGoalMatch = value.version === 2 && config.victoryCondition === 'GOALS'
  if (!['COUNTDOWN', 'PLAYING', 'PAUSED', 'PERIOD_END', 'MATCH_END', 'PENALTIES'].includes(String(state.status)) || !period(state.period) || !date(state.startedAt) || !(state.finishedAt === null || date(state.finishedAt)) || !score(state) || !integer(state.elapsedSeconds) || !integer(state.remainingSeconds) || !integer(state.periodInitialSeconds) || typeof state.goalInputLocked !== 'boolean' || !integer(state.goalLockRemainingMs) || state.goalLockRemainingMs > 3_000 || !(state.countdownValue === null || integer(state.countdownValue) && state.countdownValue <= 3) || !(state.periodResult === null || score(state.periodResult))) return invalid()
  if (state.status === 'MATCH_END' ? !date(state.finishedAt) : state.finishedAt !== null) return invalid()
  if (state.status === 'PENALTIES' && state.period !== 'PENALTIES') return invalid()
  if (state.period !== 'PENALTIES' && (state.remainingSeconds !== Math.max(0, state.periodInitialSeconds - state.elapsedSeconds) || state.periodInitialSeconds !== (singleGoalMatch ? 0 : state.period === 'EXTRA_TIME' ? 60 : config.halfDurationMinutes * 60))) return invalid()
  if (singleGoalMatch && (state.period !== 'FIRST_HALF' || state.status === 'PERIOD_END' || state.penalty !== null || value.completedTimeSeconds !== 0 || state.periodResult !== null ||
    (state.status === 'MATCH_END' ? Math.max(state.whiteGoals, state.blueGoals) !== config.goalLimit || state.whiteGoals === state.blueGoals : Math.max(state.whiteGoals, state.blueGoals) >= config.goalLimit))) return invalid()
  if (state.penalty !== null) {
    const p = state.penalty
    if (!score(p) || !integer(p.whiteAttempts) || !integer(p.blueAttempts) || p.whiteGoals > p.whiteAttempts || p.blueGoals > p.blueAttempts || ![0, 1].includes(p.whiteAttempts - p.blueAttempts) || typeof p.suddenDeath !== 'boolean') return invalid()
  } else if (state.period === 'PENALTIES') return invalid()
  if (!Array.isArray(state.goals) || !state.goals.every(goal) || new Set(state.goals.map(g => g.id)).size !== state.goals.length || state.goals.filter(g => g.team === 'WHITE').length !== state.whiteGoals || state.goals.filter(g => g.team === 'BLUE').length !== state.blueGoals) return invalid()
  if (singleGoalMatch && state.goals.some(g => g.period !== 'FIRST_HALF')) return invalid()
  if (JSON.stringify(state.lastGoal) !== JSON.stringify(state.goals.at(-1) ?? null)) return invalid()
  if (!Array.isArray(state.events)) return invalid()
  let previousTime = 0
  const acceptedIds = new Set<string>()
  const activeIds = new Set<string>()
  for (const [index, event] of state.events.entries()) {
    if (!object(event) || event.sequence !== index + 1 || !eventTypes.has(String(event.eventType)) || !(event.team === null || team(event.team)) || !period(event.period) || !integer(event.matchTimeSeconds) || event.matchTimeSeconds < previousTime || !integer(event.periodTimeSeconds) || !integer(event.whiteScore) || !integer(event.blueScore) || !(event.penaltyScored === null || typeof event.penaltyScored === 'boolean') || !date(event.occurredAt) || !object(event.metadata) || !Object.values(event.metadata).every(v => v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v))) return invalid()
    previousTime = event.matchTimeSeconds
    if (singleGoalMatch && (event.period !== 'FIRST_HALF' || event.eventType === 'period_end' || event.eventType === 'extra_time_start' || event.eventType === 'penalty')) return invalid()
    if (['goal', 'undo', 'score_correction'].includes(String(event.eventType))) {
      const id = event.metadata.goalId
      if (typeof id !== 'string' || !/^goal-[1-9]\d*$/.test(id) || Number(id.slice(5)) > value.goalSequence) return invalid()
      if (event.eventType === 'goal') {
        if (acceptedIds.has(id) || !team(event.team)) return invalid()
        acceptedIds.add(id); activeIds.add(id)
      } else if (!activeIds.delete(id)) return invalid()
    }
  }
  if (state.goals.some(g => !activeIds.has(String(g.id))) || activeIds.size !== state.goals.length) return invalid()
  if (singleGoalMatch && state.events.length > 0 && (state.events[0].eventType !== 'period_start' || state.events[0].metadata.rulesVersion !== 2)) return invalid()
  const lastEvent = state.events.at(-1)
  if (lastEvent ? lastEvent.whiteScore !== state.whiteGoals || lastEvent.blueScore !== state.blueGoals || lastEvent.matchTimeSeconds > value.completedTimeSeconds + state.elapsedSeconds : state.status !== 'COUNTDOWN' || state.goals.length !== 0) return invalid()
  if (state.status === 'MATCH_END' && lastEvent?.eventType !== 'match_end') return invalid()
}
