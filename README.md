# Domus! — Sistema de Guía Parental

Aplicación web para la gestión de tareas y recompensas en el hogar, diseñada para motivar a los hijos mediante un sistema de puntos gamificado.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19.2 + Vite 7.3 |
| Enrutamiento | React Router DOM 7.13 |
| Backend / Base de datos | Supabase (PostgreSQL) |
| Estilos | CSS vanilla con media queries |
| Despliegue | Vercel |

---

## Estructura del Proyecto

```
domus/
├── public/
│   └── logo domus.svg
├── src/
│   ├── components/
│   │   ├── Button.jsx           # Botón reutilizable
│   │   ├── ChildNavbar.jsx      # Navbar del hijo (con hamburguesa)
│   │   ├── FormContainer.jsx    # Contenedor de formularios
│   │   ├── InputField.jsx       # Campo de input reutilizable
│   │   ├── Navbar.jsx           # Navbar del padre (con hamburguesa desde Fase 2)
│   │   └── ProtectedRoute.jsx   # Guard de rutas por rol
│   ├── pages/
│   │   ├── LoginParent.jsx      # Login del padre/madre
│   │   ├── LoginChild.jsx       # Login del hijo
│   │   ├── RegisterParent.jsx   # Registro del padre/madre
│   │   ├── RegisterChild.jsx    # Registro del hijo (vinculación familiar)
│   │   ├── ForgotPassword.jsx   # Recuperación de contraseña
│   │   ├── ParentHome.jsx       # Dashboard principal del padre
│   │   ├── ParentTasks.jsx      # Gestión de tareas del padre
│   │   ├── ParentRewards.jsx    # Catálogo de recompensas del padre
│   │   ├── ChildHome.jsx        # Dashboard del hijo
│   │   ├── ChildTasks.jsx       # Vista de tareas del hijo
│   │   └── ChildRewards.jsx     # Canje de recompensas del hijo
│   ├── services/
│   │   ├── supabase.js          # Cliente Supabase
│   │   ├── parentService.js     # Operaciones de cuenta del padre
│   │   ├── dashboardService.js  # Estadísticas y progreso
│   │   ├── taskService.js       # CRUD de tareas
│   │   ├── rewardService.js     # CRUD de recompensas y canjes
│   │   └── childService.js      # Datos del hijo (tareas recientes, canjes)
│   ├── styles/
│   │   ├── dashboard.css        # Estilos principales del dashboard
│   │   └── navbar.css           # Estilos de ambas navbars
│   ├── utils/
│   │   ├── auth.js              # Manejo de sesión (localStorage)
│   │   ├── helpers.js           # Helpers generales (calcularEdad, etc.)
│   │   └── validators.js        # Validadores de formularios
│   ├── App.jsx                  # Enrutamiento y NavbarRouter
│   └── main.jsx                 # Punto de entrada
├── index.html
├── package.json
└── vite.config.js
```

---

## Esquema de Base de Datos (Supabase)

### Tabla `parents`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| email | text | Correo electrónico |
| password | text | Contraseña (texto plano — pendiente migrar a hash) |
| first_name | text | Nombre |
| last_name | text | Apellido |
| family_code | text | Código único para vincular hijos |
| created_at | timestamptz | Fecha de creación |

### Tabla `children`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| parent_id | uuid (FK → parents) | Padre vinculado |
| username | text | Nombre de usuario |
| password | text | Contraseña (texto plano — pendiente migrar) |
| first_name | text | Nombre |
| last_name | text | Apellido |
| birth_date | date | Fecha de nacimiento |
| created_at | timestamptz | Fecha de creación |

### Tabla `tasks`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| parent_id | uuid (FK → parents) | Padre que creó la tarea |
| child_id | uuid (FK → children) | Hijo asignado |
| title | text | Título de la tarea |
| description | text | Descripción detallada |
| category | text | `academica` o `domestica` |
| points | integer | Puntos que otorga al completarla |
| status | text | `pending` o `completed` |
| due_date | **timestamptz** | Fecha y hora límite (migrada en Fase 2.1) |
| completed_at | timestamptz | Cuándo fue completada |
| created_at | timestamptz | Fecha de creación |

### Tabla `rewards`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| parent_id | uuid (FK → parents) | Padre que creó la recompensa |
| title | text | Nombre de la recompensa |
| description | text | Descripción |
| icon | text | Emoji representativo |
| points_cost | integer | Costo en puntos |
| created_at | timestamptz | Fecha de creación |

### Tabla `redemptions`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| reward_id | uuid (FK → rewards) | Recompensa canjeada |
| child_id | uuid (FK → children) | Hijo que canjeó |
| parent_id | uuid (FK → parents) | Padre de referencia |
| points_spent | integer | Puntos gastados |
| created_at | timestamptz | Fecha del canje |

### Tabla `activity_log`
| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador único |
| parent_id | uuid (FK → parents) | Padre vinculado |
| child_id | uuid (FK → children) | Hijo que realizó la acción |
| action | text | Descripción de la acción (título de la tarea) |
| points | integer | Puntos ganados |
| created_at | timestamptz | Fecha del evento |

---

## Rutas de la Aplicación

| Ruta | Componente | Acceso |
|---|---|---|
| `/` | → redirige a `/login-parent` | Público |
| `/login-parent` | LoginParent | Público |
| `/register-parent` | RegisterParent | Público |
| `/forgot-password` | ForgotPassword | Público |
| `/login-child` | LoginChild | Público |
| `/register-child` | RegisterChild | Público |
| `/parent-home` | ParentHome | Protegida (rol: padre) |
| `/parent-tasks` | ParentTasks | Protegida (rol: padre) |
| `/parent-rewards` | ParentRewards | Protegida (rol: padre) |
| `/child-home` | ChildHome | Protegida (rol: hijo) |
| `/child-tasks` | ChildTasks | Protegida (rol: hijo) |
| `/child-rewards` | ChildRewards | Protegida (rol: hijo) |

---

## Funcionalidades Implementadas

### Autenticación y Sesión
- Registro de padres con código familiar único autogenerado
- Registro de hijos mediante código familiar del padre
- Login separado para padres e hijos
- Recuperación de contraseña (UI implementada, lógica pendiente de Supabase Auth)
- Sesión persistente en `localStorage`
- Rutas protegidas por rol con `ProtectedRoute`
- Navbar adaptable: muestra `Navbar` en rutas `/parent-*` y `ChildNavbar` en rutas `/child-*`

---

### Panel del Padre (`/parent-home`)
- Cuatro tarjetas de resumen: Puntos Totales, Tareas Completadas, Tareas Pendientes, Número de Hijos
- Tarjetas individuales por hijo con avatar de iniciales, edad, nivel calculado, puntos y barra de progreso de tareas
- Gráfica de barras con la distribución de puntos entre hijos
- Registro de actividad reciente con avatar del hijo, tarea completada, puntos ganados y hora

---

### Gestión de Tareas del Padre (`/parent-tasks`)
- Formulario de creación de tareas con:
  - Título (requerido)
  - Selección de hijo (requerido)
  - Categoría: Académica / Doméstica (requerido)
  - Puntos (requerido)
  - **Fecha y hora límite con `datetime-local`** (opcional, agregado en Fase 2.1)
  - Descripción (opcional)
- Filtros por tipo de categoría (Todas / Académicas / Domésticas) y por hijo
- Tarjetas de estadísticas: Total, Pendientes, Completadas
- Columnas separadas para tareas pendientes y completadas
- Avatar de color por hijo en cada tarjeta
- Indicador de deadline en tareas pendientes
- **Indicador de entrega "A tiempo" / "Entregada tarde"** en tareas completadas (Fase 2.1)
- **Desmarcar tareas completadas** para devolverlas a pendiente (Fase 2.1)

---

### Catálogo de Recompensas del Padre (`/parent-rewards`)
- Lista de recompensas creadas por el padre con icono, título, descripción y costo en puntos
- Filtro por hijo para ver quién puede canjear cada recompensa
- Tarjetas de saldo por hijo con puntos actuales
- Indicador de hijos elegibles para cada recompensa
- Canje de recompensas por hijo (con selección si hay más de uno)

---

### Dashboard del Hijo (`/child-home`)
- Saludo personalizado con badge de nivel calculado según puntos acumulados
- Cuatro tarjetas: Mis Puntos, Tareas Completadas, Tareas Pendientes, Recompensas Canjeadas
- Barra de progreso general de tareas
- Últimas 5 tareas recientes con estado, badge de categoría y **countdown del deadline** (Fase 2.1)
- Sección "Recompensas a tu Alcance" con las recompensas que puede costear
- Botones de acceso rápido a las secciones de tareas y recompensas

---

### Tareas del Hijo (`/child-tasks`)
- Filtros: Pendientes / Completadas con conteo
- Tarjetas con título en negrita, descripción en texto normal y badge de categoría
- **Countdown dinámico del deadline** en tareas pendientes: "Vence en X días / mañana / en X horas / muy pronto / Vencida" con colores indicativos (Fase 2.1)
- Botón "Completar" por tarea con actualización optimista del estado y los puntos
- **Desmarcar tareas completadas** para devolverlas a pendiente con resta de puntos (Fase 2.1)
- Guardas de doble clic en acciones de completar y desmarcar
- Toast de notificación con puntos ganados o restados
- Contador de puntos en tiempo real en el encabezado

---

### Recompensas del Hijo (`/child-rewards`)
- Hero de puntos disponibles
- Catálogo completo de recompensas de la familia con indicador "Te faltan X pts" si no puede costear
- Botón de canje deshabilitado si no hay puntos suficientes
- Actualización optimista al canjear: descuenta puntos y agrega al historial sin recargar
- Historial de canjes con fecha, icono y puntos gastados
- Toast de confirmación al canjear

---

### Navbar del Padre — Responsive (Fase 2.1)
- En escritorio: logo a la izquierda, tabs centrados, avatar a la derecha
- En móvil: hamburguesa a la izquierda, logo centrado, avatar a la derecha (grid 3 columnas)
- Menú hamburguesa con animación de 3 barras → X al abrir
- Menú móvil desplegable con todos los tabs del padre
- Overlay que cierra el menú al hacer clic fuera
- Se cierra automáticamente al navegar a otra ruta

### Navbar del Hijo — Responsive
- Misma estructura responsive que el padre (implementada desde Fase 2.0)
- Tabs: Inicio / Mis Tareas / Recompensas

---

## Sistema de Puntos

Los puntos no se almacenan en un campo fijo. Se calculan dinámicamente:

```
Puntos del hijo = Σ puntos de tareas completadas − Σ puntos gastados en canjes
```

Esto garantiza que al desmarcar una tarea completada, los puntos se ajustan automáticamente sin necesidad de actualizar un campo separado.

---

## Sistema de Niveles

El nivel del hijo se calcula en el frontend:

```js
nivel = Math.max(1, Math.floor(puntos / 100) + 1)
```

Cada 100 puntos acumulados sube un nivel. El tope es nivel 10 a partir de 1000 puntos.

---

## Historial de Fases

### Fase 1 — Base de la Aplicación
- Estructura del proyecto con React + Vite + Supabase
- Autenticación básica para padres e hijos
- Registro y vinculación familiar por código
- Dashboard del padre con estadísticas, hijos, gráfica y actividad reciente
- Gestión de tareas básica (sin deadline, sin desmarcar)
- Catálogo de recompensas para padres e hijos
- Sistema de canje de recompensas con descuento de puntos

### Fase 2.0 — Perfil del Hijo
- Dashboard completo del hijo (`/child-home`) con nivel, progreso y tareas recientes
- Vista de tareas del hijo (`/child-tasks`) con filtros y botón "Completar"
- Vista de recompensas del hijo (`/child-rewards`) con historial de canjes
- Navbar responsive para el hijo (`ChildNavbar`) con hamburguesa
- Toasts de notificación en acciones del hijo

### Fase 2.1 — Correcciones y Nuevas Funcionalidades (14 abril 2026)

#### Corrección de tipografía en tarjetas de tareas del hijo
- Cambio de `<div className="task-title">` a `<h3>` y de `<div className="task-desc">` a `<p>` en `ChildTasks.jsx` y `ChildHome.jsx`
- Los elementos heredan los estilos de `.task-content h3` (15px, negrita) y `.task-content p` (13px, gris) que ya usaban las tarjetas del padre
- Ajuste de `margin-bottom` y `line-height` en `.task-content p` para mejor espaciado con los badges

#### Campo de fecha y hora límite en tareas del padre
- Migración de la columna `due_date` de tipo `date` a `timestamptz` en Supabase para soportar hora específica
- Nuevo campo `datetime-local` con label "Fecha y hora límite (opcional)" en el formulario de creación
- El deadline se pasa a `createTask()` como ISO string completo
- Las tareas pendientes del padre muestran la fecha y hora formateada con `formatDateTime()`
- Las tareas completadas del padre muestran un badge "A tiempo" (verde) o "Entregada tarde" (rojo) comparando `completed_at` vs `due_date`

#### Countdown dinámico de deadline para el hijo
- Nueva función `getTimeRemaining(dueDateStr)` en `ChildTasks.jsx` y `ChildHome.jsx`
- Muestra: "Vence en X días" (normal) / "Vence mañana" (ámbar) / "Vence en X horas" (ámbar) / "Vence muy pronto" (rojo) / "Vencida" (rojo)
- Clases CSS: `.task-due-soon` (ámbar) y `.task-overdue` (rojo)

#### Navbar del padre responsive con hamburguesa
- Reescritura de `Navbar.jsx` con estado `mobileOpen`, botón hamburguesa, overlay y menú desplegable
- Clases CSS añadidas: `.parent-hamburger`, `.parent-hamburger-bar`, `.parent-mobile-overlay`, `.parent-mobile-menu`
- En móvil: layout de 3 columnas (`40px 1fr 40px`) — hamburguesa | logo | avatar
- Los tabs `.parent-navbar-tabs` y el subtítulo `.navbar-subtitle` se ocultan en pantallas ≤ 768px

#### Layout móvil de ParentTasks
- Media query a `max-width: 768px` en `dashboard.css`:
  - `.dashboard-header` apila elementos en columna
  - `.dashboard-title` reducido a 22px
  - `.dashboard-subtitle` reducido a 13px
  - `.btn-add-task` ocupa el ancho completo

#### Desmarcar tareas completadas
- Nueva función `uncompleteTask(task)` en `taskService.js`:
  - Actualiza `status` a `"pending"` y `completed_at` a `null` en la BD
  - Busca y elimina la entrada más reciente del `activity_log` que coincida con el hijo, padre y título de la tarea
- En `ParentTasks.jsx`: el checkmark verde de tareas completadas es ahora un botón clickeable que llama a `handleUncomplete()`
- En `ChildTasks.jsx`: el checkmark verde es clickeable con actualización optimista (revierte estado, resta puntos, muestra toast con puntos negativos)

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Vista previa del build
npm run preview
```

---

## Notas de Seguridad Pendientes

> Estas mejoras están identificadas pero no implementadas aún. No desplegar en producción sin resolverlas.

- Las contraseñas se almacenan en texto plano. Migrar a Supabase Auth con hashing bcrypt.
- Las credenciales de Supabase están hardcodeadas en `src/services/supabase.js`. Mover a variables de entorno `.env`.
- No hay validación del lado del servidor. Las políticas RLS de Supabase deben reforzarse.

---

## Funcionalidades Diferidas (Fases Futuras)

### Verificación por Foto (Fase 3+)
Permite que el hijo adjunte una foto como evidencia de tarea completada, y el padre la apruebe o rechace.

Requiere:
- Bucket `task-photos` en Supabase Storage con políticas RLS
- Nuevo status `pending_review` entre `pending` y `completed`
- UI de upload con camera API en móvil
- Workflow de aprobación/rechazo del padre
- Columna `photo_url` en la tabla `tasks`

### Notificaciones Push
- Alertas al padre cuando el hijo completa una tarea
- Recordatorios al hijo cuando se acerca el deadline de una tarea

### Perfil y Configuración
- Cambio de contraseña
- Editar datos del perfil
- Gestión del código familiar
