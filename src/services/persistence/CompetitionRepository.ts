import type { CompetitivePlayer } from '../../competition/elo'
/** One private server snapshot, including inactive and unclassified players. */
export interface CompetitionRepository {
  getRanking(signal?: AbortSignal): Promise<CompetitivePlayer[]>
}
