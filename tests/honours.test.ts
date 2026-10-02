import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildHall, tierXp } from '../src/honours/model'
import { mapHonours, SupabaseHonoursRepository } from '../src/services/supabase/honours'
import { honoursAccount, honoursFixture, honoursRaw } from './honoursFixtures'
import { eloFixture, eloPlayers } from './eloFixtures'
import type { MatchSummary } from '../src/services/persistence/models'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../src/services/supabase/database.types'
const match = (i:number,goals=1):MatchSummary => { const d=eloFixture(i,2,'WHITE',goals);return {...d.match,match_type:'QUICK',participants:d.participants} }

test('V2 aprobado: histórico, desglose, identidad y reintento; recálculo reduce y recupera',()=>{
  const matches=[match(0,4)]
  const snapshot=honoursFixture(eloPlayers,matches), row=snapshot.rows[0]
  assert.deepEqual(tierXp,[25,25,50,75,100]);assert.equal(tierXp.reduce((a,b)=>a+b,0)*9,2475)
  assert.equal(row.progression.baseXp,150);assert.equal(row.progression.achievementXp,100)
  assert.equal(row.progression.xp,250);assert.equal(row.progression.level,1)
  assert.deepEqual(honoursFixture(eloPlayers,[...matches,...structuredClone(matches)]),snapshot)
  const jump=honoursFixture(eloPlayers,[match(0,50)]).rows[0]
  assert.equal(jump.progression.achievementXp,175);assert.equal(jump.progression.level,2)
  assert.deepEqual(jump.achievements.families.map(f=>f.identity),row.achievements.families.map(f=>f.identity))
  assert.equal(honoursFixture(eloPlayers,[]).rows[0].progression.xp,0)
  assert.deepEqual(honoursFixture(eloPlayers,matches),snapshot)
  assert.equal(honoursFixture(eloPlayers,[{...match(0),test_mode:true}]).rows[0].progression.xp,0)
})

test('Hall privado: ocho marcas, todos los empates, inactive/alias; vacíos sin líderes/ELO inicial',()=>{
  const snapshot=honoursFixture(eloPlayers,[match(0)])
  const hall=buildHall(snapshot)
  assert.equal(hall.length,8)
  assert.equal(hall.find(r=>r.id==='most_played')!.leaders.length,2)
  assert.equal(hall.find(r=>r.id==='current_elo')!.leaders.length,0)
  assert.ok(buildHall(honoursFixture(eloPlayers,[])).every(r=>r.leaders.length===0))
  const changed=honoursFixture(eloPlayers.map(p=>({...p,active:false,nickname:'Alias'})),[match(0)])
  assert.equal(changed.rows[0].progression.xp,snapshot.rows[0].progression.xp)
  assert.ok(buildHall(changed).find(r=>r.id==='most_played')!.leaders.every(p=>!p.active))
})

test('Hall: porcentajes iguales comparan fracciones exactas y no el redondeo visible',()=>{
  const snapshot=honoursFixture(eloPlayers,[])
  for(const [index,wins,played] of [[0,1,20],[1,2,40],[2,1,21]]) {
    const r=snapshot.rows[index].records.find(r=>r.id==='best_win_rate')!
    r.value=wins/played*100;r.ratio={wins,played}
  }
  assert.deepEqual(buildHall(snapshot).find(r=>r.id==='best_win_rate')!.leaders.map(p=>p.id),eloPlayers.slice(0,2).map(p=>p.id))
})

test('contrato rechaza lectura incompleta, otra cuenta, duplicados, tier ausente y XP incoherente',()=>{
  const raw=honoursRaw(eloPlayers,[match(0)])
  const mutations=[
    (v:typeof raw)=>{v.complete=false},(v:typeof raw)=>{v.accountId=crypto.randomUUID()},
    (v:typeof raw)=>{v.rows.push(v.rows[0])},(v:typeof raw)=>{v.rows[0].badges.pop()},
    (v:typeof raw)=>{v.rows[0].badges[0].grantedXp=999},
    (v:typeof raw)=>{v.rows[0].progression.achievement_xp=0},
    (v:typeof raw)=>{v.rows[0].progression.xp+=1},
    (v:typeof raw)=>{v.rows[0].records.best_win_rate={wins:1,played:19}},
  ]
  for(const change of mutations){const invalid=structuredClone(raw);change(invalid);assert.throws(()=>mapHonours(invalid,honoursAccount))}
})

test('repositorio scalar completo, abortSignal y error: no devuelve ceros ni páginas parciales',async()=>{
  const raw=honoursRaw(eloPlayers,[match(0)]), controller=new AbortController()
  let signal:AbortSignal|undefined, called=''
  const client={rpc(name:string){called=name;return{abortSignal(s:AbortSignal){signal=s;return Promise.resolve({data:raw,error:null})}}}} as unknown as SupabaseClient<Database>
  const actual=await new SupabaseHonoursRepository(client).getSnapshot(honoursAccount,controller.signal)
  assert.equal(called,'get_honours_snapshot_v1');assert.equal(signal,controller.signal);assert.equal(actual.rows.length,5)
  const failing={rpc(){return Promise.resolve({data:null,error:new Error('Denied')})}} as unknown as SupabaseClient<Database>
  await assert.rejects(new SupabaseHonoursRepository(failing).getSnapshot(honoursAccount),/Denied/)
})

test('V2 1v2 casual: XP completo, goles de equipo y ningún ELO; ranked inválido falla',()=>{
  const d=eloFixture(40,4,'WHITE',5)
  const casual:MatchSummary={...d.match,match_type:'CHAOS',participants:d.participants.filter(p=>p.team==='BLUE'||p.position===1)}
  const snapshot=honoursFixture(eloPlayers,[casual])
  for(const participant of casual.participants){
    const row=snapshot.rows.find(r=>r.player.id===participant.player_id)!
    assert.equal(row.progression.baseXp,participant.team==='WHITE'?150:75)
    assert.equal(row.progression.achievementXp,participant.team==='WHITE'?125:25)
    assert.equal(row.records.find(r=>r.id==='current_elo')!.value,null)
  }
  assert.throws(()=>honoursFixture(eloPlayers,[{...casual,match_type:'RANKED'}]))
})
