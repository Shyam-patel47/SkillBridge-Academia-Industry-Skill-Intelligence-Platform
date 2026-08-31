import {
  AuditAction,
  DifficultyLevel,
  LearningType,
  ProficiencyLevel,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { studentService } from "../students/student.service.js";
import {
  CreateLearningProgramInput,
  UpdateLearningProgramInput,
} from "./learning.schema.js";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export interface LearningRecommendationResult {
  program: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    provider: string;
    url: string;
    type: LearningType;
    difficulty: DifficultyLevel;
    estimatedHours: number | null;
    isFree: boolean;
    coveredSkills: Array<{
      id: string;
      name: string;
      slug: string;
      categoryName?: string;
      targetLevel: ProficiencyLevel;
      studentScore: number;
      gapPoints: number;
      isCore: boolean;
    }>;
  };
  relevanceScore: number; // 0 to 100
  targetCareerRole: {
    id: string;
    title: string;
    slug: string;
  };
  addressedGapsCount: number;
  totalGapPointsCovered: number;
  explanation: string;
}

export class LearningService {
  /**
   * Calculate tailored, deterministic learning program recommendations based on diagnosed skill gaps
   */
  async getRecommendationsForStudent(
    userId: string,
    targetCareerIdOrSlug?: string,
  ) {
    const student = await studentService.getProfileByUserId(userId);

    // 1. Fetch Student Skills
    const studentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: {
        skill: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const studentScoreMap = new Map<string, number>();
    for (const ss of studentSkills) {
      studentScoreMap.set(ss.skillId, ss.score);
      studentScoreMap.set(ss.skill.name.toLowerCase().trim(), ss.score);
    }

    // 2. Resolve Target Career Role
    let targetRole: any = null;
    if (targetCareerIdOrSlug) {
      targetRole = await prisma.careerRole.findFirst({
        where: {
          OR: [{ id: targetCareerIdOrSlug }, { slug: targetCareerIdOrSlug }],
        },
        include: {
          requiredSkills: {
            include: {
              skill: {
                include: { category: true },
              },
            },
          },
        },
      });
    }

    // If no target role specified, pick first from careerInterests or default to first career role
    if (!targetRole) {
      const allRoles = await prisma.careerRole.findMany({
        include: {
          requiredSkills: {
            include: {
              skill: {
                include: { category: true },
              },
            },
          },
        },
      });

      if (student.careerInterests && student.careerInterests.length > 0) {
        const preferredInterest = student.careerInterests[0].toLowerCase();
        targetRole = allRoles.find(
          (r) =>
            r.title.toLowerCase().includes(preferredInterest) ||
            (r.category &&
              r.category.toLowerCase().includes(preferredInterest)),
        );
      }

      if (!targetRole && allRoles.length > 0) {
        targetRole = allRoles[0];
      }
    }

    if (!targetRole) {
      return {
        targetCareerRole: null,
        recommendations: [],
        availableCareerRoles: [],
      };
    }

    // 3. Compute exact Skill Gaps for the Target Role
    const roleGapsMap = new Map<
      string,
      {
        skillId: string;
        skillName: string;
        required: number;
        studentScore: number;
        gapPoints: number;
        weight: number;
        isCore: boolean;
      }
    >();

    for (const rs of targetRole.requiredSkills) {
      const studentScore =
        studentScoreMap.get(rs.skillId) ||
        studentScoreMap.get(rs.skill.name.toLowerCase().trim()) ||
        0;
      const gapPoints = Math.max(
        0,
        Number((rs.minProficiency - studentScore).toFixed(1)),
      );

      roleGapsMap.set(rs.skillId, {
        skillId: rs.skillId,
        skillName: rs.skill.name,
        required: rs.minProficiency,
        studentScore,
        gapPoints,
        weight: rs.weight,
        isCore: rs.isCore,
      });
    }

    // 4. Fetch All Learning Programs
    const learningPrograms = await prisma.learningProgram.findMany({
      include: {
        skills: {
          include: {
            skill: {
              include: { category: true },
            },
          },
        },
      },
    });

    // 5. Score & Rank Each Program Deterministically
    const scoredRecommendations: LearningRecommendationResult[] = [];

    for (const program of learningPrograms) {
      let rawRelevanceScore = 0;
      let addressedGapsCount = 0;
      let totalGapPointsCovered = 0;
      const coveredSkillDetails: any[] = [];
      const criticalCoveredSkills: string[] = [];

      for (const ps of program.skills) {
        const studentScore = studentScoreMap.get(ps.skillId) || 0;
        const roleGap = roleGapsMap.get(ps.skillId);

        let gapPoints = 0;
        let isCore = false;

        if (roleGap) {
          gapPoints = roleGap.gapPoints;
          isCore = roleGap.isCore;
        } else {
          // If not in role benchmark, gap is relative to target level benchmark
          const targetScore =
            ps.targetLevel === ProficiencyLevel.ADVANCED
              ? 85
              : ps.targetLevel === ProficiencyLevel.INTERMEDIATE
                ? 65
                : 50;
          gapPoints = Math.max(
            0,
            Number((targetScore - studentScore).toFixed(1)),
          );
        }

        coveredSkillDetails.push({
          id: ps.skill.id,
          name: ps.skill.name,
          slug: ps.skill.slug,
          categoryName: ps.skill.category?.name,
          targetLevel: ps.targetLevel,
          studentScore,
          gapPoints,
          isCore,
        });

        if (gapPoints > 0) {
          addressedGapsCount++;
          totalGapPointsCovered += gapPoints;

          const roleWeight = roleGap ? roleGap.weight : 0.8;
          const coreMultiplier = isCore ? 1.5 : 1.0;

          rawRelevanceScore += gapPoints * roleWeight * coreMultiplier;

          if (isCore || gapPoints >= 20) {
            criticalCoveredSkills.push(`${ps.skill.name} (${gapPoints}pt gap)`);
          }
        }
      }

      const relevanceScore = Math.min(
        100,
        Math.max(20, Math.round(rawRelevanceScore)),
      );

      const explanation = generateLearningExplanation(
        program.title,
        targetRole.title,
        addressedGapsCount,
        criticalCoveredSkills,
        totalGapPointsCovered,
      );

      scoredRecommendations.push({
        program: {
          id: program.id,
          title: program.title,
          slug: program.slug,
          description: program.description,
          provider: program.provider,
          url: program.url,
          type: program.type,
          difficulty: program.difficulty,
          estimatedHours: program.estimatedHours,
          isFree: program.isFree,
          coveredSkills: coveredSkillDetails,
        },
        relevanceScore,
        targetCareerRole: {
          id: targetRole.id,
          title: targetRole.title,
          slug: targetRole.slug,
        },
        addressedGapsCount,
        totalGapPointsCovered,
        explanation,
      });
    }

    // 6. Sort by Relevance Score descending
    scoredRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Fetch all available career roles for selector
    const availableCareerRoles = await prisma.careerRole.findMany({
      select: { id: true, title: true, slug: true, category: true },
      orderBy: { title: "asc" },
    });

    return {
      targetCareerRole: {
        id: targetRole.id,
        title: targetRole.title,
        slug: targetRole.slug,
        description: targetRole.description,
      },
      recommendations: scoredRecommendations,
      availableCareerRoles,
    };
  }

  /**
   * Fetch all learning programs for general catalog
   */
  async getAllPrograms(search?: string, difficulty?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (difficulty && difficulty !== "ALL") {
      where.difficulty = difficulty as DifficultyLevel;
    }

    return prisma.learningProgram.findMany({
      where,
      include: {
        skills: {
          include: {
            skill: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single learning program by ID or slug
   */
  async getProgramById(idOrSlug: string) {
    const program = await prisma.learningProgram.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        skills: {
          include: {
            skill: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!program) {
      const error: AppError = new Error("Learning program not found.");
      error.statusCode = 404;
      error.code = "PROGRAM_NOT_FOUND";
      throw error;
    }

    return program;
  }

  /**
   * Create Learning Program (Admin only)
   */
  async createProgram(input: CreateLearningProgramInput, adminUserId: string) {
    const slug = input.slug || slugify(input.title);

    const existing = await prisma.learningProgram.findFirst({
      where: {
        OR: [{ title: { equals: input.title, mode: "insensitive" } }, { slug }],
      },
    });

    if (existing) {
      const error: AppError = new Error(
        `Learning program "${input.title}" already exists.`,
      );
      error.statusCode = 409;
      error.code = "PROGRAM_EXISTS";
      throw error;
    }

    const created = await prisma.learningProgram.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        provider: input.provider || "SkillBridge Academy",
        url: input.url || "https://skillbridge.dev/curriculum",
        type: input.type || LearningType.COURSE,
        difficulty: input.difficulty || DifficultyLevel.MEDIUM,
        estimatedHours: input.estimatedHours || 20,
        isFree: input.isFree !== undefined ? input.isFree : true,
        skills: {
          create: input.skills.map((s) => ({
            skillId: s.skillId,
            targetLevel: s.targetLevel || ProficiencyLevel.INTERMEDIATE,
          })),
        },
      },
      include: {
        skills: {
          include: { skill: true },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.CREATE,
        entityType: "LearningProgram",
        entityId: created.id,
        details: { title: created.title },
      },
    });

    return created;
  }
}

function generateLearningExplanation(
  programTitle: string,
  targetRoleTitle: string,
  gapCount: number,
  criticalSkills: string[],
  totalGaps: number,
): string {
  if (gapCount === 0) {
    return `You are receiving this recommendation as an enrichment curriculum for ${targetRoleTitle} to expand your technical breadth and advanced best practices.`;
  }

  const skillSummary =
    criticalSkills.length > 0
      ? criticalSkills.join(", ")
      : "identified target skills";

  return `You are receiving this recommendation because ${programTitle} directly addresses ${gapCount} skill gap(s) (${skillSummary}), totaling ${totalGaps}pts needed to achieve benchmark placement readiness for ${targetRoleTitle}.`;
}

export const learningService = new LearningService();
