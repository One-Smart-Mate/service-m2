# Cierre de hallazgos del backend — 2026-10-04

## Resultado y alcance

Se implementaron las correcciones de los 8 hallazgos abiertos del informe `backend-reaudit-after-p3-2026-10-04.md`: 3 P1 y 5 P2. Se conservaron las correcciones anteriores de P0/P1/P2/P3. Esta revisión incluyó rutas alternativas, directorios antiguos, creación manual de ejecuciones y mutaciones que afectan la sincronización.

El código corregido y sus regresiones locales no certifican un backend completo al “100%”. Quedan pendientes la ejecución real de la nueva migración, las pruebas de concurrencia con MySQL/MariaDB y la comprobación de dependencias. No se asigna un porcentaje arbitrario a esa evidencia faltante.

## Matriz de cierre en código

| Hallazgo | Corrección | Evidencia local |
| --- | --- | --- |
| P1: sesiones rápidas fuera del site firmado | SiteAccessGuard restringe todos los sites al `fastSiteId`, incluidos recursos indirectos. No permite bypass global ni `SkipSiteAccess`. RolesGuard no otorga autoridad de plataforma a sesiones rápidas. Los handlers de usuario permitidos filtran tarjetas, posiciones, CILT y ejecuciones por el site firmado. Login rápido devuelve sólo esa membresía. | Regresiones de guards, roles y suite de autorización existente. |
| P1: cursores con precisión insuficiente y commits tardíos | Cursor v2 opaco, ligado al site y basado en revisiones BIGINT. Triggers de INSERT/UPDATE/DELETE de tarjetas/evidencias actualizan una revisión serializada por site dentro de la transacción del escritor. Un commit posterior no puede adelantar una revisión anterior pendiente. El lector usa un único snapshot REPEATABLE READ para reloj, cambios e hidratación. Incluye tombstones de borrado físico. Comparaciones SQL convierten los límites a UNSIGNED para preservar BIGINT. | Regresiones del lector/cursor y generación de las seis definiciones de triggers. Falta ejecutar SQL y concurrencia en DB real. |
| P1: despliegue incompleto | Workflow transmite configuración R2 y TLS, valida claves obligatorias, serializa JSON desde variables de entorno, ejecuta preflight de esquema antes de desplegar y usa `/health/ready`. El arranque valida el mismo esquema; readiness devuelve 503 si la DB falla. Deploys del mismo entorno se serializan. | Pruebas de serialización con comillas/newlines, configuración obligatoria, health y parseo YAML. Falta comprobar secrets y permisos reales del entorno. |
| P2: evidencias CILT terminales | Todas las mutaciones bloquean primero la ejecución. Crear/editar/borrar sólo en estado A. FINAL exige inicio. Ownership se deriva del padre y es inmutable. Un reintento idéntico de creación devuelve la evidencia existente sin modificar una ejecución cerrada. | Pruebas de R/I/C/D, reintento tras cierre, orden de bloqueos y autoría/site derivados. |
| P2: generación desde configuración retirada | El comando conserva horario y asignación de origen. Bajo el mismo bloqueo de site revalida horario completo, plantilla de secuencia, CPL, user-position, posición y nivel activos. Borrado de CPL participa en ese bloqueo. Generación manual busca una asignación del usuario y site correcto. Cron vuelve a procesar cambios del día usando identidad idempotente. | Pruebas de horarios eliminados/cambiados, asignaciones retiradas, plantilla editada, posición/nivel desactivados e idempotencia existente. |
| P2: concurrencia OPL | Mutaciones usan site → OPL → detalle; OPL globales históricos comparten una raíz estable. Creación serializa el primer orden, intercambios escriben sólo `order`, se valida TINYINT 1..127 y se reintentan deadlocks abortados por MySQL. Borrados y asignaciones de nivel participan en el protocolo; borrar el padre elimina lógicamente sus detalles/asignaciones. | Regresiones de integridad padre/hijo, intercambio y referencias entre sites. Falta concurrencia real. |
| P2: expansión de directorios de usuarios | Directorios de roles, posiciones y respuesta antigua devuelven sólo relaciones activas del site solicitado. Se filtran usuarios/membresías/sites inactivos o eliminados. Se corrigió un handler que transformaba una Promise sin esperarla. | Regresiones de directorios con usuario en dos sites. |
| P2: refresh confirma antes de terminar respuesta | Todos los datos y la respuesta se preparan antes de rotar. La rotación vuelve a validar membresía activa bajo bloqueo. No quedan consultas después de confirmar la nueva sesión. Login y login rápido también enriquecen la respuesta antes de emitir sesiones. | Prueba de fallo de empresa sin revocar sesión y prueba de retirada de membresía antes de rotación. |

Se eliminó el método antiguo no utilizado de creación de tarjetas que guardaba fuera de una transacción y recuperaba la última tarjeta global; las rutas actuales siguen usando `createOptimized` y la persistencia existente. También se retiraron opciones de pool ignoradas por mysql2 y se configuró `connectTimeout`.

## Cierre transversal P3 de errores y logs

Se eliminaron los `console.log(exception)` previos al manejador central. Los errores SQL, de cron, catálogos, creación/sync de tarjetas y proveedores registran código/tipo/localización mediante `errorDiagnostics`, sin mensajes crudos, SQL ni parámetros. Los incidentes persisten ese diagnóstico seguro. Las respuestas parciales de sync ocultan los mensajes internos de 5xx.

WhatsApp devuelve 502 ante fallos del proveedor, incluyendo sus 401, y conserva la causa internamente. Sus respuestas de paginación devuelven cursores/flags y omiten URLs que pueden contener el access token del proveedor. No se encontraron consumidores de esas URLs en el frontend del workspace.

## Verificación local

- `npm run build`: correcto.
- `npx tsc --noEmit`: correcto.
- ESLint sobre 95 archivos TypeScript modificados/nuevos: correcto.
- `npm test -- --runInBand`: **75 suites y 545 pruebas correctas**, incluidas las pruebas HTTP con puertos temporales fuera del sandbox.
- Parseo de YAML del workflow y comprobación de sus gates.
- `git diff --check`.

Los tests de repositorio utilizan mocks; el test de migración comprueba la generación del SQL y no su ejecución por MySQL.

## Activación y verificación en base aislada

Nueva migración: `CommitOrderedCardSync1791072000004`.

1. Disponer de una copia/base aislada, con configuración propia y sin credenciales de producción.
2. Detener escritores, cron y versiones anteriores durante esta migración: MySQL confirma DDL implícitamente. La migración permite reintentar tablas/seed/triggers tras un fallo parcial mientras los escritores siguen detenidos.
3. Compilar y ejecutar las migraciones con la configuración de esa base; después ejecutar `npm run db:verify`. La comprobación requiere visibilidad de metadata de triggers, además de tablas, índices y registro de migraciones.
4. Verificar con dos conexiones: mantener una escritura sin commit, leer una página, confirmar y comprobar que el siguiente cursor entrega el cambio. Repetir con rollback, evidencias, varias tarjetas y paginación de revisiones consecutivas.
5. Verificar generación concurrente frente a retirada de horario/CPL/user-position/posición/nivel, intercambios OPL opuestos y creación del primer detalle.
6. Iniciar la aplicación y comprobar `/health/ready`; interrumpir DB y confirmar 503.
7. Confirmar variables R2/TLS y preflight en el entorno de despliegue antes de activarlo.

El registro mantiene una fila por tarjeta, sin crecer por cada edición, y conserva tombstones. La revisión por site es un punto de serialización: medir latencia y contención con carga real. Los cursores v1 fuerzan una resincronización completa, incluidos borrados, para recuperar posibles omisiones del protocolo antiguo. No hay que modificar el formato del cuerpo de respuesta ni el número de `schemaVersion` para consumir el nuevo cursor opaco.

Las evidencias nuevas deben llegar antes de completar/cancelar una ejecución CILT; sólo un reintento de una evidencia ya registrada se acepta después. Comprobar este orden en los clientes móviles durante la integración.

## Bloqueos externos concretos

- No hay Docker/MySQL disponibles localmente ni se proporcionó una base de pruebas aislada. No se consultó ni modificó una DB real en esta sesión.
- La revisión automática de permisos rechazó `npm audit` porque enviaría nombres/versiones de dependencias a `registry.npmjs.org`. La autorización solicitada sigue pendiente. El workflow bloqueará vulnerabilidades de producción de severidad moderada o superior cuando se ejecute en CI.
- No se desplegó ni se comprobó el contenido de secrets de GitHub. No se certifican integraciones reales de R2/Firebase/WhatsApp/correo/IA con mocks.

No se hicieron commits, staging ni despliegues.
