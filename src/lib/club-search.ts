import { clubs, type Club } from "@/lib/clubs";

export const ALL_CATEGORIES = "all";

export type ClubQuery = {
  q: string;
  category: string;
};

/** Categories present in the club catalogue, in catalogue order. */
export function clubCategories(all: Club[] = clubs): string[] {
  return Array.from(new Set(all.map((club) => club.tag)));
}

export function isKnownCategory(category: string, all: Club[] = clubs): boolean {
  return category === ALL_CATEGORIES || clubCategories(all).includes(category);
}

/** Clamps what a hand-typed URL can carry before it reaches the list. */
export function normalizeClubQuery(query: ClubQuery, all: Club[] = clubs): ClubQuery {
  return {
    q: query.q.trim().slice(0, 100),
    category: isKnownCategory(query.category, all) ? query.category : ALL_CATEGORIES,
  };
}

export function filterClubs(query: ClubQuery, all: Club[] = clubs): Club[] {
  const { q, category } = normalizeClubQuery(query, all);
  const needle = q.toLowerCase();

  return all.filter((club) => {
    if (category !== ALL_CATEGORIES && club.tag !== category) return false;
    if (!needle) return true;

    const haystack = [club.name, club.short, club.about, club.tag, ...club.activities]
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}
