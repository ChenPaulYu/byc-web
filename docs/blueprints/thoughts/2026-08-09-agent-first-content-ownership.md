# Agent-first content ownership

> Role: Defines who owns website content authoring and what the admin surface is allowed to become.
> TL;DR: The agent and repository are the primary authoring path; the admin dashboard remains a narrow safety valve for small text edits and operational asset/config work, not a second full CMS.

## Decision

Agent-driven repository changes are the official content workflow. Markdown, frontmatter, JSON configuration, and Git history remain the canonical source of truth.

The admin dashboard stays available as a fallback for small, direct text edits and operational tasks such as uploading assets, editing configuration, and triggering deployment. It is a convenience and recovery surface, not a second authoring system that must match the agent workflow feature-for-feature.

## Consequences

- Do not migrate the content source to raw HTML merely to make admin editing easier.
- Prefer improving the admin's focused editing paths over expanding it into a full CMS.
- Preserve stable repository content contracts so an agent can inspect, edit, validate, and deploy changes end to end.
- Keep the current admin surface until usage shows which pages are genuinely needed; narrow it based on evidence rather than deleting it speculatively.
- The project index should still consume the same Markdown-backed source as project detail pages.

## Boundary

The agent owns broad changes, repeated edits, structural refactors, and content migrations. The admin owns quick corrections and operational actions when opening an agent session is unnecessary or inconvenient.
