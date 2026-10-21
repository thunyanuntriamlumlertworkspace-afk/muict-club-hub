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

- Keep club catalogue data in the shared club module so browsing, details, and registration validation use the same identifiers.
- Store student profiles and registrations in Lovable Cloud; owner-scoped RLS and authenticated server functions protect personal data.
- Keep browsing and account pages public; private reads on these pages run only after a verified client session, never in public loaders.
- Use one root account provider for auth events and cache invalidation so identity changes cannot leave another user's registrations visible.
