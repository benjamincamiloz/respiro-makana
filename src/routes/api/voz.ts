import { createFileRoute } from "@tanstack/react-router";
import { CLARA_VOICE, speechPrompt } from "@/lib/clara-voice";

export const Route = createFileRoute("/api/voz")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, mood } = (await request.json()) as { text?: unknown; mood?: unknown };
        if (typeof text !== "string" || !text.trim() || text.length > 1500) return Response.json({ error: "Texto inválido" }, { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ error: "Falta configuración de voz" }, { status: 500 });
        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: speechPrompt(text, mood) }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: CLARA_VOICE } } },
            },
            stream_format: "audio",
          }),
          signal: request.signal,
        });
        if (!res.ok || !res.body) {
          const msg = await res.text().catch(() => "");
          let safeMessage = "No pude generar la voz ahora";
          try {
            const detail = JSON.parse(msg);
            safeMessage = typeof detail.message === "string" ? detail.message : typeof detail.error?.message === "string" ? detail.error.message : safeMessage;
          } catch { /* An upstream non-JSON response has no safe structured message. */ }
          return Response.json({ error: safeMessage }, { status: res.ok ? 502 : res.status });
        }
        return new Response(res.body, { headers: { "content-type": res.headers.get("content-type") ?? "audio/wav" } });
      },
    },
  },
});
