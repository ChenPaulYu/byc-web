/**
 * Renders the landing scene's DOM overlays and non-WebGL fallbacks.
 * Reads: drei loading progress and navigation callbacks; writes: route navigation through the router.
 */

import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';

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

/**
 * The power-on check the instrument runs before you play it.
 *
 * Both reference sites spend real design effort on the entry sequence — it is the cheapest
 * place to buy character, since it costs nothing but words and timing. The register here is a
 * sampler warming up rather than a BIOS booting: it belongs to the machine on the desk, not to
 * a terminal. Kept in the site's quiet editorial voice, so it is small monospace in neutral
 * greys with no colour of its own.
 */
const CHECKS = [
  { label: 'sample bank', value: '16 pads' },
  { label: 'audio engine', value: 'ready' },
  { label: 'transport', value: 'stopped' },
] as const;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
};

export const WelcomeScreen: React.FC<{ onEnter: () => void; fadeOut?: boolean }> = ({ onEnter, fadeOut }) => {
  const reducedMotion = usePrefersReducedMotion();
  // How many check lines have appeared. Reduced motion shows the finished list immediately.
  const [revealed, setRevealed] = useState(reducedMotion ? CHECKS.length : 0);

  useEffect(() => {
    if (reducedMotion) {
      setRevealed(CHECKS.length);
      return;
    }
    // Short on purpose: the whole sequence resolves in well under a second, so it reads as
    // the machine waking rather than as a loading screen standing between you and the page.
    const timers = CHECKS.map((_, i) => window.setTimeout(() => setRevealed(i + 1), 160 * (i + 1)));
    return () => timers.forEach(window.clearTimeout);
  }, [reducedMotion]);

  return (
    <div
      className={`absolute inset-0 z-30 bg-[#f9fafb] flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      onClick={onEnter}
    >
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-3">
        Bo-Yu Chen
      </h1>
      <p className="text-neutral-500 font-mono text-sm sm:text-base tracking-wide mb-10">
        Researcher // Engineer // Creator
      </p>

      {/* Decorative: the button below carries the real instruction, so screen readers are not
          made to sit through a fake self-test. */}
      <dl aria-hidden="true" className="w-[248px] sm:w-[280px] font-mono text-xs text-neutral-400 mb-10">
        {CHECKS.map((check, i) => (
          <div
            key={check.label}
            className={`flex items-baseline justify-between py-1 border-b border-neutral-100 transition-opacity duration-300 ${
              i < revealed ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <dt className="tracking-wide">{check.label}</dt>
            <dd className="tabular-nums text-neutral-500">{check.value}</dd>
          </div>
        ))}
      </dl>

      <button
        onClick={onEnter}
        aria-label="Enter the interactive scene"
        className="group flex items-center gap-3 px-6 py-3 rounded-full border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9fafb] transition-all duration-300"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="group-hover:scale-110 transition-transform" aria-hidden="true">
          <polygon points="3,1 13,8 3,15" />
        </svg>
        <span className="text-sm font-medium tracking-wide uppercase">Power on</span>
      </button>

      <p className="absolute bottom-8 text-xs text-neutral-300 font-mono tracking-wide">
        Play it with the pads or your keyboard
      </p>
    </div>
  );
};
