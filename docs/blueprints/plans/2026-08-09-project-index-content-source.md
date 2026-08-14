# Markdown-backed project index — plan

> Generated: 2026-08-09 · Spec source: user-approved next step in conversation · Stage 1: fresh

## Context

The public project index and project detail pages currently have two different data paths. `src/pages/ProjectDetail.tsx` already loads a project through `src/utils/contentLoader.ts`, while `src/pages/Projects.tsx` imports the legacy `PROJECTS` array from `src/constants.ts`. That array contains one curated card, but `public/content.config.json` enables four Markdown projects: `fluebricks`, `djtransgan`, `tmc-cl1`, and `taptap`.

The existing `loadAllProjects()` function already owns registry filtering, Markdown loading, failure isolation, and pinned/importance/title ordering. The change should adopt that existing boundary rather than create a second list-specific loader. The project card can read `ProjectContent.metadata` plus the loader's plain-text `excerpt`, while the page keeps its current filter, card navigation, and visual classes.

The requested intent is to make the project index reflect the same content source as project detail pages, so admin/content edits have one path to the public site.

## Resolved questions

| Question | User's answer |
|---|---|
| Include bilingual project-index state in this slice? | No. Keep the index English-only; defer language state and Chinese fallback. |
| What should happen when a project lacks a cover or has an invalid link such as `#`? | Keep the project visible with a neutral placeholder; hide invalid links. |
| Should this slice redesign project cards or their interactions? | No. Preserve the current card layout, filter behavior, and navigation; make visual changes separately. |

## Approach

1. **Rewire `Projects.tsx` to the existing content boundary.** Replace the `PROJECTS` import and legacy `Project` prop type with `loadAllProjects()` and `ProjectContent`. Load the enabled project collection on mount and preserve the current category filter labels and filter semantics.

2. **Keep card rendering behind a small page-local adapter.** Map `ProjectContent` into the fields the current card needs: slug, title, category, year, tags, excerpt, cover, and links. Use the loader's plain-text excerpt for the description. Resolve an absent/empty cover to the existing neutral image surface, and render only links with a non-empty URL that is not `#`. Support the existing metadata link icon vocabulary without inventing a second project-link contract.

3. **Add quiet lifecycle states.** Preserve the site's editorial tone with a centered loading state, a readable error state, and an explicit empty state. Do not fall back to the old static array: an empty or failed content registry must be visible rather than silently showing stale data.

4. **Remove the obsolete static seam after rewiring.** Confirm the import graph, then remove `PROJECTS` from `src/constants.ts` and delete the legacy `Project` contract in `src/types.ts` if no remaining caller exists. Keep `SOCIAL_LINKS` and the content-domain contracts used by other public pages.

5. **Verify the complete public flow.** Check all four enabled projects, Research/Engineering/Creative filters, card-to-detail navigation, missing-cover behavior, invalid-link hiding, narrow-width layout, and the existing public/admin build gates in a preview browser.

## Critical files

| File | Why it matters | Touched in step |
|---|---|---|
| `src/pages/Projects.tsx:1-88` | Current project index, static-data import, card fields, filters, and navigation contract | 1–3 |
| `src/utils/contentLoader.ts:76-103` | Existing loader for enabled projects and canonical ordering | 1, 5 |
| `src/types/content.ts:6-32` | Markdown-backed project metadata and content contract | 1–2 |
| `public/content.config.json:12-29` | Runtime project membership and enabled flags | 5 |
| `public/content/projects/*.md` | Runtime card metadata, excerpts, covers, and links | 2, 5 |
| `src/constants.ts:1-31` | Legacy static project array and retained social links | 4 |
| `src/types.ts:1-20` | Legacy project-card contract eligible for removal | 4 |
| `src/pages/ProjectDetail.tsx:66-103` | Existing detail-page loading behavior and navigation target to preserve | 5 |
| `docs/core/site-style.md:48-104` | Visual contract for neutral placeholders, cards, spacing, and restrained links | 2–3 |

## Single-source-of-truth owners

| Decision | Owner |
|---|---|
| Which projects appear and whether they are enabled | `public/content.config.json`, interpreted by `loadAllProjects()` |
| Project card metadata and content | `public/content/projects/*.md`, typed by `ProjectMetadata` and `ProjectContent` |
| Collection ordering | `loadAllProjects()`; the page must not reimplement sorting |
| Missing-cover and invalid-link presentation | The page-local project-card adapter in `src/pages/Projects.tsx` |
| Card layout and interaction | Existing `ProjectCard` in `src/pages/Projects.tsx` during this data-source slice |

## Verification

1. Rewire the page → `npm run typecheck`; confirm no caller still imports `PROJECTS` or the legacy `Project` type.
2. Add lifecycle and card-source handling → `npm test`, `git diff --check`; inspect the page at desktop and narrow widths.
3. Remove the obsolete static seam → `rg -n "PROJECTS|from '../types'|from './types'" src`; confirm only `SOCIAL_LINKS` remains in `src/constants.ts`.
4. End-to-end → `npm run build`, then preview the public site and verify four project cards, category counts (Research 2, Engineering 1, Creative 1), card navigation to detail pages, neutral fallback behavior, and hidden `#` links. Recheck `/admin/` shell to ensure the shared build remains healthy.

## Out of scope

- Bilingual project-index state, language persistence, or new Chinese project files.
- Project-card visual redesign, new tokens, new fonts, or new motion.
- Changes to project detail rendering or the Markdown content format.
- Replacing remote placeholder covers or repairing project content links; those are content decisions, not list-source plumbing.
- Three.js/Markdown chunk splitting and broader performance work.
