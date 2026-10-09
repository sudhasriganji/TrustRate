import {
  AnalyzeResponse,
  QuantumStatusResponse,
  HealthResponse,
  QuantumRunRequest,
  QuantumRunResponse,
  JobStatusResponse,
  ReviewItem,
  ReviewAnalysisResult,
} from '../types';

const BASE_URL = '/api';

export const api = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${BASE_URL}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getQuantumStatus(): Promise<QuantumStatusResponse> {
    const res = await fetch(`${BASE_URL}/quantum/status`);
    if (!res.ok) throw new Error(`Quantum status query failed: ${res.statusText}`);
    return res.json();
  },

  async getSampleData(): Promise<{ status: string; count: number; reviews: ReviewItem[] }> {
    const res = await fetch(`${BASE_URL}/sample-data`);
    if (!res.ok) throw new Error(`Failed to load sample dataset: ${res.statusText}`);
    return res.json();
  },

  async analyzeReviews(
    reviews: ReviewItem[],
    useQuantum: boolean = true,
    quantumFeatures: number = 4,
    quantumReps: number = 2,
    mode?: string
  ): Promise<AnalyzeResponse> {
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviews,
        use_quantum: useQuantum,
        quantum_features: quantumFeatures,
        quantum_reps: quantumReps,
        mode,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Analysis failed');
    }
    return res.json();
  },

  async uploadCSV(
    file: File,
    useQuantum: boolean = true,
    quantumFeatures: number = 4,
    quantumReps: number = 2,
    mode?: string
  ): Promise<AnalyzeResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('use_quantum', String(useQuantum));
    formData.append('quantum_features', String(quantumFeatures));
    formData.append('quantum_reps', String(quantumReps));
    if (mode) formData.append('mode', mode);

    const res = await fetch(`${BASE_URL}/analyze/csv`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'CSV analysis failed');
    }
    return res.json();
  },

  async runQuantumCircuit(request: QuantumRunRequest): Promise<QuantumRunResponse> {
    const res = await fetch(`${BASE_URL}/quantum/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Circuit run failed');
    }
    return res.json();
  },

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const res = await fetch(`${BASE_URL}/quantum/job/${encodeURIComponent(jobId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to query job status');
    }
    return res.json();
  },

  async simulateAttack(
    attackType: string,
    intensity: number = 5
  ): Promise<{ status: string; attack_type: string; is_synthetic: boolean; count: number; reviews: ReviewItem[] }> {
    const res = await fetch(
      `${BASE_URL}/simulate-attack?attack_type=${encodeURIComponent(attackType)}&intensity=${intensity}`,
      { method: 'POST' }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Attack simulation failed');
    }
    return res.json();
  },

  async exportResultsCSV(results: ReviewAnalysisResult[]): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/export-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results),
    });
    if (!res.ok) throw new Error('Failed to export CSV results');
    return res.blob();
  },

  async getMetrics(): Promise<any> {
    const res = await fetch(`${BASE_URL}/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },
};
