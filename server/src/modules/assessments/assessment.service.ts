import { AuditAction, ProficiencyLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { studentService } from "../students/student.service.js";

export class AssessmentService {
  /**
   * List all active assessments with category and question counts
   */
  async getAssessments(
    userId?: string,
    categorySlug?: string,
    search?: string,
  ) {
    let studentId: string | null = null;
    if (userId) {
      const student = await prisma.student.findUnique({ where: { userId } });
      studentId = student?.id || null;
    }

    const where: any = { isActive: true };

    if (categorySlug && categorySlug !== "all") {
      where.category = { slug: categorySlug };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const assessments = await prisma.assessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
        responses: studentId
          ? {
              where: { studentId },
              orderBy: { completedAt: "desc" },
              take: 1,
              select: {
                id: true,
                score: true,
                percentage: true,
                passed: true,
                completedAt: true,
              },
            }
          : false,
      },
    });

    return assessments.map((a) => {
      const latestAttempt =
        a.responses && a.responses.length > 0 ? a.responses[0] : null;
      return {
        id: a.id,
        title: a.title,
        slug: a.slug,
        description: a.description,
        categoryId: a.categoryId,
        category: a.category,
        durationMinutes: a.durationMinutes,
        passingScore: a.passingScore,
        questionCount: a._count.questions,
        totalAttempts: a._count.responses,
        latestAttempt,
      };
    });
  }

  /**
   * Fetch assessment and questions for live quiz session (Security: scrubs answers)
   */
  async getAssessmentForSession(idOrSlug: string) {
    const assessment = await prisma.assessment.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            codeSnippet: true,
            options: true,
            difficulty: true,
            weight: true,
            skill: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!assessment) {
      const error: AppError = new Error(
        "Assessment not found or is currently inactive.",
      );
      error.statusCode = 404;
      error.code = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    return assessment;
  }

  /**
   * Submit answers, calculate deterministic score, update StudentSkill records, and return results
   */
  async submitAssessment(
    idOrSlug: string,
    userId: string,
    answers: { questionId: string; selectedOptionIndex: number }[],
  ) {
    const student = await studentService.getProfileByUserId(userId);

    // Fetch assessment with complete questions and correct answers for validation
    const assessment = await prisma.assessment.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
      },
      include: {
        category: true,
        questions: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!assessment) {
      const error: AppError = new Error("Assessment not found.");
      error.statusCode = 404;
      error.code = "ASSESSMENT_NOT_FOUND";
      throw error;
    }

    const questionMap = new Map(assessment.questions.map((q) => [q.id, q]));
    const submittedAnswerMap = new Map(
      answers.map((a) => [a.questionId, a.selectedOptionIndex]),
    );

    let totalWeight = 0;
    let earnedWeight = 0;
    let totalCorrect = 0;

    // Track skill-specific score accumulators
    const skillStats = new Map<
      string,
      {
        skillId: string;
        skillName: string;
        totalWeight: number;
        earnedWeight: number;
        correctCount: number;
        questionCount: number;
      }
    >();

    // Detailed question review list
    const questionReview = assessment.questions.map((q) => {
      const selectedIndex = submittedAnswerMap.has(q.id)
        ? submittedAnswerMap.get(q.id)!
        : -1;
      const isCorrect = selectedIndex === q.correctOptionIndex;
      const weight = q.weight || 1.0;

      totalWeight += weight;
      if (isCorrect) {
        earnedWeight += weight;
        totalCorrect++;
      }

      // Aggregate skill data
      if (!skillStats.has(q.skillId)) {
        skillStats.set(q.skillId, {
          skillId: q.skillId,
          skillName: q.skill.name,
          totalWeight: 0,
          earnedWeight: 0,
          correctCount: 0,
          questionCount: 0,
        });
      }

      const stat = skillStats.get(q.skillId)!;
      stat.totalWeight += weight;
      stat.questionCount += 1;
      if (isCorrect) {
        stat.earnedWeight += weight;
        stat.correctCount += 1;
      }

      return {
        questionId: q.id,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet,
        options: q.options,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect,
        explanation: q.explanation,
        skillId: q.skillId,
        skillName: q.skill.name,
      };
    });

    // Compute overall score
    const overallPercentage =
      totalWeight > 0
        ? Number(((earnedWeight / totalWeight) * 100).toFixed(1))
        : 0;
    const isPassed = overallPercentage >= assessment.passingScore;

    // Compute granular skill breakdown
    const skillBreakdown = Array.from(skillStats.values()).map((s) => {
      const score =
        s.totalWeight > 0
          ? Number(((s.earnedWeight / s.totalWeight) * 100).toFixed(1))
          : 0;
      let proficiency: ProficiencyLevel = ProficiencyLevel.BEGINNER;
      if (score >= 80) proficiency = ProficiencyLevel.ADVANCED;
      else if (score >= 50) proficiency = ProficiencyLevel.INTERMEDIATE;

      return {
        skillId: s.skillId,
        skillName: s.skillName,
        score,
        proficiency,
        correctCount: s.correctCount,
        questionCount: s.questionCount,
      };
    });

    // Identify Strengths (>= 75%) and Weak Areas (< 60%)
    const strengths = skillBreakdown
      .filter((s) => s.score >= 75)
      .map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        score: s.score,
        proficiency: s.proficiency,
      }));

    const weakAreas = skillBreakdown
      .filter((s) => s.score < 60)
      .map((s) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        score: s.score,
        proficiency: s.proficiency,
      }));

    // Persist Result & Update StudentSkill in transaction
    const savedResponse = await prisma.$transaction(async (tx) => {
      // 1. Create AssessmentResponse
      const response = await tx.assessmentResponse.create({
        data: {
          studentId: student.id,
          assessmentId: assessment.id,
          score: earnedWeight,
          totalQuestions: assessment.questions.length,
          correctAnswers: totalCorrect,
          percentage: overallPercentage,
          passed: isPassed,
          answersJson: {
            summary: {
              totalQuestions: assessment.questions.length,
              correctAnswers: totalCorrect,
              overallPercentage,
              passed: isPassed,
            },
            skillBreakdown,
            strengths,
            weakAreas,
            questionReview,
          },
        },
      });

      // 2. Update / Upsert StudentSkill records for tested skills
      for (const sb of skillBreakdown) {
        await tx.studentSkill.upsert({
          where: {
            studentId_skillId: {
              studentId: student.id,
              skillId: sb.skillId,
            },
          },
          update: {
            score: sb.score,
            proficiency: sb.proficiency,
            isVerified: true,
            lastAssessedAt: new Date(),
          },
          create: {
            studentId: student.id,
            skillId: sb.skillId,
            score: sb.score,
            proficiency: sb.proficiency,
            isVerified: true,
            lastAssessedAt: new Date(),
          },
        });
      }

      // 3. Record AuditLog
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE,
          entityType: "AssessmentResponse",
          entityId: response.id,
          details: {
            assessmentTitle: assessment.title,
            percentage: overallPercentage,
            passed: isPassed,
          },
        },
      });

      return response;
    });

    return {
      responseId: savedResponse.id,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        slug: assessment.slug,
        passingScore: assessment.passingScore,
        category: assessment.category,
      },
      score: earnedWeight,
      totalQuestions: assessment.questions.length,
      correctAnswers: totalCorrect,
      percentage: overallPercentage,
      passed: isPassed,
      skillBreakdown,
      strengths,
      weakAreas,
      questionReview,
      completedAt: savedResponse.completedAt,
    };
  }

  /**
   * Retrieve result for an assessment response
   */
  async getAssessmentResult(responseIdOrAssessmentId: string, userId: string) {
    const student = await studentService.getProfileByUserId(userId);

    const response = await prisma.assessmentResponse.findFirst({
      where: {
        studentId: student.id,
        OR: [
          { id: responseIdOrAssessmentId },
          { assessmentId: responseIdOrAssessmentId },
        ],
      },
      orderBy: { completedAt: "desc" },
      include: {
        assessment: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!response) {
      const error: AppError = new Error("Assessment result not found.");
      error.statusCode = 404;
      error.code = "RESULT_NOT_FOUND";
      throw error;
    }

    const payload = response.answersJson as any;

    return {
      responseId: response.id,
      assessment: {
        id: response.assessment.id,
        title: response.assessment.title,
        slug: response.assessment.slug,
        passingScore: response.assessment.passingScore,
        category: response.assessment.category,
      },
      score: response.score,
      totalQuestions: response.totalQuestions,
      correctAnswers: response.correctAnswers,
      percentage: response.percentage,
      passed: response.passed,
      skillBreakdown: payload?.skillBreakdown || [],
      strengths: payload?.strengths || [],
      weakAreas: payload?.weakAreas || [],
      questionReview: payload?.questionReview || [],
      completedAt: response.completedAt,
    };
  }
}

export const assessmentService = new AssessmentService();
