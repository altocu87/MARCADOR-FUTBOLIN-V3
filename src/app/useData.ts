import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Identity } from '../services/AuthService'
import type { Player } from '../services/persistence/models'
import type { ApplicationServices } from './services'
import { OfflineIdentityStore } from '../services/persistence/OfflineIdentityStore'
import type { ConnectionState } from '../system/ConnectionMonitor'

export const errorMessage = (error: unknown) => error instanceof Error ? error.message :
  typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'No se pudo conectar. Reintenta cuando vuelva Internet.'

export function useData(services: ApplicationServices | null, connection: ConnectionState) {
  const [user, setUser] = useState<Identity | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [localIdentity, setLocalIdentity] = useState(false)
  const connectionRef = useRef(connection)
  connectionRef.current = connection
  const store = useMemo(() => services ? new OfflineIdentityStore({ getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) }, services.namespace) : null, [services])
  const userId = user?.id ?? null
  const cacheKey = userId && services ? `${services.namespace}:players:v1:${userId}` : null

  useEffect(() => {
    if (!services) return
    let alive = true
    const apply = (identity: Identity | null) => {
      if (!alive) return
      if (!identity && connectionRef.current === 'offline') {
        try { setUser(store?.load() ?? null); setLocalIdentity(true) } catch { setMessage('No se pudo leer la identidad local.') }
        return
      }
      setUser(identity); setLocalIdentity(false)
      try { if (identity) store?.remember(identity); else if (connectionRef.current === 'online') store?.forget() }
      catch { setMessage('Sesión disponible; no se pudo preparar la identidad offline.') }
    }
    const stop = services.auth.subscribe(apply)
    void services.auth.getIdentity().then(apply).catch(error => { if (alive) setMessage(errorMessage(error)) })
    return () => { alive = false; stop() }
  }, [services, store])

  useEffect(() => {
    if (!services) return
    let alive = true
    if (connection === 'offline') {
      if (!user) try { const cached = store?.load(); if (cached) { setUser(cached); setLocalIdentity(true) } } catch { setMessage('No se pudo leer la identidad local.') }
    } else if (connection === 'online') {
      void services.auth.getIdentity().then(identity => {
        if (!alive) return
        setUser(identity); setLocalIdentity(false)
        try { if (identity) store?.remember(identity); else store?.forget() } catch { setMessage('No se pudo actualizar la identidad offline.') }
      }).catch(error => { if (alive) setMessage(errorMessage(error)) })
    }
    return () => { alive = false }
    // Recheck once per reachability transition, not on every user render.
  }, [services, store, connection])

  const refresh = useCallback(async () => {
    if (!services || !cacheKey || !userId) return
    if (connection !== 'online' || localIdentity) { setMessage('SIN CONEXIÓN · Se utiliza la lista local. La gestión requiere una sesión verificada.'); return }
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
  }, [services, cacheKey, userId, connection, localIdentity])

  useEffect(() => {
    setPlayers([])
    if (!cacheKey) return
    try {
      const cached: unknown = JSON.parse(localStorage.getItem(cacheKey) ?? '[]')
      if (Array.isArray(cached)) setPlayers(cached.filter((p): p is Player => typeof p === 'object' && p !== null && 'id' in p && 'name' in p && 'active' in p))
    } catch { setMessage('No se pudo leer la lista local de jugadores.') }
    void refresh()
  }, [cacheKey, refresh])
  function signedOut() {
    try { store?.forget() } catch { setMessage('No se pudo limpiar la identidad local; no borres resultados pendientes.') }
    setUser(null); setLocalIdentity(false)
  }
  return { user, players, message, loading, refresh, localIdentity, signedOut }
}
