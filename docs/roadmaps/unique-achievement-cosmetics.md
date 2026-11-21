# Unique achievement cosmetics

Goal: every gear reward and every emote reward belongs to one achievement, so no two achievements look the same, and
the hard ones keep their items to themselves (`exclusive: true`, shown as RARE). Plus: character-creation guidance that
helps a player's gnome stand out. Inventory: `docs/cosmetics.md`.

Shape:

| Epic | Done when | Issues |
|---|---|---|
| 1 (lead, done before this roadmap ran) | `AchievementReward.exclusive` exists; empty catalog files `cosmetics-head-a/-b`, `cosmetics-neck`, `cosmetics-back` are wired into `packages/prefabs/src/catalog/index.ts` | (lead) |
| 2 | Every new prefab passes `npm test -w packages/prefabs`; the emote pair passes `npm test -w packages/emotes` (poses); creator and toast build | 6 |
| 3 (lead) | `packages/achievements/src/catalog.ts` points each achievement at its own item; the full test suites and the creator build pass; PR | - |

Epic 2 issues do not depend on each other. They edit different files.

Environment for every issue: working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\kingfish` (a git
worktree; run every command from there). If `node` or `npm` is not found in Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`.
Dependencies are installed: do not run `npm install`. Do not run `git commit`. Other workers are editing other files at
the same time: edit only the files your issue names.

~~~~text
Epic: 2 (Issue 1 of 6): new head-slot hats, set A

Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\kingfish`. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not npm install. Do not git commit. Other workers are editing cosmetics-head-b.ts, cosmetics-neck.ts, cosmetics-back.ts and the emotes package at the same time: edit only the one file named below. The repo's prefab rules are in docs/roadmaps/prefab-library/_common.md: read it first and follow it (units, grounding, examine voice, data rules, checks).

## Goal
Six new hat prefabs for six achievements, in packages/prefabs/src/catalog/cosmetics-head-a.ts. The file exists with an empty `export const COSMETICS_HEAD_A: PrefabDef[] = [ ];` and is already wired into the catalog.

## Read first
- docs/roadmaps/prefab-library/_common.md: all the rules.
- packages/prefabs/src/types.ts: PrefabDef, Part, the Use type (`wear-head`), `wear`.
- packages/prefabs/src/catalog/armor.ts: bucket-helm, pointy-hat, mushroom-hood. Hats: the brim or base sits on the ground at y = 0 and the dome rises above it. Copy their style.
- packages/prefabs/src/catalog/gta-story.ts: tinfoil-brim and microfiber-bowler (a hat with a rim, a band and a pin).
- Lore: run `npm run lore -- find hat` and `npm run lore -- find snigms` (and `gta`, `kitchen`, `billiards`) before you write names or examine lines. Follow docs/lore/canon.md. Use the gnome-world voice of the examine rules.

## Change
Add these six PrefabDef entries to COSMETICS_HEAD_A (keep the export name). Every one: `category: 'armor'`, `uses: ['wear-head']`, `emoji: []` (so it never takes over an emoji item), `tags` including 'head', 'reward' and the nouns from the name. Give each a one-line `about` and 5 examine lines (5 to 6, each under 160 characters, all different). Keep parts to 3-15, `seg` 4-12, and place the base on the ground at y = 0 (a hat sits on a table, not in a head).

| id | name | the achievement it serves (title: description) | visual brief |
|---|---|---|---|
| tally-stick-cap | Tally-Stick Cap | Snigms "One Week In": Reach day 8 with your gnome still standing. | A plain cap with a band of seven notched tally sticks tied around the crown. |
| wiseguy-fedora | Wiseguy Fedora | GTA "Made Gnome": Finish your first contract for Don Compost. | A dark fedora: a narrow curled brim, a dented crown and a dark ribbon band. |
| chalk-cap | Chalk-Dusted Cap | Billiards "Break Dancer": Pot three or more balls on your opening break. | A flat pool-hall cap with a short peak and a white chalk smudge on the crown. |
| flower-wreath | Full House Wreath | Snigms "Living the Dream": Have all five needs at 90 or more at the same time. | A ring of small clay flowers (use 'glow' only on the centre bead) sitting on the head, with leaves. |
| baker-toque | Baker's Toque | Cooking Gnoma "First Bake": Finish your first acorn cake. | A tall pleated white toque with a flat top, a flour dusting and a small pleat line. |
| aviator-cap | Aviator Cap | GTA "Wheels Up": Take off in the Crop Duster at the Dust Flats airfield. | A leather flying cap with two earflaps tied under the chin and a short peak. NO goggles (flight-goggles is another item). |

## Contract
- Export: `COSMETICS_HEAD_A: PrefabDef[]` from packages/prefabs/src/catalog/cosmetics-head-a.ts (unchanged name; the index already spreads it).
- The ids above, verbatim. The achievements catalog (lead) uses these exact ids and the names above.
- Do not change any other file. Do not reuse an id that already exists: run `grep -rn "id: 'tally-stick-cap'" packages/prefabs/src/catalog` (and the same for each id) before writing.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in cosmetics-head-a.ts.
- `npm test -w packages/prefabs` passes for every test whose name contains one of the six ids (run it and filter the output for the ids: `npm test -w packages/prefabs 2>&1 | grep -E "tally-stick|wiseguy|chalk-cap|flower-wreath|baker-toque|aviator-cap"`; a failing test for another worker's file is not your problem).
- Each of the six has `uses` containing 'wear-head' (the achievement test checks it).

## Out of scope
packages/prefabs/src/types.ts, palette.ts, index.ts, catalog/index.ts, catalog.test.ts, cosmetics-head-b.ts, cosmetics-neck.ts, cosmetics-back.ts, every other catalog file, packages/achievements, packages/gnome, games/.
~~~~

~~~~text
Epic: 2 (Issue 2 of 6): new head-slot hats, set B

Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\kingfish`. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not npm install. Do not git commit. Other workers are editing cosmetics-head-a.ts, cosmetics-neck.ts, cosmetics-back.ts and the emotes package at the same time: edit only the one file named below. The repo's prefab rules are in docs/roadmaps/prefab-library/_common.md: read it first and follow it (units, grounding, examine voice, data rules, checks).

## Goal
Five new head-slot prefabs for five achievements, in packages/prefabs/src/catalog/cosmetics-head-b.ts. The file exists with an empty `export const COSMETICS_HEAD_B: PrefabDef[] = [ ];` and is already wired into the catalog.

## Read first
- docs/roadmaps/prefab-library/_common.md: all the rules.
- packages/prefabs/src/types.ts: PrefabDef, Part, the Use type (`wear-head`).
- packages/prefabs/src/catalog/armor.ts: bucket-helm, pointy-hat, thimble-helm. Hats: base on the ground at y = 0.
- packages/prefabs/src/catalog/gta-story.ts: microfiber-bowler (the rim, band and pin pattern).
- Lore: run `npm run lore -- find hat`, `npm run lore -- find snigms`, `npm run lore -- find gnomillion` and `npm run lore -- find gnome` before writing names or examine lines. Follow docs/lore/canon.md.

## Change
Add these five PrefabDef entries to COSMETICS_HEAD_B. Every one: `category: 'armor'`, `uses: ['wear-head']`, `emoji: []`, `tags` including 'head', 'reward' and the nouns from the name. One-line `about`, 5 examine lines (each under 160 characters, all different). 3-15 parts, `seg` 4-12, base on the ground at y = 0.

| id | name | the achievement it serves (title: description) | visual brief |
|---|---|---|---|
| brick-beret | Brick Beret | Snigms "Brick by Brick": Build your first wall. | A flat rust-red beret with a small brick-pattern stud on the side. |
| megaphone-cap | Megaphone Cap | Once in a Gnomillion "Lone Voice": Earn the One in a Gnomillion tier in 3 rounds. | A round peaked cap with a tiny brass megaphone clipped to the front of the band. |
| foreman-hard-hat | Foreman's Hard Hat | Snigms "Top of the Ladder": Get promoted at work. | A white hard hat with a dome and a wide brim, with a gold stripe around the crown. |
| party-hat | Singed Party Hat | GTA "Barbecue": Blow up a vehicle with gunfire. | A tall striped cone hat with its tip burnt black and a few ember dots (use 'glow' only on the embers). |
| letter-crown | Letter Crown | Wordle (the answer is gnome) "Genius": Guess GNOME on the first try. | A band of five small square letter tiles spelling G N O M E around the head, each tile a cream block with a dark letter-shaped inset. |

## Contract
- Export: `COSMETICS_HEAD_B: PrefabDef[]` from packages/prefabs/src/catalog/cosmetics-head-b.ts (unchanged name; the index already spreads it).
- The ids above, verbatim. The achievements catalog (lead) uses these exact ids and the names above.
- Do not change any other file. Do not reuse an id that already exists: run `grep -rn "id: 'party-hat'" packages/prefabs/src/catalog` (and the same for each id) before writing.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in cosmetics-head-b.ts.
- `npm test -w packages/prefabs 2>&1 | grep -E "brick-beret|megaphone-cap|foreman-hard-hat|party-hat|letter-crown"` shows the five ids passing (a failing test for another worker's file is not your problem).
- Each of the five has `uses` containing 'wear-head'.

## Out of scope
packages/prefabs/src/types.ts, palette.ts, index.ts, catalog/index.ts, catalog.test.ts, cosmetics-head-a.ts, cosmetics-neck.ts, cosmetics-back.ts, every other catalog file, packages/achievements, packages/gnome, games/.
~~~~

~~~~text
Epic: 2 (Issue 3 of 6): new neck-slot charms and collars

Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\kingfish`. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not npm install. Do not git commit. Other workers are editing cosmetics-head-a.ts, cosmetics-head-b.ts, cosmetics-back.ts and the emotes package at the same time: edit only the one file named below. The repo's prefab rules are in docs/roadmaps/prefab-library/_common.md: read it first and follow it.

## Goal
Ten new neck-slot prefabs, one for each of ten achievements, in packages/prefabs/src/catalog/cosmetics-neck.ts. The file exists with an empty `export const COSMETICS_NECK: PrefabDef[] = [ ];` and is already wired into the catalog.

## Read first
- docs/roadmaps/prefab-library/_common.md: all the rules.
- packages/prefabs/src/catalog/gta-story.ts: stopping-stone-charm. The neck pattern: a gold ring laid flat (`rot: [90, 0, 0]`) under the chin with the pendant hanging forward at +z. Its comment says the pendant "stays well clear of HEAD & FACE".
- packages/prefabs/src/catalog/armor.ts: caddie-towel and wool-scarf. packages/prefabs/src/catalog/trinkets.ts: honeycomb-charm, name-tag, ace-medallion (charms on cords).
- packages/gnome/src/anatomy.ts: the head sphere (center [0, 0.8, 0], radius 0.17), face features, NECK_ANCHOR [0, 0.65, 0.05].
- packages/gnome/src/gear-clearance.test.ts: every `wear-neck` prefab must clear the head by at least 0.01. Fail = move the parts.
- Lore: run `npm run lore -- find charm`, `npm run lore -- find snigms`, `npm run lore -- find club` and `npm run lore -- find gnomillion` before writing names or examine lines. Follow docs/lore/canon.md.

## Change
Add these ten PrefabDef entries to COSMETICS_NECK. Every one: `category: 'trinket'`, `uses: ['wear-neck']` (plus 'collect' only if it reads as a keepsake), `emoji: []`, `tags` including 'neck', 'reward' and the nouns from the name. One-line `about`, 5 examine lines (each under 160 characters, all different). 3-12 parts, `seg` 4-12. The neck item's origin is the neck anchor: its lowest point must be at y = 0 of the item. Keep every part at least 0.01 clear of the head sphere and the face (the gear-clearance test checks this).

| id | name | the achievement it serves (title: description) | visual brief |
|---|---|---|---|
| feather-garland | Feather Garland | Friend of the Yard: Befriend 6 different garden critters. | A cord with three small feathers (brown, grey and white) and a clover bead, hung round the neck. |
| tin-can-phone | Tin-Can Phone | Chatterbox: Send 25 chat lines in Club Gnome. | A small tin can on a string hung on the chest, with a second can on the cord's other end. |
| tire-tread-collar | Tyre-Tread Collar | Sideways Gnome: Hold a slide for a full second in any ground vehicle. | A thick black rubber collar with a tread pattern (raised ribs), a brass valve nub at the front. |
| frosting-garland | Frosting Garland | Cake Day: Bake 5 acorn cakes. | A cord with a ring of piped frosting dollops (cream, rose) and one bright cherry bead. |
| stitched-collar | Stitched Collar | Glued Back Together: Get cracked apart by the Hat Watch. | A brown leather collar with a visible stitched seam and a glued crack line of dark glue. |
| felt-scarf | Felt Table Scarf | Regular: Finish five games of Gnome Billiards. | A short green felt scarf wrapped twice, with a neat fold at the front. |
| scrabble-tile-pendant | Letter Tile Pendant | Gnome.: Solve the puzzle. The answer was gnome. | A square cream letter tile with a dark G engraved on its face, hung on a cord. |
| visitor-lanyard | Visitor Lanyard | Name Drop: Send your first answer in a Gnomillion room. | A cord lanyard with a small white name card clipped to its end. |
| time-card-clip | Time-Card Clip | Punching the Clock: Finish your first shift and come home paid. | A brass time-card clip with a small card in it, on a short chain. |
| rubber-duck-cord | Rubber Duck Cord | Squeaky Gnome: Have your first bath. | A small yellow rubber duck with a flat base on a cord, hanging on the chest. |

## Contract
- Export: `COSMETICS_NECK: PrefabDef[]` from packages/prefabs/src/catalog/cosmetics-neck.ts (unchanged name; the index already spreads it).
- The ids above, verbatim. The achievements catalog (lead) uses these exact ids and the names above.
- Do not change any other file. Do not reuse an id that already exists: run `grep -rn "id: 'feather-garland'" packages/prefabs/src/catalog` (and the same for each id) before writing.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in cosmetics-neck.ts.
- `npm test -w packages/prefabs 2>&1 | grep -E "feather-garland|tin-can-phone|tire-tread-collar|frosting-garland|stitched-collar|felt-scarf|scrabble-tile-pendant|visitor-lanyard|time-card-clip|rubber-duck-cord"` shows those ids passing.
- `npm test -w packages/gnome` passes (it includes the gear-clearance check, which covers every wear-neck prefab, including yours). If a neck item fails the clearance check, move its parts out of the head and face and rerun.

## Out of scope
packages/prefabs/src/types.ts, palette.ts, index.ts, catalog/index.ts, catalog.test.ts, cosmetics-head-a.ts, cosmetics-head-b.ts, cosmetics-back.ts, every other catalog file, packages/gnome/src (read only), packages/achievements, games/.
~~~~

~~~~text
Epic: 2 (Issue 4 of 6): new back-slot packs and capes

Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\kingfish`. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not npm install. Do not git commit. Other workers are editing cosmetics-head-a.ts, cosmetics-head-b.ts, cosmetics-neck.ts and the emotes package at the same time: edit only the one file named below. The repo's prefab rules are in docs/roadmaps/prefab-library/_common.md: read it first and follow it.

## Goal
Five new back-slot prefabs, one for each of five achievements, in packages/prefabs/src/catalog/cosmetics-back.ts. The file exists with an empty `export const COSMETICS_BACK: PrefabDef[] = [ ];` and is already wired into the catalog.

## Read first
- docs/roadmaps/prefab-library/_common.md: all the rules.
- packages/prefabs/src/catalog/armor.ts: leaf-cloak, caddie-bag, disco-pack. packages/prefabs/src/catalog/gnome-theft-auto.ts: water-tank-pack. Back items: they hang on the back, so a pack is a box with straps and a cloak is a sheet of cloth.
- packages/gnome/src/anatomy.ts and gear.ts: the back slot anchor is [0, 0.28, -0.22] with rot [0, 180, 0]: the item is placed on the back of the gnome, the prefab's +z faces away from the gnome's back. Keep items shallow in z (under about 0.2 deep) so they do not stick out.
- Lore: run `npm run lore -- find pack`, `npm run lore -- find golf`, `npm run lore -- find gnomillion` and `npm run lore -- find snigms` before writing names or examine lines. Follow docs/lore/canon.md.

## Change
Add these five PrefabDef entries to COSMETICS_BACK. Every one: `category: 'armor'`, `uses: ['wear-back']`, `emoji: []`, `tags` including 'back', 'reward' and the nouns from the name. One-line `about`, 5 examine lines (each under 160 characters, all different). 3-15 parts, `seg` 4-12, base on the ground at y = 0 as every prefab is.

| id | name | the achievement it serves (title: description) | visual brief |
|---|---|---|---|
| rough-satchel | Rough Satchel | Off the beaten path: Finish a hole without ever landing on the fairway, hitting from the rough at least once. | A canvas satchel with a flap, stuffed with long grass tufts and a clover sprig poking out. |
| explorer-pack | Explorer's Pack | Club Explorer: Visit all four places: Town Square, the Gnomecino, the Arcade and Links Park. | A small rucksack with a rolled paper map strapped to the top and a brass compass on the flap. |
| quiz-satchel | Quiz Card Satchel | Five Rounds In: Play 5 rounds of Once in a Gnomillion. | A leather satchel bulging with a stack of index cards tied with string. |
| picnic-cape | Picnic Blanket Cape | Four Walls and a Gnome: Close in a room of at least 4 tiles. | A tartan blanket cape: a square of cloth pinned at the shoulders, hanging down the back. Use `c: 'tint'` on the cloth and set `tint` on the prefab. |
| cue-case | Pool Cue Case | Table Champ: Sink the 8 ball before Big Lou does. | A long slim case strapped across the back, with a pool cue tip sticking out of its top. |

## Contract
- Export: `COSMETICS_BACK: PrefabDef[]` from packages/prefabs/src/catalog/cosmetics-back.ts (unchanged name; the index already spreads it).
- The ids above, verbatim. The achievements catalog (lead) uses these exact ids and the names above.
- Do not change any other file. Do not reuse an id that already exists: run `grep -rn "id: 'rough-satchel'" packages/prefabs/src/catalog` (and the same for each id) before writing.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in cosmetics-back.ts.
- `npm test -w packages/prefabs 2>&1 | grep -E "rough-satchel|explorer-pack|quiz-satchel|picnic-cape|cue-case"` shows those ids passing.
- Each has `uses` containing 'wear-back'.

## Out of scope
packages/prefabs/src/types.ts, palette.ts, index.ts, catalog/index.ts, catalog.test.ts, cosmetics-head-a.ts, cosmetics-head-b.ts, cosmetics-neck.ts, every other catalog file, packages/gnome/src, packages/achievements, games/.
~~~~

~~~~text
Epic: 2 (Issue 5 of 6): two new animated emotes

Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\kingfish`. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not npm install. Do not git commit. The lead is editing packages/achievements/src/catalog.ts at the same time: do not touch it. Edit only packages/emotes/src/catalog.ts.

## Goal
Two new animated emotes, so two achievements stop sharing an emote with another achievement: `parachute-flip` and `compass-point`.

## Read first
- packages/emotes/README.md: how an emote is defined and what a pose is.
- packages/emotes/src/catalog.ts: the header comment (the rig's axes: arm.x, arm.z, leg, lift, yaw, lean, tip) and the existing emotes: `pinwheel-spin` (a yaw spin with arms out), `worm`, `cheer`. Copy their style, including the `envelope` and `ease` helpers already in the file.
- packages/emotes/src/types.ts: EmoteDef and EmotePose.
- packages/emotes/src/emotes.test.ts: the checks. Every pose must be finite, and one-shot emotes (loop false) must start and end at rest (abs values under 0.02, a spin may end on a whole turn).

## Change
Append two entries to the end of the EMOTES array in packages/emotes/src/catalog.ts (after `worm`). Do not change the existing entries.

1. `id: 'parachute-flip'`, `label: 'Parachute Flip'`, `icon: '🪂'`, `duration: 2.2`, `loop: false`. Pose: a parachute-style flip. Arms swing up over the head (arm.x negative, about -2.8 at the peak), a small hop (`lift`) that rises and falls, and the body tips backward then forward (`tip`) once, all wrapped in `envelope(t, 2.2, 0.2, 0.35)`. It must end at rest.
2. `id: 'compass-point'`, `label: 'Compass Point'`, `icon: '🧭'`, `duration: 2.4`, `loop: false`. Pose: the right arm stretches out ahead (armR.x about -1.4, armR.z about -0.2), the gnome turns one full circle (`yaw` eased from 0 to 2*PI over the first 1.6 seconds with `ease`), then the arm drops back to rest at the end. Keep `lift` near 0. The turn must come back to a whole turn (2*PI), so `Math.sin(yaw)` is ~0 at the end.

## Contract
- Two EmoteDef entries with exactly the ids, labels and icons above. The lead's achievement catalog uses these exact strings.
- No other file changes.

## Done when
- `npx tsc --noEmit -p packages/emotes` shows no error in catalog.ts.
- `npm test -w packages/emotes -- -t "finite poses|one-shots start and end at rest"` passes for the two new emotes. (The achievement-emote test fails until the lead's catalog edit lands; that is expected and not yours.)

## Out of scope
packages/emotes/src/types.ts, loadout.ts, index.ts, player.ts, emotes.test.ts, packages/achievements, games/, every other package.
~~~~

~~~~text
Epic: 2 (Issue 6 of 6): RARE badge and character-creation guidance

Depends on: none (the `exclusive` flag already exists on AchievementReward in packages/achievements/src/types.ts)

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\kingfish`. Node: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. Do not npm install. Do not git commit. Other workers are editing prefab catalog files and the emotes package at the same time: edit only the files named below. Repo rules (AGENTS.md): every game plays on a phone (a 16px side gutter, no horizontal page scroll at 390 px wide, touch targets at least 44 px); no new external assets.

## Goal
Two things in the Gnome Creator and the unlock toast: (1) gear that is `reward.exclusive` shows a RARE badge; (2) the creator gets a short "Make your gnome stand out" guidance panel.

## Read first
- packages/achievements/src/types.ts: AchievementReward, including the new `exclusive?: boolean`.
- packages/achievements/src/toast.ts: how the unlock toast is built (what text it shows for a reward).
- games/gnome-creator/src/editor.ts: the equipment picker (`.ge-eq`, `.ge-eq-slot-lbl`, `.ge-eq-lock` styles; the loop that renders each equipment button with its prefab icon and lock span; `setUnlocked`), and the panel layout (the CSS block at the top of the file, and where the sections are appended).
- games/gnome-creator/src/main.ts: how equipment defs reach the editor (`equipmentCatalog()` / `getAchievement`). Read only, unless you must pass a field through.
- packages/achievements/src/index.ts: what the package exports.

## Change
1. games/gnome-creator/src/editor.ts: in the equipment picker, when `def.reward.exclusive` is true, show a small "RARE" badge on the equipment button (a `<span class="ge-eq-rare">RARE</span>`, with CSS: a gold border or text, readable on the dark panel). Also make its `title` say "Rare: earned from this achievement only." when it is exclusive. Keep the lock span logic as it is.
2. packages/achievements/src/toast.ts: when the unlocked achievement's `reward.exclusive` is true, the toast says RARE (for example the toast line "RARE gear unlocked" before the usual text). Keep the existing text for normal rewards. Do not change any other behaviour.
3. games/gnome-creator/src/editor.ts: add a "Make your gnome stand out" guidance block near the top of the editing panel (above the first picker, or right under the name field). It is plain text in a small box, with a heading and exactly these five tips, verbatim:
   - "Pick a hat colour nobody else picks. The hat is the first thing a crowd sees."
   - "Clash on purpose: a bright coat over pants from the other end of the palette looks like nobody else's."
   - "Features do the rest: a beard, pigtails, freckles, glasses or a dress. Two gnomes in the same colours look nothing alike with different features."
   - "Gear shows what you have done, so pick the pieces that match your own story, not the first ones you unlock."
   - "RARE gear comes only from the hardest achievements. Earn it, then show it off."
   Use plain DOM (the editor already builds its panel with `h(...)` helpers), with no new dependency. It must fit a 390 px phone screen: wrap text, no fixed widths over 100%.

## Contract
- `reward.exclusive` is read as `def.reward?.exclusive === true`.
- The RARE badge text is exactly `RARE`.
- The guidance heading is exactly `Make your gnome stand out`; the five tips above are verbatim.

## Done when
- `npm run build -w games/gnome-creator` passes (type-check and build). Run it from the repo root.
- `npm test -w packages/achievements` passes.
- A short note in your final report: where the RARE badge and the guidance block were placed in editor.ts (function and line range), and whether the toast change touches only the text.

## Out of scope
packages/achievements/src/catalog.ts, types.ts, index.ts and tests (the lead owns them), any prefab catalog file, packages/emotes, packages/gnome, every other game under games/, the layout of #ui (never restyle or hide #ui itself: append your own container to it).
~~~~
