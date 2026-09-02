export interface CareerExplanationInput {
  roleTitle: string;
  compatibilityScore: number;
  readinessLevel: string;
  matchingSkills: Array<{
    skillName: string;
    studentScore: number;
    requiredBenchmark: number;
  }>;
  skillGaps: Array<{
    skillName: string;
    gapPoints: number;
    studentScore: number;
    requiredBenchmark: number;
    isCore: boolean;
  }>;
  missingSkills: Array<{
    skillName: string;
  }>;
}

export interface CareerExplanationResult {
  aiExplanation: string;
  keyStrengths: string[];
  priorityAction: string;
  isAiGenerated: boolean;
}

export class CareerAIExplanationService {
  /**
   * Generate human-readable AI explanation for career compatibility and skill gaps.
   * NOTE: Does NOT alter the deterministic calculated score or gap points.
   */
  static async generateExplanation(
    input: CareerExplanationInput,
  ): Promise<CareerExplanationResult> {
    const {
      roleTitle,
      compatibilityScore,
      readinessLevel,
      matchingSkills,
      skillGaps,
      missingSkills,
    } = input;

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API key is available and not in fast unit test mode, attempt AI generation
    if (process.env.NODE_ENV !== "test" && apiKey && apiKey.trim().length > 0) {
      try {
        const prompt = `You are a career advisor for university students on the SkillBridge platform.
Explain this student's career compatibility in 2 concise sentences. Do not mention or change the score calculation.
Role: "${roleTitle}"
Calculated Match Score: ${compatibilityScore}% (${readinessLevel})
Matching Skills: ${matchingSkills.map((m) => `${m.skillName} (score: ${m.studentScore}/${m.requiredBenchmark})`).join(", ") || "None"}
Skill Gaps: ${skillGaps.map((g) => `${g.skillName} (gap: -${g.gapPoints}pts, score: ${g.studentScore}/${g.requiredBenchmark})`).join(", ") || "None"}
Unverified Skills: ${missingSkills.map((m) => m.skillName).join(", ") || "None"}

Return ONLY valid JSON matching this structure:
{
  "explanation": "Your strongest alignment comes from...",
  "keyStrengths": ["Strength 1", "Strength 2"],
  "priorityAction": "Action to close top gap"
}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
              },
            }),
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data: any = await response.json();
          const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            if (parsed.explanation) {
              return {
                aiExplanation: String(parsed.explanation),
                keyStrengths: Array.isArray(parsed.keyStrengths)
                  ? parsed.keyStrengths.map(String)
                  : matchingSkills.slice(0, 3).map((m) => m.skillName),
                priorityAction: String(
                  parsed.priorityAction ||
                    (skillGaps[0]
                      ? `Focus on closing the gap in ${skillGaps[0].skillName}`
                      : "Explore advanced specializations"),
                ),
                isAiGenerated: true,
              };
            }
          }
        }
      } catch {
        // Fall through safely to offline intelligent generator
      }
    }

    // 2. Intelligent, deterministic natural language explanation generator (Offline / Safe Fallback)
    return this.generateIntelligentFallback(input);
  }

  /**
   * Deterministic explanation fallback that produces human-friendly, contextual narratives
   */
  static generateIntelligentFallback(
    input: CareerExplanationInput,
  ): CareerExplanationResult {
    const {
      roleTitle,
      compatibilityScore,
      matchingSkills,
      skillGaps,
      missingSkills,
    } = input;

    const keyStrengths: string[] = matchingSkills
      .slice(0, 3)
      .map((m) => m.skillName);

    let priorityAction =
      "Maintain current skills and apply for entry opportunities.";
    if (skillGaps.length > 0) {
      const topGap = skillGaps[0];
      priorityAction = `Take benchmark assessments or courses in ${topGap.skillName} to close the ${topGap.gapPoints}pt deficit.`;
    } else if (missingSkills.length > 0) {
      priorityAction = `Complete skill verification assessments in ${missingSkills[0].skillName}.`;
    }

    let aiExplanation = "";
    if (matchingSkills.length > 0 && skillGaps.length > 0) {
      const strengthsText = matchingSkills
        .slice(0, 3)
        .map((m) => m.skillName)
        .join(", ");
      const gapsText = skillGaps
        .slice(0, 2)
        .map((g) => `${g.skillName} (-${g.gapPoints}pts)`)
        .join(" and ");
      aiExplanation = `Your strongest alignment for ${roleTitle} comes from ${strengthsText}. To elevate your match from ${compatibilityScore}%, prioritize closing your remaining deficit in ${gapsText}.`;
    } else if (matchingSkills.length > 0 && skillGaps.length === 0) {
      const strengthsText = matchingSkills.map((m) => m.skillName).join(", ");
      aiExplanation = `Outstanding candidate profile for ${roleTitle}! You exceed or fulfill all benchmark requirements across ${strengthsText} with full readiness.`;
    } else {
      const targetSkills = (skillGaps.length > 0 ? skillGaps : missingSkills)
        .slice(0, 3)
        .map((s) => s.skillName)
        .join(", ");
      aiExplanation = `You are in the developing stage for ${roleTitle}. Building foundational competencies in ${targetSkills} will rapidly accelerate your compatibility score.`;
    }

    return {
      aiExplanation,
      keyStrengths,
      priorityAction,
      isAiGenerated: false,
    };
  }
}
