/**
 * Builds the desk vignette the MPC sits on: a workspace seen from behind an empty chair,
 * floating in a soft grey void with no walls or floor edge.
 *
 * The structure comes from one dark surface. An all-near-white set has nothing for the eye to
 * separate forms against, so the desk top carries the site's ink tone while everything else
 * stays in the neutral range — the same white-canvas/dark-text relationship the rest of the
 * site uses, stood up in three dimensions.
 *
 * Reads: site-style neutrals · one warm accent on the chair. No texture files, no generated
 * meshes; both gradients are drawn into a canvas at runtime.
 */

import React, { useEffect, useMemo } from 'react';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/** Matches the MPC chassis bottom: its group sits at y = -1 with a box of height 1 below. */
export const DESK_TOP_Y = -2;

const DESK_TOP = '#3f4043';
const DESK_BODY = '#d8d9da';
const DESK_FRAME = '#b9babc';
const EDGE_BAND = '#cdd0d2';
const SEAT = '#c08a5e';
const SEAT_FRAME = '#9fa1a4';
const POT = '#f0f0ef';
const LEAF = '#8fae86';

const DESK_W = 17.2;
const DESK_D = 9.6;
const TOP_T = 0.34;

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

const Desk: React.FC = () => {
  const topY = DESK_TOP_Y - TOP_T / 2;
  const legH = 2.6;
  const floorY = DESK_TOP_Y - TOP_T - legH;
  const topRoughness = useRoughnessMap(5, 70);
  const bodyRoughness = useRoughnessMap(3, 40);

  useEffect(() => () => {
    topRoughness?.dispose();
    bodyRoughness?.dispose();
  }, [topRoughness, bodyRoughness]);

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
          color={DESK_TOP}
          roughness={0.48}
          roughnessMap={topRoughness ?? undefined}
          metalness={0.12}
          clearcoat={0.35}
          clearcoatRoughness={0.55}
          envMapIntensity={0.9}
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

      {/* Square-tube end frames with a rear stretcher. A pedestal of drawers reads as an
          office; an open frame with a shelf under it reads as a room someone lives in. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (DESK_W / 2 - 0.9), 0, 0]}>
          {[-1, 1].map((sz) => (
            <mesh key={sz} position={[0, floorY + legH / 2, sz * (DESK_D / 2 - 0.9)]} castShadow>
              <boxGeometry args={[0.22, legH, 0.22]} />
              <meshPhysicalMaterial color={DESK_FRAME} roughness={0.34} metalness={0.62} envMapIntensity={1.15} />
            </mesh>
          ))}
          <mesh position={[0, floorY + legH - 0.11, 0]} castShadow>
            <boxGeometry args={[0.2, 0.2, DESK_D - 1.6]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.34} metalness={0.62} envMapIntensity={1.15} />
          </mesh>
          <mesh position={[0, floorY + 0.3, 0]} castShadow>
            <boxGeometry args={[0.18, 0.18, DESK_D - 1.6]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.34} metalness={0.62} envMapIntensity={1.15} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, floorY + 0.3, -DESK_D / 2 + 0.9]} castShadow>
        <boxGeometry args={[DESK_W - 2.0, 0.16, 0.16]} />
        <meshPhysicalMaterial color={DESK_FRAME} roughness={0.34} metalness={0.62} envMapIntensity={1.15} />
      </mesh>

      {/* Under-desk shelf on the left, with things stacked on it. */}
      <group position={[-DESK_W / 2 + 3.4, 0, 0]}>
        <RoundedBox
          args={[5.6, 0.16, DESK_D - 1.9]}
          radius={0.04}
          smoothness={3}
          position={[0, floorY + 1.15, 0]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={DESK_BODY}
            roughness={0.74}
            roughnessMap={bodyRoughness ?? undefined}
            metalness={0.04}
            envMapIntensity={0.8}
          />
        </RoundedBox>
        {[
          { x: -1.5, w: 2.0, h: 0.9, c: '#cfd1cd', r: 0.05 },
          { x: 0.55, w: 1.7, h: 1.25, c: '#c4c7cb', r: -0.08 },
          { x: 2.1, w: 1.2, h: 0.7, c: '#dad7d0', r: 0.11 },
        ].map((b) => (
          <mesh
            key={b.x}
            position={[b.x, floorY + 1.23 + b.h / 2, 0.15]}
            rotation={[0, b.r, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[b.w, b.h, DESK_D - 3.2]} />
            <meshStandardMaterial color={b.c} roughness={0.9} metalness={0} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/**
 * The chair does the narrative work. Back to the camera, pushed slightly out from the desk, it
 * puts the viewer behind someone who has just stepped away — an empty desk is an object, an
 * empty chair at a desk is a person. It also carries the scene's only warm colour.
 */
const Chair: React.FC = () => {
  const floorY = DESK_TOP_Y - TOP_T - 2.6;
  const seatY = DESK_TOP_Y - 1.15;

  return (
    // Sits on the line between the camera and the desk, so it reads as the shoulder the view
    // is looking over rather than as another object beside the desk. Rotated to face the desk
    // centre from wherever it stands.
    <group position={[4.2, 0, DESK_D / 2 + 1.5]} scale={0.9} rotation={[0, 0.52, 0]}>
      {/* Seat, with a thinner front lip so the profile is not a uniform slab. */}
      <RoundedBox args={[2.9, 0.4, 2.6]} radius={0.18} smoothness={4} position={[0, seatY, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={SEAT} roughness={0.72} metalness={0.02} clearcoat={0.26} clearcoatRoughness={0.6} envMapIntensity={0.85} />
      </RoundedBox>
      <RoundedBox args={[2.75, 0.22, 0.55]} radius={0.1} smoothness={3} position={[0, seatY - 0.07, -1.15]} castShadow>
        <meshPhysicalMaterial color={SEAT} roughness={0.74} metalness={0.02} clearcoat={0.24} envMapIntensity={0.85} />
      </RoundedBox>

      {/* The back is a separate panel held off the seat by a spine. That gap, and the kink
          between lumbar and shoulder panels, is what makes a shape read as a task chair
          rather than as a bench with a board behind it. */}
      <mesh position={[0, seatY + 0.75, 1.28]} rotation={[0.1, 0, 0]} castShadow>
        <boxGeometry args={[0.42, 1.5, 0.3]} />
        <meshPhysicalMaterial color={SEAT_FRAME} roughness={0.34} metalness={0.66} envMapIntensity={1.15} />
      </mesh>
      <RoundedBox args={[2.6, 1.5, 0.34]} radius={0.16} smoothness={4} position={[0, seatY + 1.6, 1.16]} rotation={[0.02, 0, 0]} castShadow>
        <meshPhysicalMaterial color={SEAT} roughness={0.72} metalness={0.02} clearcoat={0.26} clearcoatRoughness={0.6} envMapIntensity={0.85} />
      </RoundedBox>
      <RoundedBox args={[2.5, 1.7, 0.3]} radius={0.16} smoothness={4} position={[0, seatY + 3.0, 1.36]} rotation={[0.16, 0, 0]} castShadow>
        <meshPhysicalMaterial color={SEAT} roughness={0.72} metalness={0.02} clearcoat={0.26} clearcoatRoughness={0.6} envMapIntensity={0.85} />
      </RoundedBox>

      {/* Armrests. Cheap chairs have them; their silhouette is most of what says "office". */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          <mesh position={[sx * 1.6, seatY + 0.5, 0.55]} castShadow>
            <boxGeometry args={[0.18, 1.1, 0.2]} />
            <meshPhysicalMaterial color={SEAT_FRAME} roughness={0.36} metalness={0.6} envMapIntensity={1.1} />
          </mesh>
          <RoundedBox args={[0.34, 0.2, 1.5]} radius={0.08} smoothness={3} position={[sx * 1.6, seatY + 1.05, 0.15]} castShadow>
            <meshPhysicalMaterial color="#4b4d50" roughness={0.6} metalness={0.15} envMapIntensity={0.9} />
          </RoundedBox>
        </group>
      ))}

      {/* Gas lift: cylinder plus a wider collar, which is the detail that stops it reading as
          a broomstick. */}
      <mesh position={[0, seatY - 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1.5, 16]} />
        <meshPhysicalMaterial color="#c7c9cb" roughness={0.24} metalness={0.8} envMapIntensity={1.2} />
      </mesh>
      <mesh position={[0, seatY - 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 0.5, 16]} />
        <meshPhysicalMaterial color={SEAT_FRAME} roughness={0.4} metalness={0.6} envMapIntensity={1.1} />
      </mesh>

      {/* Five-star base: arms taper outward and drop toward the caster, rather than being
          five identical sticks. */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0, floorY + 0.42, 0.95]} rotation={[0.12, 0, 0]} castShadow>
              <boxGeometry args={[0.26, 0.2, 1.9]} />
              <meshPhysicalMaterial color={SEAT_FRAME} roughness={0.36} metalness={0.6} envMapIntensity={1.1} />
            </mesh>
            <mesh position={[0, floorY + 0.17, 1.85]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.17, 0.17, 0.14, 14]} />
              <meshPhysicalMaterial color="#5c5e61" roughness={0.5} metalness={0.35} envMapIntensity={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** One plant, off to the side. The reference's other accent, and the cheapest way to say lived-in. */
const Plant: React.FC = () => {
  const floorY = DESK_TOP_Y - TOP_T - 2.6;
  return (
    <group position={[DESK_W / 2 + 2.2, 0, 1.6]} scale={0.9}>
      <mesh position={[0, floorY + 0.85, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.82, 0.62, 1.7, 24]} />
        <meshStandardMaterial color={POT} roughness={0.9} metalness={0} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const lean = 0.42 + (i % 3) * 0.12;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0, floorY + 2.5, 0.35]} rotation={[lean, 0, 0]} castShadow>
              <cylinderGeometry args={[0.045, 0.06, 2.2, 8]} />
              <meshStandardMaterial color="#7e9b76" roughness={0.85} metalness={0} />
            </mesh>
            <mesh
              position={[0, floorY + 3.5, 1.1 + lean * 0.5]}
              rotation={[lean + 0.25, 0, 0]}
              scale={[1.05, 0.14, 1.5]}
              castShadow
            >
              <sphereGeometry args={[0.78, 14, 10]} />
              <meshStandardMaterial color={LEAF} roughness={0.88} metalness={0} side={THREE.DoubleSide} />
            </mesh>
          </group>
        );
      })}
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
      <Chair />
      <Plant />

      <ContactShadows position={[0, floorY + 0.01, 1.2]} opacity={0.34} scale={34} blur={2.6} far={7} />
      <ContactShadows position={[0, DESK_TOP_Y + 0.01, 0]} opacity={0.26} scale={18} blur={1.6} far={4} />
    </group>
  );
};
