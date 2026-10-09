import React from 'react';
import {
  LayoutDashboard,
  Search,
  FileCheck2,
  GitCompare,
  Cpu,
  Activity,
  Sliders,
  Play,
  RotateCw,
} from 'lucide-react';
import { HealthResponse, QuantumStatusResponse } from '../types';
import { BrandWordmark } from './BrandMark';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthResponse | null;
  quantumStatus: QuantumStatusResponse | null;
  onRunSampleData?: () => void;
  isLoading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  quantumStatus,
  onRunSampleData,
  isLoading,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'scanner', label: 'Review Scanner', icon: Search },
    { id: 'investigation', label: 'Evidence Room', icon: FileCheck2 },
    { id: 'comparison', label: 'Two Checks', icon: GitCompare },
    { id: 'quantum-lab', label: 'Quantum Lab', icon: Cpu },
    { id: 'monitor', label: 'System Status', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const isHw = quantumStatus?.current_execution_mode === 'ibm_hardware';

  return (
    <header className="sticky top-0 z-50 bg-[#FAF6EE]/95 backdrop-blur-md border-b border-[#E5DDD1] px-4 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand: Custom Dual-Lens Investigation Mark + Wordmark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="group cursor-pointer text-left focus:outline-none transition-transform"
            title="TrustRate — Dual-Check Review Detection"
            aria-label="TrustRate Home"
          >
            <BrandWordmark size="md" />
          </button>
        </div>

        {/* Full Prototype Tool Navigation (All 7 views) */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F3ECE0]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#38BDF8]' : 'text-[#64748B]'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Quick Sample Trigger & Execution Environment Badge */}
        <div className="flex items-center gap-2 text-xs">
          {onRunSampleData && (
            <button
              onClick={onRunSampleData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F3ECE0] border border-[#D8CEC0] text-[11px] font-semibold text-[#0F172A] shadow-2xs transition disabled:opacity-50 cursor-pointer"
              title="Quickly test dual checks on 30 sample reviews"
            >
              {isLoading ? (
                <RotateCw className="w-3 h-3 text-[#2563EB] animate-spin" />
              ) : (
                <Play className="w-3 h-3 text-[#F43F5E] fill-current" />
              )}
              <span className="hidden sm:inline">{isLoading ? 'Checking...' : 'Sample Reviews (30)'}</span>
            </button>
          )}

          {/* Honest Simulation Disclosure */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-mono font-semibold bg-[#F7FEE7] border-[#BEF264] text-[#3F6212]"
            title={isHw ? 'Submitting to real hardware' : 'Running via Qiskit Aer local simulation'}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse"></span>
            <span>{isHw ? 'IBM Hardware' : 'Local simulation'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
