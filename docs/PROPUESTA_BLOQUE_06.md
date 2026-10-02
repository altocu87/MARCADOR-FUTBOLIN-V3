# Propuesta 06 V2 — pool sencilla para grupos pequeños

Fecha: **2026-10-02**. Estado: **pool/temporadas/3v3 aprobados; creador avanzado solicitado; sin activación**.
Aplicación **v0.5.3**; TORNEO conserva su pantalla provisional. Sin código,
esquema, migraciones, cuentas, partidos ni premios nuevos.

## Conformidad del propietario y alcance, 2026-10-02

Respuesta: «estoy de acuerdo con lo que has propuesto tú». Se registra conformidad
con el diseño expuesto: pool sencilla, selector ganadores/perdedores/ambos y sus
ejemplos, sesión abierta sin título/premio adicional; temporadas configurables,
ELO continuo y puntos por temporada (recomendación inicial **tres meses, 3 por
victoria y 0 por derrota**). Todos los Clasificatorios reales, incluidos los de
pool/torneo, contarían una vez; casual sin ELO/puntos de temporada. Conservar
historial de temporadas y fijar reglas antes de iniciar, cambios para la siguiente;
posiciones compartidas si empatan puntos. No volver a pedir estas decisiones.

El requisito 3v3 ya está claro. **Aprobación posterior explícita:** «Apruebo XP
completo y ELO 3v3 como propones», respondiendo a la propuesta completa con
puntos 3/0. Suple la única ampliación de puntuación antes pendiente; no activa
automáticamente implementación, servicios o premios. La petición vigente sigue siendo propuesta revisable 06.
4v4 fue mencionado, pero su prioridad y elegibilidad no se añaden por defecto.

Algoritmo propuesto para cerrar mezcla/cola sin más formularios: cola inicial
persistida; con reservas, entra primero de cola y sale del grupo elegido quien
lleva más rondas consecutivas, empate por orden inicial. Un relevo por partido.
Para «ambos», elegir saliente entre todos y recomponer los equipos, evitando
repetir las dos composiciones anteriores; sorteo guardado una vez y visible antes
de iniciar. Sin reservas, mantener equipos o mezclar ambos; opciones que requieren
entrada desde cola se explican como no disponibles. No cambiarlo durante partido.
Esto concreta técnicamente el diseño; el algoritmo no estaba en el último resumen
aceptado y sigue como propuesta revisable, sin presentarlo como aprobación literal.

## Generador avanzado y tipos reutilizables — nueva petición

El propietario solicita **además de los predefinidos** un generador avanzado en
TORNEOS o AJUSTES para crear un tipo a medida con todas las opciones disponibles,
guardarlo y elegirlo después. Formulario intuitivo/ameno, individual/parejas/mixto.
Esto añade un requisito de 06; no sustituye pools rápidas ni las reglas aprobadas.
No exigir aprobación del creador otra vez; implementación todavía no iniciada.

### Acceso y uso propuestos

**TORNEOS → NUEVO → Predefinidos / Mis tipos / Crear tipo.**
**AJUSTES → TIPOS DE TORNEO** para gestionar los propios. Ambos accesos usan las
mismas definiciones, sin dos configuradores independientes. Se puede empezar desde
cero o duplicar un predefinido/propio. Nombre elegido por operador, descripción
opcional; ejemplo «Viernes · cinco personas · rotan perdedores · a 5 goles».

Guardar un **tipo** guarda sus reglas, no inicia un torneo ni concede premios.
Elegirlo después crea una **sesión/torneo nuevo**, con participantes y resultados
propios. Se seleccionan personas al iniciar; no exigir que la misma gente juegue
cada vez ni usar alias como identidad. El tipo queda privado para la cuenta.

### Formulario por cinco pasos, propuesta revisable

| Paso | Opciones o información |
| --- | --- |
| 1 · Base | Nombre; partir de predefinido o propio; estructura de torneo y explicación breve |
| 2 · Personas y equipos | Individual, parejas o grupos de tres; cantidad prevista, equipos fijos o compañeros variables; mixto según significado pendiente |
| 3 · Dinámica | Pool/cola, quién sigue/espera, mezclar ganadores/perdedores/ambos; orden inicial/rotación y condiciones con/sin reservas compatibles |
| 4 · Partidos y cierre | Rápido/Caos/Clasificatorio; GOALS/TIME/AMBAS y límites vigentes; cierre abierto aprobado. Duración/rondas/campeón de otros formatos solo al concretar sus reglas |
| 5 · Resumen y guardar | Resumen legible, ejemplo del siguiente turno, avisos de incompatibilidad junto al campo, guardar tipo o guardar y usar |

Mostrar únicamente controles pertinentes: escoger GOALS muestra objetivo; TIME
muestra partes/tiempo vigentes; la rotación muestra su grupo/cola; equipos fijos
no despliegan campos de mezcla. Volver entre pasos conserva borrador. Textos
cortos, ejemplos y vista de equipos/espera; no un formulario enorme de una página.
Referencia física 800×480 y adaptable, controles táctiles y teclado accesibles.
Resumen ejemplo: «2v2 · cinco personas · cambia un perdedor · Rápido · primero a
5 goles · terminar cuando quieras · XP habitual, sin ELO». Ejemplo 3v3: «seis
personas · Clasificatorio · mezclar ambos · XP completo · ELO aprobado · 3/0».
Son ejemplos documentales; no screenshots/fixtures ni UI implementada.

### Qué significa «todas las opciones disponibles»

Combinar opciones soportadas y compatibles, sin desbloquear reglas de motor,
XP/ELO o premios mediante valores arbitrarios. Validación en UI y servidor, no
solo ocultar campos. ELO/puntos derivados del modo/formato aprobado; XP, K, curva,
RLS y 05 no se convierten en campos libres. Mostrar efecto en resumen. Parámetros
de temporada van a Ajustes y quedan fijos por temporada; plantilla no los sobreescribe.

| Estructura | Situación de reglas en esta propuesta |
| --- | --- |
| Pool con equipos fijos | Diseño aceptado, sin implementar; tipos guardables al entregar 06 |
| Pool con mezcla configurable | Selector aceptado; algoritmo concreto revisable, mismo creador |
| Liguilla / eliminación directa | Posibles estructuras del generador a diseñar si se incluyen: calendario, puntos/desempates, byes, cierre/campeón. La V1 antigua no se reactiva como aprobación |
| Mixto | Solicitud registrada; aclarar combinación de partidos individuales/parejas frente a mezcla de jugadores sueltos/parejas iniciales |
| 4v4 / tamaños desiguales nuevos | Petición 4v4 previa registrada, sin puntuación/prioridad cerrada. No extrapolar 3v3 ni crear otros formatos por formulario |

No prometer un generador de cualquier regla imaginable. Tampoco presentar una
plantilla como eliminación/liguilla si solo ejecuta una pool. Campos/estructuras
nuevos requieren una definición concreta antes de ejecutarlos; predefinidos y
personalizados usan las mismas reglas validadas y el mismo motor, no caminos aparte.
1v2 vigente continúa solo Rápido/Caos, sin ELO; incluirlo en una dinámica de torneo
requiere diseñarla, no mezclarlo en plantilla por defecto. Prueba no persiste torneo.
No títulos/estrellas/XP extra de plantilla o campeonato, ni noveno Hall por guardarla.

### Guardado y cambios, diseño técnico futuro

- Tipo propio con UUID, cuenta propietaria y versión de definición/configuración;
  no identificador por nombre. Nombres iguales o cambios de nombre no cambian dueño.
- Editar/duplicar/archivar tipos propios. Archivo evita uso en sesiones nuevas,
  conserva referencias históricas; no UI de administración o borrado de resultados.
- Cada torneo/sesión conserva **copia de reglas y versión** al iniciar. Editar
  un tipo crea otra revisión para usos nuevos: no altera cola, partidos o premios
  de sesiones en curso/finalizadas ni reconstrucción XP/ELO de sus participantes.
- Guardar/reintentar/usar tiene identidad estable; no duplicar tipo o sesión por
  timeout/doble toque. Propios bajo RLS de cuenta; predefinidos sin datos personales.
- Borrador local y copia privada por cuenta/proyecto, sin caché Auth/API; creación/
  confirmación online según diseño de 06. Offline recupera sesión ya cargada con
  las reglas copiadas; no prometer plantilla remota verificada sin sesión/conexión.

### Verificación adicional futura

Crear desde cero/duplicar, guardar/reabrir/elegir, editar nueva revisión y archivar;
misma definición al iniciar, sesiones previas intactas. Validar opciones incompatibles,
formato/mode/participantes, aislamiento de cuentas y UUID ante reintentos. Recuperar
misma versión offline, teclado/táctil y 800×480. Ejemplos/fixtures no son Preview
Supabase autenticada; no repetir checklist cerrado o fabricar torneos históricos.

## Ampliación de puntuación 3v3 aprobada expresamente

**Regla nueva aprobada, aún sin implementación:** admitir 3v3 en Rápido/Caos/Clasificatorio con
participación real de tres por lado; cada jugador recibe XP completo del partido
y tiers existentes que cumpla, por la misma identidad y desde historial confirmado.
No dividir XP entre tres ni crear familias/estrellas adicionales. En Clasificatorio
cada ganador recibe 3 puntos de temporada, perdedor 0; nadie recibe nada por esperar.

ELO 3v3 aprobado: media aritmética de los **tres ELO previos** de cada lado para
calcular expectativa; cada participante aplica su propio K vigente (primeras diez
K40, después K20), ajuste entero al más próximo con mitades alejadas de cero.
Mismo inicio 1200, categorías/histéresis y multiplicador de goles 1. El ajuste no
se divide entre tres, no se aplica al campeón otra vez ni cambia partidos 1v1/2v2.
Rápido/Caos 3v3 sin ELO ni puntos clasificatorios. No asumir suma cero con K distintos.

Ejemplo propuesto: seis jugadores 1200, todos K40; partido Clasificatorio 3v3
confirmado. Cada ganador **+20 ELO**, cada perdedor **−20 ELO**. XP base por jugador
sin prórroga/tanda: ganador **200**, perdedor **75**, más tiers 05 pertinentes una
sola vez. Puntos de temporada **3/0** por participante. Son cálculos ilustrativos,
no ejecución de motor/SQL 3v3 ni concesión real.

La autorización expresa ya está recibida para esta ampliación. Preservar reglas
y datos previos 1v1/2v2/1v2, RLS, motor, partidas antiguas, XP base/curva y 04.
La aprobación no habilita seis participantes en SQL hasta implementar y verificar;
no construir partidos 3v3 ficticios a partir de históricos de otros formatos.

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

3v3 amplía participantes/validación servidor, con XP/ELO aprobado en la sección
anterior. No activarlo hasta implementar/verificar. 4v4 sigue como petición adicional,
sin prioridad/elegibilidad cerrada; no extrapolar automáticamente su puntuación.

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
para excluir el nuevo requisito; implementación pendiente y puntuación 3v3 ya aprobada. Orden inicial elegido
por operador y guardado, sin resorteos al recargar.
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

## Selector y ejemplos aceptados; algoritmo concreto revisable

El grupo a mezclar se elige antes de iniciar y se guarda con la sesión/copia;
se aplica **entre partidos**, usando el resultado anterior. La rotación no cambia
retroactivamente participantes/resultados/XP/ELO del partido terminado.

Ejemplo ilustrativo con A/B ganadores, C/D perdedores y E esperando:

| Opción solicitada | Ejemplo posible del siguiente partido |
| --- | --- |
| Mezclar perdedores | A/B siguen; sale C, entra E → A/B contra D/E |
| Mezclar ganadores | C/D siguen; sale A, entra E → B/E contra C/D |
| Mezclar ambos | Rehacer ambos equipos y rotar reserva → por ejemplo A/D contra B/E; C espera |

Ejemplos aceptados por conformidad posterior; algoritmo concreto de saliente/sorteo
propuesto arriba, sin atribuirle aprobación literal anterior.
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
Menciona 3 puntos por victoria/1 por derrota como ejemplo anterior, sustituido
por la recomendación 3/0 aceptada. Propuesta del agente: ELO continuo entre temporadas, puntos por
periodo reiniciados, historial de temporadas, 3/0 inicialmente y duración tres
meses. **Recomendaciones aceptadas por la conformidad posterior registrada arriba**.

No crear/configurar temporadas, puntos, reinicio ELO o premios en esta revisión.
Delimitar su alcance antes de ampliar la implementación exclusiva de 06. La
propuesta es que cada Clasificatorio de pool/torneo cuente una vez como partido,
sin bonus ELO por ser final/campeón, y modalidad casual conserve XP sin ELO ni
puntos clasificatorios. Para 3v3 usar la ampliación aprobada arriba; 4v4 sigue sin política cerrada.
Conformidad con 3/0, tres meses y ELO continuo registrada arriba; sin premios adicionales.

## Partido, modos y puntuación

Valor inicial propuesto **Rápido, POR GOLES, objetivo 5**, editable antes de iniciar.
Mantener GOALS/TIME/AMBAS y desempates del motor: TIME/AMBAS con prórroga/gol de
oro y penaltis. Solo partido completo válido con ganador decide siguiente turno;
empate histórico/incompleto no produce salida por sorteo. Goles por equipo,
sin goleadores individuales ni tiempos inventados. Posiciones/colores de cada
partido se eligen antes de iniciarlo y se conservan al recuperar.

Diseño aceptado: elegir Rápido/Caos/Clasificatorio y fijarlo durante sesión.
Puntuación vigente conservada y ampliación 3v3 aprobada, aún sin implementar:

| Hecho | XP/logros existentes | ELO existente |
| --- | --- | --- |
| Rápido/Caos confirmado, formato aprobado | XP completo por jugador; tiers 05 una vez | No |
| Clasificatorio confirmado, 1v1/2v2 | XP/bonus aprobados; tiers 05 una vez | Sí, mismas reglas 03; sin multiplicador de pool |
| 3v3 tras futura implementación/verificación | XP completo/tiers aprobado | Solo Clasificatorio, media de tres y K propio según ampliación aprobada |
| Esperar, entrar, salir o cambiar compañero | No partido/victoria: 0 XP | No |
| Prueba, pendiente o incompleto | Sin concesión confirmada | No |

Resultado 2v2 pertenece a los **cuatro jugadores de ese partido**. Cambiar pareja
no reatribuye goles, XP, ELO o racha anteriores. Marcador general conserva 1v1/2v2
en todos los modos, 1v2 solo Rápido/Caos con XP completo y sin ELO; no usar 1v2
para resolver cinco personas en esta pool. 04 sigue descriptivo.

## Terminar, cancelación y premios

Diseño aceptado: **sesión abierta hasta pulsar TERMINAR entre partidos**,
sin campeón, tabla de liga, trofeo o XP extra de sesión. Resumen de partidos y
resultados confirmados. Quedarse en mesa al final no convierte a nadie en campeón.

Conformidad registrada con **0 XP adicional por sesión**, sin activar premio nuevo.
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

Conformidad posterior con diseño expuesto y temporadas tres meses/3–0/ELO
continuo registrada arriba. No pedir repetir decisiones aprobadas. Revisar el
algoritmo concreto de mezcla; la ampliación XP/ELO 3v3 ya está aprobada.
Sin implementación/activación por esta entrega documental, ni iniciar 07.

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
