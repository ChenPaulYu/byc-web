/**
 * Builds the near-white desk stage the MPC sits on.
 * Reads: site-style neutrals only; writes: nothing. No textures, no generated meshes.
 */

import React from 'react';
import { ContactShadows, RoundedBox } from '@react-three/drei';

/** Matches the MPC chassis bottom: group y = -1, box height 1 centered 0.5 below that. */
export const DESK_TOP_Y = -2;

const WALL = '#ffffff';
const FLOOR = '#f5f5f5';
const DESK = '#fafafa';
const EDGE = '#e5e5e5';

const DESK_WIDTH = 13.6;
const DESK_DEPTH = 8.2;
const DESK_THICKNESS = 0.28;
const LEG_HEIGHT = 1.55;
const LEG = 0.16;

export const Stage: React.FC = () => {
  const deskCenterY = DESK_TOP_Y - DESK_THICKNESS / 2;
  const floorY = DESK_TOP_Y - DESK_THICKNESS - LEG_HEIGHT;
  const insetX = DESK_WIDTH / 2 - 0.55;
  const insetZ = DESK_DEPTH / 2 - 0.45;

  return (
    <group>
      <mesh position={[0, floorY, 0.6]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[36, 24]} />
        <meshStandardMaterial color={FLOOR} roughness={0.96} metalness={0} />
      </mesh>

      <mesh position={[0, 3.4, -9.2]} receiveShadow>
        <boxGeometry args={[36, 14, 0.16]} />
        <meshStandardMaterial color={WALL} roughness={0.94} metalness={0} />
      </mesh>
      <mesh position={[-17.9, 3.4, -1.4]} receiveShadow>
        <boxGeometry args={[0.16, 14, 16]} />
        <meshStandardMaterial color={WALL} roughness={0.94} metalness={0} />
      </mesh>

      <RoundedBox
        args={[DESK_WIDTH, DESK_THICKNESS, DESK_DEPTH]}
        radius={0.06}
        smoothness={4}
        position={[0, deskCenterY, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial color={DESK} roughness={0.88} metalness={0} />
      </RoundedBox>
      <mesh position={[0, DESK_TOP_Y + 0.004, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DESK_WIDTH - 0.28, DESK_DEPTH - 0.28]} />
        <meshStandardMaterial color={DESK} roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, deskCenterY, DESK_DEPTH / 2 - 0.02]}>
        <boxGeometry args={[DESK_WIDTH - 0.2, 0.03, 0.03]} />
        <meshStandardMaterial color={EDGE} roughness={0.7} metalness={0} />
      </mesh>

      {[[-insetX, -insetZ], [insetX, -insetZ], [-insetX, insetZ], [insetX, insetZ]].map(([x, z]) => (
        <mesh key={`${x}:${z}`} position={[x, floorY + LEG_HEIGHT / 2, z]} castShadow>
          <boxGeometry args={[LEG, LEG_HEIGHT, LEG]} />
          <meshStandardMaterial color={EDGE} roughness={0.82} metalness={0} />
        </mesh>
      ))}

      <ContactShadows position={[0, DESK_TOP_Y + 0.01, 0]} opacity={0.22} scale={18} blur={1.8} far={4} />
    </group>
  );
};
