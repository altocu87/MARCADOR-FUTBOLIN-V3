/** Development-only fixture. No authentication or data requests to Supabase.
 * Open /tests/ui-fixture.html under Vite. Not an input to the production build.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '../src/app/App'
import type { ApplicationServices } from '../src/app/services'
import type { MatchDocument, Player } from '../src/services/persistence/models'
import '../src/styles/global.css'

let players: Player[] = ['BLANCO UNO', 'AZUL UNO', 'BLANCO DOS', 'AZUL DOS'].map((name, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`, name, nickname: null, photoUrl: null, active: true, level: 0,
}))
const matches = new Map<string, MatchDocument>()
// Reproducible network failures without changing browser settings or Supabase.
// ?save=offline rejects; ?save=hang never acknowledges; default succeeds.
const saveMode = new URLSearchParams(window.location.search).get('save')
const realNetwork = new URLSearchParams(window.location.search).get('network') === 'real'
async function requireNetwork() {
  if (!realNetwork) return
  const response = await fetch('/connection.json', { cache: 'no-store', signal: AbortSignal.timeout(2_000) })
  if (!response.ok) throw new Error('Red de fixture no disponible')
}
const services: ApplicationServices = {
  namespace: 'marcador-ui-fixture',
  auth: {
    async getIdentity() { await requireNetwork(); return { id: 'fixture', email: 'PRUEBA UI LOCAL · SIN SUPABASE' } },
    subscribe() { return () => {} }, async signIn() {}, async signUp() { return 'Prueba local' }, async signOut() {},
  },
  players: {
    async getPlayers() { await requireNetwork(); return players.map(p => ({ ...p })) },
    async createPlayer(draft) { players.push({ id: crypto.randomUUID(), name: draft.name.trim(), nickname: draft.nickname || null, photoUrl: draft.photoUrl || null, active: true, level: 0 }) },
    async updatePlayer(id, draft) { players = players.map(p => p.id === id ? { ...p, name: draft.name, nickname: draft.nickname || null, photoUrl: draft.photoUrl || null } : p) },
    async setActive(id, active) { players = players.map(p => p.id === id ? { ...p, active } : p) },
    async deleteUnusedPlayer(id) {
      if ([...matches.values()].some(m => m.participants.some(p => p.player_id === id))) throw new Error('Tiene historial. Desactívalo.')
      players = players.filter(p => p.id !== id)
    },
  },
  matches: {
    async saveMatch(document) {
      await requireNetwork()
      if (saveMode === 'offline') throw new Error('Sin conexión · simulación local')
      if (saveMode === 'hang') await new Promise<void>(() => {})
      matches.set(document.match.id, structuredClone(document))
    },
    async getMatches(offset = 0) { return [...matches.values()].reverse().slice(offset, offset + 20).map(doc => ({ ...doc.match, participants: doc.participants })) },
    async getMatchById(id) { const doc = matches.get(id); if (!doc) throw new Error('No encontrado'); return structuredClone(doc) },
  },
}
createRoot(document.getElementById('root')!).render(<StrictMode><App services={services} /></StrictMode>)
