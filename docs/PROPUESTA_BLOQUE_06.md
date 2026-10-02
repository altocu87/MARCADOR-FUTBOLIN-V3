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

**Aclaración expresa posterior:** 3v3 significa **tres personas simultáneas por
lado, seis en total**, no tres parejas en cola. Registrar ese formato como requisito
de la propuesta; no volver a preguntar su significado. 4v4 fue mencionado como
formato adicional en la petición anterior; supone ocho participantes y excede el
uso habitual de cuatro/seis, por lo que su prioridad puede acordarse después.

**Decisión expresa de rotación:** al crear se podrá elegir **mezclar ganadores,
perdedores o ambos**. No fijar que siempre se quedan juntos los ganadores.
La elección del selector está decidida; algoritmo de mezcla, reservas/saliente y
casos sin reserva siguen por concretar con ejemplos, sin reabrir esa elección.

3v3 y eventualmente 4v4 amplían motor/participantes/validación servidor y no tienen
reglas XP/ELO aprobadas todavía. La solicitud de formato no activa esos partidos
ni autoriza extrapolar automáticamente media ELO, K o premios por jugador.

05 sigue aprobado/activo: nueve familias/45 tiers, identidad cuenta/jugador/
familia/tier, XP V2 históricos/recálculo y ocho récords/Hall privados con empates
compartidos y 0 XP por récord. No volver a pedir esas aprobaciones.

## Uso propuesto, pendiente de concretar

**Crear pool → formato/personas → parejas fijas o rotación → grupo a mezclar → jugar.**
Pantalla con quienes juegan, quienes esperan y próximo cambio. Al finalizar,
proponer el siguiente partido y confirmarlo con un botón, sin volver a elegir
participantes. Pausar o terminar entre partidos.

Base propuesta: **2v2 para cuatro a seis personas**, **1v1 con cola individual**,
y **3v3 con seis jugadores simultáneos**, solicitado expresamente. 4v4 adicional
mencionado requiere ocho. Los límites 1v1/2v2 de la V2 inicial no deben usarse
para excluir el nuevo requisito; su implementación/puntuación siguen pendientes. Orden inicial elegido por operador y guardado, sin resorteos al recargar.
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

### Cinco personas: ejemplo de la opción «mezclar perdedores»

Ejemplo propuesto, no regla única de toda la pool: ganadores siguen juntos; **sale uno de los dos
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
número de partidos a todos**. El selector ganadores/perdedores/ambos ya está
pedido; este ejemplo ilustra solo perdedores. Limitar permanencia sigue aparte.

Con seis en esta variante sale un perdedor, entra la primera persona de cola y
saliente va detrás de la otra que esperaba. Con cuatro no hay reserva para este
cambio: propuesta inicial parejas fijas; mezclar los cuatro requiere otra regla.

### Uno contra uno

Cola individual: ganador sigue, perdedor al final y entra primero que esperaba.
Con dos se repite. No mezclar tamaños de partido dentro de una sesión.

## Selector de mezcla solicitado y ejemplos pendientes de acordar

El grupo a mezclar se elige antes de iniciar y se guarda con la sesión/copia;
se aplica **entre partidos**, usando el resultado anterior. La rotación no cambia
retroactivamente participantes/resultados/XP/ELO del partido terminado.

Ejemplo ilustrativo con A/B ganadores, C/D perdedores y E esperando:

| Opción solicitada | Ejemplo posible del siguiente partido |
| --- | --- |
| Mezclar perdedores | A/B siguen; sale C, entra E → A/B contra D/E |
| Mezclar ganadores | C/D siguen; sale A, entra E → B/E contra C/D |
| Mezclar ambos | Rehacer ambos equipos y rotar reserva → por ejemplo A/D contra B/E; C espera |

Son ejemplos de comportamiento, **no aprobación de algoritmo/saliente/sorteo**.
Una propuesta concreta debe evitar dejar a alguien siempre esperando, guardar
el cambio elegido una vez y conservarlo al recuperar. Mezclar ambos puede alterar
qué lado ocupa cada jugador; distinguir identidad y posición de cada partido.

**Sin reservas:** con seis personas en 3v3 están todos jugando, no hay quien entre.
Se puede mantener equipos o recomponer ambos (ejemplo ABC/DEF → ABF/DEC).
Reordenar únicamente tres ganadores dentro de su mismo lado no cambia compañeros;
no fingir que eso forma equipos nuevos. Propuesta a revisar: explicar opciones
que requieren reservas y ofrecer mezcla de ambos cuando no las hay. La disponibilidad
exacta por número/formato y el cambio mínimo deben concretarse antes de programar.
No sustituir 3v3 por tres parejas ni descartar la elección ganadores/perdedores.

## Temporadas: petición registrada, aún sin implementación

El propietario pide duración configurable en Ajustes (ejemplos tres/seis meses),
clasificación ELO y otra de puntos, y que torneos clasificatorios afecten al ELO.
Menciona 3 puntos por victoria/1 por derrota como ejemplo por estudiar, **no regla
aprobada**. Propuesta del agente: ELO continuo entre temporadas, puntos por
periodo reiniciados, historial de temporadas, 3/0 inicialmente y duración tres
meses. **Son recomendaciones, no decisiones del propietario**.

No crear/configurar temporadas, puntos, reinicio ELO o premios en esta revisión.
Delimitar su alcance antes de ampliar la implementación exclusiva de 06. La
propuesta es que cada Clasificatorio de pool/torneo cuente una vez como partido,
sin bonus ELO por ser final/campeón, y modalidad casual conserve XP sin ELO ni
puntos clasificatorios. Para 3v3/4v4 falta política expresa de puntuación propia.
No deducir que el usuario aprobó 3/0, tres meses, empates de puntos o premios.

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

## Qué está decidido y qué falta concretar

Decidido como requisito: 3v3 son seis jugadores simultáneos y, al crear, se elige
mezclar ganadores, perdedores o ambos. Preferencia por pool sencilla para grupos
pequeños ya expresada. **No volver a formular las aclaraciones resueltas**, ni
pedir elegir eliminación/liguilla o reaprobar 02–05.

Concretar por pasos algoritmo/cola/saliente y opciones sin reserva, elegibilidad
XP/ELO para formatos nuevos, modo/cierre de sesión y alcance de temporadas/puntos.
Sesión abierta sin campeón/premio extra sigue recomendación, no aprobación.
Estas respuestas no autorizan implementación/activación de pool, temporadas o
premios; continuar exclusivamente la propuesta revisable de 06.

## Verificación futura tras acordar e implementar

Plan, **no pruebas funcionales ejecutadas**:

- Secuencias 4/5/6 personas, cambio ganador/cola, turno único, nadie duplicado,
  compañeros solo entre partidos; selector ganadores/perdedores/ambos, 3v3 real
  solicitado y variantes con/sin reservas; 4v4 si se incluye en alcance.
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
