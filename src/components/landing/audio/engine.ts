/**
 * engine.ts — the raw Web Audio graph, and the only module that knows what an `AudioNode` is.
 *
 * Replicates the Tone.js chain `players/synth → Filter → Distortion → Reverb → Volume →
 * destination` without Tone: `BiquadFilterNode(lowpass) → WaveShaperNode → ConvolverNode →
 * GainNode → AnalyserNode → destination`. A `ConvolverNode` in series is 100% wet, so the
 * convolver sits on a wet branch in parallel with a dry branch, crossfaded by `setParam(2, v)` —
 * that split doesn't exist in the Tone graph and is new here (see the plan for why).
 *
 * The context and graph are built lazily on first use, not at module load: browsers refuse to
 * run an `AudioContext` before a user gesture, and constructing one eagerly logs a warning on
 * every page that imports this module, including ones that never touch audio.
 *
 * Two channel strips feed one bus: pads and the background bed each have their own gain so a
 * fader can hold one down without touching the other, while the filter, drive and reverb below
 * them are shared, because on this machine those are master-bus effects. Each strip has an
 * analyser tap in series so the mixer's LCD can meter PAD and BED separately; the master
 * analyser after the bus still drives the avatar.
 *
 * Nothing outside this folder ever sees a node — `index.ts` re-exports behaviour only.
 *
 * Reads: impulse.ts (reverb IR) · voice.ts (synth fallback + note math) · samples.ts (decode +
 * cache) · ../layout.ts (existing pad-key → note table, reused rather than duplicated)
 */

import { createImpulseResponse } from './impulse';
import { noteToFrequency, playVoice } from './voice';
import { loadSample } from './samples';
import { PAD_LAYOUT } from '../layout';

const PAD_NOTE_BY_KEY = new Map<string, string>(PAD_LAYOUT.map(pad => [pad.key, pad.note]));

/** One RMS reader with its own clock, so two callers in the same tick don't double-smooth. */
type LevelRead = {
  analyser: AnalyserNode;
  data: Float32Array;
  smoothed: number;
  lastAt: number;
};

function readSmoothedRms(read: LevelRead, now: number, rate: number): number {
  const elapsed = now - read.lastAt;
  if (elapsed <= 0) return read.smoothed;
  read.lastAt = now;
  read.analyser.getFloatTimeDomainData(read.data);

  let sumOfSquares = 0;
  for (let i = 0; i < read.data.length; i += 1) {
    sumOfSquares += read.data[i] * read.data[i];
  }
  const rms = Math.sqrt(sumOfSquares / read.data.length);
  // Damped against elapsed time rather than by a fixed fraction per call, which would smooth
  // four times faster at 120fps than at 30. Rate 9 gives a time constant near 110 ms.
  read.smoothed += (rms - read.smoothed) * (1 - Math.exp(-rate * elapsed));
  return Math.min(1, Math.max(0, read.smoothed));
}

function makeAnalyser(ctx: AudioContext, smoothing: number): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = smoothing;
  return analyser;
}

function makeLevelRead(analyser: AnalyserNode): LevelRead {
  return { analyser, data: new Float32Array(analyser.fftSize), smoothed: 0, lastAt: 0 };
}

// Web Audio's own curve formula for a soft-knee overdrive (as in the MDN WaveShaperNode
// example): larger `amount` steepens the knee. `amount` here is 0..100, driven by a 0..1 knob.
function buildDistortionCurve(amount: number): Float32Array {
  const samples = 2048;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i += 1) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

class AudioEngine {
  private ctx: AudioContext | null = null;

  // Two channel strips feeding one bus, which is what a two-channel mixer is. Pads and the
  // background bed each get their own gain so a fader can hold one down without touching the
  // other; everything downstream of them is shared, because the filter, drive and reverb on this
  // machine are master-bus effects rather than per-channel ones.
  private padBus: GainNode | null = null;
  private bedBus: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private shaper: WaveShaperNode | null = null;
  private convolver: ConvolverNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private masterLevel: LevelRead | null = null;
  private padLevel: LevelRead | null = null;
  private bedLevel: LevelRead | null = null;

  private padSamples = new Map<string, AudioBuffer>();
  private bedBuffer: AudioBuffer | null = null;
  private bedSource: AudioBufferSourceNode | null = null;
  // Asking for the bed and being able to play it are separate moments: the POWER ON click can
  // easily land before the loop has finished decoding. Without remembering the request, that
  // race just means the scene is silent for the whole visit.
  private bedWanted = false;

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx;

    const ctx = new AudioContext({ latencyHint: 'interactive' });
    this.ctx = ctx;
    this.buildGraph(ctx);
    return ctx;
  }

  private buildGraph(ctx: AudioContext): void {
    const padBus = ctx.createGain();
    padBus.gain.value = 0.85;
    const bedBus = ctx.createGain();
    // The bed enters quietly, per the decision that the scene should be alive on arrival without
    // announcing itself. Before this there was no way to ask for that at all.
    bedBus.gain.value = 0.3;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000;

    const shaper = ctx.createWaveShaper();
    shaper.curve = null; // null curve is a pass-through — matches Tone.Distortion(0) at rest

    const convolver = ctx.createConvolver();
    convolver.buffer = createImpulseResponse(ctx);
    convolver.normalize = true;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 1;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0; // fully dry until setParam(2, …) says otherwise

    const masterGain = ctx.createGain();
    masterGain.gain.value = 1;

    // Channel taps sit in series on each strip so the mixer can see PAD and BED apart. An
    // AnalyserNode is a pass-through, so this does not change the sound. The master tap after
    // the bus still feeds the avatar.
    const padAnalyser = makeAnalyser(ctx, 0.35);
    const bedAnalyser = makeAnalyser(ctx, 0.7);
    const masterAnalyser = makeAnalyser(ctx, 0.6);

    padBus.connect(padAnalyser);
    padAnalyser.connect(filter);
    bedBus.connect(bedAnalyser);
    bedAnalyser.connect(filter);
    filter.connect(shaper);
    shaper.connect(dryGain);
    shaper.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
    masterGain.connect(masterAnalyser);
    masterAnalyser.connect(ctx.destination);

    this.padBus = padBus;
    this.bedBus = bedBus;
    this.filter = filter;
    this.shaper = shaper;
    this.convolver = convolver;
    this.dryGain = dryGain;
    this.wetGain = wetGain;
    this.masterGain = masterGain;
    this.padLevel = makeLevelRead(padAnalyser);
    this.bedLevel = makeLevelRead(bedAnalyser);
    this.masterLevel = makeLevelRead(masterAnalyser);
  }

  async resume(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state !== 'running') await ctx.resume();
  }

  triggerPad(key: string): void {
    const ctx = this.ensureContext();
    const sample = this.padSamples.get(key);

    if (sample) {
      const source = ctx.createBufferSource();
      source.buffer = sample;
      source.connect(this.padBus as AudioNode);
      source.start(); // no time arg — immediate, per the latency requirement
      source.onended = () => source.disconnect();
      return;
    }

    const note = PAD_NOTE_BY_KEY.get(key);
    if (!note) return; // unknown pad key — nothing assigned, nothing to fall back to
    playVoice(ctx, this.padBus as AudioNode, noteToFrequency(note));
  }

  setParam(index: number, value: number): void {
    const ctx = this.ensureContext();
    const v = Math.min(1, Math.max(0, value));
    const now = ctx.currentTime;

    switch (index) {
      case 0: {
        // Filter cutoff, logarithmic 500 Hz..20 kHz. Logarithmic because a linear sweep spends
        // almost its whole travel above the range anyone can hear a difference in. The floor was
        // 200 Hz, which is not "filtered" but "broken" to anyone who did not mean to go there —
        // and a visitor who thinks the site is broken does not conclude they turned a knob too far.
        const freq = 500 * Math.pow(40, v);
        this.filter?.frequency.setTargetAtTime(freq, now, 0.01);
        break;
      }
      case 1: {
        // Capped well below the curve's useful maximum: fully clockwise should be gritty, not
        // destroyed, for the same reason the filter has a floor.
        if (this.shaper) this.shaper.curve = v === 0 ? null : buildDistortionCurve(v * 45);
        break;
      }
      case 2: {
        // Equal-power crossfade so the perceived loudness doesn't dip in the middle of the mix.
        const angle = v * (Math.PI / 2);
        this.dryGain?.gain.setTargetAtTime(Math.cos(angle), now, 0.01);
        this.wetGain?.gain.setTargetAtTime(Math.sin(angle), now, 0.01);
        break;
      }
      case 3: {
        this.masterGain?.gain.setTargetAtTime(v, now, 0.01);
        break;
      }
      default:
        break;
    }
  }

  /** Channel fader. 0 is the pads, 1 is the bed. */
  setChannel(index: number, value: number): void {
    const ctx = this.ensureContext();
    const bus = index === 0 ? this.padBus : this.bedBus;
    bus?.gain.setTargetAtTime(Math.min(1, Math.max(0, value)), ctx.currentTime, 0.02);
  }

  startBed(): void {
    this.bedWanted = true;
    if (!this.bedBuffer || this.bedSource) return; // nothing loaded yet, or already running
    const ctx = this.ensureContext();

    const source = ctx.createBufferSource();
    source.buffer = this.bedBuffer;
    source.loop = true;

    source.connect(this.bedBus as AudioNode);
    source.start();

    this.bedSource = source;
  }

  stopBed(): void {
    this.bedWanted = false;
    if (!this.bedSource) return;
    this.bedSource.stop();
    this.bedSource.disconnect();
    this.bedSource = null;
  }

  getLevel(): number {
    if (!this.masterLevel || !this.ctx) return 0;
    return readSmoothedRms(this.masterLevel, this.ctx.currentTime, 9);
  }

  /** Per-strip meters for the mixer LCD. 0 is pads, 1 is the bed. Faster pad envelope so a
   * hit punches; slower bed envelope so the floor breathes. */
  getChannelLevels(): [number, number] {
    if (!this.padLevel || !this.bedLevel || !this.ctx) return [0, 0];
    const now = this.ctx.currentTime;
    return [
      readSmoothedRms(this.padLevel, now, 16),
      readSmoothedRms(this.bedLevel, now, 5),
    ];
  }

  /** Seam for a later step: registers a decoded sample against a pad key. Not called by
   * anything yet — the config fetch that would supply `filename` still lives in the React hook. */
  async loadPadSample(key: string, filename: string): Promise<void> {
    const ctx = this.ensureContext();
    const buffer = await loadSample(ctx, filename);
    this.padSamples.set(key, buffer);
  }

  /** Seam for a later step: loads the synced loop `startBed`/`stopBed` play. Not called yet. */
  async loadBed(filename: string): Promise<void> {
    const ctx = this.ensureContext();
    this.bedBuffer = await loadSample(ctx, filename);
    if (this.bedWanted) this.startBed();
  }
}

export const engine = new AudioEngine();
