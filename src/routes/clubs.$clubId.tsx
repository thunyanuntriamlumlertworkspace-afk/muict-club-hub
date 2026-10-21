import { Link } from "@/lib/Link";
import { createFileRoute } from "@tanstack/react-router";

import { getClub } from "@/lib/clubs";

export const Route = createFileRoute("/clubs/$clubId")({
  loader: ({ params }) => {
    const club = getClub(params.clubId);
    if (!club) throw new Error("Club not found");
    return club;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.name} Club — MUICT` : "Club — MUICT" },
      {
        name: "description",
        content: loaderData ? loaderData.short : "View student clubs at MUICT.",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.name} Club — MUICT` : "Club — MUICT",
      },
      {
        property: "og:description",
        content: loaderData ? loaderData.short : "View student clubs at MUICT.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClubDetail,
});

function ClubDetail() {
  const club = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Link
            to="/clubs/$clubId"
            params={{ clubId: club.slug }}
            className="hidden"
            aria-hidden
          >
            {club.name}
          </Link>
          <a href="/#clubs" className="text-sm text-primary hover:underline">
            ← All clubs
          </a>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              {club.tag}
            </span>
            <span className="text-sm text-muted-foreground">{club.members} members</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold text-foreground">{club.name} Club</h1>
          <p className="mt-2 text-muted-foreground">{club.short}</p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <h2 className="text-lg font-semibold text-foreground">About</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">{club.about}</p>

        <h2 className="mt-10 text-lg font-semibold text-foreground">At a glance</h2>
        <dl className="mt-4 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {[
            { label: "Meets", value: club.meets },
            { label: "Location", value: club.location },
            { label: "Members", value: `${club.members} students` },
            { label: "Founded", value: String(club.founded) },
            { label: "President", value: club.president },
            { label: "Category", value: club.tag },
          ].map((item) => (
            <div key={item.label} className="bg-card p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 font-medium text-card-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-10 text-lg font-semibold text-foreground">What members do</h2>
        <ul className="mt-4 space-y-2">
          {club.activities.map((a) => (
            <li key={a} className="flex gap-3 text-muted-foreground">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {a}
            </li>
          ))}
        </ul>

        <button type="button" disabled className="mt-10 cursor-not-allowed opacity-60">
          Sign up
        </button>
      </section>
    </main>
  );
}
