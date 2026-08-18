import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { WelcomeScreen } from '../components/landing/welcome';
import { resume } from '../components/landing/audio';
import { usePageTitle } from '../utils/usePageTitle';

const LandingScene = lazy(() => import('../components/LandingScene'));

const Home: React.FC = () => {
  usePageTitle();
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Fetch the instrument chunk after the name is on screen, so opening the tab is not a
  // three.js parse. Power on still waits for the fade; this just means the wait is a fade,
  // not a download.
  useEffect(() => {
    const id = window.setTimeout(() => {
      void import('../components/LandingScene');
    }, 400);
    return () => window.clearTimeout(id);
  }, []);

  const handleEnter = useCallback(async () => {
    if (fadeOut || entered) return;
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
      {!entered && <WelcomeScreen onEnter={handleEnter} fadeOut={fadeOut} />}
    </div>
  );
};

export default Home;