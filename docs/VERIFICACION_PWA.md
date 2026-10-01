# PWA, conexión y pendientes — 2026-10-01

## Alcance

Rama `codex/reliability-offline-v1`, PC local Windows, base de recuperación `176d470`. Bloque autorizado: carga offline, instalación web, indicador de conexión y resultados pendientes visibles/reintento automático. Sin cambios de reglas del motor, esquema/servicios Supabase, Vercel, hardware o funciones competitivas. Fase B y promoción a main siguen pendientes del recorrido autenticado real.

## Archivos y decisiones

- `tooling/pwa.ts`: plugin Vite solo de build, manifest e iconos PNG deterministas 192/512, huella por contenido y recursos exactos. Enlaces de manifest/icono solo en HTML generado, sin 404 durante desarrollo. Se añade únicamente `@types/node` 24.19.0 para las herramientas, no una biblioteca PWA de ejecución.
- `tooling/service-worker.js`: precaché de HTML/JS/CSS/manifest/iconos emitidos; ni API, Auth, peticiones externas, Authorization, POST, URLs arbitrarias ni caché dinámica. La sonda de conexión queda fuera. Instalación incompleta elimina únicamente su nueva caché. Activación retira cachés estáticas antiguas del marcador, nunca localStorage ni cachés de otras apps.
- `src/system/useOfflineApp.ts`: registro en build y contexto seguro, confirmación de todos los recursos cacheados, aviso de actualización en espera y botón de instalación cuando existe prompt. No `skipWaiting`, recarga forzada ni sustitución a mitad de partido. Limpieza de listeners/puertos/timers.
- `src/system/ConnectionMonitor.ts`, `useConnection.ts`, `public/connection.json`: sonda GET sin caché/credenciales de máximo 4 s, revisiones cada 30 s visibles y eventos de foco/red. Respuestas antiguas no revierten una desconexión posterior. ONLINE significa servidor web alcanzable, no salud de Supabase. La partida funciona con cualquier estado.
- `OfflineIdentityStore.ts`, `useData.ts`: ID local mínimo/versionado por proyecto para seleccionar copias sin red. No contiene correo ni token, no autoriza APIs. Se conserva el almacenamiento de sesión existente del SDK; acceso remoto exige sesión/RLS. Tras reconexión se verifica la sesión, y si ya no existe hay que entrar con la cuenta original. Sign-out olvida selector sin borrar colas.
- `SaveCoordinator.ts`, `usePendingQueue.ts`: observación de escrituras/confirmaciones, contador, consulta local y reintento automático con app abierta, conectada y sesión verificada, fuera del partido activo/guardado. Fallos iguales no disparan bucle; próxima reconexión/cambio de cola o botón manual vuelve a intentar. UUID estable, timeout de 10 s y aislamiento por cuenta conservados.
- `PendingMatchesScreen.tsx`, App/Ajustes/Historial/CSS: lista y cronología local en español, resultado/jugadores/ganador/prórroga/penaltis, controles táctiles e indicador ámbar offline. Historial remoto sigue necesitando conexión. El resumen se actualiza a guardado solo tras confirmación del ID correspondiente.
- `vite.config.ts`, package.json/lockfile, `tests/uiFixture.tsx`: build especial offline-test, salida ignorada `tmp/pwa-test`, preview aislado 5188. Fixture en memoria solo en desarrollo/build de prueba; no incluida en `dist/` normal. `?network=real` consulta el servidor local antes de las operaciones simuladas. Ningún dato se envía a Supabase en estas pruebas.
- README, contexto maestro y estado actual actualizados para agentes locales/cloud. Sin migraciones nuevas, cuentas creadas ni despliegue.

## Automatización

`npm test`: motor, persistencia, recuperación y offline correctos. `npm run build`: TypeScript y Vite correctos, sin avisos. `npm run build:test-offline`: correcto. Auditoría de instalación: cero vulnerabilidades.

`tests/offline.test.ts` ejecuta la plantilla real del worker con primitivas de navegador simuladas: allowlist, reapertura offline, exclusión de API/credenciales, readiness, actualización sin forzar, conservar versión anterior ante instalación fallida, cachés ajenas intactas y ausencia de escrituras dinámicas. También valida formato/dimensiones PNG, transiciones/respuestas desordenadas de red, identidad mínima aislada/corrupta y observadores que no alteran durabilidad/modo prueba.

Los tests anteriores cubren UUID/idempotencia, timeout, reintentos, penaltis, cuenta/cola y recuperación/bloqueo de gol. No se modifica MatchEngine en este bloque.

## Navegador real: servidor apagado

CLI agent-browser no disponible; utilizado navegador integrado y previews aisladas, sin tocar el servidor del usuario en 5173.

1. Preview de fixture build en 5188, `?network=real`. Esperar OFFLINE DISPONIBLE, prueba OFF, jugadores BLANCO UNO/AZUL UNO y dos goles por periodo. Gol blanco 1–0.
2. Apagar el servidor preview y cerrar la pestaña. Abrir otra con la misma URL, sin servidor: HTML/JS/CSS cargan del service worker. Aparecen SIN CONEXIÓN, SESIÓN LOCAL y PARTIDO POR RECUPERAR 1–0/0:28 jugados; la identidad simulada remota también falla, ejercitando el selector local.
3. Recuperar: PAUSA y 04:32 restantes. Continuar, completar partes hasta 4–0, terminar sin servidor: resultado pendiente local. Recargar todavía sin servidor; AJUSTES → VER 1 PENDIENTES conserva resultado, participantes y once eventos, incluida pausa de recuperación. Lista/detalle a 800×480 sin scroll general.
4. Restaurar servidor y pulsar COMPROBAR CONEXIÓN (sin pulsar reintentar): cola automáticamente vacía, SINCRONIZACIÓN COMPLETADA y un único partido 4–0 en historial de repositorio simulado. Esto demuestra reconexión web/flujo UI, no transacción real Supabase.
5. Rebuild de fixture: en la app abierta aparece actualización pendiente sin recarga automática. Cerrar y reabrir activa el build nuevo. Partido adicional 2–0 con `?save=offline`: panel en español, siete eventos y botón volver al partido íntegro. Quitar parámetro: cola sincronizada automáticamente. Modo prueba ON restaurado, cero pendientes de fixture y consola de aplicación sin avisos/errores capturados.
6. Build real de producción, puerto 5189, sin sesión: Nuevo Partido/Ajustes, enlace de manifest y OFFLINE DISPONIBLE. Consola sin avisos/errores capturados. Apagar servidor, cerrar y abrir nueva pestaña en raíz: carga real desde caché, SIN CONEXIÓN y acceso remoto deshabilitado. Sin cuenta Auth ni acceso a filas de Supabase.
7. Producción a 800×480: documento 800×480. A 390×844: documento 390×844, canvas 390×234 centrado en y=305, sin recortes/scroll general. En ventana 1280×720 el canvas se conserva a 800×480 centrado.
8. Viewport restaurado, cerradas solo las pestañas temporales y detenidos solo los previews propios 5188/5189. El servidor/local tab del usuario permanece intacto.

Evidencias locales ignoradas por Git: `tmp/verificacion-pwa-recuperacion-offline.png`, `tmp/verificacion-pwa-pendiente-800x480.png`, `tmp/verificacion-pwa-produccion-offline-800x480.png`. La instalación física en móvil no se ha probado.

## Límites y continuación

Primera carga completa con conexión y almacenamiento disponible obligatorios. Misma dirección/navegador/cuenta; instalar puede usar otro contenedor de almacenamiento según el sistema: comprobar disponibilidad y sesión en la app instalada. HTTP LAN no habilita service worker; usar HTTPS publicado, o localhost únicamente en desarrollo local. No hay background sync con app cerrada, recuperación entre dispositivos, historial remoto offline ni backup. No borrar datos con partidos pendientes. Modo prueba ON sigue sin escribir partidos ni checkpoints.

Pendiente: cuenta de operador introducida personalmente, recorrido Auth → jugadores → partido real → RPC → historial y reintento real sin duplicados. Después revisión/promoción de la rama y eventual despliegue HTTPS autorizado. No declarar fase B cerrada ni avanzar a XP/ELO.

Referencias consultadas: [instalación PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers), [límites de navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine), [Supabase getSession](https://supabase.com/docs/reference/javascript/auth-getsession). La sesión obtenida por el cliente no sustituye autorización del servidor/RLS; la identidad local tampoco.
