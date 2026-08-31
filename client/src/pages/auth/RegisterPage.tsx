import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types/auth";

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { register, isRegistering } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await register({
        email,
        password,
        role,
        fullName: role === "STUDENT" ? fullName : undefined,
        companyName: role === "INDUSTRY" ? companyName : undefined,
        institutionName:
          role === "INSTITUTION_ADMIN" ? institutionName : undefined,
        institutionCode:
          role === "INSTITUTION_ADMIN" ? institutionCode : undefined,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.error?.message ||
        "Registration failed. Please try again.";
      setFormError(message);
    }
  };

  const roleOptions: {
    id: UserRole;
    title: string;
    desc: string;
    icon: any;
  }[] = [
    {
      id: "STUDENT",
      title: "Student",
      desc: "Assess skills & find internships",
      icon: GraduationCap,
    },
    {
      id: "INDUSTRY",
      title: "Industry Recruiter",
      desc: "Post roles & discover top talent",
      icon: Building2,
    },
    {
      id: "INSTITUTION_ADMIN",
      title: "Institution Admin",
      desc: "Analyze student skill trends",
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 max-w-5xl mx-auto flex items-center justify-center -z-10 pointer-events-none">
        <div className="w-[550px] h-[350px] bg-sky-500/10 blur-[130px] rounded-full"></div>
      </div>

      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 text-sky-400 mb-2 shadow-lg shadow-sky-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Create Your Account
          </h1>
          <p className="text-sm text-slate-400">
            Join SkillBridge to connect academic potential with real industry
            requirements.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
          {formError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              1. Choose Your Account Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRole(opt.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? "bg-sky-500/15 border-sky-500 text-white shadow-lg shadow-sky-500/10"
                        : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon
                        className={`w-5 h-5 ${isSelected ? "text-sky-400" : "text-slate-500"}`}
                      />
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white mb-0.5">
                      {opt.title}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="border-t border-slate-850 pt-5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                2. Enter Your Details
              </label>

              {/* Conditional Profile Fields */}
              {role === "STUDENT" && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {role === "INDUSTRY" && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Company Name
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. TechCorp Solutions"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {role === "INSTITUTION_ADMIN" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Institution Name
                    </label>
                    <input
                      type="text"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="e.g. Apex Institute"
                      required
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      College Code
                    </label>
                    <input
                      type="text"
                      value={institutionCode}
                      onChange={(e) => setInstitutionCode(e.target.value)}
                      placeholder="e.g. AIT-2024"
                      required
                      className="w-full px-3.5 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* Email & Password */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 chars, 1 uppercase, 1 number"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-white text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full mt-4 flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>
                    Create{" "}
                    {role === "STUDENT"
                      ? "Student"
                      : role === "INDUSTRY"
                        ? "Recruiter"
                        : "Institution"}{" "}
                    Account
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-sky-400 hover:text-sky-300 font-semibold underline-offset-4 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
