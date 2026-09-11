# Inside the studio — implementation plan

> 2026-09-11 · Source: explicit approval to enter the room rather than orbit a cutaway.
> Grounded in room.ts, Stage.tsx, shot.ts, CameraDirector.tsx and LandingScene.tsx.

## Context and resolved decisions

The current exterior camera shows wall tops, a finite floor platform and detached neighboring
buildings against a white background. Adding objects cannot fix the observer's position.
The user approved an interior eye-level camera, enclosing architecture, look-around gestures
and window-only exterior views. This supersedes unrestricted exterior orbit for this experiment.
Implementation is authorized now, not a plan-only request.

## Approach

1. Keep measured equipment and the desk/floor datums. Complete the envelope with right/rear
   walls, ceiling and continuous floor. Extend the space behind the chair, add restrained door
   and wall detailing, keep the existing left window physically open. The scene background
   becomes blue-hour sky visible through the opening, not a white gallery surrounding a model.
2. Replace the external authored shot with a seated/standing interior vantage. Preserve the
   mobile MPC's real scale and use a closer portrait composition rather than shrinking it.
3. Add a small interior-camera policy module: room bounds, look rotation, bounded movement and
   constrained focus destinations. The first-person gesture controller owns DOM input and
   exposes target/update/start events to the existing CameraDirector flight/proximity seam.
   Drag turns the view without moving the eye. Wheel/pinch moves it within safe room bounds.
   No pointer lock, WASD tour, tutorial overlays or new dependencies.
4. Reuse CameraDirector for object focus, interruption and reduced-motion handling; constrain
   every flight endpoint and interpolated position. Preserve existing focus captions and game.
   Return to the exact interior shot via the existing Overview affordance/desk click.
5. Preserve header/navigation positions; add subtle contrast backing suitable for an immersive
   background. Keep an unobtrusive reset available after looking away from the desk.

## Owners and reuse

| File | Responsibility |
|---|---|
| landing/room.ts, room.test.ts | Closed room geometry, static batches, disposal |
| landing/Stage.tsx | Existing datums, room composition and sky background |
| landing/shot.ts | Initial desktop/mobile interior poses and focus sizing |
| landing/roomCamera.ts, roomCamera.test.ts | Pure bounded movement/look policy |
| landing/RoomControls.tsx | Pointer, pinch, wheel and keyboard look input |
| landing/CameraDirector.tsx | Existing flight/proximity lifecycle, now constrained |
| LandingScene.tsx | Compose controls, reset/game flights and overlay readability |

## Verification

- Geometry tests: room enclosure rays, window opening, batch/triangle/resource budgets.
- Camera tests: desktop/mobile positions inside, rotation leaves eye fixed, movement cannot
  cross the room envelope or desk working plane, focus endpoints remain inside.
- npm run typecheck; npm test; npm run build; git diff --check.
- Muted Luna high, bounded first pass: open, enter, drag, focus, reset. Capture interior and
  look-around screenshots, camera position, errors and local frame sample. Second bounded
  portrait pass if composition requires correction; parent owns visual review.
- No claim of photorealism, real-device FPS or complete collision physics. Inspect the actual
  rendered room, not just passing structural tests.

## Out of scope

Local-time lighting, other pages, replacing gear/audio, new games, external assets, commits,
deployment, general free-roaming/walking physics and a new navigation layout.

## Implementation and verification

### Wall and ceiling finishing

- Current control: the existing door-side wall rocker switches the ceiling diffuser and existing ambient/warm fill off/on. The user clarified that this physical button—not the lamp—was intended; direct diffuser clicks no longer toggle. Window daylight and desk lamp remain; defaults on for each room entry. Reuses the existing drag-vs-click guard, adds no tutorial, camera flight, frame loop or shadow map, and keeps room resources mounted.
- Wall-control correction adds a ray-hit regression: only the existing rocker/plate qualifies, never the diffuser or plaster. First browser attempt exposed the navigation container's empty third-width area intercepting the switch; pointer events now apply only to navigation buttons, preserving scene input behind blank space.
- Corrected wall-control verification passed: typecheck, 51 tests, public build and payload gate. Muted Luna confirmed canvas hit at the switch, diffuser 0 → 1, ambient 0.81 → 1.35, warm fill 0.2 → 0.8 and daylight fixed at 2.1; no runtime errors. Parent reviewed `/tmp/byc-wall-switch-off-final.png` and `/tmp/byc-wall-switch-on-final.png`. Initial JS unchanged; preview rebuilt.
- Toggle machine checks: typecheck, all 50 tests, public build and payload gate passed. Dedicated-material round-trip regression covers off/on without rebuilding geometry; initial JS remains 279,895 bytes.
- Muted Luna verified physical clicks toggle diffuser emissive intensity 1 → 0 → 1 without moving the camera; no runtime errors. Parent reviewed `/tmp/byc-ceiling-toggle-off.png` and `/tmp/byc-ceiling-toggle-on.png`. Production preview updated.
- Added two-step perimeter cornices, fine plaster-board joints, a shallow opal ceiling fixture, a backed ventilation grille, skirting caps, corner beads and a door-side rocker switch. `roomFinish.ts` appends low-poly geometry to the existing material batches; no additional real-time lights or shadow maps.
- Reduced plaster color-grain contrast and bump relief for a fine painted finish. Ceiling reuses the existing grain texture. Upper shelf lowered by 1.5 scene units after the upward screenshot exposed insufficient book headroom.
- Typecheck, the existing 48 tests and the new architectural-finish test passed. Room remains within its original budget: 26 batches / 23,992 triangles (+780). Muted Luna entry/upward screenshots reviewed; no runtime errors.
- Final upper-shelf clearance verified in `/tmp/byc-room-finish-ceiling-final.png`; overview evidence is `/tmp/byc-room-finish-overview.png`. Public preview rebuilt; initial JS remains 279,895 bytes. New ventilation/switch details were checked structurally, not in a separate rear-facing browser pass.

### Personal Taiwan flag and Builder wording

- Current direction: pinned matte cloth on the back wall near the window, above the left speaker. A compact two-column research-note cluster bridges the flag and right shelves; `wallDisplay.ts` owns their spacing. Static drape, woven print, stitched hem, two small pins and a soft local contact shadow replace the sticker's rigid border. Room lighting and measured desk equipment remain unchanged.
- Cloth/layout verification: typecheck and all 48 tests passed; final fold-geometry tests were rerun after material refinement. Public build and payload gate pass with initial JS unchanged at 279,895 bytes. Muted Luna verified the physical flag click and both caption lines with no runtime errors; parent reviewed `/tmp/byc-cloth-layout.png` and `/tmp/byc-cloth-caption.png`. No new frame loop, external texture or shadow map.
- Final crease refinement reviewed in `/tmp/byc-cloth-layout-final.png` after a separate muted entry pass; production preview rebuilt with the same initial payload.
- Prior sticker iteration: a 15 × 10 cm matte Taiwan wall sticker replaced the conspicuous tabletop flag. The user subsequently supplied a hanging-cloth reference and approved recomposing the whole wall rather than filling an isolated gap.
- Wall-sticker follow-up: typecheck, caption test, public build and payload gate passed (279,895 initial JS bytes). Muted Luna verified no desk flag, working wall-sticker click and no runtime errors; parent reviewed `/tmp/byc-taiwan-sticker-overview.png` and `/tmp/byc-taiwan-sticker-caption.png`.
- Clicking the physical flag reuses object focus and the existing caption: “Taiwan No. 1!” / “I’m from Taiwan.” No tutorial, persistent callout, animation loop or downloaded asset.
- Updated Creator to Builder across the welcome, room, fallback, About, configuration and page/share titles.
- Typecheck, the existing 45 tests and the new caption test passed. Initial production JavaScript remains 279,895 bytes.
- Muted Luna browser retry confirmed both caption lines and no runtime errors; parent reviewed `/tmp/byc-taiwan-flag-caption.png`. Moved the pole left after the first screenshot exposed monitor occlusion. Public preview rebuilt; not deployed.

### Taiwanese neighborhood refinement

- User requested that the buildings around 101 reflect the supplied Taipei photographs too.
  Replace uniform cool apartment skins with cream/terracotta small-tile facades, varied enclosed
  windows/grilles and window AC details. Near buildings gain stacked shallow balconies, green
  awnings/roof caps and ribbed rooftop water tanks; distant buildings reuse the fine glass map.
- Keep the existing closed building placement/height and 101 sightlines. No new downloaded
  assets, animations or shadow maps. Reuse static batches and existing texture generation.
- Typecheck, 45 tests, public build and payload/cycle gate pass, including mixed tile colors,
  roof depth and upper-101 sightlines. Room: 25 batches / 23,212 triangles, within existing caps.
  Initial JS remains 279,895 bytes. No real-device frame-rate improvement is claimed.
- Muted Luna window pass completed with no runtime errors; own session closed. Parent inspected
  /tmp/byc-taiwan-neighborhood.png against /tmp/byc-101-reference-final.png: cream and terracotta
  tiled apartments, balcony depth, awnings and water tanks are visible; distant glass blocks
  read differently from the older apartments. 101 crown/spire remain visible. Not deployed.

### Photo-grounded Taipei 101 correction

- Five user-supplied reference photographs supersede the rough landmark silhouette. Corrected
  the eight outward-flaring sections to taper overall, added a dedicated procedural teal-glass
  mullion map, slim corner ribs/joint ornaments, circular base medallions and a stepped crown.
  Keep closed geometry, daylight room and all equipment. Photos are reference
  only: no downloaded texture or photo billboard added.
- Typecheck, 44 tests, public build and payload/cycle gate pass; initial JS remains 279,895 bytes.
  Updated geometry test checks lower/upper tier widths and separate trim ownership. The first
  inspected window view exposed excessive neighbor/blind occlusion. Moved the landmark farther
  back and sideways to [-120, floor, -25]; new line-of-sight tests verify the upper body, crown
  and spire are not occluded along the tested interior sightlines. Final muted Luna window
  check passed with no runtime errors; parent inspected /tmp/byc-101-reference-final.png:
  substantially more stepped body and the complete crown/spire are visible, with the base
  still naturally occluded by neighbors. No claim of exact architectural reconstruction.
  Room budget: 23 material batches / 22,516 triangles. Own browser session closed.

### Approved daylight alignment

- User confirmed the loading improvement and requested a brighter room consistent with the
  rest of the site. Keep interior framing, gear, project links and intent-only scene loading.
- Reuse ROOM as the daylight palette/light-intensity owner. Neutral near-white plaster and
  linen, brighter hazy sky and lighter room joinery surround the unchanged walnut desk.
  Broader daylight and fill replace the yellow-lamp-dominant mood; no extra light/shadow pass,
  new texture asset, geometry or dependency. Keep the stable blue-hour-room object identifier.
- Restore dark editorial title/navigation with interaction-blue hover. Replace the dark
  perimeter scrim with a light text-protection gradient; keep original navigation placement.
- Existing site-style contract overrides generic UI recommendations. UI skill informed contrast
  and consistency; its recommendation scripts exited 137, so no generated design system was
  applied. React guidance preserved the existing lazy-loading boundary and static scene values.
- Typecheck, all 44 tests, public build and initial-payload/cycle gate pass: 279,895 initial JS
  bytes, unchanged. New palette test checks bright plaster/horizon and equipment contrast.
- Muted Luna production entry at 1440x900 and 390x844 passed with no runtime errors or horizontal
  overflow. Title/subtitle/navigation computed colors are #171717/#525252/#262626. Parent inspected
  /tmp/byc-daylight-desktop.png and /tmp/byc-daylight-mobile.png against the dark baseline: the
  room is visibly brighter, dark equipment remains distinct, and portrait MPC stays prominent.
  The light perimeter blends into editorial chrome; full real-device performance is not claimed.
  Browser session closed; no deployment. User art-direction acceptance remains open.

### Approved refinement and floating studies

- Additional approved refinement: replace the anonymous distant skyline focal point with a
  closed, low-poly Taipei 101 silhouette (eight flared sections, crown and spire), behind the
  existing neighborhood. Reference: https://www.taipei-101.com.tw/tw/concept/null. Keep this an
  art-directed Taipei view, not a geographically surveyed location.
- Improve material scale using repeatable neutral plaster/fabric relief and world-scaled wood
  UVs; soften oversized dark timber pores. Reuse static batches and procedural maps. Verify the
  existing geometry budget, landmark depth, types/tests and a bounded muted window screenshot.

- User accepted the interior direction and requested a more refined room/window view, then
  explicitly invited selected floating ideas back. Preserve camera, layout, equipment and audio.
- Grounded baseline: /tmp/byc-room-polish-before.png and /tmp/byc-room-window-before.png.
  Muted Luna entry/look now works; eye remains [7,8,21], runtime errors empty.
- Refine plaster/wood response, curtain folds, shelf/paper detail and building facades with
  deterministic owned textures and existing static batches. Retain real exterior depth; no
  city billboard, new shadow maps, live weather service or always-running decorative animation.
- Reuse SketchLayer: only one active study, shown on explicit physical-object focus. FlueBricks
  floats above its real counterpart; sound drawing accompanies instrument focus. Remove the
  full-floor drafting grid and persistent panels. Idle has no mounted study resources/loop.
- Verify geometry/material budgets, tests/types/build and a bounded muted after-pass: entry,
  flute focus, study interaction, reset. Preserve reduced-motion behavior and project link.

### Initial interior implementation evidence

- Interior framing, four-wall enclosure/ceiling, blue-hour sky, door and trim implemented.
  Existing physical equipment, audio, avatar offset, header/navigation positions preserved.
  Room budget: 20 material batches / 21,348 triangles, below the existing 32 / 25,000 caps.
- RoomControls replaces exterior orbit with fixed-eye look and bounded wheel/pinch approach.
  Pointer drags do not trigger object clicks; fader/knob dragging disables room input. Keyboard
  arrows provide a non-pointer look path. No pointer lock or visible tutorial was added.
- CameraDirector keeps the existing flight/cancellation/reduced-motion seam. Every endpoint
  and update is constrained. Explicit object focus clears page chrome even though the interior
  overview is already close. Reset restores the interior pose and viewport-specific FOV.
- Header/navigation positions and typography retained; light text and a dark contrast scrim
  replace dark text on the old white gallery background. React guidance kept pointer motion
  out of component state; UI guidance informed contrast and keyboard handling. The optional
  UI recommendation script was killed with exit 137; no generated design system was applied.
- npm run typecheck and all 39 tests passed. New tests cover enclosing surfaces, interior
  desktop/portrait shots, fixed-eye rotation, bounded approach and interpolated focus paths.
  The final FOV-reset field addition followed that run; git diff --check passed afterward.
- Visual verification NOT completed: two fresh Luna high sessions launched with --mute-audio
  failed to configure the browser (os error 35, resource temporarily unavailable, after about
  60 seconds each). No page actions or screenshots occurred. Own sessions were closed; other
  sessions were not touched. Intermediate doctor: 13 pass / 1 stale-state warning / 0 fail.
- Production build was not attempted during this host resource issue. Do not mark the feature
  visually accepted or production-verified. Next verification: desktop entry/look/focus/reset,
  portrait entry/pad input and wheel/pinch boundaries, then production build on a healthy host.

### Refinement verification (supersedes the initial host blocker)

- Follow-up decision: remove the floating FlueBricks from the live scene. Physical-flute focus
  now uses its normal desk target/distance and retains its project caption/link. The sound
  trace and room refinement remain unchanged; the experimental study implementation is dormant.

- Added owned plaster grain, wood normal/roughness response, folded linen curtains, distinct
  research sheets and detailed facade/light maps on closed exterior building volumes. Near,
  middle and far buildings retain actual depth; no exterior billboard or new shadow map.
  Room geometry now uses 21 material batches / 20,420 triangles, within the existing caps.
- Focus-only FlueBricks study reuses the physical modules and toggles assembly on click.
  Instrument focus mounts a live sound trace; idle/reset/game states unmount the study.
  No drafting floor, persistent panel or tutorial copy was added. Motion respects reduced motion.
- Final npm run typecheck, all 42 tests and npm run build passed (public and admin).
  Build retains the large-chunk warning. Tests cover material response, curtain depth and
  independent floating-module ownership/disposal in addition to enclosure/camera behavior.
- Muted Luna desktop baseline verified entry and fixed-eye look. The after-pass verified entry,
  physical-flute focus, floating assembly and Overview unmount; runtime errors were empty.
  Evidence: /tmp/byc-room-polish-after.png and /tmp/byc-room-study-after.png. Parent inspected
  both, then lifted the study and enlarged its label to reduce speaker overlap.
- Final muted desktop pass confirmed physical-flute focus after the positioning correction;
  runtime errors remained empty and the session was closed. Parent inspected
  /tmp/byc-room-study-final.png: floating modules now sit above the speaker rather than across
  its driver; the title remains a restrained secondary annotation.
- Current portrait composition, sound-trace browser interaction and real-device performance
  remain unverified. Do not infer those from geometry tests or desktop interaction success.
