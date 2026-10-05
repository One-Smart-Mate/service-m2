# Nueva auditoría del backend después de las correcciones P2

Fecha: 2026-10-04. Revisión: `73bdcb0` (`fix(app): v.2.0.1 fix p2 priorities`). El árbol de trabajo estaba limpio al iniciar esta revisión. La numeración siguiente corresponde a esta auditoría.

## Resultado y alcance

Se identificaron **12 hallazgos: 3 P1, 8 P2 y 1 P3**. No se identificó un P0 en el alcance revisado. No se puede considerar cerrado el backend mientras sigan abiertos estos hallazgos y no se comprueben las condiciones de despliegue.

La revisión estática cubrió emisión/revocación de sesiones, límites entre sites, jerarquías, persistencias transaccionales, generación y consultas CILT, reordenamientos, notificaciones y manejo de errores. Se contrastaron las nuevas persistencias con las rutas que todavía escriben directamente mediante repositorios. Los escenarios concurrentes se deducen de la secuencia de lecturas, bloqueos y escrituras; no se reprodujeron contra MySQL.

Comprobaciones ejecutadas: `npm run build` y `./node_modules/.bin/tsc --noEmit`, ambas exitosas. No se ejecutaron pruebas, migraciones, consultas contra una DB real ni llamadas a Firebase, correo o R2. Esta revisión no certifica dependencias frente a avisos de seguridad actuales ni la configuración efectiva de producción. No se modificó código de aplicación.

## Prioridades

| # | Prioridad | Hallazgo | Condición principal |
| --- | --- | --- | --- |
| 1 | P1 | Sesión nueva emitida con una credencial que acaba de ser reemplazada | Login concurrente con cambio/reset de credenciales |
| 2 | P1 | Movimientos de niveles permiten ciclos y las lecturas no los acotan | Diferencia de tipos BIGINT o movimientos concurrentes |
| 3 | P1 | Lectura CILT por posiciones omite la membresía vigente del usuario | Asignación de posición histórica o membresía inactiva/eliminada |
| 4 | P2 | Mover un nivel deshace la reasignación de sus hijos | Nivel con hijos directos |
| 5 | P2 | Reordenar puede revertir cambios y dejar intercambios incompletos | Reordenamiento concurrente con edición/eliminación, o fallo de escritura |
| 6 | P2 | Nuevas persistencias adquieren bloqueos en órdenes opuestos | Configurar CILT y editar una posición concurrentemente |
| 7 | P2 | Secuencias inactivas o borradores siguen generando ejecuciones activas | Secuencia I/D con horario activo |
| 8 | P2 | Reportes usan el día de almacenamiento en lugar del día del site | Ejecuciones cerca del cambio de día local |
| 9 | P2 | Serialización de fechas depende todavía de la zona del proceso | Host distinto de UTC o instancias con zonas diferentes |
| 10 | P2 | Clonación puede devolver error después de confirmar su escritura | Fallo en una lectura posterior al commit |
| 11 | P2 | Un worker antiguo puede cerrar el intento de otro worker del outbox | Despacho superior a cinco minutos y varias instancias |
| 12 | P3 | Errores internos se clasifican indiscriminadamente como HTTP 400 | Fallo de DB, deadlock o excepción de programación |

## Hallazgos

### 1. P1 — Emisión de sesiones sin coordinarse con la revocación de credenciales

**Evidencia:** [verificación de contraseña e emisión del token](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/auth.service.ts:98), [inserción de sesión primaria](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth-session/auth-session.service.ts:23), [sesión rápida que sólo bloquea la sesión padre](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth-session/auth-session.service.ts:36), [reset y revocación](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/users/password-reset.persistence.ts:54).

El login compara una contraseña previamente leída y posteriormente inserta la sesión sin comprobar que la credencial siga vigente. Si el reset confirma la contraseña nueva y revoca las sesiones entre ambos pasos, el login pendiente inserta una sesión nueva con la contraseña anterior. La sesión no existía cuando se ejecutó la revocación y sigue siendo aceptada. En login rápido, bloquear la sesión padre no revalida la clave del usuario destino cuando éste es otro usuario.

**Corrección:** coordinar cambio de credencial y emisión de sesión mediante una versión de credenciales o revalidación del hash/digest bajo bloqueo del usuario. Insertar la sesión en la misma transacción que esa comprobación. En sesiones rápidas comprobar también el usuario destino, su membresía y la sesión padre. Mantener un orden común de bloqueos.

### 2. P1 — Ciclos alcanzables en la jerarquía y recorridos sin protección

**Evidencia:** [validación antes de mover](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts:489), [IDs de la consulta recursiva sin normalizar](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts:342), [BIGINT de niveles](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/entities/level.entity.ts:19), [recorrido sin conjunto de visitados](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts:393).

`findAllChildLevels` retorna IDs crudos de MySQL y `includes(newSuperiorId)` los compara con el número del DTO. El driver TypeORM instalado habilita por defecto `supportBigNumbers` y `bigNumberStrings`; los BIGINT de esta consulta pueden ser strings. Un ID `"12"` no coincide con `12`, permitiendo el padre propio o un descendiente. Además, la validación y escritura no están serializadas: dos movimientos simultáneos A→B y B→A pueden aprobarse antes de guardar y formar un ciclo, incluso normalizando los IDs.

Una vez almacenado el ciclo, el CTE recursivo falla al alcanzar el límite de MySQL. `buildLevelLocation` recorre padres en un bucle síncrono sin límite ni visitados, por lo que una consulta que cargue esos niveles puede bloquear el proceso Node.

**Corrección:** normalizar y validar IDs, rechazar explícitamente el padre propio y serializar las mutaciones del árbol por site. Validar la ascendencia final dentro de la transacción. Añadir detección de ciclos y límites a todos los recorridos, incluyendo lecturas de datos históricos y clonación.

### 3. P1 — El endpoint CILT por posiciones conserva acceso a sites sin membresía vigente

**Evidencia:** [GET cilt-mstr-position-levels/position/user](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstrPositionLevels/ciltMstrPositionLevels.controller.ts:49), [selección de posiciones del usuario](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstrPositionLevels/ciltMstrPositionLevels.service.ts:205), [carga de ejecuciones y OPL](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstrPositionLevels/ciltMstrPositionLevels.service.ts:229), [guard sin site/recurso solicitado](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/guard/site-access.guard.ts:142).

El endpoint obtiene todas las posiciones no eliminadas del usuario sin exigir una membresía activa en el site de cada posición. Tampoco proporciona al guard un site o recurso que verificar. `validAssignment` valida la coherencia interna entre master, posición y nivel; no valida el acceso del solicitante.

Si permanece una asignación de posición a B mientras la membresía de ese usuario en B está inactiva o eliminada, o existe una asignación histórica a un site ajeno, devuelve las configuraciones de B, ejecuciones recientes y OPL asociados. Las correcciones de lectura del generador no cubren esta ruta. No se verificó si actualmente existen esos datos históricos en la DB.

**Corrección:** reutilizar la selección de posiciones autorizadas con usuario, membresía, site y posición activos; restringir los joins al site autorizado. Revisar también ejecuciones eliminadas y relaciones OPL históricas antes de serializar el resultado.

### 4. P2 — Reasignación de hijos sobrescrita por entidades antiguas

**Evidencia:** [carga inicial de hijos](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts:516), [actualización masiva y guardado posterior](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts:542).

El movimiento cambia en DB el `superiorId` de los hijos al padre anterior del nivel movido. Después guarda los objetos cargados antes de ese cambio para modificar su profundidad. Esos objetos aún contienen el `superiorId` original, y `save` puede escribirlo otra vez, devolviendo los hijos al nivel movido. La profundidad calculada queda entonces asociada a otro padre. El movimiento, cambios de hijos y datos derivados tampoco comparten una transacción.

**Corrección:** realizar el movimiento completo en una persistencia transaccional, actualizar el padre y profundidad con parches explícitos y recalcular profundidades y rutas derivadas de los nodos afectados. Resolver junto con el hallazgo 2.

### 5. P2 — Reordenamientos fuera de las persistencias transaccionales

**Evidencia:** [reordenamiento de schedules](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltSecuencesSchedule/ciltSecuencesSchedule.service.ts:436), [eliminación de schedule](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltSecuencesSchedule/ciltSecuencesSchedule.service.ts:425), [reordenamiento de posiciones](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/position/position.service.ts:131).

Estas rutas leen dos entidades y las guardan completas en operaciones independientes. Si otro request elimina un schedule después de la lectura inicial, el reordenamiento puede restaurar su `status` y `deletedAt` antiguos al guardarlo. Una edición concurrente de relaciones o nombres puede ser sobrescrita de la misma manera. Si falla la segunda escritura del intercambio, la primera ya quedó confirmada. La selección tampoco excluye explícitamente registros inactivos/eliminados.

**Corrección:** llevar ambos reordenamientos a sus persistencias, bloquear las filas en orden estable y guardar únicamente columnas de orden dentro de una transacción. Filtrar registros elegibles y conservar el borrado lógico bajo concurrencia.

### 6. P2 — Inversión del orden de bloqueos entre configuración CILT y posiciones

**Evidencia:** [asignación CILT: site y después posición](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstr/cilt-configuration.persistence.ts:102), [bloqueo de referencias](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstr/cilt-configuration.persistence.ts:155), [edición de posición: posición primero](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/position/position.persistence.ts:45), [site después](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/position/position.persistence.ts:90).

T1 crea una asignación y bloquea el site S; T2 edita P y bloquea la posición P. T1 espera el bloqueo compartido de P mientras T2 espera el bloqueo exclusivo de S. MySQL detecta un deadlock y aborta una operación válida. No hay un reintento acotado de la transacción completa que absorba ese conflicto.

**Corrección:** establecer y aplicar un orden global de adquisición de bloqueos en todas las persistencias relacionadas, por ejemplo site antes de recursos y IDs ordenados. Añadir reintentos acotados sólo para errores transitorios identificados y siempre sobre la transacción completa.

### 7. P2 — Generación de ejecuciones para secuencias I/D

**Evidencia:** [consulta denominada active sin filtro de estado](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstr/services/cilt-query.service.ts:50), [horarios sin estado de secuencia](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltSecuencesSchedule/ciltSecuencesSchedule.service.ts:159), [estado A del trabajo generado](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstr/services/cilt-execution.service.ts:300), [validación final sin estado de secuencia](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutions/cilt-execution.persistence.ts:296).

Actualizar una secuencia a I o D conserva `deletedAt = NULL`. Si conserva un horario activo, las consultas la incluyen y generan ejecuciones A. La persistencia final exige coherencia de site/master y ausencia de borrado, pero tampoco exige que la secuencia sea activa.

**Corrección:** filtrar secuencias y masters activos en la generación y revalidar el estado al persistir bajo el protocolo de bloqueos. Conservar las ejecuciones históricas; el estado de configuración debe controlar la creación de trabajo nuevo.

### 8. P2 — Reportes CILT incompatibles con el día local del site

**Evidencia:** [chart agrupado y filtrado por DATE](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutions/ciltSequencesExecutions.service.ts:250), [compliance por DATE](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutions/ciltSequencesExecutions.service.ts:311).

Los reportes todavía usan `DATE(execution.secuenceSchedule)` para filtros y agrupación. Si se almacena UTC como establece la nueva generación, una ejecución de las 22:00 del 4 de octubre en Mexico City se almacena a las 04:00 UTC del día 5. La vista operativa la incluye el día 4, mientras el reporte la cuenta el día 5. Ajustar únicamente la zona del servidor no permite resolver sites con zonas distintas.

**Corrección:** obtener límites UTC a partir de los días locales del site y agrupar con la misma zona. Para consultas de varios sites, aplicar la zona de cada site. No depender de tablas de zonas de MySQL sin comprobar que estén disponibles.

### 9. P2 — Transporte DB de fechas todavía dependiente del host

**Evidencia:** [configuración runtime](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/config/type.orm.config.ts:9), [DataSource de scripts/migraciones](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/config/data-source.ts:4), [columna DATETIME programada](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutions/entities/ciltSequencesExecutions.entity.ts:122).

Ninguna configuración fija `timezone` del driver. El mysql2 instalado usa `options.timezone || 'local'`, y TypeORM le pasa esa opción. Aunque el helper construya un instante UTC correcto, el driver escribe/lee el DATETIME según la zona del proceso. Dos hosts con zonas distintas pueden almacenar valores distintos para el mismo instante, afectando lecturas y la identidad única de la programación. No se comprobó la zona efectiva de los hosts o sesiones MySQL actuales.

**Corrección:** fijar transporte UTC consistente en runtime y scripts, y comprobar la zona de las sesiones MySQL para las columnas TIMESTAMP. Antes de modificarlo en un entorno con datos existentes, reconciliar la representación histórica y las ejecuciones pendientes. Resolver junto con el hallazgo 8.

### 10. P2 — Error posterior al commit de una clonación

**Evidencia:** [commit y lecturas posteriores](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts:875), [rollback incondicional en catch](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts:900).

Después del commit, el mismo try consulta el nivel clonado, sus descendientes y tokens del site. Si una lectura falla, el catch intenta revertir una transacción ya confirmada. Ese rollback puede además ocultar el error original. El árbol permanece creado aunque el cliente recibe error, por lo que un reintento puede duplicarlo. Firebase captura sus propios errores y devuelve `false`; un rechazo normal de Firebase no es el desencadenante de este rollback.

**Corrección:** delimitar la transacción y preparar su resultado antes del commit. Gestionar lecturas y notificaciones posteriores de forma que no se presente una escritura confirmada como revertida. Usar el outbox para notificación recuperable.

### 11. P2 — El outbox no distingue al propietario de cada intento

**Evidencia:** [recuperación de claims de más de cinco minutos](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/notifications/notification-outbox.processor.ts:60), [markSent sin identidad del intento](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/notifications/notification-outbox.processor.ts:186), [markFailed con el mismo problema](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/notifications/notification-outbox.processor.ts:200).

Cuando un despacho supera cinco minutos, otra instancia puede reclamar el evento e incrementar sus intentos. Si el worker anterior termina entonces, `markSent` o `markFailed` sólo compara ID y estado PROCESSING: puede cerrar o reprogramar el intento nuevo. Un fallo antiguo puede desplazar el estado actual y un éxito antiguo puede marcarlo enviado mientras el nuevo aún está trabajando. Esto altera la recuperación y produce despachos duplicados o un estado final que no corresponde al intento vigente.

**Corrección:** asignar un token único de claim y exigirlo en cada actualización final mediante compare-and-set. Acotar tiempos de despacho o renovar la concesión mientras exista trabajo vigente. Mantener entrega al menos una vez y deduplicación por ID de evento; no prometer entrega exactamente una vez.

### 12. P3 — Clasificación HTTP de errores internos

**Evidencia:** [wrapper general de excepciones](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/common/exceptions/handler/handle.exception.ts:5), [HTTP 400 para cualquier SqlException](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/common/exceptions/types/sql.exception.ts:5).

Toda excepción que no sea HttpException se transforma en SqlException y HTTP 400, incluso desconexiones, deadlocks o errores de programación. El cliente y el monitoreo no pueden distinguir una petición inválida de un fallo interno o transitorio. La conversión tampoco conserva una causa interna estructurada para diagnóstico.

**Corrección:** reservar 400 para errores de entrada, mapear conflictos conocidos a 409 y errores internos/transitorios a 500/503 según corresponda. Registrar causa y correlación internamente sin exponer SQL, credenciales ni detalles sensibles en la respuesta.

## Orden recomendado de corrección

1. Cerrar emisión de sesiones y acceso CILT por membresía: **1 y 3**.
2. Unificar movimientos de jerarquías y bloquear ciclos: **2 y 4**.
3. Alinear bloqueos y completar reordenamientos: **6 y 5**.
4. Consolidar almacenamiento UTC y día local de reportes: **9 y 8**, con revisión de datos antes del despliegue.
5. Excluir trabajo inactivo/borrador y separar el commit de clonación: **7 y 10**.
6. Asegurar claims del outbox y clasificación de errores: **11 y 12**.

## Criterios pendientes para cerrar el backend

- Cerrar los hallazgos anteriores y volver a revisar las rutas afectadas, incluyendo sus caminos alternativos.
- Confirmar todas las migraciones y la comprobación de preparación de DB en el entorno destino. La presencia del archivo de migración no confirma su aplicación.
- Revisar datos históricos: ciclos, referencias entre sites, membresías/posiciones inválidas, colisiones de claves rápidas y representación de horarios anteriores al cambio de zona.
- Validar contra MySQL los escenarios de concurrencia, rollback, revocación, reordenamiento e idempotencia descritos en este informe.
- Comprobar flujos completos de formularios y sincronización offline, además de notificaciones y cargas R2 en un entorno de integración.
- Verificar configuración efectiva, permisos, versiones/dependencias y observabilidad del despliegue. No existe evidencia de estas condiciones en la compilación local.

Los puntos anteriores son criterios de aceptación pendientes; no se ejecutaron durante esta auditoría.
