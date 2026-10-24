import { describe, expect, it } from "vitest";
import { ahorroPosible, apartarHoy, aviso, diasHasta, masBarato, type Compromiso } from "@/lib/semana";
import { perfilDe, unidades } from "@/lib/perfil";

const remedio: Compromiso = {
  id: "1", nombre: "los remedios de la mamá", dia: 3, monto: 30000, remedio: true,
  precios: [{ lugar: "Farmacia del centro", monto: 30000 }, { lugar: "Dr. Simi", monto: 21000 }],
};

describe("Mi semana", () => {
  it("cuenta los días hasta el miércoles desde el lunes", () => {
    expect(diasHasta(1, 3)).toBe(2);
    expect(diasHasta(4, 3)).toBe(6);
  });
  it("elige el precio más bajo que ella anotó", () => {
    expect(masBarato(remedio.precios)?.lugar).toBe("Dr. Simi");
    expect(ahorroPosible(remedio.precios)).toBe(9000);
  });
  it("aparta el precio más barato para lo que viene en 3 días", () => {
    expect(apartarHoy([remedio], 1)).toBe(21000);
    expect(apartarHoy([remedio], 4)).toBe(0);
  });
  it("avisa el martes con el lugar más barato", () => {
    expect(aviso([remedio], 2)).toContain("Mañana toca los remedios de la mamá");
    expect(aviso([remedio], 2)).toContain("Dr. Simi");
  });
});

describe("Perfiles", () => {
  it("usa el valor que anota la persona", () => {
    const p = perfilDe({ id: "app", valor: 5000 });
    expect(p.valor).toBe(5000);
    expect(unidades(2, p)).toBe("2 viajes");
  });
  it("vuelve a catálogo si no hay perfil", () => {
    expect(perfilDe(null).valor).toBe(9000);
  });
});
