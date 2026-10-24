// La unidad de esfuerzo traduce la plata a algo que la persona hace en su día.
// Los valores son puntos de partida editables: cada persona anota lo que
// realmente le queda libre por unidad.
export type PerfilId = "catalogo" | "app" | "oficio";
export type Perfil = { id: PerfilId; label: string; unidad: string; plural: string; valor: number; ejemplo: string };

export const PERFILES: Record<PerfilId, Omit<Perfil, "valor"> & { valorInicial: number }> = {
  catalogo: { id: "catalogo", label: "Vendo por catálogo", unidad: "venta", plural: "ventas", valorInicial: 9000, ejemplo: "ventas de cremas o perfumes de tu catálogo" },
  app: { id: "app", label: "Manejo o reparto por app", unidad: "viaje", plural: "viajes", valorInicial: 4500, ejemplo: "viajes o repartos extra" },
  oficio: { id: "oficio", label: "Hago trabajos o pedidos", unidad: "pedido", plural: "pedidos", valorInicial: 12000, ejemplo: "pedidos o trabajos chicos extra" },
};

export type PerfilState = { id: PerfilId; valor: number };

export function perfilDe(state: PerfilState | null): Perfil {
  const id: PerfilId = state && state.id in PERFILES ? state.id : "catalogo";
  const base = PERFILES[id];
  const valor = state && state.id === id && Number.isFinite(state.valor) && state.valor >= 500 ? Math.round(state.valor) : base.valorInicial;
  return { id, label: base.label, unidad: base.unidad, plural: base.plural, ejemplo: base.ejemplo, valor };
}

export function unidades(n: number, p: Perfil): string {
  return `${n} ${n === 1 ? p.unidad : p.plural}`;
}
