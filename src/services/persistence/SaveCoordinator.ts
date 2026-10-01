import type { MatchRepository } from './MatchRepository'
import type { MatchDocument } from './models'

export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type SaveResult = 'saved' | 'test' | 'pending'
const SAVE_TIMEOUT_MS = 10_000
// Compare JSON content independently of object-key order, like the JSONB RPC.
const fingerprint = (document: MatchDocument) => JSON.stringify(document, (_key, value: unknown) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value)
const conflict = () => new Error('El ID ya existe con otro contenido. Se conservan las copias; usa una sola pestaña del marcador.')

/** Queue scoped to project/account. Never contains test matches. */
export class SaveCoordinator {
  private inFlight = new Map<string, { fingerprint: string; promise: Promise<SaveResult> }>()
  private listeners = new Set<(savedId?: string) => void>()
  subscribe = (listener: (savedId?: string) => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private notify(savedId?: string) { for (const listener of this.listeners) { try { listener(savedId) } catch { /* UI observers cannot break durable saving. */ } } }
  constructor(private readonly repository: MatchRepository, private readonly storage: KeyValueStorage, private readonly storageKey: string,
    private readonly timeoutMs = SAVE_TIMEOUT_MS) {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('El tiempo límite de guardado debe ser positivo.')
  }

  getPending(): MatchDocument[] {
    const value = this.storage.getItem(this.storageKey)
    if (!value) return []
    try {
      const parsed: unknown = JSON.parse(value)
      if (!Array.isArray(parsed)) throw new Error()
      if (parsed.some(item => typeof item !== 'object' || item === null ||
        typeof item.match !== 'object' || item.match === null || typeof item.match.id !== 'string' ||
        item.match.test_mode !== false || !Array.isArray(item.participants) || !Array.isArray(item.events))) throw new Error()
      return parsed as MatchDocument[]
    } catch { throw new Error('La cola local no se puede leer. No se ha sobrescrito.') }
  }

  save(document: MatchDocument): Promise<SaveResult> {
    if (document.match.test_mode) return Promise.resolve('test')
    const content = fingerprint(document)
    const running = this.inFlight.get(document.match.id)
    if (running) return running.fingerprint === content ? running.promise : Promise.reject(conflict())
    const promise = this.attempt(structuredClone(document), content).finally(() => this.inFlight.delete(document.match.id))
    this.inFlight.set(document.match.id, { fingerprint: content, promise })
    return promise
  }

  async retry(): Promise<SaveResult[]> {
    const results: SaveResult[] = []
    for (const document of this.getPending()) results.push(await this.save(document))
    return results
  }

  private async attempt(document: MatchDocument, content: string): Promise<SaveResult> {
    // Write-ahead: retain result even if the browser closes during the network request.
    const queue = this.getPending()
    const existing = queue.filter(item => item.match.id === document.match.id)
    if (existing.some(item => fingerprint(item) !== content)) throw conflict()
    if (existing.length) document = existing[0] // Retry the original aggregate without rewriting it.
    else {
      this.storage.setItem(this.storageKey, JSON.stringify([...queue, document]))
      this.notify()
    }
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      // A missing network response cannot trap the result screen indefinitely.
      // A late response may still save remotely: leave the queue intact and let
      // the repository's stable-ID idempotency resolve the eventual retry.
      await Promise.race([
        this.repository.saveMatch(document),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Tiempo de guardado agotado.')), this.timeoutMs) }),
      ])
    } catch { return 'pending' }
    finally { if (timeout !== undefined) clearTimeout(timeout) }
    const current = this.getPending()
    if (current.some(item => item.match.id === document.match.id && fingerprint(item) !== content)) throw conflict()
    this.storage.setItem(this.storageKey, JSON.stringify(current.filter(item => item.match.id !== document.match.id)))
    this.notify(document.match.id)
    return 'saved'
  }
}
