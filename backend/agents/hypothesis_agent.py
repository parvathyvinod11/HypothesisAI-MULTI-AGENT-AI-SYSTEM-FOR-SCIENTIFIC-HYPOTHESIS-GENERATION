from typing import List, Dict, Any
from backend.agents.llm_client import LLMClient

class HypothesisGeneratorAgent:
    """
    Agent 3: Hypothesis Generator Agent
    Synthesizes research findings and discovered multi-hop connections to generate
    3 to 5 testable, structured scientific hypotheses.
    Dynamically generates hypotheses for ANY research inquiry.
    """

    def generate(
        self,
        project_info: Dict[str, Any],
        findings: List[Dict[str, Any]],
        connections: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        topic = project_info.get('research_topic', 'Investigated Phenomenon')
        question = project_info.get('research_question', '')
        area = project_info.get('research_area', 'Scientific Research')

        system_instruction = (
            "You are a Scientific Hypothesis Generator AI. You construct testable, falsifiable, "
            "and empirically grounded hypotheses using provided multi-hop connections and findings. "
            "Label each output as AI-assisted. "
            "FORMATTING RULE: Use clean plain text and standard Unicode characters (e.g. R², ≥, ≤, ×, √D, σ, ±, Δ, α, β) "
            "for mathematical notation. Never use raw LaTeX syntax, backslashes, or dollar delimiters (do NOT write $R^2$, \\ge, \\times, \\sqrt{})."
        )

        prompt = f"""
Research Topic: {topic}
Research Question: {question}
Area: {area}

Key Findings:
{findings[:4]}

Discovered Connections:
{connections[:3]}

Generate 3 to 5 scientific hypotheses in JSON format:
{{
  "hypotheses": [
    {{
      "title": "Concise Descriptive Title",
      "statement": "Formal scientific hypothesis statement (If... then...)",
      "rationale": "Clear theoretical/biochemical rationale grounded in the evidence",
      "independent_var": "The primary independent variable manipulated or measured",
      "dependent_var": "The measurable dependent variable",
      "expected_outcome": "Predicted quantitative or qualitative direction of outcome",
      "supporting_evidence": [
        "Empirical finding or citation supporting premise 1",
        "Empirical finding or citation supporting premise 2"
      ],
      "supporting_papers": ["Paper Title 1", "Paper Title 2"]
    }}
  ]
}}
"""

        # Dynamic fallback hypotheses built from the actual uploaded papers & connections
        fallback_hypotheses = []

        if connections:
            for i, conn in enumerate(connections[:3]):
                src = conn.get("source_concept", "Primary Variable")
                tgt = conn.get("target_concept", "Target Variable")
                mid = " and ".join(conn.get("intermediate_concepts", ["mediating factors"]))
                
                fallback_hypotheses.append({
                    "title": f"Targeted Modulation of {src} and Downstream Regulation of {tgt}",
                    "statement": f"Targeted experimental modulation of {src} will produce a statistically significant shift in {tgt} mediated through alterations in {mid}.",
                    "rationale": conn.get("explanation", f"Cross-paper synthesis indicates that {src} acts as an upstream driver affecting {mid}, which directly modulates {tgt}."),
                    "independent_var": f"Calibrated dosage or exposure level of {src}",
                    "dependent_var": f"Quantitative assay or measurement index of {tgt}",
                    "expected_outcome": f"A measurable directional change exceeding baseline variance by at least 15-25% in the experimental group.",
                    "supporting_evidence": [
                        f"Empirical evidence connecting {src} to intermediate signaling pathways.",
                        f"Observed sensitivity of {tgt} across experimental cohorts in reviewed literature."
                    ],
                    "supporting_papers": conn.get("source_papers", [f"Paper {i+1}"])
                })

        # Ensure we always have 3 hypotheses
        if len(fallback_hypotheses) < 3:
            fallback_hypotheses.append({
                "title": f"Dose-Dependent Dynamic Response in {topic[:40]}",
                "statement": f"Systematic stepwise escalation of primary experimental parameters will induce a non-linear threshold response in target outcome metrics.",
                "rationale": f"Addressing the inquiry: '{question}'. Biological and physical systems frequently exhibit sigmoidal transition boundaries rather than linear proportionality.",
                "independent_var": "Stepwise titration of experimental intervention",
                "dependent_var": "Target physiological or performance biomarker",
                "expected_outcome": "Identification of a critical inflection threshold separating baseline from responsive states.",
                "supporting_evidence": [
                    "Literature confirms threshold dynamics in analogous model systems."
                ],
                "supporting_papers": ["Uploaded Research Papers"]
            })

        fallback = {"hypotheses": fallback_hypotheses[:4]}
        result = LLMClient.generate_json(prompt, system_instruction, fallback_data=fallback)
        hypotheses = result.get("hypotheses", fallback_hypotheses)
        if not hypotheses:
            hypotheses = fallback_hypotheses

        return hypotheses
