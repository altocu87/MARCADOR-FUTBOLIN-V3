/** Only the current site's origin is used: never return tokens or query parameters. */
export function authReturnUrl(href: string): string | undefined {
  try {
    const url = new URL(href)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    return url.protocol === 'https:' || (local && url.protocol === 'http:') ? `${url.origin}/` : undefined
  } catch { return undefined }
}

export function registrationEmail(email: string, password: string): string {
  const normalized = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('Introduce un correo válido.')
  if (password.length < 8) throw new Error('La contraseña debe tener al menos ocho caracteres.')
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
    case 'weak_password': return 'Elige una contraseña más segura, de al menos ocho caracteres.'
    default: return 'No se pudo completar el acceso. Comprueba la conexión y vuelve a intentarlo.'
  }
}
