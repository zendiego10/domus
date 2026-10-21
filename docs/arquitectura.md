# Arquitectura objetivo: Módulo de Gestión de Tareas y Gamificación

**Proyecto:** Domus Sistema de Guía Parental
**Asignatura:** Arquitectura de Sistemas · Prof. Fernando de Jesús Higuita
**Equipo:** Diego Robles Bertel, Sara Sánchez Restrepo, Juliana Agudelo Ramírez
**Fecha:** Octubre de 2026

---

## 1. Resumen

Este documento describe la arquitectura objetivo del módulo **Gestión de Tareas y Gamificación** de Domus: cómo queda el módulo después de la refactorización, no cómo está hoy.

El módulo cubre el ciclo de vida de una tarea (creación, asignación, ejecución con evidencia fotográfica, verificación por el padre y cierre) y el sistema de puntos, niveles e insignias que se deriva de ese ciclo.

La re-arquitectura no agrega funcionalidad. Reorganiza, protege y hace consistente lo que ya existe, atacando los cuatro problemas identificados en el análisis de la arquitectura actual (segunda entrega, sección 2.5): lógica dispersa y duplicada (P1), operaciones de varias escrituras sin atomicidad (P2), ausencia de autorización del lado del servidor (P3) y reglas de negocio críticas decididas en el cliente (P4).

## 2. Estilo arquitectónico

### 2.1 Situación actual

Hoy el módulo sigue una **arquitectura cliente-servidor de dos capas con Backend as a Service**. Toda la lógica se ejecuta en el navegador y Supabase actúa únicamente como persistencia y almacenamiento de archivos. No existe servidor de aplicación propio.

### 2.2 Estilo objetivo: arquitectura en capas

La arquitectura objetivo adopta un **estilo en capas**, con una API REST propia entre el navegador y la base de datos:

```
React (vistas + apiClient)  →  api (rutas)  →  domain (reglas)  →  data (acceso)  →  Supabase
```

Cada capa solo puede llamar a la capa inmediatamente inferior. La capa de presentación no conoce la base de datos, la capa de negocio no sabe nada de HTTP y únicamente la capa de datos accede a Supabase.

### 2.3 Justificación

La elección responde directamente a los cuatro problemas:

| Problema | Cómo lo ataca el estilo en capas |
|---|---|
| **P1** Lógica dispersa y duplicada | Cada regla tiene una capa y un componente donde le corresponde vivir. La duplicación deja de tener dónde esconderse: una regla de negocio en una vista es, por definición, una violación del estilo. |
| **P2** Operaciones sin atomicidad | Al existir una capa de datos única, las operaciones de varias escrituras se concentran en un solo lugar y pueden ejecutarse como transacciones de base de datos. |
| **P3** Sin autorización en el servidor | La capa de API es un punto de paso obligatorio donde validar identidad, rol y pertenencia antes de llegar a los datos. Sin servidor propio no existía ese punto. |
| **P4** Reglas decididas en el cliente | Las reglas se ejecutan en la capa de negocio, en el servidor, fuera del alcance del usuario. |

Se descartaron dos alternativas: **Supabase Edge Functions**, porque cada función es una unidad aislada que diluye la separación en capas y corre sobre un entorno distinto al del resto del proyecto; y **Row Level Security sin API propia**, porque las políticas de base de datos controlan el acceso a filas, no las reglas de proceso, así que P4 quedaría sin resolver. El detalle de ambas discusiones está en [ADR-001](adr/ADR-001-api-rest-en-capas.md) y [ADR-002](adr/ADR-002-autenticacion-en-servidor.md).

## 3. Componentes y responsabilidades

Los nombres de esta tabla son los que se usan en los diagramas C4, en los ADR y en el código.

La columna **Semana** indica cuándo se implementa cada componente: `13` en la tercera entrega, `15` en la entrega final.

| Capa | Componente | Responsabilidad | Depende de | Archivo o paquete | Semana |
|---|---|---|---|---|---|
| Presentación | Vistas del hijo | Ver y completar tareas, subir evidencia, consultar puntos, nivel e insignias | apiClient | `src/frontend/pages/ChildTasks.jsx`, `ChildHome.jsx`, `ChildProfile.jsx` | 13 |
| Presentación | Vistas del padre | Crear, filtrar y revisar tareas; ver el panel de los hijos | apiClient | `src/frontend/pages/ParentTasks.jsx`, `ParentHome.jsx` | 15 |
| Presentación | apiClient | Único punto del navegador que llama a la API. Ninguna vista accede a Supabase | API REST | `src/frontend/services/apiClient.js` | 13 |
| API | App Express | Arma el servidor y registra las rutas | Controladores | `src/backend/api/app.js` | 13 |
| API | AuthMiddleware | Verifica el token JWT, el rol y que el recurso pertenezca a la familia | — | `src/backend/api/middleware/auth.js` | 15 |
| API | ProgressController | `GET /api/children/:id/progress`: puntos, nivel, racha e insignias | GamificationService | `src/backend/api/routes/progress.js` | 13 |
| API | TaskController | Endpoints de tareas: crear, completar, enviar evidencia, aprobar, rechazar, revertir, eliminar | TaskService | `src/backend/api/routes/tasks.js` | 15 |
| API | RewardController | Endpoints de solicitudes y aprobación de canjes | RewardService | `src/backend/api/routes/rewards.js` | 15 |
| Negocio | GamificationService | Única fuente de las reglas de puntos, nivel (con tope `MAX_LEVEL`), racha e insignias | ChildRepository, TaskRepository | `src/backend/domain/gamification.js` | 13 |
| Negocio | TaskStateMachine | Define qué transición de estado de una tarea puede ejecutar cada rol | — | `src/backend/domain/taskStateMachine.js` | 13 |
| Negocio | TaskService | Casos de uso de tareas; valida con TaskStateMachine antes de escribir | TaskStateMachine, TaskRepository, NotificationService | `src/backend/domain/taskService.js` | 15 |
| Negocio | RewardService | Solicitudes y aprobación de canjes | RewardRepository, GamificationService | `src/backend/domain/rewardService.js` | 15 |
| Negocio | NotificationService | Registro de notificaciones para padre e hijo | Repositorios | `src/backend/domain/notificationService.js` | 15 |
| Datos | supabaseAdmin | Cliente de Supabase con la clave de servicio; existe solo en el servidor | Supabase | `src/backend/data/supabaseAdmin.js` | 13 |
| Datos | ChildRepository, TaskRepository | Lectura y escritura de hijos y tareas | supabaseAdmin | `src/backend/data/childRepository.js`, `taskRepository.js` | 13 |
| Datos | ActivityLogRepository, RewardRepository | Historial de actividad y canjes | supabaseAdmin | `src/backend/data/activityLogRepository.js`, `rewardRepository.js` | 15 |
| Datos | Funciones transaccionales | Operaciones de varias escrituras que se ejecutan completas o no se ejecutan | PostgreSQL | `supabase/migrations/` | 13 |
| Externo | Supabase PostgreSQL | Base de datos, con RLS activado y sin acceso directo desde el navegador | — | Servicio externo | 15 |
| Externo | Supabase Storage | Fotos de evidencia en bucket privado con enlaces temporales | — | Bucket `task-photos` | 15 |
| Externo | Brevo | Envío del correo de recuperación de contraseña | — | `supabase/functions/send-reset-email` | sin cambios |

## 4. Decisiones de refactorización

| ADR | Problema | Cambio propuesto | Código afectado | Atributo | Estado |
|---|---|---|---|---|---|
| [ADR-001](adr/ADR-001-api-rest-en-capas.md) · API REST en capas | P4 | API REST propia en `src/backend/` con capas api / domain / data; el navegador solo habla con la API a través de `apiClient.js` | `taskService.js`, `rewardService.js`, `dashboardService.js`, `getTasksByChild()`, `supabase.js`, vistas | Seguridad (integridad) | Pendiente |
| [ADR-002](adr/ADR-002-autenticacion-en-servidor.md) · Autenticación en servidor | P3 | Login en la API con token JWT, `AuthMiddleware` que valida rol y familia, RLS activado y bucket de fotos privado | `loginParent()`, `loginChild()`, `utils/auth.js`, `ProtectedRoute.jsx`, `TaskPhotoUploader.jsx` | Seguridad (confidencialidad, autenticidad) | Planeada semana 15 |
| [ADR-003](adr/ADR-003-operaciones-transaccionales.md) · Operaciones transaccionales | P2 | Cada operación de varias escrituras se vuelve una función de PostgreSQL en una sola transacción; se agrega `task_id` a `activity_log` | `completeTask()`, `approveTaskReview()`, `uncompleteTask()`, `deleteTask()`, `approveRequest()` | Confiabilidad (tolerancia a fallos, consistencia) | Pendiente |
| [ADR-004](adr/ADR-004-modulo-unico-gamificacion.md) · Módulo único de gamificación | P1 | Todas las reglas de puntos, nivel, racha e insignias se concentran en `gamification.js` y se exponen en un único endpoint | `lib/badges.js`, `lib/constants.js`, `dashboardService.js`, cálculos en `ChildHome.jsx`, `ChildTasks.jsx`, `ChildProfile.jsx`, `ParentHome.jsx` | Mantenibilidad (modularidad, modificabilidad, capacidad de prueba) | Pendiente |

## 5. Escenarios de calidad

Los atributos y subcaracterísticas son los definidos en la segunda entrega (sección 3), con los nombres del modelo ISO/IEC 25010. Seguridad y confiabilidad son prioritarios; mantenibilidad acompaña la reorganización necesaria para resolverlos.

Cada escenario se presenta en sus seis partes, y la medida es verificable sobre el sistema refactorizado.

### 5.1 Seguridad — prioritario

**Subcaracterísticas:** confidencialidad, integridad, autenticidad · **Problemas:** P3, P4

| Parte | Descripción |
|---|---|
| **Fuente** | Un usuario autenticado de otra familia, o cualquier persona que obtenga la clave pública del cliente |
| **Estímulo** | Intenta consultar o modificar las tareas y los puntos de un hijo que no le pertenece, enviando peticiones por fuera de la interfaz |
| **Entorno** | Sistema en operación normal, en producción |
| **Artefacto** | `AuthMiddleware`, las tablas del módulo con RLS activado y el bucket `task-photos` |
| **Respuesta** | La API rechaza la petición por no corresponder a la familia del token; la base de datos no responde a peticiones hechas con la clave pública; las fotos solo se sirven mediante enlaces temporales firmados |
| **Medida** | Una consulta directa a Supabase con la clave pública devuelve cero filas. Una petición a la API con un token válido de otra familia responde `403`. Un enlace de foto caduca y deja de dar acceso pasado su tiempo de vigencia |

### 5.2 Confiabilidad — prioritario

**Subcaracterísticas:** tolerancia a fallos, consistencia de datos · **Problema:** P2

| Parte | Descripción |
|---|---|
| **Fuente** | Un fallo de red o de la base de datos durante una operación de varias escrituras |
| **Estímulo** | La operación se interrumpe después de la primera escritura y antes de completar las siguientes |
| **Entorno** | Sistema en operación normal, con una petición de completado de tarea en curso |
| **Artefacto** | La función transaccional `complete_task` en PostgreSQL, y las tablas `tasks` y `activity_log` |
| **Respuesta** | La transacción se revierte completa: la tarea conserva su estado anterior y no se registra ningún movimiento de puntos. El sistema no queda en un estado intermedio |
| **Medida** | Al forzar un error en la inserción del registro de actividad, la tarea permanece en `pending` y `activity_log` no contiene registros nuevos. El saldo de puntos del hijo no cambia |

Escenario complementario, sobre concurrencia: si dos aprobaciones de canje del mismo hijo se ejecutan simultáneamente y el saldo solo alcanza para una, `approve_reward_request` bloquea la fila del hijo mientras verifica, de modo que la segunda es rechazada. La medida es que el saldo resultante nunca queda negativo.

### 5.3 Mantenibilidad

**Subcaracterísticas:** modularidad, modificabilidad, capacidad de prueba · **Problema:** P1

| Parte | Descripción |
|---|---|
| **Fuente** | Un desarrollador del equipo |
| **Estímulo** | Recibe la solicitud de cambiar una regla de gamificación, por ejemplo cuántos puntos se requieren por nivel o la condición de una insignia |
| **Entorno** | Tiempo de desarrollo, sobre el código fuente del módulo |
| **Artefacto** | `src/backend/domain/gamification.js` y sus pruebas unitarias en `tests/unit/` |
| **Respuesta** | El cambio se aplica modificando únicamente ese archivo. Ninguna vista requiere modificación, y todas muestran el nuevo comportamiento porque consumen el mismo endpoint |
| **Medida** | El cambio toca un solo archivo de código fuente, frente a los cuatro que hoy contienen la fórmula de nivel. Las pruebas unitarias confirman el nuevo comportamiento sin levantar la interfaz ni la base de datos |

## 6. Diagramas

Los diagramas muestran el sistema **después** de la refactorización. Se encuentran en [`docs/diagramas/`](diagramas/), con su archivo editable y su versión exportada.

- [C4 Nivel 1 — Contexto](diagramas/c4-contexto.png)
- [C4 Nivel 2 — Contenedores](diagramas/c4-contenedores.png)
- [C4 Nivel 3 — Componentes del módulo MVP](diagramas/c4-componentes.png)

El cambio principal frente a la arquitectura actual es visible en el diagrama de contenedores: la aplicación web ya no tiene comunicación directa con la base de datos. Todo pasa por la API REST.

## 7. Estado de implementación

*(Sección pendiente de completar con el avance real en `src/` al cierre de la tercera entrega.)*

**Semana 13 — en esta entrega**

- Documentación de la arquitectura objetivo: este documento, los cuatro ADR y los diagramas C4.
- Estructura de capas creada en `src/backend/` (`api/`, `domain/`, `data/`).

**Semana 15 — pendiente para la entrega final**

- Autenticación en el servidor, `AuthMiddleware` y activación de RLS (ADR-002).
- Endpoints REST de tareas y canjes, y migración de todas las vistas a `apiClient` (ADR-001).
- Funciones transaccionales restantes: `approve_task_review`, `uncomplete_task`, `delete_task` y `approve_reward_request` (ADR-003).
- Bucket de fotos privado con enlaces temporales.
- Pruebas de integración de los endpoints.

---

**Documentos relacionados:** [README del proyecto](../README.md) · [Decisiones de arquitectura](adr/)
