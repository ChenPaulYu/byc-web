/**
 * DeskGear.tsx — the owner's real kit, arranged on the desk the way it is actually used.
 *
 * The layout follows `docs/blueprints/thoughts/2026-08-15-producer-desk-layout.md`: a reach
 * zone at the front for what is played by hand, a look-at zone behind it holding the laptop and
 * the monitor pair. The MPC is now the only thing in the reach zone — a second controller beside
 * it read as set dressing rather than as kit, so it went.
 *
 * The register is bedroom recording, not a treated studio. The monitors are raised on a stack
 * of books rather than isolation wedges, the cables are visible, and the desk is allowed to
 * hold things that have nothing to do with music. A tidy desk would read as a product shot.
 *
 * Reads: layout.ts scene units (the MPC is 9 x 5 at the origin) · Stage's DESK_TOP_Y
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDrag } from '@use-gesture/react';
import { getLevel, setChannel } from './audio';
import { bundle, useDisposable } from './useDisposable';
import { DESK_TOP_Y } from './Stage';
import { cm, REAL } from './scale';

const CASE_DARK = '#3f4348';
const BOOK_A = '#c9cbc6';
const BOOK_B = '#d9d5cc';
const BOOK_C = '#bfc4c8';
const CABLE = '#3a3c3f';
const MUG = '#e3e4e2';

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
const MonitorOnBooks: React.FC<{ x: number; toeIn: number }> = ({ x, toeIn }) => {
  const cabinet = useCabinetGeometry();
  return (
  <group position={[x, DESK_TOP_Y, cm(-24)]} rotation={[0, toeIn, 0]}>
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

/** Cables. Ranked low by the research, but visible cable is the bedroom-recording tell. */
const Cables: React.FC = () => {
  const curves = useMemo(() => {
    const make = (pts: Array<[number, number, number]>) =>
      new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    return [
      // Monitor leads, run along the desk where the camera can see them rather than tucked
      // behind the far edge, which is geometry nobody ever renders.
      //
      // They have to go *over* the edge and down, not stop at it. The first version after the
      // laptop was removed ended its last control point at z = -35 — the back edge exactly — so
      // the tube reached the rim and was cut off, leaving a blunt black stub sticking out into
      // space. A cable that ends where a surface ends does not read as tucked away; it reads as
      // broken geometry, which is what it was.
      make([
        [cm(-52), DESK_TOP_Y + cm(1), cm(-30)],
        [cm(-46), DESK_TOP_Y + cm(0.5), cm(-32)],
        [cm(-38), DESK_TOP_Y + cm(0.5), cm(-34)],
        [cm(-34), DESK_TOP_Y - cm(2), cm(-36.5)],
        [cm(-33), DESK_TOP_Y - cm(13), cm(-37)],
      ]),
      make([
        [cm(52), DESK_TOP_Y + cm(1), cm(-30)],
        [cm(46), DESK_TOP_Y + cm(0.5), cm(-32)],
        [cm(38), DESK_TOP_Y + cm(0.5), cm(-34)],
        [cm(34), DESK_TOP_Y - cm(2), cm(-36.5)],
        [cm(33), DESK_TOP_Y - cm(13), cm(-37)],
      ]),
    ];
  }, []);

  return (
    <group>
      {curves.map((c, i) => (
        <mesh key={i} castShadow>
          <tubeGeometry args={[c, 44, cm(0.5), 6, false]} />
          <meshStandardMaterial color={CABLE} roughness={0.75} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * The K.O. II Sidekick — the 2-channel mixer that partners the EP-133.
 *
 * It renders about forty pixels across, so it is built from the two things that survive that:
 * its proportion, which is unusually tall and narrow for a desk box, and its colour-coded knob
 * grid, where the four rows go orange, white, grey, black down each channel. Everything printed
 * on the real one — the wordmark, the katakana, GAIN / HIGH / MID / LOW, CUE, FX — is left off
 * for the reason the MPC's own labels were: at this size type is grey mush, and mush reads worse
 * than absence.
 *
 * Knobs and faders are drawn larger than scale. A real 11 mm knob lands at about two pixels here.
 */
export type FocusHandler = (
  target: THREE.Vector3,
  distance: number,
  event: { clientX: number; clientY: number },
) => void;

/** 1.76 units across, so it needs to come much closer than the MPC to be workable. */
const SIDEKICK_FOCUS_DISTANCE = 13;

const SK = REAL.sidekick;
const SK_W = cm(SK.width);
const SK_D = cm(SK.depth);
const SK_H = cm(SK.height);
const SK_ORANGE = '#ee5a1e';

/** Fractions of the unit's depth, read off the product shot, back edge to front. */
const skZ = (fraction: number) => (fraction - 0.5) * SK_D;
/** Fractions of the unit's width, left to right. */
const skX = (fraction: number) => (fraction - 0.5) * SK_W;

// All read off the front-on product shot as fractions of the unit, so the panel's proportions are
// the machine's rather than mine.
//
// The crowding in the first pass was not row spacing — it was two things the reference does not
// do: the knob columns sat too close together, and all four rows were the same size. On the real
// unit GAIN and HIGH are visibly larger than MID and LOW, and that size step is a stronger shape
// signal at this distance than any of the labels would have been.
const KNOB_ROWS = [
  { z: skZ(0.31), colour: SK_ORANGE, r: cm(0.85) }, // GAIN
  { z: skZ(0.43), colour: '#f2f2f0', r: cm(0.85) }, // HIGH
  { z: skZ(0.545), colour: '#83868b', r: cm(0.62) }, // MID
  { z: skZ(0.645), colour: '#1e2023', r: cm(0.62) }, // LOW
];
const KNOB_COLS = [skX(0.19), skX(0.44)];
/** The display, the volume knob and the headphone knob all share one column on the right. */
const RIGHT_COL = skX(0.77);
/** The inset every full-width plate shares, so none of them reaches the rolled edge. */
const SW_INSET = SK_W - cm(0.7);

const FADER_TRAVEL = cm(3.2);
const FADER_Z = skZ(0.83);

/**
 * One channel fader. Channel 0 is the pads, channel 1 is the background bed, so pushing one down
 * leaves you the other — which is the only reason a mixer is on this desk rather than a picture
 * of one.
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
        args={[cm(1.7), cm(0.55), cm(1.1)]}
        radius={cm(0.12)}
        smoothness={3}
        position={[0, SK_H + cm(0.35), FADER_Z + (0.5 - value) * FADER_TRAVEL]}
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

const METER_W = cm(1.5);
const METER_H = cm(2.4);
/** Top-right, level with the two large knobs — not mid-panel, which is where it was. */
const SCREEN_Z = skZ(0.35);

const Sidekick: React.FC<{ onDragChange?: (dragging: boolean) => void; onFocus?: FocusHandler }> = ({ onDragChange, onFocus }) => {
  const root = useRef<THREE.Group>(null);
  // The lit block grows from the display's near edge, so its origin has to sit at that edge
  // rather than at its centre — scaling happens about the origin.
  const meterGeometry = useDisposable(() => {
    const g = new THREE.PlaneGeometry(METER_W, METER_H);
    g.translate(0, METER_H / 2, 0);
    return g;
  });

  const meterRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const mesh = meterRef.current;
    if (!mesh) return;
    // Height and brightness both follow the level. The display renders about six pixels by
    // eight, so a two-channel bar graph like the real one would be sub-pixel; a single block
    // that moves and brightens is what survives at this size.
    const level = Math.min(1, getLevel() * 3.2);
    mesh.scale.y = 0.08 + level * 0.92;
    (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3 + level * 1.2;
  });

  return (
  <group
    ref={root}
    position={[cm(-32), DESK_TOP_Y, cm(8)]}
    rotation={[0, 0.1, 0]}
    onClick={(e) => {
      if (!onFocus || !root.current) return;
      e.stopPropagation();
      onFocus(root.current.getWorldPosition(new THREE.Vector3()), SIDEKICK_FOCUS_DISTANCE, e.nativeEvent);
    }}
  >
    {/* Chassis. A shade darker than the white head above it, because that value split is half of
        what identifies this object at any size — the real one is a white plate on a grey body. */}
    <RoundedBox args={[SK_W, SK_H, SK_D]} radius={cm(0.35)} smoothness={4} position={[0, SK_H / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#a9acb0" roughness={0.62} metalness={0.06} />
    </RoundedBox>

    {/* The control area sits in a shallow recess, so the panel has an edge to catch light on
        rather than the controls appearing to float on an unbroken slab. */}
    <mesh position={[0, SK_H + cm(0.01), skZ(0.63)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[SK_W - cm(0.7), SK_D * 0.62]} />
      <meshStandardMaterial color="#c0c3c6" roughness={0.58} metalness={0.05} />
    </mesh>

    {/* The connector row, which the reference splits into four labelled blocks — dark OUTPUT,
        orange AUX and INPUT, dark USB — with a separate orange switch beyond them. Four segments
        rather than one strip with a patch on it: the alternating rhythm is what reads. */}
    {[
      { from: 0.039, to: 0.27, colour: '#33363a' },
      { from: 0.28, to: 0.47, colour: SK_ORANGE },
      { from: 0.48, to: 0.66, colour: SK_ORANGE },
      { from: 0.67, to: 0.8, colour: '#33363a' },
    ].map((block) => (
      <mesh
        key={block.from}
        position={[skX((block.from + block.to) / 2), SK_H + cm(0.02), skZ(0.05)]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[SK_W * (block.to - block.from), cm(1.5)]} />
        <meshStandardMaterial color={block.colour} roughness={0.65} />
      </mesh>
    ))}
    <mesh position={[skX(0.905), SK_H + cm(0.16), skZ(0.05)]} castShadow>
      <boxGeometry args={[cm(1), cm(0.35), cm(0.55)]} />
      <meshStandardMaterial color={SK_ORANGE} roughness={0.5} />
    </mesh>

    {/* The white upper plate. On the real unit it carries the wordmark; here it is a value
        change, which is what actually reads — the machine splits into a pale head and a grey
        body, and that split is half of its silhouette. */}
    <mesh position={[0, SK_H + cm(0.02), skZ(0.175)]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[SW_INSET, cm(4)]} />
      <meshStandardMaterial color="#f3f3f2" roughness={0.5} metalness={0.03} />
    </mesh>

    {/* Two channels of four knobs. This grid is the whole identity of the object, and the size
        step between the two large rows and the two small ones is most of what carries it. */}
    {KNOB_COLS.map((x) =>
      KNOB_ROWS.map((row) => (
        <group key={`${x}-${row.z}`} position={[x, SK_H + cm(0.15), row.z]}>
          <mesh position={[0, cm(0.3), 0]} castShadow>
            <cylinderGeometry args={[row.r, row.r * 1.12, cm(0.6), 16]} />
            <meshStandardMaterial color={row.colour} roughness={0.42} metalness={0.05} />
          </mesh>
          {/* Pointer. Sub-pixel from the overview, but it breaks the knob's top into two tones,
              which is what stops eight discs reading as eight dots — and once the camera can fly
              in it is legible on its own. */}
          <mesh position={[0, cm(0.61), -row.r * 0.45]}>
            <boxGeometry args={[cm(0.16), cm(0.04), row.r * 0.8]} />
            <meshStandardMaterial color={row.colour === '#1e2023' ? '#c9ccd0' : '#3a3d41'} roughness={0.5} />
          </mesh>
        </group>
      )),
    )}

    {/* The display: tall, narrow, and level with the two large knobs, which is where the machine
        puts it. The first pass had it wide and mid-panel, so it read as a coloured rectangle
        rather than as a screen. A black bezel around it is what makes it one. */}
    <mesh position={[RIGHT_COL, SK_H + cm(0.03), SCREEN_Z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[METER_W + cm(0.7), METER_H + cm(0.7)]} />
      <meshStandardMaterial color="#141312" roughness={0.35} metalness={0.05} />
    </mesh>
    <mesh
      ref={meterRef}
      position={[RIGHT_COL, SK_H + cm(0.04), SCREEN_Z + METER_H / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={meterGeometry ?? undefined}
    >
      <meshStandardMaterial color={SK_ORANGE} emissive={SK_ORANGE} emissiveIntensity={0.3} toneMapped={false} />
    </mesh>

    {/* The recessed ring above the volume knob, and the volume knob itself. */}
    <mesh position={[RIGHT_COL, SK_H + cm(0.03), skZ(0.475)]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[cm(0.9), cm(1.1), 26]} />
      <meshStandardMaterial color="#e9eaea" roughness={0.5} />
    </mesh>
    <mesh position={[RIGHT_COL, SK_H + cm(0.45), skZ(0.585)]} castShadow>
      <cylinderGeometry args={[cm(1.05), cm(1.15), cm(0.9), 20]} />
      <meshStandardMaterial color="#f0f0ef" roughness={0.42} />
    </mesh>

    {/* The MOD slider — the one orange control below the volume. */}
    <mesh position={[RIGHT_COL, SK_H + cm(0.03), skZ(0.665)]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[cm(1.5), cm(0.85)]} />
      <meshStandardMaterial color={SK_ORANGE} emissive={SK_ORANGE} emissiveIntensity={0.3} toneMapped={false} />
    </mesh>

    {/* CUE, then the two channel faders, then FX along the front. */}
    {KNOB_COLS.map((x, i) => (
      <group key={`ch-${x}`}>
        <mesh position={[x, SK_H + cm(0.03), skZ(0.71)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[cm(1.9), cm(0.95)]} />
          <meshStandardMaterial color="#26282b" roughness={0.6} />
        </mesh>
        <Fader x={x} channel={i} initial={i === 0 ? 0.85 : 0.3} onDragChange={onDragChange} />
        <mesh position={[x, SK_H + cm(0.03), skZ(0.955)]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[cm(1.9), cm(0.95)]} />
          <meshStandardMaterial color="#26282b" roughness={0.6} />
        </mesh>
      </group>
    ))}

    {/* Headphone level, and the SELECT key below it. */}
    <mesh position={[RIGHT_COL, SK_H + cm(0.35), skZ(0.86)]} castShadow>
      <cylinderGeometry args={[cm(1), cm(1.1), cm(0.7), 16]} />
      <meshStandardMaterial color="#26282b" roughness={0.5} />
    </mesh>
    <mesh position={[RIGHT_COL, SK_H + cm(0.03), skZ(0.955)]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[cm(2), cm(0.95)]} />
      <meshStandardMaterial color="#26282b" roughness={0.6} />
    </mesh>
  </group>
  );
};


/** The desk is allowed to hold things that have nothing to do with music. */
const Clutter: React.FC = () => (
  <group>
    <group position={[cm(-56), DESK_TOP_Y, cm(22)]}>
      <mesh position={[0, cm(REAL.mug.height) / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[cm(REAL.mug.diameter) / 2, cm(REAL.mug.diameter) / 2 - cm(0.6), cm(REAL.mug.height), 20]} />
        <meshPhysicalMaterial color={MUG} roughness={0.55} metalness={0.02} clearcoat={0.4} envMapIntensity={0.9} />
      </mesh>
      <mesh position={[cm(5.4), cm(REAL.mug.height) * 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[cm(2.2), cm(0.5), 8, 18, Math.PI * 1.1]} />
        <meshPhysicalMaterial color={MUG} roughness={0.55} clearcoat={0.4} />
      </mesh>
    </group>
    {[
      { p: [cm(52), cm(0.5), cm(20)] as [number, number, number], r: 0.14, w: cm(21), d: cm(29.7), c: '#eceae5' },
      { p: [cm(54), cm(1.5), cm(21)] as [number, number, number], r: -0.08, w: cm(21), d: cm(29.7), c: '#dedbd4' },
    ].map((b, i) => (
      <mesh key={i} position={[b.p[0], DESK_TOP_Y + b.p[1], b.p[2]]} rotation={[0, b.r, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, cm(0.8), b.d]} />
        <meshStandardMaterial color={b.c} roughness={0.9} />
      </mesh>
    ))}
  </group>
);

export const DeskGear: React.FC<{ onDragChange?: (dragging: boolean) => void; onFocus?: FocusHandler }> = ({ onDragChange, onFocus }) => (
  <group>
    <Sidekick onDragChange={onDragChange} onFocus={onFocus} />
    <MonitorOnBooks x={cm(-52)} toeIn={0.42} />
    <MonitorOnBooks x={cm(52)} toeIn={-0.42} />
    <Cables />
    <Clutter />
  </group>
);
