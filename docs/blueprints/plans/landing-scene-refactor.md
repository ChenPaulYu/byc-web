# Landing scene structural refactor

> Status: complete · behavior-preserving refactor
> Grounded: 2026-08-08

## Purpose

Reduce the change surface of `src/components/LandingScene.tsx` without changing the public landing experience. The original file was about 1,293 lines; the route-level entrypoint is now 195 lines and the extracted landing domain owns the distinct visual, layout, audio, and composition responsibilities.

## Current boundary

`src/pages/Home.tsx` still imports the default `LandingScene` component. The route now owns only Canvas lifecycle, camera behavior, entry state, and navigation overlay; the MPC domain is composed below it.

## Target boundary

Keep the default `LandingScene` import stable and create a focused `src/components/landing/` domain:

| Module | Owns | Must not own |
|---|---|---|
| `primitives.tsx` | Video, avatar, pad, knob, and button 3D primitives | Route navigation or global audio state |
| `layout.ts` | MPC dimensions, default position values, pad mapping, and visual colors | React state or Tone.js objects |
| `useLayoutControls.ts` | Responsive scale and development-only dat.gui updates | Audio setup or DOM overlays |
| `useMpcAudio.ts` | MPC config fetch, Tone effects, players, playback/history handlers | Three.js mesh layout |
| `Mpc.tsx` | MPC scene composition and event wiring | Welcome/error/page shell overlays |
| `overlays.tsx` | Loading, WebGL fallback, welcome screen, and static navigation fallback | Three.js scene internals |
| `LandingScene.tsx` | Canvas lifecycle, route navigation, entry state, camera, and composition | Primitive implementation or audio effect internals |

The implemented modules are now:

- `src/components/landing/overlays.tsx` — loading, error, welcome, and static fallback UI.
- `src/components/landing/primitives.tsx` — reusable video, avatar, pad, knob, and button primitives.
- `src/components/landing/layout.ts` — geometry, defaults, pad mapping, and colors.
- `src/components/landing/useLayoutControls.ts` — responsive scale and development-only dat.gui state.
- `src/components/landing/useMpcAudio.ts` — config fetch, Tone.js graph, transport, and knob history.
- `src/components/landing/Mpc.tsx` — the MPC 3D composition and event wiring.

## Invariants

- `src/pages/Home.tsx` and the default import path remain unchanged.
- `/model.glb`, `/animation.mp4`, `/samples/*`, and `/mpc.config.json` remain the runtime asset boundary.
- Keyboard mapping remains `1-4`, `Q-R`, `A-F`, `Z-V`.
- Enter still requires a user gesture before starting Tone.js and fades into the scene.
- Video timeout fallback, WebGL fallback, camera responsiveness, and navigation links remain unchanged.
- No visual token or interaction behavior changes during this structural pass.

## Execution gates

1. Extract overlays verbatim and wire the root.
2. Extract reusable 3D primitives and wire `Mpc`.
3. Move static layout data into `layout.ts`.
4. Extract responsive/dev controls and audio lifecycle into hooks.
5. Run `npm run typecheck`, `npm test`, and `git diff --check` after each move.
6. Run `npm run build` and verify the welcome screen, entry transition, and route controls in a real browser. Completed 2026-08-08.

## Verification evidence

- `npm run typecheck` — passed for the public and server TypeScript projects.
- `npm test` — 22 tests passed.
- `npm run build` — public and admin production builds passed.
- `git diff --check` — passed.
- Preview browser — welcome screen, ENTER transition, `/about` navigation hand-off, and `/admin/` login shell verified.

## Stop conditions

Stop and inspect rather than rewriting if a move changes hook ordering, Tone.js disposal, keyboard registration, video cleanup, or the Canvas error boundary. A lower line count is not sufficient evidence of a correct split.
