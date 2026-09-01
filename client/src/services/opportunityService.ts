import { apiClient } from "../lib/apiClient";

export interface OpportunityRequiredSkill {
  id?: string;
  skillId: string;
  skillName?: string;
  skillSlug?: string;
  categoryName?: string;
  minScore: number;
  isMandatory: boolean;
  weight: number;
}

export interface OpportunityItem {
  id: string;
  companyId?: string;
  title: string;
  slug: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME";
  description: string;
  workMode: "REMOTE" | "HYBRID" | "ON_SITE" | "ANY";
  location?: string | null;
  minCgpa: number;
  eligibleBranches: string[];
  eligibleGradYears: number[];
  duration?: string | null;
  stipendSalary?: string | null;
  deadline?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  applicationsCount?: number;
  company?: {
    id: string;
    companyName: string;
    industry?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    location?: string | null;
    description?: string | null;
    isVerified: boolean;
  };
  requiredSkills: OpportunityRequiredSkill[];
}

export interface CreateOpportunityPayload {
  title: string;
  slug?: string;
  type: "INTERNSHIP" | "FULL_TIME" | "PART_TIME";
  description: string;
  workMode: "REMOTE" | "HYBRID" | "ON_SITE" | "ANY";
  location?: string | null;
  minCgpa?: number;
  eligibleBranches?: string[];
  eligibleGradYears?: number[];
  duration?: string | null;
  stipendSalary?: string | null;
  deadline?: string | null;
  isActive?: boolean;
  requiredSkills: Array<{
    skillId: string;
    minScore: number;
    isMandatory: boolean;
    weight: number;
  }>;
}

export const opportunityService = {
  async getMyOpportunities(params?: {
    status?: string;
    search?: string;
    type?: string;
  }): Promise<OpportunityItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { opportunities: OpportunityItem[]; count: number };
    }>("/opportunities/company/me", { params });
    return res.data.data.opportunities;
  },

  async getOpportunityById(idOrSlug: string): Promise<OpportunityItem> {
    const res = await apiClient.get<{
      success: boolean;
      data: { opportunity: OpportunityItem };
    }>(`/opportunities/${idOrSlug}`);
    return res.data.data.opportunity;
  },

  async createOpportunity(
    payload: CreateOpportunityPayload,
  ): Promise<OpportunityItem> {
    const res = await apiClient.post<{
      success: boolean;
      data: { opportunity: OpportunityItem };
    }>("/opportunities", payload);
    return res.data.data.opportunity;
  },

  async updateOpportunity(
    id: string,
    payload: Partial<CreateOpportunityPayload>,
  ): Promise<OpportunityItem> {
    const res = await apiClient.put<{
      success: boolean;
      data: { opportunity: OpportunityItem };
    }>(`/opportunities/${id}`, payload);
    return res.data.data.opportunity;
  },

  async togglePublish(id: string, isActive: boolean): Promise<OpportunityItem> {
    const res = await apiClient.patch<{
      success: boolean;
      data: { opportunity: OpportunityItem };
    }>(`/opportunities/${id}/publish`, { isActive });
    return res.data.data.opportunity;
  },

  async deleteOpportunity(
    id: string,
  ): Promise<{ deleted: boolean; id: string; title: string }> {
    const res = await apiClient.delete<{
      success: boolean;
      data: { deleted: boolean; id: string; title: string };
    }>(`/opportunities/${id}`);
    return res.data.data;
  },

  async getPublicOpportunities(params?: {
    search?: string;
    type?: string;
    workMode?: string;
    location?: string;
  }): Promise<OpportunityItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { opportunities: OpportunityItem[]; count: number };
    }>("/opportunities", { params });
    return res.data.data.opportunities;
  },
};
