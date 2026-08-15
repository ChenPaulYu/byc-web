# Baton

Branch `polish/landing-instrument` · HEAD `171f4b5` · 2026-08-16

## Goal

The homepage is an instrument, not a room. Effort goes into how it feels to play; the scene is
the setting and stops earning polish. Procedural three.js and raw Web Audio only — no downloaded
models, textures, HDRIs or impulse responses.

**Nothing has ever been pushed from this branch.** The live site is untouched at `origin/main`.

## Done

**The audio layer is ours.** Tone.js is gone — 239 KB that loaded from the entry HTML on every
page, including pages with no audio. Raw Web Audio in `landing/audio/`, behind a barrel that hands
out behaviour and never a node. Two channel strips (pads, bed) into a shared filter, drive and
reverb, with the reverb's impulse response synthesised from a decaying noise burst rather than
downloaded. Trigger latency is gone by construction: Tone defaulted to a 100 ms lookahead, which
was exactly as long as the pad's flash, so the sound used to arrive as the light went out.

**Everything that was decorative now does something.** The four knobs were connected to nothing at
all; they are filter, drive, reverb and volume now, calibrated so no position sounds broken. The
Sidekick's two faders are the two channels. Its display and the MPC's screen both read the audio —
the MPC's replaced a 0.9 MB video loop with a live spectrum. The avatar takes his rate from the
level, and drive and reverb reach him as shake and halo.

**The scene was cut back and rebuilt.** Laptop and Launchpad gone with everything that existed
only for them. Desk in walnut on a black steel frame, its wood generated from one height field so
colour, relief and roughness cannot drift apart. Monitors are Tannoy Gold 5s built from the
product photograph. The MPC has timber end cheeks.

## Now

Nothing in flight. The grounded plan
(`plans/2026-08-15-web-audio-instrument-layer.md`) is complete — all eight steps, plus the two
open items it recorded along the way.

## Open

- **Is the desk vignette the right frame at all?** Never decided. The instrument-only alternative
  was rendered once and looked strong: a pad goes from 20 px to about 60, which is the difference
  between a click target and a decoration. Deleting the desk still costs nothing.
- **Navigation is still four text links in a corner** — the one thing both reference sites
  explicitly do not do. The MPC's screen is now a canvas rather than a shader *specifically* so it
  can carry a menu scrolled with a knob that already exists. That was the reason for the more
  expensive choice, and it has not been taken up.
- **The Sidekick's orange** is the only colour in the frame besides the two screens. Justified now
  that its display responds to the music, but it sits opposite the MPC and still pulls the eye.
- **Ambient-occlusion bake** with `three-mesh-bvh` in Node. Chosen approach, not started.
- **`npm run dev` renders an empty canvas** (React StrictMode double-mount), verified at a clean
  HEAD. Unfixed. Work around it with a build plus `vite preview`.
- `public/model.glb` is **2.7 MB**, larger than the whole three.js vendor chunk, and carries eleven
  textures. If page weight ever becomes the subject, that file is the place to look.

## Next

The owner's roadmap has the remaining kit as the EP-133 K.O. II and the PX8 headphones on a stand.
Weigh that against the open question above first — more objects is the move the governing
principle argues against, and the Sidekick only earned its place by being wired to the audio.

## Rejected — do not restart these

- **A full inhabited 3D studio room** (archived at `8d6d1c5`) and **generated 3D assets**; the
  meshes came out ~5× too thick across two runs and prompting does not fix it.
- **Tone.js and `audiorective`.** The library question is settled in
  `thoughts/2026-08-15-instrument-over-scene.md`; do not re-open it.
- **A paler or greyer desk.** Measured: the MPC separated from the old light oak by sixteen points
  of luminance out of 255, almost entirely in the blue channel. Paler closes that gap and greyer
  removes the hue difference carrying it. Walnut gives seventy-eight.
- **Wooden desk legs**, for the same reason — one continuous warm mass eats the separation.
- **Cheeks in the desk's own timber**, likewise: they would hand two of the machine's edges back
  to the background. They are a paler ash on purpose.
- **drei `<SoftShadows>`** (breaks the avatar) and **`<Environment preset="city">`** (fetches an
  HDRI from a third-party CDN).
- **A two-ring pad well**, a **grille on the MPC's top deck**, a **fifth large knob**, **printed
  labels on anything**, and the **knobs' tick rings** — all of them either did not fit or rendered
  as mush.
- **Easing the avatar into view.** Reads as inflating. He is switched on, not grown.

## Two traps in the tooling

**The headless renderer draws about one frame a second.** A pad lights for 100 ms, so a press
falls between frames and photographs as nothing at all, which looks exactly like a broken feature.
To photograph a transient, hold it open in a scratch build.

**Confirm coordinates before trusting a pixel measurement.** This cost three wrong conclusions in
one session: a diff window that caught the MPC's pads and read as a pass, the same window narrowed
until it excluded the subject entirely and read as a failure, and a drag that missed a control by
five pixels and read as a dead control. Painting the target a solid colour and locating it, or
instrumenting the value in the page, settles it in one run.
