# byc-web — plan

> 2026-08-14 · status index (one layer, by status). Only "what to do + which doc".
> Design lives in `thoughts/`; grounded implementation plans live in `plans/`.
> A visual view renders on demand via `shape-mockup`.

## 🚧 In progress —— polish the personal instrument

> **Decided 2026-08-14.** The homepage is the single interactive MPC that already exists on
> `main`. Geometry stays procedurally generated in three.js, with textures as support — no
> generated meshes, no asset pipeline, no room. The full-3D room exploration is abandoned;
> its lessons are in [`2026-08-14-full-3d-room-postmortem.md`](thoughts/2026-08-14-full-3d-room-postmortem.md)
> and its code on branch `experiment/homepage-core`.

- **Decide what "polish" means here** — the scope is deliberately small and visual: materials,
  lighting, micro-interaction, sound, type. Pick the specific list before writing code.
- **Re-wire the visual regression gate** — `scripts/visual-gate/compare-baseline.mjs` is carried
  over and unchanged; it needs a capture step against this homepage's single Canvas, waiting on
  a real paint signal rather than a timeout. Worth doing first: every task in this phase is
  visual, and this is what makes drift visible in review.

## ▶ Next —— unify the project content boundary

- **Make Projects Markdown-backed** — execute [`2026-08-09-project-index-content-source.md`](plans/2026-08-09-project-index-content-source.md); preserve the current card UI while removing the stale static project array.

## ⏭ After next —— observe and narrow the admin safety valve

- **Audit actual admin usage** — identify which small text edits, asset uploads, configuration changes, and deployment actions still need a browser surface before narrowing admin pages. Do not delete pages speculatively.

## ⏸ Future —— audit candidates, not yet prioritised

- **Review production chunk sizes** — the build still reports large Three.js and Markdown/admin chunks; assess them only when a performance goal makes the trade-off worthwhile.

## ✅ Shipped

- Explored and abandoned the full-3D landing room. Four fidelity rounds and a generated-asset pipeline did not close the visual gap; the durable findings are recorded in the postmortem.
- Added the repo-level `AGENTS.md` workflow priming for shape/nav.
- Added the Claude Code pointer in `CLAUDE.md` so Claude and Codex share the same contract.
- Added the active visual language contract in `docs/core/site-style.md`.
- Added the canonical `docs/blueprints/` tree and status board.
- Added the bilingual `docs/codebase-map/index.html` repo map.
- Wired `npm test` and `npm run typecheck`; 22 tests pass and both TypeScript projects typecheck.
- Removed unused runtime dependencies, dead CV constants/types, unreachable chat surfaces, and unused landing primitives.
- Split the public content loader into typed contracts, config, source, and excerpt modules.
- Split the GitHub admin implementation into transport, frontmatter, content, asset, localization, and settings modules behind the existing facade.
- Split the local Express routes into content, asset, and settings registrars behind `createRoutes`.
- Split Markdown embedded blocks from the main renderer.
- Split the landing surface into overlays, 3D primitives, layout data, layout controls, audio state, and MPC composition while keeping the default route import stable.
- Verified `npm run build` for both public and admin bundles.
- Verified the landing welcome/entry flow, `/about` navigation hand-off, and `/admin/` login shell in the preview browser.
- Recorded the agent-first content ownership decision: repository and agent are primary; admin remains a focused safety valve.
