# Recuperación de partidos en curso — 2026-10-01

Este documento conserva las pruebas del formato original. Decisión posterior del mismo día: nuevos partidos GOALS usan única parte y objetivo por equipo. Copias V1 conservan sus reglas; ver [VERIFICACION_MODALIDADES.md](VERIFICACION_MODALIDADES.md) para versión V2 y comprobaciones vigentes.

## Alcance

Rama `codex/reliability-offline-v1`, entorno local Windows. Función autorizada: recuperar una partida tras recargar o cerrar accidentalmente la aplicación. No cambia las reglas, el diseño del partido, Supabase, Vercel ni el hardware. La prueba autenticada de persistencia sigue pendiente; fase B no cerrada.

## Diseño y decisiones

- `MatchEngine.getCheckpoint()` exporta una copia profunda versionada de estado, journal, contador de goles, tiempo acumulado y bloqueo restante. `restoreCheckpoint(unknown)` valida antes de modificar el motor. No accede al DOM, React ni almacenamiento.
- Un gol que termina parte/partido o penalti decisivo publica el estado ya resuelto, no un estado intermedio que pudiera reabrir el juego al recuperar.
- `ActiveMatchStore` valida versión, cuenta, jugadores, configuración, marcador, journal e IDs. Namespace por proyecto/cuenta. No sobrescribe otro partido, datos dañados o eventos más recientes. Guarda nombres originales de participantes, no credenciales/tokens.
- `useActiveMatch` escribe síncronamente tras acciones aceptadas/transiciones y una vez por segundo de juego. Intenta actualizar también al ocultar/cerrar página; no depende de que ese evento llegue para conservar goles ya aceptados.
- MODO PRUEBA ON: cero escrituras de partidos/checkpoints. La preferencia y gestión de jugadores mantienen su comportamiento existente.
- Al cargar con la misma cuenta se ofrece PARTIDO POR RECUPERAR. PLAYING pasa a PAUSED y añade un evento `pause` con `recovered: true`; requiere CONTINUAR. PAUSED no añade pausas duplicadas. COUNTDOWN reinicia 3 segundos; PERIOD_END y PENALTIES mantienen fase, resultado y turno. MATCH_END conserva exactamente su agregado final para reintentar.
- El tiempo que estuvo cerrada la app no se añade al reloj. El plazo de bloqueo central sí expira con tiempo real; una recarga inmediata no evita los tres segundos de protección.
- El ID del partido y contador de IDs de goles se mantienen, incluso tras anulaciones. El guardado final utiliza el mismo UUID y los reintentos siguen siendo idempotentes.
- Solo se libera la copia activa después de conservar el resultado en la cola final durable o confirmar guardado remoto. Si la cola no puede escribirse, se conserva el checkpoint y se impide abandonar el resumen.
- Ante fallo de almacenamiento, la UI avisa que no se cierre/recargue y el motor sigue funcionando en memoria. No se borra una copia inválida para empezar otro partido real; no se implementa descarte destructivo.

## Pruebas automatizadas

`npm run test:recovery` cubre:

- restauración en pausa con marcador y reloj exactos, gol rechazado en pausa, frontera del bloqueo a 3 segundos;
- tiempo de cierre de 24 horas y espera en pausa excluidos; continuación del reloj;
- conservación del contador y no reutilización de ID de un gol anulado;
- recuperación de pausa sin evento duplicado, countdown, descanso, prórroga y penaltis alternos;
- publicación estable de un gol que cierra la parte;
- equivalencia exacta del agregado final antes/después de recuperar;
- rechazo de puntuación, configuración, journal, ID o bloqueo dañados sin mutación parcial;
- independencia de la instantánea respecto al estado vivo;
- almacenamiento por cuenta/proyecto, no escrituras en modo prueba, no sobrescritura de otra partida o journal antiguo;
- conservación de datos corruptos, fallo de cuota y ausencia de llamadas remotas si falla la cola;
- transferencia durable al finalizar, incluso offline, recarga de cola y reintento con mismo ID sin duplicados.

También se ejecutan los tests existentes del motor y persistencia mediante `npm test`. `npm run build` verifica TypeScript y genera la aplicación Vite. Resultados finales: los tres grupos de pruebas y el build correctos.

## Navegador integrado

La CLI agent-browser no está instalada. Verificación equivalente mediante el navegador integrado y la fixture de desarrollo `/tests/ui-fixture.html`: identidad y repositorios en memoria, namespace local aislado, sin Supabase ni creación de cuentas.

1. Prueba OFF, partido 1v1 con dos goles por periodo. Gol blanco y recarga: pantalla de recuperación 1–0, jugadores originales y 0:02 jugados.
2. Recuperar: PAUSA, 04:58 restantes y controles de gol deshabilitados. CONTINUAR permite jugar. Segundo gol → descanso; recarga/recuperación mantiene 2–0 y FINAL DE LA 1ª PARTE.
3. Segunda parte y recarga en countdown: recuperación reinicia en 3 sin alterar 2–0. Final normal 4–0; fixture `?save=offline` deja resultado pendiente.
4. Recargar: no se ofrece otra copia activa y Ajustes muestra un pendiente. Fixture sin fallo → reintentar → historial con un solo partido 4–0 y los once eventos secuenciales completos, incluida pausa de recuperación. No es prueba de RPC real.
5. Prueba ON → iniciar y recargar: vuelve a Nuevo Partido sin recuperación.
6. Prueba OFF → iniciar, cerrar pestaña y abrir otra: ofrece el partido. Recuperar countdown, forzar penaltis desde panel de simulación, gol blanco, recargar y recuperar: blanco 1/5, azul 0/5, turno azul y blanco deshabilitado. Tanda termina correctamente 3–0 en repositorio simulado.
7. Pantalla de recuperación a 800×480 sin controles cortados. A 390×844 el canvas mide 390×234, centrado verticalmente; documento 390×844 sin scroll general. Captura local ignorada por Git: `tmp/verificacion-recuperacion-800x480.png`.
8. Consola de ambas pestañas sin errores/avisos. Restaurados modo prueba ON y viewport, cerradas solo pestañas creadas para esta prueba; cero pendientes de fixture.

## Límites y pendientes

- Copia del mismo navegador/origen/cuenta, no sincronización de partidas en directo entre móvil/PC ni backup. Este bloque original no incluía arranque offline; ampliado posteriormente por la PWA descrita en `VERIFICACION_PWA.md`, después de una primera carga completa con conexión.
- El almacenamiento puede estar bloqueado o borrarse; entonces no se garantiza recuperación. La precisión de reloj es un segundo; un cierre abrupto puede perder la fracción no registrada. Goles se escriben en la notificación síncrona de su acción, si el almacenamiento funciona.
- Una única pestaña activa. Se rechazan journals antiguos/divergentes, pero no hay bloqueo distribuido ni coordinación de juego simultáneo entre pestañas.
- No se han aplicado migraciones ni cambiado servicios externos. Falta recorrido Auth/partido/historial contra Supabase real con cuenta introducida por el propietario, y posteriormente revisión/promoción a main.
- No se activan XP, ELO, logros, estadísticas, ESP32 ni infraestructura de pago.
