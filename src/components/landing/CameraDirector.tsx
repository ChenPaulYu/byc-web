/**
 * CameraDirector — bounded object/overview flights and proximity-based overlay visibility.
 * Reads: RoomControlHandle for target, constraints and input-start cancellation; caption ids.
 * Flight endpoints and each update obey the interior boundary. User input cancels a flight;
 * reduced motion applies the destination immediately. Proximity crosses into React only when
 * its hysteresis boolean changes, never at frame frequency.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomControlHandle } from './roomCamera';
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
  /** Interior overview is already close; an explicit object focus still clears page chrome. */
  focused?: boolean;
  fov?: number;
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
  /** Ref to the interior look/approach controller; null until it mounts. */
  controlsRef: React.RefObject<RoomControlHandle | null>;
  /** The current authored overview distance, so fade thresholds track the shot. */
  defaultDistance: number;
  /** Called only on the frame the close/far boolean actually changes. */
  onCloseChange: (isClose: boolean) => void;
  /** Set by a click on a portrait object or on the desk. A new object starts a new flight. */
  request: FlightRequest | null;
  reducedMotion?: boolean;
}

export function CameraDirector({ controlsRef, defaultDistance, onCloseChange, request, reducedMotion = false }: CameraDirectorProps) {
  const { camera } = useThree();

  // Last value handed to the caller, kept out of React state on purpose — this is the guard that
  // turns "recompute every frame" into "notify only on a real flip".
  const lastReported = useRef(false);
  const focused = useRef(false);

  const flight = useRef<{
    fromPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toPosition: THREE.Vector3;
    toTarget: THREE.Vector3;
    fromFov: number;
    toFov: number;
    elapsed: number;
  } | null>(null);

  // A new request plots a course. By default the angle is taken from wherever the visitor is
  // looking now, so the flight moves them closer along their own line of sight rather than
  // swinging them somewhere they did not choose. An explicit position restores the authored
  // overview pose instead.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!request || !controls) return;
    focused.current = request.focused ?? false;

    const toTarget = request.target.clone();
    const toPosition = request.position
      ? request.position.clone()
      : request.target.clone().addScaledVector(
          camera.position.clone().sub(controls.target).normalize(),
          request.distance,
        );
    controls.constrain(toPosition);
    flight.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition,
      toTarget,
      fromFov: (camera as THREE.PerspectiveCamera).fov,
      toFov: request.fov ?? (camera as THREE.PerspectiveCamera).fov,
      elapsed: reducedMotion ? FLIGHT_SECONDS : 0,
    };
  }, [request, camera, controlsRef, reducedMotion]);

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
      if (camera instanceof THREE.PerspectiveCamera && inFlight.fromFov !== inFlight.toFov) {
        camera.fov = THREE.MathUtils.lerp(inFlight.fromFov, inFlight.toFov, eased);
        camera.updateProjectionMatrix();
      }
      controls.update();
      if (t >= 1) flight.current = null;
    }

    const distance = camera.position.distanceTo(controls.target);
    const fadeOutAt = defaultDistance * FADE_OUT_FRACTION;
    const restoreAt = defaultDistance * RESTORE_FRACTION;

    let isClose = lastReported.current;
    if (focused.current || distance < fadeOutAt) {
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
