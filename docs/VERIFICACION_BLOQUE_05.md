# Bloque 05 — aprobado/activo v0.5.3, 2026-10-02

Aprobación expresa registrada en ESTADO_ACTUAL y CATALOGO_BLOQUE_05: XP V2 por tier,
históricos/recálculo, ocho récords/Hall privados, empates compartidos, 0 XP por récord.
No quedan decisiones funcionales de 05. Implementación 06 no iniciada; su preparación
documental posterior se verifica en [VERIFICACION_BLOQUE_06.md](VERIFICACION_BLOQUE_06.md). Las secciones anteriores
de v0.5.2/0.5.1/0.5.0 conservadas debajo son históricas: sus prompts no son vigentes.

## Implementación y migración realmente aplicada

- Sincronización explícita main/revisión sobre `837f3e7`, árbol limpio, 0/0.
- `20261002161602_approved_block05_honours_xp_v2.sql`, aplicada mediante conector
  solo a `unemjyfhzljcdjcbiiwh`; `list_migrations` confirma versión/nombre.
  Sin CLI Supabase disponible; no db push ni repetir versiones históricas.
- Tres vistas SECURITY INVOKER: perspectivas/rachas completas, 45 tiers por jugador
  con primera evidencia y XP único, XP total con base_xp/achievement_xp añadidos
  conservando el contrato anterior. No tablas/ledgers/counters ni escrituras de XP.
- RPC scalar `get_honours_snapshot_v1`, STABLE/invoker/search_path vacío, solo
  authenticated, sin paginación/cap PostgREST. Una lectura completa de cuenta,
  incluidos inactivos, badges/records/evidencia/XP y ELO aprobado sin alterarlo.
- Repositorio tipado valida cuenta, integridad, 45 tiers, evidence, XP exacto y
  coherencia de marcas; falla sin ceros/lecturas parciales. Tipos remotos regenerados.
- Perfil presenta XP base/logros, tiers/evidencia y ocho récords; navegación
  HISTORIAL → HALL, empates por fracción exacta, alias actual y bajas.
  AbortController e identidad/revisión invalidan lecturas tras cambios/sync;
  no storage nuevo ni consultas por gol. Revisados hooks/keys/accesibilidad React.

## Verificación independiente y SQL real

- Once grupos `npm test`, contratos 05: 15 históricos + 6 badges + 6 aprobados.
  Typecheck explícito fixture/repositorios/tests/generador SQL correcto.
  Builds normal/aislado y diff-check correctos. **Chromium completo 57/57**, cero
  fallos/omitidos (131 s); revisión focalizada final **6/6** tras mejora de capturas
  y referencia física del perfil aprobado. Capturas inspeccionadas móvil 390×844
  (perfil/Hall) y física 800×480, controles/scroll sin desbordamiento; también
  medidos 320×568, 800×480 y 1440×900. Sin errores JS.
- Fixtures `honours=active/error`, nunca importados por build normal: XP desglosado,
  tiers, récords/Hall con bajas/empates/sin historial, filtros/refresco, offline,
  fallo, navegación/cierre de sesión, pendiente→sync una vez y prueba excluida.
  Tráfico Supabase bloqueado; no login/cuentas/partidos reales.
- SQL **PASS**: invoker/RLS/permisos/retry/desglose instalados y **19 escenarios**
  contra las consultas SELECT exactas extraídas de la migración, sustituyendo solo
  tablas por JSON/CTEs. Incluye 250 históricos, corrección/eliminación/retry,
  1v2 Caos sin ELO, microsegundos, vacío/prueba, prórroga/tanda/empate y fronteras
  de goles hasta 1000. Compara tiers/primera evidencia/fechas/XP/records/empates
  de partidos con referencia TS. ELO en fixtures usa referencia aprobada; su RPC
  instalada/configuración se verifican aparte, sin reescribir ni activar otra regla.
- Script reproducible `supabase/tests/block05_approved.ts`: REPEATABLE READ,
  READ ONLY, ROLLBACK. Sin INSERT/UPDATE/DELETE/DDL/Auth ni partidos nuevos.
  Correcciones sintéticas no implementan administración. Los fallos iniciales
  del arnés (rol heredado y precedencia JSON) corregidos; ejecución final PASS.
- Datos reales intactos: 2 jugadores/2 Rápidos/4 participantes/12 eventos,
  0 Clasificatorios. Lectura bajo rol authenticated, identidad existente simulada
  solo en transacción: ambos **225 XP base + 100 logros = 325 XP, nivel 2**, cuatro
  estrellas, 2 confirmados. Consulta SQL no equivale a inicio de sesión en Preview.
- El mapper TypeScript aplicado también al snapshot SQL real valida ambos jugadores:
  325 XP, base 225, logros 100, nivel 2, cuatro estrellas. Solo lectura, sin sesión web.
- Advisors sin problemas nuevos de RLS/vistas: aviso Auth histórico
  [protección de contraseñas filtradas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
  e INFO histórico [índice events_owner_idx sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).
  No se cambia Auth ni se elimina índice fuera de 05.

## Publicación y observación autenticada

**Publicación funcional comprobada:** `3e9f61814f507b6704cd9479045c6aa4651f8434`,
push fast-forward 837f3e7→3e9f618 en `codex/reliability-offline-v1`, referencia
remota coincidente; main intacta `900e470a719bc99bee4df853f0e11301a5b6562e`.
Vercel `dpl_3WGacRJm8WZF5W3vf8UYjbFi8qUX` **READY**, commit/rama correctos,
Preview, target null. [Preview v0.5.3](https://marcador-futbolin-v3-3sdqjkdww-altocuvlc-9686s-projects.vercel.app/)
HTML/bundle **HTTP 200** mediante conector autorizado; `index-BoENQV3h.js`
coincide exactamente con build local, 365801 caracteres, versión 0.5.3, RPC de
honores/Hall activo y sin fixture. No sesión web Supabase del operador ni
recorrido autenticado real. Esta anotación documental se publica después con
el mismo código, sin acreditar de antemano READY de su propio commit.


Sin sesión web Supabase del operador accesible al agente. Al abrir el build v0.5.3
en la sesión habitual, comprobar únicamente perfil existente (Alex2 o Vicky):
325 XP/nivel 2, desglose 225 + 100, cuatro estrellas y ocho récords; desde HISTORIAL,
Hall privado compartido en partidos/victorias/racha. Sin ELO elegible ni porcentaje
hasta disponer de Clasificatorios/20 partidos. No crear cuentas/partidos ni reabrir 01.
Esta observación humana queda pendiente según acceso; código/UI aislada/SQL y
READY del deployment se informan por separado.

## Siguiente conversación

[Prompt completo de propuesta 06](PROMPT_SIGUIENTE_BLOQUE.md), sin ejecutar 06 ahora.
Formato/equipos/byes/empates/premios/elegibilidad de torneo pendientes de decisión
propia. No volver a solicitar aprobación XP V2/Hall ni iniciar servicios excluidos.

---

# Registro histórico — revisión v0.5.2, sustituida por v0.5.3

**No cerrado; pendiente de decisión expresa de XP V2 y récords/Hall.** La petición
vigente mantiene ese requisito. Dos preguntas concretas enviadas durante el
trabajo: mantener 0 XP extra o aprobar V2 (incluidos históricos/recálculo); aprobar
los ocho récords/Hall o aplazarlos expresamente. Sin respuesta registrada. No se
activa catálogo propuesto ni se interpreta el silencio como decisión. 06 no iniciado.

## Cambio verificable de esta continuación

La maqueta anterior dejaba los importes por tier a 0, por lo que su XP propuesto
no permitía valorar V2. `tests/block05Prototype.ts` ahora centraliza la propuesta
25/25/50/75/100; `block05Review.tsx` muestra total y desglose por identidad del tier.
45 identidades únicas, máximo 275 por familia y 2475 total. Todo únicamente en
fixture aislado; `grantedExtraXp=0`, sin funciones SQL nuevas, proyección XP,
migración/escritura, caché privada, llamada remota o modificación del motor.
Producción conserva nueve familias/45 estrellas y 0 XP extra. El build normal
solo cambia versión/novedades 0.5.2, nunca importa la propuesta ni la maqueta.

Dos contratos nuevos verifican importes y ejemplos: primer Rápido 3–0 propone
+100 (cuatro tiers 1), goles 4→50 añade solo +75 (tiers 2/3), retry y recálculo.
Dos expectativas antiguas de 0 XP propuesto quedan sustituidas. Para comprobar
que mejorar un récord no añade XP se edita el marcador sin añadir simultáneamente
una tercera victoria que cruza el tier 2 de racha; todos los premios concedidos
siguen siendo 0. Tests de versiones cuentan entradas desde la fuente actual.

## Verificación realizada en esta sesión

- Sincronización: checkout limpio `work/900e470`, rama local f9ebe15. Fetch genérico
  solo main; fetch explícito de revisión recupera 3dffdaa, 0 commits locales/41
  remotos, integración fast-forward. Ningún reset/stash/sobrescritura ni promoción.
- Baseline once grupos `npm test` y build correctos. EPERM inicial del socket
  IPC de tsx resuelto ejecutando con permiso de red/sockets, sin cambios de código.
- `npm run test:block05`: **15/15 propuesta + 6/6 módulo activo**; typecheck
  explícito de referencia, componente/fixture/tests y generador SQL correcto.
  Builds normal/aislado correctos. Dependencias intactas, package/lock 0.5.2.
- Chromium focalizado **7/7**, incluidos revisión/desglose, estados, versiones,
  perfil/filtros/offline, conflictos y pendiente→sync/prueba. Repositorios en
  memoria y peticiones Supabase bloqueadas, sin sesión/filas reales.
- Capturas revisadas de revisión 390×844 y perfil físico 800×480; batería mide
  también 320×568/844×390/768×1024/1440×900. Scroll interno, controles ≥48 px,
  sin scroll general ni errores de ejecución. Capturas temporales fuera de Git.
- `agent-browser` ausente: Playwright/Chromium existentes, sin instalar dependencia.
  React: hooks incondicionales, estado limitado a revisión, keys por identidad,
  texto escapado y ningún efecto/almacenamiento nuevo.
- `npm audit --omit=dev --audit-level=moderate`: **0 vulnerabilidades**.
  Changelog Supabase bloqueado CONNECT 403, sin eludir política; documentación
  vigente de vistas SECURITY INVOKER/RLS consultada mediante search_docs.
- Generador SQL actualizado automáticamente por sus importes de propuesta:
  **19 escenarios PASS** en Supabase real `unemjyfhzljcdjcbiiwh`, REPEATABLE READ
  READ ONLY/ROLLBACK. Compara badges/métricas/evidencias/XP propuesto y 0 concedido,
  récords propuestos, RLS/permisos y XP/ELO aprobados. Solo JSON/CTEs, ningún
  INSERT/UPDATE/DELETE/DDL, cuenta/partido nuevo o migración. No prueba una RPC
  de premios. SELECT posterior: 2 jugadores/2 Rápidos/4 participantes/12 eventos,
  0 Clasificatorios, ambos XP 225/nivel 1/2 partidos, igual que antes.
- Preview base comprobada por conector Vercel: 3dffdaa, rama correcta,
  `dpl_498wmXCUGob8x9tupXKd7V45M2ND` READY y alias protegido HTTP 200,
  `index-DrgevwC6.js`. Esto acredita publicación del build base; sin sesión
  Supabase del operador ni observación autenticada de 05. No retirar protección.

**Batería final Chromium 53/53**, cero fallos/omitidos (114 s); once grupos
`npm test` finales correctos. Incluye servidor PWA realmente apagado.
Publicación funcional comprobada a continuación. SQL y
fixtures no sustituyen el perfil real. Para la observación autenticada usar
jugador/historial existente, sin repetir cuentas/partidos del checklist cerrado.

**Publicación funcional comprobada:** `0ca87ac94f2518cb98f511c861cc0f7e6bbf8db0`,
push fast-forward 3dffdaa→0ca87ac en `codex/reliability-offline-v1`, `ls-remote`
coincidente y árbol limpio. Main intacta `900e470a719bc99bee4df853f0e11301a5b6562e`.
GitHub Vercel success; `dpl_8MPkb9z1Xxr9qoeARUKCZF85xBEt` READY, commit/rama
correctos. [Preview v0.5.2](https://marcador-futbolin-v3-c73xlp7b2-altocuvlc-9686s-projects.vercel.app/)
HTML/bundle HTTP 200; `index-CwpNJxy4.js` coincide exactamente con build local,
versión 0.5.2 y sin fixture. Sin sesión Supabase del operador ni recorrido
web autenticado de 05. Esta anotación se publica después con el mismo código;
no acredita de antemano el despliegue de ese commit documental.

## Prompt efectivo para la siguiente conversación: completar 05

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 en codex/reliability-offline-v1 y completa
exclusivamente 05. Lee AGENTS y contexto, estado, seguimiento, catálogo y
VERIFICACION_BLOQUE_05 vigentes; sincroniza sin sobrescribir trabajo local.
v0.5.2 conserva nueve familias/cinco tiers/45 estrellas de v0.5.1, identidad
cuenta/jugador/familia/ordinal e historial confirmado completo; excluye prueba,
pendientes e incompletos. La propuesta XP V2 25/25/50/75/100 y ocho récords/Hall
está desglosada/verificada solo en fixture; concedido 0, ninguna aprobación
registrada. Usa las respuestas expresas posteriores si existen; si faltan,
solicita únicamente mantener 0 o aprobar V2 con históricos/recálculo y aprobar
o aplazar Hall, sin activar propuestas ni declarar cierre. Con aprobación XP,
deriva contribuciones únicas en servidor bajo RLS, desglose y recálculo desde
hechos vigentes; no alteres XP base/curva. Hall aprobado: privado, todos los
líderes empatados, 0 XP por récord, alias/bajas por UUID, porcentaje exacto con
mínimo 20 y ELO solo con Clasificatorio. Conserva XP/ELO aprobados, RLS,
idempotencia, motor y 04 descriptivo. 1v1/2v2 todos los modos; 1v2 solo Rápido/Caos,
XP completo y sin ELO. No atribuyas goles individuales ni inventes tiempos.
Verifica código/UI/SQL según acceso, distinguiendo fixtures de Preview autenticada;
usa perfil/histórico existentes, no repitas cuentas/partidos del checklist cerrado.
Actualiza contexto, seguimiento, versión/novedades; publica en revisión y entrega
prompt condicionado al cierre real de 05. Sin iniciar 06, torneos, administración,
pagos, Google/Drive, SMTP ni promoción main.
```

La propuesta de prompt 06 conservada al final sigue condicionada al cierre de 05.

## Registro histórico v0.5.1

# Bloque 05 — logros progresivos, v0.5.1, 2026-10-02

Petición vigente implementada: una familia que sube de nivel con estrellas/tiers,
en lugar de tarjetas separadas. El propietario fija goles 1/5/50 y delega otros
escalones y familias accesibles. Nueve familias/cinco niveles (**45 estrellas**)
en PERFIL → LOGROS. La recompensa activa es la estrella; **0 XP extra**.
Recompensas V2 y récords/Hall siguen en [CATALOGO_BLOQUE_05.md](CATALOGO_BLOQUE_05.md)
para aprobación. 05 no cerrado; 06 sin iniciar. ELO activo/04 descriptivo intactos.

## Implementación y fuentes

- `src/achievements/catalog.ts`: nueve familias, cinco umbrales ascendentes.
  `rebuild.ts`: reconstrucción por cuenta/jugador/familia/ordinal del tier;
  metadato `tiers-v2` no cambia identidad. Una recarga/retry no añade estrellas.
- `AchievementsPanel` y `AchievementCards`: estrellas, nivel actual, siguiente
  objetivo/lo que falta, todos los umbrales y evidencia fecha/UUID. Una tarjeta
  por familia, nivel 0 y estado máximo 5/5. Texto React escapado, keys estables,
  hooks incondicionales, cálculo memoizado por historial/cuenta/jugador.
- StatisticsScreen reutiliza todas las páginas confirmadas bajo RLS. Sin consulta
  adicional ni contador persistido; filtros no cambian logros. Sin red/error o
  lectura parcial se ocultan cifras, sin confirmar ceros falsos. Actualización,
  cuenta/jugador, reconexión y sync reutilizan invalidación/cancelación existente.
  Conserva también las páginas originales antes de deduplicar PlayerResult, para
  detectar conflictos en banderas de prórroga/tanda que no alteran el marcador.
- Prueba/pendientes/checkpoints fuera; 1v2 Rápido/Caos sin ELO, compañeros comparten
  goles de equipo. Penaltis deciden victoria sin inflar goles; 0–0 por tanda no
  cumple victoria a cero. No tiempos jugados ni goles individuales inventados.
- No migraciones, funciones SQL nuevas, permisos, escrituras, tablas/columnas de
  premio ni extensión del XP. Cliente presenta badges, no concede experiencia.
  Correcciones futuras recalculan estrellas desde hechos vigentes. Motor intacto.
- Fixtures usan el componente real y catálogo actual; récords/Hall son propuestas
  solo en tests. `approved=false` en reviewHonours se refiere a esa revisión mixta,
  no niega la petición aprobada de estrellas. Todas sus contribuciones XP son 0.

## Evidencia de esta entrega

Base `1712e7dcded478f0dfe359d45cc4c1a78195417d`, rama correcta y árbol limpio.
Fetch explícito de revisión/main sin sobrescribir, referencias revisión 0/0;
main `900e470a719bc99bee4df853f0e11301a5b6562e`, sin promoción.

- `npm test`: once grupos correctos; ejecución explícita de los contratos 05
  **13/13 de revisión + 6/6 del módulo activo**. Fronteras exactas, saltos de varios
  niveles, IDs, cuenta/jugador, primera evidencia, retry/recarga, prueba/procedencia,
  racha/empate, 2v2/1v2, conflictos, edición/eliminación y 0 XP extraordinario.
- TypeScript/build normal y fixture correctos. Typecheck adicional de tests,
  componente/maqueta y generador: `npx tsc --ignoreConfig --noEmit --strict
  --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx
  --skipLibCheck --types node,vite/client tests/block05Prototype.ts tests/block05Review.tsx
  tests/block05.test.ts tests/achievements.test.ts supabase/tests/block05.ts tests/uiFixture.tsx`.
- Chromium: los recorridos nuevos del perfil verifican filtros independientes,
  refresco, baja, pendiente → sync sin duplicar y prueba sin avance. El escenario
  de error del perfil comprueba ausencia de tarjetas. Fixture de revisión verifica
  nueve familias, cinco tiers/estrellas, estados y Hall propuesto, sin Supabase.
- Visual: capturas revisadas del perfil móvil 390×844 y fixture, mediciones a
  320×568/390×844/844×390/768×1024/1440×900/800×480. Scroll interno y controles
  de niveles ≥48 px. Evidencia temporal `/tmp/futbolin-block05-visual`, fuera de Git.
  Playwright/Chromium existentes, sin nueva dependencia. Perfil real de la app
  en fixture también abierto en referencia física exacta 800×480, captura
  `/tmp/futbolin-block05-visual/profile-physical.png`.
- Primer recorrido focalizado detectó una expectativa errónea del test: actualizar
  desmonta las tarjetas durante carga y cierra sus detalles abiertos. Corregida
  la comparación para medir estrellas/progreso, sin exigir ese estado transitorio.
  No se alteraron hechos ni premios para hacer pasar la prueba.
- Al ampliar el typecheck a la fixture completa se añadieron sus tipos ambiente
  `vite/client` para ImportMeta.env y CSS; no cambios de producción por ese ajuste.
- `npm audit --omit=dev --audit-level=moderate`: 0 vulnerabilidades. Diff/enlaces,
  84 apartados del contexto y metadatos package/lock coherentes.

## SQL real y datos

Único proyecto autorizado `unemjyfhzljcdjcbiiwh`. Generador actualizado
`supabase/tests/block05.ts`: **19 escenarios PASS** en REPEATABLE READ READ ONLY
con ROLLBACK. Incluye fronteras goles 1/4/5/49/50/249/250/999/1000, escenarios
base/retry/editado/eliminado/vacío, casual1v2, microsegundos, 25 partidos,
pendientes/práctica excluidos y prórroga/tanda. Compara 45 tiers, progreso y primera
evidencia, métricas y seis récords propuestos no ELO. No prueba una RPC nueva.

SQL de seguridad conserva XP/ELO aprobados activos, RLS/SECURITY INVOKER/permisos
y aislamiento de otra identidad. Rol de operador existente simulado en SQL,
sin crear Auth/partidos y sin login de navegador. Fixtures únicamente JSON en
variables/CTEs, ningún INSERT/UPDATE/DELETE/DDL. SELECT posterior: **2 jugadores,
2 Rápidos, 4 participantes, 12 eventos, 0 Clasificatorios; 225 XP/nivel 1 ambos**.
No repetir cuentas/partidos del checklist cerrado ni tocar SMTP/Google/Drive/pagos.

## Publicación y límites de Preview

Primera batería completa Chromium **52/52**, cero fallos/omitidos (200 s),
incluida reapertura PWA con servidor realmente apagado. Una revisión posterior
conservó las páginas originales para detectar banderas contradictorias antes
de deduplicar; añade un tercer recorrido del perfil. **Batería final 53/53**, cero fallos/omitidos (193 s), con regresión de banderas
contradictorias y perfil físico expandido. Once grupos npm test, typecheck y ambos
builds finales correctos. Publicación se registra al comprobarla.
Vercel protegido HTTP/READY demuestra despliegue, no sesión Supabase del operador.
No se dispone de esa sesión; la UI nueva se verifica con repositorios en memoria.
Para observación autenticada pendiente usar un perfil/histórico existentes; no
pedir otra cuenta ni partidos nuevos. No retirar protección ni promover main.

**Publicación funcional comprobada:**
`e1ca891cb1a79d4845c69ac9e65b9f34557e1110`, push fast-forward
1712e7d→e1ca891 en `codex/reliability-offline-v1`, `ls-remote` coincidente y árbol
limpio tras commit. Main intacta `900e470a719bc99bee4df853f0e11301a5b6562e`.
Vercel `dpl_2itmSF16318uDPN3h5hLK8N4AN3m` READY, commit/rama correctos;
[Preview de logros por niveles](https://marcador-futbolin-v3-12g5tf9tm-altocuvlc-9686s-projects.vercel.app/)
HTTP 200. HTML sirve `index-DrgevwC6.js`, coincidente con build local; bundle
HTTP 200 con versión 0.5.1, catálogo tiers-v2 y tarjetas de estrellas, sin fixture.
Sin sesión del operador ni recorrido autenticado del nuevo panel. Esta anotación
se publica después sin modificar código/versión, y puede generar otra Preview.

## Prompt histórico v0.5.1: sustituido por el efectivo de arriba

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 en codex/reliability-offline-v1 y trabaja
exclusivamente en completar bloque 05. Lee AGENTS.md, docs/CONTEXTO_MAESTRO.md,
docs/ESTADO_ACTUAL.md, docs/BLOQUES_DESARROLLO.md, docs/CATALOGO_BLOQUE_05.md y
docs/VERIFICACION_BLOQUE_05.md. Sincroniza sin sobrescribir trabajo local ni
promover main. v0.5.1 ya implementa nueve familias con cinco tiers/45 estrellas
en PERFIL → LOGROS desde historial confirmado completo, independiente de filtros.
Conserva esa identidad cuenta/jugador/familia/ordinal y reconstrucción; prueba,
cola e incompletos excluidos. No rehagas estrellas como 45 tarjetas separadas.
XP extraordinario activo 0; propuesta V2 25/25/50/75/100 por tier y ocho récords/Hall
siguen pendientes de aprobación. Prepara cualquier ajuste concreto y comprueba
si hay decisión expresa posterior antes de integrar recompensas o reglas de Hall.
Avanza pruebas independientes. Si se aprueba XP, deriva en servidor bajo RLS,
contribución única por tier y recálculo desde hechos vigentes, con desglose y sin
alterar XP base/curva aprobados. Récords propuestos 0 XP y empates compartidos.
ELO aprobado/activo y 04 descriptivo, sin pronósticos. 1v1/2v2 todos los modos;
1v2 solo Rápido/Caos, XP completo y sin ELO. Conserva motor/RLS/idempotencia;
no atribuyas goles individuales ni inventes tiempos. Verifica código/UI/SQL
según acceso, distingue fixtures de Preview autenticada; utiliza perfil existente,
no repitas cuentas/partidos del checklist cerrado. Actualiza contexto/seguimiento,
versión/novedades, publica en revisión y entrega prompt condicionado de 06.
Sin torneos, administración, pagos, Google/Drive, cambios SMTP ni promoción main.
```

## Registro histórico de preparación v0.5.0

Las pruebas y publicación siguientes corresponden a v0.5.0; sus 24 tarjetas y
recompensas V1 quedan sustituidas por el catálogo actual, sin haberse concedido.

# Bloque 05 — preparación revisable, v0.5.0, 2026-10-02

**Sin catálogo aprobado ni premios extraordinarios activos.** 05 no está cerrado.
La petición exige preparar umbrales/recompensas antes de conceder premios. Se
solicitó aprobación de [CATALOGO_BLOQUE_05.md](CATALOGO_BLOQUE_05.md) con ejemplos;
no respuesta expresa registrada al preparar esta entrega. La aprobación que falta
es de 05; ELO 03 está aprobado/activo y 04 descriptivo integrado, sin pronósticos.
No reabrir esas decisiones ni repetir cuentas/partidos/checklist cerrado de 01.

## Qué está preparado

- 24 logros visibles con IDs estables, umbrales/XP único 25/50/100; familias de
  partidos, victorias, rachas, Clasificatorios, goles **de equipo** y tres
  situaciones comprobables. No secretos ni torneos inventados para alcanzar 50.
- 8 récords y Hall privado, sin XP por récord, porcentaje actual con mínimo 20,
  líderes empatados por fracción exacta, alias/bajas por UUID. Máximo/ELO actual
  requiere Clasificatorio; 1200 inicial sin partidos no crea un líder.
- Propuesta de históricos y recálculo desde hechos vigentes; XP de un logro puede
  desaparecer si deja de cumplirse. Reaparecer contribuye una vez, no otro cobro.
  Identidad de premio cuenta/jugador/logro, versión solo metadato.
- Primera evidencia por finished_at con microsegundos y UUID. No inferir tiempos
  jugados de inicio/final; rápido/remontada/duración aplazados por necesitar
  journals completos y anulaciones. Tanda resuelve resultado sin goles de campo.
- Diseño de snapshot invoker/RLS de servidor y extensión del XP efectivo tras
  aprobación. No migración, vista ni API de honores creada; columnas físicas de
  XP/nivel/ELO protegidas permanecen reservadas. No consulta/escritura por gol.

## Archivos e independencia

`tests/block05Prototype.ts`: referencia pura propuesta, valida identidad/equipos,
resultados, duplicados/conflictos, fechas y procedencia completa confirmada. Cola
pendiente y práctica explícitamente excluidas; un final local con test_mode=false
no demuestra confirmación. No llamadas a Supabase/almacenamiento. `approved=false`
y `grantedExtraXp=0`; el XP mostrado es exclusivamente propuesto/simulado.

`tests/block05Review.tsx`: maqueta aislada en
`/tests/ui-fixture.html?block05=review`, solo desarrollo/build offline-test. Logros,
progreso, récords, Hall, jugadores/bajas, estados vacío/offline/lectura incompleta
y pendientes simulados. Ningún import desde producción; no disponible en la
Preview normal ni incluido en dist. Los escenarios son controles de revisión,
no ajustes ni permisos de la app real. Versionado/novedades en package/lock y
src/app/releases.ts advierten que las funciones aún no están disponibles.

## Pruebas ejecutadas

- `npm test`: **once grupos** correctos. Nuevos contratos **13/13**: 250 partidos y
  fronteras, primera evidencia/retry, procedencia/lectura incompleta/prueba,
  prórroga/tanda, empate/racha, 2v2/1v2 ambos colores y rechazo ranked, conflictos,
  homónimos/alias/bajas, edición/eliminación de objetos de fixture, porcentaje
  mínimo/exacto, microsegundos/UUID, evidencias empatadas/0 XP por récord.
- TypeScript/build normal y aislado correctos. Typecheck explícito de referencia,
  maqueta, tests y generador SQL (tests fuera del tsconfig de app):
  `npx tsc --ignoreConfig --noEmit --strict --target ES2022 --module ESNext --moduleResolution Bundler --jsx react-jsx --skipLibCheck --types node tests/block05Prototype.ts tests/block05Review.tsx tests/block05.test.ts supabase/tests/block05.ts`.
- Cuatro recorridos Chromium focalizados correctos: dos nuevos 05 y dos de
  versiones. Datos simulados, Supabase bloqueado; no localStorage/cookies de la
  revisión y cero peticiones Supabase. Estados sin red/error retiran cifras en vez
  de confirmar ceros. Se conservan versión offline/copia del partido al consultarla.
- Capturas inspeccionadas móvil 390×844 y vista física, mediciones/revisión a
  320×568, 390×844, 844×390, 768×1024, 1440×900 y 800×480; canvas físico exacto,
  scroll interno, sin scroll general, controles ≥48 px. Evidencias temporales en
  `/tmp/futbolin-block05-visual`, fuera de Git. Playwright/Chromium existentes;
  agent-browser no instalado.
- Revisión React: hooks incondicionales, estado limitado a revisión, datos
  derivados por UUID sin efectos/red, keys estables, texto escapado y estilos
  acotados. No nuevas dependencias, solo metadatos raíz de versión en lockfile.
- Hall de porcentaje detectó un error bigint/number para empate cero en el
  prototipo; corregido antes de PASS. Navegador detectó labels de selectores
  ambiguos y expectativas por índice de versiones; corregidos antes del recorrido
  focalizado final. Primer SELECT exploratorio tenía nombre de columna XP erróneo,
  corregido sin escrituras.

- Batería Chromium completa: **50/50**, cero fallos/omitidos, conserva 48
  regresiones previas incluida reapertura PWA con servidor realmente apagado.
  `npm audit --omit=dev --audit-level=moderate`: **0 vulnerabilidades**. Diff sin
  errores, enlaces locales y los 84 apartados del contexto verificados. Escaneo
  de archivos de entrega sin credenciales ni artefactos privados. Publicación se
  registra después de comprobar push; estos resultados son pruebas locales.

## SQL real, con fixtures separados de datos reales

Único proyecto: `unemjyfhzljcdjcbiiwh`. `supabase/tests/block05_readonly.sql`
comprueba configuración aprobada de XP/ELO activos, RLS/vista invoker, funciones
STABLE invoker, permisos privados, ausencia de grants de escritura de configuración
y aislamiento de otra identidad. Usa cuenta existente únicamente para simular su
rol SQL; no es login del operador desde el navegador ni crea Auth/partidos.

Generador `supabase/tests/block05.ts`, salida completa ejecutada remotamente:
**PASS** con REPEATABLE READ READ ONLY y ROLLBACK. Diez escenarios de paridad
referencia TS/CTEs SQL: base, retry, editado, eliminado, vacío, 1v2 casual,
microsegundos, 25 partidos, pendientes/práctica excluidos, prórroga/tandas. Fixtures
JSON solo en variables/CTEs; **ningún INSERT/UPDATE/DELETE/DDL**, ninguna migración
o fila guardada. Comprueba progreso, primera evidencia, XP propuesto/0 concedido,
métricas y los seis récords no ELO; ELO reutiliza su contrato existente de 03, sin
volver a activar ni modificar reglas. No prueba una futura RPC de honores.

Lecturas reales antes: 2 jugadores, 2 Rápidos, 4 participantes, 12 eventos,
0 Clasificatorios; ELO enabled=true/version=2, XP enabled=true, ambos 225 XP/nivel
1. No se conceden los logros que esos históricos podrían cumplir. Documentación
Supabase RLS/invoker vigente consultada mediante search_docs; changelog HTTP 403,
sin eludir la política. Esquema, configuración/seguridad, engine/hashes y datos
conservados. No SMTP/Google/Drive/pagos/administración/torneos/main.

SELECT posterior confirma los mismos conteos y XP/nivel, XP/ELO activos: no
mutaciones durante las pruebas. Comprobación Git antes de publicar: revisión
HEAD/origin 0/0, main `900e470a719bc99bee4df853f0e11301a5b6562e`; solo archivos de
este bloque en la entrega, sin .env/dist/temporales. Ningún reset/stash/force push.

## Preview y límites

Conector Vercel operativo: equipo/proyecto autorizados, despliegue base
`dpl_B2VF9mT5fgZUmWi5jjhS7Q88cKBY` READY, commit `cd4231e` y rama correcta;
alias protegido HTTP 200 mediante web_fetch_vercel_url. No se dispone de sesión
Supabase del operador: no se afirma recorrido autenticado de 05. La maqueta no
se sirve desde el build normal; un READY posterior solo verifica publicación de
versión/log y código previo. No retirar protección ni pedir cuentas/partidos.

**Publicación de la preparación comprobada:**
`4c6a913682cf514c91f989d9fc26fb94ef888392`, push fast-forward cd4231e→4c6a913 y
ls-remote coincidente; árbol limpio tras commit, main sigue
`900e470a719bc99bee4df853f0e11301a5b6562e`. Vercel
`dpl_2tdrmHHS2bzjj3R9Mewk3EbSGme5` READY/commit/rama correctos;
[Preview de la preparación](https://marcador-futbolin-v3-a5s6i8dfv-altocuvlc-9686s-projects.vercel.app/)
HTTP 200 y bundle index-CHFHhPDb.js coincide con el build local. Catálogo/prototipo
fuera del bundle, versión/log 0.5.0 pendientes de aprobación; sin sesión del
operador ni logros reales. Esta evidencia se versiona después en una anotación
documental, sin cambiar versión/código ni inferir su futuro despliegue.

## Prompt histórico v0.5.0, sustituido por el vigente de arriba

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 en codex/reliability-offline-v1 y trabaja
exclusivamente en terminar bloque 05. Lee AGENTS.md, CONTEXTO_MAESTRO,
ESTADO_ACTUAL, BLOQUES_DESARROLLO, CATALOGO_BLOQUE_05 y VERIFICACION_BLOQUE_05.
Sincroniza sin sobrescribir cambios locales ni promover main. v0.5.0 es preparación
aislada: 24 logros y 8 récords, sin catálogo aprobado ni XP extraordinario activo.
Comprueba si existe una aprobación expresa posterior; si falta, pide únicamente
aprobar/corregir la V1 concreta y continúa trabajo independiente. No interpretes
silencio ni publicación como aprobación. Con aprobación, integra solo ese catálogo
en servidor/UI privados, premios únicos por cuenta/jugador/ID y reconstrucción
desde hechos confirmados vigentes; verifica paridad, RLS, retry y recálculo, y
actualiza XP/nivel efectivo con desglose sin alterar su tabla/curva aprobadas.
Conserva ELO activo aprobado, 04 descriptivo, motor, idempotencia y formatos:
1v1/2v2 todos los modos, 1v2 solo Rápido/Caos con XP completo y sin ELO. Excluye
prueba/cola/incompletos, no atribuyas goles individuales ni inventes tiempos. No
reabras 01 ni pidas cuentas/partidos nuevos. Distingue pruebas/SQL de Preview
autenticada según acceso. Sin administración, torneos, SMTP, Google/Drive, pagos
o main. Actualiza contexto/seguimiento, versión/novedades y publicación verificada.
Entrega prompt condicionado de 06 al cerrar 05; no inicies 06.
```

## Prompt de 06 preparado, condicionado al cierre de 05

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 en codex/reliability-offline-v1 y ejecuta
exclusivamente bloque 06: torneos. Lee AGENTS.md, CONTEXTO_MAESTRO, ESTADO_ACTUAL,
BLOQUES_DESARROLLO y VERIFICACION_BLOQUE_05; sincroniza preservando trabajo local,
sin promover main. Comprueba primero cierre y catálogo aprobado/activo de 05;
05 permanece abierto en v0.5.2: si sigue abierto, registra dependencia
y no lo saltes. Con 05 cerrado, prepara propuesta concreta de formato, equipos,
cuadro/liguilla, byes, empates y recompensas para aprobación propia de 06. Avanza
diseño/pruebas independientes; no inventes ni actives reglas/premios propuestos.
Tras aprobar, implementa creación, participantes, partidos, avance único,
recuperación y clasificación final usando motor/persistencia vigentes. Conserva
XP/logros aprobados, ELO solo Clasificatorio y formatos admitidos; define
explícitamente elegibilidad de partidos de torneo antes de puntuar. No dupliques
avance por retry ni borres partidos para corregir un cuadro. RLS e historial
privados, juego offline y exclusión de prueba/pendientes. Verifica UI/código/SQL
según acceso y diferencia fixtures de Preview autenticada; no repitas checklist
cerrado ni crees cuentas. Sin Google/Drive, SMTP, pagos, administración nueva o
promoción main. Actualiza contexto/estado/seguimiento, versión/novedades, publica
estable en revisión y entrega prompt de 07 sin iniciarlo.
```
