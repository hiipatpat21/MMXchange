import { z } from "zod";
import { parseManilaInput } from "@/lib/datetime";

export const sessionSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(100, "Keep the title to 100 characters."),
  skillId: z.coerce.number().int().positive("Choose a skill or topic.").max(Number.MAX_SAFE_INTEGER),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(1000, "Keep the description to 1000 characters."),
  objectives: z.string().trim().max(500, "Keep learning objectives to 500 characters."),
  prerequisites: z.string().trim().max(500, "Keep requirements to 500 characters."),
  startsAt: z.string().transform((value, ctx) => {
    const date = parseManilaInput(value);
    if (!date || date.getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", message: "Choose a valid start time in the future (Philippine time)." });
      return z.NEVER;
    }
    return date.toISOString();
  }),
  durationMinutes: z.coerce.number().int().min(15, "Duration must be at least 15 minutes.").max(480, "Duration cannot exceed 480 minutes."),
  format: z.enum(["in_person", "online"], { message: "Choose a format." }),
  venue: z.string().trim().min(2, "Enter a venue or meeting details.").max(200, "Keep the venue to 200 characters."),
  capacity: z.string().trim().transform((value, ctx) => {
    if (!value) return null;
    const count = Number(value);
    if (!/^\d+$/.test(value) || !Number.isInteger(count) || count < 1 || count > 500) {
      ctx.addIssue({ code: "custom", message: "Capacity must be a whole number from 1 to 500." });
      return z.NEVER;
    }
    return count;
  }),
  deadline: z.string().transform((value, ctx) => {
    if (!value) return null;
    const date = parseManilaInput(value);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "Choose a valid registration deadline." });
      return z.NEVER;
    }
    return date.toISOString();
  }),
}).refine((data) => !data.deadline || data.deadline <= data.startsAt, { message: "The registration deadline must be before the session starts.", path: ["deadline"] });

export function readSessionForm(formData: FormData) {
  return Object.fromEntries(["title", "skillId", "description", "objectives", "prerequisites", "startsAt", "durationMinutes", "format", "venue", "capacity", "deadline"].map((key) => [key, formData.get(key) ?? ""]));
}
