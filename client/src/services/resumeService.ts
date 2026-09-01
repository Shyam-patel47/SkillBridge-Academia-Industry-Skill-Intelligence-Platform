import { apiClient } from "../lib/apiClient";

export interface DetectedSkillItem {
  skillId: string;
  skillName: string;
  skillSlug: string;
  category: string;
  confidenceScore: number;
  suggestedProficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  contextSnippet: string;
  alreadyPossessed: boolean;
  currentScore?: number;
  isCurrentVerified?: boolean;
}

export interface ExtractionResponse {
  extractedSkillsCount: number;
  detectedSkills: DetectedSkillItem[];
  rawTextLength: number;
  providerUsed: string;
  disclaimer: string;
}

export interface ConfirmSkillItem {
  skillId: string;
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  selfReportedScore?: number;
}

export const resumeService = {
  /**
   * Upload resume file (PDF, DOCX, TXT) and extract skills
   */
  async extractSkillsFromFile(file: File): Promise<ExtractionResponse> {
    const formData = new FormData();
    formData.append("resumeFile", file);

    const res = await apiClient.post<{
      success: boolean;
      data: { extraction: ExtractionResponse };
    }>("/resumes/extract", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data.data.extraction;
  },

  /**
   * Extract skills from pasted resume text
   */
  async extractSkillsFromText(rawText: string): Promise<ExtractionResponse> {
    const res = await apiClient.post<{
      success: boolean;
      data: { extraction: ExtractionResponse };
    }>("/resumes/extract", { rawText });

    return res.data.data.extraction;
  },

  /**
   * Confirm and accept selected skills into student profile
   */
  async confirmSkills(acceptedSkills: ConfirmSkillItem[]): Promise<{
    confirmedCount: number;
    message: string;
  }> {
    const res = await apiClient.post<{
      success: boolean;
      data: { confirmedCount: number; message: string };
    }>("/resumes/confirm-skills", { acceptedSkills });

    return res.data.data;
  },
};
