# Portrait focus — grounded plan

> Generated: 2026-08-18 · Spec source: [`thoughts/2026-08-18-portrait-focus.md`](../thoughts/2026-08-18-portrait-focus.md) · Stage 1: fresh (no prior nav-audit)

**The design is settled — this plan does not re-open it.** Clicking anything on the portrait
flies the camera to a working look. No per-object minigames. The desk stays the fly-home click.

## Context

Focus already works for two machines. `CameraDirector` takes a world position and a distance,
keeps the current viewing angle, and tweens for 0.7 s. `LandingScene.focusOn` ignores a pointer
that moved more than 6 px, so an orbit that ends on an object does not launch a flight.
`shot.ts` derives those distances from subject width and occupancy: MPC fills a third of the
frame, the mixer uses a sparser 0.13 so a 8.8 cm slab does not dive under `minDistance` 12.

The rest of the portrait has no click handler. `DeskGear` already receives `onFocus` but only
the Sidekick uses it; `Clutter` (mug, preprint, flute) and `MonitorOnBooks` do not.
`Football` lives in `Stage.tsx`, which only has `onOverview` for the desk top. `FocusHandler` is
declared twice, once in `Mpc.tsx` and once in `DeskGear.tsx`.

The spec's intent in one sentence: every distinct portrait object becomes a third click target
of the same kind as the MPC and the mixer, with per-object distances owned by `shot.ts`.

## Resolved questions (from Stage 2)

| Question | User's answer |
|---|---|
| Does a preprint click also route to `/projects/fluebricks`? | This batch flies only. Navigation inside the scene stays open. |
| How close do portrait objects fly? | Per object, not one occupancy for all. |
| Two Tannoys: each, or the pair? | Clicking either flies to a shot that frames the pair. |

## Open questions (deferred)

None that block step 1. Occupancy numbers below are starting points; they are tuned in the
browser after the flights exist, not in this document.

## Approach

The flight machinery does not change. This work adds targets and distances, and puts a click
on each object that already exists.

### 1. Distances live in `shot.ts`, including the pair

Export one distance (and, for the monitors, one target) per portrait object. Reuse
`focusDistance(subjectWidth, occupancy)`. Do not invent a second flight system.

Starting occupancies, chosen so distance stays at or above 12, then tuned by eye:

| Object | Subject width | Occupancy (start) | Notes |
|---|---|---|---|
| Mug | `cm(REAL.mug.diameter)` | 0.14 | Same sparseness as the mixer; a 9 cm mug at MPC occupancy would land at ~5 |
| Preprint | `cm(21)` (A4 short side) | 0.25 | Fly-only; not a route |
| Flute | `cm(REAL.fluebricks.length)` | 0.20 | Length, not thickness — it is lying down |
| Football | `cm(REAL.football.diameter)` | 0.30 | Floor object; target is already `FOOTBALL` + radius |
| Monitor pair | `cm(104 + REAL.monitor.width)` | 0.48 | Span of the two cabinets at `x = ±cm(52)` |

Monitor pair **target** is one point, owned here, not `getWorldPosition` of whichever cabinet
was clicked:

```
[0, DESK_TOP_Y + cm(REAL.paperback.height) * 3 + cm(REAL.monitor.height) / 2, cm(-24)]
```

Mug target is the mug's visual centre (group origin on the desk plus `cm(REAL.mug.height) / 2`).
Paper, flute and football groups already sit at or next to their visual centre.

*Verify:* `npx tsc --noEmit`. Nothing moves on screen yet.

### 2. One `FocusHandler`, then the click sites

Move the duplicated `FocusHandler` type onto `CameraDirector.tsx` next to `FlightRequest` — that
is the flight contract. `Mpc.tsx` and `DeskGear.tsx` import it; delete the two copies.

Wire clicks. Same shape as the Sidekick: `stopPropagation`, pass `e.nativeEvent` so
`wasADrag` still holds, do not add a hover cursor (the instruments have none).

- **`MonitorOnBooks`** — both cabinets call `onFocus` with the pair target and pair distance
  from `shot.ts`. Clicking the left or the right is the same flight.
- **Mug, preprint, flute** — handlers on the existing groups in `Clutter`. Inner meshes do not
  need `stopPropagation`; they have no competing gesture.
- **Football** — `Stage` gains `onFocus` alongside `onOverview`. The football group calls it.
  The desk top keeps flying home.

`LandingScene` already passes `focusOn` into `DeskGear` and `Mpc`. It also passes `focusOn` into
`Stage` for the ball. The desk overview line stays as it is.

*Verify:* click mug, paper, flute, football, either monitor; each flight settles on the right
thing. Drag-orbit that ends on the mug must not fly. Click the desk, back to overview. Click the
paper, still on the homepage.

## Critical files

| File | Why it matters | Touched in step |
|---|---|---|
| `src/components/landing/shot.ts` | Owns authored distances; new occupancies and the monitor-pair target live here | 1 |
| `src/components/landing/CameraDirector.tsx` | Already the flight contract; becomes the owner of `FocusHandler` | 2 |
| `src/components/landing/Mpc.tsx` | Duplicate `FocusHandler`; switches to the import | 2 |
| `src/components/landing/DeskGear.tsx` | Sidekick already flies; monitors + Clutter gain the same handler | 2 |
| `src/components/landing/Stage.tsx` | Desk overview today; football click and `onFocus` prop | 2 |
| `src/components/LandingScene.tsx` | Passes `focusOn` into Stage | 2 |

## Single-source-of-truth owners

| Decision (the thing that changes as a unit) | Owner (where it lives) |
|---|---|
| Focus distance for any portrait object | `focusDistance` + named occupancy in `shot.ts` |
| Monitor-pair look target | `shot.ts` (not a cabinet's world position) |
| Click → flight callback shape | `FocusHandler` on `CameraDirector.tsx` |
| Drag-vs-click threshold (6 px) | `LandingScene.wasADrag` — do not copy |

## Verification

1. Step 1 → `npx tsc --noEmit`
2. Step 2 → `npx tsc --noEmit`; in the running site (`npm run dev`), hard-reload, then:
   - click each of: mug, preprint, flute, football, left monitor, right monitor
   - confirm left and right monitors settle on the same pair framing
   - orbit-drag that ends on the mug does not fly
   - desk click restores the overview
   - preprint click does not leave `/`

End-to-end: from the authored overview, every distinct portrait object is a focus target, and
the two machines plus the desk still behave as they do today.

The headless rig cannot photograph a 0.7 s tween (same limit as
[`2026-08-17-focus-by-flying.md`](2026-08-17-focus-by-flying.md)). Photograph the settled ends.

## Out of scope (deferred to other sessions)

- Routing the preprint into `/projects/fluebricks` (navigation-inside-the-scene, still open)
- Per-object minigames (rejected in the thought)
- Hover cursors (instruments have none)
- Books under the monitors as their own target
- Putting this on `plan.md` — `shape-align` has not triaged the thought yet
