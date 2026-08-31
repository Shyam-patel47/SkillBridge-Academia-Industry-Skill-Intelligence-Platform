import { AuditAction, ProficiencyLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { UpdateStudentProfileInput } from "./student.schema.js";
import { AppError } from "../../middleware/error.middleware.js";

export class StudentService {
  /**
   * Fetch student profile for the authenticated user
   */
  async getProfileByUserId(userId: string) {
    let student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
            createdAt: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: {
            score: "desc",
          },
        },
        projects: {
          orderBy: { createdAt: "desc" },
        },
        certifications: {
          orderBy: { issueDate: "desc" },
        },
        portfolio: true,
        institution: {
          select: {
            id: true,
            institutionName: true,
            code: true,
            location: true,
          },
        },
      },
    });

    // Auto-create student profile if user has role STUDENT but profile doesn't exist
    if (!student) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        const error: AppError = new Error("User account not found.");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
      }

      student = await prisma.student.create({
        data: {
          userId,
          fullName: user.email.split("@")[0],
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isVerified: true,
              createdAt: true,
            },
          },
          skills: {
            include: {
              skill: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
          projects: true,
          certifications: true,
          portfolio: true,
          institution: true,
        },
      });
    }

    return student;
  }

  /**
   * Update student profile fields and optionally synchronize selected skills
   */
  async updateProfileByUserId(
    userId: string,
    input: UpdateStudentProfileInput,
  ) {
    const student = await this.getProfileByUserId(userId);

    const { selectedSkillIds, ...profileData } = input;

    // Perform update in a transaction
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // 1. Update Student Table
      const updated = await tx.student.update({
        where: { id: student.id },
        data: {
          ...(profileData.fullName !== undefined && {
            fullName: profileData.fullName,
          }),
          ...(profileData.headline !== undefined && {
            headline: profileData.headline,
          }),
          ...(profileData.phone !== undefined && { phone: profileData.phone }),
          ...(profileData.location !== undefined && {
            location: profileData.location,
          }),
          ...(profileData.college !== undefined && {
            college: profileData.college,
          }),
          ...(profileData.branch !== undefined && {
            branch: profileData.branch,
          }),
          ...(profileData.gradYear !== undefined && {
            gradYear: profileData.gradYear,
          }),
          ...(profileData.cgpa !== undefined && { cgpa: profileData.cgpa }),
          ...(profileData.bio !== undefined && { bio: profileData.bio }),
          ...(profileData.careerInterests !== undefined && {
            careerInterests: profileData.careerInterests,
          }),
          ...(profileData.preferredLocations !== undefined && {
            preferredLocations: profileData.preferredLocations,
          }),
          ...(profileData.workModePref !== undefined && {
            workModePref: profileData.workModePref,
          }),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isVerified: true,
            },
          },
          skills: {
            include: {
              skill: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });

      // 2. Synchronize Skills if selectedSkillIds provided
      if (selectedSkillIds && Array.isArray(selectedSkillIds)) {
        // Fetch existing student skills
        const existingStudentSkills = await tx.studentSkill.findMany({
          where: { studentId: student.id },
        });

        const existingSkillIds = new Set(
          existingStudentSkills.map((s) => s.skillId),
        );
        const newSkillIds = new Set(selectedSkillIds);

        // Add newly selected skills with default beginner score if not yet assessed
        for (const skillId of selectedSkillIds) {
          if (!existingSkillIds.has(skillId)) {
            await tx.studentSkill.create({
              data: {
                studentId: student.id,
                skillId,
                score: 50.0, // Initial self-declared baseline score
                proficiency: ProficiencyLevel.INTERMEDIATE,
                isVerified: false,
              },
            });
          }
        }
      }

      // 3. Record Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entityType: "StudentProfile",
          entityId: student.id,
          details: { updatedFields: Object.keys(input) },
        },
      });

      return updated;
    });

    // Re-fetch complete profile
    return this.getProfileByUserId(userId);
  }

  /**
   * Fetch detailed verified skills summary, categories, strengths and weak areas
   */
  async getStudentSkillsSummary(userId: string) {
    const student = await this.getProfileByUserId(userId);

    const studentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: {
        skill: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        },
      },
      orderBy: { score: "desc" },
    });

    if (studentSkills.length === 0) {
      return {
        overallScore: 0,
        totalSkills: 0,
        verifiedSkillsCount: 0,
        categories: [],
        technicalSkills: [],
        softSkills: [],
        strengths: [],
        weakSkills: [],
        recentAssessmentsCount: 0,
      };
    }

    // Overall mean score
    const totalScoreSum = studentSkills.reduce(
      (acc, curr) => acc + curr.score,
      0,
    );
    const overallScore = Number(
      (totalScoreSum / studentSkills.length).toFixed(1),
    );
    const verifiedSkillsCount = studentSkills.filter(
      (s) => s.isVerified,
    ).length;

    // Group by category
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        categorySlug: string;
        icon?: string | null;
        totalScore: number;
        skills: Array<{
          id: string;
          skillId: string;
          name: string;
          slug: string;
          score: number;
          proficiency: ProficiencyLevel;
          isVerified: boolean;
          lastAssessedAt: Date | null;
        }>;
      }
    >();

    for (const ss of studentSkills) {
      const cat = ss.skill.category;
      if (!categoryMap.has(cat.id)) {
        categoryMap.set(cat.id, {
          categoryId: cat.id,
          categoryName: cat.name,
          categorySlug: cat.slug,
          icon: cat.icon,
          totalScore: 0,
          skills: [],
        });
      }

      const c = categoryMap.get(cat.id)!;
      c.totalScore += ss.score;
      c.skills.push({
        id: ss.id,
        skillId: ss.skill.id,
        name: ss.skill.name,
        slug: ss.skill.slug,
        score: ss.score,
        proficiency: ss.proficiency,
        isVerified: ss.isVerified,
        lastAssessedAt: ss.lastAssessedAt,
      });
    }

    const categories = Array.from(categoryMap.values()).map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      categorySlug: c.categorySlug,
      icon: c.icon,
      averageScore: Number((c.totalScore / c.skills.length).toFixed(1)),
      skillCount: c.skills.length,
      skills: c.skills,
    }));

    // Soft vs Technical segmentation
    const softSkillSlugs = new Set([
      "soft-skills",
      "aptitude",
      "communication",
    ]);

    const softSkills = studentSkills
      .filter((s) => softSkillSlugs.has(s.skill.category.slug))
      .map((s) => ({
        id: s.id,
        skillId: s.skill.id,
        name: s.skill.name,
        category: s.skill.category.name,
        score: s.score,
        proficiency: s.proficiency,
        isVerified: s.isVerified,
        lastAssessedAt: s.lastAssessedAt,
      }));

    const technicalSkills = studentSkills
      .filter((s) => !softSkillSlugs.has(s.skill.category.slug))
      .map((s) => ({
        id: s.id,
        skillId: s.skill.id,
        name: s.skill.name,
        category: s.skill.category.name,
        score: s.score,
        proficiency: s.proficiency,
        isVerified: s.isVerified,
        lastAssessedAt: s.lastAssessedAt,
      }));

    // Strengths (>= 75%) and Weak Skills (< 60%)
    const strengths = studentSkills
      .filter((s) => s.score >= 75)
      .map((s) => ({
        id: s.id,
        skillId: s.skill.id,
        name: s.skill.name,
        category: s.skill.category.name,
        score: s.score,
        proficiency: s.proficiency,
        isVerified: s.isVerified,
      }));

    const weakSkills = studentSkills
      .filter((s) => s.score < 60)
      .map((s) => ({
        id: s.id,
        skillId: s.skill.id,
        name: s.skill.name,
        category: s.skill.category.name,
        score: s.score,
        proficiency: s.proficiency,
        isVerified: s.isVerified,
      }));

    const recentAssessmentsCount = await prisma.assessmentResponse.count({
      where: { studentId: student.id },
    });

    return {
      overallScore,
      totalSkills: studentSkills.length,
      verifiedSkillsCount,
      categories,
      technicalSkills,
      softSkills,
      strengths,
      weakSkills,
      recentAssessmentsCount,
    };
  }

  /**
   * Fetch chronological assessment and skill advancement history
   */
  async getStudentSkillHistory(userId: string) {
    const student = await this.getProfileByUserId(userId);

    const responses = await prisma.assessmentResponse.findMany({
      where: { studentId: student.id },
      orderBy: { completedAt: "desc" },
      include: {
        assessment: {
          include: {
            category: true,
          },
        },
      },
    });

    return responses.map((r) => {
      const payload = r.answersJson as any;
      return {
        id: r.id,
        assessmentId: r.assessmentId,
        title: r.assessment.title,
        slug: r.assessment.slug,
        category: r.assessment.category.name,
        score: r.score,
        totalQuestions: r.totalQuestions,
        correctAnswers: r.correctAnswers,
        percentage: r.percentage,
        passed: r.passed,
        completedAt: r.completedAt,
        skillBreakdown: payload?.skillBreakdown || [],
      };
    });
  }

  /**
   * Fetch public view of student profile by student ID
   */
  async getProfileById(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            score: "desc",
          },
        },
        projects: {
          orderBy: { createdAt: "desc" },
        },
        certifications: {
          orderBy: { issueDate: "desc" },
        },
        portfolio: true,
      },
    });

    if (!student) {
      const error: AppError = new Error("Student profile not found.");
      error.statusCode = 404;
      error.code = "STUDENT_NOT_FOUND";
      throw error;
    }

    return student;
  }
}

export const studentService = new StudentService();
