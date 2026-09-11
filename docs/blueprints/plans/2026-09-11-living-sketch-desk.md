# Living sketch desk — plan

> Generated: 2026-09-11 · Source: approved fourth mockup and explicit implementation authorization · Stage 1: grounded in the current landing scene.

## Context

The user selected the sketch-overlay world. Preserve the original homepage composition and every personal object. The previous layout experiment was rejected; its mobile MPC scale correction stays. The scene already supports playable pads, effect knobs, channel faders, object focus and project navigation. Build on these rather than replacing the instrument.

## Resolved questions

- Preserve the equipment silhouettes, video screen and user-authored avatar offset.
- Add meaningful interaction: assembled/exploded FlueBricks study, sound-reactive drawing, optional sketch layer, richer object/project introductions.
- Procedural geometry and textures only; existing project photography remains available for callouts.
- Implementation is authorized now. No additional approval gate; use the existing plans directory.

## Approach

1. Add a self-contained `SketchLayer` using the existing flute factory and audio facade. Separate the original model's modules for an interactive study without changing the physical instrument. Draw a finite drafting grid and an amplitude-driven sound ribbon. Keep per-frame work outside React state and dispose GPU resources safely.
2. Integrate keyboard/touch-accessible study controls and object focus without moving the header or navigation. Sketches can be hidden. Respect reduced motion.
3. Deepen the existing captions with grounded FlueBricks research context and a clear case-study door. Clamp measured card dimensions on small screens, and disable hidden controls.
4. Refine walnut relief, equipment surfaces and lighting while retaining recognizable colors, shapes and placements.
5. Verify types, tests and builds. Delegate muted browser checks to Luna high; inspect desktop/mobile renders, toggle study and sketches, check project navigation and retained pad behavior. Update the existing board item with evidence.

## Critical files and owners

| File | Responsibility |
|---|---|
| `src/components/landing/SketchLayer.tsx` | Drafting visuals, exploded study and live energy drawing; owns sketch palette and study placement |
| `src/components/landing/fluebricks.ts` | Existing physical geometry and module colors; reused, never redrawn from memory |
| `src/components/landing/audio/index.ts` | Audio behavior and level facade; no audio nodes escape |
| `src/components/LandingScene.tsx` | Compose scene and study state; preserve original page layout |
| `src/components/landing/overlays.tsx` | Measured caption layout and accessible project actions |
| `src/components/landing/captions.ts` | Grounded introduction copy and project routes |
| `src/components/landing/Stage.tsx` | Physical datums, desk material and background |

## Verification

- `npm run typecheck`, `npm test`, `npm run build`.
- Real browser: desktop and portrait renders, assembly toggle changes geometry, sketch toggle hides its visuals, project CTA resolves, no runtime errors or horizontal overflow.
- Existing MPC remains scale 1 and its pad/knob/fader event paths remain intact.
- Browser launches with `--mute-audio`; no local sound during testing.

## Out of scope

Homepage typography/navigation redesign, external asset downloads, audio-engine replacement, unrelated dirty files and deployment.

## Authorized extension: Echo Desk

The user subsequently requested a small game. Build a five-round, untimed echo-memory game
using the MPC's existing Z/X/C/V pads. The machine demonstrates a sequence; visitors repeat
it through the physical pads, keyboard, or accessible touch buttons. A correct round adds
one hit. A mistake permits replay with no penalty or forced restart. Exit returns to the
original desk. This is sequence recall, not timing judgment; do not imply beat accuracy.

- `echoRules.ts` owns the deterministic state machine, pad set and round limits; unit-test
  success, mistakes, replay, completion and exit.
- `EchoGame.tsx` owns demonstration timers, cue state and the accessible game panel. Cancel
  every timer on replay, exit and unmount. Hide no essential information in sound alone.
- `Mpc.tsx` reuses its existing registered pad triggers for demonstrations and touch input;
  actual pad presses report into the same game state machine. Do not build a second audio path.
- `LandingScene.tsx` adds an optional game entry and authored MPC camera shot, hides competing
  captions while playing, and restores the original overview on exit.
- Stop the background loop through the existing transport when a game starts, keeping its
  displayed play/stop state truthful. Free play remains available after the game.
- Verify the reducer in `npm test`, then delegate a muted Luna browser pass covering start,
  demonstration, correct input, replay/mistake and exit. Recheck mobile composition.

### Interaction correction: discovery, not a tutorial

The user rejected guided instructions. This supersedes the game-panel presentation above:
remove the instructional HUD, duplicate on-screen pads, round counter and explicit game CTA.
The physical avatar starts the exchange; the actual MPC pads demonstrate and acknowledge it.
Success advances automatically, a miss gently repeats the pattern, and completion returns to
free play. Clicking the desk or Overview exits. Keep a keyboard-focusable entry and assistive
description without putting tutorial copy on the visual surface. FlueBricks itself opens its
study; clicking the sound drawing freezes/resumes it. Project introductions explain the work,
not how to operate the scene. Verify real physical-object clicks and absence of tutorial UI.

## Verification result — 2026-09-11

- `npm test`: 29 passed, including five echo-rule tests and two flute ownership/module tests.
- `npm run typecheck`, `npm run build` (public and admin), `git diff --check`: passed.
- Final muted Luna browser pass: physical avatar entry on 1440×900 and 390×844; correct
  two-hit response followed automatically by a three-hit demonstration; Overview exits to idle.
- No visible tutorial panel, explicit game CTA, round counter or duplicate pad buttons.
  Screen-reader/keyboard access remains. Mobile pads are in view and MPC scale is `[1,1,1]`.
- Fresh browser runtime errors: none. No horizontal overflow.
- Earlier pass verified project routing and assembled/exploded geometry. The final bounded pass
  did not separately recheck the newly object-based assembly/freeze gestures.
- Original avatar projection offset and unrelated `dist-look/` preserved. Changes remain local;
  no deployment or additional commit was made for this implementation.

## Photo-grounded FlueBricks correction — 2026-09-11

- Rebuilt the existing procedural factory against the user's component-sheet photograph:
  faceted 40-degree regulator, chamfered grey generator with a recessed window, genuinely
  open red tuning slot, hollow orange branch and straight open yellow resonator.
- Preserved the five-module color sequence and exploded-study contract. Each module is now
  one merged mesh: 5 meshes instead of 17; 2,492 triangles instead of 1,162. This reduces
  draw submissions but increases geometry detail; it does not establish a whole-scene speedup.
- Corrected the physical flute's desk rotation: its window face was facing down. Equipment
  placement, page layout and game behavior are unchanged.
- Added ray-intersection checks for recessed/open windows, side port and axial bore, plus
  silhouette, geometry budget, module ownership and disposal checks. The suite has 30 tests.
- The previously reported lag remains unresolved; this is a model-fidelity correction,
  not a verified fix for the scene's performance regression.
- Muted Luna desktop pass opened the study by clicking the physical generator; runtime
  errors were empty and the browser was closed. Screenshots confirm the bent regulator,
  but the existing project callout obscures the right-hand modules. Assembly movement was
  not demonstrated by the captured pair, and the final face-up desk correction lacks a
  fresh screenshot. Do not treat this pass as complete visual/interaction acceptance.
