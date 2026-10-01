export type ConnectionState = 'checking' | 'online' | 'offline'

/** Reachability is a hint, not proof that Auth/API permissions are valid. */
export class ConnectionMonitor {
  private state: ConnectionState = 'checking'
  private listeners = new Set<() => void>()
  private generation = 0
  constructor(private readonly probe: () => Promise<boolean>) {}
  getSnapshot = () => this.state
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  disconnected = () => { this.generation++; this.set('offline') }
  async check() {
    const generation = ++this.generation
    try { const ok = await this.probe(); if (generation === this.generation) this.set(ok ? 'online' : 'offline') }
    catch { if (generation === this.generation) this.set('offline') }
  }
  private set(state: ConnectionState) {
    if (state === this.state) return
    this.state = state
    this.listeners.forEach(listener => listener())
  }
}

export async function probeConnection(): Promise<boolean> {
  const response = await fetch('/connection.json', { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(4_000) })
  const body: unknown = await response.json()
  return response.ok && typeof body === 'object' && body !== null && 'application' in body && body.application === 'marcador-futbolin-v3'
}
