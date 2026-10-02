import type { AchievementSnapshot } from '../achievements/rebuild'
import type { PlayerProgression } from '../progression/xp'
import type { Player } from '../services/persistence/models'

export const tierXp = Object.freeze([25, 25, 50, 75, 100])
export const recordCatalog = [
  ['most_played', 'Más partidos'], ['most_wins', 'Más victorias'], ['best_streak', 'Mejor racha de victorias'],
  ['biggest_margin', 'Mayor diferencia en una victoria'], ['most_team_goals', 'Más goles de tu equipo en un partido'],
  ['best_win_rate', 'Mejor porcentaje de victorias · mínimo 20 partidos'],
  ['current_elo', 'ELO actual'], ['max_elo', 'ELO máximo'],
] as const
export type RecordId = typeof recordCatalog[number][0]
export interface HonourRecord { id: RecordId; value: number | null; matchIds: string[]; ratio?: { wins: number; played: number } }
export interface HonourPlayer { player: Player; achievements: AchievementSnapshot; records: HonourRecord[]; progression: PlayerProgression }
export interface HonoursSnapshot { accountId: string; catalogVersion: string; complete: true; rows: HonourPlayer[] }
export interface HonoursRepository { getSnapshot(accountId: string, signal?: AbortSignal): Promise<HonoursSnapshot> }

/** All tied account-private leaders, including inactive players. Exact ratios;
 * rounding is solely a display concern. Empty history never wins a record. */
export function buildHall(snapshot: HonoursSnapshot) {
  return recordCatalog.map(([id, title]) => {
    const candidates = snapshot.rows.flatMap(row => {
      const record = row.records.find(r => r.id === id)
      return record && record.value !== null ? [{ player: row.player, record }] : []
    })
    const compare = (a: HonourRecord, b: HonourRecord) => {
      const difference = id === 'best_win_rate'
        ? BigInt(a.ratio!.wins) * BigInt(b.ratio!.played) - BigInt(b.ratio!.wins) * BigInt(a.ratio!.played)
        : a.value! - b.value!
      return difference > 0 ? 1 : difference < 0 ? -1 : 0
    }
    let best = candidates[0]
    for (const candidate of candidates) if (best && compare(candidate.record, best.record) > 0) best = candidate
    return { id, title, value: best?.record.value ?? null,
      leaders: best ? candidates.filter(c => compare(c.record, best.record) === 0).map(c => c.player).sort((a,b) => a.id.localeCompare(b.id)) : [] }
  })
}
export function formatRecord(record: Pick<HonourRecord, 'id' | 'value'>): string {
  return record.value === null ? 'Sin marca elegible' : record.id === 'best_win_rate'
    ? `${record.value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%` : record.value.toLocaleString('es-ES')
}
