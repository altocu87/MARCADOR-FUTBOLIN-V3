import { useEffect, useState } from 'react'
import type { HonoursRepository, HonoursSnapshot } from './model'
import { errorMessage } from '../app/useData'

export function useHonours(repository: HonoursRepository | null, accountId: string | null, online: boolean, revision: string) {
  const key = `${accountId}:${revision}`
  const [state, setState] = useState<{ key: string; repository: HonoursRepository; snapshot: HonoursSnapshot | null; error: string } | null>(null)
  useEffect(() => {
    setState(null)
    if (!repository || !accountId || !online) return
    const controller = new AbortController()
    void repository.getSnapshot(accountId, controller.signal).then(snapshot => {
      if (snapshot.accountId !== accountId || snapshot.complete !== true) throw new Error('Cuenta o historial incompatible.')
      if (!controller.signal.aborted) setState({ key, repository, snapshot, error: '' })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ key, repository, snapshot: null, error: errorMessage(error) })
    })
    return () => controller.abort()
  }, [repository, accountId, online, key])
  const current = online && state?.key === key && state.repository === repository ? state : null
  return { snapshot: current?.snapshot ?? null, error: current?.error ?? '',
    status: !accountId ? 'Inicia sesión para consultar tus honores privados.' : !online ? 'Sin conexión. Conecta para verificar logros y récords.' : !repository ? 'Honores no disponibles.' : current?.error ? `No se pudieron verificar los honores: ${current.error}` : 'Consultando honores confirmados…' }
}
