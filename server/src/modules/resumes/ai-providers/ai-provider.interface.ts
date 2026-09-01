import { ProficiencyLevel } from "@prisma/client";

export interface ExtractedSkillRaw {
  name: string;
  confidence: number; // 0 to 100
  suggestedProficiency?: ProficiencyLevel;
  contextSnippet?: string;
  category?: string;
}

export interface IAIExtractionProvider {
  providerName: string;
  extractSkillsFromText(
    resumeText: string,
    knownTaxonomySkills: Array<{
      id: string;
      name: string;
      slug: string;
      categoryName: string;
    }>,
  ): Promise<ExtractedSkillRaw[]>;
}
