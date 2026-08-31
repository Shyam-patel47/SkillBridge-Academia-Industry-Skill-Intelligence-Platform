import { apiClient } from "../lib/apiClient";

export interface StudentSkillItem {
  id: string;
  skillId: string;
  score: number;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  isVerified: boolean;
  lastAssessedAt?: string;
  skill: {
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
};
