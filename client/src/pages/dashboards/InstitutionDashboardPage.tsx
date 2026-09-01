import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Briefcase,
  Layers,
  Sparkles,
  Loader2,
  Search,
  BookOpen,
  ArrowUpRight,
  TrendingDown,
  Compass,
} from "lucide-react";
import {
  institutionService,
  InstitutionAnalyticsDossier,
} from "../../services/institutionService";

export const InstitutionDashboardPage: React.FC = () => {
  const [skillSearch, setSkillSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "DEFICIT" | "BALANCED" | "SURPLUS"
  >("ALL");

  const { data: analytics, isLoading } = useQuery<InstitutionAnalyticsDossier>({
    queryKey: ["institution", "analytics"],
    queryFn: () => institutionService.getAnalytics(),
  });

  if (isLoading || !analytics) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Aggregating institutional skill intelligence and placement metrics...
        </p>
      </div>
    );
  }

  const {
    institution,
    overview,
    demandSupplyMatrix,
    categoryBreakdown,
    applications,
    topHiringPartners,
    curriculumRecommendations,
  } = analytics;

  // Filter demand/supply items
  const filteredMatrix = demandSupplyMatrix.filter((item) => {
    const matchesSearch =
      item.skillName.toLowerCase().includes(skillSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(skillSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === "DEFICIT") {
      return item.status === "HIGH_DEFICIT" || item.status === "MODERATE_GAP";
    }
    if (statusFilter === "BALANCED") return item.status === "BALANCED";
    if (statusFilter === "SURPLUS") return item.status === "SURPLUS";
    return true;
  });

  const highDeficitCount = demandSupplyMatrix.filter(
    (item) => item.status === "HIGH_DEFICIT" || item.status === "MODERATE_GAP",
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#091e32] to-slate-900 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Institution Skill Intelligence & Accreditation Dashboard
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {institution.name}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
              Code: {institution.code}
            </span>
            {institution.location && <span>• {institution.location}</span>}
            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AICTE / UGC Verified</span>
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 shrink-0 text-right space-y-1">
          <span className="text-[10px] font-mono text-slate-500 block uppercase">
            Active Market Vacancies
          </span>
          <span className="text-2xl font-extrabold font-mono text-sky-400">
            {overview.totalActiveOpportunities} Opportunities
          </span>
          <span className="text-[10px] font-mono text-slate-400 block">
            Real-Time Aggregate Telemetry
          </span>
        </div>
      </div>

      {/* KPI Overview Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">Enrolled Students</span>
            <Users className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {overview.totalStudents}
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            {overview.assessedStudents} assessed ({overview.participationRate}%)
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">Assessment Tests</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {overview.totalAssessmentsTaken}
          </div>
          <p className="text-[11px] font-mono text-emerald-400 font-bold">
            Verified Submissions
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">Placement / Offer Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {applications.placementRate}%
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            {applications.offersCount} total student offers
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">Skill Deficit Gaps</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {highDeficitCount} Areas
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            Actionable curriculum gaps
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono">Avg Student CGPA</span>
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white">
            {overview.averageCgpa > 0 ? overview.averageCgpa : "N/A"}
          </div>
          <p className="text-[11px] font-mono text-slate-400">
            Academic baseline
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOST IMPORTANT VISUALIZATION: Industry Demand vs Student Skill Supply */}
      {/* ========================================================================= */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CORE INTELLIGENCE VISUALIZATION</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Industry Skill Demand vs Student Skill Supply
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic comparison between active industry job requirements
              and verified institutional student competencies.
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                placeholder="Search skill or category..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
              {(["ALL", "DEFICIT", "BALANCED", "SURPLUS"] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statusFilter === st
                        ? "bg-sky-500 text-white font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 text-xs font-mono text-slate-400 pt-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-sky-500" />
            <span className="text-slate-300 font-semibold">
              Industry Market Demand (%)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-300 font-semibold">
              Student Skill Supply (%)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-slate-300 font-semibold">
              Skill Gap / Deficit (%)
            </span>
          </div>
        </div>

        {/* Dual-Bar Comparison Visualizer Grid */}
        <div className="space-y-4">
          {filteredMatrix.length > 0 ? (
            filteredMatrix.map((item) => {
              const isDeficit =
                item.status === "HIGH_DEFICIT" ||
                item.status === "MODERATE_GAP";

              return (
                <div
                  key={item.skillId}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-slate-850 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-base font-bold text-white">
                        {item.skillName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <span className="text-slate-400 text-[11px]">
                        Avg Score:{" "}
                        <strong className="text-white">
                          {item.averageStudentScore}%
                        </strong>
                      </span>

                      {/* Status Badges */}
                      {item.status === "HIGH_DEFICIT" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>HIGH DEFICIT (-{item.gapPercentage}%)</span>
                        </span>
                      )}
                      {item.status === "MODERATE_GAP" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>GAP (-{item.gapPercentage}%)</span>
                        </span>
                      )}
                      {item.status === "BALANCED" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>BALANCED</span>
                        </span>
                      )}
                      {item.status === "SURPLUS" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>
                            SURPLUS (+
                            {item.studentSupplyPercentage -
                              item.industryDemandPercentage}
                            %)
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual Bar Visualizers */}
                  <div className="space-y-2 text-xs font-mono">
                    {/* Industry Demand Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="text-sky-400 font-semibold flex items-center gap-1">
                          <span>Industry Demand</span>
                          <span className="text-slate-500 text-[10px]">
                            ({item.opportunityCount} active postings)
                          </span>
                        </span>
                        <span className="text-sky-400 font-bold">
                          {item.industryDemandPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-600 to-sky-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, item.industryDemandPercentage)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Student Supply Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span
                          className={`${isDeficit ? "text-amber-400" : "text-emerald-400"} font-semibold flex items-center gap-1`}
                        >
                          <span>Student Supply</span>
                          <span className="text-slate-500 text-[10px]">
                            ({item.competentStudentsCount} verified students)
                          </span>
                        </span>
                        <span
                          className={`${isDeficit ? "text-amber-400" : "text-emerald-400"} font-bold`}
                        >
                          {item.studentSupplyPercentage}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDeficit
                              ? "bg-gradient-to-r from-amber-600 to-amber-400"
                              : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                          }`}
                          style={{
                            width: `${Math.min(100, item.studentSupplyPercentage)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Compass className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono">No matching skills found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Category Competencies & Application/Placement Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Competencies */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Categorized Domain Competencies</span>
          </h3>

          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.categoryId}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold">
                    {cat.categoryName}
                  </span>
                  <span className="text-emerald-400 font-extrabold">
                    {cat.averageScore}% Avg
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full"
                    style={{ width: `${cat.averageScore}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{cat.skillCount} curriculum skills</span>
                  <span>{cat.evaluatedCount} evaluations completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application & Placement Funnel */}
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Briefcase className="w-4 h-4 text-sky-400" />
            <span>Placement & Application Conversion Pipeline</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Shortlist Conversion
              </span>
              <span className="text-2xl font-black font-mono text-sky-400">
                {applications.shortlistRate}%
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 text-center space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Placement Success
              </span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {applications.placementRate}%
              </span>
            </div>
          </div>

          {/* Funnel breakdown */}
          <div className="space-y-2 text-xs font-mono">
            {[
              {
                label: "Total Applications Submitted",
                count: applications.totalApplications,
                color: "bg-slate-700",
              },
              {
                label: "Shortlisted by Recruiters",
                count: applications.shortlistedCount,
                color: "bg-sky-500",
              },
              {
                label: "Interview Rounds Conducted",
                count: applications.interviewCount,
                color: "bg-indigo-500",
              },
              {
                label: "Corporate Offers Extended",
                count: applications.offersCount,
                color: "bg-emerald-500",
              },
            ].map((stage) => (
              <div
                key={stage.label}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950"
              >
                <span className="text-slate-300">{stage.label}</span>
                <span className="text-white font-bold">{stage.count}</span>
              </div>
            ))}
          </div>

          {/* Top Hiring Partners */}
          {topHiringPartners.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
                Top Hiring Partner Companies
              </span>
              <div className="flex flex-wrap gap-2">
                {topHiringPartners.map((item) => (
                  <span
                    key={item.company.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                  >
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>{item.company.companyName}</span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      ({item.offersCount} offers)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Actionable Curriculum Recommendations */}
      {curriculumRecommendations.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-[#0a1b2a] to-slate-950 space-y-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">
              Institutional Curriculum Interventions & AI Recommendations
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Based on mathematical industry demand deficits, SkillBridge
            recommends the following academic course adaptations to maximize
            student employment compatibility:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {curriculumRecommendations.map((rec) => (
              <div
                key={rec.skillName}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-sky-400 font-bold">
                    {rec.skillName} ({rec.category})
                  </span>
                  <span className="text-rose-400 font-bold">
                    Deficit: -{rec.deficit}%
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {rec.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
