# Revisión cloud — 2026-10-01

## Fuente e integración

Checkout `/workspace/MARCADOR-FUTBOLIN-V3`, Node 24.19.0/npm 11.9.0. Base `a449df2` de `origin/codex/reliability-offline-v1`. Main permanece en `900e470`. La implementación Supabase ya estaba publicada: se utiliza como referencia, conservando Auth, recuperación, PWA, cuatro opciones de menú y vista responsive/física. No se fusiona el sistema de jugadores/historial exclusivamente local de `codex/local-players-match-recovery` (`f554cdb`), que permanece conservado en GitHub. No se importan automáticamente sus datos del navegador.

## Corrección comprobada

Antes del arreglo, la nueva regresión falló: al expirar el reloj se recibían estados `PLAYING`, `PERIOD_END`, en lugar de solo `PERIOD_END`. El estado intermedio a 00:00 podía escribirse como checkpoint. Un tick tardío también añadía tiempo por encima de la duración.

MatchEngine resuelve el cierre antes de notificar a suscriptores y acota el tiempo TIME/BOTH y prórroga al límite. GOALS sigue contando tiempo sin terminar por reloj. La monotonía conserva journals/copias V1 anteriores que ya contengan tiempos superiores, sin reescribir eventos. `tests/recovery.test.ts` cubre la emisión final, tick tardío y compatibilidad de copias antiguas. No cambia reglas de goles, bloqueo central, correcciones ni penaltis.

## Verificaciones en esta máquina

- `npm ci --cache /tmp/codex-npm-cache`: correcta, 40 paquetes; lockfile conserva versiones anteriores y metadatos de plataforma.
- `npm test`: seis grupos correctos (motor, persistencia, recuperación, offline, presentación, Auth aislado).
- `npm run test:browser`: builds normal y fixture correctos; cinco pruebas Chromium pasadas, cero fallidas/omitidas. Browser context separado por caso y sin errores pageerror. Playwright 1.63.0, navegador `/usr/bin/chromium`.
- TypeScript/build de producción correctos; fixture excluida de `dist` normal.
- `npm audit --omit=dev`: cero vulnerabilidades.
- `git diff --check`: correcto.

Recorridos automatizados:

1. Menú/Ajustes de build sin sesión a 390×844, 800×480, 768×1024, 1440×900, sin scroll general. Vista física 800×480 centrada y preferencia conservada tras recarga.
2. Partido de prueba completo 2–0: sin checkpoints/cola ni historial simulado.
3. Tres jugadores rechazados/cuatro aceptados; gol y bloqueo central; recarga 1–0 → recuperar en pausa, mismo ID/reloj y cuatro participantes; redimensionado móvil vertical/horizontal y referencia física sin reinicio.
4. Fallo simulado al finalizar 2–0: un pendiente durable, retirada de checkpoint solo después de entrega; nueva carga con repositorio simulado disponible → un solo partido en historial, detalle con siete eventos.
5. Precaché preparada; servidor preview 5197 realmente apagado; cierre/reapertura de pestaña en el mismo contexto → aplicación y partido recuperados en pausa a 1–0 desde caché. Servidor reiniciado únicamente para limpieza y después cerrado por el runner.

Los casos con jugadores usan repositorios en memoria, no Auth ni Supabase. Las peticiones a Supabase están bloqueadas por el runner para impedir datos reales accidentales. Las pruebas no son validación en móvil físico ni en Preview protegida.

## Entorno y bloqueo externo

Las variables públicas VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY y VITE_SUPABASE_ANON_KEY están ausentes del proceso actual; se inspeccionaron únicamente nombres/presencia. No hay conector Supabase ni sesión del operador disponibles. Un GET sin credenciales a `/auth/v1/health` no alcanza el destino: CONNECT del proxy rechazado con 403, repetido con escalación. No se diagnostica por ello una caída del servicio.

Con cloud-environment-onboarding:setup se guardó un borrador confirmado: instalación npm ci/caché temporal; arranque desde la rama correcta sin worktree/reset/stash; seis grupos/build y navegador opcional; variables directas públicas (URL sugerida del único proyecto y clave sin valor inventado); allowlist GitHub/proyecto Supabase conservando preset package_managers. Guardar no aplica cambios al proceso ni publica el entorno. Requisitos pendientes, no credenciales recibidas.

El puerto 5173 ya estaba ocupado: no se detuvo ese servidor. Su HTML respondió, pero el navegador encontró 504 en los paquetes optimizados de React y no cargó la app: caché/servidor anterior obsoleto después de cambiar de rama/dependencias. No se consideró un smoke correcto. Se arrancó Vite propio en el puerto libre 5198 y se comprobó HTTP + menú/Ajustes en Chromium, sin pageerror. El arranque guardado explica cómo elegir otro puerto y comprobar la app, no solo el HTML. Browser tests usan exclusivamente preview 5197, no 5173 ni el preview preexistente 4173. No se afirman escrituras remotas ni despliegue nuevo verificado.

## Paso humano: cerrar la verificación de fase B

No requiere cancelar el proyecto, contratar servicios ni compartir contraseñas.

1. Abrir [Supabase Auth → URL Configuration](https://supabase.com/dashboard/project/unemjyfhzljcdjcbiiwh/auth/url-configuration). En Redirect URLs, añadir esta dirección si falta, **sin borrar las existentes**, y guardar:

   `https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app/`

   Sirve para volver al marcador al confirmar el correo. No desactivar confirmación ni RLS.

2. Abrir la [Preview de desarrollo existente](https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app). Si solicita acceso Vercel, entrar con la cuenta propietaria autorizada. Después, AJUSTES → GENERAL → CREAR CUENTA del marcador, confirmar correo y ENTRAR. Si ya existe una cuenta confirmada, utilizar ENTRAR. Son accesos distintos. Introducir personalmente correo/contraseña, nunca por chat.

3. El cierre requiere evidencia real: crear/editar/activar/desactivar jugadores; con PRUEBA OFF completar un partido y ver resultado/detalle en RANKING; comprobar protección de jugadores con historial; repetir con PRUEBA ON sin nuevos registros. No confundir un mensaje de guardado simulado con filas reales en Supabase. Cualquier prueba que modifique datos debe limitarse a la cuenta identificada y su alcance autorizado.

Para pruebas desde cloud, además se necesitan las dos variables públicas y acceso HTTPS al proyecto. Configurarlas en los ajustes del entorno; las de Vercel no viajan automáticamente. Copiar únicamente URL y publishable key del proyecto autorizado, no service_role/sb_secret_, contraseñas ni tokens. El borrador ya recoge los nombres; no repetir el bucle de publicación si la interfaz sigue fallando.

Si no llega el correo: comprobar spam y restricciones SMTP del proyecto. No reenviar en bucle, cambiar planes ni desactivar seguridad; el SMTP predeterminado limita destinatarios al equipo. Conectividad, confirmación, sesión auténtica, SQL y navegador simulado son comprobaciones distintas. Fase B abierta; main/producción y XP/ELO no se promueven automáticamente.
