import { z } from "zod";
import { ApplicationStatus } from "@prisma/client";

export const applyOpportunitySchema = z.object({
  body: z.object({
    opportunityId: z.string().min(1, "Opportunity ID is required"),
    resumeUrl: z
      .string()
      .url("Must be a valid resume URL")
      .optional()
      .or(z.literal("")),
    coverLetter: z
      .string()
      .max(3000, "Cover letter cannot exceed 3000 characters")
      .optional(),
  }),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(ApplicationStatus, {
      errorMap: () => ({ message: "Invalid application status" }),
    }),
    statusNotes: z
      .string()
      .max(1000, "Status notes cannot exceed 1000 characters")
      .optional(),
  }),
});

export const withdrawApplicationSchema = z.object({
  body: z.object({
    reason: z
      .string()
      .max(500, "Withdrawal reason cannot exceed 500 characters")
      .optional(),
  }),
});

export const recruiterApplicantsQuerySchema = z.object({
  query: z.object({
    opportunityId: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    minMatchScore: z.coerce.number().min(0).max(100).optional(),
    minCgpa: z.coerce.number().min(0).max(10).optional(),
    branch: z.string().optional(),
    gradYear: z.coerce.number().int().optional(),
    skill: z.string().optional(),
  }),
});

export type ApplyOpportunityInput = z.infer<
  typeof applyOpportunitySchema
>["body"];
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>["body"];
export type WithdrawApplicationInput = z.infer<
  typeof withdrawApplicationSchema
>["body"];
export type RecruiterApplicantsQueryInput = z.infer<
  typeof recruiterApplicantsQuerySchema
>["query"];
