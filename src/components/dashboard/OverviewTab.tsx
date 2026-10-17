import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Hand,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { MetricCard, VoiceAssistantStatus, ThreatLevel, VoiceLogEntry } from '../../types';
import { ArcReactorHUD } from '../VoiceAssistant/ArcReactorHUD';
import { TelemetryPanel } from '../VoiceAssistant/TelemetryPanel';
import { VoiceConsoleLog } from '../VoiceAssistant/VoiceConsoleLog';

interface OverviewTabProps {
  status: VoiceAssistantStatus;
  threatLevel: ThreatLevel;
  transcript: string;
  lastResponse: string;
  logs: VoiceLogEntry[];
  onToggleMic: () => void;
  onThreatChange: (level: ThreatLevel) => void;
  onTriggerPulseScan: () => void;
  onClearLogs: () => void;
}

const INITIAL_METRICS: MetricCard[] = [
  {
    id: 'm1',
    title: 'Total Revenue',
    value: '$48,290.00',
    change: '+14.2%',
    isPositive: true,
    iconName: 'DollarSign',
    description: 'Compared to last month',
  },
  {
    id: 'm2',
    title: 'Active Users',
    value: '12,450',
    change: '+28.4%',
    isPositive: true,
    iconName: 'Users',
    description: '890 active right now',
  },
  {
    id: 'm3',
    title: 'Conversion Rate',
    value: '3.82%',
    change: '-0.4%',
    isPositive: false,
    iconName: 'TrendingUp',
    description: 'Avg. response time 140ms',
  },
  {
    id: 'm4',
    title: 'Gesture Commands',
    value: '1,894',
    change: '+42.1%',
    isPositive: true,
    iconName: 'Activity',
    description: 'Executed this session',
  },
];

const QUICK_ACTIONS = [
  { id: 'act1', label: 'Pulse Scan', icon: '⚡', color: 'from-cyan-600 to-blue-600' },
  { id: 'act2', label: 'Export Telemetry', icon: '📊', color: 'from-emerald-600 to-teal-600' },
  { id: 'act3', label: 'Threat Level Override', icon: '🛡️', color: 'from-purple-600 to-pink-600' },
  { id: 'act4', label: 'Auditory Diagnostics', icon: '🎙️', color: 'from-amber-600 to-orange-600' },
];

export const OverviewTab: React.FC<OverviewTabProps> = React.memo(({
  status,
  threatLevel,
  transcript,
  lastResponse,
  logs,
  onToggleMic,
  onThreatChange,
  onTriggerPulseScan,
  onClearLogs,
}) => {
  const [activeMetricIdx, setActiveMetricIdx] = useState(0);
  const [lastActionToast, setLastActionToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleNextMetric = () => {
    setActiveMetricIdx((prev) => (prev + 1) % INITIAL_METRICS.length);
  };

  const handlePrevMetric = () => {
    setActiveMetricIdx((prev) => (prev - 1 + INITIAL_METRICS.length) % INITIAL_METRICS.length);
  };

  const handleQuickAction = (actionName: string) => {
    if (actionName === 'Pulse Scan') {
      onTriggerPulseScan();
    } else if (actionName === 'Threat Level Override') {
      const levels: ThreatLevel[] = ['NORMAL', 'ELEVATED', 'CRITICAL', 'OVERDRIVE'];
      const next = levels[(levels.indexOf(threatLevel) + 1) % levels.length];
      onThreatChange(next);
    } else {
      setLastActionToast(`Action Triggered: ${actionName}`);
      setTimeout(() => setLastActionToast(null), 3000);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastActionToast('Syncing Arc Reactor neural telemetry...');
    setTimeout(() => {
      setIsRefreshing(false);
      setLastActionToast('Telemetry matrices online!');
      setTimeout(() => setLastActionToast(null), 2500);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-300">
      {/* Toast notification */}
      {lastActionToast && (
        <div className="fixed top-20 right-6 z-40 bg-cyan-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-cyan-400/40 font-mono text-xs flex items-center gap-2 animate-bounce">
          <Zap size={16} />
          <span>{lastActionToast}</span>
        </div>
      )}

      {/* Central Holographic Arc Reactor HUD */}
      <ArcReactorHUD
        status={status}
        threatLevel={threatLevel}
        transcript={transcript}
        lastResponse={lastResponse}
        onToggleMic={onToggleMic}
        onThreatChange={onThreatChange}
        onTriggerPulseScan={onTriggerPulseScan}
      />

      {/* Real-time Telemetry & Console Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TelemetryPanel threatLevel={threatLevel} />
        <VoiceConsoleLog logs={logs} onClearLogs={onClearLogs} />
      </div>

      {/* Highlight Featured Metric (Gesture Carousel Card) */}
      <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Hand size={14} className="text-cyan-400" /> TACTICAL METRIC MATRIX (CARD {activeMetricIdx + 1} OF {INITIAL_METRICS.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMetric}
              className="gesture-clickable p-2 rounded-xl glass-button hover:bg-slate-800 text-white/80 hover:text-white transition-colors"
              title="Previous Metric (Swipe Right)"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMetric}
              className="gesture-clickable p-2 rounded-xl glass-button hover:bg-slate-800 text-white/80 hover:text-white transition-colors"
              title="Next Metric (Swipe Left)"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2">
            <h3 className="text-sm text-slate-400 font-medium">
              {INITIAL_METRICS[activeMetricIdx].title}
            </h3>
            <div className="text-4xl font-extrabold text-white mt-1 mb-2 tracking-tight font-mono">
              {INITIAL_METRICS[activeMetricIdx].value}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono ${
                  INITIAL_METRICS[activeMetricIdx].isPositive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                }`}
              >
                {INITIAL_METRICS[activeMetricIdx].isPositive ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {INITIAL_METRICS[activeMetricIdx].change}
              </span>
              <span className="text-slate-400 font-mono">
                {INITIAL_METRICS[activeMetricIdx].description}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-cyan-500/20 text-xs space-y-2 backdrop-blur-md font-mono">
            <div className="text-cyan-400 font-semibold uppercase">JARVIS Voice Shortcut</div>
            <p className="text-slate-300 leading-snug">
              Say <strong className="text-cyan-300">"Navigate to Analytics"</strong> or press <strong className="text-cyan-300">Spacebar</strong> to activate voice recognition!
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {INITIAL_METRICS.map((m, idx) => (
          <div
            key={m.id}
            onClick={() => setActiveMetricIdx(idx)}
            className={`gesture-clickable cursor-pointer p-5 rounded-3xl border transition-all duration-200 ${
              activeMetricIdx === idx
                ? 'glass-panel border-cyan-400/60 shadow-lg shadow-cyan-500/20 scale-[1.02] bg-cyan-500/10'
                : 'glass-panel-interactive border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400">{m.title}</span>
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-300">
                {idx === 0 && <DollarSign size={16} />}
                {idx === 1 && <Users size={16} />}
                {idx === 2 && <TrendingUp size={16} />}
                {idx === 3 && <Activity size={16} />}
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-2 font-mono">{m.value}</div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span
                className={`font-semibold ${m.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {m.change}
              </span>
              <span className="text-slate-500">Touch / Gesture</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Interactive Actions Grid */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2 font-mono">
          <Zap size={16} className="text-cyan-400" /> TACTICAL ACTION WIDGETS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((act) => (
            <button
              key={act.id}
              onClick={() => handleQuickAction(act.label)}
              className="gesture-clickable group p-4 rounded-3xl glass-panel-interactive border border-slate-800 hover:border-cyan-400/50 transition-all hover:scale-[1.03] text-left flex flex-col justify-between h-28 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${act.color} opacity-15 rounded-full blur-xl group-hover:opacity-35 transition-opacity`} />
              <div className="text-2xl">{act.icon}</div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">
                  {act.label}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Click or Voice</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';

