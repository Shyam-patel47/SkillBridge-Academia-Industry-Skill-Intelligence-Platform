import { z } from "zod";

export const updateCompanyProfileSchema = z.object({
  body: z.object({
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters")
      .max(100)
      .optional(),
    industry: z.string().max(100).optional().nullable(),
    website: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    logoUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .nullable()
      .or(z.literal("")),
    location: z.string().max(150).optional().nullable(),
    description: z.string().max(3000).optional().nullable(),
  }),
});

export type UpdateCompanyProfileInput = z.infer<
  typeof updateCompanyProfileSchema
>["body"];
