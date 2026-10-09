import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { ScannerTab } from './components/ScannerTab';
import { InvestigationTab } from './components/InvestigationTab';
import { QuantumLabTab } from './components/QuantumLabTab';
import { ComparisonArenaTab } from './components/ComparisonArenaTab';
import { ExecutionMonitorTab } from './components/ExecutionMonitorTab';
import { SettingsTab } from './components/SettingsTab';
import { BrandMark } from './components/BrandMark';
import { api } from './lib/api';
import {
  AnalyzeResponse,
  HealthResponse,
  QuantumStatusResponse,
} from './types';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [quantumStatus, setQuantumStatus] = useState<QuantumStatusResponse | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial backend health & telemetry fetch
  const fetchTelemetry = async () => {
    try {
      const [h, qs] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getQuantumStatus().catch(() => null),
      ]);
      if (h) setHealth(h);
      if (qs) setQuantumStatus(qs);
    } catch {
      // ignore
    }
  };

  // Run sample dataset
  const handleRunSampleData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sample = await api.getSampleData();
      const res = await api.analyzeReviews(sample.reviews, true, 4, 2);
      setLastAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze sample dataset.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Auto-load sample reviews on initial visit so the full prototype features are immediately populated
    handleRunSampleData();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#0F172A] flex flex-col font-sans selection:bg-[#FCE7F3] selection:text-[#BE123C]">
      {/* Top Application Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        quantumStatus={quantumStatus}
        onRunSampleData={handleRunSampleData}
        isLoading={isLoading}
      />

      {/* Main Interactive Tool Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5">
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#F43F5E]" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[#BE123C] hover:underline font-semibold text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <OverviewTab
            lastAnalysis={lastAnalysis}
            onRunSampleData={handleRunSampleData}
            onNavigateTab={setActiveTab}
            isLoading={isLoading}
            onScanComplete={(res) => setLastAnalysis(res)}
          />
        )}

        {/* Tab 2: Review Scanner */}
        {activeTab === 'scanner' && (
          <ScannerTab
            onScanComplete={(res) => {
              setLastAnalysis(res);
            }}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
            lastAnalysis={lastAnalysis}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab 3: Evidence Room */}
        {activeTab === 'investigation' && (
          <InvestigationTab lastAnalysis={lastAnalysis} />
        )}

        {/* Tab 4: Two Checks / Comparison */}
        {activeTab === 'comparison' && (
          <ComparisonArenaTab
            lastAnalysis={lastAnalysis}
            quantumStatus={quantumStatus}
          />
        )}

        {/* Tab 5: Quantum Lab */}
        {activeTab === 'quantum-lab' && (
          <QuantumLabTab
            lastAnalysis={lastAnalysis}
            quantumStatus={quantumStatus}
          />
        )}

        {/* Tab 6: System Status / Telemetry */}
        {activeTab === 'monitor' && (
          <ExecutionMonitorTab
            quantumStatus={quantumStatus}
            onRefreshStatus={fetchTelemetry}
          />
        )}

        {/* Tab 7: Settings */}
        {activeTab === 'settings' && (
          <SettingsTab quantumStatus={quantumStatus} />
        )}
      </main>

      {/* Practical App Status Bar / Footer */}
      <footer className="mt-auto border-t border-[#E5DDD1] bg-[#F3ECE0] px-4 lg:px-8 py-3 text-xs text-[#64748B]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <BrandMark size={18} />
            <span className="font-editorial text-sm font-bold text-[#0F172A]">TrustRate</span>
            <span className="text-[#94A3B8]">•</span>
            <span className="text-[11px]">Dual-Check Fake Review Detection Prototype</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-[#475569]">
            <span>Check A: Standard Pattern</span>
            <span className="text-[#D8CEC0]">+</span>
            <span>Check B: Quantum Shape</span>
            <span className="text-[#D8CEC0]">|</span>
            <span className="stamp-badge stamp-lime text-[9px]">Local simulation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
