# Before you touch the 3D scene

> 2026-08-15 · **Status: in force** · Read this first if you are working on the homepage scene in a fresh session — the set of decisions and traps that are expensive to rediscover.

Read this first if you are working on the homepage scene in a fresh session. It is the set of
decisions and traps that are expensive to rediscover.

## What the scene is

A bedroom-recording desk — 宅錄, not a treated studio — floating in a soft near-white void with
no walls or floor edge, seen three-quarter from behind. The MPC on it is a real instrument: it
makes sound, responds to mouse and keyboard, and that is the point of the page.

Files: `src/components/landing/Stage.tsx` (void, desk), `DeskGear.tsx` (laptop, monitors,
Launchpad, cables, clutter), `Mpc.tsx` + `primitives.tsx` (the instrument), `scale.ts`
(dimensions), `LandingScene.tsx` (camera, lighting, overlay shell).

## Rules that are already decided

**Procedural only.** Every shape is authored as three.js primitives in TSX. Textures are
generated into a canvas at runtime. No downloaded models, no texture files, no HDRIs. An
attempt at a generated-mesh asset pipeline was made and abandoned — see
`2026-08-14-full-3d-room-postmortem.md`.

**The palette comes from `docs/core/site-style.md`, not from a photograph.** Near-white ground,
one dark surface (the desk top) carrying the site's ink tone, neutral greys everywhere else.
Blue stays reserved for interaction. The homepage is licensed to be the site's one expressive
surface, but it still has to belong to the same quiet editorial system as every other page.

**`scale.ts` owns dimensions.** The MPC is the anchor because its pads cannot shrink below a
comfortable click target; a sampler of its class is about 46 cm, which makes a scene unit about
5.1 cm. Write furniture and gear in centimetres through `cm()`. Before that module existed the
desk worked out to 15 cm tall and nobody noticed, because 2.94 units reads as a plausible
number and 15 cm does not.

**Order of work:** room and desk fixtures, then the MPC itself, then more gear. Each stage has
to read before the next starts.

## Traps, all of them paid for

**Bloom and ACES tone mapping are wrong here.** They are right on a dark neon scene and wrong
on a near-white one. Bloom triggers on bright pixels, and most of this frame already is bright,
so it hazes the whole page. ACES desaturates light surfaces into grey mud. The scene uses
`NeutralToneMapping` deliberately. The general rule, which is the most useful thing learned
from studying reference sites: **a technique is not good or bad on its own, it is good or bad
for a register.**

**drei's `<SoftShadows>` broke the MPC avatar completely.** It patches the shadow shader
globally and the avatar stopped rendering. Measured as avatar pixels going 2338 → 116 → 785
across before, with, and without. Use `PCFSoftShadowMap` on the Canvas instead; it is free and
touches no shaders.

**`<Environment preset="…">` fetches an HDRI from a third-party CDN at runtime.** It reads as
one harmless prop. It put raw.githack.com in the critical path of how the homepage is lit. The
scene now uses `<Environment>` with `<Lightformer>` children instead — a studio rig rendered
into a cube map at runtime, no fetch.

**Ambient light drowns everything.** It was at 1.05 and every surface read as flat paper. It is
at 0.32 now so the environment has room to do the shading.

**Converting dimensions without re-checking materials.** When the scene was rescaled to real
measurements, thin metal desk legs became near-invisible glass wireframes and the Launchpad's
grid texture was swallowed by its own chassis. Changing scale changes whether a material or a
texture plane still holds.

## What the reference sites actually do

`henryheffernan.com` and `jesse-zhou.com` were both studied in a headless browser.

Both build their look **offline in Blender and ship it as files**. Jesse Zhou's glTF contains
zero materials and zero images — bare geometry — with all lighting baked into KTX2 atlases;
about 9.2 MB of its 11.1 MB payload is assets. It is not bought, it is authored in a different
tool. The distinction that matters is not money, it is where the work happens: in a modelling
package and exported, versus in code and generated.

So their surface richness is not reachable from here, and chasing it is a mistake. What is
shared is structure — void, single vignette, gated entry, orbit — and we already have all of it.

What is worth taking, none of it needing assets: an entry sequence with character (both spend
real design effort there and it costs nothing but text and timing), navigation that lives inside
the scene rather than as HTML floating at the edge, and idle motion. Note that Jesse Zhou has
**no** idle camera drift — only an animated screen texture — so drifting the camera is a taste
choice, not a required technique.

Detail in `2026-08-15-producer-desk-layout.md` and the session's commit messages.

## The lighting decision

Baking ambient occlusion is the biggest remaining visual gain. A near-white scene has no value
contrast to read depth from, so crevices and contact points need darkening that no amount of
material tuning provides.

Decided approach: **bake it ourselves in Node with `three-mesh-bvh`**, not in Blender. The
scene definition stays in TypeScript in one place, the source of truth stays diffable, `cm()`
keeps working, and intermediate values can be printed and checked. Our geometry is boxes and
cylinders, so box-projected UVs are sufficient and the weak part of the JS ecosystem — real UV
unwrapping — never comes up.

This buys light, not shape. Better shapes need a person modelling with their eyes on the mesh;
no scripted pipeline substitutes for that.

## How to verify anything here

This is the discipline that cost the most to learn.

**Establish a control before concluding.** A measurement chain that has never been shown to
detect a change cannot be trusted to report its absence. Recolouring the desk to prove that a
material change shows up in a screenshot is what finally made the pad investigation tractable,
after a long stretch of confident wrong conclusions.

**Change one thing at a time.** Four changes landed together, the avatar vanished, and finding
the cause meant bisecting backwards through all of them.

**Headless is not the product.** This machine renders through swiftshader on a loaded CPU, and
it has produced convincing artefacts twice: pads that appeared to be missing entirely, and a
room that appeared to render nothing. Both were fine on real hardware. Check anything alarming
against a real browser before reporting it as a defect.

## Known broken right now

- Desk legs render as near-invisible glass wireframes.
- The Launchpad's grid texture is swallowed by its chassis at real scale.
- The plant kept pre-rescale coordinates and sits behind the desk.
- `npm run dev` shows an empty canvas — React StrictMode's double-mount breaks something in the
  scene. Production builds are fine; use `vite build` + `vite preview` to look at changes.
