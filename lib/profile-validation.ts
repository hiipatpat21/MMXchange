import { z } from "zod";
import { colleges } from "@/lib/mmsu-programs";

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(50),
  college: z.string().trim().min(1, "Choose your college.").max(100),
  program: z.string().trim().min(1, "Choose your degree program.").max(100),
  yearLevel: z.string().regex(/^[1-6]$/, "Choose a year level from 1 to 6."),
  bio: z.string().trim().max(300, "Bio must be 300 characters or fewer."),
}).refine(value => colleges.some(c => c.name === value.college && c.programs.includes(value.program)), {
  message: "Choose a program that belongs to your college.", path: ["program"],
});

export function profileFields(formData: FormData) {
  return Object.fromEntries(["displayName", "college", "program", "yearLevel", "bio"].map(key => [key, formData.get(key) ?? ""]));
}
