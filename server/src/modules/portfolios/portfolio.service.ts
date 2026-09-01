import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { studentService } from "../students/student.service.js";
import {
  UpdatePortfolioSettingsInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateCertificationInput,
  UpdateCertificationInput,
  CreateAchievementInput,
  UpdateAchievementInput,
} from "./portfolio.schema.js";

export class PortfolioService {
  /**
   * Get complete portfolio dossier for authenticated student
   */
  async getMyPortfolio(userId: string) {
    const student = await studentService.getProfileByUserId(userId);

    // Find or create Portfolio settings
    let portfolio = await prisma.portfolio.findUnique({
      where: { studentId: student.id },
    });

    if (!portfolio) {
      // Default slug derived from name
      const baseSlug = student.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const uniqueSuffix = student.id.slice(-4);
      const defaultSlug = `${baseSlug}-${uniqueSuffix}`;

      portfolio = await prisma.portfolio.create({
        data: {
          studentId: student.id,
          customSlug: defaultSlug,
          isPublic: true,
          aboutMe: student.bio || null,
        },
      });
    }

    // Gather all portfolio artifacts
    const [skills, projects, certifications, achievements, applications] =
      await Promise.all([
        prisma.studentSkill.findMany({
          where: { studentId: student.id },
          include: {
            skill: {
              include: {
                category: { select: { id: true, name: true, slug: true } },
              },
            },
          },
          orderBy: [{ score: "desc" }, { isVerified: "desc" }],
        }),
        prisma.project.findMany({
          where: { studentId: student.id },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        }),
        prisma.certification.findMany({
          where: { studentId: student.id },
          include: { skill: { select: { id: true, name: true } } },
          orderBy: { issueDate: "desc" },
        }),
        prisma.achievement.findMany({
          where: { studentId: student.id },
          orderBy: { createdAt: "desc" },
        }),
        prisma.application.findMany({
          where: {
            studentId: student.id,
            status: { in: ["OFFER", "OFFERED", "JOINED", "INTERVIEW"] },
          },
          include: {
            opportunity: {
              select: {
                id: true,
                title: true,
                type: true,
                workMode: true,
                location: true,
                duration: true,
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
          orderBy: { appliedAt: "desc" },
        }),
      ]);

    return {
      profile: {
        id: student.id,
        fullName: student.fullName,
        headline: student.headline,
        location: student.location,
        college: student.college,
        branch: student.branch,
        gradYear: student.gradYear,
        cgpa: student.cgpa,
        bio: student.bio,
        resumeUrl: student.resumeUrl,
        careerInterests: student.careerInterests || [],
        preferredLocations: student.preferredLocations || [],
        workModePref: student.workModePref,
        email: student.user.email,
        phone: student.phone,
      },
      portfolioSettings: {
        id: portfolio.id,
        customSlug: portfolio.customSlug,
        isPublic: portfolio.isPublic,
        aboutMe: portfolio.aboutMe,
        themeColor: portfolio.themeColor,
        viewsCount: portfolio.viewsCount,
      },
      skills: skills.map((ss) => ({
        id: ss.id,
        skillId: ss.skillId,
        skillName: ss.skill.name,
        skillSlug: ss.skill.slug,
        category: ss.skill.category.name,
        score: ss.score,
        proficiency: ss.proficiency,
        isVerified: ss.isVerified,
        lastAssessedAt: ss.lastAssessedAt,
      })),
      projects,
      certifications,
      achievements,
      experience: applications.map((app) => ({
        id: app.id,
        role: app.opportunity.title,
        companyName: app.opportunity.company.companyName,
        companyLogo: app.opportunity.company.logoUrl,
        type: app.opportunity.type,
        workMode: app.opportunity.workMode,
        location: app.opportunity.location,
        duration: app.opportunity.duration,
        status: app.status,
      })),
    };
  }

  /**
   * Update portfolio settings (Public visibility, slug, bio, theme)
   */
  async updatePortfolioSettings(
    userId: string,
    input: UpdatePortfolioSettingsInput,
  ) {
    const student = await studentService.getProfileByUserId(userId);

    // If changing slug, check uniqueness
    if (input.customSlug) {
      const existing = await prisma.portfolio.findFirst({
        where: {
          customSlug: input.customSlug,
          NOT: { studentId: student.id },
        },
      });

      if (existing) {
        const error: AppError = new Error(
          "Custom URL slug is already taken. Please choose another.",
        );
        error.statusCode = 409;
        error.code = "SLUG_ALREADY_EXISTS";
        throw error;
      }
    }

    const portfolio = await prisma.portfolio.upsert({
      where: { studentId: student.id },
      update: {
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
        ...(input.customSlug && { customSlug: input.customSlug }),
        ...(input.aboutMe !== undefined && { aboutMe: input.aboutMe }),
        ...(input.themeColor !== undefined && { themeColor: input.themeColor }),
      },
      create: {
        studentId: student.id,
        customSlug: input.customSlug || student.id,
        isPublic: input.isPublic ?? true,
        aboutMe: input.aboutMe || student.bio,
        themeColor: input.themeColor || "#0C8EE9",
      },
    });

    return portfolio;
  }

  /**
   * Public Portfolio Endpoint (Accessed by anyone at /portfolio/:slug)
   */
  async getPublicPortfolioBySlug(slug: string) {
    // Look up portfolio by customSlug or studentId
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        OR: [{ customSlug: slug }, { studentId: slug }],
      },
      include: {
        student: {
          include: {
            user: { select: { email: true } },
            skills: {
              include: {
                skill: {
                  include: { category: { select: { id: true, name: true } } },
                },
              },
              orderBy: [{ score: "desc" }, { isVerified: "desc" }],
            },
            projects: {
              orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
            },
            certifications: {
              include: { skill: { select: { name: true } } },
              orderBy: { issueDate: "desc" },
            },
            achievements: {
              orderBy: { createdAt: "desc" },
            },
            applications: {
              where: { status: { in: ["OFFER", "OFFERED", "JOINED"] } },
              include: {
                opportunity: {
                  select: {
                    title: true,
                    type: true,
                    workMode: true,
                    location: true,
                    duration: true,
                    company: {
                      select: {
                        companyName: true,
                        logoUrl: true,
                        industry: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!portfolio || !portfolio.student) {
      const error: AppError = new Error("Portfolio not found.");
      error.statusCode = 404;
      error.code = "PORTFOLIO_NOT_FOUND";
      throw error;
    }

    if (!portfolio.isPublic) {
      const error: AppError = new Error(
        "This student portfolio is set to private by the owner.",
      );
      error.statusCode = 403;
      error.code = "PORTFOLIO_PRIVATE";
      throw error;
    }

    // Increment views count atomically
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { viewsCount: { increment: 1 } },
    });

    const student = portfolio.student;

    return {
      profile: {
        fullName: student.fullName,
        headline: student.headline,
        location: student.location,
        college: student.college,
        branch: student.branch,
        gradYear: student.gradYear,
        cgpa: student.cgpa,
        bio: student.bio,
        resumeUrl: student.resumeUrl,
        careerInterests: student.careerInterests || [],
        preferredLocations: student.preferredLocations || [],
        workModePref: student.workModePref,
        email: student.user.email,
      },
      portfolioSettings: {
        customSlug: portfolio.customSlug,
        aboutMe: portfolio.aboutMe,
        themeColor: portfolio.themeColor,
        viewsCount: portfolio.viewsCount + 1,
      },
      skills: student.skills.map((ss) => ({
        skillId: ss.skillId,
        skillName: ss.skill.name,
        category: ss.skill.category.name,
        score: ss.score,
        proficiency: ss.proficiency,
        isVerified: ss.isVerified,
      })),
      projects: student.projects,
      certifications: student.certifications,
      achievements: student.achievements,
      experience: student.applications.map((app) => ({
        role: app.opportunity.title,
        companyName: app.opportunity.company.companyName,
        companyLogo: app.opportunity.company.logoUrl,
        type: app.opportunity.type,
        workMode: app.opportunity.workMode,
        location: app.opportunity.location,
        duration: app.opportunity.duration,
      })),
    };
  }

  // ==========================================
  // Project Management (Student CRUD)
  // ==========================================

  async addProject(userId: string, input: CreateProjectInput) {
    const student = await studentService.getProfileByUserId(userId);

    const project = await prisma.project.create({
      data: {
        studentId: student.id,
        title: input.title,
        description: input.description,
        liveUrl: input.liveUrl || null,
        githubUrl: input.githubUrl || null,
        skillsUsed: input.skillsUsed || [],
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        isFeatured: input.isFeatured ?? false,
      },
    });

    return project;
  }

  async updateProject(
    userId: string,
    projectId: string,
    input: UpdateProjectInput,
  ) {
    const student = await studentService.getProfileByUserId(userId);

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      const error: AppError = new Error("Project not found.");
      error.statusCode = 404;
      error.code = "PROJECT_NOT_FOUND";
      throw error;
    }

    if (existing.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to update this project.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_PROJECT_ACCESS";
      throw error;
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.liveUrl !== undefined && { liveUrl: input.liveUrl || null }),
        ...(input.githubUrl !== undefined && {
          githubUrl: input.githubUrl || null,
        }),
        ...(input.skillsUsed !== undefined && { skillsUsed: input.skillsUsed }),
        ...(input.startDate !== undefined && {
          startDate: input.startDate ? new Date(input.startDate) : null,
        }),
        ...(input.endDate !== undefined && {
          endDate: input.endDate ? new Date(input.endDate) : null,
        }),
        ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
      },
    });

    return updated;
  }

  async deleteProject(userId: string, projectId: string) {
    const student = await studentService.getProfileByUserId(userId);

    const existing = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      const error: AppError = new Error("Project not found.");
      error.statusCode = 404;
      error.code = "PROJECT_NOT_FOUND";
      throw error;
    }

    if (existing.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to delete this project.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_PROJECT_ACCESS";
      throw error;
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return { success: true, message: "Project deleted successfully" };
  }

  // ==========================================
  // Certification Management (Student CRUD)
  // ==========================================

  async addCertification(userId: string, input: CreateCertificationInput) {
    const student = await studentService.getProfileByUserId(userId);

    const cert = await prisma.certification.create({
      data: {
        studentId: student.id,
        title: input.title,
        issuer: input.issuer,
        issueDate: new Date(input.issueDate),
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        credentialUrl: input.credentialUrl || null,
        credentialId: input.credentialId || null,
        skillId: input.skillId || null,
      },
    });

    return cert;
  }

  async updateCertification(
    userId: string,
    certId: string,
    input: UpdateCertificationInput,
  ) {
    const student = await studentService.getProfileByUserId(userId);

    const existing = await prisma.certification.findUnique({
      where: { id: certId },
    });

    if (!existing) {
      const error: AppError = new Error("Certification not found.");
      error.statusCode = 404;
      error.code = "CERTIFICATION_NOT_FOUND";
      throw error;
    }

    if (existing.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to update this certification.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_CERTIFICATION_ACCESS";
      throw error;
    }

    const updated = await prisma.certification.update({
      where: { id: certId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.issuer && { issuer: input.issuer }),
        ...(input.issueDate && { issueDate: new Date(input.issueDate) }),
        ...(input.expiryDate !== undefined && {
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        }),
        ...(input.credentialUrl !== undefined && {
          credentialUrl: input.credentialUrl || null,
        }),
        ...(input.credentialId !== undefined && {
          credentialId: input.credentialId || null,
        }),
        ...(input.skillId !== undefined && { skillId: input.skillId || null }),
      },
    });

    return updated;
  }

  async deleteCertification(userId: string, certId: string) {
    const student = await studentService.getProfileByUserId(userId);

    const existing = await prisma.certification.findUnique({
      where: { id: certId },
    });

    if (!existing) {
      const error: AppError = new Error("Certification not found.");
      error.statusCode = 404;
      error.code = "CERTIFICATION_NOT_FOUND";
      throw error;
    }

    if (existing.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to delete this certification.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_CERTIFICATION_ACCESS";
      throw error;
    }

    await prisma.certification.delete({
      where: { id: certId },
    });

    return { success: true, message: "Certification deleted successfully" };
  }

  // ==========================================
  // Achievement Management (Student CRUD)
  // ==========================================

  async addAchievement(userId: string, input: CreateAchievementInput) {
    const student = await studentService.getProfileByUserId(userId);

    const achievement = await prisma.achievement.create({
      data: {
        studentId: student.id,
        title: input.title,
        description: input.description || null,
        issuer: input.issuer || null,
        issueDate: input.issueDate ? new Date(input.issueDate) : null,
        certificateUrl: input.certificateUrl || null,
      },
    });

    return achievement;
  }

  async updateAchievement(
    userId: string,
    achievementId: string,
    input: UpdateAchievementInput,
  ) {
    const student = await studentService.getProfileByUserId(userId);

    const existing = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!existing) {
      const error: AppError = new Error("Achievement not found.");
      error.statusCode = 404;
      error.code = "ACHIEVEMENT_NOT_FOUND";
      throw error;
    }

    if (existing.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to update this achievement.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_ACHIEVEMENT_ACCESS";
      throw error;
    }

    const updated = await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description !== undefined && {
          description: input.description || null,
        }),
        ...(input.issuer !== undefined && { issuer: input.issuer || null }),
        ...(input.issueDate !== undefined && {
          issueDate: input.issueDate ? new Date(input.issueDate) : null,
        }),
        ...(input.certificateUrl !== undefined && {
          certificateUrl: input.certificateUrl || null,
        }),
      },
    });

    return updated;
  }

  async deleteAchievement(userId: string, achievementId: string) {
    const student = await studentService.getProfileByUserId(userId);

    const existing = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!existing) {
      const error: AppError = new Error("Achievement not found.");
      error.statusCode = 404;
      error.code = "ACHIEVEMENT_NOT_FOUND";
      throw error;
    }

    if (existing.studentId !== student.id) {
      const error: AppError = new Error(
        "You do not have permission to delete this achievement.",
      );
      error.statusCode = 403;
      error.code = "FORBIDDEN_ACHIEVEMENT_ACCESS";
      throw error;
    }

    await prisma.achievement.delete({
      where: { id: achievementId },
    });

    return { success: true, message: "Achievement deleted successfully" };
  }
}

export const portfolioService = new PortfolioService();
