# Versión visible e historial — 2026-10-02

Ampliación transversal solicitada expresamente por el propietario. Versión actual **0.4.0**: entrega retroactiva por bloques, sin declarar completo el bloque 04 ni aprobar ELO/predicción. El estado operativo y la publicación se mantienen en [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md).

## Comportamiento

- El pie de todas las pantallas identifica la versión del build abierto, con nombre accesible «Versión 0.4.0».
- AJUSTES → VERSIONES muestra cinco entregas, de la más reciente a la inicial. GENERAL incluye versión actual y acceso al historial.
- 0.0.0 resume el simulador inicial; 0.1.0 consolidación/01, cuentas/historial/estadísticas/offline; 0.2.0 experiencia y niveles; 0.3.0 clasificación preparada y ELO desactivado; 0.4.0 versiones y preparación del análisis competitivo. Los dos últimos avisos explican las dependencias pendientes en lenguaje sencillo.
- Historial disponible sin cuenta y sin nuevas peticiones remotas. Después de cargar la aplicación puede consultarse sin red; la reapertura offline sigue requiriendo la preparación PWA existente. Una PWA anterior conserva la versión de su propio build hasta que la actualización segura existente se active; no se fuerza recarga ni se borra almacenamiento.
- Registro retroactivo de entregas, sin inventar fechas de publicaciones anteriores ni tags/despliegues históricos. El número no equivale a aprobación ni al estado de producción: main continúa en 900e470.

## Archivos y conservación

`package.json` es la fuente de versión importada por `src/app/releases.ts`; solo se actualizan los dos metadatos raíz del lockfile. No cambia ninguna dependencia bloqueada. `releases.ts` contiene el historial único de presentación; `VersionHistory.tsx` es un componente estático sin efectos ni consultas. Integración en SettingsScreen, pie de App y estilos globales; región con foco de teclado, lista cronológica y scroll interno, navegación con estado accesible.

Sin cambios en Supabase, Auth, RLS, servicios/repositorios, motor, reglas/checkpoints, XP/ELO, cola, recuperación o service worker. No nuevas cuentas/partidos ni SQL requerido para esta función estática. El acceso a Ajustes conserva su pausa habitual del partido; consultar las versiones no altera la copia pausada y permite regresar/continuar.

AGENTS, README, contexto §69 y seguimiento incorporan el mantenimiento de versión/historial. Futuras entregas incrementan parche dentro del bloque actual y menor al entregar otro bloque, manteniendo la explicación de pendientes.

## Verificación

- TypeScript y builds normal/fixture correctos.
- `npm test`: diez grupos correctos; estadísticas/análisis 42, XP 8, ELO/repositorio 14 y contratos de 04 12 conservados.
- Dos recorridos nuevos de Chromium: historial público/offline, versión coherente con package, últimas entregas explícitamente pendientes, acceso a la entrada inicial mediante scroll; consulta durante un partido real aislado conserva copia/ID y permite finalizar/guardar un único resultado.
- Revisión visual en 320×568, 390×844, 844×390, 768×1024, 1440×900 y 800×480; referencia física medida exactamente 800×480. Sin scroll general ni errores de ejecución. Capturas revisadas en `/tmp/futbolin-versions-visual`, fuera de Git.
- Revisión React: componente pequeño, datos estáticos fuera del render, identidad de listas estable, texto escapado, sin efectos ni estado duplicado ni imports de servicios. agent-browser no está instalado; se utiliza Playwright/Chromium existente.
- Primera ejecución de los nuevos casos encontró un selector de prueba ambiguo entre los dos botones CONTINUAR ya existentes; acotado a la pausa, ambos casos pasan. No fue un fallo del historial ni se modificó el motor.

Batería completa de Chromium **44/44**, sin fallos/omitidos: conserva las 42 regresiones previas y añade dos de versiones. Evidencia de publicación en ESTADO_ACTUAL. El acceso humano a proyecto/Preview está acreditado por capturas; Node 24.x se ve en Vercel. El 403 del conector y la observación del panel XP/ELO autenticado siguen separados de estos tests locales; la ampliación no los da por resueltos.
