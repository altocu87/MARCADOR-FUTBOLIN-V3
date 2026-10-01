import { useCallback, useEffect, useRef, useState } from 'react'
import type { SaveCoordinator } from '../services/persistence/SaveCoordinator'
import type { MatchDocument } from '../services/persistence/models'
import { errorMessage } from './useData'

export function usePendingQueue(coordinator: SaveCoordinator | null, online: boolean, suspend: boolean) {
  const [documents, setDocuments] = useState<MatchDocument[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)
  const running = useRef<SaveCoordinator | null>(null)
  const current = useRef(coordinator); current.current = coordinator
  useEffect(() => {
    let alive = true
    const read = (savedId?: unknown) => {
      if (!alive) return
      if (typeof savedId === 'string') setLastSavedId(savedId)
      try { setDocuments(coordinator?.getPending() ?? []); setMessage('') } catch (error) { setMessage(errorMessage(error)) }
    }
    const stop = coordinator?.subscribe(read)
    setBusy(false); setLastSavedId(null); read(); window.addEventListener('storage', read)
    return () => { alive = false; stop?.(); window.removeEventListener('storage', read) }
  }, [coordinator])
  const retry = useCallback(async () => {
    if (!coordinator || running.current === coordinator) return
    if (!online) { setMessage('SIN CONEXIÓN O SESIÓN POR VERIFICAR · Los resultados siguen en este dispositivo.'); return }
    running.current = coordinator; setBusy(true)
    try {
      const results = await coordinator.retry()
      if (current.current === coordinator) {
        setDocuments(coordinator.getPending())
        setMessage(results.includes('pending') ? 'Quedan pendientes. Revisa conexión y sesión; puedes reintentar.' : 'SINCRONIZACIÓN COMPLETADA')
      }
    } catch (error) { if (current.current === coordinator) setMessage(errorMessage(error)) }
    finally { if (running.current === coordinator) running.current = null; if (current.current === coordinator) setBusy(false) }
  }, [coordinator, online])
  const signature = documents.map(document => document.match.id).sort().join(',')
  useEffect(() => {
    if (online && !suspend && signature) void retry()
    // Failures do not alter IDs: no unbounded retry loop. Next reconnect/manual retry tries again.
  }, [online, suspend, signature, retry])
  return { documents, message, busy, retry, lastSavedId }
}
