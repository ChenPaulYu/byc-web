# Blue-hour studio corner — plan

> Generated: 2026-09-11 · Source: approved blue-hour-room mockup and explicit implementation request · Stage 1: current Stage, LandingScene, shot and equipment factories inspected.

## Context

The current homepage is an isolated desk in a pale void. Stage owns the physical desk/floor
datums; DeskGear and Mpc own the recognizable personal equipment. LandingScene composes
lighting and floating sketches. shot.ts frames the old desk, not room architecture.
The user approved the room mockup's cold window / warm task light, lived-in cutaway studio.
The generated picture is art direction, not a runtime asset or performance target.

## Resolved questions

- Implementation is explicitly authorized in the current branch. Preserve all equipment,
  original page typography/navigation, audio behavior and the user-owned avatar offset.
- Replace the floating sketch presentation with architecture; keep FlueBricks physical focus
  and its project link. Do not add tutorial controls or new mini-games.
- Use procedural geometry/materials for this first real-3D iteration. No external city photo,
  generated image backdrop, model downloads or paid asset pipeline.
- Existing room-abandonment notes remain useful lessons, but the user's new visual approval
  supersedes the earlier no-room direction. Match silhouette/composition before tiny details.

## Approach

1. Add a resource-owned room factory: cutaway plaster walls, open window with procedural
   blue-hour city texture, timber platform, rug, shelving, papers, chair, cables and task lamp.
   Merge static pieces by material to bound draw calls. Stage adopts it using existing datums.
2. Reframe desktop around the corner and portrait around the desk, keeping MPC scale unchanged.
   Use a restrained cold key/warm fill; remove continuous contact-shadow passes and floating
   sketches from the active composition. Keep physical object focus and pad behavior intact.
3. Verify geometry/disposal budgets, typecheck, tests, both builds, then a bounded muted Luna
   high browser pass: desktop scene, physical flute focus/Overview, mobile scene and pad input.
   Record screenshots, render counters and frame-time samples without claiming universal FPS.
4. Update this plan and its board item with actual results; never mark visual fidelity or
   performance accepted solely because the test suite is green.

## Critical files / owners

| File | Role |
|---|---|
| landing/room.ts | Room geometry, palette, envelope and static textures; no equipment copies |
| landing/room.test.ts | Geometry, resource ownership and budget checks |
| landing/Stage.tsx | Reuse desk/floor datums; compose room and existing desk/football |
| landing/shot.ts | Desktop room / portrait desk camera framing |
| LandingScene.tsx | Lighting and removal of floating-study composition |
| landing/captions.ts | Physical flute introduction instead of obsolete study copy |

## Verification

- npm run typecheck; npm test; npm run build; git diff --check.
- Room factory remains below 32 material batches and 25,000 triangles; resources dispose.
- Muted Luna browser, at most five planned interactions: enter, flute, Overview, mobile
  viewport, pad. Capture desktop/mobile screenshots and runtime errors; inspect actual scene.
- Compare rendered composition against the approved mockup, explicitly report any remaining
  gap. Frame samples are local observations, not a guarantee for the user's hardware.

## Out of scope

Changing other pages, replacing equipment/audio, importing generated art into production,
new navigation/game systems, claiming exact photorealism, deployment or commits.

## Approved window correction — 2026-09-11

- The city texture has zero depth and contradicts unrestricted orbit. Replace it with
  closed building volumes outside the physical window, at three different distances.
- Reuse the room's static batching and resource disposal. Add rooftop details and inset
  window surfaces; use progressively paler distant materials rather than a city billboard.
- Preserve free orbit, equipment, camera framing and audio. Local-time lighting is deferred.
- Verify finite geometry, exterior depth/clearance, two-sided ray intersections and the
  existing 32-batch / 25,000-triangle budget. Muted Luna pass: enter, two orbit drags,
  Overview; capture front and oblique views and runtime counters.

## Implementation and verification — 2026-09-11

- First real-3D iteration implemented. Static room: 15 material batches / 16,018 triangles.
  Existing equipment and audio remain; floating sketches and both continuous ContactShadows
  passes are removed from the active composition. The generated mockup is not a runtime asset.
- Typecheck and 33 tests passed. Public/admin builds passed; final visual corrections are
  being rebuilt before handoff. Existing chunk-size/Browserslist/gray-matter warnings remain.
- Muted Luna browser eventually reached the actual scene after initial launch timeouts.
  Desktop physical flute focus and Overview passed. Mobile fresh entry at 390×844 passed;
  all 16 pad centers were visible, MPC scale stayed [1,1,1], and no horizontal overflow.
  Browser runtime errors were empty; browser closed. Physical pad click was not exercised.
- Mobile-sized Apple M2 browser sample (180 frames): median 16.7 ms, p95 16.8 ms,
  0 frames above 33.3 ms; render snapshot 185 calls / 79,170 triangles / 256 meshes.
  This is a local sample, not real-phone testing or a controlled before/after performance claim.
- Visual review found over-tight desktop framing, harsh wall shadows and weak mobile text
  contrast. Corrected camera clearance, painted rear-wall lighting, softer PCF shadows and
  portrait text scrims. Also grounded the window tower silhouette. These final corrections
  are not covered by a fresh screenshot; keep visual acceptance open.
- Captured before the last corrections: /tmp/byc-room-final.png, /tmp/byc-room-mobile.png.
  Art direction is implemented as a first iteration, not claimed as a pixel match to the
  generated render. Next: confirm final framing/readability and actual pad input with the user.

## Window correction evidence — 2026-09-11

- Removed the city canvas and window-sized plane. Six closed buildings now occupy three
  depths, with near rooftops, tanks, balconies, AC units and window insets. Distant material
  colors supply atmospheric perspective without an enclosing sky wall or animated fog.
- Reused room.ts batching/disposal; no equipment, audio, orbit limits or framing changes.
  Final room budget: 19 material batches / 17,320 triangles; no exterior shadow casters.
- New window-clearance and closed-exterior tests failed against the billboard version and
  pass after replacement. Typecheck and all 34 tests passed before composition refinement;
  all four room tests passed again after reducing the neighborhood from 12 to six buildings.
- First muted Luna desktop pass: enter and two orbit drags, no console errors. Screenshots:
  /tmp/byc-exterior-front.png, /tmp/byc-exterior-oblique.png, /tmp/byc-exterior-outside.png.
  Parent visual review found the city too dominant and reduced its footprint/height, with
  pale unlit distant materials. These first screenshots are not the refined final version.
- First-pass local Apple M2 sample, 120 frames: median 16.7 ms, p95 16.8 ms, none above
  33.3 ms; render snapshot 255 calls / 85,100 triangles. Not a real-phone performance claim.
- Local-time lighting remains deferred. The cutaway is still a finite miniature, not a full
  navigable city; orbiting outside exposes real building roofs/backs rather than a picture.
- Refined final muted pass: fresh entry and approximately 30-degree orbit, runtime errors
  empty; parent inspected /tmp/byc-exterior-refined-front.png and
  /tmp/byc-exterior-refined-angle.png. Room dominance improved; geometry shifts relative to
  the window. Simplified distant silhouettes and the finite cutaway remain intentional,
  not claimed as photorealistic. User art-direction acceptance remains open.
- Production build was started but cancelled during transform after several minutes on the
  slow host (no build error reported). The current exterior production bundle is therefore
  not verified; the dev preview, geometry tests and browser evidence above are verified.
