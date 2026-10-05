# Correcciones de los P1 de la nueva auditoría

Fecha: 2026-10-04. Alcance: hallazgos 1–3 de `backend-reaudit-after-p2-2026-10-04.md`, realizado sobre `73bdcb0`.

## 1. Emisión de sesiones y cambios de credenciales

`AuthService` pasa a `AuthSessionService` el hash de contraseña o digest de clave rápida que se verificó durante el login. La persistencia bloquea el usuario, comprueba que la cuenta está activa y no eliminada, compara la credencial actual con la verificada y comprueba la membresía y el site antes de insertar la sesión en esa misma transacción. La contraseña sin hash no se transmite a la persistencia ni se almacena en la sesión.

Para login rápido se bloquean actor y usuario destino en orden numérico, después el site y sus membresías, y finalmente la sesión padre. Se exige una sesión padre primaria vigente. Un cambio de contraseña o PIN confirmado antes de obtener el bloqueo impide emitir la sesión con la credencial anterior. Si el login confirma primero, el cambio posterior revoca la sesión recién creada mediante el protocolo existente de reemplazo de credenciales.

El refresh también obtiene el bloqueo del usuario antes de rotar su sesión, coordinándose con reset y desactivación. La emisión rechazada devuelve HTTP 401 y no retorna el token firmado. El login normal selecciona una membresía activa para construir su respuesta y rechaza cuentas sin acceso activo.

Código: [AuthSessionService](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth-session/auth-session.service.ts), [AuthService](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/auth/auth.service.ts).

## 2. Jerarquías de niveles

Se añadieron `LevelHierarchyPersistence` y una política compartida para normalizar IDs BIGINT, recorrer ancestros y descendientes, detectar ciclos y acotar profundidad. Los IDs deben ser enteros seguros; `0` representa la raíz. Los recorridos admiten como máximo 1000 niveles de profundidad y restringen las relaciones al mismo site.

Creación, actualización, movimiento y clonación comparten el bloqueo exclusivo del site. El movimiento vuelve a leer y validar el árbol dentro de una transacción `READ COMMITTED`, rechaza el padre propio, descendientes y padres de otro site o inactivos. La actualización carga una entidad vigente bajo bloqueo para que una edición antigua no restaure un padre anterior.

El movimiento conserva el contrato existente: los hijos directos se reasignan al padre anterior del nivel movido. Se calculan las profundidades finales de los nodos afectados y los datos de ubicación de sus tarjetas; todas esas escrituras se confirman o revierten juntas. Se guardan parches explícitos de padre/profundidad en vez de entidades de hijos cargadas antes de la reasignación.

Las lecturas de ubicación, ancestros, descendientes, rutas, árbol y profundidad usan recorridos acotados. Una jerarquía histórica cíclica o con un padre faltante provoca un conflicto controlado en lugar de un bucle infinito. La clonación valida el árbol, usa el mismo manager transaccional para sus lecturas/escrituras y prepara el resultado antes de confirmar; la notificación se realiza después mediante el helper existente que captura fallos.

La resolución del responsable mantiene la política común de catálogos y se realiza antes de adquirir la conexión transaccional. Las lecturas de niveles dentro de la transacción usan su manager para evitar esperar otra conexión del pool mientras se mantiene el bloqueo del site.

Código: [persistencia de jerarquías](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level-hierarchy.persistence.ts), [política de jerarquías](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level-hierarchy.policy.ts), [LevelService](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/level/level.service.ts).

## 3. Acceso CILT mediante posiciones

`GET /cilt-mstr-position-levels/position/user` obtiene las configuraciones en una sola consulta que comprueba usuario activo, asignación no eliminada, posición activa, membresía activa y site activo. La asignación, membresía, posición, nivel y master deben corresponder al mismo site. Las sesiones rápidas restringen además la consulta al `fastSiteId` firmado; el cliente no determina ese límite.

Los joins de ejecuciones, evidencias y OPL excluyen relaciones de otros sites y registros eliminados. La ruta de ejecuciones recientes por nivel reutiliza estos filtros. La serialización común de configuraciones CILT también elimina secuencias históricas cuyo site o master no coincida con la configuración y aplica la política existente de saneamiento de OPL en ejecuciones cargadas.

Una asignación histórica por sí sola ya no concede acceso cuando la membresía está inactiva o eliminada. Se conservan los datos históricos; este cambio filtra lo que se devuelve.

Código: [servicio de configuraciones CILT](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstrPositionLevels/ciltMstrPositionLevels.service.ts), [controller](/Users/immanuel-diaz/NodeJsProjects/service-m2/src/modules/ciltMstrPositionLevels/ciltMstrPositionLevels.controller.ts).

## Cambios relacionados y pendientes

La integración de jerarquías también corrigió el guardado de hijos antiguos del hallazgo P2 4 y el rollback posterior al commit del P2 10. Los otros P2 y el P3 de la auditoría siguen pendientes. Los campos derivados de posiciones no se recalculan con el movimiento en este cambio; la transacción actual actualiza niveles y tarjetas, conservando el alcance de ese flujo.

No se requieren migraciones nuevas para estas correcciones. Sigue pendiente comprobar las migraciones anteriores en el entorno destino. Los ciclos, padres inválidos y asignaciones históricas no se repararon en la DB: deben revisarse y reconciliarse antes de dar por cerrado el despliegue.

## Comprobaciones realizadas

- `npm run build`: correcto.
- `./node_modules/.bin/tsc --noEmit`: correcto, incluyendo fixtures existentes.
- ESLint de los archivos modificados y las nuevas políticas/persistencias: correcto.
- `git diff --check`: correcto.

Se adaptaron fixtures existentes a las firmas y dependencias nuevas, sin añadir casos de prueba. No se ejecutaron pruebas unitarias ni funcionales, migraciones, consultas a MySQL o llamadas a servicios externos. Los escenarios de concurrencia quedan pendientes de validación en el entorno de integración.
