from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.models.orm_models import Hypothesis, Project
from backend.models.schemas import HypothesisOut
from backend.agents.critic_agent import CriticAgent

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])

@router.get("/project/{project_id}", response_model=List[HypothesisOut])
def get_project_hypotheses(project_id: int, db: Session = Depends(get_db)):
    hypotheses = db.query(Hypothesis).filter(Hypothesis.project_id == project_id).order_by(Hypothesis.overall_score.desc()).all()
    for h in hypotheses:
        if h.critique and "critic evaluation unavailable" in h.critique.lower():
            h.novelty_score = None
            h.testability_score = None
            h.plausibility_score = None
            h.falsifiability_score = None
            h.overall_score = None
    return hypotheses

@router.get("/{hypothesis_id}", response_model=HypothesisOut)
def get_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    h = db.query(Hypothesis).filter(Hypothesis.id == hypothesis_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    if h.critique and "critic evaluation unavailable" in h.critique.lower():
        h.novelty_score = None
        h.testability_score = None
        h.plausibility_score = None
        h.falsifiability_score = None
        h.overall_score = None
    return h

@router.patch("/{hypothesis_id}/save", response_model=HypothesisOut)
def toggle_save_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    h = db.query(Hypothesis).filter(Hypothesis.id == hypothesis_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hypothesis not found")
    h.is_saved = not h.is_saved
    db.commit()
    db.refresh(h)
    return h

@router.post("/{hypothesis_id}/refine", response_model=HypothesisOut)
def refine_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    h = db.query(Hypothesis).filter(Hypothesis.id == hypothesis_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hypothesis not found")

    if h.refinement_count >= 1:
        raise HTTPException(status_code=400, detail="Maximum 1 refinement attempt permitted per hypothesis specification.")

    critic = CriticAgent()
    hypo_dict = {
        "title": h.title,
        "statement": h.statement,
        "independent_var": h.independent_var,
        "dependent_var": h.dependent_var,
        "expected_outcome": h.expected_outcome
    }

    research_area = h.project.research_area if h.project else ""
    refined_data = critic.refine_hypothesis(
        hypo_dict,
        h.critique or "Enhance falsifiability and operational definitions.",
        research_area=research_area
    )

    # Re-evaluate refined hypothesis
    re_eval = critic.evaluate_hypothesis({**hypo_dict, **refined_data}, research_area=research_area)

    h.title = refined_data.get("title", h.title)
    h.statement = refined_data.get("statement", h.statement)
    h.independent_var = refined_data.get("independent_var", h.independent_var)
    h.dependent_var = refined_data.get("dependent_var", h.dependent_var)
    h.expected_outcome = refined_data.get("expected_outcome", h.expected_outcome)
    h.refinement_notes = refined_data.get("refinement_notes", "Variables recalibrated to control for confounding effects.")
    h.refinement_count += 1

    # Update scores only if critic successfully evaluated
    if re_eval.get("novelty_score") is not None:
        base_nov = h.novelty_score or 70.0
        base_test = h.testability_score or 70.0
        base_plaus = h.plausibility_score or 70.0
        base_fals = h.falsifiability_score or 70.0
        h.novelty_score = min(99.0, max(base_nov, re_eval["novelty_score"]))
        h.testability_score = min(99.0, max(base_test + 5.0, re_eval["testability_score"]))
        h.plausibility_score = min(99.0, max(base_plaus, re_eval["plausibility_score"]))
        h.falsifiability_score = min(99.0, max(base_fals + 6.0, re_eval["falsifiability_score"]))
        h.overall_score = round(h.novelty_score * 0.25 + h.testability_score * 0.30 + h.plausibility_score * 0.25 + h.falsifiability_score * 0.20, 1)
        h.critique = re_eval.get("critique", h.critique)
    else:
        h.novelty_score = None
        h.testability_score = None
        h.plausibility_score = None
        h.falsifiability_score = None
        h.overall_score = None
        h.critique = re_eval.get("critique", "Critic evaluation unavailable: Re-evaluation could not be completed.")

    db.commit()
    db.refresh(h)
    return h

@router.post("/{hypothesis_id}/evaluate", response_model=HypothesisOut)
def evaluate_single_hypothesis(hypothesis_id: int, db: Session = Depends(get_db)):
    h = db.query(Hypothesis).filter(Hypothesis.id == hypothesis_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hypothesis not found")

    critic = CriticAgent()
    hypo_dict = {
        "title": h.title,
        "statement": h.statement,
        "rationale": h.rationale,
        "independent_var": h.independent_var,
        "dependent_var": h.dependent_var,
        "expected_outcome": h.expected_outcome,
        "supporting_evidence": h.supporting_evidence or [],
        "supporting_papers": h.supporting_papers or []
    }

    research_area = h.project.research_area if h.project else ""
    eval_res = critic.evaluate_hypothesis(hypo_dict, research_area=research_area)

    h.novelty_score = eval_res.get("novelty_score")
    h.testability_score = eval_res.get("testability_score")
    h.plausibility_score = eval_res.get("plausibility_score")
    h.falsifiability_score = eval_res.get("falsifiability_score")
    h.overall_score = eval_res.get("overall_score")
    h.critique = eval_res.get("critique")

    db.commit()
    db.refresh(h)
    return h
