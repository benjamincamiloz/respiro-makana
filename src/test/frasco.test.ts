import { describe, expect, it } from "vitest";
import { APORTE, FRASCO_GOAL, aportar, rescatar } from "@/lib/frasco";

describe("frasco de imprevistos", () => {
  it("el primer aporte de la semana suma", () => {
    const { state, added } = aportar(null, "2026-W43");
    expect(added).toBe(true);
    expect(state.saved).toBe(APORTE);
  });

  it("solo un aporte por semana", () => {
    const primero = aportar(null, "2026-W43").state;
    const { state, added } = aportar(primero, "2026-W43");
    expect(added).toBe(false);
    expect(state.saved).toBe(APORTE);
    const siguiente = aportar(state, "2026-W44");
    expect(siguiente.added).toBe(true);
    expect(siguiente.state.saved).toBe(APORTE * 2);
  });

  it("nunca pasa de la meta", () => {
    const casi = { saved: FRASCO_GOAL - 1000, goal: FRASCO_GOAL, lastWeek: "2026-W42", rescues: 0 };
    const { state } = aportar(casi, "2026-W43");
    expect(state.saved).toBe(FRASCO_GOAL);
    const lleno = aportar(state, "2026-W44");
    expect(lleno.added).toBe(false);
    expect(lleno.state.saved).toBe(FRASCO_GOAL);
  });

  it("rescatar usa lo que hay, sin quedar en negativo", () => {
    const con = { saved: 9000, goal: FRASCO_GOAL, lastWeek: "2026-W43", rescues: 0 };
    const { state, taken } = rescatar(con, 30000);
    expect(taken).toBe(9000);
    expect(state.saved).toBe(0);
    expect(state.rescues).toBe(1);
  });

  it("rescatar menos de lo que hay deja el resto guardado", () => {
    const con = { saved: 30000, goal: FRASCO_GOAL, lastWeek: "2026-W43", rescues: 2 };
    const { state, taken } = rescatar(con, 12000);
    expect(taken).toBe(12000);
    expect(state.saved).toBe(18000);
    expect(state.rescues).toBe(3);
  });
});
