/**
 * wood.ts — procedural timber: colour, relief and finish, all read out of one drawing of grain.
 *
 * The desk top is the remaining caller.
 *
 * The design decision worth keeping: real timber is one structure showing three ways. The grain
 * is darker, it sits slightly lower because the soft early wood wears down, and its open pores
 * scatter light more than the polished surface between them. So the grain is drawn once into a
 * height field and the colour, normal and roughness maps are all read out of that same field.
 * They cannot drift out of register with each other, because there is only one of them. The
 * version this replaces drew grain into a colour map and took roughness from unrelated value
 * noise with no normal map at all, which is a picture of timber on a flat plane — light had
 * nothing to catch on and it read as painted card however good the picture got.
 *
 * Reads: nothing. No texture files; every map is drawn into a canvas at runtime.
 */

import * as THREE from 'three';

export interface WoodMaps {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  dispose: () => void;
}

export interface WoodOptions {
  /** The colour of clear timber between the grain. */
  light: [number, number, number];
  /** The colour the darkest latewood reaches. */
  dark: [number, number, number];
  /** Texture repeats, x then y. Grain runs along x. */
  repeat: [number, number];
  /** Vary to get a different board from the same species. */
  seed?: number;
  /** Pixels between growth rings, before the squared-random spread. Smaller reads as finer. */
  ringPitch?: number;
  /** How hard the relief pushes. The grain is shallow in reality; this is not. */
  relief?: number;
  /** Pixels on a side. 512 is enough at homepage distance; 1024 was a hitch drawing three maps. */
  size?: number;
}

export function createWoodMaps({
  light,
  dark,
  repeat,
  seed = 21,
  ringPitch = 48,
  relief = 3.4,
  size = 512,
}: WoodOptions): WoodMaps | null {
  const grain = document.createElement('canvas');
  grain.width = grain.height = size;
  const gctx = grain.getContext('2d');
  if (!gctx) return null;

  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  // --- the one drawing: white is proud and polished, black is deep and open ---
  gctx.fillStyle = '#ffffff';
  gctx.fillRect(0, 0, size, size);

  // Growth rings, not stripes. Drawing independently wandering lines at even spacing comes out
  // looking like decking, because real rings do the opposite on both counts: neighbours formed
  // together and arc together, and they cluster tight with occasional wide bands of clear timber
  // between. So neighbours share one warp, and the spacing is a squared random.
  const waves = Array.from({ length: 5 }, () => ({
    frequency: 0.3 + rand() * 2.2,
    amplitude: 6 + rand() * 34,
    phase: rand() * Math.PI * 2,
  }));
  const warpAt = (x: number, drift: number) =>
    waves.reduce(
      (sum, w) => sum + Math.sin((x / size) * Math.PI * 2 * w.frequency + w.phase + drift) * w.amplitude,
      0,
    );

  // Deliberately coarser and stronger than the real thing. These surfaces render small — the desk
  // is about two hundred pixels across — so grain at true scale is sub-pixel and averages away to
  // a flat plane, which is what a correctly-scaled first attempt did.
  for (let y = 0; y < size; ) {
    y += ringPitch * 0.19 + rand() ** 2 * ringPitch;
    // The arc changes slowly down the board, so the figure is not one repeated curve.
    const drift = (y / size) * 1.5;
    const latewood = rand() > 0.55;
    gctx.lineWidth = latewood ? 2.6 + rand() * 5 : 1 + rand() * 1.8;
    gctx.strokeStyle = `rgba(0,0,0,${latewood ? 0.34 + rand() * 0.38 : 0.12 + rand() * 0.2})`;
    gctx.beginPath();
    for (let x = 0; x <= size; x += 8) {
      const yy = y + warpAt(x, drift);
      if (x === 0) gctx.moveTo(x, yy);
      else gctx.lineTo(x, yy);
    }
    gctx.stroke();
  }

  // Open pores: short dark dashes lying along the grain. These separate an open-grained timber
  // from a smooth close-grained one, and they are the detail the roughness map lives on.
  gctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (let i = 0; i < 2600; i += 1) {
    gctx.fillRect(rand() * size, rand() * size, 2 + rand() * 9, 1);
  }

  const field = gctx.getImageData(0, 0, size, size).data;
  const heightAt = (x: number, y: number) =>
    field[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;

  const colour = document.createElement('canvas');
  const normal = document.createElement('canvas');
  const rough = document.createElement('canvas');
  colour.width = colour.height = normal.width = normal.height = rough.width = rough.height = size;
  const cctx = colour.getContext('2d');
  const nctx = normal.getContext('2d');
  const rctx = rough.getContext('2d');
  if (!cctx || !nctx || !rctx) return null;

  const cImg = cctx.createImageData(size, size);
  const nImg = nctx.createImageData(size, size);
  const rImg = rctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const h = heightAt(x, y);
      const t = 1 - h;

      cImg.data[i] = light[0] + (dark[0] - light[0]) * t;
      cImg.data[i + 1] = light[1] + (dark[1] - light[1]) * t;
      cImg.data[i + 2] = light[2] + (dark[2] - light[2]) * t;
      cImg.data[i + 3] = 255;

      // Central differences on the height field give the surface slope.
      const dx = (heightAt(x + 1, y) - heightAt(x - 1, y)) * relief;
      const dy = (heightAt(x, y + 1) - heightAt(x, y - 1)) * relief;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      nImg.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      nImg.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      nImg.data[i + 2] = (1 / len) * 0.5 * 255 + 127;
      nImg.data[i + 3] = 255;

      // Pores scatter, the polished surface between them does not.
      const r = 255 * (0.42 + t * 0.45);
      rImg.data[i] = rImg.data[i + 1] = rImg.data[i + 2] = r;
      rImg.data[i + 3] = 255;
    }
  }

  cctx.putImageData(cImg, 0, 0);
  nctx.putImageData(nImg, 0, 0);
  rctx.putImageData(rImg, 0, 0);

  const make = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(canvas);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 8;
    return t;
  };

  const map = make(colour, true);
  const normalMap = make(normal, false);
  const roughnessMap = make(rough, false);

  return {
    map,
    normalMap,
    roughnessMap,
    dispose: () => {
      map.dispose();
      normalMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/** Walnut — the desk. Dark enough that a grey chassis reads as a silhouette on it. */
export const WALNUT: Pick<WoodOptions, 'light' | 'dark'> = {
  light: [133, 110, 90],
  dark: [76, 62, 50],
};
