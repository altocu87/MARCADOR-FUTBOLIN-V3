import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/services/supabase/database.types'
import { approvedXpRules as rules, levelProgression, rebuildProgression, validateXpRules } from '../src/progression/xp'
import { mapProgression, SupabaseProgressionRepository, SupabasePlayerRepository } from '../src/services/supabase/repositories'
import { SaveCoordinator } from '../src/services/persistence/SaveCoordinator'
import type { MatchSummary } from '../src/services/persistence/models'
import { xpFixtures, xpPlayers, uuid } from './xpFixtures'
const docs=xpFixtures(), games=docs.map(d=>({...d.match,participants:d.participants}))
const xp=(matches:readonly MatchSummary[], id=xpPlayers[0].id)=>rebuildProgression(matches,id,rules)

test('tabla aprobada: 1v1/2v2 y desempate único por jugador',()=>{
  assert.deepEqual(games.map(m=>xp([m]).xp),[150,150,200,75,75,75,110])
  assert.deepEqual(games.map(m=>xp([m],xpPlayers[1].id).xp),[75,75,75,175,175,225,110])
  for(const m of games.filter(m=>m.participants.length===4)) {
    assert.equal(xp([m],xpPlayers[0].id).xp,xp([m],xpPlayers[2].id).xp)
    assert.equal(xp([m],xpPlayers[1].id).xp,xp([m],xpPlayers[3].id).xp)
  }
})
test('todos los 101 umbrales: justo antes, exacto y después; límite sin perder XP',()=>{
  for(let n=1;n<=100;n++){
    const threshold=rules.thresholds[n]
    assert.equal(levelProgression(threshold-1,rules.thresholds).level,n-1)
    assert.equal(levelProgression(threshold,rules.thresholds).level,n)
    assert.equal(levelProgression(threshold+1,rules.thresholds).level,n)
  }
  assert.deepEqual([rules.thresholds[1],rules.thresholds[2],rules.thresholds[3],rules.thresholds[10],rules.thresholds[100]],[100,255,441,2239,50119])
  assert.equal(levelProgression(100000,rules.thresholds).nextThreshold,null)
  assert.equal(levelProgression(100000,rules.thresholds).xp,100000)
})
test('configuración central: curva/recompensas/version/corte válidos y rechazo de errores',()=>{
  validateXpRules(rules)
  for(const bad of [{...rules,win:-1},{...rules,thresholds:[0,100,100]},{...rules,thresholds:[1,2]},{...rules,eligibleFrom:'no'},{...rules,version:0}])assert.throws(()=>validateXpRules(bad))
  assert.throws(()=>levelProgression(Number.MAX_SAFE_INTEGER+1,rules.thresholds))
  assert.equal(rebuildProgression(games,xpPlayers[0].id,{...rules,enabled:false}).xp,0)
  assert.equal(rebuildProgression(games,xpPlayers[0].id,{...rules,eligibleFrom:'2026-10-07T00:00:00Z'}).xp,110)
})
test('recálculo vigente: alta/edición/eliminación sin contadores y renombrado estable',()=>{
  const original=structuredClone(games)
  assert.equal(xp(games).xp,835)
  assert.equal(xp(games.slice(1)).xp,685)
  const changed=games.map((m,i)=>i===0?{...m,white_score:0,blue_score:1,winner_team:'BLUE' as const}:m)
  assert.equal(xp(changed).xp,760)
  assert.equal(xp(games.map(m=>({...m,participants:m.participants.map(p=>({...p,player_name:'Renombrado'}))}))).xp,835)
  assert.deepEqual(games,original)
  assert.equal(xp([...games,...structuredClone(games)]).xp,835)
  assert.throws(()=>xp([games[0],{...games[0],match_type:'RANKED'}]),/mismo partido/)
})
test('prueba, incompletos, ajenos y pendientes no contribuyen',()=>{
  assert.equal(xp([{...games[0],test_mode:true},{...games[0],status:'PLAYING'} as unknown as MatchSummary]).xp,0)
  assert.equal(xp(games,uuid(999)).xp,0)
  assert.throws(()=>xp([{...games[0],participants:[games[0].participants[0],games[0].participants[0]]}]))
})
test('offline, recarga y reintentos simultáneos: historial único',async()=>{
  const stored=new Map<string,string>(), confirmed=new Map<string,typeof docs[number]>()
  let offline=true,calls=0
  const repository={async saveMatch(d:typeof docs[number]){calls++;if(offline)throw Error('offline');confirmed.set(d.match.id,structuredClone(d))},async getMatches(){return []},async getMatchById(){throw Error('unused')}}
  const storage={getItem:(key:string)=>stored.get(key)??null,setItem:(key:string,value:string)=>{stored.set(key,value)}}
  let coordinator=new SaveCoordinator(repository,storage,'xp:queue')
  await coordinator.save(docs[0]);assert.equal(xp([...confirmed.values()].map(d=>({...d.match,participants:d.participants}))).xp,0)
  coordinator=new SaveCoordinator(repository,storage,'xp:queue');assert.equal(coordinator.getPending().length,1)
  offline=false
  await Promise.all([coordinator.save(docs[0]),coordinator.save(docs[0])])
  assert.equal(calls,2);assert.equal(confirmed.size,1);assert.equal(coordinator.getPending().length,0)
  assert.equal(xp([...confirmed.values()].map(d=>({...d.match,participants:d.participants}))).xp,150)
  await coordinator.save(docs[0]);assert.equal(confirmed.size,1)
})
test('SDK oficial: vista privada, snapshot, nombres/niveles y abort; cero escrituras',async()=>{
  const requests:string[]=[]
  const row={id:xpPlayers[0].id,name:'Jugador',nickname:null,photo_url:null,active:false,xp:225,level:1,current_threshold:100,next_threshold:255,max_level:100,confirmed_matches:2,rules_version:1,enabled:true}
  const client=createClient<Database>('https://fixture.invalid','public-test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,init)=>{
    requests.push(String(url));assert.equal(init?.method,'GET')
    return new Response(JSON.stringify(String(url).includes('id=eq.')?row:[row]),{headers:{'Content-Type':'application/json'}})
  }}})
  const repository=new SupabaseProgressionRepository(client)
  assert.equal((await repository.getPlayerProgression(row.id)).xp,225)
  assert.equal((await new SupabasePlayerRepository(client).getPlayers())[0].level,1)
  assert.ok(requests.every(url=>url.includes('/player_progression_v1?')))
  await assert.rejects(()=>repository.getPlayerProgression('invalid'))
  assert.throws(()=>mapProgression({...row,xp:Number.MAX_SAFE_INTEGER+1}))
  assert.throws(()=>mapProgression({...row,next_threshold:200}))
})

test('timeout y confirmación tardía: el pendiente no vuelve a premiar al reintentar',async()=>{
  let acknowledge!:()=>void
  const confirmed=new Map<string,typeof docs[number]>(),stored=new Map<string,string>()
  let first=true
  const repository={async saveMatch(d:typeof docs[number]){
    if(first){first=false;await new Promise<void>(resolve=>{acknowledge=resolve})}
    confirmed.set(d.match.id,structuredClone(d))
  },async getMatches(){return []},async getMatchById(){throw Error('unused')}}
  const storage={getItem:(key:string)=>stored.get(key)??null,setItem:(key:string,v:string)=>{stored.set(key,v)}}
  const coordinator=new SaveCoordinator(repository,storage,'late',5)
  assert.equal(await coordinator.save(docs[0]),'pending')
  acknowledge();await new Promise(resolve=>setTimeout(resolve,0))
  assert.equal(coordinator.getPending().length,1)
  assert.equal(await coordinator.save(docs[0]),'saved')
  assert.equal(xp([...confirmed.values()].map(d=>({...d.match,participants:d.participants}))).xp,150)
})
