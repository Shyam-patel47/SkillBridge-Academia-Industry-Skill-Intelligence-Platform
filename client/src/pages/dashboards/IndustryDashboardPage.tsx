import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Plus,
  ArrowRight,
  Building2,
  MapPin,
  Eye,
  Edit3,
  Loader2,
  Award,
  Globe,
} from "lucide-react";
import {
  companyService,
  CompanyDashboardData,
} from "../../services/companyService";
import { opportunityService } from "../../services/opportunityService";

export const IndustryDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<CompanyDashboardData>({
    queryKey: ["company", "dashboard"],
    queryFn: () => companyService.getDashboardMetrics(),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      opportunityService.togglePublish(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading industry intelligence cockpit...
        </p>
      </div>
    );
  }

  const company = data?.company;
  const metrics = data?.metrics;
  const recentOpportunities = data?.recentOpportunities || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1c30] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>{company?.companyName || "Enterprise Recruiter Hub"}</span>
            {company?.isVerified && (
              <span className="inline-flex items-center text-[10px] text-emerald-400 font-bold ml-1">
                <CheckCircle2 className="w-3 h-3 mr-0.5" /> Verified
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Talent Discovery & Opportunity Management
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Post verified skill-mapped opportunities, set objective proficiency
            benchmarks, and connect with job-ready student candidates.
          </p>
        </div>

        <div className="flex items-center space-x-3 z-10 shrink-0">
          <Link
            to="/industry/opportunities/create"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Opportunity</span>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
              Active Postings
            </span>
            <span className="text-2xl font-extrabold text-white font-mono">
              {metrics?.activeOpportunitiesCount ?? 0}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
              Applications
            </span>
            <span className="text-2xl font-extrabold text-white font-mono">
              {metrics?.totalApplicationsCount ?? 0}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
              Shortlisted
            </span>
            <span className="text-2xl font-extrabold text-white font-mono">
              {metrics?.shortlistedCount ?? 0}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 block uppercase tracking-wider">
              Total Postings
            </span>
            <span className="text-2xl font-extrabold text-white font-mono">
              {metrics?.totalOpportunitiesCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/industry/opportunities/create"
          className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                Create Opportunity
              </h3>
              <p className="text-xs text-slate-400">
                Post new internship or job vacancy
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/industry/opportunities"
          className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Manage Postings
              </h3>
              <p className="text-xs text-slate-400">
                Edit, publish, and track postings
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          to="/industry/profile"
          className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                Company Profile
              </h3>
              <p className="text-xs text-slate-400">
                Update branding & contact details
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Recent Opportunities Section */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Recent Opportunities
            </h2>
            <p className="text-xs text-slate-400">
              Track application status and vacancy lifecycle
            </p>
          </div>

          <Link
            to="/industry/opportunities"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center space-x-1"
          >
            <span>View All ({metrics?.totalOpportunitiesCount || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOpportunities.length > 0 ? (
          <div className="divide-y divide-slate-850">
            {recentOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        opp.isActive
                          ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                          : "bg-slate-800 border border-slate-700 text-slate-400"
                      }`}
                    >
                      {opp.isActive ? "PUBLISHED" : "DRAFT"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                      {opp.type === "FULL_TIME" ? "ENTRY LEVEL JOB" : opp.type}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {opp.workMode}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white hover:text-sky-300 transition-colors">
                    <Link to={`/industry/opportunities/${opp.id}`}>
                      {opp.title}
                    </Link>
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
                    {opp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {opp.location}
                      </span>
                    )}
                    {opp.stipendSalary && <span>💰 {opp.stipendSalary}</span>}
                    <span>⚡ {opp.skillsCount} Required Skills</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {/* Applicants Badge */}
                  <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                    <span className="block text-sm font-extrabold font-mono text-white">
                      {opp.applicationsCount}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      Applicants
                    </span>
                  </div>

                  {/* Toggle Active Button */}
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
                    title="Edit Opportunity"
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No opportunities posted yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Create your first skill-targeted vacancy to start discovering
              matching student candidates.
            </p>
            <div className="pt-2">
              <Link
                to="/industry/opportunities/create"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-md shadow-sky-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Opportunity</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
