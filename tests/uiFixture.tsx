/** Development-only fixture. No authentication or data requests to Supabase.
 * Open /tests/ui-fixture.html under Vite. Not an input to the production build.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthActionError } from '../src/services/supabase/authFeedback'
import { App } from '../src/app/App'
import type { ApplicationServices } from '../src/app/services'
import type { MatchDocument, Player } from '../src/services/persistence/models'
import { MatchEngine } from '../src/match-engine/MatchEngine'
import { mapMatch } from '../src/services/persistence/mapMatch'
import '../src/styles/global.css'

let players: Player[] = ['BLANCO UNO', 'AZUL UNO', 'BLANCO DOS', 'AZUL DOS'].map((name, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`, name, nickname: null, photoUrl: null, active: true, level: 0,
}))
const matches = new Map<string, MatchDocument>()
// Read-only copies let browser regressions check that rendering never rewrites results.
Object.defineProperty(window, 'fixtureSavedDocuments', { get: () => structuredClone([...matches.values()]) })
// Reproducible network failures without changing browser settings or Supabase.
// ?save=offline rejects; ?save=hang never acknowledges; default succeeds.
const saveMode = new URLSearchParams(window.location.search).get('save')
const realNetwork = new URLSearchParams(window.location.search).get('network') === 'real'
const statisticsMode = new URLSearchParams(window.location.search).get('statistics')
const guest = new URLSearchParams(window.location.search).get('auth') === 'guest'
// Counts only; never expose or retain the entered email/password.
let passwordRecovery = new URLSearchParams(window.location.search).get('auth') === 'recovery'
const recoveryListeners = new Set<() => void>()
const recoveryCalls = { request: 0, update: 0 }
Object.defineProperty(window, 'fixtureRecoveryCalls', { value: recoveryCalls })
const authCalls = { login: 0, register: 0 }
Object.defineProperty(window, 'fixtureAuthCalls', { value: authCalls })
// Built, isolated profile/pagination fixtures. No database writes.
if (statisticsMode === 'seed' || statisticsMode === 'analysis') {
  const analysis = statisticsMode === 'analysis'
  for (let i = 0; i < (analysis ? 12 : 25); i++) {
    let now = Date.UTC(2026, 9, 1) + i * (analysis ? 86_400_000 : 180_000)
    const extra = analysis ? i % 3 !== 0 : i >= 23
    const engine = new MatchEngine(() => now)
    engine.createMatch({ mode: analysis ? (['QUICK', 'CHAOS', 'RANKED'] as const)[i % 3] : 'QUICK', victoryCondition: 'TIME', goalLimit: 1, halfDurationMinutes: 1 })
    engine.skipCountdown(); engine.dispatch('GOL_BLANCO'); engine.dispatch('FINALIZAR_PARTE'); engine.continueToNextPeriod(); engine.skipCountdown()
    now += 3_000
    engine.dispatch(extra ? 'GOL_AZUL' : 'GOL_BLANCO'); engine.dispatch('FINALIZAR_PARTE'); engine.continueToNextPeriod()
    if (extra) {
      engine.skipCountdown()
      if (analysis ? i % 3 === 1 : i === 23) { now += 3_000; engine.dispatch('GOL_AZUL') }
      else {
        now += 60_000; engine.tick(); engine.continueToNextPeriod()
        for (let kick = 0; kick < 3; kick++) { engine.dispatch('PENALTI_BLANCO_FALLO'); engine.dispatch('PENALTI_AZUL_GOL') }
      }
    }
    const id = `00000000-0000-4000-8000-${String(100 + i).padStart(12, '0')}`
    matches.set(id, mapMatch(engine.getState(), analysis && i % 2 === 0 ? players.slice(0, 2) : players, id, false))
  }
  players[3].active = false
  players.push({ ...players[0], id: '00000000-0000-4000-8000-000000000005', name: 'SIN PARTIDOS' })
}
async function requireNetwork() {
  if (!realNetwork) return
  const response = await fetch('/connection.json', { cache: 'no-store', signal: AbortSignal.timeout(2_000) })
  if (!response.ok) throw new Error('Red de fixture no disponible')
}
let fixtureIdentity = guest ? null : { id: 'fixture', email: 'operator@example.invalid', displayName: 'OPERADOR UI LOCAL', emailVerified: true, pendingEmail: '' }
const identityListeners = new Set<(user: typeof fixtureIdentity) => void>()
const accountCalls = { profile: 0, email: 0, password: 0, resend: 0, reauthenticate: 0, logout: [] as string[] }
Object.defineProperty(window, 'fixtureAccountCalls', { value: accountCalls })
const services: ApplicationServices = {
  namespace: 'marcador-ui-fixture',
  auth: {
    async getIdentity() { await requireNetwork(); return fixtureIdentity },
    getPasswordRecovery: () => passwordRecovery,
    subscribePasswordRecovery(listener) { recoveryListeners.add(listener); return () => { recoveryListeners.delete(listener) } },
    async requestPasswordReset() { recoveryCalls.request += 1; return 'Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.' },
    async updatePassword() { if (!passwordRecovery) throw new Error('Enlace necesario'); recoveryCalls.update += 1 },
    finishPasswordRecovery() { passwordRecovery = false; for (const listener of recoveryListeners) listener() },
    subscribe(listener) { identityListeners.add(listener); return () => { identityListeners.delete(listener) } }, async signIn() { authCalls.login += 1 }, async signUp() { authCalls.register += 1; return 'Prueba local' }, async signOut(scope = 'local') { accountCalls.logout.push(scope); fixtureIdentity = null; for (const listener of identityListeners) listener(null) },
    async resendConfirmation() { accountCalls.resend++; return 'Si tu cuenta necesita confirmación, recibirás un nuevo correo.' },
    async updateProfile(displayName, ownerId) { if (fixtureIdentity?.id !== ownerId) throw new Error('Cuenta distinta'); accountCalls.profile++; fixtureIdentity = { ...fixtureIdentity, displayName }; for (const listener of identityListeners) listener(fixtureIdentity) },
    async changeEmail(email, _password, ownerId) { if (fixtureIdentity?.id !== ownerId) throw new Error('Cuenta distinta'); accountCalls.email++; fixtureIdentity = { ...fixtureIdentity, pendingEmail: email }; for (const listener of identityListeners) listener(fixtureIdentity); return 'Cambio solicitado. Confirma los enlaces enviados a tu correo actual y al nuevo según la configuración de seguridad. Tu cuenta y tus datos se mantienen.' },
    async changePassword(_current, _next, _owner, nonce) { if (new URLSearchParams(window.location.search).get('account') === 'reauth' && nonce !== '123456') throw new AuthActionError({ code: nonce ? 'reauthentication_not_valid' : 'reauthentication_needed' }); accountCalls.password++ }, async reauthenticate() { accountCalls.reauthenticate++ },
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
    async getMatches(offset = 0, query = {}) {
      await requireNetwork()
      query.signal?.throwIfAborted()
      if (statisticsMode === 'error' && query.playerId) throw new Error('Error de consulta simulado · No se han cargado estadísticas')
      return [...matches.values()].map(doc => ({ ...doc.match, participants: doc.participants }))
        .filter(m => !m.test_mode && (!query.playerId || m.participants.some(p => p.player_id === query.playerId)))
        .filter(m => !query.before || m.finished_at < query.before.finishedAt || m.finished_at === query.before.finishedAt && m.id < query.before.id)
        .sort((a, b) => b.finished_at.localeCompare(a.finished_at) || b.id.localeCompare(a.id)).slice(offset, offset + 20)
    },
    async getMatchById(id) { const doc = matches.get(id); if (!doc) throw new Error('No encontrado'); return structuredClone(doc) },
  },
}
createRoot(document.getElementById('root')!).render(<StrictMode><App services={services} /></StrictMode>)
