import { OpportunityType, WorkMode, ProficiencyLevel } from "@prisma/client";

export interface ParsedSkillRequirement {
  skillId: string;
  skillName: string;
  skillSlug: string;
  category: string;
  proficiency: ProficiencyLevel;
  minScore: number;
  isMandatory: boolean;
  weight: number;
  confidenceScore: number;
  contextSnippet: string;
}

export interface ParsedJobDescriptionResult {
  suggestedTitle: string;
  suggestedType: OpportunityType;
  suggestedWorkMode: WorkMode;
  suggestedLocation: string | null;
  suggestedDuration: string | null;
  suggestedMinCgpa: number;
  suggestedEligibleBranches: string[];
  suggestedEligibleGradYears: number[];
  suggestedSkills: ParsedSkillRequirement[];
  eligibilityKeywords: string[];
  rawTextLength: number;
  disclaimer: string;
}

export class JobDescriptionParserEngine {
  private static skillAliases: Record<string, string[]> = {
    javascript: ["js", "ecmascript", "es6", "modern javascript"],
    typescript: ["ts"],
    react: ["reactjs", "react.js", "react native"],
    "node.js": ["nodejs", "node", "express", "express.js", "expressjs"],
    postgresql: ["postgres", "psql", "pgsql", "relational database"],
    mongodb: ["mongo", "nosql document db"],
    docker: ["container", "containers", "containerization", "dockerfile"],
    kubernetes: ["k8s", "helm", "orchestration"],
    python: ["python3", "django", "fastapi", "flask"],
    "amazon web services": ["aws", "cloud", "ec2", "s3", "lambda"],
    "google cloud platform": ["gcp"],
    git: ["github", "gitlab", "version control"],
    sql: ["rdbms", "mysql", "sql queries", "database design"],
    graphql: ["apollo", "graphql api"],
    "restful apis": ["rest api", "rest apis", "restful", "api design", "rest"],
    "tailwind css": ["tailwind", "tailwindcss"],
    html: ["html5", "semantic html"],
    css: ["css3", "scss", "sass"],
    "data structures": ["dsa", "data structures and algorithms", "algorithms"],
  };

  /**
   * Parse Job Description text and extract structured opportunity requirements
   */
  static parse(
    jobDescription: string,
    taxonomySkills: Array<{
      id: string;
      name: string;
      slug: string;
      category: { name: string };
    }>,
  ): ParsedJobDescriptionResult {
    const textLower = jobDescription.toLowerCase();
    const sentences = jobDescription
      .split(/(?<=[.!?\n])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // 1. Inferred Role Title
    let suggestedTitle = "";
    const titleMatch = jobDescription.match(
      /(?:looking for|hiring|seeking|role of|position of|role:|position:|title:)\s*([a-zA-Z0-9\s/+-]{3,40})/i,
    );
    if (titleMatch && titleMatch[1]) {
      suggestedTitle = titleMatch[1]
        .trim()
        .replace(/\b(with|for|in|and)\b.*$/i, "")
        .trim();
    } else {
      // Look for common engineering titles
      if (
        textLower.includes("frontend") ||
        (textLower.includes("react") && !textLower.includes("backend"))
      ) {
        suggestedTitle = "Frontend Engineer";
      } else if (
        textLower.includes("backend") ||
        textLower.includes("node") ||
        textLower.includes("django")
      ) {
        suggestedTitle = "Backend Software Engineer";
      } else if (
        textLower.includes("full stack") ||
        textLower.includes("fullstack")
      ) {
        suggestedTitle = "Full Stack Developer";
      } else if (
        textLower.includes("devops") ||
        textLower.includes("cloud") ||
        textLower.includes("kubernetes")
      ) {
        suggestedTitle = "Cloud DevOps Engineer";
      } else if (
        textLower.includes("data science") ||
        textLower.includes("machine learning") ||
        textLower.includes("ai")
      ) {
        suggestedTitle = "Data Science & AI Engineer";
      } else {
        suggestedTitle = "Software Engineering Associate";
      }
    }

    // 2. Inferred Opportunity Type
    let suggestedType: OpportunityType = OpportunityType.FULL_TIME;
    if (
      textLower.includes("intern") ||
      textLower.includes("internship") ||
      textLower.includes("trainee") ||
      textLower.includes("summer intern")
    ) {
      suggestedType = OpportunityType.INTERNSHIP;
    }

    // 3. Inferred Work Mode
    let suggestedWorkMode: WorkMode = WorkMode.HYBRID;
    if (
      textLower.includes("remote") ||
      textLower.includes("work from home") ||
      textLower.includes("wfh")
    ) {
      suggestedWorkMode = WorkMode.REMOTE;
    } else if (
      textLower.includes("on-site") ||
      textLower.includes("in-office") ||
      textLower.includes("onsite")
    ) {
      suggestedWorkMode = WorkMode.ON_SITE;
    }

    // 4. Inferred Duration
    let suggestedDuration =
      suggestedType === OpportunityType.INTERNSHIP ? "6 Months" : "Full-Time";
    const durationMatch = jobDescription.match(
      /(\d+\s*(?:months?|weeks?|years?))/i,
    );
    if (durationMatch) {
      suggestedDuration = durationMatch[1].trim();
    }

    // 5. Inferred Eligibility (CGPA, Branches, Batch Years)
    let suggestedMinCgpa = 0.0;
    const cgpaMatch = jobDescription.match(
      /(?:cgpa|gpa|cutoff)\s*(?:of|>=|:|>\s*)?\s*([0-9]\.[0-9]|[0-9])/i,
    );
    if (cgpaMatch) {
      const val = parseFloat(cgpaMatch[1]);
      if (val >= 5.0 && val <= 10.0) suggestedMinCgpa = val;
    }

    const suggestedEligibleBranches: string[] = [];
    if (
      textLower.includes("computer science") ||
      textLower.includes("cse") ||
      textLower.includes("cs/it")
    ) {
      suggestedEligibleBranches.push("Computer Science & Engineering");
    }
    if (
      textLower.includes("information technology") ||
      textLower.includes("it branch") ||
      textLower.includes("it,")
    ) {
      suggestedEligibleBranches.push("Information Technology");
    }
    if (
      textLower.includes("electronics") ||
      textLower.includes("ece") ||
      textLower.includes("electrical")
    ) {
      suggestedEligibleBranches.push("Electronics & Communication");
    }
    if (suggestedEligibleBranches.length === 0) {
      suggestedEligibleBranches.push(
        "Computer Science & Engineering",
        "Information Technology",
      );
    }

    const suggestedEligibleGradYears: number[] = [];
    const yearMatches = jobDescription.match(/\b(202[4-9])\b/g);
    if (yearMatches) {
      yearMatches.forEach((y) => {
        const yr = parseInt(y, 10);
        if (!suggestedEligibleGradYears.includes(yr))
          suggestedEligibleGradYears.push(yr);
      });
    }
    if (suggestedEligibleGradYears.length === 0) {
      suggestedEligibleGradYears.push(2025, 2026);
    }

    // Extract Eligibility Keywords for recruiter overview
    const eligibilityKeywords: string[] = [];
    if (suggestedMinCgpa > 0)
      eligibilityKeywords.push(`Min CGPA: ${suggestedMinCgpa}`);
    if (suggestedEligibleBranches.length > 0)
      eligibilityKeywords.push(suggestedEligibleBranches.join(", "));
    if (suggestedEligibleGradYears.length > 0)
      eligibilityKeywords.push(
        `Batches: ${suggestedEligibleGradYears.join("/")}`,
      );

    // 6. Skill Extraction & Normalization
    const suggestedSkills: ParsedSkillRequirement[] = [];
    const processedSkillIds = new Set<string>();

    for (const skill of taxonomySkills) {
      const skillNameLower = skill.name.toLowerCase();
      const aliases = [
        skillNameLower,
        ...(this.skillAliases[skillNameLower] || []),
      ];

      let matchFound = false;
      let matchedSnippet = "";
      let occurrences = 0;

      for (const alias of aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`\\b${escaped}\\b`, "gi");
        const matches = textLower.match(regex);

        if (matches && matches.length > 0) {
          matchFound = true;
          occurrences += matches.length;

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

      if (matchFound && !processedSkillIds.has(skill.id)) {
        processedSkillIds.add(skill.id);

        const snippetLower = matchedSnippet.toLowerCase();

        // Proficiency inference
        let proficiency: ProficiencyLevel = ProficiencyLevel.INTERMEDIATE;
        let minScore = 60.0;
        let isMandatory = true;
        let weight = 1.0;
        let confidenceScore = 80;

        if (
          snippetLower.includes("expert") ||
          snippetLower.includes("senior") ||
          snippetLower.includes("deep understanding") ||
          snippetLower.includes("in-depth") ||
          snippetLower.includes("strong understanding") ||
          snippetLower.includes("3+ years") ||
          snippetLower.includes("4+ years")
        ) {
          proficiency = ProficiencyLevel.ADVANCED;
          minScore = 75.0;
          confidenceScore = 95;
        } else if (
          snippetLower.includes("basic") ||
          snippetLower.includes("familiar") ||
          snippetLower.includes("familiarity with") ||
          snippetLower.includes("knowledge of") ||
          snippetLower.includes("learning")
        ) {
          proficiency = ProficiencyLevel.BEGINNER;
          minScore = 50.0;
          confidenceScore = 75;
        }

        // Mandatory vs Optional check
        if (
          snippetLower.includes("nice to have") ||
          snippetLower.includes("preferred") ||
          snippetLower.includes("bonus") ||
          snippetLower.includes("plus") ||
          snippetLower.includes("optional") ||
          snippetLower.includes("good to have")
        ) {
          isMandatory = false;
          weight = 0.8;
        } else if (
          snippetLower.includes("must have") ||
          snippetLower.includes("required") ||
          snippetLower.includes("essential") ||
          snippetLower.includes("core") ||
          occurrences >= 2
        ) {
          isMandatory = true;
          weight = 1.5;
          confidenceScore = Math.min(99, confidenceScore + 5);
        }

        suggestedSkills.push({
          skillId: skill.id,
          skillName: skill.name,
          skillSlug: skill.slug,
          category: skill.category.name,
          proficiency,
          minScore,
          isMandatory,
          weight,
          confidenceScore,
          contextSnippet:
            matchedSnippet ||
            `Detected ${skill.name} in job description requirements`,
        });
      }
    }

    // Sort: mandatory skills first, then by confidence descending
    suggestedSkills.sort((a, b) => {
      if (a.isMandatory !== b.isMandatory) {
        return a.isMandatory ? -1 : 1;
      }
      return b.confidenceScore - a.confidenceScore;
    });

    return {
      suggestedTitle,
      suggestedType,
      suggestedWorkMode,
      suggestedLocation: null,
      suggestedDuration,
      suggestedMinCgpa,
      suggestedEligibleBranches,
      suggestedEligibleGradYears,
      suggestedSkills,
      eligibilityKeywords,
      rawTextLength: jobDescription.length,
      disclaimer:
        "AI suggestions are draft recommendations. Recruiter must review, edit, and confirm requirements before publishing.",
    };
  }
}
