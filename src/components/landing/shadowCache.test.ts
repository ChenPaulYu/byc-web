import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { createShadowInvalidator } from './shadowCache';

function fixture() {
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
  const parent = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
  const light = new THREE.DirectionalLight();
  mesh.castShadow = light.castShadow = true;
  parent.add(mesh); scene.add(parent, light);
  const invalidated = createShadowInvalidator();
  const sample = () => { scene.updateMatrixWorld(); return invalidated(scene, camera); };
  return { scene, camera, parent, mesh, light, sample };
}

test('stationary geometry and camera-only motion reuse directional shadows', () => {
  const { sample, camera, mesh } = fixture();
  assert.equal(sample(), true);
  assert.equal(sample(), false);
  camera.position.x = 2;
  mesh.material.color.set('red');
  assert.equal(sample(), false, 'color and view direction do not change opaque depth');
});

test('caster motion, parent visibility, removal and reattachment invalidate once', () => {
  const { sample, mesh, parent, scene } = fixture();
  sample();
  for (const mutate of [
    () => { mesh.position.x++; },
    () => { parent.rotation.y += 0.2; },
    () => { parent.visible = false; },
    () => { parent.visible = true; },
    () => scene.remove(parent),
    () => scene.add(parent),
    () => { mesh.castShadow = false; },
    () => { mesh.castShadow = true; },
  ]) {
    mutate(); assert.equal(sample(), true); assert.equal(sample(), false);
  }
});

test('geometry, material visibility, light target and shadow lens changes invalidate', () => {
  const { sample, mesh, light, camera } = fixture();
  sample();
  for (const mutate of [
    () => { mesh.geometry.attributes.position.needsUpdate = true; },
    () => { mesh.geometry = new THREE.BoxGeometry(2); },
    () => { mesh.material.visible = false; },
    () => { mesh.material.visible = true; },
    () => { mesh.material.side = THREE.DoubleSide; },
    () => { light.position.x++; },
    () => { light.target.position.z++; },
    () => { light.shadow.camera.right++; },
    () => { camera.layers.set(1); },
    () => { camera.layers.set(0); },
  ]) {
    mutate(); assert.equal(sample(), true); assert.equal(sample(), false);
  }
});

test('unsupported animated silhouettes keep live shadows', () => {
  const { sample, mesh } = fixture();
  mesh.material.alphaTest = 0.5;
  assert.equal(sample(), true); assert.equal(sample(), true);
  mesh.material.alphaTest = 0;
  sample(); assert.equal(sample(), false);
  mesh.morphTargetInfluences = [0];
  assert.equal(sample(), true); assert.equal(sample(), true);
});
