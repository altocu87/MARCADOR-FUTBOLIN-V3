export interface Identity { id: string; email: string; displayName?: string; emailVerified?: boolean; pendingEmail?: string }
export interface AuthService {
  getIdentity(): Promise<Identity | null>
  subscribe(listener: (identity: Identity | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string, displayName?: string): Promise<string>
  resendConfirmation(email: string): Promise<string>
  updateProfile(displayName: string, ownerId: string): Promise<void>
  changeEmail(email: string, currentPassword: string, ownerId: string): Promise<string>
  changePassword(currentPassword: string, password: string, ownerId: string, nonce?: string): Promise<void>
  reauthenticate(ownerId: string): Promise<void>
  requestPasswordReset(email: string): Promise<string>
  getPasswordRecovery(): boolean
  subscribePasswordRecovery(listener: () => void): () => void
  updatePassword(password: string): Promise<void>
  finishPasswordRecovery(): void
  signOut(scope?: 'local' | 'global', ownerId?: string): Promise<void>
}
