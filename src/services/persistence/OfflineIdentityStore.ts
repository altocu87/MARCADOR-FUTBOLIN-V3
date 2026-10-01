import type { Identity } from '../AuthService'
import type { KeyValueStorage } from './SaveCoordinator'

/** Local account selector only. Never a credential or permission to access the API. */
export class OfflineIdentityStore {
  private readonly key: string
  constructor(private readonly storage: KeyValueStorage, namespace: string) { this.key = namespace + ':offline-owner:v1' }
  remember(identity: Identity) { this.storage.setItem(this.key, JSON.stringify({ version: 1, id: identity.id })) }
  forget() { this.storage.setItem(this.key, '') }
  load(): Identity | null {
    const raw = this.storage.getItem(this.key)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || !('version' in value) || value.version !== 1 || !('id' in value) || typeof value.id !== 'string' || !value.id || value.id.length > 128) throw new Error('Identidad local incompatible.')
    return { id: value.id, email: 'IDENTIDAD LOCAL · SESIÓN POR VERIFICAR' }
  }
}
