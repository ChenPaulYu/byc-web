/** Keeps one entry screen visible until the room renders, without gating navigation on media. */
import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { WelcomeScreen } from '../components/landing/welcome';
import { CanvasErrorBoundary, StaticFallback } from '../components/landing/fallback';
import { resume } from '../components/landing/audio';
import { usePageTitle } from '../utils/usePageTitle';

const LandingScene = lazy(() => import('../components/LandingScene'));
const preloadScene = () => { void import('../components/LandingScene').catch(() => {}); };

const Home: React.FC = () => {
  usePageTitle();
  const [entered, setEntered] = useState(false);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const entering = useRef(false);
  const handleReady = useCallback(() => setReady(true), []);

  const handleEnter = useCallback(() => {
    if (entering.current) return;
    entering.current = true;
    preloadScene();
    // Keep this in the gesture, but a pending audio permission must not hold up the page.
    void resume().catch(() => {});
    setEntered(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setRevealed(true), 500);
    return () => window.clearTimeout(timer);
  }, [ready]);

  return (
    <div className="w-full h-screen relative bg-[#f9fafb] overflow-hidden">
      {entered && (
        <div inert={!ready} aria-hidden={!ready}>
          <CanvasErrorBoundary fallback={<StaticFallback />} onError={handleReady}>
            <Suspense fallback={null}>
              <LandingScene onReady={handleReady} />
            </Suspense>
          </CanvasErrorBoundary>
        </div>
      )}
      {!revealed && <WelcomeScreen onEnter={handleEnter} onIntent={preloadScene} loading={entered} fadeOut={ready} />}
    </div>
  );
};

export default Home;
