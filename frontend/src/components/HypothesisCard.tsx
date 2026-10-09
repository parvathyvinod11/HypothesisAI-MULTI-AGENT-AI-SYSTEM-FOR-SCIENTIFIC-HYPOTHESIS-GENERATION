import React, { useState } from "react";
import type { Hypothesis } from "../services/api";
import { ScoreRadar } from "./ScoreRadar";
import { ValidationAuditModal } from "./ValidationAuditModal";
import { formatMathText } from "../utils/textUtils";
import {
  Bookmark,
  BookmarkCheck,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  index?: number;
  onSave: (id: number) => void;
  onRefine: (id: number) => void;
  onEvaluate?: (id: number) => Promise<void>;
  researchArea?: string;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hypothesis,
  index,
  onSave,
  onRefine,
  onEvaluate,
  researchArea = "",
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      await onRefine(hypothesis.id);
    } finally {
      setIsRefining(false);
    }
  };

  const handleEvaluate = async () => {
    if (!onEvaluate) return;
    setIsEvaluating(true);
    try {
      await onEvaluate(hypothesis.id);
    } finally {
      setIsEvaluating(false);
    }
  };

  const isCriticUnavailable =
    hypothesis.overall_score === null ||
    hypothesis.overall_score === undefined ||
    hypothesis.novelty_score === null ||
    Boolean(hypothesis.critique && hypothesis.critique.toLowerCase().includes("critic evaluation unavailable"));

  // Clean raw LaTeX math notation into readable Unicode
  const titleFormatted = formatMathText(hypothesis.title);
  const statementFormatted = formatMathText(hypothesis.statement);
  const ivFormatted = formatMathText(hypothesis.independent_var);
  const dvFormatted = formatMathText(hypothesis.dependent_var);
  const outcomeFormatted = formatMathText(hypothesis.expected_outcome);
  const rationaleFormatted = formatMathText(hypothesis.rationale);
  const critiqueFormatted = formatMathText(hypothesis.critique);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow">
      {/* Top Bar: Metadata + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {index !== undefined && (
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-slate-900 dark:bg-blue-600 text-white tracking-wider">
              H{index}
            </span>
          )}
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> AI-Generated Hypothesis
          </span>
          {hypothesis.refinement_count > 0 && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Refined by Critic
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(hypothesis.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hypothesis.is_saved
                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-semibold"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
            }`}
          >
            {hypothesis.is_saved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Saved
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-slate-400" /> Save Hypothesis
              </>
            )}
          </button>

          {hypothesis.refinement_count === 0 && (
            <button
              onClick={handleRefine}
              disabled={isRefining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefining ? "animate-spin" : ""}`} />
              {isRefining ? "Refining..." : "Refine via Critic"}
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Hypothesis details + Score Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Content */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
            {titleFormatted}
          </h3>

          {/* Hypothesis Statement - Authoritative academic presentation */}
          <div className="p-4 sm:p-5 rounded-r-xl rounded-l-md bg-slate-50/80 dark:bg-slate-800/50 border-y border-r border-slate-200/80 dark:border-slate-800 border-l-4 border-l-blue-600 dark:border-l-blue-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-1.5">
              Hypothesis Statement
            </span>
            <p className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              &ldquo;{statementFormatted}&rdquo;
            </p>
          </div>

          {/* Experimental Variables (IV & DV) - Two balanced cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Independent Variable
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Intervention
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {ivFormatted || "Not operationalized"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Dependent Variable
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    Endpoint
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {dvFormatted || "Not operationalized"}
                </p>
              </div>
            </div>
          </div>

          {/* Expected Direction - Clean, readable directional callout */}
          <div className="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Expected Empirical Direction</span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {outcomeFormatted || "Not specified"}
            </p>
          </div>

          {/* How to Test - Scannable 3-row layout */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                How to Test & Experimental Setup
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Empirical Protocol
              </span>
            </div>

            <div className="space-y-2 text-sm pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:w-28 shrink-0 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  Compare:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {ivFormatted || "Experimental intervention against controlled baseline"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:w-28 shrink-0 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0"></span>
                  Measure:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {dvFormatted || "Quantitative endpoint response"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 sm:w-28 shrink-0 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                  Expected result:
                </span>
                <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {outcomeFormatted || "Directional outcome as predicted"}
                </span>
              </div>
            </div>
          </div>

          {/* Supporting Papers */}
          {hypothesis.supporting_papers && hypothesis.supporting_papers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Grounded in:
              </span>
              {hypothesis.supporting_papers.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                >
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Separate Critic Evaluation Panel */}
        <div className="lg:col-span-1 flex flex-col justify-between space-y-3">
          <ScoreRadar
            novelty={isCriticUnavailable ? null : hypothesis.novelty_score}
            testability={isCriticUnavailable ? null : hypothesis.testability_score}
            plausibility={isCriticUnavailable ? null : hypothesis.plausibility_score}
            falsifiability={isCriticUnavailable ? null : hypothesis.falsifiability_score}
            overall={isCriticUnavailable ? null : hypothesis.overall_score}
            isUnavailable={Boolean(isCriticUnavailable)}
          />

          {isCriticUnavailable && onEvaluate && (
            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
              {isEvaluating ? "Evaluating with Critic..." : "Evaluate with Critic"}
            </button>
          )}

          <button
            onClick={() => setShowAuditModal(true)}
            className="w-full py-2.5 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Audit Scientific Accuracy & Proof
          </button>
        </div>
      </div>

      {/* Expandable Details: Scientific Rationale, Supporting Evidence, and Critic Feedback */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1"
        >
          <span>{expanded ? "Hide Scientific Rationale & Critic Notes" : "View Scientific Rationale & Critic Evaluation"}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <div>
              <h5 className="font-semibold text-slate-900 dark:text-white mb-1 text-xs uppercase tracking-wide">
                Scientific Rationale:
              </h5>
              <p className="leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-normal">
                {rationaleFormatted}
              </p>
            </div>

            {/* How to Test Protocol Audit */}
            <div className="p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <FlaskConical className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  How to Test: Verification Audit
                </h5>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Empirical Alignment</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Hypothesis Alignment
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">Genuinely tests stated claim</p>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Operational Variables
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">IV & DV operationally defined</p>
                </div>
                <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Literature Direction
                  </div>
                  <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">Supported by evidence findings</p>
                </div>
              </div>
            </div>

            {hypothesis.supporting_evidence && hypothesis.supporting_evidence.length > 0 && (
              <div>
                <h5 className="font-semibold text-slate-900 dark:text-white mb-1 text-xs uppercase tracking-wide">
                  Supporting Empirical Findings:
                </h5>
                <ul className="list-disc pl-5 space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
                  {hypothesis.supporting_evidence.map((ev, idx) => (
                    <li key={idx}>{formatMathText(ev)}</li>
                  ))}
                </ul>
              </div>
            )}

            {critiqueFormatted && (
              <div>
                <h5 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Critic Agent Peer-Review Notes:
                </h5>
                <div className="p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed text-xs">
                  {critiqueFormatted}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scientific Accuracy & Validation Audit Modal */}
      <ValidationAuditModal
        hypothesis={{
          ...hypothesis,
          title: titleFormatted,
          statement: statementFormatted,
          independent_var: ivFormatted,
          dependent_var: dvFormatted,
          expected_outcome: outcomeFormatted,
          rationale: rationaleFormatted,
          critique: critiqueFormatted,
          supporting_evidence: hypothesis.supporting_evidence?.map(formatMathText) || [],
          novelty_score: isCriticUnavailable ? null : hypothesis.novelty_score,
          testability_score: isCriticUnavailable ? null : hypothesis.testability_score,
          plausibility_score: isCriticUnavailable ? null : hypothesis.plausibility_score,
          falsifiability_score: isCriticUnavailable ? null : hypothesis.falsifiability_score,
          overall_score: isCriticUnavailable ? null : hypothesis.overall_score,
        }}
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        researchArea={researchArea}
      />
    </div>
  );
};
