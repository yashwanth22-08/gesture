import React, { useState, useEffect } from 'react';
import { Cpu, Activity, ShieldCheck, Wifi, Flame, Layers } from 'lucide-react';
import { SystemTelemetry, ThreatLevel } from '../../types';

interface TelemetryPanelProps {
  threatLevel: ThreatLevel;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ threatLevel }) => {
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    fps: 60,
    cpuLoad: 24,
    memoryUsage: 42,
    neuralLatency: 12,
    activeNodes: 1024,
    defenseMatrixActive: true,
    voiceEngineOnline: true,
  });

  // Dynamic telemetry update loop
  useEffect(() => {
    const interval = setInterval(() => {
      const fpsBase = threatLevel === 'OVERDRIVE' ? 120 : 60;
      const cpuBase = threatLevel === 'OVERDRIVE' ? 78 : threatLevel === 'CRITICAL' ? 65 : 28;

      setTelemetry({
        fps: Math.round(fpsBase + (Math.random() * 6 - 3)),
        cpuLoad: Math.min(99, Math.max(15, Math.round(cpuBase + (Math.random() * 8 - 4)))),
        memoryUsage: Math.round(42 + (Math.random() * 4 - 2)),
        neuralLatency: Math.max(4, Math.round(12 + (Math.random() * 6 - 3))),
        activeNodes: 1024 + Math.floor(Math.random() * 16),
        defenseMatrixActive: threatLevel !== 'NORMAL',
        voiceEngineOnline: true,
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [threatLevel]);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>SYSTEM TELEMETRY // REAL-TIME MATRIX</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-[10px] text-cyan-300">
          NODE #0A-ONLINE
        </span>
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* FPS Gauge */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px]">RENDER FPS</span>
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300">{telemetry.fps} <span className="text-xs text-slate-500 font-normal">FPS</span></div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${Math.min(100, (telemetry.fps / 120) * 100)}%` }} />
          </div>
        </div>

        {/* CPU Load Gauge */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px]">CPU CORE LOAD</span>
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">{telemetry.cpuLoad}%</div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${telemetry.cpuLoad > 70 ? 'bg-red-500' : 'bg-amber-400'}`}
              style={{ width: `${telemetry.cpuLoad}%` }}
            />
          </div>
        </div>

        {/* Memory utilization */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px]">NEURAL MEMORY</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-300">{telemetry.memoryUsage}%</div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: `${telemetry.memoryUsage}%` }} />
          </div>
        </div>

        {/* Latency */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px]">NODE LATENCY</span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300">{telemetry.neuralLatency} <span className="text-xs text-slate-500 font-normal">ms</span></div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-400 h-full transition-all duration-500" style={{ width: `${Math.min(100, (telemetry.neuralLatency / 50) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Grid status footer bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldCheck className={`w-4 h-4 ${telemetry.defenseMatrixActive ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span>DEFENSE MATRIX: <strong className={telemetry.defenseMatrixActive ? 'text-cyan-300' : 'text-slate-500'}>{telemetry.defenseMatrixActive ? 'ENGAGED' : 'STANDBY'}</strong></span>
        </div>
        <div className="text-slate-400">ACTIVE NEURAL NODES: <strong className="text-cyan-300">{telemetry.activeNodes}</strong></div>
      </div>
    </div>
  );
};
