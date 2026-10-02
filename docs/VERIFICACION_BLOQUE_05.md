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

## Continuación efectiva: terminar 05

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
v0.5.0 fue solo preparación sin premios: si 05 sigue abierto, registra dependencia
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
