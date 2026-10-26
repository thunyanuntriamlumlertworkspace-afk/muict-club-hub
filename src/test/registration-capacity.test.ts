// @vitest-environment node
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
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULLIF(current_setting('test.user_id', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated;
      GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;`);
    await db.exec(readFileSync("drizzle/migrations/0000_club_registration_profiles.sql", "utf8"));
    await db.exec(readFileSync("drizzle/migrations/0001_enforce_club_capacity.sql", "utf8"));
    await db.exec(readFileSync("drizzle/migrations/0002_clubs_table_and_admin_roles.sql", "utf8"));
    await db.exec(readFileSync("drizzle/migrations/0003_admin_club_permissions_and_capacity_updates.sql", "utf8"));
    await db.exec(readFileSync("drizzle/migrations/0004_use_live_catalogue_registration_ids.sql", "utf8"));
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
  it("enforces the configured capacity of a newly added club", async () => {
    await db.exec(`INSERT INTO public.clubs (slug, name, tag, capacity) VALUES ('robotics', 'Robotics', 'Tech', 2);
      INSERT INTO public.club_registrations (user_id, club_slug) SELECT id, 'robotics' FROM public.profiles ORDER BY id LIMIT 2;`);
    await expect(db.exec(`INSERT INTO public.club_registrations (user_id, club_slug, seat_number) SELECT id, 'robotics', 999 FROM public.profiles WHERE id NOT IN (SELECT user_id FROM public.club_registrations WHERE club_slug='robotics') LIMIT 1`)).rejects.toThrow(/Club is full/);
    const result = await db.query(`SELECT registered_count, capacity FROM public.get_club_availability() WHERE club_slug='robotics'`);
    expect(result.rows[0]).toEqual({ registered_count: 2, capacity: 2 });
  });
  it("rejects an unknown club at the database boundary", async () => {
    await expect(db.exec(`INSERT INTO public.club_registrations (user_id, club_slug) SELECT id, 'unknown-club' FROM public.profiles LIMIT 1`)).rejects.toThrow(/Unknown club/);
  });
  it("prevents reducing limits below occupied seats", async () => {
    await expect(db.exec(`UPDATE public.clubs SET capacity=34 WHERE slug='ai'`)).rejects.toThrow(/occupied seat/);
    await db.exec(`UPDATE public.clubs SET capacity=36 WHERE slug='ai'`);
    const result = await db.query<{ capacity: number }>(`SELECT capacity FROM public.clubs WHERE slug='ai'`);
    expect(result.rows[0]?.capacity).toBe(36);
  });
  it("includes empty clubs in availability", async () => {
    const result = await db.query(`SELECT registered_count, capacity FROM public.get_club_availability() WHERE club_slug='speakers'`);
    expect(result.rows[0]).toEqual({ registered_count: 0, capacity: 35 });
  });
  it("only permits administrators to manage clubs and read student lists", async () => {
    const users = await db.query<{ id: string }>(`SELECT id FROM public.profiles ORDER BY id LIMIT 2`);
    const admin = users.rows[0]?.id;
    const student = users.rows[1]?.id;
    if (!admin || !student) throw new Error("Missing test users");
    await db.exec(`INSERT INTO public.user_roles (user_id,role) VALUES ('${admin}', 'admin'); SET ROLE authenticated; SET test.user_id='${student}';`);
    try {
      await expect(db.exec(`INSERT INTO public.clubs (slug,name,tag) VALUES ('unauthorized','Unauthorized','Tech')`)).rejects.toThrow(/row-level security/);
      const own = await db.query(`SELECT user_id FROM public.club_registrations WHERE club_slug='ai'`);
      expect(own.rows).toEqual([{ user_id: student }]);
      await db.exec(`UPDATE public.clubs SET name='Unauthorized' WHERE slug='dev'; DELETE FROM public.club_registrations WHERE club_slug='ai';`);
      await db.exec(`SET test.user_id='${admin}'; INSERT INTO public.clubs (slug,name,tag) VALUES ('admin-test','Admin test','Tech'); UPDATE public.clubs SET capacity=4 WHERE slug='admin-test'; DELETE FROM public.clubs WHERE slug='admin-test';`);
      const rows = await db.query(`SELECT user_id FROM public.club_registrations WHERE club_slug='ai'`);
      expect(rows.rows).toHaveLength(35);
      const club = await db.query<{ name: string }>(`SELECT name FROM public.clubs WHERE slug='dev'`);
      expect(club.rows[0]?.name).toBe('Dev');
      await db.exec(`DELETE FROM public.club_registrations WHERE club_slug='robotics'`);
      const removed = await db.query(`SELECT id FROM public.club_registrations WHERE club_slug='robotics'`);
      expect(removed.rows).toHaveLength(0);
    } finally { await db.exec(`RESET ROLE;`); }
  });
});