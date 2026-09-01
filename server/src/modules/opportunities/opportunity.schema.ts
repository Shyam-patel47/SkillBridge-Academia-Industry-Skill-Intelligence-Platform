import { z } from "zod";
import { OpportunityType, WorkMode } from "@prisma/client";

export const createOpportunitySchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(150),
    slug: z.string().max(180).optional(),
    type: z.nativeEnum(OpportunityType).default(OpportunityType.INTERNSHIP),
    description: z
      .string()
      .min(20, "Description must be at least 20 characters")
      .max(5000),
    workMode: z.nativeEnum(WorkMode).default(WorkMode.REMOTE),
    location: z.string().max(150).optional().nullable(),
    minCgpa: z.number().min(0).max(10).default(0),
    eligibleBranches: z.array(z.string()).default([]),
    eligibleGradYears: z.array(z.number().int()).default([]),
    duration: z.string().max(50).optional().nullable(),
    stipendSalary: z.string().max(100).optional().nullable(),
    deadline: z
      .union([z.string().datetime(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v ? new Date(v) : null)),
    isActive: z.boolean().default(true),
    requiredSkills: z
      .array(
        z.object({
          skillId: z.string().min(1, "Skill ID is required"),
          minScore: z.number().min(1).max(100).default(60.0),
          isMandatory: z.boolean().default(true),
          weight: z.number().min(0.1).max(10.0).default(1.0),
        }),
      )
      .min(1, "Opportunity must specify at least one required skill"),
  }),
});

export const updateOpportunitySchema = z.object({
  body: z.object({
    title: z.string().min(3).max(150).optional(),
    slug: z.string().max(180).optional(),
    type: z.nativeEnum(OpportunityType).optional(),
    description: z.string().min(20).max(5000).optional(),
    workMode: z.nativeEnum(WorkMode).optional(),
    location: z.string().max(150).optional().nullable(),
    minCgpa: z.number().min(0).max(10).optional(),
    eligibleBranches: z.array(z.string()).optional(),
    eligibleGradYears: z.array(z.number().int()).optional(),
    duration: z.string().max(50).optional().nullable(),
    stipendSalary: z.string().max(100).optional().nullable(),
    deadline: z
      .union([z.string().datetime(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v ? new Date(v) : null)),
    isActive: z.boolean().optional(),
    requiredSkills: z
      .array(
        z.object({
          skillId: z.string().min(1),
          minScore: z.number().min(1).max(100).default(60.0),
          isMandatory: z.boolean().default(true),
          weight: z.number().min(0.1).max(10.0).default(1.0),
        }),
      )
      .optional(),
  }),
});

export const togglePublishSchema = z.object({
  body: z.object({
    isActive: z.boolean(),
  }),
});

export type CreateOpportunityInput = z.infer<
  typeof createOpportunitySchema
>["body"];

export interface UpdateOpportunityInput {
  title?: string;
  slug?: string;
  type?: OpportunityType;
  description?: string;
  workMode?: WorkMode;
  location?: string | null;
  minCgpa?: number;
  eligibleBranches?: string[];
  eligibleGradYears?: number[];
  duration?: string | null;
  stipendSalary?: string | null;
  deadline?: Date | string | null;
  isActive?: boolean;
  requiredSkills?: Array<{
    skillId: string;
    minScore: number;
    isMandatory: boolean;
    weight: number;
  }>;
}
