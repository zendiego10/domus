# Domus — Requisitos Fase 3

> **Versión:** 3.0  
> **Fecha:** Mayo 2026  
> **Autor:** Diego Robles  
> **Proyecto:** Domus — Sistema de Guía Parental

---

## Escala de Prioridades

| Prioridad | Significado |
|---|---|
| 🔴 **P1 — Alta** | Crítico para el funcionamiento seguro y correcto del sistema |
| 🟡 **P2 — Media** | Importante para la experiencia de usuario y completitud funcional |
| 🟢 **P3 — Baja** | Mejora adicional que enriquece la experiencia sin ser bloqueante |

---

## 1. Requisitos Funcionales

Los requisitos funcionales describen **qué debe hacer** el sistema.

---

### 1.1 Seguridad y Autenticación

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema debe almacenar las contraseñas de los padres aplicando un hash con el algoritmo bcrypt (cost 10) antes de guardarlas en la base de datos. | 🔴 P1 |
| RF-02 | El sistema debe almacenar los PINs de los hijos con hash bcrypt antes de insertarlos en la base de datos. | 🔴 P1 |
| RF-03 | El sistema debe detectar usuarios con credenciales en texto plano y migrarlos automáticamente al formato hasheado en su próximo inicio de sesión, sin interrupción del servicio. | 🔴 P1 |
| RF-04 | El sistema debe ofrecer una función de recuperación de contraseña que envíe un correo electrónico real al padre con un enlace de restablecimiento. | 🔴 P1 |
| RF-05 | El enlace de recuperación debe dirigir al padre a la página `/reset-password`, donde podrá ingresar y confirmar una nueva contraseña. | 🔴 P1 |
| RF-06 | El sistema debe mostrar siempre el mismo mensaje de confirmación en la pantalla de recuperación, independientemente de si el correo existe o no en la base de datos. | 🔴 P1 |

---

### 1.2 Gestión de Tareas

| ID | Requisito | Prioridad |
|---|---|---|
| RF-07 | El padre debe poder eliminar una tarea desde un menú de opciones accesible por tarjeta, con confirmación previa obligatoria. | 🟡 P2 |
| RF-08 | El sistema debe advertir al padre, antes de eliminar una tarea completada, cuántos puntos perderá el hijo asignado al eliminarla. | 🟡 P2 |
| RF-09 | El padre debe poder editar los campos de una tarea (título, descripción, categoría, puntos, fecha límite e hijo asignado) siempre que esté en estado pendiente. | 🟡 P2 |
| RF-10 | El hijo debe poder adjuntar una fotografía como evidencia de completado de una tarea, cambiando su estado a "pendiente de revisión". | 🟡 P2 |
| RF-11 | El padre debe poder ver las tareas con evidencia fotográfica en una columna diferenciada ("Por revisar"), con previsualización de la imagen. | 🟡 P2 |
| RF-12 | El padre debe poder aprobar o rechazar la evidencia fotográfica de una tarea. Al rechazar, debe poder ingresar un motivo visible para el hijo. | 🟡 P2 |
| RF-13 | El padre debe poder crear tareas recurrentes (diarias o semanales), las cuales se regeneran automáticamente una vez completadas. | 🟢 P3 |
| RF-14 | El sistema debe mostrar un indicador visual de dificultad en cada tarjeta de tarea, basado en los puntos asignados. | 🟢 P3 |

---

### 1.3 Gestión de Perfiles

| ID | Requisito | Prioridad |
|---|---|---|
| RF-15 | El padre debe poder editar su nombre directamente desde su perfil sin necesidad de cerrar sesión. | 🟡 P2 |
| RF-16 | El padre debe poder cambiar su contraseña desde el perfil, ingresando la contraseña actual y la nueva con su confirmación. | 🟡 P2 |
| RF-17 | El perfil del padre debe mostrar el código familiar con un botón para copiarlo al portapapeles. | 🟡 P2 |
| RF-18 | El padre debe poder generar y compartir un enlace de registro pre-llenado para sus hijos desde un modal en su perfil. | 🟡 P2 |
| RF-19 | El hijo debe poder editar su nombre directamente desde su perfil. | 🟡 P2 |

---

### 1.4 Avatares

| ID | Requisito | Prioridad |
|---|---|---|
| RF-20 | El sistema debe ofrecer 10 avatares predefinidos (5 de niño y 5 de niña) para que el hijo elija su imagen de perfil. | 🟡 P2 |
| RF-21 | El flujo de registro del hijo debe incluir un paso de selección de avatar antes de finalizar el proceso. | 🟡 P2 |
| RF-22 | El hijo debe poder cambiar su avatar desde su perfil en cualquier momento. | 🟢 P3 |
| RF-23 | El avatar seleccionado debe mostrarse en el navbar, el dashboard y el perfil del hijo. | 🟢 P3 |

---

### 1.5 Gamificación del Hijo

| ID | Requisito | Prioridad |
|---|---|---|
| RF-24 | El sistema debe mostrar una animación de confetti y una tarjeta de celebración cada vez que el hijo completa una tarea exitosamente. | 🟡 P2 |
| RF-25 | La tarjeta de celebración debe mostrar el nombre de la tarea, los puntos obtenidos y una frase motivacional aleatoria. | 🟡 P2 |
| RF-26 | El sistema debe mostrar una celebración especial ("subida de nivel") cuando el hijo cruza un múltiplo de 100 puntos. | 🟡 P2 |
| RF-27 | El sistema debe mostrar una celebración diferenciada cuando el hijo desbloquea un logro/badge por primera vez. | 🟡 P2 |
| RF-28 | El dashboard del hijo debe mostrar un banner motivacional con una frase dinámica según el progreso del día y la hora. | 🟢 P3 |
| RF-29 | El dashboard del hijo debe mostrar una tarjeta con el próximo logro a desbloquear para motivar al hijo a seguir completando tareas. | 🟢 P3 |
| RF-30 | El dashboard del hijo debe mostrar una barra de progreso hacia el siguiente nivel, indicando cuántos puntos faltan. | 🟡 P2 |
| RF-31 | El perfil del hijo debe mostrar todos los logros disponibles, diferenciando visualmente los desbloqueados de los bloqueados. | 🟡 P2 |

---

### 1.6 Dashboard del Padre

| ID | Requisito | Prioridad |
|---|---|---|
| RF-32 | El dashboard del padre debe mostrar un mensaje de bienvenida personalizado con el nombre del usuario al iniciar sesión. | 🟡 P2 |
| RF-33 | El dashboard del padre debe mostrar un ranking familiar con medallas (🥇🥈🥉) para los tres hijos con más puntos, en lugar de una gráfica de barras. | 🟡 P2 |

---

### 1.7 Notificaciones In-App

| ID | Requisito | Prioridad |
|---|---|---|
| RF-34 | El sistema debe notificar al hijo cuando el padre le asigna una nueva tarea. | 🟡 P2 |
| RF-35 | El sistema debe notificar al padre cuando un hijo completa una tarea. | 🟡 P2 |
| RF-36 | El sistema debe notificar al padre cuando un hijo envía una foto como evidencia de una tarea. | 🟡 P2 |
| RF-37 | El sistema debe notificar al hijo cuando el padre aprueba o rechaza su evidencia fotográfica. | 🟡 P2 |
| RF-38 | El sistema debe notificar al hijo cuando el padre crea una nueva recompensa disponible para él. | 🟡 P2 |
| RF-39 | El sistema debe notificar al padre cuando un hijo solicita canjear una recompensa. | 🟡 P2 |
| RF-40 | El sistema debe notificar al hijo cuando el padre aprueba o rechaza su solicitud de recompensa. | 🟡 P2 |
| RF-41 | El avatar del usuario en el navbar debe mostrar un punto rojo cuando existen notificaciones sin leer. | 🟡 P2 |
| RF-42 | El menú desplegable del avatar debe incluir un botón de "Notificaciones" con un contador de mensajes sin leer. | 🟡 P2 |
| RF-43 | El panel de notificaciones debe permitir marcar todas las notificaciones como leídas con un solo botón. | 🟢 P3 |
| RF-44 | Al hacer clic en una notificación, el sistema debe redirigir al usuario a la sección correspondiente (tareas o recompensas) y marcarla como leída. | 🟡 P2 |

---

### 1.8 Infraestructura y Despliegue

| ID | Requisito | Prioridad |
|---|---|---|
| RF-45 | El sistema debe funcionar correctamente al acceder a cualquier ruta directamente por URL o al refrescar el navegador, sin mostrar errores 404. | 🔴 P1 |
| RF-46 | Las imágenes de evidencia deben comprimirse en el cliente antes de enviarse al servidor, a un máximo de 800px y calidad JPEG del 70%. | 🟡 P2 |

---

## 2. Requisitos No Funcionales

Los requisitos no funcionales describen **cómo debe comportarse** el sistema.

---

### 2.1 Seguridad

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-01 | Las contraseñas y PINs nunca deben almacenarse ni transmitirse en texto plano en ninguna parte del sistema. | 🔴 P1 |
| RNF-02 | Los tokens de recuperación de contraseña deben ser únicos, generados aleatoriamente (UUID v4) y no predecibles. | 🔴 P1 |
| RNF-03 | El sistema no debe revelar si un correo electrónico está o no registrado durante el flujo de recuperación de contraseña. | 🔴 P1 |
| RNF-04 | Las credenciales de conexión a la base de datos y servicios externos deben cargarse exclusivamente desde variables de entorno, nunca hardcodeadas en el código fuente. | 🔴 P1 |
| RNF-05 | El proceso de migración de contraseñas de texto plano a hash debe ser transparente para el usuario y no interrumpir el servicio. | 🔴 P1 |

---

### 2.2 Rendimiento

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-06 | Las animaciones de celebración (confetti) deben implementarse exclusivamente con CSS y React, sin librerías externas, para mantener el tamaño del bundle bajo. | 🟡 P2 |
| RNF-07 | La generación de instancias de tareas recurrentes debe realizarse de forma lazy (solo cuando el padre abre la pantalla), sin requerir procesos en segundo plano ni cron jobs. | 🟡 P2 |
| RNF-08 | La compresión de imágenes de evidencia debe realizarse en el lado del cliente usando la API Canvas del navegador, sin librerías adicionales. | 🟡 P2 |
| RNF-09 | La creación de notificaciones en los servicios debe ejecutarse de forma no bloqueante (fire-and-forget), para que un fallo en las notificaciones no afecte la operación principal. | 🟡 P2 |

---

### 2.3 Usabilidad

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-10 | La interfaz debe ser completamente funcional en pantallas de teléfonos móviles (mínimo 320px de ancho), sin que el navbar fijo tape el contenido principal. | 🔴 P1 |
| RNF-11 | Las tarjetas estadísticas deben organizarse en 2 columnas en dispositivos móviles para optimizar el espacio disponible. | 🟡 P2 |
| RNF-12 | Los modales deben aparecer como bottom-sheet (panel desde la parte inferior) en dispositivos móviles para seguir las convenciones de UX nativas. | 🟡 P2 |
| RNF-13 | Las celebraciones deben cerrarse automáticamente sin requerir acción del usuario (máximo 3.8 segundos), aunque también deben poder cerrarse con un toque. | 🟡 P2 |
| RNF-14 | Las frases motivacionales deben ser contextualmente relevantes al estado actual del hijo (progreso, hora del día) y no mostrarse siempre iguales. | 🟢 P3 |
| RNF-15 | El sistema debe confirmar con un modal cualquier acción destructiva irreversible (eliminar tarea, rechazar solicitud) antes de ejecutarla. | 🟡 P2 |

---

### 2.4 Disponibilidad y Mantenibilidad

| ID | Requisito | Prioridad |
|---|---|---|
| RNF-16 | La aplicación debe estar disponible en cualquier ruta de React Router al ser accedida directamente, gracias a la configuración de Vercel como SPA. | 🔴 P1 |
| RNF-17 | Los logros del hijo deben calcularse dinámicamente en el cliente a partir del estado existente de la base de datos, sin requerir tablas adicionales de logros. | 🟢 P3 |

---

## 3. Reglas de Negocio

Las reglas de negocio describen las **restricciones y condiciones** que gobiernan el comportamiento del sistema.

---

| ID | Regla | Prioridad |
|---|---|---|
| RN-01 | Un token de recuperación de contraseña expira exactamente 1 hora después de su creación y no puede usarse una vez marcado como utilizado. | 🔴 P1 |
| RN-02 | Una tarea con evidencia fotográfica en estado `pending_review` no otorga puntos al hijo hasta que el padre la apruebe explícitamente. | 🔴 P1 |
| RN-03 | Solo las tareas en estado `pending` pueden ser editadas. Las tareas en estado `completed` o `pending_review` son de solo lectura. | 🟡 P2 |
| RN-04 | Al eliminar una tarea que estaba `completed`, el sistema debe eliminar también su registro en `activity_log`, lo que reduce los puntos del hijo automáticamente en el siguiente cálculo. | 🟡 P2 |
| RN-05 | Si el padre rechaza la evidencia fotográfica de una tarea, la tarea vuelve al estado `pending`, la URL de la foto se elimina del registro y el hijo puede volver a intentarlo. | 🟡 P2 |
| RN-06 | Las tareas recurrentes deben generar únicamente la siguiente instancia, nunca múltiples instancias en lote. No puede existir más de una instancia pendiente para la misma fecha de una tarea recurrente. | 🟡 P2 |
| RN-07 | La dificultad de una tarea se clasifica solo por sus puntos: 1-5 pts = Fácil, 6-15 pts = Normal, 16+ pts = Difícil. Este valor no se almacena en base de datos. | 🟢 P3 |
| RN-08 | Los logros (badges) del hijo se calculan en tiempo real a partir de los datos existentes y no se almacenan en base de datos. Una vez que se cumplen las condiciones, el logro se muestra como desbloqueado permanentemente. | 🟢 P3 |
| RN-09 | El sistema debe celebrar el desbloqueo de un badge con una animación especial solo la primera vez que ocurre dentro de la sesión activa. | 🟢 P3 |
| RN-10 | El avatar del hijo se almacena en la base de datos y se sincroniza con la sesión local. Al cambiar el avatar, el cambio debe reflejarse inmediatamente en el navbar sin necesidad de cerrar sesión. | 🟡 P2 |
| RN-11 | Las notificaciones de tipo "nueva recompensa" deben enviarse a todos los hijos del padre si la recompensa es global (`child_id = NULL`), o exclusivamente al hijo designado si tiene `child_id` específico. | 🟡 P2 |
| RN-12 | El enlace de registro pre-llenado para el hijo (`/register-child?code=XXXXXX`) debe pre-completar automáticamente el campo del código familiar, pero el hijo puede modificarlo si lo desea. | 🟢 P3 |
| RN-13 | La migración de contraseñas legacy (texto plano a bcrypt) se activa automáticamente en el primer login exitoso del usuario. El usuario no debe percibir ninguna diferencia en su experiencia. | 🔴 P1 |
| RN-14 | El ranking familiar debe mostrar únicamente medallas (🥇🥈🥉) para el top 3. Los demás hijos reciben un mensaje motivador sin asignación de puesto numérico, para evitar desmotivación. | 🟢 P3 |

---

## Resumen por Categoría

| Categoría | RF | RNF | RN | Total |
|---|---|---|---|---|
| Seguridad y autenticación | 6 | 5 | 2 | **13** |
| Gestión de tareas | 8 | — | 4 | **12** |
| Perfiles y avatares | 9 | — | 2 | **11** |
| Gamificación | 8 | 2 | 3 | **13** |
| Notificaciones | 11 | 1 | 1 | **13** |
| Infraestructura | 2 | 7 | 1 | **10** |
| **Total** | **44** | **17** | **14** | **75** |
