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
  ParseJobDescriptionInput,
} from "./opportunity.schema.js";
import {
  OpportunityMatchingEngine,
  OpportunityMatchResult,
  MatchFactorBreakdown,
  MatchingSkillDetail,
  MissingSkillDetail,
  StudentMatchProfile,
  OpportunityMatchInput,
} from "./opportunity-matching.engine.js";
import { JobDescriptionParserEngine } from "./jd-parser.engine.js";

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
  matchScore: number; // 0 - 100
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
  eligibilityResult: OpportunityMatchResult["eligibilityResult"];
  interestMatch: OpportunityMatchResult["interestMatch"];
  experienceMatch: OpportunityMatchResult["experienceMatch"];
  locationMatch: OpportunityMatchResult["locationMatch"];
  breakdown: MatchFactorBreakdown;
  matchingSkills: MatchingSkillDetail[];
  gapSkills: MissingSkillDetail[];
  missingSkills: MissingSkillDetail[];
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
      minCgpa: o.minCgpa ?? 0,
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
    _userId?: string,
    _userRole?: string,
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
      minCgpa: opportunity.minCgpa ?? 0,
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
   * Student Opportunity Discovery Feed with 5-Factor Matching & Compatibility Scoring
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

    // 1. Fetch Student's competency records, projects, certifications, and assessment attempts
    const studentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: {
        skill: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    const [projectCount, certCount, assessmentCount] = await Promise.all([
      prisma.project.count({ where: { studentId: student.id } }),
      prisma.certification.count({ where: { studentId: student.id } }),
      prisma.assessmentResponse.count({ where: { studentId: student.id } }),
    ]);

    const studentMatchProfile: StudentMatchProfile = {
      id: student.id,
      fullName: student.fullName,
      cgpa: student.cgpa,
      branch: student.branch,
      gradYear: student.gradYear,
      careerInterests: student.careerInterests || [],
      preferredLocations: student.preferredLocations || [],
      workModePref: student.workModePref,
      skills: studentSkills.map((ss) => ({
        skillId: ss.skillId,
        skillName: ss.skill.name,
        score: ss.score,
        categoryName: ss.skill.category?.name,
      })),
      projectCount,
      certificationCount: certCount,
      assessmentCount,
    };

    // 2. Query active opportunities
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

    // 3. Compute 5-Factor Opportunity Matching Engine Results
    const matchedOpportunities: StudentOpportunityMatchItem[] = [];

    for (const opp of opportunities) {
      const oppMatchInput: OpportunityMatchInput = {
        id: opp.id,
        title: opp.title,
        slug: opp.slug,
        type: opp.type,
        description: opp.description,
        workMode: opp.workMode,
        location: opp.location,
        minCgpa: opp.minCgpa ?? 0,
        eligibleBranches: opp.eligibleBranches,
        eligibleGradYears: opp.eligibleGradYears,
        duration: opp.duration,
        stipendSalary: opp.stipendSalary,
        deadline: opp.deadline,
        isActive: opp.isActive,
        createdAt: opp.createdAt,
        company: opp.company,
        requiredSkills: opp.requiredSkills.map((rs) => ({
          skillId: rs.skillId,
          skillName: rs.skill.name,
          skillSlug: rs.skill.slug,
          categoryName: rs.skill.category?.name,
          minScore: rs.minScore,
          isMandatory: rs.isMandatory,
          weight: rs.weight,
        })),
      };

      const matchResult = OpportunityMatchingEngine.calculateMatch(
        studentMatchProfile,
        oppMatchInput,
      );

      // Filter if eligibilityOnly is requested
      if (
        filters?.eligibilityOnly &&
        !matchResult.eligibilityResult.isEligible
      ) {
        continue;
      }

      matchedOpportunities.push({
        id: opp.id,
        title: opp.title,
        slug: opp.slug,
        type: opp.type,
        description: opp.description,
        workMode: opp.workMode,
        location: opp.location,
        minCgpa: opp.minCgpa ?? 0,
        eligibleBranches: opp.eligibleBranches,
        eligibleGradYears: opp.eligibleGradYears,
        duration: opp.duration,
        stipendSalary: opp.stipendSalary,
        deadline: opp.deadline,
        isActive: opp.isActive,
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        company: opp.company,
        compatibilityScore: matchResult.matchScore,
        matchScore: matchResult.matchScore,
        matchFit: matchResult.matchFit,
        explanation: matchResult.explanation,
        academicEligibility: {
          isEligible: matchResult.eligibilityResult.isEligible,
          cgpaMet: matchResult.eligibilityResult.cgpaMet,
          branchMet: matchResult.eligibilityResult.branchMet,
          gradYearMet: matchResult.eligibilityResult.gradYearMet,
          details: matchResult.eligibilityResult.details,
        },
        eligibilityResult: matchResult.eligibilityResult,
        interestMatch: matchResult.interestMatch,
        experienceMatch: matchResult.experienceMatch,
        locationMatch: matchResult.locationMatch,
        breakdown: matchResult.breakdown,
        matchingSkills: matchResult.matchingSkills,
        gapSkills: matchResult.missingSkills,
        missingSkills: matchResult.missingSkills,
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
      // Default: Sort by match score descending, then eligible first
      matchedOpportunities.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
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
   * Student Opportunity Detail with Full Multi-Factor Match Breakdown
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

  /**
   * Parse raw job description text and extract suggested required skills, proficiency, eligibility & metadata
   */
  async parseJobDescription(userId: string, input: ParseJobDescriptionInput) {
    // Verify recruiter company profile
    await companyService.getProfileByUserId(userId);

    // Fetch full skill taxonomy from database
    const taxonomySkills = await prisma.skill.findMany({
      include: {
        category: { select: { name: true } },
      },
    });

    const parsed = JobDescriptionParserEngine.parse(
      input.jobDescription,
      taxonomySkills,
    );
    return parsed;
  }
}

export const opportunityService = new OpportunityService();
