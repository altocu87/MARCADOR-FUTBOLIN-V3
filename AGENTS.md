# Instrucciones para agentes — MARCADOR FUTBOLÍN V3

## Lectura obligatoria

Antes de modificar código, leer completamente:

1. `docs/CONTEXTO_MAESTRO.md`: decisiones del propietario y hoja de ruta, incluidos los 84 apartados.
2. `docs/ESTADO_ACTUAL.md`: implementación verificada, trabajo pendiente y punto de continuación.
3. `README.md` y la documentación de verificación pertinente al bloque.

No ejecutar toda la hoja de ruta por el mero hecho de leerla. La tarea autorizada es la petición vigente del usuario. Distinguir decisiones aprobadas, propuestas configurables, funciones futuras, código implementado y pruebas pendientes.

## Antes de cada bloque

- Identificar entorno real (local o nube), rama, commit, estado del árbol y remoto. No asumir rutas Windows ni acceso a hardware en la nube.
- Consultar/sincronizar `origin/main` de forma segura. Con cambios locales, inspeccionar divergencias antes de integrar; no resetear, sobrescribir, descartar ni hacer stash automático de trabajo ajeno.
- Revisar código e historial reales. Si los documentos contradicen el código, buscar decisiones posteriores antes de cambiarlo. No rehacer una integración que existe en otro checkout pendiente de publicación.
- Preservar React/Vite/TypeScript/CSS, el lienzo lógico 800×480 y la separación UI/motor/entradas/persistencia.

## Reglas esenciales

- El MatchEngine no depende de React, Supabase, Vercel ni hardware. Todas las fuentes de gol pasan por la validación del motor y su bloqueo de tres segundos.
- Registrar goles por equipo, no por jugador. El criterio de goles por periodo no se cambia silenciosamente.
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

El contexto vive en el repositorio, no únicamente en el historial de un chat. Un agente local o en la nube debe tener estos archivos mediante la sincronización de GitHub.
