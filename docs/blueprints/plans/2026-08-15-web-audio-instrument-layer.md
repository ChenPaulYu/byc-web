# Own the audio layer: raw Web Audio, and a scene that listens to it

Grounded 2026-08-15 against `polish/landing-instrument` @ `eaa8607`.
Decision and reasoning: [`thoughts/2026-08-15-instrument-over-scene.md`](../thoughts/2026-08-15-instrument-over-scene.md).
**The library choice is settled — this plan does not re-open it.**

## Why

The homepage's value is in how the instrument feels to play. Three things currently work against
that, and all three are in the audio layer rather than in the geometry:

1. **Every trigger is 100 ms late.** Tone.js defaults `lookAhead` to 0.1 s and adds it to
   `currentTime` for anything scheduled without an explicit time, which is every trigger this site
   makes; no `latencyHint` or `lookAhead` is set anywhere in the project. The pad's own flash is
   also 100 ms, so the sound lands as the light goes out.
2. **The four knobs are not connected to anything.** `knobValues` is read only by the `Knob`
   component that draws them and by the PREV/NEXT history. Nothing writes it into the audio graph.
   They are labelled Filter / Distortion / Reverb / Volume in a comment and they do nothing.
3. **The avatar dances unconditionally**, so motion carries no information.

And 239 KB of Tone.js loads from the entry HTML on every page, including pages with no audio.

## Critical files

| File | Role today | After |
|---|---|---|
| `src/components/landing/useMpcAudio.ts` | Owns the Tone graph, the config fetch, transport state and knob history. **Leaks the graph**: returns `effects: MutableRefObject<MpcEffects>` | Thin React wrapper over the new engine. Returns behaviour, not nodes |
| `src/components/landing/Mpc.tsx` | Reaches into `effects.current.players` to start a player, else falls back to the synth | Calls `triggerPad(key)` and knows nothing about the graph |
| `src/components/LandingScene.tsx` | Builds a `Tone.PolySynth`, calls `Tone.start()` in `handleEnter` | Calls `engine.resume()` in `handleEnter`, no synth here |
| `src/components/landing/primitives.tsx` | `Pad` animates colour/emissive; `AvatarModel` plays clip 0 unconditionally | `AvatarModel` takes its rate from audio level |
| `public/mpc.config.json` | `{ bpm, loop, pads }`, admin-written, with a hardcoded fallback in the hook | **Unchanged — this contract must survive** |
| `vite.config.ts` | Declares a `tone-vendor` manualChunk | That line goes with the dependency |

**Grounded facts the executor should not re-derive:** only `src/` imports `tone` (three files);
`admin/` and `server/` do not, so removal is clean. There are five `.wav` files in
`public/samples/`. The config assigns four pads, so **twelve of sixteen pads fall through to the
synth** — the synth is not optional. The existing "transport" is not a sequencer: it starts and
stops one synced loop and nothing else.

**`public/model.glb` contains exactly one animation clip, `Celebrating_Clean`. There is no idle
clip.** Anyone planning to crossfade between resting and dancing will go looking for one and not
find it. See step 5.

## Approach

Each step lands green on its own. Steps 1–4 are invisible to the user; the change in feel arrives
at step 4 and the change in behaviour at steps 5–6.

### 1. Build the engine beside the old one, wired to nothing

New subsystem `src/components/landing/audio/`, with a barrel per the repo's ≥3-file rule:

- `engine.ts` — owns the `AudioContext` (constructed with `latencyHint: 'interactive'`) and the
  whole node graph, in the order the Tone chain already uses:
  `source → BiquadFilterNode → WaveShaperNode → ConvolverNode → GainNode → AnalyserNode → destination`.
  This is the only module that knows what an `AudioNode` is.
- `impulse.ts` — synthesises the convolver's impulse response from a decaying noise burst. **No
  file is downloaded**; the project's no-external-assets rule holds without exception.
- `voice.ts` — the synth fallback for unassigned pads: `OscillatorNode` plus a gain envelope,
  matching the triangle/ADSR settings currently in `LandingScene.createSynth`.
- `samples.ts` — fetch and `decodeAudioData`, cached by filename.
- `index.ts` — barrel exporting the engine's interface only.

The engine's whole public surface: `resume()`, `triggerPad(key)`, `setParam(i, v)`,
`startBed()` / `stopBed()`, `getLevel()`. Nothing else escapes.

*Verify:* `npm run typecheck`, `npm test`, `npm run build`. Nothing renders differently yet.

### 2. Move `useMpcAudio` onto the engine, and stop leaking the graph

Keep `MpcAudioState`'s shape where callers depend on it, but **replace `effects` with
`triggerPad`**. Today `Mpc.tsx` reads `effects.current?.players?.loaded` and calls
`players.player(key).start()` — the audio graph's shape is known in two modules, which is the
leak that makes any change to one force a change in the other. After this step the component tree
cannot see a node.

The config fetch and its hardcoded fallback move across unchanged.

*Verify:* the four assigned pads still make their sounds; the other twelve still make synth
tones; PREV/NEXT still move the knob values.

### 3. Delete Tone.js

Remove the import from all three files, drop `tone` from `package.json`, and remove the
`tone-vendor` entry from `vite.config.ts` — an orphaned manualChunk name is a build warning.

*Verify:* `npm run build`, then confirm no `tone-vendor` chunk is emitted and the entry HTML no
longer references one.

### 4. Wire the knobs

Filter → cutoff, Distortion → drive, Reverb → wet mix, Volume → master gain, matching the labels
already in the code. **Map the ranges so no knob position sounds broken**: the filter's floor
stays well above muffled, and the distortion curve stays gentle at full. A knob that can ruin the
sound is worse than a knob that does nothing, because the visitor will assume the site is broken
rather than that they turned it too far.

*Verify:* drag each knob and hear it. This is the first step whose result is audible.

### 5. Drive the avatar from audio level

`getLevel()` returns a smoothed RMS in 0–1. With only one clip available, blending between rest
and dance is not on the table; drive the clip's `timeScale` from level instead — near-still at
silence, full speed at energy. A `Celebrating_Clean` loop at very low rate reads as swaying.

*Optional refinement, only if the near-still pose looks dead:* add procedural breathing on the
avatar's group (a small sine on position and rotation) and let the clip weight rise with level.
Cheap, procedural, no new asset.

*Verify:* by ear and eye, in a real browser. See the testing note below — the headless rig cannot
photograph this.

### 6. Start the bed on entry, and let STOP stop it

`handleEnter` already runs on the POWER ON click, which is the user gesture browsers require
before audio may start. Resume the context there and start the loop at a **low** gain, so the
analyser always has something to read and the scene moves for visitors who never press a pad.

The existing STOP transport button becomes the stop control — **no new UI**, per the decision that
the control lives in the scene rather than as a DOM overlay.

*Verify:* enter the page, touch nothing, and confirm the avatar is moving; press STOP and confirm
both the sound and the motion settle.

### 7. Give the engine a spectrum, not just a level

`getLevel()` answers "how loud", which is all the avatar needs. A screen needs "loud at which
frequencies". Add `getSpectrum(target: Uint8Array)` filling a caller-owned array from
`getByteFrequencyData`, so the caller controls allocation and the engine keeps returning no nodes.
The analyser's `fftSize` is 256, giving 128 bins — plenty for a 512 px-wide readout.

*Verify:* typecheck and build; nothing renders differently.

### 8. Make the MPC's screen a live readout instead of a video

The screen currently plays `/animation.mp4`, a 0.9 MB canned synthwave loop, through a
`VideoTexture` in `primitives.tsx`'s `VideoScreen`. Replace it with a `CanvasTexture` redrawn each
frame from `getSpectrum()`.

**Canvas rather than a shader, deliberately.** A shader would be cheaper per frame and is the
obvious choice for a spectrum alone. Canvas is chosen because the next thing this screen is likely
to carry is a menu — the four site sections, scrolled with a knob — and a shader cannot draw text.
Picking the cheaper option now would mean rewriting it then.

Three things fall out of this, which is why it is worth doing at all:

- **The 0.9 MB video asset is deleted**, on a homepage already carrying 8.5 MB of assets.
- The machine's only saturated element stops being decoration and becomes a **readout of what the
  visitor is doing**, which is the whole principle of this arc in one object.
- **The avatar finally makes sense.** He stands on the screen, and the screen now reacts to the
  same signal he does.

Keep the `VITE_ENABLE_VIDEO` escape hatch's intent: if audio is blocked or unavailable, the screen
must show something rather than going black.

*Verify:* in a real browser — play pads and watch the screen answer. The screenshot rig cannot
photograph this any better than it can photograph a lit pad.

## Verification

| Command | Gate |
|---|---|
| `npm run typecheck` | 0 errors |
| `npm test` | 22 pass |
| `npm run build` | succeeds, and no `tone-vendor` chunk after step 3 |
| Real browser | steps 4, 5 and 6 are audible/visible only here |

**A warning about the screenshot rig.** It renders in software at roughly three frames a second
while a pad lights for 100 ms, so a press falls between frames and photographs as nothing at all —
which looks exactly like a broken feature. This has produced two false alarms in this project
already. To photograph a lit pad, raise the release timeout temporarily, rebuild, shoot, and put
it back. **Establish a control before concluding anything is broken.**

Note also that `npm test` covers the admin dashboard only; there is no test touching the audio
layer, so every gate on steps 4–6 is a human one. Adding unit tests over `impulse.ts` and
`voice.ts` — both pure enough to test — is a reasonable extra if the executor wants a real gate.

## Found while reviewing step 1 — later steps must handle these

Step 1 landed green and inert, but the review of it surfaced four things the remaining steps
inherit. None of them block step 1, and none are visible while nothing imports the module.

- **The engine has no teardown, and it is a module singleton.** Once step 6 starts the bed,
  navigating away from the homepage inside the SPA will unmount the scene and leave the loop
  playing over `/about`. Step 6 owns stopping it — an effect cleanup that calls `stopBed()`, and
  probably `suspend()` on the context too.
- ~~**The bed's gain is fixed at 1 and cannot be set from outside.**~~ Closed. Splitting the graph
  into a pad channel and a bed channel for the Sidekick's faders gave the bed its own gain, which
  now starts at 0.3 — so the seam this asked for exists, and the "enters quietly" decision is
  implemented rather than merely recorded.
- **The analyser sits after the master gain**, so turning the volume knob to zero will freeze the
  avatar. That is arguably correct — silence should mean stillness — but a scene that goes dead
  when someone only wanted it quieter may read as broken. Decide in step 5; moving the analyser
  before the master gain is a one-line change if the answer is the other one.
- **The filter's floor is 200 Hz, and the knob's default value is 0.5**, which maps to 2 kHz. The
  moment step 4 wires the knobs, the site's default sound becomes noticeably dull. The mappings
  were explicitly delivered as placeholders; this is the specific number to fix.

One defect was fixed during review rather than deferred: `getLevel()` smoothed by a fixed fraction
per call, which is frame-rate dependent, and it mutated on read, so a second caller in the same
frame would get a different answer and double-advance the smoothing. It is now damped against
elapsed audio time and returns a stable value within a tick. This is the same bug class that once
left the pads unrenderable on a slow frame — worth remembering that it recurs in new costumes.

## Open questions

- **Does the bed want to fade in rather than start at once?** Entering to an immediate loop may
  feel abrupt after the power-on ritual. Not decided; a short ramp is trivial to add either way.
- **Should the pads also react to audio?** Named as desirable, never specified. Left out of the
  steps deliberately; the avatar is the one that answers a question we actually asked.

## Out of scope

The unresolved scene questions from the thought — whether the desk vignette survives, whether the
camera comes in, whether navigation moves into the scene — are **not** part of this plan and do
not block it. The audio layer is independent of all three.

Worth recording while it is in view, though not in scope: `public/model.glb` is **2.7 MB**, larger
than the entire three.js vendor chunk, and carries eleven textures. If page weight ever becomes
the subject, that file is the place to look, not Tone.js.
