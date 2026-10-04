# Correcciones de la auditoría del backend — 4 de octubre de 2026

Los cambios conservan la separación entre controladores, servicios y persistencia transaccional de NestJS/TypeORM. El frontend no requiere cambios en los contratos HTTP para estas correcciones.

| # | Prioridad | Corrección |
|---|---|---|
| 1 | P1 | Creación, actualización e importación verifican los roles que puede conceder el actor autenticado. Un administrador local no puede conceder `ih_sis_admin` ni modificar un usuario de mayor rango. |
| 2 | P1 | Vincular un email existente conserva sus credenciales y roles. Los administradores locales solamente pueden administrar cuentas cuyos sites activos estén íntegramente dentro de su alcance. |
| 3 | P1 | La persistencia CILT comprueba el site de OPL, tarjetas, posiciones, niveles, tipos, masters y secuencias. La identidad de la ejecución no se puede reasignar. Las lecturas ocultan relaciones OPL históricas de otros sites. |
| 4 | P1 | Las evidencias usan reservas por propietario y SHA-256, escritura R2 condicional `If-None-Match: *` y validación de la fase de tarjeta. Un reintento idéntico devuelve la misma referencia. Una sustitución devuelve conflicto. |
| 5 | P2 | Una migración crea `opl_user_access` y sus índices; `db:verify` exige el esquema y la migración aplicada. |
| 6 | P2 | Las soluciones solamente se aplican a tarjetas abiertas `A`, `P` o `V`, bajo bloqueo de fila. No reabren tarjetas `R` o `C`. |
| 7 | P2 | Los paros buscan `positions.id`, validan al responsable activo del mismo site y guardan eventos independientes de push y correo en la outbox, dentro de la transacción CILT. |
| 8 | P2 | Todos los caminos de creación CILT bloquean la fila del site antes de buscar la ejecución y asignar el folio. Dos índices únicos protegen la identidad y el folio por site. |
| 9 | P2 | La identidad programada incluye site, master, secuencia, usuario, nivel, posición y fecha. Las respuestas conservan las rutas y ejecuciones de cada asignación. |
| 10 | P3 | El contador por usuario usa un upsert atómico y el contador global se incrementa dentro de la misma transacción. |

## Migraciones y despliegue

Se agregaron estas migraciones, en orden:

1. `CreateOplUserAccess1791072000000`.
2. `HardenCiltExecutionIdentity1791072000001`.
3. `ReserveCardEvidenceUploads1791072000002`.

Las migraciones no se ejecutaron contra una base de datos durante esta implementación. Antes de arrancar la versión nueva, aplicar las migraciones en el entorno correspondiente, con respaldo y sin instancias anteriores escribiendo ejecuciones durante el cambio:

```sh
npm run build
npm run migration:run
npm run db:verify
```

El proyecto carga las migraciones desde `dist`; por eso la compilación precede a `migration:run`. En imágenes sin dependencias de desarrollo, usar el CLI TypeORM disponible en el procedimiento de despliegue con `dist/config/data-source.js`.

La migración CILT detecta duplicados antes del DDL y se detiene sin borrar ni fusionar ejecuciones. Si encuentra duplicados, conciliar sus estados, evidencias y folios antes de volver a ejecutarla. Consultas de diagnóstico:

```sql
SELECT site_id, site_execution_id, COUNT(*) AS duplicates
FROM cilt_sequences_executions
WHERE site_id IS NOT NULL AND site_execution_id IS NOT NULL
GROUP BY site_id, site_execution_id HAVING COUNT(*) > 1;

SELECT site_id, cilt_id, cilt_secuence_id, user_id, level_id,
       position_id, secuence_schedule, COUNT(*) AS duplicates
FROM cilt_sequences_executions
WHERE site_id IS NOT NULL AND cilt_id IS NOT NULL
  AND cilt_secuence_id IS NOT NULL AND user_id IS NOT NULL
  AND level_id IS NOT NULL AND position_id IS NOT NULL
  AND secuence_schedule IS NOT NULL
GROUP BY site_id, cilt_id, cilt_secuence_id, user_id, level_id,
         position_id, secuence_schedule HAVING COUNT(*) > 1;
```

## Compatibilidad de evidencias

Las referencias históricas de R2 y proveedores anteriores siguen siendo legibles. Las referencias del endpoint `/card/evidence/...` deben corresponder al mismo site, UUID de tarjeta y tipo. Cuando hay una reserva, debe estar confirmada y pertenecer al actor de la operación.

Un objeto R2 anterior que no tenga la huella SHA-256 se conserva y no se puede sustituir mediante upload. Sus referencias previamente obtenidas pueden seguir sincronizándose. Para contenido nuevo se debe usar un nuevo `evidenceId`, respetando la fase abierta de la tarjeta.

## Verificación

La versión final pasó `npm run build`, TypeScript sin emisión y la suite completa: **70 suites y 503 pruebas**. El lint de los componentes nuevos de producción también pasó.

Las pruebas de regresión cubren los diez hallazgos, usando dobles de TypeORM, R2, correo y Firebase. No contactan esos servicios. La compilación y las pruebas locales no sustituyen una validación de las migraciones, bloqueos y escrituras condicionales en un entorno de integración con MySQL y R2.
