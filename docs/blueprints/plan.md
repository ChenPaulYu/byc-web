# byc-web — plan

> 2026-08-16 · status index (one layer, by status). Only "what to do + which doc".
> Design lives in `thoughts/`; grounded implementation plans live in `plans/`.
> A visual view renders on demand via `shape-mockup`.

> **The governing principle, settled 2026-08-15** in
> [`2026-08-15-instrument-over-scene.md`](thoughts/2026-08-15-instrument-over-scene.md): the
> homepage is an instrument, not a room. Effort goes into how it feels to play; the scene is the
> setting and stops earning polish. Procedural three.js and raw Web Audio only — no downloaded
> models, textures, HDRIs or impulse responses.

> **Nothing has ever been pushed from `polish/landing-instrument`.** The live site is untouched.

## 🚧 Current call —— click an object to focus it

- **Focus mode** — clicking an instrument snaps the camera to a working view of it and hands over
  interaction; clicking out returns. Raised 2026-08-16 after two findings landed together: at the
  closest allowed zoom the desk pushes about 20,000 pixels of geometry under the navigation
  column, *and* free zoom still does not get near enough to actually operate either machine. So
  tightening the zoom range is the wrong fix — it moves away from what is wanted.

  This is worth having beyond the immediate complaint. It closes the 20 px pad — a pad is not a
  mouse target at the default framing — without asking anyone to fly a camera, and the framing
  becomes something the code chooses rather than something the visitor can break.

  **Designed 2026-08-17** in [`2026-08-17-focus-by-flying.md`](thoughts/2026-08-17-focus-by-flying.md).
  All three forks settled the same way — never take the camera away, move it and let the page
  recede: free orbit and zoom stay untouched, the navigation fades on camera distance rather than
  on state, and focus is a camera move with no mode, no exit and no rules that change. The third
  fell out of the first two rather than needing its own answer.

  **Grounded 2026-08-17** in [`2026-08-17-focus-by-flying.md`](plans/2026-08-17-focus-by-flying.md).
  One decision blocks step 4 and nothing else: the Sidekick is 1.76 units wide, so at the current
  `minDistance` of 24 it reaches about 90 px and its faders 11 px — closer, but not workable.
  Dropping `minDistance` is a loosening rather than a clamp, so it fits the principle, but it
  changes a number the design named and is left for the owner.

## ▶ Next

- **Re-wire the visual regression gate** — `scripts/visual-gate/compare-baseline.mjs` exists and is
  still the carried-over version; it needs a capture step against this homepage's single Canvas,
  waiting on a real paint signal rather than a timeout. Verified 2026-08-16: the file is present
  and nothing calls it.
- **Make Projects Markdown-backed** — execute
  [`2026-08-09-project-index-content-source.md`](plans/2026-08-09-project-index-content-source.md);
  preserve the current card UI while removing the stale static project array. Verified 2026-08-16
  as **not started**: `src/pages/Projects.tsx` still does `import { PROJECTS } from '../constants'`
  and filters that array.

## ⏭ After next

- **Audit actual admin usage** — identify which small text edits, asset uploads, configuration
  changes, and deployment actions still need a browser surface before narrowing admin pages. Do
  not delete pages speculatively.

## ⏸ Future —— not yet prioritised

- **The two scene questions nobody has answered.** Whether the desk vignette is the right frame at
  all — the instrument-only alternative was rendered once and takes a pad from 20 px to about 60 —
  and whether navigation belongs inside the scene, which is the one thing both reference sites
  explicitly do not leave as corner links. Focus mode may answer the first by making it moot.
- **Ambient-occlusion bake** — `three-mesh-bvh` in Node is the chosen approach. Not started. The
  scene has no AO at all, which is the largest remaining gap between it and the references.
- **Review production chunk sizes** — verified 2026-08-16 and still large: `three-vendor` 1218 KB,
  `MarkdownRenderer` 493 KB, `cytoscape` 432 KB. Assess only when a performance goal makes the
  trade-off worthwhile. Note that `public/model.glb` is 2.7 MB on its own — larger than the whole
  three.js chunk — and is the first place to look if page weight ever becomes the subject.

## ✅ Shipped

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
