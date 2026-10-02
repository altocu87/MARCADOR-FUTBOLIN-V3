import { useEffect, useState } from 'react'
import type { MatchMode, Team } from '../../match-engine/types'
import type { MatchRepository } from '../../services/persistence/MatchRepository'
import type { MatchSummary, Player } from '../../services/persistence/models'
import { participantsFor } from '../../services/persistence/mapMatch'
import { loadPlayerMatches } from '../../statistics/loadPlayerStatistics'
import { directEvidence, rankedForm } from '../../statistics/competitiveAnalysis'
import { emptyAnalysisFilter } from '../../statistics/playerAnalysis'
import { errorMessage } from '../../app/useData'

export function PreMatchAnalysis({ players, soloTeam, mode, repository, online }: {
  players: Player[]; soloTeam: Team; mode: MatchMode; repository: MatchRepository | null; online: boolean
}) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<MatchSummary[] | null>(null)
  const [message, setMessage] = useState('')
  // Stable identity key prevents re-reading on unrelated selection renders.
  const ids = players.map(p => p.id).join(',')
  useEffect(() => {
    setHistory(null); setMessage('')
    if (!open) return
    if (!online || !repository) { setMessage('Conecta e inicia sesión para consultar el historial confirmado. Puedes comenzar igualmente.'); return }
    const controller = new AbortController()
    void Promise.all(ids.split(',').map(id => loadPlayerMatches(repository, id, controller.signal))).then(pages => {
      if (!controller.signal.aborted) {
        const complete = pages.flat()
        // Validate before setting data: never show partial/conflicting evidence.
        for (const id of ids.split(',')) rankedForm(complete, id)
        setHistory(complete)
      }
    }).catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)) })
    return () => controller.abort()
  }, [open, ids, repository, online])
  const participants = participantsFor(players, soloTeam)
  const own = participants.filter(p => p.team === 'WHITE').map(p => p.player_id)
  const rival = participants.filter(p => p.team === 'BLUE').map(p => p.player_id)
  const evidence = online && history ? directEvidence(history, own, rival, { ...emptyAnalysisFilter, mode }).totals : null
  return <details className="prematch-analysis" open={open} onToggle={e => setOpen(e.currentTarget.open)}>
    <summary>VER ENFRENTAMIENTOS Y FORMA</summary>
    <div className="prematch-analysis-body" aria-label="Análisis previo">
      {evidence && history ? <><p>Blanco contra Azul · {evidence.played} enfrentamientos confirmados en este modo · {evidence.wins} victorias blancas / {evidence.draws} empates / {evidence.losses} victorias azules.</p>
        {players.map(player => <p key={player.id}>{player.nickname || player.name} · últimos cinco Clasificatorios: {rankedForm(history, player.id).map(r => r.outcome === 'WIN' ? 'G' : r.outcome === 'LOSS' ? 'P' : 'E').join(' ') || 'Sin historial'}</p>)}
        <p>G: victoria · P: derrota · E: empate. Parejas exactas. Análisis descriptivo, sin pronóstico.</p>
      </> : <p role={message ? 'alert' : 'status'}>{message || 'Consultando todos los resultados confirmados…'}</p>}
    </div>
  </details>
}
