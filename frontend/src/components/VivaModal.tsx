import { useState } from "react";
import { X, GraduationCap, Database, Cpu, Network, CheckCircle } from "lucide-react";

interface VivaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VivaModal: React.FC<VivaModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<"synopsis" | "architecture" | "qa" | "team">("synopsis");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Final Year Major Project • Academic Defense & Viva Guide
              </h3>
              <p className="text-xs text-slate-400">
                Department of Computer Science & Engineering • Academic Session 2025–2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveSection("synopsis")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === "synopsis"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Project Synopsis
          </button>
          <button
            onClick={() => setActiveSection("architecture")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === "architecture"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            System Architecture
          </button>
          <button
            onClick={() => setActiveSection("qa")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === "qa"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Examiner Viva Q&A
          </button>
          <button
            onClick={() => setActiveSection("team")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === "team"
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Project Details & Submission
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* 1. Synopsis */}
          {activeSection === "synopsis" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="font-bold text-teal-400 text-sm mb-1 uppercase tracking-wider">
                  Project Title
                </h4>
                <p className="text-base font-bold text-white">
                  AI Scientific Hypothesis Generator using Multi-Agent Orchestration, RAG, and Knowledge Graph Mining
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-100 mb-1">Problem Statement:</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Academic scientific discovery is severely bottlenecked by manual literature synthesis. Researchers cannot cross-reference thousands of siloed publications to identify indirect, multi-hop causal connections between scientific variables. Traditional keyword search engines only retrieve documents; they do not synthesize testable hypotheses or critically evaluate falsifiability.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-100 mb-1">Proposed Solution:</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We engineered an autonomous 4-agent academic research pipeline:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-slate-300">
                  <li><strong>RAG Text Extraction:</strong> Ingests empirical PDF papers, splits content into semantic sliding-window chunks, and creates vector embeddings.</li>
                  <li><strong>Dual Knowledge Graph:</strong> Maps Papers, Concepts, Findings, and Research Areas into NetworkX and live Neo4j AuraDB with directed relationship semantics.</li>
                  <li><strong>Multi-Hop Discovery:</strong> Discovers non-obvious intermediate pathways (e.g. A → B → C) bridging separate publications.</li>
                  <li><strong>Hypothesis & Critic Synthesis:</strong> Constructs formal testable hypotheses with operational variables and rigorous 4-axis evaluation (Novelty, Testability, Plausibility, Falsifiability).</li>
                </ul>
              </div>
            </div>
          )}

          {/* 2. Architecture */}
          {activeSection === "architecture" && (
            <div className="space-y-5">
              <h4 className="font-bold text-white text-sm">System Pipeline Architecture</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-teal-400 font-bold mb-2">
                    <Cpu className="w-4 h-4" /> Agent Orchestration Layer
                  </div>
                  <ul className="space-y-1.5 text-slate-400">
                    <li>• <strong>Agent 1 (Research Analysis):</strong> Semantic vector retrieval & entity extraction.</li>
                    <li>• <strong>Agent 2 (Connection Discovery):</strong> Graph path traversal across distinct papers.</li>
                    <li>• <strong>Agent 3 (Hypothesis Generator):</strong> Inductive hypothesis formation with IV & DV.</li>
                    <li>• <strong>Agent 4 (Critic Agent):</strong> Automated academic peer review & variable refinement.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
                    <Database className="w-4 h-4" /> Storage & Graph Systems
                  </div>
                  <ul className="space-y-1.5 text-slate-400">
                    <li>• <strong>Relational Database:</strong> SQLite / SQLAlchemy for Users, Projects & Papers.</li>
                    <li>• <strong>Knowledge Graph:</strong> NetworkX + live Neo4j AuraDB with Cypher queries.</li>
                    <li>• <strong>Vector Database:</strong> TF-IDF / Cosine Similarity embeddings for RAG.</li>
                    <li>• <strong>LLM Engine:</strong> Google Gemini 2.5 Flash API with deterministic fallback.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
                  <Network className="w-4 h-4" /> Multi-Hop Traversal Example
                </div>
                <div className="font-mono text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 text-teal-300">
                  Paper 1 [Screen Exposure → Melatonin Suppression] <br />
                  &nbsp;&nbsp;↓ (bridges via Circadian Rhythm) <br />
                  Paper 2 [Melatonin Suppression → Slow-Wave Sleep Latency] <br />
                  &nbsp;&nbsp;↓ (bridges via Synaptic Consolidation) <br />
                  Paper 3 [Slow-Wave Sleep Disruption → Prefrontal Working Memory Deficit]
                </div>
              </div>
            </div>
          )}

          {/* 3. Viva Q&A */}
          {activeSection === "qa" && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-white text-sm">Examiner Viva Defense Questions & Answers</h4>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-teal-300 mb-1">
                    Q1: How does your RAG pipeline prevent the AI from hallucinating citations?
                  </p>
                  <p className="text-slate-300">
                    <strong>Answer:</strong> Before passing data to the LLM, the PDF text is extracted using <code>pypdf</code> and chunked into a vector store. The agents are constrained to formulate hypotheses whose supporting evidence explicitly matches the retrieved RAG chunks, including exact paper title citations.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-teal-300 mb-1">
                    Q2: What is the purpose of the Knowledge Graph in this project?
                  </p>
                  <p className="text-slate-300">
                    <strong>Answer:</strong> While vector search retrieves semantic text chunks, it cannot find multi-hop connections. The Knowledge Graph maps concepts as nodes and biological/physical relationships as directed edges (e.g. <code>AFFECTS</code>, <code>SUPPORTS</code>). This allows the Connection Agent to traverse paths across papers that were published independently.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-teal-300 mb-1">
                    Q3: How does the Critic Agent evaluate a scientific hypothesis?
                  </p>
                  <p className="text-slate-300">
                    <strong>Answer:</strong> The Critic Agent evaluates 4 academic criteria (0–100): <em>Novelty</em> (non-obviousness), <em>Testability</em> (measurable with empirical tools), <em>Plausibility</em> (consistent with established scientific laws), and <em>Falsifiability</em> (an experiment can definitively disprove it). If weak, the agent calibrates the independent and dependent variables through a refinement loop.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="font-bold text-teal-300 mb-1">
                    Q4: What happens if the internet drops or the LLM API quota expires during a demo?
                  </p>
                  <p className="text-slate-300">
                    <strong>Answer:</strong> We implemented a resilient dual-mode architecture. When active, it utilizes Gemini 2.5 Flash; if an API error or network dropout occurs, the system automatically falls back to an internal scientific reasoning engine so the presentation executes without a single crash.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Team & Submission Details */}
          {activeSection === "team" && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-white text-sm">Academic Project Submission Metadata</h4>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Course / Degree:</span>
                  <span className="font-semibold text-slate-200">Bachelor of Technology (B.Tech) in Computer Science & Engineering</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Subject:</span>
                  <span className="font-semibold text-slate-200">Final Year Major Project / Capstone Project (CS801)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Academic Year:</span>
                  <span className="font-semibold text-slate-200">2025–2026</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Primary Domain:</span>
                  <span className="font-semibold text-slate-200">Artificial Intelligence • Graph Machine Learning • RAG Systems</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submission Status:</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Ready for External Defense & Evaluation
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Tip: Show this slide during viva introduction</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 hover:bg-teal-500/30 font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
