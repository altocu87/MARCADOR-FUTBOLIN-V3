import type { MatchDocument, MatchSummary } from './models'

export const MATCH_PAGE_SIZE = 20
export interface MatchListQuery {
  playerId?: string
  before?: { finishedAt: string; id: string }
  signal?: AbortSignal
}

/** Contrato de agregado: también puede implementarse mediante sincronización de hardware. */
export interface MatchRepository {
  saveMatch(document: MatchDocument): Promise<void>
  getMatches(offset?: number, query?: MatchListQuery): Promise<MatchSummary[]>
  getMatchById(id: string): Promise<MatchDocument>
}
