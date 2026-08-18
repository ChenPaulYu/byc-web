/**
 * fiftyLan.tsx — a 3D 50 Lan 手搖杯, with the real print taken off the product photo.
 *
 * The drink is geometry: tapered cup, film lid, ice, foam. Tea colour and the brown artwork
 * are both read off `/landing/fifty-lan.jpg` so they cannot drift off the product shot.
 *
 * Origin is the bottom centre. Logo faces +Z (the chair).
 *
 * Reads: /landing/fifty-lan.jpg · scale.ts
 */

import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { cm, REAL } from './scale';

const PHOTO = '/landing/fifty-lan.jpg';

const FOAM = '#f4f1e8';
const ICE = '#d9eef0';
const PLASTIC = '#eaf0f3';
const FILM = '#f3f5f6';

interface BuiltCup extends THREE.Group {
  dispose: () => void;
}

interface PhotoParts {
  print: THREE.CanvasTexture | null;
  tea: THREE.Color;
}

const FALLBACK_TEA = new THREE.Color('#dcc430');

const readPhoto = (img: HTMLImageElement): PhotoParts => {
  const src = document.createElement('canvas');
  src.width = img.width;
  src.height = img.height;
  const ctx = src.getContext('2d');
  if (!ctx) return { print: null, tea: FALLBACK_TEA.clone() };
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, src.width, src.height);
  const { data, width, height } = image;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = 0;
  let teaR = 0;
  let teaG = 0;
  let teaB = 0;
  let teaN = 0;
  const y0 = Math.floor(height * 0.38);
  const y1 = Math.floor(height * 0.72);
  const x0 = Math.floor(width * 0.22);
  const x1 = Math.floor(width * 0.78);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const p = i / 4;
    const x = p % width;
    const y = (p / width) | 0;
    const print = lum < 92 && r < 125 && g < 115;
    if (print) {
      found += 1;
      data[i + 3] = 255;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      continue;
    }
    data[i + 3] = 0;
    if (x < x0 || x > x1 || y < y0 || y > y1) continue;
    if (lum < 110 || lum > 210) continue;
    if (g < 90 || r < 80 || b > g) continue;
    teaR += r;
    teaG += g;
    teaB += b;
    teaN += 1;
  }

  let print: THREE.CanvasTexture | null = null;
  if (found >= 400) {
    ctx.putImageData(image, 0, 0);
    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const wrap = document.createElement('canvas');
    wrap.width = 1024;
    wrap.height = 512;
    const wctx = wrap.getContext('2d');
    if (wctx) {
      const destH = 300;
      const destW = (cw / ch) * destH;
      wctx.drawImage(src, minX, minY, cw, ch, (wrap.width - destW) / 2, 90, destW, destH);
      print = new THREE.CanvasTexture(wrap);
      print.colorSpace = THREE.SRGBColorSpace;
      print.anisotropy = 8;
    }
  }

  let tea = FALLBACK_TEA.clone();
  if (teaN > 80) {
    const r = teaR / teaN;
    const g = teaG / teaN;
    const b = teaB / teaN;
    const gray = (r + g + b) / 3;
    const punch = 1.18;
    const clip = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    tea = new THREE.Color().setStyle(
      `rgb(${clip(gray + (r - gray) * punch)},${clip(gray + (g - gray) * punch)},${clip(gray + (b - gray) * punch)})`,
    );
  }
  return { print, tea };
};

function createFiftyLanCup(print: THREE.CanvasTexture | null, teaColor: THREE.Color): BuiltCup {
  const group = new THREE.Group();
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number],
    rotation?: [number, number, number],
    cast = false,
  ) => {
    geos.push(geometry);
    if (!mats.includes(material)) mats.push(material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = cast;
    group.add(mesh);
    return mesh;
  };

  const topR = cm(REAL.mug.diameter) / 2;
  const botR = cm(REAL.mug.bottom) / 2;
  const filmH = cm(0.22);
  const cupH = cm(REAL.mug.height) - filmH;
  const wall = cm(0.18);
  const segs = 32;
  const radiusAt = (t: number) => botR + (topR - botR) * t;

  const plastic = new THREE.MeshStandardMaterial({
    color: PLASTIC,
    roughness: 0.28,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const tea = new THREE.MeshStandardMaterial({
    color: teaColor,
    roughness: 0.2,
    metalness: 0,
    transparent: true,
    opacity: 0.74,
  });
  const foam = new THREE.MeshStandardMaterial({ color: FOAM, roughness: 0.92, metalness: 0 });
  const ice = new THREE.MeshStandardMaterial({
    color: ICE,
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const film = new THREE.MeshStandardMaterial({
    color: FILM,
    roughness: 0.16,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const ridge = new THREE.MeshStandardMaterial({
    color: '#e3eaee',
    roughness: 0.22,
    metalness: 0,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  mats.push(plastic, tea, foam, ice, film, ridge);

  const liquidH = cupH * 0.9;
  const innerTop = (topR - wall) * 0.95;
  const innerBot = (botR - wall) * 0.95;
  add(new THREE.CylinderGeometry(innerTop, innerBot, liquidH, segs), tea, [0, wall + liquidH / 2, 0]);
  add(
    new THREE.CylinderGeometry(innerTop * 0.97, innerTop * 0.97, cm(0.22), segs),
    foam,
    [0, wall + liquidH - cm(0.04), 0],
  );

  const cubes: [number, number, number, number, number, number, number][] = [
    [-0.3, 0.18, 0.1, 1.2, 0.5, 0.8, 0.2],
    [0.28, 0.32, -0.2, 1.05, 0.2, -0.4, 0.6],
    [0.04, 0.48, 0.3, 1.25, -0.3, 0.5, 0.1],
    [-0.22, 0.6, -0.24, 0.95, 0.7, 0.2, -0.3],
    [0.2, 0.72, 0.06, 1.15, 0.4, -0.6, 0.3],
    [-0.06, 0.82, 0.22, 1.05, -0.2, 0.3, 0.5],
    [0.14, 0.4, -0.32, 0.9, 0.6, 0.1, -0.4],
    [-0.34, 0.52, 0.18, 0.85, 0.3, -0.5, 0.4],
  ];
  for (const [nx, ny, nz, s, rx, ry, rz] of cubes) {
    const size = cm(s);
    const y = wall + ny * liquidH;
    const r = innerBot + (innerTop - innerBot) * ny;
    add(new THREE.BoxGeometry(size, size * 0.72, size * 0.88), ice, [nx * r, y, nz * r], [rx, ry, rz]);
  }

  add(new THREE.CylinderGeometry(topR, botR, cupH, segs, 1, true), plastic, [0, cupH / 2, 0], undefined, true);
  add(new THREE.CircleGeometry(botR, segs), plastic, [0, 0.001, 0], [-Math.PI / 2, 0, 0], true);

  for (const t of [0.07, 0.13, 0.9, 0.96]) {
    const r = radiusAt(t);
    add(new THREE.CylinderGeometry(r + cm(0.045), r + cm(0.04), cm(0.09), segs, 1, true), ridge, [0, t * cupH, 0]);
  }

  if (print) {
    const wrapMat = new THREE.MeshBasicMaterial({
      map: print,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    mats.push(wrapMat);
    const wrapMesh = add(
      new THREE.CylinderGeometry(topR * 1.012, botR * 1.012, cupH * 0.72, segs, 1, true),
      wrapMat,
      [0, cupH * 0.5, 0],
    );
    wrapMesh.rotation.y = Math.PI / 2;
  }

  add(new THREE.TorusGeometry(topR, cm(0.08), 6, segs), film, [0, cupH, 0], [Math.PI / 2, 0, 0], true);
  add(new THREE.CircleGeometry(topR * 0.98, segs), film, [0, cupH + filmH * 0.35, 0], [-Math.PI / 2, 0, 0]);

  const built = group as BuiltCup;
  built.dispose = () => {
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
  };
  return built;
}

export function FiftyLanCup() {
  const [print, setPrint] = useState<THREE.CanvasTexture | null>(null);
  const [tea, setTea] = useState(() => FALLBACK_TEA.clone());

  useEffect(() => {
    let cancelled = false;
    let texture: THREE.CanvasTexture | null = null;
    const img = new Image();
    img.src = PHOTO;
    img.onload = () => {
      const parts = readPhoto(img);
      if (cancelled) {
        parts.print?.dispose();
        return;
      }
      texture = parts.print;
      setPrint(parts.print);
      setTea(parts.tea);
    };
    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, []);

  const cup = useMemo(() => createFiftyLanCup(print, tea), [print, tea]);
  useEffect(() => () => cup.dispose(), [cup]);

  return <primitive object={cup} />;
}
