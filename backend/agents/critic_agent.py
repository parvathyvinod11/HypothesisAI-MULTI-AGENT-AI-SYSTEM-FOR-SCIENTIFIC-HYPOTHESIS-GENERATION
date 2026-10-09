from typing import List, Dict, Any, Optional
from backend.agents.llm_client import LLMClient
import logging

logger = logging.getLogger(__name__)

class CriticAgent:
    """
    Agent 4: Autonomous Scientific Critic Agent
    Performs rigorous, hypothesis-specific peer review across:
    - Novelty (0-100)
    - Operational Testability (0-100)
    - Technical / Empirical Plausibility (0-100)
    - Falsifiability (0-100)
    
    Dynamically adapts evaluation criteria based on the research domain.
    Never assigns identical default scores; evaluates actual statements, variables, and literature evidence.
    """

    def evaluate_hypothesis(self, hypothesis: Dict[str, Any], research_area: str = "") -> Dict[str, Any]:
        title = hypothesis.get("title", "").strip() or "Untitled Hypothesis"
        statement = hypothesis.get("statement", "").strip()
        rationale = hypothesis.get("rationale", "").strip()
        iv = hypothesis.get("independent_var", "").strip()
        dv = hypothesis.get("dependent_var", "").strip()
        outcome = hypothesis.get("expected_outcome", "").strip()
        evidence_list = hypothesis.get("supporting_evidence", []) or []
        papers_list = hypothesis.get("supporting_papers", []) or []

        # Domain determination: AI/CS/Engineering vs Natural/Biomedical Sciences
        domain_str = f"{research_area} {title} {statement} {rationale}".lower()
        is_cs_ai = any(term in domain_str for term in [
            "ai", "computer science", "artificial intelligence", "machine learning", "software",
            "code", "nlp", "deep learning", "data", "algorithm", "llm", "neural", "transformer",
            "network", "cache", "token", "vector", "embedding", "retrieval", "latency", "benchmark"
        ])

        plausibility_label = "Technical Plausibility" if is_cs_ai else "Biological / Empirical Plausibility"
        testability_desc = (
            "computational evaluation metrics, benchmark test splits, execution profiling, or empirical benchmarks"
            if is_cs_ai else "established laboratory assays, clinical measurement endpoints, or standardized protocols"
        )
        plausibility_desc = (
            "algorithmic validity, theoretical consistency, and computational feasibility"
            if is_cs_ai else "known biological, chemical, or physical mechanisms"
        )

        evidence_formatted = (
            "\n".join(f"  * {e}" for e in evidence_list)
            if evidence_list else "  * [NO DIRECT EMPIRICAL EVIDENCE RETRIEVED FROM PAPERS]"
        )
        papers_formatted = ", ".join(papers_list) if papers_list else "[NO SOURCE PAPERS CITED]"

        system_instruction = (
            "You are an autonomous, rigorous Scientific Critic Agent tasked with peer-reviewing research hypotheses. "
            "You must evaluate each hypothesis strictly on its individual merits, specific variables, and empirical evidence. "
            "CRITICAL RULES:\n"
            "1. Do NOT assign default, rounded, or repetitive scores. Score on a continuous 0.0-100.0 scale reflecting true quality.\n"
            "2. If independent or dependent variables are vague (e.g. 'better reasoning', 'targeted modulation' without units or metrics), penalize testability heavily.\n"
            "3. If retrieved supporting evidence is empty, weak, or unverified, you MUST assign plausibility below 65.0 and mark status as 'Needs Review' or 'Weak Evidence'.\n"
            "4. Only assign high scores (above 80.0) if variables are clearly operationalized and grounded in cited evidence.\n"
            "5. The critique must explicitly analyze this specific hypothesis's variables and evidence.\n"
            "6. Use clean plain text and standard Unicode characters (e.g. R², ≥, ≤, ×, √D, σ) for any mathematical symbols; never use raw LaTeX or dollar signs ($...$)."
        )

        prompt = f"""
EVALUATE THIS SPECIFIC HYPOTHESIS:

[Research Domain]: {research_area or ("Computer Science / Artificial Intelligence" if is_cs_ai else "Empirical Science")}
[Title]: {title}
[Statement]: {statement}
[Theoretical Rationale]: {rationale}
[Independent Variable (IV)]: {iv}
[Dependent Variable (DV)]: {dv}
[Expected Outcome]: {outcome}
[Retrieved Supporting Evidence ({len(evidence_list)} citations)]:
{evidence_formatted}
[Supporting Papers]: {papers_formatted}

SCORING CRITERIA (Score strictly 0.0 to 100.0 based on actual content):
1. NOVELTY: How innovative is this cross-paper synthesis? Is it an original discovery or an obvious textbook fact?
2. OPERATIONAL TESTABILITY: Are the IV and DV operationalized with concrete, measurable metrics ({testability_desc})?
3. {plausibility_label.upper()}: Is the proposed causal mechanism sound and logically consistent ({plausibility_desc})? Does the retrieved evidence genuinely support the claim?
4. FALSIFIABILITY: Is there an unambiguous, measurable negative outcome condition that would decisively refute this hypothesis?

EVALUATION STATUS:
- "Validated" (if overall >= 75.0 and all sub-scores >= 70.0 and evidence is present)
- "Needs Review" (if variables are poorly operationalized or scores are between 50.0 and 74.0)
- "Weak Evidence" (if retrieved evidence is missing, ungrounded, or overall < 50.0)

CRITIQUE:
Provide a detailed, hypothesis-specific critique that:
- Discusses the specific variables: "{iv}" and "{dv}".
- Evaluates the strength and completeness of the retrieved evidence.
- Points out specific confounding factors or weaknesses.
- Recommends concrete experimental improvements.

Respond strictly in valid JSON format:
{{
  "novelty_score": <float between 0.0 and 100.0>,
  "testability_score": <float between 0.0 and 100.0>,
  "plausibility_score": <float between 0.0 and 100.0>,
  "falsifiability_score": <float between 0.0 and 100.0>,
  "evaluation_status": "Validated" | "Needs Review" | "Weak Evidence",
  "critique": "<Detailed, hypothesis-specific critique discussing the variables and evidence>"
}}
"""

        # Call LLM without hardcoded fallback dictionary
        eval_res = LLMClient.generate_json(prompt, system_instruction, fallback_data=None)

        # Parse LLM response safely
        if eval_res and isinstance(eval_res, dict) and "novelty_score" in eval_res:
            try:
                novelty = float(eval_res["novelty_score"])
                testability = float(eval_res["testability_score"])
                plausibility = float(eval_res["plausibility_score"])
                falsifiability = float(eval_res["falsifiability_score"])

                # Clamp scores strictly between 0 and 100
                novelty = max(0.0, min(100.0, round(novelty, 1)))
                testability = max(0.0, min(100.0, round(testability, 1)))
                plausibility = max(0.0, min(100.0, round(plausibility, 1)))
                falsifiability = max(0.0, min(100.0, round(falsifiability, 1)))

                # Calculate overall score dynamically from individual criteria
                overall = round(novelty * 0.25 + testability * 0.30 + plausibility * 0.25 + falsifiability * 0.20, 1)

                status = eval_res.get("evaluation_status")
                if not status or status not in ["Validated", "Needs Review", "Weak Evidence"]:
                    if len(evidence_list) == 0 or overall < 55.0:
                        status = "Weak Evidence"
                    elif overall < 75.0 or testability < 70.0 or plausibility < 70.0:
                        status = "Needs Review"
                    else:
                        status = "Validated"

                critique = str(eval_res.get("critique", "")).strip()
                if not critique:
                    critique = f"Hypothesis scored with composite quality index of {overall}%. Novelty: {novelty}%, Testability: {testability}%, Plausibility: {plausibility}%, Falsifiability: {falsifiability}%."

                return {
                    "novelty_score": novelty,
                    "testability_score": testability,
                    "plausibility_score": plausibility,
                    "falsifiability_score": falsifiability,
                    "overall_score": overall,
                    "evaluation_status": status,
                    "critique": critique
                }
            except (ValueError, TypeError) as parse_err:
                logger.warning(f"Error parsing LLM critic scores: {parse_err}")

        # If LLM failed or returned malformed/empty JSON: Return explicit unavailable state
        logger.warning(f"LLM critic evaluation failed or returned malformed output for hypothesis '{title}'. Returning unavailable state.")
        return {
            "novelty_score": None,
            "testability_score": None,
            "plausibility_score": None,
            "falsifiability_score": None,
            "overall_score": None,
            "evaluation_status": "Critic evaluation unavailable",
            "critique": f"Critic evaluation unavailable: The automated peer-review service could not complete a structured evaluation for '{title}'. Manual review required."
        }

    def refine_hypothesis(self, hypothesis: Dict[str, Any], critique: str, research_area: str = "") -> Dict[str, Any]:
        """
        Refines a hypothesis in response to the critic's specific feedback.
        """
        title = hypothesis.get("title", "")
        domain_str = f"{research_area} {title} {hypothesis.get('statement', '')}".lower()
        is_cs_ai = any(term in domain_str for term in [
            "ai", "computer science", "artificial intelligence", "machine learning", "software",
            "code", "nlp", "deep learning", "data", "algorithm", "llm", "neural", "transformer", "network"
        ])

        system_instruction = (
            "You are an AI Scientific Refinement Assistant. Address the specific vulnerabilities identified "
            "by the critic. Improve operational variable precision, falsifiability criteria, and empirical grounding. "
            "Use clean plain text and standard Unicode characters (e.g. R², ≥, ≤, ×, √D, σ) for math notation; do NOT use raw LaTeX or dollar signs ($...$)."
        )

        prompt = f"""
Research Domain: {research_area or ("Computer Science / Artificial Intelligence" if is_cs_ai else "Empirical Science")}
Existing Hypothesis:
Title: {title}
Statement: {hypothesis.get('statement')}
Independent Variable: {hypothesis.get('independent_var')}
Dependent Variable: {hypothesis.get('dependent_var')}
Expected Outcome: {hypothesis.get('expected_outcome')}

Critic Feedback to Address:
{critique}

Provide an improved version in JSON format:
{{
  "title": "<Refined Title>",
  "statement": "<Refined Statement addressing confounds>",
  "independent_var": "<Refined IV with calibrated ranges/parameters>",
  "dependent_var": "<Refined DV with standardized benchmark/assay metrics>",
  "expected_outcome": "<Refined Outcome with quantitative thresholds>",
  "refinement_notes": "<Specific improvements made to address critic feedback>"
}}
"""

        res = LLMClient.generate_json(prompt, system_instruction, fallback_data=None)
        if res and isinstance(res, dict) and "statement" in res:
            return res

        return {
            "title": title + " (Refined)",
            "statement": hypothesis.get("statement", "") + " [Refined to control for baseline confounding factors].",
            "independent_var": hypothesis.get("independent_var", "") + " (calibrated across standardized control parameters)",
            "dependent_var": hypothesis.get("dependent_var", "") + " (measured via standardized benchmark evaluation metrics)",
            "expected_outcome": hypothesis.get("expected_outcome", "") + " (holding baseline parameters constant).",
            "refinement_notes": "Refined variables to introduce standardized baseline controls and quantitative evaluation metrics."
        }
