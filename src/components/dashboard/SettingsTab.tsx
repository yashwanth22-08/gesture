import React, { useState } from 'react';
import {
  Sliders,
  Video,
  Volume2,
  MousePointer,
  RotateCcw,
  CheckCircle2,
  FlipHorizontal,
  Hand,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { GestureSettings } from '../../types';

interface SettingsTabProps {
  settings: GestureSettings;
  onUpdateSettings: (newSettings: Partial<GestureSettings>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = React.memo(({
  settings,
  onUpdateSettings,
}) => {
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const triggerSaveNotice = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  const handleReset = () => {
    onUpdateSettings({
      isEnabled: true,
      sensitivity: 'medium',
      pointerSmoothing: 0.35,
      showWebcamOverlay: true,
      showSkeleton: true,
      enableSound: true,
      mirrorVideo: true,
      gestureCooldownMs: 500,
      autoClickOnHover: true,
      hoverDwellTimeMs: 1200,
    });
    triggerSaveNotice('Settings reset to default!');
  };

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-300">
      {/* Save Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-40 bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-blue-400 font-medium text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel border border-white/15 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Gesture System Configuration</h2>
            <p className="text-xs text-white/60">
              Calibrate tracking sensitivity, cursor smoothing, and camera behavior
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="gesture-clickable flex items-center gap-2 px-4 py-2 rounded-2xl glass-button hover:bg-white/15 text-white text-xs font-semibold transition-colors"
        >
          <RotateCcw size={14} /> Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tracking & Sensitivity Card */}
        <div className="glass-panel border border-white/15 rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Hand size={16} className="text-cyan-300" /> Swipe Sensitivity & Motion Limits
          </h3>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-2">
              Gesture Swipe Threshold
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onUpdateSettings({ sensitivity: s });
                    triggerSaveNotice(`Sensitivity set to ${s.toUpperCase()}`);
                  }}
                  className={`gesture-clickable py-2.5 px-3 rounded-2xl text-xs font-semibold capitalize border transition-all ${
                    settings.sensitivity === s
                      ? 'glass-button-primary text-cyan-200 font-bold shadow-md shadow-cyan-500/20'
                      : 'glass-button text-white/60 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-white/50 mt-1.5">
              High requires shorter hand sweeps; Low prevents accidental swipes.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-2">
              Pointer Interpolation Smoothing (EMA)
            </label>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={settings.pointerSmoothing}
              onChange={(e) => onUpdateSettings({ pointerSmoothing: Number(e.target.value) })}
              className="w-full accent-cyan-400 bg-white/10 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-white/50 mt-1 font-mono">
              <span>Smooth (0.1)</span>
              <span>Value: {settings.pointerSmoothing}</span>
              <span>Snappy (0.8)</span>
            </div>
          </div>
        </div>

        {/* Pointer Hover Dwell & Feedback Card */}
        <div className="glass-panel border border-white/15 rounded-3xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <MousePointer size={16} className="text-cyan-300" /> Cursor Hover & Auto Click
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-xs font-medium text-white/90">
                Auto-Click on Hover (Dwell Click)
              </span>
              <input
                type="checkbox"
                checked={settings.autoClickOnHover}
                onChange={(e) => onUpdateSettings({ autoClickOnHover: e.target.checked })}
                className="rounded bg-white/10 border-white/20 text-cyan-400 focus:ring-0 w-4 h-4"
              />
            </label>

            {settings.autoClickOnHover && (
              <div>
                <label className="block text-xs font-medium text-white/80 mb-2">
                  Dwell Time Before Click ({settings.hoverDwellTimeMs} ms)
                </label>
                <input
                  type="range"
                  min="600"
                  max="2500"
                  step="100"
                  value={settings.hoverDwellTimeMs}
                  onChange={(e) => onUpdateSettings({ hoverDwellTimeMs: Number(e.target.value) })}
                  className="w-full accent-cyan-400 bg-white/10 h-2 rounded-lg cursor-pointer"
                />
              </div>
            )}

            <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="text-xs font-medium text-white/90">
                Web Audio Sound Feedback
              </span>
              <input
                type="checkbox"
                checked={settings.enableSound}
                onChange={(e) => onUpdateSettings({ enableSound: e.target.checked })}
                className="rounded bg-white/10 border-white/20 text-cyan-400 focus:ring-0 w-4 h-4"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Camera & Privacy Info */}
      <div className="glass-panel border border-white/15 rounded-3xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" /> On-Device Vision Privacy Guarantee
        </h3>
        <p className="text-xs text-white/70 leading-relaxed">
          Your camera feed is processed 100% locally in browser memory via WebAssembly/WebGL. No video streams or images are ever transmitted, recorded, or saved to external servers.
        </p>
      </div>
    </div>
  );
});

SettingsTab.displayName = 'SettingsTab';
