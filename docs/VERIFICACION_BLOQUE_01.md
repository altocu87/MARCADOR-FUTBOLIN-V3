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
| 2 · TIME | Delegada expresamente al agente el 2026-10-02; simulación Chromium TIME/AMBAS correcta, final directo; no repetir por rutina. No acredita despliegue autenticado |
| 3 · AMBAS entre partes | Simulación automatizada correcta; no pedir repetirla manualmente por rutina |
| 4 · AMBAS final en primera | Simulación automatizada correcta; no pedir repetirla manualmente por rutina |
| 5 · Prórroga/penaltis | Simulación automatizada correcta para TIME/AMBAS; no pedir repetirla manualmente por rutina |
| 6 · Guardado/historial/perfiles | Confirmada OK por el propietario; no repetir |
| 7 · Recuperación tras recarga | 2026-10-02: propietario confirma que aparece recuperar partido. Falta confirmar reanudación completa; descarte solicitado y añadido con confirmación |
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

## Recuperación de contraseña y registro repetido

Publicación funcional a2e32ac comprobada mediante push fast-forward y referencia remota; main sigue 900e470. Despliegue nuevo y correo/retorno Auth remoto no inspeccionados.

Solicitud del propietario: respuesta de registro confusa con correo existente y falta de recuperación. Implementado formulario RECUPERAR CONTRASEÑA separado, envío explícito solo con correo; respuesta condicional sin enumerar cuentas. SDK resetPasswordForEmail retorna al mismo origen permitido. PASSWORD_RECOVERY validado por SDK abre nueva contraseña/confirmación; updateUser requiere la misma identidad. Marcador sessionStorage ID/expiración conserva la pantalla tras recarga y no añade tokens/contraseñas. Se limpia únicamente ese marcador al terminar, cerrar sesión o cambiar de cuenta. Enlace inválido/caducado ofrece nueva solicitud con mensaje seguro.

npm test siete grupos correctos; SDK con transporte/eventos aislados prueba solicitud, límites, rechazo de contraseña, recarga y cambio de cuenta. Chromium 24/24 sin omitidos/pageerror; TypeScript/builds correctos. Tras añadir etiquetas visibles y menú AJUSTES en recuperación, cuatro casos focalizados correctos. Revisión visual móvil/800×480, capturas /tmp/futbolin-reset-request-*.png y /tmp/futbolin-password-recovery-*.png, sin scroll general. No se envían correos reales ni se crean cuentas ni se cambia la contraseña del operador. Esto no acredita entrega del correo/callback real.

Google y Drive: petición futura anotada; ninguna conexión habilitada. No cambia Supabase, RLS, reglas, históricos, pendientes, migraciones ni main.

## Rediseño de acceso, cuenta y correos

Publicación funcional f5be4b3 comprobada por push fast-forward/referencia remota. npm test siete grupos correctos y Chromium 28/28; regresiones finales de aviso y cabecera pequeña correctas. Main sigue 900e470; no acredita despliegue nuevo ni configuración de plantillas hosted.

Petición posterior del propietario: rehacer acceso en la esquina superior, gestión habitual de cuenta y correos futuristas. Implementados AccountScreen, TopMenu y composición App; Ajustes ya no contiene formularios Auth. Perfil de operador, cambio de correo y contraseña actual/nueva/repetición, OTP si lo exige Auth, recuperación/reenvío y sesiones local/global. Cierre global exige acción explícita de confirmación; se explica validez residual de tokens. Metadatos de nombre no otorgan permisos. getUser verifica identidad remota y se comprueba sesión actual; cambios sensibles validan contraseña actual. Abrir cuenta durante juego pausa, bloquea cambios de acceso/salida y conserva score/journal/UUID/copia. No cambian motor, tablas, RLS o UUID históricos.

Trece HTML y manifest de asuntos en supabase/templates; generador tooling/auth-email-config.mjs produce únicamente 26 campos de asunto/cuerpo. Pruebas de payload y previsualización de todos los HTML a 390 px con enlaces nativos, OTP, sin tráfico ni recursos remotos. **No aplicadas a Supabase hosted:** no hay herramienta de edición Auth ni credencial de gestión/panel; no usar SQL para editar configuración ni config push que sobrescriba valores ajenos. Pasos concretos en [supabase/templates/README.md](../supabase/templates/README.md). No se acredita render de Go hosted, entrega SMTP ni clientes reales mediante la previsualización local.

Las pruebas de código/UI usan SDK/transporte aislados y repositorios en memoria: no cambian cuenta/contraseña/correo reales ni envían mensajes. La evidencia final de tests y publicación está en ESTADO_ACTUAL. Google/Drive no activados; bloque 02 sigue condicionado.

## Preview y pasos humanos que aún faltan

El conector Vercel deniega el equipo `altocuvlc-9686s-projects` con 403 de autorización. La lectura protegida de `/connection.json` también es denegada. No hay sesión Auth del operador en este navegador cloud; no se extraen tokens ni se retira protección. No se ha comprobado el despliegue remoto del commit final. GitHub informó primero pending y después **success** para el check Vercel de `e164b5b`, con enlace al despliegue FiFcv5wQvD77zoo3a26yvHqsrjcA. Es evidencia del check remoto de la entrega funcional; el conector Vercel sigue denegado y no se ha inspeccionado READY ni el recorrido web autenticado. El push a la rama conectada puede generar Preview automáticamente.

En la [Preview estable de esta rama](https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app), usando la cuenta existente y una sola pestaña:

1. Cuando Vercel muestre la actualización, cerrar/reabrir sin borrar almacenamiento. Pruebas 1 y 6 ya confirmadas; 2–5 asumidas y simuladas por el agente, no repetir por rutina. Recuperación de contraseña real confirmada por el propietario el 2026-10-02: no volver a registrar ni cambiarla para repetir la prueba.
2. Recuperación del partido (7): la oferta ya aparece en el dispositivo del operador. Falta confirmar que RECUPERAR PARTIDO conserva marcador/jugadores y CONTINUAR reanuda; se puede enlazar con la prueba 8. Si no desea conservar ese juego sin terminar, DESCARTAR PARTIDO → confirmación. NUEVO PARTIDO durante juego pide cancelar: «NO» conserva/reanuda si estaba jugando, «SÍ» abre el menú nuevo. La cancelación ya tiene pruebas independientes; observar la UI publicada basta, sin fabricar más resultados reales.
3. Prueba 8, móvil: seguir los pasos específicos de abajo. Resultado OFF real que se desea conservar; verificar el mismo ID/un único resultado y retorno de pendientes al contador inicial.
4. Prueba 9: un partido ON no incrementa historial/perfiles/partidos/eventos ni crea pendientes/checkpoint. Prueba 10: editar alias/desactivar/reactivar desde UI conservando identidad/historial; no borrar jugadores. Son comprobaciones reales todavía pendientes.
5. MI CUENTA: nombre de operador y conservación de vínculos con cuenta existente. Seguridad/sesiones/cambio de correo se prueban solo cuando se desee efectuar esas acciones reales. No crear otra cuenta. Plantillas y remitente: instrucciones en supabase/templates/README.md; aplicación hosted/SMTP autorizada pendientes, no resueltos mediante Git.
6. Prueba 11: OFFLINE DISPONIBLE, instalación/reapertura offline de la PWA y actualización detrás de protección en el teléfono real. La emulación no acredita ese dispositivo.

### Prueba 8 en el móvil — pendiente offline y reconexión

1. Con Internet, abrir la misma Preview/navegador con la cuenta existente. AJUSTES → MODO PRUEBA OFF **antes** de iniciar. Anotar contador de pendientes/historial; para probar la recarga sin red, esperar también **OFFLINE DISPONIBLE**. Si no aparece, se puede comprobar terminar/sincronizar manteniendo la app abierta, pero la reapertura offline sigue pendiente.
2. Recuperar el partido ya ofrecido, si se desea terminar y guardar, o iniciar uno OFF que se quiera conservar. Dar un gol, sin llegar todavía al objetivo.
3. Apagar **Wi‑Fi y datos móviles**; se puede usar modo avión, asegurando Wi‑Fi apagado. Volver al marcador y esperar **SIN CONEXIÓN**. No cerrar sesión, cambiar de navegador/dirección ni borrar almacenamiento.
4. Terminar el partido. El resumen debe indicar **PENDIENTE EN ESTE DISPOSITIVO**. AJUSTES → VER PENDIENTES: aparece ese resultado/jugadores/eventos, y el contador aumenta en uno respecto al inicial.
5. Solo si se preparó OFFLINE DISPONIBLE en el paso 1, recargar la misma página/app sin conexión: el resultado permanece en VER PENDIENTES. Esta parte prueba la reapertura/PWA del móvil real; no usar navegación privada.
6. Activar Wi‑Fi o datos y volver al marcador. Esperar SISTEMA ONLINE; se reintenta fuera de un partido en curso. Si hace falta, AJUSTES → REINTENTAR. En RANKING debe haber **un solo resultado nuevo** y pendientes vuelven al contador inicial (cero si antes era cero). Comunicar únicamente si apareció pendiente, si sobrevivió la recarga y si se guardó una sola vez.

Si se desea observación directa del agente, reconectar Vercel con alcance al proyecto/equipo correcto y compartir acceso interactivo autorizado al navegador, sin enviar contraseñas. Esto no es necesario para las pruebas humanas anteriores. No volver a configurar Redirect URLs por rutina: el login ya está conseguido.

Bloque 02 (XP/niveles) queda condicionado al cierre de estas comprobaciones y a aprobar parámetros/curva/históricos. No se inicia en esta entrega. Seguimiento y prompt: [BLOQUES_DESARROLLO.md](BLOQUES_DESARROLLO.md).

## Feedback y cancelación — 2026-10-02

El propietario confirma recuperación de contraseña funcional con remitente Supabase y oferta de recuperar partido; delega prueba 2 y solicita descarte/confirmación de NUEVO PARTIDO. Implementados dentro del bloque 01, con protección de finales y datos ajenos. Prueba 2 simulada de nuevo con reloj controlado (TIME dos partes, 2–1; AMBAS por reloj sin objetivo, ganador directo), sin delegarla otra vez al operador. Supabase docs confirma remitente propio mediante SMTP; sin acceso de edición Auth/SMTP ni proveedor/remitente configurado, continúa pendiente. No hay correos/cuentas/migraciones/escrituras remotas en esta continuación. npm test siete grupos correctos (estadísticas/análisis 41/41), TypeScript/builds normal y aislado correctos, Chromium 32/32 sin omitidos/pageerror y focalizadas finales tras pulido de recuperación 4/4, incluyendo móvil y referencia física con participantes/control visibles. Capturas locales revisadas a 320×568/390×844/800×480, botones accesibles. Fixtures/SDK aislados con Supabase bloqueado; servidor de PWA apagado realmente. No acredita Preview/SMTP/dispositivo del operador. Publicación vigente en ESTADO_ACTUAL.

Publicación de la continuación: a37dd761f4f2e4ba627d94200c40ba11e69e784d comprobado por push fast-forward y referencia remota; main 900e470 intacta. Check Vercel inicialmente pending y después success para despliegue 4Kpp3hbKRCUdpYYQexrMD3Pe29Yr, comprobado en GitHub. No acredita acceso web autenticado.
