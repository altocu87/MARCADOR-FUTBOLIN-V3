# Verificación responsive — 2026-10-01

Petición: adaptar la aplicación web, manteniendo la referencia física y las reglas existentes. Implementación en Windows local, rama codex/reliability-offline-v1. No es un despliegue ni una prueba en un teléfono físico.

## Presentación

WEB ADAPTABLE por defecto; selector en AJUSTES → GENERAL. PANTALLA 800×480 conserva medidas, centrado y escala original. Preferencia versionada en localStorage; no afecta a Auth, datos ni motor. Se conserva el mismo árbol React al cambiar vista. CSS específico separado en responsive.css, container queries según ancho/altura/orientación, límites de fuentes, áreas seguras y viewport visible. Sin aspect-ratio ni recursos visuales externos. Cuenta atrás mediante botón nativo, iconos decorativos aria-hidden, menú con aria-current y selector con aria-pressed. Campos de 16px/48px y controles principales de al menos 44px de alto en web; números siguen siendo botones de gol.

## Matriz de navegador

Medida DOM real del documento y del canvas adaptable, navegador integrado Chromium, sin scroll general:

| Ventana | Canvas web | Presentación |
| --- | --- | --- |
| 320×568 | 320×568 | Menú compacto, tarjetas apiladas, scroll interno si falta altura |
| 390×844 | 390×844 | Marca y navegación con iconos, tres tarjetas completas |
| 844×390 | 844×390 | Navegación compacta, tres tarjetas en fila |
| 800×480 | 800×480 | Web horizontal, referencia física alternativa disponible |
| 768×1024 | 768×1000, centrado vertical | Tarjetas amplias apiladas |
| 1440×900 | 1440×900 | Marca junto al menú, tres columnas |
| 2560×1440 | 1600×1000, origen 480/220 | Área útil centrada y espacio alrededor |

Vista física: 800×480 en ventana 800×480; misma medida a origen 240/120 en 1280×720; escala proporcional a 390×234 y origen 0/305 en 390×844. Ningún cambio de motor al alternar vistas. Preferencia física conservada después de recargar y restaurada a adaptable.

## Recorridos realizados

- Nuevo partido/configuración: GOALS y BOTH; dos steppers en móvil estrecho sin overflow horizontal, botones 44×44; selección 1v1/2v2, tres jugadores rechazados, cuatro aceptados. Cuenta atrás saltada con Space.
- Partido 2v2: 1–0, gol azul rechazado durante bloqueo; pausa a 04:17. Redimensionado a 320×568, 844×390, 800×480, 768×1024 y 1440×900: mismos goles, reloj y cuatro participantes. Ambas vistas alternadas en Ajustes y vuelta al partido. Primera parte 2–0 → segunda → final 4–0; modo prueba no guarda nada.
- Jugadores con repositorios en memoria: crear nombre largo/alias, editar alias y desactivar. Formulario a 320×400 con scroll interno y guardado alcanzable. Lista móvil con acciones por fila. No se eliminaron jugadores ni se enviaron datos reales.
- Recuperación con prueba OFF en fixture: gol 1–0 → recarga → PARTIDO POR RECUPERAR a 320×568 → recuperar en pausa → continuar. Sin tiempo añadido al cierre.
- Penaltis forzados con panel de desarrollo: 320×568, 390×844, 844×390 y 800×480; goles/fallos de 48px de alto y equipos a izquierda/derecha. Alternancia correcta → victoria 3–0 → historial/detalle con doce eventos. Mensaje de guardado en fixture representa repositorio en memoria, NO Supabase real.
- Guardado fallido aislado (?save=offline): partido por goles, una condición por parte, final 2–0 → un pendiente → lista/detalle/cronología. Detectado y corregido solapamiento de paneles Ajustes que interceptaba el toque; verificado acceso tras corrección. Recarga sin parámetro → sincronización simulada → cero pendientes. Restaurado prueba ON.
- Altura extrema 320×240: documento sigue 320×240, partido usa scroll interno para conservar controles. No se promete mostrar todos simultáneamente en una pantalla insuficiente ni se reducen a objetivos táctiles diminutos.
- Build normal servido en puerto propio 5202: vista adaptable por defecto, sin sesión, formulario de acceso con campos 48px/16px, paneles sin solapamiento. OFFLINE DISPONIBLE → apagar preview → cerrar pestaña → reabrir mismo origen: aplicación responsive completa desde caché, SIN CONEXIÓN. Sin autenticarse ni enviar formularios.

Consola de aplicación sin avisos/errores capturados durante recorridos conectados y la reapertura offline. La sonda de red se trata como falta de conexión, sin bloquear la aplicación. Servidores/pestañas propios y override de viewport se retiran al terminar; no se detiene el servidor del usuario en 5173.

## Pruebas y build

- npm test: motor, persistencia, recuperación, offline y presentación correctos.
- npm run build: TypeScript y Vite correctos, sin advertencias finales.
- npm run build:test-offline: correcto; fixture fuera del build normal.
- Separación de React en react-vendor (~219kB), aplicación (~280kB) y runtime (~0.6kB); elimina advertencia de paquete único mayor de 500kB. Todos son estáticos incluidos en precaché existente, comprobados con servidor apagado.
- Revisión React: imports directos, estado de preferencia lazy, listeners con cleanup, motor estable, componentes externos al render, sin any ni nuevas dependencias. Sin cambios de reglas o de servicios/migraciones.

Capturas locales ignoradas por Git en tmp/: responsive-menu-390.png, responsive-menu-768.png, responsive-menu-1440.png, responsive-partido-movil.png y responsive-produccion-movil.png. Son evidencia del PC de verificación, no assets requeridos por la aplicación.

## Límites y continuidad

Se probaron tamaños emulados en Chromium; todavía hace falta comprobar móvil físico (teclado, áreas seguras, instalación PWA), Safari/Firefox y pantallas reales del hardware. No es posible garantizar estética perfecta en cualquier navegador antiguo o pantalla arbitrariamente pequeña. El zoom permanece bajo control del usuario. Se usan navegadores modernos con container queries.

No se modificó ni desplegó Vercel, no hubo cambios de datos/migraciones Supabase y no se cerró la fase B: siguen pendientes cuenta de operador, recorrido autenticado real y revisión/promoción a main. No se implementó firmware, XP/ELO, estadísticas o torneos. El siguiente bloque recomendado es comprobar esta vista en el móvil físico y cerrar el E2E de persistencia cuando exista acceso al marcador publicado.

Referencias técnicas primarias: [container queries — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries), [unidades de longitud — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/length), [code splitting — Rolldown](https://rolldown.rs/reference/OutputOptions.codeSplitting).
