# Propuesta 06 V2 — pool sencilla para grupos pequeños

Fecha: **2026-10-02**. Estado: **propuesta revisada, sin activación**.
Aplicación **v0.5.3**; TORNEO conserva su pantalla provisional. Sin código,
esquema, migraciones, cuentas, partidos ni premios nuevos.

## Orientación expresada por el propietario

Normalmente juegan **cuatro a seis personas**, preferentemente por parejas.
Los torneos no son vitales: interesa una pool/ronda de pista sencilla, donde
quien pierde sale y entra quien espera; también cambiar compañeros para cinco
personas. Se puede contemplar 1v1. Evitar gestionar un campeonato elaborado.

Esto **sustituye la recomendación V1 de eliminación directa, 2–16 equipos**.
Cuadro, liguilla, sorteo de cruces y byes dejan de ser el alcance inicial propuesto.
La V1 queda en Git como antecedente, no como opción vigente a implementar.

La mención **3v3/4v4** requiere aclaración: ¿tres/cuatro parejas que se turnan o
personas simultáneas en cada equipo? La segunda lectura ampliaría participantes,
motor, validación servidor y reglas XP/ELO más allá de los formatos aprobados.
**No está aprobada ni se descarta la petición**: aclararla antes de fijar alcance;
no habilitar seis/ocho jugadores por partido o puntuarlos por analogía con 2v2.

05 sigue aprobado/activo: nueve familias/45 tiers, identidad cuenta/jugador/
familia/tier, XP V2 históricos/recálculo y ocho récords/Hall privados con empates
compartidos y 0 XP por récord. No volver a pedir esas aprobaciones.

## Uso propuesto, pendiente de concretar

**Crear pool → seleccionar personas → parejas fijas o rotación → jugar.**
Pantalla con quienes juegan, quienes esperan y próximo cambio. Al finalizar,
proponer el siguiente partido y confirmarlo con un botón, sin volver a elegir
participantes. Pausar o terminar entre partidos.

Recomendación inicial: **2v2 para cuatro a seis personas** y **1v1 para dos a seis**
con cola individual. Son límites propuestos de esta entrega, no del marcador
general. Orden inicial elegido por operador y guardado, sin resorteos al recargar.
Jugadores activos de la cuenta, UUID estable; no requieren cuentas personales.
Lista de personas fija durante sesión; compañeros cambian solo entre partidos
según variante. Altas/salidas de sesión a mitad quedan fuera de esta propuesta:
pausar o terminar y crear otra, sin modificar resultados previos.

### Seis personas: tres parejas fijas

Parejas A/B, C/D y E/F. Dos juegan, la tercera espera.

| Paso | Juegan | Esperan | Resultado de ejemplo |
| --- | --- | --- | --- |
| 1 | A/B contra C/D | E/F | Gana A/B |
| 2 | A/B contra E/F | C/D | Gana E/F |
| 3 | E/F contra C/D | A/B | Pendiente de jugar |

Ganadora sigue; perdedora pasa al final de cola y entra la primera que esperaba.
**Salir de mesa no elimina de sesión**: volverán cuando les toque. Sin semifinal,
final o pase libre premiado. Con cuatro personas se repite entre las dos parejas;
nadie espera. Cinco no forman parejas fijas completas: ofrecer rotación siguiente,
sin excluir a la quinta ni convertir la espera en partido 1v2.

### Cinco personas: cambia uno de los perdedores

Propuesta pendiente de confirmar: ganadores siguen juntos; **sale uno de los dos
perdedores y entra quien esperaba**, con el perdedor que se queda. Para evitar
sacar siempre al mismo, proponer al que lleva más partidos consecutivos en mesa;
empate por orden inicial guardado. Se cuentan rondas, nunca minutos inferidos.

| Paso | Juegan | Espera | Resultado y cambio de ejemplo |
| --- | --- | --- | --- |
| 1 | A/B contra C/D | E | Gana A/B; sale C, entra E |
| 2 | A/B contra D/E | C | Gana A/B; sale D, entra C |
| 3 | A/B contra E/C | D | Pendiente de jugar |

Si en paso 2 ganara D/E, seguirían juntos y saldría uno de A/B. Cambio posterior
no altera identidad/resultado anterior. Mantener ganadores **no garantiza igual
número de partidos a todos**; mezclar ganadores o limitar permanencia requiere
otra elección, no añadirla silenciosamente.

Con seis en esta variante sale un perdedor, entra la primera persona de cola y
saliente va detrás de la otra que esperaba. Con cuatro no hay reserva para este
cambio: propuesta inicial parejas fijas; mezclar los cuatro requiere otra regla.

### Uno contra uno

Cola individual: ganador sigue, perdedor al final y entra primero que esperaba.
Con dos se repite. No mezclar tamaños de partido dentro de una sesión.

## Partido, modos y puntuación

Valor inicial propuesto **Rápido, POR GOLES, objetivo 5**, editable antes de iniciar.
Mantener GOALS/TIME/AMBAS y desempates del motor: TIME/AMBAS con prórroga/gol de
oro y penaltis. Solo partido completo válido con ganador decide siguiente turno;
empate histórico/incompleto no produce salida por sorteo. Goles por equipo,
sin goleadores individuales ni tiempos inventados. Posiciones/colores de cada
partido se eligen antes de iniciarlo y se conservan al recuperar.

Se propone elegir Rápido/Caos/Clasificatorio y fijarlo durante sesión. Alternativa
solo casual sigue abierta; **elegibilidad de sesión pendiente propia de 06**,
sin volver a aprobar fórmulas existentes:

| Hecho | XP/logros existentes | ELO existente |
| --- | --- | --- |
| Rápido/Caos confirmado, formato aprobado | XP completo por jugador; tiers 05 una vez | No |
| Clasificatorio confirmado, 1v1/2v2 | XP/bonus aprobados; tiers 05 una vez | Sí, mismas reglas 03; sin multiplicador de pool |
| Esperar, entrar, salir o cambiar compañero | No partido/victoria: 0 XP | No |
| Prueba, pendiente o incompleto | Sin concesión confirmada | No |

Resultado 2v2 pertenece a los **cuatro jugadores de ese partido**. Cambiar pareja
no reatribuye goles, XP, ELO o racha anteriores. Marcador general conserva 1v1/2v2
en todos los modos, 1v2 solo Rápido/Caos con XP completo y sin ELO; no usar 1v2
para resolver cinco personas en esta pool. 04 sigue descriptivo.

## Terminar, cancelación y premios

Recomendación simple: **sesión abierta hasta pulsar TERMINAR entre partidos**,
sin campeón, tabla de liga, trofeo o XP extra de sesión. Resumen de partidos y
resultados confirmados. Quedarse en mesa al final no convierte a nadie en campeón.

Es **propuesta pendiente**, no aprobación de 0 XP ni renuncia definitiva a premios.
Si se quiere ganador/premio, concretar cierre y criterio, especialmente al rotar
parejas. «Gana torneos» V1 (1/3/5/10/25; XP 25/25/50/75/100) queda aparcado:
no convertir pool en título ni activar décima familia, estrellas o noveno récord.
Los partidos completos confirmados mantienen su XP/logros/ELO legítimos.

- Borrador descartado: sin resultados. Pausa conserva cola/copia; ausencia no gana.
- Terminar/cancelar: sin activa o finales locales conocidos por resolver. Si hay
  activa, terminarla o descartar solo la incompleta con confirmación vigente.
- No borrar historial/colas ni inventar victorias por abandono al terminar sesión.
- Cierre oficial requiere conexión y revisión verificadas. Sin red, guardar
  solicitud de terminar, dejar de programar y confirmar antes sus resultados.
- Cancelación canónica de otro dispositivo puede entrar en conflicto: conservar
  paquetes pendientes y detener avance, sin cobros por una vía alternativa.
- Edición/corrección administrativa sigue fuera de 06; conservar diseño
  reconstruible, XP/ELO/tiers desde hechos vigentes y no fingir UI de administración.

## Recuperación y confirmación: diseño futuro

Sin contratos SQL ni implementación nueva en esta revisión:

1. Copia por cuenta/proyecto/sesión: orden inicial, variante, cola, ronda,
   participantes, contadores de turnos y relación ronda/UUID junto a checkpoint.
   No alterar hashes/documentos/colas históricos. Crear/iniciar con sesión online
   verificada; jugar/recuperar después nunca se bloquea por perder Internet.
2. Guardar final antes de enviar. Offline proponer siguiente turno en mismo
   dispositivo con dependencias explícitas; turnos/resultados provisionales,
   sin conceder XP/ELO confirmado desde cola local.
3. Reconectar en orden. Bajo RLS validar cuenta/revisión/cola/participantes reales;
   guardar, vincular y rotar **atómicamente una vez** usando idempotencia vigente.
   No guardar primero como partido libre para ligarlo después.
4. Una ronda admite un resultado y un UUID una ronda. Reintento exacto devuelve
   lo mismo; payload/participantes/revisión diferentes generan conflicto, sin
   sobrescribir o convertir en libre para premiar. No duplicar entrada/salida.
5. Recuperar mismo UUID/checkpoint pausado, excluyendo tiempo cerrado. Recarga
   conserva cola/saliente. Una pestaña/dispositivo activo como pauta; conflicto
   canónico bloquea rama local y conserva copias/dependencias, sin mezcla automática.
6. Auth/API fuera de caché PWA; copia privada explícita mínima, referencia local
   sin sesión verificada. No prometer backup o pendientes no enviados desde otro
   navegador; si falta copia, no inventar goles/resultados.

## Qué falta decidir

Prioridad de pool sencilla para cuatro/seis personas y preferencia por parejas
ya expresadas. **No volver a pedir escoger eliminación o liguilla**. Aclarar ahora:

- Significado de 3v3/4v4: parejas en cola o jugadores simultáneos por equipo.
- En cinco personas: ganadora sigue junta y cambia un perdedor, o mezclar también
  ganadores. Regla automática de saliente propuesta, aún no aprobada.

Después cerrar solo cola/rotación, modo y cómputo normal de partidos, y cierre
abierto sin campeón/premio extra o alternativa expresa. No forzar un formulario
completo de campeonato ni pedir aprobaciones 02–05. Esta explicación del uso
no aprueba todas las reglas ni autoriza activación de torneos/premios.

## Verificación futura tras acordar e implementar

Plan, **no pruebas funcionales ejecutadas**:

- Secuencias 4/5/6 personas, cambio ganador/cola, turno único, nadie duplicado,
  compañeros solo entre partidos; 1v1 si acordado, formatos mayores si aprobados.
- Alias/homónimos/bajas/cuenta ajena, UUID estable/participantes por ronda; reglas
  y desempates motor, sin premiar espera o paso de turno.
- Crear/jugar/pausar/recuperar/terminar con pocos pasos, adaptable y 800×480;
  no repetir cuentas/partidos del checklist 01.
- Offline/recarga de cinco: mismo compañero/saliente/cola, timeout/reintentos,
  respuesta tardía/conflictos, pendientes conservados/cierre ordenado.
- SQL/RLS del proyecto autorizado: aislamiento, guardar/vincular/rotar atómico,
  idempotencia, XP/ELO/tiers una vez desde historial confirmado completo.
- Distinguir fixtures de Preview autenticada y de datos reales.

Evidencia de revisión: [VERIFICACION_BLOQUE_06.md](VERIFICACION_BLOQUE_06.md).
Continuación: [prompt vigente](PROMPT_SIGUIENTE_BLOQUE.md). No iniciar 07.
