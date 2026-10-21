// Pruebas unitarias de las reglas de gamificación (ADR-004).
// No necesitan base de datos ni interfaz: solo llaman funciones puras.
import { describe, it, expect } from "vitest";
import {
  MAX_LEVEL,
  calculatePoints,
  calculateLevel,
  calculateLevelProgress,
  calculateStreak,
  computeBadges,
  buildChildProgress,
} from "../../src/backend/domain/gamification.js";

// Fecha fija para que las pruebas den siempre el mismo resultado.
// 15:00 UTC = 10:00 a. m. del 21 de octubre en Bogotá.
const TODAY = new Date("2026-10-21T15:00:00Z");

describe("calculatePoints", () => {
  it("resta los puntos gastados a los puntos ganados", () => {
    const tasks = [{ points: 50 }, { points: 30 }];
    const redemptions = [{ points_spent: 20 }];
    expect(calculatePoints(tasks, redemptions)).toBe(60);
  });

  it("devuelve 0 si no hay tareas ni canjes", () => {
    expect(calculatePoints()).toBe(0);
  });
});

describe("calculateLevel", () => {
  it("empieza en el nivel 1", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(99)).toBe(1);
  });

  it("sube un nivel cada 100 puntos", () => {
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(250)).toBe(3);
  });

  it("no pasa del nivel máximo", () => {
    expect(calculateLevel(5000)).toBe(MAX_LEVEL);
  });

  it("no baja del nivel 1 con puntos negativos", () => {
    expect(calculateLevel(-30)).toBe(1);
  });
});

describe("calculateLevelProgress", () => {
  it("calcula lo que lleva y lo que le falta en el nivel actual", () => {
    expect(calculateLevelProgress(250)).toEqual({
      level: 3,
      pointsInLevel: 50,
      pointsToNextLevel: 50,
      isMaxLevel: false,
    });
  });

  it("en el nivel máximo no le falta nada", () => {
    const progress = calculateLevelProgress(950);
    expect(progress.level).toBe(MAX_LEVEL);
    expect(progress.isMaxLevel).toBe(true);
    expect(progress.pointsToNextLevel).toBe(0);
  });
});

describe("calculateStreak", () => {
  it("cuenta los días seguidos que terminan hoy", () => {
    const dates = ["2026-10-21T14:00:00Z", "2026-10-20T20:00:00Z", "2026-10-19T20:00:00Z"];
    expect(calculateStreak(dates, TODAY)).toBe(3);
  });

  it("si hoy aún no completó nada, la racha sigue viva desde ayer", () => {
    const dates = ["2026-10-20T20:00:00Z", "2026-10-19T20:00:00Z"];
    expect(calculateStreak(dates, TODAY)).toBe(2);
  });

  it("un día sin tareas corta la racha", () => {
    const dates = ["2026-10-21T14:00:00Z", "2026-10-19T20:00:00Z"];
    expect(calculateStreak(dates, TODAY)).toBe(1);
  });

  it("varias tareas el mismo día cuentan como un solo día", () => {
    const dates = ["2026-10-21T14:00:00Z", "2026-10-21T16:00:00Z", "2026-10-20T20:00:00Z"];
    expect(calculateStreak(dates, TODAY)).toBe(2);
  });

  it("usa la hora de Bogotá y no la hora UTC", () => {
    // 03:00 UTC del 21 = 10:00 p. m. del 20 en Bogotá, así que cuenta como el día 20.
    const dates = ["2026-10-21T03:00:00Z", "2026-10-19T20:00:00Z"];
    expect(calculateStreak(dates, TODAY)).toBe(2);
  });

  it("devuelve 0 si no hay tareas recientes", () => {
    expect(calculateStreak([], TODAY)).toBe(0);
    expect(calculateStreak(["2026-10-10T20:00:00Z"], TODAY)).toBe(0);
  });
});

describe("computeBadges", () => {
  it("evalúa las 5 insignias sin exponer la función interna", () => {
    const badges = computeBadges({ points: 0, completedTasks: 0, streak: 0, redemptions: 0 });
    expect(badges).toHaveLength(5);
    expect(badges.every((b) => b.unlocked === false)).toBe(true);
    expect(badges[0]).not.toHaveProperty("test");
  });

  it("desbloquea la racha de 3 cuando la racha es real", () => {
    const badges = computeBadges({ points: 0, completedTasks: 3, streak: 3, redemptions: 0 });
    expect(badges.find((b) => b.id === "streak_3").unlocked).toBe(true);
  });
});

describe("buildChildProgress", () => {
  it("arma el progreso completo del hijo con todas las reglas", () => {
    const tasks = [
      { status: "completed", points: 60, completed_at: "2026-10-21T14:00:00Z" },
      { status: "completed", points: 60, completed_at: "2026-10-20T20:00:00Z" },
      { status: "completed", points: 60, completed_at: "2026-10-19T20:00:00Z" },
      { status: "pending", points: 100, completed_at: null },
    ];
    const redemptions = [{ points_spent: 10 }, { points_spent: 10 }, { points_spent: 10 }];

    const progress = buildChildProgress({ tasks, redemptions, today: TODAY });

    expect(progress.points).toBe(150);
    expect(progress.level).toBe(2);
    expect(progress.streak).toBe(3);
    expect(progress.completedTasks).toBe(3);
    expect(progress.totalTasks).toBe(4);
    expect(progress.redemptions).toBe(3);

    const unlocked = progress.badges.filter((b) => b.unlocked).map((b) => b.id);
    expect(unlocked).toEqual(["first_task", "streak_3", "centenarian", "collector"]);
  });
});