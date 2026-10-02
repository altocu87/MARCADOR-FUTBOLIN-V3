import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { mapProgression } from './repositories'
import { ACHIEVEMENT_CATALOG_VERSION, achievementCatalog, type AchievementMetric } from '../../achievements/catalog'
import { recordCatalog, tierXp, type HonoursRepository, type HonoursSnapshot, type HonourRecord } from '../../honours/model'

const invalid = (): never => { throw new Error('Honores incompatibles. No se muestran cifras parciales.') }
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : invalid()
const integer = (value: unknown): number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : invalid()
const uuid = (value: unknown): string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : invalid()

/** Validate the complete scalar server contract. No zero fallback for missing
 * pages, families, evidence, XP breakdown or a different account. */
export function mapHonours(value: unknown, accountId: string): HonoursSnapshot {
  const snapshot = object(value)
  if (snapshot.accountId !== uuid(accountId) || snapshot.complete !== true || snapshot.catalogVersion !== ACHIEVEMENT_CATALOG_VERSION || !Array.isArray(snapshot.rows)) invalid()
  const seen = new Set<string>()
  const rows = (snapshot.rows as unknown[]).map(input => {
    const row = object(input), id = uuid(row.id)
    if (seen.has(id) || typeof row.name !== 'string' || !row.name || typeof row.active !== 'boolean'
      || row.nickname !== null && typeof row.nickname !== 'string' || row.photo_url !== null && typeof row.photo_url !== 'string'
      || !Array.isArray(row.badges) || row.badges.length !== 45) invalid()
    seen.add(id)
    const metrics = {} as Record<AchievementMetric, number>
    const badges = (row.badges as unknown[]).map(object)
    const families = achievementCatalog.map(family => {
      const items = badges.filter(b => b.family === family.id).sort((a,b) => integer(a.tier)-integer(b.tier))
      if (items.length !== 5) invalid()
      const identity = `${accountId}:${id}:${family.id}`, value = integer(items[0].value)
      metrics[family.id] = value
      const tiers = items.map((item, index) => {
        const threshold = family.thresholds[index]
        if (item.tier !== index+1 || item.threshold !== threshold || item.value !== value || item.tierXp !== tierXp[index]) invalid()
        let evidence = null
        if (value >= threshold) {
          const matchId = uuid(item.matchId)
          if (typeof item.finishedAt !== 'string' || !Number.isFinite(Date.parse(item.finishedAt)) || item.grantedXp !== tierXp[index]) invalid()
          evidence = { matchId, finishedAt: item.finishedAt as string }
        } else if (item.matchId !== null || item.finishedAt !== null || item.grantedXp !== 0) invalid()
        return { id: `${family.id}:tier_${index+1}`, level: index+1, threshold, identity: `${identity}:tier_${index+1}`, evidence, progress: Math.min(value,threshold) }
      })
      const level = tiers.filter(t => t.evidence).length
      return { ...family, identity, value, level, tiers, next: tiers[level] ?? null }
    })
    const grantedExtraXp = families.reduce((total,f) => total+f.tiers.reduce((n,t,i) => n+(t.evidence ? tierXp[i] : 0),0),0)
    const rawXp = object(row.progression)
    const progression = mapProgression(rawXp as Parameters<typeof mapProgression>[0])
    if (rawXp.base_xp === undefined || rawXp.achievement_xp === undefined || progression.playerId !== id || rawXp.achievement_xp !== (progression.enabled ? grantedExtraXp : 0)) invalid()
    const rawRecords = object(row.records), evidence = object(row.evidence)
    if (Object.keys(rawRecords).length !== recordCatalog.length) invalid()
    const records: HonourRecord[] = recordCatalog.map(([recordId]) => {
      const raw = rawRecords[recordId]
      let value: number | null = null, ratio: { wins: number; played: number } | undefined
      if (raw !== null) {
        if (recordId === 'best_win_rate') {
          const r = object(raw); ratio = { wins: integer(r.wins), played: integer(r.played) }
          if (ratio.played < 20 || ratio.wins > ratio.played || ratio.played !== metrics.played || ratio.wins !== metrics.wins) invalid()
          value = ratio.wins / ratio.played * 100
        } else if (recordId === 'current_elo' || recordId === 'max_elo') {
          if (typeof raw !== 'number' || !Number.isSafeInteger(raw)) invalid()
          value = raw as number
        } else value = integer(raw)
      }
      const ids = recordId === 'biggest_margin' || recordId === 'most_team_goals' ? evidence[recordId] : []
      if (!Array.isArray(ids)) invalid()
      const matchIds = (ids as unknown[]).map(uuid)
      if (new Set(matchIds).size !== matchIds.length || value === null && matchIds.length || value !== null && ['biggest_margin','most_team_goals'].includes(recordId) && !matchIds.length) invalid()
      return { id: recordId, value, matchIds, ...(ratio ? { ratio } : {}) }
    })
    const mark = (key: string) => records.find(r => r.id === key)!.value
    if (mark('most_played') !== (metrics.played || null) || mark('most_wins') !== (metrics.played ? metrics.wins : null) || mark('best_streak') !== (metrics.played ? metrics.streak : null)
      || (mark('best_win_rate') !== null) !== (metrics.played >= 20) || (mark('current_elo') === null) !== (mark('max_elo') === null)
      || mark('max_elo') !== null && mark('max_elo')! < Math.max(1200,mark('current_elo')!)) invalid()
    return { player: { id, name: row.name as string, nickname: row.nickname as string|null, photoUrl: row.photo_url as string|null, active: row.active as boolean, level: progression.level },
      achievements: { catalogVersion: ACHIEVEMENT_CATALOG_VERSION, families, metrics, stars: families.reduce((n,f) => n+f.level,0), grantedExtraXp }, records, progression }
  })
  return { accountId, catalogVersion: ACHIEVEMENT_CATALOG_VERSION, complete: true, rows }
}
export class SupabaseHonoursRepository implements HonoursRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getSnapshot(accountId: string, signal?: AbortSignal) {
    uuid(accountId)
    let query = this.client.rpc('get_honours_snapshot_v1')
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query
    if (error) throw error
    return mapHonours(data, accountId)
  }
}
