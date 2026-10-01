import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { ConnectionMonitor, probeConnection } from './ConnectionMonitor'

export function useConnection() {
  const monitor = useMemo(() => new ConnectionMonitor(probeConnection), [])
  const state = useSyncExternalStore(monitor.subscribe, monitor.getSnapshot, monitor.getSnapshot)
  useEffect(() => {
    const check = () => { if (navigator.onLine === false) monitor.disconnected(); else void monitor.check() }
    const visible = () => { if (document.visibilityState === 'visible') check() }
    const timer = window.setInterval(visible, 30_000)
    window.addEventListener('online', check); window.addEventListener('offline', check)
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', visible)
    check()
    return () => {
      window.clearInterval(timer); window.removeEventListener('online', check); window.removeEventListener('offline', check)
      window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', visible)
    }
  }, [monitor])
  return { state, monitor }
}
