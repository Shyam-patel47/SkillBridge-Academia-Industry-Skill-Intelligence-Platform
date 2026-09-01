import {
  ApplicationStatus,
  AuditAction,
  NotificationType,
  UserRole,
} from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { studentService } from "../students/student.service.js";
import { companyService } from "../companies/company.service.js";
import {
  OpportunityMatchingEngine,
  StudentMatchProfile,
  OpportunityMatchInput,
} from "../opportunities/opportunity-matching.engine.js";
import {
  ApplyOpportunityInput,
  UpdateApplicationStatusInput,
} from "./application.schema.js";

export class ApplicationService {
  /**
   * Submit an application for an Opportunity (Student only)
   */
  async apply(userId: string, input: ApplyOpportunityInput) {
    const student = await studentService.getProfileByUserId(userId);

    // 1. Fetch Opportunity with full required skills and company details
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: input.opportunityId },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            industry: true,
            location: true,
            logoUrl: true,
            isVerified: true,
            userId: true,
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
    });

    if (!opportunity) {
      const error: AppError = new Error("Opportunity not found.");
      error.statusCode = 404;
      error.code = "OPPORTUNITY_NOT_FOUND";
      throw error;
    }

    if (!opportunity.isActive) {
      const error: AppError = new Error(
        "This opportunity is no longer accepting applications.",
      );
      error.statusCode = 400;
      error.code = "OPPORTUNITY_INACTIVE";
      throw error;
    }

    // 2. Check for duplicate application
    const existing = await prisma.application.findUnique({
      where: {
        opportunityId_studentId: {
          opportunityId: input.opportunityId,
          studentId: student.id,
        },
      },
    });

    if (existing) {
      const error: AppError = new Error(
        "You have already submitted an application for this opportunity.",
      );
      error.statusCode = 409;
      error.code = "DUPLICATE_APPLICATION";
      throw error;
    }

    // 3. Compute Real-Time 5-Factor Match Score Snapshot
    const studentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: { skill: { select: { id: true, name: true } } },
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
      })),
      projectCount,
      certificationCount: certCount,
      assessmentCount,
    };

    const oppMatchInput: OpportunityMatchInput = {
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
      company: opportunity.company,
      requiredSkills: opportunity.requiredSkills.map((rs) => ({
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

    const resumeToUse = input.resumeUrl || student.resumeUrl || null;

    // 4. Create Application record wrapped in transaction
    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.application.create({
        data: {
          opportunityId: input.opportunityId,
          studentId: student.id,
          status: ApplicationStatus.APPLIED,
          matchScore: matchResult.matchScore,
          matchBreakdown: matchResult as any,
          resumeUrl: resumeToUse,
          coverLetter: input.coverLetter || null,
        },
        include: {
          opportunity: {
            include: {
              company: true,
            },
          },
          student: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
      });

      // Notification for Student
      await tx.notification.create({
        data: {
          userId,
          title: "Application Submitted Successfully",
          message: `Your application for ${opportunity.title} at ${opportunity.company.companyName} has been received. Match score: ${matchResult.matchScore}%.`,
          type: NotificationType.APPLICATION_UPDATE,
          link: `/student/applications/${created.id}`,
        },
      });

      // Notification for Recruiter
      if (opportunity.company.userId) {
        await tx.notification.create({
          data: {
            userId: opportunity.company.userId,
            title: "New Candidate Application",
            message: `${student.fullName} (${matchResult.matchScore}% Match) applied for ${opportunity.title}.`,
            type: NotificationType.APPLICATION_UPDATE,
            link: `/industry/opportunities/${opportunity.id}/applicants`,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.CREATE,
          entityType: "Application",
          entityId: created.id,
          details: {
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title,
            companyName: opportunity.company.companyName,
            matchScore: matchResult.matchScore,
          },
        },
      });

      return created;
    });

    return application;
  }

  /**
   * List all applications submitted by the authenticated student
   */
  async getStudentApplications(
    userId: string,
    filters?: { status?: string; search?: string },
  ) {
    const student = await studentService.getProfileByUserId(userId);

    const where: any = {
      studentId: student.id,
    };

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as ApplicationStatus;
    }

    if (filters?.search) {
      where.opportunity = {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          {
            company: {
              companyName: { contains: filters.search, mode: "insensitive" },
            },
          },
        ],
      };
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { appliedAt: "desc" },
      include: {
        opportunity: {
          include: {
            company: {
              select: {
                id: true,
                companyName: true,
                industry: true,
                logoUrl: true,
                location: true,
                isVerified: true,
              },
            },
            requiredSkills: {
              include: {
                skill: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return applications.map((app) => ({
      id: app.id,
      opportunityId: app.opportunityId,
      status: app.status,
      matchScore: app.matchScore,
      matchBreakdown: app.matchBreakdown,
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      statusNotes: app.statusNotes,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      opportunity: {
        id: app.opportunity.id,
        title: app.opportunity.title,
        slug: app.opportunity.slug,
        type: app.opportunity.type,
        workMode: app.opportunity.workMode,
        location: app.opportunity.location,
        duration: app.opportunity.duration,
        stipendSalary: app.opportunity.stipendSalary,
        deadline: app.opportunity.deadline,
        isActive: app.opportunity.isActive,
        company: app.opportunity.company,
        requiredSkillsCount: app.opportunity.requiredSkills.length,
      },
    }));
  }

  /**
   * Get single application detail for a student (Enforces student ownership)
   */
  async getStudentApplicationDetail(id: string, userId: string) {
    const student = await studentService.getProfileByUserId(userId);

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            company: true,
            requiredSkills: {
              include: {
                skill: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        student: true,
      },
    });

    if (!application) {
      const error: AppError = new Error("Application not found.");
      error.statusCode = 404;
      error.code = "APPLICATION_NOT_FOUND";
      throw error;
    }

    // Enforce Student Ownership
    if (application.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to view this application.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_APPLICATION_ACCESS";
      throw error;
    }

    return application;
  }

  /**
   * Withdraw an application (Student only, allowed if APPLIED or SHORTLISTED)
   */
  async withdrawApplication(id: string, userId: string, reason?: string) {
    const student = await studentService.getProfileByUserId(userId);

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            company: true,
          },
        },
      },
    });

    if (!application) {
      const error: AppError = new Error("Application not found.");
      error.statusCode = 404;
      error.code = "APPLICATION_NOT_FOUND";
      throw error;
    }

    // Enforce Student Ownership
    if (application.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to withdraw this application.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_APPLICATION_ACCESS";
      throw error;
    }

    if (
      application.status === ApplicationStatus.WITHDRAWN ||
      application.status === ApplicationStatus.REJECTED ||
      application.status === ApplicationStatus.JOINED
    ) {
      const error: AppError = new Error(
        `Cannot withdraw application that is currently ${application.status}.`,
      );
      error.statusCode = 400;
      error.code = "INVALID_WITHDRAWAL_STATUS";
      throw error;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const withdrawalNote = reason
        ? `[Withdrawn by candidate: ${reason}]`
        : "[Withdrawn by candidate]";

      const app = await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.WITHDRAWN,
          statusNotes: application.statusNotes
            ? `${application.statusNotes}\n${withdrawalNote}`
            : withdrawalNote,
        },
        include: {
          opportunity: { include: { company: true } },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entityType: "Application",
          entityId: id,
          details: {
            status: ApplicationStatus.WITHDRAWN,
            reason: reason || "Withdrawn by candidate",
          },
        },
      });

      // Recruiter notification
      if (application.opportunity.company.userId) {
        await tx.notification.create({
          data: {
            userId: application.opportunity.company.userId,
            title: "Candidate Withdrew Application",
            message: `${student.fullName} has withdrawn their application for ${application.opportunity.title}.`,
            type: NotificationType.APPLICATION_UPDATE,
            link: `/industry/opportunities/${application.opportunityId}/applicants`,
          },
        });
      }

      return app;
    });

    return updated;
  }

  /**
   * Recruiter: List applicants for an opportunity or all company opportunities (Ranked by Match Score)
   */
  async getRecruiterApplications(
    userId: string,
    _userRole: string,
    opportunityId?: string,
    filters?: {
      status?: string;
      search?: string;
      minMatchScore?: number;
      minCgpa?: number;
      branch?: string;
      gradYear?: number;
      skill?: string;
    },
  ) {
    const company = await companyService.getProfileByUserId(userId);

    const where: any = {
      opportunity: {
        companyId: company.id,
      },
    };

    if (opportunityId) {
      // Validate that opportunity belongs to company
      const opp = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
      });

      if (!opp || opp.companyId !== company.id) {
        const error: AppError = new Error(
          "You do not have permission to view applicants for this opportunity.",
        );
        error.statusCode = 403;
        error.code = "FORBIDDEN_OPPORTUNITY_ACCESS";
        throw error;
      }

      where.opportunityId = opportunityId;
    }

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as ApplicationStatus;
    }

    if (filters?.minMatchScore !== undefined && filters.minMatchScore > 0) {
      where.matchScore = { gte: filters.minMatchScore };
    }

    const studentWhere: any = {};

    if (filters?.minCgpa !== undefined && filters.minCgpa > 0) {
      studentWhere.cgpa = { gte: filters.minCgpa };
    }

    if (filters?.branch) {
      studentWhere.branch = { contains: filters.branch, mode: "insensitive" };
    }

    if (filters?.gradYear !== undefined && filters.gradYear > 0) {
      studentWhere.gradYear = filters.gradYear;
    }

    if (filters?.skill) {
      studentWhere.skills = {
        some: {
          skill: {
            name: { contains: filters.skill, mode: "insensitive" },
          },
        },
      };
    }

    if (filters?.search) {
      where.OR = [
        {
          student: {
            fullName: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          student: {
            branch: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          student: {
            college: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          student: {
            headline: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    if (Object.keys(studentWhere).length > 0) {
      where.student = { ...(where.student || {}), ...studentWhere };
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: [{ matchScore: "desc" }, { appliedAt: "desc" }],
      include: {
        student: {
          include: {
            user: { select: { email: true } },
            skills: {
              include: {
                skill: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            type: true,
            workMode: true,
            location: true,
            deadline: true,
            isActive: true,
            company: {
              select: {
                id: true,
                companyName: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    return applications.map((app, index) => {
      const breakdown = app.matchBreakdown as any;
      return {
        id: app.id,
        rank: index + 1,
        opportunityId: app.opportunityId,
        status: app.status,
        matchScore: app.matchScore ?? 0,
        skillCompatibility:
          breakdown?.breakdown?.skillCompatibility?.score ??
          breakdown?.skillScore ??
          app.matchScore ??
          0,
        eligibilityScore:
          breakdown?.breakdown?.eligibility?.score ??
          (breakdown?.eligibilityResult?.isEligible ? 100 : 50),
        isEligible: breakdown?.eligibilityResult?.isEligible ?? true,
        matchingSkills: breakdown?.matchingSkills ?? [],
        missingSkills: breakdown?.missingSkills ?? breakdown?.gapSkills ?? [],
        explanation:
          breakdown?.explanation ??
          `Candidate achieved a ${app.matchScore ?? 0}% match score for this vacancy.`,
        matchBreakdown: app.matchBreakdown,
        resumeUrl: app.resumeUrl,
        coverLetter: app.coverLetter,
        statusNotes: app.statusNotes,
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        opportunity: app.opportunity,
        student: {
          id: app.student.id,
          fullName: app.student.fullName,
          email: app.student.user.email,
          phone: app.student.phone,
          college: app.student.college,
          branch: app.student.branch,
          gradYear: app.student.gradYear,
          cgpa: app.student.cgpa,
          headline: app.student.headline,
          skills: app.student.skills.map((ss) => ({
            skillId: ss.skillId,
            skillName: ss.skill.name,
            score: ss.score,
            verified: ss.isVerified,
          })),
        },
      };
    });
  }

  /**
   * Recruiter: Get single candidate application dossier (Enforces company ownership)
   */
  async getRecruiterApplicationDetail(
    id: string,
    userId: string,
    _userRole: string,
  ) {
    const company = await companyService.getProfileByUserId(userId);

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            company: true,
            requiredSkills: {
              include: {
                skill: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
        student: {
          include: {
            user: { select: { email: true, createdAt: true } },
            skills: {
              include: {
                skill: {
                  include: { category: { select: { name: true } } },
                },
              },
            },
            projects: true,
            certifications: true,
          },
        },
      },
    });

    if (!application) {
      const error: AppError = new Error("Application not found.");
      error.statusCode = 404;
      error.code = "APPLICATION_NOT_FOUND";
      throw error;
    }

    // Enforce Company Ownership
    if (application.opportunity.companyId !== company.id) {
      const error: AppError = new Error(
        "You do not have permission to view this application dossier.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_APPLICATION_ACCESS";
      throw error;
    }

    return application;
  }

  /**
   * Recruiter: Update Candidate Application Status in Recruitment Pipeline
   */
  async updateApplicationStatus(
    id: string,
    userId: string,
    _userRole: string,
    input: UpdateApplicationStatusInput,
  ) {
    const company = await companyService.getProfileByUserId(userId);

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: { company: true },
        },
        student: {
          include: { user: true },
        },
      },
    });

    if (!application) {
      const error: AppError = new Error("Application not found.");
      error.statusCode = 404;
      error.code = "APPLICATION_NOT_FOUND";
      throw error;
    }

    // Enforce Company Ownership
    if (application.opportunity.companyId !== company.id) {
      const error: AppError = new Error(
        "You do not have permission to update this application.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_APPLICATION_ACCESS";
      throw error;
    }

    if (application.status === ApplicationStatus.WITHDRAWN) {
      const error: AppError = new Error(
        "Cannot update an application that has been withdrawn by the candidate.",
      );
      error.statusCode = 400;
      error.code = "APPLICATION_WITHDRAWN";
      throw error;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const app = await tx.application.update({
        where: { id },
        data: {
          status: input.status,
          statusNotes: input.statusNotes ?? application.statusNotes,
        },
        include: {
          opportunity: { include: { company: true } },
          student: true,
        },
      });

      // Notification for Student
      await tx.notification.create({
        data: {
          userId: application.student.userId,
          title: `Application Status Updated: ${input.status}`,
          message: `Your application for ${application.opportunity.title} at ${company.companyName} has moved to ${input.status}.`,
          type: NotificationType.APPLICATION_UPDATE,
          link: `/student/applications/${id}`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: AuditAction.UPDATE,
          entityType: "Application",
          entityId: id,
          details: {
            fromStatus: application.status,
            toStatus: input.status,
            statusNotes: input.statusNotes,
          },
        },
      });

      return app;
    });

    return updated;
  }
}

export const applicationService = new ApplicationService();
