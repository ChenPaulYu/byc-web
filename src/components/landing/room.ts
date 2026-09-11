/**
 * room.ts — resource-owned enclosed daylight studio around the existing desk.
 * Owns the room envelope/palette, mixed Taipei apartment skyline and static material batches;
 * setCeilingLamp updates only the dedicated diffuser material in place.
 * Equipment is deliberately absent: Stage supplies its floor datum, DeskGear/Mpc keep theirs.
 * Owned plaster/fabric and facade/light maps add surface detail; exterior stays volumetric.
 * No new frame loop, billboard, external assets or extra shadow maps.
 * Reads: wood.ts for timber, wallDisplay.ts for note/flag composition, roomFinish.ts for architectural trim,
 * and Three geometry utilities.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createWoodMaps, WALNUT, type WoodMaps } from './wood';
import { WALL_DISPLAY } from './wallDisplay';
import { addRoomFinish, CEILING_LAMP_NAME, WALL_SWITCH_NAME } from './roomFinish';

export const ROOM = {
  width: 43, depth: 50, height: 38, back: -10, front: 40,
  paper: '#f5f2ed', plaster: '#e9e6df', timber: '#a68f76',
  metal: '#292d30', leather: '#73503b', linen: '#d5cfc2',
  warm: '#fff1d9', cool: '#f1f6fa',
  skyTop: '#b6cfdf', skyHorizon: '#eef1ef',
  wallShade: '#d4dad8',
  lighting: { ambient: 1.35, daylight: 2.1, bounce: 0.8, lamp: 12, windowReflection: 1.6, fillReflection: 1.0 },
  lamp: [17, 7, -3] as [number, number, number],
} as const;

interface Room extends THREE.Group { dispose(): void }
type Point = [number, number, number];
type PaintKind = 'wall' | 'rug' | 'paper' | 'grain' | 'weave' | 'facade' | 'lights' | 'glass';
type RoomTextures = Record<PaintKind, THREE.CanvasTexture | null>;

/** Four small working drawings share one atlas; wall sheets select a tile through their UVs. */
function paintResearchNotes(ctx: CanvasRenderingContext2D, s: number) {
  const tile = s / 2;
  ctx.fillStyle = ROOM.paper; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.translate((i % 2) * tile, Math.floor(i / 2) * tile);
    ctx.fillStyle = '#626b69'; ctx.font = '11px monospace';
    ctx.fillText(['AIR / SOUND', 'MODULE STUDY', 'PATCH NOTES', 'TONE STUDY'][i], 24, 30);
    ctx.strokeStyle = '#81958d'; ctx.lineWidth = 1.5;
    if (i % 2 === 0) {
      for (let part = 0; part < 4; part++) {
        ctx.strokeRect(44 + part * 39, 72 + (part % 2) * 5, 26, 65 - part * 7);
        ctx.beginPath(); ctx.moveTo(70 + part * 39, 104); ctx.lineTo(83 + part * 39, 104); ctx.stroke();
      }
    } else {
      ctx.beginPath();
      for (let x = 26; x < 230; x++) {
        const y = 109 + Math.sin(x * 0.13) * Math.sin(x * 0.015) * 27;
        if (x === 26) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#a2a39a';
    for (let line = 0; line < 7; line++) ctx.fillRect(24, 167 + line * 8, 185 - ((line + i) % 3) * 27, 1.4);
    ctx.restore();
  }
}

/** A building skin, not a city picture: each closed volume still owns its roof and silhouette. */
function paintFacade(ctx: CanvasRenderingContext2D, s: number, lightsOnly: boolean) {
  ctx.fillStyle = lightsOnly ? '#000000' : '#c7bfae'; ctx.fillRect(0, 0, s, s);
  if (!lightsOnly) {
    for (let y = 0; y < s; y += 16) {
      ctx.fillStyle = 'rgba(76,70,59,.16)';
      ctx.fillRect(0, y, s, 1);
      for (let x = (y % 32) / 2; x < s; x += 16) ctx.fillRect(x, y, 1, 16);
    }
  }
  for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) {
    const x = 40 + col * 156, y = 28 + row * 96, lit = false;
    if (!lightsOnly) {
      ctx.fillStyle = '#8c9290'; ctx.fillRect(x - 5, y - 4, 112, 67);
      ctx.fillStyle = '#ddd7c9'; ctx.fillRect(x - 5, y + 63, 113, 4);
    }
    ctx.fillStyle = lit ? '#dab687' : lightsOnly ? '#000000' : '#526666';
    ctx.fillRect(x, y, 102, 61);
    if (!lightsOnly || lit) {
      ctx.fillStyle = lightsOnly ? '#000000' : '#75888c';
      ctx.fillRect(x + 49, y, 4, 61);
      ctx.fillRect(x, y + 24, 102, 3);
      // Partly drawn curtains, not identical glowing squares.
      ctx.fillStyle = lightsOnly ? '#5a4936' : lit ? '#b89c79' : '#50646b';
      ctx.fillRect(x + 3, y + 3, 20 + row * 3, 56);
      if (!lightsOnly) {
        // Older apartments mix enclosed balconies, security grilles and window AC units.
        if ((row + col) % 3 !== 1) {
          ctx.fillStyle = '#a9aca3';
          for (let bar = 10; bar < 102; bar += 13) ctx.fillRect(x + bar, y + 2, 2, 58);
          ctx.fillRect(x, y + 44, 102, 2);
        }
        if ((row * 2 + col) % 3 === 0) {
          ctx.fillStyle = '#d8d8c8'; ctx.fillRect(x + 65, y + 42, 42, 23);
          ctx.strokeStyle = '#828b83'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x + 79, y + 53, 8, 0, Math.PI * 2); ctx.stroke();
          for (let fin = 0; fin < 5; fin++) ctx.fillRect(x + 91, y + 44 + fin * 4, 12, 1);
        }
        ctx.fillStyle = 'rgba(74,70,58,.07)';
        ctx.fillRect(x - 5, y + 67, 8 + col * 4, 15 + row * 2);
      }
    }
  }
}

/** Deterministic paint; texture generation also works with no DOM in geometry tests. */
function painting(kind: PaintKind): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const s = canvas.width;
  let seed = 31;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  if (kind === 'glass') {
    // One tier's curtain wall: fine mullions, not the neighborhood's residential windows.
    ctx.fillStyle = '#537f7e'; ctx.fillRect(0, 0, s, s);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 16; col++) {
      ctx.fillStyle = `rgba(197,226,224,${0.04 + random() * 0.12})`;
      ctx.fillRect(col * s / 16 + 1, row * s / 8 + 1, s / 16 - 2, s / 8 - 2);
    }
    ctx.fillStyle = '#91afaa';
    for (let x = 0; x < s; x += s / 16) ctx.fillRect(x, 0, 1.5, s);
    for (let y = 0; y < s; y += s / 8) ctx.fillRect(0, y, s, 2);
  } else if (kind === 'facade' || kind === 'lights') {
    paintFacade(ctx, s, kind === 'lights');
  } else if (kind === 'weave') {
    const pixels = ctx.createImageData(s, s);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const i = (y * s + x) * 4;
      const thread = Math.cos(x * Math.PI / 4) * Math.cos(y * Math.PI / 4);
      const shade = 180 + thread * 28 + (random() - 0.5) * 10;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
  } else if (kind === 'grain') {
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 22000; i++) {
      const shade = Math.floor(112 + random() * 32);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(random() * s, random() * s, 1, 1);
    }
  } else if (kind === 'wall') {
    ctx.fillStyle = ROOM.plaster; ctx.fillRect(0, 0, s, s);
    const light = ctx.createRadialGradient(s * 0.15, s * 0.22, 0, s * 0.15, s * 0.22, s);
    light.addColorStop(0, ROOM.paper); light.addColorStop(0.5, ROOM.plaster); light.addColorStop(1, ROOM.wallShade);
    ctx.fillStyle = light; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 17000; i++) {
      ctx.fillStyle = random() > 0.5 ? 'rgba(255,255,255,.025)' : 'rgba(40,30,20,.015)';
      ctx.fillRect(random() * s, random() * s, 1, 1);
    }
    const foot = ctx.createLinearGradient(0, s * 0.8, 0, s);
    foot.addColorStop(0, 'transparent'); foot.addColorStop(1, 'rgba(30,20,15,.08)');
    ctx.fillStyle = foot; ctx.fillRect(0, 0, s, s);
  } else if (kind === 'rug') {
    ctx.fillStyle = ROOM.linen; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 3) {
      ctx.fillStyle = i % 2 ? '#bab3a5' : '#e2dcd0'; ctx.fillRect(i, 0, 1, s);
      ctx.fillStyle = 'rgba(55,43,30,.18)'; ctx.fillRect(0, i, s, 1);
    }
    ctx.strokeStyle = '#665b4c'; ctx.lineWidth = 3;
    ctx.strokeRect(12, 12, s - 24, s - 24); ctx.strokeRect(20, 20, s - 40, s - 40);
  } else {
    paintResearchNotes(ctx, s);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = kind === 'grain' || kind === 'weave' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (kind === 'grain' || kind === 'weave') {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(kind === 'grain' ? 5 : 2, kind === 'grain' ? 5 : 2);
  }
  texture.anisotropy = 4;
  if (kind === 'glass') { texture.wrapS = THREE.RepeatWrapping; texture.repeat.x = 4; }
  return texture;
}

function builder() {
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: Point, rotation: Point = [0, 0, 0]) => {
    // Keep timber figure at a physical scale on long shelves, short boards and the door.
    // Material maps share these UVs so color, relief and finish stay registered.
    if (material.userData.timber) {
      const vertices = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
      const uv = geometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) {
        const x = vertices.getX(i) + position[0], y = vertices.getY(i) + position[1], z = vertices.getZ(i) + position[2];
        const nx = Math.abs(normals.getX(i)), ny = Math.abs(normals.getY(i));
        uv.setXY(i, (nx > 0.5 ? z : x) / 14, (ny > 0.5 ? z : y) / 4);
      }
    }
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...rotation)));
    geometry.translate(...position);
    const source = geometry.index ? geometry.toNonIndexed() : geometry;
    if (source !== geometry) geometry.dispose();
    const list = batches.get(material) ?? [];
    list.push(source); batches.set(material, list);
  };
  const box = (size: Point, position: Point, material: THREE.Material, bevel = 0.05, rotation?: Point) =>
    add(new RoundedBoxGeometry(...size, 1, bevel), material, position, rotation);
  const rod = (a: Point, b: Point, radius: number, material: THREE.Material) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), dir = end.clone().sub(start);
    const geometry = new THREE.CylinderGeometry(radius, radius, dir.length(), 8);
    geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
    add(geometry, material, start.add(end).multiplyScalar(0.5).toArray() as Point);
  };
  return { add, box, rod, batches };
}
type Builder = ReturnType<typeof builder>;
type Materials = ReturnType<typeof materials>;

function materials(textures: RoomTextures, timber: WoodMaps | null) {
  const standard = (color: string, map: THREE.Texture | null = null) => new THREE.MeshStandardMaterial({ color, map, roughness: 0.88 });
  const exterior = (name: string, color: string) => {
    const material = standard(color);
    if (['near', 'near-brick', 'middle', 'far'].includes(name)) {
      material.map = textures.facade;
      material.emissive.set(name.startsWith('near') ? ROOM.warm : ROOM.skyHorizon);
      material.emissiveIntensity = name.startsWith('near') ? 0.3 : name === 'middle' ? 0.22 : 0.5;
      material.emissiveMap = name.startsWith('near') ? textures.lights : null;
      if (name === 'far') material.map = textures.glass;
    }
    material.name = `exterior-${name}`;
    material.userData.exterior = true;
    return material;
  };
  const wood = new THREE.MeshStandardMaterial({ color: timber ? '#ffffff' : ROOM.timber, map: timber?.map ?? null,
    normalMap: timber?.normalMap ?? null, normalScale: new THREE.Vector2(0.12, 0.12), roughnessMap: timber?.roughnessMap ?? null, roughness: 0.95 });
  wood.userData.timber = true;
  const landmark = exterior('taipei-101', '#81b1aa');
  landmark.map = textures.glass;
  landmark.emissive.set(ROOM.skyHorizon); landmark.emissiveIntensity = 0.08;
  landmark.roughness = 0.48; landmark.metalness = 0.2;
  return {
    wall: new THREE.MeshStandardMaterial({ color: textures.wall ? '#ffffff' : ROOM.plaster, map: textures.wall,
      roughness: 0.97, bumpMap: textures.grain, bumpScale: 0.012 }),
    edge: new THREE.MeshStandardMaterial({ color: ROOM.plaster, roughness: 0.97, bumpMap: textures.grain, bumpScale: 0.012 }),
    ceiling: new THREE.MeshStandardMaterial({ color: ROOM.paper, roughness: 0.98, bumpMap: textures.grain, bumpScale: 0.008 }),
    reveal: standard(ROOM.wallShade),
    wallSwitch: new THREE.MeshStandardMaterial({ name: WALL_SWITCH_NAME, color: ROOM.paper, roughness: 0.7 }),
    ceilingLamp: new THREE.MeshStandardMaterial({ name: CEILING_LAMP_NAME, color: ROOM.paper,
      emissive: ROOM.warm, emissiveIntensity: 1, roughness: 0.85 }),
    wood,
    darkWood: standard('#463a2e'), metal: new THREE.MeshStandardMaterial({ color: ROOM.metal, roughness: 0.38, metalness: 0.5 }), leather: standard(ROOM.leather),
    rug: new THREE.MeshStandardMaterial({ color: '#ffffff', map: textures.rug, roughness: 1, bumpMap: textures.weave, bumpScale: 0.025 }),
    cloth: new THREE.MeshStandardMaterial({ color: '#4c5148', roughness: 1, bumpMap: textures.weave, bumpScale: 0.025 }),
    curtain: new THREE.MeshStandardMaterial({ color: ROOM.paper, roughness: 0.98, side: THREE.DoubleSide,
      bumpMap: textures.weave, bumpScale: 0.025 }),
    paper: standard('#ffffff', textures.paper), tape: standard('#ba9b69'),
    bookBlue: standard('#425363'), bookRed: standard('#76503d'), bookCream: standard('#c3b393'),
    near: exterior('near', '#e3dacb'), nearBrick: exterior('near-brick', '#bd9785'),
    middle: exterior('middle', '#dad9d0'), far: exterior('far', '#c1d2d0'),
    trim: exterior('trim', '#65736f'), roof: exterior('roof', '#6f847d'),
    windows: exterior('windows', ROOM.warm), landmark, landmarkTrim: exterior('taipei-101-trim', '#a5bdb4'),
    glow: new THREE.MeshBasicMaterial({ color: ROOM.warm }),
  };
}

function architecture(b: Builder, m: Materials, floor: number) {
  const left = -ROOM.width / 2, right = ROOM.width / 2, y = floor + ROOM.height / 2;
  const centerZ = (ROOM.back + ROOM.front) / 2;
  b.box([ROOM.width + 1, 0.8, ROOM.depth + 1], [0, floor - 0.4, centerZ], m.darkWood, 0.12);
  for (let row = 0; row < ROOM.depth / 2; row++) {
    for (let col = 0; col < 3; col++) {
      b.box([ROOM.width / 3 - 0.035, 0.15, 1.965],
        [-ROOM.width / 3 + col * ROOM.width / 3, floor + 0.075, ROOM.back + 1 + row * 2], m.wood, 0.015);
    }
  }
  b.box([ROOM.width, ROOM.height, 0.75], [0, y, ROOM.back], m.wall, 0.12);
  // All six surfaces enclose the visitor; the only opening is the physical left window.
  b.box([ROOM.width, ROOM.height, 0.75], [0, y, ROOM.front], m.edge, 0.12);
  b.box([0.75, ROOM.height, ROOM.depth], [right, y, centerZ], m.edge, 0.12);
  b.box([ROOM.width + 0.75, 0.6, ROOM.depth + 0.75], [0, floor + ROOM.height, centerZ], m.ceiling, 0.08);
  // The window is a physical opening surrounded by four plaster piers.
  b.box([0.75, 12, ROOM.depth], [left, floor + 6, centerZ], m.edge, 0.12);
  b.box([0.75, 2, ROOM.depth], [left, floor + 37, centerZ], m.edge, 0.12);
  b.box([0.75, 24, 4], [left, floor + 24, -8], m.edge, 0.12);
  b.box([0.75, 24, ROOM.front - 17], [left, floor + 24, (ROOM.front + 17) / 2], m.edge, 0.12);
  b.box([ROOM.width, 0.75, 0.3], [0, floor + 0.6, ROOM.back + 0.45], m.darkWood);
  for (const x of [left + 0.45, right - 0.45]) {
    b.box([0.3, 0.75, ROOM.depth], [x, floor + 0.6, centerZ], m.darkWood);
    b.box([0.3, 0.35, ROOM.depth], [x, floor + ROOM.height - 0.6, centerZ], m.ceiling);
  }
  b.box([ROOM.width, 0.75, 0.3], [0, floor + 0.6, ROOM.front - 0.45], m.darkWood);
  // A closed timber door and a framed print make looking behind feel like the same room.
  b.box([10, 28, 0.3], [8, floor + 14, ROOM.front - 0.5], m.wood);
  for (const x of [2.7, 13.3]) b.box([0.5, 28.5, 0.55], [x, floor + 14.25, ROOM.front - 0.7], m.darkWood);
  b.box([11, 0.5, 0.55], [8, floor + 28.5, ROOM.front - 0.7], m.darkWood);
  b.rod([11.4, floor + 13, ROOM.front - 1], [12.4, floor + 13, ROOM.front - 1], 0.12, m.metal);
  b.box([0.3, 9, 7], [right - 0.5, floor + 25, 23], m.darkWood);
  b.box([0.05, 8, 6], [right - 0.7, floor + 25, 23], m.paper);
  // The opening looks into real exterior space; no surface spans the window.
  for (const z of [-6, 5.5, 17]) b.box([0.8, 24, 0.28], [left + 0.35, floor + 24, z], m.metal);
  for (const h of [12, 36]) b.box([0.8, 0.35, 23.5], [left + 0.35, floor + h, 5.5], m.metal);
  b.box([2.4, 0.4, 24.5], [left + 0.6, floor + 11.8, 5.5], m.wood);
  for (let i = 0; i < 8; i++) b.box([0.55, 0.26, 24], [left + 0.6, floor + 36 - i * 0.32, 5.5], m.darkWood);
  // Narrow gathered linen leaves the view open; folded geometry catches grazing window light.
  for (const z of [-5.3, 16.3]) {
    const curtain = new THREE.PlaneGeometry(2.3, 22, 20, 1);
    const positions = curtain.getAttribute('position');
    for (let i = 0; i < positions.count; i++) positions.setZ(i, Math.cos(positions.getX(i) * 12) * 0.16);
    curtain.computeVertexNormals();
    b.add(curtain, m.curtain, [left + 0.9, floor + 24.4, z], [0, Math.PI / 2, 0]);
  }
  b.box([0.75, ROOM.height, 0.9], [right, y, ROOM.back], m.edge, 0.12);
  b.box([27, 0.1, 22], [0.5, floor + 0.23, 10], m.rug, 0.04);
}

function furniture(b: Builder, m: Materials, floor: number, desk: number) {
  // Shelves and books sit above the existing right speaker, leaving the MPC untouched.
  for (const height of [10, 15.5]) {
    const y = desk + height;
    b.box([15, 0.45, 3], [11.8, y, ROOM.back + 1.8], m.wood);
    for (const x of [6.5, 17]) b.box([0.22, 2.2, 2], [x, y - 1, ROOM.back + 1.3], m.metal);
    for (let i = 0; i < 8; i++) {
      const h = 3.5 + (i % 3) * 0.6, x = 5.5 + i * 0.72;
      b.box([0.5, h, 1.9], [x, y + h / 2 + 0.25, ROOM.back + 1.7], [m.bookBlue, m.bookCream, m.bookRed][i % 3], 0.025);
      b.box([0.32, 0.06, 0.03], [x, y + 1, ROOM.back + 2.68], m.tape, 0.01);
      b.add(new THREE.BoxGeometry(0.42, 0.055, 1.6), m.bookCream,
        [x, y + h + 0.28, ROOM.back + 1.76]);
    }
    for (let i = 0; i < 3; i++) b.box([3.3, 0.55, 2.1], [15.7, y + 0.5 + i * 0.6, ROOM.back + 1.7], i % 2 ? m.bookBlue : m.bookCream);
  }
  // A compact note cluster bridges the left cloth flag and right shelves.
  for (let i = 0; i < 5; i++) {
    const notes = WALL_DISPLAY.notes;
    const x = notes.x[i % 2], y = desk + notes.aboveDesk[Math.floor(i / 2)];
    const sheet = new THREE.BoxGeometry(notes.width, notes.height, 0.035), uv = sheet.getAttribute('uv');
    for (let vertex = 0; vertex < uv.count; vertex++)
      uv.setXY(vertex, (uv.getX(vertex) + i % 2) / 2, (uv.getY(vertex) + Math.floor((i % 4) / 2)) / 2);
    b.add(sheet, m.paper, [x, y, ROOM.back + 0.41], [0, 0, (i - 2) * 0.035]);
    b.box([0.65, 0.3, 0.04], [x, y + notes.height / 2, ROOM.back + 0.45], m.tape, 0.01);
  }
  // Empty chair is offset, so its back cannot obscure the physical pads.
  const cx = -7, cz = 15;
  b.box([8, 1.1, 7], [cx, floor + 8, cz], m.leather, 0.35);
  b.box([8, 7, 1.2], [cx, floor + 12, cz + 3.1], m.leather, 0.4, [-0.12, 0, 0]);
  b.rod([cx, floor + 1.2, cz], [cx, floor + 7.8, cz], 0.35, m.metal);
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5, x = cx + Math.sin(a) * 4.4, z = cz + Math.cos(a) * 4.4;
    b.rod([cx, floor + 1.3, cz], [x, floor + 0.65, z], 0.17, m.metal);
    b.add(new THREE.SphereGeometry(0.38, 8, 6), m.metal, [x, floor + 0.5, z]);
  }
  for (const side of [-1, 1]) {
    b.rod([cx + side * 3.8, floor + 8, cz], [cx + side * 4.1, floor + 10.5, cz], 0.13, m.metal);
    b.box([0.65, 0.3, 4.5], [cx + side * 4.1, floor + 10.6, cz], m.wood, 0.12);
  }
  b.box([3.5, 5.5, 0.22], [cx + 1, floor + 11.8, cz + 3.8], m.cloth, 0.08, [-0.13, 0, 0]);
  // Narrow side cabinet accommodates the task lamp without moving existing equipment.
  b.box([4, 15, 6], [17, floor + 7.7, -3], m.darkWood, 0.12);
  b.box([5, 0.4, 7], [17, desk - 0.25, -3], m.wood);
  b.add(new THREE.CylinderGeometry(1.1, 1.25, 0.25, 20), m.metal, [17, desk + 0.1, -3]);
  b.rod([17, desk + 0.2, -3], [18, desk + 5.5, -4], 0.12, m.metal);
  b.rod([18, desk + 5.5, -4], ROOM.lamp, 0.12, m.metal);
  b.add(new THREE.ConeGeometry(1.35, 1.65, 24, 1, true), m.metal, ROOM.lamp);
  b.add(new THREE.CircleGeometry(1.1, 24), m.glow, [ROOM.lamp[0], ROOM.lamp[1] - 0.8, ROOM.lamp[2]], [Math.PI / 2, 0, 0]);
  // A few low-cost routed cables connect the desk to the room.
  for (let i = 0; i < 3; i++) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5 + i, desk, -6), new THREE.Vector3(-5 + i, floor + 7, -7),
      new THREE.Vector3(-8 + i, floor + 0.4, -7), new THREE.Vector3(-18, floor + 0.4, -5 + i),
    ]);
    b.add(new THREE.TubeGeometry(curve, 16, 0.055, 5, false), m.metal, [0, 0, 0]);
  }
}

/** Building volumes retain real depth; facade maps add detail without extra window meshes. */
function neighborhood(b: Builder, m: Materials, floor: number) {
  // Art-directed distant Taipei landmark, not a claim of a surveyed studio location.
  // Eight outward-flaring square tiers remain recognizable from either side of the window.
  const tx = -120, tz = -25;
  const tier = (bottom: number, top: number, height: number, y: number) => {
    const geometry = new THREE.CylinderGeometry(top / Math.SQRT2, bottom / Math.SQRT2, height, 4);
    b.add(geometry, m.landmark, [tx, floor + y, tz], [0, Math.PI / 4, 0]);
  };
  tier(10, 7.6, 12, 6);
  for (let i = 0; i < 8; i++) {
    const y = 12 + i * 4;
    const top = 8.8 - i * 0.18, bottom = top * 0.86;
    tier(bottom, top, 3.82, y + 1.91);
    tier(top + 0.12, top + 0.12, 0.18, y + 3.91);
    // Slim corner ribs and projecting ornaments articulate the bamboo-like joints.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      b.rod([tx + sx * bottom / 2, floor + y, tz + sz * bottom / 2],
        [tx + sx * top / 2, floor + y + 3.82, tz + sz * top / 2], 0.035, m.landmarkTrim);
      b.add(new THREE.BoxGeometry(0.22, 0.3, 0.22), m.landmarkTrim,
        [tx + sx * top / 2, floor + y + 3.84, tz + sz * top / 2]);
    }
  }
  // The crown steps inward before its narrow mast; it is not one long pyramid.
  tier(4.6, 3.4, 2.4, 45.2);
  tier(3.2, 3.8, 3.1, 47.95);
  tier(3.9, 3.9, 0.2, 49.6);
  tier(2.2, 1.5, 2.3, 50.85);
  b.add(new THREE.CylinderGeometry(0.045, 0.19, 6, 8), m.landmarkTrim, [tx, floor + 55, tz]);
  for (const side of [-1, 1]) {
    b.add(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 20), m.landmarkTrim,
      [tx + side * 3.93, floor + 10.8, tz], [0, 0, Math.PI / 2]);
    b.add(new THREE.CylinderGeometry(0.72, 0.72, 0.12, 20), m.landmarkTrim,
      [tx, floor + 10.8, tz + side * 3.93], [Math.PI / 2, 0, 0]);
  }
  const block = (size: Point, position: Point, material: THREE.Material) => {
    const geometry = new THREE.BoxGeometry(...size);
    if (material === m.near || material === m.nearBrick || material === m.middle || material === m.far) {
      const uv = geometry.getAttribute('uv');
      for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.01, 0.01);
    }
    b.add(geometry, material, position);
  };
  for (let layer = 0; layer < 3; layer++) {
    const x = -33 - layer * 12;
    for (let i = 0; i < 2; i++) {
      const material = layer === 0 ? (i === 0 ? m.near : m.nearBrick) : layer === 1 ? m.middle : m.far;
      const z = -2 + i * 12 - layer * 10;
      const height = [16, 20, 26][layer] + ((i * 7 + layer * 3) % 9);
      const width = 8 + i % 3, depth = 10;
      const roof = floor + height;
      const body = new THREE.BoxGeometry(width, height, depth);
      // Roof/bottom sample plain concrete, not the facade's windows (BoxGeometry faces 2/3).
      const uv = body.getAttribute('uv');
      for (let vertex = 8; vertex < 16; vertex++) uv.setXY(vertex, 0.01, 0.01);
      b.add(body, material, [x, floor + height / 2, z]);
      // Parapets wrap every roof, rather than presenting only a camera-facing facade.
      for (const side of [-1, 1]) {
        block([0.22, 0.7, depth], [x + side * width / 2, roof + 0.35, z], material);
        block([width, 0.7, 0.22], [x, roof + 0.35, z + side * depth / 2], material);
      }
      if (layer > 0) continue;
      // Rooftop access, water tank and small air-conditioning units supply a lived-in scale.
      block([3, 2.5, 3.5], [x - 1, roof + 1.25, z - 2], material);
      block([3.8, 0.16, 4.2], [x - 1, roof + 2.6, z - 2], m.roof);
      b.add(new THREE.CylinderGeometry(0.85, 0.85, 2.1, 10), m.trim, [x + 1, roof + 1.05, z + 2]);
      for (const ring of [0.15, 0.75, 1.4, 2])
        b.add(new THREE.CylinderGeometry(0.88, 0.88, 0.06, 10), m.landmarkTrim, [x + 1, roof + ring, z + 2]);
      b.add(new THREE.ConeGeometry(0.87, 0.25, 10), m.landmarkTrim, [x + 1, roof + 2.22, z + 2]);
      // Shallow stacked balconies give side views real depth; fine grille detail stays in the map.
      for (let level = 0; level < 4; level++) {
        const by = floor + 2.5 + level * (height / 5), face = x + width / 2;
        block([1.1, 0.16, 4], [face + 0.5, by, z - 1.7], material);
        block([0.12, 0.65, 4], [face + 1, by + 0.38, z - 1.7], m.trim);
        block([1.1, 0.65, 0.12], [face + 0.5, by + 0.38, z - 3.65], m.trim);
        if (level === 3) block([1.4, 0.12, 4.4], [face + 0.6, by + 2.2, z - 1.7], m.roof);
      }
      for (const side of [-1, 1])
        block([0.08, 0.12, 1.2], [x + side * (width / 2 + 0.06), roof - 7.1, z], m.windows);
      block([0.7, 0.75, 1.4], [x + width / 2 + 0.4, roof - 4, z + 2.7], material);
      block([1.6, 0.18, 5], [x + width / 2 + 0.8, roof - 7, z], material);
      block([0.12, 1, 5], [x + width / 2 + 1.55, roof - 6.5, z], m.trim);
    }
  }
}

/** Switch only the diffuser; its resources and all other room materials retain their identity. */
export function setCeilingLamp(room: THREE.Object3D, on: boolean) {
  const lens = room.getObjectByName(CEILING_LAMP_NAME) as THREE.Mesh | undefined;
  if (!lens) return;
  const material = lens.material as THREE.MeshStandardMaterial;
  material.emissiveIntensity = on ? 1 : 0;
}

export function createRoom(floor: number, desk: number): Room {
  const group = new THREE.Group() as Room;
  group.name = 'blue-hour-room';
  const textures: RoomTextures = { wall: painting('wall'), rug: painting('rug'), paper: painting('paper'),
    grain: painting('grain'), weave: painting('weave'), facade: painting('facade'), lights: painting('lights'), glass: painting('glass') };
  // Room joinery is lighter than the original walnut desk, keeping the equipment in focus.
  const timber = typeof document === 'undefined' ? null : createWoodMaps({ ...WALNUT,
    light: [166, 143, 118], dark: [116, 96, 74], size: 512, repeat: [1, 1], relief: 0.3 });
  const m = materials(textures, timber), b = builder();
  m.wall.name = 'studio-plaster'; m.wood.name = 'studio-walnut'; m.curtain.name = 'window-linen';
  m.reveal.name = 'studio-architectural-reveal';
  architecture(b, m, floor); furniture(b, m, floor, desk);
  addRoomFinish(b, m, ROOM, floor);
  neighborhood(b, m, floor);
  b.batches.forEach((pieces, material) => {
    const geometry = mergeGeometries(pieces, false)!;
    pieces.forEach(piece => piece.dispose());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = material.name;
    mesh.userData.exterior = Boolean(material.userData.exterior);
    mesh.castShadow = !mesh.userData.exterior && !(material instanceof THREE.MeshBasicMaterial);
    // Plaster already has broad painted light; keep hard equipment silhouettes off its finish.
    mesh.receiveShadow = material !== m.wall && material !== m.edge && material !== m.ceiling;
    group.add(mesh);
  });
  group.dispose = () => {
    group.children.forEach(child => (child as THREE.Mesh).geometry.dispose());
    Object.values(m).forEach(material => material.dispose());
    Object.values(textures).forEach(texture => texture?.dispose());
    timber?.dispose();
  };
  return group;
}
