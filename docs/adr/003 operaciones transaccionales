# ADR-003: Operaciones de varias escrituras como funciones transaccionales en PostgreSQL

- **Estado:** Aceptada
- **Fecha:** 2026-10-20
- **Implementación:** Pendiente de implementación en `supabase/migrations/`

## Contexto y problema

Resuelve el problema **P2: las operaciones que modifican varias tablas se hacen con llamadas independientes, sin transacción**, identificado en la semana 3.

Varias operaciones del módulo necesitan modificar dos o tres tablas para dejar el sistema en un estado correcto, pero hoy cada modificación viaja como una llamada separada desde el navegador. Si una falla después de que la anterior tuvo éxito, los datos quedan a medias y nada los corrige. En el código actual:

- **`completeTask()`** (`src/frontend/services/taskService.js`, línea 94) actualiza la tabla `tasks` y después inserta el registro en `activity_log` en dos llamadas distintas. Si la segunda falla, la tarea queda completada sin historial, y los puntos que se calculan a partir de ese historial quedan mal.
- **`approveTaskReview()`** (línea 148) tiene exactamente el mismo patrón: actualización de `tasks` seguida de inserción en `activity_log`.
- **`uncompleteTask()`** (línea 252) usa tres llamadas: actualiza la tarea, consulta el registro correspondiente en `activity_log` y luego lo borra. Una falla en cualquiera de los dos últimos pasos deja puntos sumados por una tarea que ya no está completada.
- **`deleteTask()`** (línea 202) borra el historial filtrando por `.eq("action", task.title)`, es decir, **por el título de la tarea y no por su identificador**. Como `generateRecurringInstances()` (línea 44) crea cada instancia recurrente copiando `title: template.title`, todas las instancias de una tarea recurrente comparten el mismo título: borrar una sola tarea elimina los registros de historial de todas sus repeticiones.
- **`approveRequest()`** (`src/frontend/services/rewardService.js`) consulta los puntos del hijo, verifica que alcancen y después ejecuta tres escrituras seguidas (actualizar la solicitud, insertar en `redemptions`, insertar en `activity_log`). Entre la lectura y las escrituras no hay bloqueo, así que dos aprobaciones simultáneas pueden pasar ambas la verificación y dejar el saldo del hijo en negativo.

El patrón común es que la atomicidad se está asumiendo desde el cliente, cuando ni el navegador ni la red la pueden garantizar.

## Decisión

Convertir cada una de esas operaciones en una **función de PostgreSQL** que se ejecute dentro de una sola transacción: o se aplican todos los cambios, o no se aplica ninguno. Las funciones se versionan como migraciones en `supabase/migrations/`:

- `complete_task` — actualiza la tarea e inserta el registro de actividad.
- `approve_task_review` — aprueba la revisión e inserta el registro.
- `uncomplete_task` — revierte la tarea y elimina su registro de actividad.
- `delete_task` — elimina la tarea y solo sus propios registros de historial.
- `approve_reward_request` — verifica el saldo, aprueba la solicitud, registra el canje y lo asienta en el historial, **bloqueando la fila del hijo** mientras dura la operación para que dos aprobaciones concurrentes no puedan pasar la verificación al mismo tiempo.

Además se agrega la columna `task_id` a `activity_log`, de modo que cada registro quede ligado a la tarea por identificador. Así `delete_task` y `uncomplete_task` pueden encontrar exactamente el registro que les corresponde, en lugar de buscar por título.

Las funciones se invocan desde la capa de datos del backend (`src/backend/data/taskRepository.js` y `rewardRepository.js`), no desde el navegador.

## Código afectado

| Hoy | Después del refactor |
|---|---|
| `completeTask()` — `taskService.js` l. 94 | `supabase/migrations/001_complete_task.sql` + `src/backend/data/taskRepository.js` |
| `approveTaskReview()` — `taskService.js` l. 148 | `supabase/migrations/002_approve_task_review.sql` + `taskRepository.js` |
| `uncompleteTask()` — `taskService.js` l. 252 | `supabase/migrations/003_uncomplete_task.sql` + `taskRepository.js` |
| `deleteTask()` — `taskService.js` l. 202 | `supabase/migrations/004_delete_task.sql` + `taskRepository.js` |
| `approveRequest()` — `rewardService.js` | `supabase/migrations/005_approve_reward_request.sql` + `src/backend/data/rewardRepository.js` |
| Tabla `activity_log` sin vínculo a la tarea | Migración que agrega la columna `task_id` |

## Atributo de calidad que mejora

**Confiabilidad** (ISO/IEC 25010), en dos subcaracterísticas:

- *Tolerancia a fallos:* una interrupción a mitad de la operación ya no deja el sistema en un estado intermedio; la transacción revierte sola.
- *Madurez / consistencia de datos:* desaparecen los estados imposibles (tareas completadas sin historial, puntos sumados por tareas revertidas, saldos negativos).

Corresponde al escenario de calidad de confiabilidad de la semana 8: ante un fallo en la segunda escritura de una operación de completado, el sistema deja la tarea en su estado anterior y no registra puntos. La medida es verificable forzando un error en la inserción del historial y comprobando que la tarea sigue en `pending`.

## Alternativas consideradas

**Compensar manualmente desde el código**: si el segundo paso falla, ejecutar una operación inversa que deshaga el primero. Se descartó porque la compensación viaja por la misma red que ya falló: si se cae la conexión, la orden de deshacer tampoco llega, y queda el mismo estado inconsistente que se quería evitar, ahora con el doble de código.

**Mantener las escrituras separadas y agregar un proceso de reparación** que recorra periódicamente las tablas buscando inconsistencias. Se descartó por desproporcionado para el tamaño del módulo y porque no evita que el usuario vea datos incorrectos entre el fallo y la reparación.

## Consecuencias

**Positivas**

- Nunca queda una tarea completada sin su registro de actividad, ni puntos asociados a una tarea revertida.
- Se elimina la condición de carrera en la aprobación de canjes: el saldo no puede quedar negativo.
- El borrado de historial deja de depender del título, con lo que desaparece el borrado accidental de registros de tareas recurrentes.

**Negativas o riesgos**

- Parte de la lógica del módulo queda escrita en SQL, fuera de JavaScript: el equipo debe mantener dos lenguajes y versionar las migraciones con cuidado.
- Las migraciones son dependientes del orden; aplicarlas fuera de secuencia en un entorno nuevo rompe el esquema.
- Agregar `task_id` a `activity_log` requiere poblar la columna para los registros existentes o aceptar que el historial anterior quede sin vínculo.
