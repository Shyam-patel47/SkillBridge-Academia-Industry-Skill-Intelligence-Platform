import { ProficiencyLevel } from "@prisma/client";
import {
  IAIExtractionProvider,
  ExtractedSkillRaw,
} from "./ai-provider.interface.js";

export class NlpFallbackExtractionProvider implements IAIExtractionProvider {
  providerName = "Intelligent NLP & Taxonomy Normalizer";

  private skillAliasMap: Record<string, string[]> = {
    javascript: ["js", "ecmascript", "es6", "es2020"],
    typescript: ["ts"],
    react: ["react.js", "reactjs", "react native"],
    "node.js": ["nodejs", "node", "express.js", "expressjs"],
    postgresql: ["postgres", "pgsql", "psql"],
    mongodb: ["mongo", "mongoose"],
    docker: ["dockerfile", "containerization", "containers", "docker-compose"],
    kubernetes: ["k8s", "kubectl", "helm"],
    python: ["py", "python3", "django", "fastapi", "flask"],
    "amazon web services": ["aws", "ec2", "s3", "lambda", "cloudformation"],
    "google cloud platform": ["gcp", "bigquery", "cloud run"],
    git: ["github", "gitlab", "git version control"],
    sql: ["rdbms", "mysql", "sqlite", "oracle sql", "relational database"],
    graphql: ["apollo graphql", "relay"],
    tailwind: ["tailwindcss", "tailwind css"],
    html: ["html5"],
    css: ["css3", "sass", "scss"],
  };

  async extractSkillsFromText(
    resumeText: string,
    knownTaxonomySkills: Array<{
      id: string;
      name: string;
      slug: string;
      categoryName: string;
    }>,
  ): Promise<ExtractedSkillRaw[]> {
    const textLower = resumeText.toLowerCase();
    const sentences = resumeText
      .split(/(?<=[.!?\n])/)
      .map((s) => s.trim())
      .filter(Boolean);

    const extracted: ExtractedSkillRaw[] = [];
    const seenSkills = new Set<string>();

    for (const skill of knownTaxonomySkills) {
      const skillNameLower = skill.name.toLowerCase();
      const aliases = [
        skillNameLower,
        ...(this.skillAliasMap[skillNameLower] || []),
      ];

      let matchFound = false;
      let highestConfidence = 0;
      let matchedSnippet = "";
      let occurrences = 0;

      for (const alias of aliases) {
        // Safe regex with word boundary
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "gi");
        const matches = textLower.match(regex);

        if (matches && matches.length > 0) {
          matchFound = true;
          occurrences += matches.length;

          // Find best sentence snippet
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(alias)) {
              if (
                sentence.length > matchedSnippet.length &&
                sentence.length < 250
              ) {
                matchedSnippet = sentence;
              }
            }
          }
        }
      }

      if (matchFound && !seenSkills.has(skill.id)) {
        seenSkills.add(skill.id);

        // Confidence calculation based on occurrences and context
        let baseConfidence = 75;
        if (occurrences >= 3) baseConfidence = 95;
        else if (occurrences === 2) baseConfidence = 88;
        else if (matchedSnippet.length > 20) baseConfidence = 82;

        // Proficiency inference based on keywords in snippet
        let proficiency: ProficiencyLevel = ProficiencyLevel.INTERMEDIATE;
        const snippetLower = matchedSnippet.toLowerCase();

        if (
          snippetLower.includes("lead") ||
          snippetLower.includes("architect") ||
          snippetLower.includes("senior") ||
          snippetLower.includes("expert") ||
          snippetLower.includes("3+ years") ||
          snippetLower.includes("4+ years") ||
          snippetLower.includes("5+ years")
        ) {
          proficiency = ProficiencyLevel.ADVANCED;
          baseConfidence = Math.min(99, baseConfidence + 4);
        } else if (
          snippetLower.includes("familiar") ||
          snippetLower.includes("basic") ||
          snippetLower.includes("learning") ||
          snippetLower.includes("coursework") ||
          snippetLower.includes("beginner")
        ) {
          proficiency = ProficiencyLevel.BEGINNER;
        }

        extracted.push({
          name: skill.name,
          confidence: Math.min(99, Math.max(65, baseConfidence)),
          suggestedProficiency: proficiency,
          contextSnippet:
            matchedSnippet || `Detected ${skill.name} in resume profile`,
          category: skill.categoryName,
        });
      }
    }

    // Sort by confidence descending
    return extracted.sort((a, b) => b.confidence - a.confidence);
  }
}
