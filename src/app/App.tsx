import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { FixedCanvas } from '../ui/layout/FixedCanvas'
import { MatchEngine } from '../match-engine/MatchEngine'
import type { MatchConfiguration, MatchMode } from '../match-engine/types'
import { ScreenMatchInput } from '../inputs/ScreenMatchInput'
import { NewMatchScreen } from '../ui/screens/NewMatchScreen'
import { MatchConfigurationScreen, MatchFlow, PlayerSelectionScreen } from '../ui/screens/MatchFlow'
import { TopMenu, type MenuItem } from '../ui/components/TopMenu'
import { SettingsScreen } from '../ui/screens/SettingsScreen'
import { HistoryScreen } from '../ui/screens/HistoryScreen'
import type { ApplicationServices } from './services'
import { errorMessage, useData } from './useData'
import { SaveCoordinator } from '../services/persistence/SaveCoordinator'
import { activePlayers, type MatchDocument, type Player } from '../services/persistence/models'
import { mapMatch, participantsFor } from '../services/persistence/mapMatch'

const menuItems: MenuItem[] = [{ id: 'new-match', label: 'NUEVO PARTIDO' }, { id: 'tournament', label: 'TORNEO' }, { id: 'ranking', label: 'RANKING' }, { id: 'settings', label: 'AJUSTES' }]
type Screen = 'new' | 'configuration' | 'players' | 'match' | 'settings' | 'history' | 'placeholder'
interface RunContext { id: string; players: Player[]; testMode: boolean; coordinator: SaveCoordinator | null }
const practicePlayers: Player[] = ['PRUEBA BLANCO', 'PRUEBA AZUL'].map((name, i) => ({ id: 'practice-' + i, name, nickname: null, photoUrl: null, active: true, level: 0 }))

export function App({ services }: { services: ApplicationServices | null }) {
  const engine = useMemo(() => new MatchEngine(), [])
  const input = useMemo(() => new ScreenMatchInput(engine), [engine])
  const subscribe = useMemo(() => engine.subscribe.bind(engine), [engine])
  const state = useSyncExternalStore(subscribe, engine.getState, engine.getState)
  const data = useData(services)
  const userId = data.user?.id ?? null
  const coordinator = useMemo(() => {
    if (!services || !userId) return null
    return new SaveCoordinator({
      saveMatch: async document => {
        if ((await services.auth.getIdentity())?.id !== userId) throw new Error('Accede con la cuenta que inició el partido para sincronizarlo.')
        await services.matches.saveMatch({ ...document, owner_id: userId })
      },
      getMatches: offset => services.matches.getMatches(offset),
      getMatchById: id => services.matches.getMatchById(id),
    }, localStorage, services.namespace + ':pending:v1:' + userId)
  }, [services, userId])
  const [activeMenu, setActiveMenu] = useState('new-match')
  const [screen, setScreen] = useState<Screen>('new')
  const [mode, setMode] = useState<MatchMode>('QUICK')
  const [configuration, setConfiguration] = useState<MatchConfiguration | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [testMode, setTestMode] = useState(() => {
    try { return localStorage.getItem('marcador:test-mode:v1') !== 'false' } catch { return true }
  })
  const [pendingCount, setPendingCount] = useState(0)
  const [saveMessage, setSaveMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [canLeave, setCanLeave] = useState(true)
  const [notice, setNotice] = useState('')
  const run = useRef<RunContext | null>(null)
  const finalDocument = useRef<MatchDocument | null>(null)
  const handledId = useRef<string | null>(null)
  const matchOpen = run.current !== null
  const protectedIds = useMemo(() => {
    try { return [...players.map(p => p.id), ...(coordinator?.getPending() ?? []).flatMap(doc => doc.participants.map(p => p.player_id))] }
    catch { return data.players.map(p => p.id) }
  }, [players, coordinator, pendingCount, saveMessage, data.players])

  useEffect(() => { const timer = window.setInterval(() => engine.tick(), 100); return () => window.clearInterval(timer) }, [engine])
  useEffect(() => {
    try { setPendingCount(coordinator?.getPending().length ?? 0) } catch (error) { setNotice(errorMessage(error)) }
  }, [coordinator, saveMessage])

  async function persist(context: RunContext, document: MatchDocument) {
    setSaving(true); setCanLeave(false); setSaveMessage('Guardando resultado…')
    try {
      const result = document.match.test_mode ? 'test' : await context.coordinator?.save(document)
      if (!result) throw new Error('No hay cuenta para guardar. Mantén esta pantalla abierta.')
      setSaveMessage(result === 'saved' ? 'PARTIDO GUARDADO EN SUPABASE' : result === 'test' ? 'MODO PRUEBA · NO SE HA GUARDADO NADA' : 'PENDIENTE EN ESTE DISPOSITIVO · Reintenta en Ajustes')
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

  async function retryPending() {
    if (!coordinator) return
    const results = await coordinator.retry()
    setPendingCount(coordinator.getPending().length)
    setNotice(results.includes('pending') ? 'Aún hay resultados pendientes. Revisa Internet y la sesión.' : 'Sincronización completada.')
  }
  function selectMenu(id: string) {
    if (state.status === 'MATCH_END' && (!canLeave || saving)) { setNotice('Espera al guardado o reintenta en el resultado.'); return }
    if (state.status === 'PLAYING') input.emit('PAUSA')
    setActiveMenu(id); setNotice('')
    setScreen(id === 'settings' ? 'settings' : id === 'ranking' ? 'history' : id === 'new-match' ? matchOpen ? 'match' : 'new' : 'placeholder')
  }
  function start(selected: Player[]) {
    if (!configuration) return
    try {
      participantsFor(selected)
      if (!testMode && !coordinator) throw new Error('Inicia sesión en Ajustes o activa MODO PRUEBA.')
      run.current = { id: crypto.randomUUID(), players: selected.map(p => ({ ...p })), testMode, coordinator }
      handledId.current = null; finalDocument.current = null
      setPlayers(selected); setNotice(''); setSaveMessage(''); setCanLeave(false)
      engine.createMatch(configuration); setScreen('match')
    } catch (error) { setNotice(errorMessage(error)) }
  }
  function newMatch() {
    if (!canLeave || saving) return
    run.current = null; finalDocument.current = null; setPlayers([])
    setActiveMenu('new-match'); setScreen('new'); setNotice('')
  }
  const selectable = activePlayers(data.players)
  const availablePlayers = selectable.length ? selectable : testMode ? practicePlayers : []
  return <FixedCanvas><main className="application-shell" aria-label="Marcador Futbolín V3">
    <TopMenu items={menuItems} activeItem={activeMenu} onSelect={selectMenu} />
    <section className="app-content">
      {screen === 'new' && <NewMatchScreen onSelect={nextMode => { setMode(nextMode); setScreen('configuration') }} />}
      {screen === 'configuration' && <MatchConfigurationScreen mode={mode} onContinue={next => { setConfiguration(next); setScreen('players') }} onBack={() => setScreen('new')} />}
      {screen === 'players' && <PlayerSelectionScreen key={userId ?? 'practice'} availablePlayers={availablePlayers} testMode={testMode} onStart={start} onBack={() => setScreen('configuration')} />}
      {screen === 'match' && <MatchFlow state={state} engine={engine} input={input} players={players} onNewMatch={newMatch} saveMessage={saveMessage} canLeave={canLeave && !saving} onRetry={() => { if (!saving && run.current && finalDocument.current) void persist(run.current, finalDocument.current) }} />}
      {screen === 'settings' && <SettingsScreen key={userId ?? 'guest'} services={services} user={data.user} players={data.players} protectedIds={protectedIds} testMode={testMode} onTestMode={value => { setTestMode(value); try { localStorage.setItem('marcador:test-mode:v1', String(value)) } catch { setNotice('Preferencia aplicada; no se pudo recordar localmente.') } }} refresh={data.refresh} pendingCount={pendingCount} onRetry={retryPending} dataMessage={notice || data.message} />}
      {screen === 'history' && <HistoryScreen key={userId ?? 'guest'} repository={services?.matches ?? null} userId={userId} />}
      {screen === 'placeholder' && <div className="placeholder-screen"><span>PRÓXIMAMENTE</span><p>Torneos se implementará en otra fase.</p></div>}
    </section>
    <footer className="system-status"><span className="status-dot" />{notice && screen !== 'settings' ? notice : 'SISTEMA ONLINE · ' + (testMode ? 'PRUEBA ON' : 'PRUEBA OFF') + ' · ' + (data.user ? 'SESIÓN ACTIVA' : 'SIN SESIÓN')}{matchOpen && screen !== 'match' && <button type="button" onClick={() => { setActiveMenu('new-match'); setScreen('match') }}>VOLVER AL PARTIDO</button>}</footer>
  </main></FixedCanvas>
}
