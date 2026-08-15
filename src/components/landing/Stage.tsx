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
const DESK_FRAME = '#b9babc';
const EDGE_BAND = '#cdd0d2';

// Every dimension below comes from a real measurement through cm(). See scale.ts — before
// that module existed this desk worked out to 15 cm tall, which is why the MPC read as a
// giant slab on a footstool.
const DESK_W = cm(REAL.desk.width);
const DESK_D = cm(REAL.desk.depth);
const TOP_T = cm(REAL.desk.topThickness);
const DESK_HEIGHT = cm(REAL.desk.height);
const FLOOR_Y = DESK_TOP_Y - DESK_HEIGHT;

/**
 * A fine value-noise roughness map. A surface with perfectly uniform roughness reads as paper
 * no matter what colour it is; breaking it up by a few percent is most of what "material"
 * means at this scale, and it costs one canvas instead of an asset.
 */
const useRoughnessMap = (repeat: number, contrast: number) =>
  useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const img = ctx.createImageData(size, size);
    let seed = 7;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < size * size; i++) {
      const v = 255 - Math.round(rand() * contrast);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // Blur it so the grain reads as a surface finish rather than as digital noise.
    ctx.filter = 'blur(1.4px)';
    ctx.drawImage(canvas, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    return t;
  }, [repeat, contrast]);

/**
 * Light oak, drawn once into a canvas. Grain is a stack of long thin strokes of varying width
 * and darkness along one axis, plus a few wider figure bands; that is enough to read as timber
 * at this camera distance, and it means the desk stays procedural.
 */
const useWoodTexture = () =>
  useMemo(() => {
    const w = 512;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let seed = 21;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    ctx.fillStyle = '#c2a179';
    ctx.fillRect(0, 0, w, h);

    // Broad figure: slow tonal drift across the board.
    for (let i = 0; i < 14; i += 1) {
      const y = rand() * h;
      const band = 14 + rand() * 40;
      ctx.fillStyle = `rgba(150, 112, 70, ${0.05 + rand() * 0.07})`;
      ctx.fillRect(0, y, w, band);
    }

    // Grain lines.
    for (let i = 0; i < 420; i += 1) {
      const y = rand() * h;
      const thickness = 0.5 + rand() * 1.8;
      const alpha = 0.05 + rand() * 0.16;
      ctx.strokeStyle = rand() > 0.78 ? `rgba(233, 214, 186, ${alpha})` : `rgba(126, 92, 54, ${alpha})`;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      let x = 0;
      let cy = y;
      ctx.moveTo(x, cy);
      while (x < w) {
        x += 24 + rand() * 40;
        cy += (rand() - 0.5) * 3.2;
        ctx.lineTo(x, cy);
      }
      ctx.stroke();
    }

    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    // Grain runs the length of the desk, and the board is wider than it is deep.
    t.repeat.set(2.2, 1);
    t.anisotropy = 4;
    return t;
  }, []);

const Desk: React.FC = () => {
  const topY = DESK_TOP_Y - TOP_T / 2;
  const legH = DESK_HEIGHT - TOP_T;
  const floorY = FLOOR_Y;
  // Where the legs stand. Everything in the frame is measured from these, so the rails cannot
  // drift out of contact again.
  const legX = DESK_W / 2 - cm(7);
  const legZ = DESK_D / 2 - cm(7);
  const wood = useWoodTexture();
  const topRoughness = useRoughnessMap(5, 70);
  const bodyRoughness = useRoughnessMap(3, 40);

  useEffect(() => () => {
    topRoughness?.dispose();
    bodyRoughness?.dispose();
    wood?.dispose();
  }, [topRoughness, bodyRoughness, wood]);

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
        <meshPhysicalMaterial
          map={wood ?? undefined}
          color={wood ? '#ffffff' : DESK_TOP}
          roughness={0.62}
          roughnessMap={topRoughness ?? undefined}
          metalness={0}
          clearcoat={0.18}
          clearcoatRoughness={0.7}
          envMapIntensity={0.7}
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
            <mesh key={sz} position={[0, floorY + legH / 2, sz * legZ]} castShadow>
              <boxGeometry args={[cm(REAL.legSection), legH, cm(REAL.legSection)]} />
              <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.22} envMapIntensity={0.75} />
            </mesh>
          ))}
          <mesh position={[0, floorY + legH - cm(3), 0]} castShadow>
            <boxGeometry args={[cm(REAL.legSection * 0.9), cm(REAL.legSection * 0.9), legZ * 2]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.22} envMapIntensity={0.75} />
          </mesh>
          <mesh position={[0, floorY + cm(9), 0]} castShadow>
            <boxGeometry args={[cm(REAL.legSection * 0.8), cm(REAL.legSection * 0.8), legZ * 2]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.22} envMapIntensity={0.75} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, floorY + cm(9), -legZ]} castShadow>
        <boxGeometry args={[legX * 2, cm(3.5), cm(3.5)]} />
        <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.22} envMapIntensity={0.75} />
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
