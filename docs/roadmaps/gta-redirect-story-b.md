# Gnome Theft Auto: re-directing Story B (chapters 3-5)

Step 2 of the cutscene direction pass, lane **Story B** ([../design/gnome-theft-auto/direction/lanes.md](../design/gnome-theft-auto/direction/lanes.md)):
every story scene of chapters 3, 4 and 5 gets director's notes (`direction/scenes/<id>.md`, from `TEMPLATE.md`) and is
re-staged, re-cut, re-timed and re-written against [the bible](../design/gnome-theft-auto/direction/bible.md) until the
pacing checker passes it, and it leaves `src/cutscene/pacing.baseline.ts`. Start: 13 scenes, 95 faults.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0. Foundation (planner) | ch3/ch4 split into one file per owner (`ch3.ts` + `ch3b.ts` + `ch3c.ts`, `ch4.ts` + `ch4b.ts` + `ch4c.ts`, registered through `CH3_SCENES` / `CH4_SCENES`, no `scenes/index.ts` change); engine: `armless` actor flag (Pip without his right arm) and a `hug` gesture; tsc passes | - |
| 1. Re-direction | the 9 worker scenes and the 4 anchor scenes (planner: `salvage-raid-intro`, `spade-truce-outro`, `even-cut-intro`, `even-cut-outro`) pass the report and LOS; notes for all 13 | 4 |
| 2. Review (planner) | every scene watched at 960x600 and 390x844 and fixed; Story B gone from the baseline; build, test, lore, smoke pass | - |

Files per issue (no collisions): 1 owns `scenes/story/ch3b.ts`, 2 owns `ch3c.ts`, 3 owns `ch4b.ts`, 4 owns `ch4c.ts`; each
also owns its scenes' notes files. The planner owns `ch3.ts`, `ch4.ts`, `ch5.ts`, `pacing.baseline.ts` and the engine.
All workers share the dev server on port 5312 (read only).

Continuity across the lane (every issue pastes what it needs):

- Pip's arm: broken off in `salvage-raid-intro` (the raid, on camera). Armless (`armless: true`) in `salvage-raid-outro` and
  `kiln-resin-intro`. Cured with Kiln-Resin after the derby: `kiln-resin-outro` is the first scene with the new arm
  (a sincere beat). From `tundra-intro` on he has both arms and is proud of the new one.
- Tansy vanished in the raid (out the back through the Under-Deck storm drain); surfaces by snail-mail in
  `kiln-resin-outro`; reunion and her first hug in `tundra-outro`.
- "Okay, hear me out": Pip says it once in chapter 4, in `sandpit-drop-intro` (rung 2). Nowhere else in ch3-4.
  Finale payoff: Tansy says it in `even-cut-intro`.
- The golden kazoo: rung 2 "Toot." in `runway-intro`; payoff in `even-cut-intro`.
- Granny's pie: rung 2 "I brought pie." in `spade-truce-outro`.
- The Whirligig: Tansy names it in `tundra-outro` ("Fort Sandpit has a Whirligig.").
- Commander Diggs: planted by Wally in `runway-intro`, enters in `sandpit-drop-outro`, turns in `spade-truce-intro`
  ("Nobody fires the Guard. Especially not a guy in a porcelain hat." is HIS line).
- "Then we don't drive." is Pip's in `tundra-outro`; do not reuse it word for word elsewhere.

## Issues

Each issue below is pasted in full, with the shared **Common** block, into one `haiku-worker` run.

~~~~text
COMMON (pasted into every issue)

## Environment
- Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-aefa81389d969df60 (a git worktree; run
  everything there; never commit, never push, never stash).
- Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` if node is not found. `npm install` is done.
- The game: games/gnome-theft-auto. A dev server is ALREADY RUNNING on http://localhost:5312 (do not start another on
  that port; if it does not answer, start your own with
  `npm run dev -w games/gnome-theft-auto -- --port <your port> --strictPort` on the port named in your issue).
- Other workers are editing OTHER scene files in the same folder at the same time. Edit only the files your issue owns.
  Do NOT edit src/cutscene/pacing.baseline.ts, scenes/index.ts, ch3.ts, ch4.ts, ch5.ts, kit.ts, direct.ts or anything in
  src/cutscene/ except your own scene file.

## What a scene is
A cutscene is plain data: a `SceneScript` (games/gnome-theft-auto/src/cutscene/script.ts, every field commented). Steps
run in order; `async: true` lets the next step start at once. Camera steps never wait. Key steps:
`say {who,text}`, `walk {who,path,speed?,run?}`, `face {who,at|yaw,s}`, `gesture {who,name,s}` (wave, point, shrug, nod,
cheer, handsUp, lean, crossArms, facepalm, bow, sit, stand, flinch, slump, think, clutch, beckon, tipHat, stomp, hug),
`spawn/despawn {id,at?}`, `hold {who,prop|null}`, `give {from,to,prop?,s}`, `enter {who,vehicle,seat?}`, `exit {who}`,
`drive {vehicle,path,speed,depart?,arrive?}`, `horn {vehicle}`, `lights`, `cam {shot}`, `shake {amp,s}`,
`music {track|null,fade}`, `ambience {bed}`, `sfx {id,at?,gain?}`, `stinger {id}`, `title {text|null}`,
`caption {text|null}`, `wait {s}`, `fade`.
Actor fields: `preset` (pip, tansy, vesper, granny, diggs, bracken, loam, bodega, wally, ...), `name`, `look`, `held`
(a prefab id or null), `at`, `yaw`, `hidden`, `seatedIn`, `seat`, `armless: true` (no right arm, nothing held).
Shots: `spot(stage, camId)` (a stage's establishing camera, a WIDE: never put dialogue on it),
`{kind:'track',pos,who}` (fixed camera following a vehicle), `{kind:'dolly',from,to,look,s}`,
`{kind:'cut',pos,look}`, and `frame` shots via src/cutscene/direct.ts:
  - `cut(shot(who, size, { toward?, side?, height?: 'eye'|'low'|'high', fov?, handheld? }))` - size 'cu'|'mcu'|'ms'|'fs'|'ws'.
  - `const T = coverage(a, b, 1)` then `cut(T.single(a, 'mcu'))`, `cut(T.ots(a))`: matched coverage on ONE side of the
    a-b line. Use one coverage object per conversation; never mix sides.
  - `...reaction(who, { toward, gesture, size, hold })` - a reaction shot plus a beat.
  - `beat('tiny'|'beat'|'pause'|'silence')` - 0.3 / 0.7 / 1.2 / 2.0 s.
  - `...exchangeLooks(a, b)` - two actors turn to each other.
Kit helpers (scenes/story/kit.ts): `markOf(stage, who, n?)` -> {at,yaw}, `carMark(stage, id)`, `spot(stage, cam)`,
`up(x, z, h)`, `rideOf(castId)`, `pathOf(stage, id)`.
Stage spots (marks, cameras, vehicles) are in games/gnome-theft-auto/src/quests/stages/*.ts (east.ts: dust-safehouse,
airfield-apron, fort-sandpit-gate, fort-sandpit-pad; wilds.ts: birdbath-basin, theo-camp, kiln-shrine,
salt-plow-blockade).

## Read first
- docs/design/gnome-theft-auto/direction/bible.md - sections 1, 2 (the characters you use), 4 (pacing numbers), 5
  (camera), 6 (music).
- docs/design/gnome-theft-auto/direction/scenes/mowers-keepers-intro.md and its code in
  games/gnome-theft-auto/src/cutscene/scenes/story/ch1.ts (search `MOWERS_KEEPERS_INTRO`): THE QUALITY BAR. Copy its
  patterns: open on a wide or an action, then cover every line with frame singles (MCU) on the eyeline, reactions after
  big lines, the button at the end.
- docs/design/gnome-theft-auto/direction/TEMPLATE.md - the notes you write.

## The rules the checker enforces (bible section 4)
- Every line at most 16 words (aim 12). At most 3 lines per shot; at most 3 lines in a row by one speaker.
- Narrator lines + captions: max 1 per scene (2 in a chapter-open / chapter-close). Better 0.
- The speaker must be in frame for >= 50% of their line's typing, >= 25% of the frame height (MS or closer), facing the
  camera (<= 115 degrees off). So: every line gets a frame shot on its speaker (MCU/MS), never a stage wide.
- No two `cam` steps in a row (the first never shows: dead-shot). No shot shorter than 0.8 s.
- Longest holds: close 7 s, medium 9 s, wide 6 s, moving 12 s. Cut on speaker changes.
- No cut in the first 80% of a line's typing: put the `cam` step BEFORE the `say`, never right after it mid-line.
- No 3 s stretch with nothing new (a line, a move, a gesture, a sound, a cut). Something happens in the first 3 s.
- The first line is never narration.
- Two actors within 10 m talking: consecutive lines stay on one side of their line (use one `coverage(a, b, side)`).
- Never repeat a 4+ word line said word for word in another scene.
- A deliberate break is waived in the scene: `direction: { notes: '...', waive: [{ code: 'dead-air', match: '<text in the fault>', why: '<reason>' }] }`. Max two waivers; say why in the notes too.
Lengths: intro aim 30-60 s (fault > 75), outro 15-45 (> 60), chapter-open / chapter-close 45-80 (> 100).

## Every scene in your issue
1. Copy TEMPLATE.md to docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md and fill EVERY section from the
   direction given in your issue (you may improve shots and timings; keep the story beats and the lines unless the
   checker forces a change, then keep the meaning and the voice).
2. Rewrite the scene's const in your file to match. Set `direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/<id>.md' }`
   (plus `kind` only if your issue says so). Keep the scene id, keep it registered in your file's `CH..._SCENES` object.
   Keep the doc comment above the const, rewritten to describe the new scene in 2-4 lines.
3. Check names: `npm run lore -- find <word>` (repo root) for any name or place you add.
4. Verify (from games/gnome-theft-auto):
   - `npx tsc --noEmit -p .` passes.
   - `npm run cutscene-report 2>&1 | grep -A25 "<scene-id>"`: your scene's header line must say `0 fault(s)` (or
     only waived ones). It still says `[baseline]`: that is expected, the planner removes it from the baseline.
   - `npx vitest run src/cutscene/scenes/scenes.test.ts -t "<scene-id>" --testTimeout=180000`: passes (line of sight: no
     camera inside a wall or blocked by terrain/buildings, no actor floating, no path through a building). If a frame
     shot is blocked, change `side` (swing the camera round the actor) or the size, or move the actor's mark a little.
5. WATCH it (the checker cannot see scene vehicles and props blocking the lens, or darkness):
   `node C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/watch.mjs <scene-id> --step 2 --out <your out dir>`
   and again with `--size 390x844`. It plays the scene in headless Edge (about 3-5 minutes) and writes a contact sheet
   PNG (path printed). Read the PNG. Check each frame: is the speaker's face visible and not covered by a mower, plane,
   van or prop? Not too dark? Faces in the upper half (the subtitle card covers the bottom third)? Fix and re-watch
   anything wrong. Run at most one watch at a time.
6. Fill the notes' self-check honestly.

## Report back
Per scene: length before -> after (from the report header), faults before -> after, waivers and why, what you saw when
watching and fixed, anything you could not fix. Do not commit.
~~~~

~~~~text
Epic: 1 Re-direction
Issue 1: ch3b.ts - salvage-raid-outro, kiln-resin-intro, kiln-resin-outro (Frostbite Fells)
Depends on: none
Your file: games/gnome-theft-auto/src/cutscene/scenes/story/ch3b.ts. Your notes: scenes/salvage-raid-outro.md,
kiln-resin-intro.md, kiln-resin-outro.md. Own dev-server port if needed: 5321. Watch out dir:
C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/w1

(Paste COMMON here.)

## Story so far (do not change these facts)
The HOA raided Side-Valve Salvage in the rain. Turncoat Cam sold the crew out for a Patio Heights racing charter; Vesper
took the Golden Acorn. Tansy slipped out the back and vanished. A raider's swing broke Pip's clay RIGHT arm clean off;
the player got Pip out north up the Ring Road in Pip's Zero-Turn to the Frozen Birdbath Basin in Frostbite Fells, where
Father Loam (excommunicated chaplain, preaches from a snowmobile, mixes Kiln-Resin for cracked drivers, says "my child",
kind first, odd second) takes in cracked pilgrims. Tone of chapter 3: cold wides, warm close-ups (shoot Loam and Theo
close, eye level, warm). Use `sky: 'golden'` on all three scenes (dawn light, warm faces).

## Scene 1: salvage-raid-outro (outro; aim 25-40 s; was 35.6 s, 5 faults)
Played when the player delivers Pip's Zero-Turn to the basin. Keep the arrival vehicle `{ id: 'ride', kind: 'zero-turn',
from: 'player', ... }` with the player seated as driver and Pip seated as passenger (seat 1), Pip `armless: true`.
Purpose: warm against the cold. The crew is broken (no bay, no Tansy, no arm); a stranger takes them in. Player in:
adrenaline, loss. Out: safe for a night, and a promise ("Tomorrow.") that sets up the cure.
Beats:
1. Hook 0-3 s: a low `track` on the Zero-Turn sliding in off the north highway and stopping by the basin with a `skid`.
   No music yet: `ambience: 'wind'`.
2. Pip climbs out (`exit`), armless, and denies it to the player (coverage pip/player): 
   Pip: "Hairline fracture. Barely a chip."
   Player: "Pip. It came off."
   (reaction: Pip looks at his shoulder - `clutch` - a beat)
   Pip: "...Hairline."
3. Turn: Father Loam is already there (stands by his snowmobile at the rim, mark `markOf('birdbath-basin','loam')`); he
   walks to them. Music `frost` comes in softly on his first line. Shoot him eye level, close, warm.
   Loam: "Another cracked pilgrim. Sit by the stove, my child."
   Pip: "I'm not cracked. I'm ventilated."
   Loam: "They threw me out for preaching on a snowmobile. The Kiln keeps no grudges."
4. Button: Pip sits on the bench (his mark `markOf('birdbath-basin','pip')` is the bench, `gesture sit`), small.
   Pip (quiet, coping): "Does the Kiln do arms?"
   (beat) Loam, close, kind: "Tomorrow."
   Hold a reaction on Pip (a small nod) - `beat('pause')` - fade.
Cut: Loam's Loch Moss turtle line (an errand hook in a button) and the old "Did my elbow just rattle?".

## Scene 2: kiln-resin-intro (intro; aim 30-50 s; was 38.9 s, 5 faults)
Quest "Kiln-Resin & Black Ice": fetch resin from the northern shrine, crack the HOA salt-plow crew on the road, survive a
90-second derby on the ice while the resin sets on Pip. The OLD scene played all of that out under narration BEFORE the
player did it ("One sensible argument and two plow drivers later, the road is clear", "Ninety seconds later"): cut all
narration and the caption and the fade. The scene only sets the job up. Player ends on foot by the basin
(keep the player actor's final position near (1, -336) or their basin mark).
Pip is `armless: true`, sitting on the bench. Loam holds a `clay-jar`.
Beats:
1. Hook: Loam upends the clay jar over the stove (a `knock` sfx on the empty jar), close on him.
   Loam: "The jar is empty, and the Kiln is not a patient god."
2. Pip (on the bench, armless): "How empty? A-little-bit empty?" - Loam turns the jar fully over (another knock, a held
   beat). Pip: "Okay. Very empty."
3. Loam (to the player): "The northern shrine weeps fresh resin. Up the highway, past the bend."
4. Turn (something in the way): cut to the salt-plow-blockade (`spot('salt-plow-blockade','wide')` as a 2-3 s establishing
   shot with an `alarm` or `engine-rev` sfx; the two HOA plow vans parked on their marks: `carMark('salt-plow-blockade',
   'salt-plow-1')`, `'salt-plow-2'`, kind 'hoa-van'), then a LOW MS single on plow driver 1 with his clipboard
   (held 'ticket-stub' is fine): "Highway's closed. Salt in progress. HOA orders." Driver 2 `crossArms` on a reaction.
   Use music `tension` for this cutaway, back to `frost` at the basin.
5. Back at the basin, Pip: "They're salting the ice. Who salts ice?"  Loam: "Men who are afraid to skid."
6. The job, Loam to the player, MCU: "Bring me the resin. Then hold the basin while it sets." Then the button:
   Pip: "Ninety seconds? I've glued a hat in less." and the player's nod (reaction).

## Scene 3: kiln-resin-outro (outro; aim 30-45 s; was 23.7 s, 4 faults)
Played at Thermos Theo's barrel (stage theo-camp) after the derby: the arm is cured, and a racing snail brings
Tansy's note. THIS IS A SINCERE BEAT (bible law 5): no jokes during the cure beat, no stinger, slower cuts, one held
silence (`beat('silence')`), music out (`music: null`) during it, `warm` comes in AFTER the silence. Comedy is allowed
only after, from Pip coping.
Actors: player (`markOf('theo-camp','player')`), Theo (`name: 'Thermos Theo'`, look `{ hat: 0x9e3b2a, shirt: 0x4a5a6a,
beard: 0xdddddd }`, his mark), Pip WITH both arms (no armless), a hidden `riding-snail` prop near the barrel.
Beats:
1. Hook: Theo pours (a `lean` gesture over the thermos on the barrel), close: "Acorn-broth. Burns the throat, warms the soul."
2. Pip is beside the player, flexing the new arm slowly (`wave` at 1.6 s, MCU on Pip); no line for a beat.
3. The sincere beat (coverage pip/player, close singles, eye level, locked, long holds):
   Pip: "It holds."  (beat)  Pip: "You didn't leave me on the apron."
   Player: "Wasn't going to."
   Pip nods. `beat('silence')`. Then `music: 'warm'`, fade 1.5.
4. Turn: the snail (spawn it; a `mystery` stinger; a CU insert of the snail by the barrel, 1.5-2 s). Theo: "Post's here."
   Theo takes the scroll (`hold` 'rolled-scroll') and `give`s it to the player.
   The note as ONE caption (the scene's only narration): "Found the Stopping Stone. Dust Flats. Bring Pip. Bring snacks. - T."
   Then `caption: null`.
5. Button (Pip coping, proud): reading over the player's shoulder, MCU: "She said bring Pip. By name." with a small
   `cheer`; hold 1.2 s.
Cut: Theo's Baroness Brenda canal line (an errand hook); "Good as new. Shinier, even." (that line belongs to tundra-outro).

## Done when
- The three scenes each show `0 fault(s)` (or only waived) in the cutscene report; each passes its scenes.test.ts LOS
  run; `npx tsc --noEmit -p .` passes; the three notes files exist and are filled; you watched all three at both sizes.

## Out of scope
Every file except ch3b.ts and your three notes files.
~~~~

~~~~text
Epic: 1 Re-direction
Issue 2: ch3c.ts - tundra-intro, tundra-outro (chapter 3 close)
Depends on: none
Your file: games/gnome-theft-auto/src/cutscene/scenes/story/ch3c.ts. Your notes: scenes/tundra-intro.md,
tundra-outro.md. Own dev-server port if needed: 5322. Watch out dir:
C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/w2

(Paste COMMON here.)

## Story so far (do not change these facts)
The HOA raided Side-Valve Salvage; Turncoat Cam sold the crew out; Vesper took the Golden Acorn (the ignition core of his
Grand Combine, a giant harvester built to mow Turfton flat). Pip's clay arm broke off in the raid; Father Loam cured it
with Kiln-Resin at the Frozen Birdbath Basin; Pip now has a shiny resin arm and is very proud of it. Tansy vanished in the
raid and sent a snail-mail: "Found the Stopping Stone. Dust Flats. Bring Pip. Bring snacks." The Stopping Stone is the
Unmowed's ancient stone; in the old story Gnorwin Clayfoot jammed the first Mower with one. Elder Bracken (Unmowed) lent
it. Tansy (dry, low, short; garden proverbs as street slang; NEVER touches anyone until now; works while she talks).
Pip (fast, loud, never still; a second sentence that undoes the first).

## Scene 1: tundra-intro (intro; aim 30-45 s; was 35.2 s, 5 faults)
Quest "Volatile on Ice": run an ice-packed Zero-Turn of Black Dew barrels across the ring road to the Dust Flats
Overlook, then clear the HOA spotters there. Stage: birdbath-basin (dawn; use `sky: 'golden'`). Read the quest in
games/gnome-theft-auto/src/quests/chapter3.ts (`ch3-tundra-drift-run`) for where the gameplay Zero-Turn spawns; park the
scene's mower near there or on `carMark('birdbath-basin','ice-zero-turn')` (check the LOS test passes). The player must
END ON FOOT next to the mower (the quest spawns its own vehicle). Pip must NOT drive away (the player drives the run).
No road directions ("Ring road east" is cut: the HUD shows the way).
Beats:
1. Hook: Pip heaves a `gta-dew-barrel` onto the mower with his new arm: a `thud` sfx as it lands (hold the barrel with
   `hold`, then `hold null` on the thud). Pip, MS: "Both arms, both barrels. Watch this."
2. Loam (holding `clay-jar`) blesses the mower (`bow`): "Compost tea, for the getaway. The Kiln wants a clean lap."
3. Player: "Where's it going?"   Pip: "Dust Flats. Tansy's there." (a beat; he looks at the player - this is the turn:)
4. Turn: Pip holds out the key - a `give` from Pip to the player (prop 'brass-key') - he trusts the player to drive:
   Pip: "You drive. I'll guard the barrels."  (beat)  Pip: "Don't drift."  (beat)  Pip: "Okay, drift a little."
   Split these across a reaction of the player so no speaker-run fault.
5. Button: Pip slaps the mower and leans in to sound the `horn`; the player's flat look (reaction, 1 s).
Music: `frost` throughout (it is a frost scene); no stinger.

## Scene 2: tundra-outro (chapter-close; aim 50-75 s; was 60.7 s, 9 faults; set `kind: 'chapter-close'` in direction)
Played when the spotters are cleared at the Dust Flats Overlook (stage dust-safehouse, golden). Tansy is at the map table
holding `stopping-stone`. Chapter 3 asked "can the crew survive losing everything?": the reunion answers it. Then the next
threat: the Grand Combine fires. A chapter closer ends on the THREAT (never a gag), then the title `END OF CHAPTER 3`.
Cut: all three narrator lines ("She hugs him, carefully..." - SHOW it), and Burt's phone call (an errand in a closer).
Beats:
1. Hook: Tansy at the map table hears them (she turns, `face` to the player), MCU: "You're late."
   Pip: "We were cracked. Partially."
2. Tansy sees the arm (reaction on her, a beat): "Pip. Your arm is... shiny."   Pip: "Kiln-Resin. Shinier, even."
3. THE HUG (the first time Tansy touches anyone in the game; sincere, no joke, music out `music: null`): Tansy walks to Pip
   (stop 0.45 m in front of him, facing him; Pip faces her), both `gesture: 'hug'` for 2.5 s at the same time
   (`async: true` on the first). Shoot it as a locked MS two-shot at eye level, side-on (a `frame` shot on one of them with
   `side: 90` or a `cut` placed beside them), hold through the hug + `beat('silence')`. Then a reaction CU on Pip, stunned.
   Tansy steps back, MCU, dry again: "Don't tell anyone."
4. The plan: Tansy lifts the Stopping Stone (she holds it), MCU: "Bracken lent us the Stopping Stone. He wants it back uncracked."
   Player: "What's it for?"  Tansy: "Jamming things that shouldn't run."
5. The turn - the threat: a deep machine horn rolls over the dunes (`sfx: 'alarm'` gain 0.3 + `shake` 0.05 for 1.5 s);
   everyone turns to look north-west (`face` at a point like [200, 0]). Cut AWAY to the Grand Combine itself: a hidden prop
   `{ id: 'combine', prefab: 'grand-combine-boss', at: [0, -200], yaw: Math.PI, size: 14, by: 'w', hidden: true }`,
   spawn it, a low camera `up(0, -236, 2.4)` looking at `up(0, -200, 6)` (fov 56), a `villain` stinger and
   `music: 'villain'`. Hold 2.5 s, no line (picture first).
6. Back at the overlook, Tansy MCU: "He's put the acorn in it. We can't outdrive that."
   Pip (pointing east at Fort Sandpit, `point`): "Then we don't drive."
   Tansy (reaction: she looks east too, then MCU): "Fort Sandpit has a Whirligig."
7. Button: a slow push-in (a `dolly`, 4-5 s) from behind the three of them toward Fort Sandpit's walls glowing in the
   distance (the fort is around x 374, z 0..40; the overlook is round x 270, z 44), `music: 'villain'` still under it;
   `title: 'END OF CHAPTER 3'`, `wait 3`, `title: null`. The player actor ends on foot near the overlook.
Optional: one Narrator line is allowed in a closer but use none.

## Done when
- Both scenes show `0 fault(s)` (or only waived) in the cutscene report; each passes its scenes.test.ts LOS run;
  `npx tsc --noEmit -p .` passes; both notes files exist and are filled; you watched both at both sizes (check the hug
  reads as a hug and nothing blocks it; check the Whirligig parked at `carMark('dust-safehouse','safehouse-whirligig')`
  does not block any face).

## Out of scope
Every file except ch3c.ts and your two notes files.
~~~~

~~~~text
Epic: 1 Re-direction
Issue 3: ch4b.ts - runway-intro (chapter 4 open), sandpit-drop-intro
Depends on: none
Your file: games/gnome-theft-auto/src/cutscene/scenes/story/ch4b.ts. Your notes: scenes/runway-intro.md,
sandpit-drop-intro.md. Own dev-server port if needed: 5323. Watch out dir:
C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/w3

(Paste COMMON here.)

## Story so far (do not change these facts)
Vesper's Grand Combine (a giant harvester to mow Turfton flat) runs on the stolen Golden Acorn. The crew (Tansy, Pip with
a shiny new Kiln-Resin arm, the player) regrouped at the Dust Flats safehouse with the Unmowed's Stopping Stone. They
can't outdrive the Combine, so they need the Whirligig (a flying mower) from Fort Sandpit, a walled fort held by the
Spade Guard under Commander Diggs (guarded it 15 years; nobody is allowed to turn it on). Wind-Sock Wally is an old
airfield regular who sits in a lawn chair at the Desert Airfield reading the windsock. Pip bought a golden kazoo
bolt-on for his pistol at Ammu-Gnation (he wanted it since chapter 1).
Chapter 4 asks: can a crew of outcasts take a fort? Music: `sandpit` (snare march and bugle) is the chapter's theme.

## Scene 1: runway-intro (chapter-open; aim 45-70 s; was 46.7 s, 10 faults; set `kind: 'chapter-open'`)
Quest "Runway Flares": clear two Spade Guard patrols on the airfield apron, steal a Crop Duster, drop flares over the
Dust Flats for the Unmowed. Player ends on foot at the safehouse (near the player mark).
Beats:
1. Hook + the chapter question in a picture (first 10 s): keep the crane over the Dust Flats onto Fort Sandpit's walls
   (the existing `dolly`, 9 s), `chapter` stinger and `title: 'CHAPTER 4 — SANDPIT PROTOCOL'` over it, title off at its end.
2. Safehouse. Tansy at the map table with the stone, MCU: "Five snipers on the wall. One gate. We're not driving in."
3. Pip (runs in from his mark to beside the table - `run: true` - MS then MCU): "Planes don't use gates. The Desert
   Airfield has Crop Dusters."
   Tansy: "The Unmowed have to see us coming. Drop them flares."   Player: "And the guards?"
   Pip: "Two. Sleepy. Probably."
4. Meanwhile at the airfield (establish with `spot('airfield-apron','wide')` 2-3 s, then frame shots): Wally in his lawn
   chair (`gesture: 'sit'` first, his mark), binoculars up (no prop needed). Wally, MCU: "Wind west, four knots. Stall
   speed twenty-two."  A Spade Guard (guard-a) walks up to him (`walk`). Wally: "Tell Commander Diggs his tie-downs are loose."
   Guard-a (MCU): "Nobody tells the Commander anything, Wally."  (This plants Diggs: feared, by the book.)
5. Turn/button back at the safehouse - the kazoo (rung 2 of a running joke; the gag gets its own locked shot):
   Pip holds up the pistol with the golden kazoo (`held: 'ammu-golden-kazoo'`), MCU: "Ammu-Gnation bolt-on. Forty acorns."
   Tansy (MCU, flat): "You bought a kazoo."   Pip: "A golden kazoo."
   Pip blows it: a `whistle` sfx (gain 0.6) on a locked MS of Pip, `comic` stinger allowed here (the only one).
   Pip: "Toot."
   Button: Tansy's flat stare, MCU, held 1.5 s in silence (`music: null`, fade 0.4 just before it). The player walks to
   their end mark during it (`async`).
Cut: "Then we don't drive. We fly." (said in tundra-outro), "Steal a Crop Duster, then buzz the Dust Flats..." (a waypoint
read-out), "Don't clip my lawn chair".

## Scene 2: sandpit-drop-intro (intro; aim 30-45 s; was 20.0 s, 5 faults)
Quest "The Sandpit Drop": fly over Fort Sandpit, parachute onto the pad, steal the Whirligig, fly it home. Pip's second
"Okay, hear me out" of the game (the only one in chapter 4). Music `heist`. Player ends on foot at the safehouse.
Beats:
1. Hook: Pip slaps a `parachute-canopy`... (if that prefab cannot be held, skip props) - Pip bounces up to the table,
   MCU: "Okay, hear me out."  Then a reaction on the player: a blank stare, `beat('pause')` (the joke is the stare).
2. Pip: "Five snipers watch the gate. So we don't use the gate."
   Pip: "Crop Duster over the wall. Jump out. Don't check the parachute."  (insert the player's reaction between lines
   if needed for the speaker-run rule)
   Player: "Why not check it?"   Pip: "Morale."
3. Turn: Tansy takes over (she always runs the plan), MCU, three clauses: "Land on the pad. Take the Whirligig. Fly it home."
4. The picture: cut to the fort pad - `spot('fort-sandpit-pad','wide')` with the Whirligig parked on its mark
   (`carMark('fort-sandpit-pad','fort-whirligig')`) and the two snipers kneeling on their marks; a `reveal` stinger;
   then an MS low on one sniper turning his head (`face`) toward camera side. 2-4 s, no line.
5. Back at the safehouse, Tansy: "Vesper cited it for unauthorised verticality. Let's earn the ticket."
6. Button: Pip, MCU, dead serious: "Parachutes are just umbrellas with ambition."  hold 1 s.

## Done when
- Both scenes show `0 fault(s)` (or only waived) in the cutscene report; each passes its scenes.test.ts LOS run;
  `npx tsc --noEmit -p .` passes; both notes files exist and are filled; you watched both at both sizes (the parked
  Crop Duster at the airfield and the Whirligig at the safehouse must not cover a face).

## Out of scope
Every file except ch4b.ts and your two notes files.
~~~~

~~~~text
Epic: 1 Re-direction
Issue 4: ch4c.ts - sandpit-drop-outro, spade-truce-intro
Depends on: none
Your file: games/gnome-theft-auto/src/cutscene/scenes/story/ch4c.ts. Your notes: scenes/sandpit-drop-outro.md,
spade-truce-intro.md. Own dev-server port if needed: 5324. Watch out dir:
C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/w4

(Paste COMMON here.)

## Story so far (do not change these facts)
The crew (Tansy, Pip, the player) stole the Whirligig (a flying mower) off the pad inside Fort Sandpit and flew it home to
the Dust Flats safehouse. Commander Diggs of the Spade Guard has guarded that machine for fifteen years; nobody is
allowed to turn it on. Diggs: clipped military, numbers, "effective immediately"; stands at attention; shoot him LOW and
still. Vesper Thorne (the villain; soft, slow, complete sentences, never a contraction, never an exclamation mark; music
`villain` is his and only his) secretly runs the HOA and is building the Grand Combine; now he betrays the Spade Guard
too. Chapter 4 music: `sandpit`.

## Scene 1: sandpit-drop-outro (outro; aim 30-45 s; was 39.5 s, 4 faults)
Played when the player flies the Whirligig back to the safehouse. Keep the arrival vehicle `{ id: 'ride', kind:
'whirligig', from: 'player', at: up(340, 70, 60) }` with the player seated in it, and Diggs's Zero-Turn (`rideOf('diggs')`)
hidden until his entrance. The player ends ON FOOT at the safehouse near (284, 40), facing Diggs.
Beats:
1. Hook: the Whirligig descends into the safehouse in a `track` shot (the existing descent path is fine), music
   `triumph`. Tansy below, MCU, shading her eyes (`lean`): "Lower. Lower. The dust is not your friend."
2. Touchdown: `shake` 0.25 + `thud`; Pip `cheer`s, MCU: "Landed! Nobody check the parachute."
3. Turn: an `engine-rev` far off; Pip's cheer stops (cut to him freezing - `flinch` - a reaction). `music: 'chase'`.
   `track` on Diggs's Zero-Turn tearing up from the fort gate road (existing path [[374,70],[340,56],[302,44]] is fine);
   `skid` as it stops. `danger` stinger. Diggs exits (`exit`).
4. Diggs, LOW MS, still, `music: null` (silence makes the standoff): "Fifteen years I've guarded that chopper."
   (beat) Diggs, LOW MCU: "Nobody turns it on."
5. Tansy (coverage tansy/diggs - one side of their line - MCU): "We're only borrowing it."
   Diggs (LOW CU): "Nobody borrows it either."
6. Button: the player climbs out of the Whirligig (`exit`) and steps toward Diggs; a western standoff: a WIDE with the
   horizon low, the player at one edge, Diggs at the other, wind only (`ambience: 'wind'`), held 2-2.5 s. No line.

## Scene 2: spade-truce-intro (intro; aim 30-45 s; was 31.8 s, 4 faults)
Played straight after, same place (the standoff). Quest "Nobody Fires the Guard": follow Diggs back to the fort gate,
crack the HOA lockout enforcers there, take back his armory. Diggs's TURN is the spine of chapter 4: he chooses his city
over his orders. "Nobody fires the Guard. Especially not a guy in a porcelain hat." is DIGGS's line (the old scene gave it
to Tansy - fix it). Keep the parked Whirligig `{ id: 'chopper', kind: 'whirligig', from: 'player', at: [290, 38] }` and
Diggs's Zero-Turn. The player ends on foot near the safehouse.
Beats:
1. Hook: still the standoff (Diggs LOW MS facing the player). A `phone` sfx at Diggs. He answers without breaking eye
   contact (a `clutch` or raise of the hand is fine).
2. Vesper on the phone (an off-screen voice: `who: 'Vesper'`, `hz: 92`, with `music: 'villain'` and `stinger: 'villain'`
   on the first line): "Commander. The armory is locked, effective immediately."
   Vesper: "The Spade Guard is redundant. Thank you for your service."
   Keep the camera on DIGGS while Vesper talks (a slow push-in, LOW, `dolly` 4-5 s): the news lands on his face.
3. Diggs, LOW CU, after a `beat('pause')`, `music: null`: "...Redundant."
   Reaction shots: Pip and Tansy exchange a look (`exchangeLooks`), MCU of each, 1 s.
4. The turn - Diggs lowers the phone, faces the crew, LOW MCU: "Nobody fires the Guard."
   (beat) Diggs: "Especially not a guy in a porcelain hat."   `music: 'sandpit'` comes in on this line (fade 1.2).
5. Pip (MCU, side-mouth to Tansy): "Is he on our side now?"
   Tansy (MCU): "He's on his side. It's next to ours."
6. The job, Diggs to the player (LOW MS, he salutes - use `gesture: 'tipHat'` or `point`): "The armory is mine. Help me take it back."
   Diggs climbs on his Zero-Turn (`enter`) and tears off toward the fort gate (`drive` along [[302,44],[340,56],[374,70]],
   `arrive: false`, speed 15) - a `track` on it.
7. Button: Pip, MCU: "Ten acorns says he beats us to the gate."  Tansy (MCU, flat): "He already has." Hold 1 s.

## Done when
- Both scenes show `0 fault(s)` (or only waived) in the cutscene report; each passes its scenes.test.ts LOS run;
  `npx tsc --noEmit -p .` passes; both notes files exist and are filled; you watched both at both sizes (the Whirligig and
  Diggs's Zero-Turn must not cover a face; check the standoff wide reads).

## Out of scope
Every file except ch4c.ts and your two notes files.
~~~~
