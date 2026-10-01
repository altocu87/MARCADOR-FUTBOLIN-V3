# MARCADOR FUTBOLÍN V3

Simulador táctil del marcador físico de futbolín. React + Vite + TypeScript + CSS, con motor independiente y persistencia privada en Supabase.

## Contexto y estado de la fase

Antes de modificar código, leer `AGENTS.md`, `docs/CONTEXTO_MAESTRO.md` y `docs/ESTADO_ACTUAL.md`. Mantenerlos actualizados después de cada bloque.

Persistencia V1 está en revisión en `codex/reliability-offline-v1`: tests locales y simulaciones correctos, pero falta el recorrido autenticado navegador → Supabase con la cuenta del operador. No considerar esta fase cerrada ni promoverla a main hasta completar esa validación. Las migraciones del proyecto existente ya están aplicadas; no repetirlas.

## Instalación

Node.js 22.12 o superior (validado con Node 24), npm y un proyecto Supabase existente.

```bash
npm ci
npm run dev
```

Copia `.env.example` a `.env.local` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. También se admite la clave pública legacy `VITE_SUPABASE_ANON_KEY`. Reinicia Vite al cambiar variables. Nunca uses `service_role` ni claves `sb_secret_` en el navegador: se rechazan.

Las variables VITE son públicas y se incluyen en el build. La seguridad depende de Auth, RLS y permisos, no de ocultar una clave pública. Los archivos .env reales, dependencias, dist y credenciales están ignorados por Git.

## Pruebas y build

```bash
npm run test:engine
npm run test:persistence
npm test
npm run build
npm run preview
```

El build comprueba TypeScript y genera `dist/`. Las pruebas SQL reproducibles están en `supabase/tests/persistence_v1.sql`: ejecutar completas como administrador, con su ROLLBACK final. Usan fixtures temporales y no dejan cuentas ni partidos.

La página `/tests/ui-fixture.html`, disponible solo en desarrollo, inyecta repositorios en memoria para verificar formularios, partido e historial sin usar credenciales ni modificar Supabase. No valida la conexión real ni forma parte del build de producción.

Para reproducir fallos de guardado en esa fixture: `?save=offline` simula un rechazo de red y `?save=hang` una petición que nunca responde. Con MODO PRUEBA OFF, completar un partido y comprobar el aviso de pendiente. Recargar conserva la cola; abrir la fixture sin esos parámetros y reintentar en AJUSTES simula la recuperación. Son datos de prueba locales, no registros de Supabase. Restaurar MODO PRUEBA ON después de verificar.

## Primera puesta en marcha

1. En Supabase, aplicar las migraciones de `supabase/migrations/` en orden si se utiliza otro proyecto. Ya están aplicadas en el proyecto unemjyfhzljcdjcbiiwh.
2. Abrir AJUSTES → GENERAL. Crear una cuenta de operador con correo y contraseña, confirmar el correo si Supabase lo requiere e iniciar sesión. Los jugadores no necesitan cuentas.
3. Abrir JUGADORES para crear nombres y alias, editarlos o activarlos/desactivarlos.
4. Desactivar MODO PRUEBA para guardar partidos reales.
5. NUEVO PARTIDO → modo → configuración → elegir exactamente 2 o 4 jugadores activos. El orden de selección indica BLANCO 1, AZUL 1, BLANCO 2 y AZUL 2.
6. Jugar, completar todas las partes y consultar el resultado. RANKING contiene el HISTORIAL V1, no cálculos de clasificación.

No es la contraseña de la cuenta del panel Supabase: es un acceso propio al marcador. Si el correo de confirmación redirige a una URL no disponible, regresar al marcador e intentar iniciar sesión después de confirmar. Para un dominio definitivo, configurar Site URL y URLs de redirección en Supabase Auth; no desactivar la confirmación ni RLS.

## Lienzo 800×480

El espacio lógico es siempre 800×480, sin aspect-ratio. Se centra a tamaño real en ventanas mayores y se escala completo en menores. No hay scroll general: listas y cronologías se desplazan dentro de su panel. Funciona con pantalla táctil y ratón.

## Arquitectura

- `src/match-engine/`: estado, reglas, reloj y cronología; sin React, DOM ni Supabase.
- `src/inputs/`: contrato de entradas y adaptador táctil/ratón.
- `src/app/`: navegación, sesión, caché de jugadores y coordinación del guardado final.
- `src/ui/`: pantallas y presentación.
- `src/services/persistence/`: modelos, contratos PlayerRepository/MatchRepository, mapeo y cola offline.
- `src/services/supabase/`: cliente oficial, adaptadores Auth/repositorios y tipos generados de la base.
- `supabase/migrations/`: esquema, RLS, RPC transaccional e integridad.
- `tests/`: pruebas del motor, persistencia y fixture visual aislada.

### Motor

Gestiona cuenta atrás, goles por equipo, pausa, bloqueo de tres segundos, correcciones, deshacer, partes, prórroga de 60 segundos con gol de oro y penaltis. En GOALS el tiempo no finaliza una parte. Se mantiene el criterio existente: goalLimit cuenta los goles totales de la parte, no el objetivo individual de un equipo. TIME usa el reloj y BOTH la primera condición.

Cada acción aceptada genera un evento secuencial con periodo, tiempo acumulado de juego, marcador y fecha. Pausas y cuentas atrás no suman tiempo de juego. Deshacer conserva la cronología y no retrocede el reloj; los goles anulados quedan referenciados por ID. No se identifica al jugador goleador. Los penaltis alternan blanco/azul y resuelven la tanda reglamentaria o muerte súbita. El resumen y la persistencia usan el ganador de penaltis cuando corresponde.

El bloqueo de goles de tres segundos conserva el plazo del último gol aceptado incluso al deshacer, corregir, pausar/continuar o cambiar de parte/prórroga y saltar la cuenta atrás. Una partida nueva empieza sin heredar el bloqueo de la anterior.

Al deshacer desde el fin de una parte o un gol de oro, el reloj continúa desde el tiempo jugado sin incorporar la espera en la pantalla de final.

### Guardado y seguridad

Cuatro tablas: players, matches, match_participants y match_events. Cada fila pertenece a la cuenta autenticada del operador. RLS está activa; anónimos no pueden leer ni escribir. Players permite crear/editar datos básicos; XP/ELO y valores reservados no son modificables por el cliente. No existe cálculo de progresión.

Al finalizar, App transforma una instantánea del motor y participantes. La operación save_match_v1 guarda el agregado en una sola transacción, aplica RLS como SECURITY INVOKER y valida la cuenta de inicio. UUID estable y hash de contenido hacen idempotentes los reintentos. Triggers diferidos también impiden insertar partidos incompletos por fuera de la RPC.

Un jugador con historial no puede eliminarse; se desactiva. La interfaz también bloquea la eliminación de participantes de un partido en curso o de resultados pendientes en este dispositivo. Sus nombres en los partidos se conservan como snapshots aunque se edite el jugador. Si se trabaja desde varios dispositivos, desactivar es la opción segura: otro dispositivo puede tener un partido aún no sincronizado.

### Modo prueba y offline

MODO PRUEBA está ON por defecto, se recuerda localmente y se fija al empezar cada partido. No guarda partidos, participantes ni eventos, ni los escribe en la cola local. Sin jugadores reales hay dos plazas de práctica únicamente en este modo. La gestión de jugadores sigue siendo real si se inicia sesión.

No se envían goles a la nube durante el juego. La lista de jugadores se conserva por proyecto/cuenta para empezar partidos sin red tras un primer acceso. La app debe estar ya cargada; no es todavía una PWA con arranque offline ni guarda partidos en curso tras cerrar/recargar.

Con prueba OFF, el resultado se escribe primero en localStorage y después se envía a Supabase. Si falla, queda pendiente en ese navegador/dispositivo; AJUSTES permite reintentar. No se sincroniza una cola desde otra cuenta. No borres los datos del navegador mientras haya pendientes. Si falla incluso el almacenamiento local, el resumen permanece en memoria y pide no cerrar y reintentar. Pendientes no son copias de seguridad y no se comparten entre móvil/PC.

El coordinador limita cada intento a diez segundos para no bloquear indefinidamente el resumen. Una confirmación tardía no elimina la copia local: el reintento idempotente con el mismo ID recupera la operación sin duplicarla. Cada confirmación retira solo su partido, conservando los demás pendientes.

El historial requiere conexión: lista paginada de 20 partidos, participantes, ganador, prórroga/penaltis y detalle cronológico. No se calcula XP, ELO, ranking ni estadísticas.

## Próximas fases

ESP32-S3: futura interfaz física a 800×480 (el firmware no ejecutará React directamente). ESP32-C3: futuro adaptador de pulsadores/sensores que genere eventos equivalentes. La separación motor/entradas/repositorios prepara esa integración, pero aún no existe firmware.

Vercel: aplicación estática Vite, build `npm run build`, salida `dist`. Configurar las dos variables públicas en el entorno antes del build y desplegar cuando se autorice. Este bloque no modifica Vercel ni activa servicios de pago.
