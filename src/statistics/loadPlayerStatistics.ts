import { MATCH_PAGE_SIZE, type MatchListQuery, type MatchRepository } from '../services/persistence/MatchRepository'
import type { MatchSummary } from '../services/persistence/models'
import { playerStatistics } from './playerStatistics'

/** Keyset pagination avoids shifted offsets when newer results arrive.
 * Never presents an incomplete page as a player's lifetime statistics.
 */
export async function loadPlayerStatistics(repository: MatchRepository, playerId: string, signal?: AbortSignal) {
  return playerStatistics(await loadPlayerMatches(repository, playerId, signal), playerId)
}

/** One complete read can serve totals, filters and trends without extra requests. */
export async function loadPlayerMatches(repository: MatchRepository, playerId: string, signal?: AbortSignal) {
  const matches: MatchSummary[] = []
  const cursors = new Set<string>()
  let before: MatchListQuery['before']
  while (true) {
    signal?.throwIfAborted()
    const page = await repository.getMatches(0, { playerId, before, signal })
    signal?.throwIfAborted()
    matches.push(...page)
    if (page.length < MATCH_PAGE_SIZE) return matches
    const last = page.at(-1)!
    before = { finishedAt: last.finished_at, id: last.id }
    const cursor = JSON.stringify(before)
    if (cursors.has(cursor)) throw new Error('El historial no avanza. Actualiza para volver a consultar.')
    cursors.add(cursor)
  }
}
