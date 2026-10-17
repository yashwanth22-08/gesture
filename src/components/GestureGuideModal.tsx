import React from 'react';
import { X, Hand, Sparkles, CheckCircle2 } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnableGesture: () => void;
  isGestureEnabled: boolean;
}

const GESTURE_ITEMS = [
  {
    icon: '👈 / 👉',
    title: 'Swipe Left / Right',
    motion: 'Wave hand horizontally',
    description: 'Navigate between Dashboard Tabs or Slide decks',
    badge: 'Navigation',
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  {
    icon: '☝️',
    title: 'Point Index Finger',
    motion: 'Extend index finger',
    description: 'Move virtual pointer dot on screen over interactive cards/buttons',
    badge: 'Pointer',
    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  },
  {
    icon: '👌',
    title: 'Pinch (Index + Thumb)',
    motion: 'Touch thumb tip to index tip',
    description: 'Trigger Click on any hovered dashboard button or tab',
    badge: 'Select',
    bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  },
  {
    icon: '🖐',
    title: 'Open Palm',
    motion: 'Extend all 5 fingers',
    description: 'Pause media player or clear active selections',
    badge: 'Media / Control',
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  {
    icon: '✊',
    title: 'Fist',
    motion: 'Curl all fingers into palm',
    description: 'Stop media player or close popups / reset layout',
    badge: 'Action',
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  {
    icon: '✌️',
    title: 'Peace Sign',
    motion: 'Index + Middle finger extended',
    description: 'Quick toggle light/dark background theme',
    badge: 'Shortcut',
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
];

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({
  isOpen,
  onClose,
  onEnableGesture,
  isGestureEnabled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel border border-white/20 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative text-white backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full glass-button text-white/70 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/40">
            <Hand size={24} />
          </div>
          <div>
            <h2 className="text-xl font-light tracking-tight text-white flex items-center gap-2">
              Gesture Navigation <span className="font-bold text-cyan-300">Guide</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-normal border border-cyan-400/30 flex items-center gap-1">
                <Sparkles size={12} /> AI Vision Powered
              </span>
            </h2>
            <p className="text-xs text-white/60">
              Control your dashboard effortlessly in real time with intuitive hand gestures.
            </p>
          </div>
        </div>

        {/* Gesture Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
          {GESTURE_ITEMS.map((g, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl glass-panel-interactive border border-white/10 flex items-start gap-3"
            >
              <div className="text-3xl p-2 rounded-xl bg-white/10 border border-white/15 flex-shrink-0">
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-semibold text-white/90">{g.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${g.bg}`}>
                    {g.badge}
                  </span>
                </div>
                <p className="text-xs text-cyan-300 font-medium">{g.motion}</p>
                <p className="text-xs text-white/60 mt-1 leading-snug">{g.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/60 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>You can also use standard mouse & touch anytime.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isGestureEnabled && (
              <button
                onClick={() => {
                  onEnableGesture();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl glass-button-primary text-cyan-100 text-xs font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Hand size={15} />
                Enable Gesture Tracking
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl glass-button text-white/80 hover:text-white text-xs font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
