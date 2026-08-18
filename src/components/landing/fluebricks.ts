/**
 * fluebricks.ts — the assembled kit from the product photo, not a striped recorder.
 *
 * The silhouette that survives at homepage size: a green air-regulator on a grey cuboid
 * generator with a fipple window and a proud labium (the splitting edge), then red (tuning slot), orange (branch boss) and a yellow
 * cap. The regulator is two faceted tubes with a hard 45° join, bent in X so the window stays
 * visible — a torus plumbing elbow was the wrong object.
 *
 * Local frame: +Y is length, elbow at the origin, window on −Z (faces up once the caller lays
 * the flute on the desk). The green air regulator stays on −Y — inline before the grey cuboid,
 * never folded back over the fipple. A sideways 45° arm read as sitting on the blow head once
 * the kit is laid down.
 *
 * Reads: scale.ts. No model files.
 */

import * as THREE from 'three';
import { cm, REAL } from './scale';

export const FLUEBRICKS = {
  green: '#32c94a',
  body: '#8d8f84',
  labium: '#dedbd3',
  red: '#e53935',
  orange: '#f26b1a',
  yellow: '#f0c400',
  void: '#1c1917',
} as const;

/** Same sequence the 3D flute uses, so the preprint schematic cannot drift. */
export const FLUEBRICKS_SCHEMATIC = [
  FLUEBRICKS.green,
  FLUEBRICKS.body,
  FLUEBRICKS.red,
  FLUEBRICKS.orange,
  FLUEBRICKS.yellow,
] as const;

const SEG = 18;

interface BuiltFlute extends THREE.Group {
  dispose: () => void;
}

const pla = (color: string) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.64,
    metalness: 0,
  });

export function createFluebricksFlute(): BuiltFlute {
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number],
    rotation?: [number, number, number],
  ) => {
    geos.push(geometry);
    mats.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  };

  const W = cm(REAL.fluebricks.width);
  const T = cm(REAL.fluebricks.thickness);
  const pipeR = cm(REAL.fluebricks.pipe) / 2;
  const tenonR = pipeR * 0.86;
  const joint = cm(0.24);
  const faceD = cm(0.45);

  // Air regulator — inline on −Y before the generator, mouth end away from the cuboid. Same
  // sequence as the paper schematic (green, then grey); no lateral arm over the fipple window.
  const tubeR = cm(1.05);
  const pegR = tubeR * 0.72;
  const pegH = cm(0.48);
  const stub = cm(1.2);
  const mouth = cm(1.5);
  const facet = 8;
  add(new THREE.CylinderGeometry(pegR, pegR, pegH, 12), pla(FLUEBRICKS.body), [0, -pegH / 2, 0]);
  add(
    new THREE.CylinderGeometry(tubeR, tubeR, stub, facet),
    pla(FLUEBRICKS.green),
    [0, -pegH - stub / 2, 0],
  );
  const mouthY = -pegH - stub - mouth / 2;
  add(
    new THREE.CylinderGeometry(tubeR, tubeR * 0.93, mouth, facet),
    pla(FLUEBRICKS.green),
    [0, mouthY, 0],
  );
  add(
    new THREE.CylinderGeometry(tubeR * 0.46, tubeR * 0.46, cm(0.1), facet),
    pla(FLUEBRICKS.void),
    [0, -pegH - stub - mouth + cm(0.05), 0],
  );

  // Grey cuboid. Horizontal fipple slit near the elbow, punched through the facade.
  const bodyLen = cm(12.4);
  add(
    new THREE.BoxGeometry(W, bodyLen, T - faceD),
    pla(FLUEBRICKS.body),
    [0, bodyLen / 2, faceD / 2],
  );

  const winW = cm(2.4);
  const winH = cm(0.72);
  const winY = cm(1.35);
  const facade = new THREE.Shape();
  facade.moveTo(-W / 2, 0);
  facade.lineTo(W / 2, 0);
  facade.lineTo(W / 2, bodyLen);
  facade.lineTo(-W / 2, bodyLen);
  facade.closePath();
  const aperture = new THREE.Path();
  aperture.moveTo(-winW / 2, winY - winH / 2);
  aperture.lineTo(-winW / 2, winY + winH / 2);
  aperture.lineTo(winW / 2, winY + winH / 2);
  aperture.lineTo(winW / 2, winY - winH / 2);
  aperture.closePath();
  facade.holes.push(aperture);
  const facadeGeo = new THREE.ExtrudeGeometry(facade, {
    depth: faceD,
    bevelEnabled: false,
    curveSegments: 1,
  });
  add(facadeGeo, pla(FLUEBRICKS.body), [0, 0, -T / 2]);

  add(
    new THREE.BoxGeometry(winW - cm(0.1), winH - cm(0.1), T - faceD),
    pla(FLUEBRICKS.void),
    [0, winY, faceD / 2],
  );

  // Labium: the far lip of the window, proud of the facade, sharp toward the jet.
  // The old flat bar sat on the near lip and read as a sticker, not a splitting edge.
  const labiumLen = cm(0.95);
  const labiumProud = cm(0.42);
  const labiumHw = (winW + cm(0.12)) / 2;
  const labium = new THREE.BufferGeometry();
  labium.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        -labiumHw, 0, -labiumProud,
        labiumHw, 0, -labiumProud,
        labiumHw, labiumLen, 0,
        -labiumHw, 0, -labiumProud,
        labiumHw, labiumLen, 0,
        -labiumHw, labiumLen, 0,
        -labiumHw, 0, 0,
        labiumHw, 0, 0,
        labiumHw, 0, -labiumProud,
        -labiumHw, 0, 0,
        labiumHw, 0, -labiumProud,
        -labiumHw, 0, -labiumProud,
        -labiumHw, 0, 0,
        -labiumHw, 0, -labiumProud,
        -labiumHw, labiumLen, 0,
        labiumHw, 0, -labiumProud,
        labiumHw, 0, 0,
        labiumHw, labiumLen, 0,
      ],
      3,
    ),
  );
  labium.computeVertexNormals();
  add(labium, pla('#dedbd3'), [0, winY + winH / 2, -T / 2]);

  let y = bodyLen;
  const collar = (color: string) => {
    add(new THREE.CylinderGeometry(tenonR, tenonR, joint, SEG), pla(color), [0, y + joint / 2, 0]);
    y += joint;
  };

  collar(FLUEBRICKS.red);

  // Red tuning node — vertical slot.
  const redLen = cm(3.4);
  add(new THREE.CylinderGeometry(pipeR, pipeR, redLen, SEG), pla(FLUEBRICKS.red), [0, y + redLen / 2, 0]);
  add(
    new THREE.BoxGeometry(cm(0.38), cm(2.1), cm(0.45)),
    pla(FLUEBRICKS.void),
    [0, y + redLen * 0.52, -pipeR + cm(0.08)],
  );
  y += redLen;
  collar(FLUEBRICKS.orange);

  // Orange branch node — circular side port.
  const orangeLen = cm(3.6);
  add(new THREE.CylinderGeometry(pipeR, pipeR, orangeLen, SEG), pla(FLUEBRICKS.orange), [0, y + orangeLen / 2, 0]);
  add(
    new THREE.CylinderGeometry(cm(0.85), cm(0.9), cm(1.5), SEG),
    pla(FLUEBRICKS.orange),
    [0, y + orangeLen * 0.48, -pipeR - cm(0.45)],
    [Math.PI / 2, 0, 0],
  );
  add(
    new THREE.CylinderGeometry(cm(0.42), cm(0.42), cm(0.22), 12),
    pla(FLUEBRICKS.void),
    [0, y + orangeLen * 0.48, -pipeR - cm(1.15)],
    [Math.PI / 2, 0, 0],
  );
  y += orangeLen;
  collar(FLUEBRICKS.yellow);

  const yellowLen = cm(2.3);
  add(
    new THREE.CylinderGeometry(pipeR * 0.98, pipeR * 0.92, yellowLen, SEG),
    pla(FLUEBRICKS.yellow),
    [0, y + yellowLen / 2, 0],
  );

  const built = group as BuiltFlute;
  built.dispose = () => {
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
  };
  return built;
}
