import type { EloRules } from '../src/competition/elo'
import type { MatchDocument, Player } from '../src/services/persistence/models'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { mapMatch } from '../src/services/persistence/mapMatch'
/** Test parameters ONLY. These proposals are not production defaults/approval. */
export const testEloRules: EloRules = {
  version: 1, enabled: true, initial: 1200, eligibleFrom: null,
  provisionalMatches: 10, provisionalK: 40, establishedK: 20, rounding: 'nearest-away',
  categoryThresholds: [0, 1000, 1200, 1400, 1600, 1800], hysteresis: 25,
  marginMultipliers: [1, 1, 1.05, 1.1, 1.15, 1.2],
}
export const eloPlayers: Player[] = Array.from({ length: 5 }, (_, i) => ({
  id: `ee030000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
  name: i < 2 ? 'HOMÓNIMO ELO' : `ELO ${i + 1}`, nickname: null, photoUrl: null, active: i !== 3, level: 0,
}))
export function eloFixture(i: number, count = 2, winner: 'WHITE' | 'BLUE' = 'WHITE', margin = 1): MatchDocument {
  let now = Date.UTC(2026, 8, 1) + i * 180_000
  const engine = new MatchEngine(() => now)
  engine.createMatch({ mode: 'RANKED', victoryCondition: 'GOALS', goalLimit: margin, halfDurationMinutes: 1 })
  engine.skipCountdown()
  for (let n = 0; n < margin; n++) { engine.dispatch(winner === 'WHITE' ? 'GOL_BLANCO' : 'GOL_AZUL'); now += 3000 }
  return mapMatch(engine.getState(), eloPlayers.slice(0, count).map(p => ({ ...p, active: true })), `ee030001-0000-4000-8000-${String(i + 1).padStart(12, '0')}`, false)
}
export function eloFixtures(): MatchDocument[] {
  const docs = Array.from({ length: 13 }, (_, i) => eloFixture(i, i > 10 ? 4 : 2, i % 4 === 3 ? 'BLUE' : 'WHITE', i % 5 + 1))
  const penalty = eloFixture(13, 4, 'BLUE')
  penalty.match.white_score = 2; penalty.match.blue_score = 2
  penalty.match.went_to_extra_time = true; penalty.match.went_to_penalties = true
  penalty.match.penalty_white_score = 0; penalty.match.penalty_blue_score = 3
  penalty.match.penalty_white_attempts = 3; penalty.match.penalty_blue_attempts = 3
  // Replace with a complete real engine shootout below, retaining stable ID.
  let now = Date.UTC(2026, 8, 1) + 13 * 180_000
  const engine = new MatchEngine(() => now)
  engine.createMatch({ mode: 'RANKED', victoryCondition: 'TIME', goalLimit: 5, halfDurationMinutes: 1 })
  engine.skipCountdown(); now += 60_000; engine.tick(); engine.continueToNextPeriod(); engine.skipCountdown()
  now += 60_000; engine.tick(); engine.continueToNextPeriod(); engine.skipCountdown()
  now += 60_000; engine.tick(); engine.continueToNextPeriod()
  for (let n = 0; n < 3; n++) { engine.dispatch('PENALTI_BLANCO_FALLO'); engine.dispatch('PENALTI_AZUL_GOL') }
  docs.push(mapMatch(engine.getState(), eloPlayers.slice(0, 4).map(p => ({ ...p, active: true })), penalty.match.id, false))
  const draw = eloFixture(14, 4)
  draw.match.white_score = draw.match.blue_score = 1; draw.match.winner_team = null
  draw.events.at(-1)!.white_score = draw.events.at(-1)!.blue_score = 1; draw.events.at(-1)!.team = null
  docs.push(draw)
  const quick = eloFixture(15); quick.match.match_type = 'QUICK'; docs.push(quick)
  const chaos = eloFixture(16); chaos.match.match_type = 'CHAOS'; docs.push(chaos)
  return docs
}
