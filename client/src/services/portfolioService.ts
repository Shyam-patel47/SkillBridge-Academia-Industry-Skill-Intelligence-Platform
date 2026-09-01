import { apiClient } from "../lib/apiClient";

export interface PortfolioSettings {
  id?: string;
  customSlug: string;
  isPublic: boolean;
  aboutMe?: string | null;
  themeColor?: string | null;
  viewsCount: number;
}

export interface StudentProfileData {
  id?: string;
  fullName: string;
  headline?: string | null;
  location?: string | null;
  college?: string | null;
  branch?: string | null;
  gradYear?: number | null;
  cgpa?: number | null;
  bio?: string | null;
  resumeUrl?: string | null;
  careerInterests: string[];
  preferredLocations: string[];
  workModePref: string;
  email: string;
  phone?: string | null;
}

export interface PortfolioSkill {
  id?: string;
  skillId: string;
  skillName: string;
  skillSlug?: string;
  category: string;
  score: number;
  proficiency?: string;
  isVerified: boolean;
  lastAssessedAt?: string | null;
}

export interface PortfolioProject {
  id: string;
  studentId?: string;
  title: string;
  description: string;
  liveUrl?: string | null;
  githubUrl?: string | null;
  skillsUsed: string[];
  startDate?: string | null;
  endDate?: string | null;
  isFeatured: boolean;
  createdAt?: string;
}

export interface PortfolioCertification {
  id: string;
  studentId?: string;
  skillId?: string | null;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string | null;
  credentialUrl?: string | null;
  credentialId?: string | null;
  skill?: { id: string; name: string };
  createdAt?: string;
}

export interface PortfolioAchievement {
  id: string;
  studentId?: string;
  title: string;
  description?: string | null;
  issuer?: string | null;
  issueDate?: string | null;
  certificateUrl?: string | null;
  createdAt?: string;
}

export interface PortfolioExperience {
  id?: string;
  role: string;
  companyName: string;
  companyLogo?: string | null;
  type?: string;
  workMode?: string;
  location?: string | null;
  duration?: string | null;
  status?: string;
}

export interface DigitalPortfolioDossier {
  profile: StudentProfileData;
  portfolioSettings: PortfolioSettings;
  skills: PortfolioSkill[];
  projects: PortfolioProject[];
  certifications: PortfolioCertification[];
  achievements: PortfolioAchievement[];
  experience: PortfolioExperience[];
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
  skillsUsed: string[];
  startDate?: string;
  endDate?: string;
  isFeatured?: boolean;
}

export interface CreateCertificationPayload {
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
  credentialId?: string;
  skillId?: string;
}

export interface CreateAchievementPayload {
  title: string;
  description?: string;
  issuer?: string;
  issueDate?: string;
  certificateUrl?: string;
}

export interface UpdatePortfolioSettingsPayload {
  isPublic?: boolean;
  customSlug?: string;
  aboutMe?: string;
  themeColor?: string;
}

export const portfolioService = {
  /**
   * Get Student Portfolio Studio Data
   */
  async getMyPortfolio(): Promise<DigitalPortfolioDossier> {
    const res = await apiClient.get<{
      success: boolean;
      data: { portfolio: DigitalPortfolioDossier };
    }>("/portfolios/me");
    return res.data.data.portfolio;
  },

  /**
   * Update Portfolio Settings
   */
  async updateSettings(
    payload: UpdatePortfolioSettingsPayload,
  ): Promise<PortfolioSettings> {
    const res = await apiClient.patch<{
      success: boolean;
      data: { settings: PortfolioSettings };
    }>("/portfolios/me/settings", payload);
    return res.data.data.settings;
  },

  /**
   * Public: Get Portfolio by Custom Slug
   */
  async getPublicPortfolio(slug: string): Promise<DigitalPortfolioDossier> {
    const res = await apiClient.get<{
      success: boolean;
      data: { portfolio: DigitalPortfolioDossier };
    }>(`/portfolios/public/${slug}`);
    return res.data.data.portfolio;
  },

  // Projects CRUD
  async addProject(payload: CreateProjectPayload): Promise<PortfolioProject> {
    const res = await apiClient.post<{
      success: boolean;
      data: { project: PortfolioProject };
    }>("/portfolios/me/projects", payload);
    return res.data.data.project;
  },

  async updateProject(
    id: string,
    payload: Partial<CreateProjectPayload>,
  ): Promise<PortfolioProject> {
    const res = await apiClient.patch<{
      success: boolean;
      data: { project: PortfolioProject };
    }>(`/portfolios/me/projects/${id}`, payload);
    return res.data.data.project;
  },

  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/portfolios/me/projects/${id}`);
  },

  // Certifications CRUD
  async addCertification(
    payload: CreateCertificationPayload,
  ): Promise<PortfolioCertification> {
    const res = await apiClient.post<{
      success: boolean;
      data: { certification: PortfolioCertification };
    }>("/portfolios/me/certifications", payload);
    return res.data.data.certification;
  },

  async updateCertification(
    id: string,
    payload: Partial<CreateCertificationPayload>,
  ): Promise<PortfolioCertification> {
    const res = await apiClient.patch<{
      success: boolean;
      data: { certification: PortfolioCertification };
    }>(`/portfolios/me/certifications/${id}`, payload);
    return res.data.data.certification;
  },

  async deleteCertification(id: string): Promise<void> {
    await apiClient.delete(`/portfolios/me/certifications/${id}`);
  },

  // Achievements CRUD
  async addAchievement(
    payload: CreateAchievementPayload,
  ): Promise<PortfolioAchievement> {
    const res = await apiClient.post<{
      success: boolean;
      data: { achievement: PortfolioAchievement };
    }>("/portfolios/me/achievements", payload);
    return res.data.data.achievement;
  },

  async updateAchievement(
    id: string,
    payload: Partial<CreateAchievementPayload>,
  ): Promise<PortfolioAchievement> {
    const res = await apiClient.patch<{
      success: boolean;
      data: { achievement: PortfolioAchievement };
    }>(`/portfolios/me/achievements/${id}`, payload);
    return res.data.data.achievement;
  },

  async deleteAchievement(id: string): Promise<void> {
    await apiClient.delete(`/portfolios/me/achievements/${id}`);
  },
};
