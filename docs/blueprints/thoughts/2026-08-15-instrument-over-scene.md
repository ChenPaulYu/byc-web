# The homepage is an instrument, not a room

Converged 2026-08-15, after the owner judged that continuing to polish the 3D desk vignette was
not paying off — and that he did not think the current version added much.

## The principle

**The value is in how the instrument feels to play, not in how the scene looks. Effort goes to
responsiveness and aliveness. The scene is the setting, and it stops earning polish.**

The tell that ended the previous direction: four rounds spent on a monitor cabinet's corner
radius, which measures four pixels on screen. When the iteration granularity is finer than
anyone can perceive, the loop has stopped paying — and the fidelity being bought was invisible
anyway, since no visitor knows what a Tannoy Dual Concentric driver is.

## Decided

**The audio layer is hand-rolled on the raw Web Audio API.**

Tone.js goes. It costs 239 KB in its own vendor chunk loaded from the entry HTML, so every
visitor to every page pays for it, including someone who only came for the CV. We use nine
classes from it and ask very little of them.

**`audiorective` was considered seriously and declined.** Real project, MIT, five packages
(`core`, `react`, `threejs`, `clock`, plus a showroom). Three facts decided it. Its
`@audiorective/threejs` is spatial audio and engine glue rather than analyser-driven visuals, so
the part we actually want still gets wired by hand. Its `@audiorective/clock` solves scheduling —
transport, tempo, look-ahead tick windows — which is a problem this site does not have. And it
published `core` 2.1.0 on the same day its React binding still pinned `core` 2.0.0 exactly, two
days after first release, at zero stars; the API is visibly still moving. Carrying a dependency
that young to avoid roughly two hundred lines is paying risk for very little. The counter-case
was heard and belongs on the record: it has React bindings for exactly our stack, it ships a
Claude Code plugin, and being early to a well-shaped primitive library is its own kind of value.

**The latency is real, measurable, and the first thing to fix.** Tone.js defaults `lookAhead` to
0.1 s and adds it to `currentTime` for anything scheduled without an explicit time — which is
every trigger this site makes, and no `latencyHint` or `lookAhead` is set anywhere in the
project. The pad's visual flash is also 100 ms, so the sound arrives roughly as the light goes
out. Hand-rolling removes this by construction: `source.start()` with no argument is immediate.

**The avatar dances to the audio.** This closes the question left open by the MPC elicit — when
should he move. An `AnalyserNode` drives him, so energy decides whether and how hard. He is the
instrument's output, which is the same reason he stands on the machine rather than beside it.

**The scene can be alive before anyone touches it.** The entry ritual's POWER ON button is a user
gesture, which is precisely what browsers require before audio may start, so a quiet loop can
begin the moment a visitor enters and the analyser always has something to read. This corrects a
claim made earlier in the same conversation — that audio-reactive visuals would do nothing for
the visitors who never press a pad. They will.

## What the audio layer actually has to do

Five things, which is why the surface is small enough to own outright: play a sample on press
with no scheduling delay, hold one looping bed, run three effects (filter, distortion, reverb),
carry a volume stage, and expose an analyser. In raw Web Audio that is `AudioBufferSourceNode`,
`BiquadFilterNode`, `WaveShaperNode`, `ConvolverNode`, `GainNode`, `AnalyserNode`.

The reverb needs an impulse response, which gets synthesised from a decaying noise burst rather
than downloaded — the project's no-external-assets rule holds without exception.

The existing transport is not a sequencer and never was. It starts and stops a single synced
loop; that is `source.loop = true; source.start()`.

## Still open — this elicit converged on a sub-question, not the whole one

The question that opened it — what the homepage should actually be — is only partly answered.
The principle above says where effort goes. It does not yet say:

- **Whether the desk vignette survives at all**, or shrinks back to the instrument alone. The
  owner's phrasing was "the original 3D object", which reads as the MPC by itself, but he never
  said it and it was never put to him. Everything built this session — desk, monitors, laptop,
  Launchpad, mug, papers — is in scope for deletion and nothing is pushed, so it costs nothing.
- **Whether the camera comes in.** A pad renders at about 20 px, which is hard to hit with a
  mouse. If playability is the principle, the camera distance is now a consequence of it rather
  than a free choice — and pulling in would remove most of the vignette by itself.
- **Whether navigation belongs inside the scene.** Four text links in the corner is what the
  reference sites explicitly do not do. Raised, never decided.
