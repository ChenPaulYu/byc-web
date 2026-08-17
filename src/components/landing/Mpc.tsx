/**
 * Composes the interactive MPC surface from layout, audio, and reusable 3D primitive boundaries.
 * Reads: public media assets, Vite feature flags, and the MPC audio configuration.
 * Writes: pad, knob, transport, and keyboard interaction state.
 */

import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
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
import { cm } from './scale';
import { useMpcAudio } from './useMpcAudio';
import { LIGHT_ASH, createWoodMaps } from './wood';
import { useDisposable } from './useDisposable';

/**
 * Timber on each end. 1.6 cm rather than the 2.5 that looked right first: the knob column sits at
 * x 3.94 with the chassis edge at 4.5, so a wider cheek reaches under the outermost knobs. The
 * layout fills this chassis edge to edge and there is no spare room at either end.
 */
const CHEEK_W = cm(1.6);

/**
 * Which pads sit lit when nothing is playing. Sixteen identical grey squares read as a grille;
 * a handful of lit ones read as an instrument someone has a session loaded on. Deliberately
 * sparse and desaturated — the glow is the machine's only colour, so it does not need to shout.
 */
const IDLE_TINTS: Array<string | undefined> = [
  '#e8dcc2', undefined, undefined, '#d6cdba',
  undefined, '#eadfc4', undefined, undefined,
  undefined, undefined, '#d9d0bd', undefined,
  '#e4d8bf', undefined, undefined, undefined,
];

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
  useMemo(() => {
    const w = 256;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ef4444';
    ctx.font = '800 78px Inter, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BYC', w / 2, h / 2 - 4);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

/** A perforated speaker grille, drawn once. Rows of small holes on a slightly darker field. */
const useGrilleTexture = () =>
  useMemo(() => {
    const w = 512;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#cdc7bb';
    ctx.fillRect(0, 0, w, h);
    const pitch = 7;
    ctx.fillStyle = '#8e887d';
    for (let y = pitch / 2; y < h; y += pitch) {
      const offset = ((y / pitch) | 0) % 2 ? pitch / 2 : 0;
      for (let x = pitch / 2 + offset; x < w; x += pitch) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

export type FocusHandler = (
  target: THREE.Vector3,
  distance: number,
  event: { clientX: number; clientY: number },
) => void;

/** Chassis is 9 units across; this lands it comfortably inside the frame. */
const MPC_FOCUS_DISTANCE = 27;

export interface MpcProps {
  onDragChange: (dragging: boolean) => void;
  onScreenReady?: () => void;
  entered?: boolean;
  onFocus?: FocusHandler;
}

const Mpc: React.FC<MpcProps> = ({ onDragChange, onScreenReady, entered, onFocus }) => {
  // --- CENTRALIZED KEYBOARD HANDLING ---
  const padTriggersRef = useRef<Map<string, () => void>>(new Map());
  const root = useRef<THREE.Group>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const triggerFn = padTriggersRef.current.get(key);
      if (triggerFn) triggerFn();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const grille = useGrilleTexture();
  const logo = useLogoTexture();
  // Finer ring pitch than the desk: the cheek is a tenth of the desk's width on screen, so the
  // desk's deliberately-coarse grain would read as two or three stripes on it.
  const cheek = useDisposable(() => createWoodMaps({ ...LIGHT_ASH, repeat: [1.4, 1], seed: 91, ringPitch: 26 }));
  const { positions, responsiveScale, stride } = useLayoutControls();
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

  return (
    <group
      ref={root}
      position={[positions.containerX, -1, positions.containerZ]}
      scale={responsiveScale}
      onClick={(e) => {
        // Pads, knobs and transport all stopPropagation, so this only fires from the chassis,
        // the cheeks, the grille or the screen — playing the instrument never flies the camera.
        if (!onFocus || !root.current) return;
        e.stopPropagation();
        onFocus(root.current.getWorldPosition(new THREE.Vector3()), MPC_FOCUS_DISTANCE, e.nativeEvent);
      }}
    >
      {/* --- MPC CONTAINER (OUTER BOX) --- */}
      <RoundedBox args={[CONTAINER_WIDTH, 1, CONTAINER_DEPTH]} radius={0.2} smoothness={4} position={[0, -0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#ece7dd" roughness={0.58} metalness={0.04} />
      </RoundedBox>

      {/* Wooden end cheeks, which the MPC 60 and 3000 both had and which most of this family
          still does. They are the machine's only warm material, and they tie it to the desk
          without repeating it — a paler timber on purpose, because the chassis separates from
          the walnut below by about eighty points of luminance and cheeks in the desk's own wood
          would hand two of its edges back to the background.

          Standing a few millimetres proud rather than flush: coplanar faces z-fight, and a cheek
          slightly higher than the deck is what the real ones do anyway. */}
      {cheek && [-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[CHEEK_W, 1.004, CONTAINER_DEPTH + 0.01]}
          radius={0.16}
          smoothness={4}
          position={[side * (CONTAINER_WIDTH / 2 - CHEEK_W / 2), -0.498, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            key={cheek ? 'ash' : 'bare'}
            map={cheek.map}
            normalMap={cheek.normalMap}
            normalScale={new THREE.Vector2(0.5, 0.5)}
            roughnessMap={cheek.roughnessMap}
            roughness={1}
            metalness={0}
            envMapIntensity={0.7}
          />
        </RoundedBox>
      ))}

      {/* --- LOGO ROW (TOP RIGHT) --- */}
      <mesh position={[COL_KNOBS_X, 0.01, ROW_LOGO_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[positions.logoMainSize * 4.2, positions.logoMainSize * 2.1]} />
        <meshBasicMaterial map={logo ?? undefined} transparent toneMapped={false} />
      </mesh>

      {/* Speaker grille, on the front vertical face rather than the top deck — which is where
          the machines it stands in for put it, and also the only place it fits: once the pad
          well and the transport row have taken their space the top has about 2 cm of front
          edge left. The chassis box spans y -1..0, so this strip sits mid-face. */}
      <mesh position={[0, -0.55, CONTAINER_DEPTH / 2 + 0.005]}>
        <planeGeometry args={[CONTAINER_WIDTH - cm(10), cm(3)]} />
        <meshStandardMaterial map={grille ?? undefined} color="#cfc9bd" roughness={0.9} metalness={0.02} />
      </mesh>

      {/* No large control knob here, though the machines this stands in for have one.
          The knob column is 5.8 cm wide and already full: four knobs with their tick rings run
          from z -1.19 to 2.19, the chassis ends at 2.5, and the logo holds the back of the
          column. A fifth control was added here for size contrast and overlapped two of the four
          — and those four are the ones that will actually do something, so they win. */}

      {/* --- COLUMN 1: PADS (2/4 = 50%) --- */}
      <group position={[COL_PADS_X + positions.padsSectionX, 0, ROW_MAIN_Z + positions.padsSectionZ]}>
        {/* The pad well: the one dark mass on an all-cream body, so it carries the silhouette.
            It is a single plate, not a rim around a floor — the pad grid is 3.93 units across
            inside a 9-unit chassis and clears the left edge by 1.5 cm, which leaves no room for
            two concentric rings. The cream chassis is the pale surround.

            Most of the darkness comes from the gaps rather than the border: the plate sits just
            above the deck, so the three channels between pad columns and rows read dark instead
            of cream, and the grid becomes a lattice rather than sixteen tiles on a white slab. */}
        <RoundedBox
          args={[cm(22), cm(1), cm(22)]}
          radius={cm(0.5)}
          smoothness={4}
          position={[0, 0.02 - cm(0.5), 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#877b6b" roughness={0.85} metalness={0.03} />
        </RoundedBox>

        <group position={[0, 0, 0]}>
          {PAD_LAYOUT.map((pad, i) => {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const x = (col - 1.5) * stride;
            const z = (row - 1.5) * stride;

            // Which pad has a sample and which falls back to the synth voice is the audio
            // layer's business, not this component's — it used to be decided here, against a
            // ref to the Tone graph.
            const handleTrigger = () => triggerPad(pad.key);

            return (
              <Pad
                key={pad.key}
                position={[x, 0.1, z]}
                size={positions.padSize}
                height={positions.padHeight}
                triggerKey={pad.key}
                color={PAD_COLORS[row]}
                idleTint={IDLE_TINTS[i]}
                onTrigger={handleTrigger}
                registerTrigger={(key, fn) => padTriggersRef.current.set(key, fn)}
              />
            );
          })}
        </group>
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
          <AvatarStage
            armed={Boolean(entered)}
            scale={positions.avatarScale}
            drive={knobValues[1]}
            space={knobValues[2]}
          >
            <Suspense fallback={<AvatarFallback />}>
              <AvatarModel />
            </Suspense>
          </AvatarStage>
        </group>

        {/* Transport Buttons */}
        <group position={[0, 0, positions.buttonsOffsetZ]}>
          <MpcButton
            position={[-1.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="PREV"
            ledColor="#d6a854"
            onClick={handlePrev}
            isActive={activeBtn === 'PREV'}
          />
          <MpcButton
            position={[-0.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="NXT"
            ledColor="#a49b8e"
            onClick={handleNext}
            isActive={activeBtn === 'NXT'}
          />
          <MpcButton
            position={[0.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="STOP"
            ledColor="#c47a66"
            onClick={handleStop}
            isActive={activeBtn === 'STOP'}
          />
          <MpcButton
            position={[1.5 * positions.buttonSpacing, 0, 0]}
            width={positions.buttonWidth}
            height={positions.buttonHeight}
            label="PLAY"
            ledColor="#89a37c"
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

export default Mpc;
