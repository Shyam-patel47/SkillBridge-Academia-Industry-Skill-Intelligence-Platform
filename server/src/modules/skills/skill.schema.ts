import { z } from "zod";

export const createSkillCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Category name must be at least 2 characters")
      .max(100),
    slug: z.string().max(120).optional(),
    description: z.string().max(500).optional().nullable(),
    icon: z.string().max(50).optional().nullable(),
    order: z.number().int().min(0).default(0),
  }),
});

export const updateSkillCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().max(120).optional(),
    description: z.string().max(500).optional().nullable(),
    icon: z.string().max(50).optional().nullable(),
    order: z.number().int().min(0).optional(),
  }),
});

export const createSkillSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Skill name must be at least 2 characters")
      .max(100),
    slug: z.string().max(120).optional(),
    description: z.string().max(500).optional().nullable(),
    categoryId: z.string().min(1, "Category ID is required"),
  }),
});

export const updateSkillSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    slug: z.string().max(120).optional(),
    description: z.string().max(500).optional().nullable(),
    categoryId: z.string().optional(),
  }),
});

export const skillQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
  }),
});

export type CreateSkillCategoryInput = z.infer<
  typeof createSkillCategorySchema
>["body"];
export type UpdateSkillCategoryInput = z.infer<
  typeof updateSkillCategorySchema
>["body"];
export type CreateSkillInput = z.infer<typeof createSkillSchema>["body"];
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>["body"];
