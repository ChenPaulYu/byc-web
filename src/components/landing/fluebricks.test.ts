import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createFluebricksFlute } from './fluebricks';
import { cm } from './scale';

test('the study can separate five complete modules without guessing from color', () => {
  const flute = createFluebricksFlute();
  try {
    const modules = new Set<number>();
    flute.children.forEach(child => {
      assert.ok(child instanceof THREE.Mesh);
      const index = child.userData.flueModule;
      assert.ok(Number.isInteger(index) && index >= 0 && index <= 4);
      modules.add(index);
    });
    assert.deepEqual([...modules], [0, 1, 2, 3, 4]);
    assert.equal(flute.children.length, 5, 'one draw call per physical module');
  } finally { flute.dispose(); }
});

test('reference silhouette has a bent regulator and real recessed openings', () => {
  const flute = createFluebricksFlute();
  flute.updateMatrixWorld(true);
  const hit = (index: number, x: number, y: number) => new THREE.Raycaster(
    new THREE.Vector3(x, y, -10), new THREE.Vector3(0, 0, 1),
  ).intersectObject(flute.children[index])[0];
  try {
    const mouth = new THREE.Box3().setFromObject(flute.children[0]);
    assert.ok(mouth.min.x < -cm(1.7), 'mouthpiece bends sideways beyond its straight neck');
    const window = hit(1, 0, cm(3));
    assert.ok(window && window.point.z > 0, 'generator window reaches the recessed back wall');
    const slot = hit(2, 0, cm(11.4 + 0.24 + 1.5));
    assert.ok(slot && slot.point.z > 0, 'red slot exposes the inside of the opposite wall');
    const port = hit(3, 0, cm(11.4 + 0.24 + 3.3 + 0.24 + 1.4));
    assert.ok(port && port.point.z > 0, 'orange side port opens into the main bore');
    const yellow = flute.children[4] as THREE.Mesh;
    const bounds = new THREE.Box3().setFromObject(yellow);
    const bore = new THREE.Raycaster(
      new THREE.Vector3(0, bounds.max.y + 1, 0), new THREE.Vector3(0, -1, 0),
    ).intersectObject(yellow);
    assert.equal(bore.length, 0, 'yellow resonator has an open axial bore, not a cap');
    const triangles = flute.children.reduce((n, child) => {
      const g = (child as THREE.Mesh).geometry;
      return n + (g.index?.count ?? g.attributes.position.count) / 3;
    }, 0);
    assert.ok(triangles < 3000, `procedural detail budget exceeded: ${triangles}`);
  } finally { flute.dispose(); }
});

test('each independently built study owns and releases its resources', () => {
  const a = createFluebricksFlute(), b = createFluebricksFlute();
  let disposed = 0;
  a.children.forEach(child => (child as THREE.Mesh).geometry.addEventListener('dispose', () => disposed++));
  assert.notEqual((a.children[0] as THREE.Mesh).geometry, (b.children[0] as THREE.Mesh).geometry);
  a.dispose();
  assert.equal(disposed, a.children.length);
  assert.ok(new THREE.Box3().setFromObject(b).getSize(new THREE.Vector3()).y > 4);
  b.dispose();
});
