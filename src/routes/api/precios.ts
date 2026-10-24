import { createFileRoute } from "@tanstack/react-router";

// Precios del día desde los accesos públicos para programas de BuscaFarma (/ai/*).
// BuscaFarma pide no guardar precios: se consultan cada vez y se muestra la hora de captura.
const BASE = "https://buscafarma.cl/ai";
const UA = "Respiro/1.0 (+https://respira-bienestar.lovable.app)";

async function bf(path: string, signal: AbortSignal) {
  const go = () => fetch(`${BASE}${path}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal });
  let res = await go();
  for (let i = 0; i < 2 && res.status === 403; i++) { await new Promise((r) => setTimeout(r, 900)); res = await go(); }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`BuscaFarma [${res.status}]: ${body.slice(0, 300)}`);
    throw new Error(`BuscaFarma respondió ${res.status}`);
  }
  return (await res.json()) as Raw;
}

type Raw = { [k: string]: unknown; offers?: unknown; results?: unknown; in_stock?: unknown; price_clp?: unknown; pharmacy?: unknown; price_normal_clp?: unknown; captured_at?: unknown; buy_url?: unknown; display_name?: unknown; bioequivalent?: unknown; prescription_required?: unknown; url?: unknown; similar_result?: unknown; slug?: unknown; min_price_clp?: unknown; pharmacy_count?: unknown; web_url?: unknown };

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export const Route = createFileRoute("/api/precios")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const q = (u.searchParams.get("q") ?? "").trim().slice(0, 60);
        const slug = (u.searchParams.get("slug") ?? "").trim();
        try {
          if (slug) {
            if (!/^[a-z0-9-]{1,160}$/.test(slug)) return Response.json({ error: "Remedio inválido" }, { status: 400 });
            const d = await bf(`/medicamento/${slug}.json`, request.signal);
            const offers = (Array.isArray(d.offers) ? d.offers : []) as Raw[];
            const ofertas = offers
              .filter((o) => o.in_stock === true && num(o.price_clp))
              .map((o) => ({ farmacia: str(o.pharmacy), precio: num(o.price_clp)!, normal: num(o.price_normal_clp), captura: str(o.captured_at), url: str(o.buy_url) }))
              .sort((a, b) => a.precio - b.precio)
              .slice(0, 6);
            return Response.json({ nombre: str(d.display_name), bioequivalente: d.bioequivalent === true, receta: d.prescription_required === true, web: str(d.url), ofertas }, { headers: { "Cache-Control": "no-store" } });
          }
          if (q.length < 3) return Response.json({ error: "Escribe al menos 3 letras" }, { status: 400 });
          const d = await bf(`/buscar?q=${encodeURIComponent(q)}&format=json&limit=6&sort=relevance`, request.signal);
          const results = (Array.isArray(d.results) ? d.results : []) as Raw[];
          const productos = results
            .filter((r) => r.similar_result !== true && /^[a-z0-9-]+$/.test(str(r.slug)))
            .map((r) => ({ slug: str(r.slug), nombre: str(r.display_name), desde: num(r.min_price_clp), farmacias: num(r.pharmacy_count) ?? 0, web: str(r.web_url) }));
          return Response.json({ productos }, { headers: { "Cache-Control": "no-store" } });
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "No pude consultar precios" }, { status: 502 });
        }
      },
    },
  },
});
