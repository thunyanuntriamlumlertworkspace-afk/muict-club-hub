import { z } from "zod";
import { clubs } from "@/lib/clubs";

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your full name.").max(100),
  studentId: z.string().trim().min(1, "Enter your student ID.").max(30).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, or hyphens for your student ID."),
});
export const clubSlugSchema = z.string().refine((slug) => clubs.some((club) => club.slug === slug), "Choose an available club.");
export const registrationSchema = profileSchema.extend({ clubSlug: clubSlugSchema });
export const emailSchema = z.string().trim().email("Enter a valid email address.").max(255);
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(128);