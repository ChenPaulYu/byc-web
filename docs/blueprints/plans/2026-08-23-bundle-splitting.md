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
