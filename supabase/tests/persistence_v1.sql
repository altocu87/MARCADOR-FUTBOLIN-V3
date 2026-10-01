-- Run as database administrator, ONLY as a single transaction ending in ROLLBACK.
-- Creates disposable fixtures inside this transaction. No credentials or real user data.
begin;
do $$
declare
  owner_a uuid := gen_random_uuid();
  owner_b uuid := gen_random_uuid();
  player_a uuid := gen_random_uuid();
  player_b uuid := gen_random_uuid();
  other_player uuid := gen_random_uuid();
  unused uuid;
  match_uuid uuid := gen_random_uuid();
  invalid_uuid uuid := gen_random_uuid();
  doc jsonb;
  bad jsonb;
  affected integer;
  rejected boolean;
begin
  insert into auth.users(id, aud, role) values (owner_a, 'authenticated', 'authenticated'), (owner_b, 'authenticated', 'authenticated');
  insert into public.players(id, owner_id, name) values (player_a, owner_a, 'Fixture blanco'), (player_b, owner_a, 'Fixture azul'), (other_player, owner_b, 'Otro propietario');
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  set local role authenticated;
  if (select count(*) from public.players) <> 2 then raise exception 'FAIL RLS lectura'; end if;
  insert into public.players(name) values ('Sin historial') returning id into unused;
  delete from public.players where id = unused;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL borrar jugador sin historial'; end if;
  update public.players set name = 'No permitido' where id = other_player;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL RLS edición'; end if;
  rejected := false;
  begin update public.players set xp = 100 where id = player_a;
  exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'FAIL columnas reservadas'; end if;

  doc := jsonb_build_object('owner_id', owner_a, 'match', jsonb_build_object(
    'id', match_uuid, 'match_type','QUICK','status','MATCH_END','victory_condition','TIME',
    'goal_limit',5,'time_limit_seconds',60,'white_score',1,'blue_score',0,'winner_team','WHITE',
    'started_at','2026-10-01T00:00:00Z','finished_at','2026-10-01T00:02:00Z',
    'went_to_extra_time',false,'went_to_penalties',false,'test_mode',false,
    'penalty_white_score',null,'penalty_blue_score',null,'penalty_white_attempts',null,'penalty_blue_attempts',null),
    'participants',jsonb_build_array(
      jsonb_build_object('player_id',player_a,'player_name','Fixture blanco','team','WHITE','position',1),
      jsonb_build_object('player_id',player_b,'player_name','Fixture azul','team','BLUE','position',1)),
    'events','[
      {"event_type":"period_start","period":"FIRST_HALF","match_time_seconds":0,"period_time_seconds":0,"white_score":0,"blue_score":0,"sequence":1,"occurred_at":"2026-10-01T00:00:00Z"},
      {"event_type":"goal","team":"WHITE","period":"FIRST_HALF","match_time_seconds":1,"period_time_seconds":1,"white_score":1,"blue_score":0,"sequence":2,"occurred_at":"2026-10-01T00:00:01Z"},
      {"event_type":"period_end","period":"FIRST_HALF","match_time_seconds":60,"period_time_seconds":60,"white_score":1,"blue_score":0,"sequence":3,"occurred_at":"2026-10-01T00:01:00Z"},
      {"event_type":"period_start","period":"SECOND_HALF","match_time_seconds":60,"period_time_seconds":0,"white_score":1,"blue_score":0,"sequence":4,"occurred_at":"2026-10-01T00:01:00Z"},
      {"event_type":"period_end","period":"SECOND_HALF","match_time_seconds":120,"period_time_seconds":60,"white_score":1,"blue_score":0,"sequence":5,"occurred_at":"2026-10-01T00:02:00Z"},
      {"event_type":"match_end","period":"SECOND_HALF","match_time_seconds":120,"period_time_seconds":60,"white_score":1,"blue_score":0,"sequence":6,"occurred_at":"2026-10-01T00:02:00Z"}
    ]'::jsonb);
  perform public.save_match_v1(doc);
  perform public.save_match_v1(doc);
  set constraints all immediate;
  set constraints all deferred;
  if (select count(*) from public.matches where id = match_uuid) <> 1
    or (select count(*) from public.match_participants where match_id = match_uuid) <> 2
    or (select count(*) from public.match_events where match_id = match_uuid) <> 6 then raise exception 'FAIL agregado/idempotencia'; end if;
  delete from public.players where id = player_a;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL protección historial'; end if;
  update public.players set name = 'Nuevo nombre', active = false where id = player_a;
  if (select player_name from public.match_participants where player_id = player_a limit 1) <> 'Fixture blanco' then raise exception 'FAIL snapshot'; end if;
  bad := jsonb_set(doc, '{match,id}', to_jsonb(gen_random_uuid()));
  perform public.save_match_v1(bad); -- offline result captured before deactivation is accepted
  set constraints all immediate;
  set constraints all deferred;

  bad := jsonb_set(doc, '{match,id}', to_jsonb(invalid_uuid));
  bad := jsonb_set(bad, '{participants,1,player_id}', to_jsonb(other_player));
  rejected := false;
  begin perform public.save_match_v1(bad); exception when others then rejected := true; end;
  if not rejected or exists(select 1 from public.matches where id = invalid_uuid) then raise exception 'FAIL RLS/atomicidad'; end if;

  bad := jsonb_set(doc, '{match,id}', to_jsonb(invalid_uuid));
  bad := jsonb_set(bad, '{events,0,sequence}', '9');
  rejected := false;
  begin perform public.save_match_v1(bad); exception when others then rejected := true; end;
  if not rejected or exists(select 1 from public.matches where id = invalid_uuid) then raise exception 'FAIL secuencia'; end if;

  bad := jsonb_set(doc, '{match,id}', to_jsonb(invalid_uuid));
  bad := jsonb_set(bad, '{events,1,period}', '"INVALID"');
  rejected := false;
  begin perform public.save_match_v1(bad); exception when check_violation then rejected := true; end;
  if not rejected or exists(select 1 from public.matches where id = invalid_uuid)
    or exists(select 1 from public.match_participants where match_id = invalid_uuid) then raise exception 'FAIL rollback tras insertar participantes'; end if;

  bad := jsonb_set(doc, '{match,id}', to_jsonb(invalid_uuid));
  bad := jsonb_set(bad, '{match,test_mode}', 'true');
  rejected := false;
  begin perform public.save_match_v1(bad); exception when check_violation then rejected := true; end;
  if not rejected then raise exception 'FAIL modo prueba DB'; end if;
  bad := jsonb_set(doc, '{owner_id}', to_jsonb(owner_b));
  rejected := false;
  begin perform public.save_match_v1(bad); exception when others then rejected := true; end;
  if not rejected then raise exception 'FAIL cuenta de inicio'; end if;

  -- Even direct table INSERTs cannot commit a partial match.
  rejected := false;
  begin
    insert into public.matches select invalid_uuid, owner_id, match_type, status, victory_condition, goal_limit, time_limit_seconds,
      white_score, blue_score, winner_team, started_at, finished_at, went_to_extra_time, went_to_penalties,
      penalty_white_score, penalty_blue_score, penalty_white_attempts, penalty_blue_attempts, test_mode,
      engine_version, payload_hash, created_at, updated_at from public.matches where id = match_uuid;
    set constraints all immediate;
  exception when others then rejected := true; end;
  if not rejected or exists(select 1 from public.matches where id = invalid_uuid) then raise exception 'FAIL protección inserción directa'; end if;
  set constraints all deferred;
  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  if exists(select 1 from public.matches) or (select count(*) from public.players) <> 1 then raise exception 'FAIL aislamiento'; end if;
  set local role anon;
  rejected := false;
  begin perform count(*) from public.players; exception when insufficient_privilege then rejected := true; end;
  if not rejected then raise exception 'FAIL acceso anónimo'; end if;
  reset role;
end $$;
select 'PASS: RLS, atomicidad, idempotencia, historial, modo prueba, secuencia y cuentas. Fixtures revertidos con ROLLBACK.' as result;
rollback;
