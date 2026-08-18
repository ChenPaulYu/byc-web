/**
 * Renders the landing scene's DOM overlays and non-WebGL fallbacks.
 * Reads: drei loading progress, captions.ts, the focused object's world position and a
 * standoff beside it (projected inside the Canvas); writes: route navigation through the router.
 * Power on lives in welcome.tsx so this file's drei imports cannot leak onto the first paint.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import type { Caption } from './captions';

export const LoadingOverlay: React.FC<{ extraReady: boolean }> = ({ extraReady }) => {
  const { active, progress } = useProgress();
  const [hidden, setHidden] = useState(false);
  const shouldShow = active || !extraReady;

  useEffect(() => {
    if (!active && progress >= 100 && extraReady) {
      const t = window.setTimeout(() => setHidden(true), 300);
      return () => window.clearTimeout(t);
    }

    setHidden(false);
  }, [active, progress, extraReady]);

  if (hidden) return null;

  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-[#f9fafb] transition-opacity duration-500 ${
        shouldShow ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!shouldShow}
    >
      <div className="w-[280px] sm:w-[360px]">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xs font-mono tracking-widest uppercase text-neutral-400">Loading samples</div>
          <div className="text-xs font-mono tabular-nums text-neutral-400">{Math.round(progress)}%</div>
        </div>
        <div className="h-1.5 rounded bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-neutral-800 transition-[width] duration-200 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Error boundary for 3D canvas failures (e.g., WebGL not supported)
export class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export const StaticFallback: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full h-screen bg-[#f9fafb] flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-3 text-center">
        Bo-Yu Chen
      </h1>
      <p className="text-neutral-500 font-mono text-sm sm:text-base tracking-wide mb-12">
        Researcher // Engineer // Creator
      </p>
      <nav className="flex flex-wrap gap-4 justify-center">
        {['About', 'Projects', 'Blog', 'CV'].map((page) => (
          <button
            key={page}
            onClick={() => navigate(`/${page.toLowerCase()}`)}
            className="text-lg text-neutral-800 hover:text-black transition-colors"
          >
            {page}
          </button>
        ))}
      </nav>
    </div>
  );
};

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
    const capMaxW = 288;
    let dx = standoff.x - pin.x;
    let dy = standoff.y - pin.y;
    if (Math.abs(dx) < 48) dx = dx >= 0 ? 72 : -72;
    if (Math.abs(dy) < 32) dy = dy <= 0 ? -40 : 40;

    let capX = pin.x + dx;
    let capY = pin.y + dy - 10;
    if (capX + capMaxW > rootRect.width - margin) capX = pin.x - dx - capMaxW;
    if (capX < margin) capX = margin;
    if (capY < margin) capY = margin;
    if (capY > rootRect.height - margin - 48) capY = rootRect.height - margin - 48;

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
        <div data-focus-cap className="focus-caption w-max max-w-xs rounded-md border border-neutral-900 bg-white px-3 py-2">
          <p className="text-sm leading-snug text-neutral-800">{display.line}</p>
          {href && (
            <button
              type="button"
              onClick={() => navigate(href)}
              className={`focus-caption-door group/door relative mt-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                shown ? 'pointer-events-auto' : 'pointer-events-none'
              }`}
            >
              View project
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
