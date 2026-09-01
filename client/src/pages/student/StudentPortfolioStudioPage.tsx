import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Globe,
  Lock,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Layers,
  Award,
  Trophy,
  Loader2,
  Github,
  Code,
  Calendar,
  X,
} from "lucide-react";
import {
  portfolioService,
  DigitalPortfolioDossier,
  PortfolioProject,
  PortfolioCertification,
  PortfolioAchievement,
} from "../../services/portfolioService";

export const StudentPortfolioStudioPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "PROJECTS" | "CERTS" | "ACHIEVEMENTS" | "SKILLS"
  >("OVERVIEW");
  const [copied, setCopied] = useState(false);

  // Settings State
  const [customSlugInput, setCustomSlugInput] = useState("");
  const [aboutMeInput, setAboutMeInput] = useState("");
  const [isPublicState, setIsPublicState] = useState(true);

  // Modals State
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(
    null,
  );
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    liveUrl: "",
    githubUrl: "",
    skillsUsed: "",
    isFeatured: false,
  });

  const [certModalOpen, setCertModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<PortfolioCertification | null>(
    null,
  );
  const [certForm, setCertForm] = useState({
    title: "",
    issuer: "",
    issueDate: "",
    credentialUrl: "",
    credentialId: "",
  });

  const [achModalOpen, setAchModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<PortfolioAchievement | null>(
    null,
  );
  const [achForm, setAchForm] = useState({
    title: "",
    description: "",
    issuer: "",
    issueDate: "",
    certificateUrl: "",
  });

  const { data: portfolio, isLoading } = useQuery<DigitalPortfolioDossier>({
    queryKey: ["student", "portfolio", "studio"],
    queryFn: async () => {
      const data = await portfolioService.getMyPortfolio();
      setCustomSlugInput(data.portfolioSettings.customSlug || "");
      setAboutMeInput(data.portfolioSettings.aboutMe || data.profile.bio || "");
      setIsPublicState(data.portfolioSettings.isPublic);
      return data;
    },
  });

  // Settings Mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (payload: {
      isPublic?: boolean;
      customSlug?: string;
      aboutMe?: string;
    }) => portfolioService.updateSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "portfolio", "studio"],
      });
    },
  });

  // Projects Mutations
  const saveProjectMutation = useMutation({
    mutationFn: (payload: any) => {
      const formatted = {
        ...payload,
        skillsUsed: payload.skillsUsed
          ? payload.skillsUsed
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
      };
      if (editingProject) {
        return portfolioService.updateProject(editingProject.id, formatted);
      }
      return portfolioService.addProject(formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "portfolio", "studio"],
      });
      setProjectModalOpen(false);
      setEditingProject(null);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => portfolioService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "portfolio", "studio"],
      });
    },
  });

  // Certifications Mutations
  const saveCertMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingCert) {
        return portfolioService.updateCertification(editingCert.id, payload);
      }
      return portfolioService.addCertification(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "portfolio", "studio"],
      });
      setCertModalOpen(false);
      setEditingCert(null);
    },
  });

  const deleteCertMutation = useMutation({
    mutationFn: (id: string) => portfolioService.deleteCertification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "portfolio", "studio"],
      });
    },
  });

  // Achievements Mutations
  const saveAchMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingAch) {
        return portfolioService.updateAchievement(editingAch.id, payload);
      }
      return portfolioService.addAchievement(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "portfolio", "studio"],
      });
      setAchModalOpen(false);
      setEditingAch(null);
    },
  });

  const deleteAchMutation = useMutation({
    mutationFn: (id: string) => portfolioService.deleteAchievement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student", "portfolio", "studio"],
      });
    },
  });

  const handleCopyLink = () => {
    if (!portfolio) return;
    const url = `${window.location.origin}/portfolio/${portfolio.portfolioSettings.customSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVisibility = () => {
    const nextVal = !isPublicState;
    setIsPublicState(nextVal);
    updateSettingsMutation.mutate({ isPublic: nextVal });
  };

  if (isLoading || !portfolio) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading your digital portfolio studio...
        </p>
      </div>
    );
  }

  const {
    profile,
    portfolioSettings,
    projects,
    certifications,
    achievements,
    skills,
  } = portfolio;
  const publicUrl = `/portfolio/${portfolioSettings.customSlug}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Hero Studio Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2f] to-slate-900 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Digital Portfolio & Shareable Profile Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {profile.fullName}'s Portfolio Studio
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Manage your public-facing student dossier: live projects, verified
            skill proof, certifications, and hackathon achievements with an
            instant vanity URL.
          </p>
        </div>

        {/* Live URL & Visibility Controls */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 space-y-3 shrink-0 w-full lg:w-96">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              {isPublicState ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">
                    Public Portfolio
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-bold">
                    Private Portfolio
                  </span>
                </>
              )}
            </span>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleVisibility}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isPublicState ? "bg-emerald-500" : "bg-slate-800"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  isPublicState ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 truncate">
              {window.location.origin}
              {publicUrl}
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy Public Link"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 transition-all shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              title="Open Public View"
              className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-all shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="text-[10px] font-mono text-slate-500 text-right">
            Total Views:{" "}
            <span className="text-white font-bold">
              {portfolioSettings.viewsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: "OVERVIEW", label: "Overview & Settings", icon: Globe },
          {
            id: "PROJECTS",
            label: `Projects (${projects.length})`,
            icon: Code,
          },
          {
            id: "CERTS",
            label: `Certifications (${certifications.length})`,
            icon: Award,
          },
          {
            id: "ACHIEVEMENTS",
            label: `Achievements (${achievements.length})`,
            icon: Trophy,
          },
          {
            id: "SKILLS",
            label: `Verified Skills (${skills.length})`,
            icon: Layers,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview & Vanity URL Settings */}
      {activeTab === "OVERVIEW" && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>Public Vanity URL & Portfolio Bio</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  Custom URL Slug
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-500">
                    /portfolio/
                  </span>
                  <input
                    type="text"
                    value={customSlugInput}
                    onChange={(e) =>
                      setCustomSlugInput(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    placeholder="your-username"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">
                  Alphanumeric characters and hyphens only (e.g.{" "}
                  {profile.fullName.toLowerCase().replace(/\s+/g, "-")})
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 block">
                  Public Portfolio Bio / About Me
                </label>
                <textarea
                  rows={6}
                  value={aboutMeInput}
                  onChange={(e) => setAboutMeInput(e.target.value)}
                  placeholder="Introduce yourself, your technical passions, projects, and career trajectory..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="button"
                disabled={updateSettingsMutation.isPending}
                onClick={() =>
                  updateSettingsMutation.mutate({
                    customSlug: customSlugInput.trim() || undefined,
                    aboutMe: aboutMeInput.trim() || undefined,
                  })
                }
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {updateSettingsMutation.isPending
                  ? "Saving..."
                  : "Save Settings"}
              </button>
            </div>

            {/* Profile Snapshot Card */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-4">
              <span className="text-xs font-mono text-slate-400 uppercase font-bold block">
                Live Profile Dossier (From Student Profile)
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Full Name
                  </span>
                  <span className="text-white font-bold text-sm">
                    {profile.fullName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Academic Institution
                  </span>
                  <span className="text-slate-300">
                    {profile.college || "Unspecified"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      Branch
                    </span>
                    <span className="text-slate-300">
                      {profile.branch || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">
                      CGPA & Batch
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {profile.cgpa ? `${profile.cgpa} CGPA` : "N/A"} • Class of{" "}
                      {profile.gradYear || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Projects Studio (CRUD) */}
      {activeTab === "PROJECTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Featured & Live Projects
              </h2>
              <p className="text-xs text-slate-400">
                Add software projects, repositories, and live applications.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setProjectForm({
                  title: "",
                  description: "",
                  liveUrl: "",
                  githubUrl: "",
                  skillsUsed: "",
                  isFeatured: false,
                });
                setProjectModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white">
                          {proj.title}
                        </h3>
                        {proj.isFeatured && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(proj);
                          setProjectForm({
                            title: proj.title,
                            description: proj.description,
                            liveUrl: proj.liveUrl || "",
                            githubUrl: proj.githubUrl || "",
                            skillsUsed: proj.skillsUsed.join(", "),
                            isFeatured: proj.isFeatured,
                          });
                          setProjectModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProjectMutation.mutate(proj.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {proj.skillsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.skillsUsed.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-sky-400"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex items-center space-x-3 pt-2 text-xs font-mono">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-slate-300 hover:text-white"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                      </a>
                    )}
                    {proj.liveUrl && (
                      <a
                        href={proj.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Live Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Code className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No projects added yet
              </h3>
              <p className="text-xs text-slate-400">
                Showcase your engineering accomplishments and applications.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Certifications Studio (CRUD) */}
      {activeTab === "CERTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Professional Certifications
              </h2>
              <p className="text-xs text-slate-400">
                Industry certificates, cloud credentials, and accredited
                courses.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCert(null);
                setCertForm({
                  title: "",
                  issuer: "",
                  issueDate: "",
                  credentialUrl: "",
                  credentialId: "",
                });
                setCertModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Certification</span>
            </button>
          </div>

          {certifications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">
                        {cert.title}
                      </h3>
                      <p className="text-xs font-mono text-sky-400 font-semibold">
                        {cert.issuer}
                      </p>
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Issued {new Date(cert.issueDate).toLocaleDateString()}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCert(cert);
                          setCertForm({
                            title: cert.title,
                            issuer: cert.issuer,
                            issueDate: cert.issueDate.split("T")[0],
                            credentialUrl: cert.credentialUrl || "",
                            credentialId: cert.credentialId || "",
                          });
                          setCertModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCertMutation.mutate(cert.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {cert.credentialUrl && (
                    <div className="pt-1">
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-mono text-sky-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>
                          Verify Credential{" "}
                          {cert.credentialId ? `(${cert.credentialId})` : ""}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Award className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No certifications added
              </h3>
              <p className="text-xs text-slate-400">
                Add AWS, Google Cloud, Meta, or other accredited certificates.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Achievements Studio (CRUD) */}
      {activeTab === "ACHIEVEMENTS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Honors & Hackathon Achievements
              </h2>
              <p className="text-xs text-slate-400">
                Hackathon victories, competitive programming rankings, and
                academic awards.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingAch(null);
                setAchForm({
                  title: "",
                  description: "",
                  issuer: "",
                  issueDate: "",
                  certificateUrl: "",
                });
                setAchModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Achievement</span>
            </button>
          </div>

          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className="glass-panel p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{ach.title}</span>
                      </h3>
                      {ach.issuer && (
                        <p className="text-xs font-mono text-slate-300">
                          {ach.issuer}
                        </p>
                      )}
                      {ach.description && (
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {ach.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAch(ach);
                          setAchForm({
                            title: ach.title,
                            description: ach.description || "",
                            issuer: ach.issuer || "",
                            issueDate: ach.issueDate
                              ? ach.issueDate.split("T")[0]
                              : "",
                            certificateUrl: ach.certificateUrl || "",
                          });
                          setAchModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteAchMutation.mutate(ach.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {ach.certificateUrl && (
                    <div className="pt-1">
                      <a
                        href={ach.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-mono text-sky-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View Certificate / Proof</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">
                No achievements added yet
              </h3>
              <p className="text-xs text-slate-400">
                Add SIH hackathon placements, coding rank milestones, and
                awards.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Verified Skills Matrix */}
      {activeTab === "SKILLS" && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Verified Assessment Competencies ({skills.length})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Skills validated through SkillBridge benchmark assessments are
                automatically displayed on your public portfolio.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {skills.map((s) => (
              <div
                key={s.skillId}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-2 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px]">
                    {s.category}
                  </span>
                  {s.isVerified && (
                    <span className="text-emerald-400 font-bold text-[10px]">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{s.skillName}</h4>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {s.score}%
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {s.proficiency || "PROFICIENT"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Project Modal */}
      {projectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 bg-slate-900 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setProjectModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">
              {editingProject ? "Edit Project" : "Add New Project"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProjectMutation.mutate(projectForm);
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div className="space-y-1">
                <label className="text-slate-300 block">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, title: e.target.value })
                  }
                  placeholder="e.g. CloudScale DevOps Platform"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe technical architecture, challenges solved, and key metrics..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 block">Live Demo URL</label>
                  <input
                    type="url"
                    value={projectForm.liveUrl}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        liveUrl: e.target.value,
                      })
                    }
                    placeholder="https://myproject.dev"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 block">
                    GitHub Repository URL
                  </label>
                  <input
                    type="url"
                    value={projectForm.githubUrl}
                    onChange={(e) =>
                      setProjectForm({
                        ...projectForm,
                        githubUrl: e.target.value,
                      })
                    }
                    placeholder="https://github.com/user/repo"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block">
                  Technologies / Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={projectForm.skillsUsed}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      skillsUsed: e.target.value,
                    })
                  }
                  placeholder="React, TypeScript, Docker, PostgreSQL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={projectForm.isFeatured}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      isFeatured: e.target.checked,
                    })
                  }
                  className="rounded bg-slate-950 border-slate-800 text-sky-500"
                />
                <label
                  htmlFor="featuredCheck"
                  className="text-slate-300 cursor-pointer"
                >
                  Feature this project at the top of my portfolio
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveProjectMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all disabled:opacity-50"
                >
                  {saveProjectMutation.isPending ? "Saving..." : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Certification Modal */}
      {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 bg-slate-900 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setCertModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">
              {editingCert ? "Edit Certification" : "Add Certification"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveCertMutation.mutate(certForm);
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div className="space-y-1">
                <label className="text-slate-300 block">
                  Certificate Title *
                </label>
                <input
                  type="text"
                  required
                  value={certForm.title}
                  onChange={(e) =>
                    setCertForm({ ...certForm, title: e.target.value })
                  }
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 block">
                    Issuing Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={certForm.issuer}
                    onChange={(e) =>
                      setCertForm({ ...certForm, issuer: e.target.value })
                    }
                    placeholder="e.g. Amazon Web Services"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 block">Issue Date *</label>
                  <input
                    type="date"
                    required
                    value={certForm.issueDate}
                    onChange={(e) =>
                      setCertForm({ ...certForm, issueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 block">Credential ID</label>
                  <input
                    type="text"
                    value={certForm.credentialId}
                    onChange={(e) =>
                      setCertForm({ ...certForm, credentialId: e.target.value })
                    }
                    placeholder="e.g. AWS-123456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 block">
                    Verification URL
                  </label>
                  <input
                    type="url"
                    value={certForm.credentialUrl}
                    onChange={(e) =>
                      setCertForm({
                        ...certForm,
                        credentialUrl: e.target.value,
                      })
                    }
                    placeholder="https://aws.amazon.com/verify/..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveCertMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all disabled:opacity-50"
                >
                  {saveCertMutation.isPending
                    ? "Saving..."
                    : "Save Certification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Achievement Modal */}
      {achModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-slate-800 bg-slate-900 max-w-lg w-full space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setAchModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">
              {editingAch ? "Edit Achievement" : "Add Achievement"}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveAchMutation.mutate(achForm);
              }}
              className="space-y-4 text-xs font-mono"
            >
              <div className="space-y-1">
                <label className="text-slate-300 block">
                  Achievement Title *
                </label>
                <input
                  type="text"
                  required
                  value={achForm.title}
                  onChange={(e) =>
                    setAchForm({ ...achForm, title: e.target.value })
                  }
                  placeholder="e.g. Smart India Hackathon Winner 2025"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 block">
                    Organizing Body / Event
                  </label>
                  <input
                    type="text"
                    value={achForm.issuer}
                    onChange={(e) =>
                      setAchForm({ ...achForm, issuer: e.target.value })
                    }
                    placeholder="e.g. Ministry of Education"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 block">Date</label>
                  <input
                    type="date"
                    value={achForm.issueDate}
                    onChange={(e) =>
                      setAchForm({ ...achForm, issueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block">
                  Description / Impact
                </label>
                <textarea
                  rows={3}
                  value={achForm.description}
                  onChange={(e) =>
                    setAchForm({ ...achForm, description: e.target.value })
                  }
                  placeholder="Secured 1st place out of 500+ participating teams..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-sans focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 block">
                  Certificate / Proof Link
                </label>
                <input
                  type="url"
                  value={achForm.certificateUrl}
                  onChange={(e) =>
                    setAchForm({ ...achForm, certificateUrl: e.target.value })
                  }
                  placeholder="https://certificate-proof.com/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveAchMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold transition-all disabled:opacity-50"
                >
                  {saveAchMutation.isPending ? "Saving..." : "Save Achievement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
