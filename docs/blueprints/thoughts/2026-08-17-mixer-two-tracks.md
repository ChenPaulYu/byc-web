# The mixer is two faders over one performance

> 2026-08-17 · **Status: in force** · Pads you are playing against a bed that is already running. No ghost pads, and the mixer does not make its own sound.

Converged 2026-08-17, after the two-channel slab was on the desk but its interaction had not been
thought through — it has two tracks, and flying to it leaves the pads behind.

## The principle

**The mixer is two faders over one performance: pads you are playing (the keyboard counts,
including at the mixer) against a bed that is already running. It does not make its own sound,
and pads do not play themselves.**

## Decided

**Not a second instrument.** Force pad, knobs, CUE and FX stay scenery. This machine earned its
place by mixing the two channels the engine already has, not by adding a third voice.

**Channel 1 is pads, channel 2 is the bed.** That split was already wired (`setChannel(0|1)` in
`audio/engine.ts`). The elicit confirmed it rather than inventing it.

**No ghost pads.** Flying to the mixer must not start a pad loop. Sound without a player reads as
the machine performing by itself.

**Keyboard at the mixer counts as playing.** The bed is the floor; keys (and the distant MPC
lighting) are the hits you ride the faders against. A silent pad fader when nobody is hitting is
correct, not a bug.

## How it shows up in the system

The graph already matches: two channel strips into a shared filter / drive / reverb, faders on
the slab, `keydown` on `window` in `Mpc.tsx` so keys still fire after the camera has flown.
The mixer's LCD meters the two strips as separate LED columns — pad punches, bed breathes —
so a silent left column is readable as "nobody is hitting", not as a broken screen. The avatar
on the MPC listens to the same split: bed is the sway, a pad hit is a punch on the same clip.
