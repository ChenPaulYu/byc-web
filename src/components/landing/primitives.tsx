/**
 * Renders reusable 3D primitives for the interactive MPC scene.
 * Reads: public media and model assets; receives interaction callbacks from the MPC composition.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';
import { getLevel } from './audio';

export const VideoScreen: React.FC<{
  width: number;
  height: number;
  depth: number;
  opacity?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  onReady?: () => void;
}> = ({ width, height, depth, opacity = 1.0, rotationX = 0, rotationY = 0, rotationZ = 0, onReady }) => {
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const ready = useRef(onReady);
  ready.current = onReady;

  useEffect(() => {
    // Create video element following Codrops tutorial approach
    const element = document.createElement('video');
    video.current = element;
    const videoEl = element;
    videoEl.src = '/animation.mp4';
    videoEl.crossOrigin = 'anonymous';
    videoEl.loop = true;
    videoEl.muted = true;
    videoEl.playsInline = true;

    console.log('🎬 Creating video texture...');

    // Create video texture with proper color space and orientation
    const texture = new THREE.VideoTexture(videoEl);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = true; // Fix upside-down video
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    setVideoTexture(texture);

    // Start video playback
    const startVideo = async () => {
      try {
        await videoEl.play();
        console.log('🎬 Video playing successfully');
      } catch (error) {
        console.log('🎬 Video autoplay blocked, will play on user interaction');
      }
    };

    // Play on user interaction
    const handleInteraction = () => {
      videoEl.play().then(() => {
        console.log('🎬 Video started on user interaction');
      }).catch(err => {
        console.error('🎬 Video play error:', err);
      });
    };

    // Mark ready when the first frame is available
    const handleLoaded = () => {
      ready.current?.();
      startVideo();
    };

    // Try autoplay first, then on click
    videoEl.addEventListener('loadeddata', handleLoaded);
    document.addEventListener('click', handleInteraction, { once: true });

    return () => {
      videoEl.pause();
      videoEl.src = '';
      document.removeEventListener('click', handleInteraction);
      videoEl.removeEventListener('loadeddata', handleLoaded);
      texture.dispose();
    };
    // Deliberately empty: this effect owns a video element and a texture for the component's
    // whole life. Listing `onReady` here was tearing both down and rebuilding them on every
    // render of the parent, because that callback is an inline arrow with a new identity each
    // time — and rebuilding a video element per render is what eventually took the WebGL context
    // down. The ref keeps the latest callback without making the effect depend on it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update texture on every frame
  useFrame(() => {
    // Only ask for an upload once the element actually holds a frame. Setting needsUpdate
    // unconditionally makes three.js call texImage2D on an empty video every frame, which the
    // driver answers with INVALID_VALUE and, often enough, by dropping the context.
    if (videoTexture && video.current && video.current.readyState >= 2) {
      videoTexture.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Video plane with correct aspect ratio */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2 + rotationX, rotationY, rotationZ]}>
        <planeGeometry args={[width, depth]} />
        {videoTexture ? (
          <meshBasicMaterial
            map={videoTexture}
            side={THREE.FrontSide}
            transparent
            opacity={opacity}
          />
        ) : (
          <meshStandardMaterial color="#374151" roughness={0.2} transparent opacity={opacity} />
        )}
      </mesh>

      {/* Optional: Screen border */}
      <RoundedBox args={[width, height, depth]} radius={0.08} position={[0, 0.08, 0]} receiveShadow>
        <meshStandardMaterial color="#1f2937" roughness={0.2} transparent opacity={0.1} />
      </RoundedBox>
    </group>
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
  const action = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (actions && animations.length > 0) {
      const first = Object.keys(actions)[0];
      action.current = actions[first] ?? null;
      action.current?.reset().fadeIn(0.5).play();
    }
  }, [actions, animations]);

  // He dances to the audio rather than unconditionally, so his motion carries information.
  // model.glb holds exactly one clip, Celebrating_Clean, and no idle — so blending between
  // resting and dancing is not available and the rate is the dial instead. Near-still at silence
  // reads as swaying; anyone looking for a second clip to cross-fade will not find one.
  useFrame(() => {
    if (!action.current) return;
    const level = Math.min(1, getLevel() * 3.2);
    action.current.timeScale = 0.07 + level * 1.05;
  });

  return (
    <group ref={group} dispose={null}>
      {/* Scale and Position adjustments to fit on the MPC screen */}
      <primitive object={scene} scale={1.8} position={[0, 0, 0]} />
    </group>
  );
};

/**
 * The avatar's entrance, and the effects that act on him afterwards.
 *
 * He is the instrument's output, so he arrives the way a signal does: not by growing into place
 * but by being *switched on*. The reveal is a hard cut at full size, preceded by two single-frame
 * flickers and a flash off the screen — a hologram locking on rather than a figure walking in.
 * An earlier version eased him up over 1.4 s and read as inflating, which is the opposite idea.
 *
 * Two knobs then reach him, because an effect you can hear and not see is half an effect:
 *
 * - **Drive** shakes him. Distortion is a signal losing its grip, and a figure that jitters when
 *   the drive comes up says that with no legend needed.
 * - **Reverb** puts a halo around him. Reverb is the size of the room, so it shows as space
 *   around the figure rather than as anything happening to the figure itself.
 *
 * The beam, ring and halo are additive and never write depth, so they read as light rather than
 * as more objects sitting on the panel.
 */
export const AvatarStage: React.FC<{
  armed: boolean;
  scale: number;
  drive: number;
  space: number;
  children: React.ReactNode;
}> = ({ armed, scale, drive, space, children }) => {
  const rig = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const ARRIVAL_SECONDS = 0.55;

  useFrame((state, delta) => {
    if (!armed) {
      elapsed.current = 0;
      if (rig.current) rig.current.visible = false;
      return;
    }
    elapsed.current += delta;
    const t = Math.min(1, elapsed.current / ARRIVAL_SECONDS);

    // Two flickers, then on for good. No interpolation anywhere in here on purpose.
    const settled = t > 0.55;
    const on = settled || (t > 0.12 && t < 0.2) || (t > 0.32 && t < 0.4);

    if (rig.current) {
      rig.current.visible = on;
      rig.current.scale.setScalar(scale);

      // Drive shakes him; reverb does not move him at all.
      const shake = drive * 0.06;
      const time = state.clock.elapsedTime;
      rig.current.position.set(
        Math.sin(time * 47) * shake,
        0.15 + Math.sin(time * 61) * shake * 0.5,
        Math.cos(time * 53) * shake,
      );
      rig.current.rotation.z = Math.sin(time * 43) * drive * 0.05;
    }

    // The arrival flash: hardest at the cut, gone almost immediately after.
    const flash = settled ? 0 : Math.max(0, 1 - t / 0.55);

    if (beam.current) {
      const material = beam.current.material as THREE.MeshBasicMaterial;
      material.opacity = flash * 0.75;
      beam.current.scale.set(0.6 + flash * 0.9, 1, 0.6 + flash * 0.9);
      beam.current.visible = material.opacity > 0.01;
    }
    if (ring.current) {
      const material = ring.current.material as THREE.MeshBasicMaterial;
      material.opacity = flash * 0.9;
      ring.current.scale.setScalar(0.3 + (1 - flash) * 3.2);
      ring.current.visible = material.opacity > 0.01;
    }
    if (halo.current) {
      const material = halo.current.material as THREE.MeshBasicMaterial;
      material.opacity = settled ? space * 0.6 : 0;
      halo.current.scale.setScalar(0.9 + space * 0.5);
      halo.current.visible = material.opacity > 0.01;
    }
  });

  return (
    <group>
      <mesh ref={beam} position={[0, 1.15, 0]} visible={false}>
        <cylinderGeometry args={[0.34, 0.58, 2.4, 18, 1, true]} />
        <meshBasicMaterial
          color="#c7b6ff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ring} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.42, 0.62, 40]} />
        <meshBasicMaterial
          color="#e6dcff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={halo} position={[0, 0.62, 0]} visible={false}>
        <sphereGeometry args={[0.62, 20, 14]} />
        <meshBasicMaterial
          color="#9fd6ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
      <group ref={rig} position={[0, 0.15, 0]} visible={false}>
        {children}
      </group>
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
