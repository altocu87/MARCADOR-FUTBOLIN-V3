# MARCADOR FUTBOLÍN V3

Simulador táctil del marcador físico de futbolín. React + Vite + TypeScript + CSS, con motor independiente y persistencia privada en Supabase.

## Contexto y estado de la fase

Antes de modificar código, leer `AGENTS.md`, `docs/CONTEXTO_MAESTRO.md` y `docs/ESTADO_ACTUAL.md`. Mantenerlos actualizados después de cada bloque.

Persistencia V1 está en revisión en `codex/reliability-offline-v1`: tests locales y simulaciones correctos, pero falta el recorrido autenticado navegador → Supabase con la cuenta del operador. No considerar esta fase cerrada ni promoverla a main hasta completar esa validación. Las migraciones del proyecto existente ya están aplicadas; no repetirlas.

## Continuar en Codex Cloud

El [resumen y guía de traspaso](docs/TRASPASO_NUBE.md) reúne los avances, los módulos, las comprobaciones y un mensaje listo para la primera tarea cloud. El [estado actual](docs/ESTADO_ACTUAL.md) mantiene los datos operativos posteriores.

La configuración cloud inicial utilizó `main`, que todavía no contiene persistencia, recuperación, PWA ni la adaptación responsive. Antes de modificar, sincronizar de forma segura **origin/codex/reliability-offline-v1** y leer el contexto de esa rama. No fusionar a main para resolver el traspaso.

En el entorno cloud, usar Node 24 y `npm ci --cache /tmp/codex-npm-cache`, después `npm test` (seis grupos) y `npm run build`. Revisar/publicar la configuración preparada del entorno si aún está en borrador. Las variables públicas Supabase son opcionales para compilar/probar el simulador, pero necesarias para probar datos reales; las variables de Vercel no se transfieren automáticamente al entorno cloud.

## Vista previa online

[Abrir la versión responsive de desarrollo](https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app).

Se puede abrir desde el móvil sin tener el PC encendido. Es una vista previa protegida: si Vercel pide acceso, iniciar sesión con la cuenta propietaria autorizada. No es la cuenta del marcador. Mantener MODO PRUEBA ON para probar partidos sin guardar datos.

El 2026-10-01 se configuraron las variables públicas de conexión solo para Preview en la rama `codex/reliability-offline-v1`. El registro de operador es por correo/contraseña; los jugadores no necesitan cuentas. Antes de confirmar correos, añadir la URL exacta de la vista previa (con `/` final) a las Redirect URLs de Supabase Auth, conservando las existentes. No se ha podido modificar esa configuración desde el acceso de gestión disponible. Estado operativo y límites en `docs/ESTADO_ACTUAL.md` y pasos en `docs/VERIFICACION_VERCEL_DATOS.md`.

## Instalación

Node.js 22.12 o superior (validado con Node 24) y npm. El proyecto Supabase existente solo es necesario para el acceso y la persistencia reales; el simulador en modo prueba, los tests y el build pueden funcionar sin configurarlo.

```bash
npm ci
npm run dev
```

Copia `.env.example` a `.env.local` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. También se admite la clave pública legacy `VITE_SUPABASE_ANON_KEY`. Reinicia Vite al cambiar variables. Nunca uses `service_role` ni claves `sb_secret_` en el navegador: se rechazan.

Las variables VITE son públicas y se incluyen en el build. La seguridad depende de Auth, RLS y permisos, no de ocultar una clave pública. Los archivos .env reales, dependencias, dist y credenciales están ignorados por Git.

## Pruebas y build

```bash
npm run test:engine
npm run test:persistence
npm run test:recovery
npm run test:offline
npm run test:layout
npm run test:auth
npm test
npm run build
npm run preview
```

El build comprueba TypeScript y genera `dist/`. Las pruebas SQL reproducibles están en `supabase/tests/persistence_v1.sql`: ejecutar completas como administrador, con su ROLLBACK final. Usan fixtures temporales y no dejan cuentas ni partidos.

La página `/tests/ui-fixture.html` inyecta repositorios en memoria para verificar formularios, partido e historial sin usar credenciales ni modificar Supabase. Está disponible en desarrollo y en el build aislado `npm run build:test-offline` → `npm run preview:test-offline` (puerto 5188, salida ignorada `tmp/pwa-test`). No valida Supabase real ni forma parte de `dist/` de producción. `?network=real` exige respuesta del servidor local para simular identidad, jugadores y guardado; permite apagar ese servidor y verificar el arranque desde la caché PWA.

Para reproducir fallos de guardado en esa fixture: `?save=offline` simula un rechazo de red y `?save=hang` una petición que nunca responde. Con MODO PRUEBA OFF, completar un partido y comprobar el aviso de pendiente. Recargar conserva la cola; abrir la fixture sin esos parámetros y reintentar en AJUSTES simula la recuperación. Son datos de prueba locales, no registros de Supabase. Restaurar MODO PRUEBA ON después de verificar.

## Primera puesta en marcha

1. En Supabase, aplicar las migraciones de `supabase/migrations/` en orden si se utiliza otro proyecto. Ya están aplicadas en el proyecto unemjyfhzljcdjcbiiwh.
2. Abrir AJUSTES → GENERAL. Crear una cuenta de operador con correo y contraseña, confirmar el correo si Supabase lo requiere e iniciar sesión. Los jugadores no necesitan cuentas.
3. Abrir JUGADORES para crear nombres y alias, editarlos o activarlos/desactivarlos.
4. Desactivar MODO PRUEBA para guardar partidos reales.
5. NUEVO PARTIDO → modo → configuración → elegir exactamente 2 o 4 jugadores activos. El orden de selección indica BLANCO 1, AZUL 1, BLANCO 2 y AZUL 2.
6. Jugar, completar todas las partes y consultar el resultado. RANKING contiene el HISTORIAL V1, no cálculos de clasificación.

No es la contraseña de la cuenta del panel Supabase: es un acceso propio al marcador. Si el correo de confirmación redirige a una URL no disponible, regresar al marcador e intentar iniciar sesión después de confirmar. Para un dominio definitivo, configurar Site URL y URLs de redirección en Supabase Auth; no desactivar la confirmación ni RLS.

El registro valida correo y contraseña antes del envío y solicita volver al origen actual, sin copiar tokens ni parámetros de la dirección. CREAR CUENTA y ENTRAR pasan por la validación del formulario. Los errores de acceso se muestran en español sin detalles internos. Con el correo predeterminado de Supabase, solo se admiten direcciones del equipo y hay límites de envío; para otros destinatarios hace falta configurar SMTP propio con autorización y sin asumir costes. No crear cuentas de prueba reales ni omitir la confirmación para cerrar la fase.

## Pantallas adaptables y referencia 800×480

La web utiliza **WEB ADAPTABLE** por defecto: menú, tarjetas, marcador, formularios e historial se reorganizan para móvil, tablet y escritorio, en ambas orientaciones. Área útil limitada a 1600×1000 y centrada en monitores mayores. No hay scroll general ni dependencia de aspect-ratio: listas, formularios y contenido que no cabe se desplazan dentro de su panel. Controles táctiles, ratón y teclado.

En **AJUSTES → GENERAL → VISTA DE PANTALLA** puedes elegir **PANTALLA 800×480**: conserva la referencia física exacta, centrada sin ampliar y escalada proporcionalmente en ventanas menores. La elección se recuerda en este navegador. Cambiar vista o tamaño no reinicia el partido. A muy poca altura se permite scroll interno para conservar controles accesibles.

Usa un navegador moderno con soporte de container queries. Verificación de tamaños emulados y límites en `docs/VERIFICACION_RESPONSIVE.md`; todavía falta probar en teléfonos físicos. React no se ejecutará directamente en el ESP32.

## Arquitectura

- `src/match-engine/`: estado, reglas, reloj y cronología; sin React, DOM ni Supabase.
- `src/inputs/`: contrato de entradas y adaptador táctil/ratón.
- `src/app/`: navegación, sesión, caché de jugadores, recuperación del partido activo y coordinación del guardado final.
- `src/ui/`: pantallas y presentación.
- `src/services/persistence/`: modelos, contratos PlayerRepository/MatchRepository, mapeo, copia activa versionada y cola offline.
- `src/services/supabase/`: cliente oficial, adaptadores Auth/repositorios y tipos generados de la base.
- `src/system/`: comprobación de conexión, preparación offline e instalación PWA, sin dependencias del motor.
- `tooling/`: plugin de build, iconos, manifest y service worker con lista exacta de recursos estáticos.
- `supabase/migrations/`: esquema, RLS, RPC transaccional e integridad.
- `tests/`: pruebas del motor, persistencia y fixture visual aislada.

### Motor

Gestiona cuenta atrás, goles por equipo, pausa, bloqueo de tres segundos, correcciones, deshacer, partes, prórroga de 60 segundos con gol de oro y penaltis. En GOALS el tiempo no finaliza una parte. Se mantiene el criterio existente: goalLimit cuenta los goles totales de la parte, no el objetivo individual de un equipo. TIME usa el reloj y BOTH la primera condición.

Cada acción aceptada genera un evento secuencial con periodo, tiempo acumulado de juego, marcador y fecha. Pausas y cuentas atrás no suman tiempo de juego. Deshacer conserva la cronología y no retrocede el reloj; los goles anulados quedan referenciados por ID. No se identifica al jugador goleador. Los penaltis alternan blanco/azul y resuelven la tanda reglamentaria o muerte súbita. El resumen y la persistencia usan el ganador de penaltis cuando corresponde.

El bloqueo de goles de tres segundos conserva el plazo del último gol aceptado incluso al deshacer, corregir, pausar/continuar o cambiar de parte/prórroga y saltar la cuenta atrás. Una partida nueva empieza sin heredar el bloqueo de la anterior.

Al deshacer desde el fin de una parte o un gol de oro, el reloj continúa desde el tiempo jugado sin incorporar la espera en la pantalla de final.

### Guardado y seguridad

Cuatro tablas: players, matches, match_participants y match_events. Cada fila pertenece a la cuenta autenticada del operador. RLS está activa; anónimos no pueden leer ni escribir. Players permite crear/editar datos básicos; XP/ELO y valores reservados no son modificables por el cliente. No existe cálculo de progresión.

Al finalizar, App transforma una instantánea del motor y participantes. La operación save_match_v1 guarda el agregado en una sola transacción, aplica RLS como SECURITY INVOKER y valida la cuenta de inicio. UUID estable y hash de contenido hacen idempotentes los reintentos. Triggers diferidos también impiden insertar partidos incompletos por fuera de la RPC.

Un jugador con historial no puede eliminarse; se desactiva. La interfaz también bloquea la eliminación de participantes de un partido en curso o de resultados pendientes en este dispositivo. Sus nombres en los partidos se conservan como snapshots aunque se edite el jugador. Si se trabaja desde varios dispositivos, desactivar es la opción segura: otro dispositivo puede tener un partido aún no sincronizado.

### Modo prueba y offline

MODO PRUEBA está ON por defecto, se recuerda localmente y se fija al empezar cada partido. No guarda partidos, participantes ni eventos, ni los escribe en la cola local o en copias de recuperación. Sin jugadores reales hay dos plazas de práctica únicamente en este modo. La gestión de jugadores sigue siendo real si se inicia sesión.

No se envían goles a la nube durante el juego. La lista de jugadores se conserva por proyecto/cuenta para empezar partidos sin red tras un primer acceso. El build incluye una PWA que permite volver a cargar la aplicación sin servidor después de prepararla con conexión. Esta función no está activa en `npm run dev`.

Con prueba OFF y sesión de operador, cada acción aceptada y cada segundo de reloj actualizan una copia local del partido activo. Después de recargar o cerrar y volver a abrir, aparece PARTIDO POR RECUPERAR: conserva ID, configuración, jugadores, marcador, tiempos, eventos, goles anulados y penaltis. Pulsa RECUPERAR PARTIDO; si estaba jugando, reaparece en pausa y requiere CONTINUAR. El tiempo de cierre no cuenta como juego. Una cuenta atrás se reinicia en 3, los descansos y los turnos de penaltis se conservan. Un resultado final aún no entregado conserva su ID para reintentar sin duplicarlo.

La recuperación requiere la misma cuenta, navegador y dirección del marcador. No se transfiere entre PC y móvil. Usa una sola pestaña activa; una copia incompatible o con eventos más recientes se protege frente a sobrescritura. Si falla el almacenamiento, se muestra un aviso de no cerrar/recargar y el partido sigue en memoria. No borres los datos del navegador. Una caída abrupta puede perder la fracción de segundo no registrada; no es un backup ni una garantía si falla el disco. Detalles y pruebas en `docs/VERIFICACION_RECUPERACION.md`.

Con prueba OFF, el resultado se escribe primero en localStorage y después se envía a Supabase. Si falla, queda pendiente en ese navegador/dispositivo; AJUSTES → VER PENDIENTES permite consultar resultado, jugadores y cronología, sin depender de Supabase. La app abierta reintenta automáticamente al recuperar conexión y sesión válida, fuera de un partido en curso o guardado activo; también permite reintentar manualmente. Un fallo no inicia un bucle de reintentos. No se sincroniza una cola desde otra cuenta. No borres los datos del navegador mientras haya pendientes. Si falla incluso el almacenamiento local, el resumen permanece en memoria y pide no cerrar y reintentar. Pendientes no son copias de seguridad y no se comparten entre móvil/PC.

La copia del partido activo solo se retira después de conservar el resultado final en la cola durable o confirmar el guardado. Si falla esa entrega, la copia de recuperación no se descarta.

El coordinador limita cada intento a diez segundos para no bloquear indefinidamente el resumen. Una confirmación tardía no elimina la copia local: el reintento idempotente con el mismo ID recupera la operación sin duplicarla. Cada confirmación retira solo su partido, conservando los demás pendientes.

El historial requiere conexión: lista paginada de 20 partidos, participantes, ganador, prórroga/penaltis y detalle cronológico. No se calcula XP, ELO, ranking ni estadísticas.

### Preparar e instalar la PWA

1. Generar el build y abrir `npm run preview`, o una publicación HTTPS autorizada. En un móvil, `127.0.0.1` apunta al propio móvil, no al PC; una dirección LAN HTTP no sustituye HTTPS para el service worker.
2. Con conexión, esperar en AJUSTES → GENERAL el mensaje **OFFLINE DISPONIBLE EN ESTE DISPOSITIVO**. Para partidos reales, haber iniciado sesión y cargado jugadores en ese mismo navegador/origen.
3. Si aparece INSTALAR APLICACIÓN, usarlo; si no, usar el menú del navegador → Instalar / Añadir a pantalla de inicio. La disponibilidad depende del navegador. No hace falta instalar para usar la caché en un navegador compatible.
4. Usar una sola pestaña. Una actualización espera al cierre de la aplicación; no fuerza recargas. No cerrar con una advertencia de copia incompleta o fallo de almacenamiento.

El service worker solo conserva HTML, JS, CSS, manifest e iconos del build. No almacena respuestas Supabase, correo, tokens ni resultados: estos últimos mantienen su almacenamiento local existente. Un selector local contiene solo el ID de la última cuenta y permite recuperar sus copias sin red; no es una credencial. El SDK de Auth conserva su propia sesión como antes. Para enviar datos se vuelve a verificar la sesión y RLS permanece vigente. Cerrar sesión elimina el selector, no las colas de partidos.

El punto verde significa que responde el servidor web (sonda no cacheada, máximo cuatro segundos; revisión cada treinta segundos mientras la app está visible). No demuestra que Supabase o la sesión funcionen. Sin servidor se muestra **SIN CONEXIÓN** con punto ámbar; AJUSTES permite COMPROBAR CONEXIÓN.

No hay primera carga offline, sincronización con la app cerrada, backup, historial remoto offline ni garantía frente a eliminación de datos/cuota del navegador. Detalles y pruebas reales de servidor apagado en `docs/VERIFICACION_PWA.md`. La instalación en un teléfono físico y el recorrido autenticado Supabase siguen pendientes. La vista previa Vercel está publicada, pero el comportamiento PWA detrás de su protección debe verificarse en el dispositivo; las pruebas offline anteriores fueron locales.

## Próximas fases

ESP32-S3: futura interfaz física a 800×480 (el firmware no ejecutará React directamente). ESP32-C3: futuro adaptador de pulsadores/sensores que genere eventos equivalentes. La separación motor/entradas/repositorios prepara esa integración, pero aún no existe firmware.

Vercel: aplicación estática Vite, build `npm run build`, salida `dist`. GitHub genera vistas previas de la rama de desarrollo. URL y clave publishable configuradas únicamente para Preview de esta rama; producción y otras ramas no reciben esa configuración. No se ha promovido esta rama a producción ni activado servicios de pago. El registro y guardado autenticados siguen pendientes de la confirmación de correo y prueba del operador.
