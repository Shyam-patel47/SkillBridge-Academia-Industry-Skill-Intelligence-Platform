import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Check,
  CheckCheck,
  Brain,
  Quote,
} from "lucide-react";
import {
  resumeService,
  ExtractionResponse,
  DetectedSkillItem,
} from "../../services/resumeService";

export const ResumeSkillExtractionPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [inputMode, setInputMode] = useState<"FILE" | "TEXT">("FILE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawTextInput, setRawTextInput] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [extractionResult, setExtractionResult] =
    useState<ExtractionResponse | null>(null);
  const [acceptedSkillsMap, setAcceptedSkillsMap] = useState<
    Record<string, boolean>
  >({});
  const [dismissedSkillsMap, setDismissedSkillsMap] = useState<
    Record<string, boolean>
  >({});
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Extract Mutation
  const extractMutation = useMutation({
    mutationFn: async () => {
      if (inputMode === "FILE") {
        if (!selectedFile)
          throw new Error("Please select a resume file to upload");
        return resumeService.extractSkillsFromFile(selectedFile);
      } else {
        if (!rawTextInput.trim())
          throw new Error("Please enter or paste your resume text");
        return resumeService.extractSkillsFromText(rawTextInput);
      }
    },
    onSuccess: (data) => {
      setExtractionResult(data);
      // Pre-select high confidence skills
      const initialMap: Record<string, boolean> = {};
      data.detectedSkills.forEach((s) => {
        if (s.confidenceScore >= 85 && !s.alreadyPossessed) {
          initialMap[s.skillId] = true;
        }
      });
      setAcceptedSkillsMap(initialMap);
      setDismissedSkillsMap({});
      setSuccessBanner(null);
    },
  });

  // Confirm Mutation
  const confirmMutation = useMutation({
    mutationFn: async (skillsToSave: DetectedSkillItem[]) => {
      const payload = skillsToSave.map((s) => ({
        skillId: s.skillId,
        proficiency: s.suggestedProficiency,
        selfReportedScore: Math.max(50, Math.round(s.confidenceScore * 0.85)),
      }));
      return resumeService.confirmSkills(payload);
    },
    onSuccess: (data) => {
      setSuccessBanner(data.message);
      queryClient.invalidateQueries({ queryKey: ["student", "skills"] });
      queryClient.invalidateQueries({ queryKey: ["student", "portfolio"] });
    },
  });

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
    }
  };

  const toggleAcceptSkill = (skillId: string) => {
    setAcceptedSkillsMap((prev) => ({
      ...prev,
      [skillId]: !prev[skillId],
    }));
    // Remove from dismissed if accepting
    if (dismissedSkillsMap[skillId]) {
      setDismissedSkillsMap((prev) => {
        const next = { ...prev };
        delete next[skillId];
        return next;
      });
    }
  };

  const toggleDismissSkill = (skillId: string) => {
    setDismissedSkillsMap((prev) => ({
      ...prev,
      [skillId]: true,
    }));
    setAcceptedSkillsMap((prev) => {
      const next = { ...prev };
      delete next[skillId];
      return next;
    });
  };

  const handleAcceptAllHighConfidence = () => {
    if (!extractionResult) return;
    const newMap: Record<string, boolean> = { ...acceptedSkillsMap };
    extractionResult.detectedSkills.forEach((s) => {
      if (s.confidenceScore >= 80 && !dismissedSkillsMap[s.skillId]) {
        newMap[s.skillId] = true;
      }
    });
    setAcceptedSkillsMap(newMap);
  };

  const acceptedSkillsList =
    extractionResult?.detectedSkills.filter(
      (s) => acceptedSkillsMap[s.skillId],
    ) || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0a1c2f] to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-semibold">
            <Brain className="w-3.5 h-3.5 text-sky-400" />
            <span>AI-Assisted Skill Extraction & Normalization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Resume Skill Intelligence
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Upload your resume or curriculum vitae. Our AI engine extracts
            technical competencies, normalizes them against the SkillBridge
            taxonomy, and allows you to review and confirm suggested skills.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-950/80 shrink-0 text-right space-y-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase block">
            Engine Protocol
          </span>
          <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5 justify-end">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Explainable Review Guard</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 block">
            Self-Reported Evidence • No Auto-Verification
          </span>
        </div>
      </div>

      {/* Input Selection Tabs */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setInputMode("FILE")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            inputMode === "FILE"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Resume File (PDF / DOCX / TXT)</span>
        </button>

        <button
          type="button"
          onClick={() => setInputMode("TEXT")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            inputMode === "TEXT"
              ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
              : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Paste Resume Text</span>
        </button>
      </div>

      {/* Upload Box / Textarea Area */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
        {inputMode === "FILE" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
              dragOver
                ? "border-sky-400 bg-sky-500/10"
                : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
            }`}
          >
            <UploadCloud className="w-12 h-12 text-sky-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              {selectedFile
                ? selectedFile.name
                : "Drag and drop your resume file here"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Supported formats:{" "}
              <strong className="text-slate-300">
                PDF, DOCX, TXT, Markdown
              </strong>{" "}
              (Max 5MB)
            </p>

            <label className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer transition-all">
              <span>
                {selectedFile ? "Choose Different File" : "Browse Local File"}
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 block">
              Paste Resume or CV Content
            </label>
            <textarea
              rows={8}
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              placeholder="Paste your professional experience, technical skills, projects, and educational summary here..."
              className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white leading-relaxed focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-mono text-slate-500">
            Protected & Confidential • Safe Sandboxed Processing
          </span>

          <button
            type="button"
            disabled={
              extractMutation.isPending ||
              (inputMode === "FILE" && !selectedFile) ||
              (inputMode === "TEXT" && !rawTextInput.trim())
            }
            onClick={() => extractMutation.mutate()}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-sky-500/20"
          >
            {extractMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extracting Skills with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run AI Skill Extraction</span>
              </>
            )}
          </button>
        </div>

        {extractMutation.isError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {(extractMutation.error as any)?.response?.data?.message ||
                (extractMutation.error as any)?.message ||
                "Extraction failed"}
            </span>
          </div>
        )}
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <a
            href="/student/skills"
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[11px] shrink-0"
          >
            View Skills Profile
          </a>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Skill Review Cockpit */}
      {/* ========================================================================= */}
      {extractionResult && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 font-mono">
                <Brain className="w-3.5 h-3.5" />
                <span>
                  STUDENT REVIEW COCKPIT (
                  {extractionResult.extractedSkillsCount} Detected Skills)
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Review & Confirm Suggested Skills
              </h2>
              <p className="text-xs text-slate-400">
                Processed via{" "}
                <strong className="text-slate-300">
                  {extractionResult.providerUsed}
                </strong>
                . Select skills to accept into your student profile.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAcceptAllHighConfidence}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold transition-all border border-slate-700"
              >
                <CheckCheck className="w-4 h-4 text-sky-400" />
                <span>Accept All High Confidence (≥80%)</span>
              </button>

              <button
                type="button"
                disabled={
                  confirmMutation.isPending || acceptedSkillsList.length === 0
                }
                onClick={() => confirmMutation.mutate(acceptedSkillsList)}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Profile...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      Confirm {acceptedSkillsList.length} Selected Skills
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Important Assessment Notice Alert */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">Important Certification Notice:</p>
              <p className="text-slate-400 leading-relaxed font-mono text-[11px]">
                {extractionResult.disclaimer}
              </p>
            </div>
          </div>

          {/* Detected Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {extractionResult.detectedSkills.map((skill) => {
              const isAccepted = Boolean(acceptedSkillsMap[skill.skillId]);
              const isDismissed = Boolean(dismissedSkillsMap[skill.skillId]);

              return (
                <div
                  key={skill.skillId}
                  className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                    isAccepted
                      ? "bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30"
                      : isDismissed
                        ? "bg-slate-950/40 border-slate-850 opacity-40"
                        : "bg-slate-950 border-slate-850 hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-white">
                            {skill.skillName}
                          </h4>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                            {skill.category}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-sky-400 font-semibold">
                          Suggested: {skill.suggestedProficiency}
                        </span>
                      </div>

                      {/* Confidence Score Pill */}
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400 shrink-0">
                        {skill.confidenceScore}% Confidence
                      </span>
                    </div>

                    {/* Context Snippet Quote */}
                    {skill.contextSnippet && (
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-850 text-slate-300 text-[11px] italic font-sans flex items-start gap-1.5">
                        <Quote className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          "{skill.contextSnippet}"
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Action Strip */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-850 text-xs font-mono">
                    <div>
                      {skill.alreadyPossessed ? (
                        <span className="text-emerald-400 text-[10px] font-bold">
                          ✓ Already in profile ({skill.currentScore}%)
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">
                          New Skill
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleDismissSkill(skill.skillId)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isDismissed
                            ? "bg-rose-500 text-white"
                            : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400"
                        }`}
                        title="Dismiss Skill"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleAcceptSkill(skill.skillId)}
                        className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAccepted
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAccepted ? "Accepted" : "Accept"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
