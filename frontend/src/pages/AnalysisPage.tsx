import React, { useState } from "react";
import type { Project, Hypothesis, Connection, GraphData, Paper } from "../services/api";
import { AgentStepper } from "../components/AgentStepper";
import { KnowledgeGraphView } from "../components/KnowledgeGraphView";
import { HypothesisCard } from "../components/HypothesisCard";
import { BookOpen, GitFork, Sparkles, FileText, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";

interface AnalysisPageProps {
  project: Project;
  hypotheses: Hypothesis[];
  connections: Connection[];
  graphData: GraphData;
  papers: Paper[];
  isAnalyzing: boolean;
  onRunAnalysis: () => Promise<void>;
  onSaveHypothesis: (id: number) => void;
  onRefineHypothesis: (id: number) => void;
  onEvaluateHypothesis?: (id: number) => Promise<void>;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  project,
  hypotheses,
  connections,
  graphData,
  papers,
  isAnalyzing,
  onRunAnalysis,
  onSaveHypothesis,
  onRefineHypothesis,
  onEvaluateHypothesis,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"graph" | "connections" | "hypotheses" | "papers">("hypotheses");

  const currentStep = isAnalyzing ? 3 : project.status === "completed" ? 5 : 1;

  return (
    <div className="space-y-8 py-6">
      {/* Top Banner: Project Title & Question */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              {project.research_area}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Project #{project.id}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-md shadow-teal-500/20 hover:from-teal-400 hover:to-indigo-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              {isAnalyzing ? "Re-Running 4-Agent Pipeline..." : "Re-Analyze Project"}
            </button>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          {project.title}
        </h1>
        <p className="text-sm text-slate-300 font-medium italic mb-2">
          "{project.research_question}"
        </p>
        <p className="text-xs text-slate-400">
          <strong className="text-slate-300">Topic:</strong> {project.research_topic}
        </p>
      </div>

      {/* 4-Agent Pipeline Stepper */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Multi-Agent Pipeline Progression
          </h3>
          {project.status === "completed" && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Pipeline Completed
            </span>
          )}
        </div>
        <AgentStepper currentStep={currentStep} isAnalyzing={isAnalyzing} />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab("hypotheses")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSubTab === "hypotheses"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Ranked Hypotheses ({hypotheses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("graph")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSubTab === "graph"
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4 text-teal-400" />
          <span>Knowledge Graph</span>
        </button>

        <button
          onClick={() => setActiveSubTab("connections")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSubTab === "connections"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <GitFork className="w-4 h-4 text-indigo-400" />
          <span>Discovered Connections ({connections.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("papers")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeSubTab === "papers"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <span>Source Papers ({papers.length})</span>
        </button>
      </div>

      {/* Sub-Tab Content Views */}

      {/* 1. Generated Hypotheses */}
      {activeSubTab === "hypotheses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Synthesized Scientific Hypotheses
              </h3>
              <p className="text-xs text-slate-400">
                Ranked by Critic Agent overall score across Novelty, Testability, Plausibility, and Falsifiability
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {hypotheses.length} hypotheses generated
            </span>
          </div>

          {hypotheses.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hypotheses generated yet. Click "Re-Analyze Project" to run the pipeline.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {hypotheses.map((h) => (
                <HypothesisCard
                  key={h.id}
                  hypothesis={h}
                  onSave={onSaveHypothesis}
                  onRefine={onRefineHypothesis}
                  onEvaluate={onEvaluateHypothesis}
                  researchArea={project?.research_area}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Knowledge Graph */}
      {activeSubTab === "graph" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Interactive Knowledge Graph</h3>
            <p className="text-xs text-slate-400">
              Extracted concepts, papers, and empirical findings. Drag, zoom, and click nodes to inspect relationships.
            </p>
          </div>
          <KnowledgeGraphView graphData={graphData} />
        </div>
      )}

      {/* 3. Discovered Connections */}
      {activeSubTab === "connections" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Discovered Multi-Hop Pathways</h3>
            <p className="text-xs text-slate-400">
              Identified by Connection Discovery Agent by traversing relationships across multiple distinct papers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connections.map((conn) => (
              <div
                key={conn.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  {/* Multi-Hop Path Visual */}
                  <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
                    <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 font-semibold text-xs border border-blue-500/30">
                      {conn.source_concept}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {conn.intermediate_concepts?.map((c, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-xs border border-indigo-500/30">
                          {c}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      </React.Fragment>
                    ))}
                    <span className="px-2 py-1 rounded bg-teal-500/20 text-teal-300 font-semibold text-xs border border-teal-500/30">
                      {conn.target_concept}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Relation: {conn.relationship_type}
                    </span>
                    {conn.significance && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {conn.significance}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {conn.explanation}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  <strong className="text-slate-300">Supporting Papers:</strong>{" "}
                  {conn.source_papers?.join(", ") || "Derived from knowledge graph"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Uploaded Papers */}
      {activeSubTab === "papers" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Ingested Academic Papers</h3>
            <p className="text-xs text-slate-400">
              Parsed via RAG pipeline and segmented into semantic vector embeddings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-[11px] font-mono text-slate-400">
                      {(paper.file_size_bytes / 1024).toFixed(0)} KB
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 mb-2 leading-snug">
                    {paper.title}
                  </h4>

                  {paper.abstract && (
                    <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                      "{paper.abstract}"
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-teal-400 font-medium">
                  ✓ Ingested in Vector Store
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
