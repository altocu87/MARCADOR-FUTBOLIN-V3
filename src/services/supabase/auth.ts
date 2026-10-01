import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { AuthService, Identity } from '../AuthService'
import { authErrorMessage, authReturnUrl, registrationEmail } from './authFeedback'

const identity = (user: User | null): Identity | null => user ? { id: user.id, email: user.email ?? '' } : null
export class SupabaseAuthService implements AuthService {
  constructor(private readonly client: SupabaseClient<Database>) {}
  async getIdentity() {
    const { data, error } = await this.client.auth.getSession()
    if (error) throw error
    return identity(data.session?.user ?? null)
  }
  subscribe(listener: (user: Identity | null) => void) {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => listener(identity(session?.user ?? null)))
    return () => data.subscription.unsubscribe()
  }
  async signIn(email: string, password: string) {
    const { error } = await this.client.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(authErrorMessage(error), { cause: error })
  }
  async signUp(email: string, password: string) {
    const normalized = registrationEmail(email, password)
    const emailRedirectTo = typeof window === 'undefined' ? undefined : authReturnUrl(window.location.href)
    const { data, error } = await this.client.auth.signUp({ email: normalized, password, options: { emailRedirectTo } })
    if (error) throw new Error(authErrorMessage(error), { cause: error })
    return data.session ? 'Sesión iniciada.' : 'Solicitud enviada. Revisa tu correo y spam para confirmar. Si ya tienes una cuenta, utiliza ENTRAR.'
  }
  async signOut() { const { error } = await this.client.auth.signOut(); if (error) throw error }
}
