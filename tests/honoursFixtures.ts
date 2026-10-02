/** Approved contract reference for isolated tests only; never a production writer. */
import type { MatchSummary, Player } from '../src/services/persistence/models'
import { approvedXpRules, levelProgression, rebuildProgression } from '../src/progression/xp'
import { rebuildAchievements } from '../src/achievements/rebuild'
import { tierXp } from '../src/honours/model'
import { mapHonours } from '../src/services/supabase/honours'
import { reviewHonours } from './block05Prototype'
import { testEloRules } from './eloFixtures'

export const honoursAccount = 'ee050000-0000-4000-8000-000000000001'
export function honoursRaw(players: readonly Player[], matches: readonly MatchSummary[], accountId = honoursAccount) {
  const review = reviewHonours(players,[{ source: 'confirmed', complete: true, matches }],{ ...testEloRules,version:2,marginMultipliers:[1,1,1,1,1,1] })
  return { accountId, catalogVersion: 'tiers-v2',complete:true, rows: review.rows.map(row => {
    const achievements = rebuildAchievements({ accountId,playerId:row.player.id,source:'confirmed',complete:true,matches })
    const base = rebuildProgression(matches,row.player.id,approvedXpRules)
    const extra = achievements.families.reduce((n,f) => n+f.tiers.reduce((xp,t,i) => xp+(t.evidence?tierXp[i]:0),0),0)
    const progression = { ...base,...levelProgression(base.xp+extra,approvedXpRules.thresholds) }
    return { id:row.player.id,name:row.player.name,nickname:row.player.nickname,photo_url:row.player.photoUrl,active:row.player.active,
      badges: achievements.families.flatMap(f => f.tiers.map((t,i) => ({family:f.id,tier:t.level,threshold:t.threshold,value:f.value,matchId:t.evidence?.matchId ?? null,finishedAt:t.evidence?.finishedAt ?? null,tierXp:tierXp[i],grantedXp:t.evidence?tierXp[i]:0}))),
      records:Object.fromEntries(row.records.map(r => [r.id,r.id==='best_win_rate' && r.value!==null ? r.ratio : r.value])),
      evidence:Object.fromEntries(row.records.filter(r => ['biggest_margin','most_team_goals'].includes(r.id)).map(r => [r.id,r.matchIds])),
      progression:{id:row.player.id,xp:progression.xp,base_xp:base.xp,achievement_xp:extra,level:progression.level,current_threshold:progression.currentThreshold,next_threshold:progression.nextThreshold,max_level:progression.maxLevel,confirmed_matches:base.confirmedMatches,rules_version:base.rulesVersion,enabled:base.enabled} }
  }) }
}
export function honoursFixture(players: readonly Player[], matches: readonly MatchSummary[], accountId = honoursAccount) {
  return mapHonours(honoursRaw(players,matches,accountId),accountId)
}
