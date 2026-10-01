import type { Player, PlayerDraft } from './models'

export interface PlayerRepository {
  getPlayers(): Promise<Player[]>
  createPlayer(draft: PlayerDraft): Promise<void>
  updatePlayer(id: string, draft: PlayerDraft): Promise<void>
  setActive(id: string, active: boolean): Promise<void>
  deleteUnusedPlayer(id: string): Promise<void>
}
