/**
 * fluebricks.ts — photo-grounded, hollow PLA modules for the desk and exploded study.
 * A faceted bent regulator, recessed generator window, slotted tuning tube, side branch
 * and open resonator preserve the assembled product's silhouette and color sequence.
 * Local +Y follows the instrument; the regulator is on −Y and windows face −Z.
 * Each module is one merged mesh, tagged with flueModule for SketchLayer's separation.
 * Reads: scale.ts, Three's geometry merger. No external model or texture assets.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { cm, REAL } from './scale';

export const FLUEBRICKS = {
  green: '#70ad16',
  body: '#8d8f84',
  labium: '#dedbd3',
  red: '#cf3423',
  orange: '#f26b1a',
  yellow: '#f0c400',
  void: '#1c1917',
} as const;

/** Shared by the physical model and the preprint schematic. */
export const FLUEBRICKS_SCHEMATIC = [
  FLUEBRICKS.green, FLUEBRICKS.body, FLUEBRICKS.red,
  FLUEBRICKS.orange, FLUEBRICKS.yellow,
] as const;

interface BuiltFlute extends THREE.Group { dispose: () => void }
const SEG = 24;

/** Annular extrusion, including radial end walls when a slot removes a sector. */
function tube(radius: number, length: number, gap = 0, segments = SEG) {
  const shape = new THREE.Shape();
  const inner = radius - cm(0.16);
  // In the cross-section +Y becomes −Z, the instrument's front face.
  const start = Math.PI / 2 + gap / 2;
  const end = start + Math.PI * 2 - gap;
  shape.absarc(0, 0, radius, start, end, false);
  if (gap) {
    shape.absarc(0, 0, inner, end, start, true);
    shape.closePath();
  } else {
    const bore = new THREE.Path();
    bore.absarc(0, 0, inner, 0, Math.PI * 2, true);
    shape.holes.push(bore);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: length, bevelEnabled: false, curveSegments: segments / 2, steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function createFluebricksFlute(): BuiltFlute {
  const group = new THREE.Group() as BuiltFlute;
  const owned: THREE.Mesh[] = [];
  let pieces: THREE.BufferGeometry[] = [];
  const add = (geometry: THREE.BufferGeometry, x = 0, y = 0, z = 0, turn = 0) => {
    geometry.rotateZ(turn);
    geometry.translate(x, y, z);
    pieces.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
  };
  const finish = (index: number, color: string) => {
    const geometry = mergeGeometries(pieces, false)!;
    pieces.forEach(piece => piece.dispose());
    pieces = [];
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color, roughness: 0.72, metalness: 0,
    }));
    mesh.name = `fluebricks-module-${index}`;
    mesh.userData.flueModule = index;
    mesh.castShadow = mesh.receiveShadow = true;
    owned.push(mesh);
    group.add(mesh);
  };

  const W = cm(REAL.fluebricks.width);
  const T = cm(REAL.fluebricks.thickness);
  const radius = cm(REAL.fluebricks.pipe) / 2;
  const wall = cm(0.16);

  // Eight-sided regulator with a mitered 40° bend, including a continuous open bore.
  const regulator = new THREE.BufferGeometry();
  const positions: number[] = [];
  const bend = Math.PI * 40 / 180;
  const neck = cm(1.25), arm = cm(1.6), r = cm(1.03);
  const rings = [
    { x: 0, y: 0, angle: 0 },
    { x: 0, y: -neck, angle: -bend / 2 },
    { x: -Math.sin(bend) * arm, y: -neck - Math.cos(bend) * arm, angle: -bend },
  ];
  const vertex = (ring: number, i: number, inner: boolean) => {
    const p = rings[ring], a = i * Math.PI / 4;
    const rad = inner ? r - wall : r;
    const across = Math.cos(a) * rad / (ring === 1 ? Math.cos(bend / 2) : 1);
    return [p.x + across * Math.cos(p.angle), p.y + across * Math.sin(p.angle), Math.sin(a) * rad];
  };
  const quad = (a: number[], b: number[], c: number[], d: number[]) => positions.push(...a, ...c, ...b, ...a, ...d, ...c);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 2; j++) {
      quad(vertex(j, i, false), vertex(j + 1, i, false), vertex(j + 1, i + 1, false), vertex(j, i + 1, false));
      quad(vertex(j, i + 1, true), vertex(j + 1, i + 1, true), vertex(j + 1, i, true), vertex(j, i, true));
    }
    quad(vertex(0, i + 1, false), vertex(0, i + 1, true), vertex(0, i, true), vertex(0, i, false));
    quad(vertex(2, i, false), vertex(2, i, true), vertex(2, i + 1, true), vertex(2, i + 1, false));
  }
  regulator.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  regulator.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(positions.length / 3 * 2), 2));
  regulator.computeVertexNormals();
  add(regulator);
  finish(0, FLUEBRICKS.green);

  // Chamfered housing, with a real deep window rather than a black surface decal.
  const bodyLen = cm(11.4), winY = cm(3.0), winH = cm(0.82), winW = cm(2.15);
  const shell = new THREE.Shape();
  shell.moveTo(-W / 2, 0);
  shell.lineTo(W / 2, 0); shell.lineTo(W / 2, bodyLen);
  shell.lineTo(-W / 2, bodyLen); shell.closePath();
  const aperture = new THREE.Path();
  aperture.moveTo(-winW / 2, winY - winH / 2);
  aperture.lineTo(-winW / 2, winY + winH / 2);
  aperture.lineTo(winW / 2, winY + winH / 2);
  aperture.lineTo(winW / 2, winY - winH / 2); aperture.closePath();
  shell.holes.push(aperture);
  add(new THREE.ExtrudeGeometry(shell, {
    depth: T - cm(0.18), bevelEnabled: true, bevelSize: cm(0.045),
    bevelThickness: cm(0.045), bevelSegments: 1, curveSegments: 1, steps: 1,
  }), 0, 0, -T / 2 + cm(0.045));
  add(new THREE.BoxGeometry(W, bodyLen, cm(0.09)), 0, bodyLen / 2, T / 2 - cm(0.045));
  // The splitting edge slopes inward, never protrudes as a white block.
  const lip = new THREE.Shape();
  lip.moveTo(0, 0); lip.lineTo(cm(0.45), 0); lip.lineTo(0, cm(0.55)); lip.closePath();
  const lipGeo = new THREE.ExtrudeGeometry(lip, { depth: winW, bevelEnabled: false, steps: 1 });
  lipGeo.rotateY(-Math.PI / 2);
  add(lipGeo, winW / 2, winY + winH / 2 - cm(0.12), -T / 2 + cm(0.08));
  finish(1, FLUEBRICKS.body);

  let y = bodyLen;
  const collar = () => {
    add(tube(radius * 0.9, cm(0.24)), 0, y);
    y += cm(0.24);
  };
  collar();
  // A missing front sector makes the tuning slot genuinely open through the wall.
  add(tube(radius, cm(0.5)), 0, y);
  add(tube(radius, cm(2.25), 0.36), 0, y + cm(0.5));
  add(tube(radius, cm(0.55)), 0, y + cm(2.75));
  y += cm(3.3);
  finish(2, FLUEBRICKS.red);

  collar();
  const branchLen = cm(2.8), portR = cm(1.05);
  add(tube(radius, cm(0.55)), 0, y);
  add(tube(radius, cm(1.7), 0.9), 0, y + cm(0.55));
  add(tube(radius, cm(0.55)), 0, y + cm(2.25));
  const boss = tube(portR, cm(1.35));
  boss.rotateX(-Math.PI / 2);
  add(boss, 0, y + branchLen / 2, -radius + cm(0.35));
  const rim = tube(portR + cm(0.075), cm(0.16));
  rim.rotateX(-Math.PI / 2);
  add(rim, 0, y + branchLen / 2, -radius - cm(0.85));
  y += branchLen;
  finish(3, FLUEBRICKS.orange);

  collar();
  add(tube(radius, cm(3.1)), 0, y);
  finish(4, FLUEBRICKS.yellow);

  group.dispose = () => owned.forEach(mesh => {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  });
  return group;
}
