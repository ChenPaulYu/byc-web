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
