import time
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from sklearn.svm import OneClassSVM
from qiskit.circuit.library import zz_feature_map, ZZFeatureMap
from qiskit_machine_learning.kernels import FidelityQuantumKernel
from app.schemas.models import CircuitInfo


class QuantumAnomalyDetector:
    """
    Quantum Machine Learning Anomaly Detection service.
    Implements a genuine Qiskit pipeline using ZZFeatureMap and FidelityQuantumKernel
    coupled with a precomputed One-Class SVM.
    """

    def __init__(self, n_qubits: int = 4, reps: int = 2, nu: float = 0.2):
        self.n_qubits = n_qubits
        self.reps = reps
        self.nu = nu

        # Build feature map
        try:
            self.feature_map = zz_feature_map(
                feature_dimension=self.n_qubits,
                reps=self.reps,
                entanglement="linear",
            )
        except Exception:
            self.feature_map = ZZFeatureMap(
                feature_dimension=self.n_qubits,
                reps=self.reps,
                entanglement="linear",
            )

        # Initialize FidelityQuantumKernel
        self.kernel = FidelityQuantumKernel(feature_map=self.feature_map)
        self.svm = OneClassSVM(kernel="precomputed", nu=self.nu)
        self.is_fitted = False

        # Reference organic training vectors scaled in [0, pi]
        # Features represent: [Brevity/Density, Punctuation/Caps, Extremity, Repetition]
        self._reference_train_vectors = np.array([
            [0.15, 0.05, 0.40, 0.12],
            [0.20, 0.08, 0.20, 0.15],
            [0.18, 0.03, 0.50, 0.10],
            [0.12, 0.06, 0.30, 0.18],
            [0.25, 0.10, 0.60, 0.14],
            [0.15, 0.04, 0.10, 0.08],
            [0.22, 0.07, 0.45, 0.16],
            [0.16, 0.05, 0.35, 0.11],
        ]) * np.pi

        # Slice to the requested number of qubits
        self.X_train = self._reference_train_vectors[:, :self.n_qubits]
        self.K_train: Optional[np.ndarray] = None
        self.train_time_ms = 0.0
        self.fit_time_ms = 0.0

    def fit_training_baseline(self) -> Tuple[float, float]:
        """
        Computes training kernel matrix K_train and fits the One-Class SVM.
        """
        t0 = time.perf_counter()
        self.K_train = self.kernel.evaluate(x_vec=self.X_train)
        self.train_time_ms = (time.perf_counter() - t0) * 1000.0

        t1 = time.perf_counter()
        self.svm.fit(self.K_train)
        self.fit_time_ms = (time.perf_counter() - t1) * 1000.0
        self.is_fitted = True

        return self.train_time_ms, self.fit_time_ms

    def predict(
        self, X_test: np.ndarray
    ) -> Tuple[List[str], List[float], List[float], float, float]:
        """
        Evaluates rectangular quantum kernel K(X_test, X_train) and predicts anomaly labels.
        Returns:
            labels: List of 'normal' or 'suspicious'
            scores: Decision function values
            risk_scores: Quantum Risk Scores from 0.0 to 100.0
            kernel_eval_time_ms: Time spent evaluating quantum kernel
            predict_time_ms: Time spent running SVM decision function
        """
        if not self.is_fitted or self.K_train is None:
            self.fit_training_baseline()

        # Step 1: Evaluate rectangular kernel matrix K(X_test, X_train)
        t0 = time.perf_counter()
        K_test = self.kernel.evaluate(x_vec=X_test, y_vec=self.X_train)
        kernel_eval_time_ms = (time.perf_counter() - t0) * 1000.0

        # Step 2: Predict using precomputed kernel
        t1 = time.perf_counter()
        raw_preds = self.svm.predict(K_test)
        dec_scores = self.svm.decision_function(K_test)
        predict_time_ms = (time.perf_counter() - t1) * 1000.0

        labels = []
        risk_scores = []
        raw_scores_list = []

        for pred, score in zip(raw_preds, dec_scores):
            # scikit-learn convention: 1 = normal (inlier), -1 = anomaly (outlier)
            is_suspicious = (pred == -1) or (score < -0.05)
            labels.append("suspicious" if is_suspicious else "normal")

            # Map decision score to Quantum Risk Score [0, 100]
            # Normal scores are around +0.05 to +0.2; anomalous are -0.1 to -1.0
            risk = 45.0 - (score * 110.0)
            risk = float(np.clip(risk, 5.0, 99.0))
            risk_scores.append(round(risk, 1))
            raw_scores_list.append(round(float(score), 4))

        return labels, raw_scores_list, risk_scores, kernel_eval_time_ms, predict_time_ms

    def get_circuit_info(self) -> CircuitInfo:
        """
        Returns circuit structural properties and ASCII diagram for frontend visualization.
        """
        decomposed = self.feature_map.decompose()
        depth = int(decomposed.depth())
        gate_counts = {str(k): int(v) for k, v in decomposed.count_ops().items()}
        num_gates = sum(gate_counts.values())

        # Render ASCII text representation
        diagram_str = str(self.feature_map.draw("text"))

        return CircuitInfo(
            num_qubits=self.n_qubits,
            depth=depth,
            num_gates=num_gates,
            gate_counts=gate_counts,
            circuit_diagram=diagram_str,
            feature_map_type="ZZFeatureMap",
            reps=self.reps,
            entanglement="linear",
        )
