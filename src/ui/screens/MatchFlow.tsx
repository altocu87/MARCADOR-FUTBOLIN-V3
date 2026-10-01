import { useEffect, useState, type CSSProperties } from 'react'
import type { MatchInput } from '../../inputs/MatchInput'
import type { GoalEffect, MatchConfiguration, MatchMode, MatchState, VictoryCondition } from '../../match-engine/types'
import type { MatchEngine } from '../../match-engine/MatchEngine'

import type { Player } from '../../services/persistence/models'
export function MatchConfigurationScreen({ mode, onContinue, onBack }: { mode: MatchMode; onContinue: (config: MatchConfiguration) => void; onBack: () => void }) {
  const [victoryCondition, setVictoryCondition] = useState<VictoryCondition>('TIME'); const [goalLimit, setGoalLimit] = useState(5); const [halfDurationMinutes, setHalfDurationMinutes] = useState(5)
  const hasGoals = victoryCondition !== 'TIME'; const hasTime = victoryCondition !== 'GOALS'
  return <section className="configuration-screen screen-stack"><header className="screen-heading"><p className="eyebrow">{mode === 'QUICK' ? 'PARTIDO RÁPIDO' : mode === 'CHAOS' ? 'PARTIDO CAOS' : 'PARTIDO CLASIFICATORIO'}</p><h1>CONDICIÓN DE VICTORIA</h1></header><div className="condition-options">{([['GOALS', 'POR GOLES'], ['TIME', 'POR TIEMPO']] as const).map(([id, label]) => <button type="button" key={id} className={`choice-button ${victoryCondition === id ? 'selected' : ''}`} onClick={() => setVictoryCondition(id)}>{label}<small>{id === 'GOALS' ? 'Un equipo alcanza el objetivo · Una sola parte · Sin límite de tiempo' : 'Más goles al terminar · Dos partes'}</small></button>)}</div><div className="setting-row">{hasGoals && <Stepper label="GOLES PARA GANAR" value={goalLimit} suffix="GOLES" onChange={setGoalLimit} min={1} max={20} />}{hasTime && <Stepper label="DURACIÓN DE CADA PARTE" value={halfDurationMinutes} suffix="MIN" onChange={setHalfDurationMinutes} min={1} max={30} />}</div><div className="screen-actions"><button type="button" className="secondary-action" onClick={onBack}>VOLVER</button><button type="button" className="primary-action" onClick={() => onContinue({ mode, victoryCondition, goalLimit, halfDurationMinutes })}>SELECCIONAR JUGADORES ›</button></div></section>
}
function Stepper({ label, value, suffix, onChange, min, max }: { label: string; value: number; suffix: string; onChange: (value: number) => void; min: number; max: number }) { return <div className="stepper"><span>{label}</span><div><button type="button" aria-label={`Reducir ${label}`} onClick={() => onChange(Math.max(min, value - 1))}>−</button><strong>{value}<small>{suffix}</small></strong><button type="button" aria-label={`Aumentar ${label}`} onClick={() => onChange(Math.min(max, value + 1))}>+</button></div></div> }

export function PlayerSelectionScreen({ availablePlayers, testMode, onStart, onBack }: { availablePlayers: Player[]; testMode: boolean; onStart: (players: Player[]) => void; onBack: () => void }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectable = availablePlayers.filter(p => p.active)
  const selected = selectedIds.map(id => selectable.find(p => p.id === id)).filter((p): p is Player => Boolean(p))
  const select = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : current.length < 4 ? [...current, id] : current)
  return <section className="player-selection screen-stack">
    <header className="screen-heading"><p className="eyebrow">{testMode ? 'MODO PRUEBA · SIN GUARDADO' : 'JUGADORES ACTIVOS · 1V1 O 2V2'}</p><h1>SELECCIONAR JUGADORES</h1></header>
    <div className="team-slots">{[0, 1, 2, 3].map(index => <span key={index} className={index % 2 === 0 ? 'white-slot' : 'blue-slot'}>{index % 2 === 0 ? 'BLANCO' : 'AZUL'} {Math.floor(index / 2) + 1}<b>{selected[index]?.nickname || selected[index]?.name || '—'}</b></span>)}</div>
    <div className="player-grid selection-grid scroll-panel">{selectable.length === 0 ? <p>Crea jugadores en AJUSTES → JUGADORES.</p> : selectable.map(player => <button type="button" key={player.id} aria-pressed={selectedIds.includes(player.id)} className={'player-card ' + (selectedIds.includes(player.id) ? 'selected' : '')} onClick={() => select(player.id)}><span className="player-number">{selectedIds.includes(player.id) ? selectedIds.indexOf(player.id) + 1 : '＋'}</span><span className="player-avatar" style={{ '--avatar-tint': '#80b9ee' } as CSSProperties}>{player.name[0]}</span><strong>{player.nickname || player.name}</strong><small>NIVEL {player.level}</small></button>)}</div>
    <div className="screen-actions"><button type="button" className="secondary-action" onClick={onBack}>VOLVER</button><button type="button" className="primary-action" disabled={selected.length !== 2 && selected.length !== 4} onClick={() => onStart(selected)}>COMENZAR {selected.length === 4 ? '2V2' : '1V1'} ›</button></div>
  </section>
}

export function MatchFlow({ state, engine, input, players, onNewMatch, saveMessage, canLeave, onRetry }: { state: Readonly<MatchState>; engine: MatchEngine; input: MatchInput; players: Player[]; onNewMatch: () => void; saveMessage: string; canLeave: boolean; onRetry: () => void }) {
  if (state.status === 'PENALTIES') return <PenaltyScreen state={state} input={input} />
  if (state.status === 'PERIOD_END') return <PeriodEndScreen state={state} engine={engine} />
  if (state.status === 'MATCH_END') return <MatchEndScreen state={state} onNewMatch={onNewMatch} saveMessage={saveMessage} canLeave={canLeave} onRetry={onRetry} />
  return <MatchBoard state={state} engine={engine} input={input} players={players} />
}

function MatchBoard({ state, engine, input, players }: { state: Readonly<MatchState>; engine: MatchEngine; input: MatchInput; players: Player[] }) {
  const singleGoalMatch = state.config?.rulesVersion === 2 && state.config.victoryCondition === 'GOALS'
  const untimedPeriod = state.config?.victoryCondition === 'GOALS' && state.period !== 'EXTRA_TIME'
  const period = singleGoalMatch ? `ÚNICA PARTE · PRIMERO A ${state.config!.goalLimit} GOLES` : state.period === 'FIRST_HALF' ? '1ª PARTE' : state.period === 'SECOND_HALF' ? '2ª PARTE' : 'PRÓRROGA · GOL DE ORO'; const matchType = state.config?.mode === 'QUICK' ? 'RÁPIDO' : state.config?.mode === 'CHAOS' ? 'CAOS' : 'CLASIFICATORIO'
  return <section className="match-board" onClick={() => state.status === 'COUNTDOWN' && engine.skipCountdown()}>
    <div className="match-meta"><span>{period}{state.config?.rulesVersion !== 2 && state.config?.victoryCondition === 'GOALS' ? ' · REGLAS ANTERIORES' : ''}</span><span>PARTIDO {matchType}</span></div>
    <div className="score-layout">
      <ScoreButton team="BLANCO" score={state.whiteGoals} disabled={state.goalInputLocked || state.status !== 'PLAYING'} onClick={() => input.emit('GOL_BLANCO')} />
      <div className="clock-panel"><span>{untimedPeriod ? 'TIEMPO JUGADO' : 'TIEMPO'}</span><strong>{formatClock(untimedPeriod ? state.elapsedSeconds : state.remainingSeconds)}</strong>{state.goalInputLocked && state.status === 'PLAYING' && <small>BLOQUEO {Math.ceil(state.goalLockRemainingMs / 1_000)}S</small>}</div>
      <ScoreButton team="AZUL" score={state.blueGoals} disabled={state.goalInputLocked || state.status !== 'PLAYING'} onClick={() => input.emit('GOL_AZUL')} />
    </div>
    <div className="match-bottom">
      <div className="team-line white-line"><button type="button" className="minus-score" aria-label="Quitar gol blanco" onClick={() => input.emit('QUITAR_GOL_BLANCO')}>−1</button><PlayerMini player={players[0]} /><PlayerMini player={players[2]} /></div>
      <div className="board-controls"><button type="button" onClick={() => input.emit('DESHACER')}>DESHACER</button><button type="button" onClick={() => input.emit(state.status === 'PAUSED' ? 'CONTINUAR' : 'PAUSA')}>{state.status === 'PAUSED' ? 'CONTINUAR' : 'PAUSA'}</button></div>
      <div className="team-line blue-line"><PlayerMini player={players[1]} /><PlayerMini player={players[3]} /><button type="button" className="minus-score" aria-label="Quitar gol azul" onClick={() => input.emit('QUITAR_GOL_AZUL')}>−1</button></div>
    </div>
    {state.status === 'PAUSED' && <div className="pause-overlay">PAUSA <button type="button" onClick={() => input.emit('CONTINUAR')}>CONTINUAR</button></div>}
    {state.status === 'COUNTDOWN' && <button type="button" className="countdown-overlay" onClick={() => engine.skipCountdown()}><span>PREPARADOS</span><strong>{state.countdownValue}</strong><small>TOCA PARA SALTAR</small></button>}
    <GoalEffectOverlay active={state.status === 'PLAYING' && state.goalLockRemainingMs > 0} effect={state.lastGoal?.effect} goalId={state.lastGoal?.id} />
    {import.meta.env.DEV && <DeveloperControls input={input} />}
  </section>
}
function ScoreButton({ team, score, disabled, onClick }: { team: string; score: number; disabled: boolean; onClick: () => void }) { return <button type="button" className={`giant-score ${team === 'BLANCO' ? 'white-score' : 'blue-score'}`} style={{ '--score-fit': Math.max(1, String(score).length / 2) } as CSSProperties} disabled={disabled} onClick={onClick}><span>{team}</span><strong>{score}</strong><small>TOCAR PARA GOL</small></button> }
function PlayerMini({ player }: { player?: Player }) { return player ? <div className="player-mini"><i style={{ '--avatar-tint': '#80b9ee' } as CSSProperties}>{player.name[0]}</i><span>{player.nickname || player.name}</span></div> : <div className="player-mini empty">—</div> }
function GoalEffectOverlay({ active, effect, goalId }: { active: boolean; effect?: GoalEffect; goalId?: string }) { const [visible, setVisible] = useState(false); useEffect(() => { if (!goalId || !active) { setVisible(false); return }; setVisible(true); const timer = window.setTimeout(() => setVisible(false), 1_200); return () => window.clearTimeout(timer) }, [active, goalId]); return visible ? <div className={`goal-effect effect-${effect}`}><b>¡GOL!</b><span /><span /><span /><span /><span /></div> : null }
function PeriodEndScreen({ state, engine }: { state: Readonly<MatchState>; engine: MatchEngine }) {
  const extra = state.period === 'EXTRA_TIME'
  return <section className="result-screen"><p className="eyebrow">TIEMPO DE REORGANIZARSE</p><h1>{extra ? 'FINAL DE LA PRÓRROGA' : 'FINAL DE LA ' + (state.period === 'FIRST_HALF' ? '1ª PARTE' : '2ª PARTE')}</h1><ResultScore state={state} /><button type="button" className="primary-action large-action" onClick={() => engine.continueToNextPeriod()}>{extra ? 'IR A PENALTIS ›' : state.period === 'FIRST_HALF' ? 'CONTINUAR 2ª PARTE ›' : state.whiteGoals === state.blueGoals ? 'IR A PRÓRROGA ›' : 'VER RESULTADO ›'}</button></section>
}
function MatchEndScreen({ state, onNewMatch, saveMessage, canLeave, onRetry }: { state: Readonly<MatchState>; onNewMatch: () => void; saveMessage: string; canLeave: boolean; onRetry: () => void }) {
  const penalty = state.penalty
  const white = penalty?.whiteGoals ?? state.whiteGoals
  const blue = penalty?.blueGoals ?? state.blueGoals
  const winner = white === blue ? 'EMPATE' : white > blue ? 'GANA BLANCO' : 'GANA AZUL'
  return <section className="result-screen final-result"><p className="eyebrow">PARTIDA COMPLETADA</p><h1>FINAL DEL PARTIDO</h1><ResultScore state={state} />{penalty && <p className="penalty-summary">PENALTIS · BLANCO {penalty.whiteGoals} — {penalty.blueGoals} AZUL</p>}<h2>{winner}</h2><p className="result-summary" role="status">{saveMessage || 'Preparando resultado…'}</p><div className="result-actions"><button type="button" className="primary-action" disabled={!canLeave} onClick={onNewMatch}>NUEVO PARTIDO</button><button type="button" className="secondary-action" onClick={onRetry}>REINTENTAR GUARDADO</button></div></section>
}
function ResultScore({ state }: { state: Readonly<MatchState> }) { return <div className="result-score"><span>BLANCO <b>{state.whiteGoals}</b></span><em>—</em><span><b>{state.blueGoals}</b> AZUL</span></div> }
function PenaltyScreen({ state, input }: { state: Readonly<MatchState>; input: MatchInput }) { const penalty = state.penalty!; return <section className="penalty-screen"><header className="screen-heading"><p className="eyebrow">DEFINICIÓN</p><h1>PENALTIS</h1><p>{penalty.suddenDeath ? 'MUERTE SÚBITA' : '5 LANZAMIENTOS POR EQUIPO'}</p></header><div className="penalty-score"><PenaltyColumn team="BLANCO" score={penalty.whiteGoals} attempts={penalty.whiteAttempts} disabled={penalty.whiteAttempts !== penalty.blueAttempts} onGoal={() => input.emit('PENALTI_BLANCO_GOL')} onMiss={() => input.emit('PENALTI_BLANCO_FALLO')} /><span>VS</span><PenaltyColumn team="AZUL" score={penalty.blueGoals} attempts={penalty.blueAttempts} disabled={penalty.blueAttempts >= penalty.whiteAttempts} onGoal={() => input.emit('PENALTI_AZUL_GOL')} onMiss={() => input.emit('PENALTI_AZUL_FALLO')} /></div></section> }
function PenaltyColumn({ team, score, attempts, disabled, onGoal, onMiss }: { team: string; score: number; attempts: number; disabled: boolean; onGoal: () => void; onMiss: () => void }) { return <div className={`penalty-column ${team === 'BLANCO' ? 'white-penalty' : 'blue-penalty'}`}><span>{team}</span><strong>{score}</strong><small>{attempts} / 5 LANZAMIENTOS</small><div><button type="button" disabled={disabled} onClick={onGoal}>GOL</button><button type="button" disabled={disabled} onClick={onMiss}>FALLO</button></div></div> }
function DeveloperControls({ input }: { input: MatchInput }) { return <details className="developer-controls"><summary>SIMULACIÓN</summary><div>{([['GOL B', 'GOL_BLANCO'], ['GOL A', 'GOL_AZUL'], ['DESHACER', 'DESHACER'], ['PAUSA', 'PAUSA'], ['CONT.', 'CONTINUAR'], ['FIN PARTE', 'FINALIZAR_PARTE'], ['PRÓRROGA', 'FORZAR_PRORROGA'], ['PENALTIS', 'FORZAR_PENALTIS']] as const).map(([label, event]) => <button type="button" key={event} onClick={() => input.emit(event)}>{label}</button>)}</div></details> }
function formatClock(totalSeconds: number): string { return `${Math.floor(totalSeconds / 60).toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}` }
