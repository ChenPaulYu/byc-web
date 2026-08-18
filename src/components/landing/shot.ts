/**
 * shot.ts — the homepage's one authored camera frame, derived from the portrait's size.
 *
 * The subject is the desk plus the football on the floor in front of it. Distance comes from how
 * much of the frame that subject should occupy; position is a three-quarter over-shoulder from
 * behind the chair. The old ladder (48 / 53 / 57 / 62 and a look-at of y = −6.5) was a tuned
 * offset that did not know the football existed, and whose "distance" was not the camera's actual
 * distance to the target.
 *
 * Orbit is allowed around this shot. Flying to an object keeps the current angle and only
 * changes target and distance — that rule lives in CameraDirector and is not revisited here.
 * Focus distances for the whole portrait (not just the two machines) are derived here too.
 * Caption popups sit beside the object; the halo is the world-space clearance from its centre.
 *
 * Reads: scale.ts · layout.ts (MPC width) · Stage's desk datum and football placement ·
 * captions.ts for the subject ids the halo is keyed by.
 * Stage must not import this file: it already exports the datums we read, and a cycle would
 * hit a TDZ on DESK_TOP_Y. LandingScene and DeskGear are the callers.
 */

import { CONTAINER_WIDTH } from './layout';
import { cm, REAL } from './scale';
import { DESK_TOP_Y, FLOOR_Y, FOOTBALL } from './Stage';
import type { CaptionSubject } from './captions';

export const FOV = 35;
export const NEAR = 0.5;
export const FAR = 240;

/** Vertical FOV is Three's convention. At 16:10 this makes visible width ≈ distance, which is
 *  why the existing focus numbers were "27 for the MPC, 13 for the mixer". */
const FOCUS_ASPECT = 16 / 10;
const HALF_FOV = (FOV * Math.PI) / 360;

/** How much of the landscape frame the MPC should fill when you click it. */
const MPC_FOCUS_OCCUPANCY = 1 / 3;
/** The mixer is 1.72 units across; this occupancy is what made its faders a 35 px target. */
const SIDEKICK_FOCUS_OCCUPANCY = 0.13;

/** Camera above the look target. High enough that the desk top still reads; low enough that
 *  the football is a foreground object rather than a coin on the floor. 38° was a crane. */
const ELEVATION = (33 * Math.PI) / 180;

const AZIMUTH = {
  portrait: (35 * Math.PI) / 180,
  landscape: (32 * Math.PI) / 180,
  wide: (28 * Math.PI) / 180,
} as const;

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

const portraitTarget = (includeFootball: boolean): [number, number, number] => {
  const ballY = FLOOR_Y + cm(REAL.football.diameter) / 2;
  const weight = includeFootball ? 0.28 : 0;
  return [
    FOOTBALL.x * weight,
    DESK_TOP_Y * (1 - weight) + ballY * weight,
    FOOTBALL.z * weight,
  ];
};

const azimuthFor = (aspect: number) => {
  if (aspect < 0.8) return AZIMUTH.portrait;
  if (aspect > 2) return AZIMUTH.wide;
  return AZIMUTH.landscape;
};

/**
 * Distance that fits the portrait in the frame. On a phone the limiting dimension is the
 * desk's width in a narrow view, and we accept cropping the ball so the instrument stays
 * readable. On a landscape screen the limiting dimension is the portrait's height — legs,
 * desk and ball — which is why the old 62-scalar actually landed around distance 70.
 */
const distanceFor = (aspect: number): number => {
  const deskW = cm(REAL.desk.width);
  const portraitH = DESK_TOP_Y + cm(REAL.monitor.height) + cm(REAL.paperback.height) * 3 - FLOOR_Y;
  if (aspect < 0.8) {
    // Fill the narrow frame with the instrument and let the ball crop. Fitting the whole
    // desk would push the camera back past 100 and the pads would vanish.
    return CONTAINER_WIDTH / (0.55 * visibleWidthAt(1, aspect));
  }
  const occupancy = aspect > 2 ? 0.52 : 0.56;
  const fromHeight = portraitH / (occupancy * visibleHeightAt(1));
  const fromWidth = deskW / (occupancy * visibleWidthAt(1, aspect));
  return Math.max(fromHeight, fromWidth);
};

export function authoredShot(viewWidth: number, viewHeight: number): Shot {
  const aspect = viewWidth / viewHeight;
  const target = portraitTarget(aspect >= 0.8);
  const distance = distanceFor(aspect);
  const az = azimuthFor(aspect);
  const horiz = distance * Math.cos(ELEVATION);
  const position: [number, number, number] = [
    target[0] + horiz * Math.sin(az),
    target[1] + distance * Math.sin(ELEVATION),
    target[2] + horiz * Math.cos(az),
  ];
  return { position, target, distance, fov: FOV, near: NEAR, far: FAR };
}
