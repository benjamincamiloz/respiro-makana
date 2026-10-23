import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";
import { lovableProvider, MODEL, OPENAI_OPTS } from "@/server/gateway.server";

const PROMPT = `Lee esta cartola o estado de cuenta chileno y responde SOLO con un JSON, sin texto extra:
{"name": "banco o tarjeta", "debt": deuda total en pesos (número), "min": pago mínimo del mes (número), "interest": intereses cobrados este mes (número, estima si no aparece), "sub": "una frase corta y tranquila describiendo la deuda"}`;

export const Route = createFileRoute("/api/cartola")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0 || file.size > 10_000_000)
          return Response.json({ error: "Archivo inválido (máx 10 MB)" }, { status: 400 });
        const bytes = new Uint8Array(await file.arrayBuffer());
        const isPdf = file.type === "application/pdf";
        if (!isPdf && !file.type.startsWith("image/"))
          return Response.json({ error: "Sube una foto o un PDF" }, { status: 400 });
        try {
          const result = streamText({
            model: lovableProvider().responses(MODEL),
            messages: [{
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                isPdf
                  ? { type: "file", data: bytes, mediaType: "application/pdf", filename: file.name || "cartola.pdf" }
                  : { type: "image", image: bytes, mediaType: file.type },
              ],
            }],
            abortSignal: request.signal,
            providerOptions: OPENAI_OPTS,
          });
          const text = await result.text;
          const m = text.match(/\{[\s\S]*\}/);
          if (!m) return Response.json({ error: "No pude leer la cartola" }, { status: 422 });
          const j = JSON.parse(m[0]);
          const debt = Number(j.debt) || 0, min = Number(j.min) || 0;
          if (!debt || !min) return Response.json({ error: "No encontré la deuda o el pago mínimo" }, { status: 422 });
          return Response.json({
            id: "subida", name: String(j.name || "Tu cartola"), sub: String(j.sub || ""),
            debt, min, interest: Number(j.interest) || Math.round(debt * 0.031),
          });
        } catch (e) {
          console.error("cartola", e);
          return Response.json({ error: "No pude leer la cartola ahora" }, { status: 502 });
        }
      },
    },
  },
});
