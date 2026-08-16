# Focus by flying, not by moding

> 2026-08-17 · **Status: in force** · Never take the camera away from the visitor — move it for them, and let the page recede instead.

Converged 2026-08-17, after zooming in far enough to work on an instrument turned out to break
the page, and not far enough to work on the instrument.

## The principle

**Never take the camera away from the visitor. Move it for them, and let the page recede
instead.**

Three separate forks were put up, and the same answer won all three: add a shortcut, or let
something get out of the way — never remove a freedom that already exists. The principle is the
pattern in those three answers rather than a rule anyone stated up front.

## The call

**Free orbit and zoom stay.** They were the obvious thing to constrain, and constraining them was
rejected: what the measurements actually showed is that the closest distance the visitor can
reach *already breaks the composition* and is *still not close enough to play*. A freedom that
fails at both ends is not protecting anything, but taking it away protects even less.

**The navigation retreats by distance, not by state.** Past a threshold the four corner links
fade out and come back when the camera pulls away. The reasoning that decided it: someone
examining an instrument is not, at that moment, looking for the About link. Its known weakness is
on the record — a visitor who only wanted a closer look, not to play, may read vanishing links as
controls being taken from them.

**Focus is a camera move, not a mode.** Clicking an instrument flies the camera to a working view
of it. That is the whole feature. There is no mode to be in, no state to track, no exit
affordance, and no rules that change while you are there — you keep orbiting and zooming from
wherever you land, and clicking the other instrument flies you there instead.

This one fell out of the first two rather than being decided independently. Once free orbit stays
and the navigation hides on distance rather than on state, a mode would have to take back the
freedom the first answer just kept, and the fade already happens for free when the camera
arrives close. The two earlier answers compose into the feature without anyone building a mode.

## How it shows up in the system

Each instrument needs one target camera position and a tween to it — the MPC and the Sidekick.
Whether those two share a derived rule or are placed by hand is an implementation detail, not a
design question, now that no mode hangs off them.

The navigation's fade is driven by camera distance, which `OrbitControls` already knows.
`minDistance` stays where it is; nothing is clamped.

Measured on 2026-08-16, and the reason this came up at all: at the closest allowed distance (24)
about 19,700 pixels of desk sit under the navigation column, and at 34 that is back to baseline.
A pad renders at roughly 20 px at the default framing, which is not a mouse target.

## What was rejected or deferred

**Constraining the zoom range** — the first fix attempted, and wrong in direction. The complaint
was that the instruments cannot be reached, so pulling the camera further away moves away from
what was asked for.

**A scrim or blur behind the navigation** — cheap and keeps everything, but it leaves the desk
visibly sliding beneath floating text, which reads as two unrelated layers rather than one scene.

**Capping the camera just short of collision** — freedom right up to the point where the page
breaks. Rejected with the zoom-constraint answer, for the same reason.

**A real focus mode** with constrained orbit and a back affordance. Rejected as taking back the
freedom the first answer kept. Its one advantage is acknowledged: without a mode there is no
"return to the overview" gesture, so a visitor who flies in and does not know how to orbit out
can feel stranded. A very light hint that appears only when close — the inverse of the navigation
fade — is the cheap mitigation if that turns out to bite.

**Whether navigation belongs inside the scene** is still open and untouched by this. The fade
moves one step toward it without committing.

**Evidence.** The two pixel measurements above, taken from renders at camera distances 24, 34 and
44. The principle it serves is [`2026-08-15-instrument-over-scene.md`](2026-08-15-instrument-over-scene.md).
