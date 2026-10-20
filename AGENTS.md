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

## Architecture
- Login by CPF maps to synthetic email `<cpf>@portal.local`; public signup disabled, accounts created by admin via server fns (admin API) — CPF-only login without real emails.
- Roles live in `user_roles` + `has_role()`; all reads use browser client under RLS — auxiliares see only own rows.
- Productivity values (CX/H, pagamento, acumulado, média) come only from the official base CSV imported via `importarBase` (idempotent upsert on colaborador+data, colaborador keyed by `nome_base`); never recompute them with tariffs or metas — the old trigger/`configuracoes` are deprecated.
- First admin is created on the login page via `createFirstAdmin`, allowed only while no admin exists.
- `/app/*` (auxiliar) and `/admin/*` (gestor) are `ssr:false` layouts gated by `Gate` — session lives in localStorage.
