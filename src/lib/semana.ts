// "Mi semana": anticiparse a los gastos que vienen, con datos que anota ella.
// Nada de ofertas inventadas: el precio más bajo sale de lo que ella registró.
export type Precio = { lugar: string; monto: number };
export type Compromiso = { id: string; nombre: string; dia: number; monto: number; remedio: boolean; precios: Precio[] };

export const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Días que faltan desde hoy (0 = hoy) hasta el próximo día de la semana `dia`. */
export function diasHasta(hoy: number, dia: number): number {
  return (((dia - hoy) % 7) + 7) % 7;
}

export function proximos(items: Compromiso[], hoy: number) {
  return items
    .map((c) => ({ ...c, en: diasHasta(hoy, c.dia) }))
    .sort((a, b) => a.en - b.en);
}

export function masBarato(precios: Precio[]): Precio | null {
  const validos = precios.filter((p) => p.lugar.trim() && Number.isFinite(p.monto) && p.monto > 0);
  if (!validos.length) return null;
  return validos.reduce((a, b) => (b.monto < a.monto ? b : a));
}

/** Diferencia entre el precio más caro y el más barato anotados. */
export function ahorroPosible(precios: Precio[]): number {
  const v = precios.filter((p) => p.monto > 0).map((p) => p.monto);
  return v.length < 2 ? 0 : Math.max(...v) - Math.min(...v);
}

/** Cuánto apartar hoy para cubrir lo que viene en los próximos `ventana` días. */
export function apartarHoy(items: Compromiso[], hoy: number, ventana = 3): number {
  return proximos(items, hoy)
    .filter((c) => c.en <= ventana)
    .reduce((s, c) => s + (c.remedio ? masBarato(c.precios)?.monto ?? c.monto : c.monto), 0);
}

/** Un solo aviso a la vez, el más cercano, para no saturar. */
export function aviso(items: Compromiso[], hoy: number): string | null {
  const c = proximos(items, hoy)[0];
  if (!c || c.en > 3) return null;
  const cuando = c.en === 0 ? "hoy" : c.en === 1 ? "mañana" : `el ${DIAS[c.dia]}`;
  const barato = c.remedio ? masBarato(c.precios) : null;
  if (barato && ahorroPosible(c.precios) > 0) {
    return `${cuando[0].toUpperCase()}${cuando.slice(1)} toca ${c.nombre}. La última vez lo encontraste más barato en ${barato.lugar}: así te ahorras ${Math.round(ahorroPosible(c.precios)).toLocaleString("es-CL")} pesos.`;
  }
  return `${cuando[0].toUpperCase()}${cuando.slice(1)} toca ${c.nombre}. Si puedes, aparta esa plata antes de que se vaya en otra cosa.`;
}
