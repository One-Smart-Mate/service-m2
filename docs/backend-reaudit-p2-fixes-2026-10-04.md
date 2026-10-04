# Correcciones P2 de la segunda auditoría — 2026-10-04

Alcance: hallazgos 4–10. Cambios en el backend siguiendo la separación de servicios, persistencias transaccionales y políticas. El punto 8 ya estaba cubierto por `PositionPersistence` en la corrección del P1 de posiciones.

## Cambios

| Hallazgo | Corrección |
| --- | --- |
| 4. Fast Password repetida | Política común en creación, vinculación, importación, cambios y rotación. Transacciones `READ COMMITTED`, bloqueo de los sites en orden numérico y consulta del digest después del bloqueo. La importación comprueba también duplicados dentro del lote y se guarda completa o se revierte. El login consulta hasta dos cuentas y rechaza resultados ambiguos. |
| 5. Ejecuciones CILT reabiertas | Política común de estados `A/D/R/I/C`; `R/I/C` son terminales. Una actualización idéntica es un reintento; cambiar estado, inicio o detalles del cierre devuelve conflicto. |
| 6. Inicio/cierre con lecturas antiguas | Validación y escritura dentro del bloqueo de la ejecución. Inicio exige `A`; cierre exige `A` e inicio existente, con fin posterior o igual al inicio. La duración real se calcula en segundos. Los reintentos idénticos conservan datos y fechas originales. |
| 7. Horarios dependientes del servidor | Campo `sites.timezone`, fecha de calendario validada y conversión explícita de fecha/hora local a UTC. Generación, consultas operativas por usuario/site/secuencia y vista del día comparten la zona del site. El cron calcula el día de cada site. |
| 8. Reemplazo parcial de asignaciones de posiciones | `PositionPersistence` valida antes de guardar y reemplaza usuarios en la misma transacción que la posición. El fallo de cualquier escritura revierte el conjunto. No se duplicó esa implementación. |
| 9. Configuraciones CILT incompatibles | `CiltConfigurationPersistence` comprueba la combinación final de site, master, posición, nivel y secuencia bajo transacción. La secuencia debe pertenecer al master indicado. Horarios por lote se guardan juntos; la actualización no permite mover la configuración a otro site. Las lecturas para generación excluyen configuraciones históricas incompatibles y usuarios sin membresía activa en el site de su posición. |
| 10. Descarte sobre tarjetas terminales | Descarte permitido desde `A/P/V`. Repetir el mismo descarte con igual actor, motivo y comentarios devuelve la tarjeta sin cambiar fecha ni crear otra nota. Cambiar datos de un descarte o descartar `R/C` devuelve conflicto. Tarjeta y nota se guardan juntas. Prioridad, mecánico y vencimiento también quedan protegidos en estados terminales. |

## Reintentos y compatibilidad

- Colisiones de Fast Password devuelven HTTP 409 y revierten la transacción. Vincular una cuenta conserva sus credenciales; si su clave colisiona, debe resolverse antes de vincularla. La reserva incluye membresías inactivas no eliminadas para impedir que una activación posterior introduzca ambigüedad. Una cuenta con varios sites debe tener una clave libre en todos ellos.
- El generador automático y la selección de claves distintas dentro de la importación tienen intentos acotados. La consulta previa del generador ayuda a seleccionar la clave; la garantía de exclusión está en la persistencia bloqueada. Un conflicto concurrente requiere reintentar la operación.
- Inicio mantiene la respuesta `UpdateResult` usada anteriormente. Cierre y descarte devuelven la entidad. Campos de cierre omitidos conservan su valor actual.
- La actualización genérica permite sincronizar un cierre offline de una ejecución `A` con inicio y fin válidos en una sola petición. La duración recibida, si existe, debe coincidir con las fechas. El primer cierre confirmado queda congelado; otro cierre con datos distintos devuelve HTTP 409.
- Las fechas de inicio/fin se normalizan a segundos, la precisión actual de las columnas MySQL. Un reintento con la misma fecha dentro de ese segundo es idéntico.
- La eliminación de ejecuciones sólo admite `A/D`; no modifica estados terminales.

## Zona horaria y despliegue

Migración nueva: `AddSiteTimezone1791072000003`, archivo `src/migrations/1791072000003-AddSiteTimezone.ts`. Añade `sites.timezone` como `varchar(64) NOT NULL` con valor inicial `America/Mexico_City`. No se ejecutó contra una base de datos.

1. Aplicar la migración antes de iniciar esta versión del backend; `synchronize` y `migrationsRun` permanecen desactivados. Compilar primero para que TypeORM encuentre el archivo en `dist/migrations`.
2. Confirmar la zona IANA de cada site y revisar las ejecuciones ya generadas antes del cambio de conversión. La migración no desplaza horarios históricos ni elimina duplicados. Si el servidor anterior usaba otra zona, se debe reconciliar la programación pendiente antes de habilitar el nuevo generador para esos días.
3. Revisar claves rápidas históricas repetidas por site y configuraciones CILT con referencias incompatibles. El login rechaza ambigüedades y la generación omite configuraciones inválidas; los registros históricos se conservan para su corrección.
4. Ejecutar la comprobación de preparación de DB en el entorno de despliegue. Se añadió la migración, columna no nullable, índice de digest y motores InnoDB requeridos para las nuevas transacciones a `src/scripts/verify-database-readiness.ts`.

Los DTO de creación/actualización de sites aceptan `timezone` opcional. Se valida con `Intl` y se guarda su identificador canónico. Omitirlo al crear usa el valor por defecto; omitirlo al actualizar conserva el existente. La API rechaza cambiar la zona cuando ya existen ejecuciones, incluso eliminadas, para mantener estable la identidad programada. Cambiar una zona histórica requiere una migración de datos específica que reconcilie esas ejecuciones.

El cron se despierta cada cinco minutos, procesa como máximo una vez por fecha local y site en cada instancia, evita solaparse consigo mismo y reintenta sites fallidos. Reinicios y otras instancias siguen protegidos por la identidad única y el bloqueo transaccional de generación. Horas repetidas por cambio estacional usan la primera ocurrencia; horas inexistentes avanzan por el salto horario. Los límites diarios se calculan hasta la siguiente medianoche local, incluidos días de 23 o 25 horas.

## Alcance de la validación

Compilación NestJS, chequeo completo de TypeScript sin emisión, ESLint de archivos cambiados y revisión de whitespace con `git diff --check`. Se adaptaron fixtures existentes a la firma de transacción con aislamiento y al conflicto HTTP 409. No se añadieron ni ejecutaron pruebas funcionales o unitarias; tampoco se ejecutaron migraciones, consultas contra la DB real ni llamadas a servicios externos.
