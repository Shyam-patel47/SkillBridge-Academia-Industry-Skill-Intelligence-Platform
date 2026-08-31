import { apiClient } from "../lib/apiClient";

export interface SkillItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  };
  _count?: {
    studentSkills: number;
    careerRoleSkills: number;
    opportunitySkills: number;
    assessments: number;
  };
}

export interface SkillCategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  order: number;
  skills: SkillItem[];
  _count?: {
    skills: number;
  };
}

export interface TaxonomySummary {
  totalCategories: number;
  totalSkills: number;
  totalStudentSkills: number;
  totalOpportunitySkills: number;
}

export interface CreateCategoryDTO {
  name: string;
  slug?: string;
  description?: string | null;
  icon?: string | null;
  order?: number;
}

export interface CreateSkillDTO {
  name: string;
  slug?: string;
  description?: string | null;
  categoryId: string;
}

export const skillService = {
  // Public / Shared Lookups
  async getTaxonomy(): Promise<SkillCategoryItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { categories: SkillCategoryItem[] };
    }>("/skills/taxonomy");
    return res.data.data.categories;
  },

  async getAllSkills(filters?: {
    search?: string;
    categoryId?: string;
    categorySlug?: string;
  }): Promise<SkillItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { skills: SkillItem[]; total: number };
    }>("/skills", { params: filters });
    return res.data.data.skills;
  },

  async getCategories(): Promise<SkillCategoryItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { categories: SkillCategoryItem[] };
    }>("/skills/categories");
    return res.data.data.categories;
  },

  async getSummary(): Promise<TaxonomySummary> {
    const res = await apiClient.get<{
      success: boolean;
      data: { summary: TaxonomySummary };
    }>("/skills/summary");
    return res.data.data.summary;
  },

  // Admin Management
  async createCategory(payload: CreateCategoryDTO): Promise<SkillCategoryItem> {
    const res = await apiClient.post<{
      success: boolean;
      data: { category: SkillCategoryItem };
    }>("/skills/categories", payload);
    return res.data.data.category;
  },

  async updateCategory(
    id: string,
    payload: Partial<CreateCategoryDTO>,
  ): Promise<SkillCategoryItem> {
    const res = await apiClient.put<{
      success: boolean;
      data: { category: SkillCategoryItem };
    }>(`/skills/categories/${id}`, payload);
    return res.data.data.category;
  },

  async deleteCategory(
    id: string,
  ): Promise<{ deleted: boolean; id: string; name: string }> {
    const res = await apiClient.delete<{
      success: boolean;
      data: { deleted: boolean; id: string; name: string };
    }>(`/skills/categories/${id}`);
    return res.data.data;
  },

  async createSkill(payload: CreateSkillDTO): Promise<SkillItem> {
    const res = await apiClient.post<{
      success: boolean;
      data: { skill: SkillItem };
    }>("/skills", payload);
    return res.data.data.skill;
  },

  async updateSkill(
    id: string,
    payload: Partial<CreateSkillDTO>,
  ): Promise<SkillItem> {
    const res = await apiClient.put<{
      success: boolean;
      data: { skill: SkillItem };
    }>(`/skills/${id}`, payload);
    return res.data.data.skill;
  },

  async deleteSkill(
    id: string,
  ): Promise<{ deleted: boolean; id: string; name: string }> {
    const res = await apiClient.delete<{
      success: boolean;
      data: { deleted: boolean; id: string; name: string };
    }>(`/skills/${id}`);
    return res.data.data;
  },
};
