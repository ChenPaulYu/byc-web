# byc-web — plan

> 2026-08-23 · status index (one layer, by status). Only "what to do + which doc".
> Design lives in `thoughts/`; grounded implementation plans live in `plans/`.
> A visual view renders on demand via `shape-mockup`.

> **The governing principle, settled 2026-08-15** in
> [`2026-08-15-instrument-over-scene.md`](thoughts/2026-08-15-instrument-over-scene.md): the
> homepage is an instrument, not a room. Effort goes into how it feels to play; the scene is the
> setting and stops earning polish. Procedural three.js and raw Web Audio only — no downloaded
> models, textures, HDRIs or impulse responses.

> The current homepage, content-source, and bundle-splitting batches are implemented and verified.

## 🚧 In progress

- **Taipei window refinement (2026-09-11)** — photo-grounded 101 plus cream/terracotta tile apartments, grilles/AC details, dimensional balconies/awnings/water tanks and distant glass buildings. Muted Luna window screenshot reviewed, runtime errors empty; 45 tests, typecheck, public build and payload gate pass. Room 25 batches / 23,212 triangles; initial JS unchanged. [`Evidence`](plans/2026-09-11-immersive-studio.md#taiwanese-neighborhood-refinement).

- **Inside the studio (2026-09-11)** — bright daylight room now includes ceiling cornices/joints, an opal fixture, vent, wall trim and finer plaster finish; upper shelf lowered for book headroom. Original gear, Taipei 101, cloth flag and physical-only FlueBricks retained. Typecheck and 49 tests passed; room 26 batches / 23,992 triangles. Muted Luna entry/upward screenshots reviewed; no runtime errors. User art-direction acceptance and real-device performance remain open. [`Current evidence`](plans/2026-09-11-immersive-studio.md#wall-and-ceiling-finishing) · [`Prior room iterations`](plans/2026-09-11-blue-hour-room.md).

## ▶ Next

- **Re-wire the visual regression gate** — `scripts/visual-gate/compare-baseline.mjs` exists and is
  still the carried-over version; it needs a capture step against this homepage's single Canvas,
  waiting on a real paint signal rather than a timeout. Verified 2026-08-16: the file is present
  and nothing calls it.

## ⏸ Future —— deferred

- **Audit actual admin usage** — identify which small text edits, asset uploads, configuration
  changes, and deployment actions still need a browser surface before narrowing admin pages. Do
  not delete pages speculatively.

- **Revisit the scene frame and navigation placement** — decide whether the desk vignette is still
  the right frame and whether navigation belongs inside the scene.
- **Bake ambient occlusion** — the `three-mesh-bvh` Node approach is chosen, but the scene-first
  visual question is not currently the active homepage goal.
- **Remaining interactive-scene load** — the initial-entry 3D dependency leak is fixed below.
  Model/video payload and scene initialization still need separate measurement; no visual
  degradation or asset replacement approved by this optimization pass.

## ✅ Shipped

- **Wall light-switch (2026-09-11, local branch)** — the existing door-side rocker turns the ceiling light off/on; direct lamp clicks disabled per user clarification. Window daylight and desk lamp remain, no tutorial or camera flight. Reuses mounted room resources and existing lights. Latest verification in [`Evidence`](plans/2026-09-11-immersive-studio.md#wall-and-ceiling-finishing).

- **Taiwan cloth flag + Builder (2026-09-11, local branch)** — reference-inspired pinned fabric above the left speaker, compact central research notes and clear separation from the right shelves; replaces the desk flag and sticker iterations. Click-only “Taiwan No. 1!” / “I’m from Taiwan.” caption retained. Creator wording updated throughout live self-descriptions. Latest verification evidence lives in the linked plan. [`Evidence`](plans/2026-09-11-immersive-studio.md#personal-taiwan-flag-and-builder-wording).

- **Initial loading boundary (2026-09-11, local branch)** — explicit shared-runtime ownership and intent-only scene preload reduce initial production JavaScript from 1,307,535 to 279,895 bytes (~79%). Manifest size/dependency/cycle gates, 43 tests, typecheck and public build pass. Final muted Luna production check passed welcome without 3D/media requests, working room entry and direct About without 3D; no runtime errors. Not deployed. [`Evidence and scope`](plans/2026-08-23-bundle-splitting.md#2026-09-11-initial-loading-correction).

- **Living sketch desk + wordless Echo Desk (2026-09-11)** — concept 4 implemented, original layout and personal equipment preserved. Physical-avatar-initiated call-and-response, automatic rounds, object feedback, FlueBricks study, sound drawing, project introductions and material polish; no tutorial HUD or duplicate pad controls. Photo-grounded FlueBricks correction adds a bent regulator and real openings, merges 17 meshes into 5, and turns the desk model face-up; 30 tests, typecheck and both builds pass. Previously reported scene lag remains unresolved. Muted Luna browser verification passed desktop/mobile avatar entry, correct response, automatic continuation and exit; mobile MPC remains scale 1. Plan and verification scope: [`2026-09-11-living-sketch-desk.md`](plans/2026-09-11-living-sketch-desk.md). Local branch: `experiment/astra-landing-polish`, not deployed.

- **Homepage bundle splitting (2026-08-23)** — Mermaid now loads only when a `language-mermaid`
  block renders; `MarkdownRenderer` dropped from roughly 505 KB to 6.7 KB minified. See
  [`2026-08-23-bundle-splitting.md`](plans/2026-08-23-bundle-splitting.md).
- **Portrait focus and captions (2026-08-18)** — every authored portrait object can fly to a
  working view; captions and the single project door are wired without changing instrument
  behavior. See [`2026-08-18-portrait-focus.md`](plans/2026-08-18-portrait-focus.md) and
  [`2026-08-18-focus-caption.md`](plans/2026-08-18-focus-caption.md).
- **Focus by flying (2026-08-17)** — focus moves the camera while preserving free orbit and zoom;
  the page layer fades out of the way. See
  [`2026-08-17-focus-by-flying.md`](plans/2026-08-17-focus-by-flying.md).

- **Projects index is Markdown-backed (2026-08-18).** `src/pages/Projects.tsx` loads
  `loadAllProjects()`; filters are `Research` / `Side Project` / `Demo` / `Pieces` from
  `PROJECT_GROUPS`. `tmc-cl1` is disabled. Evidence: no `PROJECTS` array in `src/constants.ts`,
  no `src/types.ts`. Remaining pages still follow
  [`2026-08-18-project-inventory.md`](thoughts/2026-08-18-project-inventory.md).

### The instrument — 2026-08-15/16, branch `polish/landing-instrument`, unpushed

- **The audio layer is ours.** Tone.js removed: 239 KB that loaded from the entry HTML on every
  page, including pages with no audio. Raw Web Audio in `landing/audio/` behind a barrel that
  hands out behaviour and never a node — two channel strips into a shared filter, drive and
  reverb, with the reverb's impulse response synthesised from a noise burst rather than
  downloaded. Trigger latency gone by construction; Tone's default 100 ms lookahead was exactly as
  long as the pad's flash, so the sound used to arrive as the light went out.
- **Everything decorative now does something.** The four knobs had never been connected to
  anything at all and are now filter, drive, reverb and volume, calibrated so no position sounds
  broken. The Sidekick's two faders are the two channels and its display reads the level. The
  avatar takes his rate from the level, arrives by being switched on rather than eased in, and
  drive and reverb reach him as shake and halo.
- **The MPC reshaped** around mass and light per
  [`2026-08-15-mpc-form.md`](thoughts/2026-08-15-mpc-form.md), with timber end cheeks. Printed
  labels, tick rings and a fifth knob all removed as unreadable at this size.
- **The desk rebuilt around a measurement.** The MPC separated from the old light oak by sixteen
  points of luminance out of 255, almost entirely in the blue channel; walnut on a black steel
  frame gives seventy-eight. Wood generated from one height field so colour, relief and roughness
  cannot drift apart. Its floor was also 65 cm above the legs' feet, so nothing in the scene had
  ever been standing on anything.
- **The scene cut back.** Laptop and Launchpad removed with everything that existed only for them.
  A K.O. II Sidekick added and earning its place by being wired to the audio.
- **Monitors** are Tannoy Gold 5s built from the product photograph rather than from memory.
- **`npm run dev` fixed.** It rendered an empty canvas while production was fine — a drei `<Text>`
  fetching a font from a third-party CDN inside the Canvas, which StrictMode's double mount never
  recovered from. StrictMode stays on.

### Earlier

- Explored and abandoned the full-3D landing room. Four fidelity rounds and a generated-asset
  pipeline did not close the visual gap; the durable findings are in the postmortem.
- Added the repo-level `AGENTS.md` workflow priming for shape/nav.
- Added the Claude Code pointer in `CLAUDE.md` so Claude and Codex share the same contract.
- Added the active visual language contract in `docs/core/site-style.md`.
- Added the canonical `docs/blueprints/` tree and status board.
- Added the bilingual `docs/codebase-map/index.html` repo map.
- Wired `npm test` and `npm run typecheck`; 22 tests pass and both TypeScript projects typecheck.
- Removed unused runtime dependencies, dead CV constants/types, unreachable chat surfaces, and
  unused landing primitives.
- Split the public content loader into typed contracts, config, source, and excerpt modules.
- Split the GitHub admin implementation into transport, frontmatter, content, asset, localization,
  and settings modules behind the existing facade.
- Split the local Express routes into content, asset, and settings registrars behind
  `createRoutes`.
- Split Markdown embedded blocks from the main renderer.
- Split the landing surface into overlays, 3D primitives, layout data, layout controls, audio
  state, and MPC composition while keeping the default route import stable
  ([`landing-scene-refactor.md`](plans/landing-scene-refactor.md), self-declared complete).
- Verified `npm run build` for both public and admin bundles.
- Verified the landing welcome/entry flow, `/about` navigation hand-off, and `/admin/` login shell.
- Recorded the agent-first content ownership decision: repository and agent are primary; admin
  remains a focused safety valve.

### Closed during the 2026-08-16 align, verified against code

Four items the board still carried as open had already been overtaken:

- "chair placement" — there is no chair; removed in `afa2cb4`.
- "the plant still looks wrong" — there is no plant; removed in `5db9510`.
- "an empty desk top" — the desk carries the Sidekick, monitors, mug and papers.
- "the tiny avatar has to be resolved" — settled in `2026-08-15-mpc-form.md` and built: he is the
  instrument's output, driven by the audio level.
