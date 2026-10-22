// Pruebas unitarias de la máquina de estados de tareas (ADR-001, P4).
import { describe, it, expect } from "vitest";
import {
  TASK_STATUS,
  ROLES,
  assertTransition,
  canTransition,
  getAvailableActions,
} from "../../src/backend/domain/taskStateMachine.js";

const { PENDING, PENDING_REVIEW, COMPLETED } = TASK_STATUS;
const { PARENT, CHILD } = ROLES;

// Ayuda para revisar el código del error que se lanza.
function errorCode(fn) {
  try {
    fn();
    return null;
  } catch (err) {
    return err.code;
  }
}

describe("transiciones permitidas", () => {
  it("el hijo completa una tarea pendiente", () => {
    expect(assertTransition("complete", CHILD, PENDING)).toBe(COMPLETED);
  });

  it("el hijo envía la foto y la tarea queda en revisión", () => {
    expect(assertTransition("submitPhoto", CHILD, PENDING)).toBe(PENDING_REVIEW);
  });

  it("el padre aprueba la evidencia y la tarea queda completada", () => {
    expect(assertTransition("approve", PARENT, PENDING_REVIEW)).toBe(COMPLETED);
  });

  it("el padre rechaza la evidencia y la tarea vuelve a pendiente", () => {
    expect(assertTransition("reject", PARENT, PENDING_REVIEW)).toBe(PENDING);
  });

  it("revertir una tarea completada la devuelve a pendiente", () => {
    expect(assertTransition("uncomplete", PARENT, COMPLETED)).toBe(PENDING);
  });

  it("editar no cambia el estado", () => {
    expect(assertTransition("edit", PARENT, PENDING)).toBe(PENDING);
  });
});

describe("acciones rechazadas por rol (403)", () => {
  it("el hijo no puede aprobar su propia evidencia", () => {
    expect(errorCode(() => assertTransition("approve", CHILD, PENDING_REVIEW))).toBe("FORBIDDEN_ROLE");
  });

  it("el hijo no puede eliminar tareas", () => {
    expect(errorCode(() => assertTransition("delete", CHILD, PENDING))).toBe("FORBIDDEN_ROLE");
  });

  it("un rol desconocido no puede hacer nada", () => {
    expect(errorCode(() => assertTransition("complete", "intruso", PENDING))).toBe("FORBIDDEN_ROLE");
  });
});

describe("transiciones inválidas por estado (409)", () => {
  it("no se puede completar dos veces la misma tarea", () => {
    expect(errorCode(() => assertTransition("complete", CHILD, COMPLETED))).toBe("INVALID_TRANSITION");
  });

  it("no se puede completar directamente una tarea que está en revisión", () => {
    expect(errorCode(() => assertTransition("complete", CHILD, PENDING_REVIEW))).toBe("INVALID_TRANSITION");
  });

  it("no se puede aprobar una tarea que no tiene evidencia", () => {
    expect(errorCode(() => assertTransition("approve", PARENT, PENDING))).toBe("INVALID_TRANSITION");
  });

  it("no se puede editar una tarea completada", () => {
    expect(errorCode(() => assertTransition("edit", PARENT, COMPLETED))).toBe("INVALID_TRANSITION");
  });
});

describe("acción desconocida (400)", () => {
  it("rechaza una acción que no existe", () => {
    expect(errorCode(() => assertTransition("hackear", PARENT, PENDING))).toBe("UNKNOWN_ACTION");
  });
});

describe("canTransition y getAvailableActions", () => {
  it("canTransition responde sí o no sin lanzar error", () => {
    expect(canTransition("approve", PARENT, PENDING_REVIEW)).toBe(true);
    expect(canTransition("approve", CHILD, PENDING_REVIEW)).toBe(false);
  });

  it("lista lo que puede hacer el hijo con una tarea pendiente", () => {
    expect(getAvailableActions(CHILD, PENDING)).toEqual(["complete", "submitPhoto"]);
  });

  it("lista lo que puede hacer el padre con una tarea en revisión", () => {
    expect(getAvailableActions(PARENT, PENDING_REVIEW)).toEqual(["approve", "reject", "delete"]);
  });
});