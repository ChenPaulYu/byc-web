# byc-web — plan

> 2026-08-08 · status index (one layer, by status). Only “what to do + which doc”.
> Design lives in `thoughts/`; grounded implementation plans live in `plans/`.
> A visual view renders on demand via `shape-mockup`.

## 🚧 In progress —— maintenance handoff

> The requested cleanup and structural refactor are complete. The repo is now in a maintenance-ready state with explicit verification gates and a current map.

- **Keep the verification gate stable** — use `npm run typecheck`, `npm test`, `npm run build`, and the relevant browser flow before future behavior changes.

## ▶ Next —— choose the first product-facing improvement

- **Align the personal-site direction** — run `shape-align`, then ground the chosen improvement with `nav-plan`.

## ⏸ Future —— audit candidates, not yet prioritised

> These are maintenance follow-ups, not required cleanup for the current refactor.

- **Review production chunk sizes** — the build still reports large Three.js and Markdown/admin chunks; assess them only when a performance goal makes the trade-off worthwhile.

## ✅ Shipped

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
