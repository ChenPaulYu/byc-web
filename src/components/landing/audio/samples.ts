/**
 * Fetches and decodes a sample by filename, cached so repeated triggers of the same pad never
 * refetch or redecode. Lossless FLAC samples can fall back to same-name WAV masters if loading
 * or decoding fails. Does not own the config fetch or the `/samples/<filename>` contract's
 * meaning — it just resolves a filename to a decoded buffer. `mpc.config.json` and the mapping
 * from pad key to filename stay owned by the React hook layer.
 */

const cache = new Map<string, Promise<AudioBuffer>>();

/** Loads and decodes `/samples/<filename>`, reusing an in-flight or completed decode if one is
 * already cached. A failed load is evicted from the cache so a retry (e.g. after the network
 * comes back) isn't stuck replaying the same rejected promise. */
export function loadSample(ctx: BaseAudioContext, filename: string): Promise<AudioBuffer> {
  const cached = cache.get(filename);
  if (cached) return cached;

  const decode = async (name: string) => {
    const response = await fetch(`/samples/${name}`);
    if (!response.ok) throw new Error(`Could not load audio sample: ${response.status}`);
    return ctx.decodeAudioData(await response.arrayBuffer());
  };
  const pending = decode(filename).catch(error => {
    if (!/\.flac$/i.test(filename)) throw error;
    return decode(filename.replace(/\.flac$/i, '.wav'));
  });

  pending.catch(() => cache.delete(filename));
  cache.set(filename, pending);
  return pending;
}
