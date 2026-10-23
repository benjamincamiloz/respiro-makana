import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { lovableProvider, MODEL, OPENAI_OPTS } from "@/server/gateway.server";

const SYSTEM = `Eres Clara, una asistente cálida y cercana (tono de asistente social chilena) que acompaña a Patricia, 58 años, de Talca. Cuida a su mamá enferma, vive de la venta por catálogo (ingresos variables) y le angustia mirar sus deudas (tarjeta CMR Falabella ~$850.000, pago mínimo ~$42.000).
Reglas: responde en 2 a 4 frases cortas, en español chileno sencillo, sin tecnicismos ni números en rojo. Primero valida la emoción, después ofrece un solo paso pequeño y concreto. Traduce plata a ventas del catálogo (cada venta ~$9.000) o días de aire. Si quiere comprar en cuotas por emoción, valida sin culpa y propone una alternativa más barata o esperar 60 segundos. Nunca juzgues. No uses markdown.`;

export const Route = createFileRoute("/api/clara")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const device = new URL(request.url).searchParams.get("device") ?? "";
        if (device.length < 10) return Response.json([]);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("clara_messages").select("role, content").eq("device_id", device).order("created_at").limit(200);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json(data);
      },
      POST: async ({ request }) => {
        const { device, text, mood } = (await request.json()) as { device: string; text: string; mood?: string | null };
        if (!device || device.length < 10 || !text?.trim() || text.length > 2000)
          return Response.json({ error: "Mensaje inválido" }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: hist, error } = await supabaseAdmin
          .from("clara_messages").select("role, content").eq("device_id", device).order("created_at").limit(60);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        const ins = await supabaseAdmin.from("clara_messages").insert({ device_id: device, role: "user", content: text.trim() });
        if (ins.error) return Response.json({ error: ins.error.message }, { status: 500 });

        const messages: ModelMessage[] = [
          ...(hist ?? []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user", content: text.trim() },
        ];
        const MOOD: Record<string, string> = { tranquila: "tranquila", masomenos: "más o menos", preocupada: "preocupada", agobiada: "agobiada" };
        const moodNote = mood && MOOD[mood] ? ` Hoy Patricia se siente ${MOOD[mood]}. Parte validando esa emoción; si está agobiada, no le entregues cifras hasta que ella pregunte y sugiérale la Pausa Nocturna de 60 segundos; si está preocupada, dale un solo paso muy pequeño; si está tranquila, puedes proponer un paso un poco más grande.` : "";
        const result = streamText({
          model: lovableProvider().responses(MODEL),
          instructions: SYSTEM + moodNote,
          messages,
          abortSignal: request.signal,
          providerOptions: OPENAI_OPTS,
          onFinish: async ({ text: out }) => {
            if (!out.trim()) return;
            const r = await supabaseAdmin.from("clara_messages").insert({ device_id: device, role: "assistant", content: out.trim() });
            if (r.error) console.error("save assistant", r.error.message);
          },
          onError: ({ error: e }) => console.error("clara", e),
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
