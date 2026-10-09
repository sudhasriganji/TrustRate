import React from 'react';
import {
  Key,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { QuantumStatusResponse } from '../types';

interface SettingsTabProps {
  quantumStatus: QuantumStatusResponse | null;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ quantumStatus }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5DDD1]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-2xl font-bold text-[#0F172A]">
              Settings &amp; Environment
            </h2>
            <span className="stamp-badge stamp-cobalt text-[10px]">
              Active Configuration
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Backend runtime configuration, credentials privacy, and optional IBM Quantum cloud connection.
          </p>
        </div>
      </div>

      {/* Active Configuration Overview (Zero Token Leakage) */}
      <div className="paper-card p-6 md:p-8 space-y-4 border-[#E5DCD0]">
        <div className="flex items-center gap-2 border-b border-[#E5DCD0] pb-3">
          <ShieldCheck className="w-5 h-5 text-[#059669]" />
          <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
            Active Backend Configuration
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
            <span className="text-[#64748B]">Execution Mode</span>
            <div className="text-[#0F172A] font-bold mt-1">
              {quantumStatus?.current_execution_mode === 'ibm_hardware' ? 'Physical Hardware' : 'Local simulation'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
            <span className="text-[#64748B]">IBM Cloud Token</span>
            <div className="mt-1 flex items-center gap-1.5">
              {quantumStatus?.hardware_configured ? (
                <span className="text-[#059669] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Present (Securely Managed)
                </span>
              ) : (
                <span className="text-[#64748B]">Not Configured (Running in Local Simulation)</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
            <span className="text-[#64748B]">Qiskit Software Version</span>
            <div className="text-[#0F172A] font-bold mt-1">{quantumStatus?.qiskit_version || '2.5.2'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0]">
            <span className="text-[#64748B]">Target IBM Backend</span>
            <div className="text-[#0F172A] font-bold mt-1">
              {quantumStatus?.configured_backend || 'least_busy (automatic)'}
            </div>
          </div>
        </div>
      </div>

      {/* How to configure IBM Quantum Credentials (Optional) */}
      <div className="paper-card p-6 md:p-8 space-y-4 border-[#E5DCD0]">
        <div className="flex items-center gap-2 border-b border-[#E5DCD0] pb-3">
          <Key className="w-5 h-5 text-[#D97706]" />
          <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
            Optional: Connecting IBM Quantum Hardware
          </h3>
        </div>

        <div className="text-xs text-[#334155] space-y-3 leading-relaxed">
          <p>
            By default, TrustRate runs entirely locally on your computer using <span className="font-semibold text-[#0F172A]">Qiskit Aer</span> without needing an account or cloud token.
          </p>
          <p>
            If you wish to dispatch demonstration circuits to physical superconducting quantum processors:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-[#475569] pl-2">
            <li>
              Log into the official IBM Quantum Platform at{' '}
              <a
                href="https://quantum.ibm.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[#2563EB] hover:underline inline-flex items-center gap-0.5 font-medium"
              >
                quantum.ibm.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Copy your API Token from your account profile.</li>
            <li>
              Add it to your backend <span className="font-mono text-[#0F172A]">.env</span> file:
              <div className="mt-2 p-3 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0] font-mono text-[11px] text-[#0F172A]">
                QUANTUM_MODE=ibm_hardware<br />
                IBM_QUANTUM_TOKEN=your_token_here<br />
                IBM_BACKEND_NAME=ibm_brisbane # (or leave blank for auto)
              </div>
            </li>
            <li>Restart the backend server.</li>
          </ol>

          <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs">
            <span className="font-bold">Credential Privacy:</span> Tokens are read strictly by Python backend environment variables and are never transmitted to frontend JavaScript or committed to git.
          </div>
        </div>
      </div>

      {/* Runtime Profile & Environment Reference */}
      <div className="paper-card p-6 md:p-8 space-y-4 border-[#E5DCD0]">
        <div className="flex items-center justify-between border-b border-[#E5DCD0] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#2563EB]" />
            <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
              Runtime Environment Reference
            </h3>
          </div>
          <span className="stamp-badge stamp-lime text-[10px]">LOCAL SIMULATION</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF6EE] text-[#64748B] font-mono uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Variable / Parameter</th>
                <th className="py-2.5 px-3">Configured Value</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DCD0] font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">QUANTUM_MODE</td>
                <td className="py-2.5 px-3 text-[#2563EB]">aer</td>
                <td className="py-2.5 px-3 text-[#64748B] font-sans">Local simulation via Qiskit Aer statevector</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">DEFAULT_QUBITS</td>
                <td className="py-2.5 px-3 text-[#0F172A]">4</td>
                <td className="py-2.5 px-3 text-[#64748B] font-sans">Features mapped: brevity, punctuation, repetition, sentiment</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">ZZ_REPETITIONS</td>
                <td className="py-2.5 px-3 text-[#0F172A]">2</td>
                <td className="py-2.5 px-3 text-[#64748B] font-sans">Two-layer second-order Pauli feature map depth</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">API_PROXY_PORT</td>
                <td className="py-2.5 px-3 text-[#0F172A]">8000</td>
                <td className="py-2.5 px-3 text-[#64748B] font-sans">FastAPI backend local service loopback</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-[#0F172A]">HARDWARE_SUBMISSION</td>
                <td className="py-2.5 px-3 text-[#059669]">Disabled (Zero queue)</td>
                <td className="py-2.5 px-3 text-[#64748B] font-sans">Purely local simulation, no hardware credits consumed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
