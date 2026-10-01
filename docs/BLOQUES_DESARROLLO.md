# Bloques y prompts para continuar — 2026-10-01

Preparado por petición del propietario: conservar el punto alcanzado y comenzar una conversación por bloque. Este documento organiza el trabajo futuro; **no ejecuta ni autoriza automáticamente todas las fases**. La petición de cada conversación determina su alcance. El estado operativo vivo y el registro de cambios permanecen en [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md); las reglas y propuestas originales en [CONTEXTO_MAESTRO.md](CONTEXTO_MAESTRO.md).

## Punto de partida registrado

- Repositorio `altocu87/MARCADOR-FUTBOLIN-V3`; rama de desarrollo `codex/reliability-offline-v1`. Base inicial de este plan: `871c363`; última modificación funcional `0a6f993` (GOALS sin partes y verificación de desempates), push comprobado; AMBAS V4 en `0cb5dec`. Al retomar obtener la punta actual, no volver automáticamente a estos hashes. `main` comprobada en `900e470`: todavía no contiene los avances de desarrollo.
- Implementados simulador, persistencia privada Supabase, jugadores, historial, guardado idempotente, pendientes, recuperación, PWA, web adaptable y referencia física 800×480, perfiles/estadísticas y análisis de resultados con filtros. No rehacerlos desde main.
- Últimas correcciones: acceso a Preview protegido (`89e7981`), GOALS sin partes (`f7050ef`) y AMBAS con objetivo total del partido (`0cb5dec`, corrección V4 sobre `472f945`). `b9dfc7b` implementó por error un objetivo por parte y ha quedado reemplazado para nuevos partidos. Los registros completos y decisiones reemplazadas están en ESTADO_ACTUAL.
- GOALS: sin partes, cronómetro ascendente sin límite de tiempo, primer equipo que alcanza el objetivo. TIME: dos partes por reloj, ganador por suma de goles. AMBAS: objetivo por equipo para el partido completo, sin reiniciarlo entre partes; final directo al alcanzarlo o ganador por total después de las dos partes por reloj. Ejemplo objetivo 5: primera 3–2 y dos goles blancos en la segunda → Blanco 5–2. No contar victorias de parte ni objetivos por parte.
- Checkpoints: GOALS/TIME nuevos V2; AMBAS nuevo V4. Copias anteriores conservan sus reglas, incluida la interpretación histórica V3. No reescribir resultados, pendientes ni sus hashes. Se mantiene bloqueo central de tres segundos, pausa, corrección y desempate por prórroga/gol de oro/penaltis cuando corresponde.
- Corrección V4: siete grupos de `npm test` correctos, estadísticas/análisis 41/41; los resultados de navegador/build y publicación están en la entrada vigente de ESTADO_ACTUAL. Bloque 01 sigue siendo el siguiente recomendado, pendiente de comprobación real.
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

| Bloque | Entrega | Estado al preparar el plan | Condición para comenzar |
| --- | --- | --- | --- |
| 01 | Consolidación y comprobación real | 2026-10-01: pruebas 1 y 6 humanas OK; cierre de 2 corregido; 3–5 simuladas; 7 aclarada como PRUEBA ON, falta recorrido OFF; restantes 8–11/PWA; acceso superior y gestión de cuenta; trece correos preparados, aplicación hosted y prueba Auth real pendientes | Evidencia y pasos restantes en VERIFICACION_BLOQUE_01.md |
| 02 | XP y niveles | Siguiente propuesto, todavía condicionado | Cerrar pendientes concretos del 01 y aprobar XP/curva/históricos |
| 03 | ELO, ranking y categorías | Propuesto | Base verificada; parámetros competitivos aprobados |
| 04 | Análisis competitivo y predicción | Propuesto | 03 y reglas/muestra aprobadas |
| 05 | Logros, récords y Hall of Fame | Propuesto | Progresión estable; catálogo/recompensas aprobados |
| 06 | Torneos | Propuesto | Formato/reglas definidos; persistencia/progresión estables |
| 07 | Sonido y pulido del uso diario | Propuesto | Flujos que se van a pulir estables |
| 08 | Backup y restauración | Propuesto | Modelos de datos de los bloques anteriores estables |
| 09 | Firmware y entradas físicas | Propuesto | Modelos/protocolo y conexiones reales verificables |
| 10 | OTA y administración local | Propuesto | 08 y firmware probado del 09 |

Ejecución del bloque 01: sincronización final sobre f9ebe15, dos bugs corregidos; npm test siete grupos/estadísticas 41/41, Chromium 15/15 y builds correctos. RPC real desde motor con ROLLBACK y cuenta existente; datos originales preservados. Preview denegada por alcance Vercel, sin sesión web del operador; no se declara cierre completo. Detalles en [VERIFICACION_BLOQUE_01.md](VERIFICACION_BLOQUE_01.md) y estado vivo. Publicación fast-forward de eb0f098/e164b5b comprobada por push y referencia remota; esta anotación se versiona después. La publicación no promueve main ni activa XP/ELO.

Continuación por feedback humano: prueba 1 confirmada; prueba 2 elimina el paso VER RESULTADO al cerrar segunda parte con ganador. npm test correcto y Chromium 20/20, incluidas simulaciones 3–5 y cuatro recorridos naturales de desempate TIME/AMBAS. No pedir repetir esas simulaciones por rutina ni dar por aprobada la prueba 2 completa: falta confirmar el arreglo en Preview y las comprobaciones reales pendientes del checklist. Seguimiento posterior: prueba 6 confirmada por el operador; prueba 7 fue con PRUEBA ON, vuelta al inicio esperada; aún falta recuperación real con OFF. Registro separado de login por petición expresa; Chromium 21/21 y builds correctos. No repetir la 6. Continuación de acceso: recuperación de contraseña completa en código, mensaje de registro genérico aclarado, Chromium 24/24 y cuatro verificaciones focalizadas finales; envío/callback Auth real pendiente. Google y Drive solicitados para más adelante, sin activación; Drive queda en el alcance futuro de 08 y Google necesita vinculación segura a cuenta existente antes de su implementación. Rediseño posterior autorizado: acceso superior y MI CUENTA (perfil/correo/seguridad/sesiones), sin Auth en Ajustes. Trece correos preparados; aplicación hosted pendiente por falta de edición Auth. Evidencia vigente en ESTADO_ACTUAL y VERIFICACION_BLOQUE_01.md; bloque 02 sigue condicionado.

Cada fila pasa a en curso, completado o pendiente de verificación con evidencia fechada; no marcar todas completadas al copiar los prompts. El orden puede ajustarse expresamente: el pulido web no depende de disponer de hardware y el diseño del protocolo puede prepararse sin una placa conectada.

## Bloque 01 — Consolidar la versión actual y comprobar guardado real

**Agente:** comprobar Preview del commit vigente cuando disponga de acceso, revisar regresiones de las tres condiciones, guardado/historial/perfiles, recuperación y pendientes; resolver bugs encontrados. Registrar qué parte fue local y qué parte real. **Propietario:** entrar personalmente con su cuenta existente y probar lo que el agente no pueda observar; no crear otra cuenta por rutina ni compartir contraseña.

**Cierre:** las reglas vigentes, el resultado/participantes/eventos guardados y los perfiles coinciden; prueba ON no añade resultados; reintentos no duplican; se detalla qué comprobaciones remotas/PWA siguen pendientes. La instalación física de PWA se verifica en el dispositivo real, nunca por emulación. No autoriza promover main.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 01 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md, docs/CONTEXTO_MAESTRO.md y docs/ESTADO_ACTUAL.md; sincroniza de forma segura la rama de desarrollo vigente. Consolida las tres condiciones de victoria ya aprobadas, comprueba guardado, historial, perfiles, recuperación y pendientes, y corrige bugs. El operador ya comunica login y prueba correctos: no le pidas crear otra cuenta. Verifica Preview/Supabase reales si tienes acceso; si falta, completa las pruebas independientes y da solo los pasos humanos que faltan, sin sustituirlos por mocks. Conserva datos, seguridad y reglas. No implementes XP/ELO ni promociones main. Actualiza contexto y seguimiento, publica el trabajo estable en la rama de revisión y entrega el siguiente bloque con su prompt.
```

## Bloque 02 — XP y niveles

**Agente:** implementar cálculo configurable, concesión por resultado final y progresión visible en perfil. Entrega idempotente: reintentos/recargas no conceden XP doble, prueba ON no concede y resultados pendientes no figuran como confirmados. Conservar separación motor/repositorios. **Propietario:** decidir únicamente parámetros de XP, significado/redondeo de la curva y si se aplicará a históricos cuando no exista aprobación registrada. Los apartados 30–31 contienen propuestas, no valores definitivos.

**Cierre:** reglas aprobadas, cálculos/fronteras probados, progresión por jugador/equipo definida para 1v1/2v2, integración transaccional/privada verificada y política explícita para históricos. No sumar automáticamente recompensas de logros/torneos aún inexistentes ni actualizar columnas protegidas desde el cliente.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 02 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y el contexto/estado vigentes; comprueba el cierre del bloque 01 y sus pendientes concretos en docs/VERIFICACION_BLOQUE_01.md. Si sigue pendiente la Preview autenticada vigente o PWA física, mantén esa dependencia explícita y no actives concesiones de XP. No repitas cuentas, migraciones ni pruebas humanas ya acreditadas. Tras el cierre, implementa XP y niveles con reglas centralizadas, perfil, guardado seguro e idempotencia frente a reintentos y offline. Los apartados 30–31 son propuestas: si faltan parámetros aprobados, prepara una tabla concreta, ejemplos y una política de históricos, y pide solo esa decisión mientras avanzas trabajo independiente. No actives concesiones reales con reglas sin aprobar. Prueba no da XP; no alteres el motor ni añadas ELO/logros/torneos. Inspecciona el esquema existente antes de proponer migraciones, conserva RLS y datos. Revisa, prueba, actualiza contexto/seguimiento, publica la rama de revisión y entrega el siguiente prompt.
```

## Bloque 03 — ELO, ranking y categorías

**Agente:** ELO solo en Clasificatorio, equipos 1v1/2v2, ranking privado, categorías aprobadas y máximo histórico; evolución consistente e idempotente. **Propietario:** concretar K, redondeo, categorías, multiplicador de diferencia e históricos si siguen siendo propuestas. ELO inicial 1200 es concepto aprobado; no asumir aprobado todo el resto.

**Cierre:** ajustes correctos por equipo/jugador, orden determinista de resultados, reintentos/concurrencia sin doble ajuste, Rápido/Caos/prueba sin modificar ELO. El ranking no sustituye el historial ni mezcla cuentas.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 03 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes; verifica las dependencias del bloque. Implementa ELO Clasificatorio, ranking privado, categorías y máximo histórico, con 1v1/2v2, reglas centralizadas y ajustes idempotentes/consistentes. Usa 1200 como inicio aprobado y revisa apartados 25–29: concreta los parámetros pendientes con ejemplos antes de activarlos; no conviertas multiplicadores o histéresis propuestos en reglas definitivas. No alteres ELO en Rápido/Caos/prueba ni recalcule históricos sin una política aprobada. Conserva privacidad y resultados anteriores. Completa pruebas, revisión visual, contexto/seguimiento y publicación en la rama de revisión; entrega el siguiente prompt.
```

## Bloque 04 — Análisis competitivo, enfrentamientos y predicción

**Agente:** enfrentamientos directos, últimos cinco clasificatorios y previsión con muestra/confianza; reutilizar las estadísticas y filtros ya implementados. **Propietario:** aprobar modelo/pesos/umbral de muestra que todavía sean propuestas (apartados 32–33).

**Cierre:** cifras por perspectiva/equipo consistentes; sin historial no inventar probabilidades; distinguir previsión de resultado seguro. No prometer calibración estadística que no se haya medido.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 04 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes; exige ELO verificable del bloque 03. Desarrolla enfrentamientos directos, forma de los últimos cinco clasificatorios y predicción prepartido con confianza/muestra. Reutiliza perfiles, estadísticas y filtros existentes; no los rehagas. Revisa y concreta las propuestas del apartado 33 antes de activar sus pesos. Trata 1v1/2v2, pocas partidas, empates y penaltis correctamente; sin muestra no inventes porcentajes ni certeza. No añadas consultas remotas por gol. Prueba cálculos y UI, registra límites reales, actualiza contexto/seguimiento, publica la rama de revisión y entrega el siguiente prompt.
```

## Bloque 05 — Logros, récords y Hall of Fame

**Agente:** catálogo aprobado, detección desde hechos disponibles, premios únicos y vistas privadas. **Propietario:** aprobar catálogo, umbrales y XP extraordinario; el objetivo aproximado de 50 logros/10 secretos no define automáticamente sus reglas.

**Cierre:** logro único no se cobra dos veces; actualizar récord no da XP ilimitado; goles siguen perteneciendo al equipo; correcciones/penaltis/prueba/pendientes tratados sin falsear hechos.

```text
Continúa altocu87/MARCADOR-FUTBOLIN-V3 y ejecuta exclusivamente el bloque 05 de docs/BLOQUES_DESARROLLO.md. Lee AGENTS.md y contexto/estado vigentes. Implementa logros, récords y Hall of Fame desde un catálogo aprobado conforme a los apartados 34–35; si falta, prepara catálogo/umbrales/recompensas concretos para decisión antes de activarlos. Usa hechos reales del historial, no atribuyas goles a jugadores ni inventes récords incompatibles con datos antiguos. Concede cada premio una sola vez, sin XP ilimitado por actualizar récords ni por reintentar guardados. Conserva privacidad, reglas y datos. Verifica cálculos, persistencia y UI; actualiza contexto/seguimiento, publica la rama de revisión y entrega el siguiente prompt.
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
