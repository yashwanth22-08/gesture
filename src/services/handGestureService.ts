import { HandLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { GestureType, GestureState, GestureSettings, CalibrationData } from '../types';

export interface OpenGLDiagnostics {
  webgl2Supported: boolean;
  webgl1Supported: boolean;
  vendor: string;
  renderer: string;
  isHardwareAccelerated: boolean;
  maxTextureSize: number;
  extensionsCount: number;
  error: string | null;
}

export class HandGestureService {
  private handLandmarker: HandLandmarker | null = null;
  private isInitialized: boolean = false;
  private isLoading: boolean = false;
  private isFallbackMode: boolean = false;
  private initError: string | null = null;
  private activeDelegate: 'GPU' | 'CPU' | 'FALLBACK' = 'FALLBACK';

  // Calibration state
  private calibrationData: CalibrationData | null = null;
  private isCalibrating: boolean = false;

  // Analysis offscreen canvas
  private sampleCanvas: HTMLCanvasElement | null = null;
  private sampleCtx: CanvasRenderingContext2D | null = null;

  // Smoothing state for pointer cursor
  private smoothedX: number = 0.5;
  private smoothedY: number = 0.5;

  // Motion history for swipe detection
  private positionHistory: { x: number; y: number; time: number }[] = [];

  // Per-gesture cooldown tracking (prevents rapid-fire on held postures)
  private lastGestureFireTimes: Map<GestureType, number> = new Map();

  // Gestures that trigger discrete actions and need cooldown protection
  private static readonly ACTION_GESTURES: ReadonlySet<GestureType> = new Set([
    'PINCH', 'OPEN_PALM', 'FIST', 'PEACE', 'THUMBS_UP',
    'SWIPE_LEFT', 'SWIPE_RIGHT', 'SWIPE_UP', 'SWIPE_DOWN',
  ]);

  // Throttle console logging to avoid spam
  private lastLogTime: number = 0;
  private lastDetectedGesture: GestureType = 'NONE';
  private lastTimestampMs: number = -1;

  // Callback for gesture updates
  private onGestureCallback: ((state: GestureState, landmarks: NormalizedLandmark[][] | null) => void) | null = null;

  /**
   * Helper to ensure an offscreen canvas is ready for pixel sampling
   */
  private getOffscreenContext(width: number = 160, height: number = 120): CanvasRenderingContext2D | null {
    if (!this.sampleCanvas) {
      this.sampleCanvas = document.createElement('canvas');
    }
    if (this.sampleCanvas.width !== width || this.sampleCanvas.height !== height) {
      this.sampleCanvas.width = width;
      this.sampleCanvas.height = height;
      this.sampleCtx = null;
    }
    if (!this.sampleCtx) {
      this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });
    }
    return this.sampleCtx;
  }

  /**
   * Calibration Step: Measure baseline color and lighting conditions by sampling camera frames.
   */
  public async startCalibration(
    videoElement: HTMLVideoElement,
    durationMs: number = 3000,
    onProgress?: (progressSec: number, currentBrightness: number) => void
  ): Promise<CalibrationData> {
    this.isCalibrating = true;
    const startTime = performance.now();

    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalY = 0;
    let totalCb = 0;
    let totalCr = 0;
    let samplesCount = 0;

    return new Promise<CalibrationData>((resolve) => {
      const sampleInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const remainingSec = Math.max(0, (durationMs - elapsed) / 1000);

        if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
          const ctx = this.getOffscreenContext(120, 90);
          if (ctx) {
            ctx.drawImage(videoElement, 0, 0, 120, 90);
            // Sample central ROI where user holds hand (30% to 70% bounds)
            const imgData = ctx.getImageData(36, 27, 48, 36);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Luminance
              const y = 0.299 * r + 0.587 * g + 0.114 * b;
              // YCbCr skin chrominance
              const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
              const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

              totalR += r;
              totalG += g;
              totalB += b;
              totalY += y;
              totalCb += cb;
              totalCr += cr;
              samplesCount++;
            }
          }
        }

        const currentAvgY = samplesCount > 0 ? totalY / samplesCount : 128;
        if (onProgress) {
          onProgress(remainingSec, Math.round(currentAvgY));
        }

        if (elapsed >= durationMs) {
          clearInterval(sampleInterval);
          this.isCalibrating = false;

          const avgSkinR = samplesCount > 0 ? totalR / samplesCount : 180;
          const avgSkinG = samplesCount > 0 ? totalG / samplesCount : 130;
          const avgSkinB = samplesCount > 0 ? totalB / samplesCount : 110;
          const baselineBrightness = samplesCount > 0 ? totalY / samplesCount : 120;
          const avgSkinCb = samplesCount > 0 ? totalCb / samplesCount : 100;
          const avgSkinCr = samplesCount > 0 ? totalCr / samplesCount : 150;

          let lightingCondition: 'Optimal' | 'Dim Light' | 'Overexposed' | 'High Contrast' = 'Optimal';
          let sensitivityMultiplier = 1.0;

          if (baselineBrightness < 65) {
            lightingCondition = 'Dim Light';
            sensitivityMultiplier = 1.4; // Boost detection sensitivity in low light
          } else if (baselineBrightness > 210) {
            lightingCondition = 'Overexposed';
            sensitivityMultiplier = 1.25;
          } else {
            lightingCondition = 'Optimal';
            sensitivityMultiplier = 1.0;
          }

          const calData: CalibrationData = {
            isCalibrated: true,
            baselineBrightness: Math.round(baselineBrightness),
            lightingCondition,
            avgSkinR: Math.round(avgSkinR),
            avgSkinG: Math.round(avgSkinG),
            avgSkinB: Math.round(avgSkinB),
            avgSkinCb: Math.round(avgSkinCb),
            avgSkinCr: Math.round(avgSkinCr),
            sensitivityMultiplier,
            timestamp: Date.now(),
          };

          this.calibrationData = calData;
          console.log('[HandGestureService] Calibration completed successfully:', calData);
          resolve(calData);
        }
      }, 50);
    });
  }

  public getCalibrationData(): CalibrationData | null {
    return this.calibrationData;
  }

  /**
   * Probes WebGL 1.0 & 2.0 availability and hardware acceleration info.
   */
  public getOpenGLDiagnostics(): OpenGLDiagnostics {
    try {
      const canvas = document.createElement('canvas');
      const gl2 = canvas.getContext('webgl2');
      const webgl2Supported = !!gl2;
      const gl = gl2 || canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
      const webgl1Supported = !!gl;

      if (!gl) {
        return {
          webgl2Supported: false,
          webgl1Supported: false,
          vendor: 'None',
          renderer: 'WebGL Disabled / Unavailable',
          isHardwareAccelerated: false,
          maxTextureSize: 0,
          extensionsCount: 0,
          error: 'WebGL context creation failed. Browser or environment may lack GPU support.',
        };
      }

      let vendor = gl.getParameter(gl.VENDOR) || 'Unknown Vendor';
      let renderer = gl.getParameter(gl.RENDERER) || 'Unknown Renderer';
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

      if (debugInfo) {
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
      }

      const isSoftware = /SwiftShader|LLVMpipe|Software|Mesa|Google SwiftShader|Basic Render/i.test(renderer);
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
      const extensions = gl.getSupportedExtensions() || [];

      return {
        webgl2Supported,
        webgl1Supported,
        vendor,
        renderer,
        isHardwareAccelerated: !isSoftware,
        maxTextureSize,
        extensionsCount: extensions.length,
        error: null,
      };
    } catch (err: unknown) {
      return {
        webgl2Supported: false,
        webgl1Supported: false,
        vendor: 'Error',
        renderer: 'Error querying WebGL',
        isHardwareAccelerated: false,
        maxTextureSize: 0,
        extensionsCount: 0,
        error: err instanceof Error ? err.message : 'WebGL diagnostic probe failed',
      };
    }
  }

  /**
   * Initializes the MediaPipe HandLandmarker model with GPU or CPU delegates.
   * Uses fallback CDN mirrors if primary endpoints are unreachable.
   */
  public async initialize(forceRetry: boolean = false): Promise<boolean> {
    if (this.isInitialized && !forceRetry && !this.isFallbackMode) {
      console.log('[HandGestureService] Model already initialized and ready.');
      return true;
    }
    if (this.isLoading && !forceRetry) {
      console.log('[HandGestureService] Model initialization currently in progress...');
      return false;
    }

    this.isLoading = true;
    this.initError = null;

    // Run OpenGL / WebGL diagnostics check
    const glDiag = this.getOpenGLDiagnostics();
    console.log('[HandGestureService] WebGL/OpenGL Diagnostics:', glDiag);

    const wasmCdns = [
      '/wasm',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0/wasm',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
      'https://unpkg.com/@mediapipe/tasks-vision@1.0.0/wasm',
      'https://unpkg.com/@mediapipe/tasks-vision/wasm',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
    ];

    const modelAssets = [
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.0/hand_landmarker.task',
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/hand_landmarker.task',
    ];

    let lastError: unknown = null;

    for (const cdnUrl of wasmCdns) {
      try {
        console.log(`[HandGestureService] Loading WASM tasks from: ${cdnUrl}`);
        const vision = await FilesetResolver.forVisionTasks(cdnUrl);

        for (const modelPath of modelAssets) {
          // Attempt GPU delegate first if WebGL2 is available
          if (glDiag.webgl2Supported) {
            try {
              console.log(`[HandGestureService] Attempting GPU delegate (WebGL2) with model: ${modelPath}`);
              this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                  modelAssetPath: modelPath,
                  delegate: 'GPU',
                },
                runningMode: 'VIDEO',
                numHands: 2,
                minHandDetectionConfidence: 0.25,
                minHandPresenceConfidence: 0.25,
                minTrackingConfidence: 0.25,
              });
              console.log('[HandGestureService] SUCCESS: HandLandmarker initialized with GPU delegate.');
              this.isInitialized = true;
              this.isLoading = false;
              this.isFallbackMode = false;
              this.activeDelegate = 'GPU';
              return true;
            } catch (gpuErr) {
              console.warn('[HandGestureService] GPU delegate failed, falling back to CPU:', gpuErr);
            }
          }

          // Attempt CPU delegate fallback
          try {
            console.log(`[HandGestureService] Attempting CPU delegate with model: ${modelPath}`);
            this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: modelPath,
                delegate: 'CPU',
              },
              runningMode: 'VIDEO',
              numHands: 2,
              minHandDetectionConfidence: 0.25,
              minHandPresenceConfidence: 0.25,
              minTrackingConfidence: 0.25,
            });
            console.log('[HandGestureService] SUCCESS: HandLandmarker initialized with CPU delegate.');
            this.isInitialized = true;
            this.isLoading = false;
            this.isFallbackMode = false;
            this.activeDelegate = 'CPU';
            return true;
          } catch (cpuErr) {
            console.warn('[HandGestureService] CPU delegate failed for model path:', modelPath, cpuErr);
            lastError = cpuErr;
          }
        }
      } catch (cdnErr) {
        console.warn(`[HandGestureService] WASM endpoint failed (${cdnUrl}):`, cdnErr);
        lastError = cdnErr;
      }
    }

    console.warn('[HandGestureService] Could not load MediaPipe WASM. Activating Computer Vision Gesture Fallback Mode.', lastError);
    this.isFallbackMode = true;
    this.isInitialized = true;
    this.isLoading = false;
    this.activeDelegate = 'FALLBACK';
    this.initError = 'Remote model CDN unavailable. Running in Adaptive Computer Vision Fallback Mode.';
    return true;
  }

  public getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      isFallbackMode: this.isFallbackMode,
      activeDelegate: this.activeDelegate,
      openGL: this.getOpenGLDiagnostics(),
      calibration: this.calibrationData,
      error: this.initError,
    };
  }

  public setGestureCallback(cb: (state: GestureState, landmarks: NormalizedLandmark[][] | null) => void) {
    this.onGestureCallback = cb;
  }

  /**
   * Computer Vision Fallback Engine: Skin Blob & Motion Centroid Tracking
   * Generates synthetic 21 hand landmarks tracking skin contours & lighting baseline.
   */
  private processFallbackFrame(videoElement: HTMLVideoElement, settings: GestureSettings): GestureState {
    const w = 120;
    const h = 90;
    const ctx = this.getOffscreenContext(w, h);

    if (!ctx) {
      return this.getEmptyState();
    }

    ctx.drawImage(videoElement, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let sumX = 0;
    let sumY = 0;
    let skinPixelCount = 0;
    let minY = h;
    let maxY = 0;

    // Use calibrated parameters if available, else default skin bounds
    const cal = this.calibrationData;
    const targetCb = cal ? cal.avgSkinCb : 105;
    const targetCr = cal ? cal.avgSkinCr : 152;
    const tol = cal ? 28 * cal.sensitivityMultiplier : 25;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Chrominance
        const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
        const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

        const isSkinYCbCr = Math.abs(cb - targetCb) < tol && Math.abs(cr - targetCr) < tol;
        const isSkinRGB = r > 45 && g > 25 && b > 15 && r > g && r > b && (r - Math.min(g, b)) > 15;

        if (isSkinYCbCr || isSkinRGB) {
          sumX += x;
          sumY += y;
          skinPixelCount++;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (skinPixelCount < 30) {
      const emptyState = this.getEmptyState();
      if (this.onGestureCallback) this.onGestureCallback(emptyState, null);
      return emptyState;
    }

    const rawX = sumX / skinPixelCount / w;
    const rawY = sumY / skinPixelCount / h;

    const normX = settings.mirrorVideo ? 1 - rawX : rawX;
    const normY = rawY;

    const alpha = settings.pointerSmoothing || 0.35;
    this.smoothedX = this.smoothedX * (1 - alpha) + normX * alpha;
    this.smoothedY = this.smoothedY * (1 - alpha) + normY * alpha;

    // Generate 21 synthetic landmarks anchored around smoothed center
    const cx = settings.mirrorVideo ? 1 - this.smoothedX : this.smoothedX;
    const cy = this.smoothedY;
    const scale = 0.15;

    const syntheticLandmarks: NormalizedLandmark[] = [
      { x: cx, y: cy + scale * 0.8, z: 0, visibility: 1 }, // 0 Wrist
      { x: cx - scale * 0.3, y: cy + scale * 0.6, z: 0, visibility: 1 }, // 1
      { x: cx - scale * 0.5, y: cy + scale * 0.3, z: 0, visibility: 1 }, // 2
      { x: cx - scale * 0.6, y: cy, z: 0, visibility: 1 }, // 3
      { x: cx - scale * 0.5, y: cy - scale * 0.3, z: 0, visibility: 1 }, // 4 Thumb Tip
      { x: cx - scale * 0.2, y: cy + scale * 0.2, z: 0, visibility: 1 }, // 5 Index Base
      { x: cx - scale * 0.2, y: cy - scale * 0.2, z: 0, visibility: 1 }, // 6
      { x: cx - scale * 0.2, y: cy - scale * 0.5, z: 0, visibility: 1 }, // 7
      { x: cx - scale * 0.2, y: cy - scale * 0.8, z: 0, visibility: 1 }, // 8 Index Tip
      { x: cx, y: cy + scale * 0.2, z: 0, visibility: 1 }, // 9 Middle Base
      { x: cx, y: cy - scale * 0.2, z: 0, visibility: 1 }, // 10
      { x: cx, y: cy - scale * 0.5, z: 0, visibility: 1 }, // 11
      { x: cx, y: cy - scale * 0.85, z: 0, visibility: 1 }, // 12 Middle Tip
      { x: cx + scale * 0.2, y: cy + scale * 0.2, z: 0, visibility: 1 }, // 13 Ring Base
      { x: cx + scale * 0.2, y: cy - scale * 0.2, z: 0, visibility: 1 }, // 14
      { x: cx + scale * 0.2, y: cy - scale * 0.5, z: 0, visibility: 1 }, // 15
      { x: cx + scale * 0.2, y: cy - scale * 0.75, z: 0, visibility: 1 }, // 16 Ring Tip
      { x: cx + scale * 0.4, y: cy + scale * 0.3, z: 0, visibility: 1 }, // 17 Pinky Base
      { x: cx + scale * 0.4, y: cy, z: 0, visibility: 1 }, // 18
      { x: cx + scale * 0.4, y: cy - scale * 0.3, z: 0, visibility: 1 }, // 19
      { x: cx + scale * 0.4, y: cy - scale * 0.6, z: 0, visibility: 1 }, // 20 Pinky Tip
    ];

    const state: GestureState = {
      currentGesture: 'POINTING',
      confidence: Math.min(0.95, skinPixelCount / 300),
      pointerX: this.smoothedX,
      pointerY: this.smoothedY,
      isPinching: false,
      pinchDistance: 0.2,
      handDetected: true,
      handSide: 'Right',
    };

    if (this.onGestureCallback) {
      this.onGestureCallback(state, [syntheticLandmarks]);
    }

    return state;
  }

  private getEmptyState(): GestureState {
    return {
      currentGesture: 'NONE',
      confidence: 0,
      pointerX: this.smoothedX,
      pointerY: this.smoothedY,
      isPinching: false,
      pinchDistance: 1,
      handDetected: false,
      handSide: 'Unknown',
    };
  }

  /**
   * Processes a single video frame continuously from requestAnimationFrame loop.
   */
  public processVideoFrame(
    videoElement: HTMLVideoElement,
    timestampMs: number,
    settings: GestureSettings
  ): GestureState | null {
    if (!this.isInitialized || this.isCalibrating) {
      return null;
    }

    if (videoElement.readyState < 2 || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }

    const now = performance.now();

    // 1. Computer Vision Fallback Mode
    if (this.isFallbackMode || !this.handLandmarker) {
      return this.processFallbackFrame(videoElement, settings);
    }

    // Ensure timestamp is integer and strictly greater than lastTimestampMs
    let validTimestamp = Math.floor(timestampMs);
    if (validTimestamp <= this.lastTimestampMs) {
      validTimestamp = this.lastTimestampMs + 1;
    }
    this.lastTimestampMs = validTimestamp;

    // 2. Process frame with MediaPipe HandLandmarker
    try {
      const result = this.handLandmarker.detectForVideo(videoElement, validTimestamp);

      // Check if hands were detected
      if (!result.landmarks || result.landmarks.length === 0) {
        // Run fallback computer vision detection if MediaPipe temporarily misses the hand
        return this.processFallbackFrame(videoElement, settings);
      }

      // Hand detected! Extract key landmarks (21 points)
      const numHands = result.landmarks.length;
      const landmarks = result.landmarks[0]; // Primary hand
      const handedness = result.handednesses?.[0]?.[0]?.categoryName as 'Left' | 'Right' | undefined;
      const confidenceScore = result.handednesses?.[0]?.[0]?.score || 0.9;

      // Key points
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];

      // Joint bases for finger extension checks
      const indexPip = landmarks[6];
      const middlePip = landmarks[10];
      const ringPip = landmarks[14];
      const pinkyPip = landmarks[18];
      const thumbMcp = landmarks[2];

      // Screen pointer coordinates (Mirrored if configured)
      let rawX = indexTip.x;
      if (settings.mirrorVideo) {
        rawX = 1 - rawX; // Mirror horizontal coordinate
      }
      const rawY = indexTip.y;

      // Apply Adaptive Velocity-Based Smoothing (snappy fast moves, rock-solid stationary holding)
      const dxMove = rawX - this.smoothedX;
      const dyMove = rawY - this.smoothedY;
      const distMove = Math.sqrt(dxMove * dxMove + dyMove * dyMove);

      const baseAlpha = Math.max(0.05, Math.min(0.9, settings.pointerSmoothing || 0.35));
      const dynamicAlpha = Math.min(0.88, Math.max(0.12, baseAlpha + distMove * 2.8));

      this.smoothedX = this.smoothedX + dxMove * dynamicAlpha;
      this.smoothedY = this.smoothedY + dyMove * dynamicAlpha;

      // Calculate Pinch Distance (Thumb Tip to Index Tip in 3D Euclidean space)
      const dxPinch = indexTip.x - thumbTip.x;
      const dyPinch = indexTip.y - thumbTip.y;
      const dzPinch = (indexTip.z || 0) - (thumbTip.z || 0);
      const pinchDist = Math.sqrt(dxPinch * dxPinch + dyPinch * dyPinch + dzPinch * dzPinch);
      const isPinching = pinchDist < 0.08;

      // Distance helper function
      const dist = (p1: NormalizedLandmark, p2: NormalizedLandmark) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
      };

      // Finger Extension Checks
      const indexExtended = dist(indexTip, wrist) > dist(indexPip, wrist) * 1.10;
      const middleExtended = dist(middleTip, wrist) > dist(middlePip, wrist) * 1.10;
      const ringExtended = dist(ringTip, wrist) > dist(ringPip, wrist) * 1.10;
      const pinkyExtended = dist(pinkyTip, wrist) > dist(pinkyPip, wrist) * 1.10;
      const thumbExtended = dist(thumbTip, pinkyPip) > dist(thumbMcp, pinkyPip) * 1.12;

      const extendedCount =
        (indexExtended ? 1 : 0) +
        (middleExtended ? 1 : 0) +
        (ringExtended ? 1 : 0) +
        (pinkyExtended ? 1 : 0) +
        (thumbExtended ? 1 : 0);

      // Determine Gesture Type
      let detectedGesture: GestureType = 'NONE';

      // 1. Dynamic Swipe Gesture Detection via Hand Motion Velocity
      const currentHandPos = { x: rawX, y: rawY, time: now };
      this.positionHistory.push(currentHandPos);

      // Retain last 350ms of movement trajectory
      this.positionHistory = this.positionHistory.filter((p) => now - p.time <= 350);

      const cooldown = settings.gestureCooldownMs || 500;
      let isSwipeDetected = false;

      if (this.positionHistory.length >= 4) {
        const oldest = this.positionHistory[0];
        const newest = currentHandPos;
        const timeDiff = (newest.time - oldest.time) / 1000;
        const deltaX = newest.x - oldest.x;
        const deltaY = newest.y - oldest.y;

        const threshX = settings.sensitivity === 'high' ? 0.15 : settings.sensitivity === 'low' ? 0.28 : 0.20;
        const threshY = settings.sensitivity === 'high' ? 0.18 : settings.sensitivity === 'low' ? 0.32 : 0.24;

        if (timeDiff > 0.08 && timeDiff < 0.35) {
          if (Math.abs(deltaX) > threshX && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
            detectedGesture = deltaX > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
            isSwipeDetected = true;
            this.positionHistory = [];
          } else if (Math.abs(deltaY) > threshY && Math.abs(deltaY) > Math.abs(deltaX) * 1.3) {
            detectedGesture = deltaY > 0 ? 'SWIPE_DOWN' : 'SWIPE_UP';
            isSwipeDetected = true;
            this.positionHistory = [];
          }
        }
      }

      // 2. Static Posture Recognition if no dynamic swipe triggered
      if (!isSwipeDetected) {
        if (isPinching) {
          detectedGesture = 'PINCH';
        } else if (extendedCount >= 4) {
          detectedGesture = 'OPEN_PALM';
        } else if (extendedCount === 0 || (extendedCount === 1 && !indexExtended && !thumbExtended)) {
          detectedGesture = 'FIST';
        } else if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
          detectedGesture = 'PEACE';
        } else if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended && thumbTip.y < wrist.y) {
          detectedGesture = 'THUMBS_UP';
        } else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
          detectedGesture = 'POINTING';
        } else {
          detectedGesture = 'POINTING';
        }
      }

      // 3. Apply per-gesture cooldown for all action gestures
      if (HandGestureService.ACTION_GESTURES.has(detectedGesture)) {
        const lastFired = this.lastGestureFireTimes.get(detectedGesture) || 0;
        if (now - lastFired < cooldown) {
          // Cooldown active — downgrade to POINTING so consumers don't see repeat fires
          detectedGesture = 'POINTING';
        } else {
          this.lastGestureFireTimes.set(detectedGesture, now);
        }
      }

      // Detailed Console Diagnostics
      if (detectedGesture !== this.lastDetectedGesture || now - this.lastLogTime > 2000) {
        console.log(
          `[HandGestureService] Active Tracking | Hands: ${numHands} (${handedness || 'Hand'}) | Confidence: ${(confidenceScore * 100).toFixed(1)}% | Gesture: ${detectedGesture} | Pointer: (${this.smoothedX.toFixed(2)}, ${this.smoothedY.toFixed(2)})`
        );
        this.lastLogTime = now;
        this.lastDetectedGesture = detectedGesture;
      }

      const state: GestureState = {
        currentGesture: detectedGesture,
        confidence: confidenceScore,
        pointerX: this.smoothedX,
        pointerY: this.smoothedY,
        isPinching,
        pinchDistance: pinchDist,
        handDetected: true,
        handSide: handedness || 'Right',
      };

      if (this.onGestureCallback) {
        this.onGestureCallback(state, result.landmarks);
      }

      return state;
    } catch (err) {
      console.error('[HandGestureService] Error in processVideoFrame during detection:', err);
      return this.processFallbackFrame(videoElement, settings);
    }
  }

  public destroy() {
    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch (err) {
        console.warn('[HandGestureService] Error closing HandLandmarker:', err);
      }
      this.handLandmarker = null;
    }
    this.isInitialized = false;
    this.isLoading = false;
  }
}

export const handGestureService = new HandGestureService();


