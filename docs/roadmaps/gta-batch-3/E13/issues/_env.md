## Environment (shared by every E13 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a42a54d20cca3057c` (Git Bash). Game:
  `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use absolute paths; `cd` resets between commands.
- Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed (no `npm install`).
- About 20 other workers edit other files of this repo at the same time: change only the files your issue lists. Never
  commit, never push, never run `git stash`, never `git checkout` a file.
- Line endings: files are LF. Edit existing files with the Edit tool (never `sed -i` on a whole file). New files: LF.
  JSON level documents keep their exact format (`JSON.stringify(doc, null, 2)` plus a trailing newline). Before finishing,
  `git diff --stat` on your files must show only the lines you meant to change.
- Checks: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (safe in parallel; another worker's half-done file may fail
  for a moment: rerun, and only fix errors in your own files), single tests `npx vitest run src/<path>.test.ts`. Do not run
  `vite build` or the full test suite. Do not start a dev server.
- The Rootwell contract is `games/gnome-theft-auto/src/campus/types.ts` (every place, id and size: `CAMPUS`,
  `CAMPUS_BUILDINGS`, `OBSERVATORY`, `ROOTWELL_FIELD`, `WIND_FARM`, `PINWHEEL_SIZE`, `ROOTWELL_ACH`, `ROOTWELL_QUESTS`,
  `ROOTWELL_SOUNDS`, `ROOTWELL_SAVE_KEY`, `RootwellPart`). Read it; never edit it (tell the lead in your report if it is
  wrong). Files under `src/campus/` you do not own are stubs or other workers' files: keep to their exported signatures.
- World coordinates: +x east, +z south (north is -z), metres. Yaw 0 faces +z; a facing vector is (sin yaw, cos yaw); a
  three.js object with `rotation.y = yaw` faces that way. A gnome is about 1 m tall. Ground height: `heightAt(x, z)` from
  `src/terrain.ts`.
- The place: **Rootwell**, the east band of the map (region `east-campus`, document `src/data/levels/east-campus.level.json`,
  origin (1150, 0): world (x, z) = local (x + 1150, z)). Rootwell University (site `campus`, flat ground, x 980..1300,
  z -350..-50) sits east of the `east-band-north` road (x ~945); the Anthill (site `observatory-mound`, a 45 m mound centred
  (1240, 150), radius 120) is south of it with the Anthill Observatory on its flattened summit and **Dean's Leap** (stunt
  ramp `deans-leap`) on its north rim; Rootwell Field (site `runway-2`, flat, x 1200..1380, z 370..830) is the second runway,
  north-south at x 1300; **Pinwheel Ridge** (site `wind-farm`, region `north-highlands`, origin (0, -1150)) is a ridge of ten
  giant garden pinwheels at x 715..985, z ~-1202.
- Repo rules: objects are `@lawn/prefabs` prefabs (never hand-built meshes for things you can see or pick up; plain boxes
  only for architecture, and flat decals); anything laid flat on the ground or another surface gets a draw layer
  (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`: `LAYER.area` for aprons/plazas/car parks, `LAYER.road` for
  paths/runways, `LAYER.marking` for painted lines, `LAYER.decal` for stains), each layer its own material, and boxes that
  touch must not share a face (no z-fighting). Mobile first (44 px touch targets, works at 390x844 portrait, no hover-only
  UI). No external assets. Short plain comments in the code's existing style. UI goes in its own container appended to the
  shared `#ui` element (never restyle or hide `#ui`).
- Scenery helpers (`src/homes/pieces.ts`): `buildPieces(scene, pieces: HomePiece[], name): Box[]` stands prefabs on the
  ground in one culled static batch and returns AABB colliders (push them into the `boxes` array you were given);
  `HomePiece { prefab, x, z, yaw, scale?, size?, solid?, y?, tint?, trim? }` (`size` scales so the longest side is that many
  metres; `solid` defaults to true for anything taller than 0.5 m; `y` lifts it); `prefabBox(id)` local bounds;
  `textPlate(text, x, y, z, yaw, { w, h, bg, fg })` a sign plane (mount it >= 0.03 m in front of what it hangs on; add it
  to the scene yourself); `litWindow(x, y, z, yaw, w, h)` a pane lit at night. A missing prefab id is skipped with a
  console warning (other workers add the E13 prefabs at the same time), so do not guard against it.
- Colliders: `Box { minX, maxX, minZ, maxZ, h }` (axis-aligned, `h` = top height in world y). Never put a collider on a
  mowable plant (flowers, little bushes; `src/flora/world.test.ts`), on a road or path, or in front of a door spot.
- Tone (lore, `docs/lore/`): satirical, dry, gnome-scale; nothing dies or is hurt (falls are tumbles). Rootwell names:
  the twelve buildings (The Long Shelf library, the Crucible Block labs, Tilth Hall lectures, Bedstraw House dorm, the
  Trencher refectory (the university's sugar is kept under it), the Cold Frame Club faculty club, the Cloche glasshouse,
  the Heap Barn mulch science, Bodger's Shed engineering, Wicket Lodge gate lodge, the Clod stadium, Plumbob Hall
  gnome physics) and the Dean's lodge; **Dean Lovage Inkwell** (smooth, well-meaning, gown, a ledger of late rent to the
  ants; signed the survey over to the HOA for a grant); **Professor Betony Sextant** (astronomer, quiet, very exact, coat
  with too many pockets; surveyed the stars for a perfectly level line); the **ants** are Rootwell's landlords, paid in
  sugar, never termites ("Not termites. Do not call them termites. They know."), and close their doors when the rent is
  late; they never speak. Rootwell Field belongs to the aeronautics department ("one working plane and four students").
  Pinwheel Ridge's pinwheels are giant red, yellow and blue garden pinwheels that light Turfton's lamps and neon (never
  engines); **Ragwort Coilspring** is its engineer (silver hard hat with a tiny pinwheel, grey overalls, goggles, a
  wrench, dry and deadpan, says "naturally"). The HOA (Vesper Thorne) re-cabled the Ridge; Wind-Sock Wally flies charters
  from the Desert Airfield.
- Environmental storytelling (acceptance criteria): each place shows at least three small readable vignettes (props
  arranged to tell a story without text), signs and posters with jokes that fit the place, and a resident seen doing
  something specific to the place.
