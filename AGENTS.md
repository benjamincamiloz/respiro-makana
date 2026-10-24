<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- AI calls (Clara chat, statement reading) live in server routes under src/routes/api/ using src/server/gateway.server.ts; keeps the gateway key server-side.
- No login: Clara's single conversation is stored in clara_messages keyed by a random per-browser device id, accessed only server-side with the admin client (RLS on, no policies) — demo app without accounts.
- Keep Clara's shared conversation guidance, statement-context validation and spoken statement summaries in src/lib/clara.ts; use the uploaded name field with a validated fallback instead of an optional short label so chat, screen and audio agree.
- Keep Clara's voice identity and mood-aware delivery in src/lib/clara-voice.ts and pass the selected mood to every speech control; one shared profile prevents divergent voices across greetings and summaries.
- Proactive week planning and work profiles live as pure modules in src/lib/semana.ts and src/lib/perfil.ts (localStorage); pharmacy savings only use prices the user recorded, never invented offers.
