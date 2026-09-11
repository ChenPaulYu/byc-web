import React, { Suspense, lazy, useCallback, useState } from 'react';
import { WelcomeScreen } from '../components/landing/welcome';
import { resume } from '../components/landing/audio';
import { usePageTitle } from '../utils/usePageTitle';

const LandingScene = lazy(() => import('../components/LandingScene'));
const preloadScene = () => { void import('../components/LandingScene').catch(() => {}); };

const Home: React.FC = () => {
  usePageTitle();
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const handleEnter = useCallback(async () => {
    if (fadeOut || entered) return;
    preloadScene();
    await resume();
    setFadeOut(true);
    window.setTimeout(() => setEntered(true), 500);
  }, [fadeOut, entered]);

  return (
    <div className="w-full h-screen relative bg-[#f9fafb] overflow-hidden">
      {entered && (
        <Suspense fallback={<div className="w-full h-screen bg-[#f9fafb]" />}>
          <LandingScene />
        </Suspense>
      )}
      {!entered && <WelcomeScreen onEnter={handleEnter} onIntent={preloadScene} fadeOut={fadeOut} />}
    </div>
  );
};

export default Home;
