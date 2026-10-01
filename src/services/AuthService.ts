export interface Identity { id: string; email: string }
export interface AuthService {
  getIdentity(): Promise<Identity | null>
  subscribe(listener: (identity: Identity | null) => void): () => void
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<string>
  requestPasswordReset(email: string): Promise<string>
  getPasswordRecovery(): boolean
  subscribePasswordRecovery(listener: () => void): () => void
  updatePassword(password: string): Promise<void>
  finishPasswordRecovery(): void
  signOut(): Promise<void>
}
