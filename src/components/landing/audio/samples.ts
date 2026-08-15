/**
 * Fetches and decodes a sample by filename, cached so repeated triggers of the same pad never
 * refetch or redecode. Does not own the config fetch or the `/samples/<filename>` contract's
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

  const pending = fetch(`/samples/${filename}`)
    .then(response => response.arrayBuffer())
    .then(bytes => ctx.decodeAudioData(bytes));

  pending.catch(() => cache.delete(filename));
  cache.set(filename, pending);
  return pending;
}
