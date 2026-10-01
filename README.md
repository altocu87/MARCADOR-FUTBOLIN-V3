# MARCADOR FUTBOLÍN V3

Simulador web de un marcador físico de futbolín, diseñado con un lienzo lógico fijo de **800 × 480 píxeles**. El proyecto permite validar la experiencia táctil y el motor del partido antes de su integración con el hardware.

Esta rama contiene el bloque cloud de almacenamiento local y recuperación. El trabajo Supabase del PC sigue siendo un bloque separado pendiente de sincronización; no se ha sustituido ni desplegado. Consulta [el estado actual](docs/ESTADO_ACTUAL.md) y [el contexto maestro](docs/CONTEXTO_MAESTRO.md) antes de continuar. La integración debe reconciliar navegación, modo prueba, journal y el bloqueo de gol al deshacer/cambiar periodo.

## Objetivo

Construir un marcador claro, rápido y utilizable de pie mediante pantalla táctil. La aplicación actual cubre el flujo de creación de partido, selección de jugadores, marcador, pausas, periodos, prórroga y penaltis.

## Tecnología

- React
- Vite
- TypeScript
- CSS nativo
- Pruebas del motor con `tsx`
- Pruebas de interfaz en Chromium con Playwright

## Requisitos

Se recomienda Node.js 20 o superior y npm.

## Instalación y ejecución

```bash
npm ci
npm run dev
```

Vite mostrará la dirección local; normalmente es `http://localhost:5173`.

## Pruebas y compilación

```bash
# Pruebas funcionales del motor de partido
npm run test:engine

# Motor, recuperación y persistencia local
npm test

# Comprobación de TypeScript y build de producción
npm run build
```

El build se genera en `dist/`, carpeta que no se versiona.

Para comprobar la interfaz, deja `npm run dev -- --host 127.0.0.1 --strictPort` ejecutándose en una terminal. En otra terminal:

```bash
# Solo la primera vez si no tienes Chromium de Playwright instalado
npx playwright install chromium
npm run test:browser
```

Si utilizas Chromium del sistema, puedes indicar su ruta. En el entorno de nube actual:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser
```

Las pruebas usan contextos de navegador aislados: no borran los datos de tu navegador habitual. `MARCADOR_TEST_URL` permite probar otro servidor; por defecto se usa `http://127.0.0.1:5173`.

## Jugadores, recuperación e historial

1. Abre **JUGADORES** para crear o editar jugadores. Los nombres deben ser únicos y tener entre 1 y 32 caracteres.
2. En **NUEVO PARTIDO**, configura el encuentro y selecciona 2 o 4 jugadores. La selección se asigna en este orden: blanco 1, azul 1, blanco 2, azul 2. La pantalla muestra ambos equipos antes de comenzar.
3. El partido se guarda automáticamente tras los cambios y cada segundo de juego. Al recargar o reabrir la aplicación, se recuperan participantes, marcador, tiempo y la opción de deshacer. Si estaba jugando o en cuenta atrás, vuelve **pausado**; el tiempo con la aplicación cerrada no se descuenta. Los descansos y penaltis conservan su fase.
4. Cambiar de sección u ocultar la pestaña pausa el reloj. Un partido pendiente se recupera antes de poder comenzar otro.
5. Al terminar, el resultado se añade una sola vez a **HISTORIAL**, donde puedes consultar equipos, goles y penaltis. Editar un jugador no altera los nombres que figuraban en los partidos anteriores.

El almacenamiento es **local a este navegador y dirección de la aplicación**; aún no hay sincronización con Supabase ni entre dispositivos. Borrar los datos del sitio elimina jugadores, partido activo e historial. El modo privado puede no conservarlos al cerrar el navegador.

La aplicación comprueba los datos al leerlos y no sobrescribe documentos corruptos o de versiones incompatibles. Si falla una escritura, detiene el avance y permite reintentar. Si otra pestaña modifica los datos, solicita recargar para evitar sobrescribir los cambios; utiliza una sola pestaña para gestionar y jugar.

Torneos, ranking y ajustes continúan como secciones previstas para fases posteriores.

## Arquitectura

La interfaz y la lógica del partido están separadas:

- `src/ui/`: componentes, pantallas y presentación táctil.
- `src/app/App.tsx`: composición de navegación, interfaz y motor.
- `src/match-engine/`: motor puro, sin dependencias de React ni del DOM.
- `src/inputs/`: contrato de entradas y adaptador actual de pantalla/ratón.
- `src/domain/`: modelo y validación de jugadores.
- `src/services/persistence/`: almacenamiento local versionado y contrato para una integración futura.
- `tests/`: pruebas automatizadas del motor.

### Motor del partido

`MatchEngine` gestiona el estado del encuentro: goles, reloj, cuenta atrás, pausa, bloqueo de entradas tras un gol, historial de eventos, deshacer, fin de parte, prórroga con gol de oro y penaltis. La interfaz solo lee su estado y le envía eventos como `GOL_BLANCO`, `GOL_AZUL`, `PAUSA` o `DESHACER`.

Esto permite reutilizar el mismo motor con distintos adaptadores de entrada: controles táctiles actuales, ratón de desarrollo, futuros pulsadores y sensores físicos.

## Resolución 800 × 480

La composición interna siempre está diseñada a 800 × 480 píxeles. Si la ventana es mayor, el lienzo se centra; si es más pequeña, se escala sin recortarse. No se usa `aspect-ratio` como base del diseño.

## Variables de entorno

Usa `.env.example` como plantilla cuando sea necesaria una integración. Las futuras variables previstas son:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No hay conexión activa con Supabase y nunca se deben versionar claves reales.

## Próximas integraciones

- **ESP32-S3:** ejecutará la interfaz final en la pantalla física de 800 × 480.
- **ESP32-C3:** podrá aportar pulsadores y sensores a través de un adaptador que emita los mismos eventos del motor.
- **Supabase:** sincronización en la nube de los jugadores, resultados e historial que ya se conservan localmente.
- **Vercel:** el proyecto se despliega como aplicación estática de Vite tras ejecutar `npm run build`.
