import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/services/supabase/database.types'
import { mapCompetitivePlayer, SupabaseCompetitionRepository } from '../src/services/supabase/competition'
import { SaveCoordinator } from '../src/services/persistence/SaveCoordinator'
import { rebuildCompetition } from '../src/competition/elo'
import { eloFixture, eloPlayers, testEloRules } from './eloFixtures'
type Row = Database['public']['Functions']['get_ranking_v1']['Returns'][number]
const row = { player_id: eloPlayers[0].id, name: 'Nombre', nickname: null, active: false,
  elo: 1220, max_elo: 1220, classified_matches: 1, category: 'ORO', ranking_position: 1, enabled: true, rules_version: 1 } as Row
function repository(value: unknown, status = 200, capture?: (url: string, init?: RequestInit) => void) {
  const client = createClient<Database>('https://fixture.invalid','public-test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch: async(url,init)=>{
    capture?.(String(url),init)
    return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}})
  }}})
  return new SupabaseCompetitionRepository(client)
}
test('SDK reads one server snapshot, no parameters or protected writes; more than row cap', async()=>{
  const rows = Array.from({length:1201},(_,i)=>({...row,player_id:`ee030099-0000-4000-8000-${String(i+1).padStart(12,'0')}`}))
  let calls=0
  const value = await repository(rows,200,(url,init)=>{
    calls++;assert.ok(url.endsWith('/rpc/get_competition_snapshot_v1'));assert.equal(init?.method,'POST');assert.equal(init?.body,'{}')
  }).getRanking()
  assert.equal(calls,1);assert.equal(value.length,1201);assert.equal(value[0].elo,1220)
})
test('Invalid/server/offline data never become initial ELO or partial rankings', async()=>{
  for (const value of [null,{},[{...row,name:42}],[{...row,nickname:{}}],[row,{...row,max_elo:1100}],[row,row],[row,{...row,player_id:eloPlayers[1].id,rules_version:2}]]) await assert.rejects(()=>repository(value).getRanking())
  await assert.rejects(()=>repository({message:'RLS denied'},403).getRanking())
  assert.throws(()=>mapCompetitivePlayer({...row,elo:Number.MAX_SAFE_INTEGER+1}))
  assert.throws(()=>mapCompetitivePlayer({...row,category:'inventada'}))
  const off={...row,elo:1200,max_elo:1200,category:null,classified_matches:0,ranking_position:null,enabled:false} as unknown as Row
  assert.equal(mapCompetitivePlayer(off).category,null)
  assert.throws(()=>mapCompetitivePlayer({...off,elo:1220}))
})
test('Abort remains an error; leaving account/profile cannot silently show data', async()=>{
  const controller=new AbortController();controller.abort()
  const client=createClient<Database>('https://fixture.invalid','public-test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(_url,init)=>{init?.signal?.throwIfAborted();throw new Error('Unexpected network')}}})
  await assert.rejects(()=>new SupabaseCompetitionRepository(client).getRanking(controller.signal))
})
test('Offline, reload, simultaneous retries and delayed ack grant exactly one confirmed adjustment',async()=>{
  const doc=eloFixture(0),confirmed=new Map<string,typeof doc>(),stored=new Map<string,string>()
  const snapshot=()=>rebuildCompetition(eloPlayers,[...confirmed.values()].map(d=>({...d.match,participants:d.participants})),testEloRules)
  let offline=true,calls=0,delay=false,ack: (()=>void)|null=null
  const remote={async saveMatch(value:typeof doc){calls++;if(offline)throw Error('offline');confirmed.set(value.match.id,structuredClone(value));if(delay)await new Promise<void>(resolve=>{ack=resolve})},async getMatches(){return []},async getMatchById(){throw Error('unused')}}
  const storage={getItem:(key:string)=>stored.get(key)??null,setItem:(key:string,value:string)=>{stored.set(key,value)}}
  let queue=new SaveCoordinator(remote,storage,'elo:queue',20)
  assert.equal(await queue.save(doc),'pending');assert.equal(snapshot().adjustments.length,0)
  queue=new SaveCoordinator(remote,storage,'elo:queue',20);assert.equal(queue.getPending().length,1)
  offline=false
  await Promise.all([queue.save(doc),queue.save(doc)])
  assert.equal(calls,2);assert.equal(snapshot().adjustments.length,2);assert.equal(queue.getPending().length,0)
  delay=true
  assert.equal(await queue.save(doc),'pending');assert.equal(snapshot().adjustments.length,2)
  const acknowledge=ack as unknown as ()=>void;acknowledge();await new Promise(resolve=>setTimeout(resolve,0))
  delay=false;await queue.retry();assert.equal(snapshot().adjustments.length,2)
})
