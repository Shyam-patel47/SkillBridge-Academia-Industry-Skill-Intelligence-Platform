import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { login, isLoggingIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Please provide both email and password.");
      return;
    }

    try {
      await login({ email, password });
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        "Login failed. Please check your credentials.";
      setFormError(message);
    }
  };

  const handleQuickFill = (demoEmail: string, _demoRole: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setFormError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      {/* Background Glow */}
      <div className="absolute inset-0 max-w-5xl mx-auto flex items-center justify-center -z-10 pointer-events-none">
        <div className="w-[500px] h-[300px] bg-sky-500/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 text-sky-400 mb-2 shadow-lg shadow-sky-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-400">
            Sign in to your SkillBridge account to access your intelligence
            dashboard.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {formError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for Testing */}
          <div className="mt-8 pt-6 border-t border-slate-850">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Quick Fill Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  handleQuickFill("alex.student@skillbridge.dev", "STUDENT")
                }
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill("recruiter@techcorp.io", "INDUSTRY")
                }
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                🏢 Recruiter
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill(
                    "admin@apexuniversity.edu",
                    "INSTITUTION_ADMIN",
                  )
                }
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-teal-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                🏛️ Institution
              </button>
              <button
                type="button"
                onClick={() =>
                  handleQuickFill("superadmin@skillbridge.dev", "SUPER_ADMIN")
                }
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white transition-all text-left"
              >
                ⚡ Super Admin
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-slate-400">
          Don&apos;t have an account yet?{" "}
          <Link
            to="/register"
            className="text-sky-400 hover:text-sky-300 font-semibold underline-offset-4 hover:underline"
          >
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
};
