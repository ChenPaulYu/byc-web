# byc-web site style — visual language and maintenance contract

> Status: active baseline · grounded in the shipped public site and admin dashboard on 2026-08-08
> Scope: the public portfolio, the admin dashboard, and any new page or component added to this repository

This document defines the visual language that the website already uses. It is a maintenance contract, not a redesign brief. When a new page or component is added, it should feel like it belongs to the same quiet editorial system.

Read this document as a guardrail: preserve the decisions below unless a deliberate style decision supersedes them. Implementation details may move; the visual principles should remain recognizable.

## The visual idea

The site is a calm research-and-creative portfolio. It should feel closer to a well-edited personal notebook than to a product marketing page.

- Use a **white or near-white canvas**, dark text, and restrained neutral borders.
- Let **typography, spacing, and content** create hierarchy before adding decoration.
- Use **blue as the interaction accent**, not as a permanent surface color.
- Keep motion short and quiet. Motion should explain a state change, not compete with the work.
- Treat the 3D MPC landing scene as the one expressive exception: it can be tactile and playful while the rest of the site stays editorial.

## Two surfaces, one language

The public site and admin dashboard share the same neutral, typography-led foundation but have different densities.

| Surface | Job | Shape |
|---|---|---|
| Public site | Present research, projects, writing, news, and CV | Spacious, centered, editorial, content-first |
| Admin dashboard | Edit content and assets safely | Denser, form-oriented, neutral panels, explicit controls |

Do not make the admin dashboard look like a second public landing page. It is a tool; its clarity matters more than spectacle.

## Color system

The current palette is intentionally small. Prefer the existing Tailwind neutral classes and the values below before introducing a new color.

| Role | Current value | Use |
|---|---|---|
| Public canvas | `#ffffff` | Main public page background |
| Primary ink | `#171717` / Tailwind `neutral-900` | Headings, primary text, active controls |
| Body ink | Tailwind `neutral-600` / `#525252` | Long-form content and supporting copy |
| Quiet text | Tailwind `neutral-400` / `#a3a3a3` | Dates, metadata, labels, footer links |
| Soft surface | Tailwind `neutral-50` / `#fafafa` | Admin canvas, image placeholders, quiet controls |
| Border | Tailwind `neutral-100`–`neutral-200` | Dividers, inputs, cards, table boundaries |
| Interaction blue | `#2563eb` / Tailwind `blue-600` | Link hover, active content links, selected emphasis |
| Informational blue | Tailwind `blue-50` with `blue-600` border | Announcements and content callouts |
| Destructive red | `#dc2626` / Tailwind `red-600` | Delete actions and destructive errors only |

Rules:

- New accent colors need a reason that belongs to the content or interaction state.
- Do not use blue or red as a generic decoration.
- Do not introduce gradients, neon accents, or saturated backgrounds into ordinary content surfaces.
- Prefer semantic Tailwind classes over one-off hex values. Existing CSS values are the source to consolidate gradually, not a reason to add more raw values.

## Typography

Typography carries most of the hierarchy.

| Role | Current family | Current treatment |
|---|---|---|
| Body | `Inter` | Neutral, readable, antialiased, relaxed line height |
| Headings | `Space Grotesk` | Compact, geometric, bold enough to anchor sections |
| Code and technical metadata | `SF Mono`, `Monaco`, `Inconsolata`, `Roboto Mono`, or system monospace | Small, tabular, used for code, dates, and machine-shaped values |

Guidelines:

- Use one clear heading per page, then a small number of meaningful section headings.
- Keep body copy around the existing `16–17px` range with generous line height.
- Use uppercase, tracking, and small type for labels and section markers, not for paragraphs.
- Do not add a new display font for a single page.
- Keep technical values visually distinct, but do not turn every label into code typography.

Known implementation note: the Tailwind `font-mono` utility currently maps to `Space Grotesk`, while Markdown code uses a real monospace stack. Treat this as a cleanup seam; do not spread the inconsistency to new components.

## Layout and spacing

The public site uses a centered reading column and lets the content determine the page height.

- Public navigation: fixed top bar, `56px` on small screens and `64px` on larger screens.
- Public page shell: normally `max-w-3xl` with horizontal padding; About uses a narrower `max-w-2xl` reading column.
- Markdown content: approximately `720px`; academic project content may expand to approximately `860px`.
- Main content below navigation: reserve the existing top offset rather than letting the fixed bar cover the first heading.
- Use broad vertical rhythm between sections (`mb-12`, `mt-12`, `pt-8`, or the nearest existing scale).
- Use small gaps for metadata and controls; use larger gaps to separate ideas.
- Preserve mobile readability: horizontal navigation may scroll, grids collapse to one column, and images may use smaller radii.

Avoid:

- Full-bleed text blocks that destroy the reading column.
- Dense dashboard spacing on the public site.
- Arbitrary pixel values when an existing Tailwind spacing step expresses the same intent.
- A new layout width for every page.

## Component language

### Navigation

The public navigation is quiet and persistent: white with slight transparency and blur, a subtle bottom boundary, compact logo identity, and text links. Admin navigation is a fixed neutral sidebar with clear section labels and a mobile drawer.

### Content cards and lists

Public project cards are image-led but restrained: soft neutral placeholder, modest radius, low-contrast metadata, and blue hover emphasis on the title. Prefer a clean list or grid over a collection of floating cards with heavy shadows.

### Forms and controls

Admin controls use white fields, neutral borders, modest radii, visible focus treatment, and short transitions. Primary actions use dark neutral surfaces; destructive actions use red only when the consequence is destructive. Disabled controls must remain visibly disabled.

### Dialogs and feedback

Destructive dialogs are centered, explicit, and calm. Keep the warning, target name, consequence, and available action together. Preserve keyboard focus management and the `role="dialog"`, `aria-modal`, labelled title, and described message contract.

### Content rendering

Markdown is the site's editorial body. Preserve readable line length, strong heading rhythm, visible links, comfortable lists, restrained code blocks, and captions that support the work. Rich media may be interactive, but the text should still explain what the reader is seeing.

## Motion and interaction

Motion is functional and brief:

- Public page transition: about `240ms` with a small upward fade.
- Admin page transition: about `200–250ms` for fade, slide, or scale entry.
- Dialog entry: about `280ms` with a soft scale and vertical lift.
- Button press: a small scale-down only while enabled.
- Hover: change color, opacity, underline, or a very small lift; do not make content jump.

Respect reduced-motion preferences when adding new animation. Never make reading, navigation, or deletion depend on animation finishing.

## Imagery and expressive surfaces

- The 3D MPC scene owns the homepage's expressive motion, audio, model, and video assets.
- Project imagery should explain the project and preserve its original aspect ratio where possible.
- Use `public/content/projects/` for project media referenced by Markdown; use the existing public asset paths for MPC media.
- Do not add decorative stock imagery to fill empty space.
- Image captions should be specific enough to teach the reader something.

## Accessibility is part of the style

Quiet does not mean vague. New work must preserve:

- readable contrast for primary and supporting text;
- keyboard access for navigation, forms, dialogs, and custom controls;
- visible focus states;
- meaningful link text and image alt text;
- semantic headings in document order;
- labelled dialogs and controls;
- non-motion alternatives for essential information.

## Implementation sources

When changing the visual system, inspect these files first:

| Concern | Source of truth |
|---|---|
| Public base typography, Markdown, media, and progress/page motion | `src/index.css` |
| Public layout and navigation | `src/components/Layout.tsx`, `src/components/NavBar.tsx` |
| Public page composition | `src/pages/` |
| Admin controls, transitions, dialogs, and form primitives | `admin/src/index.css` |
| Shared utility typography and content scanning | `tailwind.config.js` |
| Visual regression context | `docs/codebase-map/index.html` and the running public/admin pages |

If a change introduces a new token or repeated visual rule, give that rule one owner before adding more copies.

## Review checklist

Before merging a visual change, ask:

- Does it still read as a calm research-and-creative portfolio?
- Does it use the existing type, neutral palette, spacing scale, and content widths?
- Is blue reserved for interaction and meaningful emphasis?
- Is motion short, purposeful, and safe to skip?
- Does the public/admin surface remain appropriate to its job?
- Are keyboard, focus, contrast, heading, and alt-text requirements intact?
- Did the change add a new raw color, font, radius, shadow, or animation without a documented owner?
- Does the changed page work at narrow and wide widths?

## Evolution log

- **2026-08-08 — Initial baseline:** documented the visual system already present in the public site and admin dashboard. This is a preservation contract, not a redesign.

## Open questions

- Should `font-mono` be corrected to a real monospace stack, or is its current Space Grotesk use intentional for metadata?
- Should public project cards eventually consume the same Markdown-backed project source as project detail pages?
- Which parts of the public and admin palette should become named CSS/Tailwind tokens instead of repeated utility classes?
