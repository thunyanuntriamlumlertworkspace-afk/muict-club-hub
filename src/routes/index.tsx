import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { clubs } from "@/lib/clubs";
import { ALL_CATEGORIES, clubCategories, filterClubs, normalizeClubQuery } from "@/lib/club-search";
import { AccountActions } from "@/components/account-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const searchDefaults = { q: "", category: ALL_CATEGORIES };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { q: string; category: string } => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    category: typeof search["category"] === "string" ? search["category"] : ALL_CATEGORIES,
  }),
  head: () => ({
    meta: [
      { title: "MUICT Club Registration — Browse Clubs" },
      { name: "description", content: "Browse and join student clubs at MUICT." },
      { property: "og:title", content: "MUICT Club Registration" },
      { property: "og:description", content: "Browse and join student clubs at MUICT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  // Local state keeps typing smooth; the URL param is the source of truth.
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);
  const query = normalizeClubQuery({ ...search, q });
  const results = filterClubs(query);
  const categories = clubCategories();
  const isFiltering = query.q !== "" || query.category !== ALL_CATEGORIES;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-6 flex flex-wrap items-center justify-end gap-3"><Button variant="ghost" asChild><Link to="/my-clubs">My clubs</Link></Button><AccountActions /></div>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">MUICT</p>
          <h1 className="mt-2 text-4xl font-bold text-foreground md:text-5xl">Club Registration</h1>
          <p className="mt-3 text-muted-foreground">Explore {clubs.length} available clubs.</p>

          <div className="relative mt-8 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              maxLength={100}
              placeholder="Search clubs by name or activity…"
              aria-label="Search clubs"
              className="pl-9 pr-9"
              onChange={(event) => {
                setQ(event.target.value);
                navigate({
                  replace: true,
                  search: (prev) => ({ ...prev, q: event.target.value }),
                });
              }}
            />
            {q !== "" && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  navigate({
                    replace: true,
                    search: (prev) => ({ ...prev, q: "" }),
                  })
                }
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {[ALL_CATEGORIES, ...categories].map((category) => {
              const active = query.category === category;
              return (
                <Link
                  key={category}
                  to="/"
                  search={{ q: search.q, category }}
                  className={
                    active
                      ? "rounded-full border border-primary bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                      : "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
                  }
                >
                  {category === ALL_CATEGORIES ? "All" : category}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-5 text-sm text-muted-foreground" aria-live="polite">
          Showing {results.length} of {clubs.length} clubs
        </p>
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-lg font-medium text-foreground">No clubs match your search</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different keyword or category.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate({ search: { ...searchDefaults } })}
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <Link
                key={c.slug}
                to="/clubs/$clubId"
                params={{ clubId: c.slug }}
                className="rounded-xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  {c.tag}
                </span>
                <h2 className="mt-4 text-xl font-semibold text-card-foreground">{c.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{c.short}</p>
                <span className="mt-4 inline-block text-sm font-medium text-primary">
                  View details →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
