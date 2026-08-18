# Focus caption — grounded plan

> Generated: 2026-08-18 · Spec source: [`thoughts/2026-08-18-focus-caption.md`](../thoughts/2026-08-18-focus-caption.md) · Stage 1: fresh

**The design is settled — this plan does not re-open it.** Arrival is a sentence. A door exists
only where there is a work. MPC and mixer stay mute.

## Context

Flying already works. `LandingScene` holds `isCameraClose` from `CameraDirector` and fades the
whole text layer — header, keyboard hint, corner nav — when the camera is near. That layer is
the wrong place to put a caption: it disappears at the exact moment you arrive.

`FocusHandler` is `(target, distance, event) => void`. Click sites do not say *which* object
was flown to, so the overlay cannot choose a sentence. The two instruments and the desk must
keep flying as they do, without earning a caption.

The work is one route: `/projects/:slug` already exists (`fluebricks`). `navigate` already lives
on `LandingScene`. Blue is the site's interaction accent (`docs/core/site-style.md`).

The spec's intent in one sentence: remember the last portrait subject, show its one line when
the camera is close, and offer View project only on the FlueBricks pair.

## Resolved questions (from Stage 2)

| Question | User's answer |
|---|---|
| Where is the door? | A "View project" control under the caption, not a second 3D click |
| Paper and flute copy? | Two sentences, one shared door |

## Open questions (deferred)

Copy below is a starting draft. Tune by eye after it is on screen — do not block step 1 on
final wording.

## Approach

### 1. One owner for the sentences

New `src/components/landing/captions.ts`. Subject ids, the one line, and the optional route.
Nothing else imports a caption string.

```
mug        Coffee, still warm.
paper      FlueBricks, CHI '26.
flute      The kit that paper is about.
football   Size 5.
monitors   Tannoy Gold 5.
```

`paper` and `flute` share `href: '/projects/fluebricks'`. The others have none.

`FocusHandler` gains a subject: `'mug' | 'paper' | 'flute' | 'football' | 'monitors' | null`.
`null` means fly without a caption (MPC, mixer, desk). `requestFocus` passes it through.
LandingScene stores it; a desk click stores `null`.

*Verify:* `npx tsc --noEmit`. Nothing on screen yet.

### 2. The caption overlay

A sibling of the existing chrome overlay in `LandingScene`, not inside it. Inverse fade: when
`isCameraClose && caption`, opacity-100 and `pointer-events-auto` on the control; otherwise
opacity-0 and no hits.

Sits bottom-centre — the slot the keyboard hint vacates when the chrome recedes. One line in
the same mono/small voice as the keyboard hint. If `href` exists, a second line: `View project`,
blue, `navigate(href)`. 3D clicks never route.

Do not add Canvas `Text`. Do not caption MPC or mixer.

*Verify:* fly to mug → one line, no door. Fly to paper or flute → line plus View project, which
lands on `/projects/fluebricks`. Fly to MPC → no caption. Desk → caption gone. Chrome still
fades on closeness.

## Critical files

| File | Why it matters | Touched in step |
|---|---|---|
| **new** `src/components/landing/captions.ts` | Owns ids, lines, and the one href | 1 |
| `src/components/landing/CameraDirector.tsx` | `FocusHandler` / `requestFocus` take a subject | 1 |
| `src/components/landing/DeskGear.tsx` | Mug, paper, flute, monitors pass their id | 1 |
| `src/components/landing/Stage.tsx` | Football passes its id | 1 |
| `src/components/landing/Mpc.tsx` | Passes `null` (or omits) so it stays mute | 1 |
| `src/components/LandingScene.tsx` | Stores subject; inverse-fade overlay; `navigate` on the door | 2 |

## Single-source-of-truth owners

| Decision | Owner |
|---|---|
| Caption copy + which subjects have a door | `captions.ts` |
| Click → flight callback shape | `FocusHandler` on `CameraDirector.tsx` |
| Close/far boolean | `CameraDirector` → `isCameraClose` (do not invent a second distance watch) |
| FlueBricks route | `'/projects/fluebricks'` in `captions.ts`, matching `App.tsx` |

## Verification

1. Step 1 → `npx tsc --noEmit`
2. Step 2 → `npx tsc --noEmit`; hard-reload the landing:
   - mug / football / monitors: caption, no door
   - paper and flute: different lines, same View project, leaves `/` for `/projects/fluebricks`
   - MPC / mixer: no caption
   - desk: caption clears
   - chrome still fades when close

## Out of scope

- Rewriting the five lines until they have been seen
- Hover cursors
- Captioning the instruments
- A door on the mug, ball, or monitors
- Putting this on `plan.md` (`shape-align` has not triaged it)
