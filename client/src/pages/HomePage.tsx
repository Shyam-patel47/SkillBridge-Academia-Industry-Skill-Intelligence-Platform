import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  BrainCircuit,
  Target,
  TrendingUp,
  Building2,
  GraduationCap,
  Sparkles,
  Zap,
  Code2,
  Activity,
} from "lucide-react";

export const HomePage: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<
    "checking" | "connected" | "offline"
  >("checking");
  const [serverDetails, setServerDetails] = useState<any>(null);

  useEffect(() => {
    fetch("/api/v1/health")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Server not responding");
      })
      .then((data) => {
        if (data.success) {
          setServerStatus("connected");
          setServerDetails(data.data);
        } else {
          setServerStatus("offline");
        }
      })
      .catch(() => {
        setServerStatus("offline");
      });
  }, []);

  const pipelineSteps = [
    {
      step: "01",
      title: "Skill Assessment",
      desc: "Standardized timed evaluations calculating granular 0–100 mastery scores across technical and soft skills.",
      icon: BrainCircuit,
      color: "from-blue-500 to-cyan-400",
    },
    {
      step: "02",
      title: "Skill-Gap Analysis",
      desc: "Deterministic benchmarking against real industry roles with explicit delta and missing competency indicators.",
      icon: Target,
      color: "from-cyan-500 to-teal-400",
    },
    {
      step: "03",
      title: "Career & Learning Roadmaps",
      desc: "Explainable role recommendations paired with prioritized learning tracks to systematically bridge gaps.",
      icon: TrendingUp,
      color: "from-indigo-500 to-blue-400",
    },
    {
      step: "04",
      title: "Opportunity Matching",
      desc: "Weighted multi-factor compatibility engine matching students with verified internships and full-time roles.",
      icon: Building2,
      color: "from-sky-500 to-indigo-500",
    },
  ];

  const stackPillars = [
    { label: "Frontend", val: "React 18 + TypeScript + Tailwind CSS" },
    { label: "Backend", val: "Node.js + Express + TypeScript" },
    { label: "Database", val: "PostgreSQL + Prisma ORM + NeonDB" },
    { label: "State Layer", val: "TanStack Query + Zustand" },
    { label: "Auth Strategy", val: "Custom JWT + Refresh Rotation + RBAC" },
    { label: "AI Layer (V2)", val: "Resume Parsing & Gap Explanations" },
  ];

  return (
    <div className="space-y-24 py-12 sm:py-16">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Glow Effect */}
        <div className="absolute inset-0 -top-40 flex items-center justify-center -z-10 pointer-events-none">
          <div className="w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/20 via-brand-500/15 to-indigo-600/20 blur-[130px] rounded-full"></div>
        </div>

        {/* Foundation Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-300 text-xs font-semibold tracking-wide uppercase mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Foundation Initialized & Architecture Verified</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
          Bridging the Divide Between <br className="hidden sm:inline" />
          <span className="gradient-text">
            Student Skills & Industry Demand
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
          SkillBridge is an intelligent, explainable full-stack platform that
          transforms academic knowledge into verified industry-ready
          competencies, career matches, and targeted opportunity pipelines.
        </p>

        {/* Server & Runtime Status Card */}
        <div className="mt-10 max-w-xl mx-auto glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  Backend Health Check
                </div>
                <div className="text-sm font-semibold text-white">
                  {serverStatus === "checking" && "Connecting to API..."}
                  {serverStatus === "connected" && "API Online & Responding"}
                  {serverStatus === "offline" && "API Standby / Offline"}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  serverStatus === "connected"
                    ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                    : serverStatus === "checking"
                      ? "bg-amber-400 animate-ping"
                      : "bg-rose-500"
                }`}
              ></span>
              <span className="text-xs font-mono text-slate-300">
                {serverStatus === "connected" ? "200 OK" : "DEV MODE"}
              </span>
            </div>
          </div>
          {serverDetails && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Uptime: {serverDetails.uptime}</span>
              <span>Env: {serverDetails.environment}</span>
              <span>Prefix: /api/v1</span>
            </div>
          )}
        </div>
      </section>

      {/* The 4-Pillar Pipeline */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-3">
            Core Operational Lifecycle
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white">
            Deterministic Skill Intelligence Engine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pipelineSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-sky-400" />
                    </div>
                    <span className="font-mono text-2xl font-black text-slate-700">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center text-xs text-sky-400 font-medium">
                  <span>Standardized Architecture</span>
                  <CheckCircle2 className="w-4 h-4 ml-auto text-sky-400/80" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stakeholder Value Matrix */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Student Box */}
          <div className="glass-panel p-8 rounded-3xl border-t-2 border-t-sky-500">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">For Students</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Verify competencies through objective assessments, discover exact
              skill gaps, and unlock explainable opportunity matches.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Standardized 0–100 Skill Profiles</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Explainable Career Fit Scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Public Verified Digital Portfolio</span>
              </li>
            </ul>
          </div>

          {/* Industry Box */}
          <div className="glass-panel p-8 rounded-3xl border-t-2 border-t-indigo-500">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              For Industry Recruiters
            </h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Define required skill matrices and access candidate pools
              pre-ranked by verifiable technical readiness.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Structured Opportunity Skill Definitions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Deterministic Compatibility Scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Streamlined Shortlisting Pipeline</span>
              </li>
            </ul>
          </div>

          {/* Institution Box */}
          <div className="glass-panel p-8 rounded-3xl border-t-2 border-t-teal-500">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-6">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              For Institutions
            </h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Analyze macro student skill distribution versus real industry
              demand to optimize curriculum and placement success.
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Student Supply vs Industry Demand Matrix</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Institutional Skill Gap Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Placement Readiness Analytics</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tech Stack Specs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Code2 className="w-4 h-4" />
                <span>Production-Grade Architecture</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Full-Stack Technology Foundation
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                Node.js + React Monorepo
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                TypeScript Strict
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            {stackPillars.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80"
              >
                <div className="text-xs text-slate-400 font-medium mb-1">
                  {item.label}
                </div>
                <div className="text-sm font-semibold text-slate-100 font-mono">
                  {item.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
