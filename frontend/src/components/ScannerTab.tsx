import React, { useState, useEffect } from 'react';
import {
  Upload,
  Search,
  Zap,
  Sliders,
  FileSpreadsheet,
  AlertCircle,
  Download,
  Flame,
  CheckCircle,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  Star,
  Check,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api';
import { AnalyzeResponse, ReviewAnalysisResult, ReviewItem } from '../types';

interface ScannerTabProps {
  onScanComplete: (response: AnalyzeResponse) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  error: string | null;
  setError: (err: string | null) => void;
  lastAnalysis: AnalyzeResponse | null;
  onNavigateTab?: (tab: string) => void;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({
  onScanComplete,
  isLoading,
  setIsLoading,
  error,
  setError,
  lastAnalysis,
  onNavigateTab,
}) => {
  // Input modes: 'single', 'csv', 'attack'
  const [inputMode, setInputMode] = useState<'single' | 'csv' | 'attack'>('single');

  // Single review form inputs
  const [singleText, setSingleText] = useState(
    'AMAZING PRODUCT! BEST EVER!!!! BUY BUY BUY! 100% RECOMMEND TO EVERYONE WOW WOW WOW!!!'
  );
  const [singleRating, setSingleRating] = useState<number>(5.0);
  const [singleProductId, setSingleProductId] = useState('PROD-HEADPHONES');

  // CSV upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Attack simulator state
  const [attackType, setAttackType] = useState('sybil_burst');
  const [attackIntensity, setAttackIntensity] = useState<number>(6);

  // Quantum settings
  const [nQubits, setNQubits] = useState<number>(4);
  const [reps, setReps] = useState<number>(2);
  const [useQuantum, setUseQuantum] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Interactive Inspector state (which review from results is currently inspected)
  const [activeReviewId, setActiveReviewId] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<'all' | 'flagged' | 'clean' | 'divergent'>('all');

  // Multi-step analysis progress simulation
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (isLoading) {
      setAnalysisStep(1);
      timer = setTimeout(() => {
        setAnalysisStep(2);
      }, 350);
    } else {
      setAnalysisStep(0);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Sync active review when new results arrive
  useEffect(() => {
    if (lastAnalysis?.results && lastAnalysis.results.length > 0) {
      setActiveReviewId(lastAnalysis.results[0].review_id);
    }
  }, [lastAnalysis]);

  // Current selected review in inspector
  const currentReview: ReviewAnalysisResult | null =
    lastAnalysis?.results.find((r) => r.review_id === activeReviewId) ||
    lastAnalysis?.results[0] ||
    null;

  // Handle single review scan
  const handleScanSingle = async () => {
    if (!singleText.trim()) {
      setError('Please enter review text to inspect.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const review: ReviewItem = {
        review_id: `REV-${Date.now().toString().slice(-4)}`,
        product_id: singleProductId.trim() || 'PROD-GENERAL',
        rating: singleRating,
        review_text: singleText.trim(),
      };
      const response = await api.analyzeReviews([review], useQuantum, nQubits, reps);
      onScanComplete(response);
    } catch (err: any) {
      setError(err.message || 'Review inspection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleScanSingle();
    }
  };

  // Handle CSV upload scan
  const handleScanCSV = async () => {
    if (!selectedFile) {
      setError('Please select a valid CSV file first.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.uploadCSV(selectedFile, useQuantum, nQubits, reps);
      onScanComplete(response);
    } catch (err: any) {
      setError(err.message || 'CSV analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Attack pattern simulation
  const handleSimulateAttack = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const sim = await api.simulateAttack(attackType, attackIntensity);
      const response = await api.analyzeReviews(sim.reviews, useQuantum, nQubits, reps);
      onScanComplete(response);
    } catch (err: any) {
      setError(err.message || 'Attack pattern simulation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Export CSV
  const handleExportCSV = async () => {
    if (!lastAnalysis || !lastAnalysis.results.length) return;
    try {
      const blob = await api.exportResultsCSV(lastAnalysis.results);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trustrate_audit_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export CSV results.');
    }
  };

  // Filtered batch reviews
  const filteredBatchReviews = (lastAnalysis?.results || []).filter((r) => {
    if (batchFilter === 'flagged') {
      return r.classical_label === 'suspicious' || r.quantum_label === 'suspicious';
    }
    if (batchFilter === 'clean') {
      return r.classical_label === 'normal' && r.quantum_label === 'normal';
    }
    if (batchFilter === 'divergent') {
      return r.classical_label !== r.quantum_label;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. App Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DDD1]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Review Checker
            </h1>
            <span className="stamp-badge stamp-lime text-[10px]">
              Local simulation
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Evaluate review authenticity using parallel standard pattern &amp; quantum shape checks.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center p-1 rounded-xl bg-[#EBE4D8] border border-[#D8CEC0] text-xs font-semibold">
          <button
            onClick={() => setInputMode('single')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              inputMode === 'single'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Single Review
          </button>
          <button
            onClick={() => setInputMode('csv')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              inputMode === 'csv'
                ? 'bg-white text-[#0F172A] shadow-xs'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            Batch CSV
          </button>
          <button
            onClick={() => setInputMode('attack')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              inputMode === 'attack'
                ? 'bg-white text-[#F43F5E] shadow-xs'
                : 'text-[#64748B] hover:text-[#F43F5E]'
            }`}
          >
            Threat Simulator
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#F43F5E]" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-[#BE123C] hover:underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Two-Column Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Review Input Workbench (6 Cols on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="paper-card p-5 sm:p-6 space-y-4 border-[#E5DDD1] bg-white">
            
            {/* Mode 1: Single Review */}
            {inputMode === 'single' && (
              <div className="space-y-4">
                {/* Product ID & Star Rating */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold mb-1">
                      Product Name / ID
                    </label>
                    <input
                      type="text"
                      value={singleProductId}
                      onChange={(e) => setSingleProductId(e.target.value)}
                      placeholder="e.g. PROD-HEADPHONES"
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#D8CEC0] text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
                    />
                  </div>

                  {/* Interactive Star Rating */}
                  <div className="sm:col-span-6">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                        Rating Given
                      </label>
                      <span className="text-xs font-mono font-bold text-[#D97706]">
                        {singleRating.toFixed(1)} ★
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#FAF6EE] border border-[#D8CEC0]">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isFilled = starVal <= Math.round(singleRating);
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setSingleRating(starVal)}
                            className="p-1 rounded hover:scale-115 transition-transform cursor-pointer"
                            title={`Set rating to ${starVal} star${starVal > 1 ? 's' : ''}`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isFilled
                                  ? 'text-[#D97706] fill-[#D97706]'
                                  : 'text-[#D8CEC0]'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="text-[11px] text-[#64748B] font-mono ml-auto mr-1">
                        {singleRating >= 4 ? 'Positive' : singleRating === 3 ? 'Neutral' : 'Negative'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text Input Area */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                      Customer Review Text
                    </label>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {singleText.length} chars • {singleText.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={singleText}
                    onChange={(e) => setSingleText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste or type customer review text here..."
                    className="w-full p-3.5 rounded-xl bg-[#FAF6EE] border border-[#D8CEC0] text-xs text-[#0F172A] leading-relaxed resize-y font-sans focus:outline-none focus:border-[#0F172A] focus:ring-1 focus:ring-[#0F172A]"
                  />
                </div>

                {/* Quick-fill Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono text-[#64748B] block">
                    Quick Test Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSingleText('AMAZING PRODUCT! BEST EVER!!!! BUY BUY BUY! 100% RECOMMEND TO EVERYONE WOW WOW WOW!!!');
                        setSingleRating(5.0);
                        setSingleProductId('PROD-HEADPHONES');
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3] transition cursor-pointer"
                    >
                      ⚡ Bot Spam Flood
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSingleText('I have tested dozens of wireless headphones and this one stands out. The active noise cancellation handles metro rumble with ease, and battery lasted 32 hours across three days of work.');
                        setSingleRating(5.0);
                        setSingleProductId('PROD-HEADPHONES');
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-[#F7FEE7] hover:bg-[#ECFCCB] text-[#3F6212] border border-[#BEF264] transition cursor-pointer"
                    >
                      🌿 Organic Review
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSingleText('TERRIBLE HORRIBLE BROKE IN 1 MINUTE SCAM SCAM DONT BUY WORST THING ON EARTH ZERO STARS!!!!');
                        setSingleRating(1.0);
                        setSingleProductId('PROD-HEADPHONES');
                      }}
                      className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] transition cursor-pointer"
                    >
                      ⚔️ Competitor Smear
                    </button>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E5DDD1]">
                  <label className="flex items-center gap-2 text-xs text-[#0F172A] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useQuantum}
                      onChange={(e) => setUseQuantum(e.target.checked)}
                      className="rounded border-[#D8CEC0] text-[#0F172A] focus:ring-0"
                    />
                    <span>Quantum check enabled</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold cursor-pointer px-2 py-1"
                    >
                      {showAdvanced ? 'Hide tuning' : 'Tuning'}
                    </button>

                    <button
                      type="button"
                      onClick={handleScanSingle}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-[#38BDF8]" />
                      <span>{isLoading ? 'Checking Review...' : 'Analyze Review'}</span>
                      <span className="text-[10px] text-[#94A3B8] font-mono hidden sm:inline">⌘↵</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Batch CSV Upload */}
            {inputMode === 'csv' && (
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-[#D8CEC0] hover:border-[#0F172A] rounded-2xl p-7 text-center transition cursor-pointer bg-[#FAF6EE]/60"
                  onClick={() => document.getElementById('csv-upload-input')?.click()}
                >
                  <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#0F172A] mb-1">
                    {selectedFile ? selectedFile.name : 'Click or drop a CSV file to inspect in batch'}
                  </p>
                  <p className="text-xs text-[#64748B] font-mono">
                    Headers supported: review_text, rating, review_id, product_id
                  </p>
                  <input
                    id="csv-upload-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF6EE] border border-[#E5DDD1] text-xs">
                    <span className="font-mono text-[#0F172A] truncate">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-[#F43F5E] hover:underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleScanCSV}
                    disabled={isLoading || !selectedFile}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#38BDF8]" />
                    <span>{isLoading ? 'Processing Dataset...' : 'Analyze CSV Dataset'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Mode 3: Threat Simulator */}
            {inputMode === 'attack' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#BE123C] leading-relaxed">
                  <span className="font-bold">Synthetic Threat Test:</span> Test dual-model sensitivity against bot floods, copy-paste repetition, or competitor review sabotage campaigns.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Campaign Pattern
                    </label>
                    <select
                      value={attackType}
                      onChange={(e) => setAttackType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#D8CEC0] text-xs text-[#0F172A] focus:outline-none"
                    >
                      <option value="sybil_burst">Sybil Bot Burst (5★ Exclamation Floods)</option>
                      <option value="copy_paste_spam">Copy-Paste Bot Swarm (Identical Phrases)</option>
                      <option value="competitor_smear">Competitor Smear (1★ Sabotage Swarm)</option>
                      <option value="polarity_manipulation">Polarity Conflict (5★ Rating + Negative Text)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Campaign Volume: <span className="font-mono text-[#F43F5E]">{attackIntensity} reviews</span>
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="15"
                      value={attackIntensity}
                      onChange={(e) => setAttackIntensity(parseInt(e.target.value))}
                      className="w-full accent-[#F43F5E] mt-1 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSimulateAttack}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F43F5E] hover:bg-[#E11D48] text-white text-xs font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <Flame className="w-4 h-4" />
                    <span>{isLoading ? 'Generating & Analyzing...' : 'Generate & Test Threat'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Advanced Tuning Sliders (collapsible) */}
            {showAdvanced && (
              <div className="space-y-3 pt-3 border-t border-[#E5DDD1] text-xs animate-in fade-in duration-150">
                <span className="font-mono font-bold text-[#64748B] uppercase text-[10px]">
                  Quantum Kernel Registers (Local Simulation)
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#64748B]">Qubits</span>
                      <span className="font-mono font-bold">{nQubits}</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="4"
                      value={nQubits}
                      onChange={(e) => setNQubits(parseInt(e.target.value))}
                      className="w-full accent-[#0F172A]"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#64748B]">Layers</span>
                      <span className="font-mono font-bold">{reps}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value))}
                      className="w-full accent-[#2563EB]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Analysis Findings & Interactive Inspector (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Analysis In-Progress State */}
          {isLoading && (
            <div className="paper-card p-6 space-y-4 border-[#E5DDD1] bg-white animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-[#0F172A]">
                <RefreshCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                <span>Running Dual Analysis Pipeline...</span>
              </div>

              {/* Multi-step progress tracker */}
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-[#059669]">
                  <CheckCircle className="w-4 h-4 shrink-0 text-[#059669]" />
                  <span>1. Signal Extraction (brevity, punctuation, repetition)</span>
                </div>
                <div className="flex items-center gap-2 text-[#2563EB]">
                  <span className="w-4 h-4 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin shrink-0"></span>
                  <span>2. Check A: Standard Isolation Forest baseline</span>
                </div>
                <div className="flex items-center gap-2 text-[#F43F5E]">
                  <span className="w-4 h-4 rounded-full border-2 border-[#F43F5E] border-t-transparent animate-spin shrink-0"></span>
                  <span>3. Check B: Quantum Shape kernel (local simulation)</span>
                </div>
                <div className="flex items-center gap-2 text-[#64748B]">
                  <span className="w-4 h-4 rounded-full bg-[#E5DDD1] shrink-0"></span>
                  <span>4. Synthesizing dual-check consensus...</span>
                </div>
              </div>
            </div>
          )}

          {/* Active Review Finding Dossier */}
          {!isLoading && currentReview && (
            <div className="paper-card p-6 space-y-5 border-[#E5DDD1] bg-white shadow-sm">
              {/* Verdict Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DDD1] pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#64748B]">
                      {currentReview.review_id}
                    </span>
                    <span className="font-mono text-xs text-[#0F172A] font-semibold bg-[#FAF6EE] px-2 py-0.5 rounded border border-[#E5DDD1]">
                      {currentReview.product_id}
                    </span>
                    <span className="text-xs font-mono text-[#D97706] font-bold">
                      {currentReview.rating.toFixed(1)} ★
                    </span>
                  </div>
                  
                  {/* Verdict Badge */}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`stamp-badge text-[11px] ${
                        currentReview.combined_risk_score > 60
                          ? 'stamp-coral'
                          : currentReview.combined_risk_score > 35
                          ? 'stamp-cobalt'
                          : 'stamp-lime'
                      }`}
                    >
                      {currentReview.combined_risk_score > 60
                        ? 'SUSPICIOUS PATTERN DETECTED'
                        : currentReview.combined_risk_score > 35
                        ? 'DIVERGENT PATTERN (CHECKS DIFFER)'
                        : 'LIKELY ORGANIC REVIEW'}
                    </span>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-[#64748B] font-semibold">
                    Combined Risk Score
                  </div>
                  <div
                    className={`font-editorial text-3xl font-bold ${
                      currentReview.combined_risk_score > 60
                        ? 'text-[#F43F5E]'
                        : currentReview.combined_risk_score > 35
                        ? 'text-[#2563EB]'
                        : 'text-[#059669]'
                    }`}
                  >
                    {currentReview.combined_risk_score}%
                  </div>
                </div>
              </div>

              {/* Review Excerpt */}
              <blockquote className="p-3.5 rounded-xl bg-[#FAF6EE] border-l-3 border-l-[#0F172A] text-xs text-[#0F172A] leading-relaxed italic font-serif">
                &ldquo;{currentReview.review_text}&rdquo;
              </blockquote>

              {/* The Two Checks Side-by-Side Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Standard Check */}
                <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DDD1] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Check A: Standard Pattern</span>
                    <span className="font-mono text-[#0F172A] font-bold">
                      {currentReview.classical_score.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-xs font-bold capitalize ${
                        currentReview.classical_label === 'suspicious'
                          ? 'text-[#F43F5E]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {currentReview.classical_label === 'suspicious' ? 'Flagged Outlier' : 'Normal Pattern'}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {currentReview.classical_risk_score}% risk
                    </span>
                  </div>
                </div>

                {/* Quantum Check */}
                <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DDD1] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Check B: Quantum (Local)</span>
                    <span className="font-mono text-[#0F172A] font-bold">
                      {currentReview.quantum_score !== null ? currentReview.quantum_score?.toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-xs font-bold capitalize ${
                        currentReview.quantum_label === 'suspicious'
                          ? 'text-[#2563EB]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {currentReview.quantum_label === 'suspicious' ? 'Flagged Shape' : 'Normal Shape'}
                    </span>
                    <span className="text-[11px] font-mono text-[#64748B]">
                      {currentReview.quantum_risk_score !== null ? `${currentReview.quantum_risk_score}% risk` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Why It Was Flagged (Human-readable reasons) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase text-[#64748B] font-semibold">
                  Why this review was rated:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentReview.reasons.map((r, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs bg-[#FAF6EE] text-[#0F172A] border border-[#D8CEC0] font-medium"
                    >
                      • {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Linguistic Signals Meter */}
              {currentReview.feature_attributions && currentReview.feature_attributions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E5DDD1]">
                  <span className="text-[11px] font-mono uppercase text-[#64748B] font-semibold">
                    Observed Linguistic Signals
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {currentReview.feature_attributions.slice(0, 4).map((attr, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-[#FAF6EE] border border-[#E5DDD1] space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium text-[#0F172A] truncate">{attr.feature_name}</span>
                          <span className="font-mono text-[#64748B]">{(attr.normalized_value * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#E5DDD1] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              attr.normalized_value > 0.6
                                ? 'bg-[#F43F5E]'
                                : attr.normalized_value > 0.3
                                ? 'bg-[#D97706]'
                                : 'bg-[#059669]'
                            }`}
                            style={{ width: `${Math.min(attr.normalized_value * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Quick Action */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E5DDD1] text-xs">
                <span className="text-[#64748B] text-[11px]">
                  Quantum kernel executed via local simulation (Qiskit Aer)
                </span>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('investigation')}
                    className="text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Evidence Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty Ready State */}
          {!isLoading && !currentReview && (
            <div className="paper-card p-10 text-center space-y-3 border-[#E5DDD1] bg-white text-[#64748B]">
              <Search className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Ready to Inspect Reviews
              </h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Enter review text on the left or select a quick test preset to run the dual classical &amp; quantum analysis.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Batch Reviews Feed (When CSV or multiple reviews are present) */}
      {lastAnalysis?.results && lastAnalysis.results.length > 1 && (
        <div className="paper-card p-6 space-y-4 border-[#E5DDD1] bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5DDD1] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                  Inspected Reviews Stream ({lastAnalysis.results.length})
                </h3>
                <span className="stamp-badge stamp-cobalt text-[10px]">
                  BATCH RESULTS
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Click any review in the stream to load its full findings into the inspector.
              </p>
            </div>

            {/* Filter and Export */}
            <div className="flex items-center gap-2">
              <div className="flex p-0.5 rounded-lg bg-[#FAF6EE] border border-[#D8CEC0] text-xs font-semibold">
                <button
                  onClick={() => setBatchFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    batchFilter === 'all' ? 'bg-[#0F172A] text-white' : 'text-[#64748B]'
                  }`}
                >
                  All ({lastAnalysis.results.length})
                </button>
                <button
                  onClick={() => setBatchFilter('flagged')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    batchFilter === 'flagged' ? 'bg-[#F43F5E] text-white' : 'text-[#BE123C]'
                  }`}
                >
                  Flagged
                </button>
                <button
                  onClick={() => setBatchFilter('clean')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    batchFilter === 'clean' ? 'bg-[#059669] text-white' : 'text-[#059669]'
                  }`}
                >
                  Natural
                </button>
                <button
                  onClick={() => setBatchFilter('divergent')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                    batchFilter === 'divergent' ? 'bg-[#2563EB] text-white' : 'text-[#1D4ED8]'
                  }`}
                >
                  Divergent
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#EAE3D8] border border-[#D8CEC0] text-xs font-semibold text-[#0F172A] transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table / List */}
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF6EE] text-[#64748B] font-mono uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Review ID</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Review Text</th>
                  <th className="py-2.5 px-3">Standard</th>
                  <th className="py-2.5 px-3">Quantum</th>
                  <th className="py-2.5 px-3 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD1]">
                {filteredBatchReviews.map((r) => {
                  const isSelected = r.review_id === activeReviewId;
                  return (
                    <tr
                      key={r.review_id}
                      onClick={() => setActiveReviewId(r.review_id)}
                      className={`hover:bg-[#FAF6EE]/80 cursor-pointer transition ${
                        isSelected ? 'bg-[#FAF6EE] font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono">{r.review_id}</td>
                      <td className="py-2.5 px-3 font-mono text-[#64748B]">{r.product_id}</td>
                      <td className="py-2.5 px-3 text-[#D97706] font-mono">{r.rating.toFixed(1)} ★</td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-[#334155]">{r.review_text}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold ${
                            r.classical_label === 'suspicious' ? 'text-[#F43F5E]' : 'text-[#059669]'
                          }`}
                        >
                          {r.classical_label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-semibold ${
                            r.quantum_label === 'suspicious' ? 'text-[#2563EB]' : 'text-[#059669]'
                          }`}
                        >
                          {r.quantum_label || 'normal'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`stamp-badge text-[9px] ${
                            r.combined_risk_score > 60
                              ? 'stamp-coral'
                              : r.combined_risk_score > 35
                              ? 'stamp-cobalt'
                              : 'stamp-lime'
                          }`}
                        >
                          {r.combined_risk_score}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
