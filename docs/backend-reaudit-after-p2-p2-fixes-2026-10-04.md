# Correcciones de los P2 de la nueva auditoría

Fecha: 2026-10-04. Alcance: hallazgos **4–11** de `backend-reaudit-after-p2-2026-10-04.md`. Cambios exclusivamente en el backend, siguiendo la separación entre servicios, consultas y persistencias transaccionales.

## Cobertura

| Hallazgo | Corrección en código |
| --- | --- |
| 4. Movimiento de niveles | Se conserva la transacción y los parches de padre/profundidad añadidos con los P1. Ahora también se recalculan nivel, área y ruta de las posiciones afectadas, junto con las ubicaciones de tarjetas. |
| 5. Reordenamientos | Posiciones y schedules intercambian sólo `order` y `updatedAt` en una transacción. Se vuelven a leer bajo bloqueo, se excluyen registros eliminados/inactivos y la eliminación de schedules comparte el protocolo. Un fallo revierte ambos lados del intercambio. |
| 6. Orden de bloqueos | Configuraciones CILT, posiciones, masters, secuencias y jerarquías obtienen primero el bloqueo exclusivo del site. Creación de ejecuciones comparte ese bloqueo. Las ediciones y eliminaciones de masters/secuencias también pasan por sus persistencias. |
| 7. Generación inactiva | Las consultas de secuencias y schedules exigen secuencia y master activos. La generación manual y la persistencia final rechazan nuevos trabajos para masters/secuencias I/D o eliminados, incluso si el generador conserva una lectura anterior. |
| 8. Reportes por día | Los cuatro reportes CILT filtran con límites UTC calculados desde las fechas locales de cada site. Los reportes diarios agrupan los instantes por fecha local en Node; las tarjetas relacionadas usan la misma fecha y filtros. |
| 9. Transporte UTC | Runtime y DataSource de scripts usan `timezone: Z`. Cada conexión nueva del pool encola `SET SESSION time_zone = '+00:00'` antes de entregar la conexión. La comprobación de preparación de DB exige ambas condiciones. |
| 10. Clonación y commit | El resultado se prepara dentro de la transacción, como en la corrección P1. La notificación de clonación se guarda ahora en el outbox con el mismo manager; se confirma junto con el árbol y no depende de una llamada posterior a Firebase. |
| 11. Intentos del outbox | El contador `attempts`, incrementado bajo bloqueo, identifica el claim. Renovación, éxito y fallo comparan ID + PROCESSING + intento. Se renueva cada minuto y se respeta el máximo de ocho intentos al recuperar claims vencidos. |

## Transacciones y concurrencia

`src/common/database/site-transaction.ts` centraliza el protocolo. La lectura inicial de un recurso sólo identifica el site; la entidad que se modifica se vuelve a leer bajo bloqueo después de bloquear el site. Un recurso eliminado entre ambas lecturas no se revive. Las transacciones usan `READ COMMITTED`.

Se reintenta la transacción completa hasta tres veces únicamente cuando MySQL confirma un deadlock (`ER_LOCK_DEADLOCK` / 1213). No se reintentan fallos de red ni commits de resultado incierto. Los callbacks contienen operaciones de DB; el despacho externo ocurre fuera de ellos.

La validación de usuarios de posiciones bloquea la membresía después del site, pero consulta el usuario sin bloqueo adicional. Así no introduce el ciclo site → usuario contra los escritores de credenciales que adquieren usuario → site. Las mutaciones de recursos requieren un site activo y no eliminado. El orden se valida contra el rango 1–127 de las columnas TINYINT actuales.

## Generación y reportes

El control de actividad se aplica al crear trabajo nuevo. Una ejecución ya existente conserva su identidad y estado; su consulta idempotente no recrea trabajos cancelados. Las actualizaciones de ejecuciones históricas siguen su política de estados existente.

Los filtros de reportes requieren fechas de calendario `YYYY-MM-DD`, un rango no invertido e IDs positivos completos. Cada site usa su zona IANA y sus propios límites, incluido cambio de horario. Las consultas no dependen de las tablas de zonas horarias de MySQL ni de la zona del host. Los reportes administrativos pueden incluir historia de sites inactivos no eliminados, conservando los guards existentes.

Se conservan los campos de respuesta de los cuatro reportes. Una referencia `amTagId = 0` ya no cuenta como anomalía. Las tarjetas relacionadas se deduplican por fecha y sólo se devuelven cuando pertenecen al mismo site que su ejecución.

## Outbox

No se requiere una columna nueva: el contador del intento ya existe y sirve como identidad monotónica del claim. Un worker anterior no puede renovar, cerrar o reprogramar el intento de un worker nuevo. La renovación impide recuperar un despacho que sigue vigente durante más de cinco minutos en condiciones normales. Si se detecta pérdida de la concesión antes del envío, no se inicia ese envío.

La entrega sigue siendo al menos una vez. Un proceso puede caer después de enviar y antes de registrar el éxito; los consumidores deben deduplicar por ID de evento. Un envío externo ya iniciado no puede cancelarse por la comparación de estado de DB.

## Preparación del despliegue

1. Detener o drenar generadores y workers de versiones anteriores antes del cambio. Un worker antiguo no compara el intento al finalizar y no debe coexistir con el protocolo nuevo.
2. Confirmar las migraciones existentes, incluyendo `AddSiteTimezone`, y el esquema del outbox. Estas correcciones no añaden migraciones.
3. Revisar la zona histórica del proceso y de las sesiones MySQL: los DATETIME anteriores pueden representar hora local en vez de UTC. Reconciliar horarios pendientes, identidades de programación y fechas del outbox (`available_at`, `locked_at`, `sent_at`) antes de habilitar el nuevo transporte. No se debe desplazar toda la historia por un offset fijo, especialmente con DST o varios sites. Los TIMESTAMP requieren revisar su representación efectiva por separado.
4. Ejecutar `npm run db:verify` en el entorno destino y validar que todas las conexiones usan UTC. El comando se ha actualizado, pero no se ejecutó en esta sesión.
5. Validar en integración la concurrencia de reordenamientos/eliminaciones, rollback, desactivación frente al generador, días locales con varias zonas y recuperación del outbox.

No se reescribieron datos históricos ni se aplicaron migraciones. Los árboles, relaciones y horarios históricos inválidos siguen requiriendo reconciliación del entorno.

## Comprobaciones locales

- `npm run build`: correcto.
- `./node_modules/.bin/tsc --noEmit`: correcto, incluyendo fixtures existentes.
- ESLint de los archivos modificados y nuevos: correcto.
- `git diff --check`: correcto.

Se adaptaron firmas y expectativas de fixtures existentes sin añadir casos de prueba. No se ejecutaron pruebas unitarias/funcionales, consultas de DB, migraciones ni llamadas a Firebase, correo o R2.

Los ocho P2 quedan cubiertos en código. El **P3 12**, clasificación HTTP de errores internos, sigue pendiente. La compilación y revisión estática no confirman por sí solas que el entorno de producción esté al 100%; quedan los pasos de preparación e integración anteriores.
