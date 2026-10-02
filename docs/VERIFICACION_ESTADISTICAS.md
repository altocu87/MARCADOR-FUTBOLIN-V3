# Estadísticas básicas y perfiles — 2026-10-01

## Alcance autorizado

Petición: desarrollar íntegramente el bloque propuesto de estadísticas básicas, perfil e historial filtrado. Base cloud `201cdd3`, rama `codex/reliability-offline-v1`; main comprobada en `900e470`, sin promoción. Se puede programar/verificar con datos aislados mientras sigue pendiente el recorrido Auth/Supabase real de fase B. XP, niveles calculados, ELO, forma, logros y torneos no incluidos.

## Implementación y semántica

- `src/statistics/playerStatistics.ts`: cálculo puro de partidos, victorias/derrotas/empates, porcentaje, goles de su equipo a favor/en contra y diferencia. Cada UUID cuenta una vez; conflicto de resultado rechaza la consulta. No muta datos ni incrementa contadores.
- `loadPlayerStatistics.ts`: consulta todas las páginas con cursor fecha/ID, cancelable, con detección de falta de avance. No muestra la primera página como un total ni conserva un total parcial tras error.
- MatchRepository/getMatches acepta jugador, cursor y señal de cancelación. Supabase filtra padres mediante embed `player_filter:match_participants!inner(player_id)` separado de `participants:match_participants(*)`, conservando equipos completos. MATCH_END/prueba false, orden estable fecha/ID y cursor validado sin perder fracciones de timestamp. RLS existente conserva privacidad por operador; no cambian permisos.
- StatisticsScreen/App: RANKING → ESTADÍSTICAS, búsqueda, activos/inactivos, perfil y acceso directo desde AJUSTES → JUGADORES → PERFIL. Foto HTTPS opcional con fallback y sin referrer. Nombre actual/alias, snapshots históricos en detalle. Perfil no carga estadísticas durante partido activo: navegación existente pausa el motor; no hay consultas por gol.
- HistoryScreen: filtro antes de paginar, equipos completos, detalle reutilizado; cancelación/guardas impiden aplicar respuestas abandonadas. Perfil/listas tienen scroll interno; controles de historial/actualizar quedan fuera del panel desplazable.
- No hay schema/migraciones/tablas nuevas, funciones SQL, contadores, escrituras adicionales, cambios de motor/Auth, costes ni promoción a producción.

1v1/2v2: todos los integrantes del equipo reciben su resultado y goles de equipo; no reparto ni goleador individual. Porcentaje = victorias / partidos ×100, una decimal, 0% sin partidos. Resultado ordinario/gol de oro desde marcador final; penaltis desde ganador validado de la tanda, sin sumar lanzamientos a goles a favor/en contra. Empates almacenados se soportan aunque el flujo normal los resuelva. Correcciones/deshacer usan el marcador definitivo, no suman goles anulados del journal. Prueba/no finalizados/pendientes excluidos. IDs permiten conservar inactivos/renombrados.

Se calculan lecturas actuales, no un snapshot transaccional entre todas las páginas/dispositivos. El cursor evita desplazamiento de offsets por nuevos resultados recientes; actualizar vuelve a leer los resultados sincronizados. No hay estadísticas offline ni caché nueva de datos privados. Fallo de lectura no se presenta como cero ni como total parcial.

## Verificación ejecutada

- Baseline: seis grupos originales y TypeScript/build correctos antes de editar.
- `npm test`: siete grupos correctos; test:statistics **24/24**, cero omitidas.
- `npm run test:browser`: **8/8**, cero omitidas; TypeScript y ambos builds correctos.
- `npm audit --omit=dev`: cero vulnerabilidades. Sin nuevas dependencias ni modificación del lockfile.
- `git diff --check`: correcto; revisión documental y de archivos preparados antes de publicar.

Tests estadísticos: vacíos, perspectiva 1v1/2v2, empate/porcentaje, exclusiones, duplicados/conflictos, IDs/nombres, penaltis/muerte súbita, datos inválidos, pureza, motor real por partes/gol de oro/penaltis, corrección/deshacer, 25/exactamente 20 partidos, páginas solapadas, fallo posterior, no avance, cancelación previa/tardía. SDK oficial con transporte aislado verifica GET, embed completo/filtro por ID, status/prueba, orden/rango, cursor de precisión de microsegundos y rechazo de expresiones inválidas antes de enviar. No es SQL remoto.

Navegador Chromium/build aislado: prueba sin guardado; recuperación; pendiente/reintento; perfil tras guardar/reintentar 2v2 con un solo partido; perspectiva del compañero/rival; editar alias y conservar snapshot de todos los participantes; 25 partidos con prórroga/penaltis, jugador inactivo, 20+5 en historial, búsqueda y jugador sin partidos; errores/offline sin falsos ceros; vistas 390×844, 800×480, 768×1024, 1440×900 y referencia física; PWA con servidor realmente apagado. Contextos nuevos, solicitudes Supabase bloqueadas y datos de fixture en memoria.

Primera ampliación de tests detectó un locator ambiguo al haber 20 filas y una comprobación de viewport ejecutada antes del siguiente frame de React: corregido a primera fila/esperar que el layout se estabilice, conservando las comprobaciones reales de conteo y ausencia de scroll. Revisión visual en preview propio 5199 encontró controles debajo del scroll inicial; movidos fuera del contenido y verificados accesibles dentro del panel físico. Capturas móviles/físicas temporales bajo `/tmp/futbolin-statistics-ceYGKu`, fuera de Git. Aplicación sin pageerror en recorrido visual; servidores/pestañas ajenos no se detienen.

## Pendiente externo y siguiente bloque

No se han creado cuentas, enviado correos ni escrito datos reales. No se han repetido migraciones ni probado la nueva consulta contra Supabase autenticado: variables/red/sesión siguen siendo requisitos previos documentados en ESTADO_ACTUAL.md. Tampoco se acredita un despliegue nuevo por compilar/push. No afirmar que fase B/C reales están cerradas ni promover a main por tests aislados.

Después de la verificación real: comprobar dos/cuatro jugadores, partido normal/prórroga/penaltis, perfil e historial filtrado, desactivar/editar sin perder datos, y modo prueba sin contribución. Un siguiente bloque posible es XP/niveles, pero necesita autorización y concretar parámetros; no se aplica automáticamente aquí.

## Ampliación autorizada: análisis de resultados — 2026-10-01

Base **55b6632** de la misma rama. El propietario autoriza ahora últimos resultados/rachas, separación 1v1/2v2, filtros y evolución; reemplaza para este alcance la exclusión inicial de análisis adicionales, no autoriza XP/ELO/logros ni producción.

`playerAnalysis.ts`: preparación validada/deduplicada, orden por finalización/fracción de timestamp/UUID, últimos cinco del conjunto seleccionado (nuevo a antiguo), racha actual y mejor racha de victorias, rendimiento por participantes 1v1/2v2 y porcentaje acumulado. Empate interrumpe rachas de victorias/derrotas y se identifica explícitamente como racha de empates. Penaltis deciden resultado, no goles. Conflictos de fecha/modalidad/equipos o datos incompatibles no se convierten en análisis parcial. No muta snapshots.

Fechas inclusivas según zona del dispositivo: desde medianoche inicial hasta medianoche exclusiva del día posterior al fin; avance calendario, no suma de 24 horas. Modalidad y formato combinables. APLICAR cambia todas las secciones y el historial del perfil; borrador sin aplicar no modifica cifras, rango inválido conserva lo anterior, QUITAR recupera todo. Rachas/evolución comienzan en el primer partido del filtro y no se presentan como máximos de toda la vida si hay un filtro. Formato sin partidos muestra muestra vacía, no ventaja ficticia.

`loadPlayerMatches` comparte el paginado completo/cancelable sin pedir eventos, y mantiene la API antigua de totales mediante wrapper. Perfil conserva datos en memoria, sin caché nueva ni escrituras. Cambiar selectores no vuelve a consultar el repositorio; ACTUALIZAR sí, conservando filtro. Historial del perfil pagina la misma selección 20 a 20; detalle usa repositorio existente y snapshots completos. Actualizar desde el perfil evita ofrecer un botón que recargase solo parte del historial filtrado. Pérdida de conexión retira resultados y vuelve al perfil; reconexión recarga sin perder filtro. Cambiar jugador/cuenta o abandonar el perfil descarta su estado.

`AnalysisDetails.tsx`: gráfico SVG accesible de porcentaje acumulado, hasta 60 puntos representativos incluyendo extremos; todos los resultados intervienen en el cálculo. Un único partido tiene punto visible; ninguno no dibuja gráfico. Eje horizontal por orden, no distancia temporal. Tabla desplegable de los últimos diez valores exactos. Scroll interno del perfil/tablas; filtros plegables y acciones principales fuera del scroll. Revisión visual mediante preview propio 5201/capturas `/tmp/futbolin-analysis-OjXXFb`, móvil 390×844 y físico 800×480, aplicación sin pageerror; puerto 5199 ocupado no se detuvo.

Pruebas finales: `npm test` siete grupos correctos, estadísticas/análisis **41/41**; `npm run test:browser` **10/10**; TypeScript, builds normal/fixture y auditoría de producción (0 vulnerabilidades) correctos. Los 17 casos nuevos cubren rachas/empates, perspectiva por equipo, filtros/ausencia de datos, inclusividad/microsegundos, DST 23/25 horas/desfase, duplicados/conflictos, inmutabilidad/exclusiones, penaltis, lectura reutilizable y representación accesible/acotada de 200 partidos. Browser añade análisis combinado (días/modalidades/formatos), error de rango conservando cifras, vuelta/paginado coherente, quitar/actualizar, gráfico/tabla, físico y desconexión/reconexión con filtro. Los ocho recorridos anteriores se conservan.

Durante revisión se detectaron selectores sin nombre accesible inequívoco y panel plegado al volver del historial; corregidos sin debilitar assertions. Los tests de render estático necesitaron el import React usado por los otros componentes testeados debido al transform JSX clásico del runner; corregido y repetidos. Fixture `?statistics=analysis`: doce documentos del motor real en memoria, sin Supabase, separada de la producción. Sin dependencias/lockfile, cambios de SQL/motor/guardado, cuentas, costes, configuración externa o promoción. La guía de entorno existente sirve para los scripts vigentes; no se modificó su borrador/publicación. La integración/auth real y despliegue remoto siguen sin acreditarse por estas pruebas.

## Nombres actuales por petición del propietario — 2026-10-02

El propietario confirma cambio de alias/nombre con sus datos conservados, pero solicita mostrar el actual en historial. Esta decisión reemplaza la presentación de snapshots descrita en las verificaciones históricas anteriores, sin cambiar los datos guardados. Historial global y del perfil, detalle y últimos cinco resultados resuelven player_id contra jugadores actuales de la cuenta: alias preferente, nombre sin alias, incluyendo inactivos; fallback al snapshot si falta ficha. Sin nuevas lecturas remotas por resultado, cambios de guardado/eventos/métricas, migraciones o permisos.

Regresión de navegador reproducida antes del arreglo; después correcta en las cuatro vistas, baja lógica conservando alias/estadísticas y quitar alias/cambiar nombre. Comparación de documentos completos en fixture acredita originales/eventos idénticos. Render cubre homónimos por ID, inactivos, ficha ausente y escape HTML. npm test siete grupos correctos, estadísticas/análisis 42/42; Chromium 33/33, TypeScript/builds normal/aislado correctos. Capturas 390×844/800×480 revisadas sin scroll general/pageerror. Supabase SELECT real confirma dos partidos y cero de prueba; cuatro participantes con ficha actual, dos con nombre actual distinto del snapshot. No se exponen nombres/IDs ni se modifican datos remotos; pruebas de UI son independientes y no sustituyen Safari autenticado. Estado/publicación y comprobación humana restante de 10 en ESTADO_ACTUAL; no repetir edición ni generar partidos para observar el historial existente.

Publicación funcional: 30cda7469a64c7f640349309a1363ba681adc7bc comprobado por push fast-forward y referencia remota; main 900e470 intacta. GitHub informa Vercel success, despliegue A3skpxTQdRK1p1jfc4Su2BVcznq8. No acredita aún observación del alias corregido en Safari del propietario.

## Confirmación final del propietario — 2026-10-02

Cierre funcional del bloque 01, 2026-10-02: el propietario confirma «Todas las pruebas OK» después del checklist restante 7/10/11. Se aceptan recuperación/reanudación, alias actual/baja/reactivación y PWA/reapertura sin red en el dispositivo como confirmación humana; no como inspección directa del agente ni nueva captura. Esta confirmación sustituye los pendientes funcionales anteriores; no repetir cuentas, partidos ni pruebas por rutina. Personalización de trece correos hosted/remitente SMTP sigue pendiente de acceso de edición y configuración autorizada: no queda acreditada por el checklist, no se contratan servicios y no bloquea planificar 02. Main no se promueve; XP/ELO todavía no implementados.
