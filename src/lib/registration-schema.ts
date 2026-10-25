import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your full name.").max(100),
  studentId: z.string().trim().min(1, "Enter your student ID.").max(30).regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, or hyphens for your student ID."),
});

// Format-only check: the live club list lives in the database, and the
// registration trigger rejects unknown slugs at insert time.
export const clubSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(50)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Choose an available club.");

export const registrationSchema = profileSchema.extend({ clubSlug: clubSlugSchema });
export const emailSchema = z.string().trim().email("Enter a valid email address.").max(255);
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(128);
