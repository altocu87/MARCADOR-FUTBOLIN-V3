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
    const { data, error } = await this.client.from('players').select('*').order('name')
    if (error) throw error
    return data.map(row => ({ id: row.id, name: row.name, nickname: row.nickname, photoUrl: row.photo_url, active: row.active, level: row.level }))
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
