import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle,
  ShieldAlert,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Star,
  CornerDownRight,
} from 'lucide-react';
import { AnalyzeResponse, ReviewAnalysisResult } from '../types';

interface InvestigationTabProps {
  lastAnalysis: AnalyzeResponse | null;
}

export const InvestigationTab: React.FC<InvestigationTabProps> = ({ lastAnalysis }) => {
  const results = lastAnalysis?.results || [];
  const [selectedId, setSelectedId] = useState<string>(results[0]?.review_id || '');
  const [filterMode, setFilterMode] = useState<'all' | 'suspicious' | 'divergent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedReview: ReviewAnalysisResult | undefined =
    results.find((r) => r.review_id === selectedId) || results[0];

  const filteredResults = results.filter((r) => {
    if (filterMode === 'suspicious') {
      if (r.classical_label !== 'suspicious' && r.quantum_label !== 'suspicious') return false;
    } else if (filterMode === 'divergent') {
      if (r.classical_label === r.quantum_label) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.review_id.toLowerCase().includes(q) ||
        r.product_id.toLowerCase().includes(q) ||
        r.review_text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!results.length) {
    return (
      <div className="paper-card p-12 text-center max-w-2xl mx-auto space-y-3 border-[#D8CEC0]">
        <FileText className="w-12 h-12 text-[#94A3B8] mx-auto" />
        <h3 className="font-editorial text-2xl font-bold text-[#0F172A]">
          Evidence Room is Currently Empty
        </h3>
        <p className="text-xs text-[#64748B] max-w-md mx-auto">
          No customer reviews have been analyzed yet. Go to the <span className="font-semibold text-[#0F172A]">Check Reviews</span> tab or load sample field data to inspect evidence dossiers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5DDD1]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-2xl font-bold text-[#0F172A]">
              Evidence Dossier
            </h2>
            <span className="stamp-badge stamp-cobalt text-[10px]">
              {results.length} Reviews Analyzed
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Examine forensic signal metrics, linguistic attributions, and verdict reasons for each review.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Scrollable Review List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="paper-card p-4 space-y-3 border-[#E5DCD0]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search reviews by ID, product, text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#FAF6EE] border border-[#D8CEC0] text-xs text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
              />
            </div>

            <div className="flex gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#FAF6EE] text-[#64748B] hover:bg-[#EAE3D8]'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setFilterMode('suspicious')}
                className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                  filterMode === 'suspicious'
                    ? 'bg-[#F43F5E] text-white'
                    : 'bg-[#FAF6EE] text-[#BE123C] hover:bg-[#FFE4E6]'
                }`}
              >
                Flagged
              </button>
              <button
                onClick={() => setFilterMode('divergent')}
                className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                  filterMode === 'divergent'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#FAF6EE] text-[#1E40AF] hover:bg-[#EFF6FF]'
                }`}
              >
                Divergent
              </button>
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredResults.map((r) => {
              const isSelected = selectedReview?.review_id === r.review_id;
              const isFlagged =
                r.classical_label === 'suspicious' || r.quantum_label === 'suspicious';

              return (
                <div
                  key={r.review_id}
                  onClick={() => setSelectedId(r.review_id)}
                  className={`p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#0F172A] shadow-md ring-1 ring-[#0F172A]/15'
                      : 'bg-[#FAF6EE] border-[#E5DCD0] hover:bg-white hover:border-[#D8CEC0]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-[#0F172A]">{r.review_id}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#D97706] font-semibold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-[#D97706]" />
                        {r.rating.toFixed(1)}
                      </span>
                      <span
                        className={`stamp-badge text-[9px] ${
                          r.combined_risk_score > 60
                            ? 'stamp-coral'
                            : r.combined_risk_score > 35
                            ? 'stamp-cobalt'
                            : 'stamp-lime'
                        }`}
                      >
                        {r.combined_risk_score}% Risk
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#334155] line-clamp-2 leading-relaxed">
                    {r.review_text}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5DCD0]/60 text-[10px] text-[#64748B] font-mono">
                    <span>{r.product_id}</span>
                    <span>
                      Standard: <span className={r.classical_label === 'suspicious' ? 'text-[#F43F5E] font-bold' : 'text-[#059669]'}>{r.classical_label}</span> • Quantum: <span className={r.quantum_label === 'suspicious' ? 'text-[#2563EB] font-bold' : 'text-[#059669]'}>{r.quantum_label || 'normal'}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Forensic Dossier for Selected Review */}
        <div className="lg:col-span-7">
          {selectedReview ? (
            <div className="paper-card p-6 md:p-8 space-y-6 border-[#D8CEC0] bg-white shadow-sm">
              {/* Review Identity Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5DCD0] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold text-[#0F172A]">
                      {selectedReview.review_id}
                    </span>
                    <span className="stamp-badge stamp-ink text-[10px]">
                      {selectedReview.product_id}
                    </span>
                  </div>
                  <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                    <span>Assigned Rating:</span>
                    <span className="text-[#D97706] font-bold flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-[#D97706]" />
                      {selectedReview.rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>

                {/* Risk Verdict Pill */}
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-[#64748B] font-semibold">Combined Risk Level</div>
                  <div
                    className={`font-editorial text-3xl font-bold ${
                      selectedReview.combined_risk_score > 60
                        ? 'text-[#F43F5E]'
                        : selectedReview.combined_risk_score > 35
                        ? 'text-[#D97706]'
                        : 'text-[#059669]'
                    }`}
                  >
                    {selectedReview.combined_risk_score}%
                  </div>
                </div>
              </div>

              {/* Verbatim Text Excerpt */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono uppercase text-[#64748B] font-semibold">Review Content</span>
                <blockquote className="p-4 rounded-xl bg-[#FAF6EE] border-l-4 border-l-[#0F172A] text-xs text-[#0F172A] leading-relaxed italic font-serif text-sm">
                  &ldquo;{selectedReview.review_text}&rdquo;
                </blockquote>
              </div>

              {/* The Two Checks Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard Check */}
                <div className="p-4 rounded-xl bg-white border border-[#E5DCD0] shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Check 1: Standard Pattern</span>
                    <span className="font-mono">{selectedReview.classical_score.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`font-editorial text-lg font-bold capitalize ${
                        selectedReview.classical_label === 'suspicious'
                          ? 'text-[#F43F5E]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {selectedReview.classical_label}
                    </span>
                    <span className="text-xs font-mono text-[#64748B]">
                      {selectedReview.classical_risk_score}% Risk
                    </span>
                  </div>
                </div>

                {/* Quantum Check */}
                <div className="p-4 rounded-xl bg-white border border-[#E5DCD0] shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#64748B]">
                    <span>Check 2: Quantum Shape (Local)</span>
                    <span className="font-mono">
                      {selectedReview.quantum_score !== null ? selectedReview.quantum_score?.toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`font-editorial text-lg font-bold capitalize ${
                        selectedReview.quantum_label === 'suspicious'
                          ? 'text-[#2563EB]'
                          : 'text-[#059669]'
                      }`}
                    >
                      {selectedReview.quantum_label || 'Normal'}
                    </span>
                    <span className="text-xs font-mono text-[#64748B]">
                      {selectedReview.quantum_risk_score !== null ? `${selectedReview.quantum_risk_score}% Risk` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plain-Language Signal Meters */}
              <div className="space-y-3">
                <h4 className="font-editorial text-xl font-bold text-[#0F172A]">
                  Linguistic Signals &amp; Observed Clues
                </h4>

                <div className="space-y-3">
                  {selectedReview.feature_attributions.map((attr, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0F172A]">{attr.feature_name}</span>
                        <span className="font-mono text-[#64748B]">
                          {(attr.normalized_value * 100).toFixed(0)}% signal intensity
                        </span>
                      </div>

                      {/* Progress meter */}
                      <div className="w-full h-2 rounded-full bg-[#E5DCD0] overflow-hidden">
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

                      <div className="text-[11px] text-[#64748B]">
                        {attr.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specific Findings List */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-[#64748B] font-semibold">
                  Why this review was flagged:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedReview.reasons.map((r, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-md text-xs bg-white text-[#0F172A] border border-[#D8CEC0] shadow-2xs font-medium"
                    >
                      • {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Auditor / Observer Disclaimer */}
              <div className="p-3.5 rounded-xl bg-[#FAF6EE] border border-[#E5DCD0] text-[11px] text-[#64748B] leading-relaxed">
                <span className="font-semibold text-[#0F172A]">Observatory Disclaimer:</span> Anomaly scores measure statistical and geometric divergence from typical organic reviews. They provide investigative leads for trust teams and are not definitive accusations of fraudulent misconduct.
              </div>
            </div>
          ) : (
            <div className="paper-card p-8 text-center text-[#94A3B8]">
              Select a review on the left to inspect its evidence dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
