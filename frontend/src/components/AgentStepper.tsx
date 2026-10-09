import React from "react";
import { CheckCircle2, CircleDashed, Search, GitFork, Lightbulb, Scale } from "lucide-react";

interface AgentStepperProps {
  currentStep: number; // 1 to 4 (or 5 for complete)
  isAnalyzing: boolean;
}

export const AgentStepper: React.FC<AgentStepperProps> = ({ currentStep, isAnalyzing }) => {
  const steps = [
    {
      id: 1,
      name: "Research Analysis Agent",
      role: "Paper Ingestion & RAG",
      desc: "Extracts empirical concepts, key findings, and biological/mechanistic entities from uploaded PDFs.",
      icon: Search,
      color: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
    },
    {
      id: 2,
      name: "Connection Discovery Agent",
      role: "Knowledge Graph Traversal",
      desc: "Traverses concept graphs to identify non-obvious multi-hop bridges across distinct research papers.",
      icon: GitFork,
      color: "text-teal-400",
      border: "border-teal-500/30",
      bg: "bg-teal-500/10",
    },
    {
      id: 3,
      name: "Hypothesis Generator Agent",
      role: "Inductive Scientific Synthesis",
      desc: "Synthesizes discovered connections into 3–5 falsifiable hypotheses with operational variables.",
      icon: Lightbulb,
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    {
      id: 4,
      name: "Critic Agent",
      role: "Empirical Rigor Evaluation",
      desc: "Assesses Novelty, Testability, Plausibility, and Falsifiability (0–100) and facilitates refinement.",
      icon: Scale,
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id && isAnalyzing;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-4 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? `${step.border} ${step.bg} shadow-lg shadow-${step.color}/10 scale-[1.02]`
                  : isDone
                  ? "border-emerald-500/30 bg-emerald-950/20"
                  : "border-slate-800 bg-slate-900/40 opacity-70"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${isActive ? "bg-slate-800" : isDone ? "bg-emerald-500/20" : "bg-slate-800/60"}`}>
                  <Icon className={`w-5 h-5 ${isDone ? "text-emerald-400" : step.color}`} />
                </div>
                <div>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Ready
                    </span>
                  ) : isActive ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-teal-300 animate-pulse">
                      <CircleDashed className="w-4 h-4 animate-spin" /> Processing
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono">Stage {step.id}</span>
                  )}
                </div>
              </div>

              <h4 className="font-semibold text-slate-100 text-sm mb-1">{step.name}</h4>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">{step.role}</p>
              <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>

              {/* Progress bar inside active card */}
              {isActive && (
                <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 w-2/3 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
