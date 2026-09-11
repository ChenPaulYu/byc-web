import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createFloatingStudy, studyTarget } from './SketchLayer';

test('floating research reuses five independently owned physical modules with finite offsets', () => {
  const a = createFloatingStudy(), b = createFloatingStudy();
  try {
    assert.equal(a.pieces.length, 5);
    assert.equal(new Set(a.pieces.map(piece => piece.mesh.userData.flueModule)).size, 5);
    a.pieces.forEach((piece, i) => {
      assert.ok(Number.isFinite(piece.offset));
      assert.notEqual(piece.mesh.geometry, b.pieces[i].mesh.geometry);
      piece.mesh.position.y = piece.home + piece.offset;
      assert.equal(b.pieces[i].mesh.position.y, b.pieces[i].home);
    });
    const size = new THREE.Box3().setFromObject(a.group).getSize(new THREE.Vector3());
    assert.ok(size.toArray().every(Number.isFinite));
    assert.ok(size.y < 15, 'exploded study remains desk-sized');
  } finally { a.dispose(); b.dispose(); }
});

test('floating study releases mesh and edge resources when the focus layer unmounts', () => {
  const study = createFloatingStudy();
  let geometries = 0, materials = 0;
  study.group.traverse(node => {
    if (node instanceof THREE.Mesh || node instanceof THREE.LineSegments) {
      node.geometry.addEventListener('dispose', () => geometries++);
      (node.material as THREE.Material).addEventListener('dispose', () => materials++);
    }
  });
  study.dispose();
  assert.equal(geometries, 10);
  assert.equal(materials, 10);
  assert.ok(studyTarget(390 / 844).x < studyTarget(1440 / 900).x);
});
