import { z } from "zod";
import {
  DifficultyLevel,
  LearningType,
  ProficiencyLevel,
} from "@prisma/client";

export const createLearningProgramSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(150),
    slug: z.string().max(160).optional(),
    description: z.string().max(3000).optional().nullable(),
    provider: z.string().max(100).default("SkillBridge Academy"),
    url: z.string().url().default("https://skillbridge.dev/curriculum"),
    type: z.nativeEnum(LearningType).default(LearningType.COURSE),
    difficulty: z.nativeEnum(DifficultyLevel).default(DifficultyLevel.MEDIUM),
    estimatedHours: z.number().int().min(1).max(500).default(20),
    isFree: z.boolean().default(true),
    skills: z
      .array(
        z.object({
          skillId: z.string().min(1, "Skill ID is required"),
          targetLevel: z
            .nativeEnum(ProficiencyLevel)
            .default(ProficiencyLevel.INTERMEDIATE),
        }),
      )
      .min(1, "Program must cover at least one skill"),
  }),
});

export const updateLearningProgramSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(150).optional(),
    slug: z.string().max(160).optional(),
    description: z.string().max(3000).optional().nullable(),
    provider: z.string().max(100).optional(),
    url: z.string().url().optional(),
    type: z.nativeEnum(LearningType).optional(),
    difficulty: z.nativeEnum(DifficultyLevel).optional(),
    estimatedHours: z.number().int().min(1).max(500).optional(),
    isFree: z.boolean().optional(),
    skills: z
      .array(
        z.object({
          skillId: z.string().min(1),
          targetLevel: z
            .nativeEnum(ProficiencyLevel)
            .default(ProficiencyLevel.INTERMEDIATE),
        }),
      )
      .optional(),
  }),
});

export type CreateLearningProgramInput = z.infer<
  typeof createLearningProgramSchema
>["body"];
export type UpdateLearningProgramInput = z.infer<
  typeof updateLearningProgramSchema
>["body"];
