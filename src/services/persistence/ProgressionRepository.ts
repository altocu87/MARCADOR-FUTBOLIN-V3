import type { PlayerProgression } from '../../progression/xp'

/** Read-only authoritative snapshot. No API for awarding XP from a client. */
export interface ProgressionRepository {
  getPlayerProgression(playerId: string, signal?: AbortSignal): Promise<PlayerProgression>
}
