import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { FixedCanvas } from '../ui/layout/FixedCanvas'
import { DISPLAY_MODE_KEY, parseDisplayMode, type DisplayMode } from '../ui/layout/displayMode'
import { DisplaySettings } from '../ui/components/DisplaySettings'
import { MatchEngine } from '../match-engine/MatchEngine'
import type { MatchConfiguration, MatchMode } from '../match-engine/types'
import { ScreenMatchInput } from '../inputs/ScreenMatchInput'
import { NewMatchScreen } from '../ui/screens/NewMatchScreen'
import { MatchConfigurationScreen, MatchFlow, PlayerSelectionScreen } from '../ui/screens/MatchFlow'
import { TopMenu, type MenuItem } from '../ui/components/TopMenu'
import { AccountScreen, type AccessMode } from '../ui/screens/AccountScreen'
import { PasswordRecoveryScreen } from '../ui/screens/PasswordRecoveryScreen'
import { SettingsScreen } from '../ui/screens/SettingsScreen'
import { HistoryScreen } from '../ui/screens/HistoryScreen'
import { StatisticsScreen } from '../ui/screens/StatisticsScreen'
import { RankingScreen } from '../ui/screens/RankingScreen'
import { CancelMatchDialog } from '../ui/components/CancelMatchDialog'
import { RecoveryScreen } from '../ui/screens/RecoveryScreen'
import { PendingMatchesScreen } from '../ui/screens/PendingMatchesScreen'
import { useConnection } from '../system/useConnection'
import { useOfflineApp } from '../system/useOfflineApp'
import { usePendingQueue } from './usePendingQueue'
import type { ApplicationServices } from './services'
import { passwordRecoveryLinkError } from '../services/supabase/authFeedback'
import { errorMessage, useData } from './useData'
import { SaveCoordinator, type KeyValueStorage } from '../services/persistence/SaveCoordinator'
import { ActiveMatchStore, type ActiveMatchCopy } from '../services/persistence/ActiveMatchStore'
import { useActiveMatch, type RunContext } from './useActiveMatch'
import { activePlayers, type MatchDocument, type Player } from '../services/persistence/models'
import { mapMatch, participantsFor } from '../services/persistence/mapMatch'

const menuItems: MenuItem[] = [{ id: 'new-match', label: 'NUEVO PARTIDO' }, { id: 'tournament', label: 'TORNEO' }, { id: 'ranking', label: 'RANKING' }, { id: 'settings', label: 'AJUSTES' }]
type Screen = 'account' | 'new' | 'configuration' | 'players' | 'match' | 'settings' | 'history' | 'ranking' | 'statistics' | 'placeholder' | 'recovery' | 'pending'
const browserStorage: KeyValueStorage = { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) }
type CancelRequest = { kind: 'active'; id: string; pausedByDialog: boolean } | { kind: 'recovery'; copy: ActiveMatchCopy }
const noRecovery = () => false
const noRecoverySubscription = () => () => {}
const practicePlayers: Player[] = ['PRUEBA BLANCO', 'PRUEBA AZUL'].map((name, i) => ({ id: 'practice-' + i, name, nickname: null, photoUrl: null, active: true, level: 0 }))

export function App({ services }: { services: ApplicationServices | null }) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    try { return parseDisplayMode(localStorage.getItem(DISPLAY_MODE_KEY)) } catch { return 'adaptive' }
  })
  const engine = useMemo(() => new MatchEngine(), [])
  const input = useMemo(() => new ScreenMatchInput(engine), [engine])
  const subscribe = useMemo(() => engine.subscribe.bind(engine), [engine])
  const state = useSyncExternalStore(subscribe, engine.getState, engine.getState)
  const connection = useConnection()
  const offline = useOfflineApp()
  const online = connection.state === 'online'
  const data = useData(services, connection.state)
  const passwordRecovery = useSyncExternalStore(services?.auth.subscribePasswordRecovery ?? noRecoverySubscription, services?.auth.getPasswordRecovery ?? noRecovery, noRecovery)
  const userId = data.user?.id ?? null
  const coordinator = useMemo(() => {
    if (!services || !userId) return null
    return new SaveCoordinator({
      saveMatch: async document => {
        if (connection.monitor.getSnapshot() !== 'online') throw new Error('Sin conexión; resultado conservado localmente.')
        if ((await services.auth.getIdentity())?.id !== userId) throw new Error('Accede con la cuenta que inició el partido para sincronizarlo.')
        await services.matches.saveMatch({ ...document, owner_id: userId })
      },
      getMatches: (offset, query) => services.matches.getMatches(offset, query),
      getMatchById: id => services.matches.getMatchById(id),
    }, browserStorage, services.namespace + ':pending:v1:' + userId)
  }, [services, userId, connection.monitor])
  const activeStore = useMemo(() => services && userId ? new ActiveMatchStore(browserStorage, services.namespace, userId) : null, [services, userId])
  const [cancelRequest, setCancelRequest] = useState<CancelRequest | null>(null)
  const [cancelError, setCancelError] = useState('')
  const [recovery, setRecovery] = useState<ActiveMatchCopy | null>(null)
  const [accessLinkError] = useState(() => passwordRecoveryLinkError(window.location.href))
  const [activeMenu, setActiveMenu] = useState(accessLinkError ? 'account' : 'new-match')
  const [screen, setScreen] = useState<Screen>(accessLinkError ? 'account' : 'new')
  const [accessMode, setAccessMode] = useState<AccessMode>('login')
  const [accessRevision, setAccessRevision] = useState(0)
  const [accountBusy, setAccountBusy] = useState(false)
  const [profilePlayerId, setProfilePlayerId] = useState<string | null>(null)
  const [mode, setMode] = useState<MatchMode>('QUICK')
  const [configuration, setConfiguration] = useState<MatchConfiguration | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [testMode, setTestMode] = useState(() => {
    try { return localStorage.getItem('marcador:test-mode:v1') !== 'false' } catch { return true }
  })
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [canLeave, setCanLeave] = useState(true)
  const [notice, setNotice] = useState(accessLinkError)
  const run = useRef<RunContext | null>(null)
  const recoveryWarning = useActiveMatch(engine, run)
  const finalDocument = useRef<MatchDocument | null>(null)
  const handledId = useRef<string | null>(null)
  const matchOpen = run.current !== null
  const pending = usePendingQueue(coordinator, online && !data.localIdentity, matchOpen && state.status !== 'MATCH_END' || saving)
  const pendingCount = pending.documents.length
  const refreshedSaveId = useRef<string | null>(null)
  useEffect(() => {
    if (pending.lastSavedId && pending.lastSavedId !== refreshedSaveId.current) {
      refreshedSaveId.current = pending.lastSavedId
      void data.refresh()
    }
  }, [pending.lastSavedId, data.refresh])
  useEffect(() => {
    if (state.status === 'MATCH_END' && pending.lastSavedId === run.current?.id && run.current.checkpointReleased) setSaveMessage('PARTIDO GUARDADO EN SUPABASE')
  }, [pending.lastSavedId, state.status])
  const protectedIds = useMemo(() => {
    try { return [...players.map(p => p.id), ...(recovery?.players ?? []).map(p => p.id), ...(coordinator?.getPending() ?? []).flatMap(doc => doc.participants.map(p => p.player_id))] }
    catch { return data.players.map(p => p.id) }
  }, [players, recovery, coordinator, pendingCount, saveMessage, data.players])

  useEffect(() => {
    if (run.current) return
    try {
      const copy = activeStore?.load() ?? null
      setRecovery(copy)
      setScreen(current => copy ? 'recovery' : current === 'recovery' ? 'new' : current)
    } catch (error) { setRecovery(null); setScreen(current => current === 'recovery' ? 'new' : current); setNotice(errorMessage(error)) }
  }, [activeStore])

  useEffect(() => { const timer = window.setInterval(() => engine.tick(), 100); return () => window.clearInterval(timer) }, [engine])

  // A confirmation opened during countdown also pauses once play begins.
  useEffect(() => {
    if (cancelRequest?.kind === 'active' && run.current?.id === cancelRequest.id && state.status === 'PLAYING') {
      input.emit('PAUSA')
      setCancelRequest(current => current?.kind === 'active' ? { ...current, pausedByDialog: true } : current)
    }
  }, [cancelRequest, state.status, input])

  async function persist(context: RunContext, document: MatchDocument) {
    setSaving(true); setCanLeave(false); setSaveMessage('Guardando resultado…')
    try {
      const result = document.match.test_mode ? 'test' : await context.coordinator?.save(document)
      if (!result) throw new Error('No hay cuenta para guardar. Mantén esta pantalla abierta.')
      // Only release recovery after a durable final queue or remote acknowledgement.
      context.checkpointReleased = true
      try { context.activeStore?.clear(context.id) } catch { setNotice('Resultado conservado; no se pudo limpiar la copia de recuperación.') }
      setSaveMessage(result === 'saved' ? 'PARTIDO GUARDADO EN SUPABASE' : result === 'test' ? 'MODO PRUEBA · NO SE HA GUARDADO NADA' : 'PENDIENTE EN ESTE DISPOSITIVO · Se reintentará al reconectar')
      setCanLeave(true)
    } catch (error) { setSaveMessage(errorMessage(error) + ' · No cierres el resultado; reintenta.') }
    finally { setSaving(false) }
  }
  useEffect(() => {
    const context = run.current
    if (state.status !== 'MATCH_END' || !context || handledId.current === context.id) return
    handledId.current = context.id
    try {
      const document = mapMatch(state, context.players, context.id, context.testMode)
      finalDocument.current = document
      void persist(context, document)
    } catch (error) { setSaveMessage(errorMessage(error)); setCanLeave(false) }
  }, [state])

  function openAccount(mode: AccessMode = 'login') {
    if (accountBusy || passwordRecovery || cancelRequest) return
    if (state.status === 'MATCH_END' && (!canLeave || saving)) { setNotice('Espera al guardado o reintenta en el resultado.'); return }
    if (state.status === 'PLAYING') input.emit('PAUSA')
    setAccessMode(mode); setAccessRevision(value => value + 1); setActiveMenu('account'); setScreen('account'); setNotice('')
  }
  function selectMenu(id: string) {
    if (accountBusy || passwordRecovery || cancelRequest) return
    if (state.status === 'MATCH_END' && (!canLeave || saving)) { setNotice('Espera al guardado o reintenta en el resultado.'); return }
    if (id === 'new-match') {
      if (run.current && state.status !== 'MATCH_END') { requestCancellation(); return }
      if (run.current) { newMatch(); return }
      if (recovery && recovery.checkpoint.state.status !== 'MATCH_END') { requestCancellation(); return }
    }
    if (state.status === 'PLAYING') input.emit('PAUSA')
    setActiveMenu(id); setNotice('')
    setScreen(id === 'settings' ? 'settings' : id === 'ranking' ? 'history' : id === 'new-match' ? matchOpen ? 'match' : recovery ? 'recovery' : 'new' : 'placeholder')
  }
  function requestCancellation() {
    if (cancelRequest || saving || passwordRecovery || accountBusy) return
    setCancelError('')
    const context = run.current
    if (context) {
      const pausedByDialog = engine.getState().status === 'PLAYING'
      if (pausedByDialog) input.emit('PAUSA')
      // Pausing settles the clock; it may have naturally ended the match.
      if (engine.getState().status === 'MATCH_END' || handledId.current === context.id) { setNotice('Conserva el resultado antes de iniciar otro partido.'); return }
      setCancelRequest({ kind: 'active', id: context.id, pausedByDialog })
    } else if (recovery && recovery.checkpoint.state.status !== 'MATCH_END') {
      setCancelRequest({ kind: 'recovery', copy: recovery })
    }
  }
  function keepMatch() {
    if (cancelRequest?.kind === 'active' && cancelRequest.pausedByDialog && run.current?.id === cancelRequest.id && engine.getState().status === 'PAUSED') input.emit('CONTINUAR')
    setCancelRequest(null); setCancelError('')
  }
  function discardMatch() {
    if (!cancelRequest || saving) return
    try {
      if (cancelRequest.kind === 'active') {
        const context = run.current
        if (!context || context.id !== cancelRequest.id || context.ownerId !== userId || handledId.current === context.id || engine.getState().status === 'MATCH_END') throw new Error('El partido cambió o ya terminó. No se ha descartado.')
        if (!context.testMode) {
          if (!context.activeStore) throw new Error('No se puede comprobar la copia local. El partido se conserva.')
          const copy = context.activeStore.load()
          const checkpoint = engine.getCheckpoint()
          if (copy && (copy.id !== context.id || JSON.stringify(copy.checkpoint.state) !== JSON.stringify(checkpoint.state) || copy.checkpoint.goalSequence !== checkpoint.goalSequence || copy.checkpoint.completedTimeSeconds !== checkpoint.completedTimeSeconds)) throw new Error('La copia cambió en otra pestaña. No se ha descartado ningún partido.')
          if (copy) context.activeStore.discard(copy)
        }
        run.current = null
        engine.cancelMatch()
      } else {
        if (!activeStore || cancelRequest.copy.ownerId !== userId) throw new Error('Accede con la cuenta del partido para descartarlo.')
        activeStore.discard(cancelRequest.copy)
      }
      finalDocument.current = null; handledId.current = null
      setRecovery(null); setPlayers([]); setConfiguration(null); setCanLeave(true); setSaveMessage('')
      setCancelRequest(null); setCancelError(''); setNotice(''); setActiveMenu('new-match'); setScreen('new')
    } catch (error) { setCancelError(errorMessage(error) + ' El partido se conserva.') }
  }
  function openStatistics(playerId: string | null = null) {
    setProfilePlayerId(playerId); setActiveMenu('ranking'); setScreen('statistics')
  }
  function start(selected: Player[]) {
    if (!configuration) return
    try {
      participantsFor(selected)
      if (!testMode && !coordinator) throw new Error('Inicia sesión desde la esquina superior o activa MODO PRUEBA.')
      if (!testMode) {
        const copy = activeStore?.load()
        if (copy) { setRecovery(copy); setScreen('recovery'); return }
      }
      run.current = { id: crypto.randomUUID(), ownerId: userId, players: selected.map(p => ({ ...p })), testMode, coordinator,
        activeStore: testMode ? null : activeStore, checkpointReleased: false }
      handledId.current = null; finalDocument.current = null
      setPlayers(selected); setNotice(''); setSaveMessage(''); setCanLeave(false)
      engine.createMatch(configuration); setScreen('match')
    } catch (error) { setNotice(errorMessage(error)) }
  }
  function recoverMatch() {
    if (!recovery || !coordinator || !activeStore || recovery.ownerId !== userId) return
    try {
      const copy = activeStore.load()
      if (!copy) { setRecovery(null); setScreen('new'); return }
      run.current = { id: copy.id, ownerId: copy.ownerId, players: copy.players, testMode: false, coordinator,
        activeStore, checkpointReleased: false }
      handledId.current = null; finalDocument.current = null
      setPlayers(copy.players); setConfiguration(copy.checkpoint.state.config); setMode(copy.checkpoint.state.config!.mode)
      setNotice(''); setSaveMessage(''); setCanLeave(false); setRecovery(null)
      engine.restoreCheckpoint(copy.checkpoint)
      setActiveMenu('new-match'); setScreen('match')
    } catch (error) { run.current = null; setNotice(errorMessage(error)) }
  }
  function newMatch() {
    if (!canLeave || saving) return
    run.current = null; finalDocument.current = null; setPlayers([])
    setActiveMenu('new-match'); setScreen('new'); setNotice('')
    try {
      const copy = activeStore?.load() ?? null
      setRecovery(copy)
      if (copy) setScreen('recovery')
    } catch (error) { setNotice(errorMessage(error)) }
  }
  const selectable = activePlayers(data.players)
  const availablePlayers = selectable.length ? selectable : testMode ? practicePlayers : []
  return <FixedCanvas mode={displayMode}><main className="application-shell" data-screen={screen} aria-label="Marcador Futbolín V3">
    <TopMenu items={menuItems} activeItem={passwordRecovery ? 'settings' : activeMenu} onSelect={selectMenu} disabled={accountBusy || passwordRecovery} accountActions={<nav className="header-account" aria-label="Acceso y cuenta">{data.user ? <button type="button" className="header-account-button" aria-current={screen === 'account' ? 'page' : undefined} disabled={accountBusy || passwordRecovery} onClick={() => openAccount()}>MI CUENTA<span>{data.user.displayName || 'OPERADOR'}</span></button> : <><button type="button" className="header-account-button" disabled={accountBusy || passwordRecovery} onClick={() => openAccount('login')}>INICIAR SESIÓN</button><button type="button" className="header-register-button" disabled={accountBusy || passwordRecovery} onClick={() => openAccount('register')}>REGISTRO</button></>}</nav>} />
    <section className="app-content">
      {passwordRecovery && services ? <PasswordRecoveryScreen auth={services.auth} online={online && !data.localIdentity} onCheck={() => void connection.monitor.check()} onDone={() => { services.auth.finishPasswordRecovery(); setActiveMenu('account'); setScreen('account') }} /> : <>
      {screen === 'account' && <AccountScreen key={`${userId ?? 'guest'}:${accessRevision}`} services={services} user={data.user} initialMode={accessMode} online={online && !data.localIdentity} locked={matchOpen && (state.status !== 'MATCH_END' || !canLeave || saving)} onSignedOut={() => { data.signedOut(); setAccessMode('login'); setAccessRevision(value => value + 1) }} onCheck={() => void connection.monitor.check()} onBusy={setAccountBusy} initialMessage={notice} />}
      {screen === 'new' && <NewMatchScreen onSelect={nextMode => { setMode(nextMode); setScreen('configuration') }} />}
      {screen === 'recovery' && recovery && <RecoveryScreen copy={recovery} onRecover={recoverMatch} onDiscard={requestCancellation} />}
      {screen === 'configuration' && <MatchConfigurationScreen mode={mode} onContinue={next => { setConfiguration(next); setScreen('players') }} onBack={() => setScreen('new')} />}
      {screen === 'players' && <PlayerSelectionScreen key={userId ?? 'practice'} availablePlayers={availablePlayers} testMode={testMode} onStart={start} onBack={() => setScreen('configuration')} />}
      {screen === 'match' && <MatchFlow state={state} engine={engine} input={input} players={players} onNewMatch={newMatch} saveMessage={saveMessage} canLeave={canLeave && !saving} onRetry={() => { if (!saving && run.current && finalDocument.current) void persist(run.current, finalDocument.current) }} />}
      {screen === 'settings' && <SettingsScreen key={userId ?? 'guest'} services={services} user={data.user} players={data.players} protectedIds={protectedIds} testMode={testMode} onTestMode={value => { setTestMode(value); try { localStorage.setItem('marcador:test-mode:v1', String(value)) } catch { setNotice('Preferencia aplicada; no se pudo recordar localmente.') } }} refresh={data.refresh} pendingCount={pendingCount} onRetry={pending.retry} dataMessage={notice || pending.message || data.message} online={online && !data.localIdentity} onAccount={() => openAccount()} syncBusy={pending.busy} onPending={() => setScreen('pending')} offline={offline} onCheck={() => void connection.monitor.check()}
        onProfile={id => openStatistics(id)} displaySettings={<DisplaySettings mode={displayMode} onChange={value => { setDisplayMode(value); try { localStorage.setItem(DISPLAY_MODE_KEY, value) } catch { setNotice('Vista aplicada; no se pudo recordar localmente.') } }} />} />}
      {screen === 'pending' && <PendingMatchesScreen documents={pending.documents} online={online && !data.localIdentity} busy={pending.busy} message={pending.message} onRetry={pending.retry} onBack={() => setScreen('settings')} />}
      {screen === 'history' && <HistoryScreen players={data.players} key={userId ?? 'guest'} repository={services?.matches ?? null} userId={userId} online={online && !data.localIdentity} onStatistics={() => openStatistics()} onRanking={() => setScreen('ranking')} />}
      {screen === 'ranking' && <RankingScreen repository={services?.competition ?? null} key={userId ?? 'guest'} userId={userId} online={online && !data.localIdentity} revision={pending.lastSavedId} onBack={() => setScreen('history')} onProfile={id => openStatistics(id)} />}
      {screen === 'statistics' && <StatisticsScreen competitionRepository={services?.competition ?? null} dataRevision={pending.lastSavedId} progressionRepository={services?.progression ?? null} key={userId ?? 'guest'} repository={services?.matches ?? null} players={data.players} playersLoading={data.loading} dataMessage={data.message} userId={userId} online={online && !data.localIdentity} initialPlayerId={profilePlayerId} onBack={() => setScreen('history')} />}
      {screen === 'placeholder' && <div className="placeholder-screen"><span>PRÓXIMAMENTE</span><p>Torneos se implementará en otra fase.</p></div>}
      </>}
    </section>
    <footer className="system-status" role="status"><span className={`status-dot ${online ? '' : 'status-offline'}`} /><span>{connection.state === 'online' ? 'SISTEMA ONLINE' : connection.state === 'offline' ? 'SIN CONEXIÓN' : 'COMPROBANDO CONEXIÓN'} · {(run.current?.testMode ?? testMode) ? 'PRUEBA ON' : 'PRUEBA OFF'} · {data.user ? data.localIdentity || !online ? 'SESIÓN LOCAL' : 'SESIÓN ACTIVA' : 'SIN SESIÓN'}{pendingCount > 0 && ` · ${pendingCount} PENDIENTES`}</span>{(recoveryWarning || notice && screen !== 'settings' && screen !== 'account') && <span className="status-warning">{recoveryWarning || notice}</span>}{matchOpen && screen !== 'match' && <button type="button" onClick={() => { setActiveMenu('new-match'); setScreen('match') }}>VOLVER AL PARTIDO</button>}</footer>
    {cancelRequest && <CancelMatchDialog recovering={cancelRequest.kind === 'recovery'} error={cancelError} onKeep={keepMatch} onDiscard={discardMatch} />}
  </main></FixedCanvas>
}
