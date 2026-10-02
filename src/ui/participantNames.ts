import type { Participant, Player } from '../services/persistence/models'

/** Resolve display names by identity without modifying saved participant snapshots. */
export function createParticipantNameResolver(players: readonly Player[]) {
  const names = new Map(players.map(player => [player.id, player.nickname || player.name]))
  return (participant: Participant) => names.get(participant.player_id) || participant.player_name
}
