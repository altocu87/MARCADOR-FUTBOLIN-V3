import assert from 'node:assert/strict'
import { createClient, type AuthChangeEvent, type Session, type SupabaseClient } from '@supabase/supabase-js'
import { SupabaseAuthService } from '../src/services/supabase/auth'
import { authReturnUrl, registrationEmail, authErrorMessage, passwordRecoveryLinkError } from '../src/services/supabase/authFeedback'
import type { Database } from '../src/services/supabase/database.types'

assert.equal(authReturnUrl('https://marker.example/?token=private#access_token=private'), 'https://marker.example/')
assert.equal(authReturnUrl('http://127.0.0.1:5173/settings'), 'http://127.0.0.1:5173/')
assert.equal(authReturnUrl('http://localhost:5173/'), 'http://localhost:5173/')
for (const url of ['http://remote.example/', 'javascript:alert(1)', 'data:text/html,hello', 'invalid']) assert.equal(authReturnUrl(url), undefined)
assert.equal(registrationEmail('  owner@example.com  ', 'test-password'), 'owner@example.com')
for (const email of ['', 'not-an-email', 'a@', 'a b@example.com']) assert.throws(() => registrationEmail(email, 'test-password'))
assert.throws(() => registrationEmail('owner@example.com', 'short'))
assert.match(authErrorMessage({ code: 'email_address_not_authorized' }), /equipo/)
assert.match(authErrorMessage({ code: 'email_not_confirmed' }), /Confirma/)
assert.match(authErrorMessage({ code: 'invalid_credentials' }), /correo y la contraseña/)
assert.match(authErrorMessage({ code: 'over_email_send_rate_limit' }), /Espera/)
assert.ok(!authErrorMessage(new Error('secret-details')).includes('secret-details'))

// Official SDK with an isolated transport: no real accounts, email or database writes.
let calls = 0
let requestBody: { email?: string; password?: string } = {}
let responseCode: string | undefined
const client = createClient<Database>('https://auth-fixture.example', 'fixture-public-key', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: async (_input, init) => {
    calls += 1
    requestBody = JSON.parse(String(init?.body ?? '{}'))
    return responseCode
      ? new Response(JSON.stringify({ code: responseCode, msg: 'fixture error' }), { status: 400, headers: { 'Content-Type': 'application/json', 'X-Supabase-Api-Version': '2024-01-01' } })
      : new Response(JSON.stringify({ id: 'fixture-owner', email: 'owner@example.com', identities: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } },
})
const auth = new SupabaseAuthService(client)
await assert.rejects(auth.signUp('invalid', 'test-password'), /correo válido/)
await assert.rejects(auth.signUp('owner@example.com', 'short'), /ocho/)
assert.equal(calls, 0, 'Reject invalid registration before contacting Auth')
assert.match(await auth.signUp('  owner@example.com  ', 'test-password'), /Solicitud enviada/)
assert.equal(requestBody.email, 'owner@example.com')
assert.equal(requestBody.password, 'test-password')
assert.match(await auth.signUp('owner@example.com', 'test-password'), /no confirma si ya existe/)
const beforeReset = calls
await assert.rejects(auth.requestPasswordReset('invalid'), /correo válido/)
assert.equal(calls, beforeReset)
assert.match(await auth.requestPasswordReset('  owner@example.com  '), /Si existe una cuenta/)
assert.equal(requestBody.email, 'owner@example.com')
assert.equal(requestBody.password, undefined)
await assert.rejects(auth.updatePassword('test-password'), /Solicita y abre/)
responseCode = 'over_email_send_rate_limit'
await assert.rejects(auth.requestPasswordReset('owner@example.com'), /Espera/)
responseCode = 'email_address_not_authorized'
await assert.rejects(auth.signUp('owner@example.com', 'test-password'), /equipo del proyecto/)
responseCode = 'email_not_confirmed'
await assert.rejects(auth.signIn('  owner@example.com  ', 'test-password'), /Confirma tu correo/)
assert.equal(requestBody.email, 'owner@example.com')
assert.equal(await auth.getIdentity(), null)
console.log('Acceso: validación, correo normalizado, retorno sin tokens, SDK aislado y mensajes seguros superados. No valida registro real.')

// Isolated SDK events cover the authenticated recovery gate and reload marker.
let listener: (event: AuthChangeEvent, session: Session | null) => void = () => {}
let session = { user: { id: 'fixture-owner' }, expires_at: Math.floor(Date.now() / 1000) + 3600 } as Session
let updateCalls = 0
let duringSessionRead: (() => void) | undefined
let updateError: { code: string } | null = null
const markerStorage = new Map<string, string>()
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
  getItem: (key: string) => markerStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { markerStorage.set(key, value) },
  removeItem: (key: string) => { markerStorage.delete(key) },
} })
const eventClient = { auth: {
  onAuthStateChange: (callback: typeof listener) => { listener = callback; return { data: { subscription: { unsubscribe() {} } } } },
  getSession: async () => { const snapshot = session; duringSessionRead?.(); return { data: { session: snapshot }, error: null } },
  updateUser: async () => { updateCalls++; return { error: updateError } },
} } as unknown as SupabaseClient<Database>
const recoveryAuth = new SupabaseAuthService(eventClient)
assert.equal(recoveryAuth.getPasswordRecovery(), false)
await assert.rejects(recoveryAuth.updatePassword('test-password'), /Solicita y abre/)
assert.equal(updateCalls, 0)
let recoveryChanges = 0
const unsubscribe = recoveryAuth.subscribePasswordRecovery(() => { recoveryChanges++ })
listener('PASSWORD_RECOVERY', session)
assert.equal(recoveryAuth.getPasswordRecovery(), true)
assert.equal(recoveryChanges, 1)
assert.deepEqual(Object.keys(JSON.parse([...markerStorage.values()][0])).sort(), ['expiresAt', 'owner'], 'Marker contains only user ID and expiry')
const reloadedAuth = new SupabaseAuthService(eventClient)
listener('INITIAL_SESSION', session)
assert.equal(reloadedAuth.getPasswordRecovery(), true, 'Same SDK session restores prompt on reload')
await assert.rejects(reloadedAuth.updatePassword('short'), /ocho/)
assert.equal(updateCalls, 0)
updateError = { code: 'same_password' }
await assert.rejects(reloadedAuth.updatePassword('test-password'), /diferente/)
assert.equal(reloadedAuth.getPasswordRecovery(), true, 'Keep recovery prompt after a rejected password')
updateError = null
await reloadedAuth.updatePassword('new-fixture-password')
assert.equal(updateCalls, 2)
reloadedAuth.finishPasswordRecovery()
assert.equal(reloadedAuth.getPasswordRecovery(), false)
assert.equal(markerStorage.size, 0)
listener('PASSWORD_RECOVERY', session)
session = { ...session, user: { ...session.user, id: 'other-fixture-owner' } }
await assert.rejects(reloadedAuth.updatePassword('new-fixture-password'), /ha cambiado/)
assert.equal(updateCalls, 2, 'No update after the account changed')
listener('PASSWORD_RECOVERY', session)
listener('SIGNED_OUT', null)
assert.equal(reloadedAuth.getPasswordRecovery(), false)
listener('PASSWORD_RECOVERY', session)
duringSessionRead = () => listener('SIGNED_OUT', null)
await assert.rejects(reloadedAuth.updatePassword('new-fixture-password'), /ha cambiado/)
assert.equal(updateCalls, 2, 'Do not update from a stale session read after sign-out')
duringSessionRead = undefined
markerStorage.set('marcador:password-recovery:v1', JSON.stringify({ owner: session.user.id, expiresAt: 1 }))
listener('INITIAL_SESSION', session)
assert.equal(reloadedAuth.getPasswordRecovery(), false)
assert.equal(markerStorage.size, 0, 'Expired marker cannot restore recovery')
markerStorage.set('marcador:password-recovery:v1', JSON.stringify({ owner: 'different-owner', expiresAt: session.expires_at }))
listener('INITIAL_SESSION', session)
assert.equal(reloadedAuth.getPasswordRecovery(), false)
assert.equal(markerStorage.size, 0, 'Other account marker cannot restore recovery')
unsubscribe()
Reflect.deleteProperty(globalThis, 'sessionStorage')
console.log('Recuperación: petición, límites, evento SDK previo al montaje, recarga, contraseña rechazada y cambio de cuenta superados con transporte/eventos aislados. Sin correos reales.')

assert.match(passwordRecoveryLinkError('https://marker.example/#error=access_denied&error_code=otp_expired&error_description=private-details'), /Solicita otro/)
assert.ok(!passwordRecoveryLinkError('https://marker.example/?error=private-details').includes('private-details'))
assert.equal(passwordRecoveryLinkError('https://marker.example/#type=recovery&access_token=fixture'), '')
