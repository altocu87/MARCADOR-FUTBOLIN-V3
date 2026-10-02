import { useState, type FormEvent, type ReactNode } from 'react'
import type { Identity } from '../../services/AuthService'
import type { Player, PlayerDraft } from '../../services/persistence/models'
import type { ApplicationServices } from '../../app/services'
import { errorMessage } from '../../app/useData'
import { APP_VERSION } from '../../app/releases'
import { VersionHistory } from '../components/VersionHistory'

const emptyDraft: PlayerDraft = { name: '', nickname: '', photoUrl: '' }

export function SettingsScreen({ services, user, players, protectedIds, testMode, onTestMode, refresh, pendingCount, onRetry, dataMessage, online, syncBusy, onPending, onAccount, offline, onCheck, displaySettings, onProfile }: {
  services: ApplicationServices | null; user: Identity | null; players: Player[]; protectedIds: string[]; testMode: boolean;
  onTestMode: (value: boolean) => void; refresh: () => Promise<void>; pendingCount: number; onRetry: () => Promise<void>; dataMessage: string;
  online: boolean; syncBusy: boolean; onPending: () => void; onAccount: () => void; onCheck: () => void;
  offline: { ready: boolean; message: string; installable: boolean; install: () => Promise<void> };
  displaySettings: ReactNode;
  onProfile: (id: string) => void;
}) {
  const [tab, setTab] = useState<'general' | 'players' | 'versions'>('general')
  const [draft, setDraft] = useState<PlayerDraft | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    if (busy) return
    if (!online) { setMessage('SIN CONEXIÓN O SESIÓN POR VERIFICAR · La gestión y sincronización requieren conexión.'); return }
    setBusy(true); setMessage('')
    try { await action() } catch (error) { setMessage(errorMessage(error)) } finally { setBusy(false) }
  }
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
    <header className="data-heading"><h1>AJUSTES</h1><div><button type="button" aria-pressed={tab === 'general'} onClick={() => { setTab('general'); setDraft(null) }}>GENERAL</button><button type="button" aria-pressed={tab === 'players'} onClick={() => setTab('players')}>JUGADORES</button><button type="button" aria-pressed={tab === 'versions'} onClick={() => { setTab('versions'); setDraft(null) }}>VERSIONES</button></div></header>
    {!services && <p className="notice">La conexión de datos no está configurada en este entorno. Puedes jugar con MODO PRUEBA ON.</p>}
    {tab === 'general' ? <div className="settings-grid">
      <div className="data-panel system-panel">{displaySettings}<h2>MODO PRUEBA</h2><button className={`test-toggle ${testMode ? 'selected' : ''}`} type="button" aria-pressed={testMode} onClick={() => onTestMode(!testMode)}>{testMode ? 'ON · NO GUARDAR PARTIDOS' : 'OFF · GUARDAR PARTIDOS'}</button><p>Se fija al iniciar cada partido.</p><div className="pending-actions"><button type="button" disabled={busy || syncBusy || !user || !online || pendingCount === 0} onClick={() => void run(onRetry)}>{syncBusy ? 'SINCRONIZANDO…' : 'REINTENTAR'}</button><button type="button" onClick={onPending}>VER {pendingCount} PENDIENTES</button></div><div className="offline-summary"><p>{offline.message}</p>{offline.installable ? <button type="button" onClick={() => void offline.install()}>INSTALAR APLICACIÓN</button> : <small>Instalar: menú del navegador → Instalar / Añadir a inicio.</small>}<button type="button" onClick={onCheck}>COMPROBAR CONEXIÓN</button></div></div>
      <div className="data-panel settings-account"><h2>CUENTA Y DATOS</h2><p>{user ? 'Gestiona tu perfil, correo, contraseña y sesiones desde MI CUENTA, en la esquina superior.' : 'Inicia sesión desde la esquina superior para gestionar tus jugadores y partidos.'}</p><button type="button" onClick={onAccount}>{user ? 'GESTIONAR MI CUENTA' : 'IR AL ACCESO'}</button><p>La cuenta administra tus jugadores y partidos. Los jugadores no necesitan registrarse.</p><div className="settings-version"><h2>VERSIÓN {APP_VERSION}</h2><p>Consulta las novedades de cada entrega.</p><button type="button" onClick={() => setTab('versions')}>VER HISTORIAL DE VERSIONES</button></div></div>
    </div> : tab === 'versions' ? <VersionHistory /> : !user ? <div className="empty-state">Inicia sesión para gestionar tus jugadores.<button type="button" onClick={onAccount}>IR AL ACCESO</button></div> : draft ? <form className="player-editor" onSubmit={save}><h2>{editId ? 'EDITAR JUGADOR' : 'CREAR JUGADOR'}</h2><label>Nombre<input aria-label="Nombre del jugador" maxLength={80} required value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label><label>Alias opcional<input aria-label="Alias" maxLength={40} value={draft.nickname} onChange={event => setDraft({ ...draft, nickname: event.target.value })} /></label><label>Foto URL https:// (opcional)<input aria-label="Foto URL" type="url" value={draft.photoUrl} onChange={event => setDraft({ ...draft, photoUrl: event.target.value })} /></label><div><button type="button" onClick={() => setDraft(null)}>CANCELAR</button><button type="submit" disabled={busy}>GUARDAR JUGADOR</button></div></form> : <>
      <div className="panel-toolbar"><button type="button" onClick={() => { setEditId(null); setDraft(emptyDraft) }}>CREAR JUGADOR</button><button type="button" disabled={busy} onClick={() => void run(refresh)}>ACTUALIZAR</button></div>
      <div className="scroll-panel player-list">{players.length === 0 ? <p>No hay jugadores. Crea el primero.</p> : players.map(player => <div className="player-list-row" key={player.id}><span><b>{player.nickname || player.name}</b><small>{player.active ? 'ACTIVO' : 'INACTIVO'} · NIVEL {player.level}</small></span><button type="button" onClick={() => onProfile(player.id)}>PERFIL</button><button type="button" disabled={busy} onClick={() => { setEditId(player.id); setDraft({ name: player.name, nickname: player.nickname ?? '', photoUrl: player.photoUrl ?? '' }) }}>EDITAR</button><button type="button" disabled={busy} onClick={() => void run(async () => { await services!.players.setActive(player.id, !player.active); await refresh() })}>{player.active ? 'DESACTIVAR' : 'ACTIVAR'}</button><button type="button" disabled={busy || protectedIds.includes(player.id)} title={protectedIds.includes(player.id) ? 'Participa en un partido en curso o pendiente; puedes desactivarlo.' : 'Eliminar solo si no tiene historial'} onClick={() => setDeleteId(player.id)}>ELIMINAR</button></div>)}</div>
      {deleteId && <div className="confirm-panel">Solo se eliminará si no tiene historial.<button type="button" disabled={busy} onClick={() => void run(async () => { await services!.players.deleteUnusedPlayer(deleteId); setDeleteId(null); await refresh() })}>CONFIRMAR ELIMINACIÓN</button><button type="button" onClick={() => setDeleteId(null)}>CANCELAR</button></div>}
    </>}
    {(message || dataMessage) && <p className="notice" role="status">{message || dataMessage}</p>}
  </section>
}
