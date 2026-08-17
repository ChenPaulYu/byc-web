# Focus by flying — grounded plan

Grounded 2026-08-17 against `polish/landing-instrument` @ `9e24a12`.
Design: [`thoughts/2026-08-17-focus-by-flying.md`](../thoughts/2026-08-17-focus-by-flying.md).
**The design is settled — this plan does not re-open it.** Never take the camera away from the
visitor; move it for them, and let the page recede instead.

## What gets built

Clicking an instrument flies the camera to it. Clicking the desk flies back out. The header and
the navigation fade while the camera is close and return when it pulls back. No mode, no state
anyone can get stuck in, and orbit and zoom keep working throughout.

## Critical files

| File | Role today | What it gains |
|---|---|---|
| `src/components/LandingScene.tsx` | Owns the Canvas, the responsive distance ladder (48/53/57/62), the uncontrolled `OrbitControls`, the DOM overlays, and the `isDragging` flag | A ref on the controls, a `<CameraDirector>` child, and an opacity class on the two overlay blocks |
| **new** `src/components/landing/CameraDirector.tsx` | — | Owns the flight tween and the distance watch. Must live inside the Canvas: both need `useFrame` |
| `src/components/landing/Mpc.tsx` | Pads, knobs and transport all `stopPropagation` on click | A click handler on the outer group |
| `src/components/landing/DeskGear.tsx` | The Sidekick group; its fader handle already stops propagation | A click handler on the Sidekick group |
| `src/components/landing/Stage.tsx` | The desk top mesh | A click handler that asks for the overview |

## The one number that does not work, and needs a decision

**The Sidekick cannot be usefully focused at the current `minDistance` of 24.** At fov 35 and a
1.6 aspect the visible width at distance *d* is almost exactly *d* scene units, so at 24 the
Sidekick — 1.76 units wide — reaches about 90 px across and its faders about 11 px. That is 2.6×
better than the 4 px they are at now, and still not a comfortable target.

Lowering `minDistance` to around 14 would roughly double it again. That is **loosening** a
constraint rather than clamping one, so it does not contradict the design's "nothing is clamped" —
but it is a change to a number the design named, so this plan will not make it silently.

**Open question, for the user:** drop `minDistance` so the Sidekick can actually be worked, or
accept that focusing it means "much closer" rather than "workable"? Everything else in this plan
is unaffected either way.

## Approach

### 1. `CameraDirector`, watching only

New component inside the Canvas. It takes the controls ref and reports one boolean upward.

Distance comes from `camera.position.distanceTo(controls.target)` in `useFrame`. **It must not be
pushed into React state every frame** — that would re-render the whole scene tree sixty times a
second. Instead the component flips a single boolean when the distance crosses a threshold, and
CSS handles the fade.

Thresholds are computed as fractions of the current responsive default rather than as absolute
numbers, so the same behaviour lands correctly on a phone whose default is 48 and a desktop whose
default is 62: **fade out below 0.58× the default, restore above 0.68×**. On desktop that is 36
and 42; on mobile, 28 and 33. The gap between them is hysteresis — without it the overlay
strobes when the visitor rests the camera exactly on the line.

*Verify:* typecheck and build. Nothing changes on screen yet; the boolean goes nowhere.

### 2. Fade the header and the navigation

Both overlay blocks take an opacity class driven by that boolean, with a Tailwind
`transition-opacity` so the fade is CSS rather than per-frame JavaScript. The navigation also
needs `pointer-events-none` while faded — an invisible button that still swallows clicks is worse
than a visible one.

The header fades too, not just the navigation: the left monitor overlaps "Bo-Yu Chen" at close
range, so the collision was never only in the corner.

*Verify:* in a browser, zoom in and watch both go; zoom out and watch them return. The rig cannot
photograph this — see the testing note.

### 3. The flight

`CameraDirector` gains a `flyTo(target: Vector3, distance: number)`.

**The angle is preserved, and that is the whole rule.** Take the current direction from target to
camera, keep it, and move both the orbit target and the camera along it:

```
direction = (camera.position − controls.target).normalize()
controls.target → objectCentre
camera.position → objectCentre + direction × distance
```

One rule for both instruments, no hand-placed camera vectors, and the polar and azimuth limits
keep holding because the angles never change — only the target and the distance do. Tween over
about 0.7 s with an ease-out, calling `controls.update()` each frame.

**The tween cancels the moment the visitor touches anything.** Fighting a user who has grabbed the
mouse mid-flight is the fastest way to make a camera feel broken.

*Verify:* click each instrument and watch the camera arrive; grab the mouse mid-flight and confirm
it hands back immediately.

### 4. The three click targets

- **MPC** — a handler on its outer group. Pads, knobs and transport buttons already call
  `stopPropagation`, so they keep playing without also flying; the click only reaches the group
  from the chassis, cheeks, grille or screen. Focus distance derived from the chassis: 9 units
  wide, so about 27.
- **Sidekick** — a handler on its group, same shape. Its focus distance is whatever the open
  question above resolves to.
- **Desk top** — flies back to the overview: the responsive default position and target
  `[0, -6.5, 0]`, both of which `LandingScene` already computes.

**A drag that ends over an object must not count as a click.** R3F fires `onClick` on pointer-up
over the object regardless of how far the pointer travelled, so orbiting with a drag that happens
to finish over the MPC would launch a flight. Record the pointer position on down and ignore any
click that moved more than a few pixels.

*Verify:* click each of the three; then orbit with a drag that ends over an instrument and confirm
nothing flies.

## Verification

| Command | Gate |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm test` | 22 pass |
| `npm run build` | succeeds |
| Real browser | steps 2, 3 and 4 are only checkable here |

**The rig cannot test this the usual way.** It draws about one frame a second, so a 0.7 s tween
has no mid-flight frame to photograph, and `OrbitControls`' wheel zoom did not respond to
Playwright's wheel events when that was tried. Driving the camera in a test means reaching for the
controls object directly — expose it on `window` in a scratch build, set the distance, read back
whether the overlay's opacity changed — rather than simulating input. Photograph the *ends*: the
overview, and each instrument after the flight has settled.

## Open questions

- **`minDistance`** — see above. This is the only one that blocks a decision rather than a build.
- **Does the "KEYBOARD:" hint fade with the header and nav?** It sits bottom-centre, which is
  where the desk grows first. Assumed yes, on the grounds that it belongs to the same layer, but
  it was not put to the user.

## Out of scope

Whether navigation belongs inside the scene, which is still open on the board. The fade steps
toward it and commits to nothing.
