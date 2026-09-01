import { ApplicationStatus, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";

export interface SkillDemandSupplyMatrixItem {
  skillId: string;
  skillName: string;
  skillSlug: string;
  category: string;
  industryDemandPercentage: number;
  studentSupplyPercentage: number;
  gapPercentage: number;
  status: "HIGH_DEFICIT" | "MODERATE_GAP" | "BALANCED" | "SURPLUS";
  opportunityCount: number;
  competentStudentsCount: number;
  averageStudentScore: number;
}

export class InstitutionService {
  /**
   * Get institution profile by authenticated user ID
   */
  async getProfileByUserId(userId: string) {
    const institution = await prisma.institution.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, role: true } },
      },
    });

    if (!institution) {
      const error: AppError = new Error("Institution profile not found.");
      error.statusCode = 404;
      error.code = "INSTITUTION_NOT_FOUND";
      throw error;
    }

    return institution;
  }

  /**
   * Calculate real aggregate institution analytics from actual database records
   */
  async getInstitutionAnalytics(userId: string, userRole: string) {
    let institution = null;

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      institution = await prisma.institution.findUnique({
        where: { userId },
      });
    }

    // Build student filter: scope to institution if available
    const studentFilter: any = {};
    if (institution) {
      studentFilter.OR = [
        { institutionId: institution.id },
        {
          college: {
            contains: institution.institutionName,
            mode: "insensitive",
          },
        },
      ];
    }

    // 1. Overview Student Counts & Academic Metrics
    const [totalStudents, assessedStudents, totalAssessmentsTaken, avgCgpaAgg] =
      await Promise.all([
        prisma.student.count({ where: studentFilter }),
        prisma.student.count({
          where: {
            ...studentFilter,
            skills: { some: {} },
          },
        }),
        prisma.assessmentResponse.count({
          where: studentFilter.OR ? { student: studentFilter } : {},
        }),
        prisma.student.aggregate({
          where: studentFilter,
          _avg: { cgpa: true },
        }),
      ]);

    const participationRate =
      totalStudents > 0
        ? Math.round((assessedStudents / totalStudents) * 100)
        : 0;
    const averageCgpa = avgCgpaAgg._avg.cgpa
      ? Number(avgCgpaAgg._avg.cgpa.toFixed(2))
      : 0;

    // 2. Industry Skill Demand vs Student Skill Supply Engine
    const totalActiveOpportunities = await prisma.opportunity.count({
      where: { isActive: true },
    });

    const [oppRequiredSkills, studentSkillsList, allSkillCategories] =
      await Promise.all([
        prisma.opportunitySkill.findMany({
          where: { opportunity: { isActive: true } },
          include: {
            skill: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        }),
        prisma.studentSkill.findMany({
          where: { student: studentFilter },
          include: {
            skill: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        }),
        prisma.skillCategory.findMany({
          include: {
            skills: { select: { id: true, name: true, slug: true } },
          },
        }),
      ]);

    // Aggregate Industry Demand per skill
    const oppCountPerSkill = new Map<string, { count: number; skill: any }>();
    for (const req of oppRequiredSkills) {
      const existing = oppCountPerSkill.get(req.skillId);
      if (existing) {
        existing.count += 1;
      } else {
        oppCountPerSkill.set(req.skillId, { count: 1, skill: req.skill });
      }
    }

    // Aggregate Student Supply per skill
    const studentSupplyPerSkill = new Map<
      string,
      { competentCount: number; totalScore: number; count: number; skill: any }
    >();

    for (const ss of studentSkillsList) {
      const existing = studentSupplyPerSkill.get(ss.skillId);
      const isCompetent = ss.score >= 50 || ss.isVerified;
      if (existing) {
        existing.count += 1;
        existing.totalScore += ss.score;
        if (isCompetent) existing.competentCount += 1;
      } else {
        studentSupplyPerSkill.set(ss.skillId, {
          count: 1,
          totalScore: ss.score,
          competentCount: isCompetent ? 1 : 0,
          skill: ss.skill,
        });
      }
    }

    // Collect all distinct skill IDs
    const allDistinctSkillIds = new Set<string>([
      ...Array.from(oppCountPerSkill.keys()),
      ...Array.from(studentSupplyPerSkill.keys()),
    ]);

    const demandSupplyMatrix: SkillDemandSupplyMatrixItem[] = [];

    allDistinctSkillIds.forEach((skillId) => {
      const oppData = oppCountPerSkill.get(skillId);
      const studentData = studentSupplyPerSkill.get(skillId);
      const skillRef = oppData?.skill || studentData?.skill;

      if (!skillRef) return;

      const oppCount = oppData?.count || 0;
      const competentCount = studentData?.competentCount || 0;
      const totalEvaluated = studentData?.count || 0;
      const avgScore =
        totalEvaluated > 0
          ? Math.round(studentData!.totalScore / totalEvaluated)
          : 0;

      // Industry Demand % = (Opportunities requiring skill / Total Active Opportunities) * 100
      const industryDemandPercentage =
        totalActiveOpportunities > 0
          ? Math.round((oppCount / totalActiveOpportunities) * 100)
          : 0;

      // Student Supply % = (Competent Students / Assessed Students) * 100
      const studentSupplyPercentage =
        assessedStudents > 0
          ? Math.round((competentCount / assessedStudents) * 100)
          : 0;

      const gap = Math.max(
        0,
        industryDemandPercentage - studentSupplyPercentage,
      );

      let status: "HIGH_DEFICIT" | "MODERATE_GAP" | "BALANCED" | "SURPLUS" =
        "BALANCED";
      if (industryDemandPercentage > studentSupplyPercentage) {
        status = gap >= 15 ? "HIGH_DEFICIT" : "MODERATE_GAP";
      } else if (studentSupplyPercentage > industryDemandPercentage + 10) {
        status = "SURPLUS";
      }

      demandSupplyMatrix.push({
        skillId,
        skillName: skillRef.name,
        skillSlug: skillRef.slug,
        category: skillRef.category?.name || "General",
        industryDemandPercentage,
        studentSupplyPercentage,
        gapPercentage: gap,
        status,
        opportunityCount: oppCount,
        competentStudentsCount: competentCount,
        averageStudentScore: avgScore,
      });
    });

    // Sort by Industry Demand descending, then Gap descending
    demandSupplyMatrix.sort(
      (a, b) =>
        b.industryDemandPercentage - a.industryDemandPercentage ||
        b.gapPercentage - a.gapPercentage,
    );

    // 3. Category Competency Breakdown
    const categoryBreakdown = allSkillCategories.map((cat) => {
      const catSkillIds = new Set(cat.skills.map((s) => s.id));
      const catStudentSkills = studentSkillsList.filter((ss) =>
        catSkillIds.has(ss.skillId),
      );

      const avgScore =
        catStudentSkills.length > 0
          ? Math.round(
              catStudentSkills.reduce((acc, curr) => acc + curr.score, 0) /
                catStudentSkills.length,
            )
          : 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        slug: cat.slug,
        skillCount: cat.skills.length,
        evaluatedCount: catStudentSkills.length,
        averageScore: avgScore,
      };
    });

    // 4. Internship & Application Statistics
    const [
      totalApplications,
      appliedCount,
      shortlistedCount,
      interviewCount,
      offersCount,
      rejectedCount,
      withdrawnCount,
    ] = await Promise.all([
      prisma.application.count({
        where: studentFilter.OR ? { student: studentFilter } : {},
      }),
      prisma.application.count({
        where: {
          ...(studentFilter.OR ? { student: studentFilter } : {}),
          status: ApplicationStatus.APPLIED,
        },
      }),
      prisma.application.count({
        where: {
          ...(studentFilter.OR ? { student: studentFilter } : {}),
          status: ApplicationStatus.SHORTLISTED,
        },
      }),
      prisma.application.count({
        where: {
          ...(studentFilter.OR ? { student: studentFilter } : {}),
          status: ApplicationStatus.INTERVIEW,
        },
      }),
      prisma.application.count({
        where: {
          ...(studentFilter.OR ? { student: studentFilter } : {}),
          status: {
            in: [
              ApplicationStatus.OFFER,
              ApplicationStatus.OFFERED,
              ApplicationStatus.JOINED,
            ],
          },
        },
      }),
      prisma.application.count({
        where: {
          ...(studentFilter.OR ? { student: studentFilter } : {}),
          status: ApplicationStatus.REJECTED,
        },
      }),
      prisma.application.count({
        where: {
          ...(studentFilter.OR ? { student: studentFilter } : {}),
          status: ApplicationStatus.WITHDRAWN,
        },
      }),
    ]);

    const shortlistRate =
      totalApplications > 0
        ? Math.round(
            ((shortlistedCount + interviewCount + offersCount) /
              totalApplications) *
              100,
          )
        : 0;

    const placementRate =
      totalStudents > 0 ? Math.round((offersCount / totalStudents) * 100) : 0;

    // 5. Top Hiring Partners List (from student applications with offers/joined)
    const placedApps = await prisma.application.findMany({
      where: {
        ...(studentFilter.OR ? { student: studentFilter } : {}),
        status: {
          in: [
            ApplicationStatus.OFFER,
            ApplicationStatus.OFFERED,
            ApplicationStatus.JOINED,
          ],
        },
      },
      include: {
        opportunity: {
          include: {
            company: {
              select: {
                id: true,
                companyName: true,
                industry: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    const companyPlacementMap = new Map<
      string,
      { company: any; offersCount: number }
    >();
    for (const app of placedApps) {
      const company = app.opportunity.company;
      const existing = companyPlacementMap.get(company.id);
      if (existing) {
        existing.offersCount += 1;
      } else {
        companyPlacementMap.set(company.id, { company, offersCount: 1 });
      }
    }

    const topHiringPartners = Array.from(companyPlacementMap.values()).sort(
      (a, b) => b.offersCount - a.offersCount,
    );

    // 6. Actionable Curriculum Recommendations based on detected deficits
    const curriculumRecommendations = demandSupplyMatrix
      .filter(
        (item) =>
          item.status === "HIGH_DEFICIT" || item.status === "MODERATE_GAP",
      )
      .slice(0, 5)
      .map((item) => ({
        skillName: item.skillName,
        category: item.category,
        industryDemand: item.industryDemandPercentage,
        studentSupply: item.studentSupplyPercentage,
        deficit: item.gapPercentage,
        recommendation: `Industry demand for ${item.skillName} is ${item.industryDemandPercentage}% vs institutional student supply of ${item.studentSupplyPercentage}% (Deficit: ${item.gapPercentage}%). Recommend introducing specialized hands-on modules or dedicated benchmark bootcamps in ${item.category}.`,
      }));

    return {
      institution: institution
        ? {
            id: institution.id,
            name: institution.institutionName,
            code: institution.code,
            location: institution.location,
            isVerified: institution.isVerified,
          }
        : {
            id: "global-scope",
            name: "All Enrolled Institutions (Global Overview)",
            code: "GLOBAL",
            location: "National Intelligence Grid",
            isVerified: true,
          },
      overview: {
        totalStudents,
        assessedStudents,
        participationRate,
        totalAssessmentsTaken,
        averageCgpa,
        totalActiveOpportunities,
      },
      demandSupplyMatrix,
      categoryBreakdown,
      applications: {
        totalApplications,
        appliedCount,
        shortlistedCount,
        interviewCount,
        offersCount,
        rejectedCount,
        withdrawnCount,
        shortlistRate,
        placementRate,
      },
      topHiringPartners,
      curriculumRecommendations,
    };
  }
}

export const institutionService = new InstitutionService();
