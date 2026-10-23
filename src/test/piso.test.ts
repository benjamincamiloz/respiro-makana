import { describe, expect, it } from "vitest";

import { PISO_CAP, applyWeek, weekKey } from "@/lib/piso";

describe("weekKey", () => {
  it("devuelve la semana ISO de una fecha", () => {
    expect(weekKey(new Date(2026, 9, 23))).toBe("2026-W43"); // viernes 23 oct 2026
    expect(weekKey(new Date(2026, 0, 1))).toBe("2026-W01"); // jueves 1 ene 2026
    expect(weekKey(new Date(2026, 9, 19))).toBe("2026-W43"); // lunes 19 oct 2026
  });
});

describe("applyWeek", () => {
  it("sube el piso tras dos semanas seguidas pagando sobre el mínimo", () => {
    const a = applyWeek(null, "2026-W42", 1);
    expect(a.state.streak).toBe(1);
    expect(a.pisoUp).toBe(false);
    const b = applyWeek(a.state, "2026-W43", 1);
    expect(b.pisoUp).toBe(true);
    expect(b.state.piso).toBe(1);
    expect(b.state.streak).toBe(0);
  });

  it("reinicia la racha en una semana de ventas bajas y conserva el piso", () => {
    const a = applyWeek(null, "2026-W42", 1);
    const b = applyWeek(a.state, "2026-W43", 0);
    expect(b.pisoUp).toBe(false);
    expect(b.state.streak).toBe(0);
    expect(b.state.piso).toBe(0);
  });

  it("no pierde el piso ya ganado por una semana de bajas", () => {
    const a = applyWeek(null, "2026-W41", 1);
    const b = applyWeek(a.state, "2026-W42", 1);
    expect(b.state.piso).toBe(1);
    const c = applyWeek(b.state, "2026-W43", 0); // semana de ventas bajas
    expect(c.state.piso).toBe(1);
    expect(c.state.streak).toBe(0);
  });

  it("no cuenta dos veces dentro de la misma semana", () => {
    const a = applyWeek(null, "2026-W43", 2);
    const b = applyWeek(a.state, "2026-W43", 2);
    expect(b.state).toEqual(a.state);
    expect(b.pisoUp).toBe(false);
  });

  it("no pasa del tope de piso", () => {
    const start = { streak: 1, piso: PISO_CAP, week: "2026-W42" };
    const r = applyWeek(start, "2026-W43", 1);
    expect(r.pisoUp).toBe(false);
    expect(r.state.piso).toBe(PISO_CAP);
  });
});
