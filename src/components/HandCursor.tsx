import React, { useEffect, useState } from 'react';
import { GestureState, GestureType } from '../types';

interface HandCursorProps {
  gestureState: GestureState;
  isEnabled: boolean;
  autoClickOnHover: boolean;
  hoverDwellTimeMs: number;
  onHoverClick?: (element: HTMLElement) => void;
}

const GESTURE_ICONS: Record<GestureType, string> = {
  NONE: '🖐',
  POINTING: '☝️',
  PINCH: '👌',
  SWIPE_LEFT: '👈',
  SWIPE_RIGHT: '👉',
  SWIPE_UP: '👆',
  SWIPE_DOWN: '👇',
  OPEN_PALM: '🖐',
  FIST: '✊',
  PEACE: '✌️',
  THUMBS_UP: '👍',
};

export const HandCursor: React.FC<HandCursorProps> = React.memo(({
  gestureState,
  isEnabled,
  autoClickOnHover,
  hoverDwellTimeMs,
  onHoverClick,
}) => {
  const [hoverProgress, setHoverProgress] = useState(0);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);

  const { pointerX, pointerY, handDetected, currentGesture, isPinching } = gestureState;

  // Convert normalized (0..1) to window px
  const screenX = Math.max(10, Math.min(window.innerWidth - 10, pointerX * window.innerWidth));
  const screenY = Math.max(10, Math.min(window.innerHeight - 10, pointerY * window.innerHeight));

  // Detect element under cursor (quantized to prevent layout thrashing on tiny sub-pixel shifts)
  const quantizedX = Math.round(screenX / 3);
  const quantizedY = Math.round(screenY / 3);

  useEffect(() => {
    if (!isEnabled || !handDetected) {
      setHoveredElement(null);
      setHoverProgress(0);
      return;
    }

    const posX = quantizedX * 3;
    const posY = quantizedY * 3;

    const el = document.elementFromPoint(posX, posY) as HTMLElement | null;
    if (el) {
      const clickable = el.closest('button, a, [role="button"], input, select, .gesture-clickable') as HTMLElement | null;
      setHoveredElement((prev) => (prev === clickable ? prev : clickable));
    } else {
      setHoveredElement(null);
    }
  }, [quantizedX, quantizedY, isEnabled, handDetected]);

  // Handle Dwell Hover Auto-Click
  useEffect(() => {
    if (!autoClickOnHover || !hoveredElement) {
      setHoverProgress(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / hoverDwellTimeMs) * 100);
      setHoverProgress(progress);

      if (elapsed >= hoverDwellTimeMs) {
        clearInterval(interval);
        if (hoveredElement) {
          hoveredElement.click();
          if (onHoverClick) onHoverClick(hoveredElement);
        }
        setHoverProgress(0);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [hoveredElement, autoClickOnHover, hoverDwellTimeMs, onHoverClick]);

  // Execute pinch click if pinching over element
  useEffect(() => {
    if (isPinching && hoveredElement) {
      hoveredElement.click();
      if (onHoverClick) onHoverClick(hoveredElement);
    }
  }, [isPinching, hoveredElement, onHoverClick]);

  if (!isEnabled || !handDetected) return null;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-transform duration-75 ease-out"
      style={{
        transform: `translate3d(${screenX}px, ${screenY}px, 0)`,
        left: -16,
        top: -16,
      }}
    >
      {/* Outer Pulse Ring */}
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
          isPinching
            ? 'border-pink-400 bg-pink-500/30 scale-125 shadow-lg shadow-pink-500/50'
            : hoveredElement
            ? 'border-cyan-300 bg-cyan-400/30 scale-110 shadow-lg shadow-cyan-400/60'
            : 'border-cyan-400/80 bg-cyan-400/15 backdrop-blur-sm'
        }`}
      >
        {/* Core Dot */}
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isPinching ? 'bg-pink-400 animate-ping' : hoveredElement ? 'bg-cyan-300' : 'bg-cyan-400'
          }`}
        />

        {/* Dwell Circle Progress SVG */}
        {autoClickOnHover && hoveredElement && (
          <svg className="absolute inset-0 w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="transparent"
              className="text-cyan-300"
              strokeDasharray={88}
              strokeDashoffset={88 - (88 * hoverProgress) / 100}
            />
          </svg>
        )}
      </div>

      {/* Floating Gesture Badge */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 glass-panel text-white px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-xl border border-white/20 shadow-md whitespace-nowrap flex items-center gap-1">
        <span>{GESTURE_ICONS[currentGesture]}</span>
        <span className="text-[10px] text-cyan-200 font-mono">
          {currentGesture !== 'NONE' ? currentGesture.replace('_', ' ') : 'POINTER'}
        </span>
      </div>
    </div>
  );
});

HandCursor.displayName = 'HandCursor';
