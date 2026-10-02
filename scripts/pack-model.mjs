/** Losslessly pack the production avatar's buffer views with EXT_meshopt_compression.
 * The existing GLTF loader already includes its decoder. Source models and embedded image
 * bytes remain untouched; no quantization, mesh simplification or animation changes occur.
 * Verify every reconstructed view against the source before writing the generated artifact.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const filename = process.argv[2] ?? 'dist/model.glb';
const source = readFileSync(filename);
assert.equal(source.readUInt32LE(0), 0x46546c67, 'Expected a GLB model');
assert.equal(source.readUInt32LE(4), 2, 'Expected glTF 2.0');
const jsonLength = source.readUInt32LE(12);
const original = JSON.parse(source.subarray(20, 20 + jsonLength).toString());
const binary = source.subarray(28 + jsonLength);
const extension = 'EXT_meshopt_compression';

// Uploaded assets may already be compressed or use external buffers. Leave those valid
// formats alone rather than adding another compression layer or changing their contracts.
if (original.buffers.length !== 1 || original.buffers[0].uri
  || original.extensionsUsed?.some(name => [extension, 'KHR_draco_mesh_compression'].includes(name))) {
  console.log('Model packing skipped: external buffers or existing compression.');
} else {
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
  const document = structuredClone(original);
  const imageViews = new Set((document.images ?? []).map(image => image.bufferView));
  const shapes = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
  const components = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
  const chunks = [];
  let offset = 0, fallbackSize = 0, compressedViews = 0;
  const append = data => {
    const start = offset;
    const padding = (4 - data.byteLength % 4) % 4;
    chunks.push(Buffer.from(data), Buffer.alloc(padding));
    offset += data.byteLength + padding;
    return start;
  };

  for (const [index, view] of document.bufferViews.entries()) {
    const raw = binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    const accessors = (document.accessors ?? []).filter(accessor => accessor.bufferView === index);
    const accessor = accessors.length === 1 ? accessors[0] : null;
    const mode = view.target === 34963 && accessor?.type === 'SCALAR' ? 'INDICES' : 'ATTRIBUTES';
    const stride = view.byteStride ?? (accessor ? shapes[accessor.type] * components[accessor.componentType] : 4);
    const validStride = mode === 'INDICES' ? stride === 2 || stride === 4 : stride % 4 === 0 && stride <= 256;
    if (!imageViews.has(index) && validStride && view.byteLength % stride === 0) {
      const count = view.byteLength / stride;
      const encoded = MeshoptEncoder.encodeGltfBuffer(raw, count, stride, mode);
      if (encoded.byteLength + 160 < raw.byteLength) {
        view.extensions = { ...view.extensions, [extension]: {
          buffer: 0, byteOffset: append(encoded), byteLength: encoded.byteLength,
          byteStride: stride, count, mode,
        } };
        view.buffer = 1;
        view.byteOffset = fallbackSize;
        fallbackSize += Math.ceil(raw.byteLength / 4) * 4;
        compressedViews++;
        continue;
      }
    }
    view.buffer = 0;
    view.byteOffset = append(raw);
  }

  const packed = Buffer.concat(chunks);
  // Check offsets and actual packed bytes, not just an encoder/decoder round trip in isolation.
  for (const [index, view] of document.bufferViews.entries()) {
    const prior = original.bufferViews[index];
    const expected = binary.subarray(prior.byteOffset ?? 0, (prior.byteOffset ?? 0) + prior.byteLength);
    const codec = view.extensions?.[extension];
    let decoded;
    if (codec) {
      decoded = Buffer.alloc(view.byteLength);
      MeshoptDecoder.decodeGltfBuffer(decoded, codec.count, codec.byteStride,
        packed.subarray(codec.byteOffset, codec.byteOffset + codec.byteLength), codec.mode);
    } else decoded = packed.subarray(view.byteOffset, view.byteOffset + view.byteLength);
    assert.deepEqual(decoded, expected, `Buffer view ${index} must remain byte-identical`);
  }

  if (compressedViews) {
    document.buffers = [{ ...original.buffers[0], byteLength: packed.byteLength },
      { byteLength: fallbackSize, extensions: { [extension]: { fallback: true } } }];
    document.extensionsUsed = [...(document.extensionsUsed ?? []), extension];
    document.extensionsRequired = [...(document.extensionsRequired ?? []), extension];
    const json = Buffer.from(JSON.stringify(document));
    const alignedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
    const header = Buffer.alloc(20), binaryHeader = Buffer.alloc(8);
    header.writeUInt32LE(0x46546c67, 0);
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(28 + alignedJson.length + packed.length, 8);
    header.writeUInt32LE(alignedJson.length, 12);
    header.writeUInt32LE(0x4e4f534a, 16);
    binaryHeader.writeUInt32LE(packed.length, 0);
    binaryHeader.writeUInt32LE(0x004e4942, 4);
    const output = Buffer.concat([header, alignedJson, binaryHeader, packed]);
    assert.ok(output.length < source.length, 'Packing must reduce the actual GLB size');
    writeFileSync(filename, output);
    console.log(JSON.stringify({ sourceBytes: source.length, packedBytes: output.length, compressedViews,
      verifiedViews: document.bufferViews.length }));
  } else console.log('Model packing skipped: no profitable lossless compression.');
}
