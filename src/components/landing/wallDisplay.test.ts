import assert from 'node:assert/strict';
import test from 'node:test';
import { WALL_DISPLAY, createWallFlagGeometry } from './wallDisplay';

test('wall composition leaves breathing room between the flag, notes and shelves', () => {
  const { flag, notes } = WALL_DISPLAY;
  assert.ok(flag.x - flag.width / 2 > -20);
  assert.ok(notes.x[0] - notes.width / 2 - (flag.x + flag.width / 2) > 2);
  assert.ok(notes.x[1] + notes.width / 2 < 4.3);
  assert.ok(Math.abs(flag.width / flag.height - 1.5) < 1e-10);
});

test('static cloth stays in front of the wall with two pinned corners and finite normals', () => {
  const geometry = createWallFlagGeometry();
  try {
    const position = geometry.attributes.position;
    assert.ok([...position.array].every(Number.isFinite));
    assert.ok([...geometry.attributes.normal.array].every(Number.isFinite));
    assert.ok(geometry.index!.count / 3 < 2500);
    geometry.computeBoundingBox();
    assert.ok(geometry.boundingBox!.min.z > 0);
    assert.ok(geometry.boundingBox!.max.z - geometry.boundingBox!.min.z > 0.2);
    assert.ok(Math.abs(position.getZ(0) - 0.06) < 0.001);
    assert.ok(Math.abs(position.getZ(40) - 0.06) < 0.001);
  } finally { geometry.dispose(); }
});
