import { prisma } from "../../config/prisma.js";

export class SkillService {
  async getAllSkillsGroupedByCategory() {
    const categories = await prisma.skillCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        skills: {
          orderBy: { name: "asc" },
        },
      },
    });

    return categories;
  }

  async getAllSkillsFlat() {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return skills;
  }
}

export const skillService = new SkillService();
