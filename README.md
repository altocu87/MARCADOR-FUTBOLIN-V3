# MARCADOR FUTBOLÍN V3

Simulador web de un marcador físico de futbolín, diseñado con un lienzo lógico fijo de **800 × 480 píxeles**. El proyecto permite validar la experiencia táctil y el motor del partido antes de su integración con el hardware.

## Objetivo

Construir un marcador claro, rápido y utilizable de pie mediante pantalla táctil. La aplicación actual cubre el flujo de creación de partido, selección de jugadores, marcador, pausas, periodos, prórroga y penaltis.

## Tecnología

- React
- Vite
- TypeScript
- CSS nativo
- Pruebas del motor con `tsx`

## Requisitos

Se recomienda Node.js 20 o superior y npm.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Vite mostrará la dirección local; normalmente es `http://localhost:5173`.

## Pruebas y compilación

```bash
# Pruebas funcionales del motor de partido
npm run test:engine

# Comprobación de TypeScript y build de producción
npm run build
```

El build se genera en `dist/`, carpeta que no se versiona.

## Arquitectura

La interfaz y la lógica del partido están separadas:

- `src/ui/`: componentes, pantallas y presentación táctil.
- `src/app/App.tsx`: composición de navegación, interfaz y motor.
- `src/match-engine/`: motor puro, sin dependencias de React ni del DOM.
- `src/inputs/`: contrato de entradas y adaptador actual de pantalla/ratón.
- `src/services/persistence/`: contratos de persistencia futuros.
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
- **Supabase:** persistencia de jugadores, resultados e historial, mediante el contrato de repositorio ya preparado.
- **Vercel:** el proyecto se despliega como aplicación estática de Vite tras ejecutar `npm run build`.
