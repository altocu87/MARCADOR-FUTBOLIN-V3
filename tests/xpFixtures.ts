import { MatchEngine } from '../src/match-engine/MatchEngine'
import { mapMatch } from '../src/services/persistence/mapMatch'
import type { MatchDocument, Player } from '../src/services/persistence/models'

export const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
export const xpPlayers: Player[] = [901,902,903,904].map(n => ({ id: uuid(n), name: `XP fixture ${n}`, nickname: null, photoUrl: null, active: true, level: 0 }))
export function xpFixtures(): MatchDocument[] {
  return ['QUICK','CHAOS','RANKED','EXTRA','PENALTIES','RANKED_PENALTIES','DRAW'].map((kind, i) => {
    let now = Date.parse('2026-10-01T00:00:00Z') + i * 86400000
    const overtime = ['EXTRA','PENALTIES','RANKED_PENALTIES'].includes(kind)
    const engine = new MatchEngine(() => now, () => 'flash')
    engine.createMatch({ mode: kind.startsWith('RANKED') ? 'RANKED' : kind === 'CHAOS' ? 'CHAOS' : 'QUICK', victoryCondition: overtime ? 'TIME' : 'GOALS', goalLimit: 1, halfDurationMinutes: 1 })
    engine.skipCountdown()
    if (!overtime) engine.dispatch('GOL_BLANCO')
    else {
      now+=60000;engine.tick();engine.continueToNextPeriod();engine.skipCountdown()
      now+=60000;engine.tick();engine.continueToNextPeriod();engine.skipCountdown()
      if(kind === 'EXTRA') engine.dispatch('GOL_AZUL')
      else {
        now+=60000;engine.tick();engine.continueToNextPeriod()
        for(let kick=0;kick<3;kick++){engine.dispatch('PENALTI_BLANCO_FALLO');engine.dispatch('PENALTI_AZUL_GOL')}
      }
    }
    const doc = mapMatch(engine.getState(), i % 2 === 0 ? xpPlayers.slice(0,2) : xpPlayers, uuid(950+i), false)
    if(kind==='DRAW') {
      doc.match.white_score=0;doc.match.winner_team=null
      for(const event of doc.events) event.white_score=0
    }
    return doc
  })
}
