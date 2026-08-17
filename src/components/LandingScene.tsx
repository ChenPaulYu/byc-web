/**
 * Hosts the public landing route, Canvas lifecycle, camera behavior, and navigation overlay.
 * Reads: Vite feature flags and the composed landing-scene modules (stage, MPC, overlays); writes: navigation and entry state.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Lightformer, OrbitControls, SoftShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useNavigate } from 'react-router-dom';
import { CanvasErrorBoundary, LoadingOverlay, StaticFallback, WelcomeScreen } from './landing/overlays';
import { Stage } from './landing/Stage';
import { DeskGear } from './landing/DeskGear';
import Mpc from './landing/Mpc';
import { CameraDirector, type FlightRequest } from './landing/CameraDirector';
import { resume } from './landing/audio';

const LandingScene: React.FC = () => {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [screenReady, setScreenReady] = useState(false);

  // The screen signals itself on mount now that it draws rather than loads, but the fallback
  // stays: if it never mounts at all, the loading overlay must not sit there forever.
  useEffect(() => {
    if (screenReady) return;
    const timeout = window.setTimeout(() => setScreenReady(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [screenReady]);

  // Stable identity: an inline arrow here is a new prop on every render, and the screen
  // rebuilds its video element whenever it sees one.
  const handleScreenReady = useCallback(() => setScreenReady(true), []);

  const handleEnter = async () => {
    await resume();
    setFadeOut(true);
    setTimeout(() => setEntered(true), 500);
  };

  // Camera flight/proximity control: the ref lets CameraDirector read the live OrbitControls
  // instance (target, damped position) without that instance ever going through React state.
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // True while the camera is close enough that the scene reaches the page's own text.
  const [isCameraClose, setIsCameraClose] = useState(false);
  const [flight, setFlight] = useState<FlightRequest | null>(null);

  // Where the pointer went down, so a drag that happens to end over an object is not mistaken for
  // a click on it. R3F fires onClick on pointer-up over the object regardless of how far the
  // pointer travelled, so orbiting and releasing over the MPC would otherwise launch a flight.
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const wasADrag = (event: { clientX: number; clientY: number }) => {
    const down = pointerDownAt.current;
    if (!down) return false;
    return Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6;
  };

  const focusOn = useCallback((target: THREE.Vector3, distance: number, event: { clientX: number; clientY: number }) => {
    if (wasADrag(event)) return;
    setFlight({ target, distance });
  }, []);

  // Responsive camera positioning
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 11, 26]);
  // The pre-aspect-ratio scalar from the ladder below (48/53/57/62), lifted so CameraDirector can
  // compute its close/far thresholds as fractions of it rather than as absolute scene units.
  const [defaultDistance, setDefaultDistance] = useState(62);

  useEffect(() => {
    const updateCameraPosition = () => {
      const { innerWidth, innerHeight } = window;
      const aspectRatio = innerWidth / innerHeight;

      // Over-the-shoulder framing: the viewer stands behind the chair rather than above the
      // desk, so the camera sits low and well back and the object reads as a diorama with
      // room around it.
      let cameraDistance = 62;

      if (innerWidth < 480) {
        // Mobile phones - closer, since the whole vignette has to survive a narrow frame
        cameraDistance = 48;
      } else if (innerWidth < 768) {
        // Large phones / small tablets
        cameraDistance = 53;
      } else if (innerWidth < 1024) {
        // Tablets
        cameraDistance = 57;
      } else {
        // Desktop
        cameraDistance = 62;
      }

      setDefaultDistance(cameraDistance);

      // Three-quarter from behind and to one side. Dead-on reads as a product shot; the
      // off-axis angle is what makes it feel like looking over someone's shoulder at a desk
      // they were just working at.
      if (aspectRatio < 0.8) {
        // Portrait - swing further round so the desk still fills a narrow frame
        setCameraPosition([cameraDistance * 0.5, cameraDistance * 0.66, cameraDistance * 0.72]);
      } else if (aspectRatio > 2.0) {
        setCameraPosition([cameraDistance * 0.42, cameraDistance * 0.55, cameraDistance * 0.78]);
      } else {
        setCameraPosition([cameraDistance * 0.46, cameraDistance * 0.6, cameraDistance * 0.75]);
      }
    };

    updateCameraPosition();
    window.addEventListener('resize', updateCameraPosition);
    return () => window.removeEventListener('resize', updateCameraPosition);
  }, []);

  return (
    <CanvasErrorBoundary fallback={<StaticFallback />}>
    <div
      className="w-full h-screen relative bg-[#f9fafb] overflow-hidden"
      onPointerDown={(e) => { pointerDownAt.current = { x: e.clientX, y: e.clientY }; }}
    >
      {!entered && <WelcomeScreen onEnter={handleEnter} fadeOut={fadeOut} />}
      {entered && <LoadingOverlay extraReady={screenReady} />}
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: cameraPosition, fov: 35 }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame rate to drop for performance
        // Neutral, not ACESFilmic. ACES is built for cinematic HDR contrast and desaturates
        // light surfaces — on a near-white set that shows up as a grey, muddy wash.
        gl={{ toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.06 }}
      >
        <color attach="background" args={['#f9fafb']} />

        {/* Ambient is kept low on purpose. Flooding the scene with it is what made every
            surface read as flat paper — the Environment below is doing the shading work, and
            it can only do that if there is somewhere for its reflections to land. */}
        <ambientLight intensity={0.32} />
        <directionalLight
          position={[9, 15, 7]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={24}
          shadow-camera-bottom={-24}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-10, 7, 4]} intensity={0.32} />

        <OrbitControls
          ref={controlsRef}
          target={[0, -6.5, 0]}
          enabled={!isDragging}
          enablePan={false}
          enableZoom={true}
          minDistance={24}
          maxDistance={90}
          // No angular limits at all — the owner asked for free-form rotation, and it is the same
          // call as everywhere else in this feature: never take the camera away from the visitor.
          // This deliberately gives up the off-axis guarantee the azimuth floor used to enforce,
          // which existed because the MPC collapses into a sliver seen dead-on. Landing there is
          // now the visitor's own doing, and one drag undoes it.
          zoomSpeed={0.8}
          // Enable touch zoom with pinch gestures
          enableDamping={true}
          dampingFactor={0.05}
        />

        <CameraDirector
          controlsRef={controlsRef}
          defaultDistance={defaultDistance}
          onCloseChange={setIsCameraClose}
          request={flight}
        />

        <Stage onOverview={(event) => focusOn(new THREE.Vector3(0, -6.5, 0), defaultDistance, event)} />
        <DeskGear onDragChange={setIsDragging} onFocus={focusOn} />
        <Mpc onDragChange={setIsDragging} onScreenReady={handleScreenReady} entered={entered} onFocus={focusOn} />

        {/* A three-light studio rig rendered into a cube map at runtime. This replaces
            `preset="city"`, which reads as one innocuous prop but actually fetches
            potsdamer_platz_1k.hdr from raw.githack.com on every visit — a third-party CDN in
            the critical path of how the homepage is lit, and a downloaded asset besides.
            Lightformers cost nothing to fetch and can be tuned to this scene's near-white
            palette instead of to a photograph of a city. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.6} color="#ffffff" scale={[14, 9, 1]} position={[7, 11, 6]} target={[0, -2, 0]} />
          <Lightformer form="rect" intensity={0.9} color="#eef1f4" scale={[12, 7, 1]} position={[-9, 6, -4]} target={[0, -2, 0]} />
          <Lightformer form="ring" intensity={0.5} color="#ffffff" scale={5} position={[-4, 3, 9]} target={[0, -2, 0]} />
        </Environment>
      </Canvas>

      {/* --- RESPONSIVE UI OVERLAY --- */}
      {/* The whole text layer retreats while the camera is close, rather than the scene being
          held back from it. Someone examining an instrument is not looking for the About link at
          that moment — and the collision was never only in the corner, since the left monitor
          reaches the name at close range too.

          The fade is CSS off a boolean, not per-frame JavaScript: CameraDirector flips that
          boolean only when the distance actually crosses, and the transition below does the rest. */}
      <div
        className={`absolute inset-0 pointer-events-none p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-between transition-opacity duration-500 ${
          isCameraClose ? 'opacity-0' : 'opacity-100'
        }`}
      >

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
          {/* pointer-events has to follow the opacity. An invisible button that still swallows
              clicks is worse than a visible one. */}
          <nav
            className={`w-full sm:w-1/3 ${
              isCameraClose ? '' : 'pointer-events-auto'
            } flex sm:flex-col items-center sm:items-end gap-x-5 gap-y-2 sm:gap-4 justify-center sm:justify-end pb-2 sm:pb-0`}
          >
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
