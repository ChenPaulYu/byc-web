# Landing portrait experiment — plan

> Generated: 2026-09-11 · Source: user-approved visual experiment and mobile MPC report · Stage 1: fresh, reusing the preceding homepage inspection

> Superseded after visual review: Paul prefers the original page layout. The experimental opening, typography, navigation and scene-lighting changes were reverted. Retain the mobile MPC scale fix and the user's pre-existing avatar adjustment. Further exploration is confined to the central 3D scene; new room/desk concepts require a separate decision. The earlier approach and evidence remain historical.

Rollback verification: typecheck passed. Luna high adapted the muted browser probe to the original Power on gate and button navigation; all four viewport scale/overflow checks, entry, keyboard event and About navigation passed. Console errors were empty. Original-layout captures: `/tmp/byc-original-desktop.png` and `/tmp/byc-original-mobile.png`.

## Context

Home currently gates the entire Canvas behind Power on. LandingScene combines a measured desk portrait, camera flights and corner navigation. The user approved exploring a more finished opening, composition, lighting and typography on a separate branch.

The mobile report concerns the MPC's size relative to other objects. `useLayoutControls.ts` still owns a viewport-dependent instrument scale, while `shot.ts` independently frames the scene. Reproduce the rendered size discrepancy before changing either owner.

This is an explicitly authorized visual experiment reopening the scene-polish question in the August instrument decision. Preserve procedural assets, free orbit, responsive sound and the neutral editorial palette. Existing changes to `primitives.tsx` and `dist-look/` belong to the user.

## Resolved questions

- Execute the proposed experiment now on `experiment/astra-landing-polish`; compare the rendered implementation before treating its design as settled.
- Use the existing blueprint location and npm/Vite setup.
- A quiet scene may appear before Power on; audio and instrument interaction still require entry.
- Mobile object proportions should match desktop. Responsive composition belongs to the camera.

## Approach

1. Capture the existing desktop and phone scenes and reproduce the MPC-relative-size failure with a deterministic check.
2. Remove independent responsive MPC shrinking if confirmed; keep geometry and camera framing under their existing owners.
3. Mount a silent scene after the lightweight first paint. Compose a single editorial identity and navigation layer across welcome and entered states. Power on enables audio and exploration without replacing the scene.
4. Refine the authored shot, studio light and readable material separation, checking actual desktop and phone renders. Keep changes perceptible at viewing size.
5. Verify entry, keyboard/pad interaction, navigation, narrow layouts and reduced motion. Run typecheck, build and existing tests; record the experiment as awaiting visual feedback on the board.

## Critical files

| File | Responsibility |
|---|---|
| `src/pages/Home.tsx` | Lazy scene lifecycle and audio entry |
| `src/components/landing/welcome.tsx` | Lightweight identity, navigation and power affordance |
| `src/components/LandingScene.tsx` | Lighting, interaction availability and focus state |
| `src/components/landing/useLayoutControls.ts` | MPC layout; remove viewport geometry ownership |
| `src/components/landing/Mpc.tsx` | Instrument root and entry-aware input |
| `src/components/landing/shot.ts` | Camera framing, unchanged physical proportions |
| `src/components/landing/landing.css` | Scoped editorial composition and motion |

## Verification

- Regression: assert the actual MPC root scale is unchanged between desktop, phone and resize.
- Browser: desktop and phone before/after screenshots; enter, focus, return, play and navigate. Confirm no sound starts before entry.
- `npm run typecheck`, `npm test`, `npm run build`.
- Board: keep this experiment in progress until the user judges the visual direction; record technical verification separately.

## Out of scope

New external models/textures, audio redesign, content-page redesign and publishing.

## Implementation evidence

- Confirmed the original phone bug against the actual R3F scene: at 390×844 the MPC root scale was `[0.35, 0.35, 0.35]`, while the desk and gear roots stayed at `[1, 1, 1]`. The old hook multiplied a phone scale of `0.5` by a portrait factor of `0.7`. Removed that independent scaling; camera framing now owns responsiveness.
- The opening and live instrument share one Canvas and one editorial layer. Phone framing has its own working-view threshold; the instrument retains its physical proportions.
- The page uses a continuous near-white background, a left identity column on desktop, a top identity and separate bottom controls on phones, and contact shadows in place of the hard directional ground silhouette.
- `npm run typecheck` passed. Existing `npm test` passed 22/22. Public and admin builds passed; the final public source was rebuilt successfully with `npm run build:main`.
- Luna high completed the muted browser pass: `node scripts/visual-gate/check-landing.mjs` passed at 1440×900, 390×844, 320×568 and 844×390 with scale `[1,1,1]` and no horizontal overflow. Entry, keyboard event and About navigation passed. Manual mobile chassis focus hid the editorial layer; Overview restored it. Console errors were empty. No listening-based audio claim is made.
- Final screenshots: `/tmp/byc-desktop-final.png`, `/tmp/byc-mobile-final.png`, `/tmp/byc-mobile-focus-final.png`. Browser session closed; Vite preview remains at `http://localhost:3000/`. Visual direction remains an experiment pending Paul's feedback.
