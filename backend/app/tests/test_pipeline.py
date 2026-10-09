import io
import pytest
from fastapi.testclient import TestClient
import numpy as np

from app.main import app
from app.services.review_features import ReviewFeatureExtractor
from app.services.classical_detector import ClassicalDetector
from app.services.quantum_detector import QuantumAnomalyDetector
from app.services.quantum_runtime import QuantumRuntimeService
from app.schemas.models import ReviewItem, QuantumRunRequest


@pytest.fixture
def client():
    return TestClient(app)


def test_1_backend_health(client):
    """TEST 1 & 2: Backend starts and GET /api/health returns valid status without exposing secrets."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "qiskit_version" in data
    assert "aer_version" in data
    # Ensure no tokens leaked
    assert "token" not in str(data).lower() or "has_token" in str(data).lower()


def test_2_quantum_status(client):
    """Verify GET /api/quantum/status returns Qiskit and execution mode details."""
    response = client.get("/api/quantum/status")
    assert response.status_code == 200
    data = response.json()
    assert data["qiskit_available"] is True
    assert data["aer_available"] is True
    assert data["ibm_runtime_available"] is True
    assert "current_execution_mode" in data
    # No secret leaked
    assert "IBM_QUANTUM_TOKEN" not in data


def test_3_feature_map_construction():
    """TEST 3: Qiskit feature map constructed successfully."""
    detector = QuantumAnomalyDetector(n_qubits=2, reps=1)
    assert detector.feature_map is not None
    info = detector.get_circuit_info()
    assert info.num_qubits == 2
    assert info.depth > 0
    assert "h" in info.gate_counts or "H" in str(info.circuit_diagram)


def test_4_quantum_kernel_evaluation():
    """TEST 4: Quantum kernel evaluated on a test dataset."""
    detector = QuantumAnomalyDetector(n_qubits=2, reps=1)
    X = np.array([[0.1, 0.2], [0.3, 0.4]]) * np.pi
    matrix = detector.kernel.evaluate(x_vec=X)
    assert matrix.shape == (2, 2)
    assert np.isclose(matrix[0, 0], 1.0)
    assert np.isclose(matrix[1, 1], 1.0)
    assert matrix[0, 1] >= 0.0


def test_5_quantum_anomaly_detection_model():
    """TEST 5: Quantum anomaly detection model trains and returns predictions."""
    detector = QuantumAnomalyDetector(n_qubits=2, reps=1)
    t_train, t_fit = detector.fit_training_baseline()
    assert t_train >= 0.0
    assert t_fit >= 0.0
    assert detector.is_fitted is True

    # Test sample: one normal, one extreme anomalous
    X_test = np.array([
        [0.15, 0.05],  # normal
        [0.95, 0.95],  # extreme anomaly
    ]) * np.pi

    labels, scores, risks, k_eval_t, p_t = detector.predict(X_test)
    assert len(labels) == 2
    assert all(l in ["normal", "suspicious"] for l in labels)
    assert len(risks) == 2
    assert all(0.0 <= r <= 100.0 for r in risks)


def test_6_classical_baseline():
    """TEST 6: Classical baseline trains and returns predictions."""
    detector = ClassicalDetector()
    sample_features = [
        ReviewFeatureExtractor.extract_single(
            ReviewItem(rating=5.0, review_text="Great battery life and sound clarity.")
        ),
        ReviewFeatureExtractor.extract_single(
            ReviewItem(rating=5.0, review_text="BUY BUY BUY BEST BEST WOW WOW WOW!!!!!!")
        ),
    ]
    labels, scores, risks, elapsed_ms = detector.fit_and_predict(sample_features)
    assert len(labels) == 2
    assert "normal" in labels or "suspicious" in labels
    assert elapsed_ms > 0.0


def test_7_csv_analysis_success(client):
    """TEST 7: A valid CSV uploads and is analyzed successfully."""
    csv_content = (
        "review_id,product_id,rating,review_text\n"
        "R1,P100,5.0,Excellent durable build quality and long battery life.\n"
        "R2,P100,5.0,AMAZING BUY BUY BEST EVER WOW WOW WOW!!!!!\n"
    )
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    response = client.post("/api/analyze/csv", files=files, data={"use_quantum": "true", "quantum_features": "2"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["total_analyzed"] == 2
    assert len(data["results"]) == 2
    assert data["results"][0]["quantum_label"] in ["normal", "suspicious"]
    assert data["metrics"]["concordance_rate"] >= 0.0


def test_8_csv_invalid_format(client):
    """TEST 8: An invalid CSV produces a clear error response."""
    # Missing required review_text and rating columns
    bad_csv = "random_col,another_col\n1,2\n3,4\n"
    files = {"file": ("bad.csv", io.BytesIO(bad_csv.encode("utf-8")), "text/csv")}
    response = client.post("/api/analyze/csv", files=files)
    assert response.status_code == 400
    assert "missing required" in response.json()["detail"].lower()


def test_9_aer_mode_execution():
    """TEST 9: Aer mode runs locally without requiring IBM Quantum credentials."""
    req = QuantumRunRequest(n_qubits=2, mode="aer", shots=256)
    res = QuantumRuntimeService.execute_circuit(req)
    assert res.status == "completed"
    assert res.mode == "aer"
    assert res.backend_name == "aer_simulator"
    assert res.job_id is None
    assert sum(res.counts.values()) == 256
    assert "No cloud hardware" in res.hardware_notice


def test_10_hardware_mode_unconfigured_refusal(monkeypatch):
    """TEST 10: Hardware mode refuses to claim success when credentials or backend are unavailable."""
    from app.config import Settings, settings
    monkeypatch.setattr(Settings, "IBM_QUANTUM_TOKEN", "")
    monkeypatch.setattr(settings, "IBM_QUANTUM_TOKEN", "")
    monkeypatch.setattr(Settings, "is_hardware_configured", classmethod(lambda cls: False))
    req = QuantumRunRequest(n_qubits=2, mode="ibm_hardware", shots=100)
    res = QuantumRuntimeService.execute_circuit(req)
    assert res.status == "failed"
    assert res.job_id is None
    assert "refused" in res.error.lower() or "missing" in res.error.lower()


def test_11_sample_data_endpoint(client):
    """Verify GET /api/sample-data provides immediate sample test dataset."""
    response = client.get("/api/sample-data")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["count"] > 0
    assert len(data["reviews"]) == data["count"]


def test_12_simulate_attack_endpoint(client):
    """Verify POST /api/simulate-attack generates synthetic test cases with ground-truth labels."""
    response = client.post("/api/simulate-attack?attack_type=sybil_burst&intensity=4")
    assert response.status_code == 200
    data = response.json()
    assert data["is_synthetic"] is True
    assert data["count"] == 4
    assert len(data["reviews"]) == 4
    assert data["reviews"][0]["ground_truth_label"] == "suspicious"
