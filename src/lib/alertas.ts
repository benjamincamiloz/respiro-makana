// Avisos dentro de la app: invitan a abonar cuando hay plata, no solo cuando llega la cartola.
// Un aviso a la vez, nunca culpa, nunca sugiere pedir prestado.
export type AlertasState = {
  vence: number | null; // día del mes en que vence la tarjeta (lo anota ella)
  semanal: number; // día de la semana del recordatorio fijo (0 = domingo)
  ventaBuena: string | null; // fecha (AAAA-MM-DD) en que anotó una buena venta
  sobro: string | null; // fecha en que respondió que sobró plata tras los remedios
  noSobro: string | null; // fecha en que respondió que no sobró
  cerradas: Record<string, string>; // tipo -> fecha en que lo cerró
};

export const ALERTAS_INICIAL: AlertasState = { vence: null, semanal: 5, ventaBuena: null, sobro: null, noSobro: null, cerradas: {} };

export type TipoAlerta = "venta" | "vencimiento" | "remedios" | "semanal";
export type Alerta = { tipo: TipoAlerta; titulo: string; texto: string; pregunta?: boolean };

export const fecha = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function diasEntre(a: string, b: Date): number {
  const [y = 0, m = 1, d = 1] = a.split("-").map(Number);
  const x = new Date(y, m - 1, d);
  const z = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((z.getTime() - x.getTime()) / 86400000);
}

/** Días hasta el próximo vencimiento (0 = hoy). Si el mes es corto, vence el último día. */
export function diasAlVencimiento(hoy: Date, vence: number): number {
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  for (let i = 0; i < 2; i++) {
    const y = base.getFullYear(), m = base.getMonth() + i;
    const ultimo = new Date(y, m + 1, 0).getDate();
    const v = new Date(y, m, Math.min(vence, ultimo));
    const diff = Math.round((v.getTime() - base.getTime()) / 86400000);
    if (diff >= 0) return diff;
  }
  return 0;
}

/** El aviso más importante de hoy, o null. `hayRemedioMiercoles` viene de "Mi semana". */
export function alertaDeHoy(s: AlertasState, hoy: Date, opts: { agobiada?: boolean; hayRemedioMiercoles?: boolean } = {}): Alerta | null {
  const f = fecha(hoy);
  const cerrada = (t: TipoAlerta) => s.cerradas[t] === f;
  const lista: Alerta[] = [];

  if (s.ventaBuena && diasEntre(s.ventaBuena, hoy) <= 1 && !cerrada("venta")) {
    lista.push({ tipo: "venta", titulo: "Entró un respiro extra", texto: "Vendiste más de lo normal. Primero aparta lo de la casa y los remedios; si queda algo, un abono hoy a la tarjeta vale más que esperar la cartola." });
  }
  if (s.vence !== null) {
    const d = diasAlVencimiento(hoy, s.vence);
    if (d <= 5 && !cerrada("vencimiento")) {
      const cuando = d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`;
      lista.push({ tipo: "vencimiento", titulo: `Tu tarjeta vence ${cuando}`, texto: "Con tiempo es más fácil. Si ya abonaste algo esta semana, eso ya cuenta." });
    }
  }
  const dia = hoy.getDay();
  if (opts.hayRemedioMiercoles && (dia === 4 || dia === 5) && !cerrada("remedios") && s.noSobro !== f) {
    if (s.sobro && diasEntre(s.sobro, hoy) <= 1) {
      lista.push({ tipo: "remedios", titulo: "Te sobró después de los remedios", texto: "Qué bien. Si esa plata no hace falta para la casa, un abono chico ahora te acerca a la siguiente parada." });
    } else {
      lista.push({ tipo: "remedios", titulo: "Ya pasó el miércoles de remedios", texto: "¿Te sobró algo de plata después de comprarlos?", pregunta: true });
    }
  }
  if (dia === s.semanal && !cerrada("semanal")) {
    lista.push({ tipo: "semanal", titulo: "Tu momento de la semana", texto: "¿Pudiste vender algo más estos días? Un abono chico también cuenta. Si no se pudo, no pasa nada." });
  }

  if (opts.agobiada) return lista.find((a) => a.tipo === "vencimiento") ?? null;
  return lista[0] ?? null;
}
