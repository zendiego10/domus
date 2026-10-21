# ADR-002: Autenticación en el servidor con JWT y Row Level Security

- **Estado:** Aceptada
- **Fecha:** 2026-10-20
- **Implementación:** Planeada para la semana 15

## Contexto y problema

Resuelve el problema **P3: no hay autorización del lado del servidor**, identificado en la semana 3.

Hoy la base de datos no tiene forma de saber quién está haciendo cada petición. El proyecto no contiene **ningún script SQL** que active Row Level Security ni que defina políticas de acceso: la carpeta `supabase/` solo tiene la Edge Function de recuperación de contraseña. Eso significa que la clave pública (`VITE_SUPABASE_ANON_KEY`), que viaja al navegador en cada carga de la aplicación, da acceso de lectura y escritura a las tablas del módulo.

El inicio de sesión agrava el problema porque también ocurre en el cliente:

- **`loginChild()`** (`src/frontend/services/childService.js`, línea 43) ejecuta `select("*")` sobre la tabla `children` filtrando solo por `username`, y recibe en el navegador **la fila completa del hijo, incluido el hash del PIN**. La comparación del PIN se hace después, ya en el cliente. El hash sale del servidor antes de que nadie haya demostrado conocer el PIN.
- **La sesión no es verificable.** `src/frontend/utils/auth.js` guarda al usuario como un objeto JSON en `localStorage` bajo la clave `domusUser`. Ese objeto se puede editar a mano desde la consola del navegador, y ni la base de datos ni ningún otro componente puede comprobar si es legítimo. `ProtectedRoute.jsx` decide qué se muestra leyendo precisamente ese objeto.
- **Las fotos de evidencia son públicas.** El bucket `task-photos` sirve URLs públicas, de modo que cualquiera con el enlace accede a fotografías de menores de edad sin ninguna comprobación.

En conjunto: no existe ningún punto del sistema donde se verifique la identidad de quien hace una petición, ni que el recurso solicitado pertenezca a su familia.

## Decisión

Trasladar la autenticación y la autorización al servidor, en dos niveles que se refuerzan mutuamente.

**1. Autenticación en la API.** El inicio de sesión pasa a `POST /api/auth/login`. La comparación de la contraseña del padre o del PIN del hijo se hace en el servidor, de modo que el hash nunca sale de la base de datos. La respuesta es un **token JWT firmado** que contiene el identificador del usuario, su rol y su familia. `AuthMiddleware` (`src/backend/api/middleware/auth.js`) valida ese token en cada petición y comprueba tres cosas: que la firma sea válida, que el rol tenga permiso para la operación, y que el recurso solicitado pertenezca a la familia del token. El token reemplaza al objeto de `localStorage` como mecanismo de sesión.

**2. Row Level Security como última línea de defensa.** Se activa RLS en todas las tablas del módulo sin crear políticas para el rol público, lo que equivale a negar por defecto todo acceso con la clave pública. El único camino a los datos queda siendo la API, que se autentica con la clave de servicio almacenada en las variables de entorno de Vercel y nunca expuesta al navegador.

**3. Almacenamiento privado.** El bucket `task-photos` pasa a privado. Las fotos se sirven mediante enlaces temporales firmados que genera la API tras validar el token, de modo que un enlace filtrado caduca en lugar de dar acceso permanente.

El orden importa: RLS solo puede activarse **después** de que todas las pantallas consuman la API (ADR-001). Activarlo antes deja la aplicación sin acceso a datos.

## Código afectado

| Hoy | Después del refactor |
|---|---|
| `loginParent()` — `src/frontend/services/parentService.js` | `POST /api/auth/login` en `src/backend/api/routes/auth.js` |
| `loginChild()` — `src/frontend/services/childService.js` l. 43 | `POST /api/auth/login`, con la comparación del PIN en el servidor |
| `src/frontend/utils/auth.js` (sesión en `localStorage`) | Token JWT emitido y validado por la API |
| `src/frontend/components/ProtectedRoute.jsx` | Protección de rutas basada en el token, respaldada por `AuthMiddleware` |
| Ausencia de políticas de acceso | Migración SQL que activa RLS en las tablas del módulo |
| `src/frontend/components/TaskPhotoUploader.jsx` (URLs públicas) | Subida vía API y enlaces temporales firmados |
| — | `src/backend/api/middleware/auth.js` (nuevo) |

## Atributo de calidad que mejora

**Seguridad** (ISO/IEC 25010), en dos subcaracterísticas:

- *Confidencialidad:* los datos de una familia dejan de ser accesibles con la clave pública, y las fotografías de los menores dejan de estar expuestas en URLs permanentes.
- *Autenticidad:* el sistema pasa a poder demostrar quién hace cada petición, en lugar de confiar en un objeto que el propio cliente puede escribir.

Corresponde al escenario de calidad de seguridad de la semana 8. Medidas verificables: una petición directa a Supabase con la clave pública no devuelve ninguna fila, y una petición a la API con un token válido pero de otra familia responde 403.

## Alternativas consideradas

**Migrar a Supabase Auth** con políticas RLS por usuario. Es la opción más alineada con la plataforma y evita mantener la emisión de tokens a mano. Se descartó porque obliga a migrar todas las cuentas existentes y, sobre todo, porque el ingreso del hijo está diseñado como usuario más PIN de cuatro dígitos, que no encaja en el modelo de correo y contraseña de Supabase Auth; rehacerlo cambiaría el comportamiento del módulo, cuando el objetivo del proyecto es re-arquitecturar sin alterar la funcionalidad.

**Activar RLS sin construir la API**, con políticas basadas en la clave pública. Se descartó porque sin un token verificable la base de datos no tiene ningún dato confiable sobre quién pide, así que las políticas no tendrían contra qué discriminar.

## Consecuencias

**Positivas**

- La clave pública deja de dar acceso a los datos: aunque se filtre, no sirve para leer ni escribir.
- El hash del PIN deja de salir de la base de datos, y la sesión deja de ser un objeto editable por el usuario.
- Las fotos de los menores quedan protegidas tras enlaces que caducan.

**Negativas o riesgos**

- La clave de servicio se vuelve el punto crítico del sistema: si se filtra, otorga acceso total. Su manejo depende enteramente de la configuración de variables de entorno en Vercel.
- La decisión está acoplada a la ADR-001: no se puede activar RLS mientras alguna pantalla siga accediendo directamente a Supabase, lo que la convierte en el último paso de la migración y no en el primero.
- Gestionar la emisión, expiración y renovación de los tokens queda del lado del equipo, con el riesgo que implica implementarlo a mano.
