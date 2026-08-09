# byc-web — decisions

> Durable decisions for the repository workflow. Keep this file focused on the “why”; implementation detail belongs in the codebase map and grounded plans.

## Workflow locations

- **Call:** Keep the Shape board and Nav grounded plans together under `docs/blueprints/`, with `plan.md` as the single maintained status index.
- **How it appears:** `docs/blueprints/plan.md` records now/next/future/shipped work; `docs/blueprints/plans/` holds code-grounded plans; `docs/codebase-map/index.html` is the repo-level navigation entry point.
- **Rejected / deferred:** A separate `docs/plans/` tree and a standing HTML board are deferred because they would create two competing sources of truth.

## Visual language contract

- **Decision:** Keep the public site and admin dashboard on one neutral, typography-led visual language, with the 3D MPC landing scene as the intentional expressive exception.
- **Why:** A small shared vocabulary makes future pages easier to review and keeps visual drift from becoming a second architecture problem.
- **Source of truth:** `docs/core/site-style.md` owns the baseline, review checklist, and open visual questions.

## Structural cleanup boundaries

- **Decision:** Preserve stable entrypoints while moving implementation behind focused modules. The public content loader and GitHub admin API were split without changing their callers.
- **Decision:** Keep `server/routes.ts` as the stable composer while content, asset, and settings handlers own their route groups.
- **Decision:** Remove code only when the current import graph proves it is unreachable or unused. The placeholder Chat page and eye widget were removed; supported News, CV, MPC, and project content remain.
- **Decision:** Keep `src/components/LandingScene.tsx` as the stable route-level entrypoint, while `src/components/landing/` owns the focused MPC boundaries: `overlays.tsx`, `primitives.tsx`, `layout.ts`, `useLayoutControls.ts`, `useMpcAudio.ts`, and `Mpc.tsx`.
- **Why:** The browser-facing behavior has a clear ownership split: page lifecycle and navigation stay at the route boundary; geometry and primitives stay in the 3D domain; Tone.js state stays in its hook. Each move was gated by typecheck, tests, and diff validation.
