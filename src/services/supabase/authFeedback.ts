/** Only the current site's origin is used: never return tokens or query parameters. */
export function authReturnUrl(href: string): string | undefined {
  try {
    const url = new URL(href)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    return url.protocol === 'https:' || (local && url.protocol === 'http:') ? `${url.origin}/` : undefined
  } catch { return undefined }
}

export function validatedEmail(email: string): string {
  const normalized = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Introduce un correo válido.')
  return normalized
}

export function validatePassword(password: string): void {
  if (password.length < 8) throw new Error('La contraseña debe tener al menos ocho caracteres.')
}

export function validatedDisplayName(name: string): string {
  const normalized = name.trim()
  if (!normalized || normalized.length > 60) throw new Error('El nombre debe tener entre uno y sesenta caracteres.')
  return normalized
}

export class AuthActionError extends Error {
  constructor(error: { code?: string }) { super(authErrorMessage(error), { cause: error }); this.code = error.code }
  readonly code: string | undefined
}

export function registrationEmail(email: string, password: string): string {
  const normalized = validatedEmail(email)
  validatePassword(password)
  return normalized
}

export function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined
  switch (code) {
    case 'email_address_not_authorized': return 'El correo de pruebas de Supabase solo admite direcciones del equipo del proyecto. Usa tu correo de Supabase; otros correos necesitan un servicio de envío configurado.'
    case 'email_not_confirmed': return 'Confirma tu correo antes de entrar. Revisa también la carpeta de spam.'
    case 'invalid_credentials': return 'No se pudo iniciar sesión. Comprueba el correo y la contraseña.'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'Se ha alcanzado el límite de intentos o correos. Espera antes de volver a intentarlo.'
    case 'signup_disabled': return 'El registro no está habilitado en este entorno. Contacta con el administrador.'
    case 'user_already_exists': return 'Ya existe una cuenta con ese correo. Inicia sesión o utiliza RECUPERAR CONTRASEÑA.'
    case 'same_password': return 'Elige una contraseña diferente de la anterior.'
    case 'reauthentication_needed': return 'Confirma tu identidad con el código de seguridad enviado a tu correo.'
    case 'reauthentication_not_valid': return 'El código de seguridad no es válido. Solicita uno nuevo e inténtalo otra vez.'
    case 'otp_expired':
    case 'session_not_found': return 'El enlace o la sesión han caducado. Solicita otro enlace desde RECUPERAR CONTRASEÑA.'
    case 'weak_password': return 'Elige una contraseña más segura, de al menos ocho caracteres.'
    default: return 'No se pudo completar el acceso. Comprueba la conexión y vuelve a intentarlo.'
  }
}

/** Show a safe callback error; never render provider descriptions or credentials. */
export function passwordRecoveryLinkError(href: string): string {
  try {
    const url = new URL(href)
    const fragment = new URLSearchParams(url.hash.slice(1))
    if (url.searchParams.has('error') || fragment.has('error')) return 'No se pudo validar el enlace de acceso. Puede haber caducado o haberse usado. Solicita otro desde RECUPERAR CONTRASEÑA.'
  } catch { /* Not a valid callback URL. */ }
  return ''
}
