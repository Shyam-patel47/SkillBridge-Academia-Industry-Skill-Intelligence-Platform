import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ArrowLeft,
  MapPin,
  Clock,
  Edit3,
  Trash2,
  CheckCircle2,
  Building2,
  Loader2,
  Sliders,
  Sparkles,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import {
  opportunityService,
  OpportunityItem,
} from "../../services/opportunityService";

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: opportunity, isLoading } = useQuery<OpportunityItem>({
    queryKey: ["opportunity", id],
    queryFn: () => opportunityService.getOpportunityById(id!),
    enabled: Boolean(id),
  });

  const togglePublishMutation = useMutation({
    mutationFn: (isActive: boolean) =>
      opportunityService.togglePublish(id!, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] });
      queryClient.invalidateQueries({ queryKey: ["company", "opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => opportunityService.deleteOpportunity(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
      navigate("/industry/opportunities");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading opportunity details...
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
          The requested posting does not exist or was deleted.
        </p>
        <Link
          to="/industry/opportunities"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold"
        >
          <span>Back to Opportunities</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/industry/opportunities"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunities</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={togglePublishMutation.isPending}
            onClick={() => togglePublishMutation.mutate(!opportunity.isActive)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              opportunity.isActive
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
            }`}
          >
            {opportunity.isActive ? "Unpublish Posting" : "Publish Opportunity"}
          </button>

          <Link
            to={`/industry/opportunities/${opportunity.id}/edit`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
            title="Delete Posting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Overview Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1d30] to-slate-900 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  opportunity.isActive
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-slate-800 border border-slate-700 text-slate-400"
                }`}
              >
                {opportunity.isActive ? "PUBLISHED" : "DRAFT"}
              </span>

              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono uppercase">
                {opportunity.type === "FULL_TIME"
                  ? "ENTRY LEVEL JOB"
                  : opportunity.type}
              </span>

              <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-sky-400 font-mono">
                {opportunity.workMode}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {opportunity.title}
            </h1>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white">
                {opportunity.company?.companyName || "Company"}
              </span>
              {opportunity.company?.isVerified && (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
          </div>

          {/* Applicants Summary */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center shrink-0 w-32">
            <span className="text-2xl font-extrabold font-mono text-white block">
              {opportunity.applicationsCount || 0}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Applications
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
              <span className="text-slate-500 block text-[10px]">Deadline</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(opportunity.deadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description & Responsibilities */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Briefcase className="w-4 h-4 text-sky-400" />
          <span>Role Description & Responsibilities</span>
        </h2>

        <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
          {opportunity.description}
        </div>
      </div>

      {/* Required Skills & Competency Benchmarks */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>
              Required Skill Competency Benchmarks (
              {opportunity.requiredSkills.length})
            </span>
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Evaluated in Compatibility Algorithm
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunity.requiredSkills.map((s) => (
            <div
              key={s.id || s.skillId}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  {s.skillName || "Skill"}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    s.isMandatory
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {s.isMandatory ? "MANDATORY" : "PREFERRED"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="text-slate-400">Min Proficiency:</span>
                <span className="font-bold text-sky-400">≥ {s.minScore}%</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Weight Multiplier:</span>
                <span>{s.weight}x</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Eligibility */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span>Academic & Eligibility Criteria</span>
        </h2>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-850 font-mono">
            <span className="text-slate-400">Minimum Academic CGPA:</span>
            <span className="font-bold text-sky-400">
              {opportunity.minCgpa > 0
                ? `≥ ${opportunity.minCgpa} / 10.0`
                : "No CGPA Cutoff"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-mono mb-2">
              Eligible Academic Branches:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.eligibleBranches &&
              opportunity.eligibleBranches.length > 0 ? (
                opportunity.eligibleBranches.map((b) => (
                  <span
                    key={b}
                    className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs"
                  >
                    {b}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">
                  Open to all academic branches
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-400 block font-mono mb-2">
              Eligible Graduation Batches:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.eligibleGradYears &&
              opportunity.eligibleGradYears.length > 0 ? (
                opportunity.eligibleGradYears.map((yr) => (
                  <span
                    key={yr}
                    className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-indigo-300 text-xs font-mono"
                  >
                    Class of {yr}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">
                  Open to all graduation batches
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              Are you sure you want to permanently delete "{opportunity.title}"?
              All applicant submissions and scoring logs linked to this
              opportunity will also be removed.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
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
