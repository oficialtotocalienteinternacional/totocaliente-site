# Auditoría inicial — Toto Caliente
Fecha: 2026-11-15
Rama: mejoras-seguras
Base: main

## Alcance
Revisión estática de los archivos públicos del repositorio. No se modificó la rama main ni la web de producción.

## Hallazgos críticos

1. **Credenciales de MongoDB expuestas en el código**
   - La URI de conexión aparece directamente en los archivos de API.
   - Acción inmediata: rotar/revocar la contraseña del usuario de base de datos en MongoDB Atlas. Tratar la credencial anterior como comprometida.
   - La nueva URI debe guardarse como variable de entorno en Vercel (por ejemplo, MONGODB_URI), nunca en el repositorio.

2. **Endpoint administrativo expone credenciales**
   - api/admin-logs.js contiene una clave administrativa fija en el código y devuelve contraseñas de usuarios.
   - Acción: deshabilitar/eliminar este endpoint y revisar los registros de acceso. No se deben recuperar ni mostrar contraseñas.

3. **Contraseñas almacenadas en texto plano**
   - api/registro.js inserta el campo password sin hash.
   - Acción: suspender el registro hasta diseñar autenticación real. Si se mantiene, usar hash resistente (Argon2id o bcrypt), validación, límites de solicitudes y respuestas que nunca devuelvan credenciales. No migrar contraseñas en texto plano como si fueran hashes.

4. **CORS demasiado permisivo**
   - La API de registro permite cualquier origen.
   - Acción: restringir los orígenes a los dominios autorizados y aceptar solo los métodos y cabeceras necesarios.

## Hallazgos funcionales

- Los formularios de login/registro de index.html no autentican usuarios: la función ejecutarAccion ignora las contraseñas y simula una sesión en localStorage.
- El contador de miembros se incrementa localmente en el navegador; no representa miembros reales.
- El indicador de conectados se genera con números aleatorios.
- usuarios.js usa IDs de formulario que no coinciden con los IDs de index.html y no aparece enlazado desde esa página.
- Hay varias filas de canales con el texto “COMPRAR ESTA FILA” repetido.
- Algunos nombres de canales y sus destinos de Telegram no coinciden; verificar cada destino con el propietario antes de corregirlo.
- El sitemap tiene una fecha lastmod antigua y requiere actualizarse cuando haya cambios reales.
- El título, canonical y meta description existen; revisar coherencia y contenido SEO antes de modificarlos.

## Plan seguro

1. Rotar primero las credenciales expuestas y deshabilitar el endpoint administrativo.
2. Confirmar en Vercel las variables de entorno y la configuración de despliegue.
3. Decidir si los formularios de cuenta deben eliminarse o convertirse en autenticación real. No simular registros.
4. Crear pruebas para los enlaces de Telegram/WhatsApp y validar cada destino con el propietario.
5. Implementar mejoras de SEO, accesibilidad, rendimiento y analítica en esta rama.
6. Probar el despliegue Preview de Vercel, sin tocar Production.
7. Revisar el diff y aprobar explícitamente antes de fusionar a main.

## Estado
- Rama de trabajo creada desde main: mejoras-seguras.
- Sin cambios en main.
- Sin cambios en la web publicada.
- No se han copiado credenciales al informe.
