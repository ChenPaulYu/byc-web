/**
 * Composes the interactive MPC surface from layout, audio, and reusable 3D primitive boundaries.
 * Reads: public media assets, Vite feature flags, the MPC audio configuration, shot.ts
 * for the working-distance that fills a third of the frame, and CameraDirector for the
 * click→flight contract; optional EchoGame cues reuse the registered physical pad triggers.
 * Writes: pad, knob, transport, keyboard interaction state and game input events.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { PadCue } from './EchoGame';
import type { EchoPhase } from './echoRules';
import { AvatarFallback, AvatarModel, AvatarStage, Knob, MpcButton, Pad, VideoScreen } from './primitives';
import {
  COL_KNOBS_X,
  COL_PADS_X,
  COL_SCREEN_X,
  CONTAINER_DEPTH,
  CONTAINER_WIDTH,
  KNOB_MULTIPLIERS,
  PAD_COLORS,
  PAD_LAYOUT,
  ROW_LOGO_Z,
  ROW_MAIN_Z,
} from './layout';
import { useLayoutControls } from './useLayoutControls';
import { useMpcAudio } from './useMpcAudio';
import { MPC_FOCUS_DISTANCE } from './shot';
import { requestFocus, pointerCursor, type FocusHandler } from './CameraDirector';
import { useDisposable } from './useDisposable';

/**
 * The BYC mark, drawn into a canvas.
 *
 * It used to be a drei <Text>, which renders through troika and fetches a font from
 * fonts.gstatic.com. That request inside the Canvas is what emptied the homepage under
 * `npm run dev`: React's StrictMode mounts, unmounts and mounts again, and the double mount left
 * the text renderer in a state the whole scene never came back from — a blank canvas in
 * development while production builds were fine, which is the worst shape a bug can take.
 *
 * The fix is the rule this project already follows everywhere else and had quietly broken here:
 * no third-party fetches. `<Environment preset="city">` went for pulling an HDRI off a CDN and
 * Tone.js went for its weight; this was the same class of thing and survived only because nobody
 * looked. A canvas costs nothing and the mark renders about ten pixels wide.
 */
const useLogoTexture = () =>
  useDisposable(() => {
    const w = 256;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ef4444';
    ctx.font = '800 72px Inter, Helvetica, Arial, sans-serif';
    ctx.fillText('BYC', w / 2, h / 2 - 22);
    ctx.fillStyle = '#6b7280';
    ctx.font = '600 20px Inter, Helvetica, Arial, sans-serif';
    ctx.fillText('P R O F E S S I O N A L', w / 2, h / 2 + 28);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });

export interface MpcProps {
  onDragChange: (dragging: boolean) => void;
  onScreenReady?: () => void;
  entered?: boolean;
  onFocus?: FocusHandler;
  game?: { active: boolean; phase: EchoPhase; cue: PadCue | null; onPad: (key: string) => void; onChallenge: (event: { clientX: number; clientY: number }) => void };
}

const Mpc: React.FC<MpcProps> = ({ onDragChange, onScreenReady, entered, onFocus, game }) => {
  // --- CENTRALIZED KEYBOARD HANDLING ---
  const padTriggersRef = useRef<Map<string, () => void>>(new Map());
  const root = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!entered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game?.active && e.repeat) return;
      const key = e.key.toLowerCase();
      const triggerFn = padTriggersRef.current.get(key);
      if (triggerFn) triggerFn();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entered, game?.active]);

  const logo = useLogoTexture();
  const { positions, stride } = useLayoutControls();
  const {
    isPlaying,
    knobValues,
    setKnobValues,
    activeBtn,
    triggerPad,
    handlePlay,
    handleStop,
    handlePrev,
    handleNext,
  } = useMpcAudio(entered);

  const padPositions = useMemo(() => PAD_LAYOUT.map((_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    return [(col - 1.5) * stride, 0.1, (row - 1.5) * stride] as [number, number, number];
  }), [stride]);
  const onGamePad = game?.onPad;
  const handlePadTrigger = useCallback((key: string) => {
    triggerPad(key);
    onGamePad?.(key);
  }, [triggerPad, onGamePad]);
  const registerPadTrigger = useCallback((key: string, fn: () => void) => {
    padTriggersRef.current.set(key, fn);
  }, []);

  useEffect(() => {
    if (game?.active) handleStop();
  }, [game?.active, handleStop]);
  useEffect(() => {
    if (game?.cue) padTriggersRef.current.get(game.cue.key)?.();
  }, [game?.cue]);

  return (
    <group
      ref={root}
      name="mpc"
      position={[positions.containerX, -1, positions.containerZ]}
      {...pointerCursor}
      onClick={(e) => {
        // Pads, knobs and transport all stopPropagation, so this only fires from the chassis
        // or the screen — playing the instrument never flies the camera.
        if (!root.current) return;
        requestFocus(onFocus, root.current.getWorldPosition(new THREE.Vector3()), MPC_FOCUS_DISTANCE, e, null);
      }}
    >
      {/* --- MPC CONTAINER (OUTER BOX) --- */}
      <RoundedBox args={[CONTAINER_WIDTH, 1, CONTAINER_DEPTH]} radius={0.08} smoothness={4} position={[0, -0.5, 0]} castShadow>
        <meshPhysicalMaterial color="#f3f4f6" roughness={0.38} metalness={0.12} clearcoat={0.18} clearcoatRoughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[CONTAINER_WIDTH - 0.08, 0.15, CONTAINER_DEPTH - 0.08]} radius={0.04} smoothness={3} position={[0, -0.96, 0]} castShadow>
        <meshStandardMaterial color="#42464b" roughness={0.72} metalness={0.08} />
      </RoundedBox>
      {[-1, 1].flatMap(x => [-1, 1].map(z => (
        <mesh key={`${x}-${z}`} position={[x * (CONTAINER_WIDTH / 2 - 0.19), 0.008, z * (CONTAINER_DEPTH / 2 - 0.19)]}>
          <cylinderGeometry args={[0.046, 0.046, 0.014, 12]} />
          <meshStandardMaterial color="#989ca0" roughness={0.35} metalness={0.8} />
        </mesh>
      )))}

      {/* --- LOGO ROW (TOP RIGHT) --- */}
      <mesh position={[COL_KNOBS_X, 0.01, ROW_LOGO_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[positions.logoMainSize * 5.4, positions.logoMainSize * 3.4]} />
        <meshBasicMaterial map={logo ?? undefined} transparent alphaTest={0.15} toneMapped={false} />
      </mesh>

      {/* --- COLUMN 1: PADS (2/4 = 50%) --- */}
      <group position={[COL_PADS_X + positions.padsSectionX, 0, ROW_MAIN_Z + positions.padsSectionZ]}>
        {PAD_LAYOUT.map((pad, i) => {
          const row = Math.floor(i / 4);

          return (
            <Pad
              key={pad.key}
              position={padPositions[i]}
              size={positions.padSize}
              height={positions.padHeight}
              triggerKey={pad.key}
              color={PAD_COLORS[row]}
              idleTint={row === 3 && game?.active ? game.phase === 'success' || game.phase === 'complete' ? '#a7d7c0' : '#8295aa' : undefined}
              onTrigger={handlePadTrigger}
              registerTrigger={registerPadTrigger}
            />
          );
        })}
      </group>

      {/* --- COLUMN 2: SCREEN (1.5/4 = 37.5%) --- */}
      <group position={[COL_SCREEN_X + positions.screenSectionX, 0, ROW_MAIN_Z + positions.screenSectionZ]}>
        {/* The screen plays a video rather than drawing the spectrum. A live readout was built
            and reverted: it deleted the asset and tied the machine's one saturated element to
            what the visitor was doing, but the owner prefers this. The Suspense wrapper is back
            with it, because a video element has to load and a canvas does not. */}
        <group position={[0, 0, -0.8]}>
          <Suspense fallback={
            <RoundedBox args={[positions.screenWidth, positions.screenHeight, positions.screenDepth]} radius={0.08} position={[0, 0.08, 0]} receiveShadow>
              <meshStandardMaterial color="#d1fae5" roughness={0.2} />
            </RoundedBox>
          }>
            <VideoScreen
              width={positions.screenWidth}
              height={positions.screenHeight}
              depth={positions.screenDepth}
              opacity={positions.videoOpacity}
              rotationX={positions.videoRotationX}
              rotationY={positions.videoRotationY}
              rotationZ={positions.videoRotationZ}
              onReady={onScreenReady}
            />
          </Suspense>

          {/* The avatar is projected out of the screen once the visitor is in, rather than
              already standing there when the lights come up. */}
          <group name="echo-avatar" {...pointerCursor} onClick={(event) => { event.stopPropagation(); game?.onChallenge(event.nativeEvent); }}>
          <mesh position={[0, 1.3, 0]}>
            <boxGeometry args={[1.1, 2.4, 1.4]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <AvatarStage
            armed={Boolean(entered)}
            scale={positions.avatarScale}
            space={game?.phase === 'success' || game?.phase === 'complete' ? Math.max(knobValues[2], 0.7) : knobValues[2]}
          >
            <Suspense fallback={<AvatarFallback />}>
              <AvatarModel />
            </Suspense>
          </AvatarStage>
          </group>
        </group>

        {/* Transport Buttons */}
        <group position={[0, 0, positions.buttonsOffsetZ]}>
          <MpcButton
            position={[-1.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="PREV"
            ledColor="#fbbf24"
            onClick={handlePrev}
            isActive={activeBtn === 'PREV'}
          />
          <MpcButton
            position={[-0.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="NXT"
            ledColor="#9ca3af"
            onClick={handleNext}
            isActive={activeBtn === 'NXT'}
          />
          <MpcButton
            position={[0.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="STOP"
            ledColor="#f87171"
            onClick={handleStop}
            isActive={activeBtn === 'STOP'}
          />
          <MpcButton
            position={[1.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="PLAY"
            ledColor="#4ade80"
            onClick={handlePlay}
            isActive={isPlaying}
          />
        </group>
      </group>

      {/* --- COLUMN 3: KNOBS (0.5/4 = 12.5%) --- */}
      <group position={[COL_KNOBS_X, 0, ROW_MAIN_Z]}>
        {KNOB_MULTIPLIERS.map((multiplier, i) => (
          <group key={i} position={[0, 0, multiplier * positions.knobSpacing]}>
            <Knob
              position={[0, 0, 0]}
              value={knobValues[i]}
              onChange={(val) => {
                const newValues = [...knobValues];
                newValues[i] = val;
                setKnobValues(newValues);
              }}
              onDragChange={onDragChange}
            />
          </group>
        ))}
      </group>
    </group>
  );
};

export default React.memo(Mpc);
