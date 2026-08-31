import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BrainCircuit,
  Clock,
  HelpCircle,
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Code2,
  Users,
  Cpu,
  Loader2,
} from "lucide-react";
import {
  assessmentService,
  AssessmentListItem,
} from "../../services/assessmentService";

export const AssessmentCatalogPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const { data: assessments, isLoading } = useQuery<AssessmentListItem[]>({
    queryKey: ["assessments", "list", { category: selectedType, search }],
    queryFn: () =>
      assessmentService.getAssessments({
        category: selectedType !== "all" ? selectedType : undefined,
        search: search || undefined,
      }),
  });

  const categories = [
    { id: "all", label: "All Assessments", icon: BrainCircuit },
    { id: "technical", label: "Technical & Engineering", icon: Code2 },
    { id: "soft-skills", label: "Soft Skills & Leadership", icon: Users },
    { id: "aptitude", label: "Quantitative & Aptitude", icon: Cpu },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1829] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Objective Competency Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Skill Assessment Cockpit
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Take timed, skill-mapped assessments across Technical, Soft Skills,
            and Aptitude. Scoring is 100% deterministic and directly updates
            your verified competency scores.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10 shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <div className="text-xs text-slate-400 font-medium">
              Verified Threshold
            </div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              ≥ 60% Passing
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedType(cat.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Assessment Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-3" />
          <p className="text-xs font-mono text-slate-400">
            Loading assessments catalog...
          </p>
        </div>
      ) : assessments && assessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((item) => {
            const hasAttempted = Boolean(item.latestAttempt);
            const isPassed = item.latestAttempt?.passed;

            return (
              <div
                key={item.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-6 group relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Category & Status Badges */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
                      {item.category?.name || "General"}
                    </span>

                    {hasAttempted && (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 ${
                          isPassed
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                            : "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                        }`}
                      >
                        {isPassed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              Passed ({item.latestAttempt?.percentage}%)
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            <span>
                              Score: {item.latestAttempt?.percentage}%
                            </span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description ||
                        "Evaluate technical core concepts and problem solving capabilities."}
                    </p>
                  </div>

                  {/* Meta Specs */}
                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-400 font-mono">
                    <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-850">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>{item.durationMinutes} Mins</span>
                    </div>
                    <div className="flex items-center space-x-1.5 p-2 rounded-xl bg-slate-900/80 border border-slate-850">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{item.questionCount} Questions</span>
                    </div>
                  </div>
                </div>

                {/* Card Action CTAs */}
                <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-3">
                  {hasAttempted ? (
                    <>
                      <Link
                        to={`/student/assessments/${item.id}/result`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold text-center transition-all"
                      >
                        View Report
                      </Link>
                      <Link
                        to={`/student/assessments/${item.id}`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold text-center shadow-md shadow-sky-500/20 transition-all flex items-center justify-center space-x-1"
                      >
                        <span>Retake</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={`/student/assessments/${item.id}`}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold text-center shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center space-x-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>Start Assessment</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <BrainCircuit className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No assessments found
          </h3>
          <p className="text-xs text-slate-400">
            Try adjusting your category filter or search keywords.
          </p>
        </div>
      )}
    </div>
  );
};
