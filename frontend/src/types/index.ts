export interface ReviewItem {
  review_id?: string;
  product_id?: string;
  reviewer_id?: string;
  rating: number;
  review_text: string;
  timestamp?: string;
  ground_truth_label?: 'normal' | 'suspicious' | null;
}

export interface FeatureAttribution {
  feature_name: string;
  raw_value: number;
  normalized_value: number;
  description: string;
  suspicion_contribution: number;
}

export interface ReviewAnalysisResult {
  review_id: string;
  product_id: string;
  reviewer_id?: string | null;
  rating: number;
  review_text: string;
  timestamp?: string | null;
  classical_label: 'normal' | 'suspicious';
  classical_score: number;
  classical_risk_score: number;
  quantum_label?: 'normal' | 'suspicious' | null;
  quantum_score?: number | null;
  quantum_risk_score?: number | null;
  combined_risk_score: number;
  consensus: 'unanimous_normal' | 'unanimous_suspicious' | 'quantum_flagged_only' | 'classical_flagged_only' | string;
  reasons: string[];
  features: Record<string, number>;
  feature_attributions: FeatureAttribution[];
  execution_mode: string;
  model_status: string;
  ground_truth_label?: string | null;
}

export interface CircuitInfo {
  num_qubits: number;
  depth: number;
  num_gates: number;
  gate_counts: Record<string, number>;
  circuit_diagram: string;
  feature_map_type: string;
  reps: number;
  entanglement: string;
}

export interface ExecutionMetrics {
  total_reviews: number;
  classical_anomalies: number;
  quantum_anomalies: number;
  concordance_rate: number;
  classical_time_ms: number;
  quantum_kernel_time_ms: number;
  quantum_fit_time_ms: number;
  quantum_predict_time_ms: number;
  total_time_ms: number;
  mode_used: string;
  accuracy?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1?: number | null;
}

export interface AnalyzeResponse {
  status: string;
  execution_mode: string;
  total_analyzed: number;
  results: ReviewAnalysisResult[];
  circuit_info?: CircuitInfo | null;
  metrics: ExecutionMetrics;
  timestamp: string;
}

export interface QuantumStatusResponse {
  qiskit_available: boolean;
  qiskit_version: string;
  qiskit_machine_learning_available: boolean;
  qiskit_machine_learning_version: string;
  aer_available: boolean;
  aer_version: string;
  ibm_runtime_available: boolean;
  ibm_runtime_version: string;
  current_execution_mode: string;
  hardware_configured: boolean;
  hardware_connectivity_verified: boolean;
  configured_backend?: string | null;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  execution_mode: string;
  hardware_ready: boolean;
  database_connected: boolean;
  qiskit_version: string;
  aer_version: string;
}

export interface QuantumRunRequest {
  n_qubits: number;
  mode: string;
  shots: number;
  circuit_type?: string;
  input_values?: number[];
}

export interface QuantumRunResponse {
  status: string;
  mode: string;
  backend_name: string;
  job_id?: string | null;
  qubit_count: number;
  circuit_depth: number;
  counts: Record<string, number>;
  execution_time_ms: number;
  hardware_notice: string;
  circuit_diagram: string;
  error?: string | null;
}

export interface JobStatusResponse {
  job_id: string;
  status: string;
  backend?: string | null;
  creation_date?: string | null;
  execution_mode: string;
  result?: { counts?: Record<string, number> } | null;
  error?: string | null;
}
