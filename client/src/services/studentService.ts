import { apiClient } from "../lib/apiClient";

export interface StudentSkillItem {
  id: string;
  skillId: string;
  name?: string;
  category?: string;
  score: number;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isVerified: boolean;
  lastAssessedAt?: string | null;
  skill?: {
    id: string;
    name: string;
    slug: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface StudentCategorySkillsItem {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  icon?: string | null;
  averageScore: number;
  skillCount: number;
  skills: Array<{
    id: string;
    skillId: string;
    name: string;
    slug: string;
    score: number;
    proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
    isVerified: boolean;
    lastAssessedAt?: string | null;
  }>;
}

export interface StudentSkillsSummaryData {
  overallScore: number;
  totalSkills: number;
  verifiedSkillsCount: number;
  categories: StudentCategorySkillsItem[];
  technicalSkills: StudentSkillItem[];
  softSkills: StudentSkillItem[];
  strengths: Array<{
    id: string;
    skillId: string;
    name: string;
    category: string;
    score: number;
    proficiency: string;
    isVerified: boolean;
  }>;
  weakSkills: Array<{
    id: string;
    skillId: string;
    name: string;
    category: string;
    score: number;
    proficiency: string;
    isVerified: boolean;
  }>;
  recentAssessmentsCount: number;
}

export interface StudentSkillHistoryItem {
  id: string;
  assessmentId: string;
  title: string;
  slug: string;
  category: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  skillBreakdown?: Array<{
    skillId: string;
    skillName: string;
    score: number;
    proficiency: string;
  }>;
}

export interface StudentProfileData {
  id: string;
  userId: string;
  fullName: string;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  college?: string | null;
  branch?: string | null;
  gradYear?: number | null;
  cgpa?: number | null;
  bio?: string | null;
  careerInterests: string[];
  preferredLocations: string[];
  workModePref: "REMOTE" | "HYBRID" | "ON_SITE" | "ANY";
  skills: StudentSkillItem[];
  user: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
  institution?: {
    id: string;
    institutionName: string;
    code: string;
  } | null;
}

export interface UpdateStudentProfileDTO {
  fullName?: string;
  headline?: string | null;
  phone?: string | null;
  location?: string | null;
  college?: string | null;
  branch?: string | null;
  gradYear?: number | null;
  cgpa?: number | null;
  bio?: string | null;
  careerInterests?: string[];
  preferredLocations?: string[];
  workModePref?: "REMOTE" | "HYBRID" | "ON_SITE" | "ANY";
  selectedSkillIds?: string[];
}

export const studentService = {
  async getMyProfile(): Promise<StudentProfileData> {
    const res = await apiClient.get<{
      success: boolean;
      data: { profile: StudentProfileData };
    }>("/students/me");
    return res.data.data.profile;
  },

  async updateMyProfile(
    payload: UpdateStudentProfileDTO,
  ): Promise<StudentProfileData> {
    const res = await apiClient.put<{
      success: boolean;
      data: { profile: StudentProfileData };
    }>("/students/me", payload);
    return res.data.data.profile;
  },

  async getMySkillsSummary(): Promise<StudentSkillsSummaryData> {
    const res = await apiClient.get<{
      success: boolean;
      data: StudentSkillsSummaryData;
    }>("/students/me/skills");
    return res.data.data;
  },

  async getMySkillHistory(): Promise<StudentSkillHistoryItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { history: StudentSkillHistoryItem[] };
    }>("/students/me/skill-history");
    return res.data.data.history;
  },
};
