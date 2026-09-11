/**
 * Interior camera policy: rotate the view at a fixed eye, and bound approach/focus movement.
 * Reads: room.ts envelope. Stage supplies its measured floor and desk heights at composition.
 * No DOM, React state or frame loop; RoomControls and camera tests share these rules.
 */
import * as THREE from 'three';
import { ROOM } from './room';

export function cameraBounds(floor: number, desk: number): THREE.Box3 {
  // Stay on the visitor's side of the desk, above the chair, inside all six room surfaces.
  return new THREE.Box3(
    new THREE.Vector3(-ROOM.width / 2 + 2, desk + 3, 9),
    new THREE.Vector3(ROOM.width / 2 - 2, floor + ROOM.height - 3, ROOM.front - 2),
  );
}

export function constrainEye(eye: THREE.Vector3, bounds: THREE.Box3): THREE.Vector3 {
  return eye.clamp(bounds.min, bounds.max);
}

/** Drag changes only the target. Pitch stops short of the poles; yaw wraps freely. */
export function turnView(eye: THREE.Vector3, target: THREE.Vector3, yawDelta: number, pitchDelta: number) {
  const ray = target.clone().sub(eye);
  const radius = Math.max(1, ray.length());
  const yaw = Math.atan2(ray.x, -ray.z) + yawDelta;
  const pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(ray.y / radius, -1, 1)) + pitchDelta, -1.15, 1.15);
  target.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
    .multiplyScalar(radius).add(eye);
}

/** Translating target by the actual (clamped) eye delta avoids a turn when reaching a wall. */
export function approach(eye: THREE.Vector3, target: THREE.Vector3, distance: number, bounds: THREE.Box3) {
  const before = eye.clone();
  eye.addScaledVector(target.clone().sub(eye).normalize(), distance);
  constrainEye(eye, bounds);
  target.add(eye.clone().sub(before));
}

/** Minimal flight seam; no dependency on a particular third-party orbit controller. */
export interface RoomControlHandle {
  target: THREE.Vector3;
  update(): void;
  constrain(eye: THREE.Vector3): THREE.Vector3;
  addEventListener(type: 'start', listener: () => void): void;
  removeEventListener(type: 'start', listener: () => void): void;
}
