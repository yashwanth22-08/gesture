import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Hand,
  CheckCircle2,
  Share2,
  Bookmark
} from 'lucide-react';
import { SlideItem } from '../../types';

const SLIDES: SlideItem[] = [
  {
    id: 1,
    title: 'Touchless Human-Computer Interaction',
    category: 'Future AI Interfaces',
    description:
      'Computer vision models enable real-time hand landmark estimation directly inside modern browsers using WebGL & WebAssembly.',
    bgGradient: 'from-blue-900/60 via-slate-900 to-indigo-950/80',
    accentColor: '#3b82f6',
    stats: [
      { label: 'Tracking Speed', value: '60 FPS' },
      { label: 'Landmarks', value: '21 Points' },
      { label: 'Latency', value: '< 15ms' },
    ],
    tags: ['MediaPipe', 'Vision AI', 'TypeScript', 'Webcam'],
  },
  {
    id: 2,
    title: 'Gesture Navigation Architecture',
    category: 'System Design',
    description:
      'Smooth pointer interpolation combined with dynamic velocity thresholding detects swipe, pinch, and static hand postures seamlessly.',
    bgGradient: 'from-cyan-900/60 via-slate-900 to-teal-950/80',
    accentColor: '#06b6d4',
    stats: [
      { label: 'Accuracy', value: '98.4%' },
      { label: 'Cooldown', value: '500ms' },
      { label: 'Smoother', value: 'EMA Filter' },
    ],
    tags: ['Algorithms', 'Physics', 'Signal Processing'],
  },
  {
    id: 3,
    title: 'Accessibility & Dual Controls',
    category: 'User Experience',
    description:
      'Provides physical touchless control for sterile environments, presentation screens, or motor accessibility, backed by standard mouse/touch fallbacks.',
    bgGradient: 'from-purple-900/60 via-slate-900 to-pink-950/80',
    accentColor: '#a855f7',
    stats: [
      { label: 'Fallback', value: '100% Mouse' },
      { label: 'Privacy', value: '100% On-Device' },
      { label: 'Permissions', value: 'Camera Only' },
    ],
    tags: ['Accessibility', 'Privacy', 'Inclusive UI'],
  },
  {
    id: 4,
    title: 'Real-Time Performance Dashboard',
    category: 'Productivity Suite',
    description:
      'Modular full-stack dashboard featuring interactive analytics, media controls, and instant visual feedback on gesture triggers.',
    bgGradient: 'from-amber-900/60 via-slate-900 to-orange-950/80',
    accentColor: '#f59e0b',
    stats: [
      { label: 'Modules', value: '5 Views' },
      { label: 'Theme', value: 'Responsive' },
      { label: 'Audio', value: 'Web Audio' },
    ],
    tags: ['React 19', 'Tailwind v4', 'Recharts'],
  },
];

export const SlidesTab: React.FC = React.memo(() => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentSlide = SLIDES[currentIdx];

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-40 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400 font-medium text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel border border-white/15 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Gesture-Navigated Slide Deck</h2>
            <p className="text-xs text-white/60">
              Wave hand <strong className="text-cyan-300">Left</strong> or <strong className="text-cyan-300">Right</strong> in front of your camera to flip slides!
            </p>
          </div>
        </div>

        {/* Slide Counter Indicator */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/70 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
            Slide <strong className="text-white">{currentIdx + 1}</strong> / {SLIDES.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="gesture-clickable p-2 rounded-xl glass-button hover:bg-white/15 text-white transition-colors"
              title="Previous Slide (Swipe Right)"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNext}
              className="gesture-clickable p-2 rounded-xl glass-button hover:bg-white/15 text-white transition-colors"
              title="Next Slide (Swipe Left)"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Presentation Stage */}
      <div
        className={`relative rounded-3xl glass-panel border border-white/20 p-8 sm:p-12 shadow-2xl transition-all duration-300 min-h-[380px] flex flex-col justify-between overflow-hidden`}
      >
        {/* Glow backdrop */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ backgroundColor: currentSlide.accentColor }}
        />

        {/* Top bar of slide */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 text-white/90 border border-white/20 flex items-center gap-1.5 backdrop-blur-md">
            <Sparkles size={13} style={{ color: currentSlide.accentColor }} />
            {currentSlide.category}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                showToast(isBookmarked ? 'Removed from saved slides' : 'Slide saved!');
              }}
              className={`gesture-clickable p-2 rounded-xl border transition-colors ${
                isBookmarked
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : 'glass-button text-white/70 hover:text-white'
              }`}
            >
              <Bookmark size={16} />
            </button>
            <button
              onClick={() => showToast('Slide link copied to clipboard!')}
              className="gesture-clickable p-2 rounded-xl glass-button text-white/70 hover:text-white transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Slide Content */}
        <div className="relative z-10 my-8 space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight leading-tight">
            {currentSlide.title}
          </h1>
          <p className="text-sm sm:text-base text-white/80 leading-relaxed">
            {currentSlide.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {currentSlide.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-white/90 font-medium backdrop-blur-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
          {currentSlide.stats.map((s, idx) => (
            <div key={idx} className="bg-white/5 p-3.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="text-xs text-white/60 font-medium">{s.label}</div>
              <div className="text-lg font-bold text-white mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide Deck Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SLIDES.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentIdx(idx)}
            className={`gesture-clickable p-3.5 rounded-2xl border text-left transition-all ${
              currentIdx === idx
                ? 'glass-panel border-cyan-400/80 shadow-lg shadow-cyan-500/20 scale-[1.02] bg-cyan-500/10'
                : 'glass-panel-interactive border-white/10 text-white/60'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 mb-1">
              0{s.id} • {s.category}
            </div>
            <div className="text-xs font-semibold text-white truncate">{s.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
});

SlidesTab.displayName = 'SlidesTab';
