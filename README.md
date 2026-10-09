# HypothesisAI: Multi-Agent AI System for Scientific Hypothesis Generation

> An autonomous multi-agent framework that analyzes scientific literature, discovers latent cross-paper concept bridges using in-memory topological graphs, formulates operationalized scientific hypotheses, and subjects them to an automated peer-review critique loop.

---

## 🌟 Overview

Academic literature is growing exponentially, leading to deep domain fragmentation and information overload. While conventional keyword search and basic single-document RAG systems can answer direct questions about isolated papers, they cannot synthesize non-obvious, cross-study interdependencies or formulate novel, testable research hypotheses.

**HypothesisAI** addresses this challenge through an agentic, multi-stage discovery workflow:
1. **Literature Ingestion & Semantic Chunking:** Ingests research PDF manuscripts, extracts text, and creates a local TF-IDF semantic index.
2. **Concept & Finding Extraction (Agent 1):** Extracts verified scientific concepts, empirical findings, and relational triples.
3. **Knowledge Graph Topology (NetworkX):** Constructs an in-memory directed knowledge graph of papers, concepts, and relationships.
4. **Multi-Hop Bridge Discovery (Agent 2):** Performs breadth-first graph pathfinding ($k \ge 2$) to detect non-trivial bridges between concepts across distinct papers.
5. **Operationalized Hypothesis Synthesis (Agent 3):** Formulates falsifiable hypotheses with explicitly isolated Independent Variables (IV) and Dependent Variables (DV).
6. **Scientific Peer-Review & Scoring (Agent 4):** Evaluates hypotheses across 4 continuous dimensions (Novelty, Testability, Plausibility, Falsifiability) with on-demand iterative refinement.
7. **Conversational Literature Grounding:** Features an interactive **Research Copilot** chatbot grounded directly in the active project's papers and graph topology.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Tier 1: User Interface Layer                    │
│  React 19 • TypeScript • Tailwind CSS • React Flow (@xyflow) • Recharts│
│           • Hypothesis Studio • Research Copilot Chatbot UI            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Tier 2: API & Application Layer                     │
│    FastAPI Asynchronous Engine • Salted PBKDF2 & JWT Authentication    │
│    • Sequential Pipeline Orchestrator • Grounded Copilot Service       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│          Tier 3: Autonomous Multi-Agent Intelligence Layer             │
│                                                                        │
│  [Agent 1: Research Analysis]  ──►  [Agent 2: Graph Engine]           │
│   (PyPDF Parser, TF-IDF RAG)         (NetworkX In-Memory Topology)    │
│                                                   │                    │
│                                                   ▼                    │
│  [Agent 4: Critic & Scoring]   ◄──  [Agent 3: Connection Discovery]   │
│   (4-Axis Peer Review & Score)       (Multi-Hop Transitive Paths k>=2)│
│                                                                        │
│  [Interactive Research Copilot Agent] (Grounded Conversational RAG)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Tier 4: Persistence & Storage Layer                   │
│   SQLite Database (SQLAlchemy) • In-Memory TF-IDF Vector Store         │
│   • Google Gemini LLM API (gemini-1.5-flash) • Research PDF Storage    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 The Autonomous Multi-Agent Pipeline

### Agent 1: Research Analysis Agent (`backend/agents/research_agent.py`)
* Ingests research manuscripts using `pypdf`, extracts abstracts and sections, and computes term-frequency matrices.
* Extracts 8–15 domain concepts, empirical findings, and relational triples per manuscript.

### Agent 2: Connection Discovery Agent (`backend/agents/connection_agent.py`)
* Coordinates with the `KnowledgeGraphEngine` to run breadth-first shortest-path traversals on the NetworkX graph.
* Identifies latent bridges ($k \ge 2$ hops) connecting concepts that originate from completely distinct papers.

### Agent 3: Hypothesis Generator Agent (`backend/agents/hypothesis_agent.py`)
* Synthesizes empirical literature findings, research questions, and discovered multi-hop bridges.
* Enforces strict scientific operationalization:
  * **Formal Statement:** `If [intervention], then [measurable direction] because [rationale]`
  * **Independent Variable (IV):** Explicitly isolated with intervention/dosage metric.
  * **Dependent Variable (DV):** Explicitly isolated with quantitative measurement endpoint.
  * **Expected Outcome:** Directional empirical change.
  * **Literature Provenance:** Direct citations to source manuscripts.

### Agent 4: Scientific Critic Agent (`backend/agents/critic_agent.py`)
* Performs quantitative evaluation on a continuous 0.0–100.0 scale across 4 core scientific criteria:
  * **Novelty ($W_1 = 0.25$):** Non-obviousness beyond existing published literature.
  * **Testability ($W_2 = 0.30$):** Operational precision of variables and experimental feasibility.
  * **Plausibility ($W_3 = 0.25$):** Consistency with known domain mechanisms.
  * **Falsifiability ($W_4 = 0.20$):** Clarity of observable conditions that would refute the claim.
* **Composite Score:** $\text{Score} = (0.25 \times \text{Nov}) + (0.30 \times \text{Test}) + (0.25 \times \text{Plaus}) + (0.20 \times \text{Fals})$
* **Iterative Refinement Loop:** Enables human-in-the-loop automated refinement where the agent reformulates statements and tightens variable metrics in response to critique notes.

### Research Copilot Agent (`backend/agents/copilot_agent.py`)
* Conversational literature assistant grounded in the project's PDF chunks and knowledge graph.
* Formats LaTeX formulas into clean Unicode and answers questions about methods, conflicting findings, and experimental plans.

---

## 💻 Tech Stack

* **Frontend:**
  * **React 19** (`react: ^19.2.8`) & **Vite 8** (`vite: ^8.2.2`)
  * **TypeScript** (`~6.0.2`)
  * **Tailwind CSS** (`tailwindcss: ^3.4.17`)
  * **@xyflow/react** (`^12.11.6`) for interactive node-link graph visualization
  * **Recharts** (`^3.10.1`) for polar radar score visualization
  * **Lucide React** (`^1.41.0`) icons
* **Backend:**
  * **Python 3.10+** & **FastAPI** (`fastapi>=0.110.0`)
  * **Uvicorn** (`uvicorn>=0.28.0`) ASGI web server
  * **Pydantic v2** (`pydantic>=2.6.0`) request/response data validation
  * **SQLAlchemy** (`sqlalchemy>=2.0.25`) ORM with **SQLite**
  * **NetworkX** (`networkx>=3.2.1`) in-memory topological graph engine
  * **PyPDF** (`pypdf>=4.0.0`) PDF parsing and sliding-window chunking
  * **python-jose** & standard library `hashlib.pbkdf2_hmac` for salted JWT auth
* **AI & Retrieval:**
  * **Google Gemini API** (`google-generativeai>=0.4.0`) with `gemini-1.5-flash`
  * **In-Memory TF-IDF Vector Space Model** with Cosine Similarity and scientific keyword boosting

---

## 📁 Repository Directory Structure

```
.
├── backend/                              # FastAPI Backend Application
│   ├── config.py                         # Settings and environment loader
│   ├── main.py                           # Application entry point, CORS, static routes
│   ├── requirements.txt                  # Python dependencies
│   ├── agents/                           # Multi-Agent Discovery Engine
│   │   ├── connection_agent.py           # Agent 2: Multi-hop bridge discovery
│   │   ├── copilot_agent.py              # Conversational literature RAG agent
│   │   ├── critic_agent.py               # Agent 4: 4-axis peer-review and scoring
│   │   ├── hypothesis_agent.py           # Agent 3: Structured hypothesis generator
│   │   ├── llm_client.py                 # Gemini LLM caller with fallback handlers
│   │   ├── pipeline.py                   # Sequential orchestrator executing Agents 1-4
│   │   └── research_agent.py             # Agent 1: Literature analysis & extraction
│   ├── api/                              # REST API Router Endpoints
│   │   ├── analysis.py                   # Pipeline triggers and status polling
│   │   ├── auth.py                       # User registration, login, and JWT validation
│   │   ├── chat.py                       # Research Copilot chat endpoint
│   │   ├── graph.py                      # React Flow serialized graph endpoint
│   │   ├── hypotheses.py                 # Hypothesis listing, bookmarking, refinement
│   │   ├── papers.py                     # Multipart PDF uploads and catalog
│   │   └── projects.py                   # Project CRUD and demo dataset seeding
│   ├── graph/                            # Graph Subsystem
│   │   ├── graph_engine.py               # NetworkX DiGraph, radial layouts, React Flow
│   │   └── neo4j_adapter.py              # Optional external Neo4j sync adapter
│   ├── models/                           # Data Models
│   │   ├── database.py                   # SQLAlchemy engine and sessionmaker
│   │   ├── orm_models.py                 # Tables: User, Project, Paper, Connection, Hypothesis
│   │   └── schemas.py                    # Pydantic validation schemas
│   └── rag/                              # RAG Subsystem
│       ├── pdf_parser.py                 # PyPDF text extraction and sliding-window chunker
│       └── vector_store.py               # TF-IDF cosine similarity search engine
│
├── frontend/                             # React 19 Frontend Application
│   ├── package.json                      # Node.js project manifest
│   ├── vite.config.ts                    # Vite build configuration
│   ├── tailwind.config.js                # Tailwind CSS styling tokens
│   └── src/
│       ├── App.tsx                       # Master UI controller and state manager
│       ├── components/                   # Specialized UI Components
│       │   ├── AuthModal.tsx             # Login and registration modal
│       │   ├── HypothesisCard.tsx        # Hypothesis card with IV/DV badges and actions
│       │   ├── KnowledgeGraphView.tsx    # Interactive canvas (@xyflow/react)
│       │   ├── ResearchCopilotChat.tsx   # Conversational literature drawer
│       │   ├── ScoreRadar.tsx            # Multi-axis Recharts radar chart
│       │   └── ValidationAuditModal.tsx  # Detailed peer-review modal
│       ├── pages/                        # Page Views
│       │   ├── DashboardPage.tsx         # User workspace and project catalog
│       │   ├── LandingPage.tsx           # Product hero and feature overview
│       │   └── NewProjectPage.tsx        # Multi-step project creator and PDF uploader
│       ├── services/
│       │   └── api.ts                    # Native fetch HTTP client with auth headers
│       └── utils/
│           └── textUtils.ts              # LaTeX to Unicode formatting utility
│
├── data/                                 # Persistent File Storage
│   └── uploads/                          # User-uploaded PDF manuscripts
│       └── .gitkeep
│
├── .env.example                          # Environment variables template
├── run_servers.py                        # Unified dual-server launcher
├── start.bat                             # Windows single-click batch runner
└── README.md                             # Repository documentation
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
* **Python 3.10, 3.11, or 3.12** with `pip`
* **Node.js 18+ or 20+ LTS** with `npm`
* A **Google Gemini API Key** (Free tier available at [Google AI Studio](https://aistudio.google.com/))

### 2. Clone the Repository
```bash
git clone https://github.com/parvathyvinod11/HypothesisAI-MULTI-AGENT-AI-SYSTEM-FOR-SCIENTIFIC-HYPOTHESIS-GENERATION.git
cd HypothesisAI-MULTI-AGENT-AI-SYSTEM-FOR-SCIENTIFIC-HYPOTHESIS-GENERATION
```

### 3. Backend Setup
Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:
```bash
pip install -r backend/requirements.txt
```

### 4. Frontend Setup
Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 5. Environment Configuration
Copy the template configuration file:
```bash
# Windows (cmd / powershell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and add your Google Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-1.5-flash"
SECRET_KEY="your-secret-key-change-in-production"
DATABASE_URL="sqlite:///./data/hypothesis.db"
```

---

## 🏃 Running the Application

### Option A: Unified Launcher (Recommended)
Launch both the FastAPI backend and Vite frontend concurrently with a single command:
```bash
python run_servers.py
```
*On Windows, you can also double-click `start.bat`.*

### Option B: Separate Terminals

**Terminal 1 — Backend (Port 8000):**
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

### Accessing the Services
* **Web Application UI:** `http://localhost:5173`
* **Interactive API Documentation (Swagger):** `http://localhost:8000/docs`
* **Backend Health Probe:** `http://localhost:8000/api/health`

---

## 📡 REST API Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Service and database health check |
| `/api/auth/register` | `POST` | User registration with PBKDF2 hashing |
| `/api/auth/login` | `POST` | User login and JWT token issuance |
| `/api/auth/me` | `GET` | Authenticated user profile |
| `/api/projects` | `GET`, `POST` | List and create research projects |
| `/api/projects/{id}` | `GET`, `DELETE`| Retrieve project details or cascade delete |
| `/api/projects/demo/init` | `POST` | Seed demonstration research project |
| `/api/projects/{id}/papers/upload` | `POST` | Multipart PDF upload and chunking |
| `/api/projects/{id}/papers` | `GET` | List ingested papers and extracted concepts |
| `/api/projects/{id}/analysis/start` | `POST` | Trigger autonomous 4-agent discovery pipeline |
| `/api/projects/{id}/analysis/status` | `GET` | Poll pipeline execution status |
| `/api/projects/{id}/analysis/connections` | `GET` | Retrieve cross-paper multi-hop bridge pathways |
| `/api/projects/{id}/graph` | `GET` | Retrieve serialized React Flow graph |
| `/api/hypotheses/project/{id}` | `GET` | List generated hypotheses with scores |
| `/api/hypotheses/{id}/save` | `PATCH` | Bookmark or save hypothesis |
| `/api/hypotheses/{id}/evaluate` | `POST` | On-demand Critic Agent re-scoring |
| `/api/hypotheses/{id}/refine` | `POST` | Human-in-the-loop iterative refinement pass |
| `/api/projects/{id}/chat` | `POST` | Conversational Literature Copilot query |

---

## 📄 License
This project is developed as an academic capstone and research framework. Distributed under the **MIT License**.
