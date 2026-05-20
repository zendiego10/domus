# Domus — Documentación Técnica del Sistema

> **Versión:** Fase 3.0 (completa)
> **Fecha:** Mayo 2026
> **Autor:** Diego Robles

---

## 1. Descripción del Sistema

**Domus** es una aplicación web de gestión familiar orientada a la motivación y el seguimiento de responsabilidades de los hijos del hogar. El sistema permite que los padres asignen tareas académicas y domésticas a sus hijos, establezcan recompensas canjeables por puntos, y realicen un seguimiento en tiempo real del progreso de cada hijo. Los hijos interactúan con la plataforma a través de una interfaz gamificada donde visualizan sus tareas, acumulan puntos al completarlas, desbloquean logros y solicitan canjear las recompensas disponibles.

El sistema opera bajo un modelo de **roles duales**: el rol **padre/madre** tiene capacidad de administración completa (crear, editar y eliminar tareas, definir recompensas, aprobar canjes y verificar evidencias fotográficas), mientras que el rol **hijo** tiene capacidad de consulta y acción sobre sus propias responsabilidades con elementos de gamificación.

---

## 2. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Enrutamiento | React Router v7 |
| Backend / Base de datos | Supabase (PostgreSQL) |
| Autenticación | Autenticación propia con localStorage (sin Supabase Auth) |
| Hash de contraseñas | bcryptjs (implementación pure-JS, browser-safe) |
| Email transaccional | Resend (free tier 100 emails/día) |
| Funciones serverless | Supabase Edge Functions (Deno) |
| Almacenamiento de archivos | Supabase Storage (bucket `task-photos`) |
| Estilos | CSS personalizado (`dashboard.css`, `navbar.css`) |
| Despliegue | Vercel (web, escritorio y móvil) |

---

## 3. Objetivos del Sistema

### Objetivo General
Desarrollar una plataforma web que facilite la gestión de tareas y responsabilidades en el hogar, promoviendo hábitos positivos en los hijos mediante un sistema de puntos, recompensas y gamificación controlado por los padres.

### Objetivos Específicos
1. Permitir al padre/madre crear, editar, eliminar y asignar tareas (incluyendo recurrentes) con puntos asociados a cada hijo registrado.
2. Permitir al hijo visualizar sus tareas, marcarlas como completadas (con o sin evidencia fotográfica) y acumular puntos automáticamente.
3. Proveer al padre un panel de control con estadísticas en tiempo real: puntos, progreso, ranking familiar y actividad reciente.
4. Implementar un catálogo de recompensas configurable por el padre, con flujo de solicitud y aprobación.
5. Soportar múltiples hijos bajo una misma cuenta de padre, identificados por un código familiar único y con flujo simplificado de incorporación.
6. Garantizar seguridad de credenciales mediante hash bcrypt con migración automática de usuarios legacy.
7. Proveer recuperación real de contraseña vía email con tokens de un solo uso y TTL de 1 hora.
8. Ofrecer al hijo elementos de gamificación: niveles, logros, streaks, dificultad de tareas e hitos de puntos.

---

## 4. Requisitos Funcionales

### RF-01: Registro e inicio de sesión de padres
- El padre se registra con nombre, apellido, usuario, correo, teléfono, fecha de nacimiento y contraseña.
- Al registrarse se genera automáticamente un **código familiar único** de 6 caracteres alfanuméricos.
- La contraseña se almacena hasheada con bcrypt (cost 10). Los usuarios legacy con contraseña en texto plano migran automáticamente al primer login.
- El inicio de sesión permite usar usuario o correo.
- La recuperación de contraseña envía un email real con enlace de reset (TTL 1 hora) a través de Resend.

### RF-02: Registro e inicio de sesión de hijos
- El hijo se registra ingresando el **código familiar** del padre (validación de existencia). El campo puede venir pre-llenado desde un enlace compartido por el padre (`/register-child?code=XXXXXX`).
- El registro requiere: nombre, apellido, nombre de usuario, fecha de nacimiento y PIN numérico de 4 dígitos.
- El PIN se almacena hasheado con bcrypt. Los PINs legacy migran automáticamente al primer login.
- El inicio de sesión del hijo utiliza nombre de usuario + PIN (sin correo).
- El hijo queda vinculado al padre mediante `parent_id` en la tabla `children`.

### RF-03: Dashboard del padre
- Visualiza: puntos totales acumulados por todos los hijos, tareas completadas, tareas pendientes, número de hijos.
- Muestra tarjeta por cada hijo con: iniciales, edad, nivel calculado, puntos y barra de progreso de tareas.
- **Ranking familiar** con medallas 🥇🥈🥉 para el top 3 (reemplaza la gráfica de barras de Fase 2).
- Feed de actividad reciente (últimas 10 acciones: tareas completadas y canjes aprobados).

### RF-04: Gestión de tareas por el padre
- El padre puede **crear** tareas con: título, descripción, categoría (académica/doméstica), puntos, fecha/hora límite, hijo asignado y opcionalmente recurrencia (diaria o semanal).
- El padre puede **editar** tareas en estado `pending` (título, descripción, categoría, puntos, fecha límite, hijo asignado).
- El padre puede **eliminar** tareas con confirmación; si estaba completada, se advierten los puntos que se restarán.
- El padre puede marcar tareas como completadas o revertir el estado de completado.
- El padre puede **aprobar o rechazar** tareas con evidencia fotográfica (estado `pending_review`); al rechazar puede especificar un motivo visible para el hijo.
- Columna adicional "Por revisar" en `ParentTasks` para tareas con evidencia pendiente.
- Filtros disponibles: por tipo de tarea (todas/académica/doméstica) y por hijo.
- Las **tareas recurrentes** generan automáticamente su siguiente instancia (lazy generation) cuando el padre abre la pantalla de tareas, si la fecha de la siguiente ocurrencia ya llegó.

### RF-05: Visualización y completado de tareas por el hijo
- El hijo ve únicamente sus tareas asignadas con indicador de dificultad visual (⭐ Fácil / ⭐⭐ Normal / ⭐⭐⭐ Difícil según puntos).
- Visualiza: estado, descripción, categoría, dificultad y countdown del deadline.
- Puede marcar una tarea como completada directamente (sin foto).
- Puede **subir una foto** como evidencia de completado; la tarea pasa a `pending_review` hasta que el padre la apruebe o rechace.
- Si el padre rechaza la evidencia, el hijo ve el motivo de rechazo en la tarjeta.
- Al completar una tarea, los puntos se actualizan en tiempo real.
- Si el completado cruza un múltiplo de 100 puntos, se muestra un **toast de celebración de hito**.
- Puede desmarcar una tarea completada (los puntos se restan).

### RF-06: Dashboard del hijo
- Muestra: puntos actuales, tareas completadas, tareas pendientes, número de recompensas canjeadas.
- Badge de nivel (`⭐ Nivel N`) con **barra de progreso al siguiente nivel** (`puntos % 100` sobre 100).
- Strip de **logros desbloqueados** (badges calculados del estado actual sin BD adicional).
- Barra de progreso general de tareas.
- Vista previa de las últimas 5 tareas con dificultad visual.
- Sección "Recompensas a tu Alcance" (máx. 3 recompensas cuyo costo ≤ puntos disponibles).

### RF-07: Gestión del catálogo de recompensas por el padre
- El padre puede crear recompensas con: nombre, costo en puntos, icono, descripción, fecha de vencimiento (opcional), hijo específico (opcional).
- Las recompensas vencidas aparecen deshabilitadas para el padre.
- El padre puede eliminar recompensas (con confirmación).
- Visualiza el balance de puntos de cada hijo en la misma página.

### RF-08: Solicitud de recompensas por el hijo
- El hijo ve el catálogo de recompensas disponibles para él (propias + las de "todos los hijos").
- Las recompensas vencidas no se muestran.
- El hijo puede solicitar una recompensa si tiene puntos suficientes y no tiene solicitud pendiente para ella.
- Confirmación modal antes de enviar la solicitud.
- Las solicitudes quedan en estado `pending` hasta resolución del padre.

### RF-09: Aprobación/rechazo de solicitudes de canje por el padre
- El padre ve las solicitudes pendientes con nombre del hijo, recompensa, costo y tiempo transcurrido.
- Al aprobar: valida puntos, actualiza la solicitud, inserta en `redemptions` y descuenta en `activity_log`.
- Al rechazar: actualiza el estado a `rejected`.

### RF-10: Historial de actividad del hijo
- El hijo visualiza su historial de canjes aprobados con icono, nombre y puntos gastados.
- El hijo visualiza un **timeline de actividad** (últimas 20 entradas de `activity_log`) en su perfil con fecha, acción y puntos ganados o gastados.

### RF-11: Perfil del padre
- Muestra datos del padre (nombre, usuario, correo).
- Muestra el **código familiar** con botón de copiar.
- El padre puede **editar su nombre** directamente en la tarjeta de perfil.
- El padre puede **cambiar su contraseña** (requiere contraseña actual).
- Modal "Agregar Hijo" que muestra el código familiar y genera un link de registro pre-llenado (`/register-child?code=XXXXXX`) para compartir.
- Lista de hijos vinculados.
- Función de cierre de sesión.

### RF-12: Perfil del hijo
- Muestra datos del hijo (nombre, usuario, puntos, progreso de tareas).
- El hijo puede **editar su nombre** directamente en la tarjeta de perfil.
- Grid de **logros/badges** (desbloqueados e bloqueados con opacidad reducida).
- Timeline de historial de puntos (`PointsTimeline`).
- Función de cierre de sesión.

### RF-13: Rutas protegidas
- Todas las rutas de padre redirigen a `/login-parent` si no hay sesión con `role === "parent"`.
- Todas las rutas de hijo redirigen a `/login-child` si no hay sesión con `role === "child"`.

### RF-14: Recuperación de contraseña real
- El padre ingresa su correo en `/forgot-password`.
- El sistema invoca una Supabase Edge Function que genera un token UUID, lo guarda en `password_reset_tokens` con TTL de 1 hora y envía un email vía Resend con el enlace de reset.
- La respuesta siempre es "Si el correo existe, recibirás un enlace" (anti-enumeración).
- En `/reset-password?token=XXX` el sistema valida el token (no usado, no expirado), permite crear nueva contraseña y marca el token como usado.

### RF-15: Verificación por foto en tareas
- El hijo puede adjuntar una foto como evidencia de completado de una tarea.
- La foto se comprime en el cliente (máx. 800px, JPEG q=0.7) antes de subirse al bucket `task-photos`.
- La tarea pasa a estado `pending_review`; los puntos NO se otorgan hasta que el padre apruebe.
- El padre ve las tareas en `pending_review` en una columna diferenciada con la foto, y puede aprobar (otorga puntos) o rechazar (devuelve a `pending` con motivo opcional).

### RF-16: Tareas recurrentes
- El padre puede marcar una tarea como recurrente (diaria o semanal) al crearla.
- Al completarse, el sistema genera automáticamente la siguiente instancia (lazy generation) cuando el padre carga la pantalla de tareas, si la siguiente fecha ya llegó.
- Las instancias generadas tienen referencia `template_task_id` a la tarea original.

### RF-17: Sistema de logros (badges)
- Los logros se calculan en el cliente a partir del estado existente, sin tablas adicionales:

| Badge | Condición |
|---|---|
| 🌟 Primera tarea | `tareas_completadas >= 1` |
| 🔥 Racha de 3 | `streak >= 3` |
| 💯 Centenario | `puntos >= 100` |
| 🏆 Veterano | `tareas_completadas >= 10` |
| 💎 Coleccionista | `canjes >= 3` |

---

## 5. Requisitos No Funcionales

### RNF-01: Resiliencia de carga de datos
Cada bloque de datos en las páginas del hijo carga de forma independiente en su propio `try/catch`. Un fallo en la carga de recompensas no impide que se muestren los puntos o las tareas, y viceversa.

### RNF-02: Seguridad de credenciales
- Las contraseñas de padres y los PINs de hijos se almacenan con hash bcrypt (cost 10).
- Los usuarios registrados antes de la Fase 3 (contraseñas en texto plano) migran automáticamente al primer login sin interrupción del servicio.
- Los tokens de recuperación de contraseña tienen TTL de 1 hora y son de un solo uso.
- Las credenciales de Supabase se cargan desde variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), nunca hardcodeadas.

### RNF-03: Usabilidad
- Interfaz diferenciada por rol (Navbar para padre, ChildNavbar para hijo).
- Toast notifications para confirmación de acciones (completar, editar, eliminar, aprobar, etc.).
- Toast de celebración especial con animación CSS al cruzar un múltiplo de 100 puntos.
- Modales de confirmación antes de acciones destructivas o con coste.
- Estados vacíos informativos en todas las secciones.
- Indicadores de carga mientras se obtienen datos.

### RNF-04: Rendimiento
- Los datos del dashboard principal del hijo se cargan en paralelo (`Promise.all`) para puntos, progreso, tareas recientes y conteo de canjes.
- Las fotos de evidencia se comprimen en el cliente antes de subirse (máx. 800px, JPEG 70%) para minimizar el uso de Storage.
- Las tareas recurrentes se generan de forma lazy (sin cron) al cargar la vista de tareas del padre.

### RNF-05: Consistencia de datos
- Los puntos de un hijo se calculan en tiempo real: `puntos = sum(tareas completadas) - sum(canjes aprobados)`. No hay campo de puntos almacenado.
- Los puntos solo se otorgan cuando el padre aprueba la evidencia (tareas con foto) o cuando el hijo completa directamente.

### RNF-06: Prevención de doble acción
- Botones de completar/desmarcar tarea quedan deshabilitados mientras se procesa la acción.
- Formularios de crear/editar tarea y recompensa bloquean el botón de envío durante la petición.

### RNF-07: Optimización de imágenes
- Las fotos se comprimen a máximo 800px en el lado más largo y calidad JPEG 70% usando Canvas API del navegador, sin librerías externas.
- Las imágenes HEIC (iPhone) se convierten a JPEG antes de subir para garantizar compatibilidad en todos los navegadores.

---

## 6. Reglas de Negocio

| ID | Regla |
|---|---|
| RN-01 | Un hijo solo puede pertenecer a un padre (relación 1:N padre → hijos). |
| RN-02 | El código familiar es el principal mecanismo de vinculación hijo-padre. El padre también puede compartir un enlace de registro pre-llenado. |
| RN-03 | Los puntos de un hijo nunca se almacenan directamente; siempre se calculan como `sum(tasks.points WHERE status='completed') - sum(redemptions.points_spent)`. |
| RN-04 | Una recompensa con `child_id = NULL` es visible para todos los hijos del padre. Una con `child_id = X` solo para ese hijo. |
| RN-05 | Un hijo no puede solicitar una recompensa si ya tiene una solicitud `pending` para esa misma recompensa. |
| RN-06 | Un hijo no puede solicitar una recompensa si sus puntos disponibles son menores que el costo. |
| RN-07 | Al aprobar un canje, el sistema valida nuevamente que el hijo tenga puntos suficientes (doble validación). Si no, lanza `INSUFFICIENT_POINTS`. |
| RN-08 | Al aprobar un canje se registra una entrada negativa en `activity_log` (`points = -points_cost`). |
| RN-09 | Las recompensas vencidas (`expires_at < now()`) no son visibles para el hijo. |
| RN-10 | Al desmarcar una tarea, se elimina el registro más reciente en `activity_log` que coincida con `child_id`, `parent_id` y `action = task.title`. |
| RN-11 | El nivel del hijo: `nivel = max(1, floor(puntos / 100) + 1)`. Cada 100 puntos sube un nivel. |
| RN-12 | Solo el padre puede marcar tareas como completadas desde la vista de gestión. El hijo puede marcar las suyas. Ambos pueden desmarcar. |
| RN-13 | Solo se pueden editar tareas en estado `pending`. Las tareas `completed` o `pending_review` no son editables. Al intentarlo, el servicio lanza `CANNOT_EDIT_COMPLETED`. |
| RN-14 | Al eliminar una tarea que estaba `completed`, se eliminan también sus entradas en `activity_log` (los puntos se restan del recálculo automático). |
| RN-15 | Una tarea con foto (`pending_review`) no otorga puntos hasta que el padre la apruebe. Si la rechaza, la tarea vuelve a `pending` y la foto se elimina del registro. |
| RN-16 | Los tokens de recuperación de contraseña solo pueden usarse una vez y expiran en 1 hora. El endpoint siempre responde con el mismo mensaje para no revelar si un email existe. |
| RN-17 | Las tareas recurrentes generan solo la siguiente instancia (nunca en lote). La instancia tiene `template_task_id` apuntando a la tarea origen. |
| RN-18 | La dificultad visual de una tarea se calcula solo en el cliente: ≤5 pts = Fácil, 6-15 pts = Normal, ≥16 pts = Difícil. No se almacena en BD. |

---

## 7. Modelo de Datos (Esquema de Base de Datos)

### Tabla: `parents`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único del padre |
| `first_name` | text | Nombre |
| `last_name` | text | Apellido |
| `username` | text (unique) | Nombre de usuario |
| `email` | text (unique) | Correo electrónico |
| `phone` | text | Teléfono |
| `birth_date` | date | Fecha de nacimiento |
| `password` | text | Contraseña hasheada con bcrypt |
| `family_code` | varchar (unique) | Código familiar de 6 caracteres |
| `accepted_terms` | boolean | Aceptación de términos |
| `accepted_marketing` | boolean | Aceptación de marketing |
| `created_at` | timestamptz | Fecha de registro |

### Tabla: `children`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único del hijo |
| `parent_id` | bigint (FK → parents.id) | Padre al que pertenece |
| `first_name` | text | Nombre |
| `last_name` | text | Apellido |
| `username` | text (unique) | Nombre de usuario para login |
| `pin` | varchar | PIN hasheado con bcrypt |
| `birth_date` | date | Fecha de nacimiento |
| `current_streak` | int (default 0) | Días consecutivos con actividad |
| `last_activity_date` | date | Última fecha con tarea completada |
| `created_at` | timestamptz | Fecha de registro |

### Tabla: `tasks`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único |
| `parent_id` | bigint (FK → parents.id) | Padre que creó la tarea |
| `child_id` | bigint (FK → children.id) | Hijo asignado |
| `title` | text | Título |
| `description` | text | Descripción (opcional) |
| `category` | text | `'academica'` o `'domestica'` |
| `points` | integer | Puntos al completarse |
| `status` | text | `'pending'`, `'completed'` o `'pending_review'` |
| `due_date` | timestamptz | Fecha y hora límite (opcional) |
| `completed_at` | timestamptz | Timestamp de completado |
| `photo_url` | text (nullable) | URL pública de la foto de evidencia |
| `reviewed_at` | timestamptz (nullable) | Timestamp de aprobación/rechazo de foto |
| `rejection_reason` | text (nullable) | Motivo de rechazo visible para el hijo |
| `is_recurring` | boolean (default false) | Si la tarea es recurrente |
| `recurrence_frequency` | text (nullable) | `'daily'` o `'weekly'` |
| `template_task_id` | bigint (FK → tasks.id, nullable) | Tarea origen para instancias recurrentes |
| `created_at` | timestamptz | Fecha de creación |

### Tabla: `rewards`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único |
| `parent_id` | bigint (FK → parents.id) | Padre que la creó |
| `title` | text | Nombre de la recompensa |
| `description` | text | Descripción opcional |
| `icon` | text | Emoji del icono |
| `points_cost` | integer | Puntos necesarios |
| `child_id` | bigint (FK → children.id, nullable) | Hijo específico (NULL = todos) |
| `expires_at` | timestamptz (nullable) | Fecha de vencimiento |
| `created_at` | timestamptz | Fecha de creación |

### Tabla: `reward_requests`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único |
| `reward_id` | bigint (FK → rewards.id, CASCADE) | Recompensa solicitada |
| `child_id` | bigint (FK → children.id, CASCADE) | Hijo que solicita |
| `parent_id` | bigint (FK → parents.id, CASCADE) | Padre que resuelve |
| `status` | text | `'pending'`, `'approved'` o `'rejected'` |
| `requested_at` | timestamptz | Timestamp de solicitud |
| `resolved_at` | timestamptz (nullable) | Timestamp de resolución |

### Tabla: `redemptions`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único |
| `reward_id` | bigint (FK → rewards.id) | Recompensa canjeada |
| `child_id` | bigint (FK → children.id) | Hijo que canjeó |
| `points_spent` | integer | Puntos descontados |
| `redeemed_at` | timestamptz | Timestamp del canje |

### Tabla: `activity_log`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único |
| `parent_id` | bigint (FK → parents.id) | Padre relacionado |
| `child_id` | bigint (FK → children.id) | Hijo relacionado |
| `action` | text | Título de tarea o `"Canjeó: X"` |
| `points` | integer | Positivo (ganado) o negativo (gastado) |
| `created_at` | timestamptz | Timestamp del registro |

### Tabla: `password_reset_tokens`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK, default gen_random_uuid()) | Identificador único |
| `parent_id` | bigint (FK → parents.id, CASCADE) | Padre que solicitó el reset |
| `token` | text (unique) | Token UUID generado aleatoriamente |
| `expires_at` | timestamptz | Expiración (1 hora desde creación) |
| `used_at` | timestamptz (nullable) | Cuándo fue usado (null = no usado) |

### Supabase Storage

| Bucket | Acceso | Uso |
|---|---|---|
| `task-photos` | Público (lectura libre) | Fotos de evidencia de tareas completadas |

**Convención de paths:** `{child_id}/{task_id}-{timestamp}.jpg`

### Relaciones (resumen para diagrama ER)
```
parents (1) ──< children (N)
parents (1) ──< tasks (N)
children (1) ──< tasks (N)
tasks (0..1) ──< tasks (N)                [template_task_id → self-referential]
parents (1) ──< rewards (N)
children (0..1) ──< rewards (N)           [child_id nullable]
rewards (1) ──< reward_requests (N)
children (1) ──< reward_requests (N)
parents (1) ──< reward_requests (N)
rewards (1) ──< redemptions (N)
children (1) ──< redemptions (N)
parents (1) ──< activity_log (N)
children (1) ──< activity_log (N)
parents (1) ──< password_reset_tokens (N)
```

---

## 8. Arquitectura de la Aplicación

### Rutas y páginas

| Ruta | Componente | Rol requerido |
|---|---|---|
| `/` | Redirige a `/login-parent` | — |
| `/login-parent` | `LoginParent` | — |
| `/register-parent` | `RegisterParent` | — |
| `/forgot-password` | `ForgotPassword` | — |
| `/reset-password` | `ResetPassword` | — |
| `/register-child` | `RegisterChild` | — |
| `/login-child` | `LoginChild` | — |
| `/parent-home` | `ParentHome` | parent |
| `/parent-tasks` | `ParentTasks` | parent |
| `/parent-rewards` | `ParentRewards` | parent |
| `/parent-profile` | `ParentProfile` | parent |
| `/child-home` | `ChildHome` | child |
| `/child-tasks` | `ChildTasks` | child |
| `/child-rewards` | `ChildRewards` | child |
| `/child-profile` | `ChildProfile` | child |

### Servicios (capa de datos)

| Archivo | Funciones principales |
|---|---|
| `supabase.js` | `createClient` — cliente Supabase compartido con variables de entorno |
| `parentService.js` | `registerParent`, `loginParent` (con lazy hash migration), `findParentByEmail`, `updateParentProfile`, `changeParentPassword` |
| `childService.js` | `registerChild`, `loginChild` (con lazy hash migration), `updateChildProfile`, `getTasksByChild`, `getRecentTasksByChild`, `getRedemptionsByChild`, `getRedemptionCount`, `getActivityHistory` |
| `dashboardService.js` | `getChildrenByParent`, `getChildPoints`, `getDashboardStats`, `getChildProgress`, `getActivityLog` |
| `taskService.js` | `getTasksByParent`, `createTask`, `completeTask`, `uncompleteTask`, `deleteTask`, `updateTask`, `submitTaskWithPhoto`, `approveTaskReview`, `rejectTaskReview`, `generateRecurringInstances` |
| `rewardService.js` | `getRewardsByParent`, `getRewardsForChild`, `createReward`, `deleteReward`, `requestReward`, `getChildPendingRequests`, `getPendingRequests`, `approveRequest`, `rejectRequest` |

### Utilidades y librerías

| Archivo | Propósito |
|---|---|
| `src/utils/auth.js` | `getUserSession`, `saveUserSession`, `clearUserSession` |
| `src/utils/crypto.js` | `hashSecret(value)`, `verifySecret(value, stored)` — abstracción sobre bcryptjs con detección de legacy |
| `src/utils/helpers.js` | `calculateAge`, `generateFamilyCode` |
| `src/utils/validators.js` | `isValidEmail`, `isValidPin`, `isStrongPassword`, `isValidPhone`, `isAdult` |
| `src/lib/constants.js` | `BCRYPT_COST`, `POINTS_PER_LEVEL`, `TASK_PHOTO_MAX_DIMENSION`, `TASK_PHOTO_JPEG_QUALITY`, `RESET_TOKEN_TTL_MS`, `ACTIVITY_LOG_LIMIT` |
| `src/lib/badges.js` | `BADGES`, `computeBadges(stats)` — calcula logros desbloqueados sin BD |
| `src/lib/taskDifficulty.js` | `difficultyOf(points)` — clasifica dificultad por rango de puntos |

### Componentes

| Archivo | Propósito |
|---|---|
| `components/Navbar.jsx` | Navbar del padre (responsive con hamburguesa) |
| `components/ChildNavbar.jsx` | Navbar del hijo (responsive con hamburguesa) |
| `components/ProtectedRoute.jsx` | Guard de rutas por rol |
| `components/Button.jsx` | Botón primario reutilizable |
| `components/InputField.jsx` | Input controlado con label |
| `components/FormContainer.jsx` | Contenedor de formularios centrado |
| `components/TaskPhotoUploader.jsx` | Upload de foto con compresión Canvas, preview y envío a Storage |
| `components/parent/ChildrenRanking.jsx` | Ranking familiar con medallas (reemplaza gráfica de barras) |
| `components/child/PointsTimeline.jsx` | Timeline vertical de historial de actividad del hijo |

### Edge Functions (Supabase / Deno)

| Función | Ruta | Propósito |
|---|---|---|
| `send-reset-email` | `supabase/functions/send-reset-email/index.ts` | Genera token de reset, inserta en `password_reset_tokens` y envía email vía Resend API. `verify_jwt: false` (pública). |

### Gestión de sesión
- Sesión almacenada en `localStorage` como JSON serializado.
- `getUserSession()` — lee y parsea la sesión.
- `saveUserSession(user)` — serializa y guarda. Se llama también tras editar el perfil para mantener coherencia inmediata.
- `clearUserSession()` — elimina la sesión (logout).
- Objeto de sesión para padre: `{ role, id, username, firstName, lastName, email, familyCode }`
- Objeto de sesión para hijo: `{ role, id, username, firstName, lastName, parentId }`

---

## 9. Casos de Uso

### CU-01: Registro de padre
**Actor:** Padre/Madre | **Precondición:** Sin sesión activa
1. Accede a `/register-parent` y completa el formulario.
2. El sistema valida unicidad de usuario y correo.
3. Se genera un `family_code` único de 6 caracteres.
4. La contraseña se hashea con bcrypt antes de insertar.
5. Se guarda sesión y redirige a `/parent-home`.

### CU-02: Registro de hijo
**Actor:** Hijo | **Precondición:** El padre existe y tiene código familiar
1. Accede a `/register-child` (opcionalmente con `?code=XXXXXX` pre-llenado).
2. Ingresa código familiar, datos personales y PIN.
3. El sistema valida el código y la unicidad del username.
4. El PIN se hashea con bcrypt antes de insertar.
5. Se guarda sesión y redirige a `/child-home`.

### CU-03: Crear tarea (con opción recurrente)
**Actor:** Padre/Madre | **Precondición:** Sesión activa, al menos un hijo
1. Accede a `/parent-tasks` → "Agregar Nueva Tarea".
2. Completa el formulario; opcionalmente activa recurrencia (diaria/semanal).
3. El sistema inserta la tarea en `tasks` con `status = 'pending'`.
4. Si es recurrente, `is_recurring = true` y `recurrence_frequency` se almacenan.

### CU-04: Completar tarea sin foto (hijo)
**Actor:** Hijo | **Precondición:** Tarea en estado `pending`
1. Accede a `/child-tasks` → pulsa "Completar".
2. El sistema actualiza `status = 'completed'`, registra `completed_at` e inserta en `activity_log`.
3. Puntos se actualizan en tiempo real. Si cruza múltiplo de 100, toast de celebración.

### CU-05: Completar tarea con foto (hijo)
**Actor:** Hijo | **Precondición:** Tarea en estado `pending`
1. Pulsa "📷 Foto" en la tarea.
2. Selecciona imagen → se comprime en Canvas → se sube a `task-photos`.
3. El sistema actualiza `status = 'pending_review'` y guarda `photo_url`. No otorga puntos.
4. La tarea muestra "📷 Esperando revisión".

### CU-06: Aprobar/rechazar evidencia fotográfica (padre)
**Actor:** Padre | **Precondición:** Tarea en `pending_review`
1. Ve la columna "Por revisar" en `/parent-tasks` con thumbnail de la foto.
2. **Aprobar:** `status = 'completed'`, `reviewed_at`, inserta en `activity_log` (puntos otorgados).
3. **Rechazar:** `status = 'pending'`, `photo_url = null`, guarda `rejection_reason`; el hijo ve el motivo.

### CU-07: Editar tarea (padre)
**Actor:** Padre | **Precondición:** Tarea en estado `pending`
1. Pulsa menú "⋯" → "Editar" en la tarjeta de la tarea.
2. Modifica los campos deseados y confirma.
3. `updateTask` valida que el status siga siendo `pending`; si no, lanza `CANNOT_EDIT_COMPLETED`.

### CU-08: Eliminar tarea (padre)
**Actor:** Padre | **Precondición:** Tarea existente
1. Pulsa menú "⋯" → "Eliminar". Si la tarea estaba completada, el modal advierte los puntos que se restarán.
2. Al confirmar: `deleteTask` elimina la tarea y sus entradas en `activity_log`.

### CU-09: Recuperar contraseña (padre)
**Actor:** Padre | **Precondición:** Cuenta registrada
1. Accede a `/forgot-password`, ingresa su correo y confirma.
2. `ForgotPassword` invoca la Edge Function `send-reset-email`.
3. La función genera un UUID, lo guarda en `password_reset_tokens` (TTL 1h) y envía email via Resend.
4. El padre abre el enlace `/reset-password?token=XXX`, ingresa nueva contraseña.
5. El sistema valida el token (no usado, no expirado), hashea la contraseña y marca el token como `used_at`.

### CU-10: Editar perfil (padre o hijo)
**Actor:** Padre / Hijo
1. En la página de perfil, pulsa el ícono ✏️ junto al nombre.
2. Edita nombre y/o apellido, pulsa "Guardar".
3. El sistema actualiza la tabla correspondiente y llama `saveUserSession` con los nuevos datos.
4. El navbar refleja el cambio inmediatamente sin recargar.
5. (Solo padre) Para cambiar contraseña: modal con tres campos (actual, nueva, confirmar).

### CU-11: Agregar hijo desde perfil del padre
**Actor:** Padre
1. Accede a `/parent-profile` → botón "👶 Agregar hijo".
2. El modal muestra el código familiar en grande y un botón "📋 Copiar enlace de registro".
3. El enlace copiado es `/register-child?code=XXXXXX`; al abrirlo el campo de código se pre-llena.

### CU-12: Crear recompensa
**Actor:** Padre | **Precondición:** Sesión activa
1. Accede a `/parent-rewards` → "+ Agregar Recompensa".
2. Completa nombre, puntos, icono; opcionalmente descripción, fecha de vencimiento, hijo específico.
3. El sistema inserta en `rewards`.

### CU-13: Solicitar y aprobar canje de recompensa
**Actor:** Hijo → Padre
1. El hijo ve el catálogo en `/child-rewards`, pulsa "Reclamar" y confirma en el modal.
2. Se inserta en `reward_requests` con `status = 'pending'`.
3. El padre aprueba: valida puntos, inserta en `redemptions`, descuenta en `activity_log`.

---

## 10. Flujos de Actividad (descripción para diagramas)

### Flujo A: Ciclo completo de una tarea (sin foto)
```
[Padre crea tarea] → tasks (status=pending)
  → [Hijo ve tarea, pulsa "Completar"]
  → status=completed, completed_at=now()
  → INSERT activity_log (+points)
  → Puntos del hijo aumentan en tiempo real
  → Si cruza múltiplo de 100 → toast de celebración
  → [Padre ve tarea en columna "Completadas"]
```

### Flujo B: Ciclo completo de una tarea con foto
```
[Hijo pulsa "📷 Foto"] → comprime imagen en Canvas
  → sube a Storage (task-photos/{child_id}/{task_id}-{ts}.jpg)
  → status=pending_review, photo_url=<url pública>
  → [Padre ve tarea en columna "Por revisar" con thumbnail]
  → [Padre aprueba]
    → status=completed, reviewed_at=now()
    → INSERT activity_log (+points)
  → [Padre rechaza]
    → status=pending, photo_url=null, rejection_reason=<motivo>
    → [Hijo ve motivo en la tarjeta]
```

### Flujo C: Recuperación de contraseña
```
[Padre ingresa email en /forgot-password]
  → supabase.functions.invoke('send-reset-email', { email })
  → Edge Function: busca padre por email
  → Si existe: genera UUID token, INSERT password_reset_tokens (expires_at = now()+1h)
  → POST Resend API → email con /reset-password?token=XXX
  → Siempre responde { ok: true } (anti-enumeración)
  → [Padre abre enlace del email]
  → /reset-password valida token (no usado, no expirado)
  → Padre ingresa nueva contraseña
  → hashSecret(newPassword) → UPDATE parents.password
  → UPDATE password_reset_tokens SET used_at=now()
  → Redirige a /login-parent
```

### Flujo D: Tarea recurrente
```
[Padre crea tarea con is_recurring=true, frequency='weekly']
  → [Hijo completa la tarea → status=completed]
  → [Padre abre /parent-tasks]
    → getTasksByParent() devuelve tareas
    → generateRecurringInstances() detecta template completado
    → nextDue = due_date + 7 días
    → Si nextDue <= hoy Y no existe instancia para esa fecha:
      → INSERT nueva tarea (status=pending, template_task_id=<id original>)
    → Nueva tarea aparece en columna "Pendientes"
```

### Flujo E: Cálculo de puntos del hijo
```
Cada consulta de puntos (getChildPoints):
  1. SELECT SUM(points) FROM tasks WHERE child_id=X AND status='completed'
  2. SELECT SUM(points_spent) FROM redemptions WHERE child_id=X
  3. puntos_disponibles = (1) - (2)
```

### Flujo F: Ciclo completo de una recompensa
```
[Padre crea recompensa] → rewards en BD
  → [Hijo ve recompensa en catálogo, pulsa "Reclamar"]
  → Modal de confirmación → INSERT reward_requests (status=pending)
  → [Padre aprueba]
    → getChildPoints → valida suficiencia
    → UPDATE reward_requests status=approved
    → INSERT redemptions (points_spent)
    → INSERT activity_log (points=-pointsCost)
  → [Padre rechaza]
    → UPDATE reward_requests status=rejected
```

---

## 11. Flujos de Secuencia (descripción para diagramas)

### S-01: Login del padre (con lazy hash migration)
```
LoginParent → loginParent(identifier, password)
  → supabase: SELECT * FROM parents WHERE username=X OR email=X
  → verifySecret(password, parent.password)
    → Si stored no empieza con '$2' → comparación directa → { matches, legacy: true }
    → Si empieza con '$2' → bcrypt.compare → { matches, legacy: false }
  → Si legacy=true Y matches=true:
    → hashSecret(password) → UPDATE parents SET password=hash
  → saveUserSession({ role, id, username, firstName, lastName, email, familyCode })
  → navigate('/parent-home')
```

### S-02: Subir foto de evidencia (hijo)
```
ChildTasks.handlePhotoClick(task)
  → setUploadingFor(task.id)
  → TaskPhotoUploader: usuario selecciona imagen
    → compressImage(file) → Canvas.toBlob (800px, JPEG 70%)
    → supabase.storage.from('task-photos').upload(path, compressed)
    → getPublicUrl(path) → publicUrl
    → onUploadComplete(publicUrl)
  → submitTaskWithPhoto(task.id, publicUrl)
    → UPDATE tasks SET status='pending_review', photo_url=publicUrl WHERE id=X
  → setTasks(prev → actualiza localmente)
  → toast "Foto enviada. Esperando revisión."
```

### S-03: Reset de contraseña
```
ForgotPassword → supabase.functions.invoke('send-reset-email', { email })
  → Edge Function (Deno):
    → SELECT id, first_name FROM parents WHERE email=X
    → Si existe: token = crypto.randomUUID()
    → INSERT password_reset_tokens (parent_id, token, expires_at=now()+1h)
    → POST resend.com/emails (html con link /reset-password?token=token)
  → Responde { ok: true } (siempre)

ResetPassword → lee ?token= de searchParams
  → SELECT FROM password_reset_tokens WHERE token=X
  → Valida: exists AND used_at IS NULL AND expires_at > now()
  → Si inválido → muestra "Enlace inválido"
  → Si válido → formulario nueva contraseña
    → hashSecret(newPassword)
    → UPDATE parents SET password=hash WHERE id=parent_id
    → UPDATE password_reset_tokens SET used_at=now() WHERE id=X
    → navigate('/login-parent') después de 3s
```

### S-04: Carga del dashboard del hijo (ChildHome)
```
ChildHome.loadDashboard()
  → Promise.all([
      getChildPoints(childId), getChildProgress(childId),
      getRecentTasksByChild(childId, 5), getRedemptionCount(childId)
    ])
  → computeBadges({ points, completedTasks, streak, redemptions })
  → getRewardsForChild(parentId, childId)  [bloque independiente]
  → setAffordableRewards (filtradas por points_cost <= puntos, max 3)
```

### S-05: Aprobar solicitud de canje (padre)
```
ParentRewards.handleApprove(request)
  → approveRequest(requestId, childId, pointsCost, parentId, rewardTitle, rewardId)
    → getChildPoints(childId) → si < pointsCost → throw 'INSUFFICIENT_POINTS'
    → UPDATE reward_requests SET status='approved', resolved_at=now()
    → INSERT redemptions (reward_id, child_id, points_spent)
    → INSERT activity_log (parent_id, child_id, action='Canjeó: X', points=-pointsCost)
  → showToast('Solicitud aprobada') → loadData()
```

---

## 12. Módulos Implementados — Estado Actual

| Módulo | Vista Padre | Vista Hijo | Estado |
|---|---|---|---|
| Autenticación | Login + Registro + Recuperación real (Resend) | Login + Registro | ✅ Completo |
| Seguridad | Hash bcrypt + migración lazy | Hash bcrypt PIN + migración lazy | ✅ Completo |
| Dashboard | Estadísticas, hijos, ranking familiar, actividad | Puntos, nivel+barra, badges, progreso, tareas recientes, recompensas | ✅ Completo |
| Tareas | Crear, editar, eliminar, completar, desmarcar, filtros, recurrentes, revisar fotos | Ver, completar, subir foto, desmarcar | ✅ Completo |
| Recompensas | Crear, eliminar, ver solicitudes, aprobar/rechazar | Ver catálogo, solicitar, ver historial de canjes | ✅ Completo |
| Perfil | Editar nombre, cambiar contraseña, código familiar, agregar hijo, cerrar sesión | Editar nombre, badges, timeline de puntos, cerrar sesión | ✅ Completo |
| Gamificación | Ranking familiar con medallas | Nivel, barra de nivel, badges, dificultad, milestone toast | ✅ Completo |
| Navegación | Navbar responsive con hamburguesa | ChildNavbar responsive con hamburguesa | ✅ Completo |

---

## 13. Cambios e Implementaciones por Fase

### 13.1 Fase 2.1 — Sistema de Recompensas y Correcciones

**Archivos creados/modificados:**
- `src/services/rewardService.js` — Servicio completo de recompensas
- `src/pages/ParentRewards.jsx`, `src/pages/ChildRewards.jsx`
- `src/pages/ChildHome.jsx` — Sección "Recompensas a tu Alcance"
- `notes/supabase_migration_rewards.sql`

**Correcciones de regresiones:**
- Extracción de `getRewardsForChild` fuera del `Promise.all` principal para evitar que un fallo de la columna `child_id` vaciara todo el dashboard del hijo.
- Reescritura de `ChildRewards.loadData` con `try/catch` independientes por bloque de datos.
- Fallback en `createReward` para cuando la migración no había sido ejecutada.
- Cambio de `.order("created_at")` a `.order("id")` en `redemptions` (columna inexistente).

---

### 13.2 Fase 3.0 — Seguridad, Gamificación y Nuevas Funcionalidades

#### 13.2.1 Seguridad — Hash de contraseñas

**Nueva dependencia:** `bcryptjs@^2.4.3`

**Archivos creados:**
- `src/utils/crypto.js` — `hashSecret(value)` y `verifySecret(value, stored)` con detección de hash legacy

**Archivos modificados:**
- `src/services/parentService.js` — hash en registro; migración lazy en login
- `src/services/childService.js` — hash de PIN en registro; migración lazy en login

**Estrategia lazy:** Si `stored` no empieza con `$2b` (bcrypt prefix), `verifySecret` compara en texto plano y retorna `{ legacy: true }`. El caller re-hashea y actualiza la BD en la misma petición. El usuario nunca percibe la diferencia.

#### 13.2.2 Seguridad — Recuperación de contraseña real

**Archivos creados:**
- `supabase/functions/send-reset-email/index.ts` — Edge Function Deno, `verify_jwt: false`
- `src/pages/ResetPassword.jsx` — página de reset con validación de token

**Archivos modificados:**
- `src/pages/ForgotPassword.jsx` — llama `supabase.functions.invoke` en lugar de `findParentByEmail`
- `src/App.jsx` — nueva ruta `/reset-password`

**BD:** Nueva tabla `password_reset_tokens`.

#### 13.2.3 Verificación por foto en tareas

**Archivos creados:**
- `src/components/TaskPhotoUploader.jsx` — compresión Canvas + upload a Storage

**Archivos modificados:**
- `src/services/taskService.js` — `submitTaskWithPhoto`, `approveTaskReview`, `rejectTaskReview`
- `src/pages/ChildTasks.jsx` — botón "📷 Foto", pill `pending_review`, motivo de rechazo
- `src/pages/ParentTasks.jsx` — columna "Por revisar" con thumbnail, botones aprobar/rechazar

**BD:** Columnas `photo_url`, `reviewed_at`, `rejection_reason` en `tasks`; CHECK constraint de `status` actualizado para incluir `'pending_review'`; bucket `task-photos` creado.

#### 13.2.4 Edición de perfil

**Archivos modificados:**
- `src/services/parentService.js` — `updateParentProfile`, `changeParentPassword`
- `src/services/childService.js` — `updateChildProfile`
- `src/pages/ParentProfile.jsx` — edición inline de nombre, modal de contraseña, código familiar con copiar, modal "Agregar hijo", botones de acción
- `src/pages/ChildProfile.jsx` — edición inline de nombre

#### 13.2.5 Gestión avanzada de tareas

**Archivos modificados:**
- `src/services/taskService.js` — `deleteTask`, `updateTask` (con guard `CANNOT_EDIT_COMPLETED`)
- `src/pages/ParentTasks.jsx` — menú "⋯" por tarjeta, modal de edición, modal de confirmación de eliminación con advertencia de puntos

#### 13.2.6 Flujo de incorporación de hijos

**Archivos modificados:**
- `src/pages/ParentProfile.jsx` — modal "Agregar hijo" con link pre-llenado
- `src/pages/RegisterChild.jsx` — lee `?code=` con `useSearchParams` y pre-rellena el campo

**Archivo modificado:**
- `src/pages/LoginParent.jsx` — agrega `familyCode` al objeto de sesión (bug latente corregido)

#### 13.2.7 Tareas recurrentes

**Archivos modificados:**
- `src/services/taskService.js` — `createTask` acepta `isRecurring`/`recurrenceFrequency`; nueva función `generateRecurringInstances`
- `src/pages/ParentTasks.jsx` — checkbox "Tarea recurrente" + selector diaria/semanal en el formulario; `generateRecurringInstances` invocado en `loadData`

**BD:** Columnas `is_recurring`, `recurrence_frequency`, `template_task_id` en `tasks`.

#### 13.2.8 Gamificación del hijo

**Archivos creados:**
- `src/lib/badges.js` — `BADGES`, `computeBadges(stats)` — logros calculados sin BD
- `src/lib/taskDifficulty.js` — `difficultyOf(points)` — ≤5=Fácil, 6-15=Normal, ≥16=Difícil
- `src/lib/constants.js` — constantes globales

**Archivos modificados:**
- `src/pages/ChildHome.jsx` — barra de progreso de nivel, strip de badges desbloqueados
- `src/pages/ChildTasks.jsx` — dificultad en tarjetas, milestone toast al cruzar 100 pts
- `src/pages/ChildProfile.jsx` — grid completo de badges, `PointsTimeline`
- `src/styles/dashboard.css` — clases para badges, timeline, streak pill, milestone toast, ranking, review column, task menu, difficulty badge

#### 13.2.9 Rediseño del dashboard padre

**Archivos creados:**
- `src/components/parent/ChildrenRanking.jsx` — top 3 con medallas 🥇🥈🥉; resto con mensaje motivador sin ranking numérico

**Archivos modificados:**
- `src/pages/ParentHome.jsx` — elimina bloque `bar-chart`, reemplaza por `<ChildrenRanking children={stats.children} />`

#### 13.2.10 Historial de puntos

**Archivos creados:**
- `src/components/child/PointsTimeline.jsx` — timeline vertical con dots verde/morado, fecha y puntos

**Archivos modificados:**
- `src/services/childService.js` — nueva función `getActivityHistory(childId, limit=20)`
- `src/pages/ChildProfile.jsx` — integra `<PointsTimeline childId={user.id} />`

---

## 14. Pendientes Técnicos

| # | Pendiente | Prioridad |
|---|---|---|
| P-01 | Implementar RLS (Row Level Security) en Supabase antes de ir a producción con datos reales. Sin RLS, cualquier usuario con la anon key puede leer/escribir en todas las tablas. | Alta |
| P-02 | El streak (`current_streak`, `last_activity_date`) se actualiza en `completeTask` pero la lógica de `streakUpdater.js` está planeada y los campos están en BD — pendiente integrar la actualización automática en `taskService.js`. | Media |
| P-03 | Las fotos de evidencia son de acceso público (URL predecible). Para producción con datos sensibles, migrar a signed URLs con TTL. | Media |
| P-04 | El campo `redemptions.created_at` no existe (se llama `redeemed_at`). El ordering en `getRedemptionsByChild` usa `id` como workaround. | Baja |

---

## 15. Estructura de Archivos del Proyecto

```
domus/
├── supabase/
│   └── functions/
│       └── send-reset-email/
│           └── index.ts             # Edge Function: genera token + envía email vía Resend
├── notes/
│   ├── supabase_fase3_migrations.sql  # Migraciones aplicadas en Fase 3
│   ├── supabase_migration_rewards.sql # Migraciones de Fase 2.1
│   └── documentacion_tecnica_domus.md
├── src/
│   ├── App.jsx                        # Enrutador principal, NavbarRouter
│   ├── lib/
│   │   ├── badges.js                  # BADGES[], computeBadges(stats)
│   │   ├── constants.js               # Constantes globales (BCRYPT_COST, etc.)
│   │   └── taskDifficulty.js          # difficultyOf(points)
│   ├── components/
│   │   ├── Navbar.jsx                 # Navbar padre (responsive + hamburguesa)
│   │   ├── ChildNavbar.jsx            # Navbar hijo (responsive + hamburguesa)
│   │   ├── ProtectedRoute.jsx         # Guard de rutas por rol
│   │   ├── Button.jsx                 # Botón reutilizable
│   │   ├── InputField.jsx             # Input controlado
│   │   ├── FormContainer.jsx          # Contenedor de formularios
│   │   ├── TaskPhotoUploader.jsx      # Upload con compresión Canvas
│   │   ├── parent/
│   │   │   └── ChildrenRanking.jsx    # Ranking con medallas (reemplaza bar chart)
│   │   └── child/
│   │       └── PointsTimeline.jsx     # Timeline de historial de puntos
│   ├── pages/
│   │   ├── LoginParent.jsx
│   │   ├── RegisterParent.jsx
│   │   ├── ForgotPassword.jsx         # Llama Edge Function send-reset-email
│   │   ├── ResetPassword.jsx          # Valida token y actualiza contraseña
│   │   ├── LoginChild.jsx
│   │   ├── RegisterChild.jsx          # Lee ?code= para pre-llenar código familiar
│   │   ├── ParentHome.jsx             # Dashboard padre con ranking familiar
│   │   ├── ParentTasks.jsx            # CRUD tareas + foto review + recurrentes
│   │   ├── ParentRewards.jsx          # Catálogo + solicitudes
│   │   ├── ParentProfile.jsx          # Editar nombre, contraseña, agregar hijo
│   │   ├── ChildHome.jsx              # Dashboard hijo con nivel, badges, recompensas
│   │   ├── ChildTasks.jsx             # Tareas con foto, dificultad, milestone toast
│   │   ├── ChildRewards.jsx           # Catálogo + historial de canjes
│   │   └── ChildProfile.jsx           # Editar nombre, badges, timeline
│   ├── services/
│   │   ├── supabase.js                # Cliente con variables de entorno
│   │   ├── parentService.js           # Auth padre + hash + edición perfil
│   │   ├── childService.js            # Auth hijo + hash + edición + historial
│   │   ├── dashboardService.js        # Stats y puntos
│   │   ├── taskService.js             # CRUD + foto + recurrentes
│   │   └── rewardService.js           # Sistema de recompensas
│   ├── utils/
│   │   ├── auth.js                    # getUserSession, saveUserSession, clearUserSession
│   │   ├── crypto.js                  # hashSecret, verifySecret (bcryptjs wrapper)
│   │   ├── helpers.js                 # calculateAge, generateFamilyCode
│   │   └── validators.js              # isValidEmail, isValidPin, etc.
│   └── styles/
│       ├── dashboard.css              # Estilos principales (incluye Fase 3)
│       └── navbar.css                 # Estilos de navbars
└── package.json                       # bcryptjs añadido en Fase 3
```
