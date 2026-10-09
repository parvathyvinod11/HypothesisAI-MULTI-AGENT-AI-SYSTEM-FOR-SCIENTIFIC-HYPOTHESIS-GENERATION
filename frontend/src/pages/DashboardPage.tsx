import { useState } from "react";
import type { Project, User } from "../services/api";
import { FolderGit2, FileText, Sparkles, GitFork, ArrowRight, PlusCircle, Trash2, Lock, UserCheck, ShieldCheck } from "lucide-react";

interface DashboardPageProps {
  projects: Project[];
  user: User | null;
  onSelectProject: (id: number) => void;
  onCreateNew: () => void;
  onDeleteProject: (id: number) => void;
  onOpenAuth: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  projects,
  user,
  onSelectProject,
  onCreateNew,
  onDeleteProject,
  onOpenAuth,
}) => {
  const [filterQuery, setFilterQuery] = useState("");

  // Aggregate stats strictly across this user's displayed projects
  const totalPapers = projects.reduce((acc, p) => acc + (p.paper_count || 0), 0);
  const totalHypotheses = projects.reduce((acc, p) => acc + (p.hypothesis_count || 0), 0);
  const totalConnections = projects.reduce((acc, p) => acc + (p.connection_count || 0), 0);

  const filteredProjects = projects.filter((p) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.research_area.toLowerCase().includes(q) ||
      p.research_topic.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* User Workspace Status Banner */}
      {user ? (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-base">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {user.name}&rsquo;s Research Workspace
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <ShieldCheck className="w-3 h-3" />
                  Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user.email} &bull; Personal investigation workspace
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">Your Projects</span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{projects.length} Saved</span>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white">Guest Sandbox Mode</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Sign in to save private investigations to your personal research account.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Sign In to Save
          </button>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Research Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Overview of scientific investigations and multi-agent synthesis metrics</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Research Project
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Projects</span>
            <FolderGit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{projects.length}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Saved investigations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Papers Ingested</span>
            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalPapers}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">PDFs parsed & indexed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connections Found</span>
            <GitFork className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalConnections}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Multi-hop graph paths</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Hypotheses</span>
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalHypotheses}</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Evaluated by Critic Agent</span>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Investigations ({filteredProjects.length})
          </h3>

          {projects.length > 2 && (
            <input
              type="text"
              placeholder="Search investigations..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56 shadow-sm"
            />
          )}
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              No research projects found
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Start a new research investigation by uploading academic PDF manuscripts.
            </p>
            <div className="flex items-center justify-center">
              <button
                onClick={onCreateNew}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create New Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProjects.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {p.research_area}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        p.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : p.status === "analyzing"
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 animate-pulse"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    &ldquo;{p.research_question}&rdquo;
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2.5 font-mono text-[11px]">
                    <span>{p.paper_count} Papers</span>
                    <span>&bull;</span>
                    <span>{p.connection_count} Bridges</span>
                    <span>&bull;</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{p.hypothesis_count} Hypotheses</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectProject(p.id)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 text-xs font-medium transition-colors shadow-sm"
                    >
                      Open <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
