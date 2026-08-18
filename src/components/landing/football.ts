/**
 * football.ts — a Telstar: round, black pentagons, white hexagons, thin seams.
 *
 * The identity is still a truncated icosahedron, but the first version inset the panels so far
 * they read as tiles on a gem, not leather on a ball. Vertices stay on the sphere, seams are a
 * hairline of the bladder showing through, and each panel is subdivided so the silhouette is
 * round at homepage size.
 *
 * Reads: nothing. No texture files.
 */

import * as THREE from 'three';

interface BuiltBall extends THREE.Group {
  dispose: () => void;
}

const PHI = (1 + Math.sqrt(5)) / 2;

const ICO_VERTS: [number, number, number][] = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];

const ICO_FACES: [number, number, number][] = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
];

const WHITE = '#f4f1ea';
const BLACK = '#121212';
const SEAM = '#1c1c1c';

const pla = (color: string, roughness: number) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
  });

const neighborsOf = (vertex: number) => {
  const found = new Set<number>();
  for (const [a, b, c] of ICO_FACES) {
    if (a === vertex) {
      found.add(b);
      found.add(c);
    } else if (b === vertex) {
      found.add(a);
      found.add(c);
    } else if (c === vertex) {
      found.add(a);
      found.add(b);
    }
  }
  return [...found];
};

const orderAround = (axis: THREE.Vector3, pts: THREE.Vector3[]) => {
  const n = axis.clone().normalize();
  const ref = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const t = new THREE.Vector3().crossVectors(n, ref).normalize();
  const b = new THREE.Vector3().crossVectors(n, t);
  return pts
    .map((p) => {
      const d = p.clone().sub(axis);
      return { p, ang: Math.atan2(d.dot(b), d.dot(t)) };
    })
    .sort((a, c) => a.ang - c.ang)
    .map((x) => x.p);
};

const onSphere = (v: THREE.Vector3, radius: number) => v.normalize().multiplyScalar(radius);

const insetCorners = (corners: THREE.Vector3[], gap: number, radius: number) => {
  const c = new THREE.Vector3();
  corners.forEach((v) => c.add(v));
  c.multiplyScalar(1 / corners.length);
  return corners.map((v) => onSphere(v.clone().lerp(c, gap), radius));
};

/** Fan + two splits, every vertex reprojected so the panel is a spherical cap, not a flat tile. */
const sphericalPanel = (corners: THREE.Vector3[], radius: number) => {
  const mid = new THREE.Vector3();
  corners.forEach((v) => mid.add(v));
  onSphere(mid.multiplyScalar(1 / corners.length), radius);

  const positions: number[] = [];
  const normals: number[] = [];
  const push = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    const na = a.clone().normalize();
    const nb = b.clone().normalize();
    const nc = c.clone().normalize();
    normals.push(na.x, na.y, na.z, nb.x, nb.y, nb.z, nc.x, nc.y, nc.z);
  };
  const split = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, depth: number) => {
    if (depth === 0) {
      push(a, b, c);
      return;
    }
    const ab = onSphere(a.clone().add(b), radius);
    const bc = onSphere(b.clone().add(c), radius);
    const ca = onSphere(c.clone().add(a), radius);
    split(a, ab, ca, depth - 1);
    split(b, bc, ab, depth - 1);
    split(c, ca, bc, depth - 1);
    split(ab, bc, ca, depth - 1);
  };
  for (let i = 0; i < corners.length; i += 1) {
    split(mid, corners[i], corners[(i + 1) % corners.length], 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geo;
};

export function createFootball(radius: number): BuiltBall {
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
    geos.push(geometry);
    mats.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    group.add(mesh);
  };

  const ico = ICO_VERTS.map(([x, y, z]) => new THREE.Vector3(x, y, z).normalize());
  const onto = (v: THREE.Vector3) => onSphere(v, radius);
  const third = 1 / 3;
  const gap = 0.032;

  add(new THREE.SphereGeometry(radius * 0.992, 24, 16), pla(SEAM, 0.82));

  const white = pla(WHITE, 0.62);
  const black = pla(BLACK, 0.55);
  mats.push(white, black);

  for (let i = 0; i < ico.length; i += 1) {
    const v = ico[i];
    const corners = insetCorners(
      orderAround(v, neighborsOf(i).map((j) => v.clone().lerp(ico[j], third))).map(onto),
      gap,
      radius,
    );
    const geo = sphericalPanel(corners, radius);
    geos.push(geo);
    const mesh = new THREE.Mesh(geo, black);
    mesh.castShadow = true;
    group.add(mesh);
  }

  for (const [a, b, c] of ICO_FACES) {
    const va = ico[a];
    const vb = ico[b];
    const vc = ico[c];
    const corners = insetCorners(
      [
        va.clone().lerp(vb, third),
        vb.clone().lerp(va, third),
        vb.clone().lerp(vc, third),
        vc.clone().lerp(vb, third),
        vc.clone().lerp(va, third),
        va.clone().lerp(vc, third),
      ].map(onto),
      gap,
      radius,
    );
    const geo = sphericalPanel(corners, radius);
    geos.push(geo);
    const mesh = new THREE.Mesh(geo, white);
    mesh.castShadow = true;
    group.add(mesh);
  }

  const built = group as BuiltBall;
  built.dispose = () => {
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
  };
  return built;
}
