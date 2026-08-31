import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  Target,
  Sparkles,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Layers,
  Award,
  BookOpen,
  Briefcase,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  careerService,
  CareerRecommendationItem,
} from "../../services/careerService";

export const CareerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: analysis,
    isLoading,
    error,
  } = useQuery<CareerRecommendationItem>({
    queryKey: ["career", "gap-analysis", id],
    queryFn: () => careerService.getGapAnalysis(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Synthesizing role competency benchmarks & gap roadmap...
        </p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="glass-panel max-w-md mx-auto p-8 rounded-3xl border border-slate-800 text-center space-y-4 my-12">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">
          Career Profile Not Found
        </h2>
        <p className="text-xs text-slate-400">
          The requested career role could not be analyzed or does not exist.
        </p>
        <button
          onClick={() => navigate("/student/careers")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
        >
          Return to Career Explorer
        </button>
      </div>
    );
  }

  const role = analysis.careerRole;
  const isHighFit = analysis.readinessLevel === "HIGH_FIT";
  const isModerateFit = analysis.readinessLevel === "MODERATE_FIT";

  const getReadinessBadge = (level: string) => {
    switch (level) {
      case "HIGH_FIT":
        return {
          label: "High Alignment (85%+)",
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        };
      case "MODERATE_FIT":
        return {
          label: "Moderate Fit (65-84%)",
          color: "text-sky-400 bg-sky-500/10 border-sky-500/30",
        };
      default:
        return {
          label: "Developing (<65%)",
          color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        };
    }
  };

  const badge = getReadinessBadge(analysis.readinessLevel);

  // Generate dynamic 4-phase career roadmap based on actual identified gaps
  const roadmapPhases = [
    {
      phase: "Phase 1",
      title: "Close High-Priority Skill Gaps",
      duration: "Weeks 1–3",
      description:
        analysis.skillGaps.length > 0
          ? `Focus on mastering target competencies: ${analysis.skillGaps
              .slice(0, 3)
              .map((g) => `${g.skillName} (need +${g.gapPoints}pts)`)
              .join(", ")}.`
          : "All core technical benchmarks are satisfied! Maintain proficiency through code reviews and practice.",
      status: analysis.skillGaps.length === 0 ? "COMPLETED" : "IN_PROGRESS",
      actionUrl: "/student/assessments",
      actionText: "Take Skill Assessments",
    },
    {
      phase: "Phase 2",
      title: "Complete Verified Competency Assessments",
      duration: "Weeks 4–5",
      description: `Validate your skills with deterministic assessments to raise your verified competency scores above ${role.title} benchmarks.`,
      status: isHighFit ? "COMPLETED" : "UPCOMING",
      actionUrl: "/student/assessments",
      actionText: "Explore Assessments",
    },
    {
      phase: "Phase 3",
      title: "Build Applied Portfolio Project",
      duration: "Weeks 6–8",
      description: `Demonstrate mastery by engineering an end-to-end production application implementing ${analysis.matchingSkills
        .slice(0, 2)
        .map((s) => s.skillName)
        .join(" & ")} along with your newly acquired skills.`,
      status: "UPCOMING",
      actionUrl: "/student/profile",
      actionText: "Add to Profile",
    },
    {
      phase: "Phase 4",
      title: "Industry Match & Internship Placement",
      duration: "Weeks 9–12",
      description: `Unlock tailored opportunities and recruiter shortlist rankings for ${role.title} positions.`,
      status: isHighFit ? "READY" : "UPCOMING",
      actionUrl: "/student/opportunities",
      actionText: "View Matching Jobs",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/careers"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Career Explorer</span>
        </Link>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono border font-semibold ${badge.color}`}
          >
            {badge.label}
          </span>
          {role.category && (
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
              {role.category}
            </span>
          )}
        </div>
      </div>

      {/* Hero Header & Compatibility Score Gauge */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1e33] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Career Pathway Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {role.title}
          </h1>

          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            {role.description ||
              "Target career role benchmarking industry-grade technical, engineering, and architectural competencies."}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-1.5 text-emerald-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{role.avgSalary || "Competitive Market Rate"}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center space-x-1.5 text-sky-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{role.demandLevel} Market Demand</span>
            </div>
          </div>
        </div>

        {/* Big Radial/Score Gauge */}
        <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 text-center w-full md:w-56 shrink-0 z-10 space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Role Compatibility
          </span>
          <div
            className={`text-5xl font-extrabold font-mono ${
              isHighFit
                ? "text-emerald-400"
                : isModerateFit
                  ? "text-sky-400"
                  : "text-amber-400"
            }`}
          >
            {analysis.compatibilityScore}%
          </div>
          <div className="text-xs font-mono text-slate-300">
            {analysis.matchingSkillsCount} of {analysis.totalRequiredSkills}{" "}
            Benchmarks Met
          </div>
        </div>
      </div>

      {/* STRENGTHS VS AREAS TO IMPROVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Strengths for this Role */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Your Strengths for this Role
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Skills where your verified score satisfies or exceeds the industry
            benchmark threshold
          </p>

          <div className="space-y-2.5 pt-2">
            {analysis.matchingSkills.length > 0 ? (
              analysis.matchingSkills.map((m) => (
                <div
                  key={m.skillId}
                  className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-emerald-300 block">
                      {m.skillName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.isCore ? "Core Mandatory" : "Secondary"}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-emerald-400">
                      {m.studentScore} / {m.requiredBenchmark}
                    </span>
                    <span className="text-[10px] text-emerald-500 block">
                      +{m.surplusPoints} surplus pts
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-500 text-center">
                No skills currently meet the benchmark threshold for this role.
              </div>
            )}
          </div>
        </div>

        {/* Skills to Improve / Target Gaps */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Target Gaps to Bridge
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Competencies requiring score elevation to unlock full alignment with
            recruiter criteria
          </p>

          <div className="space-y-2.5 pt-2">
            {analysis.skillGaps.length > 0 ? (
              analysis.skillGaps.map((g) => (
                <div
                  key={g.skillId}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                    g.priority === "CRITICAL"
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-amber-500/10 border-amber-500/25"
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">
                        {g.skillName}
                      </span>
                      {g.priority === "CRITICAL" && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-mono font-bold">
                          CRITICAL GAP
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Current: {g.studentScore} / Benchmark:{" "}
                      {g.requiredBenchmark}
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-amber-400">
                      -{g.gapPoints} pts
                    </span>
                    <Link
                      to="/student/assessments"
                      className="text-[10px] text-sky-400 hover:underline block pt-0.5"
                    >
                      Assess Skill →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-emerald-400 font-semibold text-center">
                ✨ Zero skill gaps! You meet 100% of benchmark technical
                requirements.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXPLAINABLE INTELLIGENCE DIAGNOSTIC */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 bg-gradient-to-r from-slate-900 via-[#071120] to-slate-900">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-bold text-white">
            Deterministic Skill Intelligence Diagnostic
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          {analysis.explanation}
        </p>
      </div>

      {/* FULL BENCHMARK MATRIX TABLE */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Full Role Competency Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Comparison of your verified scores against benchmark criteria
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Requirements:{" "}
            <span className="font-bold text-white">
              {analysis.totalRequiredSkills}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-semibold">Skill Entity</th>
                <th className="pb-3 font-semibold">Your Verified Score</th>
                <th className="pb-3 font-semibold">Required Benchmark</th>
                <th className="pb-3 font-semibold">Benchmark Fulfillment</th>
                <th className="pb-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850/60 font-mono">
              {analysis.detailedMatrix.map((item) => (
                <tr key={item.skillId} className="hover:bg-slate-900/50">
                  <td className="py-3.5 pr-2">
                    <div className="font-bold text-white font-sans text-sm">
                      {item.skillName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.isCore ? "Core Mandatory" : "Secondary"} •
                      Importance Weight {item.weight}x
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-200 font-bold">
                    {item.studentScore} / 100
                  </td>
                  <td className="py-3.5 text-sky-400 font-bold">
                    {item.requiredBenchmark} / 100
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.fulfillmentPercentage >= 100
                              ? "bg-emerald-400"
                              : item.fulfillmentPercentage >= 50
                                ? "bg-sky-400"
                                : "bg-amber-400"
                          }`}
                          style={{ width: `${item.fulfillmentPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-300 font-bold">
                        {item.fulfillmentPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5">
                    {item.status === "MET" ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        SATISFIED ✓
                      </span>
                    ) : item.status === "PARTIAL_GAP" ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                        GAP AREA
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                        MISSING
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DYNAMIC CAREER ROADMAP */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-850 pb-4">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Target Career Roadmap
            </h3>
            <p className="text-xs text-slate-400">
              Personalized 4-phase step-by-step roadmap to achieve 90%+
              placement compatibility for {role.title}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {roadmapPhases.map((phase, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-750 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2.5">
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[10px] font-mono font-bold">
                    {phase.phase}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {phase.title}
                  </h4>
                  <span className="flex items-center text-[10px] font-mono text-slate-500 gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{phase.duration}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {phase.description}
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <Link
                  to={phase.actionUrl}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <span>{phase.actionText}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Link
          to="/student/careers"
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>All Recommended Careers</span>
        </Link>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            to="/student/assessments"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-sky-300 text-xs font-semibold transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Take Skill Assessments</span>
          </Link>
          <Link
            to="/student/opportunities"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
          >
            <Briefcase className="w-4 h-4" />
            <span>Explore Matched Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
