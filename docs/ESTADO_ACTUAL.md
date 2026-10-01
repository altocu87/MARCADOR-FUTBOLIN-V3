# Estado actual — MARCADOR FUTBOLÍN V3

Última actualización: **2026-10-01**. Leer junto con `CONTEXTO_MAESTRO.md` y contrastar con el código real.

## Referencias y alcance de esta ficha

- Repositorio: https://github.com/altocu87/MARCADOR-FUTBOLIN-V3
- Remoto: origin = https://github.com/altocu87/MARCADOR-FUTBOLIN-V3.git
- Rama principal: main.
- Último commit de código funcional publicado comprobado: **b10b1df — Initial functional match simulator**.
- Entorno de esta implementación: **PC local Windows**, no Codex Cloud. Las instrucciones de nube del apartado 79 se aplican cuando se trabaje realmente allí.
- Esta ficha describe también trabajo local de Supabase que **todavía no está publicado**. Un commit exclusivamente documental no equivale a publicar ese código. Consultar `git log` para el hash de cada actualización documental, sin confundirlo con un commit funcional.

### Bloque paralelo de nube: persistencia local y recuperación

El 2026-10-01 se preparó en `/workspace/MARCADOR-FUTBOLIN-V3` un bloque independiente, autorizado en el chat de configuración: jugadores reales, recuperación de partidos e historial **local al navegador**. Se desarrolló desde b10b1df antes de descubrir la actualización documental 900e470. Al preparar su publicación se incorporó 900e470 mediante fast-forward, preservando los cambios de código y los documentos del propietario.

Rama de entrega: `codex/local-players-match-recovery`. Se mantiene separada de `main` para integrar las mejoras con el bloque Supabase del PC sin sustituirlo ni perder trabajo. El hash y la confirmación del push se registrarán cuando la operación se haya ejecutado. No se ha publicado un despliegue ni aplicado migraciones desde este bloque.

Implementación de esta rama:

- `src/domain/Player.ts`: nombres normalizados, validación de duplicados y avatares.
- `src/services/persistence/LocalRepository.ts`: documento local versionado, jugadores, partido activo, snapshots de participantes, historial idempotente, validación, detección de cambios de otra pestaña y reintento de escrituras.
- `src/app/App.tsx`: composición, reloj monotónico, guardado local, pausa al ocultar/navegar y protección de partidos pendientes.
- `src/ui/screens/PlayersScreen.tsx` y `HistoryScreen.tsx`: creación/edición, selección ordenada 1v1/2v2 e historial con goles y penaltis.
- `MatchEngine.ts` y `types.ts`: checkpoints, recuperación pausada, conservación de deshacer sin retroceder reloj, correcciones de turnos/finalización de penaltis, prórroga y goles fuera de tiempo. Pausar/recargar conserva el bloqueo pendiente tras un gol.
- CSS: corrección del centrado y escalado del lienzo, listados internos y controles sin recorte.
- `tests/persistence.test.ts`, `tests/matchEngine.test.ts` y `tests/browser.test.mjs`: pruebas de dominio y flujos de Chromium; Playwright añadido como dependencia de desarrollo fijada.

Verificación ejecutada en nube: `npm ci --cache /tmp/codex-npm-cache`, **27 pruebas** de `npm test`, TypeScript/build y **13 pruebas de navegador sobre el build de producción**, todas correctas. Comprobados recarga y reapertura de pestaña, marcador/participantes, nombres históricos, penaltis, escrituras fallidas, otra pestaña, reglas/selección al volver de gestión, cambio de hora del sistema y lienzos 800×480/400×240. Inspección visual de jugadores en Chromium. `git diff --check` correcto.

Límites y diferencias que deben resolverse antes de integrar en main:

- Esta rama no incluye cliente/Auth/RPC Supabase, modo prueba ni migraciones. Guarda todos los partidos localmente; no debe presentarse como la fase B Supabase terminada.
- Los accesos JUGADORES e HISTORIAL son directos en un menú de seis entradas. Al integrar debe conservarse la navegación aprobada (jugadores en AJUSTES e historial en RANKING), salvo decisión posterior del propietario.
- El historial local incluye goles vigentes y resumen de penaltis; no es el journal completo de eventos/anulaciones que utiliza el bloque Supabase del PC.
- La discrepancia del bloqueo de tres segundos al deshacer o cambiar periodo **sigue pendiente**: esas acciones todavía reinician/liberan el bloqueo. Las pruebas de pausa/recarga no demuestran que estén resueltos esos otros casos.
- Si falla el almacenamiento local, se pausa y solicita reintentar; esto no es un fallo de Internet. No hay arranque offline/PWA, backup ni sincronización multidispositivo.

**Siguiente bloque recomendado:** recuperar/publicar de forma segura el código Supabase que ya existe en el PC; integrar de forma selectiva recuperación local, pruebas y correcciones; resolver las diferencias anteriores; completar el recorrido autenticado navegador → Supabase descrito abajo. No recrear tablas ni repetir migraciones existentes. Solo después se cerrará la fase B y podrá plantearse la fase C de estadísticas, XP y niveles.

## Fases

| Fase | Estado real |
| --- | --- |
| A. Simulador funcional | Publicado en b10b1df |
| B. Persistencia Supabase V1 | Implementada y probada en el checkout local; falta prueba autenticada de navegador y commit/push del código |
| Bloque cloud paralelo | Jugadores, recuperación e historial locales; entrega en rama separada, pendiente integración con Supabase V1 |
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
- Caché de jugadores y cola de resultados finalizados en localStorage, aisladas por proyecto/cuenta. Reintento manual en Ajustes. Los goles no dependen de Internet.
- Lienzo fijo 800×480, escalado proporcional en ventanas pequeñas y centrado en grandes. Corregido el recorte por dimensionamiento implícito de la cuadrícula.
- Panel de simulación solo en desarrollo. No hay comunicaciones físicas ni firmware.

### Módulos principales

- `src/app/App.tsx`, `services.ts`, `useData.ts`: composición, sesión, caché, navegación y guardado.
- `src/match-engine/MatchEngine.ts`, `types.ts`: motor y eventos independientes.
- `src/services/persistence/`: modelos, contratos, mapMatch y SaveCoordinator.
- `src/services/supabase/`: cliente, Auth, adaptadores y database.types.ts.
- `src/ui/screens/SettingsScreen.tsx`, `HistoryScreen.tsx`, `MatchFlow.tsx`: jugadores, historial y flujo del partido.
- `src/main.tsx`, `src/styles/global.css`, package.json/lockfile y variables de ejemplo: integración y presentación.
- `tests/persistence.test.ts`, `tests/ui-fixture.html`, `tests/uiFixture.tsx`: pruebas de persistencia y fixture visual sin Supabase.
- `supabase/migrations/`, `supabase/tests/persistence_v1.sql`: migraciones y pruebas de integridad.
- `docs/VERIFICACION_PERSISTENCIA_V1.md`: evidencia y recorrido autenticado pendiente. Este archivo también es parte del trabajo local todavía no publicado.

## Supabase ya aplicado — no repetir a ciegas

Único proyecto autorizado: **unemjyfhzljcdjcbiiwh**, MARCADOR FUTBOLIN V3, eu-west-1, organización Altocu. Plan gratuito comprobado durante la fase B; no se activaron recursos de pago ni se tocaron otros proyectos.

Tablas reales creadas:

- players: datos básicos, baja lógica y valores iniciales reservados level=0, xp=0, elo/max_elo=1200, classified_matches=0; sin lógica de progresión.
- matches: configuración, resultado, ganador, fechas, banderas y resultados/intentos de penaltis, versión del motor y hash de idempotencia.
- match_participants: jugador/equipo/posición y snapshot del nombre.
- match_events: cronología, periodo, tiempo acumulado y por periodo, marcador, secuencia, metadatos, penaltis y fecha del evento. Incluye pause/resume además de los eventos previstos.

RLS y permisos por cuenta del operador (owner_id, auth.uid). Los jugadores no son cuentas Auth. Anónimos no pueden leer/escribir; no hay service_role en cliente. Borrado de jugadores con historial bloqueado por políticas/FKs; columnas XP/ELO reservadas no modificables por el cliente.

RPC `save_match_v1`: SECURITY INVOKER, RLS vigente, valida cuenta de inicio y guarda partido/participantes/eventos en una transacción. Triggers diferidos impiden agregados incompletos incluso mediante inserciones directas.

Migraciones **aplicadas remotamente, con archivos aún locales**:

1. `20261001053217_match_persistence_v1.sql`.
2. `20261001055134_tighten_match_integrity.sql`.
3. `20261001055650_bind_save_to_account.sql`.

No volver a crear estas tablas ni aplicar migraciones duplicadas. Inspeccionar primero el esquema real y recuperar/sincronizar los archivos de la implementación local si faltan en un checkout cloud.

Última comprobación de datos tras tests SQL: cero cuentas Auth y cero filas de negocio. Es una observación del 2026-10-01, no una garantía sobre el estado futuro; volver a comprobar si es relevante, sin borrar datos.

## Verificación realizada

- npm run test:engine: correcto.
- npm run test:persistence y npm test: correctos.
- npm run build: TypeScript y Vite correctos.
- npm audit: cero vulnerabilidades en la última ejecución.
- Pruebas SQL en el proyecto real: RLS, cuentas, permisos, equipos/agregado, idempotencia, snapshot, restricciones de borrado, secuencia, modo prueba y rollback correctos. Fixtures íntegramente revertidos con ROLLBACK.
- REST real con clave pública: lectura y RPC anónimas bloqueadas con 42501.
- Advisors de seguridad: sin avisos. Rendimiento: índices de FKs corregidos; un aviso INFO de índice aún sin uso en base nueva, documentado y sin retirar protección necesaria.
- Navegador real sin sesión: menú/Ajustes y partido 1v1 completo en modo prueba sin guardado.
- Navegador con repositorios **en memoria**: creación de jugadores, selección válida 2v2, tres jugadores rechazados, cuenta atrás, partes, resumen e historial/detalle. Esto NO valida Auth ni el recorrido completo navegador → Supabase.
- Lienzo medido 800×480 sin scroll general; comprobados también 755 px de ancho y ventana de 1280×720. Cronología con scroll interno.
- Vite preview del build: carga, navegación y consola sin errores/advertencias. Avisos de recarga WebSocket de desarrollo registrados por separado.
- .env real, node_modules, dist y caché CLI ignorados; escaneo de fuentes versionables sin claves privadas/tokens.

## Bloqueo y siguiente acción exacta

Falta una cuenta de operador del marcador para la prueba real autenticada. No solicitar contraseñas por chat ni inventar credenciales; no usar la cuenta administrativa del panel Supabase como si fuera Auth de la app.

El usuario debe abrir la app real → AJUSTES → GENERAL, introducir personalmente correo y contraseña (al menos 8 caracteres), pulsar CREAR CUENTA, confirmar el correo si se solicita e iniciar sesión con ENTRAR.

Después, el agente debe verificar con la capa Supabase real:

1. Crear/editar/activar/desactivar jugadores.
2. MODO PRUEBA OFF; completar un partido y comprobar filas de partido, participantes y eventos.
3. Consultar historial/detalle y comprobar protección del jugador con historial.
4. Repetir en modo prueba ON y comprobar que no aumentan partidos ni eventos.
5. Reejecutar pruebas/build, revisar secretos y publicar el bloque funcional cuando esté estable.

**No dar la fase B por cerrada ni avanzar a XP/ELO/logros mientras falte esta comprobación.** Si el agente está en la nube y solo ve b10b1df más documentación, el código local de Supabase aún falta en ese checkout: coordinar la sincronización con el usuario, no recrearlo ni tocar el esquema ya existente.

## Límites conocidos y decisiones a preservar

- Discrepancia detectada al contrastar el contexto: `MatchEngine.undo()` libera el bloqueo de gol y `endPeriod()`/`preparePeriod()` reinician su plazo. Deshacer o pasar de periodo saltando la cuenta atrás puede permitir otro gol antes de los tres segundos del apartado 14. No hay una excepción aprobada en el contexto. Pendiente reproducir con tests de regresión y corregir en el siguiente bloque de código; no se modifica el motor en esta actualización documental ni se considera resuelta por los tests anteriores.
- GOALS cuenta los goles totales del periodo; el marcador visible es acumulativo. TIME termina por reloj; BOTH por la primera condición. Cambiar a objetivo por equipo requeriría una decisión explícita.
- Prórroga: 60 segundos y gol de oro; después penaltis alternos, cinco intentos y muerte súbita. No se atribuyen goles a jugadores.
- Deshacer no retrocede el reloj; el journal conserva goles y anulaciones.
- Historial depende de conexión. Todavía no hay PWA/arranque offline ni recuperación de una partida en curso tras cerrar/recargar; el resultado final pendiente sí se conserva si localStorage funciona.
- Pendientes locales no son backup ni se comparten entre PC/móvil; la desactivación es más segura que eliminar cuando otros dispositivos puedan tener resultados sin sincronizar.
- Clave pública configurada localmente en .env.local ignorado; cloud/Vercel necesitan su propia configuración segura. No copiar credenciales a esta documentación.
- No se modificó Vercel. No se implementaron XP/ELO, estadísticas avanzadas, logros, torneos, OTA ni ESP32. Hardware/fotos/especificaciones del contexto son requisitos aportados por el usuario, no una integración física probada.

## Registro de cambios

### 2026-10-01 — Bloque cloud local preparado para publicación en rama separada

El usuario autorizó subir a GitHub jugadores, recuperación e historial locales. Se descubrió y conservó el contexto de Supabase del PC al sincronizar origin/main. Documentadas las 40 pruebas superadas, las diferencias de navegación/modo prueba/journal y el bloqueo de gol todavía pendiente. No se modifica el proyecto Supabase ni se considera cerrada su fase B.

### 2026-10-01 — Persistencia Supabase V1, trabajo local pendiente de acceso humano

Implementados cliente/Auth, datos seguros, jugadores, agregado transaccional, historial y cola offline. Tres migraciones aplicadas. Pruebas automatizadas, SQL y visuales aisladas correctas. Pendiente recorrido autenticado y publicación del código.

### 2026-10-01 — Contexto maestro compartido

Guardados los 84 apartados del propietario en CONTEXTO_MAESTRO.md, instrucciones de lectura/mantenimiento en AGENTS.md y esta ficha contrastada con el estado real. Registrada la discrepancia del bloqueo de gol al deshacer/cambiar periodo para su verificación posterior. La publicación exclusivamente documental se comprueba con el historial Git; no cambia el estado pendiente del bloque funcional ni ejecuta las futuras fases.
