import { describe, expect, it } from "vitest";
import { statementName, statementVoiceSummary } from "@/lib/clara";

describe("Statement entity used by Clara", () => {
  it("uses the uploaded entity name without relying on an absent short field", () => {
    const statement = { name: "BancoEstado", debt: 120000, min: 15000, interest: 0 };
    expect(statementName(statement.name)).toBe("BancoEstado");
    expect(statementVoiceSummary("tranquila", statement)).toContain(statement.name);
  });
  it.each([undefined, null, "", " undefined ", "null"])("does not treat %s as an entity", (name) => {
    expect(statementName(name)).toBeNull();
  });
});