/**
 * CameraDirector — watches the orbit camera's distance from its target and reports proximity.
 *
 * Lives inside the Canvas because it needs `useFrame`, same as the `OrbitControls` it watches.
 * Distance is recomputed every frame, but it only crosses into React as a single boolean, and
 * only on the frame it actually flips — pushing the raw distance into state would re-render the
 * whole Canvas subtree at ~60fps for a number nothing outside this component needs at that
 * resolution.
 *
 * The threshold is doubled rather than singular: fade out below 0.58x the responsive default
 * distance, restore above 0.68x. `OrbitControls` has damping on, so the distance keeps drifting
 * for a moment after the visitor lets go of the mouse — a camera resting near a single line would
 * flip the boolean back and forth on that drift alone. Between the two lines the boolean just
 * holds whatever it last was.
 *
 * Reads: `OrbitControls` from three-stdlib, for the ref shape drei does not re-export by name.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Fractions of the responsive default distance (the 48/53/57/62 ladder in LandingScene), not
// absolute scene units — that is what makes the same behavior correct on a phone and a desktop.
const FADE_OUT_FRACTION = 0.58;
const RESTORE_FRACTION = 0.68;

interface CameraDirectorProps {
  /** Ref to the live OrbitControls instance; null until the controls mount. */
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  /** The current responsive default distance (pre-aspect-ratio scalar), not the live camera distance. */
  defaultDistance: number;
  /** Called only on the frame the close/far boolean actually changes. */
  onCloseChange: (isClose: boolean) => void;
}

export function CameraDirector({ controlsRef, defaultDistance, onCloseChange }: CameraDirectorProps) {
  // Last value handed to the caller, kept out of React state on purpose — this is the guard that
  // turns "recompute every frame" into "notify only on a real flip".
  const lastReported = useRef(false);

  useFrame(({ camera }) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const distance = camera.position.distanceTo(controls.target);
    const fadeOutAt = defaultDistance * FADE_OUT_FRACTION;
    const restoreAt = defaultDistance * RESTORE_FRACTION;

    let isClose = lastReported.current;
    if (distance < fadeOutAt) {
      isClose = true;
    } else if (distance > restoreAt) {
      isClose = false;
    }
    // else: inside the hysteresis band — hold the last reported value.

    if (isClose !== lastReported.current) {
      lastReported.current = isClose;
      onCloseChange(isClose);
    }
  });

  return null;
}
