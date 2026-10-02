# Instrucciones para agentes — MARCADOR FUTBOLÍN V3

## Lectura obligatoria

Antes de modificar código, leer completamente:

1. `docs/CONTEXTO_MAESTRO.md`: decisiones del propietario y hoja de ruta, incluidos los 84 apartados.
2. `docs/ESTADO_ACTUAL.md`: implementación verificada, trabajo pendiente y punto de continuación.
3. `README.md` y la documentación de verificación pertinente al bloque.

Al entrar en un entorno nuevo o trasladar trabajo a la nube, leer también `docs/TRASPASO_NUBE.md`. Es una fotografía del traspaso; `ESTADO_ACTUAL.md` sigue siendo la referencia operativa viva. Comprobar la rama de desarrollo indicada allí antes de asumir que main contiene todos los avances.

No ejecutar toda la hoja de ruta por el mero hecho de leerla. La tarea autorizada es la petición vigente del usuario. Distinguir decisiones aprobadas, propuestas configurables, funciones futuras, código implementado y pruebas pendientes.

Si se pide continuar por bloques o un número de bloque, leer [docs/BLOQUES_DESARROLLO.md](docs/BLOQUES_DESARROLLO.md). Contiene el orden propuesto, dependencias, criterios de cierre y prompts para una conversación por bloque. Ejecutar únicamente el solicitado; contrastar su seguimiento con ESTADO_ACTUAL y el código, no rehacer bloques completados ni interpretar el plan como autorización de todas las fases.

## Antes de cada bloque

- Identificar entorno real (local o nube), rama, commit, estado del árbol y remoto. No asumir rutas Windows ni acceso a hardware en la nube.
- Consultar/sincronizar `origin/main` de forma segura. Con cambios locales, inspeccionar divergencias antes de integrar; no resetear, sobrescribir, descartar ni hacer stash automático de trabajo ajeno.
- Revisar código e historial reales. Si los documentos contradicen el código, buscar decisiones posteriores antes de cambiarlo. No rehacer una integración que existe en otro checkout pendiente de publicación.
- Preservar React/Vite/TypeScript/CSS y la separación UI/motor/entradas/persistencia. Desde la decisión del 2026-10-01, la web es adaptable por defecto; conservar también la referencia física exacta 800×480 seleccionable en Ajustes. No volver a reducir toda la web a una imagen escalada.

## Reglas esenciales

- El MatchEngine no depende de React, Supabase, Vercel ni hardware. Todas las fuentes de gol pasan por la validación del motor y su bloqueo de tres segundos.
- Registrar goles por equipo, no por jugador. Reglas vigentes: GOALS sin partes/objetivo por equipo/cronómetro ascendente sin límite; TIME dos partes por reloj; AMBAS objetivo por equipo para el partido completo, sin reinicio entre partes: final al alcanzarlo o, tras dos partes por reloj, ganador por acumulado. Conservar reglas de copias anteriores. No cambiarlas silenciosamente ni volver a retirar AMBAS.
- Internet nunca bloquea una partida. No enviar cada gol a la nube. Modo prueba no persiste partidos ni eventos.
- No implementar XP/ELO, logros, torneos completos o hardware hasta que el usuario autorice esa fase.
- No activar servicios de pago. No tocar otros proyectos Supabase. Nunca incluir secretos, service_role, archivos .env reales, node_modules o dist en Git.
- Detenerse para credenciales/autorización externa, posible coste, borrado de datos o cambios importantes/ambiguos de reglas. No pedir permisos para decisiones técnicas menores.

## Contexto vivo: actualización obligatoria

Al implementar o modificar un bloque, antes de darlo por terminado:

1. Actualizar `docs/ESTADO_ACTUAL.md` con fecha, alcance, archivos/módulos afectados, cambios de base de datos, pruebas realmente ejecutadas, limitaciones, bloqueos y siguiente acción.
2. Actualizar los apartados pertinentes de `docs/CONTEXTO_MAESTRO.md` si cambian decisiones funcionales/técnicas, la arquitectura o la fase. Conservar propuestas como propuestas; no convertirlas en reglas definitivas ni funciones implementadas.
3. Añadir una entrada al registro de cambios del estado actual. Conservar las decisiones históricas útiles y explicar qué decisión reemplaza a cuál.
4. Mantener README y documentos de verificación coherentes. No duplicar estados cambiantes en muchos archivos: el estado operativo de referencia es `ESTADO_ACTUAL.md`.
5. Distinguir explícitamente trabajo local sin commit, cambios publicados en GitHub, migraciones ya aplicadas y despliegues realmente comprobados. Nunca equiparar mocks o pruebas SQL con un recorrido autenticado completo desde el navegador.
6. Ejecutar las verificaciones proporcionales al cambio. Para código: tests existentes/nuevos, TypeScript/build y verificación visual si afecta a UI. Para documentación sola: revisar integridad, enlaces y `git diff --check`; no requiere autenticarse ni mutar servicios externos.
7. Cuando se autorice y sea seguro publicar, incluir el contexto actualizado con el bloque. No añadir indiscriminadamente archivos pendientes de otro bloque ni hacer force push. Registrar rama/commit/push con evidencia, sin inventar hashes o resultados.

## Versiones visibles e historial

Por petición expresa del propietario, la aplicación muestra su versión y un historial breve para usuarios. `package.json` es la fuente de la versión del build; mantener coherente el metadato raíz de `package-lock.json` y `src/app/releases.ts`. Registrar cada entrega funcional en lenguaje sencillo, incluyendo lo que sigue pendiente; una versión publicada no significa que el bloque esté cerrado ni aprueba reglas propuestas. Numeración retroactiva: 0.0.0 simulador inicial, 0.1.0 consolidación/01, 0.2.0 XP/02, 0.3.0 ELO/03 pendiente de activar, 0.4.0 preparación/04 e historial visible. Para posteriores entregas del mismo bloque incrementar el parche; al entregar otro bloque incrementar el menor siguiendo esa secuencia. No cambiar reglas, checkpoints, migraciones o permisos por cambiar la versión. La versión mostrada corresponde al build abierto, también cuando una PWA anterior sigue en uso.

El contexto vive en el repositorio, no únicamente en el historial de un chat. Un agente local o en la nube debe tener estos archivos mediante la sincronización de GitHub.

## Entrega por bloques y siguiente conversación

Petición explícita del propietario, 2026-10-01: al terminar cada bloque, registrar dónde se quedó el proyecto y todos los cambios pertinentes; entregar el siguiente trabajo como bloque con un prompt listo para una conversación nueva. Además de las actualizaciones anteriores, mantener el seguimiento de BLOQUES_DESARROLLO con evidencia y dependencias. El informe final debe incluir el estado alcanzado, limitaciones y el prompt completo del siguiente bloque recomendado. No depender de memoria entre conversaciones ni exigir al propietario reconstruir el historial. No iniciar ese siguiente bloque por el mero hecho de entregarlo.
