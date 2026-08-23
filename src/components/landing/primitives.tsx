/**
 * Renders reusable 3D primitives for the interactive MPC scene.
 * Reads: public media and model assets; audio `getChannelDisplayLevels` for the avatar; receives
 * interaction callbacks from the MPC composition.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';
import { getChannelDisplayLevels } from './audio';
import { useDisposable } from './useDisposable';

export const VideoScreen: React.FC<{
  width: number;
  height: number;
  depth: number;
  opacity?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  onReady?: () => void;
}> = ({ width, height: _height, depth, opacity = 1.0, rotationX = 0, rotationY = 0, rotationZ = 0, onReady }) => {
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
  const sway = useRef(0);

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    if (actions && animations.length > 0) {
      const first = Object.keys(actions)[0];
      action.current = actions[first] ?? null;
      action.current?.reset().fadeIn(0.5).play();
    }
  }, [scene, actions, animations]);

  // One clip, two ears. The bed is a slow sway on the same Celebrating_Clean clip; a pad hit
  // used to punch and hop, and that read as a shiver. Rate follows the bed, heavily smoothed,
  // and never jumps the figure in space.
  useFrame((_, delta) => {
    if (!action.current) return;
    const [, bed] = getChannelDisplayLevels();
    sway.current += (bed - sway.current) * (1 - Math.exp(-3 * delta));
    const target = 0.42 + sway.current * 0.16;
    action.current.timeScale += (target - action.current.timeScale) * (1 - Math.exp(-3 * delta));
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
 * Reverb still reaches him as a halo — the size of the room, shown as space around the figure.
 * Drive used to shake him; at this size that read as a fault, not as distortion, so the knob
 * stays on the audio and off the figure.
 *
 * The beam, ring and halo are additive and never write depth, so they read as light rather than
 * as more objects sitting on the panel.
 */
export const AvatarStage: React.FC<{
  armed: boolean;
  scale: number;
  space: number;
  children: React.ReactNode;
}> = ({ armed, scale, space, children }) => {
  const rig = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const ARRIVAL_SECONDS = 0.55;

  useFrame((_, delta) => {
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
      rig.current.position.set(0, 0.15, 0);
      rig.current.rotation.z = 0;
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
  onTrigger: (key: string) => void;
  height?: number;
  registerTrigger?: (key: string, fn: () => void) => void;
  /** Colour this pad sits at when nothing is playing, so the grid is not sixteen grey squares. */
  idleTint?: string;
}

const PadComponent: React.FC<PadProps> = ({ position, size, triggerKey, color, onTrigger, height = 0.2, registerTrigger, idleTint }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);
  const idleColor = useMemo(() => new THREE.Color(idleTint ?? '#6b7280'), [idleTint]);
  const litColor = useMemo(() => new THREE.Color(color), [color]);
  const restEmissive = useMemo(() => new THREE.Color(idleTint ?? '#000000'), [idleTint]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const idleY = position[1];
    if (
      !active
      && Math.abs(meshRef.current.position.y - idleY) < 0.0002
      && Math.abs(material.color.r - idleColor.r)
        + Math.abs(material.color.g - idleColor.g)
        + Math.abs(material.color.b - idleColor.b) < 0.004
    ) {
      return;
    }
    // Exponential damping stays in [0, 1) for any delta — a raw `delta * k` overshot on slow
    // frames and left the pads unrenderable.
    const damp = (rate: number) => 1 - Math.exp(-rate * delta);

    material.color.lerp(active ? litColor : idleColor, damp(20));
    material.emissive.lerp(active ? litColor : restEmissive, damp(20));
    material.emissiveIntensity = active ? 1.0 : idleTint ? 0.09 : 0;

    const pressedY = position[1] - 0.05;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, active ? pressedY : idleY, damp(30));
  });

  useEffect(() => {
    if (active) {
      const timeout = setTimeout(() => setActive(false), 100);
      return () => clearTimeout(timeout);
    }
  }, [active]);

  const trigger = useCallback(() => {
    setActive(true);
    onTrigger(triggerKey);
  }, [onTrigger, triggerKey]);

  useEffect(() => {
    registerTrigger?.(triggerKey, trigger);
  }, [registerTrigger, trigger, triggerKey]);

  return (
    <RoundedBox
      ref={meshRef}
      args={[size, height, size]}
      radius={0.03}
      smoothness={2}
      position={position}
      onClick={(e) => { e.stopPropagation(); trigger(); }}
    >
      <meshStandardMaterial color={idleTint ?? "#6b7280"} roughness={0.4} metalness={0.2} />
    </RoundedBox>
  );
};

export const Pad = React.memo(PadComponent);

export interface KnobProps {
  position: [number, number, number];
  value?: number;
  onChange?: (val: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

const KNOB_TICKS = Array.from({ length: 11 }, (_, i) => {
  const angle = ((-135 + i * 27) * Math.PI) / 180;
  const radius = 0.31;
  return {
    x: Math.sin(angle) * radius,
    z: -Math.cos(angle) * radius,
    rotation: -angle,
  };
});

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
      onPointerOut={() => { document.body.style.cursor = 'pointer'; setHover(false); }}
    >
      <group position={[0, 0.012, 0]}>
        {KNOB_TICKS.map((tick, i) => (
          <mesh key={i} position={[tick.x, 0, tick.z]} rotation={[0, tick.rotation, 0]}>
            <boxGeometry args={[0.01, 0.006, 0.038]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        ))}
      </group>
      {/* Sit on the deck, not in it. The cylinder used to cross y = 0, so the chassis
          punched a ring around every knob and the contact shadow read as a well. */}
      <mesh position={[0, 0.155, 0]} rotation={[0, rotation, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.24, 16]} />
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
  const colors = {
    primary: { base: '#f8fafc', text: '#1e293b', led: '#22c55e' },
    secondary: { base: '#f1f5f9', text: '#475569', led: '#64748b' },
    accent: { base: '#fef3c7', text: '#92400e', led: '#f59e0b' },
    // Whiter than the chassis. Same-grey keys only read as the shadow they throw, which
    // is the slot the transport row kept being mistaken for.
    neutral: { base: '#ffffff', text: '#374151', led: '#6b7280' },
  }[variant];
  const finalLedColor = ledColor || colors.led;
  const labelMap = useDisposable(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = colors.text;
    ctx.font = '600 36px Inter, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 34);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });

  const [isPressed, setIsPressed] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = isPressed ? -0.02 : 0;
    if (!isPressed && Math.abs(groupRef.current.position.y - targetY) < 0.0002) return;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 20);
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
        <RoundedBox args={[width, 0.15, height]} radius={0.05} smoothness={2} position={[0, 0.1, 0]}>
          <meshStandardMaterial color={colors.base} roughness={0.3} metalness={0.05} />
        </RoundedBox>
        <mesh position={[0, 0.18, -height / 2 + 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.3, 0.02]} />
          <meshStandardMaterial
            color={finalLedColor}
            emissive={isActive ? finalLedColor : '#000000'}
            emissiveIntensity={isActive ? 0.3 : 0}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0.181, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.82, height * 0.42]} />
          <meshBasicMaterial map={labelMap ?? undefined} transparent alphaTest={0.15} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};
