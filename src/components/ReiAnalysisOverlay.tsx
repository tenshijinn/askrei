import React, { useEffect, useState } from 'react';
import { Loader2, Check, AlertCircle, Upload, FileAudio, Brain, Sparkles } from 'lucide-react';
import reiLogo from '@/assets/rei-logo.png';

export type AnalysisStage =
  | 'uploading'
  | 'transcribing'
  | 'analyzing'
  | 'categorizing'
  | 'done'
  | 'error'
  | null;

interface Props {
  stage: AnalysisStage;
  uploadPercent?: number;
  errorMessage?: string | null;
  onClose?: () => void;
}

const STAGES: { key: Exclude<AnalysisStage, null | 'done' | 'error'>; label: string; icon: any }[] = [
  { key: 'uploading', label: 'Uploading audio', icon: Upload },
  { key: 'transcribing', label: 'Transcribing your voice', icon: FileAudio },
  { key: 'analyzing', label: 'Analyzing profile with Rei AI', icon: Brain },
  { key: 'categorizing', label: 'Categorizing skills & experience', icon: Sparkles },
];

const THINKING_LINES: Record<string, string[]> = {
  uploading: ['encrypting payload…', 'streaming to secure storage…', 'verifying integrity…'],
  transcribing: ['parsing voice patterns…', 'aligning phonemes…', 'detecting cadence…'],
  analyzing: ['scoring contribution signals…', 'matching to skill clusters…', 'cross-referencing experience…', 'weighing impact statements…'],
  categorizing: ['mapping to 14 skill clusters…', 'tagging role affinities…', 'finalizing profile vector…'],
};

export const ReiAnalysisOverlay: React.FC<Props> = ({ stage, uploadPercent = 0, errorMessage, onClose }) => {
  const [thinkingIdx, setThinkingIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setThinkingIdx((i) => i + 1), 1800);
    return () => clearInterval(t);
  }, []);

  if (!stage) return null;

  const isError = stage === 'error';
  const isDone = stage === 'done';

  const activeIdx = isDone ? STAGES.length : STAGES.findIndex((s) => s.key === stage);
  const overallPercent = isDone
    ? 100
    : Math.min(
        100,
        activeIdx * 25 +
          (stage === 'uploading' ? Math.min(25, (uploadPercent / 100) * 25) : activeIdx >= 0 ? 12 : 0),
      );

  const pool = stage in THINKING_LINES ? THINKING_LINES[stage as keyof typeof THINKING_LINES] : [];
  const thinkingLine = pool.length ? pool[thinkingIdx % pool.length] : '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        background: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden relative"
        style={{
          background: '#0f0f0f',
          border: '0.5px solid hsla(0,0%,100%,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px hsla(0,0%,100%,0.04)',
        }}
      >
        {/* Top thin progress bar */}
        <div className="h-0.5 w-full" style={{ background: 'hsla(0,0%,100%,0.06)' }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${overallPercent}%`,
              background: isError ? '#ef4444' : '#ed565a',
            }}
          />
        </div>

        <div className="p-7">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative">
              <img src={reiLogo} alt="Rei" className="h-10 w-auto" style={{ opacity: 0.95 }} />
              {!isDone && !isError && (
                <div
                  className="absolute -inset-1 rounded-full opacity-40 animate-ping"
                  style={{ background: 'radial-gradient(circle, #ed565a 0%, transparent 70%)' }}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#f0ede8', fontWeight: 500, letterSpacing: '-0.01em' }}>
                {isError ? 'Analysis interrupted' : isDone ? 'Profile ready' : 'Rei is analyzing you'}
              </div>
              <div style={{ fontSize: '11px', color: '#5c5a57', marginTop: '2px', fontFamily: "'SF Mono', Consolas, monospace" }}>
                {isError ? 'something went wrong' : isDone ? 'all systems nominal' : 'high-tech contributor profile'}
              </div>
            </div>
          </div>

          {/* Error state */}
          {isError && (
            <div
              className="rounded-lg p-4 flex items-start gap-3"
              style={{ background: 'rgba(239,68,68,0.08)', border: '0.5px solid rgba(239,68,68,0.3)' }}
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#ef4444' }} />
              <div style={{ fontSize: '12px', color: '#fca5a5', lineHeight: 1.5 }}>
                {errorMessage || 'Failed to submit registration. Please try again.'}
              </div>
            </div>
          )}

          {/* Stages */}
          {!isError && (
            <div className="space-y-3">
              {STAGES.map((s, idx) => {
                const isActive = !isDone && idx === activeIdx;
                const isComplete = isDone || idx < activeIdx;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: isComplete
                          ? 'rgba(232,196,184,0.12)'
                          : isActive
                            ? 'rgba(237,86,90,0.15)'
                            : 'hsla(0,0%,100%,0.04)',
                        border: `0.5px solid ${isComplete ? 'rgba(232,196,184,0.3)' : isActive ? 'rgba(237,86,90,0.4)' : 'hsla(0,0%,100%,0.08)'}`,
                      }}
                    >
                      {isComplete ? (
                        <Check className="h-3.5 w-3.5" style={{ color: '#e8c4b8' }} />
                      ) : isActive ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: '#ed565a' }} />
                      ) : (
                        <Icon className="h-3.5 w-3.5" style={{ color: '#5c5a57' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div
                        style={{
                          fontSize: '12px',
                          color: isActive ? '#f0ede8' : isComplete ? '#a09e9a' : '#5c5a57',
                          fontWeight: isActive ? 500 : 400,
                          letterSpacing: '-0.01em',
                          transition: 'color 0.3s',
                        }}
                      >
                        {s.label}
                      </div>
                      {isActive && (
                        <>
                          {s.key === 'uploading' && (
                            <div
                              className="mt-2 h-1 rounded-full overflow-hidden"
                              style={{ background: 'hsla(0,0%,100%,0.06)' }}
                            >
                              <div
                                className="h-full transition-all duration-200"
                                style={{ width: `${uploadPercent}%`, background: '#ed565a' }}
                              />
                            </div>
                          )}
                          {s.key !== 'uploading' && (
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <div className="flex gap-0.5">
                                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#ed565a', animationDelay: '0ms' }} />
                                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#ed565a', animationDelay: '200ms' }} />
                                <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: '#ed565a', animationDelay: '400ms' }} />
                              </div>
                            </div>
                          )}
                          {thinkingLine && (
                            <div
                              key={thinkingLine}
                              style={{
                                fontSize: '10px',
                                color: '#5c5a57',
                                marginTop: '6px',
                                fontFamily: "'SF Mono', Consolas, monospace",
                                animation: 'fadeIn 0.4s ease-out',
                              }}
                            >
                              › {thinkingLine}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '0.5px solid hsla(0,0%,100%,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#5c5a57', fontFamily: "'SF Mono', Consolas, monospace", letterSpacing: '0.04em' }}>
              {isError ? 'ERROR' : isDone ? 'COMPLETE' : 'PROCESSING'} · {Math.round(overallPercent)}%
            </div>
            {(isError || isDone) && onClose && (
              <button
                onClick={onClose}
                style={{
                  fontSize: '11px',
                  color: '#f0ede8',
                  background: 'hsla(0,0%,100%,0.06)',
                  border: '0.5px solid hsla(0,0%,100%,0.1)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontFamily: "'SF Mono', Consolas, monospace",
                }}
              >
                {isError ? 'Close' : 'Continue'}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ReiAnalysisOverlay;
