# Cierre técnico y verificación con MySQL — 2026-10-05

Este documento actualiza `backend-closure-2026-10-04.md`. Se encontró MySQL en `/usr/local/mysql/bin`, aunque no estaba en el PATH. Se inicializó una instancia temporal en `/tmp`, sin red y sin usar la configuración ni los datos de la base del proyecto.

## Correcciones implementadas

| Problema confirmado | Corrección | Evidencia |
| --- | --- | --- |
| Escrituras simultáneas de tarjetas abortaban por deadlock al convertir el bloqueo compartido de `INSERT IGNORE` en exclusivo. | Los seis triggers incrementan el reloj con un único upsert exclusivo. Una nueva migración repara instalaciones que ya aplicaron la anterior y conserva revisiones/journal. | La prueba con seis creaciones simultáneas falló antes y pasa después. Dos conexiones verifican commit tardío y rollback sin perder deltas. |
| Un sondeo vacío retrocedía el ID del cursor y podía reenviar el último cambio. | Al consumir la página final, el cursor cierra toda la revisión confirmada utilizando el máximo ID UNSIGNED. | Cinco sondeos vacíos consecutivos y una edición posterior; paginación del seed de revisión cero. |
| El cierre de CILT rechazaba un `siteId` BIGINT hidratado como texto. | Normalización numérica antes de validar las relaciones. | La prueba de cierre falló con MySQL real y pasa corregida; regresión unitaria para ID textual. |
| Refresh y escritores del site pueden formar un ciclo por los bloqueos de usuario/site/FK. | Transacciones de sesiones utilizan el mecanismo compartido de reintento únicamente ante abortos explícitos de MySQL, con READ COMMITTED. | Ciclo real de bloqueos entre refresh y escritura CILT; ambos completan, cualquiera que sea la víctima. Ocho refresh simultáneos dejan una única sesión sustituta. |
| Revertir índices de optimización fallaba si InnoDB había reutilizado uno para una FK. | Restauración de un índice mínimo de soporte antes de retirar el índice de la migración. | El rollback falló en MySQL antes de corregirlo; rollback y reaplicación pasan ahora conservando las FKs. |
| Faltaba `FAST_PASSWORD_PEPPER` en el entorno generado para Lightsail. | Se transmite en los tres pasos que reciben configuración; se exige junto con JWT y se valida longitud mínima de 32 bytes. | Pruebas de configuración ausente/corta y serialización del valor. |
| El contexto de construcción de Docker incluía `.env`; el runtime incluía dependencias de desarrollo. | `.dockerignore` excluye secretos, metadatos y artefactos; el builder elimina dependencias de desarrollo después de compilar. | Revisión del Dockerfile/contexto. No hay Docker instalado para construir la imagen localmente. |
| CLI de migraciones no cargaba `.env` directamente. | `data-source.ts` carga dotenv antes de construir las opciones. Runtime y CLI identifican explícitamente mysql2. | Compilación y comprobación de tipos. Las pruebas de integración siguen usando exclusivamente MYSQL_TEST_* y no cargan DB_* ni .env. |

## Verificación reproducible

Se agregó `npm run test:integration:mysql`, con configuración independiente de Jest. Crea una base con nombre aleatorio `osm_test_*`, sólo elimina esa base y no acepta hosts remotos. La conexión se selecciona explícitamente con `MYSQL_TEST_SOCKET` o un `MYSQL_TEST_HOST` de loopback y `MYSQL_TEST_USER`; contraseña/puerto usan variables MYSQL_TEST_* propias.

Ejemplo contra una instancia local de pruebas:

```sh
MYSQL_TEST_HOST=127.0.0.1 MYSQL_TEST_PORT=3306 MYSQL_TEST_USER=root npm run test:integration:mysql
```

La instancia debe ser de pruebas y la cuenta debe poder crear/eliminar la base aleatoria y consultar `performance_schema.data_locks/data_lock_waits`. La suite genera una base desde las entidades actuales, revierte objetos recientes y ejecuta las diez migraciones requeridas con DDL real. No representa una copia del esquema histórico ni datos productivos.

La suite incluye 19 pruebas: migraciones/readiness, seed/revisiones/paginación, commits tardíos/rollback, evidencias y borrado físico, límites entre sites, generación CILT concurrente, cambios de horario, evidencias tras cierre, órdenes de OPL/detalles, contadores concurrentes, padre eliminado, SKIP LOCKED de outbox, refresh concurrente y recuperación de deadlock.

El workflow `backend-verification.yml` usa MySQL 8.4 aislado, sin secretos del proyecto, y ejecuta pruebas unitarias, integración, tipos y build. El workflow de despliegue depende de que esa verificación termine correctamente. Se validó su sintaxis localmente; la ejecución en GitHub queda pendiente de publicar estos cambios.

## Resultados locales

- MySQL real **9.6.0**, esquema de pruebas con las 40 entidades del proyecto.
- Diez migraciones requeridas ejecutadas y readiness correcto.
- **19 pruebas de integración correctas**.
- Cinco repeticiones completas de integración consecutivas: todas correctas.
- **75 suites y 550 pruebas unitarias correctas**.
- Build, TypeScript sin emisión y ESLint de los archivos cambiados: correctos.
- `npm ls --omit=dev`: sin problemas de dependencias instaladas. Esto no equivale a un análisis de vulnerabilidades.
- YAML de ambos workflows y `git diff --check`: correctos.

## Activación de la corrección

Nueva migración: `RepairCardSyncClockLocking1791158400000`. Debe aplicarse incluso cuando `CommitOrderedCardSync1791072000004` ya esté registrada. La reparación conserva datos y revisiones. Su reversión conserva los triggers corregidos para evitar reintroducir el fallo.

1. Configurar la base de destino y conservar el mismo `FAST_PASSWORD_PEPPER` usado para generar los digests existentes. No sustituirlo por uno nuevo sin migrar/reemitir los códigos rápidos.
2. Detener escritores y cron durante las migraciones que sustituyen triggers; el DDL de MySQL no es atómico.
3. Compilar y ejecutar `npm run migration:run`, después `npm run db:verify`, con la configuración explícita del destino.
4. Confirmar que la cuenta de ejecución puede ver los seis triggers en `information_schema.TRIGGERS`; en MySQL su visibilidad exige permiso TRIGGER sobre las tablas correspondientes. El gate falla si no puede verificar el protocolo.
5. Configurar `FAST_PASSWORD_PEPPER` en los secrets del entorno de GitHub y verificar la imagen/despliegue real con `/health/ready`.

## Límites que siguen pendientes

- La revisión automática rechazó la consulta de vulnerabilidades a registry.npmjs.org por transmitir nombres/versiones de dependencias. La autorización explícita solicitada continúa pendiente. No se eludió ese rechazo. El gate `audit:prod` está configurado en despliegue para rechazar severidad moderada o superior.
- GitHub CLI tiene una credencial inválida: no se pueden comprobar workflows ejecutados, secrets ni despliegues desde esta sesión. No se modificó la autenticación.
- No se aplicaron migraciones a la base del proyecto ni se desplegó. La corrección está verificada en el entorno aislado; falta activarla y verificarla en el destino autorizado.
- Integraciones externas R2/Firebase/WhatsApp/correo/IA y carga productiva no se certifican mediante estas pruebas. No hay base para afirmar un porcentaje universal de calidad o ausencia absoluta de bugs.

Se cerraron los fallos reproducidos y quedó automatizada su verificación. No se realizaron staging, commits ni despliegues.
