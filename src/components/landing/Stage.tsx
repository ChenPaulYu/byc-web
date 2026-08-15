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
const DRAWER_PULL = '#9a9b9d';
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

      {/* Drawer pedestal on the left, open leg frame on the right — the asymmetry is what makes
          a slab of geometry read as a desk rather than a table. */}
      <group position={[-DESK_W / 2 + 2.5, 0, 0]}>
        <RoundedBox
          args={[4.2, legH - 0.35, DESK_D - 1.1]}
          radius={0.06}
          smoothness={3}
          position={[0, floorY + (legH - 0.35) / 2 + 0.35, 0]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color={DESK_BODY}
            roughness={0.72}
            roughnessMap={bodyRoughness ?? undefined}
            metalness={0.06}
            clearcoat={0.15}
            envMapIntensity={0.8}
          />
        </RoundedBox>
        {[0.62, 1.62].map((y) => (
          <group key={y} position={[0, floorY + y + 0.35, (DESK_D - 1.1) / 2 + 0.02]}>
            <mesh>
              <planeGeometry args={[3.9, 0.86]} />
              <meshStandardMaterial color={DESK_BODY} roughness={0.8} metalness={0} />
            </mesh>
            <mesh position={[0, 0, 0.03]}>
              <boxGeometry args={[1.5, 0.1, 0.06]} />
              <meshStandardMaterial color={DRAWER_PULL} roughness={0.55} metalness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {[-1, 1].map((sz) =>
        [DESK_W / 2 - 0.6].map((x) => (
          <mesh key={`${x}:${sz}`} position={[x, floorY + legH / 2, sz * (DESK_D / 2 - 0.7)]} castShadow>
            <boxGeometry args={[0.26, legH, 0.26]} />
            <meshPhysicalMaterial color={DESK_FRAME} roughness={0.38} metalness={0.55} envMapIntensity={1.1} />
          </mesh>
        )),
      )}
      <mesh position={[DESK_W / 2 - 0.6, floorY + 0.16, 0]} castShadow>
        <boxGeometry args={[0.2, 0.2, DESK_D - 1.4]} />
        <meshPhysicalMaterial color={DESK_FRAME} roughness={0.38} metalness={0.55} envMapIntensity={1.1} />
      </mesh>
    </group>
  );
};

/**
 * The chair does the narrative work. Back to the camera, pushed slightly out from the desk, it
 * puts the viewer behind someone who has just stepped away — an empty desk is an object, an
 * empty chair at a desk is a person. It also carries the scene's only warm colour.
 */
const Chair: React.FC = () => {
  const seatY = DESK_TOP_Y - 1.15;
  const floorY = DESK_TOP_Y - TOP_T - 2.6;
  return (
    <group position={[0.6, 0, DESK_D / 2 + 1.4]} scale={0.82} rotation={[0, -0.1, 0]}>
      <RoundedBox args={[2.9, 0.42, 2.7]} radius={0.16} smoothness={3} position={[0, seatY, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={SEAT} roughness={0.72} metalness={0.02} clearcoat={0.28} clearcoatRoughness={0.6} envMapIntensity={0.85} />
      </RoundedBox>
      <RoundedBox
        args={[2.7, 2.7, 0.38]}
        radius={0.16}
        smoothness={3}
        position={[0, seatY + 1.6, 1.12]}
        rotation={[0.14, 0, 0]}
        castShadow
      >
        <meshPhysicalMaterial color={SEAT} roughness={0.72} metalness={0.02} clearcoat={0.28} clearcoatRoughness={0.6} envMapIntensity={0.85} />
      </RoundedBox>
      <mesh position={[0, seatY + 0.9, 1.34]} castShadow>
        <boxGeometry args={[0.16, 1.9, 0.16]} />
        <meshPhysicalMaterial color={SEAT_FRAME} roughness={0.32} metalness={0.7} envMapIntensity={1.15} />
      </mesh>
      <mesh position={[0, (seatY + floorY) / 2 - 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, seatY - floorY - 0.5, 16]} />
        <meshPhysicalMaterial color={SEAT_FRAME} roughness={0.32} metalness={0.7} envMapIntensity={1.15} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.4;
        return (
          <group key={i}>
            <mesh position={[Math.sin(a) * 0.85, floorY + 0.24, Math.cos(a) * 0.85]} rotation={[0, -a, 0]} castShadow>
              <boxGeometry args={[0.16, 0.12, 1.7]} />
              <meshStandardMaterial color={SEAT_FRAME} roughness={0.55} metalness={0.25} />
            </mesh>
            <mesh
              position={[Math.sin(a) * 1.6, floorY + 0.13, Math.cos(a) * 1.6]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.13, 0.13, 0.16, 12]} />
              <meshStandardMaterial color="#6f7174" roughness={0.5} metalness={0.3} />
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
