export type FrascoState = { saved: number; goal: number; lastWeek: string; rescues: number };

// El frasco junta de a poquito para los imprevistos, para que el susto no
// vuelva a la tarjeta. Una meta chica alcanza para los gastos típicos.
export const FRASCO_GOAL = 90000;
export const APORTE = 3000;

/**
 * Guarda un aporte en el frasco. Solo el primer aporte de cada semana suma,
 * para que el hábito sea semanal y no una carrera. Nunca pasa de la meta.
 */
export function aportar(
  prev: FrascoState | null,
  wk: string,
  monto: number = APORTE,
): { state: FrascoState; added: boolean } {
  const cur: FrascoState = prev ?? { saved: 0, goal: FRASCO_GOAL, lastWeek: "", rescues: 0 };
  if (cur.lastWeek === wk || cur.saved >= cur.goal) return { state: cur, added: false };
  return {
    state: { ...cur, saved: Math.min(cur.goal, cur.saved + monto), lastWeek: wk },
    added: true,
  };
}

/**
 * Usa plata del frasco para un imprevisto. Usarlo es un logro, no un paso
 * atrás: para eso existe. Nunca queda en negativo.
 */
export function rescatar(
  prev: FrascoState | null,
  monto: number,
): { state: FrascoState; taken: number } {
  const cur: FrascoState = prev ?? { saved: 0, goal: FRASCO_GOAL, lastWeek: "", rescues: 0 };
  const taken = Math.max(0, Math.min(cur.saved, monto));
  return { state: { ...cur, saved: cur.saved - taken, rescues: cur.rescues + 1 }, taken };
}
