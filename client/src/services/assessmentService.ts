import { apiClient } from "../lib/apiClient";

export interface AssessmentListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
  };
  durationMinutes: number;
  passingScore: number;
  questionCount: number;
  totalAttempts: number;
  latestAttempt?: {
    id: string;
    score: number;
    percentage: number;
    passed: boolean;
    completedAt: string;
  } | null;
}

export interface AssessmentQuestionSessionItem {
  id: string;
  questionText: string;
  codeSnippet?: string | null;
  options: string[];
  difficulty: string;
  weight: number;
  skill: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface AssessmentSessionData {
  id: string;
  title: string;
  slug: string;
  description?: string;
  durationMinutes: number;
  passingScore: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  questions: AssessmentQuestionSessionItem[];
}

export interface QuestionReviewItem {
  questionId: string;
  questionText: string;
  codeSnippet?: string | null;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string | null;
  skillId: string;
  skillName: string;
}

export interface SkillScoreItem {
  skillId: string;
  skillName: string;
  score: number;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  correctCount: number;
  questionCount: number;
}

export interface AssessmentResultData {
  responseId: string;
  assessment: {
    id: string;
    title: string;
    slug: string;
    passingScore: number;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  skillBreakdown: SkillScoreItem[];
  strengths: {
    skillId: string;
    skillName: string;
    score: number;
    proficiency: string;
  }[];
  weakAreas: {
    skillId: string;
    skillName: string;
    score: number;
    proficiency: string;
  }[];
  questionReview: QuestionReviewItem[];
  completedAt: string;
}

export const assessmentService = {
  async getAssessments(params?: {
    category?: string;
    search?: string;
  }): Promise<AssessmentListItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { assessments: AssessmentListItem[] };
    }>("/assessments", { params });
    return res.data.data.assessments;
  },

  async getAssessmentForSession(
    idOrSlug: string,
  ): Promise<AssessmentSessionData> {
    const res = await apiClient.get<{
      success: boolean;
      data: { assessment: AssessmentSessionData };
    }>(`/assessments/${idOrSlug}`);
    return res.data.data.assessment;
  },

  async submitAssessment(
    idOrSlug: string,
    answers: { questionId: string; selectedOptionIndex: number }[],
  ): Promise<AssessmentResultData> {
    const res = await apiClient.post<{
      success: boolean;
      data: { result: AssessmentResultData };
    }>(`/assessments/${idOrSlug}/submit`, { answers });
    return res.data.data.result;
  },

  async getAssessmentResult(idOrSlug: string): Promise<AssessmentResultData> {
    const res = await apiClient.get<{
      success: boolean;
      data: { result: AssessmentResultData };
    }>(`/assessments/${idOrSlug}/result`);
    return res.data.data.result;
  },
};
