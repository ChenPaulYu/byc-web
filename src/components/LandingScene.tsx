import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, RoundedBox, Text, OrbitControls, useGLTF, useAnimations, ContactShadows, useTexture, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import * as Tone from 'tone';
import { useNavigate } from 'react-router-dom';
import * as dat from 'dat.gui';
import { useDrag } from '@use-gesture/react';

// Development controls - never show in production
const DEV_CONTROLS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_CONTROLS === 'true';
const VIDEO_ENABLED = import.meta.env.VITE_ENABLE_VIDEO !== 'false';

// Debug: Log environment variable status (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 Dev Controls Status:', {
    isDev: import.meta.env.DEV,
    envVar: import.meta.env.VITE_ENABLE_DEV_CONTROLS,
    enabled: DEV_CONTROLS_ENABLED
  });
}

// --- SYNTH SETUP ---
const createSynth = () => {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.5 }
  }).toDestination();
};

// --- VIDEO SCREEN COMPONENT ---
const VideoScreen: React.FC<{ width: number; height: number; depth: number; opacity?: number; rotationX?: number; rotationY?: number; rotationZ?: number; onReady?: () => void }> = ({ width, height, depth, opacity = 1.0, rotationX = 0, rotationY = 0, rotationZ = 0, onReady }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);

  useEffect(() => {
    // Create video element following Codrops tutorial approach
    const video = document.createElement('video');
    video.src = '/animation.mp4';
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    console.log('🎬 Creating video texture...');

    // Create video texture with proper color space and orientation
    const texture = new THREE.VideoTexture(video);
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
        await video.play();
        console.log('🎬 Video playing successfully');
      } catch (error) {
        console.log('🎬 Video autoplay blocked, will play on user interaction');
      }
    };

    // Play on user interaction
    const handleInteraction = () => {
      video.play().then(() => {
        console.log('🎬 Video started on user interaction');
      }).catch(err => {
        console.error('🎬 Video play error:', err);
      });
    };

    // Mark ready when the first frame is available
    const handleLoaded = () => {
      onReady?.();
      startVideo();
    };

    // Try autoplay first, then on click
    video.addEventListener('loadeddata', handleLoaded);
    document.addEventListener('click', handleInteraction, { once: true });

    return () => {
      video.pause();
      video.src = '';
      document.removeEventListener('click', handleInteraction);
      video.removeEventListener('loadeddata', handleLoaded);
      texture.dispose();
    };
  }, [onReady]);

  // Update texture on every frame
  useFrame(() => {
    if (videoTexture) {
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

const AvatarModel: React.FC = () => {
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
const AvatarFallback: React.FC = () => (
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

interface PadProps {
  position: [number, number, number];
  size: number;
  triggerKey: string;
  color: string;
  onTrigger: () => void;
  height?: number;
  registerTrigger?: (key: string, fn: () => void) => void;
}

const Pad: React.FC<PadProps> = ({ position, size, triggerKey, color, onTrigger, height = 0.2, registerTrigger }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    const baseColor = new THREE.Color("#6b7280");
    const activeColor = new THREE.Color(color);

    material.color.lerp(active ? activeColor : baseColor, delta * 20);
    material.emissive.lerp(active ? activeColor : new THREE.Color("#000"), delta * 20);
    material.emissiveIntensity = active ? 1.0 : 0;

    const idleY = position[1];
    const pressedY = position[1] - 0.05;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, active ? pressedY : idleY, delta * 30);
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
      <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.2} />
    </RoundedBox>
  );
};

interface KnobProps {
  position: [number, number, number];
  value?: number;
  onChange?: (val: number) => void;
  onDragChange?: (dragging: boolean) => void;
}

const Knob: React.FC<KnobProps> = ({ position, value = 0, onChange, onDragChange }) => {
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

  // Generate ticks
  const ticks = useMemo(() => {
    return Array.from({ length: 11 }).map((_, i) => {
      // Map 0..10 to -135..+135 degrees
      const angleDeg = -135 + i * (270 / 10);
      const angleRad = (angleDeg * Math.PI) / 180;
      // 0 deg is Up (-Z), so we rotate from there
      // x = sin(a) * r, z = -cos(a) * r
      const radius = 0.32;
      const x = Math.sin(angleRad) * radius;
      const z = -Math.cos(angleRad) * radius;
      return { x, z, rotation: -angleRad };
    });
  }, []);

  return (
    <group
      position={position}
      {...(bind() as any)}
      onWheel={handleWheel}
      onPointerOver={() => { document.body.style.cursor = 'ns-resize'; setHover(true); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
    >
      {/* Static Ticks */}
      <group position={[0, 0.01, 0]}>
        {ticks.map((tick, i) => (
          <mesh key={i} position={[tick.x, 0, tick.z]} rotation={[0, tick.rotation, 0]}>
            <boxGeometry args={[0.02, 0.01, 0.06]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        ))}
      </group>

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

const JogWheel: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
      <cylinderGeometry args={[0.8, 0.85, 0.2, 24]} />
      <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.5} />
    </mesh>
    <mesh position={[0, 0.21, 0]}>
      <cylinderGeometry args={[0.1, 0.1, 0.05, 12]} />
      <meshStandardMaterial color="#4b5563" />
    </mesh>
  </group>
);

interface MpcButtonProps {
  position: [number, number, number];
  width: number;
  height: number;
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral';
  isActive?: boolean;
  ledColor?: string;
  onClick?: () => void;
}

const MpcButton: React.FC<MpcButtonProps> = ({
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
    neutral: { base: '#f3f4f6', text: '#374151', led: '#6b7280' }
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
    <group position={position}>
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

        {/* Subtle LED indicator */}
        <mesh position={[0, 0.18, -height / 2 + 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.3, 0.02]} />
          <meshStandardMaterial
            color={finalLedColor}
            emissive={isActive ? finalLedColor : '#000000'}
            emissiveIntensity={isActive ? 0.3 : 0}
            toneMapped={false}
          />
        </mesh>

        <Text
          position={[0, 0.18, 0.05]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.12}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          color={colors.text}
          anchorX="center"
          anchorY="middle"
          fontWeight="500"
        >
          {label}
        </Text>
      </group>
    </group>
  );
};

const MPC: React.FC<{ synth: Tone.PolySynth; onDragChange: (dragging: boolean) => void; onVideoReady?: () => void }> = ({ synth, onDragChange, onVideoReady }) => {
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

  // --- LAYOUT CONFIG ---
  // [ PADS 4x4 ] [ SCREEN / AVATAR ] [ KNOBS ]

  // --- RESPONSIVE 3D SCALING ---
  const [responsiveScale, setResponsiveScale] = useState(1);

  useEffect(() => {
    const updateResponsiveScale = () => {
      const { innerWidth, innerHeight } = window;
      const aspectRatio = innerWidth / innerHeight;

      // Scale based on viewport size while maintaining MPC proportions
      let scale = 1;

      if (innerWidth < 480) {
        // Mobile phones
        scale = 0.5;
      } else if (innerWidth < 768) {
        // Large phones / small tablets
        scale = 0.65;
      } else if (innerWidth < 1024) {
        // Tablets
        scale = 0.8;
      } else if (innerWidth > 1920) {
        // Large desktops
        scale = 1.2;
      } else {
        // Standard desktop (1024-1920px)
        scale = 1.0;
      }

      // Further adjust for very wide or narrow screens
      if (aspectRatio > 2.5) scale *= 0.8; // Ultra-wide
      if (aspectRatio < 0.6) scale *= 0.7; // Portrait mobile

      setResponsiveScale(scale);
    };

    updateResponsiveScale();
    window.addEventListener('resize', updateResponsiveScale);
    return () => window.removeEventListener('resize', updateResponsiveScale);
  }, []);

  // --- LAYOUT GRID SYSTEM ---
  // MPC Container: 9 units wide, 5 units deep
  // Columns: Pads(4.5) | Screen(3.375) | Knobs(1.125) = 9 total
  // Rows: Logo+Knobs(1) | Pads+Screen+Buttons(4) = 5 total
  // Alignment Rules:
  // - Screen + Buttons section height = Pads section height
  // - Logo + Knobs section height aligned

  const CONTAINER_WIDTH = 9.0;
  const CONTAINER_DEPTH = 5.0;

  // Column widths (proportional to 2:1.5:0.5)
  const COL_PADS_WIDTH = CONTAINER_WIDTH * (2 / 4);      // 4.5 units
  const COL_SCREEN_WIDTH = CONTAINER_WIDTH * (1.5 / 4);  // 3.375 units
  const COL_KNOBS_WIDTH = CONTAINER_WIDTH * (0.5 / 4);   // 1.125 units

  // Row heights with proper alignment
  const ROW_LOGO_HEIGHT = CONTAINER_DEPTH * 0.2;       // 1 unit
  const ROW_MAIN_HEIGHT = CONTAINER_DEPTH * 0.8;       // 4 units

  // Column positions (centered from left)
  const COL_PADS_X = -CONTAINER_WIDTH / 2 + COL_PADS_WIDTH / 2;
  const COL_SCREEN_X = COL_PADS_X + COL_PADS_WIDTH / 2 + COL_SCREEN_WIDTH / 2;
  const COL_KNOBS_X = COL_SCREEN_X + COL_SCREEN_WIDTH / 2 + COL_KNOBS_WIDTH / 2;

  // Row positions (centered from back)
  const ROW_LOGO_Z = -CONTAINER_DEPTH / 2 + ROW_LOGO_HEIGHT / 2;
  const ROW_MAIN_Z = ROW_LOGO_Z + ROW_LOGO_HEIGHT / 2 + ROW_MAIN_HEIGHT / 2;

  // --- DAT.GUI CONTROLS ---
  const [positions, setPositions] = useState({
    // Container (updated from user's preferred values)
    containerX: 0,
    containerZ: 0,
    // Pad section positioning (updated from user's preferred values)
    padsSectionX: 0,
    padsSectionZ: -0.39,
    // Pad sizing (updated from user's preferred values)
    padSize: 0.87,
    padSpacing: 0.15,
    padHeight: 0.2,
    // Screen section positioning (updated from user's preferred values)
    screenSectionX: 0,
    screenSectionZ: 0,
    // Logo sizing (updated from user's preferred values)
    logoMainSize: 0.17,
    logoSubSize: 0.069,
    // Screen size (updated from user's preferred values)
    screenWidth: 3.4,
    screenDepth: 3.4,
    screenHeight: 0.17,
    // Avatar scale (updated from user's preferred values)
    avatarScale: 0.78,
    // Transport buttons (updated from user's preferred values)
    buttonsOffsetZ: 1.4,
    buttonSpacing: 0.87,
    buttonWidth: 0.6,
    buttonHeight: 0.35,
    // Knob spacing (updated from user's preferred values)
    knobSpacing: 0.89,
    // Video controls (for development)
    videoOpacity: 1.0,
    videoRotationX: 0,
    videoRotationY: 0,
    videoRotationZ: 0
  });

  // Calculate stride based on adjustable values
  const stride = positions.padSize + positions.padSpacing;

  useEffect(() => {
    // Only create dat.gui in development mode with dev controls enabled
    if (!DEV_CONTROLS_ENABLED) return;

    const gui = new dat.GUI();

    // Create a proxy object to prevent direct mutation
    const guiProxy = { ...positions };

    // Container Controls
    const containerFolder = gui.addFolder('Container');
    containerFolder.add(guiProxy, 'containerX', -3, 3).step(0.01).name('Container X').onChange((value: number) => {
      setPositions(prev => ({ ...prev, containerX: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Container X: ${value}`);
    });
    containerFolder.add(guiProxy, 'containerZ', -3, 3).step(0.01).name('Container Z').onChange((value: number) => {
      setPositions(prev => ({ ...prev, containerZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Container Z: ${value}`);
    });
    containerFolder.open();

    // Pad Section Controls
    const padFolder = gui.addFolder('Pads Section');
    padFolder.add(guiProxy, 'padsSectionX', -3, 3).step(0.01).name('Section X').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padsSectionX: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pads Section X: ${value}`);
    });
    padFolder.add(guiProxy, 'padsSectionZ', -3, 3).step(0.01).name('Section Z').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padsSectionZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pads Section Z: ${value}`);
    });
    padFolder.add(guiProxy, 'padSize', 0.3, 2).step(0.01).name('Pad Size').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padSize: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pad Size: ${value}`);
    });
    padFolder.add(guiProxy, 'padSpacing', 0.05, 0.5).step(0.01).name('Pad Spacing').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padSpacing: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pad Spacing: ${value}`);
    });
    padFolder.add(guiProxy, 'padHeight', 0.1, 0.5).step(0.01).name('Pad Height').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padHeight: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pad Height: ${value}`);
    });
    padFolder.open();

    // Logo Controls
    const logoFolder = gui.addFolder('Logo');
    logoFolder.add(guiProxy, 'logoMainSize', 0.1, 0.5).step(0.001).name('Main Text Size').onChange((value: number) => {
      setPositions(prev => ({ ...prev, logoMainSize: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Logo Main Size: ${value}`);
    });
    logoFolder.add(guiProxy, 'logoSubSize', 0.05, 0.2).step(0.001).name('Sub Text Size').onChange((value: number) => {
      setPositions(prev => ({ ...prev, logoSubSize: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Logo Sub Size: ${value}`);
    });
    logoFolder.open();

    // Screen Section Controls
    const screenFolder = gui.addFolder('Screen Section');
    screenFolder.add(guiProxy, 'screenSectionX', -3, 3).step(0.01).name('Section X').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenSectionX: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Section X: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenSectionZ', -3, 3).step(0.01).name('Section Z').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenSectionZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Section Z: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenWidth', 0.5, 5).step(0.1).name('Screen Width').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenWidth: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Width: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenDepth', 0.5, 4).step(0.1).name('Screen Depth').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenDepth: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Depth: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenHeight', 0.05, 0.5).step(0.01).name('Screen Height').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenHeight: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Height: ${value}`);
    });
    // Bezel controls removed per user request
    screenFolder.add(guiProxy, 'avatarScale', 0.1, 2).step(0.01).name('Avatar Scale').onChange((value: number) => {
      setPositions(prev => ({ ...prev, avatarScale: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Avatar Scale: ${value}`);
    });
    screenFolder.add(guiProxy, 'videoOpacity', 0, 1).step(0.01).name('Video Opacity').onChange((value: number) => {
      setPositions(prev => ({ ...prev, videoOpacity: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Video Opacity: ${value}`);
    });
    screenFolder.add(guiProxy, 'videoRotationX', -Math.PI, Math.PI).step(0.01).name('Video Rotation X').onChange((value: number) => {
      setPositions(prev => ({ ...prev, videoRotationX: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Video Rotation X: ${value}`);
    });
    screenFolder.add(guiProxy, 'videoRotationY', -Math.PI, Math.PI).step(0.01).name('Video Rotation Y').onChange((value: number) => {
      setPositions(prev => ({ ...prev, videoRotationY: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Video Rotation Y: ${value}`);
    });
    screenFolder.add(guiProxy, 'videoRotationZ', -Math.PI, Math.PI).step(0.01).name('Video Rotation Z').onChange((value: number) => {
      setPositions(prev => ({ ...prev, videoRotationZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Video Rotation Z: ${value}`);
    });
    screenFolder.open();

    // Transport Buttons
    const buttonsFolder = gui.addFolder('Transport Buttons');
    buttonsFolder.add(guiProxy, 'buttonsOffsetZ', 0, 2).step(0.01).name('Z Offset').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonsOffsetZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Buttons Z Offset: ${value}`);
    });
    buttonsFolder.add(guiProxy, 'buttonSpacing', 0.2, 1).step(0.01).name('Button Spacing').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonSpacing: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Button Spacing: ${value}`);
    });
    buttonsFolder.add(guiProxy, 'buttonWidth', 0.3, 1).step(0.01).name('Button Width').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonWidth: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Button Width: ${value}`);
    });
    buttonsFolder.add(guiProxy, 'buttonHeight', 0.2, 0.6).step(0.01).name('Button Height').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonHeight: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Button Height: ${value}`);
    });
    buttonsFolder.open();

    // Knobs
    const knobsFolder = gui.addFolder('Knobs');
    knobsFolder.add(guiProxy, 'knobSpacing', 0.2, 1).step(0.01).name('Knob Spacing').onChange((value: number) => {
      setPositions(prev => ({ ...prev, knobSpacing: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Knob Spacing: ${value}`);
    });
    knobsFolder.open();

    // Log Current Values Button
    const logButton = {
      logCurrentValues: () => {
        if (DEV_CONTROLS_ENABLED) {
          console.log('=== CURRENT MPC LAYOUT VALUES ===');
          console.log('Container:', { x: positions.containerX, z: positions.containerZ });
          console.log('Grid System:', {
            containerWidth: CONTAINER_WIDTH,
            containerDepth: CONTAINER_DEPTH,
            columnWidths: { pads: COL_PADS_WIDTH, screen: COL_SCREEN_WIDTH, knobs: COL_KNOBS_WIDTH },
            columnPositions: { pads: COL_PADS_X, screen: COL_SCREEN_X, knobs: COL_KNOBS_X },
            rowPositions: { logo: ROW_LOGO_Z, main: ROW_MAIN_Z }
          });
          console.log('Pads Section:', { x: positions.padsSectionX, z: positions.padsSectionZ, size: positions.padSize, spacing: positions.padSpacing, height: positions.padHeight });
          console.log('Screen Section:', { x: positions.screenSectionX, z: positions.screenSectionZ, width: positions.screenWidth, depth: positions.screenDepth, height: positions.screenHeight });
          console.log('Logo Size:', { mainSize: positions.logoMainSize, subSize: positions.logoSubSize });
          console.log('Avatar Scale:', positions.avatarScale);
          console.log('Video Opacity:', positions.videoOpacity);
          console.log('Transport Buttons:', { zOffset: positions.buttonsOffsetZ });
          console.log('=== END VALUES ===');
        }
      }
    };
    gui.add(logButton, 'logCurrentValues').name('📋 Log All Values');

    return () => gui.destroy();
  }, []);

  // Debug: Log current state values on every render (dev only)
  useEffect(() => {
    if (DEV_CONTROLS_ENABLED) {
      console.log('🔄 Layout Update - Current State:', {
        padSize: positions.padSize,
        padSpacing: positions.padSpacing,
        screenWidth: positions.screenWidth,
        screenDepth: positions.screenDepth,
        avatarScale: positions.avatarScale
      });
    }
  }, [positions]);

  // Key mappings matching the UI text: 1-4, Q-R, A-F, Z-V
  const padLayout = [
    // Top Row
    { key: '1', note: 'G5' }, { key: '2', note: 'A5' }, { key: '3', note: 'C6' }, { key: '4', note: 'D6' },
    // 2nd Row
    { key: 'q', note: 'C5' }, { key: 'w', note: 'D5' }, { key: 'e', note: 'E5' }, { key: 'r', note: 'G5' },
    // 3rd Row
    { key: 'a', note: 'G4' }, { key: 's', note: 'A4' }, { key: 'd', note: 'C5' }, { key: 'f', note: 'D5' },
    // Bottom Row
    { key: 'z', note: 'C4' }, { key: 'x', note: 'D4' }, { key: 'c', note: 'E4' }, { key: 'v', note: 'G4' },
  ];

  // Colors for visualization
  const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa'];

  // --- AUDIO & STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [knobValues, setKnobValues] = useState([0.5, 0.2, 0.3, 0.8]); // [Filter, Distortion, Reverb, Volume]
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [history, setHistory] = useState<number[][]>([]); // Knob history
  const [mpcConfig, setMpcConfig] = useState<{ bpm: number; loop: string; pads: Record<string, string> } | null>(null);

  useEffect(() => {
    fetch('/mpc.config.json')
      .then(r => r.json())
      .then(setMpcConfig)
      .catch(() => {
        // Fallback to hardcoded defaults
        setMpcConfig({
          bpm: 78,
          loop: 'SLS_CSP_78_songstarter_soul_thief_Cmin.wav',
          pads: {
            z: 'SLS_CSP_kick_father.wav',
            x: 'SLS_CSP_snare_acoustic_intro.wav',
            c: 'SLS_CSP_hihat_grit_closed.wav',
            v: 'SLS_CSP_hihat_grit_open.wav',
          },
        });
      });
  }, []);

  // Audio Effects Refs
  const effects = useRef<{
    filter: Tone.Filter;
    distortion: Tone.Distortion;
    reverb: Tone.Reverb;
    vol: Tone.Volume;
    players?: Tone.Players;
  } | null>(null);

  // Initialize Audio Chain
  useEffect(() => {
    if (!mpcConfig) return;

    // Create effects
    const vol = new Tone.Volume(0).toDestination();
    const reverb = new Tone.Reverb(0.5).connect(vol);
    const distortion = new Tone.Distortion(0).connect(reverb);
    const filter = new Tone.Filter(20000, "lowpass").connect(distortion);

    // Build sample map from config
    const sampleMap: Record<string, string> = {};
    for (const [key, filename] of Object.entries(mpcConfig.pads)) {
      sampleMap[key] = `/samples/${filename}`;
    }
    if (mpcConfig.loop) {
      sampleMap['_loop'] = `/samples/${mpcConfig.loop}`;
    }

    const players = new Tone.Players(sampleMap, () => {
      console.log("Samples loaded from config");
      if (mpcConfig.loop && players.has('_loop')) {
        const loop = players.player('_loop');
        loop.loop = true;
        loop.sync().start(0);
      }
      Tone.Transport.bpm.value = mpcConfig.bpm;
    }).connect(filter);

    effects.current = { filter, distortion, reverb, vol, players };

    // Route synth through effects
    synth.disconnect();
    synth.connect(filter);

    return () => {
      synth.disconnect();
      synth.toDestination();
      filter.dispose();
      distortion.dispose();
      reverb.dispose();
      vol.dispose();
      players.dispose();
      effects.current = null;
    };
  }, [synth, mpcConfig]);

  const handlePlay = async () => {
    if (Tone.context.state !== 'running') await Tone.start();

    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
    } else {
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
    setActiveBtn('STOP');
    setTimeout(() => setActiveBtn(null), 150);
  };

  const handlePrev = () => {
    setActiveBtn('PREV');
    setTimeout(() => setActiveBtn(null), 150);
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setKnobValues(previous);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  const handleNext = () => {
    setActiveBtn('NXT');
    setTimeout(() => setActiveBtn(null), 150);
    setHistory(prev => [...prev, knobValues]); // Save current state
    setKnobValues([Math.random(), Math.random(), Math.random(), Math.random()]);
  };

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
          {padLayout.map((pad, i) => {
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
                color={colors[row]}
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
        {[-1.5, -0.5, 0.5, 1.5].map((multiplier, i) => (
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

const LoadingOverlay: React.FC<{ extraReady: boolean }> = ({ extraReady }) => {
  const { active, progress } = useProgress();
  const [hidden, setHidden] = useState(false);
  const shouldShow = active || !extraReady;

  useEffect(() => {
    if (!active && progress >= 100 && extraReady) {
      const t = window.setTimeout(() => setHidden(true), 300);
      return () => window.clearTimeout(t);
    }

    setHidden(false);
  }, [active, progress, extraReady]);

  if (hidden) return null;

  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-[#f9fafb] transition-opacity duration-500 ${
        shouldShow ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!shouldShow}
    >
      <div className="w-[280px] sm:w-[360px]">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-xs font-mono tracking-widest uppercase text-neutral-400">Loading</div>
          <div className="text-xs font-mono tabular-nums text-neutral-400">{Math.round(progress)}%</div>
        </div>
        <div className="h-1.5 rounded bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-neutral-800 transition-[width] duration-200 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const LandingScene: React.FC = () => {
  const navigate = useNavigate();
  const synth = useMemo(() => createSynth(), []);
  const [started, setStarted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [videoReady, setVideoReady] = useState(!VIDEO_ENABLED);

  // Timeout fallback: if video doesn't load within 5 seconds, show the scene anyway
  useEffect(() => {
    if (videoReady) return;
    const timeout = window.setTimeout(() => setVideoReady(true), 5000);
    return () => window.clearTimeout(timeout);
  }, [videoReady]);

  // Responsive camera positioning
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([0, 12, 12]);

  useEffect(() => {
    const updateCameraPosition = () => {
      const { innerWidth, innerHeight } = window;
      const aspectRatio = innerWidth / innerHeight;

      // Base camera distance, adjusted by device type
      let cameraDistance = 12;

      if (innerWidth < 480) {
        // Mobile phones - closer view since MPC is scaled down
        cameraDistance = 10;
      } else if (innerWidth < 768) {
        // Large phones / small tablets
        cameraDistance = 11;
      } else if (innerWidth < 1024) {
        // Tablets
        cameraDistance = 12;
      } else {
        // Desktop
        cameraDistance = 12;
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

  const handleStart = async () => {
    if (!started) {
      await Tone.start();
      setStarted(true);
    }
  };

  return (
    <div className="w-full h-screen relative bg-[#f9fafb] overflow-hidden" onClick={handleStart}>
      <LoadingOverlay extraReady={videoReady} />
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 35 }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }} // Allow frame rate to drop for performance
      >
        <color attach="background" args={['#f9fafb']} />

        <ambientLight intensity={0.7} />
        <spotLight
          position={[10, 20, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        <OrbitControls
          enabled={!isDragging}
          enablePan={false}
          enableZoom={true}
          minDistance={8}
          maxDistance={20}
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

        <MPC synth={synth} onDragChange={setIsDragging} onVideoReady={() => setVideoReady(true)} />

        <Environment preset="city" />
        {/* Floor Shadow */}
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={40} blur={2} far={4.5} />
      </Canvas>

      {/* --- RESPONSIVE UI OVERLAY --- */}
      <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-between">

        {/* Header: Top Left */}
        <header className="z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-sans tracking-tight text-neutral-900 mb-1 sm:mb-2">
            Bo-Yu Chen
          </h1>
          <p className="text-neutral-500 font-mono text-xs sm:text-sm md:text-base tracking-wide">
            Researcher // Engineer // Creator
          </p>
        </header>

        {/* Footer Area */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between w-full mt-auto gap-4 sm:gap-0">
          {/* Mobile: Center everything, Desktop: Left Spacer */}
          <div className="hidden sm:block sm:w-1/3"></div>

          {/* Center: Keyboard Guide */}
          <div className="w-full sm:w-1/3 text-center pb-2 sm:pb-4">
            <p className="text-neutral-300 text-xs sm:text-xs md:text-sm font-mono tracking-widest uppercase">
              <span className="hidden sm:inline">Keyboard: 1-4, Q-R, A-F, Z-V</span>
              <span className="sm:hidden">Tap pads to play</span>
            </p>
          </div>

          {/* Right: Navigation */}
          <nav className="w-full sm:w-1/3 pointer-events-auto flex flex-wrap sm:flex-col items-center sm:items-end gap-3 sm:gap-4 justify-center sm:justify-end">
            <button
              onClick={() => navigate('/about')}
              className="text-base sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal px-3 py-2 sm:px-0 sm:py-0 min-w-[80px] sm:min-w-0 touch-manipulation"
            >
              About
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="text-base sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal px-3 py-2 sm:px-0 sm:py-0 min-w-[80px] sm:min-w-0 touch-manipulation"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="text-base sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal px-3 py-2 sm:px-0 sm:py-0 min-w-[80px] sm:min-w-0 touch-manipulation"
            >
              Blog
            </button>
            <button
              onClick={() => navigate('/news')}
              className="text-base sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal px-3 py-2 sm:px-0 sm:py-0 min-w-[80px] sm:min-w-0 touch-manipulation"
            >
              News
            </button>
            <button
              onClick={() => navigate('/cv')}
              className="text-base sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal px-3 py-2 sm:px-0 sm:py-0 min-w-[80px] sm:min-w-0 touch-manipulation"
            >
              CV
            </button>
            {/* Chat temporarily disabled */}
            {/* <button
              onClick={() => navigate('/chat')}
              className="text-base sm:text-lg md:text-xl text-neutral-800 hover:text-black transition-colors font-normal px-3 py-2 sm:px-0 sm:py-0 min-w-[80px] sm:min-w-0 touch-manipulation"
            >
              Chat
            </button> */}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default LandingScene;
