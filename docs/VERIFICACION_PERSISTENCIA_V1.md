# Verificación de persistencia V1 · 1 de octubre de 2026

## Verificado

- Pruebas originales del motor: npm run test:engine, resultado correcto.
- Pruebas nuevas: npm run test:persistence, resultado correcto. Mapeo, 1v1/2v2, inactivos, cronología, corrección/deshacer, reloj GOALS, prórroga/penaltis, modo prueba sin escrituras, errores, reintentos y aislamiento local por cuenta.
- npm run build: TypeScript y Vite correctos. npm audit: cero vulnerabilidades.
- Proyecto Supabase existente: unemjyfhzljcdjcbiiwh. Tres migraciones aplicadas; no se creó otro proyecto ni se activó un plan de pago.
- supabase/tests/persistence_v1.sql ejecutado en la base real: aislamiento RLS, permisos reservados, idempotencia, agregado completo, rollback ante errores, eliminación segura, snapshot, secuencia, modo prueba y cuenta de inicio. Fixtures revertidos con ROLLBACK. Comprobación posterior: cero cuentas y filas de negocio.
- REST real con clave publishable: lectura de players y ejecución de save_match_v1 rechazadas sin sesión (42501). No se usó service_role.
- Advisors de seguridad: cero avisos. Rendimiento: relaciones indexadas; queda un aviso INFO de índice sin uso en una base recién creada, no se elimina el índice que soporta la política de eventos. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index
- Navegador: menú, Ajustes, partido de práctica completo 1v1 y resumen con NO SE HA GUARDADO NADA.
- Fixture UI aislada: formulario y creación de cuatro jugadores, validación de selección (tres no permite iniciar), 2v2, cuenta atrás, goles, ambas partes, resumen, lista de historial y detalle de siete eventos.
- Dimensiones medidas: lienzo lógico 800×480, página 800×480 sin overflow y panel de contenido 386 px sin desbordamiento; desplazamiento solo dentro de cronología. También se comprobó ventana estrecha de 755 px, corrigiendo el centrado que recortaba un borde, y ventana mayor de 1280×720.
- Build de producción servido mediante Vite preview: interfaz visible, navegación a Ajustes y consola sin errores/advertencias. Durante reinicios de desarrollo el panel integrado mostró avisos del WebSocket de recarga de Vite; no aparecen en producción.
- .env.local, node_modules, dist y caché de Supabase ignorados. .env.example contiene solo nombres vacíos. Búsqueda de claves privadas/tokens en fuentes versionables sin coincidencias.

## Nota vigente del bloque 01

El operador ya tiene cuenta confirmada, login y prueba satisfactorios. El agente comprobó el agregado real 2–0 y la RPC actual con ROLLBACK; no se necesita otra cuenta. Pendientes concretos y evidencia actual en [VERIFICACION_BLOQUE_01.md](VERIFICACION_BLOQUE_01.md). Las instrucciones de registro y la afirmación de ausencia de cuentas que siguen son históricas, sustituidas por ese estado.

## Pendiente histórico: acceso humano

No existe aún una cuenta de operador. La prueba UI con repositorios en memoria NO demuestra un guardado autenticado de navegador a Supabase. La prueba SQL sí valida la transacción y RLS, pero no sustituye este último recorrido:

1. En la aplicación real local (no en /tests/ui-fixture.html), abrir AJUSTES → GENERAL.
2. Introducir personalmente correo y contraseña y pulsar CREAR CUENTA. Confirmar el correo si se solicita e iniciar sesión con ENTRAR.
3. Crear dos jugadores, editar uno y verificar desactivar/activar; MODO PRUEBA OFF.
4. Completar un partido y confirmar PARTIDO GUARDADO EN SUPABASE.
5. Abrir RANKING → HISTORIAL y detalle; comprobar filas de las tres tablas del agregado.
6. Verificar que eliminar un participante con historial se rechaza y la baja lógica funciona.
7. Repetir en modo prueba ON y comprobar que los contadores de partidas/eventos no aumentan.

No compartir contraseñas en el chat. El acceso es propio de la app, distinto del panel administrativo de Supabase. No se ha desactivado RLS ni confirmación de correo para facilitar pruebas.

La integración en main sigue pendiente de esta validación autenticada. El código y las migraciones se comparten en la rama de revisión `codex/reliability-offline-v1`, junto con el refuerzo documentado en `VERIFICACION_FIABILIDAD.md`; consultar Git para comprobar el push. Publicar esa rama no convierte las pruebas aisladas en un recorrido autenticado aprobado. No se ha configurado ni solicitado despliegue en Vercel. No se han implementado cálculos de XP/ELO, logros, torneos ni firmware.
