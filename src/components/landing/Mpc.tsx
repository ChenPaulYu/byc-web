/**
 * Composes the interactive MPC surface from layout, audio, and reusable 3D primitive boundaries.
 * Reads: public media assets, Vite feature flags, and the MPC audio configuration.
 * Writes: pad, knob, transport, and keyboard interaction state.
 */

import React, { Suspense, useEffect, useRef } from 'react';
import { RoundedBox, Text } from '@react-three/drei';
import * as Tone from 'tone';
import { AvatarFallback, AvatarModel, Knob, MpcButton, Pad, VideoScreen } from './primitives';
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

const VIDEO_ENABLED = import.meta.env.VITE_ENABLE_VIDEO !== 'false';

export interface MpcProps {
  synth: Tone.PolySynth;
  onDragChange: (dragging: boolean) => void;
  onVideoReady?: () => void;
}

const Mpc: React.FC<MpcProps> = ({ synth, onDragChange, onVideoReady }) => {
  // --- CENTRALIZED KEYBOARD HANDLING ---
  const padTriggersRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const triggerFn = padTriggersRef.current.get(key);
      if (triggerFn) triggerFn();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { positions, responsiveScale, stride } = useLayoutControls();
  const {
    isPlaying,
    knobValues,
    setKnobValues,
    activeBtn,
    mpcConfig,
    effects,
    handlePlay,
    handleStop,
    handlePrev,
    handleNext,
  } = useMpcAudio(synth);

  return (
    <group position={[positions.containerX, -1, positions.containerZ]} scale={responsiveScale}>
      {/* --- MPC CONTAINER (OUTER BOX) --- */}
      <RoundedBox args={[CONTAINER_WIDTH, 1, CONTAINER_DEPTH]} radius={0.2} smoothness={4} position={[0, -0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#f3f4f6" roughness={0.5} metalness={0.1} />
      </RoundedBox>

      {/* --- LOGO ROW (TOP RIGHT) --- */}
      <group position={[COL_KNOBS_X, 0.01, ROW_LOGO_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <Text
          fontSize={positions.logoMainSize}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          color="#ef4444"
          anchorX="center"
          position={[0, 0, 0]}
          fontWeight="800"
          letterSpacing={-0.05}
        >
          BYC
        </Text>
        <Text
          fontSize={positions.logoSubSize}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          color="#6b7280"
          anchorX="center"
          position={[0, -0.25, 0]}
          letterSpacing={0.2}
        >
          PROFESSIONAL
        </Text>
      </group>

      {/* --- COLUMN 1: PADS (2/4 = 50%) --- */}
      <group position={[COL_PADS_X + positions.padsSectionX, 0, ROW_MAIN_Z + positions.padsSectionZ]}>
        <group position={[0, 0, 0]}>
          {PAD_LAYOUT.map((pad, i) => {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const x = (col - 1.5) * stride;
            const z = (row - 1.5) * stride;

            const handleTrigger = () => {
              // Check if this pad has a sample assigned via config
              if (mpcConfig && mpcConfig.pads[pad.key] && effects.current?.players?.loaded) {
                if (effects.current.players.has(pad.key)) {
                  const player = effects.current.players.player(pad.key);
                  player.stop();
                  player.start();
                }
              } else {
                // No sample assigned — use synth
                synth.triggerAttackRelease(pad.note, "8n");
              }
            };

            return (
              <Pad
                key={pad.key}
                position={[x, 0.1, z]}
                size={positions.padSize}
                height={positions.padHeight}
                triggerKey={pad.key}
                color={PAD_COLORS[row]}
                onTrigger={handleTrigger}
                registerTrigger={(key, fn) => padTriggersRef.current.set(key, fn)}
              />
            );
          })}
        </group>
      </group>

      {/* --- COLUMN 2: SCREEN (1.5/4 = 37.5%) --- */}
      <group position={[COL_SCREEN_X + positions.screenSectionX, 0, ROW_MAIN_Z + positions.screenSectionZ]}>
        {/* Video Screen */}
        <group position={[0, 0, -0.8]}>
          <Suspense fallback={
            <RoundedBox args={[positions.screenWidth, positions.screenHeight, positions.screenDepth]} radius={0.08} position={[0, 0.08, 0]} receiveShadow>
              <meshStandardMaterial color="#d1fae5" roughness={0.2} />
            </RoundedBox>
          }>
            {VIDEO_ENABLED ? (
              <VideoScreen
                width={positions.screenWidth}
                height={positions.screenHeight}
                depth={positions.screenDepth}
                opacity={positions.videoOpacity}
                rotationX={positions.videoRotationX}
                rotationY={positions.videoRotationY}
                rotationZ={positions.videoRotationZ}
                onReady={onVideoReady}
              />
            ) : (
              <RoundedBox args={[positions.screenWidth, positions.screenHeight, positions.screenDepth]} radius={0.08} position={[0, 0.08, 0]} receiveShadow>
                <meshStandardMaterial color="#059669" roughness={0.2} />
              </RoundedBox>
            )}
          </Suspense>

          {/* Avatar on top of video screen */}
          <group position={[0, 0.15, 0]} scale={positions.avatarScale}>
            <Suspense fallback={<AvatarFallback />}>
              <AvatarModel />
            </Suspense>
            {/* ContactShadows removed for performance */}
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

export default Mpc;
