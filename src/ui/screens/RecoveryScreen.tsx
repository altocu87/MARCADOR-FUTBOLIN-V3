import { participantsFor } from '../../services/persistence/mapMatch'
import type { ActiveMatchCopy } from '../../services/persistence/ActiveMatchStore'

export function RecoveryScreen({ copy, onRecover, onDiscard }: { copy: ActiveMatchCopy; onRecover: () => void; onDiscard: () => void }) {
  const state = copy.checkpoint.state
  const singleGoalMatch = state.config?.rulesVersion === 2 && state.config.victoryCondition === 'GOALS'
  const period = singleGoalMatch ? `POR GOLES · PRIMERO A ${state.config!.goalLimit} GOLES` : state.period === 'FIRST_HALF' ? '1ª PARTE' : state.period === 'SECOND_HALF' ? '2ª PARTE' : state.period === 'EXTRA_TIME' ? 'PRÓRROGA' : 'PENALTIS'
  return <section className="result-screen recovery-screen">
    <p className="eyebrow">COPIA LOCAL EN ESTE DISPOSITIVO</p>
    <h1>PARTIDO POR RECUPERAR</h1>
    <p className="recovery-meta">{period} · {Math.floor(state.elapsedSeconds / 60)}:{String(state.elapsedSeconds % 60).padStart(2, '0')} JUGADOS</p>
    <div className="result-score"><span>BLANCO <b>{state.whiteGoals}</b></span><em>—</em><span><b>{state.blueGoals}</b> AZUL</span></div>
    <p className="recovery-players">{participantsFor(copy.players, state.config?.soloTeam).map(p => `${p.team === 'WHITE' ? 'B' : 'A'}: ${p.player_name}`).join(' · ')}</p>
    <p className="result-summary">No se ha sumado tiempo mientras la aplicación estuvo cerrada.</p>
    <button type="button" className="primary-action large-action" onClick={onRecover}>{state.status === 'MATCH_END' ? 'RECUPERAR RESULTADO' : 'RECUPERAR PARTIDO'}</button>
    {state.status !== 'MATCH_END' && <button type="button" className="discard-match-action" onClick={onDiscard}>DESCARTAR PARTIDO</button>}
    <small>El juego activo se recupera en pausa. Pulsa CONTINUAR cuando estés listo.</small>
  </section>
}
