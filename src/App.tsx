import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HandCursor } from './components/HandCursor';
import { CameraOverlay } from './components/CameraOverlay';
import { GestureGuideModal } from './components/GestureGuideModal';

import { OverviewTab } from './components/dashboard/OverviewTab';
import { AnalyticsTab } from './components/dashboard/AnalyticsTab';
import { SlidesTab } from './components/dashboard/SlidesTab';
import { MediaTab } from './components/dashboard/MediaTab';
import { SettingsTab } from './components/dashboard/SettingsTab';

import { TabType, GestureState, GestureSettings, VoiceAssistantStatus, ThreatLevel, VoiceLogEntry } from './types';
import { soundEffects } from './utils/audioFeedback';
import { voiceAssistantService, VoiceCommandResult } from './services/voiceAssistantService';

const TAB_ORDER: TabType[] = ['overview', 'analytics', 'slides', 'media', 'settings'];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Voice Assistant State
  const [voiceStatus, setVoiceStatus] = useState<VoiceAssistantStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('JARVIS x ULTRON Operations Commander initialized.');
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('NORMAL');
  const [logs, setLogs] = useState<VoiceLogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      sender: 'SYSTEM',
      message: 'Project Antigravity OS core online. Arc Reactor telemetry synced at 99.4% output.',
      type: 'info',
    },
  ]);

  const [settings, setSettings] = useState<GestureSettings>({
    isEnabled: true,
    sensitivity: 'medium',
    pointerSmoothing: 0.35,
    showWebcamOverlay: true,
    showSkeleton: true,
    enableSound: true,
    cameraDeviceId: '',
    mirrorVideo: true,
    gestureCooldownMs: 550,
    autoClickOnHover: true,
    hoverDwellTimeMs: 1200,
  });

  const [gestureState, setGestureState] = useState<GestureState>({
    currentGesture: 'NONE',
    confidence: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    isPinching: false,
    pinchDistance: 1,
    handDetected: false,
    handSide: 'Unknown',
  });

  // Add Log Entry Helper
  const addLog = useCallback((sender: VoiceLogEntry['sender'], message: string, type: VoiceLogEntry['type'] = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        sender,
        message,
        type,
      },
    ]);
  }, []);

  // Voice Assistant Service Initialization
  useEffect(() => {
    voiceAssistantService.setCallbacks(
      (status, currentTranscript, currentResponse) => {
        setVoiceStatus(status);
        if (currentTranscript) setTranscript(currentTranscript);
        if (currentResponse) setLastResponse(currentResponse);
      },
      (result: VoiceCommandResult) => {
        addLog('USER', result.command);
        addLog('JARVIS', result.response);

        if (result.navTarget) {
          setActiveTab(result.navTarget);
        }
        if (result.threatTarget) {
          setThreatLevel(result.threatTarget);
        }
      }
    );
  }, [addLog]);

  // Sync sound setting
  useEffect(() => {
    soundEffects.setEnabled(settings.enableSound);
  }, [settings.enableSound]);

  const updateSettings = useCallback((newSettings: Partial<GestureSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Handle Tab Navigation with Swipe Gestures
  const handleNextTab = useCallback(() => {
    setActiveTab((prev) => {
      const idx = TAB_ORDER.indexOf(prev);
      const nextIdx = (idx + 1) % TAB_ORDER.length;
      soundEffects.playSwipe('left');
      return TAB_ORDER[nextIdx];
    });
  }, []);

  const handlePrevTab = useCallback(() => {
    setActiveTab((prev) => {
      const idx = TAB_ORDER.indexOf(prev);
      const prevIdx = (idx - 1 + TAB_ORDER.length) % TAB_ORDER.length;
      soundEffects.playSwipe('right');
      return TAB_ORDER[prevIdx];
    });
  }, []);

  // Global Gesture Reaction Loop
  const handleGestureStateChange = useCallback(
    (newState: GestureState) => {
      setGestureState((prev) => {
        const isSameState =
          prev.handDetected === newState.handDetected &&
          prev.currentGesture === newState.currentGesture &&
          prev.isPinching === newState.isPinching &&
          Math.abs(prev.pointerX - newState.pointerX) < 0.0015 &&
          Math.abs(prev.pointerY - newState.pointerY) < 0.0015;

        return isSameState ? prev : newState;
      });

      // Reaction on new discrete gesture
      if (newState.handDetected) {
        const gesture = newState.currentGesture;

        if (gesture === 'SWIPE_LEFT') {
          handleNextTab();
          addLog('GESTURE', 'Swipe Left: Next Tab Navigation');
        } else if (gesture === 'SWIPE_RIGHT') {
          handlePrevTab();
          addLog('GESTURE', 'Swipe Right: Prev Tab Navigation');
        } else if (gesture === 'PINCH') {
          soundEffects.playClick();
        }
      }
    },
    [handleNextTab, handlePrevTab, addLog]
  );

  // Keyboard navigation & Push-to-Talk (Spacebar) listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        voiceAssistantService.toggleListening();
      } else if (e.key === 'ArrowRight') {
        handleNextTab();
      } else if (e.key === 'ArrowLeft') {
        handlePrevTab();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextTab, handlePrevTab]);

  return (
    <div className="min-h-screen bg-space-dark text-slate-100 selection:bg-cyan-500 selection:text-black pb-24 font-sans">
      {/* Top HUD Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          soundEffects.playClick();
        }}
        gestureState={gestureState}
        settings={settings}
        voiceStatus={voiceStatus}
        threatLevel={threatLevel}
        onToggleVoiceMic={() => voiceAssistantService.toggleListening()}
        onUpdateSettings={updateSettings}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <OverviewTab
            status={voiceStatus}
            threatLevel={threatLevel}
            transcript={transcript}
            lastResponse={lastResponse}
            logs={logs}
            onToggleMic={() => voiceAssistantService.toggleListening()}
            onThreatChange={(level) => {
              setThreatLevel(level);
              addLog('SYSTEM', `Threat status override set to ${level}`);
              voiceAssistantService.speak(`Threat level updated to ${level}`);
            }}
            onTriggerPulseScan={() => {
              addLog('SYSTEM', 'Pulse scan executed across all neural grid nodes.');
              voiceAssistantService.speak('Pulse scan complete. All neural node frequencies locked and stable.');
            }}
            onClearLogs={() => setLogs([])}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'slides' && <SlidesTab />}
        {activeTab === 'media' && <MediaTab gestureState={gestureState} />}
        {activeTab === 'settings' && (
          <SettingsTab settings={settings} onUpdateSettings={updateSettings} />
        )}
      </main>

      {/* Floating Hand Pointer Cursor Dot */}
      <HandCursor
        gestureState={gestureState}
        isEnabled={settings.isEnabled}
        autoClickOnHover={settings.autoClickOnHover}
        hoverDwellTimeMs={settings.hoverDwellTimeMs}
        onHoverClick={() => soundEffects.playClick()}
      />

      {/* Docked Webcam Feed & Hand Skeleton Overlay Canvas */}
      <CameraOverlay
        settings={settings}
        onUpdateSettings={updateSettings}
        onGestureStateChange={handleGestureStateChange}
      />

      {/* Gesture Cheat Sheet Modal */}
      <GestureGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onEnableGesture={() => updateSettings({ isEnabled: true })}
        isGestureEnabled={settings.isEnabled}
      />
    </div>
  );
}

