// Máquina de estados de una tarea (ADR-001, problema P4).
// Define qué acción puede hacer cada rol según el estado actual de la tarea.
// La API la consulta antes de escribir en la base de datos, así la regla
// ya no depende de lo que decida el navegador.

export const TASK_STATUS = Object.freeze({
  PENDING: "pending",
  PENDING_REVIEW: "pending_review",
  COMPLETED: "completed",
});

export const ROLES = Object.freeze({
  PARENT: "parent",
  CHILD: "child",
});

const { PENDING, PENDING_REVIEW, COMPLETED } = TASK_STATUS;
const { PARENT, CHILD } = ROLES;
const ALL_STATUSES = [PENDING, PENDING_REVIEW, COMPLETED];

// Cada acción dice desde qué estados se permite, a qué estado lleva
// (null = no cambia el estado) y qué roles la pueden ejecutar.
// Refleja el comportamiento actual de la app, ahora escrito en un solo lugar.
export const TASK_ACTIONS = Object.freeze({
  complete:    { from: [PENDING],        to: COMPLETED,      roles: [PARENT, CHILD] },
  submitPhoto: { from: [PENDING],        to: PENDING_REVIEW, roles: [CHILD] },
  approve:     { from: [PENDING_REVIEW], to: COMPLETED,      roles: [PARENT] },
  reject:      { from: [PENDING_REVIEW], to: PENDING,        roles: [PARENT] },
  uncomplete:  { from: [COMPLETED],      to: PENDING,        roles: [PARENT, CHILD] },
  edit:        { from: [PENDING],        to: null,           roles: [PARENT] },
  delete:      { from: ALL_STATUSES,     to: null,           roles: [PARENT] },
});

// Error con un código que la API traduce a una respuesta HTTP:
// UNKNOWN_ACTION → 400, FORBIDDEN_ROLE → 403, INVALID_TRANSITION → 409.
export class TaskTransitionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "TaskTransitionError";
    this.code = code;
  }
}

// Revisa la acción y devuelve el estado al que pasa la tarea.
// Lanza TaskTransitionError si la acción no está permitida.
export function assertTransition(action, role, currentStatus) {
  const rule = TASK_ACTIONS[action];
  if (!rule) {
    throw new TaskTransitionError("UNKNOWN_ACTION", `La acción "${action}" no existe.`);
  }
  if (!rule.roles.includes(role)) {
    throw new TaskTransitionError("FORBIDDEN_ROLE", `El rol "${role}" no puede hacer "${action}".`);
  }
  if (!rule.from.includes(currentStatus)) {
    throw new TaskTransitionError(
      "INVALID_TRANSITION",
      `No se puede hacer "${action}" sobre una tarea en estado "${currentStatus}".`
    );
  }
  return rule.to ?? currentStatus;
}

// Versión que responde sí o no, sin lanzar error.
export function canTransition(action, role, currentStatus) {
  try {
    assertTransition(action, role, currentStatus);
    return true;
  } catch {
    return false;
  }
}

// Lista de acciones que un rol puede hacer sobre una tarea en cierto estado.
export function getAvailableActions(role, currentStatus) {
  return Object.keys(TASK_ACTIONS).filter((action) => canTransition(action, role, currentStatus));
}