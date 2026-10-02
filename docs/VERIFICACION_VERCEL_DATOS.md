# Conexión de datos y registro en Preview — 2026-10-01

## Resolución del acceso del conector — 2026-10-02

Después de revocar la autorización de ChatGPT en la cuenta Vercel y «Volver a conectar» en Codex, el propietario completa una autorización OAuth nueva. Lecturas reales del agente correctas: equipo `team_WPifrklt5VQpy2RiHjVMYKXx` (`altocuvlc-9686s-projects`), proyecto `prj_eTpsa0VUnHhzEfRADuN2LlHbCoJB` (`marcador-futbolin-v3`) y Preview protegida HTTP **200 OK**. Despliegue `dpl_CXkFkbRAvShxEx3mckezkduAKL59` **READY**, SHA `c2e217a956ab0742ad2ce945bef160d81079a221`, ref `codex/reliability-offline-v1`; metadatos Vercel y revisión GitHub coincidentes al comprobar. Main permanece 900e470. No cambios de protección, entorno, costes o proyecto.

Resuelto el 403 de alcance que se registra como limitación histórica en otras entregas. Esto permite inspeccionar Vercel/HTML de Preview; no comparte la sesión Supabase del operador ni acredita un recorrido completo del agente dentro del marcador. Captura humana anterior sí confirma Preview v0.4.0/sesión activa, perfil Alex2 con 225 XP/nivel 1/30 hasta umbral 255 y ELO pendiente de aprobación. No repetir cuentas/partidos o pruebas de 01 por recuperar este acceso. ELO sigue desactivado y con decisiones pendientes; no cierre 03/04 ni inicio 05. SMTP/correos independientes.

El propietario autorizó antes de revisar la selección por proyecto; la pantalla mostraba acceso a todos los proyectos actuales/futuros. No se afirma que la autorización sea exclusiva del marcador. La tarea solo consulta ese proyecto y no modifica otros. La causa interna del 403 no se atribuye con certeza a la lista Apps vacía: la renovación completa es la acción tras la que se verifica la resolución.

CLI del propietario: sin sesión al inicio; login con cuenta existente al consultar equipos permitió ver el mismo equipo Hobby. **No recomendar `vercel oauth-apps …` para CLI 62.1.0**: la ayuda real no incluye ese subcomando, pese a aparecer en documentación indexada. Los intentos `list-requests` terminaron «Can't deploy more than one path», interpretados como argumentos del comando predeterminado; no se acredita despliegue por esos intentos. `vercel api list` sí existe, pero el catálogo pegado no contiene rutas para gestionar autorizaciones OAuth de Apps; no sirve para concluir que falten permisos ni justificar mutaciones de endpoints inventados. La solución comprobada usa el flujo OAuth real del conector, sin crear Apps, solicitar tokens por chat ni instalar/desplegar nada.

Las secciones siguientes conservan las comprobaciones históricas de conexión/registro; el estado operativo vigente y publicación están en ESTADO_ACTUAL.

Actualización del bloque 01: operador ya registrado, login y prueba 6 confirmados. Usar ENTRAR con su cuenta existente. Por petición expresa, CREAR CUENTA queda en un formulario independiente abierto por IR AL REGISTRO DE CUENTA NUEVA, sin solicitud al abrirlo. No repetir registro; los pasos de primera puesta en marcha siguientes son históricos. Evidencia vigente en [VERIFICACION_BLOQUE_01.md](VERIFICACION_BLOQUE_01.md).

## Alcance

Vercel: marcador-futbolin-v3, equipo altocuvlc-9686s-projects, repositorio altocu87/MARCADOR-FUTBOLIN-V3. Solo Preview de codex/reliability-offline-v1, sin producción/main ni retirada de protección. Supabase: unemjyfhzljcdjcbiiwh, organización gratuita Altocu. No hay migraciones nuevas ni cuentas creadas por el agente.

Variables públicas configuradas: VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. No se publican sus valores en documentación, logs o Git. En Vite son configuración del cliente, no secretos; Auth/RLS protegen los datos. Las variables no se incluyen retroactivamente en builds antiguos: el siguiente despliegue debe reconstruir desde Git.

## Registro

Una cuenta de operador gestiona sus propios jugadores y partidos; los jugadores no tienen que registrarse. Correo/contraseña con confirmación. Formulario con validación nativa; servicio con validación adicional, normalización del correo y mensajes seguros. Contraseñas nunca se solicitan por chat.

El retorno usa el origen actual con `/` final, sin parámetros/fragments. **Paso pendiente en el panel**, no realizado por el agente:

1. Abrir https://supabase.com/dashboard/project/unemjyfhzljcdjcbiiwh/auth/url-configuration e iniciar sesión en el panel.
2. En Redirect URLs, añadir exactamente:

   ```text
   https://marcador-futbolin-v3-git-codex-8b421a-altocuvlc-9686s-projects.vercel.app/
   ```

3. Guardar, conservando las URLs existentes. No autorizar comodines amplios ni desactivar confirmación. Si hay plantilla personalizada, comprobar que respeta ConfirmationURL/RedirectTo; no asumir su estado ni sustituirla sin inspeccionarla.
4. Abrir esa misma vista previa → AJUSTES → GENERAL → correo y contraseña personal → CREAR CUENTA → confirmar → ENTRAR. Si Vercel pide sesión, usar su cuenta propietaria, distinta de la del marcador.

Con SMTP predeterminado, Supabase solo envía a correos del equipo y actualmente limita los envíos a dos por hora. Para la primera prueba, utilizar el correo del equipo Supabase. No está verificada la configuración SMTP de este proyecto. Si otro correo se rechaza, no desactivar confirmación: preparar un proveedor propio, previa autorización y comprobación de costes. No se contrató ningún proveedor.

## Evidencia y pendientes

- Supabase ACTIVE_HEALTHY/free, cuatro tablas con RLS, advisors de seguridad vacíos; Auth público con email/registro habilitado y confirmación requerida.
- npm test: seis grupos, incluyendo SDK Auth con transporte aislado. npm run build: TypeScript/Vite correctos. npm audit --omit=dev: cero vulnerabilidades.
- Build real en navegador local: formulario a 390×844 y ambas vistas a 800×480, sin scroll general; entradas móviles de 48 px; consola sin errores/avisos. Esto no prueba creación de cuenta ni escritura remota autenticada.
- Vista previa remota y publicación final: consultar ESTADO_ACTUAL.md e historial Git para las verificaciones realmente terminadas. No equiparar el HTML/bundle configurado a un recorrido autenticado completo.
- Pendiente: autorizar retorno, confirmar cuenta del operador, jugadores reales, guardado de partido y detalle de historial, modo prueba sin escrituras; protección PWA y teléfono físico.

Referencias oficiales consultadas:

- [Redirecciones Auth](https://supabase.com/docs/guides/auth/redirect-urls).
- [Correo predeterminado y SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
- [Variables Vercel CLI](https://vercel.com/docs/cli/env).

El contexto vivo es ESTADO_ACTUAL.md. Los límites SMTP pueden cambiar: consultar la documentación antes de configurar un proveedor o ampliar el registro.

## Corrección de sonda en Preview protegido — 2026-10-01

Base **cb3da39**. Captura del propietario: ambos botones de acceso deshabilitados. ENTRAR/CREAR CUENTA requieren conexión/servicios y no estar ocupados; solo registro comprueba longitud de contraseña para deshabilitar. La sonda GET `/connection.json` omitía cookies del origen; Vercel protegido puede rechazarla aun con la página abierta. No es evidencia de contraseña incorrecta ni registro rechazado por Supabase.

Reproducido antes mediante cookie HttpOnly local y endpoint de fixture 401 sin cookie/200 con cookie: incluso añadiéndola, el probe antiguo seguía omitiéndola y nunca habilitaba acceso. Corrección: `credentials: same-origin`, `cache: no-store`, `redirect: error` y timeout 4 s. Valida HTTP/marcador JSON, no acepta HTML/login ni añade Authorization. Conserva protección Vercel; sin cambios de variables, Auth, RLS, precaché worker o datos.

SettingsScreen añade causa visible del bloqueo por conexión/solicitud. npm test (siete grupos, estadísticas/análisis 41/41), TypeScript/builds normal/fixture y test:browser **11/11** correctos. Nuevo recorrido verifica bloqueo sin cookie y habilitación con cookie, formulario/aviso en 320×568, 390×844 y 800×480/física; datos ficticios sin pulsar acceso/enviar correo y Supabase bloqueado. Probe: no-store/mismo origen/no Authorization/señal, 401, marcador ajeno, HTML y rechazo de redirección. Antes: fallo esperado; después: pasa. Revisión visual local sin pageerror.

Revisión visual detectó que el aviso podía solaparse con los botones en físico; corregido con scroll interno/min-height de paneles de Ajustes en global.css. Regresión de navegador usa elementFromPoint sobre el botón para comprobar que el aviso no intercepta el toque. Capturas bajo `/tmp/futbolin-auth-blocked-*.png`, fuera de Git. Sin scroll general.

Limitación: lectura al Preview real denegada por proxy cloud (CONNECT 403). No se verificó despliegue actualizado ni acceso del propietario. No se pide contraseña ni se elude política. Publicación Git se informa por commit/push comprobados; cuando esté disponible Preview, cerrar/reabrir pestañas activa actualización si hay worker previo. COMPROBAR CONEXIÓN permite continuar si el origen devuelve la sonda autorizada. Si sigue bloqueado, revisar indicador/aviso y despliegue, no volver a modificar Supabase sin evidencia.
