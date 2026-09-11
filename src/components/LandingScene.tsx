/**
 * Hosts the instrument after Power on: Canvas lifecycle, camera behavior, ceiling-light state and navigation overlay.
 * Reads: the composed landing-scene modules (stage, MPC, overlays, shot.ts for the authored
 * camera frame, room.ts for the light palette, captions.ts for object introductions);
 * writes: navigation and focus state. The welcome gate lives in Home
 * so this module — and three.js — stay out of the first
 * paint.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment, Lightformer } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { CanvasErrorBoundary, FocusAnchor, FocusCaption, LoadingOverlay, StaticFallback } from './landing/overlays';
import { Stage, DESK_TOP_Y, FLOOR_Y } from './landing/Stage';
import { DeskGear } from './landing/DeskGear';
import Mpc from './landing/Mpc';
import { ROOM } from './landing/room';
import { SketchLayer } from './landing/SketchLayer';
import { RoomControls } from './landing/RoomControls';
import { cameraBounds, type RoomControlHandle } from './landing/roomCamera';
import { useEchoGame } from './landing/EchoGame';
import { CameraDirector, type FlightRequest } from './landing/CameraDirector';
import { authoredShot, CAPTION_HALO, FOOTBALL_FOCUS_DISTANCE } from './landing/shot';
import { CAPTIONS, type Caption, type CaptionSubject } from './landing/captions';

const LandingScene: React.FC = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [screenReady, setScreenReady] = useState(false);
  const game = useEchoGame();
  const gameActive = game.state.phase !== 'idle';
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

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

  // Transient look/approach input shares a small handle with the existing flight director.
  const controlsRef = useRef<RoomControlHandle>(null);
  const bounds = useMemo(() => cameraBounds(FLOOR_Y, DESK_TOP_Y), []);
  const [hasExplored, setHasExplored] = useState(false);
  const didExploreRef = useRef(false);
  const handleExplore = useCallback(() => { didExploreRef.current = true; setHasExplored(true); }, []);

  // True while the camera is close enough that the scene reaches the page's own text.
  const [isCameraClose, setIsCameraClose] = useState(false);
  const [ceilingOn, setCeilingOn] = useState(true);
  const [flight, setFlight] = useState<FlightRequest | null>(null);
  const [captionSubject, setCaptionSubject] = useState<CaptionSubject | null>(null);
  const [sketchMode, setSketchMode] = useState<'sound' | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const captionAnchorRef = useRef<THREE.Vector3 | null>(null);
  const captionHaloRef = useRef(0);

  // Where the pointer went down, so a drag that happens to end over an object is not mistaken for
  // a click on it. R3F fires onClick on pointer-up over the object regardless of how far the
  // pointer travelled, so orbiting and releasing over the MPC would otherwise launch a flight.
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const wasADrag = (event: { clientX: number; clientY: number }) => {
    if (didExploreRef.current) return true;
    const down = pointerDownAt.current;
    if (!down) return false;
    return Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6;
  };

  // Keep the initial interior eye stable during resize; reset uses the new viewport's shot.
  const opening = useRef(
    typeof window === 'undefined' ? authoredShot(1440, 900) : authoredShot(window.innerWidth, window.innerHeight),
  ).current;
  const [shot, setShot] = useState(opening);

  useEffect(() => {
    const onResize = () => setShot(authoredShot(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);


  const focusOn = useCallback((
    target: THREE.Vector3,
    distance: number,
    event: { clientX: number; clientY: number },
    subject: CaptionSubject | null,
  ) => {
    if (wasADrag(event)) return;
    game.exit();
    setSketchMode(subject === null ? 'sound' : null);
    setFlight({ target, distance, focused: true });
    setCaptionSubject(subject);
    captionAnchorRef.current = subject ? target : null;
    captionHaloRef.current = subject ? CAPTION_HALO[subject] : 0;
  }, [game.exit]);

  const handleOverview = useCallback((event: { clientX: number; clientY: number }) => {
    if (wasADrag(event)) return;
    game.exit();
    setSketchMode(null);
    setFlight({ target: new THREE.Vector3(...shot.target), distance: shot.distance, position: new THREE.Vector3(...shot.position), fov: shot.fov });
    setCaptionSubject(null); captionAnchorRef.current = null; captionHaloRef.current = 0;
    setHasExplored(false);
  }, [game.exit, shot]);

  const focusCaption = useMemo((): Caption | null => {
    if (!captionSubject) return null;
    return CAPTIONS[captionSubject];
  }, [captionSubject]);

  const resetToOverview = useCallback(() => {
    setSketchMode(null);
    setHasExplored(false);
    game.exit();
    setFlight({
      target: new THREE.Vector3(...shot.target),
      distance: shot.distance,
      position: new THREE.Vector3(...shot.position),
      fov: shot.fov,
    });
    setCaptionSubject(null);
    captionAnchorRef.current = null;
    captionHaloRef.current = 0;
  }, [shot, game.exit]);

  const startGame = () => {
    setSketchMode(null);
    setCaptionSubject(null);
    captionAnchorRef.current = null;
    const aspect = window.innerWidth / window.innerHeight;
    const distance = Math.max(24, 10.6 / (2 * Math.tan(THREE.MathUtils.degToRad(opening.fov / 2)) * aspect));
    const target = new THREE.Vector3(0, -1, 0);
    setFlight({ target, distance, focused: true, position: target.clone().add(new THREE.Vector3(8, 26, 24).normalize().multiplyScalar(distance)) });
    game.start();
  };

  return (
    <CanvasErrorBoundary fallback={<StaticFallback />}>
    <div
      data-game-phase={game.state.phase}
      data-echo-cue={game.cue?.key ?? ''}
      className="w-full h-screen relative bg-[#f9fafb] overflow-hidden"
      onPointerDown={(e) => { didExploreRef.current = false; pointerDownAt.current = { x: e.clientX, y: e.clientY }; }}
    >
      <LoadingOverlay extraReady={screenReady} />
      <Canvas
        frameloop="always"
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: opening.position, fov: opening.fov, near: opening.near, far: opening.far }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame rate to drop for performance
        onPointerLeave={() => { document.body.style.cursor = 'auto'; }}
        // Neutral, not ACESFilmic. ACES is built for cinematic HDR contrast and desaturates
        // light surfaces — on a near-white set that shows up as a grey, muddy wash.
        gl={{ toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.06 }}
      >
        <color attach="background" args={['#f9fafb']} />

        {/* Broad daylight lifts the room; a single directional shadow retains contact/depth. */}
        <ambientLight intensity={ROOM.lighting.ambient * (ceilingOn ? 1 : 0.6)} color={ROOM.cool} />
        <directionalLight
          position={[-18, 18, 12]}
          intensity={ROOM.lighting.daylight}
          color={ROOM.cool}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={35}
          shadow-camera-bottom={-35}
          shadow-bias={-0.0004}
          shadow-radius={4}
        />
        <directionalLight position={[14, 8, 10]} intensity={ROOM.lighting.bounce * (ceilingOn ? 1 : 0.25)} color={ROOM.warm} />
        <pointLight position={ROOM.lamp} color={ROOM.warm} intensity={ROOM.lighting.lamp} distance={26} decay={2} />

        <RoomControls
          controlsRef={controlsRef}
          target={opening.target}
          bounds={bounds}
          enabled={!isDragging}
          onExplore={handleExplore}
        />

        <CameraDirector
          controlsRef={controlsRef}
          defaultDistance={shot.distance}
          onCloseChange={setIsCameraClose}
          request={flight}
          reducedMotion={reducedMotion}
        />
        <FocusAnchor popupRef={popupRef} anchorRef={captionAnchorRef} haloRef={captionHaloRef} />

        <Stage
          onOverview={handleOverview}
          onFocus={focusOn}
          footballDistance={FOOTBALL_FOCUS_DISTANCE}
          ceilingOn={ceilingOn}
          onCeilingToggle={event => { if (!wasADrag(event)) setCeilingOn(on => !on); }}
        />
        <DeskGear onDragChange={setIsDragging} onFocus={focusOn} />
        <Mpc onDragChange={setIsDragging} onScreenReady={handleScreenReady} entered onFocus={focusOn} game={{ active: gameActive, phase: game.state.phase, cue: game.cue, onPad: game.onPad, onChallenge: event => { if (!wasADrag(event)) { if (gameActive) resetToOverview(); else startGame(); } } }} />
        {!gameActive && sketchMode && (
          <SketchLayer mode={sketchMode} reducedMotion={reducedMotion} />
        )}

        {/* A three-light studio rig rendered into a cube map at runtime. This replaces
            `preset="city"`, which reads as one innocuous prop but actually fetches
            potsdamer_platz_1k.hdr from raw.githack.com on every visit — a third-party CDN in
            the critical path of how the homepage is lit, and a downloaded asset besides.
            Lightformers cost nothing to fetch and can be tuned to this scene's near-white
            palette instead of to a photograph of a city. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={ROOM.lighting.windowReflection} color={ROOM.cool} scale={[14, 18, 1]} position={[-18, 10, 6]} target={[0, -2, 0]} />
          <Lightformer form="rect" intensity={ROOM.lighting.fillReflection} color={ROOM.warm} scale={[8, 7, 1]} position={[14, 8, 0]} target={[0, -2, 0]} />
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
        inert={isCameraClose || gameActive}
        aria-hidden={isCameraClose || gameActive}
        className={`absolute inset-0 pointer-events-none p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-between bg-[linear-gradient(to_bottom,rgba(255,255,255,.92),transparent_27%,transparent_65%,rgba(255,255,255,.88))] transition-opacity duration-500 ${
          isCameraClose || gameActive ? 'opacity-0' : 'opacity-100'
        }`}
      >

        {/* Header: Top Left */}
        <header className="z-10">
          <h1 className="text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-sans tracking-tight text-neutral-900 mb-1 sm:mb-2">
            Bo-Yu Chen
          </h1>
          <p className="text-neutral-600 font-mono text-xs sm:text-sm md:text-base tracking-wide">
            Researcher // Engineer // Builder
          </p>
        </header>

        {/* Footer Area */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full mt-auto gap-2 sm:gap-0 pb-6 sm:pb-0">
          {/* Mobile: Center everything, Desktop: Left Spacer */}
          <div className="hidden sm:block sm:w-1/3"></div>

          <div className="w-full sm:w-1/3" aria-hidden />

          {/* Right: Navigation */}
          {/* Only visible buttons receive clicks; the wide nav's empty area must pass through
              to room objects such as the door-side light switch. */}
          <nav
            className={`w-full sm:w-1/3 ${
              isCameraClose ? '' : '[&>button]:pointer-events-auto'
            } flex sm:flex-col items-center sm:items-end gap-x-5 gap-y-2 sm:gap-4 justify-center sm:justify-end pb-2 sm:pb-0`}
          >
            <button
              onClick={() => navigate('/about')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-blue-600 transition-colors font-normal touch-manipulation"
            >
              About
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-blue-600 transition-colors font-normal touch-manipulation"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-blue-600 transition-colors font-normal touch-manipulation"
            >
              Blog
            </button>
            <button
              onClick={() => navigate('/cv')}
              className="text-sm sm:text-lg md:text-xl text-neutral-800 hover:text-blue-600 transition-colors font-normal touch-manipulation"
            >
              CV
            </button>
          </nav>
        </div>
      </div>
      {/* Pin on the object, leader to the sentence. Same close/far boolean; whoever last flew. */}
      <FocusCaption
        popupRef={popupRef}
        visible={!gameActive && isCameraClose && captionSubject !== null}
        caption={focusCaption}
      />

      {/* Keyboard access stays available without turning the scene into a tutorial. */}
      <button type="button" onClick={gameActive ? resetToOverview : startGame}
        className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-30 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:ring-2 focus:ring-blue-600">
        {gameActive ? 'End Echo Desk' : 'Echo Desk'}
      </button>
      <p className="sr-only" aria-live="polite">
        {gameActive ? game.state.phase === 'listen' ? 'Listen.' : game.state.phase === 'answer' ? 'Your turn. Z, X, C, V.' : '' : ''}
      </p>

      {/* Reset stays available after looking away, without covering the original name. */}
      {(isCameraClose || gameActive || hasExplored || captionSubject !== null) && (
        <button
          type="button"
          onClick={resetToOverview}
          aria-label="Return to overview"
          className="group absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-20 flex items-center gap-2.5 rounded-full border border-neutral-200/90 bg-white/75 py-1.5 pl-1.5 pr-3.5 text-neutral-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-neutral-300 hover:bg-white hover:text-neutral-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9fafb] touch-manipulation"
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
