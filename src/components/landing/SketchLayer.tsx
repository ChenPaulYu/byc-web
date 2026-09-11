/**
 * SketchLayer — one focus-only floating thought inside the studio, never an idle HUD.
 * Reuses the physical flute geometry for an exploded study; the sound trace records the
 * instrument's real output envelope, not a simulated waveform. GPU resources belong to
 * useDisposable and frame-rate updates never enter React state.
 * Reads: fluebricks.ts, audio facade and useDisposable. LandingScene owns mount/unmount on focus.
 */
import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createFluebricksFlute } from './fluebricks';
import { getLevel } from './audio';
import { useDisposable } from './useDisposable';
import { pointerCursor } from './CameraDirector';

const INK = '#607f83';
export const STUDY_POSITION: [number, number, number] = [2.5, 6, -0.5];
const studyScale = (aspect: number) => Math.min(1, aspect / 0.8);
export const studyTarget = (aspect: number) => new THREE.Vector3(...STUDY_POSITION)
  .add(new THREE.Vector3(3.5 * studyScale(aspect), -1.5, 0));

export function createFloatingStudy() {
  const source = createFluebricksFlute();
  const group = new THREE.Group();
  const pieces: { mesh: THREE.Mesh; home: number; offset: number }[] = [];
  source.children.forEach(child => {
    if (!(child instanceof THREE.Mesh)) return;
    const material = (child.material as THREE.MeshStandardMaterial).clone();
    material.transparent = true;
    material.opacity = 0.94;
    material.roughness = 0.48;
    const mesh = new THREE.Mesh(child.geometry.clone(), material);
    mesh.position.copy(child.position);
    mesh.rotation.copy(child.rotation);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 28),
      new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.42 }));
    mesh.add(edges);
    group.add(mesh);
    // Dark openings and the splitting edge travel with their physical parent module.
    const module = child.userData.flueModule as number;
    mesh.name = `floating-flue-${module}`;
    mesh.userData.flueModule = module;
    pieces.push({ mesh, home: child.position.y, offset: (module - 1) * 0.85 });
  });
  source.dispose();
  return { group, pieces, dispose() {
    group.traverse(node => {
      if (node instanceof THREE.Mesh || node instanceof THREE.LineSegments) {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      }
    });
  } };
}

function Note({ text, position, width = 7 }: {
  text: string; position: [number, number, number]; width?: number;
}) {
  const texture = useDisposable(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = INK;
    ctx.font = '500 28px monospace';
    ctx.fillText(text, 4, 60);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  });
  return texture ? <sprite position={position} scale={[width, width * 96 / 512, 1]}>
    <spriteMaterial map={texture} transparent depthWrite={false} />
  </sprite> : null;
}


function StudyGuides() {
  const drawing = useDisposable(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2, -0.9, 0), new THREE.Vector3(9.5, -0.9, 0),
      new THREE.Vector3(-2, -0.7, 0), new THREE.Vector3(-2, -1.1, 0),
      new THREE.Vector3(9.5, -0.7, 0), new THREE.Vector3(9.5, -1.1, 0),
    ]);
    const material = new THREE.LineDashedMaterial({ color: INK, transparent: true, opacity: 0.5, dashSize: 0.12, gapSize: 0.08 });
    const lines = new THREE.LineSegments(geometry, material);
    lines.computeLineDistances();
    return { lines, dispose() { geometry.dispose(); material.dispose(); } };
  });
  return drawing ? <primitive object={drawing.lines} /> : null;
}

function SoundTrace({ reducedMotion, paused, onToggle }: { reducedMotion: boolean; paused: boolean; onToggle: () => void }) {
  const elapsed = useRef(0);
  const trace = useDisposable(() => {
    const count = 96;
    const samples = new Float32Array(count);
    const positions = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) positions.set([i / (count - 1) * 8, -0.015, 0, i / (count - 1) * 8, 0.015, 0], i * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.8 });
    const line = new THREE.LineSegments(geometry, material);
    line.frustumCulled = false;
    return { count, samples, positions, geometry, line, dispose() { geometry.dispose(); material.dispose(); } };
  });
  useFrame((_, delta) => {
    if (!trace || paused || reducedMotion) return;
    elapsed.current += delta;
    if (elapsed.current < 1 / 30) return;
    elapsed.current = 0;
    trace.samples.copyWithin(0, 1);
    trace.samples[trace.count - 1] = Math.min(1, getLevel() * 5);
    for (let i = 0; i < trace.count; i++) {
      const x = i / (trace.count - 1) * 8;
      const amplitude = trace.samples[i] * 1.35 + 0.015;
      trace.positions.set([x, -amplitude, 0, x, amplitude, 0], i * 6);
    }
    trace.geometry.attributes.position.needsUpdate = true;
  });
  return <group name="sound-sketch" position={[-4, 3, -3]} {...pointerCursor} onClick={event => { event.stopPropagation(); if (event.delta <= 6) onToggle(); }}>
    {trace && <primitive object={trace.line} />}
    <Note text="SOUND / LIVE OUTPUT" position={[4, 1.8, 0]} width={7} />
  </group>;
}

function FluteStudy({ reducedMotion }: { reducedMotion: boolean }) {
  const [exploded, setExploded] = useState(true);
  const study = useDisposable(createFloatingStudy);
  const size = useThree(state => state.size);
  const blend = useRef(0);
  useFrame((_, delta) => {
    if (!study) return;
    const goal = Number(exploded);
    if (blend.current === goal) return;
    blend.current = reducedMotion || Math.abs(blend.current - goal) < 0.001 ? goal
      : THREE.MathUtils.damp(blend.current, goal, 7, delta);
    study.pieces.forEach(({ mesh, home, offset }) => {
      mesh.position.y = home + offset * blend.current;
    });
  });
  return <group name="living-sketch">
    <group name="fluebricks-study" position={STUDY_POSITION} scale={studyScale(size.width / size.height)} {...pointerCursor} onClick={event => { event.stopPropagation(); if (event.delta <= 6) setExploded(value => !value); }}>
      <Note text="02 / FLUEBRICKS" position={[2.8, 2.3, 0]} width={6} />
      <StudyGuides />
      <group rotation={[Math.PI, 0, -Math.PI / 2]} scale={1.25}>
        {study && <primitive object={study.group} />}
      </group>
    </group>
  </group>;
}

export function SketchLayer({ mode, reducedMotion }: { mode: 'flute' | 'sound'; reducedMotion: boolean }) {
  const [paused, setPaused] = useState(false);
  return mode === 'flute' ? <FluteStudy reducedMotion={reducedMotion} />
    : <SoundTrace reducedMotion={reducedMotion} paused={paused} onToggle={() => setPaused(value => !value)} />;
}
