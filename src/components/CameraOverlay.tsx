import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Video,
  X,
  Activity,
  Cpu,
  BarChart2,
  RefreshCw,
  Gauge,
  Info,
  Crosshair,
  Sun,
  Sparkles
} from 'lucide-react';
import { handGestureService } from '../services/handGestureService';
import { drawHandSkeleton } from '../utils/drawSkeleton';
import { GestureSettings, GestureState, GestureType, CalibrationData } from '../types';

interface CameraOverlayProps {
  settings: GestureSettings;
  onUpdateSettings: (newSettings: Partial<GestureSettings>) => void;
  onGestureStateChange: (state: GestureState) => void;
}

const GESTURE_LABELS: Record<GestureType, { label: string; icon: string; color: string }> = {
  NONE: { label: 'Hand Active', icon: '🖐', color: 'bg-slate-700 text-slate-200' },
  POINTING: { label: 'Pointing (Hover)', icon: '☝️', color: 'bg-cyan-600 text-white' },
  PINCH: { label: 'Pinch (Select)', icon: '👌', color: 'bg-pink-600 text-white animate-pulse' },
  SWIPE_LEFT: { label: 'Swipe Left (Next)', icon: '👈', color: 'bg-emerald-600 text-white animate-bounce' },
  SWIPE_RIGHT: { label: 'Swipe Right (Prev)', icon: '👉', color: 'bg-emerald-600 text-white animate-bounce' },
  SWIPE_UP: { label: 'Swipe Up', icon: '👆', color: 'bg-emerald-600 text-white animate-bounce' },
  SWIPE_DOWN: { label: 'Swipe Down', icon: '👇', color: 'bg-emerald-600 text-white animate-bounce' },
  OPEN_PALM: { label: 'Open Palm (Pause)', icon: '🖐', color: 'bg-amber-600 text-white' },
  FIST: { label: 'Fist (Stop/Back)', icon: '✊', color: 'bg-purple-600 text-white' },
  PEACE: { label: 'Peace Sign', icon: '✌️', color: 'bg-indigo-600 text-white' },
  THUMBS_UP: { label: 'Thumbs Up', icon: '👍', color: 'bg-teal-600 text-white' },
};

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  settings,
  onUpdateSettings,
  onGestureStateChange,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState<boolean>(false);
  const [currentGestureState, setCurrentGestureState] = useState<GestureState | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Calibration state
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationRemaining, setCalibrationRemaining] = useState<number>(3.0);
  const [calibrationBrightness, setCalibrationBrightness] = useState<number>(120);
  const [calibrationData, setCalibrationData] = useState<CalibrationData | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastFpsCalcRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  const handleStartCalibration = async () => {
    if (!videoRef.current || !isCameraActive) return;
    setIsCalibrating(true);
    setCalibrationRemaining(3.0);

    const calData = await handGestureService.startCalibration(
      videoRef.current,
      3000,
      (remainingSec, currentBrightness) => {
        setCalibrationRemaining(remainingSec);
        setCalibrationBrightness(currentBrightness);
      }
    );

    setCalibrationData(calData);
    setIsCalibrating(false);
  };

  // Initialize MediaPipe model
  const handleInitModel = async (forceRetry: boolean = false) => {
    setModelStatus('loading');
    setCameraError(null);
    const ok = await handGestureService.initialize(forceRetry);
    if (ok) {
      setModelStatus('ready');
      const status = handGestureService.getStatus();
      if (status.isFallbackMode) {
        console.log('Running in Fallback Gesture Mode');
      }
    } else {
      setModelStatus('error');
      const status = handGestureService.getStatus();
      setCameraError(status.error || 'Failed to initialize gesture recognition model');
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initModel() {
      setModelStatus('loading');
      const ok = await handGestureService.initialize();
      if (isMounted) {
        if (ok) {
          setModelStatus('ready');
        } else {
          setModelStatus('error');
          const status = handGestureService.getStatus();
          setCameraError(status.error || 'Failed to initialize gesture recognition model');
        }
      }
    }

    initModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // Enumerate camera devices
  useEffect(() => {
    async function getCameraDevices() {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devs.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !settings.cameraDeviceId) {
          onUpdateSettings({ cameraDeviceId: videoDevs[0].deviceId });
        }
      } catch (err) {
        console.warn('Unable to list video devices:', err);
      }
    }
    if (navigator.mediaDevices) {
      getCameraDevices();
    }
  }, []);

  // Start / Stop Video Stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      if (!settings.isEnabled) {
        if (videoRef.current && videoRef.current.srcObject) {
          const currentStream = videoRef.current.srcObject as MediaStream;
          currentStream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        console.log('[CameraOverlay] Camera disabled in settings.');
        return;
      }

      try {
        setCameraError(null);
        console.log('[CameraOverlay] Requesting webcam media stream access...');

        const constraints: MediaStreamConstraints = {
          video: settings.cameraDeviceId
            ? { deviceId: { exact: settings.cameraDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
            : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        };

        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (deviceErr) {
          console.warn('[CameraOverlay] Specific device constraint failed, trying default camera:', deviceErr);
          stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
        }
        console.log('[CameraOverlay] Webcam stream acquired successfully:', stream.id);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                setIsCameraActive(true);
                console.log(`[CameraOverlay] Video element playing continuously. Dimensions: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
              }).catch((playErr) => {
                console.error('[CameraOverlay] Error playing video stream:', playErr);
              });
            }
          };
        }
      } catch (err: unknown) {
        console.error('[CameraOverlay] Camera access error:', err);
        let errorMsg = 'Camera access denied or device unavailable.';
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            errorMsg = 'Camera permission denied. Please grant permission in browser settings.';
          } else if (err.name === 'NotFoundError') {
            errorMsg = 'No camera device found on this system.';
          } else if (err.name === 'NotReadableError') {
            errorMsg = 'Camera is currently in use by another application.';
          }
        }
        setCameraError(errorMsg);
        setIsCameraActive(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [settings.isEnabled, settings.cameraDeviceId]);

  // Video processing frame loop
  useEffect(() => {
    if (!isCameraActive || modelStatus !== 'ready') return;

    let isRunning = true;

    handGestureService.setGestureCallback((state, landmarks) => {
      if (!isRunning) return;

      setCurrentGestureState(state);
      onGestureStateChange(state);

      // Draw skeleton canvas overlay
      if (canvasRef.current && videoRef.current && settings.showSkeleton) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const vWidth = videoRef.current.videoWidth || 320;
          const vHeight = videoRef.current.videoHeight || 240;
          if (canvas.width !== vWidth) canvas.width = vWidth;
          if (canvas.height !== vHeight) canvas.height = vHeight;

          if (landmarks && landmarks.length > 0) {
            drawHandSkeleton(
              ctx,
              landmarks,
              settings.mirrorVideo,
              state.isPinching,
              state.currentGesture === 'PINCH' ? '#ec4899' : '#38bdf8'
            );
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
    });

    const loop = (time: number) => {
      if (!isRunning) return;

      if (videoRef.current && videoRef.current.readyState >= 2) {
        handGestureService.processVideoFrame(videoRef.current, time, settings);

        // FPS Calculation
        frameCountRef.current++;
        if (time - lastFpsCalcRef.current >= 1000) {
          setFps(Math.round((frameCountRef.current * 1000) / (time - lastFpsCalcRef.current)));
          frameCountRef.current = 0;
          lastFpsCalcRef.current = time;
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, modelStatus, settings, onGestureStateChange]);

  if (!settings.showWebcamOverlay || !settings.isEnabled) {
    return null;
  }

  const currentGestureInfo = GESTURE_LABELS['NONE']; // default

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${
        isMinimized ? 'w-48 h-16' : 'w-72 sm:w-80 h-auto'
      } glass-panel text-white rounded-2xl border border-white/20 shadow-2xl backdrop-blur-2xl overflow-hidden`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-cyan-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs font-semibold tracking-wide text-white/90 flex items-center gap-1">
            <Video size={13} className="text-cyan-300" />
            Hand Tracking
          </span>
          {fps > 0 && <span className="text-[10px] text-cyan-300/70 font-mono">({fps} FPS)</span>}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleStartCalibration}
            disabled={!isCameraActive || isCalibrating}
            className={`p-1 rounded-lg transition-all ${
              isCalibrating
                ? 'bg-amber-500/30 text-amber-300 animate-pulse border border-amber-400/50'
                : calibrationData
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                : 'hover:bg-slate-800 text-cyan-300 hover:text-white'
            }`}
            title="3s Hand & Lighting Calibration"
          >
            <Crosshair size={13} />
          </button>
          <button
            onClick={() => {
              setShowDiagnosticsPanel(!showDiagnosticsPanel);
              if (!showDiagnosticsPanel) setShowSettingsPanel(false);
            }}
            className={`p-1 rounded-lg transition-colors ${
              showDiagnosticsPanel
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Real-Time Diagnostics & FPS Stats"
          >
            <Activity size={13} />
          </button>
          <button
            onClick={() => {
              setShowSettingsPanel(!showSettingsPanel);
              if (!showSettingsPanel) setShowDiagnosticsPanel(false);
            }}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Gesture Controls"
          >
            <Sliders size={13} />
          </button>
          <button
            onClick={() => onUpdateSettings({ mirrorVideo: !settings.mirrorVideo })}
            className={`p-1 hover:bg-slate-800 rounded-lg transition-colors ${
              settings.mirrorVideo ? 'text-blue-400' : 'text-slate-400'
            }`}
            title="Mirror Camera Feed"
          >
            <FlipHorizontal size={13} />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <button
            onClick={() => onUpdateSettings({ showWebcamOverlay: false })}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Minimized View Bar */}
      {isMinimized && (
        <div className="p-3 flex items-center justify-between text-xs">
          <span className="text-slate-300 font-mono flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" /> Active
          </span>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-blue-400 hover:underline text-xs font-medium"
          >
            Expand
          </button>
        </div>
      )}

      {/* Full Window Camera Stream & Skeleton */}
      {!isMinimized && (
        <div className="relative">
          {/* Settings Panel Overlay */}
          {showSettingsPanel && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 p-3 flex flex-col gap-2.5 overflow-y-auto text-xs text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <span className="font-semibold text-slate-100">Camera & Gesture Tweaks</span>
                <button
                  onClick={() => setShowSettingsPanel(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Camera Selector */}
              {devices.length > 1 && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Video Input Device</label>
                  <select
                    value={settings.cameraDeviceId}
                    onChange={(e) => onUpdateSettings({ cameraDeviceId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  >
                    {devices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sensitivity */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Swipe Sensitivity</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['low', 'medium', 'high'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdateSettings({ sensitivity: s })}
                      className={`px-2 py-1 rounded text-center capitalize border ${
                        settings.sensitivity === s
                          ? 'bg-blue-600 border-blue-500 text-white font-medium'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Show Hand Skeleton</span>
                  <input
                    type="checkbox"
                    checked={settings.showSkeleton}
                    onChange={(e) => onUpdateSettings({ showSkeleton: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Auto Click on Hover</span>
                  <input
                    type="checkbox"
                    checked={settings.autoClickOnHover}
                    onChange={(e) => onUpdateSettings({ autoClickOnHover: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Sound Feedback</span>
                  <input
                    type="checkbox"
                    checked={settings.enableSound}
                    onChange={(e) => onUpdateSettings({ enableSound: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Diagnostic Overlay Panel */}
          {showDiagnosticsPanel && (
            <div className="absolute inset-0 z-20 bg-slate-950/95 p-3 flex flex-col gap-2 overflow-y-auto text-xs text-slate-200 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Activity size={14} /> Tracking Diagnostics
                </span>
                <button
                  onClick={() => setShowDiagnosticsPanel(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {/* FPS Card */}
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col justify-between">
                  <span className="text-white/60 text-[10px]">FPS (Frame Rate)</span>
                  <span
                    className={`font-bold text-sm ${
                      fps >= 20 ? 'text-emerald-400' : fps >= 10 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {fps} FPS
                  </span>
                </div>

                {/* Hand Detection Card */}
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col justify-between">
                  <span className="text-white/60 text-[10px]">Hand Detection</span>
                  <span
                    className={`font-bold text-xs ${
                      currentGestureState?.handDetected ? 'text-cyan-300' : 'text-amber-400'
                    }`}
                  >
                    {currentGestureState?.handDetected
                      ? `1 Hand (${((currentGestureState.confidence || 0) * 100).toFixed(0)}%)`
                      : 'Searching...'}
                  </span>
                </div>

                {/* OpenGL / WebGL GPU Status Card */}
                {(() => {
                  const status = handGestureService.getStatus();
                  const openGL = status.openGL;
                  return (
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col gap-1 col-span-2">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-cyan-300 font-bold flex items-center gap-1">
                          <Cpu size={11} /> OpenGL / WebGL Status
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            openGL.webgl2Supported
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : openGL.webgl1Supported
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {openGL.webgl2Supported
                            ? 'WebGL 2.0 (Active)'
                            : openGL.webgl1Supported
                            ? 'WebGL 1.0 (Limited)'
                            : 'OpenGL Unavailable'}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/80 space-y-0.5 font-mono">
                        <div className="flex justify-between">
                          <span className="text-white/50">Renderer:</span>
                          <span className="text-white/90 truncate max-w-[190px]" title={openGL.renderer}>
                            {openGL.renderer || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Acceleration:</span>
                          <span className={openGL.isHardwareAccelerated ? 'text-emerald-400' : 'text-amber-400'}>
                            {openGL.isHardwareAccelerated ? 'Hardware GPU' : 'Software / Basic'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Delegate Engine:</span>
                          <span className="text-cyan-400 font-bold">
                            {status.activeDelegate === 'GPU'
                              ? 'GPU (WebGL2 Accelerated)'
                              : status.activeDelegate === 'CPU'
                              ? 'CPU (WASM Fallback)'
                              : 'Smart Fallback Mode'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* AI Model Engine Card */}
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col justify-between col-span-2">
                  <div className="flex items-center justify-between text-white/60 text-[10px]">
                    <span>AI Model Status</span>
                    <span className="text-cyan-400 font-bold">{modelStatus.toUpperCase()}</span>
                  </div>
                  <span className="text-white/90 text-[10px] truncate">
                    {handGestureService.getStatus().isFallbackMode
                      ? 'Fallback Gesture Engine Active'
                      : `MediaPipe HandLandmarker v0.10 (${handGestureService.getStatus().activeDelegate})`}
                  </span>
                </div>

                {/* Cursor & Gesture Card */}
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col justify-between col-span-2">
                  <div className="flex items-center justify-between text-white/60 text-[10px]">
                    <span>Active Gesture</span>
                    <span className="text-emerald-400 font-bold">
                      {currentGestureState?.currentGesture || 'NONE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/80 text-[10px] mt-0.5">
                    <span>
                      Pos: ({currentGestureState?.pointerX?.toFixed(2) ?? '0.50'},{' '}
                      {currentGestureState?.pointerY?.toFixed(2) ?? '0.50'})
                    </span>
                    <span>Pinch: {currentGestureState?.isPinching ? 'YES' : 'NO'}</span>
                  </div>
                </div>

                {/* Calibration Status Card */}
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col justify-between col-span-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-amber-300 font-bold flex items-center gap-1">
                      <Sun size={11} /> Baseline Calibration
                    </span>
                    <span className={calibrationData ? 'text-emerald-400 font-bold' : 'text-white/40'}>
                      {calibrationData ? 'CALIBRATED' : 'NOT CALIBRATED'}
                    </span>
                  </div>
                  {calibrationData ? (
                    <div className="text-[10px] text-white/80 space-y-0.5 font-mono mt-1">
                      <div className="flex justify-between">
                        <span className="text-white/50">Brightness:</span>
                        <span className="text-white/90">{calibrationData.baselineBrightness} / 255</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Lighting:</span>
                        <span className="text-cyan-300">{calibrationData.lightingCondition}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/50">Sensitivity Gain:</span>
                        <span className="text-emerald-400">{calibrationData.sensitivityMultiplier.toFixed(2)}x</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-white/50 text-[10px] mt-0.5">
                      Hold hand in frame for 3s to measure ambient light & skin color baseline.
                    </span>
                  )}
                  <button
                    onClick={handleStartCalibration}
                    disabled={!isCameraActive || isCalibrating}
                    className="mt-1.5 w-full py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <Crosshair size={11} /> {calibrationData ? 'Recalibrate Baseline (3s)' : 'Start 3s Calibration'}
                  </button>
                </div>

                {/* Video Stream Specs */}
                <div className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col justify-between col-span-2">
                  <span className="text-white/60 text-[10px]">Webcam Stream Specs</span>
                  <span className="text-white/80 text-[10px]">
                    {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0} px | readyState{' '}
                    {videoRef.current?.readyState || 0}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  onClick={() => handleInitModel(true)}
                  className="w-full py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/30 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={12} /> Force Reload AI Model
                </button>
              </div>
            </div>
          )}

          {/* Video Container */}
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${settings.mirrorVideo ? 'scale-x-[-1]' : ''}`}
            />

            {/* Canvas overlay for drawing hand bones */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Calibration Target Reticle Overlay */}
            {isCalibrating && (
              <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                <div className="relative w-32 h-32 border-2 border-dashed border-cyan-400 rounded-2xl flex items-center justify-center animate-pulse bg-cyan-500/10">
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />

                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-2xl font-bold font-mono text-cyan-300 drop-shadow">
                      {calibrationRemaining.toFixed(1)}s
                    </span>
                    <span className="text-[10px] text-white/90 font-semibold uppercase tracking-wider">
                      Hold Hand Here
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-col items-center gap-0.5">
                  <p className="text-xs text-white font-medium">Measuring Ambient Light & Skin Tone...</p>
                  <p className="text-[10px] text-cyan-300 font-mono">
                    Live Brightness: {calibrationBrightness} / 255
                  </p>
                </div>
              </div>
            )}

            {/* Mini Live HUD Badge */}
            {!showDiagnosticsPanel && isCameraActive && (
              <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/80 font-mono flex items-center gap-1.5 pointer-events-none">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentGestureState?.handDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{fps} FPS</span>
                {calibrationData && (
                  <>
                    <span className="text-white/40">|</span>
                    <span className="text-amber-300 flex items-center gap-0.5" title="Calibrated Light">
                      <Sun size={10} />
                      {calibrationData.baselineBrightness}
                    </span>
                  </>
                )}
                <span className="text-white/40">|</span>
                <span
                  className={
                    currentGestureState?.handDetected ? 'text-cyan-300 font-bold' : 'text-white/60'
                  }
                >
                  {currentGestureState?.handDetected ? 'Hand Tracked' : 'Searching...'}
                </span>
              </div>
            )}

            {/* Loading / Error States */}
            {modelStatus === 'loading' && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-300 font-medium">
                  Loading Hand Gesture AI...
                </span>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center gap-2 p-4 text-center text-rose-400 z-30">
                <AlertCircle size={24} />
                <span className="text-xs font-medium">{cameraError}</span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleInitModel(true)}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
                  >
                    Retry AI Model
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ isEnabled: true })}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium"
                  >
                    Retry Camera
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
