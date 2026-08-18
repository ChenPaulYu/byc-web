/**
 * DeskGear.tsx — the owner's real kit, arranged on the desk the way it is actually used.
 *
 * The layout follows `docs/blueprints/thoughts/2026-08-15-producer-desk-layout.md`: a reach
 * zone at the front for what is played by hand, a look-at zone behind it holding the laptop and
 * the monitor pair. The MPC is now the only thing in the reach zone — a second controller beside
 * it read as set dressing rather than as kit, so it went.
 *
 * The register is bedroom recording, not a treated studio. The monitors are raised on a stack
 * of books rather than isolation wedges. The 50 Lan cup, football, the FlueBricks preprint and
 * the assembled flute sit with the gear because they are the same portrait — research, music,
 * football — not leftover clutter.
 *
 * Reads: layout.ts scene units (the MPC is 9 x 5 at the origin) · Stage's DESK_TOP_Y ·
 * shot.ts (focus distances) · CameraDirector (the click→flight contract) · mixerLcd.ts ·
 * paperPage.ts · fluebricks.ts · fiftyLan.tsx · audio `setChannel` / `getChannelDisplayLevels`
 */

import React, { useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';
import { getChannelDisplayLevels, setChannel } from './audio';
import { bundle, useDisposable } from './useDisposable';
import { DESK_TOP_Y } from './Stage';
import {
  FLUTE_FOCUS_DISTANCE,
  MONITOR_PAIR_FOCUS_DISTANCE,
  MONITOR_PAIR_TARGET,
  MONITOR_X,
  MUG_FOCUS_DISTANCE,
  PAPER_FOCUS_DISTANCE,
  SIDEKICK_FOCUS_DISTANCE,
} from './shot';
import { requestFocus, pointerCursor, type FocusHandler } from './CameraDirector';
import { cm, REAL } from './scale';
import { createMixerLcd, drawMixerLcd } from './mixerLcd';
import { createFluebricksPage } from './paperPage';
import { createFluebricksFlute } from './fluebricks';
import { FiftyLanCup } from './fiftyLan';

const CASE_DARK = '#3f4348';
const BOOK_A = '#c9cbc6';
const BOOK_B = '#d9d5cc';
const BOOK_C = '#bfc4c8';

/**
 * The front of a Tannoy Gold 5, which is what REAL.monitor has been measured from all along.
 *
 * Its one distinguishing feature is the Dual Concentric driver: the tweeter sits down the throat
 * of the woofer rather than in a second hole above it, so this baffle has exactly one circle on
 * it. The version before this had a separate tweeter up top, which is the layout of almost every
 * other monitor and of no Tannoy. The gold centre is the rest of the identity — it is the only
 * warm point on an otherwise matte black box, and it is what the "Gold" in the name refers to.
 *
 * Everything is drawn as stacked discs standing a fraction of a millimetre apart rather than as
 * real recesses: at this distance the cabinet is about forty pixels wide, so the depth would
 * never be seen and the z-fighting would be.
 */
// Read off public/landing/gear/tannoy-gold-5.png, measured against the 19 cm cabinet width in
// REAL.monitor: the gold ring is about two thirds of the front face across, the tweeter cone at
// its centre is far smaller than it looks in memory, and the control plate sits a third of the
// way down from centre.
/**
 * The cabinet, extruded from its front silhouette rather than boxed or planned from above.
 *
 * A RoundedBox rolls all twelve edges by the same amount, so more curve on the uprights balloons
 * the top into a pillow. Extruding the *top-down* plan along the height was the next attempt, and
 * it is why "not round enough" kept being true: that profile rounds the vertical edges, so from
 * the front the speaker still reads as a rectangle with softened sides. The Gold 5 product shot
 * is a rounded rectangle head-on. Extruding that front profile along the depth is the shape the
 * photograph is of. It also drops the old bind: rolling the uprights no longer eats the baffle
 * width, so the brass ring no longer has to shrink for the corners to grow.
 *
 * CAB_RADIUS is larger than the photograph measures (~2 cm on a 17.6 cm cabinet). At this camera
 * distance a true 2 cm corner is four pixels and still reads as a box.
 */
const CAB_RADIUS = cm(4.2);
const CAB_BEVEL = cm(1);

const roundedRectShape = (width: number, height: number, radius: number) => {
  const w = width / 2;
  const h = height / 2;
  const r = Math.min(radius, w, h);
  const shape = new THREE.Shape();
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(w, h - r);
  shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  shape.lineTo(-w + r, h);
  shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w, -h + r);
  shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
};

const stadiumShape = (width: number, height: number) => {
  const r = height / 2;
  const cx = width / 2 - r;
  const shape = new THREE.Shape();
  shape.moveTo(-cx, -r);
  shape.lineTo(cx, -r);
  shape.absarc(cx, 0, r, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-cx, r);
  shape.absarc(-cx, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return shape;
};

const useCabinetGeometry = () =>
  useDisposable(() => {
    // ExtrudeGeometry's bevel grows *outward* from the profile, so the profile has to be inset by
    // the bevel on every side for the finished cabinet to measure what REAL.monitor says. Getting
    // this wrong the first time both inflated the box and pushed its front surface out past
    // BAFFLE_Z, which swallowed the entire driver.
    const w = cm(REAL.monitor.width) - CAB_BEVEL * 2;
    const h = cm(REAL.monitor.height) - CAB_BEVEL * 2;
    const d = cm(REAL.monitor.depth) - CAB_BEVEL * 2;
    const r = CAB_RADIUS - CAB_BEVEL;
    const geometry = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
      depth: d,
      bevelEnabled: true,
      bevelThickness: CAB_BEVEL,
      bevelSize: CAB_BEVEL,
      bevelSegments: 6,
      curveSegments: 14,
    });
    // Front silhouette in XY, extrusion along +Z. Bevel grows both ways, so shift to centre.
    geometry.translate(0, 0, CAB_BEVEL - cm(REAL.monitor.depth) / 2);
    return geometry;
  });

const BAFFLE_Z = cm(REAL.monitor.depth) / 2 + cm(0.02);
const DRIVER_Y = cm(4.2);
const RING_OUTER = cm(6.8);
const RING_INNER = cm(5.4);

/**
 * A brass that stays brass under this scene's lighting.
 *
 * Metal takes almost all of its colour from what it reflects, and this room is a near-white void
 * with one small runtime-built environment map — so the first pass, an accurate dark brass at
 * metalness 0.72, rendered as a black ring on a black box. Lower metalness with a brighter base
 * and a lifted envMapIntensity is a physically worse metal and a visually correct one.
 */
const brass = (color: string) => (
  <meshStandardMaterial color={color} roughness={0.29} metalness={0.3} envMapIntensity={2.6} />
);

const TannoyBaffle: React.FC = () => {
  const shapes = useDisposable(() => {
    const r = CAB_RADIUS - CAB_BEVEL;
    return bundle({
      baffle: new THREE.ShapeGeometry(
        roundedRectShape(
          cm(REAL.monitor.width) - CAB_BEVEL * 2,
          cm(REAL.monitor.height) - CAB_BEVEL * 2,
          r,
        ),
      ),
      plateOuter: new THREE.ShapeGeometry(stadiumShape(cm(13.2), cm(3.8))),
      plateInner: new THREE.ShapeGeometry(stadiumShape(cm(12.5), cm(3.1))),
    });
  });

  return (
  <group position={[0, 0, BAFFLE_Z]}>
    {/* Baffle follows the rounded-rect front, a shade off the cabinet so the face separates. */}
    <mesh position={[0, 0, cm(0.05)]} geometry={shapes?.baffle}>
      <meshStandardMaterial color="#1c1d1f" roughness={0.86} metalness={0.05} envMapIntensity={1.2} />
    </mesh>

    {/* Driver: the wide brass ring, the graphite cone inside it, then the small gold tweeter
        cone down its throat. The ring is the whole identity of the thing — on the reference it
        is the brightest object in the photograph. */}
    <mesh position={[0, DRIVER_Y, cm(0.1)]}>
      <ringGeometry args={[RING_INNER, RING_OUTER, 44]} />
      {brass('#dcb964')}
    </mesh>
    <mesh position={[0, DRIVER_Y, cm(0.15)]}>
      <circleGeometry args={[RING_INNER, 44]} />
      <meshStandardMaterial color="#5b6066" roughness={0.66} metalness={0.1} envMapIntensity={3.2} />
    </mesh>
    <mesh position={[0, DRIVER_Y, cm(0.2)]}>
      <circleGeometry args={[cm(5.0), 44]} />
      <meshStandardMaterial color="#4a4f55" roughness={0.8} metalness={0.07} envMapIntensity={2.6} />
    </mesh>
    <mesh position={[0, DRIVER_Y, cm(0.25)]}>
      <circleGeometry args={[cm(1.3), 24]} />
      {brass('#e6c473')}
    </mesh>

    {/* The front control plate: a brass-outlined capsule holding the knobs, the power LED and
        the GOLD 5 legend. None of that survives at forty pixels, but the outline does, and it is
        the second thing that says Tannoy after the ring — so it is drawn as a pill and a recess
        and nothing else. */}
    <group position={[0, cm(-8.8), cm(0.1)]}>
      <mesh geometry={shapes?.plateOuter}>
        <meshStandardMaterial color="#8a713e" roughness={0.4} metalness={0.28} envMapIntensity={1.9} />
      </mesh>
      <mesh position={[0, 0, cm(0.05)]} geometry={shapes?.plateInner}>
        <meshStandardMaterial color="#2c3034" roughness={0.84} metalness={0.06} envMapIntensity={2.2} />
      </mesh>
    </group>
  </group>
  );
};

/**
 * A monitor on a stack of paperbacks. Isolation pads are what a studio uses; books are what a
 * bedroom uses, and the difference is most of the register.
 */
const MonitorOnBooks: React.FC<{ x: number; toeIn: number; onFocus?: FocusHandler }> = ({ x, toeIn, onFocus }) => {
  const cabinet = useCabinetGeometry();
  return (
  <group
    position={[x, DESK_TOP_Y, MONITOR_PAIR_TARGET[2]]}
    rotation={[0, toeIn, 0]}
    {...pointerCursor}
    onClick={(e) => {
      requestFocus(onFocus, new THREE.Vector3(...MONITOR_PAIR_TARGET), MONITOR_PAIR_FOCUS_DISTANCE, e, 'monitors');
    }}
  >
    {[
      { i: 0, c: BOOK_A, r: 0.04 },
      { i: 1, c: BOOK_B, r: -0.05 },
      { i: 2, c: BOOK_C, r: 0.03 },
    ].map((b) => (
      <mesh
        key={b.i}
        position={[0, cm(REAL.paperback.height) * (b.i + 0.5), 0]}
        rotation={[0, b.r, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[cm(REAL.paperback.depth), cm(REAL.paperback.height), cm(REAL.paperback.width + 2)]} />
        <meshStandardMaterial color={b.c} roughness={0.92} metalness={0} />
      </mesh>
    ))}
    {/* Cabinet, tilted back a little the way a monitor on an improvised riser always is. */}
    <group position={[0, cm(REAL.paperback.height * 3) + cm(REAL.monitor.height) / 2, 0]} rotation={[-0.09, 0, 0]}>
      <mesh geometry={cabinet ?? undefined} castShadow receiveShadow>
        <meshPhysicalMaterial color={CASE_DARK} roughness={0.58} metalness={0.14} envMapIntensity={1.7} clearcoat={0.25} clearcoatRoughness={0.55} />
      </mesh>
      <TannoyBaffle />
    </group>
  </group>
  );
};

/**
 * Two-channel desk mixer. Layout, two-tone split and force pad are read off a compact
 * 88 × 240 × 16 mm stereo mixer; the wordmark is BYC — BUS, same house as the MPC. The LCD
 * meters PAD and BED as two LED columns; the force pad is the silhouette on the right.
 */
const SK = REAL.sidekick;
const SK_W = cm(SK.width);
const SK_D = cm(SK.depth);
const SK_H = cm(SK.height);
const SK_ORANGE = '#ee5a1e';

/** Fractions of the unit's depth, back edge to front. Shared by the printed face and the 3D controls. */
const skZ = (fraction: number) => (fraction - 0.5) * SK_D;
/** Fractions of the unit's width, left to right. */
const skX = (fraction: number) => (fraction - 0.5) * SK_W;

const FACE = {
  gain: 0.28,
  high: 0.368,
  mid: 0.445,
  low: 0.51,
  cue: 0.57,
  fader: 0.73,
  fx: 0.905,
  pad: 0.40,
  volume: 0.54,
  mod: 0.625,
  phones: 0.73,
  select: 0.905,
} as const;

const COL = {
  ch1: 0.20,
  ch2: 0.44,
  right: 0.80,
} as const;

/** Printed LCD window, fractions of the face. The 3D meter plane sits in this hole. */
const LCD = { x: 0.655, y: 0.225, w: 0.29, h: 0.09 } as const;

const KNOB_ROWS = [
  { z: skZ(FACE.gain), colour: SK_ORANGE, r: cm(0.58) },
  { z: skZ(FACE.high), colour: '#f2f2f0', r: cm(0.58) },
  { z: skZ(FACE.mid), colour: '#83868b', r: cm(0.42) },
  { z: skZ(FACE.low), colour: '#1e2023', r: cm(0.42) },
];
const KNOB_COLS = [skX(COL.ch1), skX(COL.ch2)];
const RIGHT_COL = skX(COL.right);

const FADER_TRAVEL = cm(5.2);
const FADER_Z = skZ(FACE.fader);

/** Printed face: white head, brushed grey body, wordmark, jack tabs. Controls sit on top as meshes. */
const createSidekickFace = (): THREE.CanvasTexture | null => {
  const w = 512;
  const h = Math.round(w * (SK.depth / SK.width));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const X = (f: number) => f * w;
  const Y = (f: number) => f * h;

  ctx.fillStyle = '#c2c5c8';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < w; i += 2) {
    ctx.strokeStyle = i % 6 === 0 ? 'rgba(255,255,255,0.14)' : 'rgba(90,94,98,0.08)';
    ctx.beginPath();
    ctx.moveTo(i + 0.5, 0);
    ctx.lineTo(i + 0.5, h);
    ctx.stroke();
  }

  ctx.fillStyle = '#f3f3f2';
  ctx.fillRect(0, 0, w, Y(0.205));

  const tabs = [
    { from: 0.035, to: 0.255, colour: '#3a3d41', label: 'OUTPUT' },
    { from: 0.265, to: 0.455, colour: SK_ORANGE, label: 'AUX' },
    { from: 0.465, to: 0.655, colour: SK_ORANGE, label: 'INPUT' },
    { from: 0.665, to: 0.82, colour: '#3a3d41', label: 'USB' },
  ];
  const tabY = Y(0.012);
  const tabH = Y(0.038);
  ctx.font = `600 ${Math.round(h * 0.014)}px Inter, Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const tab of tabs) {
    const tw = X(tab.to - tab.from);
    const tx = X(tab.from);
    ctx.beginPath();
    ctx.roundRect(tx, tabY, tw, tabH, 3);
    ctx.fillStyle = tab.colour;
    ctx.fill();
    ctx.fillStyle = '#f4f4f3';
    ctx.fillText(tab.label, tx + tw / 2, tabY + tabH / 2);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1a1b1d';
  ctx.font = `700 ${Math.round(h * 0.034)}px Inter, Helvetica, Arial, sans-serif`;
  ctx.fillText('BYC  —  BUS', X(0.06), Y(0.09));
  ctx.fillStyle = SK_ORANGE;
  ctx.font = `600 ${Math.round(h * 0.024)}px "Hiragino Sans", "PingFang TC", sans-serif`;
  ctx.fillText('ミキサー', X(0.06), Y(0.122));
  ctx.strokeStyle = '#d5d5d3';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X(0.06), Y(0.145));
  ctx.lineTo(X(0.94), Y(0.145));
  ctx.stroke();
  ctx.fillStyle = '#1a1b1d';
  ctx.font = `600 ${Math.round(h * 0.02)}px Inter, Helvetica, Arial, sans-serif`;
  ctx.fillText('2 CH STEREO MIXER', X(0.06), Y(0.175));

  ctx.beginPath();
  ctx.roundRect(X(LCD.x), Y(LCD.y), X(LCD.w), Y(LCD.h), 5);
  ctx.fillStyle = '#141312';
  ctx.fill();

  ctx.fillStyle = '#5c5f64';
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(h * 0.012)}px Inter, Helvetica, Arial, sans-serif`;
  const caption = (text: string, xf: number, yf: number) => ctx.fillText(text, X(xf), Y(yf));
  caption('GAIN', COL.ch1, FACE.gain + 0.042);
  caption('GAIN', COL.ch2, FACE.gain + 0.042);
  caption('HIGH', COL.ch1, FACE.high + 0.042);
  caption('HIGH', COL.ch2, FACE.high + 0.042);
  caption('MID', COL.ch1, FACE.mid + 0.038);
  caption('MID', COL.ch2, FACE.mid + 0.038);
  caption('LOW', COL.ch1, FACE.low + 0.038);
  caption('LOW', COL.ch2, FACE.low + 0.038);
  caption('VOLUME', COL.right, FACE.volume + 0.048);
  caption('PHONES', COL.right, FACE.phones + 0.048);
  caption('PAD', COL.ch1, FACE.fader - 0.085);
  caption('BED', COL.ch2, FACE.fader - 0.085);

  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

const LCD_W = LCD.w * SK_W * 0.92;
const LCD_H = LCD.h * SK_D * 0.88;

/**
 * One channel fader. Channel 0 is the pads, channel 1 is the background bed — printed PAD / BED
 * on the face. Pushing one down leaves you the other, which is the only reason a mixer is on
 * this desk rather than a picture of one.
 *
 * The cap measures about four pixels by three on screen, which is not a mouse target. The grab
 * area is therefore a much larger invisible box around the whole travel. It cannot use
 * `visible={false}` to hide it: three.js skips invisible objects when raycasting, so the handle
 * would stop being clickable at the same moment it stopped being drawn.
 */
const Fader: React.FC<{ x: number; channel: number; initial: number; onDragChange?: (dragging: boolean) => void }> = ({
  x,
  channel,
  initial,
  onDragChange,
}) => {
  const [value, setValue] = useState(initial);
  const valueRef = useRef(initial);

  const bind = useDrag(({ delta: [_, dy], event, first, last }) => {
    event?.stopPropagation();
    if (first) onDragChange?.(true);
    if (last) onDragChange?.(false);
    // Up is louder, so a downward drag lowers the channel.
    const next = Math.min(1, Math.max(0, valueRef.current - dy * 0.006));
    valueRef.current = next;
    setValue(next);
    setChannel(channel, next);
  }, { eventOptions: { passive: false } });

  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, SK_H + cm(0.05), FADER_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cm(0.5), FADER_TRAVEL + cm(0.8)]} />
        <meshStandardMaterial color="#2a2c2f" roughness={0.8} />
      </mesh>
      <RoundedBox
        args={[cm(1.35), cm(0.32), cm(0.85)]}
        radius={cm(0.1)}
        smoothness={3}
        position={[0, SK_H + cm(0.22), FADER_Z + (0.5 - value) * FADER_TRAVEL]}
        castShadow
      >
        <meshStandardMaterial color="#6f7378" roughness={0.45} metalness={0.08} />
      </RoundedBox>
      <mesh {...(bind() as any)} position={[0, SK_H + cm(0.7), FADER_Z]}>
        <boxGeometry args={[cm(3.2), cm(1.8), FADER_TRAVEL + cm(2.4)]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};

const Sidekick: React.FC<{ onDragChange?: (dragging: boolean) => void; onFocus?: FocusHandler }> = ({ onDragChange, onFocus }) => {
  const root = useRef<THREE.Group>(null);
  const face = useDisposable(() => createSidekickFace());
  const lcd = useDisposable(() =>
    bundle({ texture: createMixerLcd(), geometry: new THREE.PlaneGeometry(LCD_W, LCD_H) }),
  );
  const peaks = useRef<[number, number]>([0, 0]);
  const peakHoldUntil = useRef<[number, number]>([0, 0]);
  const lastT = useRef(0);
  const lastDraw = useRef(0);
  const lcdCtx = useRef<CanvasRenderingContext2D | null>(null);

  useFrame((state) => {
    const texture = lcd?.texture;
    if (!texture) return;
    const canvas = texture.image as HTMLCanvasElement;
    if (!lcdCtx.current) lcdCtx.current = canvas.getContext('2d');
    const ctx = lcdCtx.current;
    if (!ctx) return;

    const t = state.clock.elapsedTime;
    const dt = Math.min(0.05, Math.max(0, t - lastT.current));
    lastT.current = t;

    const [pad, bed] = getChannelDisplayLevels();
    const shown: [number, number] = [pad, bed];
    for (let i = 0; i < 2; i += 1) {
      if (shown[i] >= peaks.current[i]) {
        peaks.current[i] = shown[i];
        peakHoldUntil.current[i] = t + 0.55;
      } else if (t > peakHoldUntil.current[i]) {
        peaks.current[i] = Math.max(shown[i], peaks.current[i] - dt * 0.9);
      }
    }

    // Peak hold is cheap; uploading a 128×96 canvas every frame is not. 20 Hz still reads as a
    // meter.
    if (t - lastDraw.current < 1 / 20) return;
    lastDraw.current = t;
    drawMixerLcd(ctx, pad, bed, peaks.current, SK_ORANGE);
    texture.needsUpdate = true;
  });

  const deck = SK_H + cm(0.04);

  return (
  <group
    ref={root}
    position={[cm(-32), DESK_TOP_Y, cm(8)]}
    rotation={[0, 0.1, 0]}
    {...pointerCursor}
    onClick={(e) => {
      if (!root.current) return;
      requestFocus(onFocus, root.current.getWorldPosition(new THREE.Vector3()), SIDEKICK_FOCUS_DISTANCE, e, null);
    }}
  >
    <RoundedBox args={[SK_W, SK_H, SK_D]} radius={cm(0.22)} smoothness={4} position={[0, SK_H / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#b4b7bb" roughness={0.62} metalness={0.06} />
    </RoundedBox>

    <mesh position={[0, SK_H + cm(0.015), 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[SK_W - cm(0.35), SK_D - cm(0.35)]} />
      <meshStandardMaterial
        key={face ? 'face' : 'bare'}
        map={face ?? undefined}
        color={face ? '#ffffff' : '#c2c5c8'}
        roughness={0.55}
        metalness={0.04}
      />
    </mesh>

    <mesh position={[skX(0.91), deck, skZ(0.032)]} castShadow>
      <boxGeometry args={[cm(0.9), cm(0.22), cm(0.45)]} />
      <meshStandardMaterial color={SK_ORANGE} roughness={0.5} />
    </mesh>

    {KNOB_COLS.map((x) =>
      KNOB_ROWS.map((row) => (
        <group key={`${x}-${row.z}`} position={[x, deck, row.z]}>
          <mesh position={[0, cm(0.22), 0]} castShadow>
            <cylinderGeometry args={[row.r, row.r * 1.1, cm(0.44), 16]} />
            <meshStandardMaterial color={row.colour} roughness={0.42} metalness={0.05} />
          </mesh>
          <mesh position={[0, cm(0.45), -row.r * 0.45]}>
            <boxGeometry args={[cm(0.12), cm(0.03), row.r * 0.75]} />
            <meshStandardMaterial color={row.colour === '#1e2023' ? '#c9ccd0' : '#3a3d41'} roughness={0.5} />
          </mesh>
        </group>
      )),
    )}

    <mesh
      position={[skX(LCD.x + LCD.w / 2), SK_H + cm(0.03), skZ(LCD.y + LCD.h / 2)]}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={lcd?.geometry}
    >
      <meshStandardMaterial
        key={lcd ? 'lcd' : 'lcd-bare'}
        map={lcd?.texture}
        color={lcd ? '#ffffff' : '#141312'}
        roughness={0.35}
        metalness={0.02}
        emissive={SK_ORANGE}
        emissiveMap={lcd?.texture}
        emissiveIntensity={lcd ? 0.55 : 0}
        toneMapped={false}
      />
    </mesh>

    {/* Force pad — the large circle that is this machine's silhouette on the right. */}
    <mesh position={[RIGHT_COL, SK_H + cm(0.02), skZ(FACE.pad)]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[cm(1.05), cm(1.2), 32]} />
      <meshStandardMaterial color="#9ea2a6" roughness={0.55} />
    </mesh>
    <mesh position={[RIGHT_COL, SK_H + cm(0.03), skZ(FACE.pad)]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[cm(1.05), 32]} />
      <meshStandardMaterial color="#d4d6d8" roughness={0.48} metalness={0.04} />
    </mesh>

    <mesh position={[RIGHT_COL, deck + cm(0.18), skZ(FACE.volume)]} castShadow>
      <cylinderGeometry args={[cm(0.62), cm(0.7), cm(0.5), 20]} />
      <meshStandardMaterial color="#f0f0ef" roughness={0.42} />
    </mesh>

    {/* MOD stick: a short orange post, not a glowing rectangle. */}
    <mesh position={[RIGHT_COL, SK_H + cm(0.02), skZ(FACE.mod)]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[cm(0.55), 20]} />
      <meshStandardMaterial color={SK_ORANGE} roughness={0.5} />
    </mesh>
    <mesh position={[RIGHT_COL, deck + cm(0.12), skZ(FACE.mod)]} castShadow>
      <cylinderGeometry args={[cm(0.16), cm(0.2), cm(0.35), 10]} />
      <meshStandardMaterial color="#f4f4f3" roughness={0.4} />
    </mesh>

    {KNOB_COLS.map((x, i) => (
      <group key={`ch-${x}`}>
        <RoundedBox args={[cm(1.7), cm(0.18), cm(0.85)]} radius={cm(0.08)} smoothness={3} position={[x, deck, skZ(FACE.cue)]}>
          <meshStandardMaterial color="#26282b" roughness={0.6} />
        </RoundedBox>
        <Fader x={x} channel={i} initial={i === 0 ? 0.85 : 0.3} onDragChange={onDragChange} />
        <RoundedBox args={[cm(1.7), cm(0.18), cm(0.85)]} radius={cm(0.08)} smoothness={3} position={[x, deck, skZ(FACE.fx)]}>
          <meshStandardMaterial color="#26282b" roughness={0.6} />
        </RoundedBox>
      </group>
    ))}

    <mesh position={[RIGHT_COL, deck + cm(0.14), skZ(FACE.phones)]} castShadow>
      <cylinderGeometry args={[cm(0.55), cm(0.62), cm(0.42), 16]} />
      <meshStandardMaterial color="#26282b" roughness={0.5} />
    </mesh>
    <RoundedBox args={[cm(1.8), cm(0.18), cm(0.85)]} radius={cm(0.08)} smoothness={3} position={[RIGHT_COL, deck, skZ(FACE.select)]}>
      <meshStandardMaterial color="#26282b" roughness={0.6} />
    </RoundedBox>
  </group>
  );
};


/** 50 Lan cup, FlueBricks preprint, and the assembled flute that paper is about. */
const Clutter: React.FC<{ onFocus?: FocusHandler }> = ({ onFocus }) => {
  const page = useDisposable(createFluebricksPage);
  const flute = useDisposable(createFluebricksFlute);
  const fluteT = cm(REAL.fluebricks.thickness) / 2;
  const mug = useRef<THREE.Group>(null);
  const paper = useRef<THREE.Group>(null);
  const fluteRoot = useRef<THREE.Group>(null);
  return (
  <group>
    <group
      ref={mug}
      position={[cm(-56), DESK_TOP_Y, cm(22)]}
      rotation={[0, 0.35, 0]}
      {...pointerCursor}
      onClick={(e) => {
        if (!mug.current) return;
        const target = mug.current.getWorldPosition(new THREE.Vector3());
        target.y += cm(REAL.mug.height) / 2;
        requestFocus(onFocus, target, MUG_FOCUS_DISTANCE, e, 'mug');
      }}
    >
      <FiftyLanCup />
    </group>
    <group
      ref={paper}
      position={[cm(50), DESK_TOP_Y, cm(18)]}
      rotation={[0, -0.22, 0]}
      {...pointerCursor}
      onClick={(e) => {
        if (!paper.current) return;
        requestFocus(onFocus, paper.current.getWorldPosition(new THREE.Vector3()), PAPER_FOCUS_DISTANCE, e, 'paper');
      }}
    >
      <mesh position={[cm(0.8), cm(0.12), cm(0.6)]} rotation={[0, 0.11, 0]} castShadow>
        <boxGeometry args={[cm(21), cm(0.18), cm(29.7)]} />
        <meshStandardMaterial color="#efebe3" roughness={0.92} />
      </mesh>
      <mesh position={[0, cm(0.28), 0]} castShadow receiveShadow>
        <boxGeometry args={[cm(21), cm(0.12), cm(29.7)]} />
        <meshStandardMaterial color="#f6f3ec" roughness={0.9} />
      </mesh>
      <mesh position={[0, cm(0.36), 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[cm(21), cm(29.7)]} />
        <meshStandardMaterial
          key={page ? 'print' : 'bare'}
          map={page ?? undefined}
          color={page ? '#ffffff' : '#f6f3ec'}
          roughness={0.88}
          metalness={0}
        />
      </mesh>
    </group>
    {/* In the gap between the MPC and the preprint, mouthpiece toward the chair. Laid down, not
        displayed — the paper is what you were reading, the flute is what you just put down. */}
    {flute && (
      <group
        ref={fluteRoot}
        position={[cm(33), DESK_TOP_Y + fluteT, cm(6)]}
        rotation={[0, -0.38, 0]}
        {...pointerCursor}
        onClick={(e) => {
          if (!fluteRoot.current) return;
          requestFocus(onFocus, fluteRoot.current.getWorldPosition(new THREE.Vector3()), FLUTE_FOCUS_DISTANCE, e, 'flute');
        }}
      >
        <group rotation={[Math.PI / 2, Math.PI, 0]}>
          <primitive object={flute} />
        </group>
      </group>
    )}
  </group>
  );
};

export const DeskGear: React.FC<{ onDragChange?: (dragging: boolean) => void; onFocus?: FocusHandler }> = ({ onDragChange, onFocus }) => (
  <group>
    <Sidekick onDragChange={onDragChange} onFocus={onFocus} />
    <MonitorOnBooks x={-MONITOR_X} toeIn={0.42} onFocus={onFocus} />
    <MonitorOnBooks x={MONITOR_X} toeIn={-0.42} onFocus={onFocus} />
    <Clutter onFocus={onFocus} />
  </group>
);
