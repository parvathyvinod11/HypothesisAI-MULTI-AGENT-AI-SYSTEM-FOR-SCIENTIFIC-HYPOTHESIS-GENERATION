import os
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.models.orm_models import Project, Paper, Hypothesis, Connection
from backend.rag.pdf_parser import PDFParser
from backend.rag.vector_store import VectorStore
from backend.agents.llm_client import LLMClient

logger = logging.getLogger(__name__)

# In-memory vector store cache per project
_VECTOR_STORE_CACHE: Dict[int, VectorStore] = {}

class ResearchCopilotAgent:
    """
    Interactive Scientific Research Copilot Agent.
    Enables conversational RAG literature discovery, method explanation,
    and hypothesis refinement grounded directly in the user's uploaded papers.
    """

    def __init__(self, db: Session, project_id: int):
        self.db = db
        self.project_id = project_id
        self.vector_store = self._get_or_build_vector_store()

    def _get_or_build_vector_store(self) -> VectorStore:
        global _VECTOR_STORE_CACHE
        if self.project_id in _VECTOR_STORE_CACHE:
            return _VECTOR_STORE_CACHE[self.project_id]

        vstore = VectorStore(project_id=self.project_id)
        papers = self.db.query(Paper).filter(Paper.project_id == self.project_id).all()

        for paper in papers:
            chunks = []
            # Try to read actual PDF if file exists
            if paper.file_path and os.path.exists(paper.file_path):
                try:
                    extracted = PDFParser.extract_text_and_metadata(paper.file_path)
                    chunks = PDFParser.chunk_text(extracted.get("pages", []))
                except Exception as e:
                    logger.warning(f"Could not parse PDF for paper {paper.id}: {e}")

            # If no chunks were created from PDF, synthesize chunks from database metadata
            if not chunks:
                synthetic_text = f"Title: {paper.title}\n"
                if paper.abstract:
                    synthetic_text += f"Abstract: {paper.abstract}\n"
                if paper.key_findings:
                    findings_str = "; ".join(paper.key_findings) if isinstance(paper.key_findings, list) else str(paper.key_findings)
                    synthetic_text += f"Key Findings: {findings_str}\n"
                if paper.concepts:
                    concepts_str = ", ".join(paper.concepts) if isinstance(paper.concepts, list) else str(paper.concepts)
                    synthetic_text += f"Concepts: {concepts_str}\n"

                chunks = [{
                    "chunk_id": f"paper_{paper.id}_meta",
                    "page": 1,
                    "content": synthetic_text
                }]

            vstore.add_paper_chunks(paper.id, paper.title, chunks)

        _VECTOR_STORE_CACHE[self.project_id] = vstore
        return vstore

    def chat(self, user_message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        project = self.db.query(Project).filter(Project.id == self.project_id).first()
        if not project:
            return {
                "reply": "Project not found. Please select an active research project to chat.",
                "sources": []
            }

        # 1. Semantic search across the project's vector store
        rag_results = self.vector_store.search(user_message, top_k=5)

        # 2. Gather project context (hypotheses, connections, papers)
        papers = self.db.query(Paper).filter(Paper.project_id == self.project_id).all()
        hypotheses = self.db.query(Hypothesis).filter(Hypothesis.project_id == self.project_id).all()
        connections = self.db.query(Connection).filter(Connection.project_id == self.project_id).all()

        evidence_text = ""
        sources = []
        for r in rag_results:
            paper_title = r.get("paper_title", "Unknown Paper")
            page_num = r.get("page", 1)
            content_snippet = r.get("content", "")
            evidence_text += f"\n--- Source: [{paper_title}, Page {page_num}] ---\n{content_snippet[:600]}\n"
            sources.append({
                "paper_id": r.get("paper_id"),
                "paper_title": paper_title,
                "page": page_num,
                "excerpt": content_snippet[:220].strip() + ("..." if len(content_snippet) > 220 else ""),
                "similarity_score": r.get("similarity_score", 0.0)
            })

        # Summarize available hypotheses
        hypo_summary = ""
        if hypotheses:
            hypo_summary = "\n".join([
                f"- Hypothesis #{h.id}: {h.title} | Statement: '{h.statement[:120]}...' (Score: {h.overall_score or 'N/A'}/100)"
                for h in hypotheses[:4]
            ])

        # Summarize available graph connections
        conn_summary = ""
        if connections:
            conn_summary = "\n".join([
                f"- {c.source_concept} -> {c.target_concept} ({c.relationship_type}): {c.explanation[:120]}..."
                for c in connections[:4]
            ])

        # Build conversation history
        history_str = ""
        if history:
            for turn in history[-5:]:
                role = "Researcher" if turn.get("role") == "user" else "Copilot"
                history_str += f"{role}: {turn.get('content', '')}\n"

        system_instruction = (
            "You are a friendly, articulate, and intelligent scientific research assistant. "
            "You converse naturally like a knowledgeable research colleague (similar to ChatGPT or Claude). "
            "IMPORTANT RULES:\n"
            "1. NEVER use robotic phrases like 'Based on the provided literature excerpts', 'According to the RAG vector store', or 'In the retrieved text chunks'.\n"
            "2. Speak directly and conversationally: e.g., 'Across your papers, the key findings show...', 'The authors demonstrate that...', 'Looking at the methodology in [Paper Name]...'.\n"
            "3. Answer the user's question directly, clearly, and authoritatively.\n"
            "4. Organize your response with clean paragraphs, bold key concepts, and bullet points where helpful."
        )

        prompt = f"""
Current Research Context:
- Project: {project.title}
- Area: {project.research_area}
- Research Question: {project.research_question}
- Uploaded Papers ({len(papers)}): {', '.join([p.title for p in papers])}

Synthesized Hypotheses:
{hypo_summary or 'None generated yet.'}

Discovered Connections:
{conn_summary or 'None computed yet.'}

Evidence Found in Papers:
{evidence_text or 'No direct matches found.'}

Recent Conversation:
{history_str or 'First question.'}

User Message:
{user_message}

Please provide a helpful, natural, and direct conversational response:
"""

        fallback_text = self._build_domain_fallback_reply(user_message, rag_results, hypotheses, project)
        reply = LLMClient.generate_text(prompt, system_instruction=system_instruction, fallback_text=fallback_text)

        return {
            "reply": reply,
            "sources": sources
        }

    def _build_domain_fallback_reply(
        self,
        user_message: str,
        rag_results: List[Dict[str, Any]],
        hypotheses: List[Hypothesis],
        project: Project
    ) -> str:
        """Friendly conversational fallback when APIs are offline."""
        msg_lower = user_message.lower()

        if rag_results:
            top = rag_results[0]
            citations = [f"**{r['paper_title']}** (p. {r.get('page', 1)})" for r in rag_results[:3]]
            return (
                f"Across your papers for **{project.title}**, the primary findings highlight:\n\n"
                f"> \"{top.get('content', '')[:350].strip()}...\"\n\n"
                f"Key supporting papers include:\n"
                + "\n".join([f"- {c}" for c in citations]) + "\n\n"
                f"Would you like me to dive deeper into any specific study or explore how this impacts your hypotheses?"
            )
        elif "hypothes" in msg_lower and hypotheses:
            top_h = hypotheses[0]
            return (
                f"In this project, you currently have **{len(hypotheses)} hypotheses** formulated. For example:\n\n"
                f"* **{top_h.title}**: {top_h.statement}\n"
                f"* **Independent Variable**: `{top_h.independent_var}`\n"
                f"* **Dependent Variable**: `{top_h.dependent_var}`\n"
                f"* **Score**: `{top_h.overall_score or 'Pending'}/100`\n\n"
                f"Would you like me to suggest empirical testing protocols or refine its parameters?"
            )
        else:
            return (
                f"I'm here to help with **{project.title}**!\n\n"
                f"You can ask me to:\n"
                f"1. Summarize findings from any uploaded manuscript\n"
                f"2. Compare conflicting evidence across papers\n"
                f"3. Formulate testing protocols or independent/dependent variables\n"
                f"4. Refine your research hypotheses."
            )

