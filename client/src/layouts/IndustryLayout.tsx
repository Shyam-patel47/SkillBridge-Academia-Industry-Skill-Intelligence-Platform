import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  Building2,
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const IndustryLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/industry/dashboard", icon: LayoutDashboard },
    {
      name: "Post Opportunity",
      path: "/industry/create-opportunity",
      icon: PlusCircle,
    },
    {
      name: "Active Postings",
      path: "/industry/opportunities",
      icon: Briefcase,
    },
    { name: "Applicant Pipeline", path: "/industry/applicants", icon: Users },
    { name: "Company Profile", path: "/industry/profile", icon: Settings },
  ];

  const companyName =
    user?.company?.companyName || user?.email.split("@")[0] || "Company";

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-850 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-bold text-base text-white">SkillBridge</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 border-r border-slate-850 bg-[#080d1a] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <div className="p-6 border-b border-slate-850/80 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <div className="font-bold text-base text-white leading-tight">
                  Skill<span className="text-indigo-400">Bridge</span>
                </div>
                <div className="text-[10px] text-indigo-400 font-mono tracking-wider uppercase font-semibold">
                  Recruiter Portal
                </div>
              </div>
            </Link>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-850/60"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-850/80 bg-slate-950/40">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-md">
              {companyName.slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate flex items-center gap-1">
                <span>{companyName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 inline shrink-0" />
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-850 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-20">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Industry Recruiting Platform
          </span>
          <div className="text-xs font-medium text-slate-300">
            {companyName} • Recruiter Workspace
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
