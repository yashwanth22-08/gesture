import React, { useRef, useEffect } from 'react';
import { Terminal, ShieldAlert, Cpu, Sparkles, Hand } from 'lucide-react';
import { VoiceLogEntry } from '../../types';

interface VoiceConsoleLogProps {
  logs: VoiceLogEntry[];
  onClearLogs: () => void;
}

export const VoiceConsoleLog: React.FC<VoiceConsoleLogProps> = ({ logs, onClearLogs }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 font-mono text-xs flex flex-col h-64">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 shrink-0">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>TACTICAL CONSOLE LOGS</span>
        </div>
        <button
          onClick={onClearLogs}
          className="text-[10px] text-slate-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
        >
          CLEAR TERMINAL
        </button>
      </div>

      {/* Log Feed */}
      <div ref={scrollRef} className="overflow-y-auto space-y-2 pr-2 flex-1 scrollbar-thin scrollbar-thumb-cyan-500/30">
        {logs.length === 0 ? (
          <div className="text-slate-500 italic text-center py-8">No terminal logs recorded yet...</div>
        ) : (
          logs.map((log) => {
            const isUser = log.sender === 'USER';
            const isJarvis = log.sender === 'JARVIS';
            const isGesture = log.sender === 'GESTURE';

            return (
              <div
                key={log.id}
                className={`p-2 rounded-lg border text-[11px] leading-relaxed transition-all ${
                  isUser
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200'
                    : isJarvis
                    ? 'bg-slate-950/80 border-slate-800 text-slate-200'
                    : isGesture
                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                    : 'bg-red-950/40 border-red-500/30 text-red-200'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    {isUser ? (
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                    ) : isJarvis ? (
                      <Cpu className="w-3 h-3 text-blue-400" />
                    ) : isGesture ? (
                      <Hand className="w-3 h-3 text-amber-400" />
                    ) : (
                      <ShieldAlert className="w-3 h-3 text-red-400" />
                    )}
                    <span>[{log.sender}]</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                </div>
                <div>{log.message}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
