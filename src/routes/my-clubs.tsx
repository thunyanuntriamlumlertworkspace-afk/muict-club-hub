import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getRegistrationState } from "@/lib/registration.functions";
import { getClub } from "@/lib/clubs";
import { AccountActions, useAccount } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/my-clubs")({
  head: () => ({ meta: [
    { title: "My Registered Clubs — MUICT" }, { name: "description", content: "View the MUICT student clubs you have registered for." },
    { property: "og:title", content: "My Registered Clubs — MUICT" }, { property: "og:description", content: "Your saved MUICT club registrations." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: MyClubs,
});
function MyClubs() {
  const { user, loading } = useAccount();
  const fetchState = useServerFn(getRegistrationState);
  const query = useQuery({ queryKey: ["registrations", user?.id], queryFn: () => fetchState(), enabled: Boolean(user) && !loading });
  return <main className="min-h-screen bg-background"><header className="border-b border-border"><div className="mx-auto max-w-3xl px-6 py-10">
    <div className="flex flex-wrap items-center justify-between gap-4"><Link to="/" search={{ q: "", category: "all" }} className="text-sm text-primary hover:underline">← All clubs</Link><AccountActions /></div>
    <h1 className="mt-6 text-4xl font-bold">My clubs</h1>
    {query.data && <p className="mt-2 text-muted-foreground">{query.data.registrations.length} registered clubs</p>}
  </div></header><section className="mx-auto max-w-3xl px-6 py-10">
    {loading ? <p role="status">Checking account…</p> : !user ? <Button asChild><Link to="/auth">Sign in to view your clubs</Link></Button> : query.isPending ? <p role="status">Loading your clubs…</p> : query.isError ? <div><p role="alert" className="text-destructive">Could not load your clubs.</p><Button variant="outline" className="mt-4" onClick={() => query.refetch()}>Try again</Button></div> : !query.data.registrations.length ? <><p className="text-muted-foreground">You haven’t registered for a club yet.</p><Button asChild className="mt-5"><Link to="/" search={{ q: "", category: "all" }}>Browse clubs</Link></Button></> : <div className="grid gap-4 sm:grid-cols-2">{query.data.registrations.map((registration) => {
      const club = getClub(registration.club_slug);
      if (!club) return null;
      return <Link key={club.slug} to="/clubs/$clubId" params={{ clubId: club.slug }} className="rounded-lg border border-border bg-card p-6 hover:border-primary"><span className="text-xs font-semibold text-muted-foreground">{club.tag}</span><h2 className="mt-3 text-xl font-semibold">{club.name}</h2><p className="mt-2 text-sm text-muted-foreground">{club.short}</p><p className="mt-5 flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="size-4" />Registered</p><p className="mt-1 text-xs text-muted-foreground">{new Date(registration.created_at).toLocaleDateString("en-GB", { timeZone: "Asia/Bangkok" })}</p></Link>;
    })}</div>}
  </section></main>;
}