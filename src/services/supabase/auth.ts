import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { AuthService, Identity } from '../AuthService'

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
    const { error } = await this.client.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({ email, password })
    if (error) throw error
    return data.session ? 'Sesión iniciada.' : 'Revisa tu correo y confirma la cuenta. Después inicia sesión aquí.'
  }
  async signOut() { const { error } = await this.client.auth.signOut(); if (error) throw error }
}
