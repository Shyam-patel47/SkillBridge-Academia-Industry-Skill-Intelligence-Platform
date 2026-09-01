import { ProficiencyLevel } from "@prisma/client";
import {
  IAIExtractionProvider,
  ExtractedSkillRaw,
} from "./ai-provider.interface.js";

export class GeminiExtractionProvider implements IAIExtractionProvider {
  providerName = "Google Gemini 1.5 Flash AI Engine";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async extractSkillsFromText(
    resumeText: string,
    knownTaxonomySkills: Array<{
      id: string;
      name: string;
      slug: string;
      categoryName: string;
    }>,
  ): Promise<ExtractedSkillRaw[]> {
    const knownSkillsList = knownTaxonomySkills.map((s) => s.name).join(", ");

    const prompt = `You are an expert technical resume parser and skill intelligence engine.
Analyze the following candidate resume text and extract all technical and soft skills possessed by the candidate.
Map skills where possible to the following platform taxonomy skills:
${knownSkillsList}

For each detected skill, return a JSON array of objects with:
- "name": string (the exact or normalized skill name)
- "confidence": number (an integer from 50 to 99 representing confidence score)
- "suggestedProficiency": "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
- "contextSnippet": string (a short 1-sentence quote or phrase from the resume demonstrating this skill)
- "category": string (domain category, e.g. Frontend, Backend, Cloud & DevOps, Database)

Resume Text:
"""
${resumeText.slice(0, 8000)}
"""

Return ONLY a valid JSON array of skill objects. Do NOT include markdown code fences or conversational text.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data: any = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) return [];

      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) return [];

      return parsed.map((item: any) => ({
        name: String(item.name || ""),
        confidence: Number(item.confidence || 75),
        suggestedProficiency: ["BEGINNER", "INTERMEDIATE", "ADVANCED"].includes(
          item.suggestedProficiency,
        )
          ? item.suggestedProficiency
          : ProficiencyLevel.INTERMEDIATE,
        contextSnippet: String(item.contextSnippet || ""),
        category: String(item.category || "General"),
      }));
    } catch (err) {
      console.warn(
        "[GeminiExtractionProvider] External API call failed or timed out. Falling back to local NLP provider:",
        err,
      );
      throw err; // Caller will catch and fallback to NLP provider
    }
  }
}
