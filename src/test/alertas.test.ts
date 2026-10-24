import { describe, expect, it } from "vitest";
import { ALERTAS_INICIAL, alertaDeHoy, diasAlVencimiento } from "@/lib/alertas";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("alertas", () => {
  it("una buena venta anotada hoy invita a abonar antes de la cartola", () => {
    expect(alertaDeHoy({ ...ALERTAS_INICIAL, ventaBuena: "2026-10-24" }, d(2026, 10, 24))?.tipo).toBe("venta");
  });
  it("la buena venta deja de avisar después de un día", () => {
    expect(alertaDeHoy({ ...ALERTAS_INICIAL, semanal: 9, ventaBuena: "2026-10-20" }, d(2026, 10, 24))).toBeNull();
  });
  it("avisa cuando faltan 5 días o menos para el vencimiento", () => {
    expect(alertaDeHoy({ ...ALERTAS_INICIAL, semanal: 9, vence: 29 }, d(2026, 10, 24))?.titulo).toBe("Tu tarjeta vence en 5 días");
    expect(alertaDeHoy({ ...ALERTAS_INICIAL, semanal: 9, vence: 30 }, d(2026, 10, 24))).toBeNull();
  });
  it("vencimiento día 31 en mes corto cae el último día", () => {
    expect(diasAlVencimiento(d(2026, 11, 28), 31)).toBe(2);
  });
  it("jueves después de remedios pregunta si sobró plata", () => {
    const a = alertaDeHoy({ ...ALERTAS_INICIAL, semanal: 9 }, d(2026, 10, 22), { hayRemedioMiercoles: true });
    expect(a?.tipo).toBe("remedios");
    expect(a?.pregunta).toBe(true);
  });
  it("recordatorio fijo el día elegido", () => {
    expect(alertaDeHoy({ ...ALERTAS_INICIAL, semanal: 6 }, d(2026, 10, 24))?.tipo).toBe("semanal");
  });
  it("con ánimo agobiada solo muestra el vencimiento", () => {
    const s = { ...ALERTAS_INICIAL, semanal: 6, ventaBuena: "2026-10-24" };
    expect(alertaDeHoy(s, d(2026, 10, 24), { agobiada: true })).toBeNull();
  });
  it("un aviso cerrado hoy no vuelve a aparecer hoy", () => {
    expect(alertaDeHoy({ ...ALERTAS_INICIAL, semanal: 6, cerradas: { semanal: "2026-10-24" } }, d(2026, 10, 24))).toBeNull();
  });
});
