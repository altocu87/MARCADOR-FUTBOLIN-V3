# Verificación del bloque 03 — 2026-10-02

Implementados ELO Clasificatorio, clasificación privada, categorías configurables y máximo histórico. **ELO real desactivado: faltan decisiones del propietario.** Inicio 1200 aprobado; «Sigue» autoriza continuar el trabajo, no aprobar parámetros propuestos. No se declara cierre funcional completo ni se inicia 04. Estado/publicación vivos en [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md).

## Decisiones pendientes, con ejemplos concretos

**Evidencia humana posterior, 2026-10-02:** el propietario aporta captura de Preview v0.4.0 con sesión activa y perfil Alex2. Se observa «ELO PENDIENTE DE APROBACIÓN · Inicio 1200. Ajustes y categorías desactivados» junto al XP confirmado (225/nivel 1). Acreditado el aviso de bloqueo competitivo en UI autenticada real para ese perfil; no un ELO activo ni inspección web directa del agente. No aprueba los parámetros siguientes ni cierra 03; el acceso del conector y SMTP permanecen separados.

Estas propuestas solo se utilizan en fixtures y dentro de transacciones SQL terminadas en ROLLBACK. La configuración persistida tiene `enabled=false` y todos los parámetros competitivos pendientes a NULL. No existen valores de respaldo que los activen desde el navegador.

| Decisión solicitada (§25–29) | Propuesta revisable | Ejemplo |
| --- | --- | --- |
| K/experiencia por jugador | Primeras 10 clasificatorias confirmadas K=40; desde la 11 K=20. Medias de equipo previas para 2v2, K propio según experiencia | 1200 contra 1200, victoria por un gol: +20/−20 con K40. Compañeros nuevo/establecido: +20/+10; el ajuste no se divide |
| Redondeo | Redondear cada ajuste al entero más próximo; mitades alejándose de cero | +10.5→+11; −10.5→−11. 1200 gana a 1400: expectativa ≈0.2403, ajuste K40 ≈30.39→+30; rival K40 −30 |
| Categorías/histéresis | Bronce <1000; Plata 1000–1199; Oro 1200–1399; Platino 1400–1599; Diamante 1600–1799; Élite ≥1800. Descenso 25 puntos por debajo del umbral; permitir saltos | Entra en Oro a 1200, conserva Oro a 1175 y baja a 1174. Alternativa sin histéresis: baja a 1199. Inicio Oro solo si se aprueban esos umbrales |
| Diferencia de goles | 1→1; 2→1.05; 3→1.10; 4→1.15; 5+→1.20. Empates y tandas multiplicador 1 | Iguales/K40, victoria por 2: +21/−21; por 5: +24/−24. Alternativa: multiplicador siempre 1 |
| Históricos y máximo | Todos los Clasificatorios válidos existentes, sin reinterpretar sus reglas; máximo del historial vigente reconstruido | Una futura corrección/eliminación puede reducir ELO y también su máximo. Alternativa de fecha de inicio requiere fecha explícita |

Preguntas presentadas al propietario y sin respuesta expresa registrada. Una futura activación exige documentar esas decisiones y aplicar un cambio servidor revisado; no bastan parámetros de pruebas. Con K distintos no se promete suma cero entre jugadores. ELO no tiene suelo artificial: Bronce cubriría también valores negativos. Ranking por ELO descendente, empate comparte puesto (1,1,3), desempate visual por UUID; incluye bajas y deja sin puesto al jugador sin clasificatorias.

## Arquitectura y seguridad

- Se inspeccionaron primero esquema, columnas, restricciones, RLS, permisos, funciones de guardado y proyección/configuración XP existentes. Solo proyecto `unemjyfhzljcdjcbiiwh`.
- `elo_rules_v1`: configuración singleton versionada, RLS, SELECT autenticado; sin permisos cliente de escritura. CHECK impide activar parámetros incompletos o incompatibles.
- `get_ranking_v1()`: STABLE, SECURITY INVOKER, `search_path=''`, exige identidad y filtra propietario con RLS. Reconstruye todo el historial confirmado Clasificatorio, orden `finished_at` con precisión de microsegundos y UUID. Utiliza ganador almacenado, incluyendo empates y penaltis; no cambia MatchEngine ni reinterpreta resultados históricos.
- En 2v2 fija ambas medias antes de ajustar a compañeros. Experiencia propia se incrementa después de cada ajuste. Categoría conserva su estado durante el recorrido; máximo incluye el inicio 1200 y los valores posteriores.
- `get_competition_snapshot_v1()`: envoltura JSON escalar de la clasificación completa en una sola lectura. Evita límite de filas de PostgREST y mezcla de páginas de distintas instantáneas. Misma seguridad invoker, solo EXECUTE autenticado.
- Producción solo lee esa RPC mediante CompetitionRepository. `src/competition/elo.ts` es referencia comprobable para tests, no una concesión cliente. No contadores, ledger, escrituras por gol ni caché nueva de datos privados; columnas protegidas de players permanecen intactas.
- El agregado confirmado es fuente de verdad. Inserciones tardías y futuras ediciones/eliminaciones reconstruyen también todos los partidos posteriores. No se implementa administración, roles ni API de edición/eliminación. Reintentos/recargas no suman incrementos; la RPC existente conserva idempotencia y bloqueo. Pendientes, prueba, Rápido y Caos no conceden ELO confirmado.
- La consulta se recalcula completa: verificada con fixtures funcionales, sin afirmar rendimiento a gran escala ni calibración competitiva. Valores extremos saturan solo el cálculo de expectativa para evitar desbordamiento numérico, sin limitar artificialmente ELO.

## Migraciones ya aplicadas

1. `20261002081345_elo_ranking_v1.sql`: configuración desactivada y reconstrucción privada.
2. `20261002084915_competition_snapshot_v1.sql`: instantánea completa JSON.

Archivos sincronizados con el registro remoto y tipos regenerados. No repetir migraciones. Supabase CLI 3 requería escritura fuera del workspace; alternativa 2.81 no completó instalación. Se utilizó `apply_migration` del conector autorizado, con sus versiones reales. Un primer intento SQL con error de sintaxis fue corregido antes de aplicar; no dejó una migración parcial ni una activación persistida.

## Interfaz y pruebas ejecutadas

RANKING conserva el historial; su botón **CLASIFICACIÓN** abre la lista privada y enlaces al perfil. Perfil: ELO actual, máximo histórico, categoría, clasificatorias y puesto, independientes de filtros de análisis/XP. Sin aprobación: aviso explícito, 1200 inicial, categoría/puesto pendientes. Sin conexión/error: se retira la confirmación y no aparecen ceros ni ELO inicial ficticios. Actualizar, reconectar y sincronizar invalidan la lectura; cancelación al salir/cambiar identidad. XP permanece independiente.

- `npm test`: nueve grupos correctos; estadísticas/análisis 42/42 y XP 8/8 conservados. ELO/repositorio 14/14: fórmula, K10/11, compañeros con experiencia diferente, medias, redondeo simétrico, márgenes, penaltis/empates, fronteras/saltos/histéresis, historial desordenado, inserción tardía, edición/eliminación/máximo, microsegundos/zonas/UUID, duplicados, exclusiones, rechazo de configuración/datos inválidos y snapshot SDK de 1201 jugadores. Coordinador real con repositorio aislado prueba recarga, reintentos simultáneos y ACK tardío sin doble ajuste.
- `npm run test:browser`: Chromium **41/41**, cero fallos/omitidos, conserva las 37 regresiones previas. Cuatro recorridos ELO: ranking/alias/bajas/no clasificados/perfil independiente; pendiente de aprobación e invitado; error/offline/reconexión sin afectar XP; clasificatorio pendiente→recarga→retry único y prueba excluida.
- TypeScript y build normal/fixture correctos. Playwright existente sustituye a agent-browser, que no estaba instalado; consola/errores y mediciones se verifican en la batería. No se añaden dependencias ni cambia lockfile.
- Revisión visual de capturas y medidas: 320×568, 390×844, 844×390, tablet 768×1024, escritorio 1440×900 y referencia física exacta 800×480. Ranking legible, ACTUALIZAR accesible, scroll interno sin desbordamiento general; panel de perfil y filtros conservados.
- Los fixtures usan motor real y repositorios en memoria, con tráfico Supabase bloqueado. Solo existen en build aislado, no en `dist` de producción. No equivalen a navegador autenticado real.

## Supabase real, con ROLLBACK

Generador reproducible: `node --import tsx supabase/tests/block03.ts > /tmp/futbolin-block03.sql`; ejecutar **todo** el SQL en una sola transacción. Aborta si colisionan UUID de fixtures. Usa una cuenta confirmada existente; no crea Auth/usuarios/correos ni modifica partidos reales. No es una migración de activación.

Ejecutado remotamente con resultado PASS: 17 agregados de fixtures, guardado real `save_match_v1` como rol authenticated, inserciones en orden inverso, paridad SQL/TypeScript ELO/máximo/conteo/categoría/puesto tras cada alta, repeticiones, conflictos y rechazo de prueba. Alias/baja por identidad; anónimo sin lectura/ejecución, otra cuenta sin filas, falta de identidad rechazada; cliente no puede modificar configuración, columnas ELO ni historial. Políticas alternativas, parámetros inválidos, edición/eliminación únicamente de fixtures y reconstrucción posterior correctas. Configuración propuesta solo dentro de ROLLBACK. Los tests no amplían permisos ni acreditan concurrencia de escritores reales; las pruebas de coordinador cubren reintentos concurrentes aislados.

Comparación integral antes/después preserva players/matches/participants/events, configuración XP y vista XP. SELECT posterior confirma: **2 jugadores, 2 partidos Rápido, 4 participantes, 12 eventos, 0 Clasificatorios, 0 prueba y 0 fixtures**. Ambos jugadores: **225 XP/nivel 1**. Configuración ELO: desactivada, inicio 1200, parámetros pendientes NULL. Funciones invoker/STABLE/search_path vacío verificadas.

Advisors sin nuevas alertas atribuibles a 03. Se conservan WARN de [protección de contraseñas filtradas deshabilitada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) e INFO de [índice histórico sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). No cambios Auth, planes ni eliminación de índices.

## Límites reales y continuidad

Vercel deniega lectura del equipo/proyecto y de la Preview protegida con 403 de alcance; el proxy HTTP también deniega el acceso. No hay sesión web del operador. No se retira protección, crean cuentas ni solicitan partidos. SQL autenticado bajo RLS está verificado, pero **XP y ELO en Preview autenticada no fueron observados por el agente**. El estado de GitHub/Vercel tras publicar se registra separadamente en ESTADO_ACTUAL; un check success no equivale a ese recorrido ni a inspección directa READY.

Bloque 01 permanece cerrado por el propietario; 02 aprobado y activo, conservando tabla/curva/históricos/idempotencia. SMTP y trece correos siguen pendientes externos separados. No main/producción, administración, predicción, logros, torneos, Google/Drive, pagos ni hardware.

Siguiente acción dentro de 03: obtener únicamente las decisiones pendientes de la tabla, probar sus valores exactos, registrar aprobación y activar en servidor. Observar Preview con acceso disponible usando historial existente, sin exigir partidos nuevos. Se entrega el prompt de 04 en [BLOQUES_DESARROLLO.md](BLOQUES_DESARROLLO.md); 04 depende de ese cierre y no se inicia automáticamente.
