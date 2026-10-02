# MARCADOR FUTBOLÍN V3

Simulador táctil del marcador físico de futbolín. React + Vite + TypeScript + CSS, con motor independiente y persistencia privada en Supabase.

## Versión y novedades

Versión actual de la rama de desarrollo: **0.4.0**. Se muestra al pie de la aplicación; **AJUSTES → VERSIONES** ofrece un historial breve, disponible sin cuenta y también sin conexión después de cargar la aplicación. Numeración retroactiva por entregas: 0.0.0 simulador inicial; 0.1.0 consolidación, cuentas, historial y offline; 0.2.0 experiencia/niveles; 0.3.0 clasificación competitiva preparada, ELO desactivado; 0.4.0 preparación del análisis competitivo y consulta de versiones. Publicar 0.4.0 no cierra 03/04 ni activa predicciones. La versión indica el build abierto: una PWA anterior seguirá mostrando su propia versión hasta actualizarse con el mecanismo existente.

Fuente de versión: `package.json`; contenido del historial: `src/app/releases.ts`. Mantener ambos y el metadato raíz del lockfile al publicar cada entrega, sin cambiar versiones de dependencias. Ver alcance y comprobaciones en [VERIFICACION_VERSIONES.md](docs/VERIFICACION_VERSIONES.md).

## Contexto y estado de la fase

Antes de modificar código, leer `AGENTS.md`, `docs/CONTEXTO_MAESTRO.md` y `docs/ESTADO_ACTUAL.md`. Mantenerlos actualizados después de cada bloque.

Persistencia V1 está en revisión en `codex/reliability-offline-v1`: **bloque 01 cerrado funcionalmente el 2026-10-02**, con todas las pruebas confirmadas por el propietario, incluida recuperación/PWA física, más pruebas independientes y SQL real. No repetir cuenta, checklist ni migraciones ya aplicadas. Evidencia en [VERIFICACION_BLOQUE_01.md](docs/VERIFICACION_BLOQUE_01.md). Bloque 02 implementado y activado con parámetros expresamente aprobados; pruebas independientes y SQL real completas, observación autenticada XP en Preview sin acceso del agente. Ver [VERIFICACION_BLOQUE_02.md](docs/VERIFICACION_BLOQUE_02.md). Bloque 03 implementado y verificado: ELO/ranking privado/categorías/máximo, todavía desactivado hasta aprobar parámetros; ver [VERIFICACION_BLOQUE_03.md](docs/VERIFICACION_BLOQUE_03.md). 04 preparado parcialmente con diseño/pruebas aislados; espera cierre de 03 y decisiones propias. Personalización de correos hosted/remitente SMTP queda como pendiente externo separado; no se promueve main.

Por autorización posterior del propietario, se añade el primer bloque de fase C: estadísticas básicas, perfiles y análisis de resultados con filtros, desarrollado con pruebas independientes y validación humana de guardado/perfiles/alias/baja lógica en el cierre de 01. El bloque 02 posterior añade XP/niveles configurables y progresión de perfil; el 03 prepara ELO y clasificación privada, pendientes de aprobación/activación.

## Continuar en Codex Cloud

El [resumen y guía de traspaso](docs/TRASPASO_NUBE.md) reúne los avances, los módulos, las comprobaciones y un mensaje listo para la primera tarea cloud. El [estado actual](docs/ESTADO_ACTUAL.md) mantiene los datos operativos posteriores.

Para una conversación por entrega, usar [Bloques de desarrollo y prompts](docs/BLOQUES_DESARROLLO.md). Registra el punto alcanzado, diez bloques propuestos, dependencias, criterios de cierre y un prompt completo por bloque. El bloque 01 está cerrado por confirmación humana. El 02 tiene parámetros aprobados, código/UI y SQL privado real comprobados, con límite explícito de observación de Preview autenticada. El 03 está implementado/verificado pero desactivado; 04 tiene preparación independiente y espera su cierre competitivo. Leer el plan no autoriza ejecutar todas las fases; las reglas propuestas se concretan antes de activarlas.

La configuración cloud inicial utilizó `main`, que todavía no contiene persistencia, recuperación, PWA ni la adaptación responsive. Antes de modificar, sincronizar de forma segura **origin/codex/reliability-offline-v1** y leer el contexto de esa rama. No fusionar a main para resolver el traspaso.

En el entorno cloud, usar Node 24 y `npm ci --cache /tmp/codex-npm-cache`, después `npm test` (diez grupos, incluido contrato aislado de 04) y `npm run build`. Revisar/publicar la configuración preparada del entorno si aún está en borrador. Las variables públicas Supabase son opcionales para compilar/probar el simulador, pero necesarias para probar datos reales; las variables de Vercel no se transfieren automáticamente al entorno cloud.

## Vista previa online

Comprobación humana del 2026-10-02: captura de la Preview v0.4.0 con sesión activa y perfil Alex2, 225 XP/nivel 1, 30 XP para nivel 2 y ELO pendiente de aprobación. La interfaz autenticada queda observada para ese perfil; el acceso directo del conector Vercel sigue pendiente por separado. No se activa ELO ni se solicitan nuevas cuentas/partidos. Evidencia vigente en ESTADO_ACTUAL.

[Abrir la versión responsive de desarrollo](https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app).

Se puede abrir desde el móvil sin tener el PC encendido. Es una vista previa protegida: si Vercel pide acceso, iniciar sesión con la cuenta propietaria autorizada. No es la cuenta del marcador. Mantener MODO PRUEBA ON para probar partidos sin guardar datos.

El 2026-10-01 se configuraron las variables públicas de conexión solo para Preview en la rama `codex/reliability-offline-v1`. El registro de operador es por correo/contraseña; los jugadores no necesitan cuentas. Para un primer registro, el origen debe estar autorizado en las Redirect URLs de Supabase Auth. El operador actual ya tiene login confirmado: usar su cuenta existente, sin repetir registro ni configuración por rutina. Estado operativo y límites en `docs/ESTADO_ACTUAL.md` y pasos en `docs/VERIFICACION_VERCEL_DATOS.md`.

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
npm run test:statistics
npm run test:block04
npm run test:browser
npm test
npm run build
npm run preview
```

El bloque 01 añade `node --import tsx supabase/tests/block01.ts > /tmp/futbolin-block01.sql`: genera comprobaciones de la RPC real desde el motor. Ejecutar siempre el SQL completo en una única transacción terminada en ROLLBACK, usando una cuenta confirmada existente; no crea cuentas ni conserva fixtures.

El build comprueba TypeScript y genera `dist/`. Las pruebas SQL reproducibles están en `supabase/tests/persistence_v1.sql`: ejecutar completas como administrador, con su ROLLBACK final. Usan fixtures temporales y no dejan cuentas ni partidos.

`npm run test:browser` genera ambos builds y ejecuta las regresiones Chromium con Playwright 1.63.0: vistas, las tres condiciones de victoria, acceso con cookie de vista protegida, prueba sin guardado, recuperación 2v2, pendientes/historial sin duplicados, perfiles/estadísticas, análisis/filtros y reapertura PWA con servidor apagado. Usa `PLAYWRIGHT_CHROMIUM_EXECUTABLE`, Chromium del sistema en `/usr/bin/chromium` o el navegador de Playwright (`npx playwright install chromium`). Preview aislado en 5197, contextos temporales y tráfico Supabase bloqueado; no verifica Auth ni datos reales. `npm test` ejecuta diez grupos independientes del navegador; estadísticas/análisis 42 casos, XP ocho, ELO/repositorio catorce y contratos aislados de 04 doce. Chromium de la preparación parcial de 04: 42/42; con versión/historial visible: 44/44, conservando esos recorridos. La prueba SQL real reproducible de XP se describe en [VERIFICACION_BLOQUE_02.md](docs/VERIFICACION_BLOQUE_02.md). Resultados del bloque inicial cloud y pasos para cerrar fase B en [VERIFICACION_NUBE.md](docs/VERIFICACION_NUBE.md); estadísticas en [VERIFICACION_ESTADISTICAS.md](docs/VERIFICACION_ESTADISTICAS.md).

La página `/tests/ui-fixture.html` inyecta repositorios en memoria para verificar formularios, partido e historial sin usar credenciales ni modificar Supabase. Está disponible en desarrollo y en el build aislado `npm run build:test-offline` → `npm run preview:test-offline` (puerto 5188, salida ignorada `tmp/pwa-test`). No valida Supabase real ni forma parte de `dist/` de producción. `?network=real` exige respuesta del servidor local para simular identidad, jugadores y guardado; permite apagar ese servidor y verificar el arranque desde la caché PWA.

Para reproducir fallos de guardado en esa fixture: `?save=offline` simula un rechazo de red y `?save=hang` una petición que nunca responde. Con MODO PRUEBA OFF, completar un partido y comprobar el aviso de pendiente. Recargar conserva la cola; abrir la fixture sin esos parámetros y reintentar en AJUSTES simula la recuperación. Son datos de prueba locales, no registros de Supabase. Restaurar MODO PRUEBA ON después de verificar.

## Primera puesta en marcha

1. En Supabase, aplicar las migraciones de `supabase/migrations/` en orden si se utiliza otro proyecto. Ya están aplicadas en el proyecto unemjyfhzljcdjcbiiwh.
2. Abrir INICIAR SESIÓN en la esquina superior y entrar con la cuenta existente. Solo para una primera cuenta, usar IR AL REGISTRO DE CUENTA NUEVA, completar su formulario CREAR CUENTA y confirmar el correo si Supabase lo requiere. Los jugadores no necesitan cuentas.
3. Abrir JUGADORES para crear nombres y alias, editarlos o activarlos/desactivarlos.
4. Desactivar MODO PRUEBA para guardar partidos reales.
5. NUEVO PARTIDO → modo → configuración → elegir exactamente 2 o 4 jugadores activos. El orden de selección indica BLANCO 1, AZUL 1, BLANCO 2 y AZUL 2.
6. Jugar: por goles, alcanzar el objetivo con un equipo; por tiempo, completar las dos partes. Consultar el resultado. RANKING contiene el HISTORIAL V1, no cálculos de clasificación.

No es la contraseña de la cuenta del panel Supabase: es un acceso propio al marcador. Si el correo de confirmación redirige a una URL no disponible, regresar al marcador e intentar iniciar sesión después de confirmar. Para un dominio definitivo, configurar Site URL y URLs de redirección en Supabase Auth; no desactivar la confirmación ni RLS.

El acceso está en la esquina superior: INICIAR SESIÓN y REGISTRO; con sesión aparece MI CUENTA. Los formularios son independientes, con confirmación de contraseña en registro y opciones de recuperar contraseña/reenviar confirmación. MI CUENTA incluye nombre, cambio de correo con confirmación, cambio de contraseña actual/nueva/repetición y código cuando Auth lo exige, cierre local y global explícito. Los cambios sensibles verifican la identidad y contraseña actual; durante un partido se bloquean para conservar su recuperación. Ajustes mantiene jugadores, modo prueba, pendientes, vista y PWA, con enlace a cuenta.

La sesión se recuerda automáticamente mediante el SDK en este navegador y origen; no hay casilla Recordarme ni guardado de contraseña por la app. Actualizar o reabrir conserva el acceso mientras la sesión y el almacenamiento sigan disponibles. Cambiar de dominio/navegador, cerrar sesión o borrar datos puede exigir volver a entrar. Para preparar recuperación offline, entrar antes con conexión e iniciar con PRUEBA OFF; después no necesita un nuevo login sin red. Sincronizar al reconectar sí exige la sesión válida de esa cuenta.

El registro solicita retornar al origen actual sin copiar tokens ni parámetros, mantiene confirmación y explica la respuesta genérica ante correo existente. La recuperación abre la pantalla de nueva contraseña tras validación del SDK. El propietario confirmó el 2026-10-02 que la recuperación de contraseña real funciona; el agente no ha inspeccionado ese recorrido autenticado. Se usa su cuenta existente, sin nuevos registros de prueba. Las [trece plantillas de correo](supabase/templates/README.md) están preparadas en la estética futurista; **aún no aplicadas a Supabase hosted por falta de acceso de edición Auth**. El generador entrega un PATCH acotado listo para aplicar, sin cambiar SMTP/proveedores/notificaciones. Login Google y backup Drive siguen anotados para más adelante.

Si ENTRAR y CREAR CUENTA aparecen bloqueados, revisar el aviso de conexión/configuración o solicitud en curso. COMPROBAR CONEXIÓN consulta nuevamente el servidor. La sonda conserva cookies exclusivamente del mismo origen para respetar el acceso a Preview protegido; no sigue redirecciones a login ni acepta HTML/401 como conexión válida. No necesita desactivar protección Vercel ni cambiar Supabase. Corrección y límites en `docs/VERIFICACION_VERCEL_DATOS.md`. Si hay actualización PWA pendiente, cerrar todas las pestañas del marcador y volver a abrir permite activarla; no borrar datos locales con resultados pendientes.

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

Tres condiciones aclaradas por el propietario el 2026-10-01: **POR GOLES**, sin partes, con cronómetro ascendente sin límite de tiempo y gana el primer equipo en alcanzar el objetivo; **POR TIEMPO**, dos partes con marcador acumulado y gana quien marque más en total; **AMBAS**, objetivo de goles por equipo para el partido completo, sin reiniciarlo entre partes. El partido termina cuando un equipo alcanza ese total o al finalizar el tiempo de las dos partes; en este último caso gana quien tenga más goles acumulados. Ejemplo objetivo 5: primera parte 3–2, dos goles blancos en la segunda → final Blanco 5–2. También puede alcanzarse el objetivo en la primera parte y finalizar directamente.

La UI muestra tiempo jugado en GOALS y tiempo restante de cada parte en TIME/AMBAS. AMBAS muestra OBJETIVO TOTAL junto al reloj y el marcador acumulado. La duración configurada corresponde a cada parte. Al vencer la segunda parte con ganador, muestra directamente el final del partido; no exige VER RESULTADO. En empate tras dos partes se conserva prórroga de 60 segundos/gol de oro y después penaltis.

GOALS/TIME nuevos usan checkpoint V2; AMBAS nuevo usa V4. Copias V1/V2/V3 recuperadas y resultados antiguos mantienen sus reglas. La anterior interpretación por objetivo en cada parte (V3) fue un error del agente; solo se conserva para recuperar partidas anteriores sin cambiar sus reglas. El historial reconoce las reglas nuevas por metadatos del evento inicial; no hay migraciones ni reescritura de resultados/colas. Evidencia y límites en [VERIFICACION_MODALIDADES.md](docs/VERIFICACION_MODALIDADES.md).

Cada acción aceptada genera un evento secuencial con periodo, tiempo acumulado de juego, marcador y fecha. Pausas y cuentas atrás no suman tiempo de juego. Deshacer conserva la cronología y no retrocede el reloj; los goles anulados quedan referenciados por ID. No se identifica al jugador goleador. Los penaltis alternan blanco/azul y resuelven la tanda reglamentaria o muerte súbita. El resumen y la persistencia usan el ganador de penaltis cuando corresponde.

El bloqueo de goles de tres segundos conserva el plazo del último gol aceptado incluso al deshacer, corregir, pausar/continuar o cambiar de parte/prórroga y saltar la cuenta atrás. Una partida nueva empieza sin heredar el bloqueo de la anterior.

Al deshacer desde el fin de una parte o un gol de oro, el reloj continúa desde el tiempo jugado sin incorporar la espera en la pantalla de final.

### Guardado y seguridad

Cuatro tablas: players, matches, match_participants y match_events. Cada fila pertenece a la cuenta autenticada del operador. RLS está activa; anónimos no pueden leer ni escribir. Players permite crear/editar datos básicos; XP/ELO y valores reservados no son modificables por el cliente. XP/niveles efectivos se calculan en la vista privada de servidor `player_progression_v1`, con parámetros en `xp_rules_v1`; no usar columnas físicas reservadas como contadores de progresión.

Al finalizar, App transforma una instantánea del motor y participantes. La operación save_match_v1 guarda el agregado en una sola transacción, aplica RLS como SECURITY INVOKER y valida la cuenta de inicio. UUID estable y hash de contenido hacen idempotentes los reintentos. Triggers diferidos también impiden insertar partidos incompletos por fuera de la RPC.

Un jugador con historial no puede eliminarse; se desactiva. La interfaz también bloquea la eliminación de participantes de un partido en curso o de resultados pendientes en este dispositivo. Los nombres guardados al jugar se conservan en los datos originales; el historial muestra el alias actual, o el nombre actual si no hay alias, mediante el ID del jugador. Se incluyen jugadores inactivos y se usa el nombre guardado si no está disponible su ficha. Editar el nombre no reescribe resultados ni eventos. Si se trabaja desde varios dispositivos, desactivar es la opción segura: otro dispositivo puede tener un partido aún no sincronizado.

### Modo prueba y offline

MODO PRUEBA está ON por defecto, se recuerda localmente y se fija al empezar cada partido. No guarda partidos, participantes ni eventos, ni los escribe en la cola local o en copias de recuperación. Sin jugadores reales hay dos plazas de práctica únicamente en este modo. La gestión de jugadores sigue siendo real si se inicia sesión.

No se envían goles a la nube durante el juego. La lista de jugadores se conserva por proyecto/cuenta para empezar partidos sin red tras un primer acceso. El build incluye una PWA que permite volver a cargar la aplicación sin servidor después de prepararla con conexión. Esta función no está activa en `npm run dev`.

Con prueba OFF y sesión de operador, cada acción aceptada y cada segundo de reloj actualizan una copia local del partido activo. Después de recargar o cerrar y volver a abrir, aparece PARTIDO POR RECUPERAR: conserva ID, configuración, jugadores, marcador, tiempos, eventos, goles anulados y penaltis. Pulsa RECUPERAR PARTIDO; si estaba jugando, reaparece en pausa y requiere CONTINUAR. El tiempo de cierre no cuenta como juego. Una cuenta atrás se reinicia en 3, los descansos y los turnos de penaltis se conservan. Un resultado final aún no entregado conserva su ID para reintentar sin duplicarlo.

La recuperación requiere la misma cuenta, navegador y dirección del marcador. No se transfiere entre PC y móvil. Usa una sola pestaña activa; una copia incompatible o con eventos más recientes se protege frente a sobrescritura. Si falla el almacenamiento, se muestra un aviso de no cerrar/recargar y el partido sigue en memoria. No borres los datos del navegador. Una caída abrupta puede perder la fracción de segundo no registrada; no es un backup ni una garantía si falla el disco. Detalles y pruebas en `docs/VERIFICACION_RECUPERACION.md`.

Con prueba OFF, el resultado se escribe primero en localStorage y después se envía a Supabase. Si falla, queda pendiente en ese navegador/dispositivo; AJUSTES → VER PENDIENTES permite consultar resultado, jugadores y cronología, sin depender de Supabase. La app abierta reintenta automáticamente al recuperar conexión y sesión válida, fuera de un partido en curso o guardado activo; también permite reintentar manualmente. Un fallo no inicia un bucle de reintentos. No se sincroniza una cola desde otra cuenta. No borres los datos del navegador mientras haya pendientes. Si falla incluso el almacenamiento local, el resumen permanece en memoria y pide no cerrar y reintentar. Pendientes no son copias de seguridad y no se comparten entre móvil/PC.

Al finalizar, la copia del partido activo solo se retira después de conservar el resultado final en la cola durable o confirmar el guardado. Si falla esa entrega, la copia de recuperación no se descarta.

Para abandonar un partido sin terminar: NUEVO PARTIDO pregunta si deseas cancelarlo; «NO» conserva el partido y reanuda si estaba jugando, «SÍ» cancela únicamente ese partido y abre el menú nuevo. En PARTIDO POR RECUPERAR también aparece DESCARTAR PARTIDO con confirmación. No se descartan resultados terminados ni pendientes, jugadores o copias ajenas. Si la copia cambió en otra pestaña, es incompatible o falla la escritura, se conserva y se muestra el error. Esta opción fue autorizada expresamente el 2026-10-02; no equivale a borrar todos los datos del navegador. Prueba offline en móvil: pasos concretos en [VERIFICACION_BLOQUE_01.md](docs/VERIFICACION_BLOQUE_01.md).

El coordinador limita cada intento a diez segundos para no bloquear indefinidamente el resumen. Una confirmación tardía no elimina la copia local: el reintento idempotente con el mismo ID recupera la operación sin duplicarla. Cada confirmación retira solo su partido, conservando los demás pendientes.

El historial requiere conexión: lista paginada de 20 partidos, participantes, ganador, prórroga/penaltis y detalle cronológico. La progresión XP total y el panel ELO independiente se consultan en el perfil. RANKING → CLASIFICACIÓN abre la lista privada; ajustes ELO/categorías desactivados hasta aprobación.

### Estadísticas básicas y perfil de jugador

RANKING → ESTADÍSTICAS → elegir jugador, o AJUSTES → JUGADORES → PERFIL. Incluye búsqueda por nombre/alias y jugadores inactivos. El perfil muestra partidos, victorias, derrotas, empates, porcentaje de victorias, goles de su equipo a favor/en contra y diferencia. VER HISTORIAL DEL JUGADOR filtra antes de paginar; lista y detalle muestran los alias/nombres actuales de todos los participantes, manteniendo intactos los datos originales del partido.

Totales calculados desde **todos** los resultados guardados, no solo los primeros 20. Lectura por cursor fecha/ID, deduplicación por UUID y ninguna actualización de contadores. 1v1 y 2v2 usan la perspectiva del equipo; los goles no se atribuyen individualmente. Prórroga incluida en el marcador; penaltis deciden victoria/derrota pero sus lanzamientos no suman goles. Porcentaje = victorias / partidos × 100, redondeado a una decimal; sin partidos es 0%. Empates guardados se conservan como empates, aunque el flujo actual normalmente los resuelva.

Modo prueba, partidos no finalizados y cola pendiente quedan fuera. La baja lógica/renombrado no pierde resultados porque se relacionan por ID. Errores de página impiden mostrar totales parciales; sin conexión no se presentan ceros como estadísticas reales. Cancelación al abandonar/cambiar de perfil o cuenta. Actualizar vuelve a consultar; resultados añadidos durante la lectura requieren otra consulta para obtener una vista nueva, no se promete un snapshot transaccional entre dispositivos. No hay nueva tabla, migración, API de escritura ni modificación de Auth/RLS. El SDK/fixture aislados no sustituyen la verificación Supabase autenticada pendiente.

La gestión administrativa de añadir/editar/eliminar partidos fue reafirmada el 2026-10-02 y **aún no está implementada**: el historial actual es de lectura. Los cálculos básicos ya se derivan de los resultados guardados; prueba/pendientes no contribuyen. La futura gestión debe validar el agregado, auditar los cambios y recalcular todas las métricas; XP/niveles ya se reconstruyen desde el historial confirmado mediante la vista de 02; ELO de 03 también reconstruye cronológicamente, pendiente de activar; roles de administrador siguen futuros. Detalles y propuesta de ámbito/permisos en CONTEXTO_MAESTRO §23 y el seguimiento de bloques.

### XP y niveles

RANKING → ESTADÍSTICAS → jugador (o AJUSTES → JUGADORES → PERFIL) muestra nivel, XP confirmado, barra y XP restante. Niveles 0–100: umbral total `ceil(100×N^1.35)`, redondeo hacia arriba; nivel 100 sigue acumulando XP. Incluye los históricos válidos aprobados. Tabla por jugador: completar 50 + victoria 100/empate 60/derrota 25; victoria clasificatoria +50 y victoria por prórroga o penaltis +25 único. En 2v2 cada compañero recibe el total, sin repartir ni atribuir goles.

La progresión total es independiente del filtro de análisis. Solo resultados finales confirmados en Supabase contribuyen; prueba y cola sin sincronizar quedan fuera. Una recarga/retry no duplica: el total se reconstruye por identidad estable desde el historial vigente bajo RLS. Futuras ediciones/eliminaciones podrán reducir XP/nivel; esa gestión no está implementada. Las columnas físicas players.xp/level siguen reservadas: se lee la vista SECURITY INVOKER, sin escritura de XP desde el cliente. Parámetros versionados configurables únicamente en servidor mediante cambios revisados, sin nuevos administradores.

ACTUALIZAR, reconectar y confirmar sincronización vuelven a consultar; sin red/error el panel no afirma un total confirmado ni muestra ceros falsos. Los niveles de la lista local son la última copia recibida, no una concesión offline. No hay consultas por gol. Tabla, migraciones aplicadas, pruebas y límite de acceso Preview en [VERIFICACION_BLOQUE_02.md](docs/VERIFICACION_BLOQUE_02.md).

### ELO, clasificación privada y categorías

RANKING conserva el historial y añade CLASIFICACIÓN. Incluye jugadores de esta cuenta, también inactivos, enlaces al perfil, ELO actual/máximo, categoría y puesto. Identidad por UUID; renombrar no pierde trayectoria. Empates de ELO comparten puesto; sin clasificatorias confirmadas no hay puesto. El perfil competitivo mantiene el total independiente de filtros y XP.

**Configuración real desactivada hasta aprobación del propietario.** Inicio 1200 aprobado; K/experiencia, redondeo, categorías/histéresis, multiplicador e históricos pendientes, con ejemplos en [VERIFICACION_BLOQUE_03.md](docs/VERIFICACION_BLOQUE_03.md). La interfaz lo indica y no asigna categorías ni ajustes con propuestas. La producción solo lee una instantánea privada del servidor, sin escritura cliente de ELO protegido.

Solo Clasificatorio final confirmado podrá contribuir tras activación. Prueba, Rápido, Caos y pendientes no conceden ELO. Reconstrucción cronológica desde el historial vigente, medias de equipos previas en 2v2 y máximo recalculado, sin sumar por retry/recarga. Administración no implementada. ACTUALIZAR/reconectar/sync refrescan; sin conexión/error no se confirma ELO ni se muestran ceros falsos. Nueve grupos generales, ELO/repositorio 14/14, Chromium 41/41, SQL real con ROLLBACK y ambas vistas comprobados; Preview autenticada sin acceso del agente.

### Análisis, filtros y evolución

El perfil añade los últimos cinco resultados (más reciente primero), racha actual de victorias/derrotas/empates, mejor racha de victorias y comparación 1v1/2v2. Los empates cortan las rachas de victorias/derrotas; un triunfo por penaltis cuenta como victoria. El listado reciente muestra los alias/nombres actuales por identidad del jugador; los goles siguen siendo del equipo.

FILTRAR ANÁLISIS permite elegir Desde/Hasta, modalidad Rápido/Caos/Clasificatorio y formato. APLICAR FILTROS cambia todas las métricas, rachas, últimos resultados, evolución e historial abierto desde el perfil al mismo conjunto; QUITAR FILTROS restablece todo. Fechas inclusivas según la zona horaria del dispositivo, con límites de día calendario (incluidos cambios de horario). Rango inválido conserva el filtro anterior y muestra aviso. Volver del historial conserva filtros; cambiar de jugador/cuenta los reinicia. No se guardan en almacenamiento ni se envían consultas por cada cambio de selector.

Evolución: porcentaje acumulado de victorias sobre todos los partidos del filtro, ordenados por finalización (con UUID para desempatar fechas idénticas). El gráfico usa hasta 60 puntos representativos; el eje horizontal expresa orden, no distancia temporal. Una tabla desplegable muestra los últimos diez valores exactos y el gráfico tiene descripción accesible. Sin partidos no se dibuja una evolución ficticia ni se recomienda un formato sin muestra.

El perfil carga una vez el historial completo en memoria y filtra localmente. ACTUALIZAR vuelve a leerlo, conservando el filtro; el historial del perfil pagina ese mismo conjunto de 20 en 20 y consulta el detalle por el repositorio existente. El historial global conserva su consulta remota. Al perder conexión se retira el análisis y se vuelve al perfil; al reconectar se consulta de nuevo. No hay caché privada nueva ni garantía de snapshot entre dispositivos. Fixture `?statistics=analysis`: doce resultados del motor real en días/modalidades/formatos distintos, únicamente en memoria.

### Preparación aislada de análisis competitivo (04)

**Espera el cierre competitivo de 03:** ELO sigue desactivado y los parámetros pendientes NULL, comprobados en Supabase real. Diseño/H2H/forma y maqueta solo en tests; no aparecen como funciones activas de la app ni de la Preview normal. Modelo/pesos, umbral de muestra y política 2v2 de §32–33 se presentan como propuestas sin aprobar. Ningún porcentaje o confianza calculados; expectativa ELO no equivale a probabilidad calibrada. XP de 02 y los últimos resultados generales del perfil permanecen intactos.

Revisión local: `/tests/ui-fixture.html?block04=review` en desarrollo o build aislado existente. Usa fixtures en memoria, filtros/identidades/helpers previos, últimos cinco Clasificatorios y propuesta de parejas exactas 2v2. `npm run test:block04`: 12 contratos; navegador completo 42/42 y diez grupos generales. TypeScript/builds/visual móvil/800×480 y SQL READ ONLY/RLS reales correctos. Sin migraciones, escrituras remotas o consultas por gol. Diseño/ejemplos/límites en [VERIFICACION_BLOQUE_04.md](docs/VERIFICACION_BLOQUE_04.md); estado/publicación en ESTADO_ACTUAL. Prompt de 05 condicionado a dependencias, sin iniciarlo.

### Preparar e instalar la PWA

1. Generar el build y abrir `npm run preview`, o una publicación HTTPS autorizada. En un móvil, `127.0.0.1` apunta al propio móvil, no al PC; una dirección LAN HTTP no sustituye HTTPS para el service worker.
2. Con conexión, comprobar en AJUSTES → GENERAL, debajo de VER PENDIENTES y encima de las instrucciones de instalación, el mensaje **OFFLINE DISPONIBLE EN ESTE DISPOSITIVO**. Para partidos reales, haber iniciado sesión y cargado jugadores en ese mismo navegador/origen.
3. Si aparece INSTALAR APLICACIÓN, usarlo; si no, usar el menú del navegador → Instalar / Añadir a pantalla de inicio. La disponibilidad depende del navegador. No hace falta instalar para usar la caché en un navegador compatible.
4. Usar una sola pestaña. Una actualización espera al cierre de la aplicación; no fuerza recargas. No cerrar con una advertencia de copia incompleta o fallo de almacenamiento.

El service worker solo conserva HTML, JS, CSS, manifest e iconos del build. No almacena respuestas Supabase, correo, tokens ni resultados: estos últimos mantienen su almacenamiento local existente. Un selector local contiene solo el ID de la última cuenta y permite recuperar sus copias sin red; no es una credencial. El SDK de Auth conserva su propia sesión como antes. Para enviar datos se vuelve a verificar la sesión y RLS permanece vigente. Cerrar sesión elimina el selector, no las colas de partidos.

El punto verde significa que responde el servidor web (sonda no cacheada, máximo cuatro segundos; revisión cada treinta segundos mientras la app está visible). No demuestra que Supabase o la sesión funcionen. Sin servidor se muestra **SIN CONEXIÓN** con punto ámbar; AJUSTES permite COMPROBAR CONEXIÓN.

Si aparece **Offline no disponible. No cierres sin conexión.**, la preparación falló: esperar durante el partido no lo resuelve. Corrección del 2026-10-02: la precarga de recursos estáticos conserva la cookie exclusivamente del mismo origen para la Preview protegida; rechaza redirecciones a login y mantiene APIs/Auth fuera de caché. Tras recibir la versión corregida, recargar con Internet en la misma dirección, sin borrar datos ni recrear cuenta. Mantener la app abierta permite probar resultado pendiente/reconexión aunque la reapertura offline aún no esté preparada. El propietario confirma al cerrar 01 todas las pruebas, incluida PWA/reapertura en Safari; evidencia humana en VERIFICACION_PWA.md/ESTADO_ACTUAL.

No hay primera carga offline, sincronización con la app cerrada, backup, historial remoto offline ni garantía frente a eliminación de datos/cuota del navegador. Detalles y pruebas reales de servidor apagado en `docs/VERIFICACION_PWA.md`. El 2026-10-02, capturas móviles y consulta de solo lectura en Supabase confirman un nuevo resultado real guardado una vez, histórico anterior conservado y cero pendientes/sincronización completada. El propietario confirma también que vio el resultado en pendientes y pulsó reintentar: prueba 8 completada mediante reintento manual; no repetir el partido por rutina. El checklist físico/PWA y reapertura offline quedan confirmados por el propietario al cerrar 01 el 2026-10-02. La vista previa Vercel está publicada, con validación humana del dispositivo detrás de protección; las pruebas independientes de servidor apagado permanecen diferenciadas de esa confirmación.

## Próximas fases

ESP32-S3: futura interfaz física a 800×480 (el firmware no ejecutará React directamente). ESP32-C3: futuro adaptador de pulsadores/sensores que genere eventos equivalentes. La separación motor/entradas/repositorios prepara esa integración, pero aún no existe firmware.

Vercel: aplicación estática Vite, build `npm run build`, salida `dist`. GitHub genera vistas previas de la rama de desarrollo. URL y clave publishable configuradas únicamente para Preview de esta rama; producción y otras ramas no reciben esa configuración. No se ha promovido esta rama a producción ni activado servicios de pago. La fase B está cerrada con todas las pruebas humanas de 01. El agente no tiene acceso para observar directamente XP/ELO autenticados de 02/03; SQL real y UI independiente están verificados, sin promover main. ELO sigue desactivado hasta aprobar sus parámetros.
