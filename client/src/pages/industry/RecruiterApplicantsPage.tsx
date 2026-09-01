import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Sparkles,
  FileText,
  Loader2,
  Calendar,
  ExternalLink,
  X,
  MessageSquare,
} from "lucide-react";
import {
  applicationService,
  ApplicationItem,
  ApplicationStatus,
} from "../../services/applicationService";
import {
  opportunityService,
  OpportunityItem,
} from "../../services/opportunityService";

export const RecruiterApplicantsPage: React.FC = () => {
  const { id: opportunityId } = useParams<{ id?: string }>();
  const queryClient = useQueryClient();

  const [selectedOppId, setSelectedOppId] = useState<string>(
    opportunityId || "",
  );
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationItem | null>(null);
  const [statusNotesInput, setStatusNotesInput] = useState("");

  // Fetch Company Opportunities for selector
  const { data: opportunities = [] } = useQuery<OpportunityItem[]>({
    queryKey: ["company", "opportunities"],
    queryFn: () => opportunityService.getMyOpportunities(),
  });

  // Fetch Applicants
  const { data: applicants = [], isLoading } = useQuery<ApplicationItem[]>({
    queryKey: ["recruiter", "applicants", selectedOppId, activeTab, search],
    queryFn: () =>
      applicationService.getRecruiterApplications({
        opportunityId: selectedOppId || undefined,
        status: activeTab !== "ALL" ? activeTab : undefined,
        search: search || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      statusNotes,
    }: {
      id: string;
      status: ApplicationStatus;
      statusNotes?: string;
    }) => applicationService.updateStatus(id, status, statusNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "applicants"] });
      if (selectedApplication) {
        setSelectedApplication((prev) =>
          prev
            ? { ...prev, statusNotes: statusNotesInput || prev.statusNotes }
            : null,
        );
      }
    },
  });

  // KPI calculations
  const totalCount = applicants.length;
  const appliedCount = applicants.filter((a) => a.status === "APPLIED").length;
  const shortlistedCount = applicants.filter(
    (a) => a.status === "SHORTLISTED",
  ).length;
  const interviewCount = applicants.filter(
    (a) => a.status === "INTERVIEW",
  ).length;
  const offerCount = applicants.filter(
    (a) =>
      a.status === "OFFER" || a.status === "OFFERED" || a.status === "JOINED",
  ).length;

  const handleStatusChange = (
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string,
  ) => {
    updateStatusMutation.mutate({
      id: applicationId,
      status: newStatus,
      statusNotes: notes,
    });
  };

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
            OFFER EXTENDED
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
            REJECTED
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
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Recruiter Candidate Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Applicant Management Hub
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Review candidates ranked by mathematical skill match scores. Screen
            verified competency proof, shortlist applicants, and manage
            recruitment stage transitions.
          </p>
        </div>

        <Link
          to="/industry/opportunities/create"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Post New Opportunity</span>
        </Link>
      </div>

      {/* KPI Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">
            Total Applicants
          </span>
          <div className="text-2xl font-extrabold font-mono text-white">
            {totalCount}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">
            Pending Review
          </span>
          <div className="text-2xl font-extrabold font-mono text-sky-400">
            {appliedCount}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">Shortlisted</span>
          <div className="text-2xl font-extrabold font-mono text-indigo-400">
            {shortlistedCount}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">Interviewing</span>
          <div className="text-2xl font-extrabold font-mono text-purple-400">
            {interviewCount}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-800 space-y-1">
          <span className="text-xs font-mono text-slate-400">
            Offers Extended
          </span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {offerCount}
          </div>
        </div>
      </div>

      {/* Filter & Opportunity Selection Cockpit */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opportunity Dropdown */}
          <div className="sm:col-span-1">
            <select
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-sky-500"
            >
              <option value="">
                All Company Postings ({opportunities.length})
              </option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.type})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search applicants by candidate name, branch, or college..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs pt-2 border-t border-slate-850">
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

      {/* Candidate Pipeline Stream */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
          <p className="text-xs font-mono text-slate-400">
            Loading applicant pipeline...
          </p>
        </div>
      ) : applicants.length > 0 ? (
        <div className="space-y-4">
          {applicants.map((app) => {
            const student = app.student;
            const matchScore = app.matchScore ?? 0;
            const isHigh = matchScore >= 80;

            return (
              <div
                key={app.id}
                className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Candidate Info Column */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(app.status)}

                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      Role:{" "}
                      <span className="text-white">
                        {app.opportunity.title}
                      </span>
                    </span>

                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white hover:text-sky-300 transition-colors">
                      {student?.fullName || "Candidate"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono mt-0.5">
                      <span>{student?.email}</span>
                      {student?.branch && <span>• {student.branch}</span>}
                      {student?.college && <span>• {student.college}</span>}
                      {student?.cgpa && (
                        <span className="text-emerald-400 font-bold">
                          • CGPA: {student.cgpa}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Snapshot */}
                  {student?.skills && student.skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-mono text-slate-500 mr-1">
                        Verified Skills:
                      </span>
                      {student.skills.slice(0, 4).map((s) => (
                        <span
                          key={s.skillId}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono"
                        >
                          {s.skillName} ({s.score}%)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Cover Letter preview */}
                  {app.coverLetter && (
                    <p className="text-xs text-slate-400 italic line-clamp-1 bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                      "{app.coverLetter}"
                    </p>
                  )}
                </div>

                {/* Match Score & Action Column */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Match Score
                    </span>
                    <span
                      className={`text-2xl font-extrabold font-mono ${
                        isHigh ? "text-emerald-400" : "text-sky-400"
                      }`}
                    >
                      {matchScore}%
                    </span>
                  </div>

                  {/* One-Click Pipeline Transition Actions */}
                  {app.status !== "WITHDRAWN" && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {app.status === "APPLIED" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(app.id, "SHORTLISTED")
                          }
                          className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all"
                        >
                          Shortlist
                        </button>
                      )}

                      {(app.status === "APPLIED" ||
                        app.status === "SHORTLISTED") && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(app.id, "INTERVIEW")
                          }
                          className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-all"
                        >
                          Interview
                        </button>
                      )}

                      {app.status === "INTERVIEW" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(app.id, "OFFERED")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all"
                        >
                          Extend Offer
                        </button>
                      )}

                      {app.status !== "REJECTED" &&
                        app.status !== "OFFERED" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(app.id, "REJECTED")
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
                          >
                            Reject
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedApplication(app);
                          setStatusNotesInput(app.statusNotes || "");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-sky-400 hover:text-white text-xs font-bold transition-all"
                      >
                        Full Dossier
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No applicants found
          </h3>
          <p className="text-xs text-slate-400">
            There are no candidate applications under the selected criteria.
          </p>
        </div>
      )}

      {/* Candidate Application Dossier Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900 max-w-2xl w-full space-y-6 relative shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedApplication(null)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Candidate Header */}
            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                {getStatusBadge(selectedApplication.status)}
                <span className="text-xs font-mono text-slate-400">
                  Applied for {selectedApplication.opportunity.title}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                {selectedApplication.student?.fullName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                <span>{selectedApplication.student?.email}</span>
                {selectedApplication.student?.phone && (
                  <span>• {selectedApplication.student.phone}</span>
                )}
                {selectedApplication.student?.cgpa && (
                  <span className="text-emerald-400 font-bold">
                    • CGPA: {selectedApplication.student.cgpa}
                  </span>
                )}
                {selectedApplication.student?.branch && (
                  <span>• {selectedApplication.student.branch}</span>
                )}
              </div>
            </div>

            {/* Resume Link */}
            {selectedApplication.resumeUrl && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <span className="text-white font-bold">Candidate Resume</span>
                </div>
                <a
                  href={selectedApplication.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold"
                >
                  <span>Open Resume</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Cover Letter */}
            {selectedApplication.coverLetter && (
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase font-bold">
                  Cover Letter
                </span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-850 whitespace-pre-line">
                  {selectedApplication.coverLetter}
                </p>
              </div>
            )}

            {/* Verified Skills Matrix */}
            {selectedApplication.student?.skills &&
              selectedApplication.student.skills.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-400 uppercase font-bold">
                    Verified Competencies
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedApplication.student.skills.map((s) => (
                      <div
                        key={s.skillId}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-850 text-xs font-mono"
                      >
                        <span className="text-slate-400 block text-[10px]">
                          {s.skillName}
                        </span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {s.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Internal Recruiter Notes & Pipeline Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Internal Recruiter Notes / Remarks</span>
              </span>

              <textarea
                rows={3}
                value={statusNotesInput}
                onChange={(e) => setStatusNotesInput(e.target.value)}
                placeholder="Add private evaluation notes, interview schedule links, or feedback..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-mono"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        selectedApplication.id,
                        "SHORTLISTED",
                        statusNotesInput,
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold"
                  >
                    Shortlist
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        selectedApplication.id,
                        "INTERVIEW",
                        statusNotesInput,
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold"
                  >
                    Move to Interview
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        selectedApplication.id,
                        "OFFERED",
                        statusNotesInput,
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold"
                  >
                    Make Offer
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        selectedApplication.id,
                        "REJECTED",
                        statusNotesInput,
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold"
                  >
                    Reject
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedApplication(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
