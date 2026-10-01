# Correos de Marcador Futbolín V3

Trece plantillas HTML en español, con la estética oscura/cian del marcador, tablas e inline CSS para clientes de correo. No contienen imágenes remotas, JavaScript, formularios, seguimiento ni credenciales. Los asuntos están en [manifest.json](manifest.json).

**Estado: preparadas y verificadas localmente; todavía no aplicadas al proyecto hosted.** El conector disponible no incluye edición de Auth y este entorno no tiene credencial Management API ni sesión del panel. Publicar Git/Preview no actualiza estas plantillas en Supabase.

## Aplicación al proyecto existente

Proyecto autorizado: `unemjyfhzljcdjcbiiwh`. No crear otro proyecto ni modificar SMTP, confirmación, Redirect URLs o proveedores por rutina.

1. Abrir [Supabase → Authentication → Email Templates](https://supabase.com/dashboard/project/unemjyfhzljcdjcbiiwh/auth/templates).
2. Guardar una copia del asunto y cuerpo actuales antes de sustituir cada plantilla. Para cada entrada de manifest.json, copiar el `subject` al asunto y el HTML del archivo indicado al cuerpo; guardar y usar la vista previa del panel.
3. Priorizar **Confirm signup → confirmation.html**, **Reset password → recovery.html**, **Change email address → email_change.html** y **Reauthentication → reauthentication.html**. Completar Invite y Magic link con sus HTML. Prepararlos no habilita esos métodos de acceso.
4. Actualizar el diseño de las siete notificaciones de seguridad donde el panel permita editarlo. Conservar su estado habilitado/deshabilitado y la configuración existente: no activar teléfono, MFA, proveedores OAuth ni otros flujos por personalizar sus correos.
5. Comprobar el correo real de recuperación/cambio de contraseña usando la cuenta existente cuando el operador quiera realizar esa acción. No crear otra cuenta para probar el aspecto del correo de registro: el panel permite previsualizarlo.

También se entrega un cuerpo JSON para un PATCH de Management API autorizado:

```bash
node tooling/auth-email-config.mjs > /tmp/marcador-auth-email-config.json
```

Destino documentado: `PATCH https://api.supabase.com/v1/projects/unemjyfhzljcdjcbiiwh/config/auth`. El JSON contiene solo los 26 campos de asunto/cuerpo; no realiza una petición ni habilita notificaciones. Antes de aplicarlo, leer los valores actuales, respaldar únicamente esos campos, comprobar compatibilidad con el proyecto y comparar después los campos escritos. Utilizar la credencial de gestión exclusivamente en un entorno seguro; no incluirla en VITE, Git o chat. Si el panel no expone alguna notificación, este payload queda listo para aplicar con acceso Management API autorizado.

## Conservación de los flujos

Los correos con acción mantienen `{{ .ConfirmationURL }}` tanto en botón como en enlace alternativo. El correo de reautenticación mantiene `{{ .Token }}`. No construir URLs de verificación propias, cambiar el tipo de token ni introducir enlaces de seguimiento. Las variables de texto de notificaciones/cambio de correo usan el escape `html` de Go Templates; no se incluyen metadatos editables de usuario.

Las notificaciones informan de los cambios sin ofrecer enlaces de autenticación ni pedir contraseñas. Se incluyen variantes para contraseña/correo/teléfono, MFA añadido/retirado e identidad vinculada/desvinculada; su existencia en el repositorio no activa esas funciones. Google y Drive siguen pendientes para una fase posterior.

## Evidencia y límites

`npm run test:auth` verifica el payload acotado, asuntos, variables y enlaces. Chromium comprueba los trece HTML a 390 px, sin desbordamiento horizontal ni tráfico externo. La sustitución de variables utilizada para mostrar HTML es solo una previsualización local: no verifica el motor de plantillas hosted, SMTP, Gmail/Outlook ni la entrega del correo. Se conserva el paso de vista previa/render real en el panel y recepción humana. No se enviaron correos ni se cambiaron cuentas reales.

Referencia vigente: [Email Templates de Supabase](https://supabase.com/docs/guides/auth/auth-email-templates).
