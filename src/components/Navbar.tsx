import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Layers,
  Music,
  Settings as SettingsIcon,
  Video,
  VideoOff,
  HelpCircle,
  Volume2,
  VolumeX,
  Radio,
  Mic,
  MicOff,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { TabType, GestureState, GestureSettings, VoiceAssistantStatus, ThreatLevel } from '../types';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  gestureState: GestureState;
  settings: GestureSettings;
  voiceStatus: VoiceAssistantStatus;
  threatLevel: ThreatLevel;
  onToggleVoiceMic: () => void;
  onUpdateSettings: (newSettings: Partial<GestureSettings>) => void;
  onOpenGuide: () => void;
}

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  { id: 'slides', label: 'Slide Deck', icon: <Layers size={16} /> },
  { id: 'media', label: 'Media Player', icon: <Music size={16} /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon size={16} /> },
];

export const Navbar: React.FC<NavbarProps> = React.memo(({
  activeTab,
  onSelectTab,
  gestureState,
  settings,
  voiceStatus,
  threatLevel,
  onToggleVoiceMic,
  onUpdateSettings,
  onOpenGuide,
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-cyan-500/20 text-white backdrop-blur-2xl bg-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/40 to-blue-600/40 p-0.5 border border-cyan-400/60 shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center text-cyan-300">
                <Radio size={20} className="animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-light tracking-tight text-lg text-white font-mono">
                  ANTIGRAVITY <span className="font-bold text-cyan-300 glow-text-cyan">// CORE OS</span>
                </h1>
                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-semibold ${
                  threatLevel === 'NORMAL'
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                    : threatLevel === 'ELEVATED'
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                    : 'bg-red-950/60 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(255,42,42,0.4)]'
                }`}>
                  {threatLevel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-mono">
                JARVIS x ULTRON Voice & Gesture Operations Center
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-cyan-500/20 backdrop-blur-md">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`gesture-clickable flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-200 ${
                    isActive
                      ? 'glass-button-primary text-cyan-200 font-bold shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Voice Assistant & Gesture Controls */}
          <div className="flex items-center gap-2">
            {/* Interactive Voice Mic Toggle Button */}
            <button
              onClick={onToggleVoiceMic}
              className={`gesture-clickable flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                voiceStatus === 'listening'
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)] animate-pulse'
                  : voiceStatus === 'speaking'
                  ? 'bg-red-500/30 border-red-400 text-red-200 shadow-[0_0_15px_rgba(255,42,42,0.4)] animate-pulse'
                  : 'bg-slate-900/80 border-cyan-500/30 text-cyan-400 hover:border-cyan-400'
              }`}
              title="Toggle Voice Assistant (Spacebar)"
            >
              {voiceStatus === 'listening' ? (
                <Mic size={15} className="text-cyan-300 animate-bounce" />
              ) : voiceStatus === 'speaking' ? (
                <Radio size={15} className="text-red-400" />
              ) : (
                <MicOff size={15} className="text-slate-400" />
              )}
              <span className="hidden sm:inline font-mono">
                {voiceStatus === 'listening' ? 'MIC LISTENING' : voiceStatus === 'speaking' ? 'JARVIS SPEAKING' : 'PUSH TO TALK'}
              </span>
            </button>

            {/* Toggle Camera / Gesture Control */}
            <button
              onClick={() => onUpdateSettings({ isEnabled: !settings.isEnabled })}
              className={`gesture-clickable flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                settings.isEnabled
                  ? 'bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={settings.isEnabled ? 'Disable Gesture Tracking' : 'Enable Gesture Tracking'}
            >
              {settings.isEnabled ? <Video size={15} className="text-cyan-400" /> : <VideoOff size={15} />}
              <span className="hidden sm:inline">
                {settings.isEnabled ? 'Gestures ON' : 'Gestures OFF'}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => onUpdateSettings({ enableSound: !settings.enableSound })}
              className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title={settings.enableSound ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
            >
              {settings.enableSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Gesture Guide Button */}
            <button
              onClick={onOpenGuide}
              className="gesture-clickable flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              <HelpCircle size={15} className="text-cyan-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-slate-800 overflow-x-auto gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`gesture-clickable flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Gesture Swipe Helper Navigation Indicator Bar */}
        {settings.isEnabled && (
          <div className="py-1 bg-slate-950/60 border-t border-slate-800 px-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <ChevronLeft size={13} className="text-cyan-400 animate-pulse" /> Swipe Left (Prev)
            </span>
            <span className="text-slate-500 hidden sm:inline">
              Voice: "Navigate to Analytics" | Press Spacebar to speak
            </span>
            <span className="flex items-center gap-1">
              Swipe Right (Next) <ChevronRight size={13} className="text-cyan-400 animate-pulse" />
            </span>
          </div>
        )}
      </div>
    </header>
  );
});

Navbar.displayName = 'Navbar';

