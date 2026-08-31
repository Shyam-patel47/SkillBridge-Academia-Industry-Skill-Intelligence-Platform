import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles,
  Layers,
  Compass,
  Briefcase,
  GraduationCap,
  Menu,
  X,
  ArrowRight,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { name: "Overview", href: "/", icon: Sparkles },
    { name: "Skill Engine", href: "/#features", icon: Layers },
    { name: "Career Mapping", href: "/#careers", icon: Compass },
    { name: "Opportunities", href: "/#opportunities", icon: Briefcase },
    { name: "Institutions", href: "/#institutions", icon: GraduationCap },
  ];

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "STUDENT":
        return "/student/dashboard";
      case "INDUSTRY":
        return "/industry/dashboard";
      case "INSTITUTION_ADMIN":
        return "/institution/dashboard";
      case "SUPER_ADMIN":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  const displayName =
    user?.student?.fullName ||
    user?.company?.companyName ||
    user?.institution?.institutionName ||
    user?.email.split("@")[0] ||
    "User";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#080d1a]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 p-[1px] shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
                Skill<span className="text-sky-400">Bridge</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Skill Intelligence Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-sky-400 bg-sky-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{link.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={getDashboardLink()}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-sm font-semibold hover:bg-sky-500/25 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  <span>{displayName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-400 font-mono uppercase">
                    {user?.role.replace("_", " ")}
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-850 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800/80"
            >
              <link.icon className="w-5 h-5 text-sky-400" />
              <span>{link.name}</span>
            </a>
          ))}
          <div className="pt-4 border-t border-slate-850 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Go to {user?.role} Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-sky-500 text-sm font-semibold text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
