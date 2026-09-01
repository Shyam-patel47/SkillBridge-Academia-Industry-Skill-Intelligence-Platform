import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  Calendar,
  Layers,
  BookOpen,
  Award,
  Lock,
} from "lucide-react";
import {
  opportunityDiscoveryService,
  StudentOpportunityItem,
} from "../../services/opportunityDiscoveryService";

export const StudentOpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: opportunity, isLoading } = useQuery<StudentOpportunityItem>({
    queryKey: ["student", "opportunity", id],
    queryFn: () => opportunityDiscoveryService.getStudentOpportunityDetail(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading opportunity & calculating compatibility matrix...
        </p>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-4 my-12">
        <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">Opportunity Not Found</h3>
        <p className="text-xs text-slate-400">
          The requested vacancy is not available or has expired.
        </p>
        <Link
          to="/student/opportunities"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold"
        >
          <span>Back to Opportunities</span>
        </Link>
      </div>
    );
  }

  const score = opportunity.compatibilityScore;
  const isHigh = score >= 80;
  const isModerate = score >= 50 && score < 80;
  const eligibility = opportunity.academicEligibility;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/opportunities"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunity Explorer</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c30] to-slate-900 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                {opportunity.type === "FULL_TIME"
                  ? "ENTRY LEVEL JOB"
                  : opportunity.type}
              </span>

              <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-mono">
                {opportunity.workMode}
              </span>

              {eligibility.isEligible ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Academic Criteria Met</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Academic Cutoff</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {opportunity.title}
            </h1>

            <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-1 text-white font-bold">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>{opportunity.company.companyName}</span>
              </div>
              {opportunity.company.isVerified && (
                <span className="text-emerald-400 font-bold">
                  ✓ Verified Partner
                </span>
              )}
              {opportunity.location && <span>• {opportunity.location}</span>}
            </div>
          </div>

          {/* Compatibility Score Radial Box */}
          <div
            className={`p-5 rounded-3xl border text-center shrink-0 w-36 ${
              isHigh
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : isModerate
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            <span className="text-3xl font-black font-mono block">
              {score}%
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold block mt-0.5">
              {opportunity.matchFit.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
          {opportunity.location && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Location</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-sky-400" />
                {opportunity.location}
              </span>
            </div>
          )}

          {opportunity.duration && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Duration</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-indigo-400" />
                {opportunity.duration}
              </span>
            </div>
          )}

          {opportunity.stipendSalary && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Compensation
              </span>
              <span className="text-emerald-400 font-semibold block mt-0.5">
                💰 {opportunity.stipendSalary}
              </span>
            </div>
          )}

          {opportunity.deadline && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Application Deadline
              </span>
              <span className="text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Compatibility Diagnostics Insight */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>Skill Intelligence & Compatibility Diagnostic</span>
        </h2>

        <div className="p-4 rounded-2xl bg-[#060a14] border border-slate-850 text-xs text-slate-300 leading-relaxed space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Why your compatibility score is {score}%:</span>
          </div>
          <p className="leading-relaxed">{opportunity.explanation}</p>
        </div>
      </div>

      {/* Skill Benchmarks Breakdown Matrix */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>
              Required Competencies Benchmark Matrix (
              {opportunity.requiredSkills.length})
            </span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Target vs Verified Performance
          </span>
        </div>

        <div className="divide-y divide-slate-850">
          {opportunity.requiredSkills.map((req) => {
            const match = opportunity.matchingSkills.find(
              (m) => m.skillId === req.skillId,
            );
            const gap = opportunity.gapSkills.find(
              (g) => g.skillId === req.skillId,
            );
            const studentScore = match
              ? match.studentScore
              : gap
                ? gap.studentScore
                : 0;
            const isMet = studentScore >= req.minScore;

            return (
              <div
                key={req.id || req.skillId}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">
                      {req.skillName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        req.isMandatory
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {req.isMandatory ? "MANDATORY" : "PREFERRED"}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    {req.categoryName || "Technical Competency"} • Weight:{" "}
                    {req.weight}x
                  </span>
                </div>

                <div className="flex items-center space-x-6 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      Your Score
                    </span>
                    <span
                      className={`font-bold ${
                        isMet
                          ? "text-emerald-400"
                          : studentScore > 0
                            ? "text-amber-400"
                            : "text-slate-500"
                      }`}
                    >
                      {studentScore > 0 ? `${studentScore}%` : "Unassessed"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      Benchmark
                    </span>
                    <span className="font-bold text-sky-400">
                      ≥ {req.minScore}%
                    </span>
                  </div>

                  <div className="w-28 text-right">
                    {isMet ? (
                      <span className="inline-flex items-center text-emerald-400 font-bold text-xs gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Satisfied</span>
                      </span>
                    ) : (
                      <Link
                        to="/student/learning"
                        className="inline-flex items-center space-x-1 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>
                          Bridge Gap (-{req.minScore - studentScore}pts)
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Academic Eligibility Checklist */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Award className="w-4 h-4 text-sky-400" />
          <span>Academic & Campus Eligibility Verification</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CGPA Requirement */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                CGPA Cutoff
              </span>
              {eligibility.cgpaMet ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-xs font-mono">
              <span className="text-slate-500 block text-[10px]">
                Required / Yours
              </span>
              <span className="text-white font-bold">
                {opportunity.minCgpa > 0
                  ? `≥ ${opportunity.minCgpa}`
                  : "No Cutoff"}{" "}
                /{" "}
                <span
                  className={
                    eligibility.cgpaMet ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {eligibility.details.studentCgpa ?? "N/A"}
                </span>
              </span>
            </div>
          </div>

          {/* Branch Requirement */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Branch Eligibility
              </span>
              {eligibility.branchMet ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-xs font-mono">
              <span className="text-slate-500 block text-[10px]">
                Your Branch
              </span>
              <span className="text-white font-bold truncate block">
                {eligibility.details.studentBranch || "All Branches Allowed"}
              </span>
            </div>
          </div>

          {/* Graduation Batch Requirement */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Graduation Batch
              </span>
              {eligibility.gradYearMet ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div className="text-xs font-mono">
              <span className="text-slate-500 block text-[10px]">
                Your Class Year
              </span>
              <span className="text-white font-bold">
                {eligibility.details.studentGradYear
                  ? `Class of ${eligibility.details.studentGradYear}`
                  : "All Batches"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Description */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Briefcase className="w-4 h-4 text-sky-400" />
          <span>Role Description & Responsibilities</span>
        </h2>

        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {opportunity.description}
        </div>
      </div>

      {/* Applications Module Placeholder Notice */}
      <div className="p-6 rounded-3xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Student Application Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              One-click application submission with resume and verified skill
              portfolio is scheduled for the upcoming module.
            </p>
          </div>
        </div>

        <Link
          to="/student/learning"
          className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold shrink-0 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Upskill for this Role</span>
        </Link>
      </div>
    </div>
  );
};
