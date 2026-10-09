import time
import numpy as np
from typing import List, Dict, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler


class ClassicalDetector:
    """
    Classical Anomaly Detection baseline using scikit-learn Isolation Forest.
    Evaluates multi-dimensional behavioral features.
    """

    def __init__(self, contamination: float = 0.25, random_state: int = 42):
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100,
        )
        self.scaler = StandardScaler()
        self.is_fitted = False

        # Reference baseline of typical organic reviews
        # Features: [word_count, uppercase_ratio, punct_intensity, rating_extremity, repetition_score]
        self._reference_data = np.array([
            [45.0, 0.03, 0.05, 0.5, 0.15],
            [65.0, 0.02, 0.02, 0.2, 0.12],
            [30.0, 0.04, 0.04, 0.8, 0.18],
            [85.0, 0.01, 0.00, 0.0, 0.10],
            [50.0, 0.05, 0.06, 0.6, 0.14],
            [40.0, 0.02, 0.03, 0.3, 0.16],
            [90.0, 0.02, 0.01, 0.4, 0.09],
            [35.0, 0.03, 0.04, 0.5, 0.15],
        ])

    def fit_and_predict(
        self, feature_dicts: List[Dict[str, float]]
    ) -> Tuple[List[str], List[float], List[float], float]:
        """
        Fits baseline Isolation Forest and predicts anomaly status.
        Returns:
            labels: List of 'normal' or 'suspicious'
            raw_scores: Decision function values
            risk_scores: Scaled risk scores from 0.0 to 100.0
            elapsed_time_ms: Computation time in milliseconds
        """
        start_time = time.perf_counter()

        X_batch = np.array([
            [
                f["word_count"],
                f["uppercase_ratio"],
                f["punct_intensity"],
                f["rating_extremity"],
                f["repetition_score"],
            ]
            for f in feature_dicts
        ])

        # Combine with reference organic reviews for stable anomaly boundary
        X_combined = np.vstack([self._reference_data, X_batch])
        X_scaled = self.scaler.fit_transform(X_combined)

        self.model.fit(X_scaled)
        self.is_fitted = True

        # Evaluate on the batch subset
        X_batch_scaled = X_scaled[len(self._reference_data):]
        raw_preds = self.model.predict(X_batch_scaled)
        dec_scores = self.model.decision_function(X_batch_scaled)

        labels = []
        risk_scores = []
        raw_scores_list = []

        for pred, score, feat in zip(raw_preds, dec_scores, feature_dicts):
            # Rule override for blatant spam (guarantees consistency)
            blatant_spam = (
                feat["uppercase_ratio"] > 0.4
                or (feat["exclamation_count"] >= 3 and feat["repetition_score"] > 0.35)
                or feat["repetition_score"] > 0.55
            )

            is_suspicious = (pred == -1) or blatant_spam
            label = "suspicious" if is_suspicious else "normal"
            labels.append(label)

            # Map decision function to 0-100 risk score
            # Lower decision function = more anomalous
            # dec_score is roughly between -0.4 and +0.3
            risk = 50.0 - (score * 120.0)
            if blatant_spam:
                risk = max(risk, 82.0)
            risk = float(np.clip(risk, 5.0, 99.0))

            risk_scores.append(round(risk, 1))
            raw_scores_list.append(round(float(score), 4))

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return labels, raw_scores_list, risk_scores, elapsed_ms
