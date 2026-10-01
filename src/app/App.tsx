import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Player } from '../domain/Player'
import { ScreenMatchInput } from '../inputs/ScreenMatchInput'
import { MatchEngine } from '../match-engine/MatchEngine'
import type { MatchConfiguration, MatchMode } from '../match-engine/types'
import { LocalRepository, STORAGE_KEY, StorageConflictError, type LocalData, type MatchSession } from '../services/persistence/LocalRepository'
import { TopMenu, type MenuItem } from '../ui/components/TopMenu'
import { FixedCanvas } from '../ui/layout/FixedCanvas'
import { HistoryScreen } from '../ui/screens/HistoryScreen'
import { MatchConfigurationScreen, MatchFlow } from '../ui/screens/MatchFlow'
import { NewMatchScreen } from '../ui/screens/NewMatchScreen'
import { PlayerSelectionScreen, PlayersScreen } from '../ui/screens/PlayersScreen'

const menuItems: MenuItem[] = [
  { id: 'new-match', label: 'NUEVO PARTIDO' }, { id: 'players', label: 'JUGADORES' },
  { id: 'history', label: 'HISTORIAL' }, { id: 'tournament', label: 'TORNEO' },
  { id: 'ranking', label: 'RANKING' }, { id: 'settings', label: 'AJUSTES' },
]
type Screen = 'new' | 'configuration' | 'selection' | 'players' | 'match' | 'history' | 'placeholder'

function createRuntime() {
  let storage: Storage | null = null
  try { storage = window.localStorage } catch { /* El navegador puede bloquear el almacenamiento. */ }
  const repository = new LocalRepository(storage)
  const data = repository.read()
  // El reloj del partido no cambia si el sistema ajusta su fecha u hora.
  const engine = new MatchEngine(() => Math.floor(performance.now()))
  if (data.active) engine.restore(data.active.checkpoint)
  return { repository, data, engine, storage, input: new ScreenMatchInput(engine) }
}

export function App() {
  const [runtime] = useState(createRuntime)
  const { repository, engine, input } = runtime
  const state = useSyncExternalStore(engine.subscribe.bind(engine), engine.getState, engine.getState)
  const [data, setData] = useState(runtime.data)
  const [activeMenu, setActiveMenu] = useState('new-match')
  const [screen, setScreen] = useState<Screen>(runtime.data.active ? 'match' : 'new')
  const [mode, setMode] = useState<MatchMode>('QUICK')
  const [configuration, setConfiguration] = useState<MatchConfiguration | null>(null)
  const [selectionIds, setSelectionIds] = useState<string[]>([])
  const [playersReturn, setPlayersReturn] = useState<Screen>('new')
  const [storageError, setStorageError] = useState<string | null>(repository.loadError)
  const [conflict, setConflict] = useState(false)
  const session = useRef<MatchSession | null>(runtime.data.active)
  const blocked = useRef(Boolean(repository.loadError))
  const lastFingerprint = useRef('')
  const pendingWrite = useRef<(() => LocalData) | null>(null)

  const reportStorageError = (failure: unknown) => {
    blocked.current = true
    engine.dispatch('PAUSA')
    setConflict(failure instanceof StorageConflictError)
    setStorageError(failure instanceof StorageConflictError ? failure.message : 'No se pudo guardar. El almacenamiento puede estar lleno o bloqueado. Mantén esta pestaña abierta y reintenta.')
  }

  const write = (operation: () => LocalData): void => {
    pendingWrite.current = operation
    try {
      setData(operation())
      pendingWrite.current = null
      blocked.current = false
      setStorageError(null)
      setConflict(false)
    } catch (failure) {
      reportStorageError(failure)
      throw failure
    }
  }

  const persist = () => {
    if (blocked.current || !session.current) return
    const checkpoint = engine.exportCheckpoint()
    // Los milisegundos de la animación no necesitan una escritura cada 100 ms.
    const fingerprint = JSON.stringify({ ...checkpoint, state: { ...checkpoint.state, goalLockRemainingMs: 0 } })
    if (fingerprint === lastFingerprint.current) return
    const current = { ...session.current, checkpoint }
    try {
      write(() => repository.saveSession(current))
      session.current = current
      lastFingerprint.current = fingerprint
    } catch { /* El diálogo impide continuar sin que el usuario vea el fallo. */ }
  }

  useEffect(() => {
    const unsubscribe = engine.subscribe(persist)
    persist()
    const timer = window.setInterval(() => { if (!blocked.current) engine.tick() }, 100)
    const pause = () => { if (!blocked.current) { engine.dispatch('PAUSA'); persist() } }
    const visibility = () => { if (document.hidden) pause() }
    const storageChanged = (event: StorageEvent) => {
      if (event.storageArea === runtime.storage && (event.key === STORAGE_KEY || event.key === null)) reportStorageError(new StorageConflictError())
    }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pause)
    window.addEventListener('storage', storageChanged)
    return () => {
      unsubscribe(); window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('storage', storageChanged)
    }
  }, [runtime])

  const selectMenu = (id: string) => {
    engine.dispatch('PAUSA')
    if (blocked.current) return
    setActiveMenu(id)
    if (id === 'players') { setPlayersReturn('new'); setScreen('players') }
    else setScreen(id === 'new-match' ? 'new' : id === 'history' ? 'history' : 'placeholder')
  }

  const start = (selected: Player[]) => {
    if (!configuration || (selected.length !== 2 && selected.length !== 4) || blocked.current) return
    session.current = { id: crypto.randomUUID(), startedAt: Date.now(), players: structuredClone(selected), checkpoint: engine.exportCheckpoint() }
    lastFingerprint.current = ''
    engine.createMatch(configuration)
    if (!blocked.current) { setActiveMenu('new-match'); setScreen('match') }
  }

  const newMatch = () => {
    try {
      write(() => {
        const saved = repository.clearCompleted()
        session.current = null
        lastFingerprint.current = ''
        setActiveMenu('new-match'); setScreen('new'); setConfiguration(null); setSelectionIds([])
        return saved
      })
    } catch { /* El reintento también ejecuta la transición de pantalla. */ }
  }

  const managePlayers = () => { setPlayersReturn('selection'); setActiveMenu('players'); setScreen('players') }
  const returnFromPlayers = () => { setActiveMenu('new-match'); setScreen(playersReturn) }
  const retry = () => {
    if (!pendingWrite.current) return
    try {
      write(pendingWrite.current)
      lastFingerprint.current = ''
      persist()
      if (session.current && !blocked.current) { setActiveMenu('new-match'); setScreen('match') }
    } catch { /* Conserva la operación pendiente. */ }
  }
  const active = data.active
  const pending = active && active.checkpoint.state.status !== 'MATCH_END'

  return <FixedCanvas><main className="application-shell" aria-label="Marcador Futbolín V3">
    <div className="menu-container" inert={Boolean(storageError)}><TopMenu items={menuItems} activeItem={activeMenu} onSelect={selectMenu} /></div>
    <section className="app-content" inert={Boolean(storageError)}>
      {screen === 'new' && (pending ? <section className="result-screen"><p className="eyebrow">PARTIDO PENDIENTE</p><h1>RECUPERAR PARTIDO</h1><p className="result-summary">El encuentro está pausado. Recupéralo antes de empezar otro.</p><button type="button" className="primary-action" onClick={() => setScreen('match')}>VOLVER AL PARTIDO</button></section> : <NewMatchScreen onSelect={(next) => { setMode(next); setConfiguration(null); setSelectionIds([]); setScreen('configuration') }} />)}
      {screen === 'configuration' && <MatchConfigurationScreen mode={mode} initialConfiguration={configuration} onContinue={(next) => { setConfiguration(next); setScreen('selection') }} onBack={() => setScreen('new')} />}
      {screen === 'selection' && <PlayerSelectionScreen players={data.players} selectedIds={selectionIds} onSelectionChange={setSelectionIds} onStart={start} onManage={managePlayers} onBack={() => setScreen('configuration')} />}
      {screen === 'players' && <PlayersScreen players={data.players} onSave={(player) => write(() => repository.savePlayer(player))} onBack={returnFromPlayers} />}
      {screen === 'history' && <HistoryScreen matches={data.history} />}
      {screen === 'match' && <MatchFlow state={state} engine={engine} input={input} players={session.current?.players ?? []} onNewMatch={newMatch} />}
      {screen === 'placeholder' && <div className="placeholder-screen"><span>PRÓXIMAMENTE</span><p>La sección {menuItems.find((item) => item.id === activeMenu)?.label} está preparada para una siguiente fase.</p></div>}
    </section>
    <footer className="system-status"><span className={`status-dot ${storageError ? 'status-error' : ''}`} />{storageError ? 'GUARDADO INTERRUMPIDO' : 'ALMACENAMIENTO LOCAL · SIN SINCRONIZACIÓN EN LA NUBE'}</footer>
    {storageError && <div className="storage-dialog" role="dialog" aria-modal="true" aria-labelledby="storage-title">
      <h1 id="storage-title">{conflict ? 'DATOS ACTUALIZADOS' : 'REVISAR ALMACENAMIENTO'}</h1><p role="alert">{storageError}</p>
      {conflict || repository.loadError ? <button type="button" autoFocus className="primary-action" onClick={() => window.location.reload()}>RECARGAR</button> : <button type="button" autoFocus className="primary-action" onClick={retry}>REINTENTAR GUARDADO</button>}
    </div>}
  </main></FixedCanvas>
}
