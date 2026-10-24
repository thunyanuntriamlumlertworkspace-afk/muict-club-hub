import { describe, expect, it } from "vitest";

import { clubs } from "@/lib/clubs";
import {
  ALL_CATEGORIES,
  clubCategories,
  filterClubs,
  normalizeClubQuery,
} from "@/lib/club-search";

const slugs = (query: { q: string; category: string }) =>
  filterClubs(query).map((club) => club.slug);

describe("Club search and category filter", () => {
  it("finds a club from a partial name typed in the search box", () => {
    expect(slugs({ q: "japan", category: ALL_CATEGORIES })).toEqual(["japanese-society"]);
  });

  it("matches wording from a club's activities, not only its name", () => {
    expect(slugs({ q: "ctf", category: ALL_CATEGORIES })).toEqual(["cyber"]);
  });

  it("limits results to one category", () => {
    expect(slugs({ q: "", category: "Sports" })).toEqual(["badminton", "table-tennis"]);
  });

  it("combines the search text with the category", () => {
    expect(slugs({ q: "table", category: "Sports" })).toEqual(["table-tennis"]);
    expect(slugs({ q: "table", category: "Tech" })).toEqual([]);
  });

  it("ignores the search text when nothing is typed", () => {
    expect(slugs({ q: "   ", category: ALL_CATEGORIES })).toHaveLength(clubs.length);
  });

  it("treats a category the club list does not have as all clubs", () => {
    expect(normalizeClubQuery({ q: "", category: "nonsense" }).category).toBe(ALL_CATEGORIES);
    expect(filterClubs({ q: "", category: "nonsense" })).toHaveLength(clubs.length);
  });

  it("treats missing search params as no filter instead of crashing", () => {
    const partial = {} as { q: string; category: string };
    expect(normalizeClubQuery(partial)).toEqual({ q: "", category: ALL_CATEGORIES });
    expect(filterClubs(partial)).toHaveLength(clubs.length);
  });

  it("offers every club category as a filter", () => {
    expect(clubCategories()).toEqual(["Tech", "Sports", "Culture", "Leisure", "Creative", "Skills"]);
  });
});
