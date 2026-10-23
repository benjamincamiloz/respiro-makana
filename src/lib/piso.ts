export type PisoState = { streak: number; piso: number; week: string };

// El piso son ventas extra sobre el mínimo que ya no se vuelven a decidir.
export const PISO_CAP = 6;

/** Clave de semana ISO, p. ej. "2026-W43". */
export function weekKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7; // lunes = 0
  t.setUTCDate(t.getUTCDate() - day + 3); // jueves de esta semana ISO
  const isoYear = t.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week =
    1 + Math.round(((t.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/**
 * Registra la decisión de la semana: extraVentas = ventas pagadas sobre el
 * mínimo (0 si fue semana de ventas bajas). Solo la primera decisión de cada
 * semana cuenta; dos semanas seguidas con al menos 1 venta extra suben el piso
 * en 1 venta, para siempre. Una semana de bajas reinicia la racha pero el piso
 * queda guardado.
 */
export function applyWeek(
  prev: PisoState | null,
  wk: string,
  extraVentas: number,
): { state: PisoState; pisoUp: boolean } {
  const cur = prev ?? { streak: 0, piso: 0, week: "" };
  if (cur.week === wk) return { state: cur, pisoUp: false };
  if (cur.piso >= PISO_CAP) {
    return { state: { streak: cur.streak, piso: cur.piso, week: wk }, pisoUp: false };
  }
  const streak = extraVentas >= 1 ? cur.streak + 1 : 0;
  if (streak >= 2) {
    return { state: { streak: 0, piso: cur.piso + 1, week: wk }, pisoUp: true };
  }
  return { state: { streak, piso: cur.piso, week: wk }, pisoUp: false };
}
