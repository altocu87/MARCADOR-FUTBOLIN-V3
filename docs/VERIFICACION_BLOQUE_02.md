# Bloque 02 — XP y niveles, 2026-10-02

Implementación y activación aprobadas. Verificados cálculo, UI independiente y SQL/RPC/RLS reales. El recorrido XP en la Preview autenticada sigue sin observación directa del agente: conector Vercel deniega alcance (403), proxy HTTP deniega el destino y no hay sesión web del operador. No reabre las pruebas humanas cerradas de 01 ni pide cuentas/partidos nuevos. Estado operativo y publicación: [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md).

## Decisiones expresamente aprobadas

El propietario respondió en esta conversación aprobando tabla, curva acumulada y todos los históricos válidos. Valores por **cada jugador**; en 2v2 no se divide entre compañeros y no se atribuyen goles individuales.

| Concepto | XP |
| --- | ---: |
| Completar un resultado válido confirmado | 50 |
| Victoria | +100 |
| Empate | +60 |
| Derrota | +25 |
| Victoria en Clasificatorio | +50 |
| Victoria en prórroga | +25 |
| Victoria en penaltis | +25 |

Se añade **un solo** resultado (victoria/empate/derrota). La bonificación de penaltis sustituye a la de prórroga, aunque consten ambas banderas. Solo el ganador recibe bonificaciones; no hay recompensa de torneos, récords o logros.

| Ejemplo por jugador | Total XP |
| --- | ---: |
| Victoria Rápido o Caos, sin desempate | 150 |
| Empate en cualquier modalidad | 110 |
| Derrota en cualquier modalidad | 75 |
| Victoria Clasificatoria sin desempate | 200 |
| Victoria Rápido/Caos por prórroga o penaltis | 175 |
| Victoria Clasificatoria por prórroga o penaltis | 225 |
| Victoria Clasificatoria 2v2 por penaltis | 225 para cada ganador; 75 para cada rival |
| Prueba ON o resultado todavía sin sincronizar | 0 confirmado |

**Curva aprobada:** `T(0)=0`, `T(N)=ceil(100 × N^1.35)`. T es XP **total acumulado**, no coste adicional para pasar de N−1 a N. El coste del siguiente nivel es `T(N+1)−T(N)`. Nivel = mayor N con T(N)≤XP; niveles 0–100. Umbrales enteros redondeados hacia arriba, almacenados explícitamente en servidor para evitar divergencia de coma flotante. Recompensas enteras sin redondeo adicional; progreso visual = `(XP−T(N))/(T(N+1)−T(N))`.

| Nivel | Umbral acumulado |
| --- | ---: |
| 0 | 0 |
| 1 | 100 |
| 2 | 255 |
| 3 | 441 |
| 10 | 2239 |
| 100 | 50119 |

A 254 XP: nivel 1, falta 1 XP. A 255: nivel 2. A 50119 o más: nivel 100, barra completa y XP sigue acumulándose.

**Históricos:** todos los resultados válidos vigentes desde el inicio, cualquiera que sea su versión de reglas de juego; nunca reinterpretar el marcador/journal antiguo. `eligible_from=null`. Una futura corrección/eliminación puede reducir XP y nivel al reconstruir desde el historial; el propietario aceptó esta política. No se ofrece la administración del historial ahora.

## Arquitectura y seguridad

- `src/progression/xp.ts`: cálculo puro y referencia de recálculo para pruebas/fixtures, configuración validada. No se usa para escribir/conceder XP real en el navegador.
- `ProgressionRepository` y `SupabaseProgressionRepository`: lectura de una instantánea por ID de jugador, cancelable. Validación del rango entero exacto; errores no se convierten en ceros.
- `public.xp_rules_v1`: singleton compartido de parámetros aprobados/version/activación/fecha mínima/umbrales. RLS, lectura autenticada de parámetros sin información personal; sin permisos INSERT/UPDATE/DELETE para cliente ni anónimo. Configuración técnica únicamente en servidor con cambio revisado; no hay editor administrativo ni nuevos roles.
- `public.player_progression_v1`: **vista normal, no materializada**, `security_invoker=true`. Aplica RLS de players/matches/participants como el llamador, con vínculos compuestos de propietario. Cada jugador tiene una fila; `unique(match_id,player_id)` garantiza una contribución por resultado. Una lectura SQL obtiene XP/nivel/umbrales/version y número de partidos del mismo snapshot.
- XP entra cuando el agregado final queda **confirmado en la base**. `save_match_v1`, sus hashes, bloqueo por UUID, SECURITY INVOKER y triggers de integridad permanecen intactos. Resultado/participantes/eventos y su contribución XP se hacen visibles conjuntamente al commit. Otra sesión no puede leer un agregado sin confirmar.
- Sin ledger ni incrementos: recarga, retry y múltiples lecturas reconstruyen el mismo total. Un timeout puede dejar copia local pendiente de acuse aunque el commit ya exista; consultar el servidor confirma ese resultado y reintentar no vuelve a premiarlo. Un resultado que solo existe en la cola nunca contribuye.
- Las columnas físicas `players.xp/level` siguen reservadas, protegidas y sin modificación. La fuente de progresión efectiva es la vista, usada también para cargar niveles de las tarjetas. No mezclar estos valores con contadores físicos antiguos. ELO/max_elo/classified_matches no se modifican.
- Perfil: total XP y nivel con barra accesible, XP restante, umbral, límite y explicación de confirmación. **Independiente de los filtros de análisis**, cuyo conjunto sigue siendo coherente para estadísticas e historial. Actualizar/reconectar/confirmar sincronización vuelve a consultar; no se promete actualización en vivo entre dispositivos.
- Sin red o sesión verificada, el panel no afirma XP confirmado; la lista local de jugadores puede conservar el último nivel recibido, sin conceder progreso nuevo. No hay consulta por gol ni dependencia de XP en MatchEngine.

Cambiar en servidor recompensas/umbrales/version o `eligible_from` reconstruye la progresión de todo el historial elegible en la siguiente lectura; requiere una decisión de producto revisada. `enabled=false` suspende el cálculo, que devuelve cero/desactivado. La curva exige cero inicial y valores enteros estrictamente crecientes. La configuración actual tiene 101 umbrales; el almacenamiento admite límites futuros revisados, sin activar uno distinto del 100 aprobado.

Futuras altas/ediciones/eliminaciones administrativas deberán validar el agregado, auditar/versionar y conservar RLS/conflictos. La vista se actualizará desde los hechos vigentes sin sumar compensaciones; si se adopta anulación reversible, habrá que añadir explícitamente el filtro de vigencia. Las simulaciones SQL de edición/eliminación modifican solo fixtures dentro de ROLLBACK y prueban la proyección, no una API administrativa completa. No se ampliaron permisos de otras cuentas.

## Esquema inspeccionado y migraciones

Inspección previa del proyecto autorizado `unemjyfhzljcdjcbiiwh`: tablas/columnas/constraints, funciones existentes, grants y políticas. RLS activa, RPC invoker y columnas protegidas sin permiso de escritura autenticada. Dos jugadores, dos partidos, cuatro participantes y doce eventos; cero de prueba. Ningún dato de identidad privado/credencial en esta documentación.

Migraciones nuevas **aplicadas** y archivos alineados con sus versiones remotas:

1. `20261002072432_xp_levels_v1.sql`: configuración inicialmente desactivada, validación de curva y vista privada.
2. `20261002073605_activate_approved_xp_v1.sql`: activa exclusivamente la configuración aprobada, después de SQL real/curva/RLS con ROLLBACK.

La CLI creó los archivos antes de prepararlos; se renombraron a los timestamps reales asignados por apply_migration. Las tres migraciones anteriores tienen una discrepancia de timestamp ya documentada en 01: no se duplicaron ni repararon sus registros por rutina.

SELECT posterior a activación: ambos jugadores reales tienen **225 XP, nivel 1, dos partidos confirmados, siguiente umbral 255**. Se conservan exactamente dos partidos/cuatro participantes/doce eventos y campos físicos XP/nivel/ELO originales. Cálculo histórico sin backfill ni reescritura de resultados. Tipos de base regenerados desde el esquema remoto.

## Pruebas independientes

- `npm test`: ocho grupos; estadísticas/análisis 42/42 y XP 8/8. Motor/persistencia/recuperación/PWA/layout/Auth conservados.
- XP: recompensas por modalidad/desempate/compañero, 100 fronteras antes/exacto/después, nivel máximo sin perder XP, configuración/históricos, duplicados/conflictos y recálculo vigente sin mutación. Cola sin red/recarga, llamadas simultáneas y timeout/confirmación tardía sin doble total. SDK oficial con transporte aislado, vista privada y cero escrituras.
- TypeScript y builds normal/fixture pasan. Chromium: evidencia final en ESTADO_ACTUAL; los cuatro casos nuevos verifican perfiles/25 resultados/filtros, 2v2/modo prueba, pendiente/retry/actualizar y errores/offline. Supabase bloqueado en las fixtures; no son cuenta ni RPC remotas.
- Revisión visual de capturas móvil y 800×480, barra nativa etiquetada, scroll interno y acciones accesibles; sin scroll general/pageerror. Playwright/Chromium disponibles; agent-browser ausente. Capturas `/tmp/futbolin-xp-*.png`, fuera de Git.
- Revisión React: componentes separados, hooks incondicionales, peticiones XP/estadísticas independientes, cleanup/abort al cambiar de cuenta/jugador, revisión tras sync y mensajes de error. Sin dependencias nuevas ni cambio del lockfile.

La primera ejecución de navegador encontró tres expectativas incorrectas en los nuevos tests (total de fixture y dos selectores). Corregidas; no eran fallos de producto. El primer generador SQL usaba una variable ambigua `players`; corregida a `fixture_players`, ejecución final correcta.

## Verificación real de Supabase

```bash
node --import tsx supabase/tests/block02.ts > /tmp/futbolin-block02.sql
```

Ejecutar archivo entero en una única transacción administrativa que termina en ROLLBACK. Usa una cuenta confirmada existente internamente, sin contraseñas/tokens ni crear Auth. Si un ID de fixture ya existe, aborta sin sobrescribirlo. Cambia a authenticated para ejecutar `save_match_v1` real y leer la vista bajo RLS. Hace fixtures desde MatchEngine/mapMatch para modalidades, 1v1/2v2 y desempates; el empate es una fixture explícita de resultado histórico, no un nuevo flujo del motor.

Resultado real `PASS block 02 ... ROLLBACK`: paridad SQL/TS, retry idéntico, conflicto/prueba rechazados, nombre/baja con ID estable, cuentas ajenas y anónimo bloqueados, escritura de config/vista/columna XP bloqueada, curva inválida rechazada, corte/desactivación/límite y 300 lecturas de fronteras a través de la vista. Edición/eliminación únicamente de fixtures; comparación completa de filas de negocio originales antes/después y rollback. SELECT posterior conserva dos partidos/cuatro participantes/doce eventos; ningún fixture ni configuración de test quedó persistido.

Advisors: sin nuevos avisos de tabla/vista/RLS; persiste WARN Auth por protección de contraseñas filtradas deshabilitada ([referencia](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)) e INFO de `events_owner_idx` sin uso ([referencia](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)). No se cambia Auth, contratan servicios o retiran índices por estos avisos históricos. Changelog oficial denegado por 403; documentación actual de funciones/RLS consultada mediante MCP.

## Límite de Preview

Vercel list_projects devuelve 403 de alcance a `altocuvlc-9686s-projects`; HTTP directo recibe 403 del proxy. No sesión interactiva del operador. Commit funcional aa0b70c/push fast-forward comprobados, GitHub informa Vercel success (4y5GWYPoNp2Hzg9w9oGkVz2x8MSk). Evidencia en ESTADO_ACTUAL; no significa inspección directa de READY/Preview autenticada. No se desactiva la protección ni se solicita una cuenta nueva/repetición de 01. Queda observar **solo XP/nivel/barra del perfil** en la Preview usando los partidos ya existentes; no generar otro resultado ni modificar alias para esa comprobación. SMTP/correos hosted siguen pendientes externos independientes.
