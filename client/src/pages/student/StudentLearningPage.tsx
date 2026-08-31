import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Compass,
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
  X,
  Award,
  Layers,
  Loader2,
  Search,
  BookMarked,
  PlayCircle,
} from "lucide-react";
import {
  learningService,
  LearningRecommendationsResponse,
  LearningProgramItem,
} from "../../services/learningService";

export const StudentLearningPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCareer, setSelectedCareer] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"recommendations" | "all">(
    "recommendations",
  );
  const [selectedProgramForModal, setSelectedProgramForModal] =
    useState<LearningProgramItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  // Fetch Tailored Recommendations
  const { data: recsData, isLoading: isRecsLoading } =
    useQuery<LearningRecommendationsResponse>({
      queryKey: ["learning", "recommendations", selectedCareer],
      queryFn: () =>
        learningService.getRecommendations(selectedCareer || undefined),
    });

  // Fetch All Programs Catalog
  const { data: allPrograms, isLoading: isCatalogLoading } = useQuery<
    LearningProgramItem[]
  >({
    queryKey: ["learning", "catalog", searchQuery, difficultyFilter],
    queryFn: () =>
      learningService.getAllPrograms({
        search: searchQuery || undefined,
        difficulty: difficultyFilter !== "ALL" ? difficultyFilter : undefined,
      }),
    enabled: activeTab === "all",
  });

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: (programId: string) =>
      learningService.enrollInProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["learning", "recommendations"],
      });
    },
  });

  const handleEnroll = (programId: string) => {
    enrollMutation.mutate(programId);
  };

  if (isRecsLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Synthesizing personalized learning roadmaps based on your skill
          gaps...
        </p>
      </div>
    );
  }

  const targetRole = recsData?.targetCareerRole;
  const recommendations = recsData?.recommendations || [];
  const availableCareers = recsData?.availableCareerRoles || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2e] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Gap-Driven Learning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Skill-Targeted Learning & Upskilling
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Curricula dynamically ranked by your diagnosed skill gaps and target
            career goals. Every program is selected to bridge high-impact
            competency deficits.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10 shrink-0">
          <Link
            to="/student/assessments"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
          >
            <Award className="w-4 h-4" />
            <span>Take Skill Assessments</span>
          </Link>
        </div>
      </div>

      {/* Target Career Pathway Selector & Navigation Tabs */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: View Tabs */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab("recommendations")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "recommendations"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tailored For Your Gaps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "all"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Programs Catalog</span>
          </button>
        </div>

        {/* Right: Career Goal Selector */}
        {activeTab === "recommendations" && (
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 shrink-0">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Target Career:</span>
            </span>

            <select
              value={selectedCareer || targetRole?.slug || ""}
              onChange={(e) => setSelectedCareer(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-sky-500"
            >
              {availableCareers.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.title} {c.category ? `(${c.category})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: TAILORED LEARNING RECOMMENDATIONS STREAM */}
      {activeTab === "recommendations" && (
        <div className="space-y-6">
          {targetRole && (
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-850 pb-3">
              <div className="flex items-center space-x-2">
                <span>Optimized for Career Target:</span>
                <span className="font-bold text-sky-400">
                  {targetRole.title}
                </span>
              </div>
              <span className="font-mono">
                {recommendations.length} Recommended Programs
              </span>
            </div>
          )}

          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recommendations.map((rec, idx) => {
                const program = rec.program;
                const isEnrolled = Boolean(rec.enrollmentStatus);

                return (
                  <div
                    key={program.id}
                    className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 group"
                  >
                    <div className="space-y-5">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 border border-sky-500/30 text-sky-300">
                              #{idx + 1} Gap Solution
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono uppercase">
                              {program.difficulty}
                            </span>
                          </div>

                          <h3 className="text-xl font-extrabold text-white group-hover:text-sky-300 transition-colors pt-1">
                            {program.title}
                          </h3>

                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {program.description ||
                              "Structured modular curriculum tailored to close industry benchmark skill gaps."}
                          </p>
                        </div>

                        {/* Relevancy Match Score Badge */}
                        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center shrink-0 w-20">
                          <div className="text-xl font-extrabold font-mono text-emerald-400">
                            {rec.relevanceScore}%
                          </div>
                          <div className="text-[9px] font-mono text-slate-500 uppercase">
                            Relevance
                          </div>
                        </div>
                      </div>

                      {/* Provider & Duration Specs */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-850 flex items-center space-x-2 text-slate-300">
                          <BookMarked className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>
                            {program.provider || "SkillBridge Academy"}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-850 flex items-center space-x-2 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{program.durationHours} Hours Self-Paced</span>
                        </div>
                      </div>

                      {/* Targeted Gap Chips */}
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          <span>
                            Addresses {rec.addressedGapsCount} Target Gap(s):
                          </span>
                        </span>

                        <div className="flex flex-wrap gap-1.5">
                          {program.coveredSkills.map((s) => (
                            <span
                              key={s.id}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium ${
                                s.gapPoints > 0
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                  : "bg-slate-900 border-slate-800 text-slate-400"
                              }`}
                            >
                              {s.name}{" "}
                              {s.gapPoints > 0 ? `(-${s.gapPoints}pts)` : "✓"}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Explainability Insight Box */}
                      <div className="p-3.5 rounded-2xl bg-[#060a14] border border-slate-850 text-xs text-slate-300 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-sky-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            Why you are receiving this recommendation:
                          </span>
                        </div>
                        <p className="leading-relaxed text-slate-300">
                          {rec.explanation}
                        </p>
                      </div>
                    </div>

                    {/* Action CTAs */}
                    <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProgramForModal(program)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        <span>View Syllabus</span>
                      </button>

                      {isEnrolled ? (
                        <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Enrolled ({rec.progress || 0}%)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={enrollMutation.isPending}
                          onClick={() => handleEnroll(program.id)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all flex items-center justify-center space-x-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Enroll Curriculum</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No learning programs match this career goal
              </h3>
              <p className="text-xs text-slate-400">
                Switch target careers or view all programs in the catalog tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL LEARNING PROGRAMS CATALOG */}
      {activeTab === "all" && (
        <div className="space-y-6">
          {/* Catalog Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 overflow-x-auto text-xs pb-1">
              {["ALL", "BEGINNER", "MEDIUM", "ADVANCED"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficultyFilter(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
                    difficultyFilter === lvl
                      ? "bg-sky-500 text-white font-bold"
                      : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {lvl === "ALL" ? "All Difficulties" : lvl}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search curricula by title..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Catalog Grid */}
          {isCatalogLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
              <p className="text-xs font-mono text-slate-400">
                Loading catalog...
              </p>
            </div>
          ) : allPrograms && allPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allPrograms.map((prog) => (
                <div
                  key={prog.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono uppercase">
                        {prog.difficulty}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {prog.durationHours} Hours
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white">
                        {prog.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {prog.description ||
                          "Comprehensive learning track with practical exercises."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-mono text-slate-500">
                        Covered Skills:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {prog.coveredSkills.map((s) => (
                          <span
                            key={s.id}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-sky-300 font-mono"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProgramForModal(prog)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
                    >
                      View Syllabus
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEnroll(prog.id)}
                      className="w-full py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
                    >
                      Enroll
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No programs found
              </h3>
              <p className="text-xs text-slate-400">
                Try adjusting your keyword search or difficulty filter.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SYLLABUS & CURRICULUM DRAWER MODAL */}
      {selectedProgramForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-semibold">
                  Curriculum & Syllabus Details
                </span>
                <h3 className="text-xl font-extrabold text-white pt-1">
                  {selectedProgramForModal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProgramForModal(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed">
                {selectedProgramForModal.description ||
                  "Structured learning program targeting full mastery of essential technical concepts and engineering best practices."}
              </p>

              <div className="grid grid-cols-2 gap-3 font-mono pt-2">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-850">
                  <span className="text-slate-500 block text-[10px]">
                    Duration
                  </span>
                  <span className="font-bold text-white text-sm">
                    {selectedProgramForModal.durationHours} Hours
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-850">
                  <span className="text-slate-500 block text-[10px]">
                    Difficulty Tier
                  </span>
                  <span className="font-bold text-sky-400 text-sm uppercase">
                    {selectedProgramForModal.difficulty}
                  </span>
                </div>
              </div>

              {/* Covered Skills Breakdown */}
              <div className="space-y-2 pt-3">
                <h4 className="text-sm font-bold text-white">
                  Covered Competencies & Benchmark Targets
                </h4>
                <div className="space-y-2">
                  {selectedProgramForModal.coveredSkills.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-850 flex items-center justify-between"
                    >
                      <span className="font-bold text-white">{s.name}</span>
                      <span className="font-mono text-sky-400">
                        Target Proficiency: ≥ {s.targetProficiency}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedProgramForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleEnroll(selectedProgramForModal.id);
                  setSelectedProgramForModal(null);
                }}
                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20"
              >
                Enroll in Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
