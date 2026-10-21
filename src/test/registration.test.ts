import { describe, expect, it } from "vitest";
import { clubs } from "@/lib/clubs";
import { clubSlugSchema, registrationSchema } from "@/lib/registration-schema";

describe("Club registration", () => {
  it.each(["ai", "dev", "iot", "cyber", "badminton", "table-tennis", "japanese-society", "board-game", "media-and-entertainment", "speakers"])("accepts registration for %s", (clubSlug) => {
    expect(registrationSchema.parse({ clubSlug, displayName: "Student Example", studentId: "6620001" }).clubSlug).toBe(clubSlug);
  });
  it("rejects registrations outside the available club list", () => {
    expect(clubSlugSchema.safeParse("nonexistent-club").success).toBe(false);
    expect(clubs).toHaveLength(10);
  });
  it("requires student profile details for registration", () => {
    expect(registrationSchema.safeParse({ clubSlug: "ai", displayName: "", studentId: "" }).success).toBe(false);
    expect(registrationSchema.parse({ clubSlug: "ai", displayName: " Student Example ", studentId: " 6620001 " })).toEqual({ clubSlug: "ai", displayName: "Student Example", studentId: "6620001" });
  });
});