import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { AccountActions, useAccount } from "@/components/account-provider";
import { AdminClubs } from "@/components/admin-clubs";
import { Button } from "@/components/ui/button";
import { amIAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [
    { title: "Club Administration — MUICT" }, { name: "description", content: "Manage MUICT clubs, seat limits, and registered students." },
    { property: "og:title", content: "Club Administration — MUICT" }, { property: "og:description", content: "MUICT administrator club management." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAccount();
  const checkAdmin = useServerFn(amIAdmin);
  const access = useQuery({ queryKey: ["admin-access", user?.id], queryFn: () => checkAdmin(), enabled: Boolean(user) && !loading });
  return <main className="min-h-screen bg-background"><header className="border-b border-border"><div className="mx-auto max-w-6xl px-6 py-10"><div className="flex flex-wrap items-center justify-between gap-4"><Link to="/" search={{ q: "", category: "all" }} className="text-sm text-primary hover:underline">← All clubs</Link><AccountActions /></div><p className="mt-8 flex items-center gap-2 text-sm font-semibold text-primary"><ShieldCheck className="size-4" />MUICT</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Club administration</h1></div></header><section className="mx-auto max-w-6xl px-6 py-8">
    {loading ? <p role="status">Checking account…</p> : !user ? <Button asChild><Link to="/auth">Sign in to continue</Link></Button> : access.isPending ? <p role="status">Checking access…</p> : access.isError ? <><p role="alert" className="text-destructive">Could not check administrator access.</p><Button className="mt-4" variant="outline" onClick={() => access.refetch()}>Try again</Button></> : !access.data ? <p role="alert">This area is for administrators only.</p> : <AdminClubs key={user.id} userId={user.id} />}
  </section></main>;
}