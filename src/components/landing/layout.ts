/**
 * Defines the MPC geometry, pad mapping, and editable layout defaults.
 * Reads: no runtime state; writes: nothing.
 */

export const CONTAINER_WIDTH = 9.0;
export const CONTAINER_DEPTH = 5.0;

export const COL_PADS_WIDTH = CONTAINER_WIDTH * (2 / 4);
export const COL_SCREEN_WIDTH = CONTAINER_WIDTH * (1.5 / 4);
export const COL_KNOBS_WIDTH = CONTAINER_WIDTH * (0.5 / 4);

export const ROW_LOGO_HEIGHT = CONTAINER_DEPTH * 0.2;
export const ROW_MAIN_HEIGHT = CONTAINER_DEPTH * 0.8;

export const COL_PADS_X = -CONTAINER_WIDTH / 2 + COL_PADS_WIDTH / 2;
export const COL_SCREEN_X = COL_PADS_X + COL_PADS_WIDTH / 2 + COL_SCREEN_WIDTH / 2;
export const COL_KNOBS_X = COL_SCREEN_X + COL_SCREEN_WIDTH / 2 + COL_KNOBS_WIDTH / 2;

export const ROW_LOGO_Z = -CONTAINER_DEPTH / 2 + ROW_LOGO_HEIGHT / 2;
export const ROW_MAIN_Z = ROW_LOGO_Z + ROW_LOGO_HEIGHT / 2 + ROW_MAIN_HEIGHT / 2;

export interface MpcPositions {
  containerX: number;
  containerZ: number;
  padsSectionX: number;
  padsSectionZ: number;
  padSize: number;
  padSpacing: number;
  padHeight: number;
  screenSectionX: number;
  screenSectionZ: number;
  logoMainSize: number;
  logoSubSize: number;
  screenWidth: number;
  screenDepth: number;
  screenHeight: number;
  avatarScale: number;
  buttonsOffsetZ: number;
  buttonSpacing: number;
  buttonWidth: number;
  buttonHeight: number;
  knobSpacing: number;
}

export const DEFAULT_MPC_POSITIONS: MpcPositions = {
  containerX: 0,
  containerZ: 0,
  padsSectionX: 0,
  padsSectionZ: -0.39,
  padSize: 0.80,
  padSpacing: 0.22,
  padHeight: 0.2,
  screenSectionX: 0,
  screenSectionZ: 0,
  logoMainSize: 0.17,
  logoSubSize: 0.069,
  screenWidth: 3.4,
  screenDepth: 3.4,
  screenHeight: 0.17,
  avatarScale: 0.78,
  buttonsOffsetZ: 1.4,
  buttonSpacing: 0.87,
  buttonWidth: 0.6,
  buttonHeight: 0.35,
  knobSpacing: 0.89,
};

export const PAD_LAYOUT = [
  { key: '1', note: 'G5' }, { key: '2', note: 'A5' }, { key: '3', note: 'C6' }, { key: '4', note: 'D6' },
  { key: 'q', note: 'C5' }, { key: 'w', note: 'D5' }, { key: 'e', note: 'E5' }, { key: 'r', note: 'G5' },
  { key: 'a', note: 'G4' }, { key: 's', note: 'A4' }, { key: 'd', note: 'C5' }, { key: 'f', note: 'D5' },
  { key: 'z', note: 'C4' }, { key: 'x', note: 'D4' }, { key: 'c', note: 'E4' }, { key: 'v', note: 'G4' },
] as const;

/**
 * What a pad turns when it is played, by row.
 *
 * Kept above the resting cream rather than below it: the pads sit near the chassis colour now,
 * so a caramel press would have read as the pad going *dark*. Emissive does most of the work.
 *
 * A warm ladder — oat, latte, caramel, brown sugar — rather than the red / amber / green / blue
 * it used to be. The screen is the one saturated thing on this machine and it should stay that
 * way; sixteen candy-coloured squares next to it made two things competing for the same job.
 * The rows still separate, by warmth instead of by hue, and the press is mostly read from the
 * pad dipping and brightening anyway.
 */
export const PAD_COLORS = ['#f8e6c6', '#f2cd99', '#e9b075', '#dd9660'] as const;

export const KNOB_MULTIPLIERS = [-1.5, -0.5, 0.5, 1.5] as const;
