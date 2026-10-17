// Voice Assistant Engine for Project Antigravity
// Supports Browser Web Speech Recognition & Speech Synthesis with JARVIS x ULTRON persona

import { ThreatLevel, VoiceAssistantStatus, TabType } from '../types';

export interface VoiceCommandResult {
  command: string;
  response: string;
  navTarget?: TabType;
  threatTarget?: ThreatLevel;
  actionType?: 'NAVIGATE' | 'THREAT_CHANGE' | 'DIAGNOSTIC' | 'PULSE_SCAN' | 'SHIELD_TOGGLE' | 'AUDIO_TOGGLE' | 'UNKNOWN';
}

type StatusCallback = (status: VoiceAssistantStatus, transcript: string, response: string) => void;
type CommandCallback = (result: VoiceCommandResult) => void;

class VoiceAssistantService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private status: VoiceAssistantStatus = 'idle';
  private speechPitch: number = 0.95; // Slightly deeper JARVIS tone
  private speechRate: number = 1.05;  // Crisp tactical cadence
  private volume: number = 1.0;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  private onStatusChange: StatusCallback | null = null;
  private onCommandExecuted: CommandCallback | null = null;

  constructor() {
    this.initRecognition();
    this.initVoices();
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer natural English male voices (e.g. Google UK English Male, Daniel, Alex, or Microsoft George)
        const preferred = voices.find(
          v => v.name.includes('Daniel') || 
               v.name.includes('Google UK English Male') || 
               v.name.includes('George') || 
               v.name.includes('English Male')
        ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        
        if (preferred) {
          this.selectedVoice = preferred;
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser environment.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.status = 'listening';
      this.notifyStatus('', '');
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      this.notifyStatus(currentText, '');

      if (finalTranscript) {
        this.processCommand(finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      this.status = 'idle';
      this.notifyStatus('', 'Error recognizing input. Systems active.');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.status === 'listening') {
        this.status = 'idle';
        this.notifyStatus('', '');
      }
    };
  }

  public setCallbacks(onStatusChange: StatusCallback, onCommandExecuted: CommandCallback) {
    this.onStatusChange = onStatusChange;
    this.onCommandExecuted = onCommandExecuted;
  }

  private notifyStatus(transcript: string, response: string) {
    if (this.onStatusChange) {
      this.onStatusChange(this.status, transcript, response);
    }
  }

  public startListening() {
    if (!this.recognition) {
      this.speak("Speech recognition is unavailable in this browser environment, Commander.");
      return;
    }

    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }

    try {
      this.recognition.start();
    } catch (e) {
      // Recognition may already be active
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  public processCommand(rawInput: string): VoiceCommandResult {
    const input = rawInput.toLowerCase().trim();
    this.status = 'thinking';
    this.notifyStatus(rawInput, 'Processing tactical query...');

    let response = '';
    let navTarget: TabType | undefined;
    let threatTarget: ThreatLevel | undefined;
    let actionType: VoiceCommandResult['actionType'] = 'UNKNOWN';

    // 1. Navigation Commands
    if (input.includes('overview') || input.includes('main dashboard') || input.includes('home')) {
      navTarget = 'overview';
      actionType = 'NAVIGATE';
      response = "Acknowledged. Rerouting visual terminal to Tactical Overview.";
    } else if (input.includes('analytics') || input.includes('metrics') || input.includes('chart')) {
      navTarget = 'analytics';
      actionType = 'NAVIGATE';
      response = "Understood. Accessing neural analytics matrix and performance telemetry.";
    } else if (input.includes('slide') || input.includes('presentation') || input.includes('briefing')) {
      navTarget = 'slides';
      actionType = 'NAVIGATE';
      response = "Initializing tactical briefing slide deck. Systems prepared.";
    } else if (input.includes('media') || input.includes('audio') || input.includes('music') || input.includes('sound')) {
      navTarget = 'media';
      actionType = 'NAVIGATE';
      response = "Opening sonic spectrum visualizer studio.";
    } else if (input.includes('setting') || input.includes('config') || input.includes('preference')) {
      navTarget = 'settings';
      actionType = 'NAVIGATE';
      response = "Displaying core engine parameters and override controls.";
    } 
    // 2. Threat Level Override Commands
    else if (input.includes('threat normal') || input.includes('level normal') || input.includes('stand down')) {
      threatTarget = 'NORMAL';
      actionType = 'THREAT_CHANGE';
      response = "Security status reset to NORMAL. All defense grids operating at baseline nominal energy.";
    } else if (input.includes('threat elevated') || input.includes('level elevated') || input.includes('yellow alert')) {
      threatTarget = 'ELEVATED';
      actionType = 'THREAT_CHANGE';
      response = "Elevating defense alert to LEVEL 2. Visual spectrum shift engaged.";
    } else if (input.includes('threat critical') || input.includes('level critical') || input.includes('red alert')) {
      threatTarget = 'CRITICAL';
      actionType = 'THREAT_CHANGE';
      response = "WARNING: Threat level elevated to CRITICAL. ULTRON defense override protocols standing by.";
    } else if (input.includes('overdrive') || input.includes('maximum power') || input.includes('threat overdrive')) {
      threatTarget = 'OVERDRIVE';
      actionType = 'THREAT_CHANGE';
      response = "OVERDRIVE MODE ENGAGED. Arc Reactor output pushed to 140% capacity.";
    }
    // 3. System Diagnostic & Pulse Scan
    else if (input.includes('scan') || input.includes('pulse') || input.includes('radar')) {
      actionType = 'PULSE_SCAN';
      response = "Pulse scan initiated across all neural grid nodes. Telemetry synced.";
    } else if (input.includes('status') || input.includes('diagnostic') || input.includes('health') || input.includes('jarvis')) {
      actionType = 'DIAGNOSTIC';
      response = "All systems online, Commander. Arc Reactor telemetry stable at 99.4% resonance.";
    }
    // 4. Default AI Response Fallback
    else {
      response = `Command logged: "${rawInput}". Antigravity engine executing tactical response.`;
    }

    const result: VoiceCommandResult = {
      command: rawInput,
      response,
      navTarget,
      threatTarget,
      actionType,
    };

    if (this.onCommandExecuted) {
      this.onCommandExecuted(result);
    }

    this.speak(response);
    return result;
  }

  public speak(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop current speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = this.speechPitch;
    utterance.rate = this.speechRate;
    utterance.volume = this.volume;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.status = 'speaking';
      this.notifyStatus(this.recognition?.transcript || '', text);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.status = 'idle';
      this.notifyStatus('', text);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.status = 'idle';
      this.notifyStatus('', text);
    };

    window.speechSynthesis.speak(utterance);
  }

  public setVoiceSettings(pitch: number, rate: number, volume: number) {
    this.speechPitch = pitch;
    this.speechRate = rate;
    this.volume = volume;
  }
}

export const voiceAssistantService = new VoiceAssistantService();
