import re
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader

class PDFParser:
    """Extracts text and chunks from PDF research papers."""

    @staticmethod
    def extract_text_and_metadata(pdf_path: str) -> Dict[str, Any]:
        reader = PdfReader(pdf_path)
        full_text = ""
        pages_text = []

        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            # clean up multiple whitespaces
            cleaned = re.sub(r'\s+', ' ', text).strip()
            pages_text.append({"page": idx + 1, "text": cleaned})
            full_text += f"\n--- Page {idx + 1} ---\n" + cleaned

        # Attempt to extract title and abstract
        title = Path(pdf_path).stem.replace("_", " ").title()
        abstract = ""

        # Simple abstract extraction heuristic
        abstract_match = re.search(r'(?:abstract|summary)\s*[:\-\n](.*?)(?:introduction|keywords|1\.|background)', full_text, re.IGNORECASE | re.DOTALL)
        if abstract_match:
            abstract = abstract_match.group(1).strip()[:1200]
        elif len(pages_text) > 0 and len(pages_text[0]["text"]) > 100:
            abstract = pages_text[0]["text"][:600] + "..."

        return {
            "title": title,
            "full_text": full_text,
            "abstract": abstract,
            "page_count": len(reader.pages),
            "pages": pages_text
        }

    @staticmethod
    def chunk_text(pages_text: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
        chunks = []
        chunk_id = 0

        for page_info in pages_text:
            text = page_info["text"]
            words = text.split()
            if not words:
                continue

            i = 0
            while i < len(words):
                chunk_words = words[i:i + chunk_size]
                chunk_str = " ".join(chunk_words)
                if len(chunk_str.strip()) > 50:
                    chunks.append({
                        "chunk_id": chunk_id,
                        "page": page_info["page"],
                        "content": chunk_str
                    })
                    chunk_id += 1
                i += max(1, chunk_size - overlap)

        return chunks
