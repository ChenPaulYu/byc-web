import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, RoundedBox, Text, OrbitControls, useGLTF, useAnimations, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import * as Tone from 'tone';
import { useNavigate } from 'react-router-dom';

// --- SYNTH SETUP ---
const createSynth = () => {
  return new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.5 }
  }).toDestination();
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
  note: string;
  triggerKey: string;
  color: string;
  synth: Tone.PolySynth;
}

const Pad: React.FC<PadProps> = ({ position, size, note, triggerKey, color, synth }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    // Grey pads from screenshot
    const baseColor = new THREE.Color("#6b7280"); // Neutral-500
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
    if (Tone.context.state === 'running') synth.triggerAttackRelease(note, "8n");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Handle number keys specially since they might be used for other things
      if (key === triggerKey) trigger();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerKey, note, synth]);

  return (
    <RoundedBox
      ref={meshRef}
      args={[size, 0.2, size]}
      radius={0.03}
      smoothness={4}
      position={position}
      onClick={(e) => { e.stopPropagation(); trigger(); }}
      castShadow receiveShadow
    >
      <meshStandardMaterial color="#6b7280" roughness={0.4} metalness={0.2} />
    </RoundedBox>
  );
};

const Knob: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
      <cylinderGeometry args={[0.3, 0.3, 0.3, 32]} />
      <meshStandardMaterial color="#374151" roughness={0.3} metalness={0.6} />
    </mesh>
    {/* Indicator */}
    <mesh position={[0, 0.31, 0.15]} rotation={[0, 0, 0]}>
      <boxGeometry args={[0.05, 0.01, 0.1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  </group>
);

const JogWheel: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
      <cylinderGeometry args={[0.8, 0.85, 0.2, 64]} />
      <meshStandardMaterial color="#1f2937" roughness={0.4} metalness={0.5} />
    </mesh>
    <mesh position={[0, 0.21, 0]}>
      <cylinderGeometry args={[0.1, 0.1, 0.05, 32]} />
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
}

const MpcButton: React.FC<MpcButtonProps> = ({
  position,
  width,
  height,
  label,
  variant = 'neutral',
  isActive = false,
  ledColor
}) => {
  const buttonColors = {
    primary: { base: '#f8fafc', text: '#1e293b', led: '#22c55e' },
    secondary: { base: '#f1f5f9', text: '#475569', led: '#64748b' },
    accent: { base: '#fef3c7', text: '#92400e', led: '#f59e0b' },
    neutral: { base: '#f3f4f6', text: '#374151', led: '#6b7280' }
  };

  const colors = buttonColors[variant];
  const finalLedColor = ledColor || colors.led; // Use ledColor if provided, otherwise use variant's led

  return (
    <group position={position}>
      <RoundedBox args={[width, 0.15, height]} radius={0.05} smoothness={4} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={colors.base} roughness={0.3} metalness={0.05} />
      </RoundedBox>

      {/* Subtle LED indicator */}
      <mesh position={[0, 0.18, -height / 2 + 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.3, 0.02]} />
        <meshStandardMaterial
          color={finalLedColor} // Use finalLedColor here
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
  );
};

const MPC: React.FC<{ synth: Tone.PolySynth }> = ({ synth }) => {
  // --- LAYOUT CONFIG ---
  // [ PADS 4x4 ] [ SCREEN / AVATAR ] [ KNOBS ]

  const padSize = 0.95;
  const padSpacing = 0.13;
  const stride = padSize + padSpacing;

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

  return (
    <group position={[0, -1, 0]}>
      {/* --- CHASSIS --- */}
      {/* Reduced depth to 6.0 to remove empty space on top/bottom */}
      <RoundedBox args={[11.5, 1, 6.0]} radius={0.2} smoothness={4} position={[0, -0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#f3f4f6" roughness={0.5} metalness={0.1} />
      </RoundedBox>

      {/* --- COLUMN 1: LOGO + PADS (LEFT) --- */}
      <group position={[-3.5, 0, 0]}>
        {/* Logo at Top of Column 1 */}
        <group position={[-0.5, 0.01, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <Text
            fontSize={0.3}
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            color="#ef4444" // Red
            anchorX="right"
            position={[-0.1, 0, 0]}
            fontWeight="800"
            letterSpacing={-0.05}
          >
            BYC
          </Text>
          <Text
            fontSize={0.12}
            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
            color="#6b7280" // Gray
            anchorX="left"
            position={[0, -0.05, 0]}
            letterSpacing={0.2}
          >
            PROFESSIONAL
          </Text>
        </group>

        {/* Pads Below Logo */}
        <group position={[0, 0, 0.5]}>
          {padLayout.map((pad, i) => {
            const row = Math.floor(i / 4); // 0 to 3
            const col = i % 4;             // 0 to 4

            const x = (col - 1.5) * stride;
            const z = (row - 1.5) * stride;

            return (
              <Pad
                key={pad.key}
                position={[x, 0.1, z]}
                size={padSize}
                note={pad.note}
                triggerKey={pad.key}
                color={colors[row]}
                synth={synth}
              />
            );
          })}
        </group>
      </group>

      {/* --- COLUMN 2: SCREEN + BUTTONS (CENTER) --- */}
      <group position={[1.5, 0, 0]}>
        {/* Screen at Top of Column 2 */}
        <group position={[0, 0, -0.5]}>
          {/* The Screen Base */}
          <RoundedBox args={[4.2, 0.2, 3.2]} radius={0.1} position={[0, 0.1, 0]} receiveShadow>
            <meshStandardMaterial color="#d1fae5" roughness={0.2} /> {/* Light Green Surface */}
          </RoundedBox>

          {/* Screen Frame/Bezel */}
          <group position={[0, 0.05, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
              <planeGeometry args={[4.4, 3.4]} />
              <meshStandardMaterial color="#374151" />
            </mesh>
          </group>

          {/* AVATAR STANDING ON SCREEN */}
          <group position={[0, 0.2, 0]}>
            <Suspense fallback={<AvatarFallback />}>
              <AvatarModel />
            </Suspense>
            {/* Subtle shadow for avatar */}
            <ContactShadows opacity={0.4} scale={4} blur={2} far={1} />
          </group>
        </group>

        {/* Transport Buttons Below Screen */}
        <group position={[0, 0, 1.8]}>
          <MpcButton position={[-1.5, 0, 0]} width={0.8} height={0.5} label="TAP" ledColor="#fbbf24" />
          <MpcButton position={[-0.5, 0, 0]} width={0.8} height={0.5} label="NXT" ledColor="#9ca3af" />
          <MpcButton position={[0.5, 0, 0]} width={0.8} height={0.5} label="STOP" ledColor="#f87171" />
          <MpcButton position={[1.5, 0, 0]} width={0.8} height={0.5} label="PLAY" ledColor="#4ade80" />
        </group>
      </group>

      {/* --- COLUMN 3: KNOBS (RIGHT) --- */}
      <group position={[4.8, 0, 0]}>
        {/* Knobs centered vertically in the column */}
        {[-1.2, -0.4, 0.4, 1.2].map((z, i) => (
          <group key={i} position={[0, 0, z]}>
            <Knob position={[0, 0, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
};

const LandingScene: React.FC = () => {
  const navigate = useNavigate();
  const synth = useMemo(() => createSynth(), []);
  const [started, setStarted] = useState(false);

  const handleStart = async () => {
    if (!started) {
      await Tone.start();
      setStarted(true);
    }
  };

  return (
    <div className="w-full h-screen relative bg-[#f9fafb]" onClick={handleStart}>
      <Canvas shadows camera={{ position: [0, 12, 12], fov: 35 }}>
        <color attach="background" args={['#f9fafb']} />

        <ambientLight intensity={0.7} />
        <spotLight
          position={[10, 20, 10]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        <OrbitControls
          enablePan={false}
          enableZoom={false} // Disable zoom to keep layout fixed like screenshot
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.5}
          // Fix azimuth to give that slightly angled front view
          minAzimuthAngle={-Math.PI / 8}
          maxAzimuthAngle={Math.PI / 8}
        />

        <MPC synth={synth} />

        <Environment preset="city" />
        {/* Floor Shadow */}
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={40} blur={2} far={4.5} />
      </Canvas>

      {/* --- UI OVERLAY --- */}
      <div className="absolute inset-0 pointer-events-none p-12 flex flex-col justify-between">

        {/* Header: Top Left */}
        <header>
          <h1 className="text-5xl font-bold font-sans tracking-tight text-neutral-900 mb-2">Bo-Yu Chen</h1>
          <p className="text-neutral-500 font-mono text-sm tracking-wide">Researcher // Engineer // Creator</p>
        </header>

        {/* Footer Area */}
        <div className="flex items-end justify-between w-full mt-auto">
          {/* Left Spacer */}
          <div className="w-1/3"></div>

          {/* Center: Keyboard Guide */}
          <div className="w-1/3 text-center pb-4">
            <p className="text-neutral-300 text-xs font-mono tracking-widest uppercase">
              Keyboard: 1-4, Q-R, A-F, Z-V
            </p>
          </div>

          {/* Right: Navigation */}
          <nav className="w-1/3 pointer-events-auto flex flex-col items-end gap-4">
            <button onClick={() => navigate('/about')} className="text-xl text-neutral-800 hover:text-black transition-colors font-normal">About</button>
            <button onClick={() => navigate('/projects')} className="text-xl text-neutral-800 hover:text-black transition-colors font-normal">Projects</button>
            <button onClick={() => navigate('/cv')} className="text-xl text-neutral-800 hover:text-black transition-colors font-normal">CV</button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default LandingScene;
