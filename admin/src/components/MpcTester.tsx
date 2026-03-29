import React, { useState, useEffect, useRef, useCallback } from 'react';

interface MpcTesterProps {
  config: {
    bpm: number;
    loop: string;
    pads: Record<string, string>;
  };
  samples: string[];
  onPadAssign: (key: string, sample: string) => void;
  onPadClear: (key: string) => void;
}

const PAD_KEYS = [
  ['1', '2', '3', '4'],
  ['q', 'w', 'e', 'r'],
  ['a', 's', 'd', 'f'],
  ['z', 'x', 'c', 'v'],
];

const PAD_NOTES: Record<string, string> = {
  '1': 'G5', '2': 'A5', '3': 'C6', '4': 'D6',
  'q': 'C5', 'w': 'D5', 'e': 'E5', 'r': 'G5',
  'a': 'G4', 's': 'A4', 'd': 'C5', 'f': 'D5',
  'z': 'C4', 'x': 'D4', 'c': 'E4', 'v': 'G4',
};

const ROW_COLORS = ['#f87171', '#fbbf24', '#34d399', '#60a5fa'];

const MpcTester: React.FC<MpcTesterProps> = ({ config, samples, onPadAssign, onPadClear }) => {
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const loopAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize AudioContext
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  };

  // Play a sample file
  const playSample = useCallback((filename: string) => {
    const url = `/public/samples/${filename}`;
    let audio = audioCache.current.get(url);
    if (!audio) {
      audio = new Audio(url);
      audioCache.current.set(url, audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  // Play a synth note (simple oscillator)
  const playNote = useCallback((note: string) => {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = noteToFreq(note);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.value = 0.3;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }, []);

  // Note name to frequency
  const noteToFreq = (note: string): number => {
    const notes: Record<string, number> = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.00,
      'A4': 440.00, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
      'G5': 783.99, 'A5': 880.00, 'C6': 1046.50, 'D6': 1174.66,
    };
    return notes[note] || 440;
  };

  // Trigger a pad
  const triggerPad = useCallback((key: string) => {
    setActivePads(prev => new Set(prev).add(key));
    setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 150);

    const sample = config.pads[key];
    if (sample) {
      playSample(sample);
    } else {
      const note = PAD_NOTES[key];
      if (note) playNote(note);
    }
  }, [config.pads, playSample, playNote]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (PAD_NOTES[key]) {
        e.preventDefault();
        triggerPad(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerPad]);

  // Loop play/stop
  const toggleLoop = () => {
    if (isPlaying) {
      loopAudioRef.current?.pause();
      if (loopAudioRef.current) loopAudioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else if (config.loop) {
      const audio = new Audio(`/public/samples/${config.loop}`);
      audio.loop = true;
      audio.play().catch(() => {});
      loopAudioRef.current = audio;
      setIsPlaying(true);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      loopAudioRef.current?.pause();
    };
  }, []);

  // Drag handlers
  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDragOver(key);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    setDragOver(null);
    const sample = e.dataTransfer.getData('text/plain');
    if (sample) {
      onPadAssign(key, sample);
    }
  };

  return (
    <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50">
      {/* 4x4 Pad Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {PAD_KEYS.map((row, rowIdx) =>
          row.map((key) => {
            const sample = config.pads[key];
            const isActive = activePads.has(key);
            const isDragTarget = dragOver === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => triggerPad(key)}
                onDragOver={(e) => handleDragOver(e, key)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, key)}
                onContextMenu={(e) => { e.preventDefault(); onPadClear(key); }}
                className={`relative aspect-square rounded-lg border-2 transition-all duration-100 flex flex-col items-center justify-center gap-1 text-xs select-none
                  ${isDragTarget ? 'border-blue-400 bg-blue-50 scale-105' :
                    isActive ? 'border-transparent scale-95' :
                    'border-neutral-200 hover:border-neutral-300 bg-white'}`}
                style={isActive ? { backgroundColor: ROW_COLORS[rowIdx], borderColor: ROW_COLORS[rowIdx] } : {}}
                title={sample ? `${key.toUpperCase()}: ${sample}\nRight-click to clear` : `${key.toUpperCase()}: Synth (${PAD_NOTES[key]})`}
              >
                <span className={`font-mono font-bold text-sm ${isActive ? 'text-white' : 'text-neutral-900'}`}>
                  {key.toUpperCase()}
                </span>
                <span className={`text-[9px] leading-tight text-center truncate w-full px-1 ${isActive ? 'text-white/80' : 'text-neutral-400'}`}>
                  {sample ? sample.replace(/\.[^.]+$/, '').slice(0, 12) : 'Synth'}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleLoop}
            disabled={!config.loop}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-900 hover:bg-neutral-700'
            } text-white disabled:opacity-30`}
          >
            {isPlaying ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect width="10" height="10" rx="1" /></svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><polygon points="0,0 10,6 0,12" /></svg>
            )}
          </button>
          <span className="text-xs text-neutral-400 font-mono">{config.bpm} BPM</span>
        </div>
        <span className="text-[10px] text-neutral-300">Click pad to play · Drag sample to assign · Right-click to clear</span>
      </div>
    </div>
  );
};

export default MpcTester;
