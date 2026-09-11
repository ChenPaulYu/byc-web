/** Shared back-wall composition and static cloth shape; independent of React and browser textures. */
import * as THREE from 'three';

export const WALL_DISPLAY = {
  flag: { x: -11, aboveDesk: 12, width: 8.4, height: 5.6 },
  notes: { width: 2.6, height: 3.3, x: [-2.5, 0.9], aboveDesk: [15, 11.1, 7.2] },
} as const;

export function createWallFlagGeometry() {
  const { width, height } = WALL_DISPLAY.flag;
  const geometry = new THREE.PlaneGeometry(width, height, 40, 28);
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const u = (x + width / 2) / width;
    const v = (height / 2 - positions.getY(i)) / height;
    const betweenPins = Math.sin(u * Math.PI);
    const fold = Math.sin(u * Math.PI * 6 + v * 0.7);
    positions.setY(i, positions.getY(i) - betweenPins * (0.12 + v * 0.14));
    positions.setZ(i, 0.06 + betweenPins * (0.10 + v * 0.08) + (fold + 1) * 0.22 * v);
  }
  geometry.computeVertexNormals();
  return geometry;
}
