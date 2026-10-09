import { useState, useEffect } from "react";
import { AuthModal } from "./components/AuthModal";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NewProjectPage } from "./pages/NewProjectPage";
import { KnowledgeGraphView } from "./components/KnowledgeGraphView";
import { HypothesisCard } from "./components/HypothesisCard";
import { ResearchCopilotChat } from "./components/ResearchCopilotChat";
import {
  api,
  type Project,
  type Paper,
  type Connection,
  type Hypothesis,
  type GraphData,
  type User,
} from "./services/api";
import {
  Atom,
  LayoutDashboard,
  PlusCircle,
  FolderGit2,
  FileText,
  Network,
  GitFork,
  Sparkles,
  RefreshCw,
  Trash2,
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  LogIn,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Sun,
  Moon,
} from "lucide-react";

export function App() {
  const [activeTab, setActiveTab] = useState<string>("landing");
  // Sub-navigation for main app: "dashboard" | "new-project" | "projects" | "papers" | "graph" | "connections" | "hypotheses"
  const [activeNav, setActiveNav] = useState<string>("dashboard");

  // Theme switcher state: 'light' | 'dark'
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hypothesis_theme");
      if (saved === "dark" || saved === "light") return saved;
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("hypothesis_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Selected project details
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [projectSearchQuery, setProjectSearchQuery] = useState<string>("");
  const [hypothesisFilter, setHypothesisFilter] = useState<"all" | "validated" | "saved">("all");

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Check auth session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Reload projects whenever user state changes (login, logout, switch user)
  useEffect(() => {
    loadProjects();
  }, [user]);

  const checkSession = async () => {
    try {
      const u = await api.getMe();
      if (u) setUser(u);
    } catch {
      // Not logged in
    }
  };

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);

      // If no project is selected and we have projects, auto-select the first one for context
      if (data.length > 0 && !selectedProjectId) {
        loadProjectData(data[0].id);
      }
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    loadProjects();
    showNotification("success", "Logged out successfully");
  };

  // Load complete project details
  const loadProjectData = async (projectId: number) => {
    try {
      setIsLoading(true);
      const [proj, pList, cList, hList, gData] = await Promise.all([
        api.getProject(projectId),
        api.getPapers(projectId),
        api.getConnections(projectId),
        api.getHypotheses(projectId),
        api.getKnowledgeGraph(projectId),
      ]);
      const sanitizedHypotheses = (hList || []).map((h) => {
        if (h.critique && h.critique.toLowerCase().includes("critic evaluation unavailable")) {
          return {
            ...h,
            novelty_score: null,
            testability_score: null,
            plausibility_score: null,
            falsifiability_score: null,
            overall_score: null,
          };
        }
        return h;
      });
      setSelectedProjectId(projectId);
      setSelectedProject(proj);
      setPapers(pList);
      setConnections(cList);
      setHypotheses(sanitizedHypotheses);
      setGraphData(gData);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load project details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async (id: number, targetNav: string = "hypotheses") => {
    await loadProjectData(id);
    setActiveNav(targetNav);
  };

  // Create Project & Run Pipeline
  const handleCreateProject = async (data: {
    title: string;
    research_topic: string;
    research_question: string;
    research_area: string;
    files: File[];
  }) => {
    try {
      setIsLoading(true);
      // 1. Create project
      const newProj = await api.createProject({
        title: data.title,
        research_topic: data.research_topic,
        research_question: data.research_question,
        research_area: data.research_area,
      });

      // 2. Upload PDFs
      await api.uploadPapers(newProj.id, data.files);

      // 3. Switch context & clear previous scores
      setSelectedProjectId(newProj.id);
      setSelectedProject(newProj);
      setActiveTab("app");
      setActiveNav("hypotheses");
      setHypotheses([]); // Clear previous hypotheses/scores
      setIsAnalyzing(true);

      // 4. Trigger 4-agent analysis
      await api.startAnalysis(newProj.id);

      // 5. Reload completed data
      await loadProjects();
      await loadProjectData(newProj.id);
      showNotification("success", "Research synthesized successfully! 4 AI Agents completed work.");
    } catch (err: any) {
      showNotification("error", err.message || "Pipeline execution failed");
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  // Re-run analysis on existing project
  const handleRunAnalysis = async () => {
    if (!selectedProjectId) return;
    try {
      setIsAnalyzing(true);
      setHypotheses([]); // Clear previous critic scores before displaying new evaluation
      await api.startAnalysis(selectedProjectId);
      await loadProjects();
      await loadProjectData(selectedProjectId);
      showNotification("success", "Re-analysis completed by the 4 AI Agents!");
    } catch (err: any) {
      showNotification("error", err.message || "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save / Bookmark Hypothesis
  const handleSaveHypothesis = async (id: number) => {
    try {
      const updated = await api.toggleSaveHypothesis(id);
      setHypotheses((prev) => prev.map((h) => (h.id === id ? updated : h)));
      showNotification("success", updated.is_saved ? "Hypothesis saved" : "Hypothesis removed from saved");
    } catch (err: any) {
      showNotification("error", "Failed to update hypothesis save state");
    }
  };

  // Refine Hypothesis with Critic
  const handleRefineHypothesis = async (id: number) => {
    try {
      const refined = await api.refineHypothesis(id);
      setHypotheses((prev) => prev.map((h) => (h.id === id ? refined : h)));
      showNotification("success", "Hypothesis refined and re-evaluated by Critic Agent!");
    } catch (err: any) {
      showNotification("error", err.message || "Failed to refine hypothesis");
    }
  };

  // 1-Click Evaluate Hypothesis with Critic
  const handleEvaluateHypothesis = async (id: number) => {
    try {
      const updated = await api.evaluateHypothesis(id);
      setHypotheses((prev) => prev.map((h) => (h.id === id ? updated : h)));
      showNotification("success", "Critic evaluation completed!");
    } catch (err: any) {
      showNotification("error", err.message || "Failed to evaluate hypothesis");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this research project?")) return;
    try {
      await api.deleteProject(id);
      if (selectedProjectId === id) {
        const remaining = projects.filter((p) => p.id !== id);
        if (remaining.length > 0) {
          await loadProjectData(remaining[0].id);
        } else {
          setSelectedProjectId(null);
          setSelectedProject(null);
        }
      }
      await loadProjects();
      showNotification("success", "Project deleted");
    } catch (err: any) {
      showNotification("error", "Failed to delete project");
    }
  };

  // Upload more papers to existing project
  const handleUploadAdditionalPapers = async (files: FileList | null) => {
    if (!selectedProjectId || !files || files.length === 0) return;
    const pdfs = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) {
      showNotification("error", "Please select valid PDF files");
      return;
    }

    try {
      setIsLoading(true);
      await api.uploadPapers(selectedProjectId, pdfs);
      await loadProjectData(selectedProjectId);
      showNotification("success", `${pdfs.length} paper(s) uploaded. Click 'Re-Analyze' to update graph.`);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to upload papers");
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation Items for the Left Sidebar (The exact 7 items required)
  const sidebarNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "new-project", label: "New Research", icon: PlusCircle },
    { id: "projects", label: "My Projects", icon: FolderGit2, badge: projects.length },
    { id: "papers", label: "Papers", icon: FileText, badge: papers.length },
    { id: "graph", label: "Knowledge Graph", icon: Network },
    { id: "connections", label: "Connections", icon: GitFork, badge: connections.length },
    { id: "hypotheses", label: "Hypotheses", icon: Sparkles, badge: hypotheses.length },
  ];

  // -------------------------------------------------------------
  // VIEW 1: MINIMAL LANDING PAGE (LIGHT THEME ONLY)
  // -------------------------------------------------------------
  if (activeTab === "landing") {
    return (
      <div className="min-h-screen bg-white text-slate-900 font-sans">
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            loadProjects();
            setActiveTab("app");
            setActiveNav("dashboard");
            showNotification("success", `Welcome back, ${loggedInUser.name}!`);
          }}
        />

        <LandingPage
          onStartResearch={() => {
            setActiveTab("app");
            setActiveNav("new-project");
          }}
          onGoDashboard={() => {
            setActiveTab("app");
            setActiveNav("dashboard");
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          user={user}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: APPLICATION DASHBOARD WITH PROPER LEFT SIDEBAR
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200">
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          loadProjects();
          showNotification("success", `Welcome, ${loggedInUser.name}!`);
        }}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs font-medium border animate-fadeIn ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* LEFT SIDEBAR                                              */}
      {/* ========================================================= */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 transition-colors duration-200">
        <div>
          {/* Logo & Platform Info */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div
              onClick={() => setActiveTab("landing")}
              className="flex items-center gap-2.5 cursor-pointer group"
              title="Return to Public Landing Page"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                <Atom className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                  Hypothesis<span className="text-blue-700 dark:text-blue-400">AI</span>
                </h1>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 font-medium">
                  University Research Tool
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("landing")}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
              title="Public Home"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Active Project Switcher Context */}
          <div className="p-3 m-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
              Active Investigation
            </span>
            {selectedProject ? (
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 leading-snug">
                  {selectedProject.title}
                </p>
                <div className="flex items-center justify-between gap-1 mt-1.5 text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                    {selectedProject.research_area}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-semibold ${
                      selectedProject.status === "completed"
                        ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60"
                        : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60"
                    }`}
                  >
                    {selectedProject.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No project selected</p>
            )}
          </div>

          {/* 7 Core Sidebar Navigation Links */}
          <nav className="px-3 space-y-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-slate-800 dark:bg-blue-700 text-white" : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User Account */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 truncate pr-1">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                    {user.email}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 px-1">
                Viewing as <strong>Guest Researcher</strong>
              </div>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Save</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE CONTENT AREA                               */}
      {/* ========================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0 transition-colors duration-200">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => setActiveNav("dashboard")}
              className="hover:text-slate-900 dark:hover:text-white font-medium"
            >
              Workspace
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-800 dark:text-slate-200 font-semibold capitalize">
              {activeNav.replace("-", " ")}
            </span>
            {selectedProject && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-blue-700 dark:text-blue-400 font-medium truncate max-w-sm">
                  {selectedProject.title}
                </span>
              </>
            )}
          </div>

          {/* Quick Actions & Theme Switcher */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
              title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {selectedProject && (
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                title="Re-run the 4-agent analysis pipeline"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-700 dark:text-blue-400 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Analyzing..." : "Re-Analyze"}
              </button>
            )}
          </div>
        </header>

        {/* Content View Switching */}
        <div className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {/* 1. DASHBOARD OVERVIEW */}
          {activeNav === "dashboard" && (
            <DashboardPage
              projects={projects}
              user={user}
              onSelectProject={(id) => handleSelectProject(id, "hypotheses")}
              onCreateNew={() => setActiveNav("new-project")}
              onDeleteProject={handleDeleteProject}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {/* 2. NEW RESEARCH */}
          {activeNav === "new-project" && (
            <NewProjectPage
              onSubmit={handleCreateProject}
              isLoading={isLoading || isAnalyzing}
            />
          )}

          {/* 3. MY PROJECTS (PORTFOLIO LIST) */}
          {activeNav === "projects" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Research Projects Portfolio</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">All investigations stored in your workspace</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600"
                  />
                  <button
                    onClick={() => setActiveNav("new-project")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New Project
                  </button>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Projects Found</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Create your first research project or load the sample study.</p>
                  <button
                    onClick={() => setActiveNav("new-project")}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700"
                  >
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                  {projects
                    .filter((p) => p.title.toLowerCase().includes(projectSearchQuery.toLowerCase()))
                    .map((p) => (
                      <div
                        key={p.id}
                        className={`p-4 flex flex-wrap items-center justify-between gap-3 transition-colors ${
                          selectedProjectId === p.id ? "bg-blue-50/40 dark:bg-blue-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {p.research_area}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                                p.status === "completed"
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {p.status}
                            </span>
                            {selectedProjectId === p.id && (
                              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                                &bull; Active Context
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{p.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-xl truncate">
                            &ldquo;{p.research_question}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span>{p.paper_count} papers</span>
                          <span>{p.hypothesis_count} hypotheses</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteProject(p.id)}
                              className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSelectProject(p.id, "hypotheses")}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 text-xs font-medium transition-colors"
                            >
                              Open Investigation
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* 4. PAPERS VIEW */}
          {activeNav === "papers" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ingested Research Papers</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    PDF manuscripts parsed via RAG for:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">{selectedProject?.title || "Active Project"}</strong>
                  </p>
                </div>

                {selectedProjectId && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 cursor-pointer shadow-sm">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Additional PDFs</span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handleUploadAdditionalPapers(e.target.files)}
                    />
                  </label>
                )}
              </div>

              {!selectedProject ? (
                <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Please select an investigation first.</p>
                </div>
              ) : papers.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Papers Ingested</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Attach PDFs to enable multi-agent semantic extraction.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {papers.map((paper) => (
                    <div
                      key={paper.id}
                      className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{paper.title}</h4>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {(paper.file_size_bytes / 1024).toFixed(0)} KB &bull; {paper.filename}
                        </span>
                      </div>

                      {paper.abstract ? (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                            Abstract Summary:
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            {paper.abstract}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No abstract text recorded.</p>
                      )}

                      {paper.concepts && paper.concepts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[11px] text-slate-400 font-medium">Extracted Entities:</span>
                          {paper.concepts.map((concept, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. KNOWLEDGE GRAPH VIEW */}
          {activeNav === "graph" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Interactive Knowledge Graph</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Concept nodes, paper origins, and multi-hop edges for{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{selectedProject?.title || "Active Project"}</strong>
                </p>
              </div>

              <KnowledgeGraphView
                graphData={graphData}
                papers={papers}
                connections={connections}
              />
            </div>
          )}

          {/* 6. CONNECTIONS VIEW */}
          {activeNav === "connections" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Discovered Multi-Hop Connections</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Indirect semantic paths (A &rarr; B &rarr; C) spanning independent research papers
                </p>
              </div>

              {connections.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <GitFork className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Multi-Hop Connections Discovered</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Run the 4-Agent pipeline to compute transitive graph paths.</p>
                  <button
                    onClick={handleRunAnalysis}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700"
                  >
                    Run Discovery
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {connections.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {c.relationship_type || "AFFECTS"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Significance: <strong className="text-slate-700 dark:text-slate-300">{c.significance || "Novel Pathway"}</strong>
                        </span>
                      </div>

                      {/* Path Diagram */}
                      <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium">
                        <span className="px-2 py-1 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-bold">
                          {c.source_concept}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        {c.intermediate_concepts && c.intermediate_concepts.length > 0 ? (
                          c.intermediate_concepts.map((mid, idx) => (
                            <span key={idx} className="flex items-center gap-1.5">
                              <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                                {mid}
                              </span>
                              <ArrowRight className="w-4 h-4 text-slate-400" />
                            </span>
                          ))
                        ) : (
                          <>
                            <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                              Intermediary Signaling
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </>
                        )}
                        <span className="px-2 py-1 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 font-bold">
                          {c.target_concept}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{c.explanation}</p>

                      {c.source_papers && c.source_papers.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span className="font-medium">Connecting Papers:</span>
                          {c.source_papers.map((sp, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono"
                            >
                              {sp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. HYPOTHESES VIEW */}
          {activeNav === "hypotheses" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Generated Hypotheses & Critic Scores</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formulated scientific hypotheses evaluated across Novelty, Testability, Plausibility, and Falsifiability
                  </p>
                </div>

                {selectedProjectId && (
                  <button
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                    {isAnalyzing ? "Synthesizing..." : "Re-Generate"}
                  </button>
                )}
              </div>

              {hypotheses.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Hypotheses Generated</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Run the 4-agent analysis on an uploaded paper set to generate hypotheses.</p>
                  <button
                    onClick={handleRunAnalysis}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700"
                  >
                    Generate Hypotheses
                  </button>
                </div>
              ) : (() => {
                const evaluatedHypotheses = hypotheses.filter((h) => typeof h.overall_score === "number");
                const avgScore = evaluatedHypotheses.length > 0
                  ? (evaluatedHypotheses.reduce((acc, h) => acc + (h.overall_score || 0), 0) / evaluatedHypotheses.length).toFixed(1)
                  : null;
                const validatedCount = hypotheses.filter((h) => (h.overall_score || 0) >= 75).length;
                const savedCount = hypotheses.filter((h) => h.is_saved).length;

                const filteredHypotheses = hypotheses.filter((h) => {
                  if (hypothesisFilter === "validated") return (h.overall_score || 0) >= 75;
                  if (hypothesisFilter === "saved") return Boolean(h.is_saved);
                  return true;
                });

                return (
                  <div className="space-y-4">
                    {/* Executive Scientific Summary Bar */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Formulated:</span>
                          <strong className="text-slate-900 dark:text-white font-bold">{hypotheses.length} Hypotheses</strong>
                        </div>
                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Mean Rigor:</span>
                          <strong className="text-blue-600 dark:text-blue-400 font-bold">
                            {avgScore ? `${avgScore}% Quality` : "Pending Evaluation"}
                          </strong>
                        </div>
                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-medium">Validated:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {validatedCount} Candidate{validatedCount === 1 ? "" : "s"}
                          </strong>
                        </div>
                      </div>

                      {/* Filter Segmented Controls */}
                      <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          onClick={() => setHypothesisFilter("all")}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            hypothesisFilter === "all"
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          All ({hypotheses.length})
                        </button>
                        <button
                          onClick={() => setHypothesisFilter("validated")}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            hypothesisFilter === "validated"
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Validated ({validatedCount})
                        </button>
                        <button
                          onClick={() => setHypothesisFilter("saved")}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            hypothesisFilter === "saved"
                              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          Saved ({savedCount})
                        </button>
                      </div>
                    </div>

                    {/* Hypothesis Cards List */}
                    {filteredHypotheses.length === 0 ? (
                      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                        No hypotheses match the &ldquo;{hypothesisFilter}&rdquo; filter.
                      </div>
                    ) : (
                      filteredHypotheses.map((h, idx) => (
                        <HypothesisCard
                          key={h.id}
                          hypothesis={h}
                          index={idx + 1}
                          onSave={handleSaveHypothesis}
                          onRefine={handleRefineHypothesis}
                          onEvaluate={handleEvaluateHypothesis}
                          researchArea={selectedProject?.research_area}
                        />
                      ))
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* Floating Interactive Research Copilot AI Agent */}
      <ResearchCopilotChat
        project={selectedProject}
        paperCount={papers.length}
      />
    </div>
  );
}

export default App;
