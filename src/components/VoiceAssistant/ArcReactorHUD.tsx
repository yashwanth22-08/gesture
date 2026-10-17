import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, ShieldAlert, Zap, Radio, Terminal } from 'lucide-react';
import { ThreatLevel, VoiceAssistantStatus } from '../../types';
import { voiceAssistantService } from '../../services/voiceAssistantService';

interface ArcReactorHUDProps {
  status: VoiceAssistantStatus;
  threatLevel: ThreatLevel;
  transcript: string;
  lastResponse: string;
  onToggleMic: () => void;
  onThreatChange: (level: ThreatLevel) => void;
  onTriggerPulseScan: () => void;
}

export const ArcReactorHUD: React.FC<ArcReactorHUDProps> = ({
  status,
  threatLevel,
  transcript,
  lastResponse,
  onToggleMic,
  onThreatChange,
  onTriggerPulseScan,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas wave animation loop reacting to status
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Select color theme based on status or threat level
      let primaryColor = 'rgba(0, 240, 255, '; // Cyan
      if (status === 'speaking' || threatLevel === 'CRITICAL' || threatLevel === 'OVERDRIVE') {
        primaryColor = 'rgba(255, 46, 85, '; // Crimson
      } else if (status === 'thinking' || threatLevel === 'ELEVATED') {
        primaryColor = 'rgba(255, 183, 0, '; // Amber
      }

      // Draw frequency audio wave bars
      const numBars = 32;
      const barWidth = 4;
      const spacing = (width - numBars * barWidth) / (numBars + 1);

      for (let i = 0; i < numBars; i++) {
        const x = spacing + i * (barWidth + spacing);
        const freqOffset = Math.sin(phase + i * 0.25);
        let amplitude = 12;

        if (status === 'listening') {
          amplitude = 25 + Math.random() * 20;
        } else if (status === 'speaking') {
          amplitude = 35 + Math.abs(Math.sin(phase * 2 + i * 0.4)) * 30;
        } else if (status === 'thinking') {
          amplitude = 18 + Math.cos(phase * 3 + i) * 15;
        }

        const barHeight = Math.max(4, amplitude * (0.5 + Math.sin(phase + i * 0.1) * 0.5));
        const alpha = 0.4 + (barHeight / 60) * 0.6;

        ctx.fillStyle = `${primaryColor}${alpha})`;
        ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
      }

      phase += 0.08;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [status, threatLevel]);

  // Color helper based on status & threat
  const getThemeColors = () => {
    if (threatLevel === 'CRITICAL' || threatLevel === 'OVERDRIVE' || status === 'speaking') {
      return {
        coreBg: 'bg-red-500/20',
        coreBorder: 'border-red-500/80',
        coreGlow: 'shadow-[0_0_50px_rgba(255,46,85,0.8)]',
        accentText: 'text-red-400',
        ringColor: 'border-red-500/40',
      };
    }
    if (status === 'thinking' || threatLevel === 'ELEVATED') {
      return {
        coreBg: 'bg-amber-500/20',
        coreBorder: 'border-amber-400/80',
        coreGlow: 'shadow-[0_0_50px_rgba(255,183,0,0.8)]',
        accentText: 'text-amber-400',
        ringColor: 'border-amber-500/40',
      };
    }
    return {
      coreBg: 'bg-cyan-500/20',
      coreBorder: 'border-cyan-400/80',
      coreGlow: 'shadow-[0_0_50px_rgba(0,240,255,0.8)]',
      accentText: 'text-cyan-400',
      ringColor: 'border-cyan-500/40',
    };
  };

  const theme = getThemeColors();

  return (
    <div className="relative glass-panel rounded-3xl p-6 md:p-8 overflow-hidden border border-cyan-500/30 flex flex-col items-center justify-center">
      {/* Background Holographic Grid Overlay */}
      <div className="absolute inset-0 hud-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute inset-0 hud-scanline opacity-20 pointer-events-none" />

      {/* Top HUD Header Status */}
      <div className="w-full flex items-center justify-between mb-6 z-10">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full animate-ping ${status === 'listening' ? 'bg-cyan-400' : status === 'speaking' ? 'bg-red-500' : 'bg-amber-400'}`} />
          <span className="text-xs tracking-widest font-mono uppercase text-slate-300">
            CORE ARC REACTOR // STAT: <span className={theme.accentText}>{status.toUpperCase()}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-slate-400">THREAT:</span>
          <button
            onClick={() => {
              const levels: ThreatLevel[] = ['NORMAL', 'ELEVATED', 'CRITICAL', 'OVERDRIVE'];
              const next = levels[(levels.indexOf(threatLevel) + 1) % levels.length];
              onThreatChange(next);
            }}
            className={`px-2.5 py-1 rounded-md border font-semibold text-xs tracking-wider transition-all ${
              threatLevel === 'NORMAL'
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:border-cyan-400'
                : threatLevel === 'ELEVATED'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 hover:border-amber-400'
                : 'bg-red-950/60 border-red-500/40 text-red-400 hover:border-red-400 shadow-[0_0_15px_rgba(255,46,85,0.4)]'
            }`}
          >
            {threatLevel}
          </button>
        </div>
      </div>

      {/* Central 3D Interactive Arc Reactor HUD */}
      <div className="relative my-4 flex items-center justify-center z-10">
        {/* Outer Rotating HUD Ring 1 */}
        <div className={`w-72 h-72 md:w-80 md:h-80 rounded-full border-2 border-dashed ${theme.ringColor} animate-spin-slow absolute`} />

        {/* Counter-rotating Inner Ring 2 */}
        <div className={`w-60 h-60 md:w-64 md:h-64 rounded-full border ${theme.ringColor} border-t-transparent border-b-transparent animate-spin-reverse-slow absolute`} />

        {/* Pulse Ring 3 */}
        <div className={`w-48 h-48 md:w-52 md:h-52 rounded-full border ${theme.ringColor} opacity-70 animate-pulse absolute`} />

        {/* Core Interactive Arc Reactor Button */}
        <button
          onClick={onToggleMic}
          className={`relative z-20 w-36 h-36 md:w-40 md:h-40 rounded-full ${theme.coreBg} ${theme.coreBorder} ${theme.coreGlow} border-2 flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer`}
          title="Click to toggle Voice Assistant (Spacebar shortcut)"
        >
          {status === 'listening' ? (
            <Mic className="w-12 h-12 text-cyan-300 animate-bounce" />
          ) : status === 'speaking' ? (
            <Radio className="w-12 h-12 text-red-400 animate-pulse" />
          ) : status === 'thinking' ? (
            <Zap className="w-12 h-12 text-amber-400 animate-spin" />
          ) : (
            <MicOff className="w-12 h-12 text-slate-400 group-hover:text-cyan-300 transition-colors" />
          )}

          <span className="text-[10px] font-mono tracking-widest mt-2 uppercase text-slate-300 font-bold">
            {status === 'listening' ? 'LISTENING' : status === 'speaking' ? 'SPEAKING' : 'PUSH TO TALK'}
          </span>
        </button>
      </div>

      {/* Frequency Waveform Canvas Visualizer */}
      <div className="w-full max-w-md my-3 z-10">
        <canvas ref={canvasRef} width={400} height={40} className="w-full h-10 rounded-lg bg-black/40 border border-slate-800" />
      </div>

      {/* Live Voice Terminal Display Box */}
      <div className="w-full max-w-xl bg-slate-950/80 rounded-xl p-4 border border-cyan-500/20 z-10 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>VOICE COMMAND LOG // ANTIGRAVITY OS</span>
          </div>
          <button
            onClick={onTriggerPulseScan}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-[10px]"
          >
            <Zap className="w-3 h-3" />
            <span>PULSE SCAN</span>
          </button>
        </div>

        {transcript && (
          <div className="text-cyan-300">
            <span className="text-slate-500">[USER]:</span> "{transcript}"
          </div>
        )}

        {lastResponse && (
          <div className={status === 'speaking' ? 'text-red-300 glow-text-crimson' : 'text-slate-200'}>
            <span className="text-cyan-400 font-bold">[JARVIS]:</span> {lastResponse}
          </div>
        )}

        {!transcript && !lastResponse && (
          <div className="text-slate-500 italic">
            Press Spacebar or click the Arc Reactor core to issue voice commands ("Navigate to Analytics", "Pulse Scan", "Threat Level Critical")...
          </div>
        )}
      </div>
    </div>
  );
};
