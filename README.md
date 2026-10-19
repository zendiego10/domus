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

## Estructura del repositorio

```
docs/
  arquitectura.md     Arquitectura objetivo, componentes y escenarios de calidad
  adr/                Decisiones de arquitectura (un archivo por decisión)
  diagramas/          Diagramas C4 (archivo editable y exportado)
src/
  frontend/           Aplicación React (capa de presentación)
  backend/
    api/              Endpoints REST
    domain/           Reglas de negocio del módulo
    data/             Acceso a datos
tests/
  unit/               Pruebas unitarias
  integration/        Pruebas de integración
```

## Tecnologías

React 19 + Vite 7, React Router 7, Supabase (PostgreSQL, Storage y Edge Functions), bcryptjs, ESLint y despliegue en Vercel.

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
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
3. Iniciar el servidor de desarrollo y abrir http://localhost:5173:
   ```bash
   npm run dev
   ```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera la versión de producción |
| `npm run preview` | Sirve localmente la versión de producción |
| `npm run lint` | Revisa el código con ESLint |

## Equipo

- Diego Robles Bertel
- Sara Sánchez Restrepo
- Juliana Agudelo Ramírez

Asignatura: Arquitectura de Sistemas, prof. Fernando de Jesús Higuita.