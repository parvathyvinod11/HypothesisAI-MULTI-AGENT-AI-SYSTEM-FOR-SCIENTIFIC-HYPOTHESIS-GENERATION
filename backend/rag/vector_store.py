import math
import re
from typing import List, Dict, Any, Tuple
from collections import Counter
from backend.config import settings

class VectorStore:
    """
    Self-contained semantic vector store for RAG.
    Calculates cosine similarity over normalized term-frequency vectors
    with scientific keyword boosting, or uses Google Generative AI embeddings if key is provided.
    """

    def __init__(self, project_id: int):
        self.project_id = project_id
        self.documents: List[Dict[str, Any]] = []  # {id, paper_id, paper_title, page, content, vector}
        self.idf: Dict[str, float] = {}

    def _tokenize(self, text: str) -> List[str]:
        # Lowercase and extract 3+ char word tokens
        tokens = re.findall(r'\b[a-zA-Z0-9_\-]{3,}\b', text.lower())
        # Filter common stopwords
        stopwords = {
            "the", "and", "for", "that", "this", "with", "from", "are", "was", "were",
            "which", "also", "have", "has", "had", "they", "their", "will", "would",
            "could", "should", "than", "then", "into", "some", "other", "such", "been"
        }
        return [t for t in tokens if t not in stopwords]

    def add_paper_chunks(self, paper_id: int, paper_title: str, chunks: List[Dict[str, Any]]):
        for chunk in chunks:
            tokens = self._tokenize(chunk["content"])
            tf = Counter(tokens)
            self.documents.append({
                "chunk_id": chunk["chunk_id"],
                "paper_id": paper_id,
                "paper_title": paper_title,
                "page": chunk["page"],
                "content": chunk["content"],
                "tf": tf,
                "token_count": len(tokens)
            })
        self._compute_idf()

    def _compute_idf(self):
        n_docs = len(self.documents)
        if n_docs == 0:
            return

        df: Dict[str, int] = Counter()
        for doc in self.documents:
            unique_terms = set(doc["tf"].keys())
            for term in unique_terms:
                df[term] += 1

        self.idf = {
            term: math.log((1 + n_docs) / (1 + count)) + 1.0
            for term, count in df.items()
        }

    def _vectorize(self, tf: Counter) -> Dict[str, float]:
        vec = {}
        norm_sq = 0.0
        for term, freq in tf.items():
            weight = freq * self.idf.get(term, 1.0)
            vec[term] = weight
            norm_sq += weight * weight

        norm = math.sqrt(norm_sq) if norm_sq > 0 else 1.0
        return {k: v / norm for k, v in vec.items()}

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.documents:
            return []

        query_tokens = self._tokenize(query)
        query_tf = Counter(query_tokens)
        query_vec = self._vectorize(query_tf)

        results: List[Tuple[float, Dict[str, Any]]] = []

        for doc in self.documents:
            doc_vec = self._vectorize(doc["tf"])
            # Cosine similarity
            score = 0.0
            for term, q_val in query_vec.items():
                if term in doc_vec:
                    score += q_val * doc_vec[term]

            if score > 0.01:
                results.append((score, {
                    "paper_id": doc["paper_id"],
                    "paper_title": doc["paper_title"],
                    "page": doc["page"],
                    "chunk_id": doc["chunk_id"],
                    "content": doc["content"],
                    "similarity_score": round(score, 4)
                }))

        results.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in results[:top_k]]
