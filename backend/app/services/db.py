import sqlite3
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from app.config import settings


class DatabaseService:
    """
    Lightweight SQLite storage for historical audit scans, metrics, and circuit runs.
    """

    def __init__(self):
        # Extract file path from sqlite:///./path
        db_path_str = settings.DATABASE_URL.replace("sqlite:///", "")
        self.db_path = Path(db_path_str).resolve()
        self.init_db()

    def get_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scan_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    scan_id TEXT UNIQUE NOT NULL,
                    timestamp TEXT NOT NULL,
                    execution_mode TEXT NOT NULL,
                    total_reviews INTEGER NOT NULL,
                    classical_anomalies INTEGER NOT NULL,
                    quantum_anomalies INTEGER NOT NULL,
                    concordance_rate REAL NOT NULL,
                    total_time_ms REAL NOT NULL,
                    source TEXT NOT NULL,
                    metrics_json TEXT NOT NULL
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS quantum_circuit_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id TEXT,
                    mode TEXT NOT NULL,
                    backend_name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    qubits INTEGER NOT NULL,
                    depth INTEGER NOT NULL,
                    execution_time_ms REAL NOT NULL,
                    timestamp TEXT NOT NULL,
                    counts_json TEXT
                )
            """)
            conn.commit()

    def record_scan(
        self,
        scan_id: str,
        timestamp: str,
        execution_mode: str,
        total_reviews: int,
        classical_anomalies: int,
        quantum_anomalies: int,
        concordance_rate: float,
        total_time_ms: float,
        source: str,
        metrics_dict: Dict[str, Any],
    ):
        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO scan_history (
                    scan_id, timestamp, execution_mode, total_reviews,
                    classical_anomalies, quantum_anomalies, concordance_rate,
                    total_time_ms, source, metrics_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                scan_id,
                timestamp,
                execution_mode,
                total_reviews,
                classical_anomalies,
                quantum_anomalies,
                concordance_rate,
                total_time_ms,
                source,
                json.dumps(metrics_dict),
            ))
            conn.commit()

    def get_recent_scans(self, limit: int = 20) -> List[Dict[str, Any]]:
        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT scan_id, timestamp, execution_mode, total_reviews,
                       classical_anomalies, quantum_anomalies, concordance_rate,
                       total_time_ms, source, metrics_json
                FROM scan_history
                ORDER BY id DESC LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                item["metrics"] = json.loads(item["metrics_json"])
                del item["metrics_json"]
                results.append(item)
            return results

    def get_aggregate_metrics(self) -> Dict[str, Any]:
        with self.get_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_scans,
                    SUM(total_reviews) as total_reviews_scanned,
                    SUM(classical_anomalies) as total_classical_flagged,
                    SUM(quantum_anomalies) as total_quantum_flagged,
                    AVG(concordance_rate) as avg_concordance,
                    AVG(total_time_ms) as avg_execution_time_ms
                FROM scan_history
            """)
            row = cursor.fetchone()
            if not row or row["total_scans"] == 0:
                return {
                    "total_scans": 0,
                    "total_reviews_scanned": 0,
                    "total_classical_flagged": 0,
                    "total_quantum_flagged": 0,
                    "avg_concordance": 0.0,
                    "avg_execution_time_ms": 0.0,
                }
            return {
                "total_scans": int(row["total_scans"] or 0),
                "total_reviews_scanned": int(row["total_reviews_scanned"] or 0),
                "total_classical_flagged": int(row["total_classical_flagged"] or 0),
                "total_quantum_flagged": int(row["total_quantum_flagged"] or 0),
                "avg_concordance": round(float(row["avg_concordance"] or 0.0), 3),
                "avg_execution_time_ms": round(float(row["avg_execution_time_ms"] or 0.0), 2),
            }


db = DatabaseService()
