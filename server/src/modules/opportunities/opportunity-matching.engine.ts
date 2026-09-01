import { OpportunityType, WorkMode } from "@prisma/client";

export interface OpportunitySkillRequirement {
  skillId: string;
  skillName: string;
  skillSlug?: string;
  categoryName?: string;
  minScore: number;
  isMandatory: boolean;
  weight: number;
}

export interface OpportunityMatchInput {
  id: string;
  title: string;
  slug: string;
  type: OpportunityType;
  description: string;
  workMode: WorkMode;
  location: string | null;
  minCgpa: number;
  eligibleBranches: string[];
  eligibleGradYears: number[];
  duration?: string | null;
  stipendSalary?: string | null;
  deadline?: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  company: {
    id: string;
    companyName: string;
    industry?: string | null;
    location?: string | null;
    logoUrl?: string | null;
    isVerified: boolean;
  };
  requiredSkills: OpportunitySkillRequirement[];
}

export interface StudentMatchProfile {
  id: string;
  fullName: string;
  cgpa: number | null;
  branch: string | null;
  gradYear: number | null;
  careerInterests: string[];
  preferredLocations: string[];
  workModePref: WorkMode;
  skills: Array<{
    skillId: string;
    skillName: string;
    score: number;
    categoryName?: string;
  }>;
  projectCount?: number;
  certificationCount?: number;
  assessmentCount?: number;
}

export interface FactorScoreBreakdown {
  score: number; // 0 - 100
  weightPercentage: number; // e.g. 50 for 50%
  weightedContribution: number; // e.g. (score * weight) / 100
}

export interface MatchFactorBreakdown {
  skillCompatibility: FactorScoreBreakdown;
  eligibility: FactorScoreBreakdown;
  careerInterest: FactorScoreBreakdown;
  experience: FactorScoreBreakdown;
  locationPreference: FactorScoreBreakdown;
}

export interface MatchingSkillDetail {
  skillId: string;
  skillName: string;
  categoryName?: string;
  studentScore: number;
  benchmarkScore: number;
  isMandatory: boolean;
  isSatisfied: boolean;
}

export interface MissingSkillDetail {
  skillId: string;
  skillName: string;
  categoryName?: string;
  studentScore: number;
  benchmarkScore: number;
  gapPoints: number;
  isMandatory: boolean;
}

export interface OpportunityMatchResult {
  matchScore: number; // Normalized 0 - 100
  matchFit: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING";
  matchingSkills: MatchingSkillDetail[];
  missingSkills: MissingSkillDetail[];
  eligibilityResult: {
    isEligible: boolean;
    cgpaMet: boolean;
    branchMet: boolean;
    gradYearMet: boolean;
    score: number;
    details: {
      studentCgpa: number | null;
      requiredCgpa: number;
      studentBranch: string | null;
      studentGradYear: number | null;
    };
  };
  interestMatch: {
    isMatched: boolean;
    matchedInterests: string[];
    score: number;
  };
  experienceMatch: {
    projectCount: number;
    certificationCount: number;
    assessmentCount: number;
    score: number;
  };
  locationMatch: {
    isMatched: boolean;
    preferredLocations: string[];
    workModePref: WorkMode;
    score: number;
  };
  breakdown: MatchFactorBreakdown;
  explanation: string;
}

/**
 * Deterministic Opportunity Matching Engine
 * Multi-factor weights:
 * - Skill Compatibility: 50%
 * - Eligibility: 20%
 * - Career Interest: 15%
 * - Experience: 10%
 * - Location Preference: 5%
 */
export class OpportunityMatchingEngine {
  public static readonly WEIGHTS = {
    SKILL_COMPATIBILITY: 0.5,
    ELIGIBILITY: 0.2,
    CAREER_INTEREST: 0.15,
    EXPERIENCE: 0.1,
    LOCATION_PREFERENCE: 0.05,
  } as const;

  /**
   * Calculate full multi-factor match result for a student and opportunity
   */
  public static calculateMatch(
    student: StudentMatchProfile,
    opp: OpportunityMatchInput,
  ): OpportunityMatchResult {
    // 1. Skill Compatibility (50% Weight)
    const { skillScore, matchingSkills, missingSkills } =
      this.calculateSkillFactor(student.skills, opp.requiredSkills);

    // 2. Eligibility Verification (20% Weight)
    const eligibilityResult = this.calculateEligibilityFactor(student, opp);

    // 3. Career Interest Match (15% Weight)
    const interestMatch = this.calculateInterestFactor(student, opp);

    // 4. Experience & Portfolio Track Record (10% Weight)
    const experienceMatch = this.calculateExperienceFactor(student);

    // 5. Location & Work Mode Preference (5% Weight)
    const locationMatch = this.calculateLocationFactor(student, opp);

    // Normalized Final Score Calculation (0 - 100)
    const skillWeighted = Number(
      (skillScore * this.WEIGHTS.SKILL_COMPATIBILITY).toFixed(2),
    );
    const eligibilityWeighted = Number(
      (eligibilityResult.score * this.WEIGHTS.ELIGIBILITY).toFixed(2),
    );
    const interestWeighted = Number(
      (interestMatch.score * this.WEIGHTS.CAREER_INTEREST).toFixed(2),
    );
    const experienceWeighted = Number(
      (experienceMatch.score * this.WEIGHTS.EXPERIENCE).toFixed(2),
    );
    const locationWeighted = Number(
      (locationMatch.score * this.WEIGHTS.LOCATION_PREFERENCE).toFixed(2),
    );

    const totalRawScore =
      skillWeighted +
      eligibilityWeighted +
      interestWeighted +
      experienceWeighted +
      locationWeighted;

    const matchScore = Math.max(0, Math.min(100, Math.round(totalRawScore)));

    const matchFit: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING" =
      matchScore >= 80
        ? "HIGH_FIT"
        : matchScore >= 50
          ? "MODERATE_FIT"
          : "DEVELOPING";

    const breakdown: MatchFactorBreakdown = {
      skillCompatibility: {
        score: skillScore,
        weightPercentage: 50,
        weightedContribution: skillWeighted,
      },
      eligibility: {
        score: eligibilityResult.score,
        weightPercentage: 20,
        weightedContribution: eligibilityWeighted,
      },
      careerInterest: {
        score: interestMatch.score,
        weightPercentage: 15,
        weightedContribution: interestWeighted,
      },
      experience: {
        score: experienceMatch.score,
        weightPercentage: 10,
        weightedContribution: experienceWeighted,
      },
      locationPreference: {
        score: locationMatch.score,
        weightPercentage: 5,
        weightedContribution: locationWeighted,
      },
    };

    const explanation = this.generateExplanation(
      matchScore,
      matchFit,
      breakdown,
      matchingSkills,
      missingSkills,
      eligibilityResult.isEligible,
    );

    return {
      matchScore,
      matchFit,
      matchingSkills,
      missingSkills,
      eligibilityResult,
      interestMatch,
      experienceMatch,
      locationMatch,
      breakdown,
      explanation,
    };
  }

  /**
   * Factor 1: Skill Compatibility Calculation
   */
  private static calculateSkillFactor(
    studentSkills: Array<{ skillId: string; skillName: string; score: number }>,
    requiredSkills: OpportunitySkillRequirement[],
  ): {
    skillScore: number;
    matchingSkills: MatchingSkillDetail[];
    missingSkills: MissingSkillDetail[];
  } {
    if (!requiredSkills || requiredSkills.length === 0) {
      return { skillScore: 100, matchingSkills: [], missingSkills: [] };
    }

    const scoreMap = new Map<string, number>();
    for (const ss of studentSkills) {
      scoreMap.set(ss.skillId, ss.score);
      scoreMap.set(ss.skillName.toLowerCase().trim(), ss.score);
    }

    let weightedFulfillmentSum = 0;
    let totalWeights = 0;
    const matchingSkills: MatchingSkillDetail[] = [];
    const missingSkills: MissingSkillDetail[] = [];

    for (const req of requiredSkills) {
      const studentScore =
        scoreMap.get(req.skillId) ??
        scoreMap.get(req.skillName.toLowerCase().trim()) ??
        0;
      const benchmark = req.minScore;

      const fulfillmentRatio = Math.min(1.0, studentScore / benchmark);
      const effectiveWeight = req.weight * (req.isMandatory ? 1.5 : 1.0);

      weightedFulfillmentSum += fulfillmentRatio * effectiveWeight;
      totalWeights += effectiveWeight;

      if (studentScore >= benchmark) {
        matchingSkills.push({
          skillId: req.skillId,
          skillName: req.skillName,
          categoryName: req.categoryName,
          studentScore,
          benchmarkScore: benchmark,
          isMandatory: req.isMandatory,
          isSatisfied: true,
        });
      } else {
        const gapPoints = Math.max(
          0,
          Number((benchmark - studentScore).toFixed(1)),
        );
        missingSkills.push({
          skillId: req.skillId,
          skillName: req.skillName,
          categoryName: req.categoryName,
          studentScore,
          benchmarkScore: benchmark,
          gapPoints,
          isMandatory: req.isMandatory,
        });
      }
    }

    const skillScore =
      totalWeights > 0
        ? Math.round((weightedFulfillmentSum / totalWeights) * 100)
        : 0;

    return { skillScore, matchingSkills, missingSkills };
  }

  /**
   * Factor 2: Eligibility Verification
   */
  private static calculateEligibilityFactor(
    student: StudentMatchProfile,
    opp: OpportunityMatchInput,
  ): OpportunityMatchResult["eligibilityResult"] {
    const requiredCgpa = opp.minCgpa ?? 0;
    const cgpaMet =
      requiredCgpa === 0 ||
      (student.cgpa !== null && student.cgpa >= requiredCgpa);

    const branchMet =
      opp.eligibleBranches.length === 0 ||
      (student.branch !== null &&
        opp.eligibleBranches.some(
          (b) =>
            b.toLowerCase().includes(student.branch!.toLowerCase()) ||
            student.branch!.toLowerCase().includes(b.toLowerCase()),
        ));

    const gradYearMet =
      opp.eligibleGradYears.length === 0 ||
      (student.gradYear !== null &&
        opp.eligibleGradYears.includes(student.gradYear));

    const isEligible = Boolean(cgpaMet && branchMet && gradYearMet);

    // Scoring: CGPA (40%), Branch (35%), GradYear (25%)
    let cgpaPts = 0;
    if (cgpaMet) {
      cgpaPts = 40;
    } else if (student.cgpa !== null && requiredCgpa > 0) {
      cgpaPts = Math.max(0, Math.round((student.cgpa / requiredCgpa) * 40));
    }

    const branchPts = branchMet ? 35 : 0;
    const gradYearPts = gradYearMet ? 25 : 0;

    const score = Math.min(100, cgpaPts + branchPts + gradYearPts);

    return {
      isEligible,
      cgpaMet: Boolean(cgpaMet),
      branchMet: Boolean(branchMet),
      gradYearMet: Boolean(gradYearMet),
      score,
      details: {
        studentCgpa: student.cgpa,
        requiredCgpa,
        studentBranch: student.branch,
        studentGradYear: student.gradYear,
      },
    };
  }

  /**
   * Factor 3: Career Interest Match
   */
  private static calculateInterestFactor(
    student: StudentMatchProfile,
    opp: OpportunityMatchInput,
  ): OpportunityMatchResult["interestMatch"] {
    const interests = student.careerInterests || [];
    if (interests.length === 0) {
      return { isMatched: true, matchedInterests: [], score: 70 }; // Baseline neutral score
    }

    const matchedInterests: string[] = [];
    const oppText =
      `${opp.title} ${opp.company.industry || ""} ${opp.description}`.toLowerCase();
    const reqSkillNames = opp.requiredSkills.map((s) =>
      s.skillName.toLowerCase(),
    );

    for (const interest of interests) {
      const lower = interest.toLowerCase().trim();
      if (
        oppText.includes(lower) ||
        reqSkillNames.some((sk) => sk.includes(lower) || lower.includes(sk))
      ) {
        matchedInterests.push(interest);
      }
    }

    let score = 30; // Default when no overlap
    if (matchedInterests.length >= 2) {
      score = 100;
    } else if (matchedInterests.length === 1) {
      score = 85;
    }

    return {
      isMatched: matchedInterests.length > 0,
      matchedInterests,
      score,
    };
  }

  /**
   * Factor 4: Experience & Track Record
   */
  private static calculateExperienceFactor(
    student: StudentMatchProfile,
  ): OpportunityMatchResult["experienceMatch"] {
    const projectCount = student.projectCount || 0;
    const certificationCount = student.certificationCount || 0;
    const assessmentCount = student.assessmentCount || 0;

    // Projects: Up to 50 pts (25 pts per project, max 2)
    const projectPts = Math.min(50, projectCount * 25);

    // Certifications & Verified Assessments: Up to 50 pts (25 pts per record, max 2)
    const credPts = Math.min(50, (certificationCount + assessmentCount) * 25);

    // If zero track record, baseline minimum score is 20
    const score = Math.max(20, Math.min(100, projectPts + credPts));

    return {
      projectCount,
      certificationCount,
      assessmentCount,
      score,
    };
  }

  /**
   * Factor 5: Location & Work Mode Match
   */
  private static calculateLocationFactor(
    student: StudentMatchProfile,
    opp: OpportunityMatchInput,
  ): OpportunityMatchResult["locationMatch"] {
    const prefLocations = student.preferredLocations || [];
    const prefMode = student.workModePref || WorkMode.ANY;

    // Work Mode Match (50 pts max)
    let modeScore = 20;
    if (
      opp.workMode === WorkMode.REMOTE ||
      prefMode === WorkMode.ANY ||
      prefMode === opp.workMode
    ) {
      modeScore = 50;
    } else if (
      (prefMode === WorkMode.HYBRID && opp.workMode === WorkMode.ON_SITE) ||
      (prefMode === WorkMode.ON_SITE && opp.workMode === WorkMode.HYBRID)
    ) {
      modeScore = 35;
    }

    // Location Match (50 pts max)
    let locScore = 20;
    if (opp.workMode === WorkMode.REMOTE) {
      locScore = 50; // Location agnostic
    } else if (prefLocations.length === 0) {
      locScore = 40; // Open to anywhere
    } else if (
      opp.location &&
      prefLocations.some(
        (pl) =>
          opp.location!.toLowerCase().includes(pl.toLowerCase()) ||
          pl.toLowerCase().includes(opp.location!.toLowerCase()),
      )
    ) {
      locScore = 50;
    }

    const score = Math.min(100, modeScore + locScore);
    const isMatched = score >= 70;

    return {
      isMatched,
      preferredLocations: prefLocations,
      workModePref: prefMode,
      score,
    };
  }

  /**
   * Explainability generator for match output
   */
  private static generateExplanation(
    matchScore: number,
    matchFit: "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING",
    breakdown: MatchFactorBreakdown,
    matchingSkills: MatchingSkillDetail[],
    missingSkills: MissingSkillDetail[],
    isEligible: boolean,
  ): string {
    const matchedCount = matchingSkills.length;
    const missingCount = missingSkills.length;
    const totalSkills = matchedCount + missingCount;

    const skillContribution = breakdown.skillCompatibility.weightedContribution;
    const eligContribution = breakdown.eligibility.weightedContribution;
    const intContribution = breakdown.careerInterest.weightedContribution;

    if (matchFit === "HIGH_FIT") {
      const topSkills = matchingSkills
        .map((m) => m.skillName)
        .slice(0, 3)
        .join(", ");
      return `${matchScore}% Match: Exceptional alignment. Verified proficiency in ${topSkills} (+${skillContribution}pts), meets all academic eligibility benchmarks (+${eligContribution}pts), and strong career interest resonance (+${intContribution}pts).`;
    }

    if (matchFit === "MODERATE_FIT") {
      const topGaps = missingSkills
        .map((g) => `${g.skillName} (-${g.gapPoints}pts)`)
        .slice(0, 2)
        .join(", ");
      const eligText = isEligible
        ? "meets academic eligibility"
        : "requires academic review";
      return `${matchScore}% Match: Good potential. Meets ${matchedCount}/${totalSkills} required competency benchmarks (+${skillContribution}pts) and ${eligText}, but has addressable skill gaps in ${topGaps}.`;
    }

    const topMissing = missingSkills
      .map((g) => g.skillName)
      .slice(0, 3)
      .join(", ");
    return `${matchScore}% Match: Developing fit. Priority upskilling in ${topMissing} is recommended before applying to meet the target industry benchmark.`;
  }
}
