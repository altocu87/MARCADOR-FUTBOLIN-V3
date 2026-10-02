import type { ProgressionRepository } from '../persistence/ProgressionRepository'
import type { PlayerProgression } from '../../progression/xp'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from './database.types'
import type { PlayerRepository } from '../persistence/PlayerRepository'
import { MATCH_PAGE_SIZE, type MatchListQuery, type MatchRepository } from '../persistence/MatchRepository'
import type { MatchDocument, MatchSummary, PlayerDraft, Player } from '../persistence/models'

function playerFields(draft: PlayerDraft) {
  const name = draft.name.trim()
  const nickname = draft.nickname.trim()
  const photo = draft.photoUrl.trim()
  if (!name || name.length > 80 || nickname.length > 40) throw new Error('Revisa el nombre y el alias.')
  if (photo && !photo.startsWith('https://')) throw new Error('La foto debe usar una URL https://.')
  return { name, nickname: nickname || null, photo_url: photo || null }
}

export class SupabasePlayerRepository implements PlayerRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getPlayers(): Promise<Player[]> {
    const { data, error } = await this.client.from('player_progression_v1').select('*').order('name')
    if (error) throw error
    return data.map(row => {
      const progression = mapProgression(row)
      if (!row.name || typeof row.active !== 'boolean') throw new Error('Ficha de jugador incompatible.')
      return { id: progression.playerId, name: row.name, nickname: row.nickname, photoUrl: row.photo_url, active: row.active, level: progression.level }
    })
  }
  async createPlayer(draft: PlayerDraft) {
    const { error } = await this.client.from('players').insert(playerFields(draft))
    if (error) throw error
  }
  async updatePlayer(id: string, draft: PlayerDraft) {
    const { data, error } = await this.client.from('players').update(playerFields(draft)).eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) throw new Error('Jugador no encontrado o sin permiso.')
  }
  async setActive(id: string, active: boolean) {
    const { data, error } = await this.client.from('players').update({ active }).eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) throw new Error('Jugador no encontrado o sin permiso.')
  }
  async deleteUnusedPlayer(id: string) {
    const { data, error } = await this.client.from('players').delete().eq('id', id).select('id')
    if (error) throw error
    if (!data?.length) throw new Error('No se puede eliminar: tiene historial. Desactívalo para conservarlo.')
  }
}

export class SupabaseMatchRepository implements MatchRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async saveMatch(document: MatchDocument) {
    if (document.match.test_mode) return
    const { error } = await this.client.rpc('save_match_v1', { document: JSON.parse(JSON.stringify(document)) as Json })
    if (error) throw error
  }
  async getMatches(offset = 0, options: MatchListQuery = {}): Promise<MatchSummary[]> {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!Number.isSafeInteger(offset) || offset < 0 || options.playerId && !uuid.test(options.playerId)) throw new Error('Consulta de historial no válida.')
    // Separate inner embed filters parents without truncating the complete teams.
    const select = options.playerId ? '*, participants:match_participants(*), player_filter:match_participants!inner(player_id)' : '*, participants:match_participants(*)'
    let query = this.client.from('matches').select(select).eq('test_mode', false).eq('status', 'MATCH_END')
      .order('finished_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + MATCH_PAGE_SIZE - 1)
    if (options.playerId) query = query.eq('player_filter.player_id', options.playerId)
    if (options.before) {
      const { finishedAt, id } = options.before
      // Preserve fractional precision, and reject PostgREST expression injection.
      if (!uuid.test(id) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(finishedAt) || !Number.isFinite(Date.parse(finishedAt))) throw new Error('Cursor de historial no válido.')
      query = query.or(`finished_at.lt.${finishedAt},and(finished_at.eq.${finishedAt},id.lt.${id})`)
    }
    if (options.signal) query = query.abortSignal(options.signal)
    const { data, error } = await query
    if (error) throw error
    return data as unknown as MatchSummary[]
  }
  async getMatchById(id: string): Promise<MatchDocument> {
    const { data, error } = await this.client.from('matches').select('*, participants:match_participants(*), events:match_events(*)').eq('id', id).single()
    if (error) throw error
    const document = { match: data, participants: data.participants, events: data.events } as unknown as MatchDocument
    document.events.sort((a, b) => a.sequence - b.sequence)
    return document
  }
}

/** Projection values are nullable in generated view types: validate before display.
 * Never silently round a Postgres bigint beyond JavaScript's exact integer range.
 */
export function mapProgression(row: {
  id: string | null; xp: number | null; level: number | null; current_threshold: number | null
  next_threshold: number | null; max_level: number | null; confirmed_matches: number | null
  rules_version: number | null; enabled: boolean | null
  base_xp?: number | null; achievement_xp?: number | null
}): PlayerProgression {
  const valid = (n: number | null): n is number => n !== null && Number.isSafeInteger(n) && n >= 0
  if (!row.id || !valid(row.xp) || !valid(row.level) || !valid(row.current_threshold)
    || !valid(row.max_level) || !valid(row.confirmed_matches) || !valid(row.rules_version) || row.rules_version < 1
    || typeof row.enabled !== 'boolean' || row.level > row.max_level || row.current_threshold > row.xp
    || (row.level === row.max_level ? row.next_threshold !== null : !valid(row.next_threshold) || row.next_threshold <= row.xp)) throw new Error('Progresión XP incompatible. No se muestran cifras parciales.')
  if ((row.base_xp !== undefined || row.achievement_xp !== undefined) && (!valid(row.base_xp ?? null) || !valid(row.achievement_xp ?? null) || row.base_xp! + row.achievement_xp! !== row.xp)) throw new Error('Desglose XP incompatible.')
  return { ...(row.base_xp !== undefined ? { baseXp: row.base_xp!, achievementXp: row.achievement_xp! } : {}), playerId: row.id, xp: row.xp, level: row.level, currentThreshold: row.current_threshold,
    nextThreshold: row.next_threshold, maxLevel: row.max_level, confirmedMatches: row.confirmed_matches,
    rulesVersion: row.rules_version, enabled: row.enabled }
}
export class SupabaseProgressionRepository implements ProgressionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getPlayerProgression(playerId: string, signal?: AbortSignal): Promise<PlayerProgression> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) throw new Error('Identidad de jugador no válida.')
    let query = this.client.from('player_progression_v1').select('*').eq('id', playerId)
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query.single()
    if (error) throw error
    return mapProgression(data)
  }
}
