# Verificación de fiabilidad — 2026-10-01

## Alcance y reproducción

Sin nuevas funciones de competición, sin cambios visuales del producto, sin cambios de base de datos ni credenciales. Se preserva la integración local de persistencia V1 y se refuerzan el motor y la cola independiente de React/Supabase.

Antes del arreglo, la nueva regresión `undo: conserva bloqueo visual` falló con `false !== true`. `undo`, fin de parte y preparación de periodo borraban el plazo del último gol. La corrección conserva ese plazo y recalcula el estado visible, sin extenderlo por cada acción.

## Pruebas automatizadas

Ejecutar `npm test` (motor y persistencia) y `npm run build` (TypeScript y Vite).

Motor: ocho escenarios aislados con reloj controlado:

- deshacer durante juego;
- corrección -1;
- pausa → deshacer → continuar;
- deshacer el gol que finalizó una parte;
- pasar a la siguiente parte y saltar cuenta atrás;
- pasar a prórroga y saltar cuenta atrás;
- deshacer un gol de oro que finalizó el partido.
- simulación penaltis → prórroga sin perder el plazo del gol anterior (no cambia las reglas de los lanzamientos).

En cada uno: bloqueo visible y plazo original; pantalla y dispatch directo rechazados a 2.999 ms sin añadir eventos; aceptación a 3.000 ms sin depender del tick de React. También cuenta atrás completa y nueva partida sin bloqueo heredado. La fixture anterior de persistencia esperaba un gol inmediato entre partes: ahora respeta los tres segundos, sin alterar las reglas de goles por periodo ni los resultados esperados.

Dos regresiones adicionales comprueban deshacer desde final de parte y gol de oro tras diez segundos de espera: el reloj conserva el segundo ya jugado y avanza al siguiente sin sumar el descanso.

Persistencia: pruebas existentes más recarga del coordinador, dos resultados completos pendientes, reintento sin red sin duplicados, aislamiento por proyecto, éxito parcial, confirmaciones fuera de orden, petición colgada, confirmación tardía y fallo de cuota al limpiar tras confirmación remota. Modo prueba no escribe en almacenamiento ni en repositorio; una cola ilegible no se sobrescribe.

El timeout de diez segundos limita la espera local, no garantiza cancelación del envío remoto. La copia permanece y el reintento usa el mismo ID/idempotencia. No equivale a una prueba de la RPC real autenticada.

## Recorrido de navegador aislado

Herramienta agent-browser CLI no disponible; verificación equivalente con el navegador integrado.

1. Abrir `/tests/ui-fixture.html?save=hang`: repositorios en memoria, sin Auth ni peticiones a Supabase.
2. Modo prueba OFF, partido rápido, un gol por parte, dos jugadores.
3. Completar ambas partes: 2–0, ganador Blanco, resumen inicialmente guardando.
4. Tras el timeout: `PENDIENTE EN ESTE DISPOSITIVO`, botón NUEVO PARTIDO habilitado; AJUSTES muestra un pendiente.
5. Recargar: permanece el pendiente.
6. Abrir `/tests/ui-fixture.html` sin parámetro para simular conexión recuperada; AJUSTES → reintentar.
7. Cola vacía y `Sincronización completada`; historial y detalle con siete eventos y resultado 2–0.
8. Restaurar modo prueba ON y cerrar la pestaña temporal. Aplicación real sigue sin sesión.

Consola del recorrido aislado: cero errores/avisos. Dimensiones comprobadas:

Build de producción servido temporalmente en Vite preview: menú y navegación a Ajustes correctos, lienzo 800×480, contenido visible, sin overlay de error ni errores/avisos en consola. Servidor temporal detenido tras comprobarlo; el servidor habitual de desarrollo se conserva.

| Ventana | Lienzo lógico | Área visible | Scroll general |
| --- | --- | --- | --- |
| 800×480 | 800×480 | 800×480, origen 0,0 | No |
| 1280×720 | 800×480 | 800×480, centrado | No |
| 390×844 | 800×480 | 390×234, centrado | No |

Captura local de evidencia: `tmp/verificacion-fiabilidad-800x480.png`, ignorada por Git. El historial desplaza únicamente su cronología interna.

## Publicación y pendiente

Rama de revisión: `codex/reliability-offline-v1`. Incluye la persistencia V1 local previa para retomar el trabajo desde otro agente/entorno, sin promover el bloque a main. Consultar el historial/referencias Git para el commit y push final; no reejecutar migraciones ya aplicadas.

Falta el recorrido real navegador → Supabase → historial con cuenta del operador. Mantener esta limitación visible; no avanzar a XP/ELO/logros ni considerar la fase B cerrada hasta comprobarla.
