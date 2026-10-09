from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class ReviewItem(BaseModel):
    review_id: Optional[str] = None
    product_id: Optional[str] = "PROD-DEFAULT"
    reviewer_id: Optional[str] = None
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: str
    timestamp: Optional[str] = None
    ground_truth_label: Optional[str] = None


class AnalyzeRequest(BaseModel):
    reviews: List[ReviewItem]
    use_quantum: bool = True
    quantum_features: int = Field(default=4, ge=2, le=6)
    quantum_reps: int = Field(default=2, ge=1, le=4)
    mode: Optional[str] = None


class FeatureAttribution(BaseModel):
    feature_name: str
    raw_value: float
    normalized_value: float
    description: str
    suspicion_contribution: float


class ReviewAnalysisResult(BaseModel):
    review_id: str
    product_id: str
    reviewer_id: Optional[str] = None
    rating: float
    review_text: str
    timestamp: Optional[str] = None
    classical_label: str  # "normal" or "suspicious"
    classical_score: float
    classical_risk_score: float  # 0 to 100
    quantum_label: Optional[str] = None  # "normal" or "suspicious"
    quantum_score: Optional[float] = None
    quantum_risk_score: Optional[float] = None  # 0 to 100
    combined_risk_score: float  # 0 to 100
    consensus: str  # "unanimous_normal", "unanimous_suspicious", "quantum_flagged_only", "classical_flagged_only"
    reasons: List[str]
    features: Dict[str, float]
    feature_attributions: List[FeatureAttribution]
    execution_mode: str
    model_status: str
    ground_truth_label: Optional[str] = None


class CircuitInfo(BaseModel):
    num_qubits: int
    depth: int
    num_gates: int
    gate_counts: Dict[str, int]
    circuit_diagram: str
    feature_map_type: str
    reps: int
    entanglement: str


class ExecutionMetrics(BaseModel):
    total_reviews: int
    classical_anomalies: int
    quantum_anomalies: int
    concordance_rate: float
    classical_time_ms: float
    quantum_kernel_time_ms: float
    quantum_fit_time_ms: float
    quantum_predict_time_ms: float
    total_time_ms: float
    mode_used: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None


class AnalyzeResponse(BaseModel):
    status: str
    execution_mode: str
    total_analyzed: int
    results: List[ReviewAnalysisResult]
    circuit_info: Optional[CircuitInfo] = None
    metrics: ExecutionMetrics
    timestamp: str


class QuantumStatusResponse(BaseModel):
    qiskit_available: bool
    qiskit_version: str
    qiskit_machine_learning_available: bool
    qiskit_machine_learning_version: str
    aer_available: bool
    aer_version: str
    ibm_runtime_available: bool
    ibm_runtime_version: str
    current_execution_mode: str
    hardware_configured: bool
    hardware_connectivity_verified: bool
    configured_backend: Optional[str] = None
    message: str


class QuantumRunRequest(BaseModel):
    n_qubits: int = Field(default=2, ge=2, le=6)
    mode: str = "aer"  # "aer" or "ibm_hardware"
    shots: int = Field(default=1024, ge=100, le=4096)
    circuit_type: str = "zz_feature_map"
    input_values: Optional[List[float]] = None


class QuantumRunResponse(BaseModel):
    status: str
    mode: str
    backend_name: str
    job_id: Optional[str] = None
    qubit_count: int
    circuit_depth: int
    counts: Dict[str, int]
    execution_time_ms: float
    hardware_notice: str
    circuit_diagram: str
    error: Optional[str] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    backend: Optional[str] = None
    creation_date: Optional[str] = None
    execution_mode: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    execution_mode: str
    hardware_ready: bool
    database_connected: bool
    qiskit_version: str
    aer_version: str
