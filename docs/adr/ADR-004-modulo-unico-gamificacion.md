# ADR-004: Módulo único de gamificación

- **Estado:** Aceptada
- **Fecha:** 2026-10-20
- **Implementación:** Implementada en semana 13 para las vistas del hijo (`src/backend/domain/gamification.js` con pruebas unitarias). `ParentHome.jsx` pasa a consumir la API en la semana 15, junto con el resto de las vistas del padre

## Contexto y problema

Resuelve el problema **P1: la lógica del módulo está dispersa y duplicada entre servicios y vistas**, identificado en la semana 3.

Hoy las reglas de puntos, nivel, racha e insignias no viven en ningún componente propio: cada pantalla las vuelve a calcular por su cuenta. En el código actual esto se ve así:

- **La fórmula de nivel está copiada en tres vistas.** `ChildHome.jsx` (línea 13) y `ChildTasks.jsx` (líneas 95 y 105) la calculan a partir de la constante `POINTS_PER_LEVEL`, mientras que `ParentHome.jsx` (línea 63) repite la misma operación con el valor `100` escrito directamente en el código, sin importar la constante. Cambiar la regla hoy obliga a tocar tres archivos, y uno de ellos ni siquiera quedaría cubierto si se modifica la constante.
- **El tope de nivel no se aplica.** `MAX_LEVEL = 10` está declarado en `src/frontend/lib/constants.js` (línea 3) y no se usa en ningún archivo del proyecto, así que un hijo con suficientes puntos supera el nivel 10 sin que nada lo impida.
- **Una insignia es inalcanzable.** `badges.js` define "Racha de 3" con la condición `streak >= 3`, pero las tres vistas que evalúan insignias envían `streak: 0` de forma fija (`ChildHome.jsx` línea 106, `ChildTasks.jsx` líneas 98–99, `ChildProfile.jsx` línea 111). Nunca se desbloquea.
- **Una insignia es inconsistente entre pantallas.** "Coleccionista" depende de `redemptions >= 3`. `ChildHome.jsx` (línea 106) pasa el conteo real de canjes, pero `ChildTasks.jsx` y `ChildProfile.jsx` pasan `0`, así que la misma insignia aparece desbloqueada en una pantalla y bloqueada en otra para el mismo hijo.

El síntoma de fondo es el mismo en los cuatro casos: no hay una única fuente de verdad para las reglas del módulo, y como están repartidas en vistas de React tampoco se pueden probar de forma aislada.

## Decisión

Concentrar todas las reglas de gamificación en un único componente de la capa de negocio: `src/backend/domain/gamification.js`.

El componente expone funciones puras, sin acceso a la base de datos ni efectos secundarios, que reciben los datos del hijo y devuelven su progreso calculado: puntos, nivel (aplicando el tope de `MAX_LEVEL`), racha e insignias desbloqueadas. La racha se calcula a partir de las fechas reales de completado de las tareas, en lugar de pasarse como cero.

La capa de API lo expone en un único endpoint, `GET /api/children/:id/progress`, atendido por `ProgressController` (`src/backend/api/routes/progress.js`). Las vistas dejan de calcular nada: piden el progreso al endpoint a través de `apiClient.js` y muestran el resultado tal cual, de modo que las cuatro pantallas muestran siempre el mismo valor.

Al ser funciones puras, las reglas quedan cubiertas por pruebas unitarias en `tests/unit/`.

## Código afectado

| Hoy | Después del refactor |
|---|---|
| `src/frontend/lib/badges.js` (`BADGES`, `computeBadges`) | `src/backend/domain/gamification.js` |
| `src/frontend/lib/constants.js` (`POINTS_PER_LEVEL`, `MAX_LEVEL`) | `src/backend/domain/gamification.js` |
| `getChildPoints()` y `getChildProgress()` de `src/frontend/services/dashboardService.js` | `src/backend/domain/gamification.js` + `src/backend/api/routes/progress.js` |
| Cálculo de nivel en `ChildHome.jsx` (l. 13), `ChildTasks.jsx` (l. 95, 105) y `ParentHome.jsx` (l. 63) | Consumo de `GET /api/children/:id/progress` vía `apiClient.js` |
| Llamadas a `computeBadges()` en `ChildHome.jsx` (l. 106), `ChildTasks.jsx` (l. 98–99) y `ChildProfile.jsx` (l. 108) | Consumo del mismo endpoint |

## Atributo de calidad que mejora

**Mantenibilidad** (ISO/IEC 25010), en tres subcaracterísticas:

- *Modularidad:* las reglas del módulo quedan en un componente con una sola responsabilidad, en lugar de repartidas entre vistas de presentación.
- *Modificabilidad:* cambiar una regla pasa de tocar tres o cuatro archivos a tocar uno solo.
- *Capacidad de prueba:* al ser funciones puras, las reglas se pueden probar sin levantar la interfaz ni la base de datos.

Corresponde al escenario de calidad de mantenibilidad definido en la semana 8: ante una solicitud de cambio en la fórmula de nivel, el desarrollador modifica únicamente `gamification.js`, sin tocar ninguna vista, y las pruebas unitarias confirman el nuevo comportamiento.

## Alternativas consideradas

**Un hook compartido de React en el frontend** (por ejemplo `useChildProgress`). Elimina la duplicación entre vistas y es mucho más barato de implementar, pero deja las reglas ejecutándose en el navegador, donde el usuario puede inspeccionarlas y alterarlas. Se descartó porque contradice la ADR-001, que mueve las reglas de negocio al servidor, y porque no resuelve que el cliente siga siendo quien decide el progreso.

**Dejar las reglas en `badges.js` y `constants.js` y limitarse a corregir los llamados.** Arregla los síntomas visibles (el `streak: 0`, el `MAX_LEVEL` sin usar), pero no el problema arquitectónico: la próxima pantalla que se agregue vuelve a calcular por su cuenta. Se descartó porque no mejora la modularidad, que es lo que se busca.

## Consecuencias

**Positivas**

- Una sola fuente de verdad para puntos, nivel, racha e insignias; desaparece la posibilidad de que dos pantallas muestren progresos distintos.
- El tope de nivel y la insignia de racha pasan a funcionar, porque el cálculo real ocurre en un solo lugar.
- Las reglas quedan cubiertas por pruebas unitarias, algo imposible mientras vivían dentro de componentes de React.

**Negativas o riesgos**

- Las pantallas pasan a depender de la API para mostrar el progreso: si la API no responde, no hay cálculo local de respaldo.
- Se agrega una llamada de red donde antes el cálculo era inmediato en el navegador.
- Mientras la migración no esté completa, conviven el cálculo viejo en las vistas y el nuevo en el servidor; hay que retirar el viejo para no reintroducir la duplicación.
