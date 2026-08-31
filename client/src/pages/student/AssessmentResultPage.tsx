import React, { useState } from "react";
import { useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  ArrowRight,
  Target,
  BrainCircuit,
  HelpCircle,
  Loader2,
  AlertTriangle,
  Compass,
} from "lucide-react";
import {
  assessmentService,
  AssessmentResultData,
} from "../../services/assessmentService";

export const AssessmentResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Pick up result passed from session navigation or fetch directly
  const stateResult = (location.state as any)?.result as
    AssessmentResultData | undefined;

  const [activeReviewFilter, setActiveReviewFilter] = useState<
    "all" | "correct" | "incorrect"
  >("all");

  const { data: result, isLoading } = useQuery<AssessmentResultData>({
    queryKey: ["assessment", "result", id],
    queryFn: () => assessmentService.getAssessmentResult(id!),
    initialData: stateResult,
    enabled: Boolean(id && !stateResult),
  });

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">
          Loading performance report...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="glass-panel max-w-md mx-auto p-8 rounded-3xl border border-slate-800 text-center space-y-4 my-12">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Result Found</h2>
        <p className="text-xs text-slate-400">
          We could not locate an evaluation report for this assessment.
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

  const isPassed = result.passed;

  const filteredQuestions = result.questionReview.filter((q) => {
    if (activeReviewFilter === "correct") return q.isCorrect;
    if (activeReviewFilter === "incorrect") return !q.isCorrect;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Banner & Score Summary */}
      <div
        className={`glass-panel p-6 sm:p-8 rounded-3xl border ${
          isPassed
            ? "border-emerald-500/30 bg-gradient-to-r from-slate-900 via-[#0a201b] to-slate-900"
            : "border-rose-500/30 bg-gradient-to-r from-slate-900 via-[#200d14] to-slate-900"
        } flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden`}
      >
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-xs font-semibold">
            <Award
              className={`w-3.5 h-3.5 ${isPassed ? "text-emerald-400" : "text-rose-400"}`}
            />
            <span className="text-white">{result.assessment.title}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {isPassed
              ? "Competency Assessment Passed! 🎉"
              : "Assessment Completed"}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            {isPassed
              ? "Congratulations! Your evaluated technical scores have been validated and saved to your verified skill profile."
              : `You scored ${result.percentage}% (passing threshold: ${result.assessment.passingScore}%). Focus on the identified weak areas below and retake whenever you are ready.`}
          </p>
        </div>

        {/* Big Score Gauge Badge */}
        <div className="p-5 rounded-3xl bg-slate-950/90 border border-slate-800 text-center w-full md:w-52 shrink-0 z-10 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Overall Score
          </span>
          <div
            className={`text-4xl font-extrabold font-mono ${
              isPassed ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {result.percentage}%
          </div>
          <div className="text-xs font-mono text-slate-300 pt-1">
            {result.correctAnswers} / {result.totalQuestions} Correct
          </div>
        </div>
      </div>

      {/* SKILL-WISE COMPETENCY BREAKDOWN */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-sky-400" />
              <span>Skill-Wise Proficiency Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated performance on each specific skill entity tested in this
              session
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-mono font-semibold">
            ✓ StudentSkill Records Updated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {result.skillBreakdown.map((s) => (
            <div
              key={s.skillId}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-850 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">
                  {s.skillName}
                </span>
                <span className="font-mono text-xs font-bold text-sky-400">
                  {s.score}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    s.score >= 80
                      ? "bg-gradient-to-r from-sky-500 to-emerald-400"
                      : s.score >= 50
                        ? "bg-gradient-to-r from-sky-500 to-amber-400"
                        : "bg-gradient-to-r from-amber-500 to-rose-500"
                  }`}
                  style={{ width: `${s.score}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {s.proficiency}
                </span>
                <span>
                  {s.correctCount} of {s.questionCount} correct
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* STRENGTHS VS WEAK AREAS MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-bold text-white">
              Identified Core Strengths
            </h4>
          </div>
          <p className="text-xs text-slate-400">
            Competencies where your score was ≥ 75%
          </p>

          <div className="space-y-2 pt-2">
            {result.strengths.length > 0 ? (
              result.strengths.map((st) => (
                <div
                  key={st.skillId}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-emerald-300">
                    {st.skillName}
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {st.score}% • {st.proficiency}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-slate-500 text-center">
                No skills met the 75% strength threshold yet.
              </div>
            )}
          </div>
        </div>

        {/* Weak Areas */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-amber-400" />
            <h4 className="text-base font-bold text-white">
              Target Development Areas
            </h4>
          </div>
          <p className="text-xs text-slate-400">
            Skill gaps diagnosed where performance was &lt; 60%
          </p>

          <div className="space-y-2 pt-2">
            {result.weakAreas.length > 0 ? (
              result.weakAreas.map((wk) => (
                <div
                  key={wk.skillId}
                  className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-amber-300">
                    {wk.skillName}
                  </span>
                  <span className="font-mono font-bold text-amber-400">
                    {wk.score}% Gap Area
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-850 text-xs text-emerald-400 font-semibold text-center">
                ✨ Zero major skill gaps detected! Excellent competency
                coverage.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUESTION-BY-QUESTION REVIEW */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-400" />
              <span>Question-By-Question Detailed Review</span>
            </h3>
            <p className="text-xs text-slate-400">
              Inspect correct answers and in-depth explanations
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {(["all", "correct", "incorrect"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveReviewFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  activeReviewFilter === filter
                    ? "bg-sky-500 text-white font-bold"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.questionId}
              className={`p-5 rounded-2xl border ${
                q.isCorrect
                  ? "border-emerald-500/20 bg-emerald-500/[0.03]"
                  : "border-rose-500/20 bg-rose-500/[0.03]"
              } space-y-4`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {q.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-white">
                    Question {idx + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-sky-400">
                    {q.skillName}
                  </span>
                </div>

                <span
                  className={`text-[11px] font-mono font-bold ${
                    q.isCorrect ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {q.isCorrect ? "+1.0 Point" : "0.0 Points"}
                </span>
              </div>

              {/* Text */}
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {q.questionText}
              </p>

              {/* Code Snippet if present */}
              {q.codeSnippet && (
                <div className="p-3 rounded-xl bg-[#050811] border border-slate-850 font-mono text-xs text-sky-200 overflow-x-auto">
                  <pre>{q.codeSnippet}</pre>
                </div>
              )}

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, optIdx) => {
                  const isUserChoice = q.selectedOptionIndex === optIdx;
                  const isCorrectChoice = q.correctOptionIndex === optIdx;

                  let cardStyle =
                    "bg-slate-900/60 border-slate-850 text-slate-400";
                  if (isCorrectChoice) {
                    cardStyle =
                      "bg-emerald-500/15 border-emerald-500 text-emerald-200 font-semibold";
                  } else if (isUserChoice && !q.isCorrect) {
                    cardStyle =
                      "bg-rose-500/15 border-rose-500 text-rose-200 line-through";
                  }

                  return (
                    <div
                      key={optIdx}
                      className={`p-3 rounded-xl border flex items-center justify-between ${cardStyle}`}
                    >
                      <span>{opt}</span>
                      {isCorrectChoice && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      {isUserChoice && !q.isCorrect && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-850 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-sky-400 block text-[11px]">
                    💡 Explanation:
                  </span>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Link
          to={`/student/assessments/${id}`}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white text-xs font-semibold transition-all"
        >
          <RotateCcw className="w-4 h-4 text-sky-400" />
          <span>Retake Assessment</span>
        </Link>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            to="/student/skills"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-sky-300 text-xs font-semibold transition-all"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>View Updated Skill Radar</span>
          </Link>
          <Link
            to="/student/careers"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-sky-500 hover:from-brand-500 hover:to-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Matching Careers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
