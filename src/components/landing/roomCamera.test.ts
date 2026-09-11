import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { approach, cameraBounds, constrainEye, turnView } from './roomCamera';
import { authoredShot } from './shot';

test('desktop, portrait and ultrawide shots start inside the room at human eye height', () => {
  const bounds = cameraBounds(-18, -2);
  for (const [width, height] of [[1440, 900], [390, 844], [2560, 1080], [844, 390]]) {
    const shot = authoredShot(width, height);
    const eye = new THREE.Vector3(...shot.position);
    assert.ok(bounds.containsPoint(eye));
    assert.ok(eye.y < 15, 'not an external crane shot');
    assert.ok(shot.fov >= 50, 'interior field of view');
    assert.ok(Math.abs(eye.distanceTo(new THREE.Vector3(...shot.target)) - shot.distance) < 1e-8);
  }
});

test('looking around rotates the view without orbiting the eye', () => {
  const eye = new THREE.Vector3(7, 8, 21), target = new THREE.Vector3(-1, 1, -3);
  const before = eye.clone(), distance = target.distanceTo(eye);
  for (let i = 0; i < 100; i++) turnView(eye, target, 0.8, i % 2 ? 2 : -2);
  assert.ok(eye.equals(before));
  assert.ok(Math.abs(target.distanceTo(eye) - distance) < 1e-8);
  assert.ok(target.toArray().every(Number.isFinite));
});

test('wheel/pinch approach cannot leave the envelope and preserves viewing direction at its limits', () => {
  const bounds = cameraBounds(-18, -2);
  for (const direction of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const eye = new THREE.Vector3(0, 8, 21), ray = new THREE.Vector3(...direction);
    const target = eye.clone().addScaledVector(ray, 20);
    approach(eye, target, 10000, bounds);
    assert.ok(bounds.containsPoint(eye));
    assert.ok(target.clone().sub(eye).normalize().distanceTo(ray) < 1e-8);
    approach(eye, target, -10000, bounds);
    assert.ok(bounds.containsPoint(eye));
  }
});

test('object and game flight endpoints clamp inside, and their interpolated path stays inside', () => {
  const bounds = cameraBounds(-18, -2), from = new THREE.Vector3(7, 8, 21);
  for (const candidate of [[-50, 60, -30], [80, -40, 70], [8, 26, 24]]) {
    const to = constrainEye(new THREE.Vector3(...candidate), bounds);
    for (let t = 0; t <= 1; t += 0.05) assert.ok(bounds.containsPoint(from.clone().lerp(to, t)));
  }
});
