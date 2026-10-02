import type { MatchCheckpoint } from '../../match-engine/types'
import { validateCheckpoint } from '../../match-engine/checkpoint'
import type { Player } from './models'
import { participantsFor } from './mapMatch'
import type { KeyValueStorage } from './SaveCoordinator'

export interface ActiveMatchCopy {
  version: 1
  id: string
  ownerId: string
  testMode: boolean
  players: Player[]
  checkpoint: MatchCheckpoint
}
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const player = (v: unknown): v is Player => object(v) && typeof v.id === 'string' && typeof v.name === 'string' && v.name.trim().length > 0 && v.name.length <= 80 && (v.nickname === null || typeof v.nickname === 'string' && v.nickname.length <= 40) && (v.photoUrl === null || typeof v.photoUrl === 'string') && typeof v.active === 'boolean' && typeof v.level === 'number' && Number.isSafeInteger(v.level) && v.level >= 0

/** One unfinished real match per project/account. Never stores test games. */
export class ActiveMatchStore {
  private readonly key: string
  constructor(private readonly storage: KeyValueStorage, namespace: string, private readonly ownerId: string) {
    this.key = `${namespace}:active-match:v1:${ownerId}`
  }
  load(): ActiveMatchCopy | null {
    const raw = this.storage.getItem(this.key)
    if (!raw) return null
    try {
      const value: unknown = JSON.parse(raw)
      this.validate(value)
      return value
    } catch { throw new Error('Copia de recuperación incompatible o dañada. No se ha borrado ni sobrescrito.') }
  }
  save(copy: ActiveMatchCopy): void {
    if (copy.testMode) return
    this.validate(copy)
    const current = this.load()
    if (current) {
      if (current.id !== copy.id) throw new Error('Hay otro partido por recuperar. No se ha sobrescrito.')
      const previous = current.checkpoint.state.events
      const next = copy.checkpoint.state.events
      if (previous.length > next.length || previous.some((event, i) => JSON.stringify(event) !== JSON.stringify(next[i]))) {
        throw new Error('El partido cambió en otra pestaña. Abre solo una pestaña del marcador.')
      }
    }
    this.storage.setItem(this.key, JSON.stringify(copy))
  }
  clear(id: string): void {
    const current = this.load()
    if (current?.id === id) this.storage.setItem(this.key, '')
  }
  /** Explicit user discard: never removes a final, foreign or changed copy. */
  discard(expected: ActiveMatchCopy): void {
    this.validate(expected)
    if (expected.checkpoint.state.status === 'MATCH_END') throw new Error('Un resultado terminado debe guardarse; no se puede descartar.')
    const current = this.load()
    if (!current) return
    if (JSON.stringify(current) !== JSON.stringify(expected)) throw new Error('La copia cambió en otra pestaña. No se ha descartado ningún partido.')
    this.storage.setItem(this.key, '')
  }
  private validate(value: unknown): asserts value is ActiveMatchCopy {
    if (!object(value) || value.version !== 1 || typeof value.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.id) || value.ownerId !== this.ownerId || value.testMode !== false || !Array.isArray(value.players) || !value.players.every(player)) throw new Error('Copia inválida')
    validateCheckpoint(value.checkpoint)
    if (value.players.length === 3 && value.checkpoint.state.config?.mode === 'RANKED') throw new Error('Clasificatorio incompatible')
    participantsFor(value.players, value.checkpoint.state.config?.soloTeam)
  }
}
