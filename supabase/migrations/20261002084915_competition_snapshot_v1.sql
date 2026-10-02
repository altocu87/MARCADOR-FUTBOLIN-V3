create function public.get_competition_snapshot_v1() returns jsonb language sql stable security invoker set search_path='' as $$ select coalesce(jsonb_agg(to_jsonb(r) order by r.ranking_position nulls last,r.elo desc,r.player_id),'[]'::jsonb) from public.get_ranking_v1() r $$;
revoke all on function public.get_competition_snapshot_v1() from public,anon,authenticated;
grant execute on function public.get_competition_snapshot_v1() to authenticated;
