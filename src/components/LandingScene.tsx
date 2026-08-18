/**
 * Hosts the instrument after Power on: Canvas lifecycle, camera behavior, and navigation overlay.
 * Reads: the composed landing-scene modules (stage, MPC, overlays, shot.ts for the authored
 * camera frame, captions.ts for the last flown object's line); writes: navigation and focus
 * state. The welcome gate lives in Home so this module — and three.js — stay out of the first
 * paint.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useNavigate } from 'react-router-dom';
import { CanvasErrorBoundary, FocusAnchor, FocusCaption, LoadingOverlay, StaticFallback } from './landing/overlays';
import { Stage } from './landing/Stage';
import { DeskGear } from './landing/DeskGear';
import Mpc from './landing/Mpc';
import { CameraDirector, type FlightRequest } from './landing/CameraDirector';
import { authoredShot, CAPTION_HALO, FOOTBALL_FOCUS_DISTANCE } from './landing/shot';
import { CAPTIONS, type Caption, type CaptionSubject } from './landing/captions';

const LandingScene: React.FC = () => {
  const navigate = useNavigate();
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

  // Camera flight/proximity control: the ref lets CameraDirector read the live OrbitControls
  // instance (target, damped position) without that instance ever going through React state.
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // True while the camera is close enough that the scene reaches the page's own text.
  const [isCameraClose, setIsCameraClose] = useState(false);
  const [flight, setFlight] = useState<FlightRequest | null>(null);
  const [captionSubject, setCaptionSubject] = useState<CaptionSubject | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const captionAnchorRef = useRef<THREE.Vector3 | null>(null);
  const captionHaloRef = useRef(0);

  // Where the pointer went down, so a drag that happens to end over an object is not mistaken for
  // a click on it. R3F fires onClick on pointer-up over the object regardless of how far the
  // pointer travelled, so orbiting and releasing over the MPC would otherwise launch a flight.
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const wasADrag = (event: { clientX: number; clientY: number }) => {
    const down = pointerDownAt.current;
    if (!down) return false;
    return Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6;
  };

  // Authored overview: target and distance are derived from the portrait (desk + football),
  // not from a ladder of magic numbers. The opening pose is frozen so a resize cannot yank a
  // camera the visitor is already orbiting; distance still updates for the fade threshold and
  // for restoring the shot when they click the desk.
  const opening = useRef(
    typeof window === 'undefined' ? authoredShot(1440, 900) : authoredShot(window.innerWidth, window.innerHeight),
  ).current;
  const [shot, setShot] = useState(opening);

  useEffect(() => {
    const onResize = () => setShot(authoredShot(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const [hasLookedCloser, setHasLookedCloser] = useState(false);
  const overviewDistance = useRef(opening.distance);
  overviewDistance.current = shot.distance;

  const focusOn = useCallback((
    target: THREE.Vector3,
    distance: number,
    event: { clientX: number; clientY: number },
    subject: CaptionSubject | null,
  ) => {
    if (wasADrag(event)) return;
    setFlight({ target, distance });
    setCaptionSubject(subject);
    captionAnchorRef.current = subject ? target : null;
    captionHaloRef.current = subject ? CAPTION_HALO[subject] : 0;
    if (distance < overviewDistance.current * 0.9) setHasLookedCloser(true);
  }, []);

  const focusCaption = useMemo((): Caption | null => {
    if (!captionSubject) return null;
    return CAPTIONS[captionSubject];
  }, [captionSubject]);

  const resetToOverview = useCallback(() => {
    setFlight({
      target: new THREE.Vector3(...shot.target),
      distance: shot.distance,
      position: new THREE.Vector3(...shot.position),
    });
    setCaptionSubject(null);
    captionAnchorRef.current = null;
    captionHaloRef.current = 0;
  }, [shot]);

  return (
    <CanvasErrorBoundary fallback={<StaticFallback />}>
    <div
      className="w-full h-screen relative bg-[#f9fafb] overflow-hidden"
      onPointerDown={(e) => { pointerDownAt.current = { x: e.clientX, y: e.clientY }; }}
    >
      <LoadingOverlay extraReady={screenReady} />
      <Canvas
        frameloop="always"
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: opening.position, fov: opening.fov, near: opening.near, far: opening.far }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame rate to drop for performance
        onPointerLeave={() => { document.body.style.cursor = 'auto'; }}
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
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={24}
          shadow-camera-bottom={-24}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-10, 7, 4]} intensity={0.32} />

        <OrbitControls
          ref={controlsRef}
          target={opening.target}
          enabled={!isDragging}
          enablePan={false}
          enableZoom={true}
          // 12, not 24. The Sidekick is 1.76 units across, and at this fov the visible width in
          // scene units is almost exactly the camera distance — so a floor of 24 caps its faders
          // at 18 px, which is not a target. At 12 they reach 35. Loosening, not clamping, and
          // only safe because the page's text layer now fades out of the way.
          minDistance={12}
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
          defaultDistance={shot.distance}
          onCloseChange={setIsCameraClose}
          request={flight}
        />
        <FocusAnchor popupRef={popupRef} anchorRef={captionAnchorRef} haloRef={captionHaloRef} />

        <Stage
          onOverview={(event) => focusOn(new THREE.Vector3(...shot.target), shot.distance, event, null)}
          onFocus={focusOn}
          footballDistance={FOOTBALL_FOCUS_DISTANCE}
        />
        <DeskGear onDragChange={setIsDragging} onFocus={focusOn} />
        <Mpc onDragChange={setIsDragging} onScreenReady={handleScreenReady} entered onFocus={focusOn} />

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

          {/* Center: look-closer hint until the first flight, then the keyboard. */}
          <div className="w-full sm:w-1/3 text-center pb-1 sm:pb-4">
            <p className="text-neutral-300 text-xs sm:text-xs md:text-sm font-mono tracking-widest uppercase">
              {hasLookedCloser ? (
                <>
                  <span className="hidden sm:inline">Keyboard: 1-4, Q-R, A-F, Z-V</span>
                  <span className="sm:hidden">Tap pads to play</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Click something to look closer</span>
                  <span className="sm:hidden">Tap something to look closer</span>
                </>
              )}
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
      {/* Pin on the object, leader to the sentence. Same close/far boolean; whoever last flew. */}
      <FocusCaption
        popupRef={popupRef}
        visible={isCameraClose && captionSubject !== null}
        caption={focusCaption}
      />

      {/* Overview sits where the name was — away from floor objects and caption labels. */}
      {isCameraClose && (
        <button
          type="button"
          onClick={resetToOverview}
          aria-label="Return to overview"
          className="group absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 z-20 flex items-center gap-2.5 rounded-full border border-neutral-200/90 bg-white/75 py-1.5 pl-1.5 pr-3.5 text-neutral-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-neutral-300 hover:bg-white hover:text-neutral-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9fafb] touch-manipulation"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200/90 bg-[#f9fafb] text-neutral-500 transition-colors duration-300 group-hover:border-neutral-300 group-hover:text-neutral-900">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="transition-transform duration-300 group-hover:scale-105"
              aria-hidden="true"
            >
              <path d="M2.5 6V2.5H6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 2.5H13.5V6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.5 10V13.5H10" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 13.5H2.5V10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-xs font-medium tracking-wide sm:text-sm">Overview</span>
        </button>
      )}
    </div>
    </CanvasErrorBoundary>
  );
};

export default LandingScene;
