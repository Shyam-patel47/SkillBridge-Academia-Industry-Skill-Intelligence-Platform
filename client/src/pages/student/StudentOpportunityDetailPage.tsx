import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Heart,
  UserCheck,
  Compass,
  Send,
  FileText,
  X,
} from "lucide-react";
import {
  opportunityDiscoveryService,
  StudentOpportunityItem,
} from "../../services/opportunityDiscoveryService";
import { applicationService } from "../../services/applicationService";

export const StudentOpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  const { data: opportunity, isLoading } = useQuery<StudentOpportunityItem>({
    queryKey: ["student", "opportunity", id],
    queryFn: () => opportunityDiscoveryService.getStudentOpportunityDetail(id!),
    enabled: Boolean(id),
  });

  const applyMutation = useMutation({
    mutationFn: (payload: {
      opportunityId: string;
      resumeUrl?: string;
      coverLetter?: string;
    }) => applicationService.apply(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student", "applications"] });
      setApplySuccess(data.id);
      setApplyError(null);
    },
    onError: (err: any) => {
      setApplyError(
        err.response?.data?.message ||
          err.message ||
          "Failed to submit application",
      );
    },
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunity) return;
    setApplyError(null);
    applyMutation.mutate({
      opportunityId: opportunity.id,
      resumeUrl: resumeUrl.trim() || undefined,
      coverLetter: coverLetter.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Calculating 5-factor mathematical compatibility matrix...
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

  const score = opportunity.matchScore ?? opportunity.compatibilityScore;
  const isHigh = score >= 80;
  const isModerate = score >= 50 && score < 80;
  const eligibility = opportunity.academicEligibility;
  const breakdown = opportunity.breakdown;

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

      {/* 5-Factor Match Engine Breakdown Cockpit */}
      {breakdown && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>5-Factor Explainable Match Breakdown</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              Total Score: {score}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Factor 1: Skill Compatibility */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Skill Compatibility (50% Weight)</span>
                </div>
                <span className="text-sky-400 font-bold">
                  {breakdown.skillCompatibility.score}% (+
                  {breakdown.skillCompatibility.weightedContribution}pts)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all"
                  style={{ width: `${breakdown.skillCompatibility.score}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Fulfillment across {opportunity.matchingSkills.length}/
                {opportunity.requiredSkills.length} required skills
              </span>
            </div>

            {/* Factor 2: Academic Eligibility */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Academic Eligibility (20% Weight)</span>
                </div>
                <span
                  className={
                    breakdown.eligibility.score >= 70
                      ? "text-emerald-400 font-bold"
                      : "text-amber-400 font-bold"
                  }
                >
                  {breakdown.eligibility.score}% (+
                  {breakdown.eligibility.weightedContribution}pts)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    breakdown.eligibility.score >= 70
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${breakdown.eligibility.score}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                CGPA cutoff (40pts) + Branch eligibility (35pts) + Batch year
                (25pts)
              </span>
            </div>

            {/* Factor 3: Career Interest Match */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                  <Heart className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Career Interest Alignment (15% Weight)</span>
                </div>
                <span className="text-indigo-400 font-bold">
                  {breakdown.careerInterest.score}% (+
                  {breakdown.careerInterest.weightedContribution}pts)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${breakdown.careerInterest.score}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Matched interests:{" "}
                {opportunity.interestMatch?.matchedInterests.join(", ") ||
                  "General tech track"}
              </span>
            </div>

            {/* Factor 4: Experience & Track Record */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                  <Award className="w-3.5 h-3.5 text-purple-400" />
                  <span>Experience & Verified Track (10% Weight)</span>
                </div>
                <span className="text-purple-400 font-bold">
                  {breakdown.experience.score}% (+
                  {breakdown.experience.weightedContribution}pts)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${breakdown.experience.score}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                {opportunity.experienceMatch?.projectCount ?? 0} projects +{" "}
                {opportunity.experienceMatch?.certificationCount ?? 0}{" "}
                credentials verified
              </span>
            </div>
          </div>

          {/* Factor 5: Location Preference Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-1.5 text-slate-300 font-bold">
                <Compass className="w-3.5 h-3.5 text-teal-400" />
                <span>Location & Work Mode Preference (5% Weight)</span>
              </div>
              <span className="text-teal-400 font-bold">
                {breakdown.locationPreference.score}% (+
                {breakdown.locationPreference.weightedContribution}pts)
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-500 h-2 rounded-full transition-all"
                style={{ width: `${breakdown.locationPreference.score}%` }}
              />
            </div>
          </div>

          {/* Explainability Summary Box */}
          <div className="p-4 rounded-2xl bg-[#060a14] border border-slate-850 text-xs text-slate-300 leading-relaxed space-y-1.5">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deterministic Match Rationale:</span>
            </div>
            <p className="leading-relaxed">{opportunity.explanation}</p>
          </div>
        </div>
      )}

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
            const gap = (
              opportunity.missingSkills || opportunity.gapSkills
            ).find((g) => g.skillId === req.skillId);
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

      {/* Interactive Application Action Hub */}
      <div className="p-6 rounded-3xl border border-sky-500/30 bg-gradient-to-r from-sky-950/40 via-slate-900 to-sky-950/40 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl shadow-sky-500/10">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <h3 className="text-base font-bold text-white">Ready to Apply?</h3>
          </div>
          <p className="text-xs text-slate-400">
            Submit your application with verified skill benchmarks and custom
            cover letter directly to {opportunity.company.companyName}.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/student/learning"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Upskill First</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-extrabold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
          >
            <Send className="w-4 h-4" />
            <span>Apply Now ({score}% Match)</span>
          </button>
        </div>
      </div>

      {/* Application Submission Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-850 bg-slate-900 max-w-lg w-full space-y-6 relative shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setIsApplyModalOpen(false);
                setApplySuccess(null);
                setApplyError(null);
              }}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {applySuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Application Submitted!
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your application for{" "}
                  <span className="text-white font-semibold">
                    {opportunity.title}
                  </span>{" "}
                  at{" "}
                  <span className="text-white font-semibold">
                    {opportunity.company.companyName}
                  </span>{" "}
                  has been securely submitted with your verified skill score of{" "}
                  <span className="text-emerald-400 font-bold">{score}%</span>.
                </p>

                <div className="pt-3 flex items-center justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      navigate(`/student/applications/${applySuccess}`);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-xs font-bold"
                  >
                    View Application Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      navigate("/student/applications");
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    All Applications
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Match Score: {score}%</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-white">
                    Apply for {opportunity.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {opportunity.company.companyName} • {opportunity.workMode}
                  </p>
                </div>

                {applyError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                {/* Resume URL Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 block flex items-center justify-between">
                    <span>Resume Link (PDF / Portfolio URL)</span>
                    <span className="text-[10px] text-slate-500">
                      Optional (uses profile resume)
                    </span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="url"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://your-domain.com/resume.pdf"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Cover Letter */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-300 block flex items-center justify-between">
                    <span>Cover Letter / Note to Recruiter</span>
                    <span className="text-[10px] text-slate-500">Optional</span>
                  </label>
                  <textarea
                    rows={4}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Highlight your key projects, learning milestones, and why you are interested in this position..."
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyMutation.isPending}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {applyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm & Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
