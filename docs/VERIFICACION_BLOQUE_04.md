# Bloque 04 — entrega descriptiva verificada, 2026-10-02

**Decisiones y entrega vigentes — 2026-10-02, v0.4.1.** El propietario aprueba las recomendaciones y concreta 1 contra 2 exclusivamente Rápido/Caos. Sustituye los pendientes históricos de 03/04 de abajo. ELO servidor activado: versión 2, inicio 1200, primeras 10 K40/después K20, nearest-away, categorías Bronce <1000/Plata 1000/Oro 1200/Platino 1400/Diamante 1600/Élite 1800, descenso con histéresis 25, multiplicadores todos 1 y todos los Clasificatorios históricos válidos; máximo reconstruible. No hay suelo ELO ni suma cero garantizada con K distintos.

04 integrado como **análisis descriptivo**, sin índice, pronóstico, porcentajes predictivos ni confianza estimada. H2H de jugador/pareja exactos desde el historial completo confirmado, con perspectivas inversas y filtros del perfil; 1v2/2v1 agrupados como formato 1v2, separados de 1v1/2v2. Forma: últimos cinco Clasificatorios por ID, independiente de filtros, sin rellenar ausencias. Selección permite consultar enfrentamientos del modo elegido y forma de cada participante, solo al abrir el panel; consultas paralelas cancelables, error/offline no bloquean COMENZAR. Perfil reutiliza su lectura existente sin nuevas consultas.

1v2: tres jugadores activos distintos, mismas reglas de victoria/sin ventaja inicial, color del solo seleccionable, XP completo para cada jugador y equipos/posición conservados en copia, recuperación, resultado e historial. Clasificatorio sigue requiriendo 1v1/2v2: rechazo en UI, composición, mapeo, recuperación, estadísticas/XP y servidor/RPC/trigger diferido. `soloTeam` opcional de configuración solo representa equipos; versiones de reglas/checkpoints anteriores intactas. No cambia MatchEngine ni sus reglas de goles/reloj/desempate.

Migración aplicada **20261002140820_casual_1v2_and_approved_elo.sql**: reemplazo acotado de validadores RPC/trigger de equipos y activación ELO aprobada. RLS/grants, locks/idempotencia, cronología, columnas protegidas y vista XP conservados. Sin tablas nuevas ni datos de negocio modificados. Conteos antes/después: dos jugadores/dos Rápidos/cuatro participantes/doce eventos; ambos 225 XP/nivel 1, cero Clasificatorios reales. SQL de 03/04 real con ROLLBACK PASS; ningún Auth/usuario/correo nuevo.

## Verificación de la entrega integrada

- `npm test`: diez grupos correctos, estadísticas/análisis 42, XP 8, ELO/repositorio 14, contratos 04 13.
- TypeScript y builds normal/fixture correctos. Chromium **48/48**, cero fallos u omitidos; recuperación, idempotencia, 1v2 casual, rechazo Clasificatorio, H2H/filtros/forma y consulta prepartido offline. Revisión visual móvil, tablet, escritorio y viewport 800×480. Corregido el panel prepartido para compartir el scroll de jugadores y mantener COMENZAR accesible; regresión focalizada 7/7 y batería completa posteriores correctas.
- `node --import tsx supabase/tests/block04.ts`: SQL real RPC/retry/XP paridad, 1v2 ambos colores, exclusión ELO, rechazo ranked por RPC y trigger, plaza inválida, preservación XP anterior: PASS, ROLLBACK.
- Generador 03 SQL real: paridad/reconstrucción/RLS/políticas, incluida alternativa todos los multiplicadores 1, PASS con ROLLBACK antes de activar.
- Advisors: sin avisos nuevos de funciones/RLS. Se mantienen [WARN Auth histórico](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) e [INFO índice histórico sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). No cambios Auth/planes/índices.
- Browser usa motor y repositorios en memoria, bloquea Supabase; no equivale a navegador autenticado remoto. Perfil conserva límites de paginación sin snapshot transaccional entre dispositivos. Prepartido no mezcla ELO y resultados para calcular previsiones: no existe ese cálculo.
- `npm audit --omit=dev --audit-level=moderate`: cero vulnerabilidades. Publicación en rama de revisión registrada en ESTADO_ACTUAL; sin promoción main.

## Registro histórico de la preparación anterior (sustituido por la entrega de arriba)


**Acceso Vercel posterior resuelto:** tras renovar OAuth, equipo/proyecto visibles, Preview HTTP 200 y despliegue READY c2e217a/revisión. El bloqueo MCP/403 documentado como límite de esta entrega queda superado. No equivale a tener la sesión Supabase del operador; captura humana anterior acredita XP/ELO pendiente de Alex2. Dependencia competitiva de 03 y decisiones de 04 siguen abiertas, sin integración ni activación. Evidencia/estado vigentes en ESTADO_ACTUAL.

**04 espera el cierre competitivo de 03.** No se declara entrega funcional ni se activa análisis/predicción en la aplicación. La petición vigente permite avanzar diseño/pruebas independientes sin aprobar propuestas. Publicación y continuidad operativas en [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md).

## Dependencia comprobada primero

Base remota `fc9277c05f152e7877fac416de52dde1984ae63d` en `codex/reliability-offline-v1`. Checkout inicial `work/900e470` limpio, trabajo previo preservado. Conector GitHub recuperó una fotografía aislada con los 132 blobs verificados por SHA; después, fetch Git real con permiso de red recuperó la historia completa. La rama efectiva de trabajo es `/workspace/MARCADOR-FUTBOLIN-V3`, sobre la punta remota real, no el commit sintético de esa fotografía. `main/900e470` es ancestro y no requiere integración. Sin reset, stash, force push o promoción.

Leídos AGENTS, contexto/estado, README, traspaso, plan y VERIFICACION_BLOQUE_03. La verificación previa registra K/experiencia, redondeo, categorías/histéresis, margen e históricos sin aprobación. No existe una decisión posterior que los cierre en la revisión recuperada.

SELECT en Supabase real confirma `elo_rules_v1.enabled=false`, inicio 1200 y K/experiencia/redondeo/categorías/histéresis/multiplicador NULL. XP sigue activo: tabla aprobada 50 + 100/60/25, victoria clasificatoria +50, prórroga/penaltis +25 único, curva acumulada 0–100 y todos los históricos. Dos jugadores, dos Rápidos, cuatro participantes, doce eventos, cero Clasificatorios/prueba; ambos 225 XP/nivel 1. No se crean cuentas ni resultados. SMTP/plantillas continúan como pendiente externo separado.

## Diseño revisable, todavía sin aprobación

| Elemento | Diseño preparado | Ejemplo concreto |
| --- | --- | --- |
| H2H 1v1 | Perspectiva del jugador/equipo, rivales por ID; solo enfrentamientos directos del formato | A vence a B 3–1: A G/GF3/GC1, B P/GF1/GC3 |
| H2H 2v2 propuesto | Pareja exacta contra pareja exacta; orden y color no cambian identidad; partido contado una vez | A+C contra B+D cuenta; A+D contra B+C no cuenta para esa pareja; A y C compañeros no son rivales |
| Forma aprobada conceptualmente §32 | Últimos cinco Clasificatorios confirmados por jugador, más reciente primero, sin rellenar ausencias | Tres previos G/E/P → muestra 3/5; no añadir dos resultados ficticios |
| Empate/penaltis | Ganador almacenado y validado; goles de campo del equipo, tanda separada | 2–2 y tanda 3–1: G/P, GF2/GC2; empate histórico sin tanda: E/E |
| Identidades/bajas | ID estable, resolver de alias/nombre vigente y fallback ya existentes; conservar bajas en histórico | Dos homónimos mantienen trayectorias diferentes; baja no elimina enfrentamientos |
| Filtros | Reutilizar AnalysisFilter/preparePlayerResults/analyzePlayerResults; H2H usa fechas/formato, modalidad competitiva RANKED | Cambiar formato o rango cambia la muestra H2H; forma prepartido completa se rotula independiente |
| Reconstrucción | Historial confirmado vigente, orden microsegundos/UUID, deduplicación/conflictos previos al filtro | Retry idéntico cuenta una vez; reemplazar/eliminar un fixture cambia los resultados derivados |

No se añaden rival favorito/némesis ni conclusiones sobre rivales con menos de cinco (§25). El prototipo revisa evidencia directa; no implementa clasificación de rivales. Los últimos resultados generales del perfil conservan sus filtros y su comportamiento; no se renombran silenciosamente como forma competitiva.

### Únicas decisiones solicitadas de 04 (§32–33)

1. **Modelo y pesos.** Propuesta: índice comparativo de resultado esperado, no probabilidad, ELO 60/H2H 25/forma 15; resultado G=1/E=0,5/P=0. H2H sería media de esos resultados, forma media de hasta cinco, y en 2v2 media de la forma individual si se aprueba. Ejemplo simulado con muestras válidas: ELO 0,50, H2H 0,60 y forma 0,80 → índice `0,60×0,50 + 0,25×0,60 + 0,15×0,80 = 0,57`. **No significa 57% de ganar.** Alternativas: solo evidencia descriptiva o modelo de probabilidades calibradas con validación previa.
2. **Muestra/confianza.** Propuesta conservadora: no calcular índice antes de cinco H2H y cinco Clasificatorios previos por cada jugador. Mostrar conteos y forma disponible. Los tramos propuestos 5–14/15+ solo describirían cantidad de evidencia, no una precisión medida ni intervalo de confianza. Alternativas: diez H2H o decidir el umbral tras validar datos. No hay redistribución automática de pesos cuando falta una fuente; cualquier fallback requeriría decisión explícita.
3. **2v2.** Parejas exactas y media de forma individual, frente a solo 1v1 inicialmente o combinar duelos individuales con regla aún por concretar. El fixture solo explora la primera propuesta. No multiplicar un partido 2v2 en cuatro observaciones independientes ni mezclar compañeros/rivales.

Estas tres preguntas se presentan al propietario durante esta tarea. **Sin respuesta expresa registrada al preparar esta entrega: continúan pendientes.** No solicitan de nuevo decisiones XP ni aprueban las pendientes de 03. Su aprobación futura tampoco bastaría para activar ELO.

Una expectativa ELO modela puntuación esperada con empate=0,5; no separa victoria/empate/derrota. Si se eligen porcentajes, antes se debe definir el objetivo (tres resultados o victoria tras desempate), aplicar un corte temporal sin fuga de resultados futuros, separar entrenamiento/validación temporal y formatos, medir calibración/error en muestra suficiente y versionar el modelo. No prometer calibración sin esa evidencia; con los cero Clasificatorios reales actuales no se estima ningún porcentaje.

## Arquitectura pendiente de integración

- Referencia pura **solo en `tests/block04Prototype.ts`**, con H2H/forma desde helpers existentes y previsión siempre bloqueada (`probability=null`, `confidence=null`). Ningún import desde `src/`, ninguna ruta activa nueva, pesos o configuración servidor nuevos.
- Maqueta React `tests/block04Review.tsx` únicamente en `/tests/ui-fixture.html?block04=review`, disponible en desarrollo/build aislado. Datos del motor/fixtures ya existentes en memoria; sin Supabase/Auth, escrituras o cola. No forma parte de `dist` ni de la Preview de producción. La baja se muestra como evidencia histórica, no como jugador seleccionable para una nueva partida.
- Tras cerrar 03 y aprobar 04: reutilizar perfil, selección/identidades y repositorios; lectura completa cancelable, invalidar al cambiar cuenta/equipo, refrescar/reconectar o confirmar sincronización. Nunca mezclar cola/checkpoints con partidos confirmados. Un final local pendiente tiene la misma forma de datos que uno guardado: la exclusión depende de **procedencia del repositorio**, no solo status/test_mode.
- Para H2H del perfil basta su lectura completa existente. Para forma de todos los participantes se necesita historial de cada ID, no solo del primer jugador. Lecturas privadas por dueño, sin cachear datos nuevos en el worker ni consultar por gol.
- La lectura paginada existente no promete snapshot transaccional. La futura previsión debe reunir ELO/H2H/forma en una única lectura coherente de servidor (posible envoltura JSON SECURITY INVOKER/RLS que reutilice reconstrucción existente) o detectar cambios y retirar la previsión; no mezclar páginas/versiones sin advertir. Esa RPC es **diseño pendiente**, no creada en este bloque. Sin tablas incrementales/ledger ni administración.
- Offline/error/lectura incompleta: retirar confirmación/previsión, no convertir fallo en muestra cero ni bloquear COMENZAR. No escribir ni conceder XP/ELO desde el prototipo. Resultados históricos conservan sus reglas.

## Pruebas realmente ejecutadas

- Base: nueve grupos `npm test` y build correctos después de instalar dependencias fijadas con `npm ci`. Primeros intentos sin permisos de sockets fallaron EPERM; recuperados con permisos de red/local sockets. No cambios de dependencias/lockfile.
- Entrega: `npm test`, **diez grupos** correctos; 42 estadísticas/análisis, 8 XP, 14 ELO/repositorio y **12 contratos de 04**. Incluyen perspectivas, parejas/color, empates/tandas, cinco clasificatorios, exclusiones, 25 resultados/paginación/cancelación, procedencia sin cola, duplicados/conflictos, identidad/bajas, filtros, edición/eliminación solo de objetos de prueba y microsegundos/zonas/UUID. No escriben a servicios.
- `npm run test:browser`: Chromium **42/42**, cero fallos/omitidos, conserva las 41 regresiones previas. Nueva revisión aislada H2H 11 en 1v1/4 en 2v2, baja/forma, muestra vacía, previsión bloqueada sin porcentaje/confianza, sin peticiones Supabase ni claves de cola/checkpoint. PWA con servidor realmente apagado preservada.
- TypeScript/build normal y aislado correctos. Typecheck explícito del prototipo/tests/maqueta con `tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck --types node ...`; tests no están incluidos en el tsconfig de aplicación. Se corrigieron import del resolver y literal del modo usando sus contratos reales antes de verificar.
- Revisión visual y medidas: 320×568, 390×844, 844×390, 768×1024, 1440×900 y referencia física exacta 800×480. Scroll interno sin scroll general, controles de 48 px, estado vacío y bloqueo legibles. Capturas en `/tmp/futbolin-block04-visual`, fuera de Git. Pulidos botones oscuros/foco/estado activo y etiquetas Blanco/Azul para distinguir homónimos; regresión visual focalizada repetida tras ese cambio.
- Revisión React: hooks incondicionales, derivación de resultados sin efectos/red, keys por ID, texto escapado, estado local limitado a revisión, estilos acotados. Herramienta agent-browser ausente; Playwright/Chromium existentes usados, sin instalar otra dependencia.

## Supabase real y Preview, separados

`supabase/tests/block04_readonly.sql` ejecutado completo mediante conector en el único proyecto autorizado: **PASS**, transacción REPEATABLE READ READ ONLY y ROLLBACK. Comprueba dependencia desactivada, XP aprobado, RLS, vista XP invoker, funciones competitivas invoker/STABLE, permisos privados y ausencia de escritura de configuración/historial, snapshot ELO desactivado para operador existente y aislamiento de otra identidad sin filas. No INSERT/UPDATE/DELETE, migraciones, fixtures SQL, cuentas o correos. Es comprobación de las lecturas/seguridad existentes, no de una RPC de predicción ni login web real.

Documentación RLS/vistas actual consultada por search_docs; changelog HTTP denegado 403, sin bypass. No se cambia esquema, índices, permisos, Auth o planes.

Vercel `web_fetch_vercel_url` al alias protegido devuelve **403 forbidden** en `read_protection_bypass` para `dpl_BRumrJiKffmFjUSaZp7VqmR1Vxse`; `get_project` tiene error de validación del conector (`idOrName`), también con los argumentos documentados. No se retira protección ni se solicita nueva cuenta/partido. Preview autenticada XP/ELO sigue sin observación directa: límite separado de SQL/RLS y UI aislada. Un check GitHub success no acredita ese recorrido ni READY inspeccionado.

## Continuidad exacta

Cerrar decisiones/activación de 03 dentro de su alcance autorizado; registrar después modelo/pesos/muestra/2v2 de 04 y desarrollar/verificar su integración real. No dar 04 por cerrado con esta maqueta. Se prepara 05 con prompt condicionado en [BLOQUES_DESARROLLO.md](BLOQUES_DESARROLLO.md), **sin iniciarlo**; progresión y dependencias previas deben estar estables, y catálogo/recompensas de 05 requieren aprobación propia. Publicar solo esta preparación estable en la misma revisión, sin main, administración, logros, torneos, Google/Drive o pagos.

## Prompt completo del siguiente bloque propuesto

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 en codex/reliability-offline-v1 y trabaja exclusivamente en bloque 05: logros, récords y Hall of Fame. Lee AGENTS.md, contexto/estado, BLOQUES_DESARROLLO y VERIFICACION_BLOQUE_04; sincroniza sin sobrescribir trabajo local ni promover main. ELO de 03 está aprobado/activo; 04 es descriptivo y la previsión fue aplazada por decisión expresa: no reabrir esas decisiones. Conserva XP aprobado, reconstrucción privada desde historial, RLS, idempotencia, motor y formatos: 1v1/2v2 en todos los modos; 1v2 solo Rápido/Caos con XP completo y sin ELO. No repetir cuentas ni partidos del checklist cerrado. Antes de conceder premios extraordinarios, prepara catálogo, umbrales y recompensas con ejemplos concretos para aprobación; avanza diseño y pruebas independientes sin convertir propuestas en reglas. Implementa el catálogo aprobado con identidad estable, premios únicos, recálculo desde hechos confirmados, exclusión de prueba/pendientes y sin atribuir goles individuales. No inventes tiempos/eventos ausentes, administración ni XP ilimitado al actualizar récords. Verifica datos/UI/SQL reales según acceso y distingue fixtures de Preview autenticada. No torneos, Google/Drive, pagos, cambios SMTP ni promoción main. Actualiza contexto, seguimiento, versión y novedades; publica estable en revisión y entrega el siguiente prompt sin iniciar 06.
```
