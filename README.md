# Domus — Sistema de Guía Parental

Domus es una aplicación web que ayuda a las familias a asignar responsabilidades académicas y domésticas a los hijos y a reconocer su cumplimiento. Tiene dos roles, **padre/madre** e **hijo**, cada uno con su propio panel, y premia las tareas cumplidas con puntos canjeables por recompensas que define la familia.

Aplicación desplegada: https://domus-7bv7.vercel.app

## Proyecto de re-arquitectura

Este repositorio es el proyecto integrador de la asignatura **Arquitectura de Sistemas**. El objetivo es re-arquitecturar un módulo existente de Domus sin cambiar su funcionalidad.

**Módulo MVP: Gestión de Tareas y Gamificación.** Cubre el ciclo de vida de una tarea (creación, asignación, ejecución con evidencia fotográfica, verificación por el padre y cierre) y el sistema de puntos, niveles e insignias que se deriva de ese ciclo.

### Problemas arquitectónicos identificados

| # | Problema | Atributo de calidad afectado |
|---|---|---|
| P1 | La lógica del módulo está dispersa y duplicada entre servicios y vistas (por ejemplo, la fórmula de nivel se calcula en varias pantallas y cada una evalúa las insignias con datos distintos). | Mantenibilidad |
| P2 | Las operaciones que modifican varias tablas (completar, aprobar, revertir o eliminar una tarea y aprobar un canje) se hacen con llamadas independientes, sin transacción. | Confiabilidad |
| P3 | No hay autorización del lado del servidor: la base de datos no puede saber quién hace cada petición ni restringir el acceso por familia. | Seguridad |
| P4 | Reglas de negocio críticas, como qué cuenta como tarea completada o si alcanzan los puntos para un canje, se deciden en el navegador. | Seguridad |

La arquitectura objetivo, las decisiones de refactorización y los escenarios de calidad están en **[docs/arquitectura.md](docs/arquitectura.md)**.

### Arquitectura objetivo

Arquitectura en capas: el navegador solo habla con una API REST propia, y solo la capa de datos accede a Supabase.

```
React (vistas + apiClient)  →  api (rutas)  →  domain (reglas)  →  data (acceso)  →  Supabase
```

## Estructura del repositorio

```
api/
  index.js            Punto de entrada de la API en Vercel (función serverless)
docs/
  arquitectura.md     Arquitectura objetivo, componentes y escenarios de calidad
  adr/                Decisiones de arquitectura (un archivo por decisión)
  diagramas/          Diagramas C4 (archivo editable y exportado)
src/
  frontend/           Aplicación React (capa de presentación)
    services/
      apiClient.js    Único punto del navegador que llama a la API REST
  backend/
    api/              App Express, rutas y servidor local
    domain/           Reglas de negocio: gamification.js, taskStateMachine.js
    data/             Acceso a datos: supabaseAdmin y repositorios
supabase/
  migrations/         Cambios a la base de datos (funciones transaccionales)
  tests/              Pruebas SQL de los escenarios de calidad
  functions/          Edge Function de envío de correos
tests/
  unit/               Pruebas unitarias
  integration/        Pruebas de integración de la API
```

## Tecnologías

- **Frontend:** React 19 + Vite 7, React Router 7
- **API REST:** Node.js + Express 5, desplegada como función serverless en Vercel
- **Datos:** Supabase (PostgreSQL, Storage y Edge Functions)
- **Pruebas:** Vitest y Supertest
- **Otros:** bcryptjs, ESLint

## Ejecución local

**Requisitos:** Node.js 20.19 o superior y npm.

1. Clonar el repositorio e instalar dependencias:
   ```bash
   git clone https://github.com/zendiego10/domus.git
   cd domus
   npm install
   ```
2. Crear un archivo `.env.local` en la raíz con las credenciales del proyecto de Supabase (las comparte el equipo; nunca se suben al repositorio):
   ```
   # Las usa la aplicación React (son públicas: llegan al navegador)
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...

   # Las usa solo la API (la llave de servicio es secreta; nunca lleva el prefijo VITE_)
   SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. Iniciar la API y la aplicación, cada una en su propia terminal:
   ```bash
   npm run api    # API REST en http://localhost:3001
   npm run dev    # Aplicación en http://localhost:5173
   ```
   En desarrollo, Vite redirige las peticiones a `/api` hacia la API local.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Corre todas las pruebas unitarias y de integración |
| `npm run test:watch` | Corre las pruebas cada vez que se guarda un cambio |
| `npm run build` | Genera la versión de producción |
| `npm run preview` | Sirve localmente la versión de producción |
| `npm run lint` | Revisa el código con ESLint |

## Pruebas

```bash
npm test
```

| Archivo | Qué comprueba |
|---|---|
| `tests/unit/gamification.test.js` | Puntos, nivel con tope, racha por días seguidos e insignias |
| `tests/unit/taskStateMachine.test.js` | Qué acción puede hacer cada rol según el estado de la tarea |
| `tests/unit/taskRepository.test.js` | Llamada a la función transaccional `complete_task` y traducción de sus errores |
| `tests/integration/progress.test.js` | Endpoint de progreso de punta a punta (api → domain), con datos simulados |

La prueba del escenario de confiabilidad está en `supabase/tests/complete_task_atomicidad.sql`: se ejecuta en el SQL Editor de Supabase, fuerza una falla en la segunda escritura de `complete_task` y comprueba que la tarea no queda a medias. Al final deshace todos sus cambios.

## API REST

URL base: `/api` (local: http://localhost:3001/api · producción: https://domus-7bv7.vercel.app/api)

| Método | Ruta | Descripción | Respuestas |
|---|---|---|---|
| `GET` | `/api/health` | Comprueba que la API está en línea | `200` |
| `GET` | `/api/children/:id/progress` | Puntos, nivel, racha e insignias del hijo, calculados en el servidor | `200` · `400` id inválido · `404` hijo no existe · `500` error interno |

Ejemplo de respuesta de `GET /api/children/4/progress`:

```json
{
  "childId": 4,
  "points": 650,
  "level": 7,
  "pointsInLevel": 50,
  "pointsToNextLevel": 50,
  "isMaxLevel": false,
  "streak": 0,
  "completedTasks": 13,
  "totalTasks": 13,
  "redemptions": 1,
  "badges": [
    { "id": "first_task", "emoji": "🌟", "name": "Primera tarea", "unlocked": true }
  ]
}
```

Los endpoints de tareas y canjes, y la autenticación con token JWT, se agregan en la entrega final (semana 15).

## Estado de implementación

| Decisión | Estado | Qué hay en el código |
|---|---|---|
| [ADR-001](docs/adr/ADR-001-api-rest-en-capas.md) · API REST en capas | Iniciada | Capas `api` / `domain` / `data`, App Express, endpoint de progreso, `taskStateMachine.js` y `apiClient.js`. Las vistas del hijo ya consumen la API |
| [ADR-002](docs/adr/ADR-002-autenticacion-en-servidor.md) · Autenticación en el servidor | Planeada (semana 15) | — |
| [ADR-003](docs/adr/ADR-003-operaciones-transaccionales.md) · Operaciones transaccionales | Iniciada | Columna `task_id` en `activity_log` y función `complete_task` en `supabase/migrations/001_complete_task.sql`, llamada desde `TaskRepository` |
| [ADR-004](docs/adr/ADR-004-modulo-unico-gamificacion.md) · Módulo único de gamificación | Implementada (vistas del hijo) | `gamification.js` con pruebas unitarias; `ChildHome`, `ChildTasks` y `ChildProfile` muestran el progreso que calcula la API. `ParentHome` se migra en la semana 15 |

## Equipo

- Diego Robles Bertel
- Sara Sánchez Restrepo
- Juliana Agudelo Ramírez

Asignatura: Arquitectura de Sistemas, prof. Fernando de Jesús Higuita.