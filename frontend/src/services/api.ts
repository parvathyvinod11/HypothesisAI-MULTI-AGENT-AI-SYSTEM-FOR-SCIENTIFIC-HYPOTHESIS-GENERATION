const API_BASE = "http://localhost:8000/api";

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Project {
  id: number;
  title: string;
  research_topic: string;
  research_question: string;
  research_area: string;
  status: string;
  user_id?: number | null;
  is_owner?: boolean;
  created_at: string;
  paper_count: number;
  hypothesis_count: number;
  connection_count: number;
}

export interface Paper {
  id: number;
  project_id: number;
  title: string;
  filename: string;
  file_size_bytes: number;
  abstract?: string;
  key_findings: string[];
  concepts: string[];
  created_at: string;
}

export interface Connection {
  id: number;
  project_id: number;
  source_concept: string;
  intermediate_concepts: string[];
  target_concept: string;
  relationship_type: string;
  explanation: string;
  significance?: string;
  source_papers: string[];
}

export interface Hypothesis {
  id: number;
  project_id: number;
  title: string;
  statement: string;
  rationale: string;
  independent_var: string;
  dependent_var: string;
  expected_outcome: string;
  supporting_evidence: string[];
  supporting_papers: string[];
  novelty_score: number | null;
  testability_score: number | null;
  plausibility_score: number | null;
  falsifiability_score: number | null;
  overall_score: number | null;
  critique?: string;
  refinement_notes?: string;
  refinement_count: number;
  is_saved: boolean;
  created_at: string;
}

export interface GraphData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      id: string;
      label: string;
      category: string;
      nodeType: string;
      bgColor: string;
      borderColor: string;
      textColor: string;
      details?: any;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    data?: {
      source_paper?: string;
      explanation?: string;
    };
  }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatSource {
  paper_id?: number;
  paper_title: string;
  page?: number;
  excerpt: string;
  similarity_score?: number;
}

export interface ChatResponse {
  reply: string;
  sources: ChatSource[];
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("hypothesis_auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  async register(name: string, email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    const data = await res.json();
    localStorage.setItem("hypothesis_auth_token", data.access_token);
    return data;
  },

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Invalid email or password");
    }
    const data = await res.json();
    localStorage.setItem("hypothesis_auth_token", data.access_token);
    return data;
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem("hypothesis_auth_token");
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        localStorage.removeItem("hypothesis_auth_token");
        return null;
      }
      return res.json();
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem("hypothesis_auth_token");
  },

  // Projects
  async getProjects(scope?: string): Promise<Project[]> {
    const url = scope ? `${API_BASE}/projects?scope=${encodeURIComponent(scope)}` : `${API_BASE}/projects`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
  },

  async getProject(id: number): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch project");
    return res.json();
  },

  async createProject(data: { title: string; research_topic: string; research_question: string; research_area: string }): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
  },

  async deleteProject(id: number): Promise<void> {
    await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
  },

  async initDemoProject(): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/demo/init`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to initialize demo");
    return res.json();
  },

  async uploadPapers(projectId: number, files: File[]): Promise<Paper[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const token = localStorage.getItem("hypothesis_auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/projects/${projectId}/papers/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload papers");
    return res.json();
  },

  async getPapers(projectId: number): Promise<Paper[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/papers`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch papers");
    return res.json();
  },

  async startAnalysis(projectId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/analysis/start`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to start analysis");
    return res.json();
  },

  async getAnalysisStatus(projectId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/analysis/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch analysis status");
    return res.json();
  },

  async getConnections(projectId: number): Promise<Connection[]> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/analysis/connections`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch connections");
    return res.json();
  },

  async getKnowledgeGraph(projectId: number): Promise<GraphData> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/graph`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch knowledge graph");
    return res.json();
  },

  async getHypotheses(projectId: number): Promise<Hypothesis[]> {
    const res = await fetch(`${API_BASE}/hypotheses/project/${projectId}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch hypotheses");
    return res.json();
  },

  async toggleSaveHypothesis(id: number): Promise<Hypothesis> {
    const res = await fetch(`${API_BASE}/hypotheses/${id}/save`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to toggle save");
    return res.json();
  },

  async refineHypothesis(id: number): Promise<Hypothesis> {
    const res = await fetch(`${API_BASE}/hypotheses/${id}/refine`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to refine hypothesis");
    }
    return res.json();
  },

  async evaluateHypothesis(id: number): Promise<Hypothesis> {
    const res = await fetch(`${API_BASE}/hypotheses/${id}/evaluate`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to evaluate hypothesis");
    }
    return res.json();
  },

  async chatWithCopilot(
    projectId: number,
    message: string,
    history: ChatMessage[] = []
  ): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to get response from Research Copilot");
    }
    return res.json();
  }
};
