# Bloque 01 — Consolidación y evidencia, 2026-10-01

Estado: programación y pruebas independientes completas; pendiente recorrido autenticado de la Preview vigente y PWA en dispositivo físico. El login y la prueba comunicados por el operador se aceptan como conseguidos. No crear otra cuenta ni compartir contraseña.

## Base y alcance

Checkout cloud inicialmente limpio en `work`, `900e470`. Git sin permisos de red falló al conectar con el proxy. Se recuperaron objetos mediante el conector GitHub y se verificaron sus SHA originales; después, con permiso de red del comando, funcionó `git fetch`. El remoto había avanzado de `472f945` a `f9ebe15`: se integraron esos cuatro commits posteriores antes de la verificación final, conservando el historial y las correcciones del propietario. Se resolvió el único conflicto de pruebas manteniendo ambos conjuntos de regresiones. Main permanece `900e470`; sin promoción ni force push. Correcciones `eb0f098` y entrega `e164b5b` publicadas por push fast-forward; `git ls-remote` confirma `e164b5bc67c062465410b032a8f661e25e580a23` en la rama de revisión. Esta evidencia se añade en un commit documental posterior.

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

## Seguimiento del checklist humano y corrección del cierre

El propietario confirma **prueba 1 OK** (GOALS). En la prueba 2 detecta una pantalla innecesaria de FINAL DE LA 2ª PARTE seguida de VER RESULTADO; solicita mostrar directamente el ganador. Confirmación parcial: no registrar toda la prueba 2 como aprobada.

Reproducido antes del arreglo por una regresión de motor: publicaba PERIOD_END en vez de MATCH_END. Ahora el fin de segunda parte con marcador desigual publica únicamente MATCH_END, conservando period_end y match_end consecutivos en el journal. TIME y AMBAS, ganador Blanco/Azul; fecha, 120 segundos, recuperación del final y entradas posteriores sin duplicar eventos comprobados. No cambia el objetivo, las reglas históricas, el desempate ni el contrato de checkpoint/RPC; copias antiguas de descanso siguen recuperándose con su transición original.

Checklist 3 y 4 automatizados en Chromium: AMBAS objetivo total 5, primera 3–2, dos goles blancos en segunda → 5–2 (incluye recarga); objetivo 2 en primera → final 2–1 directamente. Checklist 5 ampliado en navegador para TIME y AMBAS: dos partes empatadas → prórroga de 60 segundos → primer gol Azul finaliza; otra partida agota la prórroga → penaltis con turnos alternos habilitados/bloqueados → ganador Blanco 3–0 sobre marcador de campo 0–0. Prueba ON no crea cola/checkpoint. También AMBAS por reloj sin llegar al objetivo → ganador Azul directamente.

Verificación de esta continuación: npm test, siete grupos correctos (estadísticas/análisis 41/41); npm run test:browser, TypeScript/builds normal y aislado y Chromium 20/20 sin omitidos/pageerror. Revisión visual del final directo, gol de oro y penaltis a 800×480, capturas temporales /tmp/futbolin-direct-final.png y /tmp/futbolin-{time,both}-{golden-goal,penalties}.png. Estas simulaciones usan el build aislado, reloj controlado y repositorios en memoria, bloqueando Supabase; no son verificación de la Preview autenticada. No se repite SQL remoto, no hay migraciones ni escrituras remotas de datos.

| Prueba del checklist entregado | Estado / siguiente paso |
| --- | --- |
| 1 · GOALS | Confirmada por el propietario; no repetir |
| 2 · TIME | Bug corregido y verificado localmente; confirmar solo final directo en Preview actualizada, con prueba ON |
| 3 · AMBAS entre partes | Simulación automatizada correcta; no pedir repetirla manualmente por rutina |
| 4 · AMBAS final en primera | Simulación automatizada correcta; no pedir repetirla manualmente por rutina |
| 5 · Prórroga/penaltis | Simulación automatizada correcta para TIME/AMBAS; no pedir repetirla manualmente por rutina |
| 6 · Guardado/historial/perfiles | Confirmada OK por el propietario; no repetir |
| 7 · Recuperación tras recarga | Aclarada: se hizo con PRUEBA ON, volver al inicio es lo esperado. Sigue pendiente recuperación real con OFF desde el inicio |
| 8 · Pendiente offline/reconexión | Falta recorrido desde el origen real; mismo ID, un solo resultado |
| 9 · Prueba ON sin incremento | Falta contraste de historial/perfiles reales antes/después |
| 10 · Alias/baja lógica | Falta comprobación desde UI real; no borrar jugadores |
| 11 · PWA física | Falta instalación y reapertura offline en el teléfono real |

Seguimiento posterior del propietario: **6 OK**. En **7**, recargó y volvió a la página principal sin partido por recuperar. Se registra la incidencia; no se afirma todavía pérdida de una copia existente ni causa confirmada. La recuperación está prevista únicamente para partidos iniciados con PRUEBA OFF, sin finalizar, en el mismo navegador/origen/cuenta. Cambiar a OFF después de iniciar no cambia ese partido. Con PRUEBA ON no se escribe copia y volver al inicio tras recarga es el comportamiento aprobado. No borrar almacenamiento ni crear otra cuenta para diagnosticar.

Aclaración posterior: el propietario confirma **PRUEBA ON** en 7. Queda explicada la vuelta al inicio; no se declara aprobada la recuperación OFF. El modo queda fijado al iniciar: para esa comprobación, OFF debe seleccionarse antes del nuevo partido.

## Registro separado del inicio de sesión

El propietario pide separar CREAR CUENTA de ENTRAR tras cuatro pulsaciones accidentales con su correo existente. INICIAR SESIÓN queda como vista predeterminada y ENTRAR como único submit. Registro secundario independiente, separado por espacio/borde, abre CREAR CUENTA NUEVA; abrir o volver no envía Auth y limpia la contraseña. Registro mantiene validación nativa y confirmación por correo. No se cambia el SDK, políticas, sesión ni datos del operador, ni se infiere la creación de cuatro cuentas.

npm test correcto y Chromium 21/21 con TypeScript/builds normal y aislado. Regresión de navegador con contadores de fixture: dos accesos (botón/Intro) y cero registros; abrir registro sigue sin enviar; submit explícito registra únicamente en fixture; volver no envía. Cookie de origen protegido sigue necesaria para habilitar acceso/registro; sin ella ambos submits bloqueados. Revisión visual de login a 390×844/800×480 y registro en referencia física; capturas /tmp/futbolin-login-separated-*.png y /tmp/futbolin-registration-separated-physical.png. Datos Auth aislados; cero cuentas/correos/llamadas Auth reales.

El agente asume las simulaciones 3–5. Una simulación local no cierra la dependencia de Preview autenticada/PWA física, pero no requiere repetir esos guiones completos por rutina.

## Consulta posterior sobre visibilidad de jugadores

El propietario comunica dos jugadores que ya no aparecen en «producción». Consulta real read-only: dos jugadores activos y con historial siguen guardados; una cuenta de operador confirmada, un partido. Falta identificar URL y nombres para vincular esa consulta con los registros mencionados. No se recrean jugadores ni se borran cuentas/datos. PRUEBA ON no elimina ni vuelve temporal la gestión autenticada de jugadores. La sesión por origen y las diferencias main/Preview pueden afectar a lo que se ve, pero aún no son una causa confirmada. Vercel sigue rechazando el alcance con 403; no se alteran variables o despliegues para diagnosticar. No incorporar nombres/correos/IDs del operador al repositorio.

## Preview y pasos humanos que aún faltan

El conector Vercel deniega el equipo `altocuvlc-9686s-projects` con 403 de autorización. La lectura protegida de `/connection.json` también es denegada. No hay sesión Auth del operador en este navegador cloud; no se extraen tokens ni se retira protección. No se ha comprobado el despliegue remoto del commit final. GitHub informó primero pending y después **success** para el check Vercel de `e164b5b`, con enlace al despliegue FiFcv5wQvD77zoo3a26yvHqsrjcA. Es evidencia del check remoto de la entrega funcional; el conector Vercel sigue denegado y no se ha inspeccionado READY ni el recorrido web autenticado. El push a la rama conectada puede generar Preview automáticamente.

En la [Preview estable de esta rama](https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app), usando la cuenta existente y una sola pestaña:

1. Cuando Vercel muestre la actualización, cerrar/reabrir sin borrar almacenamiento. Con prueba ON, confirmar únicamente el arreglo de la prueba 2: al acabar la segunda parte con marcador desigual aparece directamente FINAL DEL PARTIDO y ganador, sin VER RESULTADO. GOALS ya confirmado; simulaciones 3–5 a cargo del agente, no repetirlas por rutina.
2. Guardado/historial/perfiles (prueba 6) ya confirmados; no repetirlos. Pendiente solo prueba 10 de edición de alias/desactivar/reactivar, conservando identidad e historial. No intentar borrar jugadores reales para probar protección.
3. Prueba 7 estaba ON, no guardaba copia: comportamiento esperado. Para verificar recuperación real cuando se retomen las pruebas: seleccionar OFF antes de iniciar un partido nuevo, POR GOLES objetivo 5, un gol (1–0), recargar la misma pestaña/origen sin finalizar y comprobar recuperación en pausa. Después, terminar sin conexión, consultar pendiente, recargar y reconectar. Debe quedar un único resultado y la cola vacía. Ese resultado también se conserva como dato real.
4. Repetir un partido con prueba ON: no aumenta historial/perfiles/partidos/eventos ni crea pendientes/checkpoint. Comparar antes/después; comunicar solo resultados o errores, sin credenciales.
5. En el teléfono real, preparar OFFLINE DISPONIBLE e instalar/abrir la PWA, comprobar reapertura offline y actualización detrás de la protección Vercel. La emulación local no cierra esta comprobación física.

Si se desea observación directa del agente, reconectar Vercel con alcance al proyecto/equipo correcto y compartir acceso interactivo autorizado al navegador, sin enviar contraseñas. Esto no es necesario para las pruebas humanas anteriores. No volver a configurar Redirect URLs por rutina: el login ya está conseguido.

Bloque 02 (XP/niveles) queda condicionado al cierre de estas comprobaciones y a aprobar parámetros/curva/históricos. No se inicia en esta entrega. Seguimiento y prompt: [BLOQUES_DESARROLLO.md](BLOQUES_DESARROLLO.md).
