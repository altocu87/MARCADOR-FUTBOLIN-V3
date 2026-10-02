/** Run the complete generated SQL once; all business fixtures roll back. */
import { MatchEngine } from '../../src/match-engine/MatchEngine'
import { mapMatch } from '../../src/services/persistence/mapMatch'
import { eloPlayers } from '../../tests/eloFixtures'
import { approvedXpRules, rebuildProgression } from '../../src/progression/xp'
const players = eloPlayers.slice(0,3).map((p,i)=>({...p,id:`ee040000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,active:true}))
const docs = (['WHITE','BLUE'] as const).map((soloTeam,i)=>{
  const e = new MatchEngine(()=>Date.UTC(2026,9,2,12,i))
  e.createMatch({mode:i===0?'QUICK':'CHAOS',soloTeam,victoryCondition:'GOALS',goalLimit:1,halfDurationMinutes:1})
  e.skipCountdown(); e.dispatch('GOL_BLANCO')
  return mapMatch(e.getState(),players,`ee040001-0000-4000-8000-${String(i+1).padStart(12,'0')}`,false)
})
const summaries=docs.map(d=>({...d.match,participants:d.participants}))
const expected=players.map(p=>rebuildProgression(summaries,p.id,approvedXpRules))
const literal=(v:unknown)=>`'${JSON.stringify(v).replaceAll("'","''")}'::jsonb`
console.log(`begin;
set local lock_timeout='3s'; set local statement_timeout='30s';
do $test$
declare operator_id uuid; doc jsonb; p jsonb; docs jsonb:=${literal(docs)}; expected jsonb:=${literal(expected)};
 rejected boolean; saved_id uuid; before_count integer; xp_before bigint;
begin
 select owner_id into operator_id from public.players order by created_at limit 1;
 if operator_id is null then raise exception 'Existing operator required'; end if;
 if exists(select 1 from public.players where id in(select (value->>'id')::uuid from jsonb_array_elements(${literal(players)}))) then raise exception 'Fixture collision'; end if;
 select count(*) into before_count from public.matches;
 select sum(xp) into xp_before from public.player_progression_v1;
 for p in select value from jsonb_array_elements(${literal(players)}) loop
  insert into public.players(id,owner_id,name) values((p->>'id')::uuid,operator_id,p->>'name');
 end loop;
 perform set_config('request.jwt.claim.sub',operator_id::text,true);
 set local role authenticated;
 for doc in select value from jsonb_array_elements(docs) loop
  doc:=doc || jsonb_build_object('owner_id',operator_id);
  saved_id:=public.save_match_v1(doc);
  set constraints all immediate;
  if public.save_match_v1(doc)<>saved_id then raise exception 'Retry changed identity'; end if;
  set constraints all deferred;
 end loop;
 for p in select value from jsonb_array_elements(expected) loop
  if not exists(select 1 from public.player_progression_v1 where id=(p->>'playerId')::uuid and xp=(p->>'xp')::bigint and confirmed_matches=2) then raise exception 'XP mismatch'; end if;
 end loop;
 if exists(select 1 from public.get_ranking_v1() where player_id in(select (value->>'id')::uuid from jsonb_array_elements(${literal(players)})) and (classified_matches<>0 or elo<>1200 or not enabled)) then raise exception 'Casual game changed ELO'; end if;
 doc:=jsonb_set(docs->0,'{match,id}',to_jsonb('ee040001-0000-4000-8000-000000000003'::text)) || jsonb_build_object('owner_id',operator_id);
 doc:=jsonb_set(doc,'{match,match_type}','"RANKED"');
 rejected:=false; begin perform public.save_match_v1(doc); exception when others then rejected:=true; end;
 if not rejected then raise exception 'Ranked 1v2 accepted'; end if;
 doc:=jsonb_set(docs->0,'{match,id}',to_jsonb('ee040001-0000-4000-8000-000000000004'::text)) || jsonb_build_object('owner_id',operator_id);
 doc:=jsonb_set(doc,'{participants,1,position}','2');
 rejected:=false; begin perform public.save_match_v1(doc); set constraints all immediate; exception when others then rejected:=true; end;
 if not rejected then raise exception 'Invalid solo position accepted'; end if;
 set constraints all deferred;
 reset role;
 -- Exercise deferred validation even when bypassing the saving RPC.
 rejected:=false;
 begin
  insert into public.matches select (jsonb_populate_record(null::public.matches,to_jsonb(m) || jsonb_build_object('id','ee040001-0000-4000-8000-000000000005','match_type','RANKED'))).* from public.matches m where m.id=(docs->0->'match'->>'id')::uuid;
  insert into public.match_participants(owner_id,match_id,player_id,player_name,team,position) select owner_id,'ee040001-0000-4000-8000-000000000005',player_id,player_name,team,position from public.match_participants where match_id=(docs->0->'match'->>'id')::uuid;
  set constraints all immediate;
 exception when others then
   if sqlerrm <> 'Participantes incompletos' then raise; end if; rejected:=true; end;
 if not rejected then raise exception 'Deferred ranked 1v2 accepted'; end if;
 if (select count(*) from public.matches)<>before_count+2 then raise exception 'Unexpected result count'; end if;
 if (select sum(xp) from public.player_progression_v1 where id not in(select (value->>'id')::uuid from jsonb_array_elements(${literal(players)}))) is distinct from xp_before then raise exception 'Existing XP changed'; end if;
end $test$;
select 'PASS 04: QUICK/CHAOS 1v2 both colours, real RPC/retries, XP parity, no ELO, ranked rejected by RPC/deferred trigger, invalid position rejected; ROLLBACK.' as result;
rollback;`)
