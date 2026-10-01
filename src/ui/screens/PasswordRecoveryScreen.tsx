import { useState, type FormEvent } from 'react'
import type { AuthService } from '../../services/AuthService'
import { errorMessage } from '../../app/useData'

export function PasswordRecoveryScreen({ auth, online, onDone, onCheck }: {
  auth: AuthService; online: boolean; onDone: () => void; onCheck: () => void;
}) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [updated, setUpdated] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || !online || updated) return
    if (password !== confirmation) { setMessage('Las contraseñas no coinciden.'); return }
    setBusy(true); setMessage('')
    try { await auth.updatePassword(password); setPassword(''); setConfirmation(''); setUpdated(true) }
    catch (error) { setMessage(errorMessage(error)) }
    finally { setBusy(false) }
  }
  return <section className="data-screen">
    <header className="data-heading"><h1>NUEVA CONTRASEÑA</h1></header>
    <div className="data-panel">
      {updated ? <p role="status">Contraseña actualizada. Ya puedes entrar con tu nueva contraseña.</p> : <form className="account-form" onSubmit={event => void submit(event)}>
        <p>El enlace ha abierto tu cuenta. Elige una contraseña de al menos ocho caracteres.</p>
        <label>Nueva contraseña<input aria-label="Nueva contraseña" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label>Repetir contraseña<input aria-label="Repetir contraseña" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        <button type="submit" disabled={busy || !online}>{busy ? 'GUARDANDO…' : 'GUARDAR CONTRASEÑA'}</button>
        {!online && <p role="status">Comprueba la conexión para guardar la contraseña.</p>}
        {!online && <button type="button" onClick={onCheck}>COMPROBAR CONEXIÓN</button>}
        {message && <p className="notice" role="status">{message}</p>}
      </form>}
      <div className="account-alternative"><button type="button" disabled={busy} onClick={onDone}>{updated ? 'VOLVER A MI CUENTA' : 'CANCELAR CAMBIO'}</button></div>
    </div>
  </section>
}
