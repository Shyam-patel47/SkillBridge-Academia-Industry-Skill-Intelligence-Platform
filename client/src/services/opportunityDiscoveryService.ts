import { apiClient } from "../lib/apiClient";

export interface StudentOpportunityItem {
  id: string;
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
  company: {
    id: string;
    companyName: string;
    industry?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    location?: string | null;
    description?: string | null;
    isVerified: boolean;
  };
  compatibilityScore: number;
  matchFit: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING";
  explanation: string;
  academicEligibility: {
    isEligible: boolean;
    cgpaMet: boolean;
    branchMet: boolean;
    gradYearMet: boolean;
    details: {
      studentCgpa?: number | null;
      requiredCgpa: number;
      studentBranch?: string | null;
      studentGradYear?: number | null;
    };
  };
  matchingSkills: Array<{
    skillId: string;
    skillName: string;
    categoryName?: string;
    studentScore: number;
    benchmarkScore: number;
    isMandatory: boolean;
    isSatisfied: boolean;
  }>;
  gapSkills: Array<{
    skillId: string;
    skillName: string;
    categoryName?: string;
    studentScore: number;
    benchmarkScore: number;
    gapPoints: number;
    isMandatory: boolean;
  }>;
  requiredSkills: Array<{
    id: string;
    skillId: string;
    skillName: string;
    skillSlug: string;
    categoryName?: string;
    minScore: number;
    isMandatory: boolean;
    weight: number;
  }>;
}

export interface OpportunityFeedParams {
  search?: string;
  type?: string;
  skillId?: string;
  location?: string;
  workMode?: string;
  eligibilityOnly?: boolean;
  sortBy?: "match" | "recent" | "deadline";
}

export const opportunityDiscoveryService = {
  async getStudentFeed(params?: OpportunityFeedParams): Promise<{
    opportunities: StudentOpportunityItem[];
    totalCount: number;
  }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { opportunities: StudentOpportunityItem[]; totalCount: number };
    }>("/opportunities/feed", {
      params: {
        ...params,
        eligibilityOnly: params?.eligibilityOnly ? "true" : undefined,
      },
    });
    return res.data.data;
  },

  async getStudentOpportunityDetail(
    idOrSlug: string,
  ): Promise<StudentOpportunityItem> {
    const res = await apiClient.get<{
      success: boolean;
      data: { opportunity: StudentOpportunityItem };
    }>(`/opportunities/${idOrSlug}/student-details`);
    return res.data.data.opportunity;
  },
};
