# Condiciones de victoria — 2026-10-01

Petición explícita del propietario, sobre `89e7981` en `codex/reliability-offline-v1`: POR TIEMPO en dos partes, gana quien marca más; POR GOLES hasta que un equipo alcanza el objetivo, única parte sin límite de tiempo. Reemplaza GOALS sumado por periodo y retira AMBAS de la configuración nueva. Rápido/Caos/Clasificatorio y 1v1/2v2 permanecen.

## Implementación y compatibilidad

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
