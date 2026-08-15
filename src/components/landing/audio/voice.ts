/**
 * The synth fallback voice for pads with no sample assigned, plus the note-name-to-frequency
 * math it needs to play one. Matches the oscillator and envelope settings that
 * `LandingScene.createSynth` currently hands to `Tone.PolySynth(Tone.Synth, …)`, so replacing
 * Tone with this later changes the engine underneath a pad without changing how the pad sounds.
 */

const SEMITONES_FROM_A: Record<string, number> = {
  C: -9,
  'C#': -8,
  D: -7,
  'D#': -6,
  E: -5,
  F: -4,
  'F#': -3,
  G: -2,
  'G#': -1,
  A: 0,
  'A#': 1,
  B: 2,
};

const NOTE_PATTERN = /^([A-G]#?)(-?\d+)$/;

/** Converts a note name like "C4" or "G#5" to Hz, A4 = 440. Unparseable input falls back to A4
 * rather than throwing — a bad note name should sound wrong, not break the pad. */
export function noteToFrequency(note: string): number {
  const match = NOTE_PATTERN.exec(note);
  if (!match) return 440;
  const [, pitch, octaveText] = match;
  const semitoneOffset = SEMITONES_FROM_A[pitch] + (Number(octaveText) - 4) * 12;
  return 440 * Math.pow(2, semitoneOffset / 12);
}

const ATTACK = 0.005;
const DECAY = 0.1;
const SUSTAIN_LEVEL = 0.1;
const RELEASE = 0.5;
// Tone.Synth's "8n" trigger holds sustain for an eighth note before releasing. There is no
// transport driving this voice, so a fixed hold stands in for that: long enough to read as a
// struck note rather than a click, short enough not to blur into the next pad hit.
const SUSTAIN_HOLD = 0.12;

/**
 * Plays one triangle-oscillator note with an ADSR gain envelope into `destination`, then
 * disconnects itself when the envelope finishes. `ctx.currentTime` is read once and `start()` is
 * called with no time argument, so the trigger itself is immediate — only the envelope's later
 * stages are scheduled ahead.
 */
export function playVoice(ctx: BaseAudioContext, destination: AudioNode, frequency: number): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = frequency;

  const envelope = ctx.createGain();
  const sustainAt = now + ATTACK + DECAY;
  const releaseFrom = sustainAt + SUSTAIN_HOLD;
  const stopAt = releaseFrom + RELEASE;

  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(1, now + ATTACK);
  envelope.gain.linearRampToValueAtTime(SUSTAIN_LEVEL, sustainAt);
  envelope.gain.setValueAtTime(SUSTAIN_LEVEL, releaseFrom);
  envelope.gain.linearRampToValueAtTime(0, stopAt);

  osc.connect(envelope);
  envelope.connect(destination);

  osc.start();
  osc.stop(stopAt + 0.05);
  osc.onended = () => {
    osc.disconnect();
    envelope.disconnect();
  };
}
