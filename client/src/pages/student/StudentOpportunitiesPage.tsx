import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Search,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Building2,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  opportunityDiscoveryService,
  StudentOpportunityItem,
} from "../../services/opportunityDiscoveryService";
import { skillService, SkillCategoryItem } from "../../services/skillService";

export const StudentOpportunitiesPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [type] = useState("ALL");
  const [workMode, setWorkMode] = useState("ALL");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [eligibilityOnly, setEligibilityOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"match" | "recent" | "deadline">(
    "match",
  );
  const [activeTab, setActiveTab] = useState<
    "ALL" | "HIGH_MATCH" | "INTERNSHIP" | "FULL_TIME"
  >("ALL");

  // Fetch Taxonomy for skill filter
  const { data: taxonomy } = useQuery<SkillCategoryItem[]>({
    queryKey: ["skills", "taxonomy"],
    queryFn: skillService.getTaxonomy,
  });

  const allSkills = React.useMemo(() => {
    if (!taxonomy) return [];
    return taxonomy.flatMap((c) => c.skills);
  }, [taxonomy]);

  // Fetch Opportunities Feed with Compatibility Scores
  const { data, isLoading } = useQuery<{
    opportunities: StudentOpportunityItem[];
    totalCount: number;
  }>({
    queryKey: [
      "student",
      "opportunities",
      search,
      type,
      workMode,
      selectedSkillId,
      eligibilityOnly,
      sortBy,
    ],
    queryFn: () =>
      opportunityDiscoveryService.getStudentFeed({
        search: search || undefined,
        type: type !== "ALL" ? type : undefined,
        workMode: workMode !== "ALL" ? workMode : undefined,
        skillId: selectedSkillId || undefined,
        eligibilityOnly,
        sortBy,
      }),
  });

  const rawOpportunities = data?.opportunities || [];

  // Filter based on active tab
  const filteredOpportunities = React.useMemo(() => {
    if (activeTab === "HIGH_MATCH") {
      return rawOpportunities.filter((o) => o.compatibilityScore >= 80);
    }
    if (activeTab === "INTERNSHIP") {
      return rawOpportunities.filter((o) => o.type === "INTERNSHIP");
    }
    if (activeTab === "FULL_TIME") {
      return rawOpportunities.filter((o) => o.type === "FULL_TIME");
    }
    return rawOpportunities;
  }, [rawOpportunities, activeTab]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2f] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AI & Formula Matched Discovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Internship & Opportunity Explorer
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Discover industry opportunities scored against your verified
            competency profile. Every match score is mathematically explainable
            based on employer-defined benchmark criteria.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10 shrink-0">
          <Link
            to="/student/assessments"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Improve Match Scores</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Cockpit */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        {/* Top Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role title, technology, or company..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Skill Filter Dropdown */}
          <div>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
            >
              <option value="">All Required Skills</option>
              {allSkills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-semibold"
            >
              <option value="match">Sort: Highest Match Score</option>
              <option value="recent">Sort: Recently Posted</option>
              <option value="deadline">Sort: Application Deadline</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-850 text-xs">
          {/* Quick Select Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === "ALL"
                  ? "bg-sky-500 text-white font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              All Roles ({rawOpportunities.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("HIGH_MATCH")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === "HIGH_MATCH"
                  ? "bg-emerald-500 text-white font-bold"
                  : "bg-slate-900 border border-slate-800 text-emerald-400 hover:text-emerald-300"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>
                High Match (≥ 80%) (
                {
                  rawOpportunities.filter((o) => o.compatibilityScore >= 80)
                    .length
                }
                )
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("INTERNSHIP")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === "INTERNSHIP"
                  ? "bg-indigo-500 text-white font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Internships
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FULL_TIME")}
              className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === "FULL_TIME"
                  ? "bg-brand-500 text-white font-bold"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Entry Level Jobs
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-mono">Work Mode:</span>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
              >
                <option value="ALL">All Modes</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-Site</option>
              </select>
            </div>

            {/* Academic Eligibility Filter */}
            <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={eligibilityOnly}
                onChange={(e) => setEligibilityOnly(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
              <span>Eligible Candidates Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Opportunity Feed Stream */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
          <p className="text-xs font-mono text-slate-400">
            Calculating personalized compatibility matches from your verified
            skill profile...
          </p>
        </div>
      ) : filteredOpportunities.length > 0 ? (
        <div className="space-y-6">
          {filteredOpportunities.map((opp) => {
            const score = opp.compatibilityScore;
            const isHigh = score >= 80;
            const isModerate = score >= 50 && score < 80;

            return (
              <div
                key={opp.id}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
              >
                {/* Main Role Details */}
                <div className="space-y-4 flex-1">
                  {/* Top Meta Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                      {opp.type === "FULL_TIME" ? "ENTRY LEVEL JOB" : opp.type}
                    </span>

                    <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-mono">
                      {opp.workMode}
                    </span>

                    {opp.academicEligibility.isEligible ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Eligible</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Academic Cutoff</span>
                      </span>
                    )}

                    {opp.deadline && (
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Deadline:{" "}
                          {new Date(opp.deadline).toLocaleDateString()}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3 className="text-xl font-extrabold text-white group-hover:text-sky-300 transition-colors">
                      <Link to={`/student/opportunities/${opp.id}`}>
                        {opp.title}
                      </Link>
                    </h3>

                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 font-mono">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-white font-semibold">
                        {opp.company.companyName}
                      </span>
                      {opp.company.isVerified && (
                        <span className="text-emerald-400 text-[11px] font-bold">
                          ✓ Verified
                        </span>
                      )}
                      {opp.location && <span>• {opp.location}</span>}
                    </div>
                  </div>

                  {/* Specs Pill Matrix */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400 font-mono">
                    {opp.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {opp.duration}
                      </span>
                    )}
                    {opp.stipendSalary && (
                      <span className="text-emerald-400 font-semibold">
                        💰 {opp.stipendSalary}
                      </span>
                    )}
                    {opp.minCgpa > 0 && <span>Min CGPA: {opp.minCgpa}</span>}
                  </div>

                  {/* Matching vs Gap Skills Badges */}
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                      <span className="text-slate-500 text-[11px] mr-1">
                        Skill Benchmarks:
                      </span>
                      {opp.matchingSkills.map((s) => (
                        <span
                          key={s.skillId}
                          className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium"
                        >
                          {s.skillName} (✓ {s.studentScore}%)
                        </span>
                      ))}

                      {opp.gapSkills.map((s) => (
                        <span
                          key={s.skillId}
                          className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-medium"
                        >
                          {s.skillName} (-{s.gapPoints}pts)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Explainability Diagnostic Text */}
                  <div className="p-3 rounded-2xl bg-[#060a14] border border-slate-850 text-xs text-slate-300 flex items-start space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{opp.explanation}</p>
                  </div>
                </div>

                {/* Compatibility Score & Action Column */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Radial / Score Gauge */}
                  <div
                    className={`p-4 rounded-3xl border text-center w-28 ${
                      isHigh
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : isModerate
                          ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    <div className="text-2xl font-extrabold font-mono">
                      {score}%
                    </div>
                    <div className="text-[9px] font-mono uppercase tracking-wider mt-0.5 font-bold">
                      {opp.matchFit.replace("_", " ")}
                    </div>
                  </div>

                  <Link
                    to={`/student/opportunities/${opp.id}`}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02]"
                  >
                    <span>View Details & Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No opportunities matched your criteria
          </h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search query, clearing specific skill filters, or
            unchecking the eligible-only filter.
          </p>
        </div>
      )}
    </div>
  );
};
