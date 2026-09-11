/**
 * RoomControls — canvas-local look-around and bounded approach, without pointer lock.
 * Drag rotates the target around the eye, never the eye around the desk. Wheel/pinch approaches.
 * Reads: roomCamera policy, R3F camera/canvas; exposes CameraDirector's small flight seam.
 * Input remains transient; no per-pointer React renders. Listeners are removed on unmount.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { approach, constrainEye, turnView, type RoomControlHandle } from './roomCamera';

interface Props {
  controlsRef: React.RefObject<RoomControlHandle | null>;
  target: [number, number, number];
  bounds: THREE.Box3;
  enabled: boolean;
  onExplore: () => void;
}

export function RoomControls({ controlsRef, target, bounds, enabled, onExplore }: Props) {
  const { camera, gl } = useThree();
  const live = useRef({ enabled, onExplore });
  live.current = { enabled, onExplore };
  const control = useMemo(() => {
    const listeners = new Set<() => void>();
    const handle: RoomControlHandle & { start(): void } = {
      target: new THREE.Vector3(...target),
      constrain: eye => constrainEye(eye, bounds),
      update: () => { constrainEye(camera.position, bounds); camera.lookAt(handle.target); camera.updateMatrixWorld(); },
      addEventListener: (_, listener) => { listeners.add(listener); },
      removeEventListener: (_, listener) => { listeners.delete(listener); },
      start: () => { listeners.forEach(listener => listener()); live.current.onExplore(); },
    };
    return handle;
  }, [camera, target, bounds]);

  useEffect(() => {
    controlsRef.current = control;
    control.update();
    const canvas = gl.domElement;
    const oldTabIndex = canvas.getAttribute('tabindex');
    const oldLabel = canvas.getAttribute('aria-label');
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Studio view. Drag or use arrow keys to look around; scroll or pinch to move closer.');
    const pointers = new Map<number, { x: number; y: number; startX: number; startY: number }>();
    let dragging = false;
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const down = (event: PointerEvent) => {
      if (!live.current.enabled || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
    };
    const move = (event: PointerEvent) => {
      const p = pointers.get(event.pointerId);
      if (!p) return;
      if (!live.current.enabled) { pointers.clear(); dragging = false; return; }
      const previousSpread = spread();
      const dx = event.clientX - p.x, dy = event.clientY - p.y;
      p.x = event.clientX; p.y = event.clientY;
      if (!dragging && pointers.size === 1 && Math.hypot(p.x - p.startX, p.y - p.startY) <= 6) return;
      if (!dragging) { control.start(); dragging = true; }
      if (pointers.size > 1) {
        approach(camera.position, control.target, (spread() - previousSpread) * 0.035, bounds);
      } else {
        // One canvas-width drag is about half a turn; vertical sensitivity matches horizontal.
        const sensitivity = Math.PI / Math.max(480, canvas.clientWidth);
        turnView(camera.position, control.target, -dx * sensitivity, dy * sensitivity);
      }
      control.update();
    };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      if (!pointers.size) dragging = false;
    };
    const wheel = (event: WheelEvent) => {
      if (!live.current.enabled) return;
      event.preventDefault();
      control.start();
      const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? canvas.clientHeight : 1);
      approach(camera.position, control.target, THREE.MathUtils.clamp(-pixels * 0.012, -2, 2), bounds);
      control.update();
    };
    const key = (event: KeyboardEvent) => {
      if (!live.current.enabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); control.start();
      turnView(camera.position, control.target,
        event.key === 'ArrowLeft' ? -0.08 : event.key === 'ArrowRight' ? 0.08 : 0,
        event.key === 'ArrowUp' ? 0.06 : event.key === 'ArrowDown' ? -0.06 : 0);
      control.update();
    };
    const blur = () => { pointers.clear(); dragging = false; };
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', blur);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('keydown', key);
    return () => {
      if (controlsRef.current === control) controlsRef.current = null;
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', blur);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('keydown', key);
      if (oldTabIndex === null) canvas.removeAttribute('tabindex'); else canvas.setAttribute('tabindex', oldTabIndex);
      if (oldLabel === null) canvas.removeAttribute('aria-label'); else canvas.setAttribute('aria-label', oldLabel);
    };
  }, [camera, gl, control, controlsRef, bounds]);
  return null;
}
