import { z } from "zod";
import { WorkMode, ProficiencyLevel } from "@prisma/client";

export const updateStudentProfileSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters long")
      .max(100)
      .optional(),
    headline: z
      .string()
      .max(150, "Headline cannot exceed 150 characters")
      .optional()
      .nullable(),
    phone: z.string().max(20).optional().nullable(),
    location: z.string().max(100).optional().nullable(),
    college: z.string().max(150).optional().nullable(),
    branch: z.string().max(100).optional().nullable(),
    gradYear: z
      .number({ invalid_type_error: "Graduation year must be a number" })
      .int()
      .min(2000, "Graduation year must be 2000 or later")
      .max(2035, "Graduation year cannot exceed 2035")
      .optional()
      .nullable(),
    cgpa: z
      .number({ invalid_type_error: "CGPA must be a number" })
      .min(0, "CGPA cannot be negative")
      .max(10, "CGPA cannot exceed 10.0")
      .optional()
      .nullable(),
    bio: z
      .string()
      .max(1000, "Bio cannot exceed 1000 characters")
      .optional()
      .nullable(),
    careerInterests: z.array(z.string().trim()).optional(),
    preferredLocations: z.array(z.string().trim()).optional(),
    workModePref: z
      .nativeEnum(WorkMode, {
        errorMap: () => ({
          message: "Work mode must be REMOTE, HYBRID, ON_SITE, or ANY",
        }),
      })
      .optional(),
    selectedSkillIds: z.array(z.string()).optional(),
  }),
});

export type UpdateStudentProfileInput = z.infer<
  typeof updateStudentProfileSchema
>["body"];
