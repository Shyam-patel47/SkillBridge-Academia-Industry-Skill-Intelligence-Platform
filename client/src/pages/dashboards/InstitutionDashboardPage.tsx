import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const InstitutionDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const inst = user?.institution;

  const stats = [
    {
      label: "Enrolled Students",
      val: "420 Students",
      sub: "Class of 2025 & 2026",
      icon: Users,
      color: "text-teal-400",
    },
    {
      label: "Verified Skills Count",
      val: "1,840 Tests",
      sub: "92% participation",
      icon: CheckCircle2,
      color: "text-sky-400",
    },
    {
      label: "Placement Readiness",
      val: "76%",
      sub: "+8% vs last semester",
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Identified Skill Gaps",
      val: "4 Key Areas",
      sub: "Action required",
      icon: AlertCircle,
      color: "text-amber-400",
    },
  ];

  const gapComparison = [
    {
      skill: "JavaScript / Frontend",
      industryDemand: "78%",
      studentSupply: "74%",
      delta: "-4%",
      status: "balanced",
    },
    {
      skill: "SQL & Database Design",
      industryDemand: "69%",
      studentSupply: "48%",
      delta: "-21%",
      status: "gap",
    },
    {
      skill: "Cloud & AWS Services",
      industryDemand: "54%",
      studentSupply: "31%",
      delta: "-23%",
      status: "critical_gap",
    },
    {
      skill: "Docker Containerization",
      industryDemand: "46%",
      studentSupply: "24%",
      delta: "-22%",
      status: "critical_gap",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1a24] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
            <span>Academic Talent Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {inst?.institutionName || user?.email.split("@")[0]}
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Institutional overview of aggregate student competencies versus
            verified hiring demands. Diagnose curriculum gaps and optimize
            student employability.
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          College Code:{" "}
          <span className="text-teal-400 font-bold">
            {inst?.code || "INST"}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Demand vs Supply Gap Matrix */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              Industry Demand vs Student Supply Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Identify curricular gaps where industry hiring demand exceeds
              student talent supply
            </p>
          </div>
          <Link
            to="/institution/demand-matrix"
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <span>Detailed Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Skill Area</th>
                <th className="pb-3 font-semibold">Industry Demand</th>
                <th className="pb-3 font-semibold">
                  Student Capability Supply
                </th>
                <th className="pb-3 font-semibold">Deficit / Surplus</th>
                <th className="pb-3 font-semibold">Action Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {gapComparison.map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-900/40 transition-colors"
                >
                  <td className="py-3.5 font-bold text-white">{row.skill}</td>
                  <td className="py-3.5 text-slate-300 font-mono">
                    {row.industryDemand}
                  </td>
                  <td className="py-3.5 text-slate-300 font-mono">
                    {row.studentSupply}
                  </td>
                  <td className="py-3.5 font-mono font-bold text-amber-400">
                    {row.delta}
                  </td>
                  <td className="py-3.5">
                    {row.status === "balanced" ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                        Sufficient
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-semibold">
                        Curriculum Training Priority
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
