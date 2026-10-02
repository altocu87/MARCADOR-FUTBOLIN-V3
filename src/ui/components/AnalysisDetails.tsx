import React, { useMemo } from 'react'
import type { Outcome, PlayerAnalysis } from '../../statistics/playerAnalysis'
import type { Player } from '../../services/persistence/models'
import { createParticipantNameResolver } from '../participantNames'

const outcomeLabel: Record<Outcome, string> = { WIN: 'VICTORIA', LOSS: 'DERROTA', DRAW: 'EMPATE' }
const modeLabel = { QUICK: 'RÁPIDO', CHAOS: 'CAOS', RANKED: 'CLASIFICATORIO' }
const percentage = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%'

export function AnalysisDetails({ analysis, players }: { analysis: PlayerAnalysis; players: readonly Player[] }) {
  const { currentStreak, bestWinStreak, recent, byFormat, evolution } = analysis
  const participantName = useMemo(() => createParticipantNameResolver(players), [players])
  const points = evolution.length <= 60 ? evolution : Array.from({ length: 60 }, (_, i) => evolution[Math.round(i * (evolution.length - 1) / 59)])
  const coordinates = points.map(p => `${evolution.length === 1 ? 160 : 20 + (p.played - 1) / (evolution.length - 1) * 280},${120 - p.winRate}`)
  return <div className="analysis-details">
    <section aria-label="Rachas"><h3>RACHAS DEL PERIODO</h3><dl className="streak-grid"><div><dt>RACHA ACTUAL</dt><dd>{currentStreak.outcome ? `${currentStreak.length} · ${outcomeLabel[currentStreak.outcome]}` : 'SIN PARTIDOS'}</dd></div><div><dt>MEJOR RACHA DE VICTORIAS</dt><dd>{bestWinStreak}</dd></div></dl><p className="statistics-note">Un empate corta las rachas de victorias y derrotas. Se usan únicamente los partidos del filtro aplicado.</p></section>
    <section aria-label="Rendimiento por formato"><h3>RENDIMIENTO 1v1 / 2v2</h3><div className="analysis-table-scroll"><table className="format-table"><caption>Comparación dentro del periodo y modalidad seleccionados</caption><thead><tr><th>Formato</th><th>Partidos</th><th>V</th><th>D</th><th>E</th><th>Victorias %</th><th>GF</th><th>GC</th></tr></thead><tbody>{byFormat.map(({ format, totals }) => <tr key={format}><th scope="row">{format}</th><td>{totals.played}</td><td>{totals.wins}</td><td>{totals.losses}</td><td>{totals.draws}</td><td>{totals.played ? percentage(totals.winRate) : '—'}</td><td>{totals.goalsFor}</td><td>{totals.goalsAgainst}</td></tr>)}</tbody></table></div><p className="statistics-note">V: victorias · D: derrotas · E: empates · GF/GC: goles del equipo a favor/en contra. —: sin partidos.</p></section>
    <section aria-label="Últimos resultados"><h3>ÚLTIMOS 5 RESULTADOS</h3>{recent.length ? <ol className="recent-results">{recent.map(r => <li key={r.match.id}><strong className={`result-${r.outcome.toLowerCase()}`}>{outcomeLabel[r.outcome]} · {r.goalsFor}–{r.goalsAgainst}{r.match.went_to_penalties ? ' · PENALTIS' : r.match.went_to_extra_time ? ' · PRÓRROGA' : ''}</strong><span>{new Date(r.match.finished_at).toLocaleString('es-ES')} · {r.format} · {modeLabel[r.match.match_type]}</span><small>{r.match.participants.map(p => `${p.team === 'WHITE' ? 'B' : 'A'}: ${participantName(p)}`).join(' · ')}</small></li>)}</ol> : <p>Sin resultados en este periodo.</p>}<p className="statistics-note">Del más reciente al más antiguo. El marcador corresponde a tu equipo; se muestra el alias o nombre actual de cada jugador.</p></section>
    <section aria-label="Evolución de victorias"><h3>EVOLUCIÓN DE VICTORIAS</h3>{evolution.length ? <>
      <p>Porcentaje acumulado desde el primer partido del filtro: {percentage(evolution.at(-1)!.winRate)} en {evolution.length} partidos.</p>
      <svg className="victory-trend" viewBox="0 0 320 145" role="img" aria-label={`Porcentaje acumulado de victorias, del más antiguo al más reciente. Inicio ${percentage(evolution[0].winRate)}; final ${percentage(evolution.at(-1)!.winRate)}.`}>
        <text x="2" y="14">100%</text><text x="2" y="138">0%</text><path d="M20 20H300 M20 70H300 M20 120H300" className="trend-grid" /><polyline points={coordinates.join(' ')} className="trend-line" />{points.length === 1 && <circle cx="160" cy={120 - points[0].winRate} r="4" className="trend-dot" />}
      </svg><p className="statistics-note">Eje horizontal: orden de los partidos, no tiempo transcurrido. Cálculo con todos los resultados; gráfico de hasta 60 puntos representativos.</p>
      <details className="evolution-values"><summary>VER ÚLTIMOS 10 VALORES</summary><table><caption>Valores acumulados exactos, desde el inicio del filtro</caption><thead><tr><th>Partido nº</th><th>Fecha</th><th>Victorias %</th></tr></thead><tbody>{evolution.slice(-10).map(p => <tr key={p.id}><th scope="row">{p.played}</th><td>{new Date(p.finishedAt).toLocaleString('es-ES')}</td><td>{percentage(p.winRate)}</td></tr>)}</tbody></table></details>
    </> : <p>Sin partidos para calcular la evolución.</p>}</section>
  </div>
}
