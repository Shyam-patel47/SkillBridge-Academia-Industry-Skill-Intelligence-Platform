import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  ArrowLeft,
  Save,
  Sliders,
  AlertCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { SkillSelector } from "../../components/common/SkillSelector";
import { skillService, SkillCategoryItem } from "../../services/skillService";
import {
  opportunityService,
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

export const CreateOpportunityPage: React.FC = () => {
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
  const [eligibleBranches, setEligibleBranches] = useState<string[]>([
    "Computer Science & Engineering",
    "Information Technology",
  ]);
  const [eligibleGradYears, setEligibleGradYears] = useState<number[]>([
    2025, 2026,
  ]);

  // Skill Benchmarks Matrix State
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skillConfigs, setSkillConfigs] = useState<
    Record<string, { minScore: number; isMandatory: boolean; weight: number }>
  >({});

  // AI JD Parser State
  const [showJdParser, setShowJdParser] = useState(false);
  const [rawJdInput, setRawJdInput] = useState("");
  const [parsedJdResult, setParsedJdResult] = useState<any | null>(null);
  const [selectedExtractedSkills, setSelectedExtractedSkills] = useState<
    Record<string, boolean>
  >({});
  const [jdAppliedBanner, setJdAppliedBanner] = useState<string | null>(null);

  // JD Parser Mutation
  const parseJdMutation = useMutation({
    mutationFn: (jdText: string) =>
      opportunityService.parseJobDescription({ jobDescription: jdText }),
    onSuccess: (data) => {
      setParsedJdResult(data);
      const initialSelected: Record<string, boolean> = {};
      data.suggestedSkills.forEach((s) => {
        initialSelected[s.skillId] = true;
      });
      setSelectedExtractedSkills(initialSelected);
      setJdAppliedBanner(null);
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to parse job description with AI. Please check the text.",
      );
    },
  });

  const handleApplyParsedRequirements = () => {
    if (!parsedJdResult) return;

    if (parsedJdResult.suggestedTitle) setTitle(parsedJdResult.suggestedTitle);
    if (parsedJdResult.suggestedType)
      setType(parsedJdResult.suggestedType as any);
    if (parsedJdResult.suggestedWorkMode)
      setWorkMode(parsedJdResult.suggestedWorkMode as any);
    if (parsedJdResult.suggestedDuration)
      setDuration(parsedJdResult.suggestedDuration);
    if (parsedJdResult.suggestedMinCgpa > 0)
      setMinCgpa(parsedJdResult.suggestedMinCgpa);
    if (parsedJdResult.suggestedEligibleBranches?.length > 0) {
      setEligibleBranches(parsedJdResult.suggestedEligibleBranches);
    }
    if (parsedJdResult.suggestedEligibleGradYears?.length > 0) {
      setEligibleGradYears(parsedJdResult.suggestedEligibleGradYears);
    }
    if (!description || description.length < 20) {
      setDescription(rawJdInput.trim());
    }

    // Apply selected skills to benchmark matrix
    const acceptedSkills = parsedJdResult.suggestedSkills.filter(
      (s: any) => selectedExtractedSkills[s.skillId],
    );

    const newSkillIds = acceptedSkills.map((s: any) => s.skillId);
    setSelectedSkillIds(newSkillIds);

    const newConfigs: Record<
      string,
      { minScore: number; isMandatory: boolean; weight: number }
    > = {};
    acceptedSkills.forEach((s: any) => {
      newConfigs[s.skillId] = {
        minScore: s.minScore || 60,
        isMandatory: s.isMandatory ?? true,
        weight: s.weight || 1.0,
      };
    });
    setSkillConfigs(newConfigs);

    setJdAppliedBanner(
      `Extracted requirements applied! ${acceptedSkills.length} skills added to the benchmarks matrix. Review and customize details below before publishing.`,
    );
    setShowJdParser(false);
  };

  // Fetch Taxonomy to resolve skill names
  const { data: taxonomy } = useQuery<SkillCategoryItem[]>({
    queryKey: ["skills", "taxonomy"],
    queryFn: skillService.getTaxonomy,
  });

  const allSkills = React.useMemo(() => {
    if (!taxonomy) return [];
    return taxonomy.flatMap((c) => c.skills);
  }, [taxonomy]);

  // Handle Skill Selection Change
  const handleSkillsChange = (newIds: string[]) => {
    setSelectedSkillIds(newIds);
    setSkillConfigs((prev) => {
      const next = { ...prev };
      newIds.forEach((id) => {
        if (!next[id]) {
          next[id] = { minScore: 65, isMandatory: true, weight: 1.0 };
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

  // Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateOpportunityPayload) =>
      opportunityService.createOpportunity(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["company", "opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["company", "dashboard"] });
      navigate(`/industry/opportunities/${created.id}`);
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to create opportunity. Please check all fields.",
      );
    },
  });

  const handleSubmit = (isActive: boolean) => {
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

    const payload: CreateOpportunityPayload = {
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

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/industry/opportunities"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Opportunities</span>
        </Link>
      </div>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2f] to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5 text-sky-400" />
            <span>Opportunity Creation Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Post New Opportunity
          </h1>
          <p className="text-xs text-slate-400">
            Define role parameters, eligibility thresholds, and skill competency
            benchmarks for candidate matching.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowJdParser(!showJdParser)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {showJdParser
              ? "Hide AI JD Parser"
              : "✨ AI Job Description Parser"}
          </span>
        </button>
      </div>

      {/* AI Job Description Parser Cockpit */}
      {showJdParser && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI JOB DESCRIPTION EXTRACTION & NORMALIZATION</span>
              </div>
              <h2 className="text-base font-bold text-white">
                Paste Job Description to Extract Required Skills & Metadata
              </h2>
              <p className="text-xs text-slate-400">
                AI extracts required skills, minimum proficiency scores, work
                mode, and eligibility requirements normalized to the platform
                taxonomy.
              </p>
            </div>
          </div>

          {/* Text Input Area */}
          <div className="space-y-3">
            <textarea
              rows={5}
              value={rawJdInput}
              onChange={(e) => setRawJdInput(e.target.value)}
              placeholder="e.g. Looking for a React developer with JavaScript, Git and REST API experience. Must have solid Docker knowledge..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white leading-relaxed focus:outline-none focus:border-sky-500 font-mono"
            />

            {/* Quick Example Fill Chip */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>Quick Template:</span>
              <button
                type="button"
                onClick={() =>
                  setRawJdInput(
                    "Looking for a React developer with JavaScript, Git and REST API experience. Must have 2+ years of Docker containerization and PostgreSQL database design. Full-time remote role for Computer Science & IT graduates with CGPA >= 7.5.",
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-sky-400 hover:text-sky-300 hover:border-sky-500/30 transition-all text-left truncate max-w-lg"
              >
                "Looking for a React developer with JavaScript, Git and REST API
                experience..."
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-slate-500">
                Recruiter must review and confirm extracted requirements before
                publishing.
              </span>

              <button
                type="button"
                disabled={parseJdMutation.isPending || !rawJdInput.trim()}
                onClick={() => parseJdMutation.mutate(rawJdInput)}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
              >
                {parseJdMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting Skills with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract Requirements with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Parsed Suggestions Review Cockpit */}
          {parsedJdResult && (
            <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-850 space-y-6 pt-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>AI Extracted Suggestions Review</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Select and calibrate the requirements you want to apply to
                    this vacancy.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleApplyParsedRequirements}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Apply Confirmed Requirements to Form</span>
                </button>
              </div>

              {/* Inferred Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">
                    Inferred Title
                  </span>
                  <span className="text-white font-bold block truncate">
                    {parsedJdResult.suggestedTitle}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">
                    Opportunity Type
                  </span>
                  <span className="text-sky-400 font-bold block">
                    {parsedJdResult.suggestedType}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">
                    Work Mode
                  </span>
                  <span className="text-emerald-400 font-bold block">
                    {parsedJdResult.suggestedWorkMode}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase">
                    Duration
                  </span>
                  <span className="text-white font-bold block">
                    {parsedJdResult.suggestedDuration || "N/A"}
                  </span>
                </div>
              </div>

              {/* Extracted Skills List with Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                    Extracted Required Skills (
                    {parsedJdResult.suggestedSkills.length})
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Normalized against SkillBridge Taxonomy
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parsedJdResult.suggestedSkills.map((skill: any) => {
                    const isChecked = Boolean(
                      selectedExtractedSkills[skill.skillId],
                    );

                    return (
                      <div
                        key={skill.skillId}
                        onClick={() =>
                          setSelectedExtractedSkills((prev) => ({
                            ...prev,
                            [skill.skillId]: !prev[skill.skillId],
                          }))
                        }
                        className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          isChecked
                            ? "bg-sky-950/20 border-sky-500/40 ring-1 ring-sky-500/30"
                            : "bg-slate-900/60 border-slate-800 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded bg-slate-900 border-slate-700 text-sky-500"
                            />
                            <div>
                              <span className="text-sm font-bold text-white block">
                                {skill.skillName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {skill.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 text-xs font-mono">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-sky-300">
                              {skill.proficiency}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-bold">
                              Min: {skill.minScore}%
                            </span>
                          </div>
                        </div>

                        {skill.contextSnippet && (
                          <p className="text-[11px] text-slate-400 italic font-sans truncate pl-6">
                            "{skill.contextSnippet}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applied Banner */}
      {jdAppliedBanner && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{jdAppliedBanner}</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Section 1: Role Overview */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Briefcase className="w-4 h-4 text-sky-400" />
            <span>1. Role Essentials</span>
          </h2>

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
                placeholder="e.g. Full Stack Developer Intern / Associate Cloud Engineer"
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
                placeholder="e.g. Bengaluru, India / San Francisco, CA"
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
                placeholder="e.g. 6 Months / Full-Time"
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
                placeholder="e.g. ₹40,000 / month or ₹8 - 12 LPA"
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
              Role Description & Key Responsibilities{" "}
              <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the day-to-day responsibilities, learning outcomes, technology stack, and engineering practices..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Academic Eligibility */}
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
                <span className="text-[11px] font-mono text-slate-500">
                  {minCgpa === 0
                    ? "No minimum CGPA required"
                    : `Candidates must have ≥ ${minCgpa} CGPA`}
                </span>
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

          <p className="text-xs text-slate-400 leading-relaxed">
            Select required skills from our centralized taxonomy and calibrate
            the minimum verified proficiency benchmark score for each.
          </p>

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
                        {/* Minimum Score Slider */}
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

                        {/* Mandatory Toggle */}
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

                        {/* Weight */}
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

        {/* Section 4: Action Controls */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => handleSubmit(false)}
            className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center space-x-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Opportunity...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish Opportunity</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
