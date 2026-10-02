/**
 * Renders the landing scene's focus overlays.
 * Reads: captions.ts, the focused object's world position and a
 * standoff beside it (projected inside the Canvas); writes: route navigation through the router.
 * Power on lives in welcome.tsx so this file's drei imports cannot leak onto the first paint.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import type { Caption } from './captions';

/** Projects the pin on the object and the sentence beside it. Lives inside the Canvas. */
export function FocusAnchor({
  popupRef,
  anchorRef,
  haloRef,
}: {
  popupRef: React.RefObject<HTMLDivElement | null>;
  anchorRef: React.RefObject<THREE.Vector3 | null>;
  haloRef: React.RefObject<number>;
}) {
  const { camera, size } = useThree();
  const pinNdc = useRef(new THREE.Vector3());
  const textNdc = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3());

  useFrame(() => {
    const root = popupRef.current;
    const anchor = anchorRef.current;
    if (!root) return;
    if (!anchor) {
      if (!root.querySelector('[data-focus-cap]')) root.style.visibility = 'hidden';
      return;
    }

    right.current.setFromMatrixColumn(camera.matrixWorld, 0);
    up.current.setFromMatrixColumn(camera.matrixWorld, 1);
    pinNdc.current.copy(anchor).project(camera);
    textNdc.current
      .copy(anchor)
      .addScaledVector(right.current, haloRef.current * 0.75)
      .addScaledVector(up.current, haloRef.current * 0.9)
      .project(camera);

    if (pinNdc.current.z > 1) {
      root.style.visibility = 'hidden';
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const toLocal = (v: THREE.Vector3) => ({
      x: (v.x * 0.5 + 0.5) * size.width + size.left - rootRect.left,
      y: (-v.y * 0.5 + 0.5) * size.height + size.top - rootRect.top,
    });
    const pin = toLocal(pinNdc.current);
    const standoff = toLocal(textNdc.current);
    const pinEl = root.querySelector<HTMLElement>('[data-focus-pin]');
    const capEl = root.querySelector<HTMLElement>('[data-focus-cap]');
    const leader = root.querySelector<SVGLineElement>('[data-focus-leader]');

    const margin = 20;
    const capMaxW = capEl?.offsetWidth ?? 288;
    const capHeight = capEl?.offsetHeight ?? 180;
    let dx = standoff.x - pin.x;
    let dy = standoff.y - pin.y;
    if (Math.abs(dx) < 48) dx = dx >= 0 ? 72 : -72;
    if (Math.abs(dy) < 32) dy = dy <= 0 ? -40 : 40;

    let capX = pin.x + dx;
    let capY = pin.y + dy - 10;
    if (capX + capMaxW > rootRect.width - margin) capX = pin.x - dx - capMaxW;
    if (capX < margin) capX = margin;
    if (capY < margin) capY = margin;
    capY = Math.min(capY, rootRect.height - margin - capHeight);
    if (rootRect.width < 640) {
      capX = (rootRect.width - capMaxW) / 2;
      capY = rootRect.height - margin - capHeight;
    }
    capY = Math.max(margin, capY);

    root.style.visibility = 'visible';
    if (pinEl) {
      pinEl.style.left = `${pin.x}px`;
      pinEl.style.top = `${pin.y}px`;
    }
    if (capEl) {
      capEl.style.left = `${capX}px`;
      capEl.style.top = `${capY}px`;
    }
    if (leader && capEl) {
      const capRect = capEl.getBoundingClientRect();
      const endX = capRect.left - rootRect.left;
      const endY = capRect.top - rootRect.top + capRect.height * 0.38;
      leader.setAttribute('x1', String(pin.x));
      leader.setAttribute('y1', String(pin.y));
      leader.setAttribute('x2', String(endX));
      leader.setAttribute('y2', String(endY));
    }
  });

  return null;
}

export const FocusCaption: React.FC<{
  visible: boolean;
  caption: Caption | null;
  popupRef: React.RefObject<HTMLDivElement | null>;
}> = ({ visible, caption, popupRef }) => {
  const navigate = useNavigate();
  const [held, setHeld] = useState<Caption | null>(null);
  const [inView, setInView] = useState(false);
  const display = caption ?? held;
  const shown = visible && caption !== null;
  const href = display?.href;

  useEffect(() => {
    if (caption) {
      setHeld(caption);
      return;
    }
    const t = window.setTimeout(() => setHeld(null), 240);
    return () => window.clearTimeout(t);
  }, [caption]);

  useEffect(() => {
    if (!shown) {
      setInView(false);
      return;
    }
    setInView(false);
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setInView(true));
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
    };
  }, [shown, display?.line]);

  return (
    <div
      ref={popupRef}
      aria-hidden={!shown}
      className={`pointer-events-none absolute inset-0 z-20 ${inView ? 'is-in' : ''}`}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <line data-focus-leader className="focus-leader" pathLength={1} />
      </svg>
      <div data-focus-pin className="focus-pin" />
      {display && (
        <div data-focus-cap className="focus-caption w-[288px] max-w-[calc(100vw-40px)] rounded-xl border border-neutral-300/80 bg-white/95 p-5 shadow-[0_12px_40px_-20px_rgba(30,45,45,0.3)] backdrop-blur-md">
          <p className="mb-3 text-[9px] font-mono tracking-[0.16em] text-neutral-500">{display.eyebrow}</p>
          <p className="text-lg font-medium leading-tight tracking-tight text-neutral-800">{display.line}</p>
          {display.description && <p className="mt-2 text-xs leading-relaxed text-neutral-500">{display.description}</p>}
          {href && (
            <button
              type="button"
              tabIndex={shown ? 0 : -1}
              onClick={() => navigate(href)}
              className={`focus-caption-door group/door relative mt-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                shown ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              Explore FlueBricks ↗
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-blue-600 transition-transform duration-200 ease-out group-hover/door:scale-x-100 group-focus-visible/door:scale-x-100"
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
