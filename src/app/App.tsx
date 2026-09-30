import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { FixedCanvas } from '../ui/layout/FixedCanvas'
import { MatchEngine } from '../match-engine/MatchEngine'
import type { MatchConfiguration, MatchMode } from '../match-engine/types'
import { ScreenMatchInput } from '../inputs/ScreenMatchInput'
import { NewMatchScreen } from '../ui/screens/NewMatchScreen'
import { MatchConfigurationScreen, MatchFlow, PlayerSelectionScreen, type Player } from '../ui/screens/MatchFlow'
import { TopMenu, type MenuItem } from '../ui/components/TopMenu'

const menuItems: MenuItem[] = [{ id: 'new-match', label: 'NUEVO PARTIDO' }, { id: 'tournament', label: 'TORNEO' }, { id: 'ranking', label: 'RANKING' }, { id: 'settings', label: 'AJUSTES' }]
type Screen = 'new' | 'configuration' | 'players' | 'match' | 'placeholder'
export function App() {
  const engine = useMemo(() => new MatchEngine(), []); const input = useMemo(() => new ScreenMatchInput(engine), [engine]); const state = useSyncExternalStore(engine.subscribe.bind(engine), engine.getState, engine.getState)
  const [activeMenu, setActiveMenu] = useState('new-match'); const [screen, setScreen] = useState<Screen>('new'); const [mode, setMode] = useState<MatchMode>('QUICK'); const [configuration, setConfiguration] = useState<MatchConfiguration | null>(null); const [players, setPlayers] = useState<Player[]>([])
  useEffect(() => { const timer = window.setInterval(() => engine.tick(), 100); return () => window.clearInterval(timer) }, [engine])
  const selectMenu = (id: string) => { setActiveMenu(id); setScreen(id === 'new-match' ? 'new' : 'placeholder') }; const selectMode = (nextMode: MatchMode) => { setMode(nextMode); setScreen('configuration') }; const chooseConfiguration = (next: MatchConfiguration) => { setConfiguration(next); setScreen('players') }; const start = (selected: Player[]) => { if (!configuration) return; setPlayers(selected); engine.createMatch(configuration); setScreen('match') }; const newMatch = () => { setActiveMenu('new-match'); setScreen('new') }
  return <FixedCanvas><main className="application-shell" aria-label="Marcador Futbolín V3"><TopMenu items={menuItems} activeItem={activeMenu} onSelect={selectMenu} /><section className="app-content">{screen === 'new' && <NewMatchScreen onSelect={selectMode} />}{screen === 'configuration' && <MatchConfigurationScreen mode={mode} onContinue={chooseConfiguration} onBack={() => setScreen('new')} />}{screen === 'players' && <PlayerSelectionScreen onStart={start} onBack={() => setScreen('configuration')} />}{screen === 'match' && <MatchFlow state={state} engine={engine} input={input} players={players} onNewMatch={newMatch} />}{screen === 'placeholder' && <div className="placeholder-screen"><span>PRÓXIMAMENTE</span><p>La sección {menuItems.find((item) => item.id === activeMenu)?.label} está preparada para una siguiente fase.</p></div>}</section><footer className="system-status"><span className="status-dot" /> SISTEMA ONLINE</footer></main></FixedCanvas>
}
