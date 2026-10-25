import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Club } from "@/lib/clubs";

type AdminContext = {
  supabase: {
    rpc: (
      fn: string,
      args: { _user_id: string; _role: "admin" },
    ) => Promise<{ data: boolean | null; error: unknown }>;
  };
  userId: string;
};

async function requireAdmin(context: AdminContext) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("This area is for administrators only.");
}

export const amIAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return Boolean(data);
  });

export type AdminClubRow = Club & { registered_count: number };

export const getAdminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminClubRow[]> => {
    await requireAdmin(context);
    const [clubsResult, availabilityResult] = await Promise.all([
      context.supabase.from("clubs").select("*").order("name"),
      context.supabase.rpc("get_club_availability"),
    ]);
    if (clubsResult.error || availabilityResult.error)
      throw new Error("Could not load the club overview. Please try again.");
    const counts = new Map(
      (availabilityResult.data ?? []).map((row) => [row.club_slug, row.registered_count]),
    );
    return (clubsResult.data ?? []).map((row) => ({
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
      capacity: row.capacity,
      registered_count: counts.get(row.slug) ?? 0,
    }));
  });

export type AdminRegistration = {
  id: string;
  seat_number: number | null;
  created_at: string;
  display_name: string;
  student_id: string;
};

export const getClubRegistrations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ clubSlug: z.string().max(50) }).parse(input))
  .handler(async ({ data, context }): Promise<AdminRegistration[]> => {
    await requireAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("club_registrations")
      .select("id, seat_number, created_at, profiles(display_name, student_id)")
      .eq("club_slug", data.clubSlug)
      .order("seat_number");
    if (error) throw new Error("Could not load the registered students. Please try again.");
    return (rows ?? []).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        seat_number: row.seat_number,
        created_at: row.created_at,
        display_name: profile?.display_name ?? "",
        student_id: profile?.student_id ?? "",
      };
    });
  });

const clubInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens for the club ID."),
  name: z.string().trim().min(1, "Enter the club name.").max(100),
  tag: z.string().trim().min(1, "Enter a category.").max(50),
  short: z.string().trim().max(300),
  about: z.string().trim().max(2000),
  meets: z.string().trim().max(100),
  location: z.string().trim().max(100),
  members: z.number().int().min(0).max(100000),
  founded: z.number().int().min(1900).max(2100).nullable(),
  president: z.string().trim().max(100),
  activities: z.array(z.string().trim().min(1).max(200)).max(20),
  capacity: z.number().int().min(1).max(500),
});

export const saveClub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => clubInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("clubs").upsert({
      slug: data.slug,
      name: data.name,
      tag: data.tag,
      short: data.short,
      about: data.about,
      meets: data.meets,
      location: data.location,
      members: data.members,
      founded: data.founded,
      president: data.president,
      activities: data.activities,
      capacity: data.capacity,
    });
    if (error) throw new Error("Could not save the club. Please try again.");
    return { saved: true };
  });

export const deleteClub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(50) }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.from("clubs").delete().eq("slug", data.slug);
    if (error) throw new Error("Could not remove the club. Please try again.");
    return { deleted: true };
  });

export const removeRegistration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ registrationId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("club_registrations")
      .delete()
      .eq("id", data.registrationId);
    if (error) throw new Error("Could not remove the registration. Please try again.");
    return { removed: true };
  });
