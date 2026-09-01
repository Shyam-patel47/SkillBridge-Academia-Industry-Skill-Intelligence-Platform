import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Loader2,
  XCircle,
  ExternalLink,
  MapPin,
} from "lucide-react";
import {
  applicationService,
  ApplicationItem,
} from "../../services/applicationService";

export const StudentApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");

  const { data: application, isLoading } = useQuery<ApplicationItem>({
    queryKey: ["student", "application", id],
    queryFn: () => applicationService.getStudentApplicationDetail(id!),
    enabled: Boolean(id),
  });

  const withdrawMutation = useMutation({
    mutationFn: (reason?: string) =>
      applicationService.withdrawApplication(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "application", id],
      });
      queryClient.invalidateQueries({ queryKey: ["student", "applications"] });
      setIsWithdrawModalOpen(false);
      setWithdrawReason("");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading application dossier & timeline...
        </p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-4 my-12">
        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">Application Not Found</h3>
        <p className="text-xs text-slate-400">
          This application does not exist or you do not have permission to view
          it.
        </p>
        <Link
          to="/student/applications"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold"
        >
          <span>Back to Applications</span>
        </Link>
      </div>
    );
  }

  const opp = application.opportunity;
  const status = application.status;
  const canWithdraw =
    status === "APPLIED" || status === "SHORTLISTED" || status === "INTERVIEW";
  const matchBreakdown = application.matchBreakdown;

  // Lifecycle steps calculation
  const getStepState = (stepIndex: number) => {
    // 0: APPLIED, 1: SHORTLISTED, 2: INTERVIEW, 3: DECISION
    if (status === "WITHDRAWN") {
      return stepIndex === 0 ? "completed" : "withdrawn";
    }
    if (status === "REJECTED") {
      return stepIndex <= 1 ? "completed" : "rejected";
    }
    if (status === "OFFER" || status === "OFFERED" || status === "JOINED") {
      return "completed";
    }
    if (status === "INTERVIEW") {
      return stepIndex <= 2
        ? stepIndex === 2
          ? "current"
          : "completed"
        : "upcoming";
    }
    if (status === "SHORTLISTED") {
      return stepIndex <= 1
        ? stepIndex === 1
          ? "current"
          : "completed"
        : "upcoming";
    }
    return stepIndex === 0 ? "current" : "upcoming";
  };

  const steps = [
    {
      title: "Application Submitted",
      date: new Date(application.appliedAt).toLocaleDateString(),
    },
    {
      title: "Resume & Skill Shortlisted",
      date: status !== "APPLIED" ? "Reviewed" : "Pending",
    },
    {
      title: "Technical Interview",
      date:
        status === "INTERVIEW" || status === "OFFERED"
          ? "Scheduled"
          : "Pending",
    },
    {
      title: "Final Decision / Offer",
      date:
        status === "OFFERED"
          ? "Offer Extended"
          : status === "REJECTED"
            ? "Not Selected"
            : "Pending",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/applications"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c30] to-slate-900 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                {opp.type}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-mono">
                {opp.workMode}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Applied on{" "}
                {new Date(application.appliedAt).toLocaleDateString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {opp.title}
            </h1>

            <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center space-x-1 text-white font-bold">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>{opp.company.companyName}</span>
              </div>
              {opp.company.isVerified && (
                <span className="text-emerald-400 font-bold">
                  ✓ Verified Partner
                </span>
              )}
              {opp.location && <span>• {opp.location}</span>}
            </div>
          </div>

          <div className="p-4 rounded-3xl border text-center shrink-0 w-36 bg-slate-950/80 border-slate-800">
            <span className="text-2xl font-black font-mono text-emerald-400 block">
              {application.matchScore ?? 0}%
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
              Match Score
            </span>
          </div>
        </div>

        {/* Specs Pill Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
          {opp.location && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Location</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-sky-400" />
                {opp.location}
              </span>
            </div>
          )}

          {opp.duration && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">Duration</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-indigo-400" />
                {opp.duration}
              </span>
            </div>
          )}

          {opp.stipendSalary && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Compensation
              </span>
              <span className="text-emerald-400 font-semibold block mt-0.5">
                💰 {opp.stipendSalary}
              </span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
            <span className="text-slate-500 block text-[10px]">
              Current Status
            </span>
            <span className="text-sky-400 font-bold block mt-0.5">
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Lifecycle Progress Stepper */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Clock className="w-4 h-4 text-sky-400" />
          <span>Application Lifecycle Progression</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {steps.map((step, idx) => {
            const state = getStepState(idx);
            const isDone = state === "completed";
            const isCurrent = state === "current";

            return (
              <div
                key={step.title}
                className={`p-4 rounded-2xl border transition-all ${
                  isDone
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : isCurrent
                      ? "bg-sky-500/10 border-sky-500/40 text-sky-300 ring-2 ring-sky-500/20"
                      : state === "rejected"
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : state === "withdrawn"
                          ? "bg-slate-900 border-slate-800 text-slate-500"
                          : "bg-slate-950/60 border-slate-850 text-slate-500"
                }`}
              >
                <div className="flex items-center space-x-2 text-xs font-mono font-bold mb-1">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                  )}
                  <span>Step {idx + 1}</span>
                </div>
                <h4 className="text-xs font-bold text-white">{step.title}</h4>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                  {step.date}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recruiter Remarks if present */}
        {application.statusNotes && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300 space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">
              Recruiter Feedback / Status Remarks
            </span>
            <p className="leading-relaxed whitespace-pre-line">
              {application.statusNotes}
            </p>
          </div>
        )}
      </div>

      {/* Submitted Application Dossier */}
      <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Your Submitted Application Package</span>
        </h2>

        <div className="space-y-4 text-xs font-mono">
          {/* Resume Link */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-sky-400" />
              <div>
                <span className="text-white font-bold block">
                  Attached Candidate Resume
                </span>
                <span className="text-[10px] text-slate-500">
                  {application.resumeUrl
                    ? application.resumeUrl
                    : "Default verified profile resume"}
                </span>
              </div>
            </div>

            {application.resumeUrl && (
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 hover:text-white text-xs font-semibold"
              >
                <span>Open Resume</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Cover Letter */}
          {application.coverLetter && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">
                Cover Letter
              </span>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line font-sans">
                {application.coverLetter}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Match Breakdown Snapshot */}
      {matchBreakdown && matchBreakdown.breakdown && (
        <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>5-Factor Match Evaluation Snapshot</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Skills (50%)
              </span>
              <span className="text-sky-400 font-bold">
                {matchBreakdown.breakdown.skillCompatibility?.score}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Eligibility (20%)
              </span>
              <span className="text-emerald-400 font-bold">
                {matchBreakdown.breakdown.eligibility?.score}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Interest (15%)
              </span>
              <span className="text-indigo-400 font-bold">
                {matchBreakdown.breakdown.careerInterest?.score}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Experience (10%)
              </span>
              <span className="text-purple-400 font-bold">
                {matchBreakdown.breakdown.experience?.score}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-850">
              <span className="text-slate-500 block text-[10px]">
                Location (5%)
              </span>
              <span className="text-teal-400 font-bold">
                {matchBreakdown.breakdown.locationPreference?.score}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Option */}
      {canWithdraw && (
        <div className="p-6 rounded-3xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white">
              Need to withdraw your application?
            </h4>
            <p className="text-[11px] text-slate-400">
              You can withdraw while your application is under review or in the
              interview stage.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsWithdrawModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-all shrink-0"
          >
            Withdraw Application
          </button>
        </div>
      )}

      {/* Withdrawal Dialog */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 bg-slate-900 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">
                Confirm Withdrawal
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to withdraw your submission for {opp.title}?
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Accepted another offer, timing conflict, etc."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawMutation.isPending}
                onClick={() =>
                  withdrawMutation.mutate(withdrawReason.trim() || undefined)
                }
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {withdrawMutation.isPending ? "Withdrawing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
