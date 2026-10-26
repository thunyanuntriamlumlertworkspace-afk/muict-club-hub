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

- Keep the live club catalogue in Lovable Cloud and access it through the shared clubs.functions module; clubs.ts holds shared types and seed fixtures only, so admin edits reach every student page.
- Keep admin mutations authenticated and verify the role server-side through has_role, with RLS enforcing the same permissions; private student lists must never load in a public loader.
- Serialize capacity edits with registration inserts using the same per-club lock and reject limits below occupied seats, so edits cannot invalidate existing registrations.
- Enforce registration capacity in a database trigger with per-club transaction locks and unique bounded seats; retain unique student/club pairs so concurrent requests and direct inserts cannot bypass limits. Test the applied SQL with PGlite.
- Store student profiles and registrations in Lovable Cloud; owner-scoped RLS and authenticated server functions protect personal data.
- Keep browsing and account pages public; private reads on these pages run only after a verified client session, never in public loaders.
- Use one root account provider for auth events and cache invalidation so identity changes cannot leave another user's registrations visible.
