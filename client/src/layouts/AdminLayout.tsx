import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import {
  ShieldAlert,
  LayoutDashboard,
  Layers,
  Building2,
  GraduationCap,
  FileCheck,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      name: "System Overview",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    { name: "Skill Taxonomy", path: "/admin/skills", icon: Layers },
    {
      name: "Company Verifications",
      path: "/admin/companies",
      icon: Building2,
    },
    {
      name: "Institution Verifications",
      path: "/admin/institutions",
      icon: GraduationCap,
    },
    {
      name: "Opportunity Moderation",
      path: "/admin/opportunities",
      icon: FileCheck,
    },
    { name: "Platform Audit Logs", path: "/admin/audit-logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col md:flex-row">
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-850 bg-slate-950/90 sticky top-0 z-40">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-bold text-base text-white">SkillBridge</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-400 hover:text-white"
        >
          {sidebarOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      <aside
        className={`fixed md:sticky top-0 left-0 z-30 h-screen w-64 border-r border-slate-850 bg-[#080d1a] flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <div className="p-6 border-b border-slate-850/80 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-400 p-[1px] shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="font-bold text-base text-white leading-tight">
                  Skill<span className="text-amber-400">Bridge</span>
                </div>
                <div className="text-[10px] text-amber-400 font-mono tracking-wider uppercase font-semibold">
                  Super Admin
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
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-850/60"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`}
                        />
                        <span>{item.name}</span>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-md">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                Super Administrator
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-850 bg-[#080d1a]/80 backdrop-blur-md sticky top-0 z-20">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Platform Master Console
          </span>
          <div className="text-xs font-medium text-amber-400 font-mono">
            Privileged Root Access
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
