import math
from typing import List, Dict, Any, Optional
import networkx as nx
from backend.config import settings

class KnowledgeGraphEngine:
    """
    Manages the scientific knowledge graph using NetworkX.
    Exports React Flow compatible format and optionally syncs to Neo4j if configured.
    """

    NODE_COLORS = {
        "paper": {"bg": "#e0e7ff", "border": "#6366f1", "text": "#312e81"},          # Indigo
        "concept": {"bg": "#dbeafe", "border": "#3b82f6", "text": "#1e3a8a"},        # Blue
        "finding": {"bg": "#dcfce7", "border": "#22c55e", "text": "#14532d"},        # Green
        "research_area": {"bg": "#fef3c7", "border": "#f59e0b", "text": "#78350f"}   # Amber
    }

    def __init__(self, project_id: int):
        self.project_id = project_id
        self.graph = nx.DiGraph()

    def add_paper_node(self, paper_id: int, title: str):
        node_id = f"paper_{paper_id}"
        self.graph.add_node(
            node_id,
            label=title,
            node_type="paper",
            category="Paper",
            paper_id=paper_id
        )

    def add_concept_node(self, concept_name: str, domain: Optional[str] = None):
        node_id = f"concept_{concept_name.lower().replace(' ', '_')}"
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label=concept_name,
                node_type="concept",
                category="Concept",
                domain=domain or "General"
            )
        return node_id

    def add_finding_node(self, finding_id: str, summary: str, paper_id: int):
        node_id = f"finding_{finding_id}"
        self.graph.add_node(
            node_id,
            label=summary[:60] + "..." if len(summary) > 60 else summary,
            full_text=summary,
            node_type="finding",
            category="Finding",
            paper_id=paper_id
        )
        return node_id

    def add_research_area_node(self, area_name: str):
        node_id = f"area_{area_name.lower().replace(' ', '_')}"
        if not self.graph.has_node(node_id):
            self.graph.add_node(
                node_id,
                label=area_name,
                node_type="research_area",
                category="Research Area"
            )
        return node_id

    def add_relationship(
        self,
        source_id: str,
        target_id: str,
        rel_type: str = "RELATES_TO",
        source_paper: Optional[str] = None,
        explanation: Optional[str] = None
    ):
        if self.graph.has_node(source_id) and self.graph.has_node(target_id):
            self.graph.add_edge(
                source_id,
                target_id,
                label=rel_type,
                source_paper=source_paper or "Multiple Papers",
                explanation=explanation or ""
            )

    def find_multi_hop_connections(self, max_hops: int = 3) -> List[Dict[str, Any]]:
        """
        Identifies non-trivial multi-hop connections between concept nodes.
        e.g., A -> B -> C (Screen Exposure -> Sleep Quality -> Cognitive Performance).
        """
        concept_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("node_type") == "concept"]
        discovered_paths = []

        for source in concept_nodes:
            for target in concept_nodes:
                if source == target:
                    continue
                try:
                    all_simple_paths = list(nx.all_simple_paths(self.graph, source, target, cutoff=max_hops))
                    for path in all_simple_paths:
                        if len(path) >= 3:  # at least 1 intermediate concept
                            path_names = [self.graph.nodes[n].get("label", n) for n in path]
                            edges_info = []
                            for i in range(len(path) - 1):
                                edge_data = self.graph.get_edge_data(path[i], path[i+1]) or {}
                                edges_info.append({
                                    "from": path_names[i],
                                    "to": path_names[i+1],
                                    "type": edge_data.get("label", "RELATES_TO"),
                                    "source_paper": edge_data.get("source_paper", "N/A")
                                })
                            discovered_paths.append({
                                "source": path_names[0],
                                "intermediate": path_names[1:-1],
                                "target": path_names[-1],
                                "path_length": len(path) - 1,
                                "steps": edges_info,
                                "summary": f"{path_names[0]} affects {path_names[-1]} via {' -> '.join(path_names[1:-1])}"
                            })
                except Exception:
                    continue

        return discovered_paths

    def to_react_flow(self) -> Dict[str, Any]:
        """
        Formats graph nodes and edges into React Flow format with layout coordinates.
        """
        nodes = []
        edges = []

        # Simple radial/layered layout
        node_list = list(self.graph.nodes(data=True))
        n_nodes = len(node_list)
        radius = max(200, n_nodes * 25)

        for i, (node_id, data) in enumerate(node_list):
            node_type = data.get("node_type", "concept")
            angle = (2 * math.pi * i) / max(1, n_nodes)
            
            # Position by node type rings
            multiplier = 0.5 if node_type == "research_area" else (0.8 if node_type == "concept" else 1.2)
            pos_x = 400 + int(radius * multiplier * math.cos(angle))
            pos_y = 350 + int(radius * multiplier * math.sin(angle))

            colors = self.NODE_COLORS.get(node_type, self.NODE_COLORS["concept"])

            nodes.append({
                "id": node_id,
                "type": "custom",
                "position": {"x": pos_x, "y": pos_y},
                "data": {
                    "id": node_id,
                    "label": data.get("label", node_id),
                    "category": data.get("category", "Concept"),
                    "nodeType": node_type,
                    "bgColor": colors["bg"],
                    "borderColor": colors["border"],
                    "textColor": colors["text"],
                    "details": data
                }
            })

        for u, v, data in self.graph.edges(data=True):
            edge_id = f"edge_{u}_{v}"
            edges.append({
                "id": edge_id,
                "source": u,
                "target": v,
                "label": data.get("label", "RELATES_TO"),
                "animated": True,
                "style": {"stroke": "#64748b", "strokeWidth": 2},
                "data": {
                    "source_paper": data.get("source_paper", ""),
                    "explanation": data.get("explanation", "")
                }
            })

        return {"nodes": nodes, "edges": edges}
