import React, { useState } from 'react';
import {
  Cpu,
  Play,
  CheckCircle,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { api } from '../lib/api';
import { AnalyzeResponse, QuantumRunResponse, QuantumStatusResponse } from '../types';

interface QuantumLabTabProps {
  lastAnalysis: AnalyzeResponse | null;
  quantumStatus: QuantumStatusResponse | null;
}

export const QuantumLabTab: React.FC<QuantumLabTabProps> = ({
  lastAnalysis,
  quantumStatus,
}) => {
  const circuitInfo = lastAnalysis?.circuit_info;

  // Standalone circuit execution state
  const [circuitQubits, setCircuitQubits] = useState<number>(circuitInfo?.num_qubits || 2);
  const [circuitMode, setCircuitMode] = useState<string>('aer');
  const [shots, setShots] = useState<number>(1024);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<QuantumRunResponse | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const handleRunCircuit = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const res = await api.runQuantumCircuit({
        n_qubits: circuitQubits,
        mode: circuitMode,
        shots: shots,
        circuit_type: 'zz_feature_map',
      });
      setExecutionResult(res);
      if (res.status === 'failed') {
        setExecutionError(res.error || res.hardware_notice);
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Circuit execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Convert measurement counts to chart data
  const countsData = executionResult?.counts
    ? Object.entries(executionResult.counts).map(([state, count]) => ({
        state: `|${state}⟩`,
        count,
        probability: ((count / shots) * 100).toFixed(1),
      }))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5DDD1]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-2xl font-bold text-[#0F172A]">
              Quantum Circuit Lab
            </h2>
            <span className="stamp-badge stamp-lime text-[10px]">
              Local simulation
            </span>
            <span className="stamp-badge stamp-cobalt text-[10px]">
              Qiskit {quantumStatus?.qiskit_version || '2.5.2'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Inspect ZZFeatureMap circuits and test quantum statevector execution via local simulation.
          </p>
        </div>

        {/* Technical specs pill */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] bg-white px-3 py-1.5 rounded-lg border border-[#E5DCD0]">
          <span>Linear Entanglement</span>
          <span className="text-[#D8CEC0]">•</span>
          <span>Pauli-Z Phase</span>
          <span className="text-[#D8CEC0]">•</span>
          <span className="text-[#059669] font-semibold">Aer Statevector</span>
        </div>
      </div>

      {/* Circuit Metadata Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="paper-card p-4 space-y-1 border-[#E5DCD0]">
          <span className="text-xs font-mono uppercase text-[#64748B]">Qubits Active</span>
          <div className="font-editorial text-3xl font-bold text-[#0F172A]">
            {circuitInfo?.num_qubits || 4}
          </div>
          <p className="text-[11px] text-[#64748B]">Feature encoding registers</p>
        </div>

        <div className="paper-card p-4 space-y-1 border-[#E5DCD0]">
          <span className="text-xs font-mono uppercase text-[#64748B]">Circuit Depth</span>
          <div className="font-editorial text-3xl font-bold text-[#2563EB]">
            {circuitInfo?.depth || 8}
          </div>
          <p className="text-[11px] text-[#64748B]">Sequential gate layers</p>
        </div>

        <div className="paper-card p-4 space-y-1 border-[#E5DCD0]">
          <span className="text-xs font-mono uppercase text-[#64748B]">Total Circuit Gates</span>
          <div className="font-editorial text-3xl font-bold text-[#F43F5E]">
            {circuitInfo?.num_gates || 6}
          </div>
          <p className="text-[11px] text-[#64748B]">Quantum operations</p>
        </div>

        <div className="paper-card p-4 space-y-1 border-[#E5DCD0]">
          <span className="text-xs font-mono uppercase text-[#64748B]">Circuit Type</span>
          <div className="font-mono text-sm font-bold text-[#0F172A] mt-2">
            ZZFeatureMap
          </div>
          <p className="text-[11px] text-[#64748B]">Second-order Pauli expansion</p>
        </div>
      </div>

      {/* Standalone Circuit Runner Sandbox */}
      <div className="paper-card p-6 md:p-8 space-y-5 border-[#E5DCD0]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#E5DCD0] pb-4">
          <div>
            <h3 className="font-editorial text-2xl font-bold text-[#0F172A]">
              Execute Standalone Circuit (Local Simulation)
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Run a sample review feature circuit through Qiskit Aer to observe statevector probabilities
            </p>
          </div>
          <button
            onClick={handleRunCircuit}
            disabled={isExecuting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[#38BDF8] fill-current" />
            <span>{isExecuting ? 'Simulating...' : 'Run Circuit Simulation'}</span>
          </button>
        </div>

        {executionError && (
          <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#F43F5E]" />
            <span>{executionError}</span>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Backend Mode
            </label>
            <select
              value={circuitMode}
              onChange={(e) => setCircuitMode(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#D8CEC0] text-xs text-[#0F172A] focus:outline-none"
            >
              <option value="aer">Local simulation (Qiskit Aer)</option>
              <option value="ibm_hardware">IBM Quantum Hardware (Cloud)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Registers: <span className="font-mono text-[#2563EB]">{circuitQubits} Qubits</span>
            </label>
            <input
              type="range"
              min="2"
              max="4"
              value={circuitQubits}
              onChange={(e) => setCircuitQubits(parseInt(e.target.value))}
              className="w-full accent-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Measurement Shots: <span className="font-mono text-[#0F172A]">{shots}</span>
            </label>
            <input
              type="range"
              min="256"
              max="2048"
              step="256"
              value={shots}
              onChange={(e) => setShots(parseInt(e.target.value))}
              className="w-full accent-[#0F172A]"
            />
          </div>
        </div>

        {/* Results output */}
        {executionResult && (
          <div className="space-y-4 pt-4 border-t border-[#E5DCD0]">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                Measurement Probabilities ({shots} Shots)
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                Latency: {executionResult.execution_time_ms} ms
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countsData}>
                  <XAxis dataKey="state" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5DCD0',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} counts`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Open QASM / ASCII Circuit Display */}
        {circuitInfo?.circuit_diagram && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono uppercase text-[#64748B] font-semibold">
              Qiskit Circuit ASCII Diagram
            </span>
            <pre className="p-4 rounded-xl bg-[#0F172A] text-[#38BDF8] text-[11px] font-mono overflow-x-auto leading-relaxed border border-[#1E293B]">
              {circuitInfo.circuit_diagram}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
