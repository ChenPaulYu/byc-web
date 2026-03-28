import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioPlayerProps {
  src: string;
  title?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#d4d4d4',
      progressColor: '#171717',
      cursorColor: '#171717',
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 64,
      normalize: true,
    });

    ws.load(src);

    ws.on('ready', () => {
      setDuration(ws.getDuration());
      setIsReady(true);
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('seeking', () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
    };
  }, [src]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="my-6 border border-neutral-200 rounded-lg overflow-hidden bg-white">
      {title && (
        <div className="px-4 pt-3 text-xs font-medium text-neutral-500">{title}</div>
      )}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-30 transition-colors flex-shrink-0"
        >
          {isPlaying ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <rect x="0" y="0" width="3" height="12" rx="1" />
              <rect x="7" y="0" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <polygon points="0,0 10,6 0,12" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0" ref={containerRef} />
        <span className="text-xs text-neutral-400 font-mono tabular-nums flex-shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

export default AudioPlayer;
