# Auditoría del backend después de corregir P3

Fecha: 2026-10-04. Base: `a50ada6`, con las correcciones P2 ya presentes en el índice y las correcciones P3 de esta sesión en el árbol de trabajo. Se preservaron los cambios previos; no se hicieron commits ni despliegues.

## Resultado

**El backend todavía no está al 100%.** En esta revisión se identificaron **8 hallazgos: 3 P1 y 5 P2**. No se identificó un P0 en el alcance inspeccionado. Los hallazgos siguientes son nuevos caminos o condiciones que no estaban cerrados por los cambios anteriores; no se corrigieron durante esta auditoría.

El P3 12 de la auditoría anterior queda implementado en código. La nueva revisión cubrió sesiones, guards, límites entre sites, jerarquías, posiciones, CILT, OPL, evidencias, sincronización offline, consultas/reportes, importación, IA, notificaciones, almacenamiento y el pipeline de despliegue. Se contrastó además el manejo de HTTP 401/403 del cliente web; no se modificó el frontend ni se realizó una auditoría completa de su ejecución.

## Corrección P3 aplicada

| Tipo de error | Resultado |
| --- | --- |
| Excepción HTTP de validación/autorización ya conocida | Conserva su código y mensaje de dominio |
| Duplicado o conflicto de integridad identificado por el driver | HTTP 409 con mensaje público genérico |
| Deadlock agotado, espera de bloqueo, desconexión o indisponibilidad identificada | HTTP 503 |
| Error de esquema, programación o error desconocido | HTTP 500 |

`HandleException` normaliza errores sin convertir indiscriminadamente todo a 400. Se conserva la causa interna. El filtro global también captura excepciones no envueltas y devuelve sólo mensajes genéricos para 5xx, con `errorId` y cabecera `X-Error-Id` para correlación.

El diagnóstico registra tipo, código del driver, SQLSTATE, errno y ubicaciones del código; no registra consultas SQL, parámetros ni mensajes crudos de la causa. Se actualizó también `CustomLoggerService.logException`. El filtro se registra una sola vez mediante `APP_FILTER`; se retiró su duplicado de `main.ts`.

`AuthGuard` limita la conversión a 401 a la verificación del JWT. Los fallos de las consultas de sesión/usuarios llegan ahora al clasificador y no provocan un falso error de credenciales. La forma anterior de la respuesta de error se conserva, añadiendo `errorId` y omitiendo la query del campo `path`.

Código: [normalizador](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/common/exceptions/handler/handle.exception.ts), [clasificación SQL](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/common/exceptions/types/sql.exception.ts), [filtro global](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/common/exceptions/http.exception.filter.ts), [diagnóstico seguro](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/common/exceptions/error-details.ts), [AuthGuard](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/guard/auth.guard.ts).

## Nuevos hallazgos y prioridad

| # | Prioridad | Pendiente |
| --- | --- | --- |
| 1 | P1 | Una sesión rápida puede acceder a otros sites del usuario destino |
| 2 | P1 | El cursor incremental pierde microsegundos y no asegura visibilidad de commits |
| 3 | P1 | El workflow de despliegue omite variables obligatorias de R2 |
| 4 | P2 | Se pueden crear o borrar evidencias de ejecuciones terminales |
| 5 | P2 | Un horario eliminado o una asignación retirada pueden generar trabajo desde una lectura anterior |
| 6 | P2 | OPL conserva intercambios con orden de bloqueo opuesto y asignación de orden sin mutex común |
| 7 | P2 | Los directorios de usuarios de un site serializan posiciones/sites ajenos |
| 8 | P2 | Refresh puede confirmar la rotación y después fallar al construir la respuesta |

### 1. P1 — Límite de site de las sesiones rápidas

Evidencia: [site firmado en login rápido](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/auth.service.ts:241), [validación de membresías en AuthGuard](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/guard/auth.guard.ts:76), [autorización general sólo por ID de usuario](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/guard/site-access.guard.ts:156), [carga de todos los sites accesibles](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/guard/site-access.guard.ts:392).

El login firma `fastSiteId = A` y comprueba que actor y destino pertenecen a A. Sin embargo, el guard general no aplica ese límite: obtiene todos los sites del usuario destino. Si el actor sólo pertenece a A y el destino pertenece a A y B, el token rápido emitido en A puede consultar recursos de B. Si el destino tiene rol de administrador global, su lista accesible incluso se interpreta como acceso global. El filtrado específico añadido al endpoint CILT por posiciones no protege los demás endpoints.

**Corrección:** exigir el `fastSiteId` firmado en toda resolución de acceso, incluidas consultas sin site explícito y rutas de administrador global. Propagar el contexto de la sesión a servicios que expanden recursos por usuario. Validar A/B con actor limitado a A y destino con membresías múltiples.

### 2. P1 — Cursor de sincronización incremental

Evidencia: [TIMESTAMP(6) en la migración](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/migrations/1790419200000-OptimizeMobileCriticalQueries.ts:146), [Date al decodificar](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/card/card-sync-cursor.policy.ts:35), [serialización ISO de milisegundos](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/card/card-sync-cursor.policy.ts:56), [comparación SQL con precisión de DB](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/card/card-delta-sync.reader.ts:143), [avance hasta reloj de DB](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/card/card-delta-sync.reader.ts:246).

La DB mantiene seis decimales, mientras `Date` y `toISOString()` conservan tres. Un registro con `12:00:00.123456` produce cursor `12:00:00.123Z`; en la siguiente página vuelve a satisfacer `sync_changed_at > cursor`, aunque su ID ya se hubiera enviado. Con varias filas dentro del mismo milisegundo se pueden repetir páginas sin avanzar al resto de cambios. La conversión ocurre también al leer el resultado del driver, antes de serializar el cursor.

Además, la página final avanza hasta `UTC_TIMESTAMP(6)` sin coordinarse con las transacciones escritoras. Un escritor puede asignar `sync_changed_at` antes de ese límite y confirmar después de la lectura. El snapshot no ve ese cambio, pero el cursor ya avanzó más allá de su fecha; la siguiente lectura puede omitirlo definitivamente. `REPEATABLE READ` da consistencia a la página, pero no resuelve ese orden entre timestamp de escritura y commit.

**Corrección:** conservar precisión exacta en SQL y cursor, y diseñar una posición de cambios que no adelante commits todavía invisibles. Evaluar un registro de cambios con secuencia y protocolo de visibilidad, o serialización de lectores/escritores; aumentar solamente la precisión del cursor no resuelve la segunda condición. Validar varias filas en un milisegundo y una escritura que confirme entre páginas.

### 3. P1 — Variables obligatorias ausentes del despliegue

Evidencia: [variables de contenedor construidas por CI](/Users/immanuel-diaz/NodeJsProjects/service-m2/.github/workflows/deploy-lightsail-container.yml:113), [R2 exige configuración al construirse](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/card/r2-card-evidence.service.ts:41), [fallo al faltar una variable](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/card/r2-card-evidence.service.ts:208).

El provider R2 se instancia como parte de `CardModule` y exige `CLOUDFLARE_R2_ACCESS_KEY`, `CLOUDFLARE_R2_SECRET_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`, `CLOUDFLARE_R2_PUBLIC_URL` y `CLOUDFLARE_R2_ENDPOINT`. El objeto `environment` que CI envía a Lightsail no incluye ninguna de estas variables. La imagen runtime sólo copia dist, paquetes y node_modules; el flujo mostrado no suministra otra fuente de estas variables. Un despliegue producido por este workflow no puede arrancar ese provider.

Tampoco hay un paso de migraciones/preparación de DB en el workflow. La comprobación de salud apunta a Swagger `/api`, que no verifica que las tablas e índices requeridos estén listos. La configuración real del servicio no se consultó: este hallazgo describe el despliegue generado por el archivo del repositorio.

**Corrección:** completar la configuración obligatoria usando secretos de cada entorno y añadir una comprobación de esquema/configuración antes de activar el despliegue. Confirmar migraciones, TLS y transporte UTC efectivos; usar una ruta de preparación real. No imprimir secretos en logs.

### 4. P2 — Evidencias fuera de la política de estado CILT

Evidencia: [creación a partir de la ejecución](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutions/ciltSequencesExecutions.service.ts:209), [guardado sin bloqueo/estado del padre](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutionsEvidences/ciltSequencesExecutionsEvidences.service.ts:68), [borrado sin estado del padre](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutionsEvidences/ciltSequencesExecutionsEvidences.service.ts:98).

La política nueva impide modificar una ejecución terminal, pero crear y eliminar sus evidencias utiliza otro servicio sin comprobar ese estado. El owner guard comprueba propietario o rol, no estado. Un usuario autorizado puede borrar la evidencia después de cerrar el trabajo o añadir evidencia retroactivamente. También puede producirse cierre entre la lectura del padre y el guardado de la evidencia.

**Corrección:** una persistencia que bloquee la ejecución y aplique la misma política a sus evidencias. Definir explícitamente las fases admitidas y la política de correcciones administrativas para historia cerrada.

### 5. P2 — Generación con horario/asignación retirados

Evidencia: [adaptación que descarta el ID del horario](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstr/services/cilt-execution.service.ts:43), [creación final](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstr/services/cilt-execution.service.ts:315), [control final de master/secuencia](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/CiltSequencesExecutions/cilt-execution.persistence.ts:113), [eliminación del horario](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstr/cilt-configuration.persistence.ts:155).

El control final ya verifica master y secuencia activos, pero no el horario que originó el instante ni que la asignación CILT/posición/nivel y usuario/posición siga vigente. Tras cargar los horarios, un administrador puede eliminar uno; el generador pendiente todavía puede crear su ejecución porque conserva sus datos y carece del ID para revalidarlo. Lo mismo ocurre con una asignación retirada, mientras las entidades y la membresía del usuario sigan existiendo en el site.

**Corrección:** llevar IDs/versiones de horario y asignaciones al comando de generación, revalidarlos bajo el bloqueo común del site y evitar crear desde una configuración retirada. Mantener el tratamiento idempotente de trabajos ya existentes.

### 6. P2 — Concurrencia OPL incompleta

Evidencia: [reordenamiento de masters](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/oplMstr/opl-master.persistence.ts:71), [reordenamiento de detalles](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/oplDetails/opl-detail.persistence.ts:77), [creación de detalles](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/oplDetails/opl-detail.persistence.ts:18).

Dos intercambios simultáneos 1→2 y 2→1 bloquean primero su propio recurso y después el otro. Cada transacción puede esperar la fila de la otra, generando deadlock. Estas persistencias no usan el mutex común ni el reintento acotado aplicado a CILT. La creación de detalles sólo toma un bloqueo compartido del OPL y busca el último detalle: si aún no existe ninguno, no hay una fila común exclusiva que serialice la asignación de orden. El comportamiento de los gap locks dependerá del aislamiento, motor e índices; no garantiza una asignación válida sin abortos concurrentes.

**Corrección:** aplicar un bloqueo común de site/OPL antes de detalles o masters, adquirir recursos en orden estable y usar reintentos acotados. Validar también el rango TINYINT antes de persistir el orden.

### 7. P2 — Directorios de usuarios expanden relaciones de otros sites

Evidencia: [endpoint de posiciones por site](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/users/users.controller.ts:242), [serialización de todas las posiciones](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/users/users.service.ts:976), [serialización de todos los sites](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/users/users.service.ts:952).

Las consultas seleccionan usuarios que pertenecen a A, pero después serializan todas sus posiciones o membresías. Un solicitante autorizado únicamente en A puede obtener nombres, rutas y datos de posiciones de B para un usuario compartido, o información de las membresías de B. El guard comprueba el site de la petición; no inspecciona esas relaciones expandidas. Tampoco se exige membresía activa en esas consultas de directorio.

**Corrección:** filtrar las relaciones serializadas por el site solicitado y estados vigentes. Reservar vistas globales de las relaciones para roles/rutas explícitamente autorizados.

### 8. P2 — Fallo posterior al commit de refresh

Evidencia: [rotación de sesión](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/auth.service.ts:377), [lectura de empresa posterior](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/auth.service.ts:391), [revocación e inserción transaccionales](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth-session/auth-session.service.ts:203).

La rotación revoca el token previo y confirma la sesión nueva antes de consultar la empresa para construir la respuesta. Si esa consulta falla, el cliente recibe error y no recibe el token nuevo. Su token anterior ya está revocado, de modo que reintentar el refresh tampoco recupera la sesión. La respuesta utiliza además la primera membresía cargada, sin seleccionar con la política de membresías activas empleada por login.

**Corrección:** preparar y validar la respuesta necesaria antes de rotar, seleccionar una membresía activa y no ejecutar lecturas fallables después de confirmar la rotación. Si hay efectos posteriores opcionales, que no hagan fallar la entrega del token confirmado.

## Estimación de avance

Para evitar presentar una cifra como garantía de ausencia de errores, se usa una lista explícita de **12 criterios técnicos**, con el mismo peso: 1 = cubierto en código dentro del alcance revisado; 0,5 = parcialmente cubierto; 0 = abierto. Esta puntuación no es cobertura de pruebas ni porcentaje de funcionalidades certificadas en producción.

| Criterio revisado | Puntos | Pendiente principal |
| --- | ---: | --- |
| Compilación, tipos y manejo central de errores | 1 | Validación de HTTP real en integración |
| Coordinación de credenciales y sesiones | 1 | Concurrencia real en MySQL |
| Límites entre sites y sesiones rápidas | 0,5 | Hallazgos 1 y 7 |
| Jerarquías, ciclos y datos derivados | 1 | Reconciliar datos históricos |
| Atomicidad de posiciones y configuración CILT | 1 | Concurrencia real en MySQL |
| Consistencia y concurrencia OPL | 0,5 | Hallazgo 6 |
| Generación CILT desde configuración vigente | 0,5 | Hallazgo 5 |
| Estados y evidencias de ejecuciones | 0,5 | Hallazgo 4 |
| Fechas, transporte UTC y reportes | 1 | Reconciliar fechas históricas |
| Protocolo de sincronización incremental | 0 | Hallazgo 2 |
| Outbox y reservas/cargas de evidencias | 1 | Despachos, reintentos y almacenamiento reales |
| Configuración y preparación del despliegue | 0 | Hallazgo 3 |
| **Total** | **8 / 12** | **≈67% de criterios técnicos revisados** |

Hay **6 criterios cubiertos en código, 4 parciales y 2 abiertos**. Aunque se cerraran los hallazgos de código, todavía habría que demostrar los criterios de integración y operación para declarar listo el backend. No se asigna un porcentaje a producción sin evidencia del entorno.

## Comprobaciones y límites

- `npm run build`: correcto.
- `./node_modules/.bin/tsc --noEmit`: correcto.
- ESLint de los archivos P3 modificados y nuevos: correcto.
- `git diff --check`: correcto para los cambios locales.
- Se adaptó el fixture existente del clasificador sin añadir casos de prueba. No se ejecutaron pruebas unitarias/funcionales, MySQL, migraciones ni Firebase/correo/R2.
- Los escenarios de concurrencia se deducen del código y no se reprodujeron contra DB. No se afirma que ya hayan ocurrido en producción.
- La consulta de avisos de dependencias a npm falló por resolución de red del sandbox. El intento de consulta fuera del sandbox fue rechazado por la revisión automática porque divulgaría nombres/versiones a `registry.npmjs.org` sin autorización específica. Se pidió esa autorización; la consulta sigue pendiente y no se certifican avisos actuales de dependencias.
- No se inspeccionaron valores de secretos, datos históricos ni configuración efectiva del servicio desplegado.

## Orden para continuar

1. Cerrar límites de sesiones rápidas y sincronización incremental (**1 y 2**).
2. Completar y comprobar la configuración de despliegue (**3**).
3. Unificar estado/evidencias y vigencia de generación (**4 y 5**).
4. Terminar OPL y filtros de directorios (**6 y 7**).
5. Preparar la respuesta de refresh antes del commit (**8**).
6. Confirmar migraciones, histórico UTC, pruebas de concurrencia, flujos completos web/app, servicios externos y preparación real de producción.
