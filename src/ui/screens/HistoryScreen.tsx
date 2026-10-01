import { useState } from 'react'
import { getMatchWinner } from '../../match-engine/types'
import type { MatchRecord } from '../../services/persistence/LocalRepository'

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' })
const teamNames = (match: MatchRecord, white: boolean) => match.players.filter((_, index) => index % 2 === (white ? 0 : 1)).map((player) => player.name).join(' / ')

export function HistoryScreen({ matches }: { matches: MatchRecord[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = matches.find((match) => match.id === selectedId)
  if (selected) {
    const winner = getMatchWinner(selected.state)
    return <section className="library-screen screen-stack">
      <header className="screen-heading"><p className="eyebrow">{dateFormatter.format(selected.finishedAt)}</p><h1>RESULTADO DEL PARTIDO</h1></header>
      <div className="history-detail scroll-list">
        <div className="history-teams"><div><span>BLANCO</span><strong>{selected.state.whiteGoals}</strong><p>{teamNames(selected, true)}</p></div><div><span>AZUL</span><strong>{selected.state.blueGoals}</strong><p>{teamNames(selected, false)}</p></div></div>
        <p className="history-winner">{winner === null ? 'EMPATE' : winner === 'WHITE' ? 'GANA BLANCO' : 'GANA AZUL'}{selected.state.penalty ? ` · Penaltis ${selected.state.penalty.whiteGoals}–${selected.state.penalty.blueGoals}` : ''}</p>
        <h2>Goles del partido</h2>
        {selected.state.goals.length === 0 ? <p className="empty-message">Sin goles antes de los penaltis.</p> : <ol className="goal-history">{selected.state.goals.map((goal) => <li key={goal.id}><span>{goal.period === 'FIRST_HALF' ? '1ª parte' : goal.period === 'SECOND_HALF' ? '2ª parte' : 'Prórroga'} · {goal.timestamp}</span><strong>{goal.team === 'WHITE' ? 'BLANCO' : 'AZUL'} · {goal.scoreWhite}–{goal.scoreBlue}</strong></li>)}</ol>}
      </div>
      <div className="screen-actions"><button type="button" className="secondary-action" onClick={() => setSelectedId(null)}>VOLVER AL HISTORIAL</button></div>
    </section>
  }
  return <section className="library-screen screen-stack">
    <header className="screen-heading"><p className="eyebrow">PARTIDOS TERMINADOS · ESTE NAVEGADOR</p><h1>HISTORIAL</h1><p>{matches.length} {matches.length === 1 ? 'partido guardado' : 'partidos guardados'}</p></header>
    <div className="history-list scroll-list">
      {matches.length === 0 && <p className="empty-message">Todavía no hay resultados. Los partidos se guardan automáticamente al terminar.</p>}
      {matches.map((match) => <button type="button" key={match.id} className="history-item" onClick={() => setSelectedId(match.id)}>
        <span><small>{dateFormatter.format(match.finishedAt)}</small><strong>{teamNames(match, true)} contra {teamNames(match, false)}</strong></span>
        <span className="history-score">{match.state.whiteGoals}–{match.state.blueGoals}<small>{match.state.penalty ? `PEN. ${match.state.penalty.whiteGoals}–${match.state.penalty.blueGoals}` : 'VER DETALLE ›'}</small></span>
      </button>)}
    </div>
    <p className="local-note">Los datos son locales: no se sincronizan entre dispositivos.</p>
  </section>
}
