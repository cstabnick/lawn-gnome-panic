## Environment (shared by every E16 issue)

- Worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a885cd4f6698e04c9` (Git Bash). Game:
  `games/gnome-theft-auto` (three.js + TypeScript + Vite). Use absolute paths; `cd` resets between commands.
- Node: if `node` is missing, `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed (no `npm install`).
- Up to 8 other workers edit other files of this repo at the same time: change only the files your issue lists. Never
  commit, never push, never run `git stash`, never `git checkout` a file.
- Line endings: files are LF (a few old files are CRLF: keep whatever the file has). Edit existing files with the Edit
  tool (never `sed -i` on a whole file). New files: LF. JSON level documents keep their exact format
  (`JSON.stringify(doc, null, 2)` plus a trailing newline). Before finishing, `git diff --stat` on your files must show
  only the lines you meant to change (no whole-file rewrites).
- Checks: `cd games/gnome-theft-auto && npx tsc --noEmit -p .` (safe in parallel; another worker's half-done file may fail
  for a moment: rerun, and only fix errors in your own files), single tests `npx vitest run src/<path>.test.ts`. Do not run
  `vite build` or the full test suite. Do not start a dev server.
- The contracts are `games/gnome-theft-auto/src/country/types.ts` (every countryside place, spot, id and size:
  `EVEN_ESTATES`, `VINEYARD`, `MANOR`, `CampDef`, `HerdDef`, `COUNTRY_ACH`, `COUNTRY_QUESTS`, `COUNTRY_SOUNDS`,
  `COUNTRY_SAVE_KEY`, `CountryPart`) and `games/gnome-theft-auto/src/farm/types.ts` (`CROPS`, `FARM`, `BEDS`, `BED`,
  `CROFT`, `FarmState`, `FarmEvent`). Read the one your issue names; never edit them (tell the lead in your report if
  something is wrong). Files under `src/country/` and `src/farm/` you do not own are stubs or other workers' files:
  keep to their exported signatures. `src/country/index.ts` (the lead's) already calls every module.
- World coordinates: +x east, +z south (north is -z), metres. Yaw 0 faces +z; a facing vector is (sin yaw, cos yaw); a
  three.js object with `rotation.y = yaw` faces that way. A gnome is about 1 m tall; a cow about 2 m. Ground height:
  `heightAt(x, z)` from `src/terrain.ts`.
- Repo rules: objects are `@lawn/prefabs` prefabs (never hand-built meshes for things you can see or pick up; plain boxes
  only for architecture and flat decals); anything laid flat on the ground or on another surface gets a draw layer
  (`flatLayer(material, LAYER.<x>)` from `@lawn/depth`: `LAYER.area` for yards/plazas, `LAYER.road` for paths and
  drives, `LAYER.marking` for painted lines, `LAYER.decal` for stains and wet soil), each layer its own material, and
  boxes that touch must not share a face (no z-fighting). Mobile first (44 px touch targets, works at 390x844 portrait,
  no hover-only UI; the touch action button shows the first word of any E prompt, so start prompts with a verb). No
  external assets. Short plain comments in the code's existing style. UI goes in its own container appended to the
  shared `#ui` element (never restyle or hide `#ui`).
- Scenery helpers (`src/homes/pieces.ts`): `buildPieces(scene, pieces: HomePiece[], name): Box[]` stands prefabs on the
  ground in one culled static batch and returns AABB colliders (push them into the `boxes` array you were given);
  `HomePiece { prefab, x, z, yaw, scale?, size?, solid?, y?, tint?, trim? }` (`size` scales so the longest side is that
  many metres; `solid` defaults to true for anything taller than 0.5 m; `y` lifts it above the ground);
  `prefabBox(id)` local bounds; `textPlate(text, x, y, z, yaw, { w, h, bg, fg })` a sign plane facing yaw (mount it
  >= 0.03 m in front of what it hangs on; add it to the scene yourself); `litWindow(x, y, z, yaw, w, h)` a pane lit at
  night. A missing prefab id is skipped with a console warning (other workers add the E16 prefabs at the same time), so
  do not guard against it.
- Colliders: `Box { minX, maxX, minZ, maxZ, h }` (axis-aligned, `h` = top height in WORLD y: when an issue says
  "h 2.4" it means 2.4 m tall, so write `h: heightAt(x, z) + 2.4`). Never put a collider on a
  mowable plant (flowers, little bushes; `src/flora/world.test.ts`), on a road or path, or in front of a door or gate.
- Moving people: `createAmbientGnomes(scene, defs)` (`src/ambientGnomes.ts`: standing gnomes with a speech bubble line
  and an idle animation id) and the walking-route pattern in `src/campus/life.ts` (a `makeGnome` model walked between
  waypoints, asleep while the player is far away). Sounds: `playAt(id, { x, z })` from `src/sound/bus.ts` with the ids in
  `COUNTRY_SOUNDS` (registered by another worker; an unknown id is silently skipped).
- Tone (lore, `docs/lore/`, follow `docs/lore/canon.md`): satirical, dry, gnome-scale; nothing dies or is hurt
  (a knocked-over animal gets up and runs off; falls are tumbles). Places and people:
  - **Thorne Even-Estates**: Vesper Thorne's HOA-approved beige housing on three sites at Turfton's edge. Every house the
    same height, colour and number of windows; finished houses stand empty ("they finish a house a day; I've never seen
    anybody move in"). Built by **Levelright Construction**: beige-and-pale-blue hoardings, a spirit level in every hat
    band, a night watch that does not sleep, motto painted on the cranes: "Level Is Kind." Foreman **Chard Levelright**:
    broad, patient, beige round hard hat with a pencil behind the brim, orange safety vest over a brown coat, thick grey
    beard, spirit level under one arm, slow flat gravelly voice, site words ("true", "plumb", "out of square"): "That
    wall is out of square. Everything else is fine." / "Nobody asked me who it was for." Lives in the site caravan at
    construction-1. Gnome-scale building: acorn-cap hard hats, a crane that lifts with a garden bucket, girders made of
    mushroom stems, bricks of fired clay.
  - **Trellisdown Vineyard**: old vines on a trellis hill, pressed each autumn into **grape-dew** (sweet, poured in
    thimble glasses at weddings; not Black Dew, runs no engine). Head gardener **Chicory Snips**: wiry, brown-handed,
    loyal to the vines before the family, burns frost-pots on cold nights, hates anyone walking on a row; lives in the
    gardener's lodge at the gate. The oldest vine (the Countess's first) grows by the press-house wall and is never
    harvested; every other vine is a cutting of it. One row grows crooked on purpose. Chicory presses the old way, bare
    feet in a clay trough; the brass-capped Brassknock bottles are the only part that is for show.
  - **Brassknock Manor**: a long, pale terraced mansion, a brass knocker the size of a mower wheel (nobody has used it
    since the charter was signed; everyone comes round the back), a terrace over the vines, a hall for tastings, seven
    chimneys of which the Countess lights one; most rooms are shut; a ledger room holds the family accounts, cheques
    to the HOA included. **Countess Wisteria Brassknock**: old money in a wide hat, owner of Trellisdown, secret backer
    of the HOA; "She smiles at everyone the same distance"; she has never been in a shop.
  - **Windfall Croft**: a small, run-down croft in Cloverfield the player can buy: a barn, a field, an orchard whose
    fruit keeps falling over the wall. "The last owner left and the apples stayed." "It's a bargain. The bargain is the
    weeds." Farmer **Bramble** (Granny Gnertrude's neighbour: low near-whisper, "Don't look up. Just listen.") knows
    who holds the deed.
  - **Hunters**: Tuft & Tally Lodge licence holders (Hazel Mattock's lodge in Mossy Wood). Hunting in Turfton knocks an
    animal over in a puff and combs a tuft from it; it gets up and runs off (R-021, R-049, R-141).
- Environmental storytelling (acceptance criteria): each place shows at least three small readable vignettes (props
  arranged to tell a story without text), signs and posters with jokes that fit the place, and a resident seen doing
  something specific to the place.
