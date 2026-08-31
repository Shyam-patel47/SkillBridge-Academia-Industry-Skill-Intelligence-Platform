import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const UnauthorizedPage: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    switch (role) {
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

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 mb-6">
          <ShieldX className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          403 — Access Denied
        </h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          You do not have the required permissions to view this portal. Your
          current account role is{" "}
          <span className="font-semibold text-sky-400 uppercase font-mono">
            {role || "GUEST"}
          </span>
          .
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <Link
            to={getDashboardPath()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>My Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
