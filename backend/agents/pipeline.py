import json
import logging
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from backend.models.orm_models import Project, Paper, Connection, Hypothesis
from backend.rag.pdf_parser import PDFParser
from backend.rag.vector_store import VectorStore
from backend.graph.graph_engine import KnowledgeGraphEngine
from backend.agents.research_agent import ResearchAnalysisAgent
from backend.agents.connection_agent import ConnectionDiscoveryAgent
from backend.agents.hypothesis_agent import HypothesisGeneratorAgent
from backend.agents.critic_agent import CriticAgent

logger = logging.getLogger(__name__)

class ResearchPipeline:
    """
    Coordinates the 4-agent scientific discovery pipeline:
    1. Research Analysis Agent (with RAG)
    2. Knowledge Graph Building
    3. Connection Discovery Agent (multi-hop traversal)
    4. Hypothesis Generator Agent
    5. Critic Agent (evaluation & ranking)
    """

    def __init__(self, db: Session, project_id: int):
        self.db = db
        self.project_id = project_id
        self.vector_store = VectorStore(project_id=project_id)
        self.graph_engine = KnowledgeGraphEngine(project_id=project_id)
        self.research_agent = ResearchAnalysisAgent(self.vector_store)
        self.connection_agent = ConnectionDiscoveryAgent(self.graph_engine)
        self.hypothesis_agent = HypothesisGeneratorAgent()
        self.critic_agent = CriticAgent()

    def run(self) -> Dict[str, Any]:
        project = self.db.query(Project).filter(Project.id == self.project_id).first()
        if not project:
            raise ValueError(f"Project {self.project_id} not found")

        project.status = "analyzing"
        self.db.commit()

        # Step 0: Ingest uploaded papers into RAG Vector Store & Graph
        papers = self.db.query(Paper).filter(Paper.project_id == self.project_id).all()
        project_info = {
            "title": project.title,
            "research_topic": project.research_topic,
            "research_question": project.research_question,
            "research_area": project.research_area
        }

        # Add Research Area node to Knowledge Graph
        self.graph_engine.add_research_area_node(project.research_area)

        papers_data = []
        for paper in papers:
            self.graph_engine.add_paper_node(paper.id, paper.title)
            # Link paper to research area
            self.graph_engine.add_relationship(
                f"paper_{paper.id}",
                f"area_{project.research_area.lower().replace(' ', '_')}",
                rel_type="RELATES_TO",
                source_paper=paper.title
            )

            # Ingest text chunks into RAG vector store if PDF exists
            try:
                extracted = PDFParser.extract_text_and_metadata(paper.file_path)
                chunks = PDFParser.chunk_text(extracted["pages"])
                self.vector_store.add_paper_chunks(paper.id, paper.title, chunks)
                if not paper.abstract:
                    paper.abstract = extracted.get("abstract", "")
            except Exception as e:
                logger.warning(f"Could not parse PDF for paper {paper.id}: {e}")

            papers_data.append({
                "id": paper.id,
                "title": paper.title,
                "abstract": paper.abstract or ""
            })

        # Step 1: Agent 1 - Research Analysis Agent
        analysis_result = self.research_agent.analyze(project_info, papers_data)

        # Update knowledge graph with extracted concepts and findings
        for concept in analysis_result.get("concepts", []):
            self.graph_engine.add_concept_node(concept, domain=project.research_area)

        for idx, finding in enumerate(analysis_result.get("findings", [])):
            finding_node_id = self.graph_engine.add_finding_node(
                f"{self.project_id}_{idx}",
                finding.get("summary", ""),
                paper_id=papers[0].id if papers else 1
            )

        for rel in analysis_result.get("relationships", []):
            src = self.graph_engine.add_concept_node(rel.get("source", ""))
            tgt = self.graph_engine.add_concept_node(rel.get("target", ""))
            self.graph_engine.add_relationship(
                src,
                tgt,
                rel_type=rel.get("relation", "RELATES_TO"),
                source_paper=rel.get("source_paper", ""),
                explanation=rel.get("explanation", "")
            )

        # Step 2: Agent 2 - Connection Discovery Agent
        discovered_connections = self.connection_agent.discover(project_info, analysis_result)
        
        # Clear previous connections and save new
        self.db.query(Connection).filter(Connection.project_id == self.project_id).delete()
        for conn_data in discovered_connections:
            conn = Connection(
                project_id=self.project_id,
                source_concept=conn_data.get("source_concept", ""),
                intermediate_concepts=conn_data.get("intermediate_concepts", []),
                target_concept=conn_data.get("target_concept", ""),
                relationship_type=conn_data.get("relationship_type", "AFFECTS"),
                explanation=conn_data.get("explanation", ""),
                significance=conn_data.get("significance", "Novel Pathway"),
                source_papers=conn_data.get("source_papers", [])
            )
            self.db.add(conn)

            # Ensure high-level discovered bridge is reflected in Knowledge Graph
            src_node = self.graph_engine.add_concept_node(conn_data.get("source_concept", ""))
            tgt_node = self.graph_engine.add_concept_node(conn_data.get("target_concept", ""))
            self.graph_engine.add_relationship(
                src_node,
                tgt_node,
                rel_type=conn_data.get("relationship_type", "MEDIATES"),
                source_paper=", ".join(conn_data.get("source_papers", [])),
                explanation=conn_data.get("explanation", "")
            )

        # Save React Flow serialized graph into project
        rf_graph = self.graph_engine.to_react_flow()
        project.graph_data = rf_graph

        # Optional sync to external Neo4j database if configured in .env
        try:
            from backend.graph.neo4j_adapter import Neo4jAdapter
            neo = Neo4jAdapter()
            neo.sync_graph(rf_graph["nodes"], rf_graph["edges"])
            neo.close()
        except Exception:
            pass

        # Step 3: Agent 3 - Hypothesis Generator Agent
        raw_hypotheses = self.hypothesis_agent.generate(
            project_info,
            analysis_result.get("findings", []),
            discovered_connections
        )

        # Step 4: Agent 4 - Critic Agent Evaluation
        self.db.query(Hypothesis).filter(Hypothesis.project_id == self.project_id).delete()

        created_hypotheses = []
        research_area = project_info.get("research_area", "")
        for idx, h_data in enumerate(raw_hypotheses):
            if idx > 0:
                time.sleep(1.5)  # Pacing delay to avoid Gemini free-tier rate limits
            eval_data = self.critic_agent.evaluate_hypothesis(h_data, research_area=research_area)

            hypo = Hypothesis(
                project_id=self.project_id,
                title=h_data.get("title", "Generated Hypothesis"),
                statement=h_data.get("statement", ""),
                rationale=h_data.get("rationale", ""),
                independent_var=h_data.get("independent_var", ""),
                dependent_var=h_data.get("dependent_var", ""),
                expected_outcome=h_data.get("expected_outcome", ""),
                supporting_evidence=h_data.get("supporting_evidence", []),
                supporting_papers=h_data.get("supporting_papers", []),
                novelty_score=eval_data["novelty_score"],
                testability_score=eval_data["testability_score"],
                plausibility_score=eval_data["plausibility_score"],
                falsifiability_score=eval_data["falsifiability_score"],
                overall_score=eval_data["overall_score"],
                critique=eval_data["critique"]
            )
            self.db.add(hypo)
            created_hypotheses.append(hypo)

        project.status = "completed"
        self.db.commit()

        return {
            "status": "completed",
            "project_id": self.project_id,
            "concepts_count": len(analysis_result.get("concepts", [])),
            "connections_count": len(discovered_connections),
            "hypotheses_count": len(created_hypotheses)
        }
