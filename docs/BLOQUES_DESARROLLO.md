# Bloques y prompts para continuar — 2026-10-01

Preparado por petición del propietario: conservar el punto alcanzado y comenzar una conversación por bloque. Este documento organiza el trabajo futuro; **no ejecuta ni autoriza automáticamente todas las fases**. La petición de cada conversación determina su alcance. El estado operativo vivo y el registro de cambios permanecen en [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md); las reglas y propuestas originales en [CONTEXTO_MAESTRO.md](CONTEXTO_MAESTRO.md).

## Punto de partida registrado

- Repositorio `altocu87/MARCADOR-FUTBOLIN-V3`; rama de desarrollo `codex/reliability-offline-v1`. Base inicial de este plan: `871c363`; última modificación funcional `0a6f993` (GOALS sin partes y verificación de desempates), push comprobado; AMBAS V4 en `0cb5dec`. Al retomar obtener la punta actual, no volver automáticamente a estos hashes. `main` comprobada en `900e470`: todavía no contiene los avances de desarrollo.
- Implementados simulador, persistencia privada Supabase, jugadores, historial, guardado idempotente, pendientes, recuperación, PWA, web adaptable y referencia física 800×480, perfiles/estadísticas y análisis de resultados con filtros. No rehacerlos desde main.
- Últimas correcciones: acceso a Preview protegido (`89e7981`), GOALS sin partes (`f7050ef`) y AMBAS con objetivo total del partido (`0cb5dec`, corrección V4 sobre `472f945`). `b9dfc7b` implementó por error un objetivo por parte y ha quedado reemplazado para nuevos partidos. Los registros completos y decisiones reemplazadas están en ESTADO_ACTUAL.
- GOALS: sin partes, cronómetro ascendente sin límite de tiempo, primer equipo que alcanza el objetivo. TIME: dos partes por reloj, ganador por suma de goles. AMBAS: objetivo por equipo para el partido completo, sin reiniciarlo entre partes; final directo al alcanzarlo o ganador por total después de las dos partes por reloj. Ejemplo objetivo 5: primera 3–2 y dos goles blancos en la segunda → Blanco 5–2. No contar victorias de parte ni objetivos por parte.
- Checkpoints: GOALS/TIME nuevos V2; AMBAS nuevo V4. Copias anteriores conservan sus reglas, incluida la interpretación histórica V3. No reescribir resultados, pendientes ni sus hashes. Se mantiene bloqueo central de tres segundos, pausa, corrección y desempate por prórroga/gol de oro/penaltis cuando corresponde.
- Corrección V4: siete grupos de `npm test` correctos, estadísticas/análisis 41/41; los resultados de navegador/build y publicación están en la entrada vigente de ESTADO_ACTUAL. Fotografía histórica del plan: el cierre funcional posterior de 01 y el prompt siguiente se mantienen en el seguimiento vigente.
- El propietario comunica login y prueba satisfactorios en la Preview real. El agente no ha inspeccionado sus filas/RPC ni todos los casos de cierre. Los últimos despliegues de reglas no están comprobados remotamente. El push está comprobado; eso no demuestra despliegue.
- No implementados todavía: XP/niveles calculados, ELO/ranking competitivo/categorías, predicción, logros/récords/Hall of Fame, torneos completos, audio avanzado, backup, firmware/entradas físicas y OTA.

## Cómo usar los bloques

1. Abrir una conversación con este repositorio y pegar el prompt completo de **un** bloque.
2. El agente lee AGENTS y el contexto vigente, comprueba rama/árbol/remotos y preserva trabajo existente. No necesita que se copie todo el historial del chat.
3. Ejecuta solo ese bloque. Los números ordenan entregas, no autorizan empezar todas ni trabajar simultáneamente sobre dependencias sin cerrar.
4. Al terminar actualiza ESTADO_ACTUAL, decisiones pertinentes del contexto maestro y el seguimiento de este archivo. Entrega cambios, pruebas, commit/push comprobados, límites, siguiente bloque y su prompt actualizado. No declara una fase cerrada por fixtures locales si exige validación real.
5. Los prompts autorizan el trabajo del bloque cuando el propietario los utilice. No convierten propuestas de puntuación, formatos de torneo o conexiones eléctricas en decisiones aprobadas. Si falta una decisión importante, preparar una propuesta concreta y continuar trabajo independiente antes de solicitar esa decisión. No pedir permiso otra vez para lo ya aprobado.
6. Sin costes, borrados, promoción a main/producción ni cambios externos adicionales por el mero plan. Publicar el trabajo estable en la rama de revisión según la autorización vigente. Si se propone otra rama, comprobar que la configuración Vercel actual solo cubre Preview de `codex/reliability-offline-v1`.

## Seguimiento

**Vigente en v0.5.1, 2026-10-02:** 03 activo aprobado y 04 descriptivo integrado.
05 tiene nueve familias de logros con cinco niveles/estrellas en el perfil,
reconstrucción confirmada, 0 XP extraordinario. Umbrales V2 implementados por
petición de tiers del propietario; recompensas V2 y récords/Hall siguen en
[CATALOGO_BLOQUE_05](CATALOGO_BLOQUE_05.md) para aprobación. 05 no cerrado;
siguiente acción revisar esas propuestas y completar solo 05. 06 no iniciado,
condicionado al cierre de 05. Evidencias en VERIFICACION_BLOQUE_05 y ESTADO_ACTUAL.

**Punto 2 de revisión completado, 2026-10-02:** conector Vercel renovado y comprobado realmente: equipo/proyecto visibles, Preview HTTP 200 y despliegue READY de c2e217a/revisión. El 403 de las entradas anteriores queda resuelto. Punto 1 XP/bloqueo ELO ya acreditado por captura del propietario; no repetir cuentas/partidos. Sigue abierto el cierre competitivo de 03 (parámetros sin aprobación, ELO desactivado), después integración 04; 05 no iniciado. No se obtiene la sesión Supabase del operador por conectar Vercel. Evidencia/limitaciones en ESTADO_ACTUAL.

**Revisión humana posterior, 2026-10-02:** punto 1 confirmado por captura de Preview v0.4.0 autenticada: perfil Alex2 con XP 225/nivel 1/30 restantes y ELO pendiente de aprobación. No repetir cuentas/partidos; no equivale a activar ELO ni cerrar 03/04. Próximo paso del checklist: comprobar permisos del conector tras reabrir Codex; después decisiones competitivas de 03. Fuente/evidencia en ESTADO_ACTUAL y verificaciones 02/03.

**Ampliación transversal autorizada, 2026-10-02:** versión visible e historial de novedades de 0.0.0 a **0.4.0**, en AJUSTES → VERSIONES. La numeración registra entregas parciales y conserva los avisos de ELO desactivado/04 pendiente; no cambia el estado de los bloques ni inicia 05. Mantener versión/historial en próximas entregas según AGENTS. Evidencia en [VERIFICACION_VERSIONES.md](VERIFICACION_VERSIONES.md).

| Bloque | Entrega | Estado al preparar el plan | Condición para comenzar |
| --- | --- | --- | --- |
| 01 | Consolidación y comprobación real | Cerrado funcionalmente el 2026-10-02: todas las pruebas OK según el propietario, incluidas 7/10/11; código/SQL/pruebas independientes correctos. Correos hosted/SMTP pendientes externos separados | Sin repetir pruebas ni promover main |
| 02 | XP y niveles | Implementado/activado el 2026-10-02 con decisiones expresas; npm test/Chromium 37/37 y SQL/RPC/RLS reales correctos. XP autenticado de Alex2 acreditado por captura humana; conector Vercel recuperado sin compartir sesión del operador | 01 cerrado; parámetros aprobados, todos los históricos. No repetir 01 ni pedir nuevos partidos: panel XP del perfil mostrado ya acreditado |
| 03 | ELO, ranking y categorías | Aprobado/activo desde v0.4.1; SQL real y reconstrucción/RLS verificados | No reabrir reglas aprobadas; no repetir 01 |
| 04 | Análisis competitivo descriptivo | Integrado/verificado v0.4.1: 1v1/2v2 y casual 1v2, forma/H2H; Chromium 48/48 y SQL real PASS | Previsión aplazada por decisión expresa; no bloquea 05 |
| 05 | Logros, récords y Hall of Fame | v0.5.1: nueve familias activas, cinco tiers/45 estrellas, historial confirmado; 0 XP extra. Récords/Hall en fixture | Aprobar/corregir recompensas V2 y récords/Hall; Preview autenticada por observar. No cerrado |
| 06 | Torneos | Propuesto, no iniciado | Cierre 05; formato/reglas/premios de torneo aprobados |
| 07 | Sonido y pulido del uso diario | Propuesto | Flujos que se van a pulir estables |
| 08 | Backup y restauración | Propuesto | Modelos de datos de los bloques anteriores estables |
| 09 | Firmware y entradas físicas | Propuesto | Modelos/protocolo y conexiones reales verificables |
| 10 | OTA y administración local | Propuesto | 08 y firmware probado del 09 |

Ejecución del bloque 01: sincronización final sobre f9ebe15, dos bugs corregidos; npm test siete grupos/estadísticas 41/41, Chromium 15/15 y builds correctos. RPC real desde motor con ROLLBACK y cuenta existente; datos originales preservados. Preview denegada por alcance Vercel, sin sesión web del operador; no se declara cierre completo. Detalles en [VERIFICACION_BLOQUE_01.md](VERIFICACION_BLOQUE_01.md) y estado vivo. Publicación fast-forward de eb0f098/e164b5b comprobada por push y referencia remota; esta anotación se versiona después. La publicación no promueve main ni activa XP/ELO.

Continuación por feedback humano: prueba 1 confirmada; prueba 2 elimina el paso VER RESULTADO al cerrar segunda parte con ganador. npm test correcto y Chromium 20/20, incluidas simulaciones 3–5 y cuatro recorridos naturales de desempate TIME/AMBAS. No pedir repetir esas simulaciones por rutina ni dar por aprobada la prueba 2 completa: falta confirmar el arreglo en Preview y las comprobaciones reales pendientes del checklist. Seguimiento posterior: prueba 6 confirmada por el operador; prueba 7 fue con PRUEBA ON, vuelta al inicio esperada; aún falta recuperación real con OFF. Registro separado de login por petición expresa; Chromium 21/21 y builds correctos. No repetir la 6. Continuación de acceso: recuperación de contraseña completa en código, mensaje de registro genérico aclarado, Chromium 24/24 y cuatro verificaciones focalizadas finales; envío/callback Auth real pendiente. Google y Drive solicitados para más adelante, sin activación; Drive queda en el alcance futuro de 08 y Google necesita vinculación segura a cuenta existente antes de su implementación. Rediseño posterior autorizado: acceso superior y MI CUENTA (perfil/correo/seguridad/sesiones), sin Auth en Ajustes. Trece correos preparados; aplicación hosted pendiente por falta de edición Auth. Evidencia vigente en ESTADO_ACTUAL y VERIFICACION_BLOQUE_01.md; bloque 02 sigue condicionado.

Continuación del 2026-10-02: el operador confirma recuperación de contraseña (remitente Supabase) y que ya aparece recuperar partido; delega prueba 2 expresamente al agente, simulada TIME/AMBAS. Descarte confirmado de incompletos y confirmación de NUEVO PARTIDO implementados por petición expresa, sin tocar resultados/pendientes. Prueba 8 documentada para móvil; remitente requiere SMTP propio autorizado, sin herramienta/credencial de edición. Sustituye los pendientes históricos anteriores de recuperación de contraseña/prueba 2; no se repiten. Estado y evidencia actuales en ESTADO_ACTUAL.

Incidencia posterior del 2026-10-02: captura Safari con offline no disponible pese a conexión/sesión activas. Error de precarga de archivos protegidos reproducido; cookies del mismo origen y rechazo de redirects corregidos dentro de 01. Pruebas HTTP/worker/navegador independientes correctas, sin desactivar protección ni cachear Auth/API; publicación/evidencia en ESTADO_ACTUAL y VERIFICACION_PWA. Falta confirmar Safari físico: no repetir cuentas, GOALS/TIME ni esperar durante un partido para preparar offline.

Seguimiento posterior del 2026-10-02: capturas móviles y Supabase real en solo lectura confirman un único nuevo 0–3 finalizado/no de prueba, histórico anterior conservado y cero pendientes/sincronización completada. El propietario confirma posteriormente que vio el partido en pendientes y pulsó reintentar. Prueba 8 completada mediante reintento manual; no pedir repetirla ni atribuir a este recorrido reintento automático observado. Reanudación completa de 7, PWA física/reapertura sin red de 11 y demás pendientes explícitos siguen abiertos. Esta evidencia no inicia 02 ni cambia datos, reglas o permisos.

Seguimiento de alias y prueba ON, 2026-10-02: 9 confirmada por el propietario; SELECT real mantiene dos partidos y cero de prueba. Cambio de alias/nombre de 10 conserva datos. Por petición expresa, historial global/filtrado, detalle y últimos resultados muestran alias/nombre actual por ID, incluyendo inactivos y fallback al nombre guardado, sin reescribir resultados. Regresión independiente correcta; quedan observar la entrega publicada y desactivar/reactivar en el dispositivo. Pruebas 7/11 mantienen sus pendientes; no repetir 8/9 ni iniciar 02. Evidencia/publicación en ESTADO_ACTUAL.

Cierre funcional del bloque 01, 2026-10-02: el propietario confirma «Todas las pruebas OK» después del checklist restante 7/10/11. Se aceptan recuperación/reanudación, alias actual/baja/reactivación y PWA/reapertura sin red en el dispositivo como confirmación humana; no como inspección directa del agente ni nueva captura. Esta confirmación sustituye los pendientes funcionales anteriores; no repetir cuentas, partidos ni pruebas por rutina. Personalización de trece correos hosted/remitente SMTP sigue pendiente de acceso de edición y configuración autorizada: no queda acreditada por el checklist, no se contratan servicios y no bloquea planificar 02. Main no se promueve; XP/ELO todavía no implementados.

Siguiente prompt de 02 actualizado para usar esta confirmación y no reabrir pruebas ya acreditadas. La lectura o entrega del prompt no inicia el bloque ni aprueba XP.

Cada fila pasa a en curso, completado o pendiente de verificación con evidencia fechada; no marcar todas completadas al copiar los prompts. El orden puede ajustarse expresamente: el pulido web no depende de disponer de hardware y el diseño del protocolo puede prepararse sin una placa conectada.

## Bloque 01 — Consolidar la versión actual y comprobar guardado real

**Agente:** comprobar Preview del commit vigente cuando disponga de acceso, revisar regresiones de las tres condiciones, guardado/historial/perfiles, recuperación y pendientes; resolver bugs encontrados. Registrar qué parte fue local y qué parte real. **Propietario:** entrar personalmente con su cuenta existente y probar lo que el agente no pueda observar; no crear otra cuenta por rutina ni compartir contraseña.

**Cierre:** las reglas vigentes, el resultado/participantes/eventos guardados y los perfiles coinciden; prueba ON no añade resultados; reintentos no duplican; se detalla qué comprobaciones remotas/PWA siguen pendientes. La instalación física de PWA se verifica en el dispositivo real, nunca por emulación. No autoriza promover main.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 01 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md, docs/CONTEXTO_MAESTRO.md y docs/ESTADO_ACTUAL.md; sincroniza de forma segura la rama de desarrollo vigente. Consolida las tres condiciones de victoria ya aprobadas, comprueba guardado, historial, perfiles, recuperación y pendientes, y corrige bugs. El operador ya comunica login y prueba correctos: no le pidas crear otra cuenta. Verifica Preview/Supabase reales si tienes acceso; si falta, completa las pruebas independientes y da solo los pasos humanos que faltan, sin sustituirlos por mocks. Conserva datos, seguridad y reglas. No implementes XP/ELO ni promociones main. Actualiza contexto y seguimiento, publica el trabajo estable en la rama de revisión y entrega el siguiente bloque con su prompt.
```

## Gestión administrativa del historial — requisito reafirmado, planificación pendiente

El propietario reafirma el 2026-10-02 la opción de añadir manualmente, editar y eliminar partidos, para él y administradores autorizados, repercutiendo en todas las métricas. Todavía no existe: historial actual de lectura. No implica iniciar ahora XP/ELO ni ampliar permisos de otras cuentas. Tras el cierre funcional de 01, la continuidad es preparar 02, contemplando reconstrucción de métricas sin implementar aún esta gestión. Conviene definir esta gestión antes de activar progresión de 02/03, para que futuras concesiones y recálculos soporten cambios del historial.

Preparar validación del agregado, alta manual diferenciada sin inventar eventos, revisión de impacto, auditoría/versión, conflictos y actualización de lecturas. Recalcular estadísticas/rachas desde resultados válidos; futuro ELO desde el punto afectado en orden cronológico, con XP/niveles/logros/récords reconstruibles según sus reglas aprobadas. Propuesta de anulación reversible y restauración, pendiente de aprobación; no borrar datos reales al probar. Falta concretar ámbito privado por cuenta o compartido, asignación/revocación de administradores y política de eliminación. Permisos verificados en servidor/RLS, sin confiar en metadata de presentación.

Prompt preparado para cuando se concrete/autorice ese bloque:

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y trabaja exclusivamente en la gestión administrativa del historial registrada en CONTEXTO_MAESTRO §23 y BLOQUES_DESARROLLO. Lee AGENTS.md y estado/contexto vigentes; sincroniza la rama de revisión sin promover main. Antes de ampliar permisos o activar cambios reales, concreta ámbito de administradores y política de eliminación con una propuesta revisable; conserva el aislamiento actual entre cuentas. Prepara alta manual, edición y eliminación coherentes del agregado, validación de datos aportados, auditoría/versionado, protección de conflictos y recálculo de estadísticas/rachas con invalidación de lecturas. No inventes eventos de partidos manuales ni borres resultados reales para probar. No implementes XP/ELO/logros, pero documenta cómo reconstruir sus métricas futuras cronológicamente e idempotentemente cuando existan reglas aprobadas. Completa pruebas independientes y revisión de impacto; verifica Supabase real solo con acceso/autorización disponibles, sin sustituirlo por mocks. Actualiza contexto/seguimiento, publica estable en revisión y entrega los pendientes y siguiente prompt.
```

## Bloque 02 — XP y niveles

**Entrega del 2026-10-02:** el propietario aprobó tabla propuesta por jugador completo (50 + victoria 100/empate 60/derrota 25; victoria clasificatoria +50; prórroga/penaltis +25 único), umbrales acumulados ceil(100×N^1.35)/0–100 y todos los históricos válidos, con posible reducción por futuro recálculo. Implementadas configuración servidor y vista privada SECURITY INVOKER; no hay contadores incrementales ni escritura de columnas protegidas. Prueba/pendientes sin sincronizar no contribuyen. UI/perfiles/tarjetas por ID, barra/restante/umbral y lectura tras actualizar/reconectar/sync. SQL real rollback, paridad, 300 fronteras, privacidad y recálculo de fixtures correctos; npm test ocho grupos (42/42 estadísticas; 8/8 XP), Chromium 37/37/builds/revisión visual correctos. Dos migraciones aplicadas y datos preservados; ambos jugadores reales 225 XP/nivel 1. Evidencia en [VERIFICACION_BLOQUE_02.md](VERIFICACION_BLOQUE_02.md). Commit funcional aa0b70c/push fast-forward y check Vercel success comprobados; evidencia exacta en ESTADO_ACTUAL.

Vercel 403 de alcance y proxy HTTP 403 impiden observación directa del panel XP autenticado, sin sesión del operador. No reabrir 01, crear cuenta, pedir partidos ni repetir alias/baja/PWA. Solo falta observar XP en perfil con historial existente; SMTP/correos externo separado. Siguiente propuesto 03, con prompt actualizado abajo y parámetros propios pendientes; no se ejecuta en esta entrega. El prompt original de 02 de abajo se conserva como alcance histórico, no instrucción de rehacerlo.

**Agente:** implementar cálculo configurable, concesión por resultado final y progresión visible en perfil. Entrega idempotente: reintentos/recargas no conceden XP doble, prueba ON no concede y resultados pendientes no figuran como confirmados. Conservar separación motor/repositorios. **Propietario:** decidir únicamente parámetros de XP, significado/redondeo de la curva y si se aplicará a históricos cuando no exista aprobación registrada. Los apartados 30–31 contienen propuestas, no valores definitivos.

**Cierre:** reglas aprobadas, cálculos/fronteras probados, progresión por jugador/equipo definida para 1v1/2v2, integración transaccional/privada verificada y política explícita para históricos. No sumar automáticamente recompensas de logros/torneos aún inexistentes ni actualizar columnas protegidas desde el cliente.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 02 de docs/BLOQUES_DESARROLLO.md: XP y niveles. Lee AGENTS.md, docs/CONTEXTO_MAESTRO.md, docs/ESTADO_ACTUAL.md y la verificación del bloque 01; sincroniza de forma segura codex/reliability-offline-v1. El bloque 01 funcional está cerrado: el propietario confirmó todas las pruebas. No le pidas otra cuenta ni repetir pruebas acreditadas. Los correos personalizados/SMTP siguen como pendiente externo separado.

Implementa XP y niveles configurables, progresión visible en perfiles y concesión segura por resultado final sincronizado, con identidad estable, 1v1/2v2 e idempotencia ante recargas, reintentos y offline. Modo prueba y pendientes no conceden XP confirmado. Diseña el recálculo desde el historial vigente para soportar futuras altas, ediciones y eliminaciones administrativas sin duplicar recompensas; no implementes ahora esa gestión ni amplíes permisos de otras cuentas.

Los apartados 30–31 contienen propuestas, no parámetros aprobados. Prepara una tabla concreta de recompensas, ejemplos, definición de la curva (umbrales acumulados o coste por nivel), redondeo, límite de niveles y política para partidos históricos. Pide únicamente esas decisiones cuando falten, mientras avanzas diseño y pruebas independientes; no actives concesiones reales sin aprobación. No añadas premios de torneos, récords o logros todavía inexistentes.

Inspecciona el esquema antes de modificarlo; conserva datos, RLS, seguridad, reglas y separación del motor/repositorios. No actualices columnas protegidas desde el cliente. Verifica integración real de Supabase/Preview si tienes acceso y distingue pruebas independientes de comprobaciones remotas. No implementes ELO, logros, torneos, Google/Drive ni servicios de pago; no promociones main. Completa pruebas y revisión visual, actualiza contexto/estado/seguimiento, publica estable en la rama de revisión y entrega el siguiente bloque con su prompt.
```

## Bloque 03 — ELO, ranking y categorías

**Entrega del 2026-10-02:** implementados ranking privado y perfil ELO/categoría/máximo por identidad; SQL de reconstrucción cronológica desde historial vigente, lectura STABLE SECURITY INVOKER/RLS y snapshot JSON completo. Dos migraciones aplicadas con ELO **desactivado**, inicio 1200 y parámetros pendientes NULL. XP de 02/datos/RLS/motor/idempotencia preservados; sin administración. SQL real con cuenta existente y ROLLBACK PASS, ELO/repositorio 14/14, npm test nueve grupos, Chromium 41/41, builds/visual correctos. Preguntas y ejemplos pendientes en [VERIFICACION_BLOQUE_03.md](VERIFICACION_BLOQUE_03.md): no aprobación inferida de «Sigue». Falta aprobar valores exactos y activarlos en servidor para cierre competitivo; Preview XP/ELO autenticada sin observación por 403/sesión ausente, sin pedir nuevos partidos. Publicación funcional 96f654d/push fast-forward y check Vercel success comprobados; evidencia exacta en ESTADO_ACTUAL. El prompt original siguiente conserva el alcance, no pide rehacer lo implementado.

**Agente:** ELO solo en Clasificatorio, equipos 1v1/2v2, ranking privado, categorías aprobadas y máximo histórico; evolución consistente e idempotente. **Propietario:** concretar K, redondeo, categorías, multiplicador de diferencia e históricos si siguen siendo propuestas. ELO inicial 1200 es concepto aprobado; no asumir aprobado todo el resto.

**Cierre:** ajustes correctos por equipo/jugador, orden determinista de resultados, reintentos/concurrencia sin doble ajuste, Rápido/Caos/prueba sin modificar ELO. El ranking no sustituye el historial ni mezcla cuentas.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 03 de docs/BLOQUES_DESARROLLO.md: ELO, ranking y categorías. Lee AGENTS.md, contexto/estado vigentes y VERIFICACION_BLOQUE_02.md; sincroniza de forma segura codex/reliability-offline-v1 sin promover main. Bloque 01 cerrado por el propietario: no repetir cuentas/checklist. XP/niveles de 02 están aprobados y activos mediante la vista privada reconstruible; conserva su tabla, curva, históricos e idempotencia. SQL/RLS y UI independiente de 02 están verificados; distingue la observación autenticada de XP en Preview todavía sin acceso, sin pedir nuevos partidos. SMTP/correos siguen externos separados.

Implementa ELO solo Clasificatorio, ranking privado, categorías y máximo histórico, con identidad estable y 1v1/2v2. ELO inicial 1200 aprobado; prepara ejemplos concretos y pide únicamente K/experiencia, redondeo, categorías/histéresis, multiplicador por diferencia e históricos que sigan sin aprobación (§25–29), mientras avanzas diseño y pruebas independientes. No actives parámetros competitivos propuestos sin aprobación. Reconstruye cronológicamente desde historial vigente para futuras altas/ediciones/eliminaciones, sin implementar administración ni ampliar permisos. Reintentos, recargas, offline, empates y penaltis sin doble ajuste; Rápido/Caos/prueba/pendientes no conceden ELO confirmado. Inspecciona esquema primero; conserva datos/RLS/motor/repositorios y no escribas columnas protegidas desde cliente. Verifica Supabase/Preview reales con acceso disponible y documenta límites. No implementes predicción, logros, torneos, Google/Drive o pagos. Completa pruebas/revisión visual, actualiza contexto/estado/seguimiento, publica estable en la misma revisión y entrega el bloque 04 con su prompt.
```

## Bloque 04 — Análisis competitivo, enfrentamientos y predicción

**Decisiones y entrega vigentes — 2026-10-02, v0.4.1.** El propietario aprueba las recomendaciones y concreta 1 contra 2 exclusivamente Rápido/Caos. Sustituye los pendientes históricos de 03/04 de abajo. ELO servidor activado: versión 2, inicio 1200, primeras 10 K40/después K20, nearest-away, categorías Bronce <1000/Plata 1000/Oro 1200/Platino 1400/Diamante 1600/Élite 1800, descenso con histéresis 25, multiplicadores todos 1 y todos los Clasificatorios históricos válidos; máximo reconstruible. No hay suelo ELO ni suma cero garantizada con K distintos.

04 integrado como **análisis descriptivo**, sin índice, pronóstico, porcentajes predictivos ni confianza estimada. H2H de jugador/pareja exactos desde el historial completo confirmado, con perspectivas inversas y filtros del perfil; 1v2/2v1 agrupados como formato 1v2, separados de 1v1/2v2. Forma: últimos cinco Clasificatorios por ID, independiente de filtros, sin rellenar ausencias. Selección permite consultar enfrentamientos del modo elegido y forma de cada participante, solo al abrir el panel; consultas paralelas cancelables, error/offline no bloquean COMENZAR. Perfil reutiliza su lectura existente sin nuevas consultas.

1v2: tres jugadores activos distintos, mismas reglas de victoria/sin ventaja inicial, color del solo seleccionable, XP completo para cada jugador y equipos/posición conservados en copia, recuperación, resultado e historial. Clasificatorio sigue requiriendo 1v1/2v2: rechazo en UI, composición, mapeo, recuperación, estadísticas/XP y servidor/RPC/trigger diferido. `soloTeam` opcional de configuración solo representa equipos; versiones de reglas/checkpoints anteriores intactas. No cambia MatchEngine ni sus reglas de goles/reloj/desempate.

Migración aplicada **20261002140820_casual_1v2_and_approved_elo.sql**: reemplazo acotado de validadores RPC/trigger de equipos y activación ELO aprobada. RLS/grants, locks/idempotencia, cronología, columnas protegidas y vista XP conservados. Sin tablas nuevas ni datos de negocio modificados. Conteos antes/después: dos jugadores/dos Rápidos/cuatro participantes/doce eventos; ambos 225 XP/nivel 1, cero Clasificatorios reales. SQL de 03/04 real con ROLLBACK PASS; ningún Auth/usuario/correo nuevo.

Cierre del alcance aprobado: análisis descriptivo, previsión aplazada por decisión expresa. Comprobaciones/publicación en ESTADO_ACTUAL/VERIFICACION_BLOQUE_04. El prompt original de abajo queda histórico: no requiere reaprobar ELO ni incorporar pronósticos.


**Preparación parcial del 2026-10-02:** primero comprobada dependencia de 03 en revisión vigente/Supabase real: ELO desactivado y parámetros pendientes NULL, sin aprobación posterior. 04 **espera ese cierre**. Avanzados diseño, referencia H2H/forma y maqueta solamente en tests; no UI activa ni predicción/porcentajes. Tres preguntas propias de §32–33 (modelo/pesos, muestra y tratamiento 2v2), con ejemplos concretos, sin respuesta expresa registrada. Diez grupos npm test, contratos 04 12/12, Chromium 42/42, TypeScript/builds/visual correctos; SQL de dependencia/RLS READ ONLY y ROLLBACK PASS, sin nuevas cuentas/partidos/migraciones. XP de 02 aprobado/activo intacto y 01 cerrado; Preview XP/ELO autenticada 403, SMTP externo separado. Detalles en [VERIFICACION_BLOQUE_04.md](VERIFICACION_BLOQUE_04.md), publicación/continuidad en ESTADO_ACTUAL. Cerrar 03 y decisiones/integración 04 sigue siendo la siguiente acción efectiva; entregar 05 no los salta ni inicia 05.

**Agente:** enfrentamientos directos, últimos cinco clasificatorios y previsión con muestra/confianza; reutilizar las estadísticas y filtros ya implementados. **Propietario:** aprobar modelo/pesos/umbral de muestra que todavía sean propuestas (apartados 32–33).

**Cierre:** cifras por perspectiva/equipo consistentes; sin historial no inventar probabilidades; distinguir previsión de resultado seguro. No prometer calibración estadística que no se haya medido.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 04 de docs/BLOQUES_DESARROLLO.md: análisis competitivo, enfrentamientos y predicción. Lee AGENTS.md, contexto/estado vigentes y VERIFICACION_BLOQUE_03.md; sincroniza de forma segura codex/reliability-offline-v1 sin promover main.

Comprueba primero la dependencia de 03: en su entrega ELO estaba implementado/verificado pero desactivado, con K/experiencia, redondeo, categorías/histéresis, multiplicador e históricos sin aprobación. No supongas activación ni apruebes propuestas por este prompt; si siguen pendientes, registra que 04 espera ese cierre y conserva ELO desactivado. No rehagas 01 ni solicites cuentas/partidos nuevos. XP de 02 está aprobado y activo; conserva tabla, curva, históricos, vista privada e idempotencia. La observación autenticada XP/ELO en Preview sin acceso es un límite separado de SQL/RLS y UI independientes; SMTP/correos siguen externos separados.

Con 03 cerrado y reglas competitivas aprobadas, desarrolla enfrentamientos directos, forma de los últimos cinco clasificatorios y predicción prepartido con muestra/confianza. Reutiliza perfiles, estadísticas, filtros e identidades existentes. Prepara ejemplos concretos y solicita únicamente modelo/pesos/umbral de muestra y tratamiento de 2v2 que sigan pendientes en §32–33; avanza diseño/pruebas independientes sin activar propuestas. No confundas expectativa ELO con una probabilidad calibrada ni inventes porcentajes con muestra insuficiente. Trata bajas, 1v1/2v2, empates y penaltis; prueba/pendientes no aportan resultados confirmados. Conserva reconstrucción desde historial vigente, privacidad/RLS/motor/repositorios y ausencia de consultas por gol. No implementes administración, logros, torneos, Google/Drive ni pagos. Verifica Supabase/Preview reales con acceso disponible, documenta límites, completa pruebas/revisión visual, actualiza contexto/estado/seguimiento, publica estable en la misma revisión y entrega el bloque 05 con su prompt. No inicies 05.
```

## Bloque 05 — Logros, récords y Hall of Fame

**Entrega vigente v0.5.1:** nueve familias de logros con cinco niveles/estrellas
en el perfil, umbrales accesibles y reconstrucción desde hechos confirmados.
45 tiers únicos, 0 XP extra. La petición de niveles sustituye la propuesta V1;
recompensas V2 y ocho récords/Hall siguen pendientes en CATALOGO_BLOQUE_05.
SQL real de solo lectura comprueba 19 escenarios y RLS/reglas aprobadas.
[VERIFICACION_BLOQUE_05.md](VERIFICACION_BLOQUE_05.md) contiene la evidencia y el
prompt efectivo para continuar 05; no iniciar 06.

**Registro histórico de preparación, sustituido por v0.5.1:**

Continuidad tras v0.4.1: 03 activo y 04 descriptivo integrado; previsión aplazada voluntariamente y no bloquea preparar 05. Usar el prompt actualizado de continuación al final de VERIFICACION_BLOQUE_04. Catálogo/umbrales/recompensas de logros y récords siguen pendientes de aprobación. No iniciado. El prompt anterior de preparación se conserva como registro histórico.


**Prompt preparado durante la entrega parcial de 04:** no inicia 05 ni acredita cierre de 03/04. Las dependencias anteriores deben comprobarse otra vez; con 03 desactivado y 04 sin integración, registrar espera, conservar progresión y limitarse a preparación independiente que esté autorizada. No aplicar catálogo ni XP extraordinario por recibir este prompt.

**Agente:** catálogo aprobado, detección desde hechos disponibles, premios únicos y vistas privadas. **Propietario:** aprobar catálogo, umbrales y XP extraordinario; el objetivo aproximado de 50 logros/10 secretos no define automáticamente sus reglas.

**Cierre:** logro único no se cobra dos veces; actualizar récord no da XP ilimitado; goles siguen perteneciendo al equipo; correcciones/penaltis/prueba/pendientes tratados sin falsear hechos.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 05 de docs/BLOQUES_DESARROLLO.md: logros, récords y Hall of Fame. Lee AGENTS.md, contexto/estado vigentes y VERIFICACION_BLOQUE_04.md; sincroniza de forma segura codex/reliability-offline-v1 sin promover main.

Comprueba primero las dependencias: en la entrega parcial de 04, 03 seguía desactivado/sin aprobación y 04 solo tenía diseño/pruebas/maqueta aislados. No supongas cierres ni activación por este prompt; si siguen pendientes, registra que 05 espera y conserva ELO desactivado. XP de 02 está aprobado/activo: preserva tabla, curva, históricos, vista privada e idempotencia. No rehagas 01 ni solicites cuentas/partidos nuevos. Preview XP/ELO autenticada sin acceso y SMTP/correos son límites separados.

Con dependencias cerradas y progresión estable, implementa desde un catálogo aprobado de §34–35; si falta, prepara catálogo/umbrales/recompensas y ejemplos concretos para decisión, avanzando pruebas independientes sin activar premios. Reconstruye desde historial vigente por identidad estable; logro único no cobra dos veces y actualizar récord no concede XP ilimitado. Trata 1v1/2v2, bajas, empates, penaltis, correcciones futuras y exclusión de prueba/pendientes. No atribuyas goles a jugadores ni inventes hechos ausentes de históricos. Conserva RLS, motor/repositorios, datos y ausencia de consultas por gol. No implementes administración, torneos, Google/Drive ni pagos. Verifica Supabase/Preview reales con acceso disponible, documenta límites, completa pruebas/revisión visual, actualiza contexto/estado/seguimiento y publica estable en la misma revisión. Entrega el bloque 06 con su prompt; no lo inicies.
```

## Bloque 06 — Torneos

**Agente:** crear torneo del formato aprobado, participantes/equipos, programación/cuadro, avance desde resultados, recuperación y clasificación final. **Propietario:** decidir formato, número de equipos, empates/byes y premios; el apartado 36 los deja pendientes.

**Cierre:** completar un torneo del formato acordado sin avance duplicado, recuperación tras recarga, vínculo con partidos/ganador correctos y políticas de edición/cancelación claras. No borrar partidos para corregir el cuadro.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 06 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes. El apartado 36 deja el formato pendiente: prepara primero una propuesta sencilla y concreta de equipos, cuadro/liguilla, byes, empates y premios si no hay decisión aprobada. Después implementa íntegramente el formato acordado: creación, participantes, partidos, avance, recuperación y resultado final, reutilizando MatchEngine y persistencia. No avances dos veces con un mismo partido ni inventes formatos o recompensas. Conserva historial/RLS y offline durante el juego. Revisa y prueba un torneo completo, actualiza contexto/seguimiento, publica la rama de revisión y entrega el siguiente prompt.
```

## Bloque 07 — Sonido, reposo y pulido del uso diario

**Agente:** sonidos de eventos, volumen/silencio, preferencias, feedback y reposo en contextos apropiados; pulir los flujos reales ya existentes. **Propietario:** probar sonido/táctil en móvil y, cuando exista, altavoz/pantalla físicos.

**Cierre:** sonido no bloquea goles/reloj ni se duplica por renders; restricciones de autoplay gestionadas; accesibilidad y ambas vistas conservadas; reposo no oculta ni detiene una partida en curso. No afirmar ahorro/brillo físico desde una web.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 07 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes. Implementa sonido configurable, volumen/silencio, feedback de eventos y pulido del uso diario, incluida pantalla de reposo cuando proceda según el apartado 61. Evita audio duplicado, gestiona autoplay y conserva accesibilidad, web adaptable y 800×480. Reposo/sonido no deben parar ni ocultar una partida activa ni alterar el reloj o validar goles. Usa recursos permitidos sin servicios de pago. Prueba flujos y registra la prueba física que falte; actualiza contexto/seguimiento, publica la rama de revisión y entrega el siguiente prompt.
```

## Bloque 08 — Copias de seguridad y restauración

**Petición futura registrada:** contemplar Google Drive como destino de guardado/backup; definir contenido, frecuencia, restauración y permisos mínimos antes de activar OAuth. Login con Google se planifica aparte, preservando la cuenta existente y sus datos. El bloque 01 no habilita ninguna de estas conexiones.

**Agente:** exportación versionada de datos/configuración autorizados, validación de importación, vista previa del efecto y restauración segura. **Propietario:** decidir el origen/cuenta de destino y aprobar el efecto concreto antes de sustituir datos reales si esa operación fuese necesaria.

**Cierre:** round trip reproducible en entorno aislado; importación corrupta/cuenta incompatible no modifica datos; política de duplicados y compatibilidad explícita; sin tokens/contraseñas en backup. Una cola/checkpoint no es un backup.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 08 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes. Implementa exportación/importación versionada de jugadores, resultados y configuración, con validación, aislamiento por cuenta, política de duplicados y compatibilidad. No exportes credenciales/tokens ni confundas pendientes con backup. Antes de una restauración que sustituya datos reales, produce una vista previa concreta del efecto y solicita la autorización que falte; completa antes las pruebas aisladas y trabajo independiente. No borres ni sobrescribas datos por rutina. Revisa un round trip y rechazos seguros, actualiza contexto/seguimiento, publica la rama de revisión y entrega el siguiente prompt.
```

## Bloque 09 — Firmware, botones y sensores

**Agente:** protocolo/contratos de entradas, simulador, firmware incremental ESP32-S3/ESP32-C3 y adaptación física según módulos confirmados. La web React no se ejecuta directamente como firmware del ESP32. **Propietario:** confirmar pines/cableado/alimentación, conectar/flashear placas cuando no haya acceso del agente y realizar la prueba real. Especificaciones del contexto son requisitos aportados, no hardware ya probado.

**Cierre:** protocolo, simulación y builds de firmware verificados; entradas reales pasan por validación común/bloqueo y no duplican goles al reconectar. La prueba física, ruido y alimentación tienen evidencia propia; un simulador no la sustituye. No definir tensiones/conexiones peligrosas a partir de suposiciones.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 09 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes, incluidos hardware y separación de entradas. Desarrolla protocolo/simulador y firmware incremental para ESP32-S3 y ESP32-C3, con botones Blanco/Azul y sensores según módulos/pines confirmados. No intentes ejecutar React directamente en el ESP32 ni alteres las tres condiciones de victoria. Todas las entradas pasan por validación común y bloqueo; trata rebotes, duplicados y reconexión. Completa programación/builds/pruebas simuladas autónomamente; pide solo datos eléctricos o pasos físicos imprescindibles que no puedas inferir. No afirmes hardware probado sin evidencia. Actualiza contexto/seguimiento, publica la rama de revisión y entrega el siguiente prompt.
```

## Bloque 10 — OTA y administración local

**Agente:** actualización de firmware, estados recuperables, comprobación de integridad y administración local sencilla sobre hardware soportado. **Propietario:** pruebas de corte/reinicio/restauración en el dispositivo real y acceso a red/placa cuando el agente no lo tenga.

**Cierre:** actualización reproducible, rechazo de imagen incorrecta y recuperación/rollback comprobados según capacidad real de la placa; datos preservados; interfaz local con acceso apropiado. No actualizar durante un partido ni habilitar una administración pública por defecto.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 10 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes; comprueba backup y firmware probado de los bloques 08–09. Implementa OTA y administración local sencillas conforme al hardware real, con comprobación de integridad/compatibilidad, progreso, recuperación o rollback soportado y conservación de datos. No actualices durante una partida ni expongas administración sin protección. Completa programación/builds/pruebas independientes y coordina solo pruebas físicas imprescindibles. No actives servicios de pago ni afirmes seguridad frente a cortes sin prueba. Revisa, documenta evidencia/limitaciones, actualiza contexto/seguimiento y publica la rama de revisión. Propón el siguiente bloque de mantenimiento según bugs y uso real, sin abrir otra fase automáticamente.
```

## Plantilla de cierre de cada conversación

```text
Bloque [número/nombre]: [completado / pendiente de verificación concreta].
Qué cambió y qué decisión reemplaza: [...].
Archivos y cambios de base de datos: [...; distinguir preparados de aplicados].
Pruebas ejecutadas y resultado real: [...].
Commit/rama/push comprobado: [...]. Despliegue comprobado: [... o no comprobado].
Pendientes y pasos del propietario, solo si hacen falta: [...].
Documentación actualizada: ESTADO_ACTUAL, contexto pertinente y seguimiento de bloques.
Siguiente bloque recomendado y dependencias: [...].
Prompt completo para empezar la conversación siguiente: [...].
```
