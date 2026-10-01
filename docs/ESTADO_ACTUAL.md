# Estado actual — MARCADOR FUTBOLÍN V3

Última actualización: **2026-10-01**. Leer junto con `CONTEXTO_MAESTRO.md` y contrastar con el código real.

## Referencias y alcance de esta ficha

- Repositorio: https://github.com/altocu87/MARCADOR-FUTBOLIN-V3
- Remoto: origin = https://github.com/altocu87/MARCADOR-FUTBOLIN-V3.git
- Rama principal: main.
- Último commit de código funcional en main comprobado: **b10b1df — Initial functional match simulator**; main contiene además el contexto documental 900e470.
- Rama de desarrollo para compartir persistencia y refuerzo de fiabilidad: **codex/reliability-offline-v1**, persistencia/fiabilidad **eeb23b8**, recuperación activa **176d470** y PWA **917de97**, con push comprobado. Las actualizaciones documentales posteriores tienen sus propios commits; contrastar `git log`/referencias al retomar. No equivale a promoverla a main ni completar la fase B.
- Entorno de esta implementación: **PC local Windows**, no Codex Cloud. Las instrucciones de nube del apartado 79 se aplican cuando se trabaje realmente allí.
- Esta ficha describe persistencia/fiabilidad/recuperación, PWA y adaptación responsive de la rama de desarrollo. Si solo se trabaja con main, ese código todavía no está integrado allí. Consultar `git log` y las referencias remotas para comprobar qué versión tiene cada checkout.

## Fases

| Fase | Estado real |
| --- | --- |
| A. Simulador funcional | Publicado en b10b1df |
| B. Persistencia Supabase V1 | Implementada y probada localmente; rama de desarrollo para revisión; falta prueba autenticada de navegador y promoción a main |
| C–J. Estadísticas, XP/ELO, logros, torneos, audiovisual avanzado, ESP32, OTA | Futuras; no autorizadas para implementación inmediata |

## Código local implementado en la fase B

- Cliente oficial Supabase, variables públicas, Auth sencillo por correo/contraseña y tipos generados de la base.
- Repositorios PlayerRepository y MatchRepository, separados de UI y MatchEngine.
- Ajustes: crear/editar jugadores, activar/desactivar y eliminar únicamente sin historial. Participantes en curso o pendientes en este dispositivo protegidos frente a eliminación.
- Selección de jugadores activos: exactamente 2 o 4, orden BLANCO 1 / AZUL 1 / BLANCO 2 / AZUL 2. Fotos/alias son datos básicos; no hay editor avanzado ni categorías competitivas calculadas.
- Motor: cronología secuencial, periodos, tiempo de juego, pausa/continuar, corrección y deshacer con referencias a goles anulados, prórroga y penaltis. Sin llamadas remotas.
- Guardado final del agregado mediante RPC transaccional, UUID estable y reintentos idempotentes. Se fija la cuenta y el modo prueba al iniciar la partida.
- Modo prueba ON por defecto, preferencia local; no guarda partidos/participantes/eventos ni los introduce en la cola local. Sin jugadores reales ofrece dos plazas de práctica solo en este modo. La gestión autenticada de jugadores sí es real.
- Historial V1 dentro de RANKING: lista paginada de 20 y detalle de configuración, participantes, resultado y cronología. No hay cálculo de ranking.
- Caché de jugadores y cola de resultados finalizados en localStorage, aisladas por proyecto/cuenta. Reintento manual y automático al reconectar con sesión verificada, fuera del partido activo/guardado. Ajustes incluye lista/detalle local de pendientes. Los goles no dependen de Internet.
- Web adaptable por defecto: móvil vertical/horizontal, tablet y escritorio; controles táctiles, formularios/listas con scroll interno y área útil centrada de máximo 1600×1000. Referencia física 800×480 conservada y seleccionable en AJUSTES → GENERAL; escalada solo si no cabe. Cambio de vista/tamaño sin reiniciar el motor ni el partido.
- Panel de simulación solo en desarrollo. No hay comunicaciones físicas ni firmware.
- Corregido el desbloqueo prematuro al deshacer/cambiar de parte o prórroga: el motor conserva los tres segundos del último gol aceptado. Ocho regresiones verifican pantalla/adaptador directo, límite exacto, simulación de transiciones y rechazo sin eventos adicionales. Al deshacer desde un final, el reloj no incorpora el tiempo de descanso.
- Guardado con límite de diez segundos: una petición colgada deja el resultado pendiente y libera el resumen. Pruebas de recarga, varios resultados, confirmaciones desordenadas/tardías y fallo de limpieza local.
- Recuperación de partidos en curso con prueba OFF: checkpoint versionado, validación, misma cuenta/proyecto, mismo ID y participantes. Juego activo recuperado en pausa, sin tiempo de cierre; cuenta atrás reiniciada, descanso/penaltis preservados. Copia retirada solo al entregar el resultado a cola durable/guardado. Modo prueba ON no escribe checkpoints.
- PWA del build con precaché estática exacta, manifest/iconos, arranque offline tras primera preparación conectada y avisos/instalación desde Ajustes. Actualizaciones esperan al cierre sin forzar recarga. No activa caché en desarrollo ni cachea API/Auth/datos de usuario mediante service worker.
- Identidad local mínima (solo ID versionado) selecciona jugadores/copia/cola del último operador sin red. No es credencial ni sustituye sesión/RLS; reconectar verifica Auth y cerrar sesión olvida selector sin borrar colas.
- Indicador real de alcance del servidor web: ONLINE verde, SIN CONEXIÓN ámbar, comprobación acotada no cacheada. No implica salud/autorización Supabase ni afecta al motor.

### Módulos principales

- `src/app/App.tsx`, `services.ts`, `useData.ts`: composición, sesión, caché, navegación y guardado.
- `src/app/useActiveMatch.ts`: copia síncrona tras acciones y por segundo, con aviso ante almacenamiento no disponible.
- `src/match-engine/MatchEngine.ts`, `types.ts`: motor y eventos independientes.
- `src/match-engine/checkpoint.ts`: validación completa antes de restaurar el motor.
- `src/services/persistence/`: modelos, contratos, mapMatch y SaveCoordinator.
- `src/services/persistence/ActiveMatchStore.ts`, `src/ui/screens/RecoveryScreen.tsx`: copia activa por cuenta/proyecto y pantalla de recuperación explícita.
- `src/services/supabase/`: cliente, Auth, adaptadores y database.types.ts.
- `src/ui/screens/SettingsScreen.tsx`, `HistoryScreen.tsx`, `MatchFlow.tsx`: jugadores, historial y flujo del partido.
- `src/main.tsx`, `src/styles/global.css`, package.json/lockfile y variables de ejemplo: integración y presentación.
- `tests/persistence.test.ts`, `tests/ui-fixture.html`, `tests/uiFixture.tsx`: pruebas de persistencia y fixture visual sin Supabase.
- `supabase/migrations/`, `supabase/tests/persistence_v1.sql`: migraciones y pruebas de integridad.
- `docs/VERIFICACION_PERSISTENCIA_V1.md`: evidencia de la fase B y recorrido autenticado pendiente.
- `docs/VERIFICACION_FIABILIDAD.md`: reproducción del fallo, correcciones, pruebas y recorrido visual de recuperación sin servicios externos.
- `tests/recovery.test.ts`, `docs/VERIFICACION_RECUPERACION.md`: regresiones y evidencia de recuperación del partido activo.
- `tooling/pwa.ts`, `tooling/service-worker.js`, `public/connection.json`: generación PWA y sonda excluida de caché.
- `src/system/`, `src/app/usePendingQueue.ts`, `src/services/persistence/OfflineIdentityStore.ts`: conexión, instalación/estado offline, cola observable e identidad local mínima.
- `src/ui/screens/PendingMatchesScreen.tsx`, `tests/offline.test.ts`, `docs/VERIFICACION_PWA.md`: panel local de resultados y verificación del worker/arranque offline.
- `src/ui/layout/displayMode.ts`, `FixedCanvas.tsx`, `src/ui/components/DisplaySettings.tsx`: preferencia versionada, viewport visible, ambas vistas y selector.
- `src/styles/responsive.css`, `TopMenu.tsx`, `MatchFlow.tsx`: presentación web, navegación accesible, cuenta atrás nativa y cifras ajustables. Las medidas originales de global.css siguen sirviendo a la vista física.
- `tests/layout.test.tsx`, `docs/VERIFICACION_RESPONSIVE.md`: regresiones de presentación y evidencia visual. Vite separa React en un paquete estático que la PWA también precachea.

## Supabase ya aplicado — no repetir a ciegas

Único proyecto autorizado: **unemjyfhzljcdjcbiiwh**, MARCADOR FUTBOLIN V3, eu-west-1, organización Altocu. Plan gratuito comprobado durante la fase B; no se activaron recursos de pago ni se tocaron otros proyectos.

Tablas reales creadas:

- players: datos básicos, baja lógica y valores iniciales reservados level=0, xp=0, elo/max_elo=1200, classified_matches=0; sin lógica de progresión.
- matches: configuración, resultado, ganador, fechas, banderas y resultados/intentos de penaltis, versión del motor y hash de idempotencia.
- match_participants: jugador/equipo/posición y snapshot del nombre.
- match_events: cronología, periodo, tiempo acumulado y por periodo, marcador, secuencia, metadatos, penaltis y fecha del evento. Incluye pause/resume además de los eventos previstos.

RLS y permisos por cuenta del operador (owner_id, auth.uid). Los jugadores no son cuentas Auth. Anónimos no pueden leer/escribir; no hay service_role en cliente. Borrado de jugadores con historial bloqueado por políticas/FKs; columnas XP/ELO reservadas no modificables por el cliente.

RPC `save_match_v1`: SECURITY INVOKER, RLS vigente, valida cuenta de inicio y guarda partido/participantes/eventos en una transacción. Triggers diferidos impiden agregados incompletos incluso mediante inserciones directas.

Migraciones **ya aplicadas remotamente**, cuyos archivos forman parte de la rama de desarrollo:

1. `20261001053217_match_persistence_v1.sql`.
2. `20261001055134_tighten_match_integrity.sql`.
3. `20261001055650_bind_save_to_account.sql`.

No volver a crear estas tablas ni aplicar migraciones duplicadas. Inspeccionar primero el esquema real y recuperar/sincronizar los archivos de la implementación local si faltan en un checkout cloud.

Última comprobación de datos tras tests SQL: cero cuentas Auth y cero filas de negocio. Es una observación del 2026-10-01, no una garantía sobre el estado futuro; volver a comprobar si es relevante, sin borrar datos.

## Verificación realizada

- npm run test:engine: correcto.
- npm run test:persistence y npm test: correctos.
- npm run test:recovery: reloj, bloqueo, IDs anulados, estados, penaltis, corrupción, aislamiento, modo prueba y entrega del resultado sin duplicados.
- npm run test:offline: plantilla real de worker, allowlist/privacidad, navegación offline, actualizaciones/cache incompleta, iconos, alcance de identidad, respuestas de conexión desordenadas y observadores de cola.
- npm run test:layout: preferencia, escala física y navegación/selector/modalidades accesibles. npm test ejecuta cinco grupos; todos correctos tras el bloque responsive.
- npm run build: TypeScript y Vite correctos.
- npm audit: cero vulnerabilidades en la última ejecución.
- Pruebas SQL en el proyecto real: RLS, cuentas, permisos, equipos/agregado, idempotencia, snapshot, restricciones de borrado, secuencia, modo prueba y rollback correctos. Fixtures íntegramente revertidos con ROLLBACK.
- REST real con clave pública: lectura y RPC anónimas bloqueadas con 42501.
- Advisors de seguridad: sin avisos. Rendimiento: índices de FKs corregidos; un aviso INFO de índice aún sin uso en base nueva, documentado y sin retirar protección necesaria.
- Navegador real sin sesión: menú/Ajustes y partido 1v1 completo en modo prueba sin guardado.
- Navegador con repositorios **en memoria**: creación de jugadores, selección válida 2v2, tres jugadores rechazados, cuenta atrás, partes, resumen e historial/detalle. Esto NO valida Auth ni el recorrido completo navegador → Supabase.
- Lienzo medido 800×480 sin scroll general; comprobados también 755 px de ancho y ventana de 1280×720. Cronología con scroll interno.
- Vite preview del build: carga, navegación y consola sin errores/advertencias. Avisos de recarga WebSocket de desarrollo registrados por separado.
- PWA en preview de producción: primera carga conectada → OFFLINE DISPONIBLE → apagar servidor → cerrar y reabrir → app cargada desde caché con SIN CONEXIÓN, sin sesión. Documento 800×480; escala 390×844 sin recorte/scroll general.
- PWA con repositorios aislados: apagar servidor de verdad durante partido 1–0, cerrar/reabrir offline, recuperar en pausa, terminar 4–0, consultar pendiente/eventos tras recarga aún sin servidor. Restaurar servidor → sincronización automática → un único partido simulado. No demuestra Auth/RPC Supabase real. Actualización en espera observada y activada tras cierre; no recarga forzada.
- .env real, node_modules, dist y caché CLI ignorados; escaneo de fuentes versionables sin claves privadas/tokens.

## Bloqueo y siguiente acción exacta

La conexión pública está configurada solo en Preview de codex/reliability-offline-v1; ver el registro de este bloque y VERIFICACION_VERCEL_DATOS.md. Falta autorizar el retorno de confirmación en Supabase Auth: añadir https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app/ en Redirect URLs, sin eliminar las existentes. El navegador de gestión requiere login y la CLI/conector disponibles no ofrecen acceso directo a esa configuración; no se extrajeron tokens del almacén de credenciales. No afirmar que crear/confirmar cuenta o guardar un partido real ya está verificado. La autenticación de Vercel para abrir la vista previa es distinta de la cuenta del marcador.

Falta una cuenta de operador del marcador para la prueba real autenticada. No solicitar contraseñas por chat ni inventar credenciales; no usar la cuenta administrativa del panel Supabase como si fuera Auth de la app.

Una vez configurada la conexión en el entorno utilizado, el usuario debe abrir la app real → AJUSTES → GENERAL, introducir personalmente correo y contraseña (al menos 8 caracteres), pulsar CREAR CUENTA, confirmar el correo si se solicita e iniciar sesión con ENTRAR.

Después, el agente debe verificar con la capa Supabase real:

1. Crear/editar/activar/desactivar jugadores.
2. MODO PRUEBA OFF; completar un partido y comprobar filas de partido, participantes y eventos.
3. Consultar historial/detalle y comprobar protección del jugador con historial.
4. Repetir en modo prueba ON y comprobar que no aumentan partidos ni eventos.
5. Reejecutar pruebas/build, revisar secretos y publicar el bloque funcional cuando esté estable.

**No dar la fase B por cerrada ni avanzar a XP/ELO/logros mientras falte esta comprobación.** Para continuar en la nube, usar la rama `codex/reliability-offline-v1` una vez confirmado su push. Si el checkout solo contiene main, sincronizar la rama de desarrollo, no recrear la integración ni tocar el esquema ya existente. La publicación de una rama de revisión no requiere dar por pasada la validación autenticada; la promoción a main sí queda pendiente de esa validación.

## Límites conocidos y decisiones a preservar

- Discrepancia del bloqueo de gol corregida el 2026-10-01 en la rama de desarrollo: reproducida con una prueba fallida antes del arreglo y ocho casos correctos después. El motor conserva el plazo al deshacer/corregir/cambiar parte o prórroga. Main aún no contiene esta corrección mientras no se integre la rama.
- GOALS cuenta los goles totales del periodo; el marcador visible es acumulativo. TIME termina por reloj; BOTH por la primera condición. Cambiar a objetivo por equipo requeriría una decisión explícita.
- Prórroga: 60 segundos y gol de oro; después penaltis alternos, cinco intentos y muerte súbita. No se atribuyen goles a jugadores.
- Deshacer no retrocede el reloj; el journal conserva goles y anulaciones.
- Historial remoto depende de conexión; panel de pendientes local disponible sin red. PWA/arranque offline en build tras primera carga completa, HTTPS o localhost y navegador compatible. No habilitado en npm run dev. Recuperación requiere mismo origen/navegador/cuenta y prueba OFF; no garantiza primera carga sin red ni almacenamiento no borrado. Vista previa Vercel publicada; instalación/PWA detrás de protección en móvil físico pendientes.
- Usar una sola pestaña activa. La protección frente a journal antiguo no es un protocolo de coordinación simultánea entre pestañas. Copias inválidas se conservan y bloquean su sobrescritura; no hay borrado automático ni botón de descarte de partidas. La precisión de recuperación del reloj es de segundos; una caída abrupta puede perder la fracción aún no escrita.
- Pendientes locales no son backup ni se comparten entre PC/móvil; la desactivación es más segura que eliminar cuando otros dispositivos puedan tener resultados sin sincronizar.
- Clave pública configurada localmente en .env.local ignorado; cloud/Vercel necesitan su propia configuración segura. No copiar credenciales a esta documentación.
- Vercel tiene una vista previa automática y conexión pública para la rama de revisión; sin promoción a producción ni retirada de protección. No se implementaron XP/ELO, estadísticas avanzadas, logros, torneos, OTA ni ESP32. Hardware/fotos/especificaciones del contexto son requisitos aportados por el usuario, no una integración física probada.

## Registro de cambios

### 2026-10-01 — Persistencia Supabase V1, trabajo local pendiente de acceso humano

Implementados cliente/Auth, datos seguros, jugadores, agregado transaccional, historial y cola offline. Tres migraciones aplicadas. Pruebas automatizadas, SQL y visuales aisladas correctas. Pendiente recorrido autenticado y publicación del código.

### 2026-10-01 — Contexto maestro compartido

Guardados los 84 apartados del propietario en CONTEXTO_MAESTRO.md, instrucciones de lectura/mantenimiento en AGENTS.md y esta ficha contrastada con el estado real. Registrada la discrepancia del bloqueo de gol al deshacer/cambiar periodo para su verificación posterior. La publicación exclusivamente documental se comprueba con el historial Git; no cambia el estado pendiente del bloque funcional ni ejecuta las futuras fases.

### 2026-10-01 — Fiabilidad del motor y recuperación offline

Corregido el bloqueo central, ampliadas las regresiones y fijado timeout de guardado. Verificado en navegador integrado un partido 2–0 con petición colgada → pendiente → recarga → reintento → historial/detalle, mediante repositorios en memoria sin Supabase. Lienzo real 800×480 sin overflow; comprobados centrado 1280×720 y escalado 390×844. Modo prueba restaurado ON, cola de fixture vacía y consola sin errores/avisos en ese recorrido. Sin cambios de base de datos, Auth real ni despliegues solicitados. La rama de desarrollo conserva también la implementación local de persistencia previa para poder retomarla en la nube; la fase B y promoción a main permanecen pendientes de la prueba autenticada.

Publicación comprobada: eeb23b8 en origin/codex/reliability-offline-v1; main continúa en 900e470. Árbol de trabajo limpio después del commit funcional. No se creó PR ni se solicitó despliegue. Las comprobaciones de pruebas/build pasaron inmediatamente antes del commit.

### 2026-10-01 — Recuperación de partidos en curso

Implementados checkpoint puro y validado, copia local por cuenta/proyecto, escritor síncrono y pantalla de recuperación. Conservados reglas, goles, participantes, journal, contador de IDs anulados y penaltis. Recuperación en pausa para juego activo; tiempo de cierre excluido. MODO PRUEBA no escribe copias. El resultado pasa a la cola final con el mismo ID antes de retirar el checkpoint.

Pruebas automatizadas ampliadas. Navegador integrado con repositorios aislados en memoria: recarga tras 1–0 → pausa → continuación → descanso recuperado → cuenta atrás de segunda parte recuperada → final 4–0 sin red → recarga → un pendiente → reintento → un resultado y journal completo. Cierre/reapertura de pestaña y penaltis recuperados con turno azul, final 3–0. Modo prueba ON restaurado, cero pendientes de fixture y consola sin errores/avisos. Pantalla nueva comprobada a 800×480 y escala 390×844 sin scroll general. Esto NO valida Auth ni Supabase real. Sin migraciones, cuentas, servicios externos o cambios de Vercel. Main sigue pendiente de prueba autenticada y revisión de la rama; ver `git log` para el commit de este bloque.

Publicación de recuperación comprobada: 176d470 en la misma rama, divergencia 0/0 al iniciar el siguiente bloque.

### 2026-10-01 — PWA, conexión y resultados pendientes

Implementados precaché estática solo en build, manifest/iconos e instalación/estado offline; indicador de alcance del host, identidad local mínima, panel de resultados pendientes y reintento automático al reconectar con sesión válida. No se modifica MatchEngine ni se almacena información Supabase/Auth en la caché del worker. Las copias de partido y sesión SDK conservan su almacenamiento independiente. Actualización sin recargas forzadas.

Cuatro grupos de tests, TypeScript/build y build aislado correctos. Verificado navegador con servidor realmente apagado: cierre/reapertura, recuperación y final 4–0 pendiente, reconexión automática con un único resultado simulado. Arranque offline también verificado en el build real sin sesión; 800×480 y 390×844 íntegros. Consola de aplicación sin avisos/errores capturados; modo prueba ON restaurado, cero pendientes de fixture, previews propios cerrados. Nuevos módulos y detalles en `VERIFICACION_PWA.md`.

Sin migraciones, costes, cuentas Auth, Vercel, firmware o competición nueva. Fase B sigue pendiente del recorrido autenticado real y promoción a main. Build normal dist excluye fixture; offline-test separado bajo tmp ignorado. Instalación física en móvil pendiente.

Publicación comprobada: **917de97 — Add offline PWA shell and pending result synchronization** en origin/codex/reliability-offline-v1, rama sincronizada y árbol limpio tras el commit funcional. Referencia remota main permanece en 900e470. Pruebas/build/auditoría/secretos/diff revisados inmediatamente antes de publicar. No se abrió PR ni se desplegó. Esta anotación de publicación es documental y se versiona después del commit funcional.

### 2026-10-01 — Aplicación web adaptable, referencia física conservada

Petición explícita del propietario: adaptar menú y aplicación a cualquier tamaño. WEB ADAPTABLE pasa a ser la vista predeterminada; PANTALLA 800×480 sigue disponible en Ajustes, con preferencia local. Navegación con iconos/marca y cuatro acciones conservadas; tarjetas con tres identidades visuales; configuración, selección, partido, finales, penaltis, ajustes, jugadores, recuperación e historial/pendientes reorganizados por tamaño. Desplazamiento interno en espacios reducidos, sin scroll general ni aspect-ratio. Corregido solapamiento de paneles en Ajustes y jerarquía del resultado móvil.

Cinco grupos de pruebas y builds normal/aislado correctos. TypeScript sin errores; separado paquete React para eliminar advertencia de tamaño, sin cambiar carga funcional ni caché privada. Auditoría de dependencias de producción: cero vulnerabilidades. Verificación en navegador integrado entre 320×568 y 2560×1440, tablet 768×1024 y móvil horizontal 844×390; altura reducida de formulario 320×400 y fallback de partido 320×240. Partido 2v2 pausado conservó 1–0/reloj/participantes al redimensionar y cambiar ambas vistas; final 4–0 en prueba sin guardado. Fixture OFF: recuperación 1–0 tras recarga, penaltis 3–0, historial/detalle, partido 2–0 pendiente tras fallo simulado y sincronización posterior sin duplicar. Modo prueba restaurado ON y cola vacía.

Build real sin sesión: formularios medidos, navegación y reapertura desde caché tras apagar el servidor. Estos recorridos no validan Auth ni escritura real en Supabase. No se modificaron MatchEngine, servicios de datos, migraciones, Vercel ni hardware. Fase B/prueba autenticada y promoción a main siguen pendientes. Evidencia y límites en VERIFICACION_RESPONSIVE.md.

Publicación comprobada: **8e84e26 — Adapt simulator for mobile tablet and desktop displays**, en origin/codex/reliability-offline-v1, divergencia 0/0 y árbol limpio tras el commit funcional. git ls-remote confirma mismo hash; main permanece en 900e470. Esta anotación documental se versiona después. No hubo PR ni despliegue; servidores/pestañas propios cerrados y viewport restaurado.

### 2026-10-01 — Vista previa Vercel localizada y comprobada

El propietario pidió verla online desde el móvil y autorizó el acceso CLI. Cuenta autorizada altocuvlc-9686, equipo altocuvlc-9686s-projects, plan Hobby. Se reutilizó el proyecto existente marcador-futbolin-v3, enlazado al repositorio correcto y con producción en main. Vinculación local guardada únicamente bajo .vercel/ ignorado. No se crearon proyectos ni recursos de pago, ni se promocionó o fusionó la rama.

La integración GitHub ya había desplegado automáticamente el commit documental **0a24499**, que contiene el código responsive **8e84e26**, desde codex/reliability-offline-v1. Despliegue **dpl_G5pmFWPv9Y6tPN45mRo6uBWBEYF9**, estado READY: https://marcador-futbolin-v3-9dtbkgnfq-altocuvlc-9686s-projects.vercel.app. Alias estable de la rama para el móvil: https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app. Los siguientes pushes pueden actualizar ese alias automáticamente.

Corrección de las anotaciones anteriores: no se había solicitado un despliegue manual, pero eso no significaba ausencia de publicación automática por GitHub. Los logs reales confirman npm run build, TypeScript y Vite correctos; HTML y CSS remotos comprobados con la CLI oficial, incluidas reglas responsive, container queries y vista física. Un aviso de instalación sobre allowScripts/esbuild no impidió el build. No se ha verificado todavía el recorrido visual completo en ese origen remoto: navegador sin sesión redirige al login de Vercel, como exige la protección vigente. No desactivar protección ni publicar tokens de bypass.

No existen variables de entorno configuradas en este proyecto Vercel. Esta vista sirve para probar interfaz y partidos con MODO PRUEBA ON, no para validar cuentas/guardado remoto. Siguiente bloque: configurar las variables públicas autorizadas en Preview, reconstruir y completar el recorrido autenticado con el operador. No se cambió el código, el motor, el diseño, la base de datos ni las variables remotas en este bloque. README, contexto maestro y estado actual actualizados. Reejecutados npm test (cinco grupos) y npm run build, ambos correctos, sin errores TypeScript; publicación documental consultable en el historial Git.

### 2026-10-01 — Conexión Preview y registro privado

Petición del propietario: continuar la conexión de datos en Vercel y preparar registro. Configuradas VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY únicamente en Preview para codex/reliability-offline-v1 del proyecto existente. Sin claves privadas/service_role, producción ni otras ramas. Se corrigieron saltos de línea del transporte stdin de PowerShell y se verificaron valores sin espacios extremos, mostrando solo nombres/alcance, no valores.

Supabase correcto ACTIVE_HEALTHY, organización Altocu free, cuatro tablas con RLS y advisors de seguridad sin avisos. Auth público informa registro habilitado, correo/contraseña disponible y confirmación requerida. Cero cuentas de operador al comprobar; no se crearon cuentas, enviaron correos ni modificaron tablas, políticas, configuración Auth o planes.

auth.ts/authFeedback.ts: correo normalizado, validación previa, retorno al origen sin query/fragment/tokens y mensajes seguros en español. SettingsScreen: ambos accesos pasan por formulario con validación nativa, explicación de cuenta privada y jugadores sin registro, aviso comprensible si faltan variables. Sin cambios del MatchEngine ni diseño del partido. tests/auth.test.ts y test:auth verifican helpers y SDK oficial con transporte aislado; no simulan una validación de Auth real. npm test ejecuta seis grupos, todos correctos; npm run build/TypeScript y auditoría de producción correctos, cero vulnerabilidades.

Build real local: actualización PWA pendiente activada al cerrar/reabrir la pestaña, menú/Ajustes cargados sin sesión, acceso disponible y sin errores/avisos de consola. Formulario comprobado en 390×844 con entradas de 48 px y scroll interno; web y vista física medidas 800×480 sin scroll general ni solapamiento del formulario. Preferencia restaurada WEB ADAPTABLE, prueba ON, sin pendientes; evidencias en tmp/vercel-auth ignorado. Publicación GitHub/Vercel y hash verificable mediante historial/comandos, sin promoción a main.

Bloqueo concreto: no hay sesión de gestión del panel Supabase en el navegador, ni acceso API disponible para cambiar Redirect URLs. La CLI puede listar el proyecto, pero no se ha obtenido su configuración Auth; no se intenta config push porque podría sobrescribir ajustes ajenos. El operador debe añadir la URL exacta de retorno y crear/confirmar personalmente su cuenta. SMTP predeterminado limita destinatarios al equipo del proyecto: usar ese correo para la primera prueba; otros correos necesitan SMTP autorizado. Esta limitación procede de documentación actual y no de un registro de correo probado en este proyecto. Fase B sigue abierta hasta comprobar jugadores → partido → guardado → historial con sesión real.
