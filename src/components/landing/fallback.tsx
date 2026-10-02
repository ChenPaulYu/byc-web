/** Lightweight scene recovery and navigation, available even when the 3D bundle fails. */
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Error boundary for 3D canvas failures (e.g., WebGL not supported)
export class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError?.();
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export const SceneNavigation = () => {
  const navigate = useNavigate();
  return (
    <nav className="flex flex-wrap gap-4 justify-center">
      {['About', 'Projects', 'Blog', 'CV'].map(page => (
        <button key={page} onClick={() => navigate(`/${page.toLowerCase()}`)}
          className="text-lg text-neutral-800 hover:text-black transition-colors">
          {page}
        </button>
      ))}
    </nav>
  );
};

export const StaticFallback = () => {
  return (
    <div className="w-full h-screen bg-[#f9fafb] flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-3 text-center">
        Bo-Yu Chen
      </h1>
      <p className="text-neutral-500 font-mono text-sm sm:text-base tracking-wide mb-12">
        Researcher // Engineer // Builder
      </p>
      <SceneNavigation />
    </div>
  );
};
