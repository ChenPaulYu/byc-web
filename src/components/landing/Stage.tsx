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
 * Reads: site-style neutrals · scale.ts · wood.ts · football.ts · CameraDirector (football
 * click). Exports the desk datum and football placement the camera shot is built from.
 * Does not import shot.ts — that file already reads the datums from here.
 */

import React, { useEffect, useRef } from 'react';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { cm, REAL } from './scale';
import { WALNUT, createWoodMaps } from './wood';
import { createFootball } from './football';
import { useDisposable } from './useDisposable';
import { pointerCursor, requestFocus, type FocusHandler } from './CameraDirector';

/** Matches the MPC chassis bottom: its group sits at y = -1 with a box of height 1 below. */
export const DESK_TOP_Y = -2;

const DESK_TOP = '#3f4043';
const DESK_BODY = '#d8d9da';
const DESK_FRAME = '#3a3e43';
// Brackets and feet, a step *lighter* than the tube now that the tube is near-black, so the
// joints still read as separate parts rather than as the frame simply getting thicker.
const FRAME_DARK = '#4f545a';
const EDGE_BAND = '#6b563f';
const WOOD_NORMAL_SCALE = new THREE.Vector2(0.8, 0.8);

// Every dimension below comes from a real measurement through cm(). See scale.ts — before
// that module existed this desk worked out to 15 cm tall, which is why the MPC read as a
// giant slab on a footstool.
const DESK_W = cm(REAL.desk.width);
const DESK_D = cm(REAL.desk.depth);
const TOP_T = cm(REAL.desk.topThickness);
const DESK_HEIGHT = cm(REAL.desk.height);
/** Floor the legs stand on. The football sits here; the camera shot is derived from it. */
export const FLOOR_Y = DESK_TOP_Y - DESK_HEIGHT;
/** Size 5, on the floor in front-right of the desk — one owner, so the shot cannot drift off it. */
export const FOOTBALL = { x: cm(42), z: cm(48) } as const;

const Desk: React.FC<{ onOverview?: (event: { clientX: number; clientY: number }) => void }> = ({ onOverview }) => {
  const topY = DESK_TOP_Y - TOP_T / 2;
  const legH = DESK_HEIGHT - TOP_T;
  const floorY = FLOOR_Y;
  // Where the legs stand. Everything in the frame is measured from these, so the rails cannot
  // drift out of contact again.
  const legX = DESK_W / 2 - cm(7);
  const legZ = DESK_D / 2 - cm(7);
  const wood = useDisposable(() => createWoodMaps({ ...WALNUT, repeat: [2.2, 1] }));


  return (
    <group>
      {/* A wider bevel than the geometry strictly needs: the highlight it catches along the
          front edge is what separates the top from the void behind it. */}
      {/* Clicking the desk flies back out. Not a mode and not an exit button — just the third
          camera move, which is why it does not contradict "no exit affordance". */}
      <RoundedBox
        args={[DESK_W, TOP_T, DESK_D]}
        radius={0.09}
        smoothness={6}
        position={[0, topY, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          if (!onOverview) return;
          e.stopPropagation();
          onOverview(e.nativeEvent);
        }}
      >
        {/* Anisotropy is the reason this is a physical material rather than a standard one: wood
            reflects in a streak along its grain instead of a round highlight, which is most of
            what tells the eye "timber" before it can resolve a single grain line. The rotation
            aligns that streak with the direction the grain was drawn in. */}
        {/* The key is load-bearing, not decoration. These maps are built in an effect, so the
            first render has none and three.js compiles the shader without USE_MAP; assigning the
            texture afterwards does not recompile it, and the surface renders as flat white
            forever. Changing the key when the maps arrive makes R3F build a fresh material that
            compiles with them. Measured before the fix: the desk came up white in three runs out
            of four, with nothing changing between them. */}
        <meshPhysicalMaterial
          key={wood ? 'oak' : 'bare'}
          map={wood?.map}
          normalMap={wood?.normalMap}
          normalScale={WOOD_NORMAL_SCALE}
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
                <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.04} envMapIntensity={0.12} />
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
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.04} envMapIntensity={0.12} />
          </mesh>
          <mesh position={[0, floorY + cm(9), 0]} castShadow>
            <boxGeometry args={[cm(REAL.legSection * 0.8), cm(REAL.legSection * 0.8), legZ * 2]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.04} envMapIntensity={0.12} />
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
        <meshPhysicalMaterial color={DESK_FRAME} roughness={0.62} metalness={0.04} envMapIntensity={0.12} />
      </mesh>

    </group>
  );
};



const useBackdrop = () => {
  const { scene } = useThree();
  const texture = useDisposable(() => {
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
  });

  useEffect(() => {
    if (!texture) return;
    const previous = scene.background;
    scene.background = texture;
    // Disposal belongs to useDisposable; this effect only owns the assignment.
    return () => { scene.background = previous; };
  }, [scene, texture]);
};

/** A ground disc whose alpha falls off at the rim, so the floor never shows an edge. */
const useGround = () =>
  useDisposable(() => {
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
  });

const Football: React.FC<{ onFocus?: FocusHandler; focusDistance: number }> = ({ onFocus, focusDistance }) => {
  const r = cm(REAL.football.diameter) / 2;
  const ball = useDisposable(() => createFootball(r));
  const root = useRef<THREE.Group>(null);
  if (!ball) return null;
  return (
    <group
      ref={root}
      position={[FOOTBALL.x, FLOOR_Y + r, FOOTBALL.z]}
      rotation={[0.45, -0.7, 0.18]}
      {...pointerCursor}
      onClick={(e) => {
        if (!root.current) return;
        requestFocus(onFocus, root.current.getWorldPosition(new THREE.Vector3()), focusDistance, e, 'football');
      }}
    >
      <primitive object={ball} />
    </group>
  );
};

const StageComponent: React.FC<{
  onOverview?: (event: { clientX: number; clientY: number }) => void;
  onFocus?: FocusHandler;
  footballDistance: number;
}> = ({ onOverview, onFocus, footballDistance }) => {
  useBackdrop();
  const ground = useGround();
  // The floor is FLOOR_Y, the same constant the legs stand on. It used to be worked out here a
  // second time, as the desk top minus its thickness minus a tuned 2.6 — which put the ground
  // 65 cm above the feet. The legs passed straight through it and carried on below, and the
  // contact shadow was a haze floating at mid-leg height, so nothing in the scene was ever
  // standing on anything. One fact, one owner; this is what scale.ts exists to prevent.
  const floorY = FLOOR_Y;

  return (
    <group>
      <mesh position={[0, floorY, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[52, 36]} />
        <meshStandardMaterial key={ground ? 'disc' : 'bare'} color="#ffffff" roughness={0.97} metalness={0} map={ground ?? undefined} transparent />
      </mesh>

      <Desk onOverview={onOverview} />
      <Football onFocus={onFocus} focusDistance={footballDistance} />

      <ContactShadows position={[0, floorY + 0.01, 1.2]} opacity={0.5} scale={30} blur={2.2} far={18} />
      <ContactShadows position={[0, DESK_TOP_Y + 0.01, 0]} opacity={0.4} scale={16} blur={1.1} far={3} />
    </group>
  );
};

export const Stage = React.memo(StageComponent);
