/**
 * Synthesises the convolver's impulse response — no IR file is downloaded, per the project's
 * no-external-assets rule. A decaying burst of white noise is a standard, cheap stand-in for a
 * room's reverb tail: white noise carries every frequency equally (a real room reflection does
 * too, roughly), and an exponential envelope on top gives it the fast-loud/slow-fade shape a
 * decay actually has. `decayExponent` controls how quickly that envelope falls off; 2 reads as a
 * small/soft room rather than a sharp click (too low) or a boomy hall (too high).
 */

export function createImpulseResponse(
  ctx: BaseAudioContext,
  durationSeconds = 0.5,
  decayExponent = 2,
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const envelope = Math.pow(1 - i / length, decayExponent);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }

  return impulse;
}
