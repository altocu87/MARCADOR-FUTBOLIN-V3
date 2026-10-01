# Condiciones de victoria — 2026-10-01

Regla vigente AMBAS, corregida expresamente por el propietario: objetivo por equipo para el partido completo, sin reinicio entre partes; final al alcanzarlo o por marcador total al terminar dos partes por reloj. Nuevos partidos V4. GOALS es una única parte sin límite de tiempo y TIME mantiene dos partes por reloj. Las entradas siguientes conservan el historial: la retirada de AMBAS y su interpretación V3 por parte quedaron reemplazadas. Rápido/Caos/Clasificatorio y 1v1/2v2 permanecen.

## Implementación y compatibilidad del bloque inicial

- MatchEngine independiente: GOALS V2 cuenta por equipo, reloj ascendente, duración inicial cero, final directo sin descanso. Fin de parte/prórroga/penaltis forzados no alteran este formato. El bloqueo central de tres segundos continúa vigente.
- TIME: dos partes de la duración seleccionada, goles acumulados, fin por reloj. Se conserva el desempate previo: prórroga de 60 segundos/gol de oro y penaltis. No se ha solicitado cambiar los empates ni el significado de minutos por parte.
- Undo del gol decisivo reabre el juego en la misma parte; no incorpora la espera del final ni anula el plazo de bloqueo. Limpia el resultado de periodo obsoleto.
- Checkpoint V2 exige `config.rulesVersion=2`. V1 ausente/1 conserva reglas anteriores y vuelve a exportarse V1 incluso después de recuperar varias veces. Validación precede toda mutación y rechaza mezclas de versiones o fases/resultado incompatibles de GOALS V2.
- El envoltorio local ActiveMatchStore sigue V1 y acepta ambas versiones del checkpoint. IDs/journal/cola y entrega durable siguen sus contratos. Un final recuperado produce exactamente el mismo documento.
- `metadata.rulesVersion` del evento inicial distingue resultados nuevos en el historial. El esquema admite esos metadatos: sin migraciones/RPC/tablas nuevas. FIRST_HALF sigue como identificador interno compatible y se presenta como ÚNICA PARTE. `engine_version` SQL sigue el valor anterior; no representa la nueva versión de reglas/checkpoint. `time_limit_seconds` sigue obligatorio/compatible, pero no limita GOALS ni se presenta como duración de este formato.
- No se modifican resultados previos ni pendientes. Historial antiguo por goles indica REGLAS ANTERIORES; nuevas configuraciones ofrecen únicamente dos condiciones. Recuperación antigua por goles identifica sus reglas anteriores en el marcador.
- La revisión final corrigió también el texto de la oferta de recuperación V2 (ÚNICA PARTE y objetivo) y conservó reloj descendente en una prórroga de GOALS antiguo, que sí tiene límite temporal.

## Comprobaciones ejecutadas

- `npm test`: siete grupos correctos; estadísticas/análisis 41/41, cero omitidas.
- `npm run test:browser`: TypeScript/build normal y build aislado correctos; Chromium 13/13, cero omitidas y ningún pageerror.
- Motor: objetivos por equipo para ganadores blanco y azul, 2–2 continúa con objetivo 3, diez minutos sin final temporal, pausas, final directo, rechazo de entradas posteriores, anulación/refinal sin sumar descanso. TIME permite superar el objetivo irrelevante de goles y termina 2–1 tras 120 segundos de juego acumulados.
- Recuperación: GOALS V1 termina parte con goles sumados y pasa a segunda parte; vuelve a exportarse V1. Partido siguiente usa V2. GOALS V2 recupera en pausa a 90 segundos tras 24 horas cerrado y termina por objetivo; documento final idéntico después de recuperar. Copias incompatibles rechazadas sin mutación parcial.
- Persistencia/estadísticas: único periodo y meta de reglas, marcador final, goles anulados conservados en journal, 1v1/2v2, ganador y perfil. Reintentos/pending/historial sin duplicados; modo prueba sin cola/checkpoint.
- Navegador: GOALS sigue PLAYING a 10:00, 1–1 con objetivo 2 permanece abierto, termina 2–1 y guarda/detalla una única parte. TIME dos partes de un minuto, acumulado 2–1, detalle con duración pertinente. También regresiones de acceso protegido, recuperación 2v2, perfiles/filtros y PWA con servidor apagado.
- UI nueva sin scroll general a 320×568, 390×844 y 800×480; revisión visual de configuración/marcador. Capturas temporales fuera de Git: `/tmp/futbolin-single-goal-period.png`, `/tmp/futbolin-two-game-rules.png`. La suite conserva sus comprobaciones tablet/escritorio/vista física.

Las pruebas de navegador usan el build aislado y repositorios en memoria; tráfico Supabase bloqueado. El mensaje PARTIDO GUARDADO EN SUPABASE de esa fixture no acredita una escritura real. Las pruebas de reloj usan avance controlado de Playwright, sin esperar diez minutos reales. Los SQL de integridad existentes se revisaron: no exigen dos periodos ni `period_end`; no se ejecutaron contra el proyecto remoto en este bloque.

## Evidencia humana y límites

El propietario comunica login y prueba satisfactorios en la Preview real. Se registra como evidencia reportada; el agente no inspeccionó la sesión ni filas/RPC y no declara cubiertos todos los casos de cierre de fase B. No se pidieron contraseñas ni se crearon cuentas.

Los tests/build locales y un push no prueban el despliegue de Vercel. Git puede generar Preview automática de esta rama; no se ha promovido main/producción. Instalación PWA física y comprobación remota de la nueva regla quedan pendientes. Al estar publicada, cerrar/reabrir el marcador sin borrar datos y crear un nuevo partido POR GOLES: con objetivo 3, 2–1 debe continuar y 3–1 debe mostrar el final sin segunda parte. Las partidas antiguas por recuperar mantienen sus reglas para no cambiarlas a mitad de juego.

## Histórico AMBAS V3 — interpretación errónea, reemplazada

El agente interpretó incorrectamente la petición como objetivo por parte. Las comprobaciones siguientes describen V3, no la regla vigente ni una decisión aprobada del propietario.

Base `a19dfc5`. El agente restauró AMBAS con esta interpretación errónea: cada parte termina cuando un equipo alcanza el objetivo de esa parte o vence el tiempo; gana quien tenga más goles sumados después de las dos partes. Ejemplo 5 minutos/5 goles: primera 5–4, segunda 0–5 → Azul 9–5. No se cuentan victorias de parte. Empate total mantiene prórroga/gol de oro y penaltis existentes.

- MatchEngine: para AMBAS V3 cuenta goles activos por equipo en el periodo actual. Objetivo y reloj se reinician en segunda parte; acumulado visible se conserva. Cierre por goles publica PERIOD_END, no MATCH_END en primera parte. Correcciones/anulaciones siguen usando goles activos y bloqueo central.
- UI: tres condiciones, GOLES POR EQUIPO Y PARTE y DURACIÓN DE CADA PARTE en AMBAS. Junto al reloj se muestra PARCIAL y META; los números grandes siguen siendo el total. Historial presenta objetivo/tiempo por parte y resultado acumulado.
- Checkpoint/reglas V3 exclusivamente para AMBAS nuevo; GOALS/TIME mantienen V2. Validación acepta 1/2/3, verifica configuración y metadatos iniciales V3. AMBAS V1/V2 mantiene suma histórica por parte tras recargas. El contenedor local, IDs, colas, hash de documentos previos y contratos SQL no cambian. Sin migraciones ni modificación de datos remotos.
- `npm test`: siete grupos correctos, estadísticas/análisis 41/41. Motor prueba 3–2 que continúa con objetivo 5, dos cierres por goles y final 5–9, dos cierres por reloj y final 4–2, parcial reiniciado aunque el acumulado supera el objetivo. Recuperación compara V2/V3, cierre de 24 horas excluido del reloj, segunda parte y documento final idéntico.
- `npm run test:browser`: TypeScript/builds normal y aislado correctos, Chromium 14/14, sin omitidos/pageerror. AMBAS con objetivo 2/minuto: 1–1 continúa; primera 2–1, segunda 0–2 con recarga y checkpoint V3; final Azul 3–2 y detalle coherente. También se conservan los recorridos GOALS/TIME, pendientes, perfiles, protección y PWA.
- Configuración comprobada en 320×568, 390×844 y 800×480 sin scroll general; captura local revisada `/tmp/futbolin-combined-configuration.png`, fuera de Git. Primer intento de navegador encontró una aserción sobre AMBAS después de abandonar la configuración: eliminada esa comprobación de la pantalla incorrecta, preservando el recorrido específico que selecciona AMBAS y verifica sus reglas. TypeScript detectó una lectura nullable de configuración tras reemplazar estado: corregida con acceso seguro antes de repetir build.

Datos de navegador aislados/en memoria; no es Auth, RPC ni despliegue Vercel real. Cuando la nueva Preview esté disponible, crear AMBAS nuevo y comprobar parciales y total en ambas partes. Las copias antiguas siguen sus reglas, sin reinterpretarlas durante una partida.


## Corrección vigente AMBAS V4 — 2026-10-01

Base `472f945`. Motor compara el objetivo contra goles acumulados de cada equipo, no goles de la parte. Alcanzarlo termina el partido directamente en primera o segunda parte. Si no, el reloj cierra ambas partes y gana quien tenga más goles totales; empate conserva prórroga/gol de oro/penaltis.

UI muestra GOLES PARA GANAR EL PARTIDO y OBJETIVO TOTAL. Historial distingue V4 y marca V3 como reglas anteriores. Checkpoints admiten 1/2/3/4, con versiones/metadatos coincidentes; V4 rechaza partes abiertas con el objetivo ya alcanzado. Copias antiguas y contratos/colas/IDs/SQL conservados; sin migraciones ni reescritura de datos.

`npm test`: siete grupos correctos, estadísticas/análisis 41/41. Motor prueba Blanco/Azul, total entre partes (3–2 y dos goles más → 5–2), final por reloj 4–2 sin alcanzar objetivo, final por goles en primera parte, bloqueo al deshacer y recuperación histórica. Recuperación V4 conserva objetivo global después de 24 horas, final/documento idempotentes y validación de corrupción. TypeScript/builds normal y aislado correctos; Chromium 15/15, sin omitidos ni fallos. Browser verifica 3–2 en primera parte, 4–2 acumulado en segunda, recarga V4 y gol final 5–2 con detalle coherente; objetivo 2 alcanzado en primera termina 2–1 directamente. Se revisaron las capturas de configuración y objetivo total en /tmp, fuera de Git; configuración sin scroll general a 320×568, 390×844 y 800×480. También probado por motor 3–0 en primera y 0–4 en segunda → total 3–4, sin empate por victorias de parte. Fixtures sin Supabase real; despliegue remoto no verificado.


## Formulación definitiva GOALS sin partes — 2026-10-01

Sobre `4e840b5`: etiquetas de configuración, marcador, recuperación e historial dejan de describir GOALS como «única parte». Presentan partido sin partes, objetivo por equipo y cronómetro ascendente sin límite. Comportamiento y contratos GOALS/TIME V2 y BOTH V4 conservados. FIRST_HALF sigue siendo un identificador interno histórico de persistencia, sin transición de parte en GOALS. Las entradas anteriores registran las etiquetas que existían entonces, no la presentación vigente. npm run test:engine correcto: empate natural TIME/BOTH después de ambas partes, prórroga/gol de oro y penaltis tras agotarse la prórroga. npm run test:browser: TypeScript/builds normal y aislado correctos, Chromium 15/15 sin fallos ni omitidos. GOALS a 10:00 sin fin por reloj y detalle/recuperación sin etiquetas de partes; captura del marcador revisada en /tmp. Pruebas aisladas, no despliegue remoto.
