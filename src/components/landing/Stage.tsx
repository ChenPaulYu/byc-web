/**
 * Builds the desk vignette the MPC sits on: a workspace seen from behind an empty chair,
 * floating in a soft grey void with no walls or floor edge.
 *
 * An all-near-white set gives the eye nothing to separate forms against, so one surface has to
 * carry weight. That is the desk top: a warm light oak, drawn as a canvas texture at runtime.
 * Near-black was tried first and read as heavy and airless; wood holds the same structural job
 * while putting back the warmth the scene lost when the chair was removed, and a cheap wooden
 * desk is the right register for bedroom recording anyway.
 *
 * Reads: site-style neutrals · scale.ts for every dimension. No texture files, no generated
 * meshes; the wood, the backdrop and the ground fade are all drawn into canvases at runtime.
 */

import React, { useEffect, useMemo } from 'react';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cm, REAL } from './scale';

/** Matches the MPC chassis bottom: its group sits at y = -1 with a box of height 1 below. */
export const DESK_TOP_Y = -2;

const DESK_TOP = '#3f4043';
const DESK_BODY = '#d8d9da';
const DESK_FRAME = '#8d8f92';
// Brackets and feet, a step darker than the tube so the joints read as separate parts rather
// than as the frame simply getting thicker.
const FRAME_DARK = '#54565a';
const EDGE_BAND = '#6b563f';

// Every dimension below comes from a real measurement through cm(). See scale.ts — before
// that module existed this desk worked out to 15 cm tall, which is why the MPC read as a
// giant slab on a footstool.
const DESK_W = cm(REAL.desk.width);
const DESK_D = cm(REAL.desk.depth);
const TOP_T = cm(REAL.desk.topThickness);
const DESK_HEIGHT = cm(REAL.desk.height);
const FLOOR_Y = DESK_TOP_Y - DESK_HEIGHT;

/**
 * Light oak: colour, relief and finish, all derived from one drawing of the grain.
 *
 * The version this replaces drew grain into a colour map and then took its roughness from an
 * unrelated field of value noise, with no normal map at all — so the wood was a *picture* of
 * timber printed on a perfectly flat, uniformly rough plane. Light had nothing to catch on and
 * the desk read as painted card however good the picture got.
 *
 * Real timber has one structure showing three ways: the grain is darker, it sits slightly lower
 * because the soft early wood wears down, and its open pores scatter light more than the polished
 * surface between them. So the grain is drawn once into a height field, and the colour map, the
 * normal map and the roughness map are all read out of that same field. Nothing can drift out of
 * register with anything else, because there is only one thing.
 */
const useWoodMaps = () =>
  useMemo(() => {
    const size = 1024;
    const grain = document.createElement('canvas');
    grain.width = grain.height = size;
    const gctx = grain.getContext('2d');
    if (!gctx) return null;

    let seed = 21;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // --- the one drawing: white is proud and polished, black is deep and open ---
    gctx.fillStyle = '#ffffff';
    gctx.fillRect(0, 0, size, size);

    // Growth rings, not stripes. The first attempt drew 620 independently wandering lines at
    // even spacing and came out looking like decking: neighbouring lines went their own way, and
    // regular spacing reads as manufactured. Real grain does the opposite on both counts, so
    // this shares one warp between neighbours — rings that formed together arc together — and
    // spaces them by a squared random, which clusters most lines tight and leaves occasional
    // wide bands of clear timber between.
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

    // Deliberately coarser and stronger than real oak. The desk renders about two hundred pixels
    // across, so seventy centimetres of depth land in roughly sixty pixels: grain at true scale
    // is sub-pixel and averages away to a flat plane, which is exactly what the first two
    // attempts did — one too fine to survive, one so fine it vanished entirely.
    for (let y = 0; y < size; ) {
      y += 9 + rand() ** 2 * 48;
      // The arc slowly changes down the board, so the figure is not one repeated curve.
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

    // Open pores: short dark dashes lying along the grain. These are what separate oak from a
    // smooth close-grained timber, and they are the detail the roughness map lives on.
    gctx.fillStyle = 'rgba(0,0,0,0.5)';
    for (let i = 0; i < 2600; i += 1) {
      gctx.fillRect(rand() * size, rand() * size, 2 + rand() * 9, 1);
    }

    const field = gctx.getImageData(0, 0, size, size).data;
    const heightAt = (x: number, y: number) =>
      field[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;

    // --- colour: tint the height field, so dark grain is also darker wood ---
    const colour = document.createElement('canvas');
    colour.width = colour.height = size;
    const cctx = colour.getContext('2d');
    const normal = document.createElement('canvas');
    normal.width = normal.height = size;
    const nctx = normal.getContext('2d');
    const rough = document.createElement('canvas');
    rough.width = rough.height = size;
    const rctx = rough.getContext('2d');
    if (!cctx || !nctx || !rctx) return null;

    const cImg = cctx.createImageData(size, size);
    const nImg = nctx.createImageData(size, size);
    const rImg = rctx.createImageData(size, size);

    // Walnut, not oak, and the reason is measured rather than aesthetic. On the light oak the
    // MPC's cream chassis rendered at luminance 177 against a desk at 161 — sixteen points, six
    // percent — and their red channels were within four of each other, so the hero separated from
    // its background almost entirely on a faint difference in blue. That is the whole silhouette
    // resting on the one channel a viewer is least sensitive to. Darker timber gives it about
    // seventy points instead. Paler or greyer wood was considered first and is worse on both
    // counts: paler closes the gap, greyer removes the hue difference that was carrying it.
    const LIGHT = [138, 105, 74];
    const DARK = [74, 52, 34];
    const STRENGTH = 3.4; // how hard the relief pushes; the grain is shallow in reality

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4;
        const h = heightAt(x, y);

        const t = 1 - h;
        cImg.data[i] = LIGHT[0] + (DARK[0] - LIGHT[0]) * t;
        cImg.data[i + 1] = LIGHT[1] + (DARK[1] - LIGHT[1]) * t;
        cImg.data[i + 2] = LIGHT[2] + (DARK[2] - LIGHT[2]) * t;
        cImg.data[i + 3] = 255;

        // Central differences on the height field give the surface slope.
        const dx = (heightAt(x + 1, y) - heightAt(x - 1, y)) * STRENGTH;
        const dy = (heightAt(x, y + 1) - heightAt(x, y - 1)) * STRENGTH;
        const len = Math.sqrt(dx * dx + dy * dy + 1);
        nImg.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
        nImg.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
        nImg.data[i + 2] = (1 / len) * 0.5 * 255 + 127;
        nImg.data[i + 3] = 255;

        // Pores scatter, the polished surface between them does not.
        const r = 255 * (0.42 + (1 - h) * 0.45);
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
      // Grain runs the length of the desk, and the board is wider than it is deep.
      t.repeat.set(2.2, 1);
      t.anisotropy = 8;
      return t;
    };

    return { map: make(colour, true), normalMap: make(normal, false), roughnessMap: make(rough, false) };
  }, []);

const Desk: React.FC = () => {
  const topY = DESK_TOP_Y - TOP_T / 2;
  const legH = DESK_HEIGHT - TOP_T;
  const floorY = FLOOR_Y;
  // Where the legs stand. Everything in the frame is measured from these, so the rails cannot
  // drift out of contact again.
  const legX = DESK_W / 2 - cm(7);
  const legZ = DESK_D / 2 - cm(7);
  const wood = useWoodMaps();

  useEffect(() => () => {
    wood?.map.dispose();
    wood?.normalMap.dispose();
    wood?.roughnessMap.dispose();
  }, [wood]);

  return (
    <group>
      {/* A wider bevel than the geometry strictly needs: the highlight it catches along the
          front edge is what separates the top from the void behind it. */}
      <RoundedBox
        args={[DESK_W, TOP_T, DESK_D]}
        radius={0.09}
        smoothness={6}
        position={[0, topY, 0]}
        castShadow
        receiveShadow
      >
        {/* Anisotropy is the reason this is a physical material rather than a standard one: wood
            reflects in a streak along its grain instead of a round highlight, which is most of
            what tells the eye "timber" before it can resolve a single grain line. The rotation
            aligns that streak with the direction the grain was drawn in. */}
        <meshPhysicalMaterial
          map={wood?.map}
          normalMap={wood?.normalMap}
          normalScale={new THREE.Vector2(0.8, 0.8)}
          roughnessMap={wood?.roughnessMap}
          color={wood ? '#ffffff' : DESK_TOP}
          roughness={1}
          metalness={0}
          anisotropy={0.55}
          anisotropyRotation={Math.PI / 2}
          clearcoat={0.22}
          clearcoatRoughness={0.62}
          envMapIntensity={0.8}
        />
      </RoundedBox>

      {/* Laminate edge banding: a pale rim sitting just under the dark surface. It is the
          detail that says cheap flat-pack rather than solid timber, and it draws a highlight
          line all the way round the silhouette, which a single dark slab never gets. */}
      <RoundedBox
        args={[DESK_W + 0.06, 0.11, DESK_D + 0.06]}
        radius={0.04}
        smoothness={3}
        position={[0, DESK_TOP_Y - TOP_T + 0.03, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={EDGE_BAND} roughness={0.66} metalness={0.03} envMapIntensity={0.85} />
      </RoundedBox>

      {/* Square-tube end frames with a rear stretcher.
          Rail lengths are derived from where the legs actually stand, not from the desk size
          minus a tuned constant. The previous version used numbers fitted to a desk half this
          size, so after the rescale the rails no longer reached the legs and the frame read as
          broken apart. Deriving them means the frame survives any future change to REAL.desk. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * legX, 0, 0]}>
          {[-1, 1].map((sz) => (
            <group key={sz} position={[0, 0, sz * legZ]}>
              <mesh position={[0, floorY + legH / 2, 0]} castShadow>
                <boxGeometry args={[cm(REAL.legSection), legH, cm(REAL.legSection)]} />
                <meshPhysicalMaterial color={DESK_FRAME} roughness={0.55} metalness={0.06} envMapIntensity={0.3} />
              </mesh>

              {/* Where the leg meets the top. A real desk has a plate here with the fixings
                  through it; a bare tube ending against a board is the tell that nobody worked
                  out how it is held together. It is also what hides the seam where the leg and
                  the edge banding pass through each other. */}
              <mesh position={[0, floorY + legH - cm(0.5), 0]} castShadow receiveShadow>
                <boxGeometry args={[cm(REAL.legSection * 2.1), cm(1), cm(REAL.legSection * 2.1)]} />
                <meshPhysicalMaterial color={FRAME_DARK} roughness={0.48} metalness={0.12} envMapIntensity={0.35} />
              </mesh>

              {/* Foot. The leg used to stop dead at the floor, which reads as a shape resting on
                  a plane rather than as furniture standing on one — and the contact shadow needs
                  something to sit under. */}
              <mesh position={[0, floorY + cm(0.6), 0]} castShadow>
                <cylinderGeometry args={[cm(2.4), cm(2.7), cm(1.2), 12]} />
                <meshPhysicalMaterial color={FRAME_DARK} roughness={0.72} metalness={0.05} envMapIntensity={0.25} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, floorY + legH - cm(3), 0]} castShadow>
            <boxGeometry args={[cm(REAL.legSection * 0.9), cm(REAL.legSection * 0.9), legZ * 2]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.55} metalness={0.06} envMapIntensity={0.3} />
          </mesh>
          <mesh position={[0, floorY + cm(9), 0]} castShadow>
            <boxGeometry args={[cm(REAL.legSection * 0.8), cm(REAL.legSection * 0.8), legZ * 2]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.55} metalness={0.06} envMapIntensity={0.3} />
          </mesh>
          {[-1, 1].map((sz) => (
            <mesh key={sz} position={[0, floorY + cm(9), sz * (legZ - cm(3))]} castShadow>
              <boxGeometry args={[cm(REAL.legSection * 1.1), cm(REAL.legSection * 1.1), cm(1.6)]} />
              <meshPhysicalMaterial color={FRAME_DARK} roughness={0.5} metalness={0.1} envMapIntensity={0.32} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, floorY + cm(9), -legZ]} castShadow>
        <boxGeometry args={[legX * 2, cm(3.5), cm(3.5)]} />
        <meshPhysicalMaterial color={DESK_FRAME} roughness={0.55} metalness={0.06} envMapIntensity={0.3} />
      </mesh>

    </group>
  );
};



const useBackdrop = () => {
  const { scene } = useThree();
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 4;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#d9dade');
    grad.addColorStop(0.55, '#e9eaec');
    grad.addColorStop(1, '#f7f7f8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 4, 512);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(() => {
    if (!texture) return;
    const previous = scene.background;
    scene.background = texture;
    return () => {
      scene.background = previous;
      texture.dispose();
    };
  }, [scene, texture]);
};

/** A ground disc whose alpha falls off at the rim, so the floor never shows an edge. */
const useGround = () =>
  useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 128);
    grad.addColorStop(0, 'rgba(238,239,241,1)');
    grad.addColorStop(0.55, 'rgba(240,241,243,0.9)');
    grad.addColorStop(1, 'rgba(247,247,248,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

export const Stage: React.FC = () => {
  useBackdrop();
  const ground = useGround();
  const floorY = DESK_TOP_Y - TOP_T - 2.6;

  useEffect(() => () => { ground?.dispose(); }, [ground]);

  return (
    <group>
      <mesh position={[0, floorY, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[52, 36]} />
        <meshStandardMaterial color="#ffffff" roughness={0.97} metalness={0} map={ground ?? undefined} transparent />
      </mesh>

      <Desk />

      <ContactShadows position={[0, floorY + 0.01, 1.2]} opacity={0.34} scale={34} blur={2.6} far={7} />
      <ContactShadows position={[0, DESK_TOP_Y + 0.01, 0]} opacity={0.26} scale={18} blur={1.6} far={4} />
    </group>
  );
};
