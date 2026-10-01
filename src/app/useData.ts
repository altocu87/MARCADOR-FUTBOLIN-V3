import { useCallback, useEffect, useState } from 'react'
import type { Identity } from '../services/AuthService'
import type { Player } from '../services/persistence/models'
import type { ApplicationServices } from './services'

export const errorMessage = (error: unknown) => error instanceof Error ? error.message :
  typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'No se pudo conectar. Reintenta cuando vuelva Internet.'

export function useData(services: ApplicationServices | null) {
  const [user, setUser] = useState<Identity | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const userId = user?.id ?? null
  const cacheKey = userId && services ? `${services.namespace}:players:v1:${userId}` : null

  useEffect(() => {
    if (!services) return
    let alive = true
    const stop = services.auth.subscribe(identity => { if (alive) setUser(identity) })
    void services.auth.getIdentity().then(identity => { if (alive) setUser(identity) }).catch(error => { if (alive) setMessage(errorMessage(error)) })
    return () => { alive = false; stop() }
  }, [services])

  const refresh = useCallback(async () => {
    if (!services || !cacheKey || !userId) return
    setLoading(true)
    try {
      const list = await services.players.getPlayers()
      const currentUser = await services.auth.getIdentity()
      if (currentUser?.id !== userId) return
      setPlayers(list)
      setMessage('')
      try { localStorage.setItem(cacheKey, JSON.stringify(list)) } catch { setMessage('Jugadores cargados. No se pudo conservar una copia offline.') }
    } catch (error) { setMessage(`${errorMessage(error)} · Se conserva la lista local.`) }
    finally { setLoading(false) }
  }, [services, cacheKey, userId])

  useEffect(() => {
    setPlayers([])
    if (!cacheKey) return
    try {
      const cached: unknown = JSON.parse(localStorage.getItem(cacheKey) ?? '[]')
      if (Array.isArray(cached)) setPlayers(cached.filter((p): p is Player => typeof p === 'object' && p !== null && 'id' in p && 'name' in p && 'active' in p))
    } catch { setMessage('No se pudo leer la lista local de jugadores.') }
    void refresh()
  }, [cacheKey, refresh])
  return { user, players, message, loading, refresh }
}
