/** Lightweight architectural finish, merged into the room's existing static material batches. */
import * as THREE from 'three';

export const CEILING_LAMP_NAME = 'ceiling-lamp-diffuser';
export const WALL_SWITCH_NAME = 'wall-light-switch';

export const isLightSwitch = (name: string) => name === WALL_SWITCH_NAME;

type Point = [number, number, number];
interface FinishBuilder {
  add(geometry: THREE.BufferGeometry, material: THREE.Material, position: Point, rotation?: Point): void;
}

export function addRoomFinish(b: FinishBuilder, m: {
  ceiling: THREE.Material; edge: THREE.Material; reveal: THREE.Material; ceilingLamp: THREE.Material; wallSwitch: THREE.Material;
}, room: { width: number; height: number; depth: number; back: number; front: number }, floor: number) {
  const top = floor + room.height;
  const left = -room.width / 2, right = room.width / 2;
  const centerZ = (room.back + room.front) / 2;
  // Square-cut profiles use twelve triangles each; no bevel tessellation on fine trim.
  const box = (size: Point, position: Point, material: THREE.Material) =>
    b.add(new THREE.BoxGeometry(...size), material, position);

  // Two-step perimeter trim and a narrow recessed-looking seam separate wall from ceiling.
  for (const [z, inward] of [[room.back, 1], [room.front, -1]]) {
    box([room.width - 0.75, 0.08, 0.06], [0, top - 0.94, z + inward * 0.40], m.reveal);
    box([room.width - 0.75, 0.42, 0.38], [0, top - 0.67, z + inward * 0.52], m.ceiling);
    box([room.width - 0.75, 0.14, 0.70], [0, top - 0.39, z + inward * 0.68], m.ceiling);
  }
  for (const [x, inward] of [[left, 1], [right, -1]]) {
    box([0.06, 0.08, room.depth - 0.75], [x + inward * 0.40, top - 0.94, centerZ], m.reveal);
    box([0.38, 0.42, room.depth - 0.75], [x + inward * 0.52, top - 0.67, centerZ], m.ceiling);
    box([0.70, 0.14, room.depth - 0.75], [x + inward * 0.68, top - 0.39, centerZ], m.ceiling);
  }
  // A few long plaster-board joints give scale without turning the ceiling into a tile grid.
  for (const x of [-10, 10])
    box([0.035, 0.015, room.depth - 2.4], [x, top - 0.307, centerZ], m.reveal);

  // Shallow opal ceiling fixture: an illuminated surface, not another real-time light.
  b.add(new THREE.CylinderGeometry(2.8, 2.8, 0.23, 32), m.reveal, [0, top - 0.43, 6]);
  b.add(new THREE.CylinderGeometry(2.65, 2.65, 0.25, 32), m.ceiling, [0, top - 0.55, 6]);
  b.add(new THREE.CylinderGeometry(2.4, 2.4, 0.05, 32), m.ceilingLamp, [0, top - 0.70, 6]);

  // Flush ventilation grille toward the rear; shadow gaps are backed, never holes to the sky.
  box([5.6, 0.04, 2], [12, top - 0.33, 27], m.reveal);
  for (let i = 0; i < 9; i++)
    box([5.8, 0.07, 0.12], [12, top - 0.38, 26.08 + i * 0.23], m.ceiling);

  // Paint-finished skirting cap and corner beads make adjoining planes read as constructed.
  for (const z of [room.back + 0.62, room.front - 0.62])
    box([room.width - 0.8, 0.11, 0.16], [0, floor + 1.04, z], m.ceiling);
  for (const x of [left + 0.62, right - 0.62])
    box([0.16, 0.11, room.depth - 0.8], [x, floor + 1.04, centerZ], m.ceiling);
  for (const x of [left + 0.41, right - 0.41])
    box([0.08, room.height - 2, 0.08], [x, floor + room.height / 2, room.back + 0.41], m.ceiling);

  // A quiet wall switch by the door, with a raised rocker and a thin edge shadow.
  box([1.4, 2.0, 0.06], [0.3, floor + 15, room.front - 0.40], m.reveal);
  box([1.3, 1.9, 0.10], [0.3, floor + 15, room.front - 0.47], m.wallSwitch);
  box([0.7, 1.15, 0.06], [0.3, floor + 15.04, room.front - 0.55], m.wallSwitch);
}
