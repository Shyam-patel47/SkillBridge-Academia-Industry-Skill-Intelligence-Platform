import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ArrowLeft,
  Save,
  Sliders,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { SkillSelector } from "../../components/common/SkillSelector";
import { skillService, SkillCategoryItem } from "../../services/skillService";
import {
  opportunityService,
  OpportunityItem,
  CreateOpportunityPayload,
} from "../../services/opportunityService";

const AVAILABLE_BRANCHES = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Data Science & AI",
];

const AVAILABLE_GRAD_YEARS = [2024, 2025, 2026, 2027, 2028];

export const EditOpportunityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"INTERNSHIP" | "FULL_TIME" | "PART_TIME">(
    "INTERNSHIP",
  );
  const [description, setDescription] = useState("");
  const [workMode, setWorkMode] = useState<
    "REMOTE" | "HYBRID" | "ON_SITE" | "ANY"
  >("HYBRID");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("6 Months");
  const [stipendSalary, setStipendSalary] = useState("");
  const [deadline, setDeadline] = useState("");
  const [minCgpa, setMinCgpa] = useState<number>(7.0);
  const [eligibleBranches, setEligibleBranches] = useState<string[]>([]);
  const [eligibleGradYears, setEligibleGradYears] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Skill Benchmarks Matrix State
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillConfigs, setSkillConfigs] = useState<
    Record<string, { minScore: number; isMandatory: boolean; weight: number }>
  >({});

  // Fetch Opportunity Data
  const { data: opportunity, isLoading: isOppLoading } =
    useQuery<OpportunityItem>({
      queryKey: ["opportunity", id],
      queryFn: () => opportunityService.getOpportunityById(id!),
      enabled: Boolean(id),
    });

  // Fetch Taxonomy to resolve skill names
  const { data: taxonomy } = useQuery<SkillCategoryItem[]>({
    queryKey: ["skills", "taxonomy"],
    queryFn: skillService.getTaxonomy,
  });

  const allSkills = React.useMemo(() => {
    if (!taxonomy) return [];
    return taxonomy.flatMap((c) => c.skills);
  }, [taxonomy]);

  useEffect(() => {
    if (opportunity) {
      setTitle(opportunity.title || "");
      setType(opportunity.type || "INTERNSHIP");
      setDescription(opportunity.description || "");
      setWorkMode(opportunity.workMode || "HYBRID");
      setLocation(opportunity.location || "");
      setDuration(opportunity.duration || "");
      setStipendSalary(opportunity.stipendSalary || "");
      setIsActive(opportunity.isActive);
      setMinCgpa(opportunity.minCgpa ?? 0);
      setEligibleBranches(opportunity.eligibleBranches || []);
      setEligibleGradYears(opportunity.eligibleGradYears || []);

      if (opportunity.deadline) {
        setDeadline(new Date(opportunity.deadline).toISOString().split("T")[0]);
      }

      if (opportunity.requiredSkills && opportunity.requiredSkills.length > 0) {
        const ids = opportunity.requiredSkills.map((s) => s.skillId);
        const configs: Record<string, any> = {};
        opportunity.requiredSkills.forEach((s) => {
          configs[s.skillId] = {
            minScore: s.minScore || 65,
            isMandatory: s.isMandatory !== undefined ? s.isMandatory : true,
            weight: s.weight || 1.0,
          };
        });
        setSelectedSkillIds(ids);
        setSkillConfigs(configs);
      }
    }
  }, [opportunity]);

  const handleSkillsChange = (newIds: string[]) => {
    setSelectedSkillIds(newIds);
    setSkillConfigs((prev) => {
      const next = { ...prev };
      newIds.forEach((sid) => {
        if (!next[sid]) {
          next[sid] = { minScore: 65, isMandatory: true, weight: 1.0 };
        }
      });
      return next;
    });
  };

  const updateSkillBenchmark = (
    skillId: string,
    key: "minScore" | "isMandatory" | "weight",
    value: any,
  ) => {
    setSkillConfigs((prev) => ({
      ...prev,
      [skillId]: {
        ...prev[skillId],
        [key]: value,
      },
    }));
  };

  const toggleBranch = (branch: string) => {
    setEligibleBranches((prev) =>
      prev.includes(branch)
        ? prev.filter((b) => b !== branch)
        : [...prev, branch],
    );
  };

  const toggleGradYear = (yr: number) => {
    setEligibleGradYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr],
    );
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateOpportunityPayload>) =>
      opportunityService.updateOpportunity(id!, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["opportunity", id], updated);
      queryClient.invalidateQueries({ queryKey: ["company", "opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
      navigate(`/industry/opportunities/${updated.id}`);
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to update opportunity. Please check all fields.",
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Opportunity title is required.");
      return;
    }

    if (description.trim().length < 20) {
      setErrorMessage("Description must be at least 20 characters long.");
      return;
    }

    if (selectedSkillIds.length === 0) {
      setErrorMessage("You must select at least one required skill benchmark.");
      return;
    }

    const formattedSkills = selectedSkillIds.map((skillId) => {
      const cfg = skillConfigs[skillId] || {
        minScore: 60,
        isMandatory: true,
        weight: 1.0,
      };
      return {
        skillId,
        minScore: Number(cfg.minScore),
        isMandatory: cfg.isMandatory,
        weight: Number(cfg.weight),
      };
    });

    const payload: Partial<CreateOpportunityPayload> = {
      title,
      type,
      description,
      workMode,
      location: location || null,
      duration: duration || null,
      stipendSalary: stipendSalary || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      minCgpa: Number(minCgpa),
      eligibleBranches,
      eligibleGradYears,
      isActive,
      requiredSkills: formattedSkills,
    };

    updateMutation.mutate(payload);
  };

  if (isOppLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading opportunity details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to={`/industry/opportunities/${id}`}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunity Details</span>
        </Link>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2f] to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
            <span>Opportunity Editor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Edit Opportunity Posting
          </h1>
          <p className="text-xs text-slate-400">
            Update role parameters, adjust skill benchmark proficiencies, or
            toggle publication state.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Essentials */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-sky-400" />
              <span>1. Role Essentials</span>
            </h2>

            <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer">
              <span>Publication Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {isActive ? "Active" : "Draft"}
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Opportunity Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Opportunity Type <span className="text-rose-400">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-semibold"
              >
                <option value="INTERNSHIP">Internship</option>
                <option value="FULL_TIME">Entry Level Job (Full-Time)</option>
                <option value="PART_TIME">Part-Time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Work Mode <span className="text-rose-400">*</span>
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 font-semibold"
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ON_SITE">On-Site</option>
                <option value="ANY">Any / Flexible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Stipend / Salary Package
              </label>
              <input
                type="text"
                value={stipendSalary}
                onChange={(e) => setStipendSalary(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Application Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Role Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Eligibility */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-sky-400" />
            <span>2. Academic & Eligibility Criteria</span>
          </h2>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-slate-300">
                  Minimum CGPA Benchmark:{" "}
                  <span className="text-sky-400 font-bold">
                    {minCgpa.toFixed(1)} / 10.0
                  </span>
                </label>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={minCgpa}
                onChange={(e) => setMinCgpa(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">
                Eligible Academic Branches:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_BRANCHES.map((branch) => {
                  const isSelected = eligibleBranches.includes(branch);
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => toggleBranch(branch)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-sky-500/20 border border-sky-500 text-sky-300 font-bold"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-2">
                Eligible Graduation Batches:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_GRAD_YEARS.map((yr) => {
                  const isSelected = eligibleGradYears.includes(yr);
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => toggleGradYear(yr)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
                        isSelected
                          ? "bg-indigo-500/20 border border-indigo-500 text-indigo-300 font-bold"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Class of {yr}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Skill Benchmarks Matrix */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>3. Required Skill Competencies & Benchmarks</span>
          </h2>

          <SkillSelector
            selectedSkillIds={selectedSkillIds}
            onChange={handleSkillsChange}
            label="Search and select required competencies"
          />

          {selectedSkillIds.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                Calibrate Skill Benchmark Matrix
              </h3>

              <div className="space-y-3">
                {selectedSkillIds.map((skillId) => {
                  const skill = allSkills.find((s) => s.id === skillId);
                  const cfg = skillConfigs[skillId] || {
                    minScore: 65,
                    isMandatory: true,
                    weight: 1.0,
                  };

                  return (
                    <div
                      key={skillId}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">
                          {skill?.name || "Skill"}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-500">
                          {skill?.category?.name || "Competency"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-slate-400">
                            Min Score:
                          </span>
                          <input
                            type="range"
                            min="40"
                            max="95"
                            step="5"
                            value={cfg.minScore}
                            onChange={(e) =>
                              updateSkillBenchmark(
                                skillId,
                                "minScore",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                          <span className="text-xs font-mono font-bold text-sky-400 w-10">
                            {cfg.minScore}%
                          </span>
                        </div>

                        <label className="flex items-center space-x-2 text-xs font-mono text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cfg.isMandatory}
                            onChange={(e) =>
                              updateSkillBenchmark(
                                skillId,
                                "isMandatory",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
                          />
                          <span>Mandatory</span>
                        </label>

                        <div className="flex items-center space-x-1 text-xs font-mono">
                          <span className="text-slate-400">Weight:</span>
                          <select
                            value={cfg.weight}
                            onChange={(e) =>
                              updateSkillBenchmark(
                                skillId,
                                "weight",
                                parseFloat(e.target.value),
                              )
                            }
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                          >
                            <option value="1.0">1.0x (Standard)</option>
                            <option value="1.5">1.5x (High)</option>
                            <option value="2.0">2.0x (Critical)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <Link
            to={`/industry/opportunities/${id}`}
            className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center space-x-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Opportunity Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
