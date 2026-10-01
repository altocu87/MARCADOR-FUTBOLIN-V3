import type { MatchRepository } from './MatchRepository'
import type { MatchDocument } from './models'

export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type SaveResult = 'saved' | 'test' | 'pending'
const SAVE_TIMEOUT_MS = 10_000

/** Queue scoped to project/account. Never contains test matches. */
export class SaveCoordinator {
  private inFlight = new Map<string, Promise<SaveResult>>()
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
    const running = this.inFlight.get(document.match.id)
    if (running) return running
    const promise = this.attempt(document).finally(() => this.inFlight.delete(document.match.id))
    this.inFlight.set(document.match.id, promise)
    return promise
  }

  async retry(): Promise<SaveResult[]> {
    const results: SaveResult[] = []
    for (const document of this.getPending()) results.push(await this.save(document))
    return results
  }

  private async attempt(document: MatchDocument): Promise<SaveResult> {
    // Write-ahead: retain result even if the browser closes during the network request.
    const queue = this.getPending().filter(item => item.match.id !== document.match.id)
    this.storage.setItem(this.storageKey, JSON.stringify([...queue, document]))
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
    this.storage.setItem(this.storageKey, JSON.stringify(this.getPending().filter(item => item.match.id !== document.match.id)))
    return 'saved'
  }
}
