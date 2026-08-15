/**
 * DeskGear.tsx — the owner's real kit, arranged on the desk the way it is actually used.
 *
 * The layout follows `docs/blueprints/thoughts/2026-08-15-producer-desk-layout.md`: a reach
 * zone at the front holding everything played by hand, a look-at zone behind it holding the
 * laptop and the monitor pair. A controller pushed behind the laptop cannot be reached, which
 * is the detail that says nobody actually plays here.
 *
 * The register is bedroom recording, not a treated studio. The monitors are raised on a stack
 * of books rather than isolation wedges, the cables are visible, and the desk is allowed to
 * hold things that have nothing to do with music. A tidy desk would read as a product shot.
 *
 * Reads: layout.ts scene units (the MPC is 9 x 5 at the origin) · Stage's DESK_TOP_Y
 */

import React, { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { DESK_TOP_Y } from './Stage';

const CASE = '#e8e9ea';
const CASE_DARK = '#2f3134';
const SCREEN_GLOW = '#cfe3ef';
const BOOK_A = '#c9cbc6';
const BOOK_B = '#d9d5cc';
const BOOK_C = '#bfc4c8';
const CABLE = '#3a3c3f';
const MUG = '#e3e4e2';

/** The Launchpad's 8x8 grid, drawn once into a canvas. Cheaper and sharper than 64 meshes. */
const useGridTexture = () =>
  useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#2b2d30';
    ctx.fillRect(0, 0, size, size);
    const pad = size / 8;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        // A few pads lit, the rest dark — a grid that is entirely unlit reads as a grille.
        const lit = (r * 8 + c) % 11 === 0;
        ctx.fillStyle = lit ? '#8fb4c8' : '#43474b';
        ctx.fillRect(c * pad + 3, r * pad + 3, pad - 6, pad - 6);
      }
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

/** A soft vertical wash for the laptop screen. No text — at this size it would be mush. */
const useScreenTexture = () =>
  useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#1d2733');
    g.addColorStop(0.5, '#24333f');
    g.addColorStop(1, '#1a222c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 128);
    // A couple of bright rows stand in for lines of code.
    ctx.fillStyle = '#7fd4c1';
    [26, 40, 62, 76].forEach((y) => ctx.fillRect(1, y, 5, 2));
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

const Laptop: React.FC = () => {
  const screen = useScreenTexture();
  return (
    <group position={[-0.3, DESK_TOP_Y, -3.4]} rotation={[0, 0.06, 0]}>
      <RoundedBox args={[5.4, 0.16, 3.6]} radius={0.07} smoothness={3} position={[0, 0.08, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={CASE} roughness={0.42} metalness={0.35} envMapIntensity={1} />
      </RoundedBox>
      <group position={[0, 0.16, -1.7]} rotation={[-0.19, 0, 0]}>
        <RoundedBox args={[5.4, 3.5, 0.13]} radius={0.07} smoothness={3} position={[0, 1.75, 0]} castShadow>
          <meshPhysicalMaterial color={CASE} roughness={0.42} metalness={0.35} envMapIntensity={1} />
        </RoundedBox>
        <mesh position={[0, 1.75, 0.075]}>
          <planeGeometry args={[4.9, 3.05]} />
          <meshBasicMaterial map={screen ?? undefined} color={screen ? '#ffffff' : SCREEN_GLOW} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * A monitor on a stack of paperbacks. Isolation pads are what a studio uses; books are what a
 * bedroom uses, and the difference is most of the register.
 */
const MonitorOnBooks: React.FC<{ x: number; toeIn: number }> = ({ x, toeIn }) => (
  <group position={[x, DESK_TOP_Y, -3.7]} rotation={[0, toeIn, 0]}>
    {[
      { y: 0.11, w: 2.5, d: 1.9, c: BOOK_A, r: 0.04 },
      { y: 0.31, w: 2.35, d: 1.75, c: BOOK_B, r: -0.05 },
      { y: 0.49, w: 2.45, d: 1.85, c: BOOK_C, r: 0.03 },
    ].map((b, i) => (
      <mesh key={i} position={[0, b.y, 0]} rotation={[0, b.r, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, 0.2, b.d]} />
        <meshStandardMaterial color={b.c} roughness={0.92} metalness={0} />
      </mesh>
    ))}
    {/* Cabinet, tilted back a little the way a monitor on an improvised riser always is. */}
    <group position={[0, 1.72, 0]} rotation={[-0.09, 0, 0]}>
      <RoundedBox args={[2.1, 2.9, 1.9]} radius={0.08} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color={CASE_DARK} roughness={0.66} metalness={0.1} envMapIntensity={0.9} />
      </RoundedBox>
      <mesh position={[0, -0.35, 0.96]}>
        <circleGeometry args={[0.66, 28]} />
        <meshStandardMaterial color="#1b1c1e" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.35, 0.99]}>
        <circleGeometry args={[0.2, 20]} />
        <meshStandardMaterial color="#8d7a4e" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.92, 0.96]}>
        <circleGeometry args={[0.26, 20]} />
        <meshStandardMaterial color="#242628" roughness={0.7} />
      </mesh>
    </group>
  </group>
);

const Launchpad: React.FC = () => {
  const grid = useGridTexture();
  return (
    <group position={[-6.2, DESK_TOP_Y, 1.4]} rotation={[0, 0.12, 0]}>
      <RoundedBox args={[3.5, 0.28, 3.5]} radius={0.09} smoothness={3} position={[0, 0.14, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#3a3d40" roughness={0.6} metalness={0.12} envMapIntensity={0.9} />
      </RoundedBox>
      <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.0, 3.0]} />
        <meshBasicMaterial map={grid ?? undefined} toneMapped={false} />
      </mesh>
    </group>
  );
};

/** Cables. Ranked low by the research, but visible cable is the bedroom-recording tell. */
const Cables: React.FC = () => {
  const curves = useMemo(() => {
    const make = (pts: Array<[number, number, number]>) =>
      new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    return [
      make([[-6.0, DESK_TOP_Y + 0.1, -4.6], [-5.2, DESK_TOP_Y + 0.05, -4.9], [-3.0, DESK_TOP_Y + 0.04, -4.8], [-0.9, DESK_TOP_Y + 0.12, -4.2]]),
      make([[6.0, DESK_TOP_Y + 0.1, -4.6], [5.0, DESK_TOP_Y + 0.05, -4.9], [2.6, DESK_TOP_Y + 0.04, -4.85], [0.4, DESK_TOP_Y + 0.12, -4.3]]),
      make([[-4.4, DESK_TOP_Y + 0.06, 1.6], [-3.9, DESK_TOP_Y + 0.05, 0.6], [-4.3, DESK_TOP_Y + 0.05, -0.6], [-3.6, DESK_TOP_Y + 0.06, -1.6]]),
    ];
  }, []);

  return (
    <group>
      {curves.map((c, i) => (
        <mesh key={i} castShadow>
          <tubeGeometry args={[c, 40, 0.055, 6, false]} />
          <meshStandardMaterial color={CABLE} roughness={0.75} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
};

/** The desk is allowed to hold things that have nothing to do with music. */
const Clutter: React.FC = () => (
  <group>
    <group position={[-7.0, DESK_TOP_Y, 3.1]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.36, 0.84, 20]} />
        <meshPhysicalMaterial color={MUG} roughness={0.55} metalness={0.02} clearcoat={0.4} envMapIntensity={0.9} />
      </mesh>
      <mesh position={[0.5, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.2, 0.05, 8, 18, Math.PI * 1.1]} />
        <meshPhysicalMaterial color={MUG} roughness={0.55} clearcoat={0.4} />
      </mesh>
    </group>
    {[
      { p: [6.4, 0.07, 3.0] as [number, number, number], r: 0.14, w: 2.3, d: 1.6, c: '#eceae5' },
      { p: [6.55, 0.2, 3.1] as [number, number, number], r: -0.08, w: 2.1, d: 1.5, c: '#dedbd4' },
    ].map((b, i) => (
      <mesh key={i} position={[b.p[0], DESK_TOP_Y + b.p[1], b.p[2]]} rotation={[0, b.r, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, 0.13, b.d]} />
        <meshStandardMaterial color={b.c} roughness={0.9} />
      </mesh>
    ))}
  </group>
);

export const DeskGear: React.FC = () => (
  <group>
    <Laptop />
    <MonitorOnBooks x={-6.1} toeIn={0.42} />
    <MonitorOnBooks x={6.1} toeIn={-0.42} />
    <Launchpad />
    <Cables />
    <Clutter />
  </group>
);
