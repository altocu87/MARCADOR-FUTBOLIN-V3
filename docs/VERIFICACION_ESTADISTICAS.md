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
