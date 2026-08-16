# Structural cleanup boundaries

> 2026-08-09 · **Status: in force** · Preserve stable entrypoints while moving implementation behind focused modules.

## The call

- Preserve stable entrypoints while moving implementation behind focused modules. The public content loader and GitHub admin API were split without changing their callers.
- Keep `server/routes.ts` as the stable composer while content, asset, and settings handlers own their route groups.
- Remove code only when the current import graph proves it is unreachable or unused. The placeholder Chat page and eye widget were removed; supported News, CV, MPC, and project content remain.
- Keep `src/components/LandingScene.tsx` as the stable route-level entrypoint, while `src/components/landing/` owns the focused MPC boundaries: `overlays.tsx`, `primitives.tsx`, `layout.ts`, `useLayoutControls.ts`, `useMpcAudio.ts`, and `Mpc.tsx`.

## How it shows up in the system

- The browser-facing behavior has a clear ownership split: page lifecycle and navigation stay at the route boundary; geometry and primitives stay in the 3D domain; Tone.js state stays in its hook. Each move was gated by typecheck, tests, and diff validation.

## What was rejected or deferred

Nothing was recorded under this heading in the source.

**Evidence.** The section recorded no evidence pointer; its Why bullet notes only that each move was gated by typecheck, tests, and diff validation.
