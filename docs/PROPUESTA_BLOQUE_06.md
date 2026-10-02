# Propuesta 06 — torneos V1 para decidir

Fecha: **2026-10-02**. Estado: **propuesta documental, sin aprobación ni activación**.
Petición vigente: preparar exclusivamente formato/equipos/cuadro/liguilla/byes,
empates, recuperación, cancelación, premios y elegibilidad XP/ELO.
La aplicación sigue en **v0.5.3** y TORNEO conserva su pantalla provisional.
No código de torneos, esquema/migraciones, partidos, cuentas o premios nuevos.

05 aprobado/activo se conserva: nueve familias, 45 tiers, identidad
cuenta/jugador/familia/tier y XP V2 histórico/recalculable; ocho récords/Hall
privados con empates compartidos y 0 XP por récord. Las tres decisiones de abajo
son propias de 06 y no vuelven a pedir aprobación de 02–05.

## Las tres decisiones solicitadas

| Decisión | Recomendación concreta | Alternativa |
| --- | --- | --- |
| D1 · Formato y reglas operativas | Eliminación directa, 2–16 equipos fijos, torneo 1v1 o 2v2, sorteo único/byes, un partido por cruce, sin tercer puesto. Recuperación y cancelación como se detallan debajo | Liguilla de una vuelta: más partidos; preparar V2 con desempates de clasificación antes de aprobar/implementar |
| D2 · Modos y puntuación de partidos | Elegir Rápido, Caos o Clasificatorio al crear y conservarlo en todos los cruces. XP/logros normales confirmados; ELO aprobado solo si el modo es Clasificatorio | Torneos solo Rápido/Caos: mismo XP/logros, sin ELO; Clasificatorio queda disponible fuera del torneo |
| D3 · Premio de campeonato | Trofeo/título privado para el campeón y sus miembros, **0 XP adicional**, sin nuevas estrellas ni récords/Hall | Añadir familia nueva «Gana torneos»: 1/3/5/10/25 títulos, tiers 25/25/50/75/100 XP. Es otra ampliación pendiente, no parte de los 45 tiers aprobados |

Para aprobar la recomendación completa bastará una respuesta explícita indicando
D1/D2/D3. Elegir «liguilla» pide otra propuesta, no autoriza un formato indefinido.
Un cambio parcial debe registrarse aquí antes de programar la implementación.
Este documento no aprueba ninguna opción por defecto.

## D1 · Equipos y creación

- Torneo privado de la cuenta del operador, con nombre y 2–16 equipos.
- Elegir **1v1 o 2v2 por torneo**. En 1v1 cada equipo es un jugador; en 2v2 una
  pareja fija. No mezclar tamaños ni repetir un jugador en equipos distintos.
  Máximo 16 jugadores en 1v1 o 32 en 2v2.
- Seleccionar jugadores activos de esa cuenta al iniciar. UUID identifica al
  jugador/equipo; alias actual y nombres iguales no crean otra identidad.
- Se puede editar el borrador: participantes, parejas, modo y configuración.
  Iniciar confirma y fija plantilla, cuadro y reglas. No sustituir jugadores,
  rehacer sorteo ni cambiar modalidad/configuración a mitad del torneo.
- Una baja lógica posterior conserva plantilla e historial, sin sustituir al
  integrante. La baja no concede victoria al rival: continuar con esa plantilla,
  esperar o cancelar conforme a la política inferior.
- El torneo V1 propuesto no incluye cruces 1v2. **1v2 sigue admitido fuera del
  torneo únicamente en Rápido/Caos**, con XP completo y sin ELO. Esta limitación
  de tamaños del nuevo torneo está incluida en D1, no modifica el motor vigente.

Crear/iniciar requiere conexión y sesión verificada, para fijar una base común.
Una vez cargado/iniciado, el juego y su recuperación pueden continuar sin red
según el apartado de recuperación. No exigir cuentas personales a los jugadores.

## Cuadro, sorteo y pases libres

Eliminación directa a **un partido por cruce**, sin ida/vuelta, series ni partido
por tercer puesto. El operador confirma el sorteo una vez al iniciar; no depende
de ELO ni empareja automáticamente por categorías. Persistir orden y asignaciones;
recargar/reintentar conserva ese sorteo, no lo vuelve a ejecutar.

Para N equipos: tamaño del cuadro = siguiente potencia de 2; pases libres =
tamaño − N. Distribuirlos en primera ronda, cada uno enfrentado a un equipo real,
sin cruces vacío–vacío. Asignación aleatoria uniforme de los equipos que reciben
pase; disposición del cuadro queda fijada. Un pase libre es avance de cuadro:
**no es partido ni victoria**, no crea MATCH_END, XP, ELO, racha, estrellas o récords.

### Ejemplo: cuatro equipos

| Cruce | Equipos | Ejemplo de ganador |
| --- | --- | --- |
| Semifinal 1 | A contra B | A |
| Semifinal 2 | C contra D | C |
| Final | A contra C | C |

Tres partidos reales, cero pases libres. Campeón C, subcampeón A; B y D comparten
ronda de eliminación en semifinales. No decidir un tercer puesto por goles.

### Ejemplo: cinco equipos

Cuadro de ocho plazas, tres pases libres. Ejemplo de sorteo ya fijado:

| Ronda | Cruce/avance |
| --- | --- |
| Primera | A, B y C reciben pase; D contra E produce ganador X |
| Semifinales | A contra B; C contra X |
| Final | Ganadores de semifinales |

**Cuatro partidos reales**, tres pases libres. A/B/C no reciben nada por el pase.
El campeón será oficial únicamente tras confirmar todos los resultados necesarios.
En general, eliminación directa de N equipos completa **N−1 partidos reales**.

### Comparación con liguilla

Una vuelta enfrenta cada pareja de equipos una vez: N×(N−1)/2 partidos, sin pases
libres. Cuatro equipos necesitan 6 partidos; cinco, 10; ocho, 28; dieciséis, 120.
Es útil si se busca que todos jueguen más, pero añade clasificación y criterios de
empate propios. Queda como alternativa: si se elige, preparar sus puntos,
desempates y campeón/final en una propuesta V2 antes de implementar. No introducir
3/1/0 puntos, duración efectiva, goal average individual o final extra por suposición.

## Reglas de cada partido y empates

La configuración se elige al crear el torneo y se fija para todos los cruces.
Propuesta de valor inicial de la pantalla: **POR GOLES, objetivo 5**, editable antes
de iniciar dentro de los límites vigentes. También se podrán elegir TIME/AMBAS.
No cambiar sus reglas ni versiones/checkpoints históricos.

- GOALS: sin partes, ascendente sin límite; primer equipo al objetivo total.
- TIME: dos partes, resultado acumulado. AMBAS: objetivo por equipo en todo el
  partido, sin reinicio; final por objetivo o total al terminar las dos partes.
- Empate TIME/AMBAS: desempate **del motor existente**, prórroga con gol de oro
  y, si sigue igualado, penaltis. No sorteo, puntos ELO, gol de visitante ni duelo
  adicional para decidir el cruce.
- El servidor solo avanza a partir de un resultado completo y válido con ganador.
  Un empate histórico/sin ganador no se convierte en victoria ni avanza.
- Blanco/Azul y posiciones se fijan antes del inicio de cada partido, manteniendo
  los miembros del equipo; se conservan en copia, recuperación e historial.
  Los goles siempre son del equipo. No asignar goleador ni inferir tiempo jugado.

## Recuperación, confirmación y avance único

Propuesta para la futura implementación, **no contratos ya creados**:

1. Guardar torneo/cuadro confirmados y una copia local por cuenta/proyecto/torneo;
   conservar relación torneo + cruce + UUID estable del partido junto a la copia
   del motor, sin alterar UUID/hash de documentos ni colas históricos.
2. Una sola partida/dispositivo activo como pauta de uso. Una lectura local sirve
   para jugar/recuperar, no demuestra confirmación remota ni concede experiencia.
3. En offline, cada final válido se conserva antes de cualquier envío. Permitir
   continuar el cuadro **provisionalmente** en el mismo dispositivo: siguiente
   cruce conserva dependencias de UUID y ganadores pendientes. Ronda/final muestran
   «PENDIENTE DE CONFIRMAR»; campeón/trofeo oficial solo al confirmar toda la cadena.
4. Al reconectar, enviar en orden de dependencias. Futura transacción bajo RLS:
   validar cuenta/plantilla/configuración/cruce y antecedentes, guardar agregado
   por el mecanismo idempotente existente, vincularlo y avanzar una vez. Un
   resultado no debe guardarse primero como partido libre y luego intentar ligarlo.
5. Un cruce admite un resultado; un resultado pertenece a un solo cruce. Mismo
   UUID/contenido es reintento, no otra victoria. Contenido diferente u otro cruce
   invalida la transacción. Recarga o respuesta tardía no duplica campeón ni avance.
6. Estado/revisión canónicos resuelven dos dispositivos: si otro resultado ocupó
   el cruce, conservar las copias/pendientes dependientes y detener su avance;
   informar del conflicto, sin sobrescribir, borrar ni convertirlos en partidos
   libres para conceder XP. No ofrecer ganador manual ni administración de datos.
7. Recuperar una partida con el mismo motor/checkpoint/UUID, en pausa y excluyendo
   tiempo de cierre, como hoy. Si la copia falta, no inventar goles/resultados;
   volver al estado confirmado y explicitar lo que queda pendiente.

La copia local no es backup ni sincronización con la app cerrada. Mantener la PWA
sin caché de Auth/API; una eventual copia explícita de torneo contiene solo sus
datos necesarios, aislados por cuenta, y se presenta como no verificada sin sesión.
La ausencia de red nunca interrumpe un partido. Sin copia local utilizable no se
promete reconstruir pendientes no enviados desde otro navegador/dispositivo.

## Cancelación, abandono y resultado final

- Descartar un borrador no genera resultados ni títulos.
- Torneo iniciado: cancelar requiere conexión, estado/revisión verificados,
  confirmación concreta y ausencia de partida activa o finales locales pendientes
  en el dispositivo que opera. Sin red: pausar/guardar y cancelar al reconectar.
- Si hay partida activa, recuperarla/terminarla o descartar **solo esa incompleta**
  mediante confirmación antes de cancelar el torneo. No borrar finales/colas.
- La cancelación conserva torneo cancelado y todos los partidos ya confirmados:
  mantienen XP/logros/ELO legítimos. Detiene cruces futuros; no campeón ni trofeo.
  Un paquete tardío que choque con cancelación/estado canónico se conserva local,
  sin avance ni premio por el camino alternativo; no prometer resolverlo borrando.
- No victorias por ausencia, sustituciones, sanciones ni marcadores administrativos
  en V1. Un abandono se trata como pausa/cancelación, nunca partido ganado inventado.
- Finalizado: campeón y subcampeón; los demás se agrupan por ronda de eliminación,
  con empates de puesto/ronda. Sin ordenar eliminados por goles individuales o ELO.
- No editar resultados de torneo finalizado ni deshacer un cruce confirmado.
  Corregir/eliminar datos futuros necesita política aparte; el diseño debe poder
  invalidar/reconstruir dependencias y títulos, sin fingir que esa administración
  existe en 06. El recálculo aprobado de XP/ELO/tiers sigue intacto.

## D2/D3 · Elegibilidad y premios

**Propuesta, no cambio de elegibilidad ya activo:**

| Hecho | XP/logros existentes | ELO existente | Título de torneo |
| --- | --- | --- | --- |
| Rápido/Caos real confirmado | XP completo por jugador según 02, tiers de 05 una vez | No | Solo si toda la final/cadena se confirma |
| Clasificatorio real confirmado, 1v1/2v2 | XP completo y bonus Clasificatorio aprobados; tiers de 05 | Sí, reglas de 03 vigentes, sin multiplicador de torneo | Igual |
| Pase libre | 0; no partido ni victoria | No | No por el pase |
| Final pendiente/provisional/incompleto o prueba | Sin premio confirmado, sin avance oficial | No | No |
| Partido ya confirmado de torneo luego cancelado | Se conserva su XP/tiers legítimos | Se conserva si era Clasificatorio | No campeón del torneo cancelado |

No repetir partidos en historial para añadirlos al torneo ni cambiar `match_type`
a posteriori. Un Clasificatorio del cuadro cuenta **una vez** en la reconstrucción
completa existente, igual que uno libre; modalidad fija evita activar/desactivar
ELO arbitrariamente entre rondas. 04 permanece descriptivo, sin pronósticos.

Recomendación de D3: título/trofeo privado asociado al UUID del torneo finalizado
y sus miembros campeones; **0 XP extra de campeonato**. No agregar secretamente
«Gana torneos», una décima familia o un noveno récord/Hall. Los nueve logros/45
estrellas y sus 2475 XP máximos se conservan sin cambiar identidad.

Ejemplo de XP, jugador sin historial previo: dos Rápidos ganados 3–0, sin
prórroga/tanda. Tras el primero: 150 XP partido + 100 logros = **250**. Tras el
segundo: base acumulada 300 + tiers vigentes 150 = **450**, porque goles alcanza
nivel 2 (6) y racha nivel 1 (2). El título añade **0**; no cobrar de nuevo los cuatro
tiers del primer partido. Una baja/alias distinto no repite esos premios.

La alternativa de D3 necesita aprobación propia: títulos confirmados derivados,
una familia adicional de cinco tiers en 1/3/5/10/25, premios 25/25/50/75/100 (275
máximo). Ambos miembros de una pareja campeona cumplirían el mismo título,
identidad cuenta/jugador/familia/ordinal, sin cobrar por reapertura. Conserva los
45 tiers existentes; no declara que su máximo de XP aprobado haya cambiado.
No importar títulos ficticios de partidos antiguos ni añadir récords/Hall nuevos.

## Plan de verificación tras aprobar e implementar

Lista futura, **no pruebas ejecutadas en esta preparación**:

- Cuadros N=2…16: N−1 partidos, byes correctos, sin vacío–vacío/sorteo nuevo; cinco
  equipos completo, empates TIME/AMBAS reales del motor, final sin doble avance.
- Plantilla fija 1v1/2v2: homónimos/alias/bajas, jugador duplicado/equipo de otra
  cuenta rechazados. 1v2 casual fuera del torneo conservado; RANKED de tres inválido.
- Crear/iniciar/recuperar/cuadro/campeón/cancelar en web adaptable y 800×480;
  no login/cuentas/partidos cerrados repetidos ni confundir fixtures con Preview.
- Offline: cadena provisional semifinal→final, cierre/reapertura, tiempo excluido,
  timeout/reintento/respuesta tardía, conflicto entre dispositivos, copias intactas.
- SQL/RLS solo del proyecto autorizado: guardar/vincular/avanzar atómico,
  propietarios aislados, permisos mínimos, idempotencia y ninguna recompensa por
  pase/prueba/incompleto. Migraciones solo después de aprobar implementación.
- XP/ELO/05 con el mismo resultado una vez; cancelación no borra experiencia real;
  título reconstruible únicamente con cadena completa y ganadores confirmados.

Estado y verificaciones de esta preparación en
[VERIFICACION_BLOQUE_06.md](VERIFICACION_BLOQUE_06.md).
Siguiente conversación: [prompt condicionado](PROMPT_SIGUIENTE_BLOQUE.md).
