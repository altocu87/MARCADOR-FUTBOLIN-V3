import { useEffect, useRef, useState } from 'react'

interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
export function useOfflineApp() {
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState(import.meta.env.PROD ? 'Preparando carga offline…' : 'Offline se activa en el build, no en desarrollo.')
  const [installable, setInstallable] = useState(false)
  const prompt = useRef<InstallPrompt | null>(null)
  useEffect(() => {
    let alive = true
    let registration: ServiceWorkerRegistration | undefined
    const channels = new Map<MessageChannel, ReturnType<typeof setTimeout>>()
    const workers = new Map<ServiceWorker, () => void>()
    const report = () => {
      if (!alive || !registration) return
      if (registration.waiting) setMessage('Actualización pendiente. Cierra la app al terminar el partido.')
      const worker = registration.active
      if (!worker) return
      const channel = new MessageChannel()
      const timer = setTimeout(() => { channel.port1.close(); channels.delete(channel) }, 3_000)
      channels.set(channel, timer)
      channel.port1.onmessage = event => {
        clearTimeout(timer); channel.port1.close(); channels.delete(channel)
        if (!alive || event.data?.type !== 'OFFLINE_STATUS') return
        setReady(event.data.ready === true)
        if (!registration?.waiting) setMessage(event.data.ready ? 'OFFLINE DISPONIBLE EN ESTE DISPOSITIVO' : 'Copia offline incompleta. Abre con conexión.')
      }
      worker.postMessage({ type: 'CHECK_OFFLINE' }, [channel.port2])
    }
    const changed = () => {
      const installing = registration?.installing
      if (installing && !workers.has(installing)) {
        const stateChanged = () => {
          if (!alive) return
          if (installing.state === 'redundant' && !registration?.active) setMessage('Offline no disponible. No cierres sin conexión.')
          else report()
        }
        workers.set(installing, stateChanged); installing.addEventListener('statechange', stateChanged)
      }
      report()
    }
    const onPrompt = (event: Event) => { event.preventDefault(); prompt.current = event as InstallPrompt; setInstallable(true) }
    const installed = () => { prompt.current = null; setInstallable(false) }
    window.addEventListener('beforeinstallprompt', onPrompt); window.addEventListener('appinstalled', installed)
    if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
      navigator.serviceWorker.addEventListener('controllerchange', report)
      void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(async value => {
        if (!alive) return
        registration = value; value.addEventListener('updatefound', changed); changed()
        await navigator.serviceWorker.ready; report()
      }).catch(() => { if (alive) setMessage('Offline no disponible. No cierres sin conexión.') })
    } else if (import.meta.env.PROD) setMessage('Offline requiere HTTPS y un navegador compatible.')
    return () => {
      alive = false; registration?.removeEventListener('updatefound', changed)
      workers.forEach((listener, worker) => worker.removeEventListener('statechange', listener))
      channels.forEach((timer, channel) => { clearTimeout(timer); channel.port1.close() })
      if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('controllerchange', report)
      window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', installed)
    }
  }, [])
  async function install() {
    const event = prompt.current
    if (!event) return
    prompt.current = null; setInstallable(false)
    try { await event.prompt(); await event.userChoice } catch { setMessage('Usa el menú del navegador para instalar la aplicación.') }
  }
  return { ready, message, installable, install }
}
