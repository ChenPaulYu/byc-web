/**
 * scale.ts — the one place that knows how big a scene unit is, and how big real things are.
 *
 * The MPC is the anchor: it is authored at 9 units wide in `layout.ts` and cannot be resized
 * without shrinking its pads below a comfortable click target, so everything else is derived
 * from it rather than the other way round. An Akai MPC-class desktop sampler is about 46 cm
 * across, which fixes the exchange rate at roughly 5.1 cm per unit.
 *
 * Express furniture and gear in centimetres through `cm()` instead of typing scene units
 * directly. It keeps proportions checkable against a tape measure, and it makes mistakes
 * loud: before this existed the desk worked out to 15 cm tall, which nobody noticed because
 * 2.94 units reads as a plausible number and 15 cm does not.
 *
 * Reads: layout.ts CONTAINER_WIDTH (the anchor)
 */

import { CONTAINER_WIDTH } from './layout';

/** Real width of the sampler the MPC mesh stands in for. */
const MPC_WIDTH_CM = 46;

/** Centimetres represented by one scene unit. */
export const CM_PER_UNIT = MPC_WIDTH_CM / CONTAINER_WIDTH;

/** Convert a real-world measurement in centimetres to scene units. */
export const cm = (value: number) => value / CM_PER_UNIT;

/**
 * Real dimensions of the things in the scene, in centimetres. Sourced from the owner's actual
 * kit and from standard furniture sizing; keep new entries in the same form so the next person
 * can check them without reading geometry.
 */
export const REAL = {
  desk: { width: 140, depth: 70, height: 82, topThickness: 4 },
  chair: { seatHeight: 45, seatWidth: 48, seatDepth: 45, backHeight: 52, baseRadius: 33 },
  /** Tannoy Gold 5 — a 5-inch nearfield monitor. */
  monitor: { width: 19, height: 30, depth: 25 },
  /** Compact stereo mixer. Sized off an 88 × 240 × 16 mm slab. */
  sidekick: { width: 8.8, depth: 24, height: 1.6 },
  /**
   * 50 Lan 手搖杯. Diameter is the rim; bottom is the base; height is cup plus the film lid.
   */
  mug: { diameter: 9.4, height: 13.2, bottom: 6.2 },
  paperback: { width: 13, height: 2, depth: 20 },
  /** Size 5 football. Lives on the floor, not the desk — 22 cm on the desktop would swallow the mug. */
  football: { diameter: 22 },
  /**
   * Assembled FlueBricks on the desk. Cuboid generator plus three cylindrical nodes; thickness
   * is the face it lies on, pipe is the round nodes' diameter.
   */
  fluebricks: { length: 22, width: 4.2, thickness: 3.2, pipe: 3.4 },
  /** Square-tube desk leg section. */
  legSection: 6,
} as const;
