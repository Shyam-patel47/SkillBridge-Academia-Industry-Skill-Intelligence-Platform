import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Code2,
  X,
} from "lucide-react";
import {
  assessmentService,
  AssessmentSessionData,
} from "../../services/assessmentService";

export const AssessmentSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(
    new Set(),
  );
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Fetch Assessment Session
  const {
    data: assessment,
    isLoading,
    error,
  } = useQuery<AssessmentSessionData>({
    queryKey: ["assessment", "session", id],
    queryFn: () => assessmentService.getAssessmentForSession(id!),
    enabled: Boolean(id),
    staleTime: Infinity,
  });

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (
      answersPayload: { questionId: string; selectedOptionIndex: number }[],
    ) => assessmentService.submitAssessment(id!, answersPayload),
    onSuccess: (result) => {
      navigate(`/student/assessments/${id}/result`, { state: { result } });
    },
  });

  // Initialize timer once assessment loads
  useEffect(() => {
    if (assessment && timeLeftSeconds === null) {
      setTimeLeftSeconds(assessment.durationMinutes * 60);
    }
  }, [assessment, timeLeftSeconds]);

  // Countdown timer loop
  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(interval);
          setIsTimeUp(true);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

  const handleFinalSubmit = useCallback(() => {
    if (!assessment) return;

    const answersPayload = Object.entries(answers).map(
      ([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      }),
    );

    // If student left some unanswered, provide default index -1
    for (const q of assessment.questions) {
      if (!(q.id in answers)) {
        answersPayload.push({ questionId: q.id, selectedOptionIndex: -1 });
      }
    }

    submitMutation.mutate(answersPayload);
  }, [assessment, answers, submitMutation]);

  // Auto-submit when time expires
  useEffect(() => {
    if (isTimeUp && !submitMutation.isPending) {
      handleFinalSubmit();
    }
  }, [isTimeUp, handleFinalSubmit, submitMutation.isPending]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Initializing assessment environment...
        </p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="glass-panel max-w-md mx-auto p-8 rounded-3xl border border-slate-800 text-center space-y-4 my-12">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">
          Failed to load assessment
        </h2>
        <p className="text-xs text-slate-400">
          The requested assessment session could not be established.
        </p>
        <button
          onClick={() => navigate("/student/assessments")}
          className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-white"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const currentQuestion = assessment.questions[currentIndex];
  const totalQuestions = assessment.questions.length;
  const answeredCount = Object.keys(answers).length;

  const handleSelectOption = (optionIndex: number) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: optionIndex,
    });
  };

  const handleClearChoice = () => {
    const updated = { ...answers };
    delete updated[currentQuestion.id];
    setAnswers(updated);
  };

  const toggleMarkReview = () => {
    const next = new Set(markedQuestions);
    if (next.has(currentQuestion.id)) {
      next.delete(currentQuestion.id);
    } else {
      next.add(currentQuestion.id);
    }
    setMarkedQuestions(next);
  };

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Cockpit Top Bar */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-20 z-30 shadow-2xl">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold">
            {assessment.category.name}
          </span>
          <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
            {assessment.title}
          </h1>
        </div>

        {/* Timer & Submit CTA */}
        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
          {timeLeftSeconds !== null && (
            <div
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl border font-mono text-sm font-bold ${
                timeLeftSeconds <= 120
                  ? "bg-rose-500/15 border-rose-500 text-rose-300 animate-pulse"
                  : "bg-slate-900 border-slate-800 text-sky-400"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>
          )}

          <button
            onClick={() => setSubmitModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish & Submit</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid: Question Viewer & Question Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Viewer (Left 3 Columns) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            {/* Header: Number & Skill tag */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono font-bold text-white text-sm">
                  Question {currentIndex + 1}
                </span>
                <span className="text-slate-500 font-mono">
                  of {totalQuestions}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-sky-400 font-semibold">
                  {currentQuestion.skill.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-850 text-[10px] font-mono text-slate-400 uppercase">
                  {currentQuestion.difficulty}
                </span>
              </div>
            </div>

            {/* Question Body */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                {currentQuestion.questionText}
              </h2>

              {/* Code Snippet if present */}
              {currentQuestion.codeSnippet && (
                <div className="p-4 rounded-2xl bg-[#050811] border border-slate-850 font-mono text-xs text-sky-200 overflow-x-auto leading-relaxed">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 pb-2 mb-2 border-b border-slate-850/60">
                    <Code2 className="w-3 h-3 text-sky-400" />
                    <span>Code Snippet</span>
                  </div>
                  <pre>{currentQuestion.codeSnippet}</pre>
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((optText, optIdx) => {
                const isSelected = answers[currentQuestion.id] === optIdx;
                const optionLetters = ["A", "B", "C", "D", "E"];

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm flex items-start space-x-3 transition-all ${
                      isSelected
                        ? "bg-sky-500/15 border-sky-500 text-white shadow-md shadow-sky-500/10"
                        : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected
                          ? "bg-sky-500 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {optionLetters[optIdx] || optIdx + 1}
                    </div>
                    <span className="pt-0.5 leading-relaxed">{optText}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions for current question */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-850">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleMarkReview}
                  className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    markedQuestions.has(currentQuestion.id)
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {markedQuestions.has(currentQuestion.id)
                      ? "Marked for Review"
                      : "Mark for Review"}
                  </span>
                </button>

                {answers[currentQuestion.id] !== undefined && (
                  <button
                    type="button"
                    onClick={handleClearChoice}
                    className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Clear Choice
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={currentIndex === totalQuestions - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar (Right 1 Column) */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Question Palette
            </h3>

            {/* Summary counters */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-850">
                <span className="text-slate-500 block text-[10px]">
                  Answered
                </span>
                <span className="font-bold text-emerald-400">
                  {answeredCount}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-850">
                <span className="text-slate-500 block text-[10px]">
                  Remaining
                </span>
                <span className="font-bold text-slate-400">
                  {totalQuestions - answeredCount}
                </span>
              </div>
            </div>

            {/* Number grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2">
              {assessment.questions.map((q, idx) => {
                const isAnswered = q.id in answers;
                const isCurrent = idx === currentIndex;
                const isMarked = markedQuestions.has(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-bold font-mono transition-all relative ${
                      isCurrent
                        ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 bg-sky-500 text-white"
                        : isMarked
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : isAnswered
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isMarked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="border-t border-slate-850 pt-4 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                <span>Unvisited / Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {submitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Confirm Submission</span>
              </h3>
              <button
                onClick={() => setSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                You have answered{" "}
                <span className="font-bold text-white">{answeredCount}</span>{" "}
                out of{" "}
                <span className="font-bold text-white">{totalQuestions}</span>{" "}
                questions.
              </p>

              {totalQuestions - answeredCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    You still have {totalQuestions - answeredCount} unanswered
                    questions. Once submitted, your score will be computed
                    deterministically.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Continue Quiz
              </button>
              <button
                type="button"
                disabled={submitMutation.isPending}
                onClick={handleFinalSubmit}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Scoring Answers...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & View Results</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
