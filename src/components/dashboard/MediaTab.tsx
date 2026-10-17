import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music,
  Hand,
  Disc,
  ListMusic,
  CheckCircle2
} from 'lucide-react';
import { MediaItem, GestureState } from '../../types';

const MEDIA_PLAYLIST: MediaItem[] = [
  {
    id: 1,
    title: 'Cybernetic Ambient Pulse',
    artist: 'Future Synth',
    album: 'Gesture Motion OST',
    duration: 184, // 3:04
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    category: 'Electronic Ambient',
  },
  {
    id: 2,
    title: 'Touchless Horizons',
    artist: 'DeepMind Waves',
    album: 'Neural Frequency',
    duration: 215, // 3:35
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80',
    category: 'Chillhop / Focus',
  },
  {
    id: 3,
    title: 'Landmark Estimation Stream',
    artist: 'MediaPipe Beats',
    album: 'Computer Vision 2026',
    duration: 162, // 2:42
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
    category: 'Lo-Fi Beats',
  },
];

interface MediaTabProps {
  gestureState?: GestureState;
}

export const MediaTab: React.FC<MediaTabProps> = ({ gestureState }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressSec, setProgressSec] = useState(45);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const currentTrack = MEDIA_PLAYLIST[currentIdx];

  // Gesture Controls Reaction
  useEffect(() => {
    if (!gestureState || !gestureState.handDetected) return;

    const g = gestureState.currentGesture;

    if (g === 'OPEN_PALM' && isPlaying) {
      setIsPlaying(false);
      triggerNotice('🖐 Open Palm Detected: Media Paused');
    } else if (g === 'FIST' && (isPlaying || progressSec > 0)) {
      setIsPlaying(false);
      setProgressSec(0);
      triggerNotice('✊ Fist Gesture: Media Stopped');
    } else if (g === 'SWIPE_LEFT') {
      handleNextTrack();
      triggerNotice('👈 Swipe Left: Next Track');
    } else if (g === 'SWIPE_RIGHT') {
      handlePrevTrack();
      triggerNotice('👉 Swipe Right: Previous Track');
    }
  }, [gestureState?.currentGesture]);

  // Audio timer simulation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgressSec((prev) => {
        if (prev >= currentTrack.duration) {
          handleNextTrack();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.duration]);

  const triggerNotice = (msg: string) => {
    setStatusNotice(msg);
    setTimeout(() => setStatusNotice(null), 2500);
  };

  const handleNextTrack = () => {
    setCurrentIdx((prev) => (prev + 1) % MEDIA_PLAYLIST.length);
    setProgressSec(0);
  };

  const handlePrevTrack = () => {
    setCurrentIdx((prev) => (prev - 1 + MEDIA_PLAYLIST.length) % MEDIA_PLAYLIST.length);
    setProgressSec(0);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="space-y-6 text-slate-100 animate-in fade-in duration-300">
      {/* Notice Banner */}
      {statusNotice && (
        <div className="fixed top-20 right-6 z-40 bg-purple-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-purple-400 font-medium text-xs flex items-center gap-2 animate-bounce">
          <Hand size={16} />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel border border-white/15 p-4 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
            <Music size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Gesture Media Player</h2>
            <p className="text-xs text-white/60">
              Open Palm = Pause | Fist = Stop | Swipe = Skip Track
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 text-white/80 backdrop-blur-md">
          <Hand size={14} className="text-cyan-300" />
          <span>Touchless Playback Active</span>
        </div>
      </div>

      {/* Main Player Card */}
      <div className="glass-panel border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Cover Art with Spinning Disc */}
          <div className="flex justify-center">
            <div className="relative w-56 h-56 rounded-3xl overflow-hidden shadow-2xl border border-white/20 group">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

              <div
                className={`absolute inset-0 flex items-center justify-center ${
                  isPlaying ? 'animate-spin [animation-duration:8s]' : ''
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-slate-950/80 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-300 backdrop-blur-md shadow-xl">
                  <Disc size={28} />
                </div>
              </div>
            </div>
          </div>

          {/* Track Details & Controls */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30">
                {currentTrack.category}
              </span>
              <h2 className="text-2xl font-light text-white mt-2 tracking-tight">
                {currentTrack.title}
              </h2>
              <p className="text-sm text-white/60 font-medium">{currentTrack.artist} • {currentTrack.album}</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max={currentTrack.duration}
                value={progressSec}
                onChange={(e) => setProgressSec(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-white/10 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/50 font-mono">
                <span>{formatTime(progressSec)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Main Playback Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevTrack}
                  className="gesture-clickable p-3 rounded-2xl glass-button hover:bg-white/15 text-white transition-colors"
                  title="Previous Track (Swipe Right)"
                >
                  <SkipBack size={18} />
                </button>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`gesture-clickable p-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center ${
                    isPlaying
                      ? 'glass-button-primary text-cyan-200'
                      : 'bg-white/90 text-slate-950 hover:bg-white'
                  }`}
                  title={isPlaying ? 'Pause Track (Open Palm)' : 'Play Track (Pinch)'}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setProgressSec(0);
                  }}
                  className="gesture-clickable p-3 rounded-2xl glass-button hover:bg-white/15 text-white transition-colors"
                  title="Stop Track (Fist)"
                >
                  <Square size={18} />
                </button>

                <button
                  onClick={handleNextTrack}
                  className="gesture-clickable p-3 rounded-2xl glass-button hover:bg-white/15 text-white transition-colors"
                  title="Next Track (Swipe Left)"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl text-white/60 hover:text-white"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    setIsMuted(false);
                  }}
                  className="w-20 accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer hidden sm:block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Queue */}
      <div className="glass-panel border border-white/15 rounded-3xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
          <ListMusic size={16} className="text-cyan-300" /> Track Queue
        </h3>
        <div className="space-y-2">
          {MEDIA_PLAYLIST.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => {
                setCurrentIdx(idx);
                setProgressSec(0);
                setIsPlaying(true);
              }}
              className={`gesture-clickable p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                currentIdx === idx
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-white font-semibold'
                  : 'glass-panel-interactive border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono w-4 text-white/40">{idx + 1}</span>
                <div>
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-[11px] text-white/50">{item.artist}</div>
                </div>
              </div>
              <span className="text-xs font-mono text-white/50">{formatTime(item.duration)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
