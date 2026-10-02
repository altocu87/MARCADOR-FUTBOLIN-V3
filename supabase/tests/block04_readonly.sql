-- Dependency/security check ONLY, not activation or new fixtures.
-- Execute entire script against unemjyfhzljcdjcbiiwh; no INSERT/UPDATE/DELETE.
begin transaction isolation level repeatable read read only;
set local statement_timeout = '15s';
do $check$
declare
  operator_id uuid;
  other_id uuid := 'ee040000-0000-4000-8000-000000000001';
  expected_players bigint;
  snapshot jsonb;
begin
  select id into operator_id from auth.users where email_confirmed_at is not null order by created_at limit 1;
  if operator_id is null then raise exception 'Existing operator required; do not create one'; end if;
  if exists(select 1 from auth.users where id=other_id) then raise exception 'Isolation probe UUID collision'; end if;
  select count(*) into expected_players from public.players where owner_id=operator_id;
  if not exists(select 1 from public.elo_rules_v1 where enabled and version=2 and initial_elo=1200
    and eligible_from is null and provisional_matches=10 and provisional_k=40 and established_k=20
    and rounding='nearest-away' and category_thresholds=array[0,1000,1200,1400,1600,1800]
    and hysteresis=25 and margin_multipliers=array[1,1,1,1,1,1]::numeric[])
    then raise exception 'Approved ELO configuration changed'; end if;
  if not exists(select 1 from public.xp_rules_v1 where enabled and complete=50 and win=100 and draw=60
    and loss=25 and ranked_win=50 and extra_time_win=25 and penalties_win=25 and eligible_from is null
    and cardinality(thresholds)=101 and thresholds[2]=100 and thresholds[3]=255 and thresholds[101]=50119)
    then raise exception 'Approved XP configuration changed'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('players','matches','match_participants','match_events','xp_rules_v1','elo_rules_v1') and not c.relrowsecurity)
    then raise exception 'RLS not enabled'; end if;
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='player_progression_v1' and 'security_invoker=true'=any(c.reloptions))
    then raise exception 'XP view is not invoker'; end if;
  if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('get_ranking_v1','get_competition_snapshot_v1')
    and (p.prosecdef or p.provolatile <> 's')) then raise exception 'Competition read contract changed'; end if;
  if has_table_privilege('anon','public.matches','SELECT')
    or has_function_privilege('anon','public.get_competition_snapshot_v1()','EXECUTE')
    or has_table_privilege('authenticated','public.elo_rules_v1','UPDATE')
    or has_table_privilege('authenticated','public.xp_rules_v1','UPDATE')
    or has_table_privilege('authenticated','public.matches','UPDATE')
    or has_table_privilege('authenticated','public.matches','DELETE')
    then raise exception 'Private/write permissions changed'; end if;
  perform set_config('request.jwt.claim.sub',operator_id::text,true);
  set local role authenticated;
  snapshot := public.get_competition_snapshot_v1();
  if jsonb_array_length(snapshot) <> expected_players
    or exists(select 1 from jsonb_array_elements(snapshot) r where not (r->>'enabled')::boolean
      or (r->>'rules_version')::integer <> 2 or r->>'category' is null)
    then raise exception 'Approved ELO snapshot differs'; end if;
  if exists(select 1 from public.matches where owner_id <> operator_id)
    or exists(select 1 from public.players where owner_id <> operator_id)
    then raise exception 'Owner isolation failed'; end if;
  if (select count(*) from public.player_progression_v1) <> expected_players then raise exception 'XP projection missing'; end if;
  perform set_config('request.jwt.claim.sub',other_id::text,true);
  if exists(select 1 from public.matches) or exists(select 1 from public.players)
    or exists(select 1 from public.match_participants) or exists(select 1 from public.match_events)
    or exists(select 1 from public.player_progression_v1) or public.get_competition_snapshot_v1() <> '[]'::jsonb
    then raise exception 'Other identity saw private rows'; end if;
end
$check$;
select 'PASS: block04 dependency and read-only RLS checks; no activation or fixture writes' as result;
rollback;
