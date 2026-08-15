# Baton

Branch `polish/landing-instrument` · HEAD `eaa8607` · 2026-08-15

## Goal

Polish the existing single-MPC homepage into a bedroom-recording desk vignette — the feeling of
looking over someone's shoulder at their workspace, henryheffernan.com's register with
virtual.bbcmic.ro's interactivity. Procedural three.js only: no downloaded models, textures or
HDRIs; canvas textures generated at runtime are fine. Site consistency is a standing constraint.

**Nothing is pushed, on the owner's instruction, until the scene is finished.**

## Done

The scene is rebuilt on real centimetres — the MPC's 46 cm is the anchor, so one scene unit is
about 5.11 cm, and every dimension goes through `cm()`. This exists because the desk was once
15 cm tall and nobody noticed, and it is the single most load-bearing decision here.

Desk in oak with a reconnected frame, no chair, no plant. Lit without any third-party asset.
Entry is a power-on check rather than a plain button.

The MPC was reshaped around the principle that at this size a machine is read by mass and light,
not detail — then repainted at the owner's direction into a milk-tea / minimal register. Pads now
sit a shade off the chassis cream, the grid is drawn entirely by the dark channels between them,
and colour lives only in the press. The screen is the one saturated thing on the machine.

The monitors were rebuilt from the Tannoy Gold 5 photograph that had been sitting unused in the
archived branch, rather than from recollection — which corrected the driver layout, the ring size
and what the panel below it actually is.

## Now

Making the monitors rounder. The cabinet is an extruded top-down profile so the upright corners
can roll further than the top and bottom; it is at a 3.2 cm upright roll against a 1 cm bevel.

**This is at its limit.** Rolling the uprights eats the flat front face, and it is now 12.6 cm
across against a 12.4 cm brass ring. The owner has said "not round enough" twice; the next
increment costs the ring its size, and that ring is the speaker's whole identity at this render
size. That trade is the open question, and it is the owner's to make.

## Open

- **Rounder monitors vs. a smaller brass ring.** Waiting on the owner. Nothing else blocks.
- **Camera distance.** A pad renders about 20 px. The whole MPC design was reasoned against a
  measured 35 px, and the machine now occupies about a sixth of the frame rather than a quarter.
  The design survived the shrink — which is what the principle predicted — but the number the
  document rests on is no longer true. Raised with the owner, not decided.
- **The monitors out-mass the hero.** They are the biggest, darkest objects in the frame and the
  MPC reads as a prop beside them. Composition problem, deferred to the gear stage.
- **Avatar behaviour.** Decided in the elicit, not built: breathing and weight-shift at rest,
  dancing only while something plays. He is the instrument's output, not a person in the room.
- **Ambient-occlusion bake.** `three-mesh-bvh` in Node is the chosen approach. Not started.
- **Diegetic navigation** — About / Projects / Blog / CV as objects in the scene. Proposed only.
- **`npm run dev` renders an empty canvas** (React StrictMode double-mount), verified at a clean
  HEAD with no local changes. Unfixed. Work around it with a build plus `vite preview`, not dev.

## Next

The owner's roadmap, in order: room and desk furniture ✓ → the MPC ✓ → **more gear**. The kit
still to place is the EP-133 K.O. II and the PX8 headphones on a stand. Do not push.

## Rejected — do not restart these

The largest single risk to whoever picks this up is mistaking an abandoned path for unfinished
work. These are closed:

- **A full inhabited 3D studio room.** Four fidelity rounds could not fix it, because the defect
  was silhouette, not materials. Archived at `8d6d1c5` and abandoned.
- **Generated 3D assets** via an image-to-mesh service. Two runs with different seeds and inputs
  both came out roughly five times too thick; prompting does not fix it.
- **drei `<SoftShadows>`.** Breaks the avatar — it patches the shadow shader globally. Bisected
  and measured. `PCFSoftShadowMap` is the answer.
- **`<Environment preset="city">`.** Fetches an HDRI from a third-party CDN. Replaced with
  `<Lightformer>` children building the cube map at runtime.
- **A two-ring pad well** (dark floor inside a pale rim). Does not fit: the pad grid clears the
  chassis edge by 1.5 cm. The cream chassis is the pale surround.
- **A speaker grille on the MPC's top deck.** Does not fit either — about 2 cm of front edge is
  left once the pad well and transport row have taken theirs. It is on the front vertical face.
- **Printed labels on the transport keys, and the PROFESSIONAL sub-line.** Ten pixels of mush.
  Status-light colour carries the transport instead.
- **Mid-warm and dark-roast pad palettes.** Both rendered, both shown, both rejected by the owner
  in favour of the palest of the three. Mid-warm additionally fell into the same value band as
  the oak desk and cost the machine its silhouette.
- **A separate tweeter above the woofer on the monitors.** That is the layout of nearly every
  other monitor and of no Tannoy, whose Dual Concentric driver puts the tweeter down the woofer's
  throat.
- **Physically accurate brass** at metalness 0.72. Metal takes its colour from what it reflects,
  and this scene is a white void with one small runtime environment map, so honest brass renders
  as a black ring. Low metalness with a lifted envMapIntensity is worse physics and correct
  pixels.
- **`RoundedBox` for the monitor cabinet.** It rolls all twelve edges by one radius, so more curve
  on the uprights ballooned the top into a pillow.

## One trap in the test rig

The headless renderer is software and draws roughly three frames a second, while a pad lights for
a tenth of one. A press therefore falls between frames every time and the screenshot shows
nothing — which looks exactly like a broken feature and is not. Verifying a press means raising
the release timeout temporarily, rebuilding, shooting, and putting it back. This has now produced
a false alarm twice in this project's history. Establish a control before concluding.
