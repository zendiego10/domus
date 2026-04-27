# Domus — Documentación Técnica del Sistema

> **Versión:** Fase 2.1 (completa)
> **Fecha:** Abril 2026
> **Autor:** Diego Robles

---

## 1. Descripción del Sistema

**Domus** es una aplicación web de gestión familiar orientada a la motivación y el seguimiento de responsabilidades de los hijos del hogar. El sistema permite que los padres asignen tareas académicas y domésticas a sus hijos, establezcan recompensas canjeables por puntos, y realicen un seguimiento en tiempo real del progreso de cada hijo. Los hijos interactúan con la plataforma a través de una interfaz simplificada donde visualizan sus tareas, acumulan puntos al completarlas y solicitan canjear las recompensas disponibles.

El sistema opera bajo un modelo de **roles duales**: el rol **padre/madre** tiene capacidad de administración (crear tareas, definir recompensas, aprobar canjes), mientras que el rol **hijo** tiene capacidad de consulta y acción sobre sus propias responsabilidades.

---

## 2. Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Enrutamiento | React Router v6 |
| Backend / Base de datos | Supabase (PostgreSQL) |
| Autenticación | Autenticación propia con localStorage (sin Supabase Auth) |
| Estilos | CSS personalizado (dashboard.css) |
| Despliegue previsto | Web (navegador de escritorio y móvil) |

---

## 3. Objetivos del Sistema

### Objetivo General
Desarrollar una plataforma web que facilite la gestión de tareas y responsabilidades en el hogar, promoviendo hábitos positivos en los hijos mediante un sistema de puntos y recompensas controlado por los padres.

### Objetivos Específicos
1. Permitir al padre/madre crear y asignar tareas con puntos asociados a cada hijo registrado.
2. Permitir al hijo visualizar sus tareas, marcarlas como completadas y acumular puntos automáticamente.
3. Proveer al padre un panel de control con estadísticas en tiempo real: puntos, progreso, actividad reciente.
4. Implementar un catálogo de recompensas configurable por el padre, con flujo de solicitud y aprobación.
5. Soportar múltiples hijos bajo una misma cuenta de padre, identificados por un código familiar único.
6. Garantizar que el sistema sea robusto ante fallos parciales (datos que cargan de forma independiente).

---

## 4. Requisitos Funcionales

### RF-01: Registro e inicio de sesión de padres
- El padre se registra con nombre, apellido, correo electrónico y contraseña.
- Al registrarse se genera automáticamente un **código familiar único** de 6 caracteres alfanuméricos.
- El inicio de sesión valida correo y contraseña contra la tabla `parents`.
- Existe opción de recuperación de contraseña (`/forgot-password`).

### RF-02: Registro e inicio de sesión de hijos
- El hijo se registra ingresando el **código familiar** del padre (validación de existencia).
- El registro requiere: nombre, apellido, nombre de usuario, fecha de nacimiento y PIN numérico.
- El inicio de sesión del hijo utiliza nombre de usuario + PIN (sin correo).
- El hijo queda vinculado al padre mediante `parent_id` en la tabla `children`.

### RF-03: Dashboard del padre
- Visualiza: puntos totales acumulados por todos los hijos, tareas completadas, tareas pendientes, número de hijos.
- Muestra tarjeta por cada hijo con: iniciales, edad, nivel calculado, puntos, barra de progreso de tareas.
- Gráfico de barras con la distribución de puntos entre hijos.
- Feed de actividad reciente (últimas 10 acciones: tareas completadas y canjes aprobados).

### RF-04: Gestión de tareas por el padre
- El padre puede crear tareas con: título, descripción, categoría (académica/doméstica), puntos, fecha/hora límite, hijo asignado.
- Las tareas creadas aparecen en la columna "Tareas Pendientes".
- El padre puede marcar tareas como completadas o revertir el estado de completado.
- Filtros disponibles: por tipo de tarea (todas/académica/doméstica) y por hijo.
- Al completar una tarea se registra automáticamente en `activity_log`.
- Al desmarcar una tarea se elimina el registro de actividad más reciente asociado.

### RF-05: Visualización de tareas por el hijo
- El hijo ve únicamente sus tareas asignadas.
- Visualiza: estado (pendiente/completada), descripción, categoría, fecha límite con contador regresivo.
- Puede marcar una tarea como completada desde su vista.
- Al completar una tarea sus puntos se actualizan en tiempo real (sin recargar).
- Puede desmarcar una tarea completada (los puntos se restan).
- Toast de notificación confirma cada acción (+N pts / -N pts).

### RF-06: Dashboard del hijo
- Muestra: puntos actuales, tareas completadas, tareas pendientes, número de recompensas canjeadas.
- Barra de progreso general de tareas.
- Vista previa de las últimas 5 tareas.
- Sección "Recompensas a tu Alcance" (máx. 3 recompensas cuyo costo ≤ puntos disponibles).
- Nivel calculado dinámicamente: `nivel = floor(puntos / 100) + 1`.

### RF-07: Gestión del catálogo de recompensas por el padre
- El padre puede crear recompensas con: nombre, costo en puntos, icono (selector de emojis), descripción, fecha de vencimiento (opcional), hijo específico (opcional, NULL = todos los hijos).
- Las recompensas vencidas se muestran con opacidad reducida y badge "Vencida".
- El padre puede eliminar recompensas (con confirmación).
- Visualiza el balance de puntos de cada hijo en la misma página.

### RF-08: Solicitud de recompensas por el hijo
- El hijo ve el catálogo de recompensas disponibles para él (propias + las de "todos los hijos").
- Las recompensas vencidas no se muestran.
- El hijo puede solicitar una recompensa si tiene puntos suficientes y no la ha solicitado antes.
- Confirmación modal antes de enviar la solicitud (muestra costo, saldo actual y saldo resultante).
- Las solicitudes enviadas quedan en estado `pending` hasta resolución del padre.

### RF-09: Aprobación/rechazo de solicitudes por el padre
- El padre ve en su módulo de recompensas las solicitudes pendientes con: nombre del hijo, recompensa, costo en puntos, tiempo transcurrido.
- Al aprobar: valida que el hijo tenga puntos suficientes; si no, muestra error específico.
- Al aprobar: actualiza el estado a `approved`, registra el canje en `redemptions` y resta puntos en `activity_log` (entrada negativa).
- Al rechazar: actualiza el estado a `rejected` con fecha de resolución.

### RF-10: Historial de canjes del hijo
- El hijo visualiza su historial de canjes aprobados con: icono, nombre de la recompensa, puntos gastados.

### RF-11: Perfil del padre
- Muestra datos del padre (nombre, correo, código familiar).
- Función de cierre de sesión.

### RF-12: Perfil del hijo
- Muestra datos del hijo (nombre, usuario, puntos).
- Función de cierre de sesión.

### RF-13: Rutas protegidas
- Todas las rutas de padre redirigen a `/login-parent` si no hay sesión con `role === "parent"`.
- Todas las rutas de hijo redirigen a `/login-child` si no hay sesión con `role === "child"`.

---

## 5. Requisitos No Funcionales

### RNF-01: Resiliencia de carga de datos
Cada bloque de datos en las páginas del hijo carga de forma independiente en su propio `try/catch`. Un fallo en la carga de recompensas no impide que se muestren los puntos o las tareas, y viceversa.

### RNF-02: Retrocompatibilidad con migración pendiente
Las funciones `getRewardsForChild` y `createReward` implementan un mecanismo de fallback: si la consulta falla por columnas inexistentes (`child_id`, `expires_at`), reintentan con los campos base. Esto permite que el sistema funcione antes y después de ejecutar la migración SQL.

### RNF-03: Usabilidad
- Interfaz diferenciada por rol (Navbar para padre, ChildNavbar para hijo).
- Toast notifications para confirmación de acciones.
- Modales de confirmación antes de acciones destructivas o con coste.
- Estados vacíos informativos en todas las secciones.
- Indicadores de carga mientras se obtienen datos.

### RNF-04: Rendimiento
- Los datos del dashboard principal del hijo se cargan en paralelo (`Promise.all`) para puntos, progreso, tareas recientes y conteo de canjes.
- Los datos de recompensas se cargan en bloque separado para no bloquear el resto.

### RNF-05: Consistencia de datos
- Los puntos de un hijo se calculan en tiempo real: `puntos = sum(tareas completadas) - sum(canjes aprobados)`. No hay campo de puntos almacenado; siempre se recalcula desde las tablas `tasks` y `redemptions`.

### RNF-06: Prevención de doble acción
- Botones de completar/desmarcar tarea quedan deshabilitados mientras se procesa la acción (estado `completing` / `uncompleting`).
- Formularios de crear recompensa y tarea bloquean el botón de envío durante la petición.

---

## 6. Reglas de Negocio

| ID | Regla |
|---|---|
| RN-01 | Un hijo solo puede pertenecer a un padre (relación 1:N padre → hijos). |
| RN-02 | El código familiar es el único mecanismo de vinculación hijo-padre en el registro. |
| RN-03 | Los puntos de un hijo nunca se almacenan directamente; siempre se calculan como `suma(tasks.points WHERE status=completed) - suma(redemptions.points_spent)`. |
| RN-04 | Una recompensa con `child_id = NULL` es visible para todos los hijos del padre. Una recompensa con `child_id = X` solo es visible para ese hijo. |
| RN-05 | Un hijo no puede solicitar una recompensa si ya tiene una solicitud `pending` para esa misma recompensa. |
| RN-06 | Un hijo no puede solicitar una recompensa si sus puntos disponibles son menores que el costo. |
| RN-07 | Al aprobar un canje, el sistema valida nuevamente que el hijo tenga puntos suficientes (doble validación: frontend + backend). Si no, lanza `INSUFFICIENT_POINTS`. |
| RN-08 | Al aprobar un canje se registra una entrada negativa en `activity_log` (`points = -points_cost`) para que el cálculo de puntos refleje el gasto. |
| RN-09 | Las recompensas vencidas (`expires_at < now()`) no son visibles para el hijo y aparecen deshabilitadas para el padre. |
| RN-10 | Al desmarcar una tarea, se elimina el registro más reciente en `activity_log` que coincida con `child_id`, `parent_id` y `action = task.title`. |
| RN-11 | El nivel del hijo es una función de sus puntos: `nivel = max(1, floor(puntos / 100) + 1)`. |
| RN-12 | Solo el padre puede marcar tareas como completadas desde la vista de gestión. El hijo puede marcar las suyas desde su propia vista. Ambos pueden desmarcar. |

---

## 7. Modelo de Datos (Esquema de Base de Datos)

### Tabla: `parents`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único del padre |
| `first_name` | text | Nombre |
| `last_name` | text | Apellido |
| `email` | text (unique) | Correo electrónico |
| `password` | text | Contraseña (texto plano — pendiente hash) |
| `family_code` | text (unique) | Código familiar de 6 caracteres para vincular hijos |
| `created_at` | timestamptz | Fecha de registro |

### Tabla: `children`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único del hijo |
| `parent_id` | bigint (FK → parents.id) | Padre al que pertenece |
| `first_name` | text | Nombre |
| `last_name` | text | Apellido |
| `username` | text (unique) | Nombre de usuario para login |
| `pin` | text | PIN numérico para autenticación |
| `birth_date` | date | Fecha de nacimiento |
| `created_at` | timestamptz | Fecha de registro |

### Tabla: `tasks`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único de la tarea |
| `parent_id` | bigint (FK → parents.id) | Padre que creó la tarea |
| `child_id` | bigint (FK → children.id) | Hijo al que está asignada |
| `title` | text | Título de la tarea |
| `description` | text | Descripción opcional |
| `category` | text | `'academica'` o `'domestica'` |
| `points` | integer | Puntos que otorga al completarse |
| `status` | text | `'pending'` o `'completed'` |
| `due_date` | timestamptz | Fecha y hora límite (opcional) |
| `completed_at` | timestamptz | Timestamp de completado (null si pendiente) |
| `created_at` | timestamptz | Fecha de creación |

### Tabla: `rewards`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único de la recompensa |
| `parent_id` | bigint (FK → parents.id) | Padre que la creó |
| `title` | text | Nombre de la recompensa |
| `description` | text | Descripción opcional |
| `icon` | text | Emoji del icono |
| `points_cost` | integer | Puntos necesarios para canjearla |
| `child_id` | bigint (FK → children.id, nullable) | Hijo específico (NULL = todos) |
| `expires_at` | timestamptz (nullable) | Fecha de vencimiento |
| `created_at` | timestamptz | Fecha de creación |

> **Nota:** Las columnas `child_id` y `expires_at` se agregan mediante la migración `supabase_migration_rewards.sql`.

### Tabla: `reward_requests`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único de la solicitud |
| `reward_id` | bigint (FK → rewards.id, CASCADE) | Recompensa solicitada |
| `child_id` | bigint (FK → children.id, CASCADE) | Hijo que solicita |
| `parent_id` | bigint (FK → parents.id, CASCADE) | Padre que debe resolver |
| `status` | text | `'pending'`, `'approved'` o `'rejected'` |
| `requested_at` | timestamptz | Timestamp de solicitud |
| `resolved_at` | timestamptz (nullable) | Timestamp de aprobación/rechazo |

> **Nota:** Esta tabla se crea mediante la migración `supabase_migration_rewards.sql`.

### Tabla: `redemptions`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único del canje |
| `reward_id` | bigint (FK → rewards.id) | Recompensa canjeada |
| `child_id` | bigint (FK → children.id) | Hijo que realizó el canje |
| `points_spent` | integer | Puntos descontados |

### Tabla: `activity_log`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint (PK, identity) | Identificador único del registro |
| `parent_id` | bigint (FK → parents.id) | Padre relacionado |
| `child_id` | bigint (FK → children.id) | Hijo relacionado |
| `action` | text | Descripción de la acción (título de tarea o `"Canjeó: X"`) |
| `points` | integer | Puntos otorgados (positivo) o gastados (negativo) |
| `created_at` | timestamptz | Timestamp del registro |

### Relaciones (resumen para diagrama ER)
```
parents (1) ──< children (N)
parents (1) ──< tasks (N)
children (1) ──< tasks (N)
parents (1) ──< rewards (N)
children (0..1) ──< rewards (N)       [child_id nullable]
rewards (1) ──< reward_requests (N)
children (1) ──< reward_requests (N)
parents (1) ──< reward_requests (N)
rewards (1) ──< redemptions (N)
children (1) ──< redemptions (N)
parents (1) ──< activity_log (N)
children (1) ──< activity_log (N)
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
| `supabase.js` | `createClient` — cliente Supabase compartido |
| `authService.js` | `registerParent`, `loginParent`, `recoverPassword` |
| `childService.js` | `registerChild`, `loginChild`, `getTasksByChild`, `getRecentTasksByChild`, `getRedemptionsByChild`, `getRedemptionCount` |
| `dashboardService.js` | `getChildrenByParent`, `getChildPoints`, `getDashboardStats`, `getChildProgress`, `getActivityLog` |
| `taskService.js` | `getTasksByParent`, `createTask`, `completeTask`, `uncompleteTask` |
| `rewardService.js` | `getRewardsByParent`, `getRewardsForChild`, `createReward`, `deleteReward`, `requestReward`, `getChildPendingRequests`, `getPendingRequests`, `approveRequest`, `rejectRequest` |

### Gestión de sesión
- Sesión almacenada en `localStorage` como JSON serializado.
- `getUserSession()` — lee y parsea la sesión del localStorage.
- `saveUserSession(user)` — serializa y guarda el objeto de usuario.
- Objeto de sesión para padre: `{ role, id, email, firstName, lastName, familyCode }`
- Objeto de sesión para hijo: `{ role, id, username, firstName, lastName, parentId }`

---

## 9. Casos de Uso

### CU-01: Registro de padre
**Actor:** Padre/Madre  
**Precondición:** Sin sesión activa  
**Flujo principal:**
1. El padre accede a `/register-parent`.
2. Ingresa nombre, apellido, correo y contraseña.
3. El sistema valida que el correo no exista en `parents`.
4. Se genera un `family_code` único de 6 caracteres.
5. Se inserta el registro en `parents`.
6. El sistema guarda la sesión y redirige a `/parent-home`.

### CU-02: Registro de hijo
**Actor:** Hijo  
**Precondición:** El padre existe y tiene un código familiar  
**Flujo principal:**
1. El hijo accede a `/register-child`.
2. Ingresa código familiar, nombre, apellido, usuario, fecha de nacimiento y PIN.
3. El sistema busca el padre con ese `family_code`.
4. El sistema valida que el `username` no exista.
5. Se inserta el registro en `children` con `parent_id` del padre encontrado.
6. El sistema guarda la sesión y redirige a `/child-home`.

### CU-03: Crear tarea
**Actor:** Padre/Madre  
**Precondición:** Sesión activa como padre, al menos un hijo registrado  
**Flujo principal:**
1. El padre accede a `/parent-tasks` y pulsa "Agregar Nueva Tarea".
2. Completa el formulario (título, hijo, categoría, puntos; opcionalmente descripción y fecha límite).
3. El sistema inserta la tarea en `tasks` con `status = 'pending'`.
4. La tarea aparece en la columna de pendientes.

### CU-04: Completar tarea (desde vista del hijo)
**Actor:** Hijo  
**Precondición:** Sesión activa como hijo, tarea en estado pendiente  
**Flujo principal:**
1. El hijo accede a `/child-tasks`.
2. Pulsa "Completar" en una tarea pendiente.
3. El sistema actualiza `tasks.status = 'completed'` y registra `completed_at`.
4. El sistema inserta en `activity_log` con los puntos correspondientes.
5. Los puntos del hijo se actualizan en tiempo real en la UI.
6. Se muestra toast de confirmación con los puntos ganados.

**Flujo alternativo — desmarcar:**  
Si la tarea ya está completada, el hijo puede desmarcarla. El sistema revierte el estado y elimina el registro más reciente de `activity_log`.

### CU-05: Crear recompensa
**Actor:** Padre/Madre  
**Precondición:** Sesión activa como padre  
**Flujo principal:**
1. El padre accede a `/parent-rewards` y pulsa "+ Agregar Recompensa".
2. Completa el formulario (nombre, puntos, icono; opcionalmente descripción, fecha de vencimiento, hijo específico).
3. El sistema intenta insertar en `rewards` con todos los campos.
4. Si la migración no ha sido ejecutada (columnas faltantes), el sistema reintenta con solo los campos base.
5. La recompensa aparece en el catálogo.

### CU-06: Solicitar recompensa (hijo)
**Actor:** Hijo  
**Precondición:** Sesión activa como hijo, puntos suficientes, recompensa no solicitada previamente  
**Flujo principal:**
1. El hijo accede a `/child-rewards`.
2. Visualiza el catálogo con indicador de si puede costear cada recompensa.
3. Pulsa "Reclamar" en una recompensa asequible.
4. Se muestra modal de confirmación con costo y saldo resultante.
5. El hijo confirma; el sistema inserta en `reward_requests` con `status = 'pending'`.
6. El botón cambia a "Solicitud enviada" (estado local + BD).

### CU-07: Aprobar/rechazar solicitud de canje
**Actor:** Padre/Madre  
**Precondición:** Existe al menos una solicitud pendiente  
**Flujo principal (aprobar):**
1. El padre accede a `/parent-rewards`.
2. Ve el panel de "Solicitudes de Canje" con las pendientes.
3. Pulsa "Aprobar" en una solicitud.
4. El sistema recalcula los puntos del hijo (`getChildPoints`).
5. Si los puntos son insuficientes → error `INSUFFICIENT_POINTS` → toast de error.
6. Si los puntos son suficientes:
   - Actualiza `reward_requests.status = 'approved'`.
   - Inserta en `redemptions` con `points_spent`.
   - Inserta en `activity_log` con `points = -points_cost`.
7. La solicitud desaparece del panel. Se recarga la página.

**Flujo alternativo (rechazar):**  
El padre pulsa "Declinar". Previa confirmación, el sistema actualiza el estado a `'rejected'`.

---

## 10. Flujos de Actividad (descripción para diagramas)

### Flujo A: Ciclo completo de una tarea
```
[Padre crea tarea] → tarea en BD (status=pending)
  → [Hijo ve tarea en su lista]
  → [Hijo pulsa "Completar"]
  → Sistema actualiza status=completed + completed_at
  → Sistema inserta en activity_log (+points)
  → Puntos del hijo aumentan
  → [Padre ve tarea en columna "Completadas"]
  → [Padre puede desmarcar]
    → Sistema revierte status=pending
    → Sistema elimina activity_log más reciente
    → Puntos del hijo disminuyen
```

### Flujo B: Ciclo completo de una recompensa
```
[Padre crea recompensa] → recompensa en BD
  → [Hijo ve recompensa en catálogo]
  → [Hijo verifica puntos suficientes]
  → Si puntos suficientes → [Hijo pulsa "Reclamar"]
    → Modal de confirmación
    → [Hijo confirma]
    → Sistema inserta reward_request (status=pending)
    → [Padre ve solicitud en panel]
    → [Padre aprueba]
      → Sistema valida puntos (doble check)
      → Sistema inserta en redemptions
      → Sistema inserta en activity_log (puntos negativos)
      → Solicitud desaparece del panel
      → [Hijo ve historial de canjes actualizado]
    → [Padre rechaza]
      → Sistema marca status=rejected
      → Solicitud desaparece del panel
```

### Flujo C: Cálculo de puntos del hijo
```
Cada consulta de puntos:
  1. SELECT SUM(points) FROM tasks WHERE child_id=X AND status='completed'
  2. SELECT SUM(points_spent) FROM redemptions WHERE child_id=X
  3. puntos_disponibles = resultado(1) - resultado(2)
```

---

## 11. Flujos de Secuencia (descripción para diagramas)

### Secuencia S-01: Login del hijo
```
ChildLogin → [ingresa usuario + PIN]
  → loginChild(username, pin)
  → supabase: SELECT * FROM children WHERE username=X
  → valida PIN
  → saveUserSession({ role:'child', id, username, firstName, lastName, parentId })
  → navigate('/child-home')
```

### Secuencia S-02: Carga del dashboard del hijo (ChildHome)
```
ChildHome.loadDashboard()
  → Promise.all([
      getChildPoints(childId)         → tasks + redemptions queries
      getChildProgress(childId)       → tasks query
      getRecentTasksByChild(childId)  → tasks query (limit 5)
      getRedemptionCount(childId)     → redemptions count query
    ])
  → setPoints, setProgress, setRecentTasks, setRedemptionCount
  → getRewardsForChild(parentId, childId)  [bloque independiente]
    → supabase: rewards WHERE parent_id=X AND (child_id=Y OR child_id IS NULL)
    → si error → fallback: rewards WHERE parent_id=X
  → setAffordableRewards (filtradas por pts <= puntos)
  → setLoading(false)
```

### Secuencia S-03: Completar tarea (hijo)
```
ChildTasks.handleComplete(task)
  → setCompleting(task.id)  [deshabilita botón]
  → completeTask(task)
    → supabase: UPDATE tasks SET status='completed', completed_at=now() WHERE id=X
    → supabase: INSERT INTO activity_log (parent_id, child_id, action, points)
  → setTasks(prev => actualiza tarea localmente)
  → setPoints(prev => prev + task.points)
  → setNotification({ message, points })
  → setTimeout → setNotification(null)
  → setCompleting(null)  [reactiva botón]
```

### Secuencia S-04: Aprobar solicitud de canje (padre)
```
ParentRewards.handleApprove(request)
  → approveRequest(requestId, childId, pointsCost, parentId, rewardTitle, rewardId)
    → getChildPoints(childId)
      → SELECT SUM(points) FROM tasks ... - SELECT SUM(points_spent) FROM redemptions ...
    → si currentPoints < pointsCost → throw 'INSUFFICIENT_POINTS'
    → UPDATE reward_requests SET status='approved', resolved_at=now() WHERE id=X
    → INSERT INTO redemptions (reward_id, child_id, points_spent)
    → INSERT INTO activity_log (parent_id, child_id, action, points=-pointsCost)
  → showToast('Solicitud aprobada')
  → loadData()  [recarga todo]
```

### Secuencia S-05: Crear recompensa con fallback
```
ParentRewards.handleCreateReward()
  → createReward({ parentId, title, pointsCost, icon, expiresAt, description, childId })
    → supabase: INSERT INTO rewards (parent_id, title, description, icon, points_cost, expires_at, child_id)
    → si error (columna no existe):
      → supabase: INSERT INTO rewards (parent_id, title, description, icon, points_cost)
      → si error → throw
    → retorna reward insertado
  → showToast('Recompensa creada!')
  → resetForm, setShowForm(false)
  → loadData()
```

---

## 12. Módulos Implementados — Estado Actual

| Módulo | Vista Padre | Vista Hijo | Estado |
|---|---|---|---|
| Autenticación | Login + Registro + Recuperación | Login + Registro | ✅ Completo |
| Dashboard | Estadísticas, hijos, gráfico, actividad | Puntos, progreso, tareas recientes, recompensas al alcance | ✅ Completo |
| Tareas | Crear, completar, desmarcar, filtros | Ver, completar, desmarcar | ✅ Completo |
| Recompensas | Crear, eliminar, ver solicitudes, aprobar/rechazar | Ver catálogo, solicitar, ver historial | ✅ Completo |
| Perfil | Ver datos, cerrar sesión | Ver datos, cerrar sesión | ✅ Completo |
| Navegación | Navbar con rutas padre | ChildNavbar con rutas hijo | ✅ Completo |

---

## 13. Cambios e Implementaciones — Fase 2.1

### 13.1 Sistema de Recompensas (feature nueva)

**Descripción general:** Se implementó un ciclo completo de recompensas: creación por el padre → solicitud por el hijo → aprobación/rechazo por el padre → descuento automático de puntos.

**Archivos creados/modificados:**
- `src/services/rewardService.js` — Servicio completo de recompensas
- `src/pages/ParentRewards.jsx` — Vista completa de gestión de recompensas para el padre
- `src/pages/ChildRewards.jsx` — Vista de catálogo y solicitudes para el hijo
- `src/pages/ChildHome.jsx` — Sección "Recompensas a tu Alcance" integrada
- `notes/supabase_migration_rewards.sql` — Migración para columnas y tabla nuevas

**Funciones nuevas en `rewardService.js`:**
- `getRewardsByParent(parentId)` — todas las recompensas de un padre
- `getRewardsForChild(parentId, childId)` — recompensas visibles para un hijo (propias + globales), con fallback
- `createReward(rewardData)` — crear recompensa con fallback para migración pendiente
- `deleteReward(rewardId)` — eliminar recompensa
- `requestReward(rewardId, childId, parentId)` — solicitar canje
- `getChildPendingRequests(childId)` — IDs de recompensas ya solicitadas
- `getPendingRequests(parentId)` — solicitudes pendientes del padre con join a `children` y `rewards`
- `approveRequest(requestId, childId, pointsCost, parentId, rewardTitle, rewardId)` — aprobación con validación de puntos y registro de canje
- `rejectRequest(requestId)` — rechazo de solicitud

### 13.2 Migración de base de datos requerida

Ejecutar en Supabase SQL Editor (`notes/supabase_migration_rewards.sql`):
```sql
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS child_id bigint REFERENCES children(id) ON DELETE CASCADE;
CREATE TABLE IF NOT EXISTS reward_requests (
  id bigint generated always as identity primary key,
  reward_id bigint NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id bigint NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id bigint NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_reward_requests_parent ON reward_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_reward_requests_child ON reward_requests(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_requests_status ON reward_requests(status);
CREATE INDEX IF NOT EXISTS idx_rewards_child ON rewards(child_id);
```

### 13.3 Correcciones de regresiones

**Problema 1 — Dashboard del hijo completamente vacío**
- Causa: `getRewardsForChild` (que usaba `.or('child_id...')`) estaba dentro del `Promise.all` principal de `ChildHome.loadDashboard`. Cuando la columna `child_id` no existía, toda la promesa fallaba → puntos=0, tareas=[], progreso=0.
- Solución: Se extrajo `getRewardsForChild` a un bloque `try/catch` independiente, posterior al `Promise.all` de datos core.

**Problema 2 — Página de recompensas del hijo sin puntos ni catálogo**
- Causa: En `ChildRewards.loadData`, `getChildPoints` estaba en `Promise.all` junto con `getRedemptionsByChild`. Esta última función hace un join con `rewards` (`select("*, rewards(title, icon, points_cost)")`), que puede fallar por problemas de RLS/caché. Cuando fallaba, el Promise.all rechazaba y `setPoints(pts)` nunca se ejecutaba.
- Solución: Se reescribió `loadData` para que cada uno de los 4 bloques de datos (puntos, catálogo de recompensas, historial de canjes, solicitudes pendientes) tenga su propio `try/catch` completamente independiente, sin ningún `Promise.all` compartido.

**Problema 3 — Padre no podía crear recompensas**
- Causa: `createReward` intentaba insertar los campos `child_id` y `expires_at` en `rewards`. Estas columnas no existían en la BD (migración no ejecutada) → error de Supabase.
- Solución: Se implementó mecanismo de fallback: si el insert completo falla, se reintenta con solo los campos base (`parent_id`, `title`, `description`, `icon`, `points_cost`).

**Problema 4 — Error `column redemptions.created_at does not exist`**
- Causa: `getRedemptionsByChild` en `childService.js` usaba `.order("created_at", { ascending: false })` pero la tabla `redemptions` no tiene columna `created_at`.
- Solución: Se cambió el orden a `.order("id", { ascending: false })`.

---

## 14. Pendientes Técnicos

| # | Pendiente | Prioridad |
|---|---|---|
| P-01 | Ejecutar la migración SQL en Supabase para habilitar `child_id`, `expires_at` y `reward_requests` | Alta |
| P-02 | Hashear contraseñas (actualmente en texto plano en `parents.password`) | Alta |
| P-03 | Mover las credenciales de Supabase a variables de entorno (`.env`) | Alta |
| P-04 | Implementar RLS (Row Level Security) en Supabase para producción | Media |
| P-05 | La tabla `redemptions` no tiene columna `created_at` — considerar agregarla para historial ordenado por fecha | Baja |

---

## 15. Estructura de Archivos del Proyecto

```
domus/
├── src/
│   ├── App.jsx                      # Enrutador principal, NavbarRouter
│   ├── components/
│   │   ├── Navbar.jsx               # Navegación del padre
│   │   ├── ChildNavbar.jsx          # Navegación del hijo
│   │   └── ProtectedRoute.jsx       # HOC de rutas protegidas por rol
│   ├── pages/
│   │   ├── LoginParent.jsx
│   │   ├── RegisterParent.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── LoginChild.jsx
│   │   ├── RegisterChild.jsx
│   │   ├── ParentHome.jsx           # Dashboard padre
│   │   ├── ParentTasks.jsx          # Gestión de tareas
│   │   ├── ParentRewards.jsx        # Catálogo + solicitudes
│   │   ├── ParentProfile.jsx
│   │   ├── ChildHome.jsx            # Dashboard hijo
│   │   ├── ChildTasks.jsx           # Mis tareas
│   │   ├── ChildRewards.jsx         # Catálogo + solicitar
│   │   └── ChildProfile.jsx
│   ├── services/
│   │   ├── supabase.js              # Cliente Supabase
│   │   ├── authService.js           # Auth del padre
│   │   ├── childService.js          # Operaciones del hijo
│   │   ├── dashboardService.js      # Stats y puntos
│   │   ├── taskService.js           # CRUD de tareas
│   │   └── rewardService.js         # Sistema de recompensas
│   ├── utils/
│   │   ├── auth.js                  # getUserSession, saveUserSession
│   │   └── helpers.js               # calculateAge y utilidades
│   └── styles/
│       └── dashboard.css            # Estilos globales
└── notes/
    └── supabase_migration_rewards.sql
```
