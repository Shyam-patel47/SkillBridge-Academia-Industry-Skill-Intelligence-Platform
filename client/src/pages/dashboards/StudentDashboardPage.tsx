import React from "react";
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  Compass,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Award,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const student = user?.student;

  const stats = [
    {
      label: "Assessed Skills",
      val: "6 Skills",
      change: "+2 this month",
      icon: BrainCircuit,
      color: "text-sky-400",
    },
    {
      label: "Skill Mastery Average",
      val: "72 / 100",
      change: "Advanced Tier",
      icon: Award,
      color: "text-emerald-400",
    },
    {
      label: "Career Alignment",
      val: "89% Fit",
      change: "Full Stack Dev",
      icon: Compass,
      color: "text-indigo-400",
    },
    {
      label: "Active Applications",
      val: "3 Applied",
      change: "1 Shortlisted",
      icon: Briefcase,
      color: "text-teal-400",
    },
  ];

  const skillHighlights = [
    { skill: "JavaScript", score: 86, level: "Advanced", status: "verified" },
    { skill: "React", score: 78, level: "Advanced", status: "verified" },
    { skill: "Node.js", score: 74, level: "Advanced", status: "verified" },
    {
      skill: "PostgreSQL",
      score: 62,
      level: "Intermediate",
      status: "verified",
    },
    { skill: "Git & GitHub", score: 55, level: "Intermediate", status: "gap" },
    { skill: "Docker", score: 30, level: "Beginner", status: "gap" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0c1527] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Student Intelligence Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, {student?.fullName || user?.email.split("@")[0]}!
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Your competency profile is active. Take timed assessments to verify
            your skills, diagnose career gaps, and unlock explainable
            opportunity recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 shrink-0">
          <Link
            to="/student/assessments"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02]"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Take Skill Quiz</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
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
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Skills Breakdown & Career Matching Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Skill Scores */}
        <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Verified Competency Profile
              </h3>
              <p className="text-xs text-slate-400">
                Scores calculated through objective timed assessments
              </p>
            </div>
            <Link
              to="/student/skills"
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              <span>View Full Gaps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {skillHighlights.map((s, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-850 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {s.status === "verified" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="text-sm font-bold text-white">
                      {s.skill}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {s.score}/100
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      s.score >= 70
                        ? "bg-gradient-to-r from-sky-500 to-emerald-400"
                        : s.score >= 40
                          ? "bg-gradient-to-r from-sky-500 to-amber-400"
                          : "bg-gradient-to-r from-amber-500 to-rose-500"
                    }`}
                    style={{ width: `${s.score}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{s.level}</span>
                  <span
                    className={
                      s.status === "verified"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }
                  >
                    {s.status === "verified"
                      ? "Verified Strength"
                      : "Development Area"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Career Recommendation Preview */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Top Role Match
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                89% Fit
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">
              Full Stack Developer
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Strong alignment across JavaScript, React, and Node.js
              fundamentals. Closing your Docker and Git gaps will elevate your
              readiness score to 95%+.
            </p>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-850">
                <span>React Mastery</span>
                <span className="text-emerald-400 font-bold">78 ✓</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-850">
                <span>Node.js Backend</span>
                <span className="text-emerald-400 font-bold">74 ✓</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-850">
                <span>Docker Containerization</span>
                <span className="text-amber-400 font-bold">
                  30 ⚠ (20pt gap)
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/student/careers"
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-white text-xs font-semibold transition-all"
          >
            <span>Explore Career Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
