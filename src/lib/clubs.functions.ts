import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";

import type { Database } from "@/integrations/supabase/types";
import { CLUB_CAPACITY, type Club } from "@/lib/clubs";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

function toClub(row: ClubRow): Club {
  return {
    slug: row.slug,
    name: row.name,
    tag: row.tag,
    short: row.short,
    about: row.about,
    meets: row.meets,
    location: row.location,
    members: row.members,
    founded: row.founded ?? 0,
    president: row.president,
    activities: Array.isArray(row.activities)
      ? row.activities.filter((a): a is string => typeof a === "string")
      : [],
    capacity: row.capacity ?? CLUB_CAPACITY,
  };
}

/** Public read-only client for the club catalogue (anon SELECT policy). */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false },
    // Opaque sb_ keys aren't JWTs; send only apikey, not the default Authorization bearer.
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listClubs = createServerFn({ method: "GET" }).handler(async (): Promise<Club[]> => {
  const { data, error } = await publicClient().from("clubs").select("*").order("name");
  if (error) throw new Error("Could not load the club list. Please try again.");
  return (data ?? []).map(toClub);
});

export const getClubBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => {
    const slug =
      typeof input === "object" && input !== null && "slug" in input
        ? String((input as { slug: unknown }).slug)
        : "";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Unknown club.");
    return { slug };
  })
  .handler(async ({ data }): Promise<Club | null> => {
    const { data: row, error } = await publicClient()
      .from("clubs")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error("Could not load this club. Please try again.");
    return row ? toClub(row) : null;
  });

export const clubsQueryOptions = queryOptions({
  queryKey: ["clubs"],
  queryFn: () => listClubs(),
});

export const clubQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["clubs", slug],
    queryFn: () => getClubBySlug({ data: { slug } }),
  });
