# Catálogo 05 — aprobado y activo, v0.5.3

Aprobación expresa del propietario, 2026-10-02: «Apruebo XP V2 por tier,
incluidos históricos y recálculo, y los ocho récords/Hall privados con empates
compartidos y 0 XP por récord». Sustituye la propuesta pendiente de v0.5.2.
Las nueve familias/cinco tiers de v0.5.1 conservan umbrales e identidad.
El catálogo V1 de 24 tarjetas y sus 1250 XP nunca se concedieron.

## Familias y 45 estrellas

Una tarjeta por familia, nivel 0 antes del primer umbral, cinco estrellas,
progreso al siguiente escalón, umbrales y primera evidencia confirmada.
Superar varios escalones en un partido concede todos los tiers cumplidos.

| ID estable / familia | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 | Nivel 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| `played` · Juega partidos | 1 | 5 | 25 | 100 | 250 |
| `wins` · Gana partidos | 1 | 5 | 25 | 100 | 250 |
| `team_goals` · Goles de tu equipo | 1 | 5 | 50 | 250 | 1000 |
| `streak` · Encadena victorias | 2 | 3 | 5 | 10 | 20 |
| `ranked_played` · Juega Clasificatorio | 1 | 5 | 25 | 50 | 100 |
| `ranked_wins` · Gana en Clasificatorio | 1 | 5 | 10 | 25 | 50 |
| `clean_win` · Gana sin encajar | 1 | 5 | 10 | 25 | 50 |
| `extra_win` · Resuelve en prórroga | 1 | 3 | 5 | 10 | 25 |
| `penalty_win` · Gana en penaltis | 1 | 3 | 5 | 10 | 25 |


Victorias incluyen tandas; empate/derrota corta racha. Mejor racha histórica
vigente, no la racha actual. Clasificatorio solo 1v1/2v2. Victoria a cero exige
ganar con gol de campo y ninguno recibido: 0–0 ganado en tanda no cumple.
Prórroga exige bandera confirmada y ausencia de tanda; penaltis exige tanda.
Goles de equipo compartidos por participantes, nunca goles individuales.
Penaltis no suman goles. 1v2 solo Rápido/Caos, XP completo por jugador y sin ELO.

## XP V2 aprobado, históricos y recálculo

**25 / 25 / 50 / 75 / 100 XP** por tiers 1–5, contribución única por identidad.
Máximo **275/familia, 2475/nueve familias**. Total de experiencia = XP base
aprobado de partidos + tiers vigentes; curva de niveles y reglas base intactas.
Récords siempre 0 XP. No logros basados en XP/nivel que creen ciclos.

Identidad: cuenta + UUID jugador + familia + ordinal `tier_1`…`tier_5`.
Umbral/versión/alias/actividad no cambian la identidad ni permiten otro cobro.
Catálogo de metadatos `tiers-v2`. Recarga/retry/reconexión/renombrado/baja no
suman otra vez. Corregir/eliminar hechos retira tiers que dejan de cumplirse;
recuperarlos reconstruye la misma contribución una vez. No se crea UI de edición.

Servidor SECURITY INVOKER/RLS reconstruye desde todos los resultados confirmados
completos, sin cola local/checkpoint. Prueba/incompletos/pendientes no conceden.
No contadores, ledger, concesión incremental ni XP escrito por cliente.
Primera evidencia ordenada por finalización/microsegundos/UUID; su fecha es el
hecho original, no una fecha de pago retroactivo. Snapshot scalar completo sin
cap de filas; error/otra cuenta/offline retiran confirmación y no falsean ceros.
Actualizar/reconectar/cambiar identidad/sync invalida; filtros solo afectan análisis.

Ejemplos aprobados:

- Primer Rápido 3–0 ganado: base 150 + tiers 1 de partidos/victorias/goles/victoria
  a cero (4×25) = **250 XP**, sin repetir al recargar.
- Goles de equipo 4→50: tiers 2/3 añaden **25+50=75 XP**, sin otro tier 1.
- 0–0 Rápido ganado en tanda: base 175 + partidos/victorias/penaltis (75) = **250 XP**;
  sin goles/victoria a cero/prórroga sin tanda.
- Dos Rápidos reales existentes, una victoria y una derrota por jugador:
  **225 base + 100 logros = 325 XP/nivel 2**, cuatro estrellas; solo derivación.

## Ocho récords personales y Hall privado

Todos los líderes empatados, alias actual, incluidos inactivos. Sin historial,
sin marca/líder. **0 XP** al mejorar/empatar/recuperar cualquier récord.

| ID | Regla y ejemplo |
| --- | --- |
| `most_played` | Más partidos confirmados: 24 supera 23 |
| `most_wins` | Más victorias: 12 supera 11 |
| `best_streak` | Mejor racha: G/G/E/G → 2 |
| `biggest_margin` | Mayor diferencia ganadora: 5–1 → 4; empate sin ganador no elegible; victoria en tanda → 0 |
| `most_team_goals` | Más goles de equipo en un partido: 5–4 → 5 |
| `best_win_rate` | Victorias/partidos actuales, mínimo 20: 15/20 → 75% |
| `current_elo` | ELO actual con al menos un Clasificatorio, snapshot aprobado |
| `max_elo` | Máximo ELO reconstruido con al menos un Clasificatorio |


Porcentaje actual, mínimo 20; no conserva máximo histórico del porcentaje.
Fracciones exactas (15/20=30/40), no redondeo visible. UUID solo ordena líderes,
no rompe empates. Las marcas de marcador referencian todos los partidos que las
igualan. Inicial ELO 1200 sin Clasificatorio no crea líder.

Perfil → RÉCORDS PERSONALES; HISTORIAL → HALL OF FAME. No datos públicos.
Gol rápido, remontada y duración siguen aplazados: sin hechos/tiempos explícitos
validados no se restan fechas para inferir juego efectivo ni se inventan goles.

Gana torneos (1/3/5/10/25 propuesto) queda previsto para 06, sin tarjeta, hechos,
premios o progreso activos. 06 no iniciado. Código/migración/SQL/UI y límite de
sesión del operador en [VERIFICACION_BLOQUE_05.md](VERIFICACION_BLOQUE_05.md);
estado operativo en [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md).
