import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from './database.types'
import type { AuthService, Identity } from '../AuthService'
import { AuthActionError, authErrorMessage, authReturnUrl, registrationEmail, validatedEmail, validatedDisplayName, validatePassword } from './authFeedback'

const identity = (user: User | null): Identity | null => user ? {
  id: user.id, email: user.email ?? '',
  displayName: typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '',
  emailVerified: Boolean(user.email_confirmed_at), pendingEmail: user.new_email,
} : null
export class SupabaseAuthService implements AuthService {
  private observedOwner: string | null | undefined
  private recoveryOwner: string | null = null
  private readonly recoveryListeners = new Set<() => void>()
  private readonly recoveryKey = 'marcador:password-recovery:v1'
  constructor(private readonly client: SupabaseClient<Database>) {
    // Capture the SDK event before React mounts. Never trust URL tokens ourselves.
    this.client.auth.onAuthStateChange((event, session) => {
      this.observedOwner = session?.user.id ?? null
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        this.setRecoveryOwner(session.user.id)
        try { sessionStorage.setItem(this.recoveryKey, JSON.stringify({ owner: session.user.id, expiresAt: session.expires_at })) } catch { /* Memory still works. No tokens stored here. */ }
      } else if (event === 'INITIAL_SESSION' && session?.user) {
        // A reload may consume the link already: restore only for the same SDK session.
        try {
          const marker = JSON.parse(sessionStorage.getItem(this.recoveryKey) ?? 'null')
          if (marker?.owner === session.user.id && Number.isFinite(marker.expiresAt) && marker.expiresAt * 1000 > Date.now()) this.setRecoveryOwner(session.user.id)
          else sessionStorage.removeItem(this.recoveryKey)
        } catch { /* Storage unavailable or corrupt. Request a new link if needed. */ }
      } else if (event === 'SIGNED_OUT' || this.recoveryOwner && session?.user.id !== this.recoveryOwner) this.finishPasswordRecovery()
    })
  }
  private setRecoveryOwner(owner: string | null) {
    if (owner === this.recoveryOwner) return
    this.recoveryOwner = owner
    for (const listener of this.recoveryListeners) listener()
  }
  getPasswordRecovery = () => this.recoveryOwner !== null
  subscribePasswordRecovery = (listener: () => void) => {
    this.recoveryListeners.add(listener)
    return () => { this.recoveryListeners.delete(listener) }
  }
  finishPasswordRecovery() {
    try { sessionStorage.removeItem(this.recoveryKey) } catch { /* Memory still works. */ }
    this.setRecoveryOwner(null)
  }
  async requestPasswordReset(email: string) {
    const normalized = validatedEmail(email)
    const redirectTo = typeof window === 'undefined' ? undefined : authReturnUrl(window.location.href)
    const { error } = await this.client.auth.resetPasswordForEmail(normalized, { redirectTo })
    if (error) throw new Error(authErrorMessage(error), { cause: error })
    return 'Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña. Revisa también spam y utiliza el enlace más reciente.'
  }
  async updatePassword(password: string) {
    validatePassword(password)
    const owner = this.recoveryOwner
    if (!owner) throw new Error('Solicita y abre un enlace desde RECUPERAR CONTRASEÑA.')
    const { data, error: sessionError } = await this.client.auth.getSession()
    if (sessionError || this.recoveryOwner !== owner || data.session?.user.id !== owner) {
      this.finishPasswordRecovery()
      throw new Error('La sesión de recuperación ha cambiado. Solicita otro enlace.')
    }
    const { error } = await this.client.auth.updateUser({ password })
    if (error) throw new Error(authErrorMessage(error), { cause: error })
  }
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
  async signUp(email: string, password: string, displayName?: string) {
    const normalized = registrationEmail(email, password)
    const emailRedirectTo = typeof window === 'undefined' ? undefined : authReturnUrl(window.location.href)
    const profile = displayName === undefined ? undefined : { display_name: validatedDisplayName(displayName) }
    const { data, error } = await this.client.auth.signUp({ email: normalized, password, options: { emailRedirectTo, data: profile } })
    if (error) throw new Error(authErrorMessage(error), { cause: error })
    return data.session ? 'Sesión iniciada.' : 'Solicitud enviada. Si el correo es nuevo, revisa tu correo y spam para confirmar. Por privacidad, esta respuesta no confirma si ya existe una cuenta. Si ya te registraste, utiliza ENTRAR o RECUPERAR CONTRASEÑA.'
  }
  async resendConfirmation(email: string) {
    const normalized = validatedEmail(email)
    const emailRedirectTo = typeof window === 'undefined' ? undefined : authReturnUrl(window.location.href)
    const { error } = await this.client.auth.resend({ type: 'signup', email: normalized, options: { emailRedirectTo } })
    if (error) throw new AuthActionError(error)
    return 'Si tu cuenta necesita confirmación, recibirás un nuevo correo. Revisa spam y utiliza el enlace más reciente.'
  }
  private async verifiedOwner(ownerId: string) {
    const { data, error } = await this.client.auth.getUser()
    if (error || !data.user || data.user.id !== ownerId) throw new Error('La sesión ha cambiado. Vuelve a iniciar sesión con tu cuenta.')
    return data.user
  }
  private async assertCurrentOwner(ownerId: string) {
    if ((await this.getIdentity())?.id !== ownerId || this.observedOwner !== undefined && this.observedOwner !== ownerId) throw new Error('La sesión ha cambiado. No se ha enviado el cambio de cuenta.')
  }
  private async verifyPassword(currentPassword: string, ownerId: string) {
    if (!currentPassword) throw new Error('Introduce tu contraseña actual.')
    const user = await this.verifiedOwner(ownerId)
    if (!user.email) throw new Error('Utiliza la recuperación por correo para gestionar el acceso.')
    await this.assertCurrentOwner(ownerId)
    const { data, error } = await this.client.auth.signInWithPassword({ email: user.email, password: currentPassword })
    if (error) throw new AuthActionError(error)
    if (data.user?.id !== ownerId) throw new Error('La sesión ha cambiado. No se ha enviado el cambio de cuenta.')
    await this.assertCurrentOwner(ownerId)
  }
  async updateProfile(displayName: string, ownerId: string) {
    const name = validatedDisplayName(displayName)
    await this.verifiedOwner(ownerId); await this.assertCurrentOwner(ownerId)
    const { error } = await this.client.auth.updateUser({ data: { display_name: name } })
    if (error) throw new AuthActionError(error)
  }
  async changeEmail(email: string, currentPassword: string, ownerId: string) {
    const normalized = validatedEmail(email)
    const current = await this.verifiedOwner(ownerId)
    if (current.email?.toLowerCase() === normalized.toLowerCase()) throw new Error('Introduce un correo diferente del actual.')
    await this.verifyPassword(currentPassword, ownerId)
    const emailRedirectTo = typeof window === 'undefined' ? undefined : authReturnUrl(window.location.href)
    const { error } = await this.client.auth.updateUser({ email: normalized }, { emailRedirectTo })
    if (error) throw new AuthActionError(error)
    return 'Cambio solicitado. Confirma los enlaces enviados a tu correo actual y al nuevo según la configuración de seguridad. Tu cuenta y tus datos se mantienen.'
  }
  async changePassword(currentPassword: string, password: string, ownerId: string, nonce?: string) {
    validatePassword(password)
    if (password === currentPassword) throw new Error('Elige una contraseña diferente de la anterior.')
    await this.verifyPassword(currentPassword, ownerId)
    const { error } = await this.client.auth.updateUser({ password, current_password: currentPassword, ...(nonce ? { nonce } : {}) })
    if (error) throw new AuthActionError(error)
  }
  async reauthenticate(ownerId: string) {
    await this.verifiedOwner(ownerId); await this.assertCurrentOwner(ownerId)
    const { error } = await this.client.auth.reauthenticate()
    if (error) throw new AuthActionError(error)
  }
  async signOut(scope: 'local' | 'global' = 'local', ownerId?: string) {
    if (ownerId) { await this.verifiedOwner(ownerId); await this.assertCurrentOwner(ownerId) }
    const { error } = await this.client.auth.signOut({ scope })
    if (error) throw new AuthActionError(error)
  }
}
