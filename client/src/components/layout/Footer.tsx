import React from "react";
import { Sparkles, Github, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-850 bg-[#060a14] py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-400" />
              </div>
              <span className="font-bold text-lg text-white">SkillBridge</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Academia–Industry Skill Intelligence Platform. Bridging the divide
              between what students learn and what modern industries demand
              through explainable assessment, gap benchmarking, and smart
              matching.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Architecture & Stack
            </h4>
            <ul className="space-y-2 text-sm">
              <li>React 18 + Vite + Tailwind CSS</li>
              <li>Node.js + Express + TypeScript</li>
              <li>PostgreSQL + Prisma ORM + NeonDB</li>
              <li>Zustand + TanStack Query</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Core Modules
            </h4>
            <ul className="space-y-2 text-sm">
              <li>Skill Taxonomy & Timed Quizzes</li>
              <li>Deterministic Gap Engine</li>
              <li>Multi-Factor Job Matching</li>
              <li>Institutional Supply vs Demand</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex items-center space-x-1">
            <span>Built with precision for Portfolio & Resume showcase</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline ml-1" />
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5">
              <Github className="w-4 h-4" />
              <span>Full-Stack Monorepo</span>
            </span>
            <span>© {new Date().getFullYear()} SkillBridge Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
