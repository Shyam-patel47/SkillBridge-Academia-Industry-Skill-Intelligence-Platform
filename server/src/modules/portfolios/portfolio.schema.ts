import { z } from "zod";

export const updatePortfolioSettingsSchema = z.object({
  body: z.object({
    isPublic: z.boolean().optional(),
    customSlug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(40, "Slug cannot exceed 40 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      )
      .optional()
      .or(z.literal("")),
    aboutMe: z
      .string()
      .max(5000, "About me cannot exceed 5000 characters")
      .optional(),
    themeColor: z.string().max(20).optional(),
  }),
});

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Title must be at least 2 characters").max(150),
    description: z
      .string()
      .min(5, "Description must be at least 5 characters")
      .max(3000),
    liveUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    githubUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
    skillsUsed: z.array(z.string()).default([]),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    isFeatured: z.boolean().optional().default(false),
  }),
});

export const updateProjectSchema = z.object({
  body: createProjectSchema.shape.body.partial(),
});

export const createCertificationSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Title must be at least 2 characters").max(150),
    issuer: z.string().min(2, "Issuer must be at least 2 characters").max(150),
    issueDate: z.string().min(1, "Issue date is required"),
    expiryDate: z.string().optional().or(z.literal("")),
    credentialUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
    credentialId: z.string().max(100).optional().or(z.literal("")),
    skillId: z.string().optional().or(z.literal("")),
  }),
});

export const updateCertificationSchema = z.object({
  body: createCertificationSchema.shape.body.partial(),
});

export const createAchievementSchema = z.object({
  body: z.object({
    title: z.string().min(2, "Title must be at least 2 characters").max(150),
    description: z.string().max(2000).optional().or(z.literal("")),
    issuer: z.string().max(150).optional().or(z.literal("")),
    issueDate: z.string().optional().or(z.literal("")),
    certificateUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
  }),
});

export const updateAchievementSchema = z.object({
  body: createAchievementSchema.shape.body.partial(),
});

export type UpdatePortfolioSettingsInput = z.infer<
  typeof updatePortfolioSettingsSchema
>["body"];
export type CreateProjectInput = z.infer<typeof createProjectSchema>["body"];
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>["body"];
export type CreateCertificationInput = z.infer<
  typeof createCertificationSchema
>["body"];
export type UpdateCertificationInput = z.infer<
  typeof updateCertificationSchema
>["body"];
export type CreateAchievementInput = z.infer<
  typeof createAchievementSchema
>["body"];
export type UpdateAchievementInput = z.infer<
  typeof updateAchievementSchema
>["body"];
