import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { registrationSchema } from "@/lib/registration-schema";

export const getRegistrationState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [profile, registrations] = await Promise.all([
      context.supabase.from("profiles").select("display_name, student_id").eq("id", context.userId).maybeSingle(),
      context.supabase.from("club_registrations").select("club_slug, created_at").eq("user_id", context.userId),
    ]);
    if (profile.error || registrations.error) throw new Error("Could not load your registrations. Please try again.");
    return { profile: profile.data, registrations: registrations.data ?? [] };
  });

export const registerForClub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => registrationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error: profileError } = await context.supabase.from("profiles").upsert({
      id: context.userId, display_name: data.displayName, student_id: data.studentId,
    });
    if (profileError) throw new Error("Could not save your student details. Please try again.");
    const { error } = await context.supabase.from("club_registrations").insert({ user_id: context.userId, club_slug: data.clubSlug });
    if (error && error.code !== "23505") throw new Error("Registration could not be saved. Please try again.");
    return { registered: true };
  });