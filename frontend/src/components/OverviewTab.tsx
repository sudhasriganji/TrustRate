import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  Star,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { api } from '../lib/api';
import { AnalyzeResponse, ReviewItem } from '../types';

interface OverviewTabProps {
  lastAnalysis: AnalyzeResponse | null;
  onRunSampleData: () => void;
  onNavigateTab: (tab: string) => void;
  isLoading: boolean;
  onScanComplete?: (response: AnalyzeResponse) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  lastAnalysis,
  onRunSampleData,
  onNavigateTab,
  isLoading,
  onScanComplete,
}) => {
  const metrics = lastAnalysis?.metrics;
  const results = lastAnalysis?.results || [];

  // Quick single check state directly inside dashboard
  const [quickText, setQuickText] = useState('AMAZING PRODUCT! BEST EVER!!!! BUY BUY BUY! 100% RECOMMEND TO EVERYONE WOW WOW WOW!!!');
  const [quickRating, setQuickRating] = useState<number>(5.0);
  const [isQuickChecking, setIsQuickChecking] = useState(false);
  const [quickResult, setQuickResult] = useState<any>(null);

  const handleQuickCheck = async () => {
    if (!quickText.trim()) return;
    setIsQuickChecking(true);
    try {
      const review: ReviewItem = {
        review_id: `REV-${Date.now().toString().slice(-4)}`,
        product_id: 'PROD-QUICK',
        rating: quickRating,
        review_text: quickText.trim(),
      };
      const res = await api.analyzeReviews([review], true, 4, 2);
      setQuickResult(res.results[0]);
      if (onScanComplete) {
        onScanComplete(res);
      }
    } catch {
      // ignore
    } finally {
      setIsQuickChecking(false);
    }
  };

  // Group consensus into plain language
  const consensusCounts = results.reduce(
    (acc, r) => {
      if (r.consensus === 'unanimous_normal') acc.normal += 1;
      else if (r.consensus === 'unanimous_suspicious') acc.suspicious += 1;
      else acc.divergent += 1;
      return acc;
    },
    { normal: 0, suspicious: 0, divergent: 0 }
  );

  const pieData = [
    { name: 'Natural Organic Reviews', value: consensusCounts.normal, color: '#059669' },
    { name: 'Flagged by Both Checks', value: consensusCounts.suspicious, color: '#F43F5E' },
    { name: 'Checks Differ (Divergent)', value: consensusCounts.divergent, color: '#2563EB' },
  ];

  // Rating distribution (1 to 5 stars)
  const ratingDistribution = [1, 2, 3, 4, 5].map((star) => {
    const starReviews = results.filter((r) => Math.round(r.rating) === star);
    const flagged = starReviews.filter(
      (r) => r.classical_label === 'suspicious' || r.quantum_label === 'suspicious'
    ).length;
    const clean = starReviews.length - flagged;
    return {
      stars: `${star} ★`,
      Natural: clean,
      Suspicious: flagged,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5DDD1]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Overview &amp; Detection Dashboard
            </h1>
            <span className="stamp-badge stamp-lime text-[10px]">
              Local simulation
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time dual-check analytics across analyzed product reviews.
          </p>
        </div>

        {/* Action Triggers */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('scanner')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Open Review Scanner</span>
          </button>

          <button
            onClick={onRunSampleData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FAF6EE] border border-[#D8CEC0] text-xs font-semibold text-[#0F172A] shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3 h-3 text-[#F43F5E] fill-current" />
            <span>{isLoading ? 'Processing...' : 'Load Sample Data (30)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="paper-card p-5 space-y-1 border-[#E5DDD1] bg-white">
          <span className="text-xs font-mono uppercase text-[#64748B] font-semibold">
            Total Reviews Analyzed
          </span>
          <div className="font-editorial text-3xl font-bold text-[#0F172A]">
            {metrics?.total_reviews || results.length || 0}
          </div>
          <p className="text-[11px] text-[#64748B]">
            Inspected with both models
          </p>
        </div>

        {/* Flagged by Standard */}
        <div className="paper-card p-5 space-y-1 border-[#E5DDD1] border-l-3 border-l-[#2563EB] bg-white">
          <span className="text-xs font-mono uppercase text-[#1D4ED8] font-semibold">
            Standard Pattern Flags
          </span>
          <div className="font-editorial text-3xl font-bold text-[#2563EB]">
            {metrics?.classical_anomalies || results.filter(r => r.classical_label === 'suspicious').length || 0}
          </div>
          <p className="text-[11px] text-[#64748B]">
            Isolation Forest baseline
          </p>
        </div>

        {/* Flagged by Quantum */}
        <div className="paper-card p-5 space-y-1 border-[#E5DDD1] border-l-3 border-l-[#F43F5E] bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#BE123C] font-semibold">
              Quantum Shape Flags
            </span>
            <span className="stamp-badge stamp-lime text-[9px]">Local</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-[#F43F5E]">
            {metrics?.quantum_anomalies || results.filter(r => r.quantum_label === 'suspicious').length || 0}
          </div>
          <p className="text-[11px] text-[#64748B]">
            ZZFeatureMap local simulation
          </p>
        </div>

        {/* Check Agreement Rate */}
        <div className="paper-card p-5 space-y-1 border-[#E5DDD1] border-l-3 border-l-[#059669] bg-white">
          <span className="text-xs font-mono uppercase text-[#059669] font-semibold">
            Model Agreement Rate
          </span>
          <div className="font-editorial text-3xl font-bold text-[#0F172A]">
            {metrics ? `${(metrics.concordance_rate * 100).toFixed(0)}%` : results.length ? `${((consensusCounts.normal + consensusCounts.suspicious) / results.length * 100).toFixed(0)}%` : '—'}
          </div>
          <p className="text-[11px] text-[#64748B]">
            Where both models reach consensus
          </p>
        </div>
      </div>

      {/* 3. Interactive Quick Check Widget */}
      <div className="paper-card p-5 sm:p-6 space-y-4 border-[#E5DDD1] bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DDD1] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#2563EB]" />
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Quick Review Check
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Test any review text right on the dashboard to see immediate dual-check verdicts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="font-mono text-[11px]">Presets:</span>
            <button
              onClick={() => {
                setQuickText('AMAZING PRODUCT! BEST EVER!!!! BUY BUY BUY! 100% RECOMMEND TO EVERYONE WOW WOW WOW!!!');
                setQuickRating(5.0);
              }}
              className="px-2 py-0.5 rounded text-[11px] bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] cursor-pointer"
            >
              Bot Spam
            </button>
            <button
              onClick={() => {
                setQuickText('I have tested these wireless headphones for two weeks. The active noise cancellation handles commuter train hum well, and battery lasts 32 hours.');
                setQuickRating(5.0);
              }}
              className="px-2 py-0.5 rounded text-[11px] bg-[#F7FEE7] text-[#3F6212] border border-[#BEF264] cursor-pointer"
            >
              Organic
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 space-y-3">
            <textarea
              rows={3}
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="Paste or write customer review text here..."
              className="w-full p-3 rounded-xl bg-[#FAF6EE] border border-[#D8CEC0] text-xs text-[#0F172A] leading-relaxed resize-y focus:outline-none focus:border-[#0F172A]"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-[#D97706] font-mono">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setQuickRating(star)}
                    className="p-0.5 hover:scale-115 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        star <= Math.round(quickRating)
                          ? 'text-[#D97706] fill-[#D97706]'
                          : 'text-[#D8CEC0]'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-1 text-[#0F172A] font-semibold">{quickRating.toFixed(1)} Stars</span>
              </div>

              <button
                onClick={handleQuickCheck}
                disabled={isQuickChecking || !quickText.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>{isQuickChecking ? 'Checking...' : 'Run Quick Check'}</span>
              </button>
            </div>
          </div>

          {/* Quick Result Panel */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-[#FAF6EE] border border-[#E5DDD1] space-y-2.5">
            {quickResult ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#64748B] font-semibold">Verdict</span>
                  <span
                    className={`stamp-badge text-[9px] ${
                      quickResult.combined_risk_score > 60
                        ? 'stamp-coral'
                        : quickResult.combined_risk_score > 35
                        ? 'stamp-cobalt'
                        : 'stamp-lime'
                    }`}
                  >
                    {quickResult.combined_risk_score}% RISK
                  </span>
                </div>

                <div className="font-semibold text-xs text-[#0F172A] mb-1">
                  {quickResult.combined_risk_score > 60
                    ? 'Suspicious Pattern'
                    : quickResult.combined_risk_score > 35
                    ? 'Divergent Pattern'
                    : 'Likely Organic'}
                </div>

                <div className="text-[11px] text-[#64748B] space-y-1 pt-1 border-t border-[#E5DDD1]">
                  <div>Standard: <span className="font-semibold text-[#0F172A]">{quickResult.classical_label}</span></div>
                  <div>Quantum: <span className="font-semibold text-[#0F172A]">{quickResult.quantum_label || 'normal'}</span> (local simulation)</div>
                </div>

                <button
                  onClick={() => onNavigateTab('scanner')}
                  className="mt-2 text-[11px] text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Scanner Details</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4 text-[#64748B] text-xs">
                Click “Run Quick Check” to inspect this review.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Visual Analytics: Agreement Breakdown & Rating Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consensus Breakdown Chart */}
        <div className="paper-card p-6 flex flex-col justify-between space-y-4 border-[#E5DDD1] bg-white">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Model Agreement Breakdown
              </h3>
              <span className="stamp-badge stamp-cobalt text-[10px]">
                CROSS-CHECK
              </span>
            </div>
            <p className="text-xs text-[#64748B] mb-3">
              Distribution of agreement across standard pattern and quantum shape checks
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5DDD1',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 border-t border-[#E5DDD1]">
            <div>
              <div className="font-bold text-[#059669] text-sm">{consensusCounts.normal}</div>
              <span className="text-[10px] text-[#64748B]">Both Agree Natural</span>
            </div>
            <div>
              <div className="font-bold text-[#F43F5E] text-sm">{consensusCounts.suspicious}</div>
              <span className="text-[10px] text-[#64748B]">Both Agree Flagged</span>
            </div>
            <div>
              <div className="font-bold text-[#2563EB] text-sm">{consensusCounts.divergent}</div>
              <span className="text-[10px] text-[#64748B]">Checks Differ</span>
            </div>
          </div>
        </div>

        {/* Rating Spread vs Anomaly Distribution */}
        <div className="paper-card p-6 flex flex-col justify-between space-y-4 border-[#E5DDD1] bg-white">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Rating Distribution vs. Flags
              </h3>
              <span className="stamp-badge stamp-coral text-[10px]">
                RATING PATTERNS
              </span>
            </div>
            <p className="text-xs text-[#64748B] mb-3">
              Fake reviews cluster heavily in extreme 5-star and 1-star ratings
            </p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution}>
                  <XAxis dataKey="stars" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '0.75rem',
                      border: '1px solid #E5DDD1',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Natural" fill="#059669" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Suspicious" fill="#F43F5E" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-[#64748B] pt-3 border-t border-[#E5DDD1]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#059669]"></span>
              <span>Natural Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-[#F43F5E]"></span>
              <span>Flagged Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Flagged Reviews Table */}
      {results.length > 0 && (
        <div className="paper-card p-6 space-y-4 border-[#E5DDD1] bg-white">
          <div className="flex items-center justify-between border-b border-[#E5DDD1] pb-3">
            <div>
              <h3 className="font-editorial text-xl font-bold text-[#0F172A]">
                Recent Flagged Reviews
              </h3>
              <p className="text-xs text-[#64748B]">
                Reviews exhibiting anomalous pattern metrics from the current dataset
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('investigation')}
              className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All in Evidence Room</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF6EE] text-[#64748B] font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Review ID</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Rating</th>
                  <th className="py-2.5 px-3">Excerpt</th>
                  <th className="py-2.5 px-3">Standard Check</th>
                  <th className="py-2.5 px-3">Quantum (Local)</th>
                  <th className="py-2.5 px-3 text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DDD1]">
                {results.slice(0, 5).map((r) => (
                  <tr
                    key={r.review_id}
                    onClick={() => onNavigateTab('investigation')}
                    className="hover:bg-[#FAF6EE]/80 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F172A]">{r.review_id}</td>
                    <td className="py-2.5 px-3 font-mono text-[#64748B]">{r.product_id}</td>
                    <td className="py-2.5 px-3 text-[#D97706] font-mono">{r.rating.toFixed(1)} ★</td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-[#334155]">{r.review_text}</td>
                    <td className="py-2.5 px-3">
                      <span className={r.classical_label === 'suspicious' ? 'text-[#F43F5E] font-bold' : 'text-[#059669]'}>
                        {r.classical_label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={r.quantum_label === 'suspicious' ? 'text-[#2563EB] font-bold' : 'text-[#059669]'}>
                        {r.quantum_label || 'normal'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
