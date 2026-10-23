import { describe, expect, it } from "vitest";
import { CLARA_SYSTEM, statementContext } from "@/lib/clara";

describe("Clara statement context", () => {
  it("passes the selected statement's actual amounts rather than a fixed persona balance", () => {
    const context = statementContext({ name: "CMR Falabella", debt: 850000, min: 42500, interest: 26300 });
    expect(context).toContain("saldo 850000 pesos");
    expect(context).toContain("mínimo 42500 pesos");
    expect(context).toContain("interés informado 26300 pesos");
  });

  it("rejects an invalid balance instead of treating it as financial context", () => {
    expect(statementContext({ name: "CMR", debt: -1, min: 42500, interest: 26300 })).not.toContain("saldo -1 pesos");
    expect(statementContext({ name: "CMR", debt: Infinity, min: 42500, interest: 26300 })).not.toContain("saldo Infinity pesos");
  });
});

describe("Clara compra advice", () => {
  it("offers home alternatives without ever suggesting borrowing", () => {
    const alternatives = CLARA_SYSTEM.match(/sugiere alternativas sencillas en casa:[^.]*\./)?.[0] ?? "";
    expect(alternatives).toContain("reparar");
    expect(alternatives).toContain("reutilizar");
    expect(alternatives).not.toContain("prestado");
    expect(CLARA_SYSTEM).toContain("Nunca sugieras pedir prestado");
  });
});