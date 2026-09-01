import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Search,
  Building2,
  Sparkles,
  Loader2,
  Calendar,
  XCircle,
  ChevronRight,
} from "lucide-react";
import {
  applicationService,
  ApplicationItem,
  ApplicationStatus,
} from "../../services/applicationService";

export const StudentApplicationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");

  const { data: applications = [], isLoading } = useQuery<ApplicationItem[]>({
    queryKey: ["student", "applications", search, activeTab],
    queryFn: () =>
      applicationService.getStudentApplications({
        status: activeTab !== "ALL" ? activeTab : undefined,
        search: search || undefined,
      }),
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      applicationService.withdrawApplication(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "applications"] });
      setWithdrawingId(null);
      setWithdrawReason("");
    },
  });

  // Calculate KPI metrics
  const activeCount = applications.filter((a) => a.status === "APPLIED").length;
  const shortlistedCount = applications.filter(
    (a) => a.status === "SHORTLISTED",
  ).length;
  const interviewCount = applications.filter(
    (a) => a.status === "INTERVIEW",
  ).length;
  const offerCount = applications.filter(
    (a) =>
      a.status === "OFFER" || a.status === "OFFERED" || a.status === "JOINED",
  ).length;

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "APPLIED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400">
            APPLIED
          </span>
        );
      case "SHORTLISTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
            SHORTLISTED
          </span>
        );
      case "INTERVIEW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-300">
            INTERVIEW
          </span>
        );
      case "OFFER":
      case "OFFERED":
      case "JOINED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            OFFER RECEIVED
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
            NOT SELECTED
          </span>
        );
      case "WITHDRAWN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-400">
            WITHDRAWN
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2f] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Real-Time Candidate Pipeline Tracker</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            My Applications Hub
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Track your job and internship application lifecycle from initial
            submission to shortlisting, technical interview scheduling, and
            official offers.
          </p>
        </div>

        <Link
          to="/student/opportunities"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Explore More Roles</span>
        </Link>
      </div>

      {/* KPI Stats Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">
            Active Submissions
          </span>
          <div className="text-2xl font-extrabold font-mono text-sky-400">
            {activeCount}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">Shortlisted</span>
          <div className="text-2xl font-extrabold font-mono text-indigo-400">
            {shortlistedCount}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">In Interview</span>
          <div className="text-2xl font-extrabold font-mono text-purple-400">
            {interviewCount}
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">
            Offers Extended
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {offerCount}
          </div>
        </div>
      </div>

      {/* Filter Cockpit */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role title or company..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
            {[
              "ALL",
              "APPLIED",
              "SHORTLISTED",
              "INTERVIEW",
              "OFFERED",
              "REJECTED",
              "WITHDRAWN",
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-sky-500 text-white font-bold"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {tab === "OFFERED" ? "OFFERS" : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
          <p className="text-xs font-mono text-slate-400">
            Loading your applications...
          </p>
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => {
            const canWithdraw =
              app.status === "APPLIED" ||
              app.status === "SHORTLISTED" ||
              app.status === "INTERVIEW";

            return (
              <div
                key={app.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  {/* Status and Meta Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(app.status)}

                    <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-sky-400">
                      {app.opportunity.type}
                    </span>

                    <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                      {app.opportunity.workMode}
                    </span>

                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Applied on{" "}
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </span>
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3 className="text-lg font-bold text-white hover:text-sky-300 transition-colors">
                      <Link to={`/student/applications/${app.id}`}>
                        {app.opportunity.title}
                      </Link>
                    </h3>

                    <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      <span className="text-white font-semibold">
                        {app.opportunity.company.companyName}
                      </span>
                      {app.opportunity.location && (
                        <span>• {app.opportunity.location}</span>
                      )}
                      {app.opportunity.stipendSalary && (
                        <span className="text-emerald-400 font-bold">
                          • {app.opportunity.stipendSalary}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recruiter Notes / Status remark preview if present */}
                  {app.statusNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono text-slate-300">
                      <span className="text-slate-500 block text-[10px]">
                        Recruiter Remark:
                      </span>
                      {app.statusNotes}
                    </div>
                  )}
                </div>

                {/* Match Score & Action Column */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Match Score
                    </span>
                    <span className="text-lg font-extrabold font-mono text-emerald-400">
                      {app.matchScore ?? 0}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => setWithdrawingId(app.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
                      >
                        Withdraw
                      </button>
                    )}

                    <Link
                      to={`/student/applications/${app.id}`}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
                    >
                      <span>Track Status</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No applications found
          </h3>
          <p className="text-xs text-slate-400">
            You have not submitted any applications matching the selected
            filter.
          </p>
          <Link
            to="/student/opportunities"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold mt-2"
          >
            <span>Browse Opportunities</span>
          </Link>
        </div>
      )}

      {/* Withdrawal Confirmation Dialog */}
      {withdrawingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 bg-slate-900 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <XCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">
                Withdraw Application?
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to withdraw your submission? Once withdrawn,
              the recruiter will be notified and your application will no longer
              be considered for this opening.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 block">
                Reason for Withdrawal (Optional)
              </label>
              <textarea
                rows={2}
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="Accepted another offer, relocated, etc."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setWithdrawingId(null);
                  setWithdrawReason("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={withdrawMutation.isPending}
                onClick={() =>
                  withdrawMutation.mutate({
                    id: withdrawingId,
                    reason: withdrawReason.trim() || undefined,
                  })
                }
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {withdrawMutation.isPending
                  ? "Withdrawing..."
                  : "Confirm Withdrawal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
