import { apiClient } from "../lib/apiClient";

export type ApplicationStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "OFFER"
  | "OFFERED"
  | "REJECTED"
  | "JOINED"
  | "WITHDRAWN";

export interface MatchingSkillItem {
  skillId: string;
  skillName: string;
  studentScore: number;
  minScore: number;
  isMandatory?: boolean;
}

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  studentScore: number;
  minScore: number;
  deficit?: number;
  isMandatory?: boolean;
}

export interface ApplicationItem {
  id: string;
  rank?: number;
  opportunityId: string;
  status: ApplicationStatus;
  matchScore: number;
  skillCompatibility?: number;
  eligibilityScore?: number;
  isEligible?: boolean;
  matchingSkills?: MatchingSkillItem[];
  missingSkills?: SkillGapItem[];
  explanation?: string;
  matchBreakdown?: any;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  statusNotes?: string | null;
  appliedAt: string;
  updatedAt: string;
  opportunity: {
    id: string;
    title: string;
    slug?: string;
    type: string;
    workMode: string;
    location?: string | null;
    duration?: string | null;
    stipendSalary?: string | null;
    deadline?: string | null;
    isActive: boolean;
    company: {
      id: string;
      companyName: string;
      industry?: string | null;
      logoUrl?: string | null;
      location?: string | null;
      isVerified?: boolean;
    };
    requiredSkillsCount?: number;
  };
  student?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    college?: string | null;
    branch?: string | null;
    gradYear?: number | null;
    cgpa?: number | null;
    headline?: string | null;
    skills: Array<{
      skillId: string;
      skillName: string;
      score: number;
      verified?: boolean;
    }>;
  };
}

export interface ApplyPayload {
  opportunityId: string;
  resumeUrl?: string;
  coverLetter?: string;
}

export interface RecruiterFilterParams {
  opportunityId?: string;
  status?: string;
  search?: string;
  minMatchScore?: number;
  minCgpa?: number;
  branch?: string;
  gradYear?: number;
  skill?: string;
}

export const applicationService = {
  /**
   * Student: Submit Application
   */
  async apply(payload: ApplyPayload): Promise<ApplicationItem> {
    const res = await apiClient.post<{
      success: boolean;
      data: { application: ApplicationItem };
    }>("/applications", payload);
    return res.data.data.application;
  },

  /**
   * Student: List Own Applications
   */
  async getStudentApplications(params?: {
    status?: string;
    search?: string;
  }): Promise<ApplicationItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { applications: ApplicationItem[]; count: number };
    }>("/applications/me", { params });
    return res.data.data.applications;
  },

  /**
   * Student: Get Application Detail
   */
  async getStudentApplicationDetail(id: string): Promise<ApplicationItem> {
    const res = await apiClient.get<{
      success: boolean;
      data: { application: ApplicationItem };
    }>(`/applications/me/${id}`);
    return res.data.data.application;
  },

  /**
   * Student: Withdraw Application
   */
  async withdrawApplication(
    id: string,
    reason?: string,
  ): Promise<ApplicationItem> {
    const res = await apiClient.post<{
      success: boolean;
      data: { application: ApplicationItem };
    }>(`/applications/${id}/withdraw`, { reason });
    return res.data.data.application;
  },

  /**
   * Recruiter: List Applicants with 5-factor ranking and multi-filters
   */
  async getRecruiterApplications(
    params?: RecruiterFilterParams,
  ): Promise<ApplicationItem[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: { applications: ApplicationItem[]; count: number };
    }>("/applications/recruiter", { params });
    return res.data.data.applications;
  },

  /**
   * Recruiter: Get Candidate Dossier
   */
  async getRecruiterApplicationDetail(id: string): Promise<any> {
    const res = await apiClient.get<{
      success: boolean;
      data: { application: any };
    }>(`/applications/recruiter/${id}`);
    return res.data.data.application;
  },

  /**
   * Recruiter: Update Candidate Status
   */
  async updateStatus(
    id: string,
    status: ApplicationStatus,
    statusNotes?: string,
  ): Promise<ApplicationItem> {
    const res = await apiClient.patch<{
      success: boolean;
      data: { application: ApplicationItem };
    }>(`/applications/recruiter/${id}/status`, { status, statusNotes });
    return res.data.data.application;
  },
};
