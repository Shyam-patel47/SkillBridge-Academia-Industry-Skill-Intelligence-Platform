import {
  AuditAction,
  OpportunityType,
  WorkMode,
  UserRole,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { companyService } from "../companies/company.service.js";
import { studentService } from "../students/student.service.js";
import {
  CreateOpportunityInput,
  UpdateOpportunityInput,
} from "./opportunity.schema.js";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export interface StudentOpportunityMatchItem {
  id: string;
  title: string;
  slug: string;
  type: OpportunityType;
  description: string;
  workMode: WorkMode;
  location: string | null;
  minCgpa: number;
  eligibleBranches: string[];
  eligibleGradYears: number[];
  duration: string | null;
  stipendSalary: string | null;
  deadline: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  company: {
    id: string;
    companyName: string;
    industry: string | null;
    website: string | null;
    logoUrl: string | null;
    location: string | null;
    description: string | null;
    isVerified: boolean;
  };
  compatibilityScore: number; // 0 - 100
  matchFit: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING";
  explanation: string;
  academicEligibility: {
    isEligible: boolean;
    cgpaMet: boolean;
    branchMet: boolean;
    gradYearMet: boolean;
    details: {
      studentCgpa: number | null;
      requiredCgpa: number;
      studentBranch: string | null;
      studentGradYear: number | null;
    };
  };
  matchingSkills: Array<{
    skillId: string;
    skillName: string;
    categoryName?: string;
    studentScore: number;
    benchmarkScore: number;
    isMandatory: boolean;
    isSatisfied: boolean;
  }>;
  gapSkills: Array<{
    skillId: string;
    skillName: string;
    categoryName?: string;
    studentScore: number;
    benchmarkScore: number;
    gapPoints: number;
    isMandatory: boolean;
  }>;
  requiredSkills: Array<{
    id: string;
    skillId: string;
    skillName: string;
    skillSlug: string;
    categoryName?: string;
    minScore: number;
    isMandatory: boolean;
    weight: number;
  }>;
}

export class OpportunityService {
  /**
   * List opportunities owned by the authenticated company
   */
  async getCompanyOpportunities(
    userId: string,
    filters?: { status?: string; search?: string; type?: string },
  ) {
    const company = await companyService.getProfileByUserId(userId);

    const where: any = {
      companyId: company.id,
    };

    if (filters?.status === "active") {
      where.isActive = true;
    } else if (filters?.status === "inactive") {
      where.isActive = false;
    }

    if (filters?.type && filters.type !== "ALL") {
      where.type = filters.type as OpportunityType;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requiredSkills: {
          include: {
            skill: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return opportunities.map((o) => ({
      id: o.id,
      title: o.title,
      slug: o.slug,
      type: o.type,
      description: o.description,
      workMode: o.workMode,
      location: o.location,
      minCgpa: o.minCgpa,
      eligibleBranches: o.eligibleBranches,
      eligibleGradYears: o.eligibleGradYears,
      duration: o.duration,
      stipendSalary: o.stipendSalary,
      deadline: o.deadline,
      isActive: o.isActive,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      applicationsCount: o._count.applications,
      requiredSkills: o.requiredSkills.map((rs) => ({
        id: rs.id,
        skillId: rs.skillId,
        skillName: rs.skill.name,
        skillSlug: rs.skill.slug,
        categoryName: rs.skill.category?.name,
        minScore: rs.minScore,
        isMandatory: rs.isMandatory,
        weight: rs.weight,
      })),
    }));
  }

  /**
   * Fetch single opportunity by ID or slug
   */
  async getOpportunityById(
    idOrSlug: string,
    userId?: string,
    userRole?: string,
  ) {
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            website: true,
            logoUrl: true,
            location: true,
            description: true,
            isVerified: true,
          },
        },
        requiredSkills: {
          include: {
            skill: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!opportunity) {
      const error: AppError = new Error("Opportunity not found.");
      error.statusCode = 404;
      error.code = "OPPORTUNITY_NOT_FOUND";
      throw error;
    }

    return {
      id: opportunity.id,
      title: opportunity.title,
      slug: opportunity.slug,
      type: opportunity.type,
      description: opportunity.description,
      workMode: opportunity.workMode,
      location: opportunity.location,
      minCgpa: opportunity.minCgpa,
      eligibleBranches: opportunity.eligibleBranches,
      eligibleGradYears: opportunity.eligibleGradYears,
      duration: opportunity.duration,
      stipendSalary: opportunity.stipendSalary,
      deadline: opportunity.deadline,
      isActive: opportunity.isActive,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      company: opportunity.company,
      applicationsCount: opportunity._count.applications,
      requiredSkills: opportunity.requiredSkills.map((rs) => ({
        id: rs.id,
        skillId: rs.skillId,
        skillName: rs.skill.name,
        skillSlug: rs.skill.slug,
        categoryName: rs.skill.category?.name,
        minScore: rs.minScore,
        isMandatory: rs.isMandatory,
        weight: rs.weight,
      })),
    };
  }

  /**
   * Student Opportunity Feed with Deterministic Compatibility Scoring & Eligibility
   */
  async getStudentOpportunityFeed(
    userId: string,
    filters?: {
      search?: string;
      type?: string;
      skillId?: string;
      location?: string;
      workMode?: string;
      eligibilityOnly?: boolean;
      sortBy?: "match" | "recent" | "deadline";
    },
  ): Promise<{
    opportunities: StudentOpportunityMatchItem[];
    totalCount: number;
  }> {
    const student = await studentService.getProfileByUserId(userId);

    // 1. Fetch Student's competency records
    const studentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: {
        skill: { select: { id: true, name: true, slug: true } },
      },
    });

    const studentScoreMap = new Map<string, number>();
    for (const ss of studentSkills) {
      studentScoreMap.set(ss.skillId, ss.score);
      studentScoreMap.set(ss.skill.name.toLowerCase().trim(), ss.score);
    }

    // 2. Build where filter for active opportunities
    const where: any = {
      isActive: true,
    };

    if (filters?.type && filters.type !== "ALL") {
      where.type = filters.type as OpportunityType;
    }

    if (filters?.workMode && filters.workMode !== "ALL") {
      where.workMode = filters.workMode as WorkMode;
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    if (filters?.skillId) {
      where.requiredSkills = {
        some: { skillId: filters.skillId },
      };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        {
          company: {
            companyName: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            website: true,
            logoUrl: true,
            location: true,
            description: true,
            isVerified: true,
          },
        },
        requiredSkills: {
          include: {
            skill: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Compute Deterministic Compatibility Score & Eligibility for each opportunity
    const matchedOpportunities: StudentOpportunityMatchItem[] = [];

    for (const opp of opportunities) {
      let weightedFulfillmentSum = 0;
      let totalWeights = 0;
      const matchingSkills: any[] = [];
      const gapSkills: any[] = [];

      for (const rs of opp.requiredSkills) {
        const studentScore =
          studentScoreMap.get(rs.skillId) ||
          studentScoreMap.get(rs.skill.name.toLowerCase().trim()) ||
          0;
        const benchmarkScore = rs.minScore;

        const fulfillmentRatio = Math.min(1.0, studentScore / benchmarkScore);
        const weightMultiplier = rs.weight * (rs.isMandatory ? 1.5 : 1.0);

        weightedFulfillmentSum += fulfillmentRatio * weightMultiplier;
        totalWeights += weightMultiplier;

        if (studentScore >= benchmarkScore) {
          matchingSkills.push({
            skillId: rs.skillId,
            skillName: rs.skill.name,
            categoryName: rs.skill.category?.name,
            studentScore,
            benchmarkScore,
            isMandatory: rs.isMandatory,
            isSatisfied: true,
          });
        } else {
          const gapPoints = Math.max(
            0,
            Number((benchmarkScore - studentScore).toFixed(1)),
          );
          gapSkills.push({
            skillId: rs.skillId,
            skillName: rs.skill.name,
            categoryName: rs.skill.category?.name,
            studentScore,
            benchmarkScore,
            gapPoints,
            isMandatory: rs.isMandatory,
          });
        }
      }

      const compatibilityScore =
        totalWeights > 0
          ? Math.round((weightedFulfillmentSum / totalWeights) * 100)
          : 0;

      const matchFit: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING" =
        compatibilityScore >= 80
          ? "HIGH_FIT"
          : compatibilityScore >= 50
            ? "MODERATE_FIT"
            : "DEVELOPING";

      // Academic Eligibility checks
      const requiredCgpa = opp.minCgpa ?? 0;
      const cgpaMet =
        requiredCgpa === 0 ||
        (student.cgpa !== null && student.cgpa >= requiredCgpa);
      const branchMet =
        opp.eligibleBranches.length === 0 ||
        (student.branch !== null &&
          opp.eligibleBranches.some(
            (b) =>
              b.toLowerCase().includes(student.branch!.toLowerCase()) ||
              student.branch!.toLowerCase().includes(b.toLowerCase()),
          ));
      const gradYearMet =
        opp.eligibleGradYears.length === 0 ||
        (student.gradYear !== null &&
          opp.eligibleGradYears.includes(student.gradYear));

      const isEligible = Boolean(cgpaMet && branchMet && gradYearMet);

      // Filter if eligibilityOnly is requested
      if (filters?.eligibilityOnly && !isEligible) {
        continue;
      }

      // Generate explainable rationale
      let explanation = "";
      if (compatibilityScore >= 80) {
        explanation = `Strong alignment! You meet or exceed industry proficiency benchmarks across ${matchingSkills.length} of ${opp.requiredSkills.length} required competencies.`;
      } else if (compatibilityScore >= 50) {
        const topGaps = gapSkills
          .map((g) => g.skillName)
          .slice(0, 2)
          .join(", ");
        explanation = `Moderate match. You satisfy core requirements in ${matchingSkills
          .map((m) => m.skillName)
          .slice(0, 2)
          .join(
            ", ",
          )}, but need upskilling in ${topGaps} to reach target placement readiness.`;
      } else {
        const topMissing = gapSkills
          .map((g) => g.skillName)
          .slice(0, 3)
          .join(", ");
        explanation = `Skill gap detected. Priority upskilling in ${topMissing} is recommended before applying to maximize placement eligibility.`;
      }

      matchedOpportunities.push({
        id: opp.id,
        title: opp.title,
        slug: opp.slug,
        type: opp.type,
        description: opp.description,
        workMode: opp.workMode,
        location: opp.location,
        minCgpa: requiredCgpa,
        eligibleBranches: opp.eligibleBranches,
        eligibleGradYears: opp.eligibleGradYears,
        duration: opp.duration,
        stipendSalary: opp.stipendSalary,
        deadline: opp.deadline,
        isActive: opp.isActive,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        company: opp.company,
        compatibilityScore,
        matchFit,
        explanation,
        academicEligibility: {
          isEligible,
          cgpaMet: Boolean(cgpaMet),
          branchMet: Boolean(branchMet),
          gradYearMet: Boolean(gradYearMet),
          details: {
            studentCgpa: student.cgpa,
            requiredCgpa,
            studentBranch: student.branch,
            studentGradYear: student.gradYear,
          },
        },
        matchingSkills,
        gapSkills,
        requiredSkills: opp.requiredSkills.map((rs) => ({
          id: rs.id,
          skillId: rs.skillId,
          skillName: rs.skill.name,
          skillSlug: rs.skill.slug,
          categoryName: rs.skill.category?.name,
          minScore: rs.minScore,
          isMandatory: rs.isMandatory,
          weight: rs.weight,
        })),
      });
    }

    // 4. Sorting
    if (filters?.sortBy === "recent") {
      matchedOpportunities.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (filters?.sortBy === "deadline") {
      matchedOpportunities.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
    } else {
      // Default: Sort by compatibility score descending, then eligible first
      matchedOpportunities.sort((a, b) => {
        if (b.compatibilityScore !== a.compatibilityScore) {
          return b.compatibilityScore - a.compatibilityScore;
        }
        return (
          (b.academicEligibility.isEligible ? 1 : 0) -
          (a.academicEligibility.isEligible ? 1 : 0)
        );
      });
    }

    return {
      opportunities: matchedOpportunities,
      totalCount: matchedOpportunities.length,
    };
  }

  /**
   * Student Opportunity Detail with Compatibility Breakdown
   */
  async getStudentOpportunityDetail(
    idOrSlug: string,
    userId: string,
  ): Promise<StudentOpportunityMatchItem> {
    const feed = await this.getStudentOpportunityFeed(userId);
    const item = feed.opportunities.find(
      (o) => o.id === idOrSlug || o.slug === idOrSlug,
    );

    if (!item) {
      const error: AppError = new Error(
        "Opportunity not found or is currently inactive.",
      );
      error.statusCode = 404;
      error.code = "OPPORTUNITY_NOT_FOUND";
      throw error;
    }

    return item;
  }

  /**
   * Create a new Opportunity (Company only)
   */
  async createOpportunity(userId: string, input: CreateOpportunityInput) {
    const company = await companyService.getProfileByUserId(userId);

    const baseSlug = input.slug || slugify(input.title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const created = await prisma.$transaction(async (tx) => {
      const opportunity = await tx.opportunity.create({
        data: {
          companyId: company.id,
          title: input.title,
          slug: uniqueSlug,
          type: input.type,
          description: input.description,
          workMode: input.workMode,
          location: input.location,
          minCgpa: input.minCgpa,
          eligibleBranches: input.eligibleBranches || [],
          eligibleGradYears: input.eligibleGradYears || [],
          duration: input.duration,
          stipendSalary: input.stipendSalary,
          deadline: input.deadline,
          isActive: input.isActive !== undefined ? input.isActive : true,
          requiredSkills: {
            create: input.requiredSkills.map((rs) => ({
              skillId: rs.skillId,
              minScore: rs.minScore,
              isMandatory: rs.isMandatory,
              weight: rs.weight,
            })),
          },
        },
        include: {
          company: true,
          requiredSkills: {
            include: {
              skill: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE,
          entityType: "Opportunity",
          entityId: opportunity.id,
          details: {
            title: opportunity.title,
            companyName: company.companyName,
          },
        },
      });

      return opportunity;
    });

    return created;
  }

  /**
   * Update an existing Opportunity (Enforces ownership)
   */
  async updateOpportunity(
    id: string,
    userId: string,
    userRole: string,
    input: UpdateOpportunityInput,
  ) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!opportunity) {
      const error: AppError = new Error("Opportunity not found.");
      error.statusCode = 404;
      error.code = "OPPORTUNITY_NOT_FOUND";
      throw error;
    }

    // Enforce Company Ownership
    if (userRole !== UserRole.SUPER_ADMIN) {
      const company = await companyService.getProfileByUserId(userId);
      if (opportunity.companyId !== company.id) {
        const error: AppError = new Error(
          "You do not have permission to modify this opportunity.",
        );
        error.statusCode = 403;
        error.code = "FORBIDDEN_OPPORTUNITY_ACCESS";
        throw error;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If skills list provided, recreate associations
      if (input.requiredSkills && Array.isArray(input.requiredSkills)) {
        await tx.opportunitySkill.deleteMany({ where: { opportunityId: id } });
        await tx.opportunitySkill.createMany({
          data: input.requiredSkills.map((rs) => ({
            opportunityId: id,
            skillId: rs.skillId,
            minScore: rs.minScore,
            isMandatory: rs.isMandatory,
            weight: rs.weight,
          })),
        });
      }

      const opp = await tx.opportunity.update({
        where: { id },
        data: {
          ...(input.title && { title: input.title }),
          ...(input.type && { type: input.type }),
          ...(input.description && { description: input.description }),
          ...(input.workMode && { workMode: input.workMode }),
          ...(input.location !== undefined && { location: input.location }),
          ...(input.minCgpa !== undefined && { minCgpa: input.minCgpa }),
          ...(input.eligibleBranches && {
            eligibleBranches: input.eligibleBranches,
          }),
          ...(input.eligibleGradYears && {
            eligibleGradYears: input.eligibleGradYears,
          }),
          ...(input.duration !== undefined && { duration: input.duration }),
          ...(input.stipendSalary !== undefined && {
            stipendSalary: input.stipendSalary,
          }),
          ...(input.deadline !== undefined && { deadline: input.deadline }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          company: true,
          requiredSkills: {
            include: {
              skill: true,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entityType: "Opportunity",
          entityId: id,
          details: { updatedFields: Object.keys(input) },
        },
      });

      return opp;
    });

    return updated;
  }

  /**
   * Toggle publish / unpublish status
   */
  async togglePublish(
    id: string,
    userId: string,
    userRole: string,
    isActive: boolean,
  ) {
    return this.updateOpportunity(id, userId, userRole, { isActive });
  }

  /**
   * Delete an Opportunity (Enforces ownership)
   */
  async deleteOpportunity(id: string, userId: string, userRole: string) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      const error: AppError = new Error("Opportunity not found.");
      error.statusCode = 404;
      error.code = "OPPORTUNITY_NOT_FOUND";
      throw error;
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      const company = await companyService.getProfileByUserId(userId);
      if (opportunity.companyId !== company.id) {
        const error: AppError = new Error(
          "You do not have permission to delete this opportunity.",
        );
        error.statusCode = 403;
        error.code = "FORBIDDEN_OPPORTUNITY_ACCESS";
        throw error;
      }
    }

    await prisma.opportunity.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.DELETE,
        entityType: "Opportunity",
        entityId: id,
        details: { title: opportunity.title },
      },
    });

    return { deleted: true, id, title: opportunity.title };
  }

  /**
   * Public list of active opportunities
   */
  async getPublicOpportunities(filters?: {
    search?: string;
    type?: string;
    workMode?: string;
    location?: string;
  }) {
    const where: any = {
      isActive: true,
    };

    if (filters?.type && filters.type !== "ALL") {
      where.type = filters.type as OpportunityType;
    }

    if (filters?.workMode && filters.workMode !== "ALL") {
      where.workMode = filters.workMode as WorkMode;
    }

    if (filters?.location) {
      where.location = { contains: filters.location, mode: "insensitive" };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        {
          company: {
            companyName: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            location: true,
            logoUrl: true,
            isVerified: true,
          },
        },
        requiredSkills: {
          include: {
            skill: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    return opportunities;
  }
}

export const opportunityService = new OpportunityService();
