# byc-web — agent workflow

This repository is a personal portfolio website with a public React site, a browser-based admin dashboard, and a local Express API for content editing.

<!-- shape:dev-workflow start -->
## Dev workflow

This project is driven by the **shape / nav** skill workflow. The planning board lives in `docs/blueprints/`.

| You want to… | Verb |
|---|---|
| Decide what to work on next / refresh the board | `shape-align` → `docs/blueprints/plan.md` |
| See the board rendered visually | `shape-mockup` → an on-demand board snapshot |
| Scope a feature against the actual code | `nav-plan` → `docs/blueprints/plans/` |
| Implement a small decided change | `nav-do` |
| Drive the in-progress board to done | `shape-build` |
| Behaviour-preserving structural move | `nav-refactor` |
| Re-sync file-top headers after restructuring | `nav-sync` |
| Regenerate / render the repo map | `nav-map` → `docs/codebase-map/index.html` |
| Audit architecture | `nav-audit` |

**Standing pointers:** plan board = `docs/blueprints/plan.md` (agent and human — a visual view renders on demand via `shape-mockup`) · grounded plans = `docs/blueprints/plans/` · repo map = `docs/codebase-map/index.html`.

**Communication:** converse with the user in **Traditional Chinese (Taiwanese phrasing)**, plain and direct; keep code, identifiers, and commit messages in English.
<!-- shape:dev-workflow end -->

## Local commands

- `npm run dev` — public site at `http://localhost:3000`.
- `npm run admin` — admin dashboard at `http://localhost:3001` and local API at `http://localhost:3002`.
- `npm run build` — build the public site and admin dashboard.

Use the existing npm/Vite setup unless a documented decision changes it.

## Style contract

The visual language is documented in [`docs/core/site-style.md`](docs/core/site-style.md). Treat it as the review checklist for new pages, components, and visual refactors.
