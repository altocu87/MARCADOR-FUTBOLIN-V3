import type { ProgressionRepository } from '../../services/persistence/ProgressionRepository'
import { ProgressionPanel } from '../components/ProgressionPanel'
import type { CompetitionRepository } from '../../services/persistence/CompetitionRepository'
import { CompetitionPanel } from '../components/CompetitionPanel'
import { useEffect, useMemo, useState } from 'react'
import type { MatchRepository } from '../../services/persistence/MatchRepository'
import type { Player } from '../../services/persistence/models'
import { loadPlayerMatches } from '../../statistics/loadPlayerStatistics'
import { analyzePlayerResults, emptyAnalysisFilter, preparePlayerResults, validateAnalysisFilter, type AnalysisFilter, type PlayerResult } from '../../statistics/playerAnalysis'
import { errorMessage } from '../../app/useData'
import { HistoryScreen } from './HistoryScreen'
import { CompetitiveAnalysis } from '../components/CompetitiveAnalysis'
import { AnalysisDetails } from '../components/AnalysisDetails'

export function StatisticsScreen({ repository, players, userId, online, initialPlayerId, onBack, playersLoading, dataMessage, dataRevision = null, progressionRepository = null, competitionRepository = null }: {
  competitionRepository?: CompetitionRepository | null
  dataRevision?: string | null
  progressionRepository?: ProgressionRepository | null
  repository: MatchRepository | null; players: Player[]; userId: string | null; online: boolean
  initialPlayerId: string | null; onBack: () => void
  playersLoading: boolean; dataMessage: string
}) {
  const [selectedId, setSelectedId] = useState(initialPlayerId)
  const [search, setSearch] = useState('')
  const player = players.find(p => p.id === selectedId)
  if (userId && player) return <PlayerProfile competitionRepository={competitionRepository} dataRevision={dataRevision} progressionRepository={progressionRepository} key={player.id} player={player} players={players} userId={userId} repository={repository} online={online} onBack={() => setSelectedId(null)} />
  const query = search.trim().toLocaleLowerCase('es')
  const filtered = players.filter(p => `${p.name} ${p.nickname ?? ''}`.toLocaleLowerCase('es').includes(query))
  return <section className="data-screen statistics-screen">
    <header className="data-heading"><h1>ESTADÍSTICAS</h1><button type="button" onClick={onBack}>HISTORIAL</button></header>
    {!userId ? <div className="empty-state">Inicia sesión en AJUSTES para consultar tus jugadores.</div> : <>
      <label className="player-search">Buscar jugador<input type="search" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar jugador" /></label>
      <div className="scroll-panel statistics-players">{filtered.length ? filtered.map(p => <button type="button" key={p.id} onClick={() => setSelectedId(p.id)}><strong>{p.nickname || p.name}</strong><span>{p.nickname ? p.name + ' · ' : ''}{p.active ? 'ACTIVO' : 'INACTIVO'} · VER PERFIL</span></button>) : <p>{playersLoading ? 'Cargando jugadores…' : players.length ? 'No hay jugadores que coincidan.' : dataMessage || 'Crea jugadores en AJUSTES → JUGADORES.'}</p>}</div>
      <p className="statistics-note">Datos privados. También se conservan los perfiles de jugadores inactivos.</p>
    </>}
  </section>
}

function PlayerProfile({ player, players, userId, repository, online, onBack, progressionRepository, competitionRepository, dataRevision }: {
  competitionRepository: CompetitionRepository | null
  player: Player; userId: string; repository: MatchRepository | null; online: boolean; onBack: () => void
  dataRevision: string | null
  progressionRepository: ProgressionRepository | null
  players: readonly Player[]
}) {
  const [results, setResults] = useState<PlayerResult[] | null>(null)
  const [history, setHistory] = useState(false)
  const [filter, setFilter] = useState<AnalysisFilter>(emptyAnalysisFilter)
  const [draft, setDraft] = useState<AnalysisFilter>(emptyAnalysisFilter)
  const [filterError, setFilterError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    setResults(null); setHistory(false); setMessage(''); setBusy(false)
    if (!online || !repository) { setMessage('SIN CONEXIÓN O SESIÓN POR VERIFICAR · Las estadísticas necesitan consultar todos los resultados guardados.'); return }
    const controller = new AbortController()
    setBusy(true)
    void loadPlayerMatches(repository, player.id, controller.signal).then(value => {
      if (!controller.signal.aborted) setResults(preparePlayerResults(value, player.id))
    }).catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [repository, player.id, online, version, dataRevision])
  const analysis = useMemo(() => results ? analyzePlayerResults(results, player.id, filter) : null, [results, player.id, filter])
  const stats = analysis?.totals
  const filtered = Object.keys(filter).some(key => filter[key as keyof AnalysisFilter] !== emptyAnalysisFilter[key as keyof AnalysisFilter])
  const filterLabel = `${filter.from || 'inicio'} → ${filter.to || 'sin límite final'} · ${filter.mode === 'ALL' ? 'todos los modos' : filter.mode === 'QUICK' ? 'Rápido' : filter.mode === 'CHAOS' ? 'Caos' : 'Clasificatorio'} · ${filter.format === 'ALL' ? '1v1, 1v2 y 2v2' : filter.format}`
  if (history) return <HistoryScreen players={players} repository={repository} userId={userId} online={online} playerId={player.id} playerName={player.nickname || player.name} filteredMatches={analysis?.matches ?? []} filterLabel={filterLabel} onBack={() => setHistory(false)} />
  const metrics = stats ? [
    ['PARTIDOS', stats.played], ['VICTORIAS', stats.wins], ['DERROTAS', stats.losses], ['EMPATES', stats.draws],
    ['VICTORIAS %', stats.winRate.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%'],
    ['GOLES A FAVOR', stats.goalsFor], ['GOLES EN CONTRA', stats.goalsAgainst], ['DIFERENCIA', stats.goalDifference],
  ] as const : []
  return <section className="data-screen profile-screen">
    <header className="data-heading"><h1>PERFIL DEL JUGADOR</h1><button type="button" onClick={onBack}>JUGADORES</button></header>
    <div className="scroll-panel profile-content">
      <div className="profile-identity"><div className="profile-avatar" aria-hidden="true">{player.name[0]}{player.photoUrl?.startsWith('https://') && <img src={player.photoUrl} alt="" referrerPolicy="no-referrer" onError={event => { event.currentTarget.hidden = true }} />}</div><div><h2>{player.nickname || player.name}</h2>{player.nickname && <p>{player.name}</p>}<span>{player.active ? 'ACTIVO' : 'INACTIVO · HISTORIAL CONSERVADO'}</span></div></div>
      <ProgressionPanel repository={progressionRepository} playerId={player.id} online={online} revision={`${version}:${dataRevision ?? ""}`} />
      <CompetitionPanel repository={competitionRepository} playerId={player.id} online={online} revision={`${version}:${dataRevision ?? ""}`} />
      <details className="analysis-filters" open={filtersOpen} onToggle={event => setFiltersOpen(event.currentTarget.open)}><summary>FILTRAR ANÁLISIS</summary><form onSubmit={event => { event.preventDefault(); try { validateAnalysisFilter(draft); setFilter({ ...draft }); setFilterError('') } catch (error) { setFilterError(errorMessage(error)) } }}>
        <label>Desde<input type="date" value={draft.from} onChange={e => setDraft(value => ({ ...value, from: e.target.value }))} /></label>
        <label>Hasta<input type="date" value={draft.to} onChange={e => setDraft(value => ({ ...value, to: e.target.value }))} /></label>
        <label>Modalidad<select aria-label="Modalidad" value={draft.mode} onChange={e => setDraft(value => ({ ...value, mode: e.target.value as AnalysisFilter['mode'] }))}><option value="ALL">Todas</option><option value="QUICK">Rápido</option><option value="CHAOS">Caos</option><option value="RANKED">Clasificatorio</option></select></label>
        <label>Formato<select aria-label="Formato" value={draft.format} onChange={e => setDraft(value => ({ ...value, format: e.target.value as AnalysisFilter['format'] }))}><option value="ALL">1v1, 1v2 y 2v2</option><option value="1v1">1v1</option><option value="1v2">1v2 · Rápido/Caos</option><option value="2v2">2v2</option></select></label>
        <div className="panel-toolbar"><button type="submit">APLICAR FILTROS</button><button type="button" onClick={() => { setFilter(emptyAnalysisFilter); setDraft(emptyAnalysisFilter); setFilterError('') }}>QUITAR FILTROS</button></div>
        <p className="statistics-note">Fechas inclusivas en la zona horaria de este dispositivo. Los cambios se aplican al pulsar APLICAR FILTROS.</p>{filterError && <p role="alert" className="notice">{filterError}</p>}
      </form></details>
      {filtered && <p className="analysis-scope" role="status">FILTRO APLICADO · {filterLabel}</p>}
      {online && stats && analysis ? <><dl className="statistics-grid">{metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{stats.played === 0 && <p>{filtered ? 'No hay partidos que coincidan con estos filtros.' : 'No hay partidos guardados para este jugador.'}</p>}<AnalysisDetails analysis={analysis} players={players} /><CompetitiveAnalysis results={results!} playerId={player.id} players={players} filter={filter} /></> : <p role={message ? 'alert' : 'status'}>{busy ? 'Calculando todos los partidos guardados…' : message || 'Preparando consulta…'}</p>}
      <p className="statistics-note">Los goles son de su equipo, no goles individuales. Los penaltis deciden la victoria pero no se suman a los goles. Partidos de prueba y pendientes de sincronización no cuentan.</p>
    </div>
    <div className="panel-toolbar profile-actions"><button type="button" disabled={busy || !online || !analysis} onClick={() => setHistory(true)}>VER HISTORIAL DEL JUGADOR</button><button type="button" disabled={busy || !online} onClick={() => setVersion(v => v + 1)}>ACTUALIZAR</button></div>
  </section>
}
