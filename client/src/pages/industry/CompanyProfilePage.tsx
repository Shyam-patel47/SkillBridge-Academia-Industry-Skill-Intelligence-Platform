import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Globe,
  MapPin,
  Save,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { companyService, CompanyProfile } from "../../services/companyService";

export const CompanyProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    website: "",
    logoUrl: "",
    location: "",
    description: "",
  });

  const { data: company, isLoading } = useQuery<CompanyProfile>({
    queryKey: ["company", "profile"],
    queryFn: () => companyService.getMyProfile(),
  });

  useEffect(() => {
    if (company) {
      setFormData({
        companyName: company.companyName || "",
        industry: company.industry || "",
        website: company.website || "",
        logoUrl: company.logoUrl || "",
        location: company.location || "",
        description: company.description || "",
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CompanyProfile>) =>
      companyService.updateMyProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["company", "profile"], updated);
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
      setSaveSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSaveSuccess(false), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message || "Failed to update company profile.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading company profile...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1b2d] to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Company Branding & Identity</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Company Profile & Preferences
          </h1>
          <p className="text-xs text-slate-400">
            This profile is displayed to candidates and university placement
            coordinators across the platform.
          </p>
        </div>

        {company?.isVerified && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center space-x-1.5 self-start sm:self-center">
            <CheckCircle2 className="w-4 h-4" />
            <span>Verified Industry Partner</span>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Company profile updated successfully! Changes are live across all
            published opportunities.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>Core Information</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Company Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="e.g. Acme Corp, Razorpay, Google"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    placeholder="e.g. FinTech, Cloud Computing, AI"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Headquarters / Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g. Bengaluru, India / San Francisco, CA"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://yourcompany.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, logoUrl: e.target.value })
                    }
                    placeholder="https://yourcompany.com/logo.png"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  About the Company & Work Culture
                </label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe your company's mission, technology stack, engineering culture, and growth opportunities..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Right Col: Candidate Preview */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Candidate View Preview</span>
            </h3>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-850 space-y-4">
              <div className="flex items-center space-x-3">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt={formData.companyName}
                    className="w-12 h-12 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800"
                    onError={(e) => {
                      (e.target as any).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold text-white">
                    {formData.companyName || "Company Name"}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {formData.industry || "Tech & Engineering"}
                  </span>
                </div>
              </div>

              {formData.location && (
                <div className="flex items-center text-xs text-slate-400 space-x-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{formData.location}</span>
                </div>
              )}

              {formData.website && (
                <div className="flex items-center text-xs text-sky-400 space-x-1.5 font-mono">
                  <Globe className="w-3.5 h-3.5 text-sky-500" />
                  <span className="truncate">{formData.website}</span>
                </div>
              )}

              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {formData.description ||
                  "Company description and culture statement."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
