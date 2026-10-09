import time
import uuid
import datetime
from pathlib import Path
from typing import List, Optional
import numpy as np

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import Response

from app.config import settings
from app.schemas.models import (
    AnalyzeRequest,
    AnalyzeResponse,
    ReviewAnalysisResult,
    ExecutionMetrics,
    QuantumStatusResponse,
    QuantumRunRequest,
    QuantumRunResponse,
    JobStatusResponse,
    HealthResponse,
    ReviewItem,
)
from app.services.review_features import ReviewFeatureExtractor
from app.services.classical_detector import ClassicalDetector
from app.services.quantum_detector import QuantumAnomalyDetector
from app.services.quantum_runtime import QuantumRuntimeService
from app.services.csv_analyzer import CSVAnalyzer
from app.services.db import db

router = APIRouter(prefix="/api")


def run_hybrid_pipeline(
    reviews: List[ReviewItem],
    use_quantum: bool = True,
    quantum_features: int = 4,
    quantum_reps: int = 2,
    mode: Optional[str] = None,
    source: str = "direct_api",
) -> AnalyzeResponse:
    if not reviews:
        raise HTTPException(status_code=400, detail="Review list cannot be empty.")

    total_start_time = time.perf_counter()
    exec_mode = (mode or settings.QUANTUM_MODE).lower()

    # Step 1: Feature Extraction
    feature_dicts = [ReviewFeatureExtractor.extract_single(r) for r in reviews]
    quantum_vectors = []
    attributions_list = []
    reasons_list = []

    for r, f in zip(reviews, feature_dicts):
        q_vec, attr, reasons = ReviewFeatureExtractor.get_quantum_vector(f, n_qubits=quantum_features)
        quantum_vectors.append(q_vec)
        attributions_list.append(attr)
        reasons_list.append(reasons)

    # Step 2: Classical Isolation Forest
    classical_detector = ClassicalDetector()
    c_labels, c_scores, c_risks, classical_time_ms = classical_detector.fit_and_predict(feature_dicts)

    # Step 3: Quantum Machine Learning (if enabled)
    q_labels: List[Optional[str]] = [None] * len(reviews)
    q_scores: List[Optional[float]] = [None] * len(reviews)
    q_risks: List[Optional[float]] = [None] * len(reviews)
    circuit_info = None

    q_kernel_time_ms = 0.0
    q_fit_time_ms = 0.0
    q_predict_time_ms = 0.0

    if use_quantum:
        X_test_q = np.array(quantum_vectors)
        q_detector = QuantumAnomalyDetector(
            n_qubits=quantum_features,
            reps=quantum_reps,
            nu=0.2,
        )
        t_train, t_fit = q_detector.fit_training_baseline()
        q_kernel_time_ms += t_train
        q_fit_time_ms += t_fit

        ql, qs, qr, k_eval_t, p_t = q_detector.predict(X_test_q)
        q_kernel_time_ms += k_eval_t
        q_predict_time_ms += p_t

        q_labels = ql
        q_scores = qs
        q_risks = qr
        circuit_info = q_detector.get_circuit_info()

    # Step 4: Ensemble Synthesis & Result Construction
    results: List[ReviewAnalysisResult] = []
    agreements = 0

    for i, review in enumerate(reviews):
        c_label = c_labels[i]
        c_score = c_scores[i]
        c_risk = c_risks[i]

        q_label = q_labels[i]
        q_score = q_scores[i]
        q_risk = q_risks[i]

        if use_quantum and q_label is not None and q_risk is not None:
            # Weighted ensemble
            combined_risk = round(0.40 * c_risk + 0.60 * q_risk, 1)
            if c_label == q_label:
                agreements += 1
                consensus = "unanimous_suspicious" if c_label == "suspicious" else "unanimous_normal"
            else:
                consensus = "quantum_flagged_only" if q_label == "suspicious" else "classical_flagged_only"
        else:
            combined_risk = c_risk
            consensus = "classical_only_" + c_label
            agreements += 1

        rev_id = review.review_id or f"REV-{i + 1:04d}"
        results.append(
            ReviewAnalysisResult(
                review_id=rev_id,
                product_id=review.product_id or "PROD-DEFAULT",
                reviewer_id=review.reviewer_id,
                rating=review.rating,
                review_text=review.review_text,
                timestamp=review.timestamp,
                classical_label=c_label,
                classical_score=c_score,
                classical_risk_score=c_risk,
                quantum_label=q_label,
                quantum_score=q_score,
                quantum_risk_score=q_risk,
                combined_risk_score=combined_risk,
                consensus=consensus,
                reasons=reasons_list[i],
                features=feature_dicts[i],
                feature_attributions=attributions_list[i],
                execution_mode=exec_mode,
                model_status="completed",
                ground_truth_label=review.ground_truth_label,
            )
        )

    total_time_ms = (time.perf_counter() - total_start_time) * 1000.0
    total_reviews = len(reviews)
    c_anomalies = sum(1 for r in results if r.classical_label == "suspicious")
    q_anomalies = sum(1 for r in results if r.quantum_label == "suspicious") if use_quantum else 0
    concordance_rate = round(agreements / total_reviews, 3)

    # Supervised metrics if ground truth is present
    has_gt = all(r.ground_truth_label in ("normal", "suspicious") for r in reviews if r.ground_truth_label)
    acc = None
    prec = None
    rec = None
    f1 = None

    if has_gt and any(r.ground_truth_label for r in reviews):
        y_true = [1 if r.ground_truth_label == "suspicious" else 0 for r in reviews]
        # Use quantum predictions if available, else classical
        y_pred = [1 if (r.quantum_label or r.classical_label) == "suspicious" else 0 for r in results]

        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)
        tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)

        acc = round((tp + tn) / max(len(y_true), 1), 3)
        prec = round(tp / max(tp + fp, 1), 3) if (tp + fp) > 0 else 0.0
        rec = round(tp / max(tp + fn, 1), 3) if (tp + fn) > 0 else 0.0
        f1 = round(2 * prec * rec / max(prec + rec, 1e-6), 3) if (prec + rec) > 0 else 0.0

    metrics = ExecutionMetrics(
        total_reviews=total_reviews,
        classical_anomalies=c_anomalies,
        quantum_anomalies=q_anomalies,
        concordance_rate=concordance_rate,
        classical_time_ms=round(classical_time_ms, 2),
        quantum_kernel_time_ms=round(q_kernel_time_ms, 2),
        quantum_fit_time_ms=round(q_fit_time_ms, 2),
        quantum_predict_time_ms=round(q_predict_time_ms, 2),
        total_time_ms=round(total_time_ms, 2),
        mode_used=exec_mode,
        accuracy=acc,
        precision=prec,
        recall=rec,
        f1=f1,
    )

    scan_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"
    timestamp_str = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Persist in SQLite
    try:
        db.record_scan(
            scan_id=scan_id,
            timestamp=timestamp_str,
            execution_mode=exec_mode,
            total_reviews=total_reviews,
            classical_anomalies=c_anomalies,
            quantum_anomalies=q_anomalies,
            concordance_rate=concordance_rate,
            total_time_ms=total_time_ms,
            source=source,
            metrics_dict=metrics.model_dump(),
        )
    except Exception:
        pass

    return AnalyzeResponse(
        status="success",
        execution_mode=exec_mode,
        total_analyzed=total_reviews,
        results=results,
        circuit_info=circuit_info,
        metrics=metrics,
        timestamp=timestamp_str,
    )


@router.get("/health", response_model=HealthResponse)
def get_health():
    """Returns backend status, available capabilities, and configured execution mode."""
    status = QuantumRuntimeService.get_status()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        execution_mode=settings.QUANTUM_MODE,
        hardware_ready=settings.is_hardware_configured(),
        database_connected=True,
        qiskit_version=status.qiskit_version,
        aer_version=status.aer_version,
    )


@router.get("/quantum/status", response_model=QuantumStatusResponse)
def get_quantum_status():
    """Returns detailed status of Qiskit, Aer, IBM Runtime, and current hardware connectivity."""
    return QuantumRuntimeService.get_status()


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_reviews(request: AnalyzeRequest):
    """Analyzes a batch of reviews using hybrid Classical and Qiskit Quantum anomaly detection."""
    return run_hybrid_pipeline(
        reviews=request.reviews,
        use_quantum=request.use_quantum,
        quantum_features=request.quantum_features,
        quantum_reps=request.quantum_reps,
        mode=request.mode,
        source="batch_api",
    )


@router.post("/analyze/csv", response_model=AnalyzeResponse)
async def analyze_csv(
    file: UploadFile = File(...),
    use_quantum: bool = Form(True),
    quantum_features: int = Form(4),
    quantum_reps: int = Form(2),
    mode: Optional[str] = Form(None),
):
    """Accepts a CSV upload, parses review data, and runs the hybrid quantum-classical pipeline."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")

    content = await file.read()
    try:
        reviews, warnings = CSVAnalyzer.parse_csv_bytes(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return run_hybrid_pipeline(
        reviews=reviews,
        use_quantum=use_quantum,
        quantum_features=quantum_features,
        quantum_reps=quantum_reps,
        mode=mode,
        source="csv_upload",
    )


@router.post("/quantum/run", response_model=QuantumRunResponse)
def run_quantum_circuit(request: QuantumRunRequest):
    """
    Executes a genuine Qiskit circuit on the chosen backend (local Aer simulator or physical IBM hardware).
    Accurately records backend name and job ID without conflating simulation with hardware.
    """
    return QuantumRuntimeService.execute_circuit(request)


@router.get("/quantum/job/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    """Retrieves real-time execution status of an IBM Quantum cloud hardware job."""
    return QuantumRuntimeService.retrieve_job_status(job_id)


@router.get("/metrics")
def get_metrics():
    """Returns measured execution statistics and historical scan performance from the database."""
    agg = db.get_aggregate_metrics()
    recent = db.get_recent_scans(limit=10)
    return {
        "status": "success",
        "aggregate": agg,
        "recent_scans": recent,
    }


@router.get("/sample-data")
def get_sample_data():
    """Returns bundled synthetic sample reviews so the interface can be tested with one click."""
    sample_path = Path(__file__).resolve().parent.parent.parent.parent / "data" / "sample_reviews.csv"
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail="Sample dataset file not found.")

    with open(sample_path, "rb") as f:
        content = f.read()

    reviews, _ = CSVAnalyzer.parse_csv_bytes(content)
    return {
        "status": "success",
        "count": len(reviews),
        "reviews": [r.model_dump() for r in reviews],
    }


@router.post("/simulate-attack")
def simulate_attack(
    attack_type: str = Query("sybil_burst", pattern="^(sybil_burst|copy_paste_spam|competitor_smear|polarity_manipulation)$"),
    intensity: int = Query(5, ge=3, le=15),
):
    """
    Synthesizes realistic attack patterns (Sybil bot burst, copy-paste swarm, competitor smear campaign).
    Labeled as synthetic test cases.
    """
    generated_reviews = []
    base_id = f"ATK-{uuid.uuid4().hex[:6].upper()}"

    if attack_type == "sybil_burst":
        for i in range(intensity):
            generated_reviews.append(
                ReviewItem(
                    review_id=f"{base_id}-{i+1}",
                    product_id="PROD-TARGET-99",
                    reviewer_id=f"BOT-{i+1000}",
                    rating=5.0,
                    review_text="INCREDIBLE BEST PURCHASE EVER!!! 10/10 MUST BUY WOW WOW WOW!!!",
                    timestamp="2026-10-09 20:30:00",
                    ground_truth_label="suspicious",
                )
            )
    elif attack_type == "copy_paste_spam":
        phrase = "Top tier quality and lightning shipping! "
        for i in range(intensity):
            generated_reviews.append(
                ReviewItem(
                    review_id=f"{base_id}-{i+1}",
                    product_id="PROD-TARGET-99",
                    reviewer_id=f"BOT-{i+2000}",
                    rating=5.0,
                    review_text=phrase * (2 + (i % 2)),
                    timestamp="2026-10-09 20:31:00",
                    ground_truth_label="suspicious",
                )
            )
    elif attack_type == "competitor_smear":
        for i in range(intensity):
            generated_reviews.append(
                ReviewItem(
                    review_id=f"{base_id}-{i+1}",
                    product_id="PROD-COMPETITOR-X",
                    reviewer_id=f"SMEAR-{i+3000}",
                    rating=1.0,
                    review_text="COMPLETE SCAM BROKE IMMEDIATELY ZERO STARS DO NOT BUY WORST TRASH EVER!!!!",
                    timestamp="2026-10-09 20:32:00",
                    ground_truth_label="suspicious",
                )
            )
    elif attack_type == "polarity_manipulation":
        for i in range(intensity):
            generated_reviews.append(
                ReviewItem(
                    review_id=f"{base_id}-{i+1}",
                    product_id="PROD-TARGET-99",
                    reviewer_id=f"TROLL-{i+4000}",
                    rating=5.0,
                    review_text="Terrible broke immediately horrible customer support garbage useless bad product.",
                    timestamp="2026-10-09 20:33:00",
                    ground_truth_label="suspicious",
                )
            )

    return {
        "status": "success",
        "attack_type": attack_type,
        "is_synthetic": True,
        "count": len(generated_reviews),
        "reviews": [r.model_dump() for r in generated_reviews],
    }


@router.post("/export-results")
def export_results(results: List[ReviewAnalysisResult]):
    """Generates and returns an enriched CSV report from analysis results."""
    csv_str = CSVAnalyzer.export_results_csv(results)
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trustrate_audit_results.csv"},
    )
