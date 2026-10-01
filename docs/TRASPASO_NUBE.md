# Resumen del proyecto y traspaso a la nube

Fotografía del **2026-10-01**, preparada desde el PC local para que un agente nuevo continúe sin depender de este chat. No supone que se haya iniciado una nueva tarea cloud ni cerrado la fase de persistencia.

La referencia operativa viva es [ESTADO_ACTUAL.md](ESTADO_ACTUAL.md). Las decisiones y la hoja de ruta completas están en [CONTEXTO_MAESTRO.md](CONTEXTO_MAESTRO.md), con sus 84 apartados. Leer ambos y [AGENTS.md](../AGENTS.md) antes de modificar código. Este resumen no autoriza ejecutar las fases futuras.

## 1. Punto de partida que no debe perderse

- Repositorio: [altocu87/MARCADOR-FUTBOLIN-V3](https://github.com/altocu87/MARCADOR-FUTBOLIN-V3).
- Remote: `origin = https://github.com/altocu87/MARCADOR-FUTBOLIN-V3.git`.
- Rama con el trabajo reciente: **codex/reliability-offline-v1**.
- Base del traspaso: `f8ee98c`, documentación del despliegue; último cambio funcional: `9537c79`.
- `main` está en `900e470`: simulador inicial y documentación antigua, sin los avances posteriores. No fusionarla automáticamente para trasladarse a la nube.
- El documento se publica después de esa base. Sincronizar la punta remota actual, no quedarse fijado en el hash anterior.

El chat «Configurar MARCADOR-FUTBOLIN-V3» se preparó con **main**. Instaló dependencias con caché temporal, validó motor/build, comprobó Vite y guardó un **borrador** de configuración. Su informe no acredita que el entorno se haya publicado después. Tampoco acredita las seis suites ni Supabase de la rama nueva.

## 2. Qué se ha construido

### Simulador y reglas

React, Vite, TypeScript y CSS, sin migración de stack. MatchEngine independiente de React, servicios y hardware; entradas táctiles/ratón y simulación pasan por validación central.

Menú NUEVO PARTIDO / TORNEO / RANKING / AJUSTES. Tres modalidades: Rápido, Caos y Clasificatorio. Configuración por goles, tiempo o ambas; selección 1v1/2v2. Clasificatorio todavía no calcula ELO ni XP, y Torneo sigue provisional.

Cuenta atrás 3–2–1 saltable, dos partes, descanso, final, pausa/continuar, deshacer y correcciones −1. El número del marcador registra el gol del equipo: Blanco a la izquierda y Azul a la derecha. No se pregunta el goleador individual. El bloqueo central de tres segundos se conserva también al deshacer/corregir/cambiar periodo. Objetivo de goles: **suma de goles de ambos equipos por periodo**, con marcador visible acumulativo. No cambiar esta regla silenciosamente.

Empate → prórroga de 60 segundos con gol de oro → penaltis alternos, cinco intentos iniciales y muerte súbita. Cronología con estados, goles, anulaciones, tiempos y penaltis. Efectos visuales de gol: flash, explosión, ondas, partículas y líneas de velocidad.

### Interfaz adaptable y hardware de referencia

Desde la decisión posterior del propietario, la web es responsive por defecto: móvil vertical/horizontal, tablet y escritorio. No es toda la interfaz reducida como una imagen. Paneles reorganizados, controles táctiles y scroll interno cuando hace falta, sin scroll general ni `aspect-ratio` para resolver el layout. Área útil centrada con límite 1600×1000.

AJUSTES → GENERAL → VISTA DE PANTALLA conserva **PANTALLA 800×480**, la referencia física exacta, centrada y escalada proporcionalmente solo si no cabe. La preferencia es local. Redimensionar/cambiar vista no crea otro motor ni reinicia el partido.

### Persistencia privada V1

- Cliente Supabase oficial, versión fijada, tipos de base y repositorios separados.
- Cuenta de **operador** por correo/contraseña y confirmación. Los jugadores son registros privados gestionados por esa cuenta, no usuarios que deban registrarse individualmente.
- Jugadores: nombre/alias/foto URL básica, creación, edición, activación/desactivación. Eliminar solo sin historial; proteger participantes activos/pendientes del dispositivo.
- Elegir exactamente dos o cuatro jugadores activos, en orden BLANCO 1 / AZUL 1 / BLANCO 2 / AZUL 2.
- Guardado final de partido, participantes y eventos en una transacción mediante `save_match_v1`; UUID/hash estable e idempotencia para reintentos. El motor nunca llama a Supabase.
- Historial V1 en RANKING, paginado de 20 en 20, con resultado, configuración, participantes y cronología. No existe aún ranking calculado.
- MODO PRUEBA ON por defecto: no persiste partidos/eventos, cola ni checkpoints. Sin jugadores reales ofrece dos plazas de práctica. **Crear/editar jugadores con sesión sí modifica datos reales**, incluso en modo prueba.

### Fiabilidad, recuperación y offline

Internet nunca detiene una partida. No se envía cada gol a la nube. Al finalizar con prueba OFF, conservar el agregado local antes del envío; timeout de diez segundos, aviso, pendientes y reintento idempotente. AJUSTES permite consultar la cola local sin red. La app abierta reintenta al reconectar con sesión válida, fuera de partido/guardado activo; no hay sincronización con la app cerrada.

Checkpoint activo versionado y validado, por cuenta/proyecto, tras acciones y cada segundo. Recuperación explícita en el mismo navegador/origen/cuenta, con el mismo ID, jugadores, marcador y eventos. Juego recuperado en pausa; tiempo de cierre excluido. Cuenta atrás reiniciada y descanso/turnos de penaltis conservados. No retirar la copia hasta entregar el resultado a cola durable o confirmar guardado.

PWA del **build**, no de `npm run dev`: precaché de HTML/JS/CSS/manifest/iconos con lista exacta, arranque offline tras primera carga completa conectada y actualización que espera al cierre. El worker no cachea APIs, Auth ni respuestas personales. El SDK conserva su sesión por separado. La identidad local mínima no sustituye credenciales ni RLS.

ONLINE verde comprueba alcance del servidor web, no salud de Supabase. Sin conexión es ámbar. Usar una sola pestaña activa. Copias/colas locales **no son backups**, no pasan automáticamente del PC al móvil y pueden perderse si se borran los datos del navegador. Prueba física de móvil/PWA detrás de protección Vercel pendiente.

## 3. Arquitectura y dónde continuar

| Módulo | Responsabilidad |
| --- | --- |
| `src/match-engine/` | Reglas, estados, reloj, journal y checkpoints puros |
| `src/inputs/` | Contrato y adaptador pantalla/ratón; futura entrada física |
| `src/app/` | Composición, sesión, navegación, caché, checkpoint y guardado |
| `src/ui/`, `src/styles/` | Pantallas, controles, vista adaptable y física |
| `src/services/persistence/` | Modelos, contratos, mapeo, cola y almacenamiento local |
| `src/services/supabase/` | Cliente/Auth/repositorios oficiales y tipos de la base |
| `src/system/`, `tooling/`, `public/` | Conexión, instalación y generación PWA |
| `tests/`, `supabase/tests/` | Regresiones TS y pruebas SQL reproducibles |
| `supabase/migrations/` | Tres migraciones ya aplicadas, no recrearlas |

Hitos comprobados en Git: `b10b1df` simulador inicial; `eeb23b8` persistencia/fiabilidad; `176d470` recuperación activa; `917de97` PWA; `8e84e26` responsive; `9537c79` registro privado/conexión Preview. El historial incluye commits documentales entre estos hitos.

## 4. Servicios: qué existe y qué no está cerrado

### Supabase

Único proyecto autorizado: **unemjyfhzljcdjcbiiwh**, MARCADOR FUTBOLIN V3, organización Altocu, eu-west-1. Último control registrado: ACTIVE_HEALTHY, plan gratuito, cuatro tablas con RLS y advisors de seguridad sin avisos. Son observaciones anteriores de este día; comprobar de nuevo si una tarea depende del estado remoto actual.

Tablas: `players`, `matches`, `match_participants`, `match_events`. Privacidad por `owner_id`/`auth.uid()`, snapshots históricos, claves foráneas y restricciones. RPC `save_match_v1` como SECURITY INVOKER, validación de la cuenta de inicio y transacción completa. Campos XP/ELO solo reservados, sin cálculos ni progresión.

Aplicadas: `20261001053217_match_persistence_v1.sql`, `20261001055134_tighten_match_integrity.sql` y `20261001055650_bind_save_to_account.sql`. No duplicar ni restablecer el esquema. No tocar otros proyectos, desactivar RLS, borrar datos ni introducir `service_role`/`sb_secret_` en cliente/Git.

Falta permitir el retorno de confirmación en [Supabase Auth → URL Configuration](https://supabase.com/dashboard/project/unemjyfhzljcdjcbiiwh/auth/url-configuration):

```text
https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app/
```

Añadirla en Redirect URLs conservando las existentes. No se ha modificado esa configuración: el acceso de gestión disponible requería intervención del propietario. Crear/confirmar personalmente una cuenta del marcador en AJUSTES → GENERAL y ENTRAR; no pedir contraseñas por chat ni confundir Auth de la app con login administrativo.

El SMTP real del proyecto no se ha inspeccionado. **Si utiliza el predeterminado**, Supabase restringe los correos al equipo del proyecto y limita el envío; para otros destinatarios habría que configurar un envío autorizado, sin contratar nada automáticamente. [Documentación oficial SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

### Vercel

Proyecto existente **marcador-futbolin-v3**, equipo altocuvlc-9686s-projects, plan Hobby comprobado. Repositorio enlazado, producción desde main, build Vite `npm run build`, salida `dist`.

[Vista previa estable de desarrollo](https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app). Última publicación funcional comprobada: `9537c79`, despliegue `dpl_BmTTpAKaAeEbdH2nYr1jQQzQNEmx`, READY; logs y bundle remoto correctos. Los pushes documentales pueden generar otra Preview con el mismo código. Ver el estado operativo para futuras versiones.

La vista previa está protegida: puede pedir login Vercel del propietario, distinto de la cuenta del marcador. No retirar protección ni divulgar bypass. Producción sigue antigua; no se ha promovido esta rama.

`VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` configuradas **solo en Preview y solo para codex/reliability-offline-v1**. No están extendidas a producción, otras ramas ni al entorno Codex Cloud. Un nuevo nombre de rama no recibe automáticamente esa configuración. Evidencia detallada en [VERIFICACION_VERCEL_DATOS.md](VERIFICACION_VERCEL_DATOS.md).

## 5. Preparación mínima de la tarea cloud

1. En el entorno de la captura, revisar la configuración y publicar si sigue en borrador. Si se cambia el setup, republicarlo antes de iniciar una tarea nueva. Guardar un borrador no equivale a publicarlo. [Guía oficial de entornos cloud](https://learn.chatgpt.com/docs/environments/cloud-environments).
2. Usar el repositorio correcto y pedir al agente que sincronice **origin/codex/reliability-offline-v1** preservando cambios existentes. No asumir que el checkout preparado en main se cambió solo. Informar rama/SHA antes de editar y leer el contexto de la versión actual.
3. Conservar la instalación que evita el problema de caché del onboarding. Para este proyecto recomendamos Node 24 y, desde la raíz real del checkout:

```bash
node --version
npm ci --cache /tmp/codex-npm-cache
npm test
npm run build
```

El script de arranque antiguo ejecutaba solo test:engine y decía que Supabase era futura. Actualizar esas instrucciones del entorno con los seis grupos y los límites de este documento. Vite puede arrancarse con `npm run dev`; comprobar el puerto/URL que realmente exponga el entorno, sin asumir que `127.0.0.1` del PC sirve desde el móvil.

4. Para compilar y trabajar sobre reglas/UI, no hacen falta claves ni una cuenta nueva. Para probar persistencia real, configurar **variables directas del entorno** `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`, exclusivamente del proyecto autorizado. También existe compatibilidad con `VITE_SUPABASE_ANON_KEY`. Usar solo valores públicos; nunca claves administrativas. Las variables públicas de Vite terminan en el navegador. Reiniciar Vite/reconstruir tras cambios.
5. Revisar acceso de red: el setup inicial permitía gestores de paquetes; eso no acredita acceso al API Supabase. Para la prueba real se necesita HTTPS a `unemjyfhzljcdjcbiiwh.supabase.co`, además de los accesos GitHub necesarios. Comprobar permisos/conectores en la tarea nueva, sin extraer credenciales locales ni abrir indiscriminadamente la red.
6. Las sesiones CLI, `.env.local`, `.vercel`, herramientas/skills personales y capturas temporales del PC no forman parte del repositorio. Comprobar lo disponible en cloud. La [guía oficial](https://learn.chatgpt.com/docs/environments/cloud-environments) indica limitaciones actuales de uso de navegador/computer-use: si faltan herramientas visuales, dejarlo pendiente y coordinar la prueba desde el móvil del propietario; no afirmar un recorrido visual autenticado inexistente.

No es necesario mantener el PC encendido para una tarea que realmente ejecute en cloud. Esta actualización documental no transforma la conversación local ni inicia esa tarea por sí sola.

## 6. Evidencia y pendientes

En este traspaso se han reejecutado **npm test (seis grupos)** y **npm run build**: correctos, sin errores TypeScript. También se revisan integridad documental, enlaces, los 84 apartados y `git diff --check` antes del commit. No hay cambios de código, base de datos, variables, planes ni producción en este bloque.

Pruebas anteriores documentadas:

- [Persistencia V1](VERIFICACION_PERSISTENCIA_V1.md): SQL real con ROLLBACK, RLS/integridad/idempotencia y navegación con repositorios en memoria.
- [Fiabilidad](VERIFICACION_FIABILIDAD.md): bloqueo central y guardado colgado/timeout.
- [Recuperación](VERIFICACION_RECUPERACION.md): recarga/cierre, reloj, partes y penaltis conservados.
- [PWA](VERIFICACION_PWA.md): servidor realmente apagado, arranque offline, recuperación, pendiente y reconexión simulada sin duplicados.
- [Responsive](VERIFICACION_RESPONSIVE.md): tamaños emulados, continuidad al redimensionar, móvil/tablet/escritorio y vista física 800×480.
- [Conexión Preview](VERIFICACION_VERCEL_DATOS.md): configuración pública, build remoto y formulario local sin sesión.

**Mocks, SQL y bundles no sustituyen Auth real desde el navegador.** Pendiente para cerrar fase B: retorno de correo, operador confirmado, jugadores reales, partido completo con prueba OFF, filas/eventos guardados, historial/detalle, protección del jugador histórico y partido con prueba ON sin incremento de registros. Faltan también comprobación física de móvil y PWA en el origen protegido. No repetir pruebas con datos reales sin identificar cuenta y alcance.

No avanzar automáticamente a XP/ELO, estadísticas avanzadas, logros, récords, torneos completos, ESP32, sensores u OTA. Las propuestas futuras permanecen en el contexto maestro. Cualquier coste, credencial nueva, borrado o cambio importante de reglas exige detenerse y explicar el punto concreto.

## 7. Mensaje listo para iniciar la tarea cloud

Copiar este bloque en una **tarea cloud del entorno publicado**; no enviarlo a una conversación que siga ejecutando en el PC:

> Continúa MARCADOR FUTBOLÍN V3 en el repositorio altocu87/MARCADOR-FUTBOLIN-V3. Antes de modificar, identifica entorno, rama, SHA y cambios locales; consulta origin y sincroniza de forma segura origin/codex/reliability-offline-v1, donde están los avances. Main todavía es antigua: no fusionar ni recrear lo que falta allí. Lee completos AGENTS.md, docs/CONTEXTO_MAESTRO.md, docs/ESTADO_ACTUAL.md, docs/TRASPASO_NUBE.md y README. Ejecuta npm test y npm run build e informa del punto real. El próximo bloque es revisar la configuración cloud y cerrar la verificación Supabase V1 que siga pendiente, no rehacer la aplicación. Comprueba permisos/herramientas antes de operar; para cuenta, correo o gestión sin acceso, indica el paso humano exacto. No actives pagos, borres datos, reduzcas seguridad ni avances a XP/ELO/hardware. Mantén ambas vistas y actualiza el contexto con resultados reales antes de publicar.
