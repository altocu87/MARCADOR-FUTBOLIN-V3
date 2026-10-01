# Estado actual — MARCADOR FUTBOLÍN V3

Última actualización: **2026-10-01**. Leer junto con `CONTEXTO_MAESTRO.md` y contrastar con el código real.

**Último cambio funcional:** aclaración posterior del propietario: mantener también AMBAS, dos partes que terminan por objetivo de goles de un equipo dentro de cada parte o por tiempo; ganador por el total acumulado de las dos. AMBAS nuevo usa V3 y copias anteriores conservan sus reglas. GOALS/TIME mantienen V2: única parte sin límite para GOALS y dos por reloj para TIME. El propietario comunica login y prueba satisfactorios; es evidencia humana, no una inspección remota del agente. Detalles en el registro y [VERIFICACION_MODALIDADES.md](VERIFICACION_MODALIDADES.md).

## Punto de continuidad para conversaciones nuevas

Petición del propietario: guardar el estado/cambios al terminar y organizar una conversación por bloque, con prompt listo. Plan y seguimiento en [BLOQUES_DESARROLLO.md](BLOQUES_DESARROLLO.md); AGENTS exige actualizarlo y entregar el siguiente prompt al cerrar cada bloque.

Base comprobada al preparar ese plan: **871c363** en `codex/reliability-offline-v1`, código funcional **b9dfc7b**, referencias locales/remotas coincidentes y árbol limpio. `main` permanece en **900e470**. Estos hashes son una fotografía: futuras conversaciones deben obtener la punta de desarrollo vigente, no volver a ellos automáticamente. Implementados persistencia/fiabilidad/recuperación/PWA/responsive, perfiles/estadísticas/análisis y las tres condiciones de victoria corregidas. No hay XP/ELO, logros, torneos completos, backup o firmware/OTA implementados por este plan.

**Siguiente bloque recomendado: 01 — Consolidación y comprobación real.** Detallar lo que cubrió la prueba satisfactoria comunicada por el operador, verificar nueva Preview/reglas/guardado/perfil/recuperación/PWA donde haya acceso y corregir bugs. No recrear cuentas ni migraciones. Después: XP/niveles → ELO/ranking/categorías → análisis competitivo → logros/récords → torneos → sonido/pulido → backup → firmware/entradas físicas → OTA/administración local. Son entregas propuestas, con dependencias y decisiones pendientes explícitas; no una orden de implementarlas ahora ni promoción a main.

## Referencias y alcance de esta ficha

- Repositorio: https://github.com/altocu87/MARCADOR-FUTBOLIN-V3
- Remoto: origin = https://github.com/altocu87/MARCADOR-FUTBOLIN-V3.git
- Rama principal: main.
- Último commit de código funcional en main comprobado: **b10b1df — Initial functional match simulator**; main contiene además el contexto documental 900e470.
- Rama de desarrollo para compartir persistencia y refuerzo de fiabilidad: **codex/reliability-offline-v1**, persistencia/fiabilidad **eeb23b8**, recuperación activa **176d470** y PWA **917de97**, con push comprobado. Las actualizaciones documentales posteriores tienen sus propios commits; contrastar `git log`/referencias al retomar. No equivale a promoverla a main ni completar la fase B.
- Entorno de la implementación inicial: **PC local Windows**. Revisión posterior del 2026-10-01 realizada en **Codex Cloud**, `/workspace/MARCADOR-FUTBOLIN-V3`, base remota `a449df2`; consultar la entrada de revisión cloud para las comprobaciones actuales.
- Esta ficha describe persistencia/fiabilidad/recuperación, PWA y adaptación responsive de la rama de desarrollo. Si solo se trabaja con main, ese código todavía no está integrado allí. Consultar `git log` y las referencias remotas para comprobar qué versión tiene cada checkout.
- Base comprobada al preparar el traspaso cloud: HEAD **f8ee98c — Record verified data-enabled preview deployment**, código funcional **9537c79**, en **codex/reliability-offline-v1**; origin/main sigue en **900e470**. Fetch y comparación remota: rama de desarrollo 0/0, árbol limpio al iniciar. Esta actualización documental se versiona después; obtener su hash con `git log`, no tratar f8ee98c como un pin para las futuras tareas.
- Entrada para un agente nuevo: [TRASPASO_NUBE.md](TRASPASO_NUBE.md), resumen fechado y guía de arranque. Esta ficha sigue siendo el estado operativo de referencia.

## Fases

| Fase | Estado real |
| --- | --- |
| A. Simulador funcional | Publicado en b10b1df |
| B. Persistencia Supabase V1 | Implementada/probada localmente; operador comunica login y prueba correctos; falta detallar/comprobar casos remotos de cierre y revisión para main |
| C. Estadísticas, perfil y análisis de resultados | Implementados por autorización explícita del propietario; pruebas aisladas correctas; pendiente comprobación con Supabase real |
| C–J. XP/ELO, otros análisis competitivos, logros, torneos, audiovisual avanzado, ESP32, OTA | Futuros; fuera del bloque autorizado actual |

## Código local implementado en la fase B

- Cliente oficial Supabase, variables públicas, Auth sencillo por correo/contraseña y tipos generados de la base.
- Repositorios PlayerRepository y MatchRepository, separados de UI y MatchEngine.
- Ajustes: crear/editar jugadores, activar/desactivar y eliminar únicamente sin historial. Participantes en curso o pendientes en este dispositivo protegidos frente a eliminación.
- Selección de jugadores activos: exactamente 2 o 4, orden BLANCO 1 / AZUL 1 / BLANCO 2 / AZUL 2. Fotos/alias son datos básicos; no hay editor avanzado ni categorías competitivas calculadas.
- Motor: cronología secuencial, periodos, tiempo de juego, pausa/continuar, corrección y deshacer con referencias a goles anulados, prórroga y penaltis. Sin llamadas remotas.
- Guardado final del agregado mediante RPC transaccional, UUID estable y reintentos idempotentes. Se fija la cuenta y el modo prueba al iniciar la partida.
- Modo prueba ON por defecto, preferencia local; no guarda partidos/participantes/eventos ni los introduce en la cola local. Sin jugadores reales ofrece dos plazas de práctica solo en este modo. La gestión autenticada de jugadores sí es real.
- Historial V1 dentro de RANKING: lista paginada de 20 y detalle de configuración, participantes, resultado y cronología. No hay cálculo de ranking.
- Estadísticas básicas: perfiles de jugadores activos/inactivos desde Ajustes o RANKING → ESTADÍSTICAS, búsqueda e historial filtrado. Partidos, victorias, derrotas, empates, porcentaje y goles de equipo a favor/en contra/diferencia. Cálculo desde todos los resultados guardados con cursor estable e identidad del jugador; sin contadores persistidos, goleadores individuales, XP ni ELO. Prácticas, partidas sin finalizar y pendientes locales quedan excluidos. Sin red o ante error se informa, no se presentan ceros como datos reales.
- Análisis del perfil: últimos cinco resultados, racha actual y mejor racha de victorias, comparación 1v1/2v2 y porcentaje acumulado de victorias. Filtros locales inclusivos de fechas, modalidad y formato; todo el perfil e historial usan el mismo conjunto. Carga completa reutilizable en memoria, sin almacenamiento nuevo. Gráfico accesible limitado a 60 puntos, tabla de diez valores exactos; cálculos sobre todos los resultados, no solo esos puntos. Al volver del historial conserva filtros; actualizar/reconectar vuelve a consultar.
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
- `src/services/supabase/auth.ts`, `authFeedback.ts`, `tests/auth.test.ts`, `docs/VERIFICACION_VERCEL_DATOS.md`: acceso privado, validación, retorno seguro, SDK aislado y evidencia de la conexión Preview.
- `src/statistics/`, `src/ui/screens/StatisticsScreen.tsx`, `tests/statistics.test.ts`, `docs/VERIFICACION_ESTADISTICAS.md`: cálculo puro, lectura paginada cancelable, perfiles, regresiones y límites de validación.

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
- npm run test:layout: preferencia, escala física y navegación/selector/modalidades accesibles.
- npm run test:auth: validación, normalización, retorno sin tokens, mensajes y SDK con transporte aislado. No equivale a una prueba Auth real.
- Última comprobación funcional, bloque AMBAS: npm test, siete grupos correctos; estadísticas/análisis 41/41. npm run test:browser: 14/14 recorridos Chromium, incluidas las tres condiciones, recuperación de parcial AMBAS, cookie/acceso protegido, perfiles, filtros, historial y PWA; TypeScript/builds normal y aislado correctos. Este bloque documental no los reejecuta ni equivale a comprobar Supabase real.
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

Revisión cloud: implementación recuperada de `origin/codex/reliability-offline-v1`, no reconstruida desde main. La rama anterior `codex/local-players-match-recovery` permanece publicada en `f554cdb`; no se ha fusionado su repositorio local alternativo ni migrado datos de navegadores. La rama Supabase ya incluye recuperación, pendientes, historial y responsive; se trasladó la cobertura de navegador útil y se corrigió un fallo nuevo del reloj. Resultados y guía humana en [VERIFICACION_NUBE.md](VERIFICACION_NUBE.md).

En la máquina cloud actual están ausentes las tres variables públicas admitidas de Supabase. No hay conector/sesión de gestión Supabase disponible ni sesión del operador compartida. El acceso HTTP sin credenciales al endpoint Auth fue rechazado por el proxy con CONNECT 403, también al reintentar con escalación. No acredita caída de Supabase. Se guardó y se leyó de vuelta un borrador con instalación/arranque actualizados, requisitos directos VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY y dominios github.com/proyecto Supabase, conservando el preset de paquetes. No se aplicó a la máquina ni publicó el entorno. No repetir el bucle de publicación de la interfaz como si fuera un fallo de la aplicación.

La conexión pública está configurada solo en Preview de codex/reliability-offline-v1; ver el registro de este bloque y VERIFICACION_VERCEL_DATOS.md. Falta autorizar el retorno de confirmación en Supabase Auth: añadir https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app/ en Redirect URLs, sin eliminar las existentes. El navegador de gestión requiere login y la CLI/conector disponibles no ofrecen acceso directo a esa configuración; no se extrajeron tokens del almacén de credenciales. No afirmar que crear/confirmar cuenta o guardar un partido real ya está verificado. La autenticación de Vercel para abrir la vista previa es distinta de la cuenta del marcador.

El propietario ya comunica login correcto y prueba satisfactoria en el marcador. No volver a pedir crear otra cuenta ni solicitar contraseñas por chat. Falta precisar/comprobar los casos de la prueba remota para el cierre completo; no usar la cuenta administrativa del panel Supabase como si fuera Auth de la app.

La creación/confirmación/login corresponde personalmente al operador. El login ya está comunicado como conseguido; las instrucciones iniciales de registro anteriores son históricas, no el siguiente paso actual.

Después, el agente debe verificar con la capa Supabase real:

1. Crear/editar/activar/desactivar jugadores.
2. MODO PRUEBA OFF; completar un partido y comprobar filas de partido, participantes y eventos.
3. Consultar historial/detalle y comprobar protección del jugador con historial.
4. Repetir en modo prueba ON y comprobar que no aumentan partidos ni eventos.
5. Reejecutar pruebas/build, revisar secretos y publicar el bloque funcional cuando esté estable.

**No dar la fase B por cerrada ni avanzar a XP/ELO/logros mientras falte esta comprobación.** Para continuar en la nube, usar la rama `codex/reliability-offline-v1` una vez confirmado su push. Si el checkout solo contiene main, sincronizar la rama de desarrollo, no recrear la integración ni tocar el esquema ya existente. La publicación de una rama de revisión no requiere dar por pasada la validación autenticada; la promoción a main sí queda pendiente de esa validación.

Excepción de alcance autorizada posteriormente por el propietario: desarrollar íntegramente estadísticas básicas, perfil e historial filtrado mientras sigue pendiente el acceso externo. Este bloque ya está implementado y probado de forma aislada; no cierra la fase B ni autoriza XP/ELO, cambios de esquema o promoción a main. En la prueba autenticada añadir la comprobación del perfil frente a los resultados reales guardados.

Ampliación autorizada después: últimos resultados, rachas, rendimiento por formato, filtros y evolución. También implementada con datos aislados; añadir esos filtros/valores a la comprobación real. El siguiente cierre pendiente sigue siendo el recorrido autenticado; no es necesario rehacer la configuración del entorno para programar este análisis.

## Límites conocidos y decisiones a preservar

- Discrepancia del bloqueo de gol corregida el 2026-10-01 en la rama de desarrollo: reproducida con una prueba fallida antes del arreglo y ocho casos correctos después. El motor conserva el plazo al deshacer/corregir/cambiar parte o prórroga. Main aún no contiene esta corrección mientras no se integre la rama.
- Decisiones explícitas posteriores: GOALS objetivo por equipo/única parte/sin límite; TIME dos partes por reloj; AMBAS dos partes por objetivo de un equipo dentro de cada parte o reloj. TIME/AMBAS deciden por total acumulado y conservan desempate. Copias anteriores mantienen sus reglas, resultados históricos intactos; no volver a retirar AMBAS.
- Prórroga: 60 segundos y gol de oro; después penaltis alternos, cinco intentos y muerte súbita. No se atribuyen goles a jugadores.
- Deshacer no retrocede el reloj; el journal conserva goles y anulaciones.
- Historial remoto depende de conexión; panel de pendientes local disponible sin red. PWA/arranque offline en build tras primera carga completa, HTTPS o localhost y navegador compatible. No habilitado en npm run dev. Recuperación requiere mismo origen/navegador/cuenta y prueba OFF; no garantiza primera carga sin red ni almacenamiento no borrado. Vista previa Vercel publicada; instalación/PWA detrás de protección en móvil físico pendientes.
- Usar una sola pestaña activa. La protección frente a journal antiguo no es un protocolo de coordinación simultánea entre pestañas. Copias inválidas se conservan y bloquean su sobrescritura; no hay borrado automático ni botón de descarte de partidas. La precisión de recuperación del reloj es de segundos; una caída abrupta puede perder la fracción aún no escrita.
- Pendientes locales no son backup ni se comparten entre PC/móvil; la desactivación es más segura que eliminar cuando otros dispositivos puedan tener resultados sin sincronizar.
- Clave pública configurada localmente en .env.local ignorado; cloud/Vercel necesitan su propia configuración segura. No copiar credenciales a esta documentación.
- Vercel tiene una vista previa automática y conexión pública para la rama de revisión; sin promoción a producción ni retirada de protección. No se implementaron XP/ELO, predicción/forma competitiva, logros, torneos, OTA ni ESP32. Hardware/fotos/especificaciones del contexto son requisitos aportados por el usuario, no una integración física probada.

## Registro de cambios

### 2026-10-01 — Contexto de continuidad y prompts por bloques

Solicitud explícita: registrar el punto alcanzado/cambios y entregar bloques con un prompt para cada conversación de programación. Base **871c363**, último código funcional **b9dfc7b**, rama `codex/reliability-offline-v1` y main **900e470**, remotos comprobados y árbol limpio al iniciar. Se conserva el historial funcional previo; no se cambian motor ni reglas.

Creado BLOQUES_DESARROLLO.md: fotografía de continuidad, diferencias entre implementado/verificado/reportado, diez bloques propuestos, dependencias, entregables del agente, pasos humanos imprescindibles, criterios de cierre y diez prompts autocontenidos. AGENTS incorpora lectura/seguimiento del plan y entrega obligatoria del siguiente prompt tras cada bloque. README y apartados 69/80 del contexto maestro enlazan la continuidad. Se corrige el resumen vigente de verificación de 11 a 14 recorridos según el último bloque realmente ejecutado.

Bloque 01 recomendado antes de progresión: consolidación y comprobación real sin repetir cuentas, tablas o estadísticas ya existentes. XP/ELO/logros/torneos/hardware continúan como futuros y requieren el bloque solicitado y las decisiones de reglas que falten; preparar este plan no los implementa ni activa. Login/prueba del propietario conservados como evidencia humana, nuevos despliegues/reglas remotos pendientes de comprobación del agente.

Verificación de esta entrega documental: referencias Git, enlaces relativos, integridad de los 84 apartados y revisión de diff antes de publicar. No se reejecutan tests/build, SQL, Auth ni navegador: código/dependencias sin cambios. Sin migraciones, datos, secretos, variables, costes o promoción a main. Contexto/plan se publica en la rama de revisión; commit/push se comprueban con Git al entregar, no se infiere publicación Vercel.

### 2026-10-01 — Aclaración de AMBAS: dos partes y ganador por acumulado

Base **a19dfc5**, rama `codex/reliability-offline-v1`, árbol limpio al iniciar y main **900e470**. El propietario aclara que AMBAS debe mantenerse: objetivo por equipo o reloj de cada parte, con resultado conjunto de ambas. Reemplaza la retirada de AMBAS del bloque inmediatamente anterior; conserva GOALS/TIME y no modifica desempates.

Motor: AMBAS nuevo cuenta goles activos de cada equipo en la parte actual. Al alcanzar el objetivo cierra esa parte, no el partido; el reloj también la cierra. Al empezar la segunda parte se reinician tiempo/objetivo y se mantiene el acumulado. Ejemplo probado 5–4 y 0–5 → Azul 9–5, aunque Blanco ganó la primera. El gol al vencer el tiempo sigue rechazado por el motor. UI/configuración restaura tres opciones, dos controles en AMBAS y etiqueta GOLES POR EQUIPO Y PARTE; reloj muestra parcial y meta sin reemplazar los marcadores acumulados. Historial muestra objetivo/tiempo por parte y resultado acumulado.

Reglas/checkpoint V3 exclusivo de AMBAS nuevo; GOALS/TIME nuevos siguen V2. Tipos/validador admiten 1/2/3 y mantienen coincidencia de versión/configuración/metadatos iniciales. AMBAS V1/V2 conserva suma histórica por parte al recuperar/reexportar. Contenedor ActiveMatchStore V1, IDs y agregado final estable sin cambios; no se reescriben pendientes/resultados ni se migran tablas/RPC/engine_version SQL.

Pruebas: npm test, siete grupos correctos (estadísticas/análisis 41/41); TypeScript/build normal y aislado; navegador Chromium 14/14, sin omitidos/pageerror. Motor: 3–2 continúa con objetivo 5; cierre por goles en ambas partes, segunda parte exige su propio objetivo pese al acumulado; cierre por reloj en ambas; ganador 5–9 o 4–2. Recuperación contrasta AMBAS V2/V3, pausa tras 24 horas cerrada, objetivo reiniciado y documento final idéntico. Browser: 1–1 continúa con objetivo 2, primera parte 2–1, segunda 0–2 con recarga, final Azul 3–2 y detalle; configuración a 320×568, 390×844, 800×480. Primer intento falló por comprobar AMBAS después de haber navegado a selección de jugadores: retirada esa comprobación de la pantalla incorrecta; el caso específico sigue comprobando selección real de AMBAS y su comportamiento. Revisión visual local y evidencia en VERIFICACION_MODALIDADES.md.

Sin dependencias, migraciones, servicios, cuentas nuevas, costes ni promoción a main/producción. Verificación Supabase/Vercel remota de las reglas no realizada; pruebas con repositorios en memoria y tráfico Supabase bloqueado. Siguiente prueba humana cuando esté disponible la actualización: crear AMBAS nuevo y comprobar parcial/total en dos partes. Push de la rama se informa con referencia Git; no acredita despliegue Vercel.

Publicación funcional comprobada: **b9dfc7b — Restore combined victory with per-team half targets and aggregate winner**, push correcto y `git ls-remote` confirma b9dfc7b75fd52dcd594b8c53e82841b38c2351d3 en origin/codex/reliability-offline-v1; main sigue en 900e470. Árbol limpio tras commit funcional; 14/14 recorridos Chromium en la versión final. Esta anotación documental se versiona después; publicación Vercel no comprobada.

### 2026-10-01 — Dos condiciones de victoria corregidas por decisión del propietario

Base **89e7981**, rama `codex/reliability-offline-v1`, árbol limpio al iniciar; main comprobada en **900e470**. El propietario aclara expresamente: tiempo en dos partes, gana quien marque más; goles en una única parte, sin límite de tiempo, gana quien alcance el objetivo. Reemplaza las reglas anteriores de GOALS sumado por periodo y la opción AMBAS para nuevos partidos.

MatchEngine termina directamente GOALS en MATCH_END cuando un equipo llega al objetivo, mantiene reloj ascendente sin duración límite y rechaza fin de parte/prórroga/penaltis forzados en ese formato. No publica PERIOD_END para un gol decisivo. Anular ese gol reabre la misma parte sin sumar espera del final y conserva el bloqueo central. TIME mantiene acumulado y dos partes; empate conserva el desempate existente. Configuración/UI ofrece dos opciones y GOLES PARA GANAR; marcador indica ÚNICA PARTE/objetivo/tiempo jugado. Historial muestra reglas y tiempo pertinentes, sin inventar un límite para GOALS.

Checkpoint V2 + `config.rulesVersion=2` para nuevos partidos; validación rechaza mezcla de versiones, segunda parte/penaltis o final sin objetivo en GOALS V2. Copias V1 sin campo conservan la semántica anterior al recuperar y reexportar. El contenedor ActiveMatchStore V1 no cambia. `metadata.rulesVersion` en inicio identifica el resultado nuevo sin migrar tablas/RPC; `engine_version` SQL mantiene su contrato anterior y `time_limit_seconds` sigue obligatorio pero inactivo en GOALS. No se reescriben filas, colas, resultados ni hashes antiguos.

Verificación: npm test, siete grupos correctos (estadísticas/análisis 41/41); TypeScript y builds normal/aislado; navegador Chromium 13/13, cero omitidos/pageerror. Nuevos recorridos: GOALS sigue abierto a diez minutos, 1–1 no alcanza objetivo 2, final 2–1 y detalle de única parte; TIME dos partes de un minuto, acumulado 2–1 y detalle. Regresiones de ganadores blanco/azul, pausa, anulación del decisivo, copia V1, recuperación V2 activa/final, persistencia, pendientes/PWA y perfiles. Revisión visual local y tamaños 320×568/390×844/800×480, además de los tamaños ya cubiertos por la suite. Evidencia en VERIFICACION_MODALIDADES.md.

El propietario ha comunicado que ya pudo iniciar sesión y que su prueba fue bien. No se ha verificado remotamente por el agente qué filas/casos abarcó; no se repite creación de cuenta ni se declara fase B íntegra cerrada. Sin migraciones, credenciales nuevas, dependencias, servicios de pago ni promoción a main/producción. El push a esta rama puede disparar una Preview automática, cuya publicación no se afirma verificada por las pruebas locales. Siguiente acción humana: cuando se publique la actualización, cerrar/reabrir el marcador sin borrar almacenamiento y probar un nuevo partido por goles. Publicación Git: comprobar la referencia remota y el historial de este bloque.

Publicación funcional comprobada: **f7050ef — Correct goal target matches to one untimed period**, push correcto y `git ls-remote` confirma f7050efe4d53fad9bf103adc6ec58ca115fe7046 en origin/codex/reliability-offline-v1; main permanece en 900e470. Árbol limpio tras el commit funcional; 13/13 recorridos Chromium en la versión final. Esta anotación documental se versiona posteriormente. No acredita un despliegue Vercel nuevo ni una prueba autenticada remota de las nuevas reglas.

### 2026-10-01 — Bloqueo de registro/login en Preview protegido

Propietario: ambos botones deshabilitados con correo/contraseña introducidos. Base **cb3da39**, árbol limpio al iniciar; main remoto **900e470**. Inspección: ambos dependen de servicios, conexión y solicitud en curso; longitud insuficiente no bloquea ENTRAR. Defecto reproducido antes del arreglo en Chromium: `/connection.json` con `credentials: omit` no envía la cookie del host protegido, devuelve 401/HTML y mantiene acceso bloqueado incluso con cookie válida disponible.

ConnectionMonitor/probeConnection usa ahora `credentials: same-origin`, conserva no-store/límite 4 s y rechaza redirects con `redirect: error`. HTTP correcto y marcador JSON siguen siendo requisitos; sin Authorization, cookies a otros orígenes, cambios de Supabase o retirada de protección. SettingsScreen explica conexión no verificada/solicitud en curso. Fixture `?auth=guest` y regresión de navegador comprueban ausencia/presencia de cookie HttpOnly local; nunca pulsa registrar ni crea cuenta real. Tests offline cubren marcador ajeno, 401, HTML/redirect, señal/caché y ausencia de Authorization.

Verificación: npm test (siete grupos, estadísticas 41/41), TypeScript/builds normal/aislado y navegador **11/11** correctos. Fallo esperado antes, prueba correcta tras el arreglo; vistas 320×568, 390×844 y 800×480/física, sin pageerror, revisión visual local. La revisión visual detectó que un aviso podía tapar contenido físico: `global.css` permite scroll interno de cada panel de Ajustes, y el navegador comprueba que el botón recibe el punto de toque. Sin dependencias, migraciones, motor, datos de negocio o configuración Auth/Vercel cambiados. Worker/precaché estática sin cambios: instalación PWA tras protección sigue pendiente, no se afirma corregida por la sonda.

Acceso HTTP real al Preview rechazado por proxy cloud con CONNECT 403; no demuestra caída de Vercel/Supabase ni rechazo de Auth. Guía runtime/política/readiness inspeccionadas; sin bypass, escalación o borrador modificado. Push se comprueba mediante Git; puede generar Preview automática, pero no acredita su publicación ni el desbloqueo en la sesión del propietario. Siguiente acción: cuando esté disponible la actualización, cerrar/reabrir pestañas del marcador sin borrar almacenamiento, COMPROBAR CONEXIÓN y retomar el punto 4. Si persiste, comprobar indicador/aviso exactos. Registro real y fase B siguen pendientes.

### 2026-10-01 — Análisis de resultados, rachas, filtros y evolución

Petición explícita «Hazlo» sobre el bloque propuesto. Base funcional **55b6632**, rama `codex/reliability-offline-v1`, árbol limpio al iniciar y referencia remota main **900e470**. `playerAnalysis.ts` prepara/deduplica/valida y ordena resultados con fracciones temporales y desempate UUID; calcula últimos cinco, racha actual/mejor de victorias, formatos y evolución sobre un único subconjunto. `loadPlayerMatches` reutiliza la carga completa con cursor/cancelación existente; `loadPlayerStatistics` mantiene su contrato.

StatisticsScreen añade filtros explícitos Desde/Hasta/modalidad/formato, validación sin perder el filtro anterior, coherencia entre métricas y subpaneles, retención al volver del historial y retiro del análisis sin red. AnalysisDetails separa presentación, comparación, últimos resultados, gráfico SVG accesible de hasta 60 puntos y tabla exacta de diez. HistoryScreen pagina la misma selección en memoria y conserva detalle remoto/guardas frente a respuestas abandonadas; historial global intacto. Cambios de formato de partido solo inferidos de 2/4 participantes balanceados, no de modalidad ni nombres. Fechas locales inclusivas por día calendario, incluidos cambios DST; empates cortan rachas de victorias/derrotas. No hay premios ni forma/predicción competitiva.

Verificación: npm test (siete grupos, estadísticas/análisis **41/41**), navegador **10/10**, TypeScript y builds normal/fixture correctos; auditoría de producción 0 vulnerabilidades, sin nuevas dependencias ni lockfile cambiado. Nuevos tests incluyen filtros combinados/vacíos/inválidos, perspectiva 1v1/2v2, orden/fracciones/desfase, DST 23/25h, duplicados/conflictos y evolución/gráfico sobre 200 partidos. Fixture aislada de doce partidos del motor real, días/modalidades/formatos distintos, reconexión en historial filtrado y tamaños 320×568, 390×844, 844×390, 800×480, 768×1024, 1440×900 y vista física. Corregidos nombres accesibles de selectores y reapertura del panel de filtros detectados por navegador. Revisión visual móvil/física sin pageerror, evidencias temporales fuera de Git.

Sin cambios de motor, tablas, RPC, migraciones, permisos, Auth, datos externos, planes o producción. Contexto/README/verificación actualizados; publicación de la rama se comprueba con Git y se informa al entregar, sin afirmar un nuevo despliegue Preview verificado. Supabase real permanece pendiente. El siguiente paso de cierre es comprobar jugadores → guardado → perfil/filtros/historial con cuenta del operador; XP/ELO no autorizado automáticamente.

### 2026-10-01 — Estadísticas básicas, perfil e historial de jugador

Implementación sobre la base cloud **201cdd3** de `codex/reliability-offline-v1`, por petición explícita del propietario. Perfiles privados de jugadores activos/inactivos, búsqueda, acceso desde Ajustes/Historial y ocho métricas calculadas desde resultados oficiales. Consulta filtrada conserva compañeros/oponentes; recorre páginas de 20 con cursor fecha/UUID, deduplica reintentos y conserva la precisión temporal de Supabase. Cambiar nombre no cambia la identidad ni el snapshot histórico. Prórroga cuenta goles de campo; penaltis deciden ganador sin inflar goles. No hay atribución individual de goles ni cambios del motor, guardado, tablas, RPC, RLS o dependencias.

Errores y falta de conexión no producen falsas estadísticas vacías. Peticiones abandonadas o de otra cuenta no actualizan el perfil; el historial filtra antes de paginar. Totales no son una instantánea transaccional de varias páginas: resultados recién sincronizados pueden requerir ACTUALIZAR. En revisión visual se detectaron controles fuera de la primera vista y se separaron del scroll interno para mantenerlos accesibles.

Verificación final: npm test (siete grupos), 24 pruebas de estadísticas, npm run test:browser (8/8), TypeScript/build normal y fixture correctos. Cobertura de motor real, 1v1/2v2, deshacer/corrección, penaltis, duplicados, más de 20 resultados, cancelación, errores tardíos y SDK oficial con transporte aislado. Navegador y revisión visual local móvil/física sin errores; Supabase bloqueado en fixtures. Auditoría de producción: cero vulnerabilidades. Evidencia y límites en [VERIFICACION_ESTADISTICAS.md](VERIFICACION_ESTADISTICAS.md).

Sin validación autenticada real, migraciones, cuentas, correos, cambios de configuración externa o producción. La publicación se comprueba mediante Git y se informa al entregar; un push a esta rama puede generar Preview automática, no implica despliegue verificado ni promoción a main. Fase B y validación real del perfil siguen abiertas; XP/ELO permanece fuera de alcance.

### 2026-10-01 — Continuidad cloud y regresiones de recuperación

Sincronizada de forma segura la rama publicada `codex/reliability-offline-v1` desde `a449df2`, preservando la rama local anterior. Leídos contexto completo de 84 apartados, estado, README, instrucciones, traspaso y verificaciones pertinentes. `main` comprobada en `900e470`, sin integración automática. No se duplican cliente/Auth, tablas, migraciones ni sistemas de guardado.

Reproducido antes del arreglo: el tick de expiración emitía PLAYING a 00:00 antes de PERIOD_END, permitiendo una copia intermedia recuperable; un tick 30 segundos tardío añadía esos segundos al tiempo jugado. MatchEngine publica ahora solo el fin definitivo y limita el tiempo de periodos TIME/BOTH/prórroga. Conserva monotonía y journals de copias V1 anteriores. GOALS continúa sin límite de reloj; bloqueo, partes y penaltis no cambian. Regresiones en recovery.test.ts.

Añadidos `tests/browser.test.mjs`, script test:browser y Playwright 1.63.0 fijado; ninguna dependencia previa actualizada ni metadatos libc eliminados. Cinco recorridos Chromium reales con contextos locales aislados, builds normal/fixture y preview propio 5197: vistas adaptables/física, prueba sin persistencia, selección exacta/recuperación 2v2, cola/reintento/historial y PWA con servidor realmente detenido. Tráfico Supabase bloqueado en estas pruebas; no representan persistencia real. El servidor temporal se cierra al terminar; servidores preexistentes conservados.

Verificado en nube: npm ci con caché temporal, npm test (seis grupos), npm run test:browser (5/5, sin omitidas), TypeScript y builds normal/aislado, auditoría de producción (0 vulnerabilidades), diff sin errores. El servidor preexistente 5173 devolvía HTML pero sus dependencias optimizadas fallaban con 504; no se detuvo. Servidor propio nuevo en 5198 comprobado por HTTP y navegador: menú y Ajustes cargados sin errores pageerror. Instrucciones de arranque actualizadas con diagnóstico de puerto/caché obsoletos. Resultados concretos en VERIFICACION_NUBE.md. Los checks de SQL/RLS/advisors y despliegue de entradas anteriores no se han repetido remotamente en este bloque.

Habilidad cloud-environment-onboarding:setup utilizada para actualizar y guardar instalación/arranque/requisitos de conexión. Borrador confirmado; publicación y propagación no confirmadas. Sin cuentas creadas, correos enviados, escrituras de datos, migraciones, coste, cambio de Auth/RLS, producción o retirada de protección Vercel. El push a la rama conectada puede generar Preview automática; no equivale a comprobar su nuevo despliegue.

Siguiente acción humana: conservar/redirigir la URL autorizada en Supabase y crear/confirmar la cuenta del marcador en la Preview existente. Para operar desde cloud, configurar valores públicos en ajustes seguros y aplicar permisos de red; no compartir contraseña ni token en chat. Fase B queda abierta hasta probar el recorrido autenticado completo; no avanzar a XP/ELO. El commit/push de este bloque debe comprobarse con Git, no inferirse del borrador del entorno.

### 2026-10-01 — Resumen completo y traspaso documentado a Codex Cloud

Petición del propietario: conservar todos los avances y preparar continuidad en la nube. Creado TRASPASO_NUBE.md con resumen funcional, arquitectura, hitos, estado de servicios, configuración mínima, limitaciones y mensaje inicial reutilizable. Actualizados AGENTS.md, README, esta ficha y los apartados 69/76/79 del contexto maestro. Se conservan los 84 apartados y las decisiones históricas; no se cambia ninguna regla del marcador.

Inspeccionado el chat existente «Configurar MARCADOR-FUTBOLIN-V3»: seleccionó el repositorio con ref main, guardó un borrador de instalación/arranque y validó motor/build de aquella versión. No hay evidencia de publicación posterior del entorno en ese chat. Sus instrucciones de Supabase futura y solo test:engine están desactualizadas respecto a la rama de desarrollo. La captura muestra Review; comprobar publicación/republish y pedir sincronización de la rama correcta antes de continuar. No se envió ningún mensaje a ese chat ni se modificó su configuración.

Comprobaciones de este bloque: lectura completa del contexto/estado e inspección de archivos/scripts/historial; fetch correcto y rama remota 0/0 antes de editar; npm test (seis grupos) y npm run build correctos, sin errores TypeScript. Revisión documental de enlaces, numeración y git diff --check antes de publicar. No se repite verificación visual, Auth real, SQL ni auditoría remota por ser un bloque exclusivamente documental. La evidencia de servicios/pruebas visuales procede de los bloques anteriores, no de nuevas comprobaciones autenticadas.

Sin cambios en aplicación, dependencias, migraciones, datos, variables, planes, producción o protección. La publicación documental en la rama de desarrollo puede generar otra Preview automática con el mismo código; no se solicita despliegue manual ni se afirma haberlo verificado en este bloque. El commit de traspaso y su push se comprueban con el historial/referencia remota y se informan al propietario; no se incrusta el hash del propio commit dentro de él.

Siguiente acción: publicar/actualizar el entorno si está en borrador, iniciar la tarea cloud desde la rama actual y leer los documentos compartidos. Para trabajar en código no es imprescindible crear todavía la cuenta del marcador. Para cerrar la fase B sí faltan Redirect URLs, cuenta/confirmación del operador y recorrido real jugadores → partido → guardado → historial. No promover a main ni avanzar a XP/ELO por el mero traslado a la nube.

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

Publicación funcional comprobada: **9537c79 — Enable preview data configuration and improve private registration**, push correcto a origin/codex/reliability-offline-v1. Despliegue automático **dpl_BmTTpAKaAeEbdH2nYr1jQQzQNEmx**, READY: https://marcador-futbolin-v3-oh2vmxkgs-altocuvlc-9686s-projects.vercel.app. El alias estable de la rama apunta a esa versión. Logs remotos: npm run build/TypeScript/Vite correctos y paquete index-D57qEAgO.js igual al build local comprobado. HTML/bundle remotos verificados mediante CLI: dominio del proyecto correcto, clave de tipo público y formulario actualizado. REST público a players sigue rechazado con 42501. No se verificó navegador autenticado remoto ni se realizó escritura real. Main permanece en 900e470; esta anotación de publicación se versiona posteriormente y puede generar otra vista previa con el mismo código.
