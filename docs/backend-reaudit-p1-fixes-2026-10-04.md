# Correcciones P1 de la segunda auditoría — 4 de octubre de 2026

## 1. Posiciones y relaciones del mismo site

`PositionService` delega creación y actualización a `PositionPersistence`, siguiendo la separación entre servicios y persistencia transaccional existente en el backend.

- Se requiere un site activo, no eliminado, y un nivel activo del mismo site.
- La jerarquía de niveles se recorre dentro del mismo site y se rechazan ciclos o padres inválidos.
- Responsable y usuarios asignados deben tener una membresía activa en ese site y una cuenta activa, no eliminada.
- Los nombres de site, nivel, área y responsable y la ruta se obtienen de los registros validados; no se confía en los textos recibidos del cliente.
- Una posición existente no puede cambiar de site.
- La posición y sus asignaciones se guardan en la misma transacción. Si falla una relación, se revierte la operación completa.
- `userIds: []` elimina todas las asignaciones. Omitir `userIds`, o enviarlo como `null`, conserva las asignaciones y valida que sigan siendo admisibles.
- El listado de usuarios de una posición exige membresía activa en su site y devuelve únicamente posiciones de ese mismo site, para contener relaciones históricas inválidas.
- Ambos endpoints de posiciones por usuario excluyen asignaciones eliminadas y posiciones de sites en los que el usuario no tiene una membresía activa.

Los datos históricos no se modifican automáticamente. Una posición con nivel, responsable o usuarios inválidos debe corregir esas referencias para poder actualizarse. El frontend existente ya envía IDs de site, nivel y usuarios; no requiere cambios para los casos válidos.

## 2. Login rápido con membresías activas

Una política común, `getActiveSiteMemberships`, exige cuenta, membresía y site activos y no eliminados. Tanto `AuthService` como `AuthGuard` utilizan esa política.

- La búsqueda por Fast Password exige cuenta activa, membresía activa y site activo, sin referencias eliminadas.
- El actor y la cuenta destino deben compartir una membresía activa en el site utilizado para el login.
- `/auth/login-fast` admite `siteId` opcional para elegir explícitamente un site del actor. Para conservar compatibilidad con clientes que sólo envían PIN, plataforma y timezone, se utiliza la primera membresía activa disponible del actor cuando no se especifica `siteId`.
- El JWT de la sesión rápida incluye `fastSiteId`, que identifica el site usado para autenticar. En cada petición privada se vuelve a comprobar la membresía de actor y destino en ese site. Una revocación o inactivación posterior invalida el uso de esa sesión.
- La respuesta utiliza el site de autenticación para company, logo y vencimiento, y sólo incluye membresías activas del destino.

La autorización por roles y sites de la identidad destino conserva el modelo del proyecto; `fastSiteId` sirve para validar la relación que autorizó el cambio de identidad. No se introdujo una política nueva que limite todos los permisos de esa identidad a un único site.

Las sesiones rápidas emitidas por la versión anterior no contienen `fastSiteId` y serán rechazadas al desplegar esta versión. Es necesario volver a realizar el login rápido; la sesión primaria permanece utilizable. No se requieren columnas ni migraciones nuevas para el claim firmado.

## 3. Escrituras parciales de recuperación y tokens push

- Recuperación actualiza únicamente `resetCode` y `resetCodeExpiration`.
- La escritura de recuperación incluye el ID y el email leído en su condición: si el email cambia concurrentemente, no se envía un código a la dirección anterior.
- Registro de token push actualiza únicamente el token y la versión del sistema operativo solicitado, más `updatedAt`.
- La respuesta de registro de token se vuelve a leer de DB después de escribir.

Estas operaciones ya no guardan el snapshot completo del usuario y, por tanto, no restauran una contraseña, Fast Password o estado antiguo ni pisan los tokens de otros sistemas operativos.

Se adaptó el mock de la prueba existente de recuperación al uso de `repository.update`, sin añadir casos nuevos ni ejecutar la suite.

## Comprobaciones

Pasaron `npm run build`, TypeScript sin emisión (incluyendo las fuentes de la suite existente), lint de los archivos modificados y `git diff --check`. No se ejecutaron pruebas funcionales o de integración, no se aplicaron migraciones y no se contactaron servicios externos. La compilación no valida el comportamiento real de los bloqueos en MySQL.
