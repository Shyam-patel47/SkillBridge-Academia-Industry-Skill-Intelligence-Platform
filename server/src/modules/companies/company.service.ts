import { AuditAction, ApplicationStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { UpdateCompanyProfileInput } from "./company.schema.js";

export class CompanyService {
  /**
   * Fetch company profile for the authenticated industry user
   */
  async getProfileByUserId(userId: string) {
    let company = await prisma.company.findUnique({
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
        _count: {
          select: {
            opportunities: true,
          },
        },
      },
    });

    // Auto-create company profile if user has role INDUSTRY but record doesn't exist
    if (!company) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        const error: AppError = new Error("User account not found.");
        error.statusCode = 404;
        error.code = "USER_NOT_FOUND";
        throw error;
      }

      const defaultName = user.email.split("@")[0].toUpperCase() + " Corp";

      company = await prisma.company.create({
        data: {
          userId,
          companyName: defaultName,
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
          _count: {
            select: {
              opportunities: true,
            },
          },
        },
      });
    }

    return company;
  }

  /**
   * Update company profile information
   */
  async updateProfileByUserId(
    userId: string,
    input: UpdateCompanyProfileInput,
  ) {
    const company = await this.getProfileByUserId(userId);

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        ...(input.companyName !== undefined && {
          companyName: input.companyName,
        }),
        ...(input.industry !== undefined && { industry: input.industry }),
        ...(input.website !== undefined && { website: input.website }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.description !== undefined && {
          description: input.description,
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
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.UPDATE,
        entityType: "CompanyProfile",
        entityId: company.id,
        details: { updatedFields: Object.keys(input) },
      },
    });

    return updated;
  }

  /**
   * Fetch company dashboard summary KPIs
   */
  async getDashboardMetrics(userId: string) {
    const company = await this.getProfileByUserId(userId);

    // Active opportunities count
    const activeOpportunitiesCount = await prisma.opportunity.count({
      where: { companyId: company.id, isActive: true },
    });

    const totalOpportunitiesCount = await prisma.opportunity.count({
      where: { companyId: company.id },
    });

    // Total applications for this company's opportunities
    const totalApplicationsCount = await prisma.application.count({
      where: { opportunity: { companyId: company.id } },
    });

    const shortlistedCount = await prisma.application.count({
      where: {
        opportunity: { companyId: company.id },
        status: {
          in: [
            ApplicationStatus.SHORTLISTED,
            ApplicationStatus.INTERVIEW,
            ApplicationStatus.OFFER,
            ApplicationStatus.JOINED,
          ],
        },
      },
    });

    // Recent opportunities posted
    const recentOpportunities = await prisma.opportunity.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: {
          select: {
            applications: true,
            requiredSkills: true,
          },
        },
      },
    });

    return {
      company: {
        id: company.id,
        companyName: company.companyName,
        industry: company.industry,
        location: company.location,
        logoUrl: company.logoUrl,
        isVerified: company.isVerified,
      },
      metrics: {
        activeOpportunitiesCount,
        totalOpportunitiesCount,
        totalApplicationsCount,
        shortlistedCount,
      },
      recentOpportunities: recentOpportunities.map((o) => ({
        id: o.id,
        title: o.title,
        slug: o.slug,
        type: o.type,
        workMode: o.workMode,
        location: o.location,
        stipendSalary: o.stipendSalary,
        deadline: o.deadline,
        isActive: o.isActive,
        applicationsCount: o._count.applications,
        skillsCount: o._count.requiredSkills,
        createdAt: o.createdAt,
      })),
    };
  }
}

export const companyService = new CompanyService();
