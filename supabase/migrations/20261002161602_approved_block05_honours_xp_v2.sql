-- Block 05: expressly approved XP V2/history/recalculation and eight private records.
-- All projections are read-only and use caller RLS. No counters or business writes.
create view public.player_honour_results_v1 with (security_invoker=true) as
with perspective as (
  select p.owner_id, p.id player_id, m.id match_id, m.finished_at, m.match_type,
    m.winner_team = mp.team as won, m.went_to_extra_time, m.went_to_penalties,
    case when mp.team='WHITE' then m.white_score else m.blue_score end gf,
    case when mp.team='WHITE' then m.blue_score else m.white_score end ga,
    sum(case when m.winner_team = mp.team then 0 else 1 end) over
      (partition by p.id order by m.finished_at,m.id) gap
  from public.players p join public.match_participants mp on mp.player_id=p.id and mp.owner_id=p.owner_id
  join public.matches m on m.id=mp.match_id and m.owner_id=p.owner_id
  where p.owner_id=(select auth.uid()) and m.status='MATCH_END' and not m.test_mode
), streaks as (
  select *, count(*) filter(where won) over(partition by player_id,gap order by finished_at,match_id) streak
  from perspective
)
select *, count(*) over w played, count(*) filter(where won) over w wins,
  sum(gf) over w team_goals, max(streak) over w best_streak,
  count(*) filter(where match_type='RANKED') over w ranked_played,
  count(*) filter(where won and match_type='RANKED') over w ranked_wins,
  count(*) filter(where won and gf>0 and ga=0) over w clean_win,
  count(*) filter(where won and went_to_extra_time and not went_to_penalties) over w extra_win,
  count(*) filter(where won and went_to_penalties) over w penalty_win
from streaks window w as (partition by player_id order by finished_at,match_id);
revoke all on public.player_honour_results_v1 from public,anon,authenticated;
grant select on public.player_honour_results_v1 to authenticated;

create view public.player_achievement_tiers_v1 with (security_invoker=true) as
with catalog(family,thresholds) as (values
  ('played',array[1,5,25,100,250]),('wins',array[1,5,25,100,250]),
  ('team_goals',array[1,5,50,250,1000]),('streak',array[2,3,5,10,20]),
  ('ranked_played',array[1,5,25,50,100]),('ranked_wins',array[1,5,10,25,50]),
  ('clean_win',array[1,5,10,25,50]),('extra_win',array[1,3,5,10,25]),('penalty_win',array[1,3,5,10,25])
), metrics as (
  select r.owner_id,r.player_id,r.match_id,r.finished_at,v.family,v.value
  from public.player_honour_results_v1 r cross join lateral (values
    ('played',r.played),('wins',r.wins),('team_goals',r.team_goals),('streak',r.best_streak),
    ('ranked_played',r.ranked_played),('ranked_wins',r.ranked_wins),('clean_win',r.clean_win),
    ('extra_win',r.extra_win),('penalty_win',r.penalty_win)) v(family,value)
)
select p.owner_id,p.id player_id,c.family,t.n::integer tier,t.threshold,
  coalesce(last_value.value,0)::bigint value, first_hit.match_id,first_hit.finished_at,
  (array[25,25,50,75,100])[t.n::integer] tier_xp,
  case when first_hit.match_id is null then 0 else (array[25,25,50,75,100])[t.n::integer] end granted_xp
from public.players p cross join catalog c cross join lateral unnest(c.thresholds) with ordinality t(threshold,n)
left join lateral (select max(value) value from metrics m where m.player_id=p.id and m.owner_id=p.owner_id and m.family=c.family) last_value on true
left join lateral (select m.match_id,m.finished_at from metrics m where m.player_id=p.id and m.owner_id=p.owner_id and m.family=c.family and m.value>=t.threshold order by m.finished_at,m.match_id limit 1) first_hit on true
where p.owner_id=(select auth.uid());
revoke all on public.player_achievement_tiers_v1 from public,anon,authenticated;
grant select on public.player_achievement_tiers_v1 to authenticated;
comment on view public.player_achievement_tiers_v1 is 'Identity owner/player/family/tier; XP V2 25/25/50/75/100, historical, reversible reconstruction. No repeat grants.';

-- Preserve every existing column and base reward/threshold rule; append breakdown.
create or replace view public.player_progression_v1 with (security_invoker=true) as
select p.id,p.name,p.nickname,p.photo_url,p.active,
 totals.xp,levels.level,c.thresholds[levels.level+1] current_threshold,
 c.thresholds[levels.level+2] next_threshold,cardinality(c.thresholds)-1 max_level,
 base.confirmed_matches,c.version rules_version,c.enabled,base.xp base_xp,awards.xp achievement_xp
from public.players p cross join public.xp_rules_v1 c
cross join lateral (
  select coalesce(sum(c.complete + case when m.winner_team is null then c.draw
    when m.winner_team<>mp.team then c.loss else c.win
    + case when m.match_type='RANKED' then c.ranked_win else 0 end
    + case when m.went_to_penalties then c.penalties_win when m.went_to_extra_time then c.extra_time_win else 0 end end),0)::bigint xp,
    count(*) confirmed_matches
  from public.match_participants mp join public.matches m on m.id=mp.match_id and m.owner_id=mp.owner_id
  where mp.player_id=p.id and mp.owner_id=p.owner_id and c.enabled and m.status='MATCH_END' and not m.test_mode
    and (c.eligible_from is null or m.started_at>=c.eligible_from)
) base
cross join lateral (select case when c.enabled then coalesce(sum(a.granted_xp),0) else 0 end::bigint xp
  from public.player_achievement_tiers_v1 a where a.player_id=p.id and a.owner_id=p.owner_id) awards
cross join lateral (select (base.xp+awards.xp)::bigint xp) totals
cross join lateral (select (coalesce(max(n),1)-1)::integer level from unnest(c.thresholds) with ordinality t(threshold,n) where threshold<=totals.xp) levels;
comment on view public.player_progression_v1 is 'Authoritative total XP = approved base match XP + unique current achievement tiers under RLS. Records 0 XP. Legacy player counters untouched.';

create function public.get_honours_snapshot_v1() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  with competitive as (select * from public.get_ranking_v1()), rows as (
    select p.id,p.name,p.nickname,p.photo_url,p.active,
      (select coalesce(jsonb_agg(jsonb_build_object('family',a.family,'tier',a.tier,'threshold',a.threshold,
        'value',a.value,'matchId',a.match_id,'finishedAt',a.finished_at,'tierXp',a.tier_xp,'grantedXp',a.granted_xp)
        order by a.family,a.tier),'[]'::jsonb) from public.player_achievement_tiers_v1 a where a.player_id=p.id) badges,
      (select to_jsonb(x) from public.player_progression_v1 x where x.id=p.id) progression,
      jsonb_build_object('most_played',nullif(stats.played,0),'most_wins',case when stats.played>0 then stats.wins end,
        'best_streak',case when stats.played>0 then stats.streak end,'biggest_margin',stats.margin,
        'most_team_goals',stats.goals,'best_win_rate',case when stats.played>=20 then jsonb_build_object('wins',stats.wins,'played',stats.played) end,
        'current_elo',case when e.enabled and e.classified_matches>0 then e.elo end,
        'max_elo',case when e.enabled and e.classified_matches>0 then e.max_elo end) records,
      jsonb_build_object('biggest_margin',coalesce((select jsonb_agg(r.match_id order by r.finished_at,r.match_id) from public.player_honour_results_v1 r where r.player_id=p.id and r.won and r.gf-r.ga=stats.margin),'[]'::jsonb),
        'most_team_goals',coalesce((select jsonb_agg(r.match_id order by r.finished_at,r.match_id) from public.player_honour_results_v1 r where r.player_id=p.id and r.gf=stats.goals),'[]'::jsonb)) evidence
    from public.players p left join competitive e on e.player_id=p.id
    cross join lateral (select count(*) played,count(*) filter(where won) wins,coalesce(max(best_streak),0) streak,
      max(gf-ga) filter(where won) margin,max(gf) goals from public.player_honour_results_v1 r where r.player_id=p.id) stats
    where p.owner_id=(select auth.uid())
  ) select jsonb_build_object('accountId',auth.uid(),'catalogVersion','tiers-v2','complete',true,
    'rows',coalesce(jsonb_agg(to_jsonb(rows) order by id),'[]'::jsonb)) into result from rows;
  return result;
end;
$$;
revoke all on function public.get_honours_snapshot_v1() from public,anon,authenticated;
grant execute on function public.get_honours_snapshot_v1() to authenticated;
comment on function public.get_honours_snapshot_v1() is 'Complete private one-statement snapshot, incl inactive players, approved tiers/records, no PostgREST row cap. Hall ties compared exactly by consumer.';
