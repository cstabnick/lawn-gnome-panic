## Environment (shared by every E15 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a4e21ba147e1c7b8b` (Git Bash). Game:
  `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use absolute paths; `cd` resets between commands. If a shell
  command is refused as "too complex", split it into simple commands (one `cd` + one program) or write a small script file.
- Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"` (or call `"/c/Program Files/nodejs/npx"`).
  Dependencies are installed (no `npm install`).
- About 14 other workers edit other files of this repo at the same time: change only the files your issue lists. Never
  commit, never push, never run `git stash`.
- Line endings: some files are stored with CRLF, others with LF. Edit existing files with the Edit tool, never `sed -i`
  (it rewrites the whole file). New files: LF. Before finishing, `git diff --stat` on your files must show only the
  lines you meant to change (no whole-file rewrites).
- Checks: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (fast, safe in parallel; another worker's half-done file
  may fail for a moment: rerun, and only fix errors in your own files), single tests `npx vitest run src/golf/<file>.test.ts`.
  Do not run `vite build` or the full test suite. Do not start a dev server.
- **The contract is `games/gnome-theft-auto/src/golf/types.ts`** (places, holes, ids, the save/round/HUD/runtime types)
  and `src/golf/course.ts` (the golf frame). Read types.ts; never edit it or course.ts (tell the lead in your report if
  something is wrong). Files under `src/golf/` you do not own are stubs or other workers' files: import their exported
  functions and keep to their signatures. The golf maths is the package `@lawn/golf` (`packages/golf/src/`, read its
  `index.ts` exports and `README.md`): `simulateShot(env, start, shot, lie, wind, pin)`, `previewShot`, `swingTap`,
  `swingStep`, `scoreName`, `seededWindFrom`, `restingSpot`, `seaMowerCatch`, `estimateCarry`, `CLUBS`, `CLUB_ORDER`,
  `LIES`, `SWING`, `PHYS`.
- World coordinates: +x east, +z south (north is -z), metres. Yaw 0 faces +z; a facing vector is (sin yaw, cos yaw); a
  three.js object with `rotation.y = yaw` faces that way. A gnome is about 1 m tall; prefab unit 1 = one gnome's height.
- The place: **Hedgeworth Links**, a golf course in a neighbour's yard (E01 site `golf-yard`, x -1360..-1000,
  z 410..830, flat ground at y about -2.25; region `west-estates`, Trellisdown) west of the road `west-band-south`
  (x = -950). A Tall-One board fence (2.6 m) runs round it 1 m inside the site edge. On its east side are **the Kicked
  Board** (a loose board at (-1001, 640); you break through it with a vehicle or a kick, and it stays broken) and **the
  Members' Gate** (-1001, 500), always locked. Four holes on a loop, numbered 1, 2, 3 and 9 on the card ("a nine-hole
  course reads better on the mortgage papers"): 1 *The Mortgage* (par 4), 2 *Vesper's Patience* (par 3), 3 *The Long
  Week* (par 5, Hosepipe Pond on the dogleg), 9 *The Ninth* (par 4, beside Thrift's shed and the Kicked Board). The
  clubhouse (mock-Tudor, with a terrace, at the north-east), Basil's cottage by the first tee, Thrift's shed by the
  ninth green, a cart shelter with two golf carts. Big hedge walls (solid) with hedge arches, tall grass (mowable, you
  drive through it) and giant plants (no colliders: soft, you drive through them) line the holes. All positions:
  `golf/types.ts`.
- Scale: Hedgeworth is played in **gnome yards** (`YD` = 0.5 m): the HUD shows yards, a driver carries 205 gnome yards
  (102 m). `golf/course.ts` converts (`golfStart`, `golfToWorld`, `golfEnv`, `lieAtWorld`, `yardsBetween`).
- The people (docs/design/gnome-theft-auto/characters.md; looks in `HEDGEWORTH_CAST`): **Dame Peony Gravelrake**, the
  owner (tweed flat cap, waxed white handlebar beard, a driver for a cane; crisp, aristocratic, "my dear" when
  displeased; Vesper Thorne holds her mortgage; secret: she has not hit a ball in ten years because she cannot stand to
  lose). **Basil Divot**, the club pro (red argyle tam, yellow sweater vest, clean-shaven, two-tone shoes, a club under
  his arm; smooth, patronising, "champ", superstitious asides; hates moles; secret: a spare ball in his sock). **Thrift
  Hosepipe**, the groundskeeper (battered brown cap with a hosepipe band, mud-green overalls, grass in his beard, a
  watering can; gruff, slow, tender, talks to the grass; secret: he hides moles under the ninth green).
- Repo rules: objects are `@lawn/prefabs` prefabs (never hand-built meshes for things you can see or pick up; plain
  boxes only for architecture, and flat decals); anything laid flat on the ground or another surface gets a draw layer
  (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`), and boxes that touch must not share a face (no z-fighting);
  mobile first (44 px touch targets, works at 390x844 portrait and 844x390 landscape, safe-area insets, no hover-only
  UI); no external assets; short plain comments in the code's existing style; UI goes in its own container appended to
  the shared `#ui` element (never restyle or hide `#ui`).
- Tone (lore): satirical, dry, gnome-scale. Nothing dies or is hurt (rulings R-021, R-049): moles are friends in hiding,
  balls are "lost" and found again. Tall Ones are never seen; their things are huge. The Putting-Green Country Club in
  Patio Heights (Vesper's astroturf, silent carts) is a different, rival place.
- Environmental storytelling (acceptance criteria): each area (first tee and clubhouse, the course, the groundskeeper's
  shed, the broken fence) shows small readable vignettes (props arranged to tell a story without text), signs and
  posters with jokes that fit the place, and a resident seen doing something specific to the place.
