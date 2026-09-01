import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BrainCircuit,
  Target,
  CheckCircle2,
  Award,
  Clock,
  ArrowRight,
  Layers,
  History,
  AlertTriangle,
  Sparkles,
  Check,
  Loader2,
  Code2,
} from "lucide-react";
import {
  studentService,
  StudentSkillsSummaryData,
  StudentSkillHistoryItem,
} from "../../services/studentService";

export const StudentSkillsPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<
    "all" | "technical" | "soft" | "strengths" | "weak"
  >("all");

  // Fetch Skills Summary
  const { data: skillsData, isLoading: isSkillsLoading } =
    useQuery<StudentSkillsSummaryData>({
      queryKey: ["student", "skills", "summary"],
      queryFn: studentService.getMySkillsSummary,
    });

  // Fetch Assessment History
  const { data: history, isLoading: isHistoryLoading } = useQuery<
    StudentSkillHistoryItem[]
  >({
    queryKey: ["student", "skill-history"],
    queryFn: studentService.getMySkillHistory,
  });

  if (isSkillsLoading || isHistoryLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Aggregating competency intelligence...
        </p>
      </div>
    );
  }

  const overallScore = skillsData?.overallScore ?? 0;
  const totalSkills = skillsData?.totalSkills ?? 0;
  const verifiedCount = skillsData?.verifiedSkillsCount ?? 0;
  const strengths = skillsData?.strengths ?? [];
  const weakSkills = skillsData?.weakSkills ?? [];

  // Determine Mastery Tier
  const getMasteryTier = (score: number) => {
    if (score >= 90)
      return {
        label: "Elite Tier",
        color: "text-amber-400",
        bg: "bg-amber-500/10 border-amber-500/30",
      };
    if (score >= 75)
      return {
        label: "Advanced Tier",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10 border-emerald-500/30",
      };
    if (score >= 50)
      return {
        label: "Intermediate Tier",
        color: "text-sky-400",
        bg: "bg-sky-500/10 border-sky-500/30",
      };
    return {
      label: "Foundational Tier",
      color: "text-slate-400",
      bg: "bg-slate-800 border-slate-700",
    };
  };

  const tier = getMasteryTier(overallScore);

  // Filter skills list
  const getFilteredSkills = () => {
    if (!skillsData) return [];
    switch (activeFilter) {
      case "technical":
        return skillsData.technicalSkills;
      case "soft":
        return skillsData.softSkills;
      case "strengths":
        return skillsData.strengths;
      case "weak":
        return skillsData.weakSkills;
      default:
        return [...skillsData.technicalSkills, ...skillsData.softSkills];
    }
  };

  const displayedSkills = getFilteredSkills();

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c182a] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <BrainCircuit className="w-3.5 h-3.5 text-sky-400" />
            <span>Verified Capability Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Skill Profile & Progress Matrix
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            All competency metrics are calculated from actual assessment
            submissions. Scores represent verified evidence used in recruiter
            matching and career gap diagnosis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <Link
            to="/student/resume-extractor"
            className="inline-flex items-center space-x-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-slate-700 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>AI Resume Extractor</span>
          </Link>
          <Link
            to="/student/assessments"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
          >
            <Award className="w-4 h-4" />
            <span>Take Assessments</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Overall Capability
            </p>
            <h3 className="text-2xl font-extrabold text-white font-mono">
              {overallScore} / 100
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border inline-block mt-0.5 ${tier.bg} ${tier.color}`}
            >
              {tier.label}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">
              Verified Skills
            </p>
            <h3 className="text-2xl font-extrabold text-white font-mono">
              {verifiedCount} Skills
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Of {totalSkills} total declared
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Core Strengths</p>
            <h3 className="text-2xl font-extrabold text-white font-mono">
              {strengths.length} Areas
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">
              ≥ 75% Mastery
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Target Gaps</p>
            <h3 className="text-2xl font-extrabold text-white font-mono">
              {weakSkills.length} Areas
            </h3>
            <span className="text-[11px] text-rose-400 font-mono">
              &lt; 60% Proficiency
            </span>
          </div>
        </div>
      </div>

      {/* CATEGORY DOMAIN PROFICIENCY BREAKDOWN */}
      {skillsData && skillsData.categories.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <span>Competency Distribution Across Domains</span>
              </h3>
              <p className="text-xs text-slate-400">
                Mean proficiency computed across each skill category taxonomy
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 font-bold">
              {skillsData.categories.length} Domains Evaluated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillsData.categories.map((cat) => (
              <div
                key={cat.categoryId}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-850 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {cat.categoryName}
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {cat.averageScore}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cat.averageScore >= 75
                        ? "bg-gradient-to-r from-sky-500 to-emerald-400"
                        : cat.averageScore >= 50
                          ? "bg-gradient-to-r from-sky-500 to-amber-400"
                          : "bg-gradient-to-r from-amber-500 to-rose-500"
                    }`}
                    style={{ width: `${cat.averageScore}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{cat.skillCount} verified skills</span>
                  <span
                    className={
                      cat.averageScore >= 75
                        ? "text-emerald-400"
                        : "text-slate-400"
                    }
                  >
                    {cat.averageScore >= 75 ? "Proficient" : "In Progress"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRANULAR VERIFIED SKILLS DIRECTORY */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-sky-400" />
              <span>Granular Verified Skill Directory</span>
            </h3>
            <p className="text-xs text-slate-400">
              Detailed competency records linked to your student profile
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs pb-1">
            {[
              { id: "all", label: `All (${totalSkills})` },
              { id: "technical", label: "Technical" },
              { id: "soft", label: "Soft Skills" },
              { id: "strengths", label: `Strengths (${strengths.length})` },
              { id: "weak", label: `Gap Areas (${weakSkills.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                  activeFilter === tab.id
                    ? "bg-sky-500 text-white font-bold shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Cards Grid */}
        {displayedSkills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedSkills.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-850 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {s.isVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-slate-500" />
                      </div>
                    )}
                    <span className="text-sm font-bold text-white">
                      {s.name || (s as any).skill?.name}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold text-sky-400">
                    {s.score}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      s.score >= 75
                        ? "bg-gradient-to-r from-sky-500 to-emerald-400"
                        : s.score >= 50
                          ? "bg-gradient-to-r from-sky-500 to-amber-400"
                          : "bg-gradient-to-r from-amber-500 to-rose-500"
                    }`}
                    style={{ width: `${s.score}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {s.proficiency}
                  </span>
                  <span
                    className={
                      s.isVerified ? "text-emerald-400" : "text-slate-500"
                    }
                  >
                    {s.isVerified ? "Verified Score" : "Self-Declared"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-850 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-400">
              No skills match the selected filter category.
            </p>
          </div>
        )}
      </div>

      {/* ASSESSMENT HISTORY & PROGRESS TIMELINE */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Assessment & Competency History
              </h3>
              <p className="text-xs text-slate-400">
                Chronological track of verified evaluation sessions
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Sessions:{" "}
            <span className="font-bold text-white">{history?.length ?? 0}</span>
          </span>
        </div>

        {history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-750 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      {h.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                      {h.category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(h.completedAt).toLocaleDateString()}
                      </span>
                    </span>
                    <span>
                      {h.correctAnswers} of {h.totalQuestions} Correct
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div
                      className={`text-base font-extrabold font-mono ${
                        h.passed ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {h.percentage}%
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {h.passed ? "PASSED ✓" : "FAILED"}
                    </div>
                  </div>

                  <Link
                    to={`/student/assessments/${h.assessmentId}/result`}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    title="View Detailed Report"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-850 text-center space-y-3">
            <BrainCircuit className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              No assessment attempts recorded yet.
            </p>
            <Link
              to="/student/assessments"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold"
            >
              <span>Take Your First Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
