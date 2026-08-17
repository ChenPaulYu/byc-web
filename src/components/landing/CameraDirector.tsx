/**
 * CameraDirector — watches the orbit camera's distance from its target, and flies it on request.
 *
 * Lives inside the Canvas because both jobs need `useFrame`, same as the `OrbitControls` it
 * drives. Distance is recomputed every frame, but it only crosses into React as a single boolean,
 * and only on the frame it actually flips — pushing the raw distance into state would re-render
 * the whole Canvas subtree at ~60fps for a number nothing outside this component needs at that
 * resolution.
 *
 * The threshold is doubled rather than singular: fade out below 0.58x the responsive default
 * distance, restore above 0.68x. `OrbitControls` has damping on, so the distance keeps drifting
 * for a moment after the visitor lets go of the mouse — a camera resting near a single line would
 * flip the boolean back and forth on that drift alone. Between the two lines the boolean just
 * holds whatever it last was.
 *
 * Flying preserves the viewing angle and changes only the target and the distance, which is why
 * one rule serves both instruments and why the controls' polar and azimuth limits keep holding
 * through a flight — the angles never move.
 *
 * Reads: `OrbitControls` from three-stdlib, for the ref shape drei does not re-export by name.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Fractions of the responsive default distance (the 48/53/57/62 ladder in LandingScene), not
// absolute scene units — that is what makes the same behavior correct on a phone and a desktop.
const FADE_OUT_FRACTION = 0.58;
const RESTORE_FRACTION = 0.68;

const FLIGHT_SECONDS = 0.7;

export interface FlightRequest {
  target: THREE.Vector3;
  distance: number;
}

interface CameraDirectorProps {
  /** Ref to the live OrbitControls instance; null until the controls mount. */
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  /** The current responsive default distance (pre-aspect-ratio scalar), not the live camera distance. */
  defaultDistance: number;
  /** Called only on the frame the close/far boolean actually changes. */
  onCloseChange: (isClose: boolean) => void;
  /** Set by a click on an instrument or on the desk. A new object starts a new flight. */
  request: FlightRequest | null;
}

export function CameraDirector({ controlsRef, defaultDistance, onCloseChange, request }: CameraDirectorProps) {
  const { camera } = useThree();

  // Last value handed to the caller, kept out of React state on purpose — this is the guard that
  // turns "recompute every frame" into "notify only on a real flip".
  const lastReported = useRef(false);

  const flight = useRef<{
    fromPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toPosition: THREE.Vector3;
    toTarget: THREE.Vector3;
    elapsed: number;
  } | null>(null);

  // A new request plots a course. The angle is taken from wherever the visitor is looking now, so
  // the flight moves them closer along their own line of sight rather than swinging them somewhere
  // they did not choose.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!request || !controls) return;

    const direction = camera.position.clone().sub(controls.target).normalize();
    flight.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition: request.target.clone().addScaledVector(direction, request.distance),
      toTarget: request.target.clone(),
      elapsed: 0,
    };
  }, [request, camera, controlsRef]);

  // Any touch of the controls hands the camera straight back. Finishing a tween over someone who
  // has grabbed the mouse is the fastest way to make a camera feel broken.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancel = () => { flight.current = null; };
    controls.addEventListener('start', cancel);
    return () => controls.removeEventListener('start', cancel);
  }, [controlsRef]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const inFlight = flight.current;
    if (inFlight) {
      inFlight.elapsed += delta;
      const t = Math.min(1, inFlight.elapsed / FLIGHT_SECONDS);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(inFlight.fromPosition, inFlight.toPosition, eased);
      controls.target.lerpVectors(inFlight.fromTarget, inFlight.toTarget, eased);
      controls.update();
      if (t >= 1) flight.current = null;
    }

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
