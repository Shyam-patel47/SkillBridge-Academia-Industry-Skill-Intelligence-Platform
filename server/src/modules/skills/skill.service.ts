import { AuditAction } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import {
  CreateSkillCategoryInput,
  UpdateSkillCategoryInput,
  CreateSkillInput,
  UpdateSkillInput,
} from "./skill.schema.js";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export class SkillService {
  /**
   * List all skill categories with ordered skill count
   */
  async getCategories() {
    return prisma.skillCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { skills: true },
        },
      },
    });
  }

  /**
   * Create a new Skill Category (Admin only)
   */
  async createCategory(input: CreateSkillCategoryInput, adminUserId: string) {
    const slug = input.slug || slugify(input.name);

    // Check unique
    const existing = await prisma.skillCategory.findFirst({
      where: {
        OR: [{ name: { equals: input.name, mode: "insensitive" } }, { slug }],
      },
    });

    if (existing) {
      const error: AppError = new Error(
        `Skill category "${input.name}" or slug "${slug}" already exists.`,
      );
      error.statusCode = 409;
      error.code = "CATEGORY_EXISTS";
      throw error;
    }

    const category = await prisma.skillCategory.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        icon: input.icon,
        order: input.order ?? 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.CREATE,
        entityType: "SkillCategory",
        entityId: category.id,
        details: { name: category.name, slug: category.slug },
      },
    });

    return category;
  }

  /**
   * Update a Skill Category (Admin only)
   */
  async updateCategory(
    id: string,
    input: UpdateSkillCategoryInput,
    adminUserId: string,
  ) {
    const category = await prisma.skillCategory.findUnique({ where: { id } });
    if (!category) {
      const error: AppError = new Error("Skill category not found.");
      error.statusCode = 404;
      error.code = "CATEGORY_NOT_FOUND";
      throw error;
    }

    const slug = input.slug
      ? slugify(input.slug)
      : input.name
        ? slugify(input.name)
        : undefined;

    const updated = await prisma.skillCategory.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(slug && { slug }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.icon !== undefined && { icon: input.icon }),
        ...(input.order !== undefined && { order: input.order }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.UPDATE,
        entityType: "SkillCategory",
        entityId: updated.id,
        details: { updatedFields: Object.keys(input) },
      },
    });

    return updated;
  }

  /**
   * Delete a Skill Category (Admin only)
   */
  async deleteCategory(id: string, adminUserId: string) {
    const category = await prisma.skillCategory.findUnique({
      where: { id },
      include: { _count: { select: { skills: true } } },
    });

    if (!category) {
      const error: AppError = new Error("Skill category not found.");
      error.statusCode = 404;
      error.code = "CATEGORY_NOT_FOUND";
      throw error;
    }

    await prisma.skillCategory.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.DELETE,
        entityType: "SkillCategory",
        entityId: id,
        details: { name: category.name },
      },
    });

    return { deleted: true, id, name: category.name };
  }

  /**
   * Get all skills with search and category filtering
   */
  async getSkills(filters?: {
    search?: string;
    categoryId?: string;
    categorySlug?: string;
  }) {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.categorySlug) {
      where.category = { slug: filters.categorySlug };
    }

    return prisma.skill.findMany({
      where,
      orderBy: { name: "asc" },
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
            studentSkills: true,
            careerRoleSkills: true,
            opportunitySkills: true,
            assessmentQuestions: true,
          },
        },
      },
    });
  }

  /**
   * Get full taxonomy hierarchy grouped by categories
   */
  async getAllSkillsGroupedByCategory() {
    return prisma.skillCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        skills: {
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: {
                studentSkills: true,
                careerRoleSkills: true,
                opportunitySkills: true,
                assessmentQuestions: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get single skill by ID or slug
   */
  async getSkillById(idOrSlug: string) {
    const skill = await prisma.skill.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        category: true,
        _count: {
          select: {
            studentSkills: true,
            careerRoleSkills: true,
            opportunitySkills: true,
            assessmentQuestions: true,
          },
        },
      },
    });

    if (!skill) {
      const error: AppError = new Error("Skill not found.");
      error.statusCode = 404;
      error.code = "SKILL_NOT_FOUND";
      throw error;
    }

    return skill;
  }

  /**
   * Create a new Skill entity (Admin only)
   */
  async createSkill(input: CreateSkillInput, adminUserId: string) {
    const category = await prisma.skillCategory.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) {
      const error: AppError = new Error(
        "Target skill category does not exist.",
      );
      error.statusCode = 400;
      error.code = "INVALID_CATEGORY";
      throw error;
    }

    const slug = input.slug || slugify(input.name);

    const existing = await prisma.skill.findFirst({
      where: {
        OR: [{ name: { equals: input.name, mode: "insensitive" } }, { slug }],
      },
    });

    if (existing) {
      const error: AppError = new Error(
        `Skill "${input.name}" or slug "${slug}" already exists.`,
      );
      error.statusCode = 409;
      error.code = "SKILL_EXISTS";
      throw error;
    }

    const skill = await prisma.skill.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        categoryId: input.categoryId,
      },
      include: {
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.CREATE,
        entityType: "Skill",
        entityId: skill.id,
        details: {
          name: skill.name,
          slug: skill.slug,
          category: category.name,
        },
      },
    });

    return skill;
  }

  /**
   * Update an existing Skill (Admin only)
   */
  async updateSkill(id: string, input: UpdateSkillInput, adminUserId: string) {
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      const error: AppError = new Error("Skill not found.");
      error.statusCode = 404;
      error.code = "SKILL_NOT_FOUND";
      throw error;
    }

    if (input.categoryId) {
      const category = await prisma.skillCategory.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        const error: AppError = new Error("Target category does not exist.");
        error.statusCode = 400;
        error.code = "INVALID_CATEGORY";
        throw error;
      }
    }

    const slug = input.slug
      ? slugify(input.slug)
      : input.name
        ? slugify(input.name)
        : undefined;

    const updated = await prisma.skill.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(slug && { slug }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.categoryId && { categoryId: input.categoryId }),
      },
      include: {
        category: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.UPDATE,
        entityType: "Skill",
        entityId: updated.id,
        details: { updatedFields: Object.keys(input) },
      },
    });

    return updated;
  }

  /**
   * Delete a Skill (Admin only)
   */
  async deleteSkill(id: string, adminUserId: string) {
    const skill = await prisma.skill.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            studentSkills: true,
            careerRoleSkills: true,
            opportunitySkills: true,
          },
        },
      },
    });

    if (!skill) {
      const error: AppError = new Error("Skill not found.");
      error.statusCode = 404;
      error.code = "SKILL_NOT_FOUND";
      throw error;
    }

    await prisma.skill.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: AuditAction.DELETE,
        entityType: "Skill",
        entityId: id,
        details: { name: skill.name },
      },
    });

    return { deleted: true, id, name: skill.name };
  }

  /**
   * Summary overview of Taxonomy Metrics
   */
  async getTaxonomySummary() {
    const [
      totalCategories,
      totalSkills,
      totalStudentSkills,
      totalOpportunitySkills,
    ] = await Promise.all([
      prisma.skillCategory.count(),
      prisma.skill.count(),
      prisma.studentSkill.count(),
      prisma.opportunitySkill.count(),
    ]);

    return {
      totalCategories,
      totalSkills,
      totalStudentSkills,
      totalOpportunitySkills,
    };
  }
}

export const skillService = new SkillService();
