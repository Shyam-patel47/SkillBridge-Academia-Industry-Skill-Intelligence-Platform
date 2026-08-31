import { apiClient } from "../lib/apiClient";

export interface SkillItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SkillCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  skills: SkillItem[];
}

export const skillService = {
  async getTaxonomy(): Promise<SkillCategoryItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { categories: SkillCategoryItem[] };
    }>("/skills/taxonomy");
    return res.data.data.categories;
  },

  async getAllSkills(): Promise<SkillItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { skills: SkillItem[] };
    }>("/skills");
    return res.data.data.skills;
  },
};
