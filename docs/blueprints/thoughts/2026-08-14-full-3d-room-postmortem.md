# Postmortem — the full-3D landing room

> 2026-08-14 · **Status: in force** · The full-3D landing room is abandoned; the homepage returns to the single interactive MPC already on `main`, polished with procedural three.js geometry and supporting textures.

**Decided 2026-08-14: abandoned.** The homepage returns to the single interactive MPC that
already lives on `main`, polished with procedurally generated three.js geometry and supporting
textures. No room, no asset pipeline.

Full history, code and detailed plans are preserved on branch `experiment/homepage-core`
(commit `8d6d1c5`). This file keeps only what stays true regardless of direction.

## What was tried

An inhabited 3D studio room built from ~90 hand-placed `RoundedBox` and `cylinder` primitives,
then four rounds of materials, textures, lighting and camera work, then two fallback renderers
(an image-led DOM scene and a 2.5D hybrid), then a generated-asset pipeline via Higgsfield
`multi_image_to_3d`.

## What is worth remembering

**A silhouette problem cannot be fixed with materials.** Four fidelity rounds failed because
the room read as a blockout for reasons no amount of texture or lighting could touch. The eye
judges outline first. When something looks wrong and successive material passes do not move it,
suspect the geometry.

**Generated meshes get proportions wrong in a way prompting does not fix.** Two
`multi_image_to_3d` runs, different seeds, different input view sets — including an explicit
side elevation whose prompt stated the thinness constraint outright — both produced a mesh
about 5× too thick. The correction has to happen at load time as a non-uniform scale onto real
dimensions, not in the prompt.

**Asset size is dominated by texture resolution, not polygon count.** The raw MPC GLB was
7.6 MB: 6.9 MB of four 2048px maps against 730 KB of geometry, and 89 MB of GPU memory for one
device. Dropping textures to 512px took the optimised asset to 333 KB. Reach for texture size
before decimation.

**Readiness signals lie.** The Canvas reported `data-scene-state="ready"`, stamped
`sceneReady` on the element, and logged no errors — all while a fully transparent Canvas sat
over a backdrop illustration with nothing drawn. Every human judgement of "is the 3D any good"
made in the first seconds of a page load was partly aimed at the wrong picture. Mounting is not
drawing; under `frameloop="demand"` the only honest signal is a frame actually painted.

**A green gate that measures nothing is worse than no gate.** The first baseline screenshot
captured that unpainted state and passed four consecutive zero-diff runs — deterministic
because it was diffing a static image against itself. Stability is not evidence of coverage.

**Compound assertions must say which half failed.** An interaction check that could only report
`false` stayed broken for a long time without anyone noticing. Report the parts.

**Cost, measured.** Reference view via `nano_banana_pro`: 2 credits. One
`multi_image_to_3d` mesh: 30 credits, about 7 minutes. Five devices would have needed 150.

## What was carried forward

- `scripts/visual-gate/compare-baseline.mjs` — the perceptual image diff, unchanged and not
  3D-specific. Worth wiring up again for visual polish work, where the failure mode is
  precisely "it drifted and nobody noticed".
- These lessons.
