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
- Keep Clara's shared conversation guidance and statement-context validation in src/lib/clara.ts; the server consumes the same context contract while the chat links only to existing Respiro tools, avoiding claims of external access or executed actions.
