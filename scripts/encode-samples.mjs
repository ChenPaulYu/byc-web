/** Generate lossless FLAC siblings for the configured WAV masters; normal builds need no FFmpeg.
 * Run npm run samples:encode after changing a master. Commit the verified FLAC files alongside it.
 * Configuration remains explicit: choose the .flac name to use the smaller asset.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const config = JSON.parse(readFileSync('public/mpc.config.json', 'utf8'));
const filenames = new Set([config.loop, ...Object.values(config.pads)]);
// Compare at full decoded precision so a future float/32-bit master cannot silently pass
// after both comparison inputs have been quantized down to FLAC's supported sample depth.
const pcm = file => execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:a:0',
  '-f', 'f64le', '-acodec', 'pcm_f64le', 'pipe:1'], { maxBuffer: 64 * 1024 * 1024 });
let sourceBytes = 0, compressedBytes = 0;
for (const filename of filenames) {
  if (!/\.(wav|flac)$/i.test(filename)) continue;
  assert.equal(path.basename(filename), filename, 'Sample filenames must stay inside public/samples');
  const master = path.join('public/samples', filename.replace(/\.(wav|flac)$/i, '.wav'));
  const output = master.replace(/\.wav$/, '.flac');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', master, '-map', '0:a:0',
    '-c:a', 'flac', '-compression_level', '8', output]);
  assert.deepEqual(pcm(output), pcm(master), `${filename}: compressed audio must decode identically`);
  sourceBytes += statSync(master).size;
  compressedBytes += statSync(output).size;
  console.log(`PASS identical PCM: ${path.basename(output)} (${statSync(output).size} bytes)`);
}
console.log(JSON.stringify({ sourceBytes, compressedBytes, savedPercent: (1 - compressedBytes / sourceBytes) * 100 }));
