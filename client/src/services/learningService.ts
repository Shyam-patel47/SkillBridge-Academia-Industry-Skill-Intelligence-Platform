import { apiClient } from "../lib/apiClient";

export interface CoveredSkillItem {
  id: string;
  name: string;
  slug: string;
  categoryName?: string;
  targetProficiency: number;
  studentScore: number;
  gapPoints: number;
  isCore: boolean;
}

export interface LearningProgramItem {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  provider?: string | null;
  durationHours: number;
  difficulty: "BEGINNER" | "MEDIUM" | "ADVANCED";
  url?: string | null;
  thumbnailUrl?: string | null;
  coveredSkills: CoveredSkillItem[];
}

export interface LearningRecommendationItem {
  program: LearningProgramItem;
  relevanceScore: number;
  targetCareerRole: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
  };
  addressedGapsCount: number;
  totalGapPointsCovered: number;
  explanation: string;
  enrollmentStatus?:
    "ENROLLED" | "IN_PROGRESS" | "COMPLETED" | "DROPPED" | null;
  progress?: number;
}

export interface LearningRecommendationsResponse {
  targetCareerRole: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
  } | null;
  recommendations: LearningRecommendationItem[];
  availableCareerRoles: Array<{
    id: string;
    title: string;
    slug: string;
    category?: string | null;
  }>;
}

export const learningService = {
  async getRecommendations(
    targetCareer?: string,
  ): Promise<LearningRecommendationsResponse> {
    const res = await apiClient.get<{
      success: boolean;
      data: LearningRecommendationsResponse;
    }>("/learning/recommendations", {
      params: { targetCareer },
    });
    return res.data.data;
  },

  async getAllPrograms(params?: {
    search?: string;
    difficulty?: string;
  }): Promise<LearningProgramItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { programs: any[]; count: number };
    }>("/learning", { params });

    return res.data.data.programs.map((p) => ({
      ...p,
      coveredSkills: (p.skills || []).map((s: any) => ({
        id: s.skill?.id || s.skillId,
        name: s.skill?.name || "Skill",
        slug: s.skill?.slug || "",
        categoryName: s.skill?.category?.name,
        targetProficiency: s.targetProficiency || 75,
        studentScore: 0,
        gapPoints: 0,
        isCore: true,
      })),
    }));
  },

  async getProgramById(
    idOrSlug: string,
  ): Promise<LearningProgramItem & { enrollment?: any }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { program: any };
    }>(`/learning/${idOrSlug}`);
    return res.data.data.program;
  },

  async enrollInProgram(learningProgramId: string): Promise<any> {
    const res = await apiClient.post<{
      success: boolean;
      data: { enrollment: any };
    }>("/learning/enroll", { learningProgramId });
    return res.data.data.enrollment;
  },

  async updateProgress(
    programId: string,
    progress: number,
    status?: string,
  ): Promise<any> {
    const res = await apiClient.put<{
      success: boolean;
      data: { enrollment: any };
    }>(`/learning/${programId}/progress`, { progress, status });
    return res.data.data.enrollment;
  },
};
