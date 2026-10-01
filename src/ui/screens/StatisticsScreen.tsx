import { useEffect, useState } from 'react'
import type { MatchRepository } from '../../services/persistence/MatchRepository'
import type { Player } from '../../services/persistence/models'
import { loadPlayerStatistics } from '../../statistics/loadPlayerStatistics'
import type { PlayerStatistics } from '../../statistics/playerStatistics'
import { errorMessage } from '../../app/useData'
import { HistoryScreen } from './HistoryScreen'

export function StatisticsScreen({ repository, players, userId, online, initialPlayerId, onBack, playersLoading, dataMessage }: {
  repository: MatchRepository | null; players: Player[]; userId: string | null; online: boolean
  initialPlayerId: string | null; onBack: () => void
  playersLoading: boolean; dataMessage: string
}) {
  const [selectedId, setSelectedId] = useState(initialPlayerId)
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState(false)
  const player = players.find(p => p.id === selectedId)
  if (userId && player) return history
    ? <HistoryScreen key={player.id} repository={repository} userId={userId} online={online} playerId={player.id} playerName={player.nickname || player.name} onBack={() => setHistory(false)} />
    : <PlayerProfile key={player.id} player={player} repository={repository} online={online} onBack={() => setSelectedId(null)} onHistory={() => setHistory(true)} />
  const query = search.trim().toLocaleLowerCase('es')
  const filtered = players.filter(p => `${p.name} ${p.nickname ?? ''}`.toLocaleLowerCase('es').includes(query))
  return <section className="data-screen statistics-screen">
    <header className="data-heading"><h1>ESTADÍSTICAS</h1><button type="button" onClick={onBack}>HISTORIAL</button></header>
    {!userId ? <div className="empty-state">Inicia sesión en AJUSTES para consultar tus jugadores.</div> : <>
      <label className="player-search">Buscar jugador<input type="search" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar jugador" /></label>
      <div className="scroll-panel statistics-players">{filtered.length ? filtered.map(p => <button type="button" key={p.id} onClick={() => { setSelectedId(p.id); setHistory(false) }}><strong>{p.nickname || p.name}</strong><span>{p.nickname ? p.name + ' · ' : ''}{p.active ? 'ACTIVO' : 'INACTIVO'} · VER PERFIL</span></button>) : <p>{playersLoading ? 'Cargando jugadores…' : players.length ? 'No hay jugadores que coincidan.' : dataMessage || 'Crea jugadores en AJUSTES → JUGADORES.'}</p>}</div>
      <p className="statistics-note">Datos privados. También se conservan los perfiles de jugadores inactivos.</p>
    </>}
  </section>
}

function PlayerProfile({ player, repository, online, onBack, onHistory }: {
  player: Player; repository: MatchRepository | null; online: boolean; onBack: () => void; onHistory: () => void
}) {
  const [stats, setStats] = useState<PlayerStatistics | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    setStats(null); setMessage(''); setBusy(false)
    if (!online || !repository) { setMessage('SIN CONEXIÓN O SESIÓN POR VERIFICAR · Las estadísticas necesitan consultar todos los resultados guardados.'); return }
    const controller = new AbortController()
    setBusy(true)
    void loadPlayerStatistics(repository, player.id, controller.signal).then(value => {
      if (!controller.signal.aborted) setStats(value)
    }).catch(error => { if (!controller.signal.aborted) setMessage(errorMessage(error)) })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [repository, player.id, online, version])
  const metrics = stats ? [
    ['PARTIDOS', stats.played], ['VICTORIAS', stats.wins], ['DERROTAS', stats.losses], ['EMPATES', stats.draws],
    ['VICTORIAS %', stats.winRate.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%'],
    ['GOLES A FAVOR', stats.goalsFor], ['GOLES EN CONTRA', stats.goalsAgainst], ['DIFERENCIA', stats.goalDifference],
  ] as const : []
  return <section className="data-screen profile-screen">
    <header className="data-heading"><h1>PERFIL DEL JUGADOR</h1><button type="button" onClick={onBack}>JUGADORES</button></header>
    <div className="scroll-panel profile-content">
      <div className="profile-identity"><div className="profile-avatar" aria-hidden="true">{player.name[0]}{player.photoUrl?.startsWith('https://') && <img src={player.photoUrl} alt="" referrerPolicy="no-referrer" onError={event => { event.currentTarget.hidden = true }} />}</div><div><h2>{player.nickname || player.name}</h2>{player.nickname && <p>{player.name}</p>}<span>{player.active ? 'ACTIVO' : 'INACTIVO · HISTORIAL CONSERVADO'}</span></div></div>
      {online && stats ? <><dl className="statistics-grid">{metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{stats.played === 0 && <p>No hay partidos guardados para este jugador.</p>}</> : <p role={message ? 'alert' : 'status'}>{busy ? 'Calculando todos los partidos guardados…' : message || 'Preparando consulta…'}</p>}
      <p className="statistics-note">Los goles son de su equipo, no goles individuales. Los penaltis deciden la victoria pero no se suman a los goles. Partidos de prueba y pendientes de sincronización no cuentan.</p>
    </div>
    <div className="panel-toolbar profile-actions"><button type="button" onClick={onHistory}>VER HISTORIAL DEL JUGADOR</button><button type="button" disabled={busy || !online} onClick={() => setVersion(v => v + 1)}>ACTUALIZAR</button></div>
  </section>
}
