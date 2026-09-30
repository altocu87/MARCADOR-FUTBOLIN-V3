import type { MatchState } from '../../match-engine/types'

/** Punto de extensión para un repositorio Supabase futuro; no hay conexión todavía. */
export interface MatchRepository {
  save(state: Readonly<MatchState>): Promise<void>
  loadActive(): Promise<MatchState | null>
}
