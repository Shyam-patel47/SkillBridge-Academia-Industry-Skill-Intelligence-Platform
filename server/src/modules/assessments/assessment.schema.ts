import { z } from "zod";

export const submitAssessmentSchema = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          questionId: z.string().min(1, "Question ID is required"),
          selectedOptionIndex: z
            .number()
            .int()
            .min(0, "Option index must be >= 0"),
        }),
      )
      .min(1, "You must provide at least one answer"),
  }),
});

export const assessmentQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
  }),
});

export type SubmitAssessmentInput = z.infer<
  typeof submitAssessmentSchema
>["body"];
