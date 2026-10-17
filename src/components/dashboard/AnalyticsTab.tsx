import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Hand } from 'lucide-react';

const DATA_7D = [
  { name: 'Mon', revenue: 4200, visitors: 2400, conversion: 3.2 },
  { name: 'Tue', revenue: 5300, visitors: 3100, conversion: 3.8 },
  { name: 'Wed', revenue: 6100, visitors: 3800, conversion: 4.1 },
  { name: 'Thu', revenue: 5800, visitors: 3500, conversion: 3.9 },
  { name: 'Fri', revenue: 7400, visitors: 4200, conversion: 4.5 },
  { name: 'Sat', revenue: 8900, visitors: 5100, conversion: 5.0 },
  { name: 'Sun', revenue: 9500, visitors: 5600, conversion: 5.2 },
];

const DATA_30D = [
  { name: 'Week 1', revenue: 28400, visitors: 16200, conversion: 3.6 },
  { name: 'Week 2', revenue: 32100, visitors: 18400, conversion: 4.0 },
  { name: 'Week 3', revenue: 39500, visitors: 22100, conversion: 4.4 },
  { name: 'Week 4', revenue: 45200, visitors: 25800, conversion: 4.8 },
];

const PIE_DATA = [
  { name: 'JARVIS Voice Commands', value: 45, color: '#00F0FF' },
  { name: 'Hand Gesture Referrals', value: 30, color: '#00A8FF' },
  { name: 'ULTRON Defense Grid', value: 15, color: '#FF2E55' },
  { name: 'Neural Subsystems', value: 10, color: '#FFB700' },
];

export const AnalyticsTab: React.FC = React.memo(() => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [metricType, setMetricType] = useState<'revenue' | 'visitors'>('revenue');

  const chartData = timeframe === '7d' ? DATA_7D : DATA_30D;

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-300">
      {/* Analytics Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel border border-cyan-500/20 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono">NEURAL ANALYTICS MATRIX</h2>
            <p className="text-xs text-slate-400 font-mono">
              Voice & gesture responsive telemetry diagnostics
            </p>
          </div>
        </div>

        {/* Timeframe & Metric Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto font-mono">
          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs backdrop-blur-md">
            <button
              onClick={() => setTimeframe('7d')}
              className={`gesture-clickable px-3 py-1.5 rounded-xl font-medium transition-colors ${
                timeframe === '7d' ? 'glass-button-primary text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`gesture-clickable px-3 py-1.5 rounded-xl font-medium transition-colors ${
                timeframe === '30d' ? 'glass-button-primary text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>

          <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs backdrop-blur-md">
            <button
              onClick={() => setMetricType('revenue')}
              className={`gesture-clickable px-3 py-1.5 rounded-xl font-medium transition-colors ${
                metricType === 'revenue' ? 'glass-button-primary text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Output
            </button>
            <button
              onClick={() => setMetricType('visitors')}
              className={`gesture-clickable px-3 py-1.5 rounded-xl font-medium transition-colors ${
                metricType === 'visitors' ? 'glass-button-primary text-cyan-200 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nodes
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="glass-panel border border-cyan-500/20 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-cyan-300 font-mono uppercase tracking-wider">
              {metricType === 'revenue' ? 'SYSTEM ENERGY GAIN' : 'ACTIVE NEURAL NODES'}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Live telemetry breakdown for {timeframe === '7d' ? 'past 7 days' : 'past 30 days'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
            <Hand size={14} className="text-cyan-400" />
            <span>Interactive Visualizer</span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={metricType === 'revenue' ? '#00F0FF' : '#FF2E55'}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={metricType === 'revenue' ? '#00F0FF' : '#FF2E55'}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0C10',
                  borderColor: '#00F0FF',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey={metricType}
                stroke={metricType === 'revenue' ? '#00F0FF' : '#FF2E55'}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#chartColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Bar Breakdown + Source Pie Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <div className="glass-panel border border-cyan-500/20 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-cyan-300 font-mono uppercase">
            NEURAL EFFICIENCY (%)
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0C10',
                    borderColor: '#00F0FF',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="conversion" fill="#00F0FF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Sources Distribution */}
        <div className="glass-panel border border-cyan-500/20 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-cyan-300 font-mono uppercase">
            OPERATIONAL INPUT SOURCES
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 h-60">
            <div className="w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {PIE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {PIE_DATA.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-400 font-medium">{p.name}:</span>
                  <span className="text-white font-bold">{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

AnalyticsTab.displayName = 'AnalyticsTab';

