import type { MatchSummary } from '../services/persistence/models'
export type MatchFormat = '1v1' | '1v2' | '2v2'
/** Three-player casual matches may put the solo player on either colour. */
export function matchFormat(match: MatchSummary): MatchFormat {
  const participants = match.participants
  const white = participants.filter(p => p.team === 'WHITE').length
  const blue = participants.filter(p => p.team === 'BLUE').length
  if (![2, 3, 4].includes(participants.length) || new Set(participants.map(p => p.player_id)).size !== participants.length ||
    white + blue !== participants.length || ![1, 2].includes(white) || ![1, 2].includes(blue) ||
    participants.length === 3 && match.match_type === 'RANKED' ||
    new Set(participants.map(p => `${p.team}:${p.position}`)).size !== participants.length ||
    participants.some(p => !Number.isInteger(p.position) || p.position < 1 || p.position > (p.team === 'WHITE' ? white : blue))) {
    throw new Error('Equipos incompatibles. No se muestra un análisis parcial.')
  }
  return participants.length === 2 ? '1v1' : participants.length === 3 ? '1v2' : '2v2'
}
