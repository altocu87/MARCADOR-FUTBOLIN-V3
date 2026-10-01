import { useId, useRef, useState, type FormEvent } from 'react'
import type { Identity } from '../../services/AuthService'
import type { ApplicationServices } from '../../app/services'
import { errorMessage } from '../../app/useData'
import { AuthActionError } from '../../services/supabase/authFeedback'

export type AccessMode = 'login' | 'register' | 'reset'

export function PasswordField({ label, value, onChange, newPassword = false }: {
  label: string; value: string; onChange: (value: string) => void; newPassword?: boolean;
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return <label className="account-field" htmlFor={id}>{label}<span className="password-control">
    <input id={id} aria-label={label} type={visible ? 'text' : 'password'} required minLength={newPassword ? 8 : 1} value={value} onChange={event => onChange(event.target.value)} autoComplete={newPassword ? 'new-password' : 'current-password'} />
    <button type="button" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'OCULTAR' : 'VER'}</button>
  </span></label>
}

export function AccountScreen({ services, user, initialMode, online, locked, onSignedOut, onCheck, onBusy, initialMessage = '' }: {
  services: ApplicationServices | null; user: Identity | null; initialMode: AccessMode; online: boolean; locked: boolean;
  onSignedOut: () => void; onCheck: () => void; onBusy: (busy: boolean) => void; initialMessage?: string;
}) {
  const [mode, setMode] = useState(initialMode)
  const [tab, setTab] = useState<'profile' | 'security' | 'sessions'>('profile')
  const [email, setEmail] = useState(user?.email ?? '')
  const [name, setName] = useState(user?.displayName ?? '')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [nonce, setNonce] = useState('')
  const [needsCode, setNeedsCode] = useState(false)
  const [message, setMessage] = useState(initialMessage)
  const [busy, setBusy] = useState(false)
  const [confirmGlobal, setConfirmGlobal] = useState(false)
  const requestBusy = useRef(false)
  const blocked = busy || !services || !online || locked
  const access = !user || mode === 'reset'
  function clearPasswords() { setPassword(''); setNewPassword(''); setConfirmation(''); setNonce('') }
  function switchMode(next: AccessMode) { if (requestBusy.current) return; setMode(next); clearPasswords(); setMessage('') }
  function switchTab(next: typeof tab) { if (requestBusy.current) return; setTab(next); clearPasswords(); setMessage(''); setConfirmGlobal(false); setNeedsCode(false) }
  async function run(action: () => Promise<void>) {
    if (requestBusy.current || !services || locked) return
    if (!online) { setMessage('Comprueba la conexión para gestionar tu cuenta.'); return }
    requestBusy.current = true; setBusy(true); onBusy(true); setMessage('')
    try { await action() }
    catch (error) {
      setMessage(errorMessage(error))
      if (error instanceof AuthActionError && ['reauthentication_needed', 'reauthentication_not_valid'].includes(error.code ?? '')) setNeedsCode(true)
    } finally { requestBusy.current = false; setBusy(false); onBusy(false) }
  }
  function submitAccess(event: FormEvent) {
    event.preventDefault()
    if (!services || blocked) return
    if (mode === 'register' && password !== confirmation) { setMessage('Las contraseñas no coinciden.'); return }
    void run(async () => {
      if (mode === 'reset') setMessage(await services.auth.requestPasswordReset(email))
      else if (mode === 'register') setMessage(await services.auth.signUp(email, password, name))
      else { await services.auth.signIn(email, password); setMessage('Sesión iniciada. Ya puedes gestionar tus jugadores y partidos.') }
      clearPasswords()
    })
  }
  const heading = access ? mode === 'login' ? 'INICIAR SESIÓN' : mode === 'register' ? 'CREAR CUENTA NUEVA' : 'RECUPERAR CONTRASEÑA' : 'MI CUENTA'
  return <section className="data-screen account-screen" aria-busy={busy}>
    <div className="scroll-panel account-scroll">
      <div className="account-layout">
        <aside className="account-intro">
          <span className="account-kicker">MARCADOR / ACCESO PRIVADO</span>
          <div className="account-orbit" aria-hidden="true"><span>V3</span></div>
          <h1>{heading}</h1>
          <p>{access ? 'Tu espacio de juego. Tus jugadores. Tu historial.' : `Tu cuenta, ${user.displayName || 'operador'}.`}</p>
          <ul><li>Jugadores e historial vinculados a tu cuenta</li><li>Pendientes locales conservados entre sesiones</li><li>Los jugadores no necesitan registrarse</li></ul>
          {user && <div className="account-identity"><strong>{user.displayName || 'OPERADOR'}</strong><span>{user.email || 'Identidad local'}</span><small>{!online ? 'SESIÓN LOCAL · CONÉCTATE PARA GESTIONAR' : user.emailVerified ? 'CORREO VERIFICADO' : 'SESIÓN ACTIVA'}</small>{user.pendingEmail && <small>Confirmación pendiente: {user.pendingEmail}</small>}</div>}
        </aside>
        <div className="account-card">
          {!services && <p className="notice" role="status">El acceso no está configurado en este entorno. Puedes jugar con MODO PRUEBA ON.</p>}
          {!online && services && <div className="account-connection"><p role="status">El acceso está bloqueado porque no se ha verificado la conexión. Si esta vista previa pide acceso, entra primero en Vercel.</p><button type="button" onClick={onCheck}>COMPROBAR CONEXIÓN</button></div>}
          {locked && <p className="notice" role="status">Termina el partido y conserva su resultado antes de cambiar el acceso o cerrar sesión.</p>}
          {access ? <>
            <form className="account-form" onSubmit={submitAccess}>
              <h2>{mode === 'login' ? 'VUELVE AL JUEGO' : mode === 'register' ? 'TU NUEVA CUENTA' : 'RECUPERA TU ACCESO'}</h2>
              <p>{mode === 'login' ? 'Entra con tu cuenta existente.' : mode === 'register' ? 'Confirma tu correo para activar el acceso. Si ya te registraste, inicia sesión.' : 'Te enviaremos un enlace para elegir una nueva contraseña.'}</p>
              {mode === 'register' && <label className="account-field">Nombre de cuenta<input required maxLength={60} value={name} onChange={event => setName(event.target.value)} autoComplete="nickname" /></label>}
              <label className="account-field">Correo<input type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" /></label>
              {mode !== 'reset' && <PasswordField label="Contraseña" value={password} onChange={setPassword} newPassword={mode === 'register'} />}
              {mode === 'register' && <PasswordField label="Repetir contraseña" value={confirmation} onChange={setConfirmation} newPassword />}
              <button className="account-primary" type="submit" disabled={blocked}>{busy ? 'PROCESANDO…' : mode === 'login' ? 'ENTRAR' : mode === 'register' ? 'CREAR CUENTA' : 'ENVIAR ENLACE'}</button>
            </form>
            {mode !== 'reset' && <button className="account-link" type="button" disabled={busy} onClick={() => switchMode('reset')}>RECUPERAR CONTRASEÑA</button>}
            {mode === 'login' && <button className="account-link" type="button" disabled={blocked} onClick={() => void run(async () => { if (services) setMessage(await services.auth.resendConfirmation(email)) })}>REENVIAR CONFIRMACIÓN</button>}
            <div className="account-alternative"><p>{mode === 'login' ? '¿Todavía no tienes cuenta?' : '¿Ya tienes acceso?'}</p><button type="button" disabled={busy} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'IR AL REGISTRO DE CUENTA NUEVA' : user ? 'VOLVER A MI CUENTA' : 'VOLVER A INICIAR SESIÓN'}</button></div>
          </> : <>
            <nav className="account-tabs" aria-label="Gestión de cuenta">{(['profile', 'security', 'sessions'] as const).map(value => <button type="button" key={value} aria-pressed={tab === value} disabled={busy} onClick={() => switchTab(value)}>{value === 'profile' ? 'PERFIL' : value === 'security' ? 'SEGURIDAD' : 'SESIONES'}</button>)}</nav>
            {tab === 'profile' && <>
              <form className="account-form" onSubmit={event => { event.preventDefault(); void run(async () => { await services!.auth.updateProfile(name, user.id); setMessage('Perfil actualizado.') }) }}><h2>DATOS DE TU CUENTA</h2><label className="account-field">Nombre de cuenta<input required maxLength={60} value={name} onChange={event => setName(event.target.value)} autoComplete="nickname" /></label><button className="account-primary" type="submit" disabled={blocked}>GUARDAR PERFIL</button></form>
              <div className="account-divider" />
              <form className="account-form" onSubmit={event => { event.preventDefault(); void run(async () => { setMessage(await services!.auth.changeEmail(newEmail, password, user.id)); setPassword(''); setNewEmail('') }) }}><h2>CAMBIAR CORREO</h2><p>El cambio requiere confirmación. Mantienes la misma cuenta, jugadores e historial.</p><label className="account-field">Nuevo correo<input type="email" required value={newEmail} onChange={event => setNewEmail(event.target.value)} autoComplete="email" /></label><PasswordField label="Contraseña actual" value={password} onChange={setPassword} /><button type="submit" disabled={blocked}>SOLICITAR CAMBIO DE CORREO</button></form>
            </>}
            {tab === 'security' && <>
              <form className="account-form" onSubmit={event => { event.preventDefault(); if (newPassword !== confirmation) { setMessage('Las contraseñas no coinciden.'); return } void run(async () => { await services!.auth.changePassword(password, newPassword, user.id, nonce || undefined); clearPasswords(); setNeedsCode(false); setMessage('Contraseña actualizada. Utilízala la próxima vez que inicies sesión.') }) }}>
                <h2>CAMBIAR CONTRASEÑA</h2><p>Confirma tu contraseña actual y elige una nueva de al menos ocho caracteres.</p>
                <PasswordField label="Contraseña actual" value={password} onChange={setPassword} /><PasswordField label="Nueva contraseña" value={newPassword} onChange={setNewPassword} newPassword /><PasswordField label="Repetir contraseña" value={confirmation} onChange={setConfirmation} newPassword />
                {needsCode && <><label className="account-field">Código de seguridad<input inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6} value={nonce} onChange={event => setNonce(event.target.value)} /></label><button type="button" disabled={blocked} onClick={() => void run(async () => { await services!.auth.reauthenticate(user.id); setMessage('Código enviado. Revisa tu correo.') })}>ENVIAR CÓDIGO DE SEGURIDAD</button></>}
                <button className="account-primary" type="submit" disabled={blocked}>CAMBIAR CONTRASEÑA</button>
              </form><button className="account-link" type="button" disabled={busy} onClick={() => { setEmail(user.email); switchMode('reset') }}>RECUPERAR CONTRASEÑA</button>
            </>}
            {tab === 'sessions' && <div className="account-form"><h2>CONTROL DE SESIONES</h2><p>Cerrar sesión conserva los datos y pendientes de cada dispositivo. Accede con esta misma cuenta para recuperarlos.</p><button type="button" disabled={blocked} onClick={() => void run(async () => { await services!.auth.signOut('local', user.id); onSignedOut() })}>CERRAR SESIÓN EN ESTE DISPOSITIVO</button><button type="button" disabled={blocked} onClick={() => setConfirmGlobal(true)}>CERRAR TODAS LAS SESIONES</button>{confirmGlobal && <div className="account-session-confirm"><p>Se cerrará el acceso también en otros dispositivos. Los tokens de acceso ya emitidos pueden seguir válidos hasta caducar.</p><button type="button" disabled={blocked} onClick={() => void run(async () => { await services!.auth.signOut('global', user.id); onSignedOut() })}>CONFIRMAR CIERRE EN TODOS LOS DISPOSITIVOS</button><button type="button" disabled={busy} onClick={() => setConfirmGlobal(false)}>CANCELAR</button></div>}</div>}
          </>}
          {message && <p className="account-feedback notice" role="status">{message}</p>}
        </div>
      </div>
    </div>
  </section>
}
