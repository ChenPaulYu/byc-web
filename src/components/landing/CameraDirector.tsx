/**
 * CameraDirector — watches the orbit camera's distance from its target, and flies it on request.
 *
 * Lives inside the Canvas because both jobs need `useFrame`, same as the `OrbitControls` it
 * drives. Distance is recomputed every frame, but it only crosses into React as a single boolean,
 * and only on the frame it actually flips — pushing the raw distance into state would re-render
 * the whole Canvas subtree at ~60fps for a number nothing outside this component needs at that
 * resolution.
 *
 * The threshold is doubled rather than singular: fade out below 0.58x the authored overview
 * distance, restore above 0.68x. `OrbitControls` has damping on, so the distance keeps drifting
 * for a moment after the visitor lets go of the mouse — a camera resting near a single line would
 * flip the boolean back and forth on that drift alone. Between the two lines the boolean just
 * holds whatever it last was.
 *
 * Flying preserves the viewing angle and changes only the target and the distance, which is why
 * one rule serves every portrait object and why the controls' polar and azimuth limits keep
 * holding through a flight — the angles never move. The overview those flights restore is owned
 * by shot.ts, derived from the portrait's size rather than from a tuned offset.
 *
 * Reads: `OrbitControls` from three-stdlib, for the ref shape drei does not re-export by name.
 * captions.ts for the subject ids a click can name.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CaptionSubject } from './captions';

// Fractions of the authored overview distance (shot.ts), not absolute scene units — that is
// what makes the same behavior correct on a phone and a desktop.
const FADE_OUT_FRACTION = 0.58;
const RESTORE_FRACTION = 0.68;

const FLIGHT_SECONDS = 0.7;

export interface FlightRequest {
  target: THREE.Vector3;
  distance: number;
  /** When set, fly to this exact camera position instead of preserving the current view ray. */
  position?: THREE.Vector3;
}

/** Click on a portrait object. Drag-vs-click stays in LandingScene; this just packages the look-at. */
export type FocusHandler = (
  target: THREE.Vector3,
  distance: number,
  event: { clientX: number; clientY: number },
  subject: CaptionSubject | null,
) => void;

export function requestFocus(
  onFocus: FocusHandler | undefined,
  target: THREE.Vector3,
  distance: number,
  event: { stopPropagation: () => void; nativeEvent: { clientX: number; clientY: number } },
  subject: CaptionSubject | null,
) {
  if (!onFocus) return;
  event.stopPropagation();
  onFocus(target, distance, event.nativeEvent, subject);
}

/** Same objects that fly on click. The desk does not take this — the whole top would become a hand. */
export const pointerCursor = {
  onPointerOver: () => {
    document.body.style.cursor = 'pointer';
  },
  onPointerLeave: () => {
    document.body.style.cursor = 'auto';
  },
};

interface CameraDirectorProps {
  /** Ref to the live OrbitControls instance; null until the controls mount. */
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  /** The current authored overview distance, so fade thresholds track the shot. */
  defaultDistance: number;
  /** Called only on the frame the close/far boolean actually changes. */
  onCloseChange: (isClose: boolean) => void;
  /** Set by a click on a portrait object or on the desk. A new object starts a new flight. */
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

  // A new request plots a course. By default the angle is taken from wherever the visitor is
  // looking now, so the flight moves them closer along their own line of sight rather than
  // swinging them somewhere they did not choose. An explicit position restores the authored
  // overview pose instead.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!request || !controls) return;

    const toTarget = request.target.clone();
    const toPosition = request.position
      ? request.position.clone()
      : request.target.clone().addScaledVector(
          camera.position.clone().sub(controls.target).normalize(),
          request.distance,
        );
    flight.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition,
      toTarget,
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
