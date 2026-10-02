# Verificación 06 V2 — revisión de pool sencilla, 2026-10-02

## Alcance vigente

El propietario orienta 06 a pool para cuatro/seis personas, parejas preferentes,
cola y rotación. Reemplaza recomendación de eliminación directa V1. Detalles
por acordar; 3v3 ya aclarado como seis jugadores simultáneos y selector al crear
para mezclar ganadores/perdedores/ambos ya decidido. Algoritmo, reservas y XP/ELO
nuevo pendientes. Sin activación ni aprobación implícita de premios/modos.
Petición de temporadas registrada; propuestas 3/1, 3/0 y duraciones no aprobadas.
[PROPUESTA_BLOQUE_06.md](PROPUESTA_BLOQUE_06.md) V2 es la referencia vigente.

Entorno cloud `/workspace/MARCADOR-FUTBOLIN-V3`, misma rama de revisión.
Base `491838aa60b2963f5c14af1af0d47ebba7cdfe23`, árbol limpio antes de editar,
fetch explícito main/revisión, divergencia 0/0. Main `900e470a719bc99bee4df853f0e11301a5b6562e`.
Sin sobrescribir trabajo local, reset/stash o promoción.

## Revisión posterior de aclaraciones, 2026-10-02

Base `3ed672c2061861d002961804fa35fc64c12a5580`, árbol limpio, fetch explícito
main/revisión, divergencia 0/0. Respuestas del propietario registradas en siete
Markdown; no código, SQL, datos, partidos/cuentas, versión o servicio cambiados.
Verificación proporcional: enlaces locales, cercados Markdown, contexto 1–84,
`git diff --check` y revisión de que no persistan preguntas resueltas en el alcance
vigente. No tests/build/UI/SQL ni Preview autenticada ejecutados por esta revisión.
Los ejemplos previos de perdedores no prueban la mezcla de ganadores/ambos ni 3v3;
los nuevos ejemplos son ilustrativos, sin módulo implementado o fixtures de pool.
Publicación de esta revisión se registra tras push; v0.5.3 intacta, main sin promoción.

## Verificación proporcional de esta revisión

Solo nueve documentos Markdown: revisión de enlaces, bloques cercados,
contexto consecutivo 1–84 y `git diff --check`; inspección de alcance para
asegurar que no cambia aplicación, SQL, tests, versión o novedades funcionales.
Revisados ejemplos de seis/cinco personas, a mano y con una comprobación
simbólica aislada de su secuencia: solo dos parejas en mesa,
resto en cola, sale perdedor y vuelve después, ganadores conservados según
propuesta, cambio de ganador y saliente distinto al repetirse derrotas.
Resultados **PASS** de enlaces/bloques, numeración 1–84, alcance solo Markdown,
consistencia de secuencias y `git diff --check`. La comprobación simbólica no usa
motor, repositorio ni módulo de pool: **no verifica código/UI/SQL de pool**.

No nueva batería de tests/build/navegador, SQL, migraciones, cuentas/partidos ni
recorrido de Preview autenticada. No repetir checklist cerrado. Pruebas de V1
con fixtures XP y aritmética de cuadro son antecedentes y no prueban pool V2.
Versión **0.5.3** intacta; 05 aprobado/activo, código TORNEO provisional.
Sin servicios excluidos, administración, Google/Drive, SMTP, pagos o main.

## Publicación y continuación

**Publicación V2 comprobada:** `9e57ceb1150d47fe642b28776c6df9b4a130dc3b`,
push fast-forward `491838a`→`9e57ceb` en `codex/reliability-offline-v1`;
`git ls-remote` coincide, árbol limpio y main intacta en
`900e470a719bc99bee4df853f0e11301a5b6562e`. Solo nueve documentos,
sin cambio funcional ni deployment/Preview de pool inspeccionados.
Esta anotación de evidencia se publica después, sin cambiar versión.
 No se inspecciona deployment
automático de esta entrega documental; no afirmar UI de pool disponible en Preview.
Usar respuestas ya registradas; concretar mezcla/reservas, formatos y alcance
de temporadas. Después acordar solo reglas
necesarias, mediante [prompt vigente](PROMPT_SIGUIENTE_BLOQUE.md). Sin iniciar 07.

---

Registro histórico V1, sustituido por orientación V2; no usar sus preguntas
D1/D2/D3 ni pruebas de cuadro como alcance actual:

# Verificación 06 — preparación documental, 2026-10-02

## Alcance autorizado y resultado

Petición exclusiva: propuesta revisable de torneos; no implementar/activar torneo
ni premios sin aprobación. [PROPUESTA_BLOQUE_06.md](PROPUESTA_BLOQUE_06.md) contiene
D1 formato/operativa, D2 modos/elegibilidad y D3 premios con recomendaciones,
alternativas y ejemplos. Ninguna respuesta aprobatoria de D1/D2/D3 registrada.

Entorno cloud `/workspace/MARCADOR-FUTBOLIN-V3`, rama
`codex/reliability-offline-v1`, base `ecb3a2dc45ceb06e5997f218f8989b8de3aa2438`.
Árbol limpio al comenzar; fetch explícito de main/revisión, divergencia 0/0,
fast-forward ya actualizado. Main `900e470a719bc99bee4df853f0e11301a5b6562e`.
Sin sobrescritura, reset, stash ni promoción.

Leídos AGENTS, contexto vigente (incluido §36, sin formato aprobado), estado,
seguimiento, catálogo/verificación 05, README y traspaso histórico. Contrastados
contratos de MatchEngine, MatchDocument, copia/cola SaveCoordinator, navegación,
XP/ELO y menú TORNEO provisional. La propuesta no añade cuarto modo de motor,
no altera GOALS/TIME/AMBAS ni atribuye goles individuales o tiempos inferidos.

## Verificaciones proporcionales ejecutadas

Entrega exclusivamente Markdown: revisión de coherencia, enlaces relativos,
numeración de contexto y `git diff --check`. Comprobada aritmética de cuadro
N=2…16 y ejemplos de XP con la referencia aprobada existente, sin partidos
reales, inserciones, cuentas nuevas o concesión cliente/servidor. Resultados:

- **PASS:** nueve documentos, enlaces locales y cierres de bloques Markdown.
- **PASS:** contexto mantiene consecutivamente sus 84 apartados.
- **PASS:** aritmética N=2…16 y ejemplos eliminación/liguilla (4/5/8/16 equipos).
- **PASS:** referencia XP con fixtures solo en memoria: un Rápido 3–0 = 150 base
  + 100 tiers = 250; dos = 300 base + 150 tiers = 450, título propuesto 0.
  Sin peticiones remotas o archivo de test nuevo; no prueba funcional del torneo.
- **PASS:** `git diff --check`; cambios exclusivamente Markdown.

No se ejecutan otra batería de tests/build/navegador, consultas SQL, migraciones
ni recorridos autenticados por esta entrega documental. Las pruebas 57/57 y SQL
19 escenarios de 05 siguen siendo evidencia anterior, no verificación de torneos.
La lista de pruebas de la propuesta es un plan para después de aprobar/implementar.

Versión y novedades funcionales se mantienen en **0.5.3**: documentos revisables
no son una función de torneo ni justifican presentar 0.6.0 como implementada.
Sin cambios de `src`, `tests`, dependencias, configuración externa, esquema/RLS,
datos o XP/ELO/logros activos. No administración, pagos, Google/Drive, SMTP o main.

## Publicación

**Publicación de la propuesta comprobada:** `de3f9b3b300b5295eb4087648cd5b5ef173662c7`,
push fast-forward ecb3a2d→de3f9b3 en `codex/reliability-offline-v1`, SHA remoto
coincidente y árbol limpio. Main sigue `900e470a719bc99bee4df853f0e11301a5b6562e`.
Solo nueve documentos; fuentes/package/migraciones no cambian. No se inspecciona
el deployment automático de este commit documental ni se acredita torneo/UI
06 en Preview. La última evidencia funcional 05 permanece independiente.
Esta anotación se publica después, sin cambiar aplicación o versión.

Un eventual deploy automático de Markdown reutiliza el código v0.5.3; no
acredita torneos ni pruebas 06. Sin cambio de protección o promoción.

La observación del perfil/Hall 05 en la sesión Supabase habitual del operador
sigue separada y pendiente según acceso. No se reabre ni repite el checklist 01.

## Siguiente acción

Responder D1/D2/D3 sobre la propuesta publicada. La decisión del campeonato no
se deriva de las aprobaciones de XP V2/02/03/05. Con respuestas expresas y
consistentes, registrar alcance acordado y usar
[PROMPT_SIGUIENTE_BLOQUE.md](PROMPT_SIGUIENTE_BLOQUE.md) para continuar solo 06.
Sin aprobación, revisar la propuesta, sin activar torneos. 07 no iniciado.
