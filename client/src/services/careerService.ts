import { apiClient } from "../lib/apiClient";

export interface BenchmarkSkillItem {
  skillId: string;
  skillName: string;
  categoryName?: string;
  studentScore: number;
  requiredBenchmark: number;
  surplusPoints?: number;
  gapPoints?: number;
  weight: number;
  isCore: boolean;
  priority?: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface DetailedMatrixItem {
  skillId: string;
  skillName: string;
  categoryName?: string;
  studentScore: number;
  requiredBenchmark: number;
  fulfillmentPercentage: number;
  status: "MET" | "PARTIAL_GAP" | "MISSING";
  isCore: boolean;
  weight: number;
}

export interface CareerRecommendationItem {
  careerRole: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    category?: string | null;
    avgSalary?: string | null;
    demandLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  };
  compatibilityScore: number;
  readinessLevel: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING";
  totalRequiredSkills: number;
  matchingSkillsCount: number;
  gapSkillsCount: number;
  missingSkillsCount: number;
  matchingSkills: BenchmarkSkillItem[];
  missingSkills: BenchmarkSkillItem[];
  skillGaps: BenchmarkSkillItem[];
  detailedMatrix: DetailedMatrixItem[];
  explanation: string;
}

export const careerService = {
  async getRecommendations(): Promise<CareerRecommendationItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { recommendations: CareerRecommendationItem[]; count: number };
    }>("/careers/recommendations");
    return res.data.data.recommendations;
  },

  async getGapAnalysis(idOrSlug: string): Promise<CareerRecommendationItem> {
    const res = await apiClient.get<{
      success: boolean;
      data: { analysis: CareerRecommendationItem };
    }>(`/careers/${idOrSlug}/gap-analysis`);
    return res.data.data.analysis;
  },
};
