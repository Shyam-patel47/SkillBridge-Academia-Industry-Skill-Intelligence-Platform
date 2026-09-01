import { ProficiencyLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { studentService } from "../students/student.service.js";
import { AIExtractionProviderFactory } from "./ai-providers/ai-provider.factory.js";
import { ConfirmExtractedSkillsInput } from "./resume.schema.js";

export interface DetectedSkillDto {
  skillId: string;
  skillName: string;
  skillSlug: string;
  category: string;
  confidenceScore: number;
  suggestedProficiency: ProficiencyLevel;
  contextSnippet: string;
  alreadyPossessed: boolean;
  currentScore?: number;
  isCurrentVerified?: boolean;
}

export class ResumeService {
  /**
   * AI-Assisted Resume Skill Extraction Pipeline
   */
  async extractSkillsFromResume(userId: string, resumeText: string) {
    if (!resumeText || resumeText.trim().length < 20) {
      const error: AppError = new Error(
        "Resume content is too short or unreadable. Please provide a valid resume file or text.",
      );
      error.statusCode = 400;
      error.code = "INVALID_RESUME_TEXT";
      throw error;
    }

    const student = await studentService.getProfileByUserId(userId);

    // 1. Fetch Skill Taxonomy from Database
    const taxonomySkills = await prisma.skill.findMany({
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    const knownSkillsList = taxonomySkills.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      categoryName: s.category.name,
    }));

    // 2. Invoke AI / Intelligent NLP Extraction Provider
    const provider = AIExtractionProviderFactory.getProvider();
    let rawExtracted;
    try {
      rawExtracted = await provider.extractSkillsFromText(
        resumeText,
        knownSkillsList,
      );
    } catch (providerError) {
      // Graceful fallback to NLP provider if external AI fails
      const fallback = AIExtractionProviderFactory.getProvider();
      rawExtracted = await fallback.extractSkillsFromText(
        resumeText,
        knownSkillsList,
      );
    }

    // 3. Query student's existing skills
    const existingStudentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
    });

    const existingMap = new Map<string, (typeof existingStudentSkills)[0]>();
    existingStudentSkills.forEach((ss) => existingMap.set(ss.skillId, ss));

    // 4. Normalization Layer: Match detected skill names to exact database skill IDs
    const detectedSkills: DetectedSkillDto[] = [];
    const processedSkillIds = new Set<string>();

    for (const extracted of rawExtracted) {
      const matchedTaxonomy = taxonomySkills.find(
        (s) =>
          s.name.toLowerCase() === extracted.name.toLowerCase() ||
          s.slug === extracted.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      );

      if (matchedTaxonomy && !processedSkillIds.has(matchedTaxonomy.id)) {
        processedSkillIds.add(matchedTaxonomy.id);
        const existing = existingMap.get(matchedTaxonomy.id);

        detectedSkills.push({
          skillId: matchedTaxonomy.id,
          skillName: matchedTaxonomy.name,
          skillSlug: matchedTaxonomy.slug,
          category: matchedTaxonomy.category.name,
          confidenceScore: extracted.confidence,
          suggestedProficiency:
            extracted.suggestedProficiency || ProficiencyLevel.INTERMEDIATE,
          contextSnippet:
            extracted.contextSnippet || `Identified in candidate resume`,
          alreadyPossessed: Boolean(existing),
          currentScore: existing?.score,
          isCurrentVerified: existing?.isVerified,
        });
      }
    }

    // Sort: high confidence first
    detectedSkills.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return {
      extractedSkillsCount: detectedSkills.length,
      detectedSkills,
      rawTextLength: resumeText.length,
      providerUsed: provider.providerName,
      disclaimer:
        "AI suggestions are self-reported candidate evidence. Accept skills to add them to your profile; take benchmark assessments to earn verified SkillBridge credentials.",
    };
  }

  /**
   * Confirm / Accept Extracted Skills (Student Review Workflow)
   * Important: AI extracted skills are stored as self-reported (isVerified: false)
   */
  async confirmExtractedSkills(
    userId: string,
    input: ConfirmExtractedSkillsInput,
  ) {
    const student = await studentService.getProfileByUserId(userId);

    const results = [];

    for (const item of input.acceptedSkills) {
      // Upsert student skill with self-reported score and unverified status
      const existing = await prisma.studentSkill.findFirst({
        where: {
          studentId: student.id,
          skillId: item.skillId,
        },
      });

      if (existing) {
        // If already existing, only update proficiency or score if not already verified by an assessment
        const updated = await prisma.studentSkill.update({
          where: { id: existing.id },
          data: {
            proficiency: item.proficiency || existing.proficiency,
            // Only update score if current is unverified
            score: existing.isVerified
              ? existing.score
              : item.selfReportedScore || existing.score,
          },
          include: { skill: { select: { id: true, name: true, slug: true } } },
        });
        results.push(updated);
      } else {
        // Create new self-reported student skill
        const created = await prisma.studentSkill.create({
          data: {
            studentId: student.id,
            skillId: item.skillId,
            score: item.selfReportedScore || 60,
            proficiency: item.proficiency || ProficiencyLevel.INTERMEDIATE,
            isVerified: false, // Strictly unverified until benchmark assessment
          },
          include: { skill: { select: { id: true, name: true, slug: true } } },
        });
        results.push(created);
      }
    }

    return {
      confirmedCount: results.length,
      skills: results,
      message: `Successfully added ${results.length} self-reported skills to your profile. You can take assessments anytime to verify them.`,
    };
  }
}

export const resumeService = new ResumeService();
