import type { MatchDocument, MatchSummary } from './models'

/** Contrato de agregado: también puede implementarse mediante sincronización de hardware. */
export interface MatchRepository {
  saveMatch(document: MatchDocument): Promise<void>
  getMatches(offset?: number): Promise<MatchSummary[]>
  getMatchById(id: string): Promise<MatchDocument>
}
