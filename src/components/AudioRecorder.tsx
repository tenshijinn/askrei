import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square, Play, RotateCcw, Loader2, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  maxDurationMinutes?: number;
  maxDurationSeconds?: number;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioReady,
  maxDurationMinutes,
  maxDurationSeconds,
}) => {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = maxDurationSeconds ?? (maxDurationMinutes != null ? maxDurationMinutes * 60 : 60);
  const maxDurationMs = totalSeconds * 1000;

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const audio = audioPreviewRef.current;
    if (!audio) return;
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
      if (playbackTimerRef.current) { clearInterval(playbackTimerRef.current); playbackTimerRef.current = null; }
    };
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    return () => { audio.removeEventListener('loadedmetadata', handleLoadedMetadata); audio.removeEventListener('ended', handleEnded); };
  }, [recordedBlob]);

  const requestPermissions = async () => {
    setIsInitializing(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 24000 } });
      setStream(mediaStream);
      setHasPermission(true);
      toast({ title: "Microphone Ready", description: "You can now start recording your introduction" });
    } catch (error) {
      toast({ title: "Microphone Access Denied", description: "Please allow microphone access to record your introduction", variant: "destructive" });
    } finally { setIsInitializing(false); }
  };

  const stopStream = () => { if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); } };

  const startRecording = async () => {
    if (!stream) return;
    chunksRef.current = [];
    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 });
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        if (audioPreviewRef.current) audioPreviewRef.current.src = URL.createObjectURL(blob);
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1000;
          if (newTime >= maxDurationMs) { stopRecording(); toast({ title: "Recording Complete", description: `${totalSeconds}-second limit reached.` }); }
          return newTime;
        });
      }, 1000);
    } catch (error) { toast({ title: "Recording Failed", description: "Unable to start recording. Please try again.", variant: "destructive" }); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      stopStream();
    }
  };

  const resetRecording = async () => {
    setRecordedBlob(null); setRecordingTime(0); setHasPermission(false); setIsPlaying(false); setPlaybackTime(0); setDuration(0);
    if (playbackTimerRef.current) { clearInterval(playbackTimerRef.current); playbackTimerRef.current = null; }
    if (audioPreviewRef.current) { audioPreviewRef.current.pause(); audioPreviewRef.current.src = ''; }
  };

  const togglePlayback = () => {
    const audio = audioPreviewRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause(); setIsPlaying(false);
      if (playbackTimerRef.current) { clearInterval(playbackTimerRef.current); playbackTimerRef.current = null; }
    } else {
      audio.play(); setIsPlaying(true);
      playbackTimerRef.current = setInterval(() => { if (audio.currentTime) setPlaybackTime(audio.currentTime * 1000); }, 100);
    }
  };

  const confirmRecording = () => { if (recordedBlob) onAudioReady(recordedBlob); };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="relative bg-muted/50 rounded-lg overflow-hidden h-40 flex items-center justify-center border border-border/50">
            {isRecording && (() => {
              const remainingMs = Math.max(0, maxDurationMs - recordingTime);
              const remainingSec = Math.ceil(remainingMs / 1000);
              const percentRemaining = (remainingMs / maxDurationMs) * 100;
              const tone = remainingSec <= 5 ? 'destructive' : remainingSec <= 20 ? 'warning' : 'neutral';
              const color = tone === 'destructive' ? 'hsl(var(--destructive))' : tone === 'warning' ? '#f59e0b' : 'hsl(var(--primary))';
              return (
                <div className="w-full px-6 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-10 bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-14 bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                    <div className="w-2 h-10 bg-primary animate-pulse" style={{ animationDelay: '450ms' }} />
                    <div className="w-2 h-6 bg-primary animate-pulse" style={{ animationDelay: '600ms' }} />
                  </div>
                  <div
                    className={remainingSec <= 5 ? 'animate-pulse' : ''}
                    style={{
                      fontSize: '34px',
                      fontWeight: 300,
                      letterSpacing: '-0.02em',
                      color,
                      fontVariantNumeric: 'tabular-nums',
                      lineHeight: 1,
                      transition: 'color 0.3s',
                    }}
                  >
                    {formatTime(remainingMs)}
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="relative h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 transition-all duration-1000 ease-linear"
                        style={{ width: `${percentRemaining}%`, background: color }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 text-center" style={{ fontFamily: "'SF Mono', Consolas, monospace", letterSpacing: '0.04em' }}>
                      {remainingSec <= 5 ? 'WRAPPING UP' : remainingSec <= 20 ? 'TIME REMAINING' : `${totalSeconds}S WINDOW`}
                    </div>
                  </div>
                </div>
              );
            })()}
            {!hasPermission && !recordedBlob && !isRecording && <Mic className="w-12 h-12 text-muted-foreground" />}
            {hasPermission && !recordedBlob && !isRecording && (
              <div className="flex flex-col items-center gap-2">
                <Mic className="w-10 h-10 text-muted-foreground" />
                <div className="text-xs text-muted-foreground" style={{ fontFamily: "'SF Mono', Consolas, monospace", letterSpacing: '0.04em' }}>
                  {totalSeconds}-SECOND WINDOW · STOP ANY TIME
                </div>
              </div>
            )}
            {recordedBlob && (
              <div className="w-full px-6 space-y-3">
                <audio ref={audioPreviewRef} className="hidden" />
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={togglePlayback} className="h-10 w-10 rounded-full">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <div className="flex-1 space-y-1">
                    <div className="relative h-2 bg-background rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 bg-primary transition-all duration-100" style={{ width: duration ? `${(playbackTime / (duration * 1000)) * 100}%` : '0%' }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(playbackTime)}</span>
                      <span>{formatTime(duration * 1000)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-center">
            {!hasPermission && !recordedBlob && (
              <Button onClick={requestPermissions} disabled={isInitializing} className="gap-2">
                {isInitializing ? (<><Loader2 className="w-4 h-4 animate-spin" />Initializing...</>) : (<><Mic className="w-4 h-4" />Enable Microphone</>)}
              </Button>
            )}
            {hasPermission && !recordedBlob && !isRecording && (
              <Button onClick={startRecording} className="gap-2"><Play className="w-4 h-4" />Start Recording</Button>
            )}
            {isRecording && (
              <Button onClick={stopRecording} variant="destructive" className="gap-2"><Square className="w-4 h-4" />Stop Recording</Button>
            )}
            {recordedBlob && (
              <>
                <Button onClick={resetRecording} variant="outline" className="gap-2"><RotateCcw className="w-4 h-4" />Record Again</Button>
                <Button onClick={confirmRecording} className="gap-2">Use This Recording</Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};