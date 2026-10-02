import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { CompetitionRepository } from '../persistence/CompetitionRepository'
import { categoryNames, type CompetitivePlayer } from '../../competition/elo'

type RankingRow = Database['public']['Functions']['get_ranking_v1']['Returns'][number]
export function mapCompetitivePlayer(row: RankingRow): CompetitivePlayer {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (typeof row.player_id !== 'string' || !uuid.test(row.player_id) || typeof row.name !== 'string' || !row.name
    || row.nickname !== null && typeof row.nickname !== 'string' || typeof row.active !== 'boolean' || typeof row.enabled !== 'boolean'
    || !Number.isSafeInteger(row.elo) || !Number.isSafeInteger(row.max_elo) || row.max_elo < Math.max(1200, row.elo)
    || !Number.isSafeInteger(row.classified_matches) || row.classified_matches < 0
    || !Number.isSafeInteger(row.rules_version) || row.rules_version < 1
    || row.enabled && !categoryNames.includes(row.category as typeof categoryNames[number])
    || !row.enabled && (row.category !== null || row.elo !== 1200 || row.max_elo !== 1200 || row.classified_matches !== 0)
    || (row.classified_matches === 0 ? row.ranking_position !== null : !Number.isSafeInteger(row.ranking_position) || row.ranking_position < 1)) {
    throw new Error('Clasificación incompatible. No se muestran cifras parciales.')
  }
  return { playerId: row.player_id, name: row.name, nickname: row.nickname, active: row.active,
    elo: row.elo, maxElo: row.max_elo, classifiedMatches: row.classified_matches,
    category: row.category as CompetitivePlayer['category'], rank: row.ranking_position,
    enabled: row.enabled, rulesVersion: row.rules_version }
}
export class SupabaseCompetitionRepository implements CompetitionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getRanking(signal?: AbortSignal): Promise<CompetitivePlayer[]> {
    // A scalar envelope avoids the Data API row cap and separate page snapshots.
    let query = this.client.rpc('get_competition_snapshot_v1')
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query
    if (error) throw error
    if (!Array.isArray(data) || data.some(value => value === null || typeof value !== 'object' || Array.isArray(value))) throw new Error('Instantánea competitiva incompatible.')
    const rows = data.map(value => mapCompetitivePlayer(value as unknown as RankingRow))
    if (new Set(rows.map(r => r.playerId)).size !== rows.length || rows.some(r => r.rulesVersion !== rows[0]?.rulesVersion || r.enabled !== rows[0]?.enabled)) throw new Error('Instantánea competitiva inconsistente.')
    return rows
  }
}
