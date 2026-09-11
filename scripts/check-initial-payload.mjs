/** Production loading-boundary regression gate; follows static imports, never lazy routes. */
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));
// A small initial entry is not enough: a vendor/scene cycle can fail only after Power on.
const checked = new Set();
function checkCycles(key, path = []) {
  assert.ok(!path.includes(key), `Circular static chunks: ${[...path, key].join(' -> ')}`);
  if (checked.has(key)) return;
  for (const dependency of manifest[key].imports ?? []) checkCycles(dependency, [...path, key]);
  checked.add(key);
}
for (const key of Object.keys(manifest)) checkCycles(key);
const initial = new Set();
function visit(key) {
  if (initial.has(key)) return;
  initial.add(key);
  for (const dependency of manifest[key].imports ?? []) visit(dependency);
}
for (const [key, chunk] of Object.entries(manifest)) if (chunk.isEntry) visit(key);
let bytes = 0, gzipBytes = 0;
const files = [...initial].map(key => manifest[key].file);
for (const file of files) {
  bytes += statSync(`dist/${file}`).size;
  gzipBytes += gzipSync(readFileSync(`dist/${file}`)).length;
}
console.log(JSON.stringify({ files, bytes, gzipBytes }, null, 2));
assert.ok(!files.some(file => /three-vendor|LandingScene|markdown-vendor|MermaidDiagram/.test(file)),
  'The initial route must not statically import scene or document-rendering engines');
assert.ok(bytes < 400 * 1024, `Initial JavaScript exceeds 400 KiB: ${bytes}`);
