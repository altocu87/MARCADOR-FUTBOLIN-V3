import { useState, type FormEvent } from 'react'
import type { Identity } from '../../services/AuthService'
import type { Player, PlayerDraft } from '../../services/persistence/models'
import type { ApplicationServices } from '../../app/services'
import { errorMessage } from '../../app/useData'

const emptyDraft: PlayerDraft = { name: '', nickname: '', photoUrl: '' }

export function SettingsScreen({ services, user, players, protectedIds, testMode, onTestMode, refresh, pendingCount, onRetry, dataMessage }: {
  services: ApplicationServices | null; user: Identity | null; players: Player[]; protectedIds: string[]; testMode: boolean;
  onTestMode: (value: boolean) => void; refresh: () => Promise<void>; pendingCount: number; onRetry: () => Promise<void>; dataMessage: string;
}) {
  const [tab, setTab] = useState<'general' | 'players'>('general')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [draft, setDraft] = useState<PlayerDraft | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    if (busy) return
    setBusy(true); setMessage('')
    try { await action() } catch (error) { setMessage(errorMessage(error)) } finally { setBusy(false) }
  }
  const login = (event: FormEvent) => { event.preventDefault(); void run(async () => { await services?.auth.signIn(email, password); setPassword('') }) }
  const save = (event: FormEvent) => {
    event.preventDefault()
    if (!draft || !services) return
    void run(async () => {
      if (editId) await services.players.updatePlayer(editId, draft)
      else await services.players.createPlayer(draft)
      setDraft(null); setEditId(null); await refresh()
    })
  }

  return <section className="data-screen">
    <header className="data-heading"><h1>AJUSTES</h1><div><button type="button" onClick={() => { setTab('general'); setDraft(null) }}>GENERAL</button><button type="button" onClick={() => setTab('players')}>JUGADORES</button></div></header>
    {!services && <p className="notice">Configura la URL y la clave pública de Supabase en .env.local.</p>}
    {tab === 'general' ? <div className="settings-grid">
      <div className="data-panel"><h2>MODO PRUEBA</h2><button className={`test-toggle ${testMode ? 'selected' : ''}`} type="button" aria-pressed={testMode} onClick={() => onTestMode(!testMode)}>{testMode ? 'ON · NO GUARDAR PARTIDOS' : 'OFF · GUARDAR PARTIDOS'}</button><p>La elección se fija al iniciar el partido. No cambia una partida en curso.</p><button type="button" disabled={busy || !user || pendingCount === 0} onClick={() => void run(onRetry)}>REINTENTAR {pendingCount} PENDIENTES</button></div>
      <div className="data-panel"><h2>ACCESO PRIVADO</h2>{user ? <><p>{user.email}</p><button type="button" disabled={busy} onClick={() => void run(async () => { await services?.auth.signOut() })}>CERRAR SESIÓN</button></> : <form className="account-form" onSubmit={login}><input aria-label="Correo" type="email" required value={email} placeholder="Correo" onChange={event => setEmail(event.target.value)} autoComplete="username" /><input aria-label="Contraseña" type="password" required minLength={8} value={password} placeholder="Contraseña" onChange={event => setPassword(event.target.value)} autoComplete="current-password" /><div><button type="submit" disabled={busy || !services}>ENTRAR</button><button type="button" disabled={busy || !services || !email || password.length < 8} onClick={() => void run(async () => { const result = await services!.auth.signUp(email, password); setPassword(''); setMessage(result) })}>CREAR CUENTA</button></div></form>}</div>
    </div> : !user ? <div className="empty-state">Inicia sesión en GENERAL para gestionar tus jugadores.<button type="button" onClick={() => setTab('general')}>IR A GENERAL</button></div> : draft ? <form className="player-editor" onSubmit={save}><h2>{editId ? 'EDITAR JUGADOR' : 'CREAR JUGADOR'}</h2><label>Nombre<input aria-label="Nombre del jugador" maxLength={80} required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label><label>Alias opcional<input aria-label="Alias" maxLength={40} value={draft.nickname} onChange={event => setDraft({ ...draft, nickname: event.target.value })} /></label><label>Foto URL https:// (opcional)<input aria-label="Foto URL" type="url" value={draft.photoUrl} onChange={event => setDraft({ ...draft, photoUrl: event.target.value })} /></label><div><button type="button" onClick={() => setDraft(null)}>CANCELAR</button><button type="submit" disabled={busy}>GUARDAR JUGADOR</button></div></form> : <>
      <div className="panel-toolbar"><button type="button" onClick={() => { setEditId(null); setDraft(emptyDraft) }}>CREAR JUGADOR</button><button type="button" disabled={busy} onClick={() => void run(refresh)}>ACTUALIZAR</button></div>
      <div className="scroll-panel player-list">{players.length === 0 ? <p>No hay jugadores. Crea el primero.</p> : players.map(player => <div className="player-list-row" key={player.id}><span><b>{player.nickname || player.name}</b><small>{player.active ? 'ACTIVO' : 'INACTIVO'} · NIVEL {player.level}</small></span><button type="button" disabled={busy} onClick={() => { setEditId(player.id); setDraft({ name: player.name, nickname: player.nickname ?? '', photoUrl: player.photoUrl ?? '' }) }}>EDITAR</button><button type="button" disabled={busy} onClick={() => void run(async () => { await services!.players.setActive(player.id, !player.active); await refresh() })}>{player.active ? 'DESACTIVAR' : 'ACTIVAR'}</button><button type="button" disabled={busy || protectedIds.includes(player.id)} title={protectedIds.includes(player.id) ? 'Participa en un partido en curso o pendiente; puedes desactivarlo.' : 'Eliminar solo si no tiene historial'} onClick={() => setDeleteId(player.id)}>ELIMINAR</button></div>)}</div>
      {deleteId && <div className="confirm-panel">Solo se eliminará si no tiene historial.<button type="button" disabled={busy} onClick={() => void run(async () => { await services!.players.deleteUnusedPlayer(deleteId); setDeleteId(null); await refresh() })}>CONFIRMAR ELIMINACIÓN</button><button type="button" onClick={() => setDeleteId(null)}>CANCELAR</button></div>}
    </>}
    {(message || dataMessage) && <p className="notice" role="status">{message || dataMessage}</p>}
  </section>
}
