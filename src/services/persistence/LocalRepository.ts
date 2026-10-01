import type { Player } from '../../domain/Player'
import { normalizePlayerName, validatePlayerName } from '../../domain/Player'
import type { MatchCheckpoint, MatchConfiguration, MatchState } from '../../match-engine/types'

export const STORAGE_KEY = 'marcador-futbolin-v3:local:v1'

export interface MatchSession {
  id: string
  startedAt: number
  /** Orden fijo: blanco 1, azul 1, blanco 2, azul 2. */
  players: Player[]
  checkpoint: MatchCheckpoint
}

export interface MatchRecord {
  id: string
  startedAt: number
  finishedAt: number
  players: Player[]
  state: MatchState
}

export interface LocalData {
  version: 1
  players: Player[]
  active: MatchSession | null
  history: MatchRecord[]
}

export interface StoragePort {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export class StorageConflictError extends Error {
  constructor() { super('Los datos han cambiado en otra pestaña. Recarga para usar la última versión.') }
}

const emptyData = (): LocalData => ({ version: 1, players: [], active: null, history: [] })
const MAX_DATE = 8_640_000_000_000_000
const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isInteger = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max
const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0
const isOneOf = (value: unknown, options: string[]): boolean => typeof value === 'string' && options.includes(value)

function isPlayer(value: unknown): value is Player {
  return isObject(value) && isText(value.id) && isText(value.name) && value.name === normalizePlayerName(value.name)
    && value.name.length <= 32 && typeof value.tint === 'string' && /^#[0-9a-f]{6}$/iu.test(value.tint)
}

function isPlayers(value: unknown, team = false): value is Player[] {
  return Array.isArray(value) && value.every(isPlayer) && new Set(value.map((player) => player.id)).size === value.length
    && (!team || value.length === 2 || value.length === 4)
}

function isConfig(value: unknown): value is MatchConfiguration {
  return isObject(value) && isOneOf(value.mode, ['QUICK', 'CHAOS', 'RANKED']) && isOneOf(value.victoryCondition, ['GOALS', 'TIME', 'BOTH'])
    && isInteger(value.goalLimit, 1, 20) && isInteger(value.halfDurationMinutes, 1, 30)
}

function isMatchState(value: unknown): value is MatchState {
  if (!isObject(value) || !isConfig(value.config)
    || !isOneOf(value.status, ['COUNTDOWN', 'PLAYING', 'PAUSED', 'PERIOD_END', 'MATCH_END', 'PENALTIES'])
    || !isOneOf(value.period, ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME', 'PENALTIES'])
    || !isInteger(value.whiteGoals) || !isInteger(value.blueGoals) || !isInteger(value.remainingSeconds, 0, 1800)
    || !isInteger(value.periodInitialSeconds, 1, 1800) || !isInteger(value.elapsedSeconds)
    || value.remainingSeconds !== Math.max(0, value.periodInitialSeconds - value.elapsedSeconds)
    || !(value.countdownValue === null || isInteger(value.countdownValue, 0, 3))
    || typeof value.goalInputLocked !== 'boolean' || !isInteger(value.goalLockRemainingMs, 0, 3000)
    || !Array.isArray(value.goals)) return false
  let white = 0
  let blue = 0
  const ids = new Set<string>()
  for (const goal of value.goals) {
    if (!isObject(goal) || !isText(goal.id) || ids.has(goal.id) || !isOneOf(goal.team, ['WHITE', 'BLUE'])
      || !isOneOf(goal.period, ['FIRST_HALF', 'SECOND_HALF', 'EXTRA_TIME']) || !isInteger(goal.elapsedSeconds)
      || typeof goal.timestamp !== 'string' || !/^\d{2,}:\d{2}$/u.test(goal.timestamp)
      || !isOneOf(goal.effect, ['flash', 'explosion', 'waves', 'particles', 'speed-lines'])) return false
    ids.add(goal.id)
    if (goal.team === 'WHITE') white += 1
    else blue += 1
    if (goal.scoreWhite !== white || goal.scoreBlue !== blue) return false
  }
  if (white !== value.whiteGoals || blue !== value.blueGoals) return false
  if (value.lastGoal !== null && (!isObject(value.lastGoal) || JSON.stringify(value.lastGoal) !== JSON.stringify(value.goals.at(-1)))) return false
  if (value.goals.length > 0 && value.lastGoal === null) return false
  if (value.penalty !== null) {
    const p = value.penalty
    if (!isObject(p) || !isInteger(p.whiteGoals) || !isInteger(p.blueGoals) || !isInteger(p.whiteAttempts) || !isInteger(p.blueAttempts)
      || p.whiteGoals > p.whiteAttempts || p.blueGoals > p.blueAttempts || p.whiteAttempts < p.blueAttempts
      || p.whiteAttempts > p.blueAttempts + 1 || typeof p.suddenDeath !== 'boolean') return false
  }
  if ((value.status === 'PENALTIES' || value.period === 'PENALTIES') && value.penalty === null) return false
  if (value.periodResult !== null && (!isObject(value.periodResult) || !isInteger(value.periodResult.whiteGoals) || !isInteger(value.periodResult.blueGoals))) return false
  return true
}

function isCheckpoint(value: unknown): value is MatchCheckpoint {
  if (!isObject(value) || !isMatchState(value.state) || !Array.isArray(value.undoStack)
    || !value.undoStack.every(isMatchState) || !isInteger(value.sequence)) return false
  const sequence = value.sequence
  const current = value.state
  return [current, ...value.undoStack].every((state) => state.period === current.period && JSON.stringify(state.config) === JSON.stringify(current.config)
    && state.goals.every((goal) => /^goal-\d+$/u.test(goal.id) && Number(goal.id.slice(5)) <= sequence))
}

function isSession(value: unknown): value is MatchSession {
  return isObject(value) && isText(value.id) && isInteger(value.startedAt, 1, MAX_DATE) && isPlayers(value.players, true) && isCheckpoint(value.checkpoint)
}

function isRecord(value: unknown): value is MatchRecord {
  return isObject(value) && isText(value.id) && isInteger(value.startedAt, 1, MAX_DATE) && isInteger(value.finishedAt, value.startedAt, MAX_DATE)
    && isPlayers(value.players, true) && isMatchState(value.state) && value.state.status === 'MATCH_END'
}

export function parseLocalData(raw: string): LocalData {
  const data: unknown = JSON.parse(raw)
  if (!isObject(data) || data.version !== 1 || !isPlayers(data.players)
    || new Set(data.players.map((player) => player.name.toLocaleLowerCase('es'))).size !== data.players.length
    || !(data.active === null || isSession(data.active)) || !Array.isArray(data.history) || !data.history.every(isRecord)
    || new Set(data.history.map((match) => match.id)).size !== data.history.length) {
    throw new Error('Datos locales no válidos o de una versión incompatible.')
  }
  return data as unknown as LocalData
}

/** Una escritura atómica conserva jugadores, partido activo e historial juntos. */
export class LocalRepository {
  private data: LocalData = emptyData()
  private expectedRaw: string | null = null
  readonly loadError: string | null

  constructor(private readonly storage: StoragePort | null) {
    let error: string | null = null
    try {
      if (!storage) throw new Error('Almacenamiento no disponible.')
      this.expectedRaw = storage.getItem(STORAGE_KEY)
      if (this.expectedRaw !== null) this.data = parseLocalData(this.expectedRaw)
    } catch {
      error = 'No se pueden leer los datos locales. Se conservan sin sobrescribir. Revisa el almacenamiento del navegador.'
    }
    this.loadError = error
  }

  read(): LocalData { return structuredClone(this.data) }

  savePlayer(player: Player): LocalData {
    const normalized = { ...player, name: normalizePlayerName(player.name) }
    const error = validatePlayerName(normalized.name, this.data.players, player.id)
    if (error || !isPlayer(normalized)) throw new Error(error ?? 'Jugador no válido.')
    const existing = this.data.players.some((item) => item.id === player.id)
    return this.commit({ ...this.data, players: existing
      ? this.data.players.map((item) => item.id === player.id ? normalized : item)
      : [...this.data.players, normalized] })
  }

  saveSession(session: MatchSession, finishedAt = Date.now()): LocalData {
    if (!isSession(session)) throw new Error('No se puede guardar un partido no válido.')
    if (this.data.active && this.data.active.id !== session.id && this.data.active.checkpoint.state.status !== 'MATCH_END') {
      throw new Error('Hay un partido pendiente. Recupéralo antes de comenzar otro.')
    }
    let history = this.data.history
    if (session.checkpoint.state.status === 'MATCH_END') {
      const previous = history.find((match) => match.id === session.id)
      if (previous && (JSON.stringify(previous.state) !== JSON.stringify(session.checkpoint.state)
        || JSON.stringify(previous.players) !== JSON.stringify(session.players) || previous.startedAt !== session.startedAt)) {
        throw new Error('Un resultado finalizado no puede cambiar.')
      }
      if (!previous) {
        history = [{ id: session.id, startedAt: session.startedAt, finishedAt: Math.max(finishedAt, session.startedAt),
          players: session.players, state: session.checkpoint.state }, ...history]
      }
    } else if (history.some((match) => match.id === session.id)) {
      throw new Error('Un partido finalizado no puede volver a abrirse.')
    }
    return this.commit({ ...this.data, active: session, history })
  }

  clearCompleted(): LocalData {
    if (this.data.active && this.data.active.checkpoint.state.status !== 'MATCH_END') {
      throw new Error('No se puede descartar un partido pendiente.')
    }
    return this.commit({ ...this.data, active: null })
  }

  private commit(data: LocalData): LocalData {
    if (this.loadError || !this.storage) throw new Error(this.loadError ?? 'Almacenamiento no disponible.')
    if (this.storage.getItem(STORAGE_KEY) !== this.expectedRaw) throw new StorageConflictError()
    const raw = JSON.stringify(data)
    // La misma validación se utiliza al escribir y al recuperar.
    parseLocalData(raw)
    this.storage.setItem(STORAGE_KEY, raw)
    this.expectedRaw = raw
    this.data = structuredClone(data)
    return this.read()
  }
}
