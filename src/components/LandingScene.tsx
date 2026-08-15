/**
 * Hosts the public landing route, Canvas lifecycle, camera behavior, and navigation overlay.
 * Reads: Vite feature flags and the composed landing-scene modules (stage, MPC, overlays); writes: navigation and entry state.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import * as Tone from 'tone';
import { useNavigate } from 'react-router-dom';
import { CanvasErrorBoundary, LoadingOverlay, StaticFallback, WelcomeScreen } from './landing/overlays';
import { Stage } from './landing/Stage';
import Mpc from './landing/Mpc';

const VIDEO_ENABLED = import.meta.env.VITE_ENABLE_VIDEO !== 'false';

const createSynth = () => {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.5 }
  }).toDestination();
};

const LandingScene: React.FC = () => {
  const navigate = useNavigate();
  const synth = useMemo(() => createSynth(), []);
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [videoReady, setVideoReady] = useState(!VIDEO_ENABLED);

  // Timeout fallback: if video doesn't load within 5 seconds, show the scene anyway
  useEffect(() => {
    if (videoReady) return;
    const timeout = window.setTimeout(() => setVideoReady(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [videoReady]);

  const handleEnter = async () => {
    await Tone.start();
    setFadeOut(true);
    setTimeout(() => setEntered(true), 500);
  };

  // Responsive camera positioning
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 14, 14]);

  useEffect(() => {
    const updateCameraPosition = () => {
      const { innerWidth, innerHeight } = window;
      const aspectRatio = innerWidth / innerHeight;

      // Base camera distance, adjusted by device type.
      // A little further than the floating-instrument framing so the desk rim reads.
      let cameraDistance = 14;

      if (innerWidth < 480) {
        // Mobile phones - closer view since MPC is scaled down
        cameraDistance = 11;
      } else if (innerWidth < 768) {
        // Large phones / small tablets
        cameraDistance = 12;
      } else if (innerWidth < 1024) {
        // Tablets
        cameraDistance = 13;
      } else {
        // Desktop
        cameraDistance = 14;
      }

      // Adjust for extreme aspect ratios
      if (aspectRatio < 0.8) {
        // Portrait - move camera back and up
        setCameraPosition([0, cameraDistance + 4, cameraDistance + 2]);
      } else if (aspectRatio > 2.0) {
        // Ultra-wide - adjust position
        setCameraPosition([0, cameraDistance, cameraDistance + 1]);
      } else {
        // Standard landscape
        setCameraPosition([0, cameraDistance, cameraDistance]);
      }
    };

    updateCameraPosition();
    window.addEventListener('resize', updateCameraPosition);
    return () => window.removeEventListener('resize', updateCameraPosition);
  }, []);

  return (
    <CanvasErrorBoundary fallback={<StaticFallback />}>
    <div className="w-full h-screen relative bg-[#f9fafb] overflow-hidden">
      {!entered && <WelcomeScreen onEnter={handleEnter} fadeOut={fadeOut} />}
      {entered && <LoadingOverlay extraReady={videoReady} />}
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 35 }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame rate to drop for performance
      >
        <color attach="background" args={['#f9fafb']} />

        <ambientLight intensity={1.05} />
        <spotLight
          position={[8, 16, 10]}
          angle={0.38}
          penumbra={1}
          intensity={1.15}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-8, 8, 6]} intensity={0.45} />

        <OrbitControls
          enabled={!isDragging}
          enablePan={false}
          enableZoom={true}
          minDistance={9}
          maxDistance={24}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
          // Fix azimuth to give that slightly angled front view
          minAzimuthAngle={-Math.PI / 8}
          maxAzimuthAngle={Math.PI / 8}
          zoomSpeed={0.8}
          // Enable touch zoom with pinch gestures
          enableDamping={true}
          dampingFactor={0.05}
        />

        <Stage />
        <Mpc synth={synth} onDragChange={setIsDragging} onVideoReady={() => setVideoReady(true)} />

        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      {/* --- RESPONSIVE UI OVERLAY --- */}
      <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-between">

        {/* Header: Top Left */}
        <header className="z-10">
          <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-sans tracking-tight text-neutral-900 mb-1 sm:mb-2">
            Bo-Yu Chen
          </h1>
          <p className="text-neutral-500 font-mono text-xs sm:text-sm md:text-base tracking-wide">
            Researcher // Engineer // Creator
          </p>
        </header>

        {/* Footer Area */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full mt-auto gap-2 sm:gap-0 pb-6 sm:pb-0">
          {/* Mobile: Center everything, Desktop: Left Spacer */}
          <div className="hidden sm:block sm:w-1/3"></div>

          {/* Center: Keyboard Guide */}
          <div className="w-full sm:w-1/3 text-center pb-1 sm:pb-4">
            <p className="text-neutral-300 text-xs sm:text-xs md:text-sm font-mono tracking-widest uppercase">
              <span className="hidden sm:inline">Keyboard: 1-4, Q-R, A-F, Z-V</span>
              <span className="sm:hidden">Tap pads to play</span>
            </p>
          </div>

          {/* Right: Navigation */}
          <nav className="w-full sm:w-1/3 pointer-events-auto flex sm:flex-col items-center sm:items-end gap-x-5 gap-y-2 sm:gap-4 justify-center sm:justify-end pb-2 sm:pb-0">
            <button
              onClick={() => navigate('/about')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal touch-manipulation"
            >
              About
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal touch-manipulation"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal touch-manipulation"
            >
              Blog
            </button>
            <button
              onClick={() => navigate('/cv')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal touch-manipulation"
            >
              CV
            </button>
          </nav>
        </div>
      </div>
    </div>
    </CanvasErrorBoundary>
  );
};

export default LandingScene;
