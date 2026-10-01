import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { SupabaseAuthService } from '../src/services/supabase/auth'
import { authReturnUrl, registrationEmail, authErrorMessage } from '../src/services/supabase/authFeedback'
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
responseCode = 'email_address_not_authorized'
await assert.rejects(auth.signUp('owner@example.com', 'test-password'), /equipo del proyecto/)
responseCode = 'email_not_confirmed'
await assert.rejects(auth.signIn('  owner@example.com  ', 'test-password'), /Confirma tu correo/)
assert.equal(requestBody.email, 'owner@example.com')
assert.equal(await auth.getIdentity(), null)
console.log('Acceso: validación, correo normalizado, retorno sin tokens, SDK aislado y mensajes seguros superados. No valida registro real.')
