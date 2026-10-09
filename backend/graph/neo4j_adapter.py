import logging
import re
from typing import List, Dict, Any, Optional
from backend.config import settings

logger = logging.getLogger(__name__)

class Neo4jAdapter:
    """
    Optional Neo4j synchronizer.
    If NEO4J_URI is configured in .env, syncs nodes and relationships via Cypher queries.
    If not configured, operates in no-op mode without throwing errors.
    """

    def __init__(self):
        self.driver = None
        if settings.NEO4J_URI:
            try:
                from neo4j import GraphDatabase
                self.driver = GraphDatabase.driver(
                    settings.NEO4J_URI,
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
                )
                logger.info("Connected to Neo4j database successfully.")
            except Exception as e:
                logger.warning(f"Could not connect to Neo4j: {e}. Running with internal graph engine.")

    def sync_graph(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]):
        if not self.driver:
            return

        try:
            with self.driver.session() as session:
                # Merge nodes
                for node in nodes:
                    node_id = node.get("id")
                    data = node.get("data", {})
                    label = data.get("label", node_id)
                    category = re.sub(r'[^A-Za-z0-9_]', '', data.get("category", "Concept")) or "Concept"

                    query = f"""
                    MERGE (n:{category} {{id: $id}})
                    SET n.name = $name, n.details = $details
                    """
                    session.run(query, id=node_id, name=label, details=str(data.get("details", "")))

                # Merge edges
                for edge in edges:
                    src = edge.get("source")
                    tgt = edge.get("target")
                    raw_rel = edge.get("label", "RELATES_TO").upper()
                    rel_type = re.sub(r'[^A-Z0-9_]', '_', raw_rel).strip('_') or "RELATES_TO"
                    source_paper = edge.get("data", {}).get("source_paper", "")

                    query = f"""
                    MATCH (a {{id: $src}})
                    MATCH (b {{id: $tgt}})
                    MERGE (a)-[r:{rel_type}]->(b)
                    SET r.source_paper = $source_paper
                    """
                    session.run(query, src=src, tgt=tgt, source_paper=source_paper)
            logger.info("Knowledge Graph synchronized to Neo4j successfully.")
        except Exception as e:
            logger.warning(f"Neo4j sync failed: {e}")

    def close(self):
        if self.driver:
            self.driver.close()
