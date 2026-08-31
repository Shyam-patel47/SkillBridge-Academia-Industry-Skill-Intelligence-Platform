import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Target,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  DollarSign,
  ArrowRight,
  X,
  Award,
  Layers,
  Loader2,
  Info,
} from "lucide-react";
import {
  careerService,
  CareerRecommendationItem,
} from "../../services/careerService";

export const CareerPathwaysPage: React.FC = () => {
  const [selectedRoleForModal, setSelectedRoleForModal] =
    useState<CareerRecommendationItem | null>(null);
  const [readinessFilter, setReadinessFilter] = useState<
    "ALL" | "HIGH_FIT" | "MODERATE_FIT" | "DEVELOPING"
  >("ALL");

  const { data: recommendations, isLoading } = useQuery<
    CareerRecommendationItem[]
  >({
    queryKey: ["career", "recommendations"],
    queryFn: careerService.getRecommendations,
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Running Skill Intelligence & Benchmark Gap Engine...
        </p>
      </div>
    );
  }

  const filteredRoles = (recommendations || []).filter((r) => {
    if (readinessFilter === "ALL") return true;
    return r.readinessLevel === readinessFilter;
  });

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1c2e] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>Deterministic Skill Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Career Role Compatibility & Skill Gaps
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Your verified skill scores are mathematically benchmarked against
            industry standards. Identify matching proficiencies and targeted
            gaps required to achieve 90%+ career alignment.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10 shrink-0">
          <Link
            to="/student/assessments"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
          >
            <Award className="w-4 h-4" />
            <span>Close Skill Gaps</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
          {[
            { id: "ALL", label: `All Roles (${recommendations?.length || 0})` },
            { id: "HIGH_FIT", label: "High Alignment (85%+)" },
            { id: "MODERATE_FIT", label: "Moderate Fit (65-84%)" },
            { id: "DEVELOPING", label: "Developing (<65%)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReadinessFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${
                readinessFilter === tab.id
                  ? "bg-sky-500 text-white font-bold shadow-md shadow-sky-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {filteredRoles.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRoles.map((rec) => {
            const badge = getReadinessBadge(rec.readinessLevel);
            const matchingCount = rec.matchingSkills.length;
            const totalCount = rec.totalRequiredSkills;

            return (
              <div
                key={rec.careerRole.id}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 group"
              >
                <div className="space-y-5">
                  {/* Top Role Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border font-semibold ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {rec.careerRole.category && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                            {rec.careerRole.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-extrabold text-white group-hover:text-sky-300 transition-colors pt-1">
                        {rec.careerRole.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {rec.careerRole.description ||
                          "Target technical and domain competencies required for industry placement."}
                      </p>
                    </div>

                    {/* Circular Score Meter */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center shrink-0 w-24">
                      <div
                        className={`text-2xl font-extrabold font-mono ${
                          rec.compatibilityScore >= 85
                            ? "text-emerald-400"
                            : rec.compatibilityScore >= 65
                              ? "text-sky-400"
                              : "text-amber-400"
                        }`}
                      >
                        {rec.compatibilityScore}%
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">
                        Match
                      </div>
                    </div>
                  </div>

                  {/* Market Details (Salary & Demand) */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-850 flex items-center space-x-2 text-slate-300">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {rec.careerRole.avgSalary || "Market Competitive"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-850 flex items-center space-x-2 text-slate-300">
                      <TrendingUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span>{rec.careerRole.demandLevel} Market Demand</span>
                    </div>
                  </div>

                  {/* Matching vs Skill Gaps Section */}
                  <div className="space-y-3 pt-1">
                    {/* Matching Skills */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Matching Proficiencies ({matchingCount}/{totalCount}
                            )
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.matchingSkills.length > 0 ? (
                          rec.matchingSkills.map((m) => (
                            <span
                              key={m.skillId}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-medium"
                            >
                              {m.skillName} ({m.studentScore}/
                              {m.requiredBenchmark})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500 italic">
                            No skills verified at benchmark level yet.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Skill Gaps */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          <span>
                            Identified Skill Gaps ({rec.skillGaps.length})
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.skillGaps.length > 0 ? (
                          rec.skillGaps.map((g) => (
                            <span
                              key={g.skillId}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${
                                g.priority === "CRITICAL"
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                                  : "bg-amber-500/10 border-amber-500/25 text-amber-300"
                              }`}
                            >
                              {g.skillName}: -{g.gapPoints}pts ({g.studentScore}
                              /{g.requiredBenchmark})
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-400 font-semibold">
                            ✨ 100% benchmark satisfied! No gaps detected.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Explainable Intelligence Insight */}
                  <div className="p-3.5 rounded-2xl bg-[#060a14] border border-slate-850 text-xs text-slate-300 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-[11px] font-bold text-sky-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Skill Intelligence Diagnostic:</span>
                    </div>
                    <p className="leading-relaxed text-slate-300">
                      {rec.explanation}
                    </p>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleForModal(rec)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Inspect Full Gap Matrix</span>
                  </button>

                  <Link
                    to="/student/assessments"
                    className="py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center space-x-1"
                  >
                    <span>Assess Gaps</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <Compass className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No roles in this readiness tier
          </h3>
          <p className="text-xs text-slate-400">
            Try selecting "All Roles" to view all available career pathways.
          </p>
        </div>
      )}

      {/* Detailed Skill Gap Matrix Modal */}
      {selectedRoleForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-semibold">
                  Competency Benchmark Matrix
                </span>
                <h3 className="text-xl font-extrabold text-white pt-1">
                  {selectedRoleForModal.careerRole.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRoleForModal(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-semibold">Skill Entity</th>
                    <th className="pb-3 font-semibold">Your Score</th>
                    <th className="pb-3 font-semibold">Required Benchmark</th>
                    <th className="pb-3 font-semibold">Fulfillment</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-mono">
                  {selectedRoleForModal.detailedMatrix.map((item) => (
                    <tr key={item.skillId} className="hover:bg-slate-900/50">
                      <td className="py-3 pr-2">
                        <div className="font-bold text-white font-sans">
                          {item.skillName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.isCore ? "Core Mandatory" : "Secondary"} •
                          Weight {item.weight}x
                        </div>
                      </td>
                      <td className="py-3 text-slate-300 font-bold">
                        {item.studentScore} / 100
                      </td>
                      <td className="py-3 text-sky-400 font-bold">
                        {item.requiredBenchmark} / 100
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.fulfillmentPercentage >= 100
                                  ? "bg-emerald-400"
                                  : item.fulfillmentPercentage >= 50
                                    ? "bg-sky-400"
                                    : "bg-amber-400"
                              }`}
                              style={{
                                width: `${item.fulfillmentPercentage}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-[11px] text-slate-300">
                            {item.fulfillmentPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        {item.status === "MET" ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            SATISFIED ✓
                          </span>
                        ) : item.status === "PARTIAL_GAP" ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                            GAP AREA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                            MISSING
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Explanation card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-850 text-xs text-slate-300 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-sky-400">
                <Info className="w-4 h-4" />
                <span>Deterministic Diagnostic Summary:</span>
              </div>
              <p className="leading-relaxed">
                {selectedRoleForModal.explanation}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRoleForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close Matrix
              </button>
              <Link
                to="/student/assessments"
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20"
              >
                Take Assessments to Bridge Gaps
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
