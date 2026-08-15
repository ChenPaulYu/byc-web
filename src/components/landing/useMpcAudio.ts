/**
 * useMpcAudio — the React side of the instrument: sample configuration, transport state, and
 * knob values. It owns no audio graph.
 *
 * Everything that makes a sound lives behind `./audio`, which hands out behaviour rather than
 * nodes. The version this replaces returned a ref to its Tone.js effect chain, so `Mpc.tsx`
 * reached in and started a player itself — the shape of the audio graph was known in two modules
 * and neither could change without the other. Now the component tree cannot see a node, and this
 * hook is the only thing that knows a pad key maps to a filename.
 *
 * Reads: /mpc.config.json (admin-written) and the sample files it names · ./audio
 */

import { useCallback, useEffect, useState } from 'react';
import { loadBed, loadPadSample, resume, setParam, startBed, stopBed, triggerPad } from './audio';

export interface MpcConfig {
  bpm: number;
  loop: string;
  pads: Record<string, string>;
}

export interface MpcAudioState {
  isPlaying: boolean;
  knobValues: number[];
  setKnobValues: React.Dispatch<React.SetStateAction<number[]>>;
  activeBtn: string | null;
  mpcConfig: MpcConfig | null;
  /** Play the sound assigned to a pad key, or the synth voice if it has none. */
  triggerPad: (key: string) => void;
  handlePlay: () => Promise<void>;
  handleStop: () => void;
  handlePrev: () => void;
  handleNext: () => void;
}

export function useMpcAudio(): MpcAudioState {
  const [isPlaying, setIsPlaying] = useState(false);
  // [Filter, Distortion, Reverb, Volume]. The filter sits nearly wide open rather than at the
  // midpoint: these values are what a visitor hears before touching anything, and a lowpass
  // parked halfway through its travel means the site's default sound is a dull one.
  const [knobValues, setKnobValues] = useState([0.92, 0, 0.18, 0.85]);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [history, setHistory] = useState<number[][]>([]); // Knob history
  const [mpcConfig, setMpcConfig] = useState<MpcConfig | null>(null);

  useEffect(() => {
    fetch('/mpc.config.json')
      .then(r => r.json())
      .then(setMpcConfig)
      .catch(() => {
        // Fallback to hardcoded defaults
        setMpcConfig({
          bpm: 78,
          loop: 'SLS_CSP_78_songstarter_soul_thief_Cmin.wav',
          pads: {
            z: 'SLS_CSP_kick_father.wav',
            x: 'SLS_CSP_snare_acoustic_intro.wav',
            c: 'SLS_CSP_hihat_grit_closed.wav',
            v: 'SLS_CSP_hihat_grit_open.wav',
          },
        });
      });
  }, []);

  // Decode as soon as the config names the files, rather than waiting for the first press: a
  // pad that has to fetch and decode before it sounds is exactly the latency this rewrite is
  // about. A pad hit before its buffer arrives still makes the synth tone, which is the same
  // graceful fallback the twelve unassigned pads use.
  useEffect(() => {
    if (!mpcConfig) return;
    for (const [key, filename] of Object.entries(mpcConfig.pads)) {
      loadPadSample(key, filename).catch(() => {
        // A missing sample is not fatal — that pad keeps its synth voice.
      });
    }
    if (mpcConfig.loop) loadBed(mpcConfig.loop).catch(() => {});
  }, [mpcConfig]);

  // The knobs were connected to nothing at all until now — the values existed, drew the knob
  // rotations and were pushed onto the undo history, and never reached the audio graph.
  useEffect(() => {
    knobValues.forEach((value, index) => setParam(index, value));
  }, [knobValues]);

  const handlePlay = useCallback(async () => {
    await resume();
    setIsPlaying(playing => {
      if (playing) stopBed();
      else startBed();
      return !playing;
    });
  }, []);

  const handleStop = useCallback(() => {
    stopBed();
    setIsPlaying(false);
    setActiveBtn('STOP');
    setTimeout(() => setActiveBtn(null), 150);
  }, []);

  const handlePrev = () => {
    setActiveBtn('PREV');
    setTimeout(() => setActiveBtn(null), 150);
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setKnobValues(previous);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const handleNext = () => {
    setActiveBtn('NXT');
    setTimeout(() => setActiveBtn(null), 150);
    setHistory(prev => [...prev, knobValues]); // Save current state
    // Randomised within ranges that stay listenable. Unbounded, this button could park the
    // filter at its floor and the drive at maximum in one press, which sounds like a fault
    // rather than like a shuffle.
    setKnobValues([0.45 + Math.random() * 0.55, Math.random() * 0.5, Math.random() * 0.6, 0.6 + Math.random() * 0.4]);
  };

  return {
    isPlaying,
    knobValues,
    setKnobValues,
    activeBtn,
    mpcConfig,
    triggerPad,
    handlePlay,
    handleStop,
    handlePrev,
    handleNext,
  };
}
