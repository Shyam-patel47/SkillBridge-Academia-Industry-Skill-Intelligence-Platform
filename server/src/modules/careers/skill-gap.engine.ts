export interface BenchmarkSkill {
  skillId: string;
  skillName: string;
  categoryName?: string;
  minProficiency: number; // 0 to 100 benchmark
  weight: number; // Relative importance, default 1.0
  isCore: boolean; // Whether mandatory for role
}

export interface StudentSkillScore {
  skillId: string;
  skillName: string;
  score: number; // 0 to 100 evaluated
  isVerified?: boolean;
}

export interface SkillMatchItem {
  skillId: string;
  skillName: string;
  categoryName?: string;
  studentScore: number;
  requiredBenchmark: number;
  surplusPoints: number;
  weight: number;
  isCore: boolean;
}

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  categoryName?: string;
  studentScore: number;
  requiredBenchmark: number;
  gapPoints: number;
  weight: number;
  isCore: boolean;
  priority: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface DetailedMatrixItem {
  skillId: string;
  skillName: string;
  categoryName?: string;
  studentScore: number;
  requiredBenchmark: number;
  fulfillmentPercentage: number; // min(100, (student / required) * 100)
  status: "MET" | "PARTIAL_GAP" | "MISSING";
  isCore: boolean;
  weight: number;
}

export interface CareerRoleCompatibilityResult {
  compatibilityScore: number; // 0 to 100
  readinessLevel: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING";
  totalRequiredSkills: number;
  matchingSkillsCount: number;
  gapSkillsCount: number;
  missingSkillsCount: number;
  matchingSkills: SkillMatchItem[];
  missingSkills: SkillGapItem[];
  skillGaps: SkillGapItem[];
  detailedMatrix: DetailedMatrixItem[];
  explanation: string;
}

/**
 * Deterministic, mathematically isolated Skill Intelligence & Gap Engine.
 * Does NOT use AI/ML; scoring is 100% explainable, weighted, and verifiable.
 */
export function calculateCareerRoleCompatibility(
  roleTitle: string,
  benchmarkSkills: BenchmarkSkill[],
  studentSkills: StudentSkillScore[],
): CareerRoleCompatibilityResult {
  if (!benchmarkSkills || benchmarkSkills.length === 0) {
    return {
      compatibilityScore: 0,
      readinessLevel: "DEVELOPING",
      totalRequiredSkills: 0,
      matchingSkillsCount: 0,
      gapSkillsCount: 0,
      missingSkillsCount: 0,
      matchingSkills: [],
      missingSkills: [],
      skillGaps: [],
      detailedMatrix: [],
      explanation:
        "No benchmark skill requirements defined for this career role.",
    };
  }

  // Create lookup map by skillId and normalized skillName
  const studentScoreMap = new Map<
    string,
    { score: number; isVerified: boolean }
  >();
  for (const s of studentSkills) {
    studentScoreMap.set(s.skillId, {
      score: s.score,
      isVerified: Boolean(s.isVerified),
    });
    studentScoreMap.set(s.skillName.toLowerCase().trim(), {
      score: s.score,
      isVerified: Boolean(s.isVerified),
    });
  }

  let totalWeight = 0;
  let earnedWeightedFulfillment = 0;

  const matchingSkills: SkillMatchItem[] = [];
  const skillGaps: SkillGapItem[] = [];
  const missingSkills: SkillGapItem[] = [];
  const detailedMatrix: DetailedMatrixItem[] = [];

  for (const benchmark of benchmarkSkills) {
    const required = Math.max(1, benchmark.minProficiency);
    const weight = benchmark.weight > 0 ? benchmark.weight : 1.0;
    totalWeight += weight;

    // Lookup student score
    const studentRecord =
      studentScoreMap.get(benchmark.skillId) ||
      studentScoreMap.get(benchmark.skillName.toLowerCase().trim());

    const studentScore = studentRecord ? studentRecord.score : 0;

    // Fulfillment Ratio: min(1.0, studentScore / required)
    const fulfillmentRatio = Math.min(1.0, studentScore / required);
    earnedWeightedFulfillment += fulfillmentRatio * weight;

    const fulfillmentPercentage = Number((fulfillmentRatio * 100).toFixed(1));
    const gapPoints = Math.max(0, Number((required - studentScore).toFixed(1)));
    const surplusPoints = Math.max(
      0,
      Number((studentScore - required).toFixed(1)),
    );

    // Categorization
    if (studentScore >= required) {
      matchingSkills.push({
        skillId: benchmark.skillId,
        skillName: benchmark.skillName,
        categoryName: benchmark.categoryName,
        studentScore,
        requiredBenchmark: required,
        surplusPoints,
        weight,
        isCore: benchmark.isCore,
      });

      detailedMatrix.push({
        skillId: benchmark.skillId,
        skillName: benchmark.skillName,
        categoryName: benchmark.categoryName,
        studentScore,
        requiredBenchmark: required,
        fulfillmentPercentage,
        status: "MET",
        isCore: benchmark.isCore,
        weight,
      });
    } else if (studentScore === 0) {
      const missingItem: SkillGapItem = {
        skillId: benchmark.skillId,
        skillName: benchmark.skillName,
        categoryName: benchmark.categoryName,
        studentScore: 0,
        requiredBenchmark: required,
        gapPoints: required,
        weight,
        isCore: benchmark.isCore,
        priority: benchmark.isCore ? "CRITICAL" : "HIGH",
      };

      missingSkills.push(missingItem);
      skillGaps.push(missingItem);

      detailedMatrix.push({
        skillId: benchmark.skillId,
        skillName: benchmark.skillName,
        categoryName: benchmark.categoryName,
        studentScore: 0,
        requiredBenchmark: required,
        fulfillmentPercentage: 0,
        status: "MISSING",
        isCore: benchmark.isCore,
        weight,
      });
    } else {
      // Partial Gap
      const priority = benchmark.isCore
        ? gapPoints > 25
          ? "CRITICAL"
          : "HIGH"
        : gapPoints > 25
          ? "HIGH"
          : "MEDIUM";

      const gapItem: SkillGapItem = {
        skillId: benchmark.skillId,
        skillName: benchmark.skillName,
        categoryName: benchmark.categoryName,
        studentScore,
        requiredBenchmark: required,
        gapPoints,
        weight,
        isCore: benchmark.isCore,
        priority,
      };

      skillGaps.push(gapItem);

      detailedMatrix.push({
        skillId: benchmark.skillId,
        skillName: benchmark.skillName,
        categoryName: benchmark.categoryName,
        studentScore,
        requiredBenchmark: required,
        fulfillmentPercentage,
        status: "PARTIAL_GAP",
        isCore: benchmark.isCore,
        weight,
      });
    }
  }

  // Calculate Weighted Alignment Percentage
  const rawCompatibilityScore =
    totalWeight > 0 ? (earnedWeightedFulfillment / totalWeight) * 100 : 0;
  const compatibilityScore = Number(rawCompatibilityScore.toFixed(1));

  // Determine Readiness Tier
  let readinessLevel: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING" = "DEVELOPING";
  if (compatibilityScore >= 85) {
    readinessLevel = "HIGH_FIT";
  } else if (compatibilityScore >= 65) {
    readinessLevel = "MODERATE_FIT";
  }

  // Sort gaps by priority & gap points descending
  skillGaps.sort((a, b) => {
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
    return b.gapPoints - a.gapPoints;
  });

  // Generate deterministic, explainable natural language description
  const explanation = generateExplainabilityText(
    roleTitle,
    compatibilityScore,
    readinessLevel,
    benchmarkSkills.length,
    matchingSkills,
    skillGaps,
    missingSkills,
  );

  return {
    compatibilityScore,
    readinessLevel,
    totalRequiredSkills: benchmarkSkills.length,
    matchingSkillsCount: matchingSkills.length,
    gapSkillsCount: skillGaps.length,
    missingSkillsCount: missingSkills.length,
    matchingSkills,
    missingSkills,
    skillGaps,
    detailedMatrix,
    explanation,
  };
}

/**
 * Deterministic Natural Language Explanation Generator
 */
function generateExplainabilityText(
  roleTitle: string,
  score: number,
  readiness: string,
  totalBenchmarkCount: number,
  matching: SkillMatchItem[],
  gaps: SkillGapItem[],
  missing: SkillGapItem[],
): string {
  if (score >= 95) {
    const topMatches = matching
      .slice(0, 3)
      .map((m) => `${m.skillName} (${m.studentScore}/${m.requiredBenchmark})`)
      .join(", ");
    return `Exceptional alignment (${score}%) for ${roleTitle}. You meet all benchmark technical standards including ${topMatches}. You are placement-ready for this career pathway.`;
  }

  if (matching.length === 0) {
    return `You have foundational alignment (${score}%) for ${roleTitle}. None of the ${totalBenchmarkCount} benchmark skills are verified yet. Taking assessments in core skills like ${gaps
      .slice(0, 3)
      .map((g) => g.skillName)
      .join(", ")} will rapidly increase your match score.`;
  }

  const matchSummary = matching
    .map((m) => `${m.skillName} (${m.studentScore}/${m.requiredBenchmark})`)
    .join(", ");

  let gapSummary = "";
  if (gaps.length > 0) {
    const topGaps = gaps
      .slice(0, 2)
      .map(
        (g) =>
          `${g.gapPoints}pt gap in ${g.skillName} (${g.studentScore}/${g.requiredBenchmark})`,
      )
      .join(" and ");
    gapSummary = ` Closing your ${topGaps} will elevate your compatibility score to 90%+.`;
  }

  const missingNote =
    missing.length > 0
      ? ` Note: ${missing.length} benchmark skill(s) (${missing.map((m) => m.skillName).join(", ")}) are unverified.`
      : "";

  return `You demonstrate a ${readiness.replace("_", " ").toLowerCase()} (${score}%) for ${roleTitle}. You satisfy benchmark standards in ${matching.length} of ${totalBenchmarkCount} competencies: ${matchSummary}.${gapSummary}${missingNote}`;
}
