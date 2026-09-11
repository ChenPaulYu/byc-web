/** Pinned matte cloth flag in the shared back-wall composition; static folds and a soft contact shadow. */
import { useRef } from 'react';
import * as THREE from 'three';
import { cm } from './scale';
import { pointerCursor, requestFocus, type FocusHandler } from './CameraDirector';
import { bundle, useDisposable } from './useDisposable';
import { ROOM } from './room';
import { WALL_DISPLAY, createWallFlagGeometry } from './wallDisplay';

function createFlag() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#fe0000';
  ctx.fillRect(0, 0, 384, 256);
  ctx.fillStyle = '#000095';
  ctx.fillRect(0, 0, 192, 128);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 12;
    const radius = i % 2 === 0 ? 48 : 24;
    const x = 96 + Math.cos(angle) * radius;
    const y = 64 + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#000095';
  ctx.beginPath();
  ctx.arc(96, 64, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(96, 64, 24, 0, Math.PI * 2);
  ctx.fill();
  // Broad crease shading remains readable under the room's deliberately soft daylight.
  const creases = ctx.createLinearGradient(0, 0, 384, 0);
  for (let i = 0; i <= 12; i++) {
    creases.addColorStop(i / 12, i % 4 === 1 ? 'rgba(0,0,0,0.12)' : i % 4 === 3 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0)');
  }
  ctx.fillStyle = creases;
  ctx.fillRect(0, 0, 384, 256);
  // Fine woven threads and a stitched hem are printed once, not animated per frame.
  ctx.fillStyle = 'rgba(255,255,255,0.055)';
  for (let x = 0; x < 384; x += 3) ctx.fillRect(x, 0, 1, 256);
  ctx.fillStyle = 'rgba(0,0,0,0.045)';
  for (let y = 0; y < 256; y += 3) ctx.fillRect(0, y, 384, 1);
  ctx.strokeStyle = 'rgba(240,230,211,0.25)';
  ctx.setLineDash([2, 3]);
  ctx.strokeRect(3, 3, 378, 250);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = createWallFlagGeometry();
  const material = new THREE.MeshStandardMaterial({ map: texture, color: ROOM.linen, roughness: 1, side: THREE.DoubleSide });
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256; shadowCanvas.height = 192;
  const shadowCtx = shadowCanvas.getContext('2d')!;
  shadowCtx.shadowColor = 'rgba(0,0,0,0.22)';
  shadowCtx.shadowBlur = 12;
  shadowCtx.fillStyle = 'rgba(0,0,0,0.12)';
  shadowCtx.fillRect(12, 12, 232, 168);
  const shadow = new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false });
  return bundle({ texture, geometry, material, shadow, shadowMaterial });
}

export function TaiwanFlag({ deskY, onFocus }: { deskY: number; onFocus?: FocusHandler }) {
  const root = useRef<THREE.Group>(null);
  const flag = useDisposable(createFlag);
  return (
    <group
      ref={root}
      name="taiwan-wall-cloth"
      position={[WALL_DISPLAY.flag.x, deskY + WALL_DISPLAY.flag.aboveDesk, ROOM.back + 0.46]}
      {...pointerCursor}
      onClick={(event) => {
        if (!root.current) return;
        const target = root.current.getWorldPosition(new THREE.Vector3());
        requestFocus(onFocus, target, cm(110), event, 'taiwan');
      }}
    >
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * (WALL_DISPLAY.flag.width / 2 - 0.08), WALL_DISPLAY.flag.height / 2 - 0.06, 0.10]}>
          <sphereGeometry args={[0.065, 8, 6]} />
          <meshStandardMaterial color={ROOM.metal} roughness={0.7} />
        </mesh>
      ))}
      {flag && (
        <group>
          <mesh position={[0.02, -0.12, -0.025]} material={flag.shadowMaterial}>
            <planeGeometry args={[WALL_DISPLAY.flag.width + 0.5, WALL_DISPLAY.flag.height + 0.5]} />
          </mesh>
          <mesh name="taiwan-flag-fabric" geometry={flag.geometry} material={flag.material} dispose={null} />
        </group>
      )}
    </group>
  );
}
