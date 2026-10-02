-- Approved by the owner in block 02 on 2026-10-02. No historical writes.
-- Exact cumulative thresholds avoid different floating point curves in JS/SQL.
create function public.valid_xp_thresholds_v1(values_array bigint[]) returns boolean
language sql immutable security invoker set search_path = '' as $$
  select coalesce(array_ndims(values_array)=1 and array_lower(values_array,1)=1
    and cardinality(values_array) between 2 and 1001 and values_array[1]=0
    and not exists(select 1 from unnest(values_array) with ordinality t(value,n)
      where value is null or value < 0 or value > 9007199254740991
        or n > 1 and value <= values_array[n::integer-1]), false);
$$;
revoke all on function public.valid_xp_thresholds_v1(bigint[]) from public, anon, authenticated;

create table public.xp_rules_v1 (
  singleton boolean primary key default true check(singleton),
  version integer not null check(version > 0),
  enabled boolean not null default false,
  eligible_from timestamptz,
  complete integer not null check(complete between 0 and 1000000),
  win integer not null check(win between 0 and 1000000),
  draw integer not null check(draw between 0 and 1000000),
  loss integer not null check(loss between 0 and 1000000),
  ranked_win integer not null check(ranked_win between 0 and 1000000),
  extra_time_win integer not null check(extra_time_win between 0 and 1000000),
  penalties_win integer not null check(penalties_win between 0 and 1000000),
  thresholds bigint[] not null check(public.valid_xp_thresholds_v1(thresholds))
);
alter table public.xp_rules_v1 enable row level security;
revoke all on public.xp_rules_v1 from public, anon, authenticated;
grant select on public.xp_rules_v1 to authenticated;
create policy xp_rules_read on public.xp_rules_v1 for select to authenticated using(true);
-- Activation is a separate reviewed migration; deployment before approval is safe.
insert into public.xp_rules_v1 values(true,1,false,null,50,100,60,25,50,25,25,
  array[0,100,255,441,650,879,1124,1384,1657,1942,2239,2547,2864,3191,3526,3871,4223,4583,4951,5325,5707,6096,6491,6892,7300,7713,8133,8558,8989,9425,9866,10312,10764,11221,11682,12148,12619,13094,13575,14059,14548,15041,15538,16040,16545,17055,17569,18086,18607,19133,19662,20194,20731,21271,21814,22361,22912,23466,24024,24584,25149,25716,26287,26861,27438,28018,28602,29188,29778,30371,30966,31565,32167,32771,33379,33989,34602,35218,35837,36459,37083,37710,38340,38973,39608,40246,40886,41529,42175,42823,43474,44128,44784,45442,46103,46766,47432,48100,48771,49444,50119]::bigint[]);

-- Read-only, caller RLS, one statement snapshot. Stable participant identities;
-- unique(match_id,player_id) and final aggregate constraints already enforce exactly once.
-- No ledger/counter to duplicate or drift, no client or privileged XP writes.
create view public.player_progression_v1 with (security_invoker = true) as
select p.id, p.name, p.nickname, p.photo_url, p.active,
  totals.xp, levels.level, c.thresholds[levels.level+1] as current_threshold,
  c.thresholds[levels.level+2] as next_threshold, cardinality(c.thresholds)-1 as max_level,
  totals.confirmed_matches, c.version as rules_version, c.enabled
from public.players p cross join public.xp_rules_v1 c
cross join lateral (
  select coalesce(sum(c.complete + case
    when m.winner_team is null then c.draw
    when m.winner_team <> mp.team then c.loss
    else c.win + case when m.match_type='RANKED' then c.ranked_win else 0 end
      + case when m.went_to_penalties then c.penalties_win
        when m.went_to_extra_time then c.extra_time_win else 0 end end),0)::bigint as xp,
    count(*) as confirmed_matches
  from public.match_participants mp join public.matches m on m.id=mp.match_id and m.owner_id=mp.owner_id
  where mp.player_id=p.id and mp.owner_id=p.owner_id and c.enabled
    and m.status='MATCH_END' and not m.test_mode
    and (c.eligible_from is null or m.started_at >= c.eligible_from)
) totals
cross join lateral (
  select (coalesce(max(n),1)-1)::integer as level
  from unnest(c.thresholds) with ordinality t(threshold,n) where threshold <= totals.xp
) levels;
revoke all on public.player_progression_v1 from public, anon, authenticated;
grant select on public.player_progression_v1 to authenticated;
comment on view public.player_progression_v1 is
  'Authoritative XP/levels reconstructed from current committed history under caller RLS. Legacy players.xp/level remain reserved; never use as progression counters.';
