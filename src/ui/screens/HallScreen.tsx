import { useState } from 'react'
import { buildHall, formatRecord, type HonoursRepository } from '../../honours/model'
import { useHonours } from '../../honours/useHonours'

export function HallScreen({ repository, userId, online, revision, onBack, onProfile }: {
  repository: HonoursRepository | null; userId: string | null; online: boolean; revision: string | null
  onBack: () => void; onProfile: (id: string) => void
}) {
  const [version,setVersion] = useState(0)
  const review = useHonours(repository,userId,online,`${version}:${revision ?? ''}`)
  const hall = review.snapshot ? buildHall(review.snapshot) : null
  return <section className="data-screen hall-screen">
    <header className="data-heading"><h1>HALL OF FAME PRIVADO</h1><button type="button" onClick={onBack}>HISTORIAL</button></header>
    <div className="scroll-panel hall-content">
      {hall ? <div className="achievement-cards">{hall.map(record => <article className="achievement-card" key={record.id} data-record={record.id}>
        <h2>{record.title}</h2><p>{formatRecord(record)}</p>
        {record.leaders.map(player => <button type="button" key={player.id} onClick={() => onProfile(player.id)} aria-label={`Ver perfil de ${player.nickname || player.name}`}>
          {player.nickname || player.name} · {player.active ? 'ACTIVO' : 'INACTIVO'}
        </button>)}
        {record.leaders.length > 1 && <p>Marca compartida · {record.leaders.length} jugadores</p>}
      </article>)}</div> : <p role={review.error ? 'alert' : 'status'}>{review.status}</p>}
      <p className="statistics-note">Solo jugadores de tu cuenta, incluidos inactivos. Todos los empates comparten récord. Goles de equipo; porcentaje con mínimo 20 partidos. Los récords conceden 0 XP.</p>
    </div>
    <div className="panel-toolbar"><button type="button" disabled={!userId || !online || !repository || !review.snapshot && !review.error} onClick={() => setVersion(v => v+1)}>ACTUALIZAR HALL</button></div>
  </section>
}
