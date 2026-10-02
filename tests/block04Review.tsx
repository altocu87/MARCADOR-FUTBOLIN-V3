import { useState } from 'react'
import { FixedCanvas } from '../src/ui/layout/FixedCanvas'
import { directEvidence, predictionDraft, rankedForm } from './block04Prototype'
import { eloFixtures, eloPlayers } from './eloFixtures'
import { createParticipantNameResolver } from '../src/ui/participantNames'

const confirmed = eloFixtures().map(d => ({ ...d.match, participants: d.participants }))
const labels = { WIN: 'G', LOSS: 'P', DRAW: 'E' }
const names = new Map(eloPlayers.map(p => [p.id, p.nickname || p.name]))
const participantName = createParticipantNameResolver(eloPlayers)

/** Isolated review screen, never mounted by src/main.tsx or a production build. */
export function Block04Review() {
  const [format, setFormat] = useState<'1v1' | '2v2'>('1v1')
  const [empty, setEmpty] = useState(false)
  const [physical, setPhysical] = useState(false)
  const own = format === '1v1' ? [eloPlayers[0].id] : [eloPlayers[0].id, eloPlayers[2].id]
  const rival = format === '1v1' ? [eloPlayers[1].id] : [eloPlayers[1].id, eloPlayers[3].id]
  const evidence = directEvidence(empty ? [] : confirmed, own, rival)
  const totals = evidence.totals
  return <FixedCanvas mode={physical ? 'physical' : 'adaptive'}>
    <style>{`
      .review04 { height:100%; min-height:0; padding:16px; display:flex; flex-direction:column; gap:12px; color:#eef5ff; }
      .review04 h1 { font-size:24px; margin:0; } .review04 h2 { font-size:18px; margin:0 0 10px; }
      .review04 p { margin:8px 0; } .review04 .review-body { overflow:auto; min-height:0; display:grid; gap:12px; }
      .review04 section { padding:14px; border:1px solid #45728a; border-radius:12px; background:#10202d; }
      .review04 nav { display:flex; flex-wrap:wrap; gap:8px; } .review04 button { min-height:48px; padding:8px 14px; font:inherit; font-size:14px; background:#152c42; color:#eef5ff; border:1px solid #45728a; border-radius:8px; cursor:pointer; }
      .review04 button[aria-pressed=true] { border-color:#00c7f7; background:#124359; } .review04 button:focus-visible { outline:3px solid #edb45c; outline-offset:2px; }
      .review04 .form04 { display:flex; flex-wrap:wrap; gap:8px; } .review04 .form04 span { padding:8px 12px; border:1px solid #00c7f7; border-radius:8px; }
      .review04 .muted04 { color:#b6c8d8; font-size:14px; } .review04 .warning04 { border-color:#edb45c; }
    `}</style>
    <main className="review04">
      <header><h1>Enfrentamientos y forma</h1><p className="muted04">REVISIÓN AISLADA · Datos simulados · Propuestas sin activar</p></header>
      <nav aria-label="Revisión de análisis">
        <button aria-pressed={format === '1v1'} onClick={() => setFormat('1v1')}>1v1</button>
        <button aria-pressed={format === '2v2'} onClick={() => setFormat('2v2')}>2v2 · parejas exactas</button>
        <button aria-pressed={empty} onClick={() => setEmpty(v => !v)}>SIN HISTORIAL</button>
        <button aria-pressed={physical} onClick={() => setPhysical(v => !v)}>VISTA 800×480</button>
      </nav>
      <div className="review-body">
        <section aria-label="Enfrentamiento directo"><h2>Clasificatorios · {format}</h2>
          <p>Perspectiva: {own.map(id => names.get(id)).join(' + ')} · rival: {rival.map(id => names.get(id)).join(' + ')}</p>
          <p data-testid="h2h-count">Muestra: {totals.played} partidos confirmados simulados</p>
          {totals.played ? <p>{totals.wins} victorias · {totals.draws} empates · {totals.losses} derrotas · Goles de equipo {totals.goalsFor}–{totals.goalsAgainst}</p> : <p>Datos insuficientes</p>}
          <p className="muted04">Cada partido cuenta una vez. Los penaltis resuelven el resultado sin sumar goles. Las bajas conservan su historial.</p>
        </section>
        <section aria-label="Forma clasificatoria"><h2>Últimos cinco clasificatorios</h2>
          <p className="muted04">Por jugador · más reciente primero · independiente del filtro H2H</p>
          {[...own, ...rival].map((id, i) => {
            const recent = rankedForm(empty ? [] : confirmed, id)
            return <div key={id}><p>{i < own.length ? `Blanco ${i + 1}` : `Azul ${i - own.length + 1}`} · {names.get(id)} · {eloPlayers.find(p => p.id === id)?.active ? 'Activo' : 'Baja'} · {recent.length}/5</p>
              <div className="form04">{recent.length ? recent.map(r => <span key={r.match.id} title={r.match.finished_at}>{labels[r.outcome]}{r.match.went_to_penalties ? ' · penaltis' : ''}</span>) : <span>Datos insuficientes</span>}</div>
            </div>
          })}
        </section>
        <section className="warning04" aria-label="Previsión pendiente"><h2>Prepartido</h2><p>{predictionDraft.message}</p>
          <p className="muted04">Sin porcentaje ni confianza estimada. Una expectativa ELO no demuestra una probabilidad calibrada.</p>
        </section>
        <details><summary>Últimos enfrentamientos de la muestra</summary>
          {evidence.recent.map(r => <p key={r.match.id}>{labels[r.outcome]} · {r.match.participants.map(participantName).join(' / ')} · {r.goalsFor}–{r.goalsAgainst}</p>)}
        </details>
      </div>
    </main>
  </FixedCanvas>
}
