import type { ActiveMatchCopy } from '../../services/persistence/ActiveMatchStore'

export function RecoveryScreen({ copy, onRecover }: { copy: ActiveMatchCopy; onRecover: () => void }) {
  const state = copy.checkpoint.state
  const singleGoalMatch = state.config?.rulesVersion === 2 && state.config.victoryCondition === 'GOALS'
  const period = singleGoalMatch ? `POR GOLES · PRIMERO A ${state.config!.goalLimit} GOLES` : state.period === 'FIRST_HALF' ? '1ª PARTE' : state.period === 'SECOND_HALF' ? '2ª PARTE' : state.period === 'EXTRA_TIME' ? 'PRÓRROGA' : 'PENALTIS'
  return <section className="result-screen recovery-screen">
    <p className="eyebrow">COPIA LOCAL EN ESTE DISPOSITIVO</p>
    <h1>PARTIDO POR RECUPERAR</h1>
    <p className="recovery-meta">{period} · {Math.floor(state.elapsedSeconds / 60)}:{String(state.elapsedSeconds % 60).padStart(2, '0')} JUGADOS</p>
    <div className="result-score"><span>BLANCO <b>{state.whiteGoals}</b></span><em>—</em><span><b>{state.blueGoals}</b> AZUL</span></div>
    <p className="recovery-players">{copy.players.map((p, i) => `${i % 2 === 0 ? 'B' : 'A'}: ${p.nickname || p.name}`).join(' · ')}</p>
    <p className="result-summary">No se ha sumado tiempo mientras la aplicación estuvo cerrada.</p>
    <button type="button" className="primary-action large-action" onClick={onRecover}>{state.status === 'MATCH_END' ? 'RECUPERAR RESULTADO' : 'RECUPERAR PARTIDO'}</button>
    <small>El juego activo se recupera en pausa. Pulsa CONTINUAR cuando estés listo.</small>
  </section>
}
