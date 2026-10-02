# Homepage Bundle Splitting — plan

> Generated: 2026-08-23 · Spec source: user request to continue bundle splitting · Stage 1: fresh

## Context

The public app already lazy-loads route pages in `src/App.tsx`, and the homepage defers the
interactive Three.js scene until entry in `src/pages/Home.tsx`. The remaining large route-level
payload is the Markdown path: `src/components/MarkdownRenderer.tsx` imports the shared Markdown
blocks, while `src/components/markdown/blocks.tsx` imports Mermaid at module evaluation time.

That means every page that renders `MarkdownRenderer` pays for Mermaid before it knows whether the
document contains a Mermaid block. The bundle report shows `MarkdownRenderer` at about 505 KB after
minification. The intent is to preserve rendered output while moving Mermaid behind a runtime
boundary that activates only for `language-mermaid` code blocks.

## Resolved questions

| Question | Decision |
|---|---|
| Should the visual output or Markdown syntax change? | No; this is a loading-boundary change only. |
| Should Three.js be split further in this pass? | No; the homepage already loads it only after Power on, and splitting its vendor code would add requests without reducing the interactive scene payload. |

## Approach

1. Extract `MermaidDiagram` and its Mermaid initialization into a focused module.
2. Keep `blocks.tsx` responsible for lightweight Markdown helpers and re-export no Mermaid runtime.
3. Lazy-load the focused Mermaid module from the Markdown code renderer only when a Mermaid block is rendered, with the existing code-block fallback while it loads.
4. Build and inspect the generated chunks, then run typecheck, tests, and a browser pass through a normal Markdown page and a Mermaid-capable page if available.

## Critical files

| File | Why it matters | Touched in step |
|---|---|---|
| `src/components/MarkdownRenderer.tsx` | Owns Markdown rendering and detects code languages. | 2–3 |
| `src/components/markdown/blocks.tsx` | Currently pulls Mermaid into the shared Markdown helper module. | 1–2 |
| `src/components/markdown/MermaidDiagram.tsx` | New lazy boundary owning Mermaid setup and rendering. | 1 |
| `vite.config.ts` | Existing vendor chunk policy; verify rather than broaden it in this pass. | 4 |

## Verification

1. TypeScript and tests: `npm run typecheck && npm test`.
2. Production bundle: `npm run build`, confirm Mermaid is emitted as a separate async chunk and the main Markdown chunk no longer contains Mermaid initialization.
3. Browser: open the public site, navigate to a Markdown-backed page, confirm content renders; inspect console for runtime errors.

## Out of scope

- Changing Markdown output, Mermaid diagrams, syntax-highlighting behavior, or route UX.
- Replacing Mermaid, React Markdown, or the existing Vite vendor policy.
- Optimizing the separate admin bundle.

## 2026-09-11 initial-loading correction

The earlier statement that Three.js loads only after Power on was disproved by the production
output: dist/index.html preloaded three-vendor and the entry imported shared runtime from it.
Baseline initial JavaScript was 1,307,535 bytes (1,277 KiB), excluding CSS/media/fonts.

User authorized loading optimization. Scope is the public entry boundary, not a new visual
design or removal of equipment. Keep the room/101 refinement pending visual review.

- Use explicit manual chunk membership, with React/React DOM and shared bundler helpers owned
  by the common runtime rather than the optional Three.js chunk. Merely adding React to the
  old object-form manualChunks did not fix the dependency leak; two production checks failed.
- The first explicit scene/vendor split passed the size gate but failed actual Power on with
  a temporal-dead-zone error. The manifest confirmed LandingScene -> three-vendor -> LandingScene.
  A new all-static-chunk cycle gate reproduced that failure and caught the equivalent Markdown
  split. Remove both forced optional-vendor groups; retain only explicit shared React ownership
  and let Rollup co-locate optional dependencies at lazy boundaries.
- Replace Home's unconditional 400 ms scene import with Power on pointer/focus/entry intent.
  No background 3D download for someone who only opens the welcome page.
- Add a production manifest gate: npm run build:main && npm run check:payload. Follow static
  imports recursively; reject eager Three/LandingScene/Markdown/Mermaid and initial JS >400 KiB.
- Verify typecheck/tests and a muted Luna production browser pass: welcome without 3D requests,
  entry still loads the room, and a direct content route still renders.

### Measured result

- Production build and manifest/cycle gates pass: entry + react-vendor total 279,895 bytes, versus
  baseline 1,307,535 bytes (~79% reduction). Locally gzip-compressed total is 90,326 bytes;
  this is not a claim about the deployed server's compression or real-world load time.
- Final typecheck and all 43 tests pass. No equipment/model/video replacement, no deployment.
- Production preview for browser verification: http://localhost:4175. Do not use Vite's dev
  module graph as evidence of production loading behavior. Model/video download and scene
  initialization after entry remain outside this measured improvement.
- Final fresh muted Luna production pass succeeded: welcome had five resources with no scene,
  GLB, video or audio requests; Power on rendered the room at 1440x900; direct /about rendered
  readable content with no Canvas or 3D/media requests. Runtime errors were empty. Parent
  inspected /tmp/byc-loading-room-final.png and /tmp/byc-loading-about-final.png. Own session
  closed. This supersedes the failed intermediate chunk-split browser result above.

## 2026-10-02 scene-entry recovery and video uploads

The user reported slow homepage entry and frequent failures. Production-preview fault injection
reproduced three independent entry failures: a rejected scene chunk erased the page, an audio
context whose resume promise never settled kept Power on visible, and a stalled avatar download
kept the full-page loading cover visible even while the room was rendering. These reproduce
specific failure paths; the user's affected URL/device has not yet been identified.

- Move the existing error boundary and static navigation into a lightweight module available
  before the scene download. Keep navigation usable while the chunk is pending or rejected.
- Request audio within the entry gesture without awaiting permission before entering the room.
- Dismiss the room cover after the renderer has produced frames, independently of optional
  avatar/video downloads. Keep failed avatar loading inside its own existing placeholder.
- Replace a lost WebGL canvas with static navigation, releasing the mounted scene and audio.
- Let Three.js VideoTexture upload on new video frames. The previous useFrame callback uploaded
  unchanged video pixels even when paused: 44 extra uploads in a 700 ms baseline sample, versus
  zero after the fix. This measures redundant uploads, not an overall frame-rate improvement.

The user then authorized continued improvement. Additional reproduced failures and measured costs:

- An unreachable Google Fonts stylesheet blocked initial module execution. Load the optional
  stylesheet without blocking the page; retain the same families and weights.
- Audio-device construction failure and rejected resume promises reached the page as errors.
  Keep sound optional, discard partial initialization and allow later gestures to retry resume.
- Transport-button interpolation diverged at 5 fps, moving the button thousands of scene units.
  Use bounded exponential damping and exercise the actual pressed/released component at 5 fps.
- The unchanged room drew 108 shadow meshes every frame. Cache opaque directional shadows,
  invalidating on caster geometry/transforms/visibility, light changes and scene membership.
  Unsupported animated/alpha-tested casters retain live updates. Compare cached results with
  forced fresh shadows after movement, hide/show, light movement and camera changes.
- Merge the eleven unchanged tick marks on each of four knobs. Normal room main-pass calls
  fall from 226 to 186; together with the cached 108 shadow calls, idle drawing falls from
  roughly 334 to 186 calls per frame (44%). This measures draw calls, not a 44% FPS claim.
- Lossless FLAC copies reduce five configured samples from 5,116,574 to 2,785,560 bytes (45.6%).
  Compare decoded PCM for every asset; retain WAV masters and test fallback when FLAC decoding
  is rejected. Regenerate via npm run samples:encode (requires FFmpeg).
- Production-only meshopt packing reduces the avatar from 2,829,892 to 2,441,208 bytes (13.7%).
  Verify all 136 buffer views byte-for-byte during every build. The existing GLTF loader
  already includes the decoder. Source model, image bytes and animation data remain intact.

Verification commands and scope:

- npm run build; npm run typecheck; npm test; npm run check:payload.
- npm run check:home against npm run preview -- --host 127.0.0.1 --port 4300.
  Thirteen production cases cover unreachable fonts, slow mobile entry, scene download failure,
  pending/rejected audio permission, unavailable audio hardware, native FLAC and WAV fallback,
  failed avatar, stalled media, WebGL loss, paused-video uploads and three entry/exit cycles.
  Each checks About navigation. Repeated visits release graphics contexts and video sources,
  suspend audio and reuse one AudioContext.
- npm run check:scene against npm run dev: 30 idle frames produce zero shadow draws;
  the frozen probe's main pass falls from 219 to 179 calls. Before/after tick-batching screenshots
  and cached/fresh-shadow screenshots have zero differing pixels. The 5 fps transport check passes.
- node scripts/visual-gate/check-landing.mjs: real-scene entry, keyboard input, About navigation
  and 1440×900, 390×844, 320×568, 844×390 sizes. Readiness and asserted state now come from
  one poll; separate async wait/eval could previously return null on resize.
- Set CHROME_PATH for the new browser probes when using an installed Chromium instead of
  Playwright's bundled browser. The legacy scene probe requires agent-browser.

Final verification: all 13 production browser cases, 57 unit tests, typecheck, both production
builds, payload/cycle gates, scene rendering probes and the four-size interaction probe pass.
Fresh production screenshots at 1440×900 and 390×844 show the packed avatar and original room;
the browser fetched the verified 2,441,208-byte model, accepted keyboard input and navigated to
About without page errors or horizontal overflow. Screenshots were visually inspected.

A throttled production run used a 390×844 viewport, 4× CPU slowdown, an empty HTTP cache,
80 ms latency and 200 KiB/s download throughput. Successful sequential runs reached a usable
room in 6,474 and 7,196 ms. A run concurrent with another scene probe exceeded its 15-second
deadline; the availability probe now allows 30 seconds on this shared host. These are simulated
conditions, not physical-phone results, a stable performance budget or a before/after timing claim.
Initial JavaScript remains 281,435 bytes (90,679 locally gzipped), below the 400 KiB gate and
without eager 3D dependencies. Remaining costs include cold shader compilation, native audio
initialization, video transfer and device-dependent GPU work. Further quality reductions or
changes to the authored experience need fresh evidence. Changes are local and not deployed.

### Entry-transition follow-up

The user reported a flash during loading. A delayed production scene download reproduced it:
Home faded the welcome screen to zero before any canvas existed, replaced it with centered
fallback content, then replaced that with a separate loading cover. The identity briefly
disappeared and returned at another position before the room appeared.

Home now mounts the scene behind the same welcome screen and starts its single fade only after
the renderer reports readiness (or a usable error fallback is available). Loading navigation
stays accessible; the covered scene is inert until reveal. The independent scene loading cover
is removed, and reduced-motion users skip the fade. Error boundaries notify the entry owner so
failed scene downloads or GPU initialization still reveal usable navigation.

The original delayed-download probe now keeps opacity at 1 until a canvas exists. A permanent
production case in `check:home` holds the scene download beyond the former 500 ms timer and
asserts the original entry DOM stays connected and opaque before releasing the request.
The same case checks a 320×568 viewport and reduced-motion behavior. Early GPU-loss injection
also exposed a listener race: the canvas can lose its context before R3F children mount.
Observe the non-bubbling event in capture phase on the DOM host instead of inside the renderer.
This makes recovery available before renderer initialization, as well as during normal use.
Verification: all 14 production browser cases passed across the main run and focused reruns
after fixing the early GPU-loss race. Typecheck, the public production build and payload/cycle
gates pass. Initial JavaScript is 281,820 bytes (90,821 locally gzipped).
