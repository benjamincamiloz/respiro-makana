import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { lovableProvider, MODEL, OPENAI_OPTS } from "@/server/gateway.server";
import { CLARA_SYSTEM, moodContext, statementContext } from "@/lib/clara";

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
        const { device, text, mood, statement } = (await request.json()) as { device: string; text: string; mood?: string | null; statement?: unknown };
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
        const result = streamText({
          model: lovableProvider().responses(MODEL),
          instructions: [CLARA_SYSTEM, moodContext(mood), statementContext(statement)].join("\n\n"),
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
