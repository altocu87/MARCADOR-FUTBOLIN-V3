import { useState, type CSSProperties, type FormEvent } from 'react'
import { PLAYER_COLORS, normalizePlayerName, validatePlayerName, type Player } from '../../domain/Player'

interface PlayersScreenProps {
  players: Player[]
  onSave: (player: Player) => void
  onBack: () => void
}

export function PlayersScreen({ players, onSave, onBack }: PlayersScreenProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tint, setTint] = useState(PLAYER_COLORS[0])
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const reset = () => { setEditingId(null); setName(''); setError(null); setTint(PLAYER_COLORS[(players.length + (editingId ? 0 : 1)) % PLAYER_COLORS.length]) }
  const edit = (player: Player) => {
    setEditingId(player.id); setName(player.name); setTint(player.tint); setError(null); setNotice('')
  }
  const save = (event: FormEvent) => {
    event.preventDefault()
    const validation = validatePlayerName(name, players, editingId ?? undefined)
    if (validation) { setError(validation); return }
    try {
      onSave({ id: editingId ?? crypto.randomUUID(), name: normalizePlayerName(name), tint })
      setNotice(editingId ? 'Jugador actualizado.' : 'Jugador creado.')
      reset()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudo guardar el jugador.')
    }
  }

  return <section className="library-screen screen-stack">
    <header className="screen-heading"><p className="eyebrow">DATOS EN ESTE NAVEGADOR</p><h1>JUGADORES</h1></header>
    <div className="players-management">
      <div className="scroll-list" aria-label="Jugadores guardados">
        {players.length === 0 && <p className="empty-message">Añade al menos dos jugadores para comenzar.</p>}
        {players.map((player) => <button type="button" className="library-player" key={player.id} onClick={() => edit(player)} aria-label={`Editar ${player.name}`}>
          <span className="mini-avatar" style={{ '--avatar-tint': player.tint } as CSSProperties}>{player.name[0]}</span>
          <strong>{player.name}</strong><small>EDITAR</small>
        </button>)}
      </div>
      <form className="player-form" onSubmit={save}>
        <h2>{editingId ? 'Editar jugador' : 'Nuevo jugador'}</h2>
        <label htmlFor="player-name">Nombre</label>
        <input id="player-name" autoComplete="off" value={name} maxLength={32} onChange={(event) => { setName(event.target.value); setError(null); setNotice('') }} aria-invalid={Boolean(error)} aria-describedby={error ? 'player-error' : undefined} />
        <fieldset className="color-options"><legend>Color del avatar</legend>
          {PLAYER_COLORS.map((color, index) => <button type="button" key={color} aria-label={`Color ${index + 1}`} aria-pressed={tint === color} className={tint === color ? 'selected' : ''} style={{ background: color }} onClick={() => setTint(color)} />)}
        </fieldset>
        <div className="form-feedback">{error ? <p id="player-error" role="alert">{error}</p> : <p role="status">{notice}</p>}</div>
        <div className="form-actions"><button type="submit" className="primary-action">{editingId ? 'GUARDAR CAMBIOS' : 'CREAR JUGADOR'}</button>{editingId && <button type="button" className="secondary-action" onClick={reset}>CANCELAR</button>}</div>
      </form>
    </div>
    <div className="screen-actions"><button type="button" className="secondary-action" onClick={onBack}>VOLVER</button><span className="local-note">Los nombres de partidos anteriores se conservan.</span></div>
  </section>
}

interface PlayerSelectionProps {
  players: Player[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onStart: (players: Player[]) => void
  onManage: () => void
  onBack: () => void
}

export function PlayerSelectionScreen({ players, selectedIds, onSelectionChange, onStart, onManage, onBack }: PlayerSelectionProps) {
  const selected = selectedIds.map((id) => players.find((player) => player.id === id)).filter((player): player is Player => Boolean(player))
  const select = (id: string) => onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : selectedIds.length < 4 ? [...selectedIds, id] : selectedIds)
  const ready = selected.length === 2 || selected.length === 4

  return <section className="player-selection screen-stack">
    <header className="screen-heading"><p className="eyebrow">1 CONTRA 1 O 2 CONTRA 2</p><h1>SELECCIONAR JUGADORES</h1><p>Orden: blanco 1, azul 1, blanco 2, azul 2. Elige 2 o 4 jugadores.</p></header>
    <div className="selection-list player-grid">
      {players.length === 0 && <p className="empty-message">Todavía no hay jugadores. Pulsa GESTIONAR JUGADORES.</p>}
      {players.map((player) => {
        const position = selectedIds.indexOf(player.id)
        const team = position % 2 === 0 ? 'BLANCO' : 'AZUL'
        return <button type="button" key={player.id} aria-pressed={position >= 0} className={`player-card ${position >= 0 ? 'selected' : ''}`} onClick={() => select(player.id)} disabled={position < 0 && selected.length >= 4}>
          <span className="player-number">{position >= 0 ? `${position + 1} · ${team}` : 'ELEGIR'}</span>
          <span className="player-avatar" style={{ '--avatar-tint': player.tint } as CSSProperties}>{player.name[0]}</span><strong>{player.name}</strong>
        </button>
      })}
    </div>
    <p className="team-preview">BLANCO: {selected.filter((_, index) => index % 2 === 0).map((player) => player.name).join(' / ') || '—'} · AZUL: {selected.filter((_, index) => index % 2 !== 0).map((player) => player.name).join(' / ') || '—'}</p>
    <div className="screen-actions"><button type="button" className="secondary-action" onClick={onBack}>VOLVER</button><button type="button" className="secondary-action" onClick={onManage}>GESTIONAR JUGADORES</button><button type="button" className="primary-action" onClick={() => ready && onStart(selected)} disabled={!ready}>COMENZAR PARTIDO ›</button></div>
  </section>
}
