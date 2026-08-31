import { z } from "zod";
import { DemandLevel } from "@prisma/client";

export const createCareerRoleSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(2, "Career title must be at least 2 characters")
      .max(100),
    slug: z.string().max(120).optional(),
    description: z.string().max(2000).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    avgSalary: z.string().max(50).optional().nullable(),
    demandLevel: z.nativeEnum(DemandLevel).default(DemandLevel.HIGH),
    requiredSkills: z
      .array(
        z.object({
          skillId: z.string().min(1, "Skill ID is required"),
          minProficiency: z.number().min(1).max(100).default(60.0),
          weight: z.number().min(0.1).max(10.0).default(1.0),
          isCore: z.boolean().default(true),
        }),
      )
      .min(1, "Career role must specify at least one required skill benchmark"),
  }),
});

export const updateCareerRoleSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(100).optional(),
    slug: z.string().max(120).optional(),
    description: z.string().max(2000).optional().nullable(),
    category: z.string().max(100).optional().nullable(),
    avgSalary: z.string().max(50).optional().nullable(),
    demandLevel: z.nativeEnum(DemandLevel).optional(),
    requiredSkills: z
      .array(
        z.object({
          skillId: z.string().min(1),
          minProficiency: z.number().min(1).max(100).default(60.0),
          weight: z.number().min(0.1).max(10.0).default(1.0),
          isCore: z.boolean().default(true),
        }),
      )
      .optional(),
  }),
});

export type CreateCareerRoleInput = z.infer<
  typeof createCareerRoleSchema
>["body"];
export type UpdateCareerRoleInput = z.infer<
  typeof updateCareerRoleSchema
>["body"];
