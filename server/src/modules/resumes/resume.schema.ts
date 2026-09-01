import { z } from "zod";
import { ProficiencyLevel } from "@prisma/client";

export const extractSkillsFromTextSchema = z.object({
  body: z.object({
    rawText: z
      .string()
      .min(20, "Resume text must be at least 20 characters")
      .max(50000, "Resume text cannot exceed 50,000 characters")
      .optional(),
  }),
});

export const confirmExtractedSkillsSchema = z.object({
  body: z.object({
    acceptedSkills: z
      .array(
        z.object({
          skillId: z.string().min(1, "Skill ID is required"),
          proficiency: z
            .nativeEnum(ProficiencyLevel)
            .default(ProficiencyLevel.INTERMEDIATE),
          selfReportedScore: z.number().min(0).max(100).default(60),
        }),
      )
      .min(1, "Please select at least one skill to confirm"),
  }),
});

export type ConfirmExtractedSkillsInput = z.infer<
  typeof confirmExtractedSkillsSchema
>["body"];
