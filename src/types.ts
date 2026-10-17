export type TabType = 'overview' | 'analytics' | 'slides' | 'media' | 'settings';

export type GestureType = 
  | 'NONE'
  | 'POINTING'
  | 'PINCH'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'OPEN_PALM'
  | 'FIST'
  | 'PEACE'
  | 'THUMBS_UP';

export interface GestureState {
  currentGesture: GestureType;
  confidence: number;
  pointerX: number; // 0 to 1 normalized screen space
  pointerY: number; // 0 to 1 normalized screen space
  isPinching: boolean;
  pinchDistance: number;
  handDetected: boolean;
  handSide: 'Left' | 'Right' | 'Unknown';
}

export interface GestureSettings {
  isEnabled: boolean;
  sensitivity: 'low' | 'medium' | 'high'; // affects swipe thresholds
  pointerSmoothing: number; // 0 to 1 (alpha for EMA filter)
  showWebcamOverlay: boolean;
  showSkeleton: boolean;
  enableSound: boolean;
  cameraDeviceId: string;
  mirrorVideo: boolean;
  gestureCooldownMs: number;
  autoClickOnHover: boolean;
  hoverDwellTimeMs: number;
}

export interface CalibrationData {
  isCalibrated: boolean;
  baselineBrightness: number; // 0 to 255
  lightingCondition: 'Optimal' | 'Dim Light' | 'Overexposed' | 'High Contrast';
  avgSkinR: number;
  avgSkinG: number;
  avgSkinB: number;
  avgSkinCb: number;
  avgSkinCr: number;
  sensitivityMultiplier: number;
  timestamp: number;
}

export type ThreatLevel = 'NORMAL' | 'ELEVATED' | 'CRITICAL' | 'OVERDRIVE';

export type VoiceAssistantStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'disabled';

export interface VoiceLogEntry {
  id: string;
  timestamp: string;
  sender: 'USER' | 'JARVIS' | 'SYSTEM' | 'GESTURE';
  message: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
}

export interface VoiceAssistantState {
  status: VoiceAssistantStatus;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  lastResponse: string;
  threatLevel: ThreatLevel;
  activeCommand: string;
  speechPitch: number;
  speechRate: number;
  volume: number;
  voiceName: string;
  autoResponseEnabled: boolean;
}

export interface SystemTelemetry {
  fps: number;
  cpuLoad: number;
  memoryUsage: number;
  neuralLatency: number;
  activeNodes: number;
  defenseMatrixActive: boolean;
  voiceEngineOnline: boolean;
}

export interface MetricCard {
  id: string;
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  iconName: string;
  description: string;
}

export interface ChartDataPoint {
  name: string;
  sales: number;
  visitors: number;
  conversion: number;
}

export interface SlideItem {
  id: number;
  title: string;
  category: string;
  description: string;
  bgGradient: string;
  accentColor: string;
  stats: { label: string; value: string }[];
  tags: string[];
}

export interface MediaItem {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  category: string;
}

