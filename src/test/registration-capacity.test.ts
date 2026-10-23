import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CLUB_CAPACITY } from "@/lib/clubs";

describe("Database registration limits", () => {
  const db = new PGlite();
  beforeAll(async () => {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id uuid PRIMARY KEY, raw_user_meta_data jsonb);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;`);
    await db.exec(readFileSync("drizzle/migrations/0000_club_registration_profiles.sql", "utf8"));
    await db.exec(readFileSync("drizzle/migrations/0001_enforce_club_capacity.sql", "utf8"));
    await db.exec(`INSERT INTO auth.users (id) SELECT gen_random_uuid() FROM generate_series(1, 36);`);
  }, 30000);
  afterAll(async () => { await db.close(); });

  it("allows 35 students and rejects student 36 even with a supplied seat", async () => {
    expect(CLUB_CAPACITY).toBe(35);
    await db.exec(`INSERT INTO public.club_registrations (user_id, club_slug)
      SELECT id, 'ai' FROM public.profiles ORDER BY id LIMIT 35;`);
    const count = await db.query<{ count: number }>(`SELECT count(*)::integer AS count FROM public.club_registrations WHERE club_slug = 'ai'`);
    expect(count.rows[0]?.count).toBe(35);
    await expect(db.exec(`INSERT INTO public.club_registrations (user_id, club_slug, seat_number)
      SELECT id, 'ai', 999 FROM public.profiles WHERE id NOT IN (SELECT user_id FROM public.club_registrations) LIMIT 1;`)).rejects.toThrow(/Club is full/);
    const availability = await db.query<{ registered_count: number; capacity: number }>(`SELECT registered_count, capacity FROM public.get_club_availability() WHERE club_slug = 'ai'`);
    expect(availability.rows[0]).toEqual({ registered_count: 35, capacity: 35 });
  });

  it("rejects a second registration for the same student and club", async () => {
    await expect(db.exec(`INSERT INTO public.club_registrations (user_id, club_slug)
      SELECT user_id, club_slug FROM public.club_registrations WHERE club_slug = 'ai' LIMIT 1;`)).rejects.toThrow(/Already registered/);
    const count = await db.query<{ count: number }>(`SELECT count(*)::integer AS count FROM public.club_registrations WHERE club_slug = 'ai'`);
    expect(count.rows[0]?.count).toBe(35);
  });

  it("keeps each club's capacity separate", async () => {
    await db.exec(`INSERT INTO public.club_registrations (user_id, club_slug) SELECT id, 'dev' FROM public.profiles ORDER BY id LIMIT 1;`);
    const seats = await db.query<{ seat_number: number }>(`SELECT seat_number FROM public.club_registrations WHERE club_slug = 'dev'`);
    expect(seats.rows[0]?.seat_number).toBe(1);
  });
});