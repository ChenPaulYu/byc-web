/**
 * Owns the MPC sample configuration, Tone.js effect chain, transport state, and knob history.
 * Reads: /mpc.config.json and sample files referenced by that configuration.
 * Writes: browser audio graph state and transport playback state.
 */

import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

export interface MpcConfig {
  bpm: number;
  loop: string;
  pads: Record<string, string>;
}

export interface MpcEffects {
  filter: Tone.Filter;
  distortion: Tone.Distortion;
  reverb: Tone.Reverb;
  vol: Tone.Volume;
  players?: Tone.Players;
}

export interface MpcAudioState {
  isPlaying: boolean;
  knobValues: number[];
  setKnobValues: React.Dispatch<React.SetStateAction<number[]>>;
  activeBtn: string | null;
  mpcConfig: MpcConfig | null;
  effects: React.MutableRefObject<MpcEffects | null>;
  handlePlay: () => Promise<void>;
  handleStop: () => void;
  handlePrev: () => void;
  handleNext: () => void;
}

export function useMpcAudio(synth: Tone.PolySynth): MpcAudioState {
  const [isPlaying, setIsPlaying] = useState(false);
  const [knobValues, setKnobValues] = useState([0.5, 0.2, 0.3, 0.8]); // [Filter, Distortion, Reverb, Volume]
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

  const effects = useRef<MpcEffects | null>(null);

  useEffect(() => {
    if (!mpcConfig) return;

    // Create effects
    const vol = new Tone.Volume(0).toDestination();
    const reverb = new Tone.Reverb(0.5).connect(vol);
    const distortion = new Tone.Distortion(0).connect(reverb);
    const filter = new Tone.Filter(20000, "lowpass").connect(distortion);

    // Build sample map from config
    const sampleMap: Record<string, string> = {};
    for (const [key, filename] of Object.entries(mpcConfig.pads)) {
      sampleMap[key] = `/samples/${filename}`;
    }
    if (mpcConfig.loop) {
      sampleMap['_loop'] = `/samples/${mpcConfig.loop}`;
    }

    const players = new Tone.Players(sampleMap, () => {
      console.log("Samples loaded from config");
      if (mpcConfig.loop && players.has('_loop')) {
        const loop = players.player('_loop');
        loop.loop = true;
        loop.sync().start(0);
      }
      Tone.Transport.bpm.value = mpcConfig.bpm;
    }).connect(filter);

    effects.current = { filter, distortion, reverb, vol, players };

    // Route synth through effects
    synth.disconnect();
    synth.connect(filter);

    return () => {
      synth.disconnect();
      synth.toDestination();
      filter.dispose();
      distortion.dispose();
      reverb.dispose();
      vol.dispose();
      players.dispose();
      effects.current = null;
    };
  }, [synth, mpcConfig]);

  const handlePlay = async () => {
    if (Tone.context.state !== 'running') await Tone.start();

    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    setActiveBtn('STOP');
    setTimeout(() => setActiveBtn(null), 150);
  };

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
    setKnobValues([Math.random(), Math.random(), Math.random(), Math.random()]);
  };

  return {
    isPlaying,
    knobValues,
    setKnobValues,
    activeBtn,
    mpcConfig,
    effects,
    handlePlay,
    handleStop,
    handlePrev,
    handleNext,
  };
}
