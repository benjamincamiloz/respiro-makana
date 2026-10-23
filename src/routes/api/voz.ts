import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/voz")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text } = (await request.json()) as { text?: string };
        if (!text?.trim() || text.length > 1500) return Response.json({ error: "Texto inválido" }, { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "Falta configuración de voz" }, { status: 500 });
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: `Dilo en español chileno, con voz cálida, calmada y pausada, como una amiga que acompaña: ${text.trim()}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
            },
            stream_format: "audio",
          }),
          signal: request.signal,
        });
        if (!res.ok || !res.body) {
          const msg = await res.text().catch(() => "");
          console.error("voz", res.status, msg.slice(0, 300));
          return Response.json({ error: "No pude generar la voz ahora" }, { status: res.status === 402 || res.status === 429 ? res.status : 502 });
        }
        return new Response(res.body, { headers: { "content-type": res.headers.get("content-type") ?? "audio/wav" } });
      },
    },
  },
});
