import { useState, useEffect, useRef } from 'react';
import { Timer, X, Plus, Minus, SkipForward } from 'lucide-react';

const PRESET_TIMES = [30, 60, 90, 120, 180];

function playBeep(audioCtx, freq = 880, duration = 0.15) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playDone(audioCtx) {
  setTimeout(() => playBeep(audioCtx, 660, 0.12), 0);
  setTimeout(() => playBeep(audioCtx, 880, 0.12), 150);
  setTimeout(() => playBeep(audioCtx, 1100, 0.25), 300);
}

export default function RestTimer({ onClose, defaultDuration = 90 }) {
  const [duration, setDuration] = useState(defaultDuration);
  const [timeLeft, setTimeLeft] = useState(defaultDuration);
  const [running, setRunning] = useState(true);
  const audioCtx = useRef(null);
  const intervalRef = useRef(null);

  function getAudio() {
    if (!audioCtx.current) audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx.current;
  }

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            playDone(getAudio());
            return 0;
          }
          if (t === 4) playBeep(getAudio(), 440, 0.1);
          if (t === 3) playBeep(getAudio(), 440, 0.1);
          if (t === 2) playBeep(getAudio(), 440, 0.1);
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function reset(newDuration) {
    clearInterval(intervalRef.current);
    const d = newDuration ?? duration;
    setDuration(d);
    setTimeLeft(d);
    setRunning(true);
  }

  function skip() {
    clearInterval(intervalRef.current);
    setTimeLeft(0);
    setRunning(false);
    playDone(getAudio());
  }

  const pct = timeLeft / duration;
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = circ * pct;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const color = timeLeft <= 5 ? 'hsl(var(--destructive))' : timeLeft <= 15 ? 'hsl(var(--accent))' : 'hsl(var(--primary))';

  return (
    <div className="fixed inset-0 bg-background/70 backdrop-blur-sm z-[60] flex items-end justify-center pb-6 px-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Rusttimer</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-all">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Circular timer */}
        <div className="flex justify-center mb-4">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {timeLeft === 0 ? (
                <span className="text-lg font-bold text-primary">Klaar!</span>
              ) : (
                <span className="text-3xl font-bold tabular-nums" style={{ color }}>
                  {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs}
                </span>
              )}
              {timeLeft > 0 && <span className="text-xs text-muted-foreground mt-0.5">seconden</span>}
            </div>
          </div>
        </div>

        {/* Preset knoppen */}
        <div className="flex gap-1.5 justify-center mb-4">
          {PRESET_TIMES.map(t => (
            <button key={t} onClick={() => reset(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${duration === t && running ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
              {t >= 60 ? `${t / 60}m` : `${t}s`}
            </button>
          ))}
        </div>

        {/* Custom aanpassen */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button onClick={() => reset(Math.max(10, duration - 15))}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-all">
            <Minus className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground w-16 text-center">
            {duration >= 60 ? `${Math.floor(duration / 60)}m ${duration % 60 > 0 ? `${duration % 60}s` : ''}` : `${duration}s`}
          </span>
          <button onClick={() => reset(Math.min(600, duration + 15))}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-border transition-all">
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Acties */}
        <div className="flex gap-2">
          <button onClick={() => reset()}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary/40 transition-all">
            Herstart
          </button>
          <button onClick={skip}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all">
            <SkipForward className="w-4 h-4" /> Overslaan
          </button>
        </div>
      </div>
    </div>
  );
}