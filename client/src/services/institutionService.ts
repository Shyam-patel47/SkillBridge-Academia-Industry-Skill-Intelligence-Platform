import { apiClient } from "../lib/apiClient";

export interface InstitutionProfile {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  website?: string | null;
  isVerified: boolean;
}

export interface SkillDemandSupplyMatrixItem {
  skillId: string;
  skillName: string;
  skillSlug: string;
  category: string;
  industryDemandPercentage: number;
  studentSupplyPercentage: number;
  gapPercentage: number;
  status: "HIGH_DEFICIT" | "MODERATE_GAP" | "BALANCED" | "SURPLUS";
  opportunityCount: number;
  competentStudentsCount: number;
  averageStudentScore: number;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  slug: string;
  skillCount: number;
  evaluatedCount: number;
  averageScore: number;
}

export interface InstitutionAnalyticsDossier {
  institution: InstitutionProfile;
  overview: {
    totalStudents: number;
    assessedStudents: number;
    participationRate: number;
    totalAssessmentsTaken: number;
    averageCgpa: number;
    totalActiveOpportunities: number;
  };
  demandSupplyMatrix: SkillDemandSupplyMatrixItem[];
  categoryBreakdown: CategoryBreakdownItem[];
  applications: {
    totalApplications: number;
    appliedCount: number;
    shortlistedCount: number;
    interviewCount: number;
    offersCount: number;
    rejectedCount: number;
    withdrawnCount: number;
    shortlistRate: number;
    placementRate: number;
  };
  topHiringPartners: Array<{
    company: {
      id: string;
      companyName: string;
      industry?: string | null;
      logoUrl?: string | null;
    };
    offersCount: number;
  }>;
  curriculumRecommendations: Array<{
    skillName: string;
    category: string;
    industryDemand: number;
    studentSupply: number;
    deficit: number;
    recommendation: string;
  }>;
}

export const institutionService = {
  /**
   * Get Institution Profile
   */
  async getProfile(): Promise<InstitutionProfile> {
    const res = await apiClient.get<{
      success: boolean;
      data: { institution: InstitutionProfile };
    }>("/institutions/me");
    return res.data.data.institution;
  },

  /**
   * Get Aggregate Institution Analytics
   */
  async getAnalytics(): Promise<InstitutionAnalyticsDossier> {
    const res = await apiClient.get<{
      success: boolean;
      data: { analytics: InstitutionAnalyticsDossier };
    }>("/institutions/analytics");
    return res.data.data.analytics;
  },
};
