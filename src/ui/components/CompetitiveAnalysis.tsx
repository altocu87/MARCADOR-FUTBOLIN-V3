import { useMemo, useState } from 'react'
import type { Player } from '../../services/persistence/models'
import type { AnalysisFilter, PlayerResult } from '../../statistics/playerAnalysis'
import { evidenceFromResults, matchups } from '../../statistics/competitiveAnalysis'

const outcomes = { WIN: 'VICTORIA', LOSS: 'DERROTA', DRAW: 'EMPATE' }
/** Reuses the profile's complete confirmed read; no extra queries or forecasts. */
export function CompetitiveAnalysis({ results, playerId, players, filter }: {
  results: readonly PlayerResult[]; playerId: string; players: readonly Player[]; filter: AnalysisFilter
}) {
  const options = useMemo(() => matchups(results, playerId), [results, playerId])
  const [selected, setSelected] = useState('')
  const pair = options.find(p => p.key === selected) ?? options[0]
  const names = useMemo(() => {
    const map = new Map<string, string>()
    for (const result of results) for (const p of result.match.participants) map.set(p.player_id, p.player_name)
    for (const p of players) map.set(p.id, p.nickname || p.name)
    return map
  }, [results, players])
  const name = (id: string) => names.get(id) ?? 'Jugador'
  const evidence = pair ? evidenceFromResults(results, pair.own, pair.rival, filter) : null
  const form = results.filter(r => r.match.match_type === 'RANKED').slice(-5).reverse()
  return <section className="competitive-analysis" aria-label="Enfrentamientos y forma">
    <h3>ENFRENTAMIENTOS DIRECTOS</h3>
    <p className="statistics-note">Jugador o pareja exacta contra sus rivales. Cambiar compañero crea otro enfrentamiento. Se aplican los filtros del análisis.</p>
    {pair ? <><label>Enfrentamiento<select aria-label="Enfrentamiento" value={pair.key} onChange={e => setSelected(e.target.value)}>
      {options.map(p => <option key={p.key} value={p.key}>{p.own.map(name).join(' + ')} contra {p.rival.map(name).join(' + ')} · {p.own.length}v{p.rival.length}</option>)}
    </select></label><p className="statistics-note">{pair.own.map(name).join(' + ')} contra {pair.rival.map(name).join(' + ')} · {pair.own.length}v{pair.rival.length}</p><p role="status">{evidence!.totals.played} enfrentamientos confirmados · {evidence!.totals.wins} victorias · {evidence!.totals.draws} empates · {evidence!.totals.losses} derrotas</p>
      {evidence!.totals.played ? <p>Goles del equipo: {evidence!.totals.goalsFor} a favor / {evidence!.totals.goalsAgainst} en contra.</p> : <p>No hay enfrentamientos que coincidan con los filtros.</p>}
    </> : <p>No hay enfrentamientos guardados para este jugador.</p>}
    <h3>FORMA CLASIFICATORIA · ÚLTIMOS CINCO</h3>
    <p className="statistics-note">Historial Clasificatorio completo, independiente de los filtros. Más reciente primero · {form.length}/5.</p>
    {form.length ? <ol className="competitive-form">{form.map(r => <li key={r.match.id}><strong>{outcomes[r.outcome]}</strong> · {r.goalsFor}–{r.goalsAgainst}{r.match.went_to_penalties ? ' · penaltis' : ''} · <time dateTime={r.match.finished_at}>{new Date(r.match.finished_at).toLocaleDateString('es-ES')}</time></li>)}</ol> : <p>Sin Clasificatorios confirmados.</p>}
    <p className="statistics-note">Análisis descriptivo. No se calculan pronósticos ni probabilidades de victoria.</p>
  </section>
}
