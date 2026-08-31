import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Briefcase,
  Users,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const IndustryDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const company = user?.company;

  const stats = [
    {
      label: "Active Postings",
      val: "2 Roles",
      sub: "1 Internship, 1 Full-time",
      icon: Briefcase,
      color: "text-indigo-400",
    },
    {
      label: "Total Applicants",
      val: "28 Candidates",
      sub: "Across active openings",
      icon: Users,
      color: "text-sky-400",
    },
    {
      label: "Shortlisted Pool",
      val: "7 High Fit",
      sub: "Avg. 88% Match",
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      label: "Interviews Scheduled",
      val: "4 In Progress",
      sub: "This week",
      icon: TrendingUp,
      color: "text-purple-400",
    },
  ];

  const recentOpportunities = [
    {
      title: "Frontend Developer Intern",
      type: "INTERNSHIP",
      applicants: 18,
      shortlisted: 5,
      location: "Bangalore / Hybrid",
      matchAvg: "84%",
    },
    {
      title: "Junior Backend Engineer",
      type: "FULL_TIME",
      applicants: 10,
      shortlisted: 2,
      location: "Remote",
      matchAvg: "81%",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#101428] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Recruiting Intelligence Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>{company?.companyName || user?.email.split("@")[0]}</span>
            <ShieldCheck className="w-6 h-6 text-sky-400 inline" />
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Welcome to your corporate portal. Access pre-assessed candidates
            with transparent technical proficiency scores, filter by verified
            skills, and streamline your hiring pipeline.
          </p>
        </div>

        <Link
          to="/industry/create-opportunity"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Opportunity</span>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-center space-x-4"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">
                  {stat.label}
                </p>
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  {stat.val}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {stat.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Listings Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Active Opportunity Pipelines
            </h3>
            <p className="text-xs text-slate-400">
              Manage candidate volume and explainable compatibility scores
            </p>
          </div>
          <Link
            to="/industry/opportunities"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-4">
          {recentOpportunities.map((opp, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">
                    {opp.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                    {opp.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{opp.location}</p>
              </div>

              <div className="flex items-center space-x-6 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Applicants
                  </span>
                  <span className="font-bold text-white font-mono">
                    {opp.applicants} candidates
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Shortlisted
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {opp.shortlisted}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Avg. Match
                  </span>
                  <span className="font-bold text-sky-400 font-mono">
                    {opp.matchAvg}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
