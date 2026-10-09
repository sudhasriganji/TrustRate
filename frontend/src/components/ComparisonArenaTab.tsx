import React from 'react';
import {
  GitCompare,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { AnalyzeResponse, QuantumStatusResponse } from '../types';

interface ComparisonArenaTabProps {
  lastAnalysis: AnalyzeResponse | null;
  quantumStatus: QuantumStatusResponse | null;
}

export const ComparisonArenaTab: React.FC<ComparisonArenaTabProps> = ({
  lastAnalysis,
  quantumStatus,
}) => {
  const metrics = lastAnalysis?.metrics;
  const results = lastAnalysis?.results || [];

  // Compute 2x2 agreement matrix
  const normalBoth = results.filter(
    (r) => r.classical_label === 'normal' && r.quantum_label === 'normal'
  ).length;
  const suspBoth = results.filter(
    (r) => r.classical_label === 'suspicious' && r.quantum_label === 'suspicious'
  ).length;
  const classicalOnly = results.filter(
    (r) => r.classical_label === 'suspicious' && r.quantum_label === 'normal'
  ).length;
  const quantumOnly = results.filter(
    (r) => r.classical_label === 'normal' && r.quantum_label === 'suspicious'
  ).length;

  // Latency breakdown data
  const timingData = metrics
    ? [
        {
          stage: 'Standard Pattern Check',
          timeMs: metrics.classical_time_ms,
        },
        {
          stage: 'Quantum Kernel Matrix',
          timeMs: metrics.quantum_kernel_time_ms,
        },
        {
          stage: 'Quantum Model Fit',
          timeMs: metrics.quantum_fit_time_ms,
        },
        {
          stage: 'Quantum Prediction',
          timeMs: metrics.quantum_predict_time_ms,
        },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5DDD1]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-2xl font-bold text-[#0F172A]">
              Model Comparison
            </h2>
            <span className="stamp-badge stamp-lime text-[10px]">
              Local simulation
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Side-by-side evaluation of Standard Pattern (Isolation Forest) vs. Quantum Shape (ZZFeatureMap Kernel).
          </p>
        </div>
      </div>

        {/* Hardware verification disclaimer banner */}
        <div className="mt-2 p-3 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0] text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="text-[#64748B]">
            Execution Status:
          </span>
          {quantumStatus?.hardware_connectivity_verified ? (
            <span className="text-[#059669] font-mono font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              IBM Quantum platform connectivity verified
            </span>
          ) : (
            <span className="text-[#D97706] font-mono font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              IBM Quantum hardware execution has not yet been verified. Running in local simulation.
            </span>
          )}
        </div>

      {/* Head-to-Head Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check 1: Standard Check (Cobalt) */}
        <div className="paper-card p-6 space-y-4 border-[#E5DCD0] border-t-4 border-t-[#2563EB]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DCD0]">
            <div>
              <span className="stamp-badge stamp-cobalt text-[10px]">
                Check 1: Standard
              </span>
              <h3 className="font-editorial text-xl font-bold text-[#0F172A] mt-1">
                Pattern Outlier Baseline
              </h3>
            </div>
            <span className="text-xs font-mono text-[#64748B]">scikit-learn</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Reviews Flagged</span>
              <div className="font-editorial text-3xl font-bold text-[#2563EB] mt-1">
                {metrics?.classical_anomalies ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Processing Speed</span>
              <div className="font-mono text-xl font-bold text-[#0F172A] mt-1">
                {metrics ? `${metrics.classical_time_ms} ms` : '—'}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#475569] space-y-1.5 leading-relaxed">
            <p>• Evaluates numerical deviations using recursive isolation trees.</p>
            <p>• Fast and effective for spotting obvious outliers like high ALL CAPS shouting.</p>
            <p>• Evaluates each feature with axis-parallel thresholds.</p>
          </div>
        </div>

        {/* Check 2: Quantum Check (Coral) */}
        <div className="paper-card p-6 space-y-4 border-[#E5DCD0] border-t-4 border-t-[#F43F5E]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5DCD0]">
            <div>
              <span className="stamp-badge stamp-coral text-[10px]">
                Check 2: Quantum
              </span>
              <h3 className="font-editorial text-xl font-bold text-[#0F172A] mt-1">
                Quantum Shape Kernel
              </h3>
            </div>
            <span className="stamp-badge stamp-lime text-[10px]">Local simulation</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Reviews Flagged</span>
              <div className="font-editorial text-3xl font-bold text-[#F43F5E] mt-1">
                {metrics?.quantum_anomalies ?? 0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Kernel + Decision</span>
              <div className="font-mono text-xl font-bold text-[#0F172A] mt-1">
                {metrics
                  ? `${(metrics.quantum_kernel_time_ms + metrics.quantum_predict_time_ms).toFixed(1)} ms`
                  : '—'}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#475569] space-y-1.5 leading-relaxed">
            <p>• Maps linguistic features into quantum states using ZZFeatureMap.</p>
            <p>• Measures geometric state fidelity inner products via local simulation.</p>
            <p>• Identifies deceptive phrasing that blends into classical averages.</p>
          </div>
        </div>
      </div>

      {/* Agreement Matrix & Latency Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 cols: 2x2 Agreement Matrix */}
        <div className="lg:col-span-6 paper-card p-6 space-y-4 border-[#E5DCD0]">
          <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
            <div>
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Check Agreement Matrix
              </h3>
              <p className="text-xs text-[#64748B]">2×2 cross-tabulation of both model verdicts</p>
            </div>
            <span className="stamp-badge stamp-lime text-[10px]">
              CONCORDANCE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Both Normal */}
            <div className="p-4 rounded-xl bg-[#F7FEE7] border border-[#BEF264] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#3F6212] font-semibold">
                Both Agree Natural
              </span>
              <div className="font-editorial text-3xl font-bold text-[#059669]">
                {normalBoth}
              </div>
              <p className="text-[11px] text-[#4D7C0F]">Standard: OK • Quantum: OK</p>
            </div>

            {/* Standard Only Flagged */}
            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#1E40AF] font-semibold">
                Standard Only Flag
              </span>
              <div className="font-editorial text-3xl font-bold text-[#2563EB]">
                {classicalOnly}
              </div>
              <p className="text-[11px] text-[#1E40AF]">Standard: Flag • Quantum: OK</p>
            </div>

            {/* Quantum Only Flagged */}
            <div className="p-4 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#BE123C] font-semibold">
                Quantum Only Flag
              </span>
              <div className="font-editorial text-3xl font-bold text-[#F43F5E]">
                {quantumOnly}
              </div>
              <p className="text-[11px] text-[#BE123C]">Standard: OK • Quantum: Flag</p>
            </div>

            {/* Both Flagged */}
            <div className="p-4 rounded-xl bg-[#FFF1F2] border-2 border-[#FDA4AF] text-center space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#BE123C] font-bold">
                Both Agree Flagged
              </span>
              <div className="font-editorial text-3xl font-bold text-[#BE123C]">
                {suspBoth}
              </div>
              <p className="text-[11px] text-[#9F1239] font-medium">Unanimous Threat Flag</p>
            </div>
          </div>
        </div>

        {/* Right 6 cols: Latency Execution Chart */}
        <div className="lg:col-span-6 paper-card p-6 space-y-4 border-[#E5DCD0]">
          <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
            <div>
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Execution Latency Breakdown
              </h3>
              <p className="text-xs text-[#64748B]">Time spent per evaluation phase in milliseconds</p>
            </div>
            <span className="stamp-badge stamp-cobalt text-[10px]">
              TELEMETRY
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timingData} layout="vertical">
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="stage" type="category" stroke="#64748B" fontSize={11} width={150} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '0.75rem',
                    border: '1px solid #E5DCD0',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} ms`, 'Time']}
                />
                <Bar dataKey="timeMs" fill="#0F172A" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-lg bg-[#FAF6EE] text-[11px] text-[#64748B] leading-relaxed">
            <span className="font-semibold text-[#0F172A]">Notice on Simulator Speed:</span> Simulator execution time measures local tensor calculations on your computer. It is not equivalent to cloud hardware queue times.
          </div>
        </div>
      </div>

      {/* Model Technical Architecture Matrix */}
      <div className="paper-card p-6 border-[#E5DCD0] space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
          <div>
            <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
              Model Architecture &amp; Detection Specifications
            </h3>
            <p className="text-xs text-[#64748B]">
              Side-by-side technical parameters of both verification pipelines
            </p>
          </div>
          <span className="stamp-badge stamp-cobalt text-[10px]">DUAL PIPELINE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF6EE] text-[#64748B] font-mono uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Specification</th>
                <th className="py-2.5 px-3 text-[#2563EB]">Check 1: Standard Pattern</th>
                <th className="py-2.5 px-3 text-[#F43F5E]">Check 2: Quantum Shape (Local simulation)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCD0]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">Algorithm Foundation</td>
                <td className="py-2.5 px-3 text-[#334155]">Recursive Isolation Trees (scikit-learn)</td>
                <td className="py-2.5 px-3 text-[#334155]">ZZFeatureMap Hilbert Kernel (Qiskit Aer)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">Geometric Feature Space</td>
                <td className="py-2.5 px-3 text-[#334155]">Orthogonal Cartesian hyperplanes</td>
                <td className="py-2.5 px-3 text-[#334155]">2ⁿ-dimensional complex statevector fidelity</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">Primary Detection Target</td>
                <td className="py-2.5 px-3 text-[#334155]">Unilateral extremities (e.g. 100% caps, pure spam bursts)</td>
                <td className="py-2.5 px-3 text-[#334155]">Coupled non-linear correlations (rating vs brevity vs punctuation)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">Execution Engine</td>
                <td className="py-2.5 px-3 text-[#334155]">CPU Vectorized NumPy / C-extensions</td>
                <td className="py-2.5 px-3 text-[#334155]">Local Aer Simulation (Matrix multiplication)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">Agreement Synergy</td>
                <td className="py-2.5 px-3 text-[#334155]" colSpan={2}>
                  Unanimous agreement gives high-confidence action; divergence flags reviews needing forensic review.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
