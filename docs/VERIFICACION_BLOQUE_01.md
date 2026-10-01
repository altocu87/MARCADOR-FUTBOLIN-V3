# Bloque 01 — Consolidación y evidencia, 2026-10-01

Estado: programación y pruebas independientes completas; pendiente recorrido autenticado de la Preview vigente y PWA en dispositivo físico. El login y la prueba comunicados por el operador se aceptan como conseguidos. No crear otra cuenta ni compartir contraseña.

## Base y alcance

Checkout cloud inicialmente limpio en `work`, `900e470`. Git sin permisos de red falló al conectar con el proxy. Se recuperaron objetos mediante el conector GitHub y se verificaron sus SHA originales; después, con permiso de red del comando, funcionó `git fetch`. El remoto había avanzado de `472f945` a `f9ebe15`: se integraron esos cuatro commits posteriores antes de la verificación final, conservando el historial y las correcciones del propietario. Se resolvió el único conflicto de pruebas manteniendo ambos conjuntos de regresiones. Main permanece `900e470`; sin promoción ni force push.

Reglas vigentes comprobadas:

| Condición nueva | Regla |
| --- | --- |
| GOALS V2 | Sin partes, cronómetro ascendente sin límite; final al alcanzar un equipo el objetivo |
| TIME V2 | Dos partes de la duración elegida; ganador por total; empate → prórroga/gol de oro → penaltis |
| BOTH V4 | Objetivo por equipo para todo el partido, sin reiniciarlo; final al alcanzarlo en cualquier parte o por total al agotarse ambas |

V1/V2/V3 anteriores conservan sus reglas. V3 por objetivo de cada parte es histórico y fue corregido por el propietario; no se ofrece como regla nueva. No cambian resultados, UUID, hashes de RPC, tablas ni migraciones.

## Bugs reproducidos y corregidos

- SaveCoordinator sustituía un pendiente al recibir un agregado distinto con el mismo UUID. La nueva prueba falló con `Missing expected rejection` antes del arreglo. Ahora rechaza conflictos tanto durables como en vuelo, conserva los bytes originales al reintentar y comprueba el contenido antes de retirar una copia tras confirmación. Una confirmación tardía no borra una copia divergente ni otros pendientes. El orden de claves JSON no crea conflictos; arrays, reglas, eventos y resultados sí forman parte del contenido. El documento nuevo se clona para que una mutación del llamador no cambie el envío.
- El validador aceptaba un gol activo con parte/tiempo/marcador distintos de su evento original, aunque sus totales coincidieran. La regresión falló antes del arreglo. Ahora contrasta cada gol activo con el journal y comprueba el equipo de las anulaciones antes de restaurar. Copias dañadas se conservan sin modificar el motor. Regresiones sobre V3 histórico y V4 actual, además de compatibilidad anterior ya cubierta.

Archivos funcionales: `src/services/persistence/SaveCoordinator.ts`, `src/match-engine/checkpoint.ts`, `tests/persistence.test.ts`, `tests/recovery.test.ts`. Generador SQL reproducible: `supabase/tests/block01.ts`.

## Pruebas finales independientes

- `npm ci --cache /tmp/codex-npm-cache --prefer-offline --fetch-retries=0`: correcto, lockfile intacto. Los comandos de red/local sockets necesitan permiso de red de la herramienta en este executor; el primer intento restringido falló por permisos, no por código.
- `npm test`: siete grupos correctos; estadísticas/análisis 41/41, sin omitidos.
- `npm run test:browser`: TypeScript y builds normal/aislado correctos; Chromium 15/15, sin omitidos ni pageerror. GOALS sin límite, BOTH V4 en primera/segunda parte con recarga, TIME, bloqueo, prueba sin cola/checkpoint, pendientes/reintento/historial, perfiles/filtros/paginación y PWA con servidor realmente apagado.
- Revisión visual de capturas GOALS/configuración AMBAS y objetivo acumulado a 800×480; la suite conserva móvil/tablet/escritorio y referencia física sin scroll general. Capturas temporales `/tmp/futbolin-*.png`, fuera de Git. CLI agent-browser ausente; se utilizó Chromium/Playwright disponible, sin instalar otra herramienta.
- `npm audit --omit=dev`: cero vulnerabilidades. `git diff --check` y conectividad de objetos Git correctos; los objetos huérfanos del rebase no se eliminan.

Las pruebas de navegador usan repositorios en memoria y bloquean Supabase: siguen siendo pruebas independientes. Sus textos de guardado no acreditan RPC real ni instalación física.

## Supabase real

Conector disponible; único proyecto consultado: `unemjyfhzljcdjcbiiwh`, ACTIVE_HEALTHY. No se crearon cuentas, enviaron correos, cambiaron Auth/RLS/permisos o planes ni aplicaron migraciones.

Antes y después de la prueba SQL: una cuenta confirmada, dos jugadores, un partido, dos participantes y siete eventos. El partido comunicado por el operador es GOALS histórico, objetivo 1, resultado 2–0, ganador Blanco, dos periodos y metadatos de inicio vacíos. Es coherente con V1; se conserva, sin reinterpretarlo bajo GOALS V2. Eventos secuenciales 1–7, mismo propietario y marcador final coherente. No hay partidos prueba persistidos ni filas de fixture tras ROLLBACK. XP/nivel/ELO reservados mantienen 0/0/1200, sin progresión.

Las estadísticas reales derivadas de ese resultado son: Blanco, un partido/una victoria, GF 2/GC 0; Azul, un partido/una derrota, GF 0/GC 2. Es una consulta de datos reales, no una inspección de la pantalla autenticada del operador.

RLS activa en las cuatro tablas. `save_match_v1` sigue SECURITY INVOKER y no concede EXECUTE a anon/PUBLIC. El registro remoto contiene tres migraciones por nombre: `match_persistence_v1` (20261001053428), `tighten_match_integrity` (20261001055234), `bind_save_to_account` (20261001055716). Sus timestamps de registro difieren de los nombres de archivo locales ya documentados; no es una razón para duplicarlas.

Prueba real reproducible:

```bash
node --import tsx supabase/tests/block01.ts > /tmp/futbolin-block01.sql
```

Ejecutar el archivo entero, como administrador, en una única transacción que termina en ROLLBACK. Selecciona internamente una cuenta confirmada existente, usa únicamente jugadores/resultados temporales de fixture y cambia a `authenticated` para ejecutar la RPC. No accede a contraseñas/tokens ni necesita otra cuenta. Si no hay cuenta o colisiona un ID de fixture, aborta sin sobrescribir nada.

El generador usa MatchEngine/mapMatch y playerStatistics reales. RPC comprobada para GOALS 3–1, TIME 1–2, BOTH V4 5–2 entre partes y penaltis sobre 0–0 con ganador Azul. Guarda cada documento dos veces y contrasta campos, participantes y eventos completos; coteja perfiles 1v1/2v2 con el cálculo de aplicación, rechaza contenido divergente/prueba, protege jugador histórico, conserva snapshot tras renombrar/desactivar y verifica aislamiento por cuenta. Resultado remoto: `PASS block 01 ... ROLLBACK`. El primer intento detectó precedencia incorrecta de un operador JSON en la aserción SQL; se corrigió en el generador y la ejecución final pasó. Sin cambios de esquema ni datos conservados.

Advisor actual: WARN de protección de contraseñas filtradas deshabilitada, no una regresión de RLS. [Referencia oficial](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Se registra sin activar opciones de pago ni cambiar políticas. No afirmar «sin avisos» por el resultado histórico anterior.

## Preview y pasos humanos que aún faltan

El conector Vercel deniega el equipo `altocuvlc-9686s-projects` con 403 de autorización. La lectura protegida de `/connection.json` también es denegada. No hay sesión Auth del operador en este navegador cloud; no se extraen tokens ni se retira protección. No se ha comprobado el despliegue remoto del commit final. El push a la rama conectada puede generar Preview automáticamente.

En la [Preview estable de esta rama](https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app), usando la cuenta existente y una sola pestaña:

1. Cuando Vercel muestre el nuevo commit, cerrar/reabrir sin borrar almacenamiento y comprobar las tres opciones/reglas. Prueba ON para ensayos sin datos: GOALS objetivo 3 continúa a 2–1 y termina a 3–1 sin partes; TIME completa dos partes; BOTH objetivo 5 conserva 3–2 entre partes y termina a 5–2. El motor ya tiene pruebas de empates/prórroga/penaltis; comprobar también ese flujo en el origen real si no formó parte de la prueba anterior.
2. Con prueba OFF y jugadores existentes, completar un resultado que se quiera conservar: comprobar resumen, historial/detalle (participantes/eventos) y perfiles de ambos equipos; editar alias/desactivar/reactivar conserva la identidad e historial. No intentar borrar jugadores reales para probar protección.
3. Mismo origen/cuenta: con prueba OFF, recargar una partida en curso, recuperar en pausa y conservar marcador/tiempo/ID; terminar sin conexión, consultar pendiente, recargar y reconectar. Debe quedar un único resultado y la cola vacía. Ese resultado también se conserva como dato real.
4. Repetir un partido con prueba ON: no aumenta historial/perfiles/partidos/eventos ni crea pendientes/checkpoint. Comparar antes/después; comunicar solo resultados o errores, sin credenciales.
5. En el teléfono real, preparar OFFLINE DISPONIBLE e instalar/abrir la PWA, comprobar reapertura offline y actualización detrás de la protección Vercel. La emulación local no cierra esta comprobación física.

Si se desea observación directa del agente, reconectar Vercel con alcance al proyecto/equipo correcto y compartir acceso interactivo autorizado al navegador, sin enviar contraseñas. Esto no es necesario para las pruebas humanas anteriores. No volver a configurar Redirect URLs por rutina: el login ya está conseguido.

Bloque 02 (XP/niveles) queda condicionado al cierre de estas comprobaciones y a aprobar parámetros/curva/históricos. No se inicia en esta entrega. Seguimiento y prompt: [BLOQUES_DESARROLLO.md](BLOQUES_DESARROLLO.md).
