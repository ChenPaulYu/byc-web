import assert from 'node:assert/strict';
import test from 'node:test';
import { loadSample } from './audio/samples';

test('unsupported FLAC falls back to its WAV master and shares one in-flight decode', async t => {
  const requests: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => {
    requests.push(url);
    return new Response(new Uint8Array([url.endsWith('.flac') ? 1 : 2]));
  });
  const decoded = {} as AudioBuffer;
  const ctx = { decodeAudioData: async (bytes: ArrayBuffer) => {
    if (new Uint8Array(bytes)[0] === 1) throw new Error('Unsupported codec');
    return decoded;
  } } as BaseAudioContext;
  const first = loadSample(ctx, 'codec-fallback.flac');
  const second = loadSample(ctx, 'codec-fallback.flac');
  assert.equal(first, second);
  assert.equal(await first, decoded);
  assert.deepEqual(requests, ['/samples/codec-fallback.flac', '/samples/codec-fallback.wav']);
});

test('failed requests are not decoded and can be retried after recovery', async t => {
  let online = false, decodes = 0;
  t.mock.method(globalThis, 'fetch', async () => new Response('sample', { status: online ? 200 : 404 }));
  const ctx = { decodeAudioData: async () => { decodes++; return {} as AudioBuffer; } } as unknown as BaseAudioContext;
  await assert.rejects(loadSample(ctx, 'network-retry.wav'));
  assert.equal(decodes, 0);
  online = true;
  await loadSample(ctx, 'network-retry.wav');
  assert.equal(decodes, 1);
});
