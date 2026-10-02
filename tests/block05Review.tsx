import { AchievementCards } from '../src/ui/components/AchievementsPanel'
import { rebuildAchievements } from '../src/achievements/rebuild'
import { useState } from 'react'
import { FixedCanvas } from '../src/ui/layout/FixedCanvas'
import { reviewHonours, type RecordId } from './block05Prototype'
import { eloFixtures, eloPlayers, testEloRules } from './eloFixtures'

const rules = { ...testEloRules, version: 2, marginMultipliers: [1, 1, 1, 1, 1, 1] }
const players = eloPlayers.map((p, i) => ({ ...p, nickname: i === 0 ? 'Alex · fixture' : p.nickname }))
const history = eloFixtures().map(d => ({ ...d.match, participants: d.participants }))
const names: Record<RecordId, string> = {
  most_played: 'Más partidos', most_wins: 'Más victorias', best_streak: 'Mejor racha',
  biggest_margin: 'Mayor diferencia ganadora', most_team_goals: 'Más goles de tu equipo',
  best_win_rate: 'Porcentaje de victorias · mínimo 20', current_elo: 'ELO actual', max_elo: 'Máximo ELO histórico',
}

/** This entry exists only in the isolated fixture, never in production. */
export function Block05Review() {
  const [tab, setTab] = useState<'achievements' | 'records' | 'hall'>('achievements')
  const [playerId, setPlayerId] = useState(players[0].id)
  const [state, setState] = useState<'ready' | 'empty' | 'offline' | 'error'>('ready')
  const [physical, setPhysical] = useState(false)
  const [excluded, setExcluded] = useState(false)
  const data = reviewHonours(players, [{ source: 'confirmed', complete: true, matches: state === 'empty' ? [] : history },
    { source: 'pending', complete: true, matches: excluded ? history : [] }], rules)
  const row = data.rows.find(r => r.player.id === playerId)!
  const displayName = (p: typeof players[number]) => p.nickname || p.name
  const showData = state === 'ready' || state === 'empty'
  return <FixedCanvas mode={physical ? 'physical' : 'adaptive'}>
    <style>{`
      .review05 { height:100%; min-height:0; padding:16px; display:flex; flex-direction:column; gap:12px; color:#eef5ff; }
      .review05 h1 { font-size:24px; margin:0; } .review05 h2 { font-size:18px; margin:0 0 10px; }
      .review05 p { margin:8px 0; } .review05 .body05 { overflow:auto; min-height:0; display:grid; gap:12px; }
      .review05 section { padding:14px; border:1px solid #45728a; border-radius:12px; background:#10202d; }
      .review05 nav { display:flex; flex-wrap:wrap; gap:8px; }
      .review05 button, .review05 select { min-height:48px; padding:8px 14px; font:inherit; font-size:14px; background:#152c42; color:#eef5ff; border:1px solid #45728a; border-radius:8px; }
      .review05 button { cursor:pointer; } .review05 button[aria-pressed=true] { border-color:#00c7f7; background:#124359; }
      .review05 button:focus-visible, .review05 select:focus-visible { outline:3px solid #edb45c; outline-offset:2px; }
      .review05 .muted05 { color:#b6c8d8; font-size:14px; } .review05 .warning05 { color:#ffd991; }
      .review05 .cards05 { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr)); gap:12px; }
      .review05 progress { width:100%; accent-color:#00c7f7; }
      .review05 label { display:flex; flex-direction:column; gap:6px; } .review05 .controls05 { display:flex; flex-wrap:wrap; gap:12px; }
    `}</style>
    <main className="review05">
      <header><h1>Logros, récords y Hall of Fame</h1><p className="warning05">LOGROS POR NIVELES · Datos simulados · Récords en propuesta</p></header>
      <nav aria-label="Secciones de honores">
        <button aria-pressed={tab === 'achievements'} onClick={() => setTab('achievements')}>LOGROS</button>
        <button aria-pressed={tab === 'records'} onClick={() => setTab('records')}>RÉCORDS</button>
        <button aria-pressed={tab === 'hall'} onClick={() => setTab('hall')}>HALL OF FAME</button>
        <button aria-pressed={physical} onClick={() => setPhysical(v => !v)}>VISTA 800×480</button>
      </nav>
      <div className="body05">
        <section className="controls05" aria-label="Controles de revisión">
          <label>Jugador<select aria-label="Jugador" value={playerId} onChange={e => setPlayerId(e.target.value)}>{players.map((p, i) => <option key={p.id} value={p.id}>{i + 1} · {displayName(p)}{p.active ? '' : ' · Baja'}</option>)}</select></label>
          <label>Escenario<select aria-label="Escenario" value={state} onChange={e => setState(e.target.value as typeof state)}>
            <option value="ready">Historial simulado</option><option value="empty">Sin historial</option>
            <option value="offline">Sin conexión</option><option value="error">Lectura incompleta</option>
          </select></label>
          <button aria-pressed={excluded} onClick={() => setExcluded(v => !v)}>AÑADIR PENDIENTES SIMULADOS</button>
        </section>
        {!showData ? <section role="status">{state === 'offline' ? 'Sin conexión. No se confirman logros ni récords.' : 'No se ha cargado el historial completo. No se muestran totales parciales.'}</section> : <>
          <section aria-label="Resumen de propuesta">
            <h2>{tab === 'hall' ? 'Líderes de esta cuenta simulada' : displayName(row.player)}</h2>
            <p className="muted05">{row.player.active ? 'Activo' : 'Baja · conserva historial'} · {row.metrics.played} partidos simulados</p>
            <p data-testid="proposed-xp">XP extraordinario concedido: 0</p>
            <p className="muted05">Prueba y pendientes excluidos. Récords: 0 XP. Goles siempre de equipo.</p>
          </section>
          {tab === 'achievements' && <AchievementCards snapshot={rebuildAchievements({ accountId: 'fixture-account', playerId, source: 'confirmed', complete: true, matches: state === 'empty' ? [] : history })} />}
          {tab === 'records' && <div className="cards05">{row.records.map(r => <section key={r.id}><h2>{names[r.id]}</h2>
            <p>{r.value === null ? 'Datos insuficientes' : r.id === 'best_win_rate' ? `${r.value.toFixed(1)} %` : r.value}</p>
            <p className="muted05">{r.matchIds.length ? `${r.matchIds.length} partido(s) de evidencia` : 'Derivado del historial completo'}</p>
          </section>)}</div>}
          {tab === 'hall' && <div className="cards05">{data.hall.map(r => <section key={r.id} data-record={r.id}><h2>{names[r.id]}</h2>
            {r.value === null ? <p>Datos insuficientes</p> : <><p>{r.id === 'best_win_rate' ? `${r.value.toFixed(1)} %` : r.value} · {r.leaders.length > 1 ? 'Liderazgo compartido' : 'Líder'}</p>
              {r.leaders.map(p => <p key={p.id}>{displayName(p)}{p.active ? '' : ' · Baja'}</p>)}</>}
          </section>)}</div>}
        </>}
      </div>
    </main>
  </FixedCanvas>
}
