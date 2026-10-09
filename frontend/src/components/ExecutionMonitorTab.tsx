import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  CloudLightning,
  Cpu,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  History,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { QuantumStatusResponse, JobStatusResponse } from '../types';

interface ExecutionMonitorTabProps {
  quantumStatus: QuantumStatusResponse | null;
  onRefreshStatus: () => void;
}

export const ExecutionMonitorTab: React.FC<ExecutionMonitorTabProps> = ({
  quantumStatus,
  onRefreshStatus,
}) => {
  const [jobIdInput, setJobIdInput] = useState('');
  const [queriedJob, setQueriedJob] = useState<JobStatusResponse | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  const [auditData, setAuditData] = useState<any>(null);

  const loadAuditHistory = async () => {
    try {
      const data = await api.getMetrics();
      setAuditData(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAuditHistory();
  }, []);

  const handleQueryJob = async () => {
    if (!jobIdInput.trim()) return;
    setIsQuerying(true);
    setJobError(null);
    try {
      const res = await api.getJobStatus(jobIdInput.trim());
      setQueriedJob(res);
      if (res.error) setJobError(res.error);
    } catch (err: any) {
      setJobError(err.message || 'Job status lookup failed.');
    } finally {
      setIsQuerying(false);
    }
  };

  const isHw = quantumStatus?.current_execution_mode === 'ibm_hardware';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5DDD1]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-2xl font-bold text-[#0F172A]">
              System Telemetry &amp; Status
            </h2>
            <span className="stamp-badge stamp-lime text-[10px]">
              Local simulation
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time execution telemetry, simulation operational health, and historical audit logs.
          </p>
        </div>

        <button
          onClick={() => {
            onRefreshStatus();
            loadAuditHistory();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF6EE] text-[#0F172A] border border-[#D8CEC0] text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#64748B]" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mode Card */}
        <div className="paper-card p-6 space-y-3 border-[#E5DCD0]">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-mono uppercase">Active Environment</span>
            {isHw ? (
              <CloudLightning className="w-4 h-4 text-[#D97706]" />
            ) : (
              <Cpu className="w-4 h-4 text-[#2563EB]" />
            )}
          </div>
          <div className="font-editorial text-2xl font-bold text-[#0F172A]">
            {isHw ? 'Physical Quantum Hardware' : 'Local simulation'}
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {isHw
              ? 'Configured to dispatch jobs to physical superconducting processors.'
              : 'Executes high-speed statevector tensor operations on your local machine.'}
          </p>
        </div>

        {/* Credentials Status */}
        <div className="paper-card p-6 space-y-3 border-[#E5DCD0]">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-mono uppercase">IBM Cloud Credentials</span>
            <Server className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                quantumStatus?.hardware_configured ? 'bg-[#10B981]' : 'bg-[#94A3B8]'
              }`}
            ></span>
            <span className="font-editorial text-2xl font-bold text-[#0F172A]">
              {quantumStatus?.hardware_configured ? 'Token Loaded' : 'Not Configured'}
            </span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {quantumStatus?.hardware_configured
              ? 'IBM Quantum cloud token is securely recognized in backend environment.'
              : 'No IBM account is needed. Local simulation mode runs out of the box.'}
          </p>
        </div>

        {/* Connectivity Status */}
        <div className="paper-card p-6 space-y-3 border-[#E5DCD0]">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-mono uppercase">Verification Status</span>
            <Activity className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="font-editorial text-2xl font-bold text-[#0F172A]">
            {quantumStatus?.hardware_connectivity_verified ? 'Verified Active' : 'Simulation Ready'}
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {quantumStatus?.message || 'Local simulation (Qiskit Aer) ready.'}
          </p>
        </div>
      </div>

      {/* Cloud Job Status Query Tool */}
      <div className="paper-card p-6 md:p-8 space-y-4 border-[#E5DCD0]">
        <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
          <div>
            <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
              Lookup Quantum Hardware Job
            </h3>
            <p className="text-xs text-[#64748B]">
              Track asynchronous execution status of any dispatched IBM Quantum job ID
            </p>
          </div>
          <span className="stamp-badge stamp-cobalt text-[10px]">
            JOB TRACKER
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Paste IBM Quantum Job ID (e.g. c123abc456...)"
            value={jobIdInput}
            onChange={(e) => setJobIdInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF6EE] border border-[#D8CEC0] text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
          />
          <button
            onClick={handleQueryJob}
            disabled={isQuerying || !jobIdInput.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-4 h-4 text-[#38BDF8]" />
            <span>{isQuerying ? 'Querying...' : 'Track Job'}</span>
          </button>
        </div>

        {jobError && (
          <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#F43F5E]" />
            <span>{jobError}</span>
          </div>
        )}

        {queriedJob && !jobError && (
          <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[#64748B]">Job ID: {queriedJob.job_id}</span>
              <span className="stamp-badge stamp-ink text-[10px]">{queriedJob.status}</span>
            </div>
            {queriedJob.backend && (
              <div className="text-[#0F172A]">Backend: <span className="font-mono font-bold">{queriedJob.backend}</span></div>
            )}
            {queriedJob.creation_date && (
              <div className="text-[#64748B]">Created: {queriedJob.creation_date}</div>
            )}
          </div>
        )}
      </div>

      {/* Session Audit History Metrics */}
      {auditData && (
        <div className="paper-card p-6 md:p-8 space-y-4 border-[#E5DCD0]">
          <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#0F172A]" />
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Session Audit Telemetry
              </h3>
            </div>
            <span className="stamp-badge stamp-lime text-[10px]">
              LOGGED RUNS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Lifetime Scans</span>
              <div className="font-editorial text-2xl font-bold text-[#0F172A] mt-1">
                {auditData.total_reviews}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Standard Anomalies</span>
              <div className="font-editorial text-2xl font-bold text-[#2563EB] mt-1">
                {auditData.classical_anomalies}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Quantum Anomalies</span>
              <div className="font-editorial text-2xl font-bold text-[#F43F5E] mt-1">
                {auditData.quantum_anomalies}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
              <span className="text-[#64748B]">Overall Concordance</span>
              <div className="font-editorial text-2xl font-bold text-[#0F172A] mt-1">
                {(auditData.concordance_rate * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
