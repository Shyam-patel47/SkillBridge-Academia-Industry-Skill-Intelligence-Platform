import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  Edit3,
  Trash2,
  Eye,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  opportunityService,
  OpportunityItem,
} from "../../services/opportunityService";

export const IndustryOpportunitiesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "active" | "inactive"
  >("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const { data: opportunities, isLoading } = useQuery<OpportunityItem[]>({
    queryKey: [
      "company",
      "opportunities",
      statusFilter,
      typeFilter,
      searchQuery,
    ],
    queryFn: () =>
      opportunityService.getMyOpportunities({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        type: typeFilter !== "ALL" ? typeFilter : undefined,
        search: searchQuery || undefined,
      }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      opportunityService.togglePublish(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => opportunityService.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
      setDeleteTargetId(null);
    },
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2f] to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
            <span>Opportunity Management Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Manage Vacancies & Postings
          </h1>
          <p className="text-xs text-slate-400">
            Publish, edit, and monitor your company's active internships and
            full-time job openings.
          </p>
        </div>

        <Link
          to="/industry/opportunities/create"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Opportunity</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2">
          {(["ALL", "active", "inactive"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st === "ALL"
                ? "All Statuses"
                : st === "active"
                  ? "Published"
                  : "Draft / Closed"}
            </button>
          ))}
        </div>

        {/* Type & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Types</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="FULL_TIME">Entry Level Job</option>
            <option value="PART_TIME">Part-Time</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search postings..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Opportunity Grid / List */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400 mb-2" />
          <p className="text-xs font-mono text-slate-400">
            Loading opportunities...
          </p>
        </div>
      ) : opportunities && opportunities.length > 0 ? (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Main Content */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      opp.isActive
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800 border border-slate-700 text-slate-400"
                    }`}
                  >
                    {opp.isActive ? "PUBLISHED" : "DRAFT"}
                  </span>

                  <span className="px-2.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono uppercase">
                    {opp.type === "FULL_TIME" ? "ENTRY LEVEL JOB" : opp.type}
                  </span>

                  <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-mono">
                    {opp.workMode}
                  </span>

                  {opp.deadline && (
                    <span className="text-xs font-mono text-slate-500">
                      Deadline: {new Date(opp.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white hover:text-sky-300 transition-colors">
                    <Link to={`/industry/opportunities/${opp.id}`}>
                      {opp.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {opp.description}
                  </p>
                </div>

                {/* Specs Row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400 font-mono pt-1">
                  {opp.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {opp.location}
                    </span>
                  )}
                  {opp.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {opp.duration}
                    </span>
                  )}
                  {opp.stipendSalary && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      💰 {opp.stipendSalary}
                    </span>
                  )}
                  {opp.minCgpa > 0 && <span>Min CGPA: ≥ {opp.minCgpa}</span>}
                </div>

                {/* Required Skills Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono text-slate-500">
                    Required Skills & Benchmarks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {opp.requiredSkills.map((s) => (
                      <span
                        key={s.skillId}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-sky-300 font-mono"
                      >
                        {s.skillName || "Skill"} (≥{s.minScore}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                {/* Applicants Counter */}
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center w-24">
                  <span className="text-lg font-extrabold font-mono text-white block">
                    {opp.applicationsCount || 0}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    Applicants
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      togglePublishMutation.mutate({
                        id: opp.id,
                        isActive: !opp.isActive,
                      })
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      opp.isActive
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                    }`}
                  >
                    {opp.isActive ? "Unpublish" : "Publish"}
                  </button>

                  <Link
                    to={`/industry/opportunities/${opp.id}/edit`}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    title="Edit Posting"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/industry/opportunities/${opp.id}`}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(opp.id)}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                    title="Delete Opportunity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            No opportunities found
          </h3>
          <p className="text-xs text-slate-400">
            {searchQuery || statusFilter !== "ALL"
              ? "Try adjusting your filters or keyword search."
              : "Post your first opportunity to start receiving candidate applications."}
          </p>
          <div className="pt-2">
            <Link
              to="/industry/opportunities/create"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Posting</span>
            </Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Delete Opportunity?
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this opportunity
              posting? All candidate applications associated with this posting
              will also be removed.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTargetId)}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-500/25"
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
