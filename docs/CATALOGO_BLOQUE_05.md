# Catálogo 05 — logros por niveles, v0.5.1

Actualizado el 2026-10-02 por petición del propietario: **una familia de logro que
sube de nivel, con estrellas**, en lugar de tarjetas separadas para cada umbral.
Pidió goles en niveles 1, 5 y 50 y delegó elegir familias y escalones accesibles.
Esta decisión sustituye la propuesta V1 de 24 tarjetas independientes de v0.5.0.
No aprueba importes de XP extraordinario ni el catálogo de récords/Hall.

## Logros implementados

Nueve familias, cinco niveles cada una: **45 estrellas posibles**. Una tarjeta
por familia; nivel 0 antes del primer umbral, estrellas acumuladas, valor total,
siguiente umbral y cantidad que falta. Se pueden consultar todos los niveles y
la fecha/UUID del primer hecho confirmado que permitió alcanzarlos. Al superar
varios umbrales en un partido se consiguen todos los niveles correspondientes.

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

Partidos y victorias cuentan todos los modos admitidos; una tanda cuenta como
victoria. Empate o derrota interrumpe la racha; el logro conserva la mejor racha
reconstruida, no exige mantener la racha actual. Clasificatorio solo 1v1/2v2.
Victoria a cero exige ganar con al menos un gol de campo y ninguno recibido;
0–0 ganado en tanda no cumple. Prórroga exige bandera confirmada y ausencia de
tanda; penaltis exige tanda confirmada, sin inferir minutos ni duración.

Goles son **del equipo en los partidos del jugador**, nunca goles individuales.
En 2v2 ambos compañeros progresan por los goles de su equipo; los penaltis no
suman goles de campo. 1v2 solo Rápido/Caos, mismas estrellas para cada participante
que cumpla los hechos, XP de partido completo y ningún ELO.

**Gana torneos** queda previsto para 06: propuesta de 1/3/5/10/25 campeonatos.
No tarjeta activa, ganador ficticio ni progreso calculado antes de que exista
un resultado de torneo confirmado y reglas aprobadas. No se inicia 06.

## Reconstrucción e identidad implementadas

Catálogo `src/achievements/catalog.ts`, versión de metadato `tiers-v2`.
Identidad: cuenta + UUID del jugador + ID de familia + ordinal `tier_1`…`tier_5`.
El umbral, versión, alias/nombre o actividad no forman parte de la identidad.
No hay concesión incremental, contador persistido ni premio fantasma.

`rebuildAchievements` requiere procedencia confirmada y lectura completa. El
perfil reutiliza todas las páginas de su repositorio privado bajo RLS; no usa
cola local ni checkpoint. Prueba y partidos sin finalizar quedan excluidos.
Un final local no demuestra confirmación. Conflictos de UUID invalidan la
reconstrucción; orden por finalización/microsegundos/UUID para la primera evidencia.
La fecha mostrada es la del hecho, no una concesión retroactiva ejecutada ese día.

Recarga/retry/reconexión/renombrado/baja no duplican estrellas. Una futura edición
que deje de cumplir un umbral retira esa estrella al reconstruir. Volver a cumplir
recupera la misma identidad, sin otro cobro. No se implementa administración.
Sin conexión/error/lectura parcial el perfil oculta cifras de logros; no muestra
ceros como hechos confirmados. Actualizar, reconectar, cambiar cuenta/jugador y
sincronizar pendientes invalida el historial. Filtros de análisis no alteran logros.

## Recompensas extraordinarias: propuesta para aprobación

**Recompensa activa: estrellas, 0 XP adicional.** XP de partidos y curva de niveles
aprobados permanecen intactos. No se extiende la proyección XP ni se escriben
columnas reservadas. El cliente solo presenta badges desde hechos confirmados;
no es una autoridad de concesión de experiencia.

Propuesta concreta V2, todavía sin activar: **25 / 25 / 50 / 75 / 100 XP** por
alcanzar respectivamente niveles 1–5, una única contribución por identidad del
nivel. Máximo 275 XP por familia, 2475 XP para las nueve familias. Reemplaza los
1250 XP del catálogo V1, que nunca se concedieron. Torneos excluidos de esa suma.
Récords propuestos: 0 XP. No logros por XP/nivel que creen un ciclo de recompensas.

Ejemplos para aprobar/corregir:

- Primer Rápido ganado 3–0: estrellas nivel 1 en partidos, victorias, goles de
  equipo y victoria a cero; **150 XP de partido hoy**. Con esta propuesta serían
  150 + 4×25 = 250 XP, sin repetir el pago al recargar.
- Goles de equipo pasan de 4 a 50: la misma tarjeta pasa de nivel 1 a nivel 3,
  consigue niveles 2 y 3. Hoy 0 XP adicional; propuesta 25 + 50 = 75 XP únicos.
- Un 0–0 ganado por tanda desbloquea partidos, victorias y penaltis nivel 1;
  no goles ni victoria a cero. Hoy **175 XP Rápido**, propuesta +75 = 250 XP.
- Dos Rápidos históricos con una victoria y una derrota conservan los **225 XP**
  aprobados. Las estrellas que cumplan se muestran sin alterar esa experiencia.

Si se aprueba XP: derivación servidor bajo RLS por cuenta/jugador/familia/tier,
reconstrucción desde hechos vigentes, suma única y desglose separado de XP base.
Eliminar el cumplimiento retira su contribución; recuperarlo la suma una vez.
Versión/umbral nunca permiten otro cobro por el mismo tier. Verificar contrato,
paridad y aislamiento antes de aplicar migraciones o conceder XP.

## Récords y Hall of Fame: propuesta sin activar

Hall privado de la cuenta, todos los líderes empatados, alias actual y bajas
incluidas. Sin historial, sin récord/líder. **0 XP** por mejorar/empatar/recuperar.

| ID | Regla y ejemplo |
| --- | --- |
| `most_played` | Más partidos confirmados: 24 supera 23 |
| `most_wins` | Más victorias: 12 supera 11 |
| `best_streak` | Mejor racha: G/G/E/G → 2 |
| `biggest_margin` | Mayor diferencia ganadora: 5–1 → 4; empate y tanda → 0 |
| `most_team_goals` | Más goles de equipo en un partido: 5–4 → 5 |
| `best_win_rate` | Victorias/partidos actuales, mínimo 20: 15/20 → 75% |
| `current_elo` | ELO actual con al menos un Clasificatorio, snapshot aprobado |
| `max_elo` | Máximo ELO reconstruido con al menos un Clasificatorio |

Comparar fracciones exactas (15/20 = 30/40), no el redondeo visible. UUID organiza
empates, no rompe el empate deportivo. Récord de marcador referencia todos los
partidos que lo igualan. Inicial 1200 sin Clasificatorio no crea líder.

Gol más rápido, remontada y duración siguen aplazados: faltan journal/tiempos
explícitos validados. No restar fechas como tiempo jugado ni atribuir goles
individuales. UI de récords/Hall solo en fixture de revisión, fuera de producción.
