import { apiClient } from "../lib/apiClient";

export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  industry?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  location?: string | null;
  description?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}

export interface CompanyDashboardData {
  company: {
    id: string;
    companyName: string;
    industry?: string | null;
    location?: string | null;
    logoUrl?: string | null;
    isVerified: boolean;
  };
  metrics: {
    activeOpportunitiesCount: number;
    totalOpportunitiesCount: number;
    totalApplicationsCount: number;
    shortlistedCount: number;
  };
  recentOpportunities: Array<{
    id: string;
    title: string;
    slug: string;
    type: string;
    workMode: string;
    location?: string | null;
    stipendSalary?: string | null;
    deadline?: string | null;
    isActive: boolean;
    applicationsCount: number;
    skillsCount: number;
    createdAt: string;
  }>;
}

export const companyService = {
  async getMyProfile(): Promise<CompanyProfile> {
    const res = await apiClient.get<{
      success: boolean;
      data: { company: CompanyProfile };
    }>("/companies/me");
    return res.data.data.company;
  },

  async updateMyProfile(
    data: Partial<CompanyProfile>,
  ): Promise<CompanyProfile> {
    const res = await apiClient.put<{
      success: boolean;
      data: { company: CompanyProfile };
    }>("/companies/me", data);
    return res.data.data.company;
  },

  async getDashboardMetrics(): Promise<CompanyDashboardData> {
    const res = await apiClient.get<{
      success: boolean;
      data: CompanyDashboardData;
    }>("/companies/me/dashboard");
    return res.data.data;
  },
};
