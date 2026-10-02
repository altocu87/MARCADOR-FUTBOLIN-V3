# Catálogo 05 — propuesta V1 para aprobación

Preparado el 2026-10-02. **Sin aprobación registrada; no concede premios reales.**
Esta primera entrega propone 24 logros visibles y 8 récords. Los aproximadamente
50 logros/10 secretos del contexto son una meta futura: no rellenar el catálogo
con reglas o hechos inventados. No hay logros secretos en esta propuesta.

## Logros propuestos

Cada umbral es un logro distinto con ID inmutable; los escalones son acumulables.
XP indicado por jugador, una sola contribución por ID de logro.
Suma máxima del catálogo V1 completo: **1250 XP extraordinarios por jugador**,
sin límite al XP de partidos aprobado. Es una propuesta, no una concesión.

| Familia / IDs estables | Umbrales | XP respectivos | Qué cuenta |
| --- | --- | --- | --- |
| `played_1/10/50/100/250` | 1, 10, 50, 100, 250 partidos | 25, 25, 50, 50, 100 | Cualquier modo admitido |
| `wins_1/10/50/100/250` | 1, 10, 50, 100, 250 victorias | 25, 25, 50, 50, 100 | Ganador confirmado, incluida tanda |
| `streak_3/5/10` | 3, 5, 10 victorias seguidas | 25, 50, 100 | Todos los modos; empate/derrota corta |
| `ranked_played_1/10/50` | 1, 10, 50 Clasificatorios | 25, 50, 100 | Solo 1v1/2v2 Clasificatorio |
| `ranked_wins_10/50` | 10, 50 victorias Clasificatorias | 50, 100 | Ganador confirmado |
| `team_goals_50/250/1000` | 50, 250, 1000 goles de equipo acumulados | 25, 50, 100 | Goles del equipo en partidos del jugador |
| `clean_win_1` | Primera victoria con ≥1 gol de campo y 0 recibidos | 25 | Un 0–0 ganado por tanda no cumple |
| `extra_win_1` | Primera victoria por prórroga, sin tanda | 25 | Bandera confirmada, no inferir el minuto |
| `penalty_win_1` | Primera victoria por penaltis | 25 | Tanda separada; no suma goles de campo |

No se afirma que el jugador marcó los goles: en 2v2 ambos compañeros reciben
progreso por los goles de su equipo. En 1v2 Rápido/Caos cada jugador recibe el
premio íntegro que cumpla; no se reparte ni concede ELO. No hay logros por XP/nivel
que puedan crear una dependencia circular con sus propias recompensas.

## Récords y Hall of Fame propuestos

**XP por récord: 0.** Mejorar, empatar o recuperar un récord no concede experiencia.
Hall of Fame privado de la cuenta, con todas las identidades empatadas como
líderes; alias/nombre actual, bajas incluidas. Cero partidos: sin récord, sin líder.

| ID | Métrica | Regla y ejemplo |
| --- | --- | --- |
| `most_played` | Partidos confirmados | 24 partidos supera 23 |
| `most_wins` | Victorias confirmadas | 12 triunfos supera 11 |
| `best_streak` | Mejor racha de victorias | G/G/E/G → 2, no 3 |
| `biggest_margin` | Mayor diferencia en una victoria de campo | 5–1 → 4; 2–2 y tanda 3–1 → 0 |
| `most_team_goals` | Más goles de su equipo en un partido | 5–4 → 5; compañero comparte el récord |
| `best_win_rate` | Victorias/partidos actuales, mínimo 20 | 15/20 → 75%; 1/1 no compite |
| `current_elo` | ELO actual, mínimo 1 Clasificatorio | Solo snapshot servidor aprobado/activo |
| `max_elo` | Máximo ELO reconstruido, mínimo 1 Clasificatorio | Incluye 1200 inicial tras jugar; no usa columna reservada |

Porcentaje compara fracciones exactas (15/20 = 30/40); redondeo a una decimal
solo para presentación. Los líderes pueden cambiar al añadir/corregir/excluir
hechos. El orden por UUID organiza empates, nunca rompe un empate deportivo.
Un récord personal de marcador referencia todos los partidos que lo igualan.

Quedan aplazados gol más rápido, mayor remontada y partido más largo: una fecha
de inicio/final no mide juego efectivo ni excluye pausas. Necesitan journal
completo, tiempos explícitos y validación de anulaciones; nunca usar diferencia
de fechas ni tiempos ficticios como sustituto. No hay goles individuales.

## Históricos, unicidad y reconstrucción propuestas

Incluir todos los históricos válidos, como XP/ELO aprobados. Entrada exclusivamente
de lectura completa confirmada bajo RLS; modo prueba, checkpoint, cola pendiente,
partido en curso y páginas incompletas no contribuyen. La procedencia confirmada
no se puede deducir únicamente de `status=MATCH_END` y `test_mode=false`.

Orden de finalización con microsegundos y UUID. El primer partido que cumple el
umbral proporciona evidencia/fecha; esa fecha es la del hecho, no una concesión
retroactiva ejecutada ese día. Identidad de premio: cuenta + jugador + ID del
logro; versión del catálogo es metadato, no permite cobrar otra vez el mismo ID.
Retry/recarga/reconexión/renombrado/baja no duplican premios. Conflictos para un
mismo UUID invalidan la reconstrucción completa, no ofrecen totales parciales.

XP extraordinario = suma de recompensas de IDs satisfechos en el historial
vigente. Si una futura edición/eliminación deja de cumplir un logro, su progreso
y XP desaparecen al reconstruir; si vuelve a cumplirlo contribuye una vez, nunca
se acumula un segundo cobro. No se implementa administración aquí. Cambiar una
regla/recompensa requerirá revisión explícita de catálogo y política de recálculo.
No se conserva un premio fantasma separado de los hechos vigentes.

Ejemplos para decidir:

- Primer Rápido 1v1 ganado 3–0: XP de partido **150**, más `played_1` 25 +
  `wins_1` 25 + `clean_win_1` 25 = **225 propuesto**. Hoy siguen siendo 150.
- Tercer triunfo consecutivo, primer Clasificatorio, 1–0: XP partido **200** +
  `streak_3` 25 + `ranked_played_1` 25 = **250 propuesto** si los otros logros
  ya estaban satisfechos. Un retry conserva 250, no 300.
- Primera tanda ganada 0–0: partido **175** en Rápido, `played_1` 25 +
  `wins_1` 25 + `penalty_win_1` 25 = **250 propuesto**; no `clean_win_1`.
- 2v2 ganado 5–1: los dos ganadores progresan 5 goles **de equipo**, nunca
  5 goles individuales. Un 1v2 casual aplica el mismo criterio por equipo.
- Récord de margen 4 que pasa a 5, luego a 6: **0 XP extraordinario** en cada cambio.
- Dos Rápidos históricos con una victoria y una derrota: 225 XP aprobados;
  `played_1` + `wins_1` propuestos añadirían 50 → **275** (y 25 más solo si
  el histórico demuestra una victoria ≥1–0). No se activa por publicar este archivo.

## Integración tras aprobación

Propuesta de servidor: catálogo versionado de solo lectura, derivación única por
cuenta/jugador/logro, snapshot JSON STABLE SECURITY INVOKER bajo RLS sin límite de
filas de Data API, reutilizando ELO vigente. Extender XP efectivo con una suma de
logros única y recalcular nivel con los umbrales ya aprobados; conservar XP base y
mostrar el desglose. No escribir `players.xp/level/elo`, no contador incremental,
no service_role cliente, no llamadas por gol ni caché privada nueva en el worker.
Probar paridad TS/SQL, aislamiento, permisos, retry y rollback antes de aplicar.

UI futura: LOGROS/RÉCORDS del perfil independiente de filtros y HALL OF FAME en
RANKING. Sin red/error/lectura incompleta, retirar confirmación sin mostrar ceros
falsos. Refrescar/cambiar cuenta/reconectar/sync invalida lecturas; no bloquear juego.
La maqueta de revisión permanece aislada mientras no haya aprobación expresa.

**Decisión solicitada:** aprobar esta V1 completa (24 logros/umbrales/XP, 8 récords
sin XP, mínimo 20 para porcentaje, históricos y recálculo descritos), o indicar
qué cifras/reglas cambiar. No interpretar silencio/publicación como aprobación.
