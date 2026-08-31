import { AuditAction, DemandLevel } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import { studentService } from "../students/student.service.js";
import {
  calculateCareerRoleCompatibility,
  BenchmarkSkill,
  StudentSkillScore,
  CareerRoleCompatibilityResult,
} from "./skill-gap.engine.js";
import {
  CreateCareerRoleInput,
  UpdateCareerRoleInput,
} from "./career.schema.js";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export class CareerService {
  /**
   * Calculate deterministic career recommendations for a student
   */
  async getRecommendationsForStudent(userId: string) {
    const student = await studentService.getProfileByUserId(userId);

    // Fetch all student skills
    const studentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: {
        skill: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const studentSkillScores: StudentSkillScore[] = studentSkills.map((s) => ({
      skillId: s.skillId,
      skillName: s.skill.name,
      score: s.score,
      isVerified: s.isVerified,
    }));

    // Fetch all benchmark career roles
    const careerRoles = await prisma.careerRole.findMany({
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
      },
      orderBy: { title: "asc" },
    });

    // Evaluate compatibility for each role
    const recommendations = careerRoles.map((role) => {
      const benchmarkSkills: BenchmarkSkill[] = role.requiredSkills.map(
        (rs) => ({
          skillId: rs.skillId,
          skillName: rs.skill.name,
          categoryName: rs.skill.category?.name,
          minProficiency: rs.minProficiency,
          weight: rs.weight,
          isCore: rs.isCore,
        }),
      );

      const evaluation = calculateCareerRoleCompatibility(
        role.title,
        benchmarkSkills,
        studentSkillScores,
      );

      return {
        careerRole: {
          id: role.id,
          title: role.title,
          slug: role.slug,
          description: role.description,
          category: role.category,
          avgSalary: role.avgSalary,
          demandLevel: role.demandLevel,
        },
        ...evaluation,
      };
    });

    // Sort by compatibility score descending
    recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return recommendations;
  }

  /**
   * Deep-dive gap analysis on a single career role for a student
   */
  async getCareerRoleGapAnalysis(userId: string, idOrSlug: string) {
    const student = await studentService.getProfileByUserId(userId);

    const role = await prisma.careerRole.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
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
      },
    });

    if (!role) {
      const error: AppError = new Error("Career role not found.");
      error.statusCode = 404;
      error.code = "CAREER_ROLE_NOT_FOUND";
      throw error;
    }

    const studentSkills = await prisma.studentSkill.findMany({
      where: { studentId: student.id },
      include: {
        skill: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const studentSkillScores: StudentSkillScore[] = studentSkills.map((s) => ({
      skillId: s.skillId,
      skillName: s.skill.name,
      score: s.score,
      isVerified: s.isVerified,
    }));

    const benchmarkSkills: BenchmarkSkill[] = role.requiredSkills.map((rs) => ({
      skillId: rs.skillId,
      skillName: rs.skill.name,
      categoryName: rs.skill.category?.name,
      minProficiency: rs.minProficiency,
      weight: rs.weight,
      isCore: rs.isCore,
    }));

    const evaluation = calculateCareerRoleCompatibility(
      role.title,
      benchmarkSkills,
      studentSkillScores,
    );

    return {
      careerRole: {
        id: role.id,
        title: role.title,
        slug: role.slug,
        description: role.description,
        category: role.category,
        avgSalary: role.avgSalary,
        demandLevel: role.demandLevel,
      },
      ...evaluation,
    };
  }

  /**
   * List all career roles (public or authenticated)
   */
  async getAllCareerRoles(category?: string, search?: string) {
    const where: any = {};
    if (category && category !== "all") {
      where.category = { contains: category, mode: "insensitive" };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    return prisma.careerRole.findMany({
      where,
      include: {
        requiredSkills: {
          include: {
            skill: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
    });
  }

  /**
   * Get single career role details by ID or slug
   */
  async getCareerRoleById(idOrSlug: string) {
    const role = await prisma.careerRole.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        requiredSkills: {
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

    if (!role) {
      const error: AppError = new Error("Career role not found.");
      error.statusCode = 404;
      error.code = "CAREER_ROLE_NOT_FOUND";
      throw error;
    }

    return role;
  }

  /**
   * Create a new Career Role (Admin only)
   */
  async createCareerRole(input: CreateCareerRoleInput, adminUserId: string) {
    const slug = input.slug || slugify(input.title);

    const existing = await prisma.careerRole.findFirst({
      where: {
        OR: [{ title: { equals: input.title, mode: "insensitive" } }, { slug }],
      },
    });

    if (existing) {
      const error: AppError = new Error(
        `Career role "${input.title}" already exists.`,
      );
      error.statusCode = 409;
      error.code = "ROLE_EXISTS";
      throw error;
    }

    const created = await prisma.careerRole.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        category: input.category,
        avgSalary: input.avgSalary,
        demandLevel: input.demandLevel || DemandLevel.HIGH,
        requiredSkills: {
          create: input.requiredSkills.map((rs) => ({
            skillId: rs.skillId,
            minProficiency: rs.minProficiency,
            weight: rs.weight,
            isCore: rs.isCore,
          })),
        },
      },
      include: {
        requiredSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.CREATE,
        entityType: "CareerRole",
        entityId: created.id,
        details: { title: created.title, slug: created.slug },
      },
    });

    return created;
  }

  /**
   * Update an existing Career Role (Admin only)
   */
  async updateCareerRole(
    id: string,
    input: UpdateCareerRoleInput,
    adminUserId: string,
  ) {
    const role = await prisma.careerRole.findUnique({ where: { id } });
    if (!role) {
      const error: AppError = new Error("Career role not found.");
      error.statusCode = 404;
      error.code = "CAREER_ROLE_NOT_FOUND";
      throw error;
    }

    const slug = input.slug
      ? slugify(input.slug)
      : input.title
        ? slugify(input.title)
        : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      // If required skills updated, recreate relations
      if (input.requiredSkills && Array.isArray(input.requiredSkills)) {
        await tx.careerRoleSkill.deleteMany({ where: { careerRoleId: id } });
        await tx.careerRoleSkill.createMany({
          data: input.requiredSkills.map((rs) => ({
            careerRoleId: id,
            skillId: rs.skillId,
            minProficiency: rs.minProficiency,
            weight: rs.weight,
            isCore: rs.isCore,
          })),
        });
      }

      return tx.careerRole.update({
        where: { id },
        data: {
          ...(input.title && { title: input.title }),
          ...(slug && { slug }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.category !== undefined && { category: input.category }),
          ...(input.avgSalary !== undefined && { avgSalary: input.avgSalary }),
          ...(input.demandLevel && { demandLevel: input.demandLevel }),
        },
        include: {
          requiredSkills: {
            include: {
              skill: true,
            },
          },
        },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.UPDATE,
        entityType: "CareerRole",
        entityId: updated.id,
        details: { updatedFields: Object.keys(input) },
      },
    });

    return updated;
  }

  /**
   * Delete a Career Role (Admin only)
   */
  async deleteCareerRole(id: string, adminUserId: string) {
    const role = await prisma.careerRole.findUnique({ where: { id } });
    if (!role) {
      const error: AppError = new Error("Career role not found.");
      error.statusCode = 404;
      error.code = "CAREER_ROLE_NOT_FOUND";
      throw error;
    }

    await prisma.careerRole.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.DELETE,
        entityType: "CareerRole",
        entityId: id,
        details: { title: role.title },
      },
    });

    return { deleted: true, id, title: role.title };
  }
}

export const careerService = new CareerService();
