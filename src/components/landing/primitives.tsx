/**
 * Renders reusable 3D primitives for the interactive MPC scene.
 * Reads: public media and model assets; receives interaction callbacks from the MPC composition.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';
import { getSpectrum } from './audio';

/**
 * The MPC's screen, drawing what the machine is doing rather than playing a film of it.
 *
 * This replaced a 0.9 MB canned video loop on a homepage already carrying 8.5 MB of assets. It
 * earns the swap three ways: the asset goes, the machine's one saturated element stops being
 * decoration and becomes a readout of what the visitor is doing, and the avatar standing on it
 * finally makes sense — he and the screen now answer the same signal.
 *
 * A canvas rather than a shader, deliberately and against the cheaper option. A shader wins on a
 * spectrum alone but cannot draw text, and the next thing this screen is likely to carry is the
 * site's navigation, scrolled with a knob that already exists. Picking the cheap option now would
 * mean rewriting it then.
 */
const SCREEN_BARS = 28;

export const ScreenReadout: React.FC<{
  width: number;
  depth: number;
  onReady?: () => void;
}> = ({ width, depth, onReady }) => {
  const spectrum = useMemo(() => new Uint8Array(128), []);
  const { canvas, ctx, texture } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const context = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, ctx: context, texture: t };
  }, []);

  useEffect(() => {
    onReady?.();
    return () => texture.dispose();
  }, [onReady, texture]);

  useFrame((state) => {
    if (!ctx) return;
    const size = canvas.width;
    const bins = getSpectrum(spectrum);

    const sky = ctx.createLinearGradient(0, 0, 0, size);
    sky.addColorStop(0, '#241848');
    sky.addColorStop(0.52, '#3a1f5c');
    sky.addColorStop(1, '#0a0a18');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, size, size);

    const horizon = size * 0.56;
    const time = state.clock.elapsedTime;
    const barWidth = size / SCREEN_BARS;
    // Only the lower bins carry anything for this material; the top of the range is silence and
    // would render as a row of dead bars down one side.
    const usable = Math.max(1, Math.floor(bins * 0.62));

    for (let i = 0; i < SCREEN_BARS; i += 1) {
      const from = Math.floor((i / SCREEN_BARS) * usable);
      const to = Math.max(from + 1, Math.floor(((i + 1) / SCREEN_BARS) * usable));
      let sum = 0;
      for (let b = from; b < to; b += 1) sum += spectrum[b];
      const level = sum / (to - from) / 255;
      // A slow idle wave, so silence is a screen that is switched on rather than a black square.
      const idle = 0.05 + 0.035 * Math.sin(time * 1.4 + i * 0.5);
      const barHeight = Math.max(idle, level) * horizon * 1.05;

      // Blue at rest through to magenta when loud. Subtracting from 212 rather than adding was
      // the first attempt and runs the other way round the wheel — through cyan into green, which
      // both loses the register the old video had and clashes with the avatar standing on it.
      const hue = 212 + level * 90;
      ctx.fillStyle = `hsl(${hue}, 88%, ${44 + level * 26}%)`;
      ctx.fillRect(i * barWidth + 1, horizon - barHeight, barWidth - 2, barHeight);
      // The reflection is what makes this read as a horizon rather than as a bar chart.
      ctx.globalAlpha = 0.22;
      ctx.fillRect(i * barWidth + 1, horizon, barWidth - 2, barHeight * 0.7);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, horizon - 1, size, 1.5);
    texture.needsUpdate = true;
  });

  return (
    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
};

// --- AVATAR COMPONENT ---
// Attempts to load /model.glb.
// Note: Ensure model.glb exists in your public/ folder.
const AVATAR_URL = "/model.glb";

export const AvatarModel: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(AVATAR_URL);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Play the first available animation (usually Idle or mixamo.com)
    if (actions && animations.length > 0) {
      const firstAnim = Object.keys(actions)[0];
      actions[firstAnim]?.reset().fadeIn(0.5).play();
    }
  }, [actions, animations]);

  return (
    <group ref={group} dispose={null}>
      {/* Scale and Position adjustments to fit on the MPC screen */}
      <primitive object={scene} scale={1.8} position={[0, 0, 0]} />
    </group>
  );
};

// Fallback if model doesn't load
export const AvatarFallback: React.FC = () => (
  <group position={[0, 0.75, 0]}>
    <mesh castShadow>
      <capsuleGeometry args={[0.3, 1, 4, 8]} />
      <meshStandardMaterial color="#4ade80" roughness={0.3} />
    </mesh>
    <mesh position={[0, 0.8, 0]} castShadow>
      <sphereGeometry args={[0.25]} />
      <meshStandardMaterial color="#e5e5e5" />
    </mesh>
  </group>
);

// --- MPC COMPONENTS ---

export interface PadProps {
  position: [number, number, number];
  size: number;
  triggerKey: string;
  color: string;
  onTrigger: () => void;
  height?: number;
  registerTrigger?: (key: string, fn: () => void) => void;
  /** Colour this pad sits at when nothing is playing, so the grid is not sixteen grey squares. */
  idleTint?: string;
}

export const Pad: React.FC<PadProps> = ({ position, size, triggerKey, color, onTrigger, height = 0.2, registerTrigger, idleTint }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    // A grid of sixteen identical grey squares reads as a grille. Letting a few pads sit lit at
    // rest is what makes the machine read as an instrument rather than a panel — and colour
    // from light is the one identity cue that survives at this render size.
    const baseColor = new THREE.Color(idleTint ?? "#ded5c3");
    const activeColor = new THREE.Color(color);
    const idleEmissive = idleTint ? new THREE.Color(idleTint) : new THREE.Color("#000");

    // `delta * k` is not a valid interpolation factor: neither THREE.Color.lerp nor
    // MathUtils.lerp clamps it, so on a slow frame it extrapolates instead of easing.
    // Deltas of 1-7s were measured on a loaded machine, which drove the factor past 200
    // and left the pads unrenderable. Exponential damping stays in [0, 1) for any delta
    // and matches the old feel at 60fps.
    const damp = (rate: number) => 1 - Math.exp(-rate * delta);

    material.color.lerp(active ? activeColor : baseColor, damp(20));
    material.emissive.lerp(active ? activeColor : idleEmissive, damp(20));
    material.emissiveIntensity = active ? 1.0 : idleTint ? 0.09 : 0;

    const idleY = position[1];
    const pressedY = position[1] - 0.05;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, active ? pressedY : idleY, damp(30));
  });

  useEffect(() => {
    if (active) {
      const timeout = setTimeout(() => setActive(false), 100);
      return () => clearTimeout(timeout);
    }
  }, [active]);

  const trigger = () => {
    setActive(true);
    onTrigger();
  };

  useEffect(() => {
    registerTrigger?.(triggerKey, trigger);
  }, [triggerKey, registerTrigger]);

  return (
    <RoundedBox
      ref={meshRef}
      args={[size, height, size]}
      radius={0.03}
      smoothness={2}
      position={position}
      onClick={(e) => { e.stopPropagation(); trigger(); }}
      castShadow receiveShadow
    >
      <meshStandardMaterial color={idleTint ?? "#6b7280"} roughness={0.4} metalness={0.2} />
    </RoundedBox>
  );
};

export interface KnobProps {
  position: [number, number, number];
  value?: number;
  onChange?: (val: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

export const Knob: React.FC<KnobProps> = ({ position, value = 0, onChange, onDragChange }) => {
  const [hovered, setHover] = useState(false);

  const bind = useDrag(
    ({ delta: [_, dy], event, first, last }) => {
      event?.stopPropagation();
      if (first) onDragChange?.(true);
      if (last) onDragChange?.(false);

      if (onChange) {
        const newValue = Math.max(0, Math.min(1, value - dy * 0.005));
        onChange(newValue);
      }
    },
    { eventOptions: { passive: false } }
  );

  const handleWheel = (e: any) => {
    e.stopPropagation();
    if (onChange) {
      // Scroll up (negative deltaY) -> increase value
      const sensitivity = 0.001;
      const newValue = Math.max(0, Math.min(1, value - e.deltaY * sensitivity));
      onChange(newValue);
    }
  };

  const rotation = (value - 0.5) * 4.7;

  return (
    <group
      position={position}
      {...(bind() as any)}
      onWheel={handleWheel}
      onPointerOver={() => { document.body.style.cursor = 'ns-resize'; setHover(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
    >
      {/* Knob Body */}
      <mesh castShadow receiveShadow position={[0, 0.12, 0]} rotation={[0, rotation, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.25, 16]} />
        <meshStandardMaterial
          color={hovered ? "#4b5563" : "#374151"}
          roughness={0.3}
          metalness={0.6}
        />

        {/* Indicator Line - Positioned at -Z (Up/12 o'clock) */}
        <mesh position={[0, 0.13, -0.12]}>
          <boxGeometry args={[0.04, 0.01, 0.08]} />
          <meshStandardMaterial color={hovered ? "#60a5fa" : "white"} />
        </mesh>
      </mesh>

      {/* Larger Invisible Hit Area */}
      <mesh position={[0, 0.12, 0]} visible={false}>
        <cylinderGeometry args={[0.5, 0.5, 0.6, 8]} />
      </mesh>
    </group>
  );
};

export interface MpcButtonProps {
  position: [number, number, number];
  width: number;
  height: number;
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  isActive?: boolean;
  ledColor?: string;
  onClick?: () => void;
}

export const MpcButton: React.FC<MpcButtonProps> = ({
  position,
  width,
  height,
  label,
  variant = 'neutral',
  isActive = false,
  ledColor,
  onClick
}) => {
  const buttonColors = {
    primary: { base: '#f8fafc', text: '#1e293b', led: '#22c55e' },
    secondary: { base: '#f1f5f9', text: '#475569', led: '#64748b' },
    accent: { base: '#fef3c7', text: '#92400e', led: '#f59e0b' },
    neutral: { base: '#cdc7bc', text: '#374151', led: '#6b7280' }
  };

  const colors = buttonColors[variant];
  const finalLedColor = ledColor || colors.led;

  // Animation state
  const [isPressed, setIsPressed] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Animate Y position: 0 (idle) to -0.02 (pressed)
      const targetY = isPressed ? -0.02 : 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 20);
    }
  });

  return (
    <group position={position} name={`transport-${label}`}>
      <group
        ref={groupRef}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        onPointerDown={(e) => { e.stopPropagation(); setIsPressed(true); }}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
      >
        <RoundedBox args={[width, 0.15, height]} radius={0.05} smoothness={2} position={[0, 0.1, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={colors.base} roughness={0.3} metalness={0.05} />
        </RoundedBox>

        {/* The status light is what identifies the key. The printed label it replaces rendered
            about ten pixels wide on the homepage — grey mush, not a word — whereas colour reads
            at any size, so transport is told by amber / grey / red / green rather than by text.
            Lit at rest as well as when active, or the row goes blank between presses. */}
        <mesh position={[0, 0.18, -height / 2 + 0.09]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.52, 0.07]} />
          <meshStandardMaterial
            color={finalLedColor}
            emissive={finalLedColor}
            emissiveIntensity={isActive ? 1.1 : 0.35}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};
