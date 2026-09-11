/**
 * shot.ts — interior eye-level desktop/portrait poses and physical-object focus sizing.
 * The eye starts inside the studio, not outside a fitted miniature. Portrait keeps real gear
 * scale and a desk-centered view. RoomControls turns the view; CameraDirector owns flights.
 * Reads: scale.ts, layout.ts, Stage's desk datum, captions.ts for caption halo identifiers.
 * Stage must not import this file: it already exports the datums we read, and a cycle would
 * hit a TDZ on DESK_TOP_Y. LandingScene and DeskGear are the callers.
 */

import { CONTAINER_WIDTH } from './layout';
import { cm, REAL } from './scale';
import { DESK_TOP_Y } from './Stage';
import type { CaptionSubject } from './captions';

export const FOV = 58;
export const NEAR = 0.15;
export const FAR = 240;

/** Focus sizing uses the desktop vertical field of view. */
const FOCUS_ASPECT = 16 / 10;
const HALF_FOV = (FOV * Math.PI) / 360;

/** How much of the landscape frame the MPC should fill when you click it. */
const MPC_FOCUS_OCCUPANCY = 1 / 3;
/** The mixer is 1.72 units across; this occupancy is what made its faders a 35 px target. */
const SIDEKICK_FOCUS_OCCUPANCY = 0.13;

export interface Shot {
  position: [number, number, number];
  target: [number, number, number];
  distance: number;
  fov: number;
  near: number;
  far: number;
}

const visibleHeightAt = (distance: number) => 2 * distance * Math.tan(HALF_FOV);
const visibleWidthAt = (distance: number, aspect: number) => visibleHeightAt(distance) * aspect;

const focusDistance = (subjectWidth: number, occupancy: number) =>
  subjectWidth / (occupancy * visibleWidthAt(1, FOCUS_ASPECT));

export const MPC_FOCUS_DISTANCE = focusDistance(CONTAINER_WIDTH, MPC_FOCUS_OCCUPANCY);
export const SIDEKICK_FOCUS_DISTANCE = focusDistance(cm(REAL.sidekick.width), SIDEKICK_FOCUS_OCCUPANCY);

// Portrait occupancies are starting points — tuned in the browser after the flights exist.
// Each is sparse enough that focusDistance stays at or above minDistance 12.
export const MUG_FOCUS_DISTANCE = focusDistance(cm(REAL.mug.diameter), 0.14);
/** A4 short side; the mesh in DeskGear is the same 21 cm. */
export const PAPER_FOCUS_DISTANCE = focusDistance(cm(21), 0.25);
export const FLUTE_FOCUS_DISTANCE = focusDistance(cm(REAL.fluebricks.length), 0.2);
export const FOOTBALL_FOCUS_DISTANCE = focusDistance(cm(REAL.football.diameter), 0.3);

/** Half-span of the Tannoy pair. DeskGear places the cabinets at ± this. */
export const MONITOR_X = cm(52);
const MONITOR_PAIR_WIDTH = MONITOR_X * 2 + cm(REAL.monitor.width);
export const MONITOR_PAIR_FOCUS_DISTANCE = focusDistance(MONITOR_PAIR_WIDTH, 0.48);

/** How far beside the object the caption sits, in scene units — past the silhouette, not on it. */
export const CAPTION_HALO: Record<CaptionSubject, number> = {
  taiwan: cm(15),
  mug: cm(REAL.mug.diameter) * 0.6 + cm(4),
  paper: cm(21) * 0.55 + cm(4),
  flute: cm(REAL.fluebricks.length) * 0.45 + cm(4),
  football: cm(REAL.football.diameter) * 0.55 + cm(4),
  monitors: cm(REAL.monitor.height) * 0.55 + cm(4),
};

/** Look-at for either cabinet. Not `getWorldPosition` of the one that was clicked. */
export const MONITOR_PAIR_TARGET: [number, number, number] = [
  0,
  DESK_TOP_Y + cm(REAL.paperback.height) * 3 + cm(REAL.monitor.height) / 2,
  cm(-24),
];

export function authoredShot(viewWidth: number, viewHeight: number): Shot {
  const portrait = viewWidth / viewHeight < 0.8;
  const target: [number, number, number] = portrait ? [0, DESK_TOP_Y + 1, 0] : [-1, 1, -3];
  const position: [number, number, number] = portrait ? [1, 10, 24] : [7, 8, 21];
  const distance = Math.hypot(...position.map((value, axis) => value - target[axis]));
  return { position, target, distance, fov: portrait ? 64 : FOV, near: NEAR, far: FAR };
}
