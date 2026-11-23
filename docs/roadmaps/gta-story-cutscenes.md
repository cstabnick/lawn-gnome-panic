# Gnome Theft Auto: main-story cutscenes (content chunk F)

Goal: every main-story quest gets a proper scripted intro staged in the real world where its characters live; key quests
get a payoff (outro) scene or a scene that plays when the player arrives somewhere mid-quest; each chapter gets an
opening and a closing set piece, scored with music. Escalating stakes, running jokes, reveals, chapter-end cliffhangers,
callbacks to the side quests that just unlocked, and the new places (Ammu-Gnation, the Turfton Taxi and Mabel
Kerbstone, the new stage spots).

Already done by the planner (foundation, commits on `gta-content/f-story-cutscenes`):

- Live-world scenes: world-stage scenes keep traffic, pedestrians and critters running, the scene's area kept clear
  (`SceneScript.world`, `cutscene/liveArea.ts`).
- `QuestDef.outro` (a scene when the quest's last objective is done) and `scene` on `visit` objectives (a scene when the
  player arrives).
- Story music themes and stingers in `cutscene/cueAudio.ts`.
- `cutscene/scenes/story/kit.ts` helpers and the scene files `story/ch1.ts`, `ch1b.ts`, `ch2.ts`, `ch2b.ts`, `ch3.ts`,
  `ch4.ts`, `ch5.ts` (already registered in `scenes/index.ts`), with the prologue opener `prologue-intro` written in
  `ch1.ts` as the reference scene.
- The planner wires every scene into the quests (`quests/chapter1.ts`..`chapter5.ts`) after the epic, and records lore.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Story scenes | every scene id below exists, `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto` pass | 7 (1A..1G, one scene file each, all parallel) |
| (planner) Wiring, review, lore, demos | quests play the scenes; every scene watched at 960x600 and 390x844; `npm run lore` passes | - |

Online: scenes are single-player presentation (the game's net code is untouched). Mobile: the director's Next/Skip
buttons are 44 px and every scene is checked at 390x844.

## Common rules (every issue)

~~~~text
ENVIRONMENT
- Repo: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a1a37f9ec79f41947 (a git worktree; stay in it).
  Game: games/gnome-theft-auto. In Git Bash: export PATH="/c/Program Files/nodejs:$PATH" if node is not found.
- Six other workers are writing other scene files in the same folder at the same time. You own exactly ONE file
  (named in your issue). Do not edit any other file: not scenes/index.ts, not quests/chapter*.ts, not docs/lore, not the
  engine. Do not commit. Do not start a dev server: one is already running on http://localhost:5308/.
- If a check fails because of ANOTHER worker's file (a type error or a failing scene id that is not yours), ignore it
  and re-run later; only your scene ids must pass.

READ FIRST (all of them)
- docs/design/gnome-theft-auto/cutscenes.md: the scene format, steps, cameras, vehicles, audio, the LOS check.
- games/gnome-theft-auto/src/cutscene/script.ts: every field, exact names. MusicTrack, Stinger, CueSfx, Gesture lists.
- games/gnome-theft-auto/src/cutscene/scenes/story/kit.ts: helpers up(), spot(), markOf(), carMark(), pathOf(), rideOf().
- games/gnome-theft-auto/src/cutscene/scenes/story/ch1.ts: PROLOGUE_INTRO, the reference scene. Copy its style.
- The stage files for your scenes: games/gnome-theft-auto/src/quests/stages/{turfton,turftonB,cloverfield,wilds,east}.ts
  (search for `id: '<stage id>'`). Each stage has marks (where each character stands), cameras (spots with heights
  ABOVE ground), walks (idle routines), vehicles (parked / pull-up / exit marks) and paths (drivable road paths).
- games/gnome-theft-auto/src/quests/stages.ts: CAST (who drives what, with a Pay 'n' Glaze look).
- games/gnome-theft-auto/src/cutscene/cast.ts: CAST presets (preset names you can use for actors).

HOW A SCENE LOOKS
- One exported const per scene, `export const NAME: SceneScript = { id: '<exact id>', stage: { kind: 'world' }, ... }`,
  and every scene listed in the file's map: `export const CH1B_SCENES: Record<string, SceneScript> = { '<id>': NAME, ... }`
  (keep the map's exported name exactly as the stub has it).
- World stage only (real map coordinates), unless your issue says a scene is indoors. Do NOT set `world` (live is the
  default: traffic and pedestrians keep moving around the scene and the area is cleared automatically).
- Start with a `cam` step. Vary shots: an establishing dolly or crane, `track` for arrivals and drive-bys, `follow` for
  chases (offset [0, 2.2, -5.5]) and interiors (offset near the seat, lag 0), over-the-shoulder `cut`s for dialogue
  (camera 2.5-4 m from the speaker, fov 42-50, look at the speaker's id), an `orbit` for a reveal. A new shot every 1-3
  lines. Never leave a speaker tiny: for dialogue the camera is within ~5 m of the speaker.
- Characters move: walk their idle path from the stage's `walks` while others talk (`async: true`), `gesture` on lines
  (point, shrug, wave, nod, cheer, handsUp, crossArms, facepalm, bow, lean), `face` each other, `give` items
  (prop ids: golden-acorn-seed-cell, stopping-stone, sealed-letter, rolled-scroll, folded-map, ledger, brass-key,
  acorn, acorn-cake, espresso-cup, clay-jar, riding-snail, gta-pistol, gta-shotgun, gta-rifle, gta-smg, brass-calipers,
  porcelain-lantern, megaphone-cap... any @lawn/prefabs id).
- Vehicles in most scenes: arrivals (`drive` to a pull-up mark with `track` camera), getaways (`drive` with
  arrive: false and a `follow` camera), `enter`/`exit`, `horn`, `lights`. Use `rideOf('<cast id>')` for a cast member's
  own vehicle: `{ id: 'ride', ...rideOf('vesper'), at: [...], yaw: ... }` (spread gives kind + loadout). Drive along the
  stage's `paths` (pathOf(stage, pathId)) or along roads: Turfton roads run along x and z = -180, -120, -60, 0, 60, 120,
  180, 10 m wide, lanes at +-2.5 from the road's centre line.
- The player: `{ id: 'player', player: true, at: [...], yaw }` wears the player's own gnome. For an outro where the
  player arrives driving, `{ id: 'ride', kind: '<kind>', from: 'player', at: [...], yaw }` with the player actor
  `seatedIn: 'ride'` (the real vehicle the player drove; on foot a `kind` is spawned instead).
- Actors without a preset in cast.ts (Don Compost, Mayor Mulch, Mabel Kerbstone, Turncoat Cam, Rooster, Theo, Ernie,
  Frank, HOA gnomes, Spade Guards) get `look: { hat: 0x..., shirt: 0x..., beard: 0x... }` and `name: '...'`. Preset gnomes are map-sized in the world.
- Dialogue: lines short (under ~100 characters, one or two sentences), funny, in character. `who: 'Narrator'` (any
  label) for an off-screen voice, with `hz`. Names and facts must match docs/lore: search with
  `npm run lore -- find <word>` (from the repo root) before you invent a name, place, brand or fact. Never contradict
  the quest's objectives (they are in quests/chapter<N>.ts; read your quests there).
- Music and sound (important): set `music` and `ambience` on the scene; change music at the big beats
  (`{ do: 'music', track, fade }`), `stinger` on reveals, `sfx` on actions (door, skid, engine-rev, horn, glass, thud,
  punch, cash, phone, knock, whistle, alarm, boom, splash, gunshot, footsteps, door-creak, whoosh, shutter, smash...).
  Story music themes: 'turfton' (main theme), 'turfton-dusk' (main theme slow: chapter endings, quiet moments),
  'finale', 'villain' (whenever Vesper is on screen or felt), 'fescue' (Mossy Wood, the Unmowed), 'frost'
  (Frostbite Fells), 'sandpit' (Fort Sandpit, the Spade Guard, the airfield), plus 'tension', 'warm', 'heist', 'sad',
  'triumph', 'mystery', 'chase'. Stingers: reveal, danger, comic, sad, triumph, mystery, villain, chapter.
  Ambience beds: room, street, forest, wind, night, crowd, water, rain.
- Chapter opener: `{ do: 'stinger', id: 'chapter' }` with `{ do: 'title', text: 'CHAPTER 2 — BLACK DEW & GREENBACKS' }`
  over a strong shot, then `{ do: 'title', text: null }` a few seconds later. Chapter closer: end on a cliffhanger
  shot with `{ do: 'title', text: 'END OF CHAPTER 2' }` (or the next tease) and 'turfton-dusk' or 'villain' music.
- Every `async: true` step keeps the scene open until it ends: keep async walks/drives shorter than the lines they run
  under. Scenes run 30-75 s (an opener or closer up to ~100 s).
- Intro scenes end with the player actor ON FOOT within 6 m of the giver exit point given in your issue (the game puts
  the player at the exit afterwards). Outro scenes staged where the quest ends: the player actor ends on foot there.
  Outro scenes staged somewhere else: no `player: true` actor at all.
- Do not use 'call' steps (nothing listens to them for these scenes).

CHECKS (run all; fix until they pass)
1. cd games/gnome-theft-auto && npx tsc --noEmit -p .
2. cd games/gnome-theft-auto && npx vitest run src/cutscene/scenes/scenes.test.ts -t "<scene id>" for each of your ids
   (the line-of-sight and collision check: camera inside a box / underground, target hidden, actor floating or in a
   wall, path through a building). Fix by moving the camera (2+ m from buildings), moving an actor, or routing a path
   along a road. Use the stage's camera spots and marks: they are already checked.
3. Real-mesh check (lamps, trees, props without colliders), dev server already on :5308:
   node C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/chunkf/fcheck.mjs <id-prefix>
   (prints target-hidden problems per scene; a hit on a parked car sitting on your drive path is fine, those are
   hidden while a scene plays).
4. Watch each scene once: node C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/chunkf/fshots.mjs <scene id> --out C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/chunkf/<your issue>/
   It prints the subtitle per screenshot (every 2.5 s). Open 4-6 of the PNGs (Read tool) and fix: actors tiny or out of
   frame, faces hidden behind props or lamps, the camera inside something, a scene that runs on after its last line.
   Also once with --size 390x844 for your opener/closer.

REPORT: the scene ids you wrote (one line each: what happens, music used), any new lore facts you invented (names,
places, relationships) so the planner can record them, and anything you could not fix.
~~~~

## Epic 1: story scenes

Giver exit points (where intro scenes must leave the player actor on foot, within 6 m):
pip-spawn (-8, 18); mulch-club (-13, -30); side-valve (-146, 68); city-hall (4, -72); cloverfield-barn (-20, 325);
unmowed-hollow (-345, 34); fells-basin (0, -334); dust-overlook (276, 40).

Running threads to weave through (use them where your issue says):

- Pip's "technically it's not stealing" excuses and his butter knives (one for the ignition, one for emergency toast).
- Tansy's forty-seven wrenches in size order; the forty-eighth, brass, stays locked in a cigar box "until a big heist"
  (paid off in the finale).
- Vesper compliments the player's hat every time ("Nice hat. Shame if it cracked."), a little colder each time.
- Asphalt the cat at Bodega & Sons bats a bottlecap across the counter at every crisis (John Bodega narrates).
- Don Compost never speaks: taps on his cane or armrest (one = fetch a mower, two = bring acorns, three = crack a hat).
- Mabel Kerbstone and the Turfton Taxi ("Turfton Taxi, on my way!", "Hop in, dear. Meter's already running."): she
  won't take a fare with the Hat Watch after them or a contract running ("Not on a job, dear."), until the epilogue.
- Ammu-Gnation on the east road (x 200, z -30): "The Gun Is Free. The Shiny Bits Are Not." Pip wants the golden kazoo
  muzzle.
- Mayor Barnaby "Two-Coat" Mulch's coats of red paint (a third coat after the finale).
- Turncoat Cam sweeping the Side-Valve apron, glancing at the bay too often (he betrays the crew in chapter 3).

~~~~text
Issue 1A: Prologue payoff, First Contract, Mower's Keepers  (file: src/cutscene/scenes/story/ch1.ts)
Epic: 1. Story scenes
Depends on: none

## Goal
Add four scenes to ch1.ts next to the existing PROLOGUE_INTRO (do not change PROLOGUE_INTRO or its id).

## Change
src/cutscene/scenes/story/ch1.ts: add these to CH1_SCENES.

1. 'prologue-outro' (outro of Fresh Out the Kiln; quest ends at the Side-Valve bay, player arrives driving a Ride-On
   following Pip). Stage side-valve-bay. Music 'turfton' -> 'mystery' at the reveal. Ambience 'street'.
   Beats: track camera on the player's ride (from: 'player', kind 'ride-on') pulling onto the apron behind Pip's
   push-bike; Tansy under her smoking orange Zero-Turn (rideOf('tansy'), parked at its mark) slides out, wipes her
   glasses. Turncoat Cam (look: { hat: 0xf4f4f8, shirt: 0xc9b99b }, name 'Turncoat Cam') sweeps the apron along his
   idle walk, glancing at the bay. Tansy: brusque welcome, chicory coffee not kicked in. Pip: the crate hums. Tansy
   pries the Fescue crate (a 'crate' prop) with a wrench (sfx door-creak / thud), lifts out the Golden Acorn
   (hold 'golden-acorn-seed-cell'), orbit shot, stinger 'reveal', music 'mystery'. Pip: "Okay, yeah. That might not be
   grass." Tansy: it smells of Chirp & Crumb and Fescue: trouble. Cut to Cam stopping his broom, watching (stinger
   'mystery'). Tansy pockets it; side-job tease: "And stay away from Mossley outside Bodega's. He'll make you measure
   the grid." (unlocks the Grid Truthers job). End with player actor on foot near (-146, 68).

2. 'first-contract-outro' (outro of First Contract; the last target is cracked far away, so NO player actor).
   Stage mulch-club-door at dusk. Music 'heist' -> 'triumph' sting. Ambience 'night'.
   Beats: track camera: Don Compost's gloss-black Lowrider (rideOf('don-compost')) rolls up the x = 0 road (path
   mulch-club-approach) to the pull-up mark, bodyguard opens up; Don Compost (look { hat: 0x141414, shirt: 0xefe6d2,
   beard: 0xdddddd }, name 'Don Compost') steps out, walks to the side door. A bodyguard (two bodyguards at their marks,
   look { hat: 0x18181e, shirt: 0x23262e }) holds up the three wanted posters' worth of news: "Dibbler. Gravelbottom.
   Spadewell. All three cracked, boss." Don taps his cane three times (three sfx 'knock'). Bodyguard: "Three taps.
   You're a Made Gnome now. The Wiseguy Hat's on the house." Second bodyguard: "Your Kiln-Debt just got a thousand
   Acorns lighter." Don taps once more, everyone freezes; he just wanted the door held. stinger 'comic'.

3. 'mowers-keepers-intro' (intro of Mower's Keepers; giver side-valve, exit (-146, 68)). Stage side-valve-bay, then a
   cut to picnic-median (turftonB.ts, the HOA clamps at block (60, -60)). Music 'turfton', ambience 'street'.
   Beats: morning at the bay; Tansy with chicory coffee (held 'espresso-cup'); Pip circling his red Zero-Turn
   (rideOf('pip')) on his idle walk. Tansy: the HOA put giant clothespins on three Cloverfield farmers' Push-Mower
   Bikes at block (60, -60); "technically code-enforced". Cut to picnic-median: two HOA Enforcers (look { hat: 0x18181e,
   shirt: 0xc9b99b }) beside clamped push-bikes, one writing a ticket. Back at the bay, Pip: Husky-Blade two-strokes,
   loud enough to wake the Tall Ones. Tansy: crack the enforcers, haul the bikes back, watch for process servers.
   Turncoat Cam sweeping in the background. End with the player on foot near (-146, 68).

4. 'mowers-keepers-outro' (outro; the quest ends at the bay after cracking the HOA process server at (-142, 66)).
   Stage side-valve-bay. Music 'tension' -> 'villain'. Beats: the eviction notice taped to the bay door (a
   'sealed-letter' prop on the door at the process server's mark); Tansy rips it off and reads it; Pip reads over her
   shoulder: "Eviction? We don't even pay rent." Tansy: "Exactly." Then a slow track shot: a pearl-white Lowrider
   (rideOf('vesper')) cruises past on the z = 60 road (path side-valve-approach reversed, or along z = 57.5 from x = -60
   to x = -200, arrive: false) at walking pace, gold underglow, nobody visible inside; music 'villain', stinger
   'villain'. Tansy: "Vesper Thorne. He doesn't knock. He files." End: player on foot near (-146, 68).

## Done when
Common checks 1-4 pass for: prologue-outro, first-contract-outro, mowers-keepers-intro, mowers-keepers-outro.

## Out of scope
Every other file. PROLOGUE_INTRO stays as it is.
~~~~

~~~~text
Issue 1B: Two-Coat Tail, the Glaze & Tax Break-In, Founder's Boot, chapter 1 closer  (file: src/cutscene/scenes/story/ch1b.ts)
Epic: 1. Story scenes
Depends on: none

## Goal
Seven scenes in ch1b.ts (CH1B_SCENES).

## Change
1. 'two-coat-intro' (giver city-hall, exit (4, -72)). Stage city-hall-steps. Music 'turfton', ambience 'crowd'.
   Beats: Councilwoman Juniper Vance (preset 'juniper') at the podium giving the noon statement to two press gnomes
   (marks 'press'); Mayor Barnaby "Two-Coat" Mulch (look { hat: 0x2c3e50, shirt: 0x8b1e24, beard: 0xeeeeee,
   glasses: true }, name 'Mayor Mulch') grinning with giant scissors (snip sfx: 'shutter'). Statement over, she walks
   to the player (her idle path). Juniper: they call her The Trowel; her brother Reginald calls Vesper's 400-page Grass
   Height Impact Studies "light reading". The Mayor waves, climbs onto his candy-red Ride-On (rideOf('mayor-mulch'),
   parked at mayor-ride-on mark) and putters off east (city-hall-getaway path, arrive: false), bell ringing.
   Juniper: he's sneaking to Patio Heights; tail him past Bodega's, catch the handover, bring the photos back.
   She hands the player a camera ('field-camera'). Mabel Kerbstone's yellow taxi (kind 'ride-on', tint 0xf2c230,
   name on actor 'Mabel Kerbstone', look { hat: 0xf2c230, shirt: 0x2b2b2b, hair: { color: 0xbbbbbb, style: 'pigtails' }, beard: null })
   pulls up at the kerb behind (city-hall-steps pull-up); Mabel: "Turfton Taxi! Hop in, dear." Juniper: "They're on a
   job, Mabel." Mabel: "Not on a job, dear. Suit yourself." and drives off. End: player on foot near (4, -72).

2. 'two-coat-handover' (ARRIVAL scene: plays when the player reaches the Patio Heights courtyard at (165, -165) while
   tailing the Mayor). Stage patio-gallery (turftonB.ts). Music 'heist' -> 'danger' stinger. Ambience 'night'.
   No player actor needed, but you may show the player hiding (player actor crouched behind a planter, 'lean').
   Beats: the Mayor's red Ride-On parked; Vesper "The Glazier" Thorne (preset 'vesper') beside his pearl Lowrider
   (rideOf('vesper')). The Mayor hands over a 'ledger' (median leases); Vesper hands an envelope ('sealed-letter') back
   (give steps). Vesper inspects the Mayor's paint: "A second coat, Barnaby? Streaky." Camera flash (sfx 'shutter',
   a quick cut through a hedge-level camera = the player's photo). The Mayor spins round: "That was a different glaze!"
   Vesper, unbothered, gestures; two HOA bodyguards turn towards the camera: stinger 'danger', music 'chase'.
   Last shot holds on Vesper: "Nice hat. Shame if it cracked." (said to the camera / the player).

3. 'two-coat-outro' (quest ends at City Hall (0, -72) delivering the photos). Stage city-hall-steps at dusk.
   Music 'warm'. Beats: Juniper takes the camera, flicks through, a slow smile. Juniper: "Signing the medians straight
   over to Vesper. Barnaby, Barnaby." Reginald Vance (preset 'reginald') arrives in his HOA Code-Enforcement van
   (rideOf('reginald')) along the z = -60 road, gets out with brass calipers, measures the lawn by the steps:
   "Juniper. Your grass is a quarter-inch proud." Juniper: "Reginald. Your boss is a crook." He leaves stiffly.
   Juniper to the player, side-job tease: "Big Lou at the Gnomecino says the Glaze & Tax boys are squeezing him too."
   End: player on foot near (4, -72).

4. 'tax-break-in-intro' (giver side-valve, exit (-146, 68)). Stage side-valve-bay. Music 'villain' then 'heist'.
   Beats: Vesper's pearl Lowrider pulls up on the apron (arrival track shot, stinger 'villain'); Vesper steps out,
   walks to Tansy; Pip hides behind a barrel (handsUp). Vesper serves Tansy a 48-hour foreclosure lien
   ('sealed-letter' give): "Forty-eight hours, Ms. Clayfoot. Nice hat, by the way. Shame if it cracked." He eyes the
   bench: "And do not open that Seed-Cell crate." He drives off. Tansy (music to 'heist'): he filed her deed at the
   Glaze & Tax Office under Thorne Tower; crack his auditors, raid the vault, take the Buck-Iron Combine, "famous for
   opening with a butter knife". Pip: "I brought two butter knives. One for the ignition, one for emergency toast."
   Tansy, Ammu-Gnation tip: "Guns are free at Ammu-Gnation on the east road. The shiny bits are not." Pip: "I want the
   golden kazoo." End: player on foot near (-146, 68).

5. 'tax-break-in-outro' (quest ends at the bay; player arrives driving the stolen Buck-Iron Combine: vehicle
   { id: 'ride', kind: 'combine', from: 'player', ... } at the bay pull-up, player seatedIn). Stage side-valve-bay.
   Music 'heist' -> 'mystery' -> 'villain'. Beats: the combine rumbles onto the apron (track shot, sfx engine-rev,
   shake 0.08); player climbs down; Pip cheers. Tansy unrolls the stolen blueprints on the workbench ('folded-map' or
   'rolled-scroll' prop on the bench): close dolly down onto it. Tansy reads: The Grand Combine. "A harvester the size
   of a block. Zero-millimetre scalp." Pip: "What does it run on?" Tansy, quietly: "A Fescue Golden Acorn." Everyone
   turns to look at the crate (stinger 'reveal', music 'villain'). Turncoat Cam, sweeping, stops. End: player on foot
   near (-146, 68).

6. 'founders-boot-intro' (giver side-valve, exit (-146, 68)). Stage side-valve-bay, then a cut to the amphitheater
   stage (turftonB.ts) and the parade. Music 'turfton', ambience 'crowd'. Beats: Tansy: Vesper scheduled an emergency
   HOA zoning tribunal at the Amphitheater during the Founder's Trim Day parade so nobody can protest. Cut to the
   amphitheater: Reginald at the jury box with calipers, citing Municipal Code §404-B; HOA bailiffs. Cut to the
   parade route: the 30-foot Gnorwin Clayfoot Boot float (kind 'boot-float') rolling slowly along its path (stage path
   'parade-route' if usable, else a road). Back at the bay: Pip: "What if we steal the Boot and park it in the jury
   box?" Tansy, after a beat: "...Yes." End: player on foot near (-146, 68).

7. 'founders-boot-outro' (CHAPTER 1 CLOSER; quest ends at the bay; the player arrives in Pip's getaway Combine:
   from: 'player', kind 'combine'). Stages side-valve-bay, then patio-gallery (Vesper's home turf), then Bodega front
   for the Asphalt cameo. Music 'triumph' -> 'turfton-dusk' -> 'villain'.
   Beats: arrival at the bay, the crew cheers, Tansy holds up the stamped deed ('ledger'), Pip does a lap of joy.
   Cut: Bodega & Sons, John Bodega sweeping: Asphalt bats a bottlecap; "Turfton FM says the Boot parked itself in the
   jury box. Asphalt says she knew." Cut: patio-gallery at dusk: Vesper alone with his Lowrider; Reginald arrives in
   his van, calipers bent: "They crashed the tribunal, sir. With a boot." Vesper: "Then we stop asking." "Freeze the
   Black Dew. Cloverfield first." Music 'villain', stinger 'villain'; Vesper's Lowrider leaves south. Title
   'END OF CHAPTER 1'. End with the player actor on foot at the bay before the Vesper cut (that is where the game puts
   them).

## Done when
Common checks 1-4 pass for all seven ids.

## Out of scope
Every other file.
~~~~

~~~~text
Issue 1C: Chapter 2 opener, Dew Run, Sprinkler Gauntlet  (file: src/cutscene/scenes/story/ch2.ts)
Epic: 1. Story scenes
Depends on: none

## Change
CH2_SCENES gets four scenes. Stages in cloverfield.ts: granny-barn, south-highway-diner, rooster-windmill, south-barn,
driftwood-trailer, biscuits-nap.

1. 'dew-run-intro' (CHAPTER 2 OPENER; giver cloverfield-barn, exit (-20, 325)). Music 'turfton' -> 'warm', ambience
   'wind'. Beats: drive-by shot: the player's ride (from: 'player', kind 'ride-on') with Pip on the passenger seat
   (seat 1) heading south down the highway into Cloverfield, fields both sides; title 'CHAPTER 2 — BLACK DEW &
   GREENBACKS' with stinger 'chapter'. Pull up at Granny Gnertrude's barn (preset 'granny') sitting on the porch with
   her double-barrel over her prize pumpkins; Farmer Bramble (preset 'bramble') walking his idle path. Granny: Vesper's
   boys are draining the Cloverfield Dew-Wells dry; pure 87-octane Black Dew, 100% unlicensed, just how she likes it.
   A Black Dew convoy (an HOA van 'hoa-van' and a tanker ride-on, tint 0xf08a24) rumbles past on the highway behind
   them (track shot). Granny: borrow a Buck-Iron Combine, park it across the South Highway by Fence-Post Frank's
   sign, bring that Dew-Hauler to her barn. "Try not to splatter my pumpkins. They're load-bearing." End: player on
   foot near (-20, 325).

2. 'dew-run-outro' (quest ends at Granny's barn (-25, 330): the player drives in the stolen Dew-Hauler, a Ride-On:
   from: 'player', kind 'ride-on'). Music 'triumph' -> 'warm'. Beats: arrival; Granny taps the tank, sniffs: "Now we
   can cook." Pip reads a letter ('sealed-letter'): Clay-Mart Collections: the 5,000-Acorn Kiln-Debt is PAID (stinger
   'triumph', sfx 'cash'). Pip: "We're legitimate! ...Don't tell anyone." Granny pours tea. Side-job tease: Farmer
   Bramble: "Something big's been napping in Biscuit's Nap again. Paw prints like dinner plates." End: player on foot
   near (-20, 325).

3. 'sprinkler-intro' (giver cloverfield-barn, exit (-20, 325)). Music 'tension', ambience 'wind'. Beats: Rooster
   "Squall-Box" Weatherby (look { hat: 0xbfc3c7, shirt: 0x6b7a3a }, name 'Rooster Weatherby') on the windmill platform
   (rooster-windmill stage, his mark with lift) shouting through his tin funnel: "THE BAROMETER IS DROPPING! VESPERS IN
   THE CLOUDS!" Cut to the barn: Granny: Reginald Vance's laser-level squad is foreclosing on her back-forty acorn
   silo. A van (rideOf('reginald')) crawls along the farm road with surveyors walking beside it. Pip: towing a silo
   through oscillating sprinklers? "Do you know what cold thermal shock does to cheap kiln glaze?" Granny: "Then drive
   fast, sugar." End: player on foot near (-20, 325).

4. 'sprinkler-outro' (quest ends at the south barn (40, 444) after cracking the foreclosure team). Stage south-barn,
   then driftwood-trailer (very close). Music 'warm' -> 'mystery'. Beats: Granny arrives on her lilac Ride-On
   (rideOf('granny')) with a cooler of pies; slips the player a crate of forged HOA permits ('ledger'): "Official as a
   pie crust." Pip eats a pie. Then a drifting harmonica-ish stinger 'mystery': at the trailer, Driftwood (preset
   'driftwood') lashed to his lawn-boat trailer calls over: "You lot! Seen a turtle? Big as a barn. Keeps a loch
   tidy." Granny: "Ignore him, he's been out in the sun since spring." (sets up the Castaway job). End: player on foot
   near (40, 444).

## Done when
Common checks 1-4 pass for all four ids (also the 390x844 watch for dew-run-intro).

## Out of scope
Every other file.
~~~~

~~~~text
Issue 1D: Vesper's Offer, the Cracked Tablet, chapter 2 closer  (file: src/cutscene/scenes/story/ch2b.ts)
Epic: 1. Story scenes
Depends on: none

## Change
CH2B_SCENES gets five scenes. Stages: granny-barn, south-highway-diner (cloverfield.ts); unmowed-hollow,
sorrel-radio-booth, compost-heap (wilds.ts); side-valve-bay (turfton.ts).

1. 'vespers-offer-intro' (giver cloverfield-barn, exit (-20, 325)). Music 'villain', ambience 'wind'. Beats: a
   pearl-white Lowrider (rideOf('vesper')) slides up the barn track (track shot, stinger 'villain'); a chauffeur HOA
   gnome (look { hat: 0x18181e, shirt: 0xc9b99b }) gets out and hands Granny a sealed invitation ('sealed-letter').
   Granny holds it at arm's length, reads (Vesper's voice as `who: 'Vesper Thorne'` off screen, hz 92): "Meet me at the
   South Highway diner. Come alone. Wear the hat." Cut to the diner (south-highway-diner): Vesper alone in the window
   booth position stirring tea, Fence-Post Frank (look { hat: 0x8b5a2b, shirt: 0x6b4a2e }, name 'Fence-Post Frank')
   leaning on his sign waving at traffic. Granny: "It's a trap, sugar. Go anyway. Hear what he wants." Granny lends her
   shotgun prop ('gta-shotgun') to the player (give). End: player on foot near (-20, 325).

2. 'vesper-diner' (ARRIVAL scene: plays when the player reaches the diner at (0, 245)). Stage south-highway-diner.
   Music 'villain' -> 'danger'. Player actor present, ends on foot at the diner (it is where the player is).
   Beats: Vesper waiting outside by his Lowrider (or at the diner's marks), polishing his monocle (calipers prop).
   Vesper: hand over the Golden Acorn and Thorne Lawn & Order LLC wipes Tansy's lien and deeds you a Patio Heights
   astro-turf penthouse. "Full Kiln-Shield coverage. Zero-millimetre uniformity." "Order over chaos, friend." The
   player shrugs (gesture) and says no (short, dry line). Vesper: "A pity. Porcelain does not negotiate twice."
   He taps his calipers on the Lowrider's roof; an HOA van's doors (sfx 'door') and three Porcelain Guards (look
   { hat: 0xf4f4f8, shirt: 0xe6e8f0, skin: 0xfafafa }) step out around the player (walk). Vesper drives off north
   (diner-getaway path, arrive: false); stinger 'danger', music 'chase'.

3. 'compost-forge' (ARRIVAL scene: plays when the player reaches the Compost Heap forge at (-255, -60) while scouting).
   Stage compost-heap. Music 'mystery' -> 'villain'. Ambience 'forest'. Beats: from cover, the player watches HOA
   welders (look { hat: 0x18181e, shirt: 0xc9b99b }) at the furnace riveting curved armour plates (props 'pot-lid-shield'
   or 'millstone' scaled up as plates) for the Grand Combine, sparks (sfx 'smash'/'thud' rhythm). Ash-Shovel Ernie
   (look { hat: 0x555555, shirt: 0x6b4a2e }, name 'Ash-Shovel Ernie') stokes the furnace, humming, roasting chestnuts on
   a trowel. Welder: "Thirty plates by Friday. The Glazier wants it scratch-proof." Second welder: "Scratch-proof? It's
   a harvester." First: "Tell HIM that." Ends on the player (crouched, 'lean') ready to strike; player ends on foot
   near (-255, -60).

4. 'tablet-intro' (giver unmowed-hollow, exit (-345, 34)). Stage unmowed-hollow, a cut to sorrel-radio-booth.
   Music 'fescue', ambience 'forest'. Beats: standing stones, the fire; Elder Bracken (preset 'bracken') rises:
   "A Potsworth in Mossy Wood, reeking of Black Dew!" Pip (preset 'pip') shrinks. Bracken: "Your cousin Wendel is
   regent of Fescue, and you traded the old soil for Stink-Gro and engines." Sorrel Tillbrook (preset 'sorrel') walks
   over from her radio booth (cut to the booth first: she takes off headphones): "Steady, Elder. Show them the
   tablet." Bracken unwraps a cracked earthenware tablet ('stone-plaque' prop, small): close dolly. Sorrel: Vesper's
   Grand Combine is patterned after the one in the Shed. Bracken: only a Fescue Stopping Stone can jam it. "Clear his
   welders at the Compost Heap. Bring their armoured rig here." Sorrel: "After this, 88.7 is playing forty-five minutes
   of rain on terracotta." End: player on foot near (-345, 34).

5. 'tablet-outro' (CHAPTER 2 CLOSER; quest ends at the hollow (-345, 34), the player arrives driving the armoured HOA
   Ride-On: from: 'player', kind 'ride-on'). Stages unmowed-hollow, then side-valve-bay at night. Music 'fescue' ->
   'sad' -> 'villain'. Beats: the rig rolls in; Bracken lays his hand on an armour plate; he holds up the Stopping Stone
   (held 'stopping-stone'), emerald runes; the jokes stop. Pip, quietly: "Wait... they're really gonna level the whole
   lawn?" Bracken: "They have done it before. Long ago. To us." (music 'sad'). Side-job tease (Fescue Fugitive):
   Sorrel: "There's a girl from Fescue hiding in the hollow. She'll want to talk to you." Cut: Side-Valve bay at night,
   rain ambience; Turncoat Cam (look { hat: 0xf4f4f8, shirt: 0xc9b99b }) alone by the bench with a tin-can phone
   ('tin-can-phone' prop or held 'espresso-cup' if that prefab cannot be held), lit by a lamp: "The acorn's in the
   crate under the bench. Tuesday. And the racing charter's mine." Vesper's voice (off screen, hz 92): "Of course,
   Cameron." stinger 'villain'. Title 'END OF CHAPTER 2'. End with the player actor on foot at the hollow before the
   bay cut.

## Done when
Common checks 1-4 pass for all five ids (and the 390x844 watch for tablet-outro).

## Out of scope
Every other file.
~~~~

~~~~text
Issue 1E: Chapter 3 Cold Clay  (file: src/cutscene/scenes/story/ch3.ts)
Epic: 1. Story scenes
Depends on: none

## Change
CH3_SCENES gets six scenes. Stages: side-valve-bay, bodega-front, culvert-under-deck (turfton*.ts); birdbath-basin,
kiln-shrine, theo-camp, salt-plow-blockade (wilds.ts); dust-safehouse (east.ts).

1. 'salvage-raid-intro' (CHAPTER 3 OPENER; giver side-valve, exit (-146, 68)). Music 'tension' -> 'chase', ambience
   'rain'. Beats: rain at the bay. HOA vans (kind 'hoa-van') tear in along the stage path 'hoa-raid' with sirens (sfx
   'alarm'), track shots; Turncoat Cam steps out of the first van (betrayal reveal, stinger 'reveal'). Vesper (preset
   'vesper') follows, walks to the bench, takes the Golden Acorn from the crate (Cam gives it: hold/give
   'golden-acorn-seed-cell'). Vesper to the player: "Nice hat. Shame." (he does not finish it). Title
   'CHAPTER 3 — COLD CLAY' with stinger 'chapter'. Tansy: "Cam sold us out for a Patio Heights racing charter!" She
   slips into the storm drain (walk off to the culvert direction / despawn behind the bay). A raider swings; Pip shields
   the player: sfx 'glass', shake 0.25, stinger 'sad' — Pip's clay arm cracks clean off at the shoulder (Pip gesture
   'handsUp' then 'facepalm'). Pip: "My arm! Take my Zero-Turn and go north up the Ring Road!" Vesper's Lowrider leaves
   with the acorn (getaway, arrive: false). Cut: Bodega & Sons in the rain (bodega-front): sirens pass; John Bodega:
   "Asphalt doesn't even blink. Just bats the bottlecap." End: player on foot near (-146, 68), music 'chase'.

2. 'salvage-raid-outro' (quest ends at the Frozen Birdbath Basin (0, -340); the player arrives on Pip's Zero-Turn:
   from: 'player', kind 'zero-turn', Pip seated as passenger seat 1 clutching his arm). Stage birdbath-basin. Music
   'frost', ambience 'wind'. Beats: snow, the frozen birdbath; Father Loam (preset 'loam') preaching from his
   "snowmobile" (rideOf('loam')) to nobody. Arrival track shot. Loam: "Another cracked pilgrim. Sit by the stove."
   Pip: "It's a hairline fracture. ...Did my elbow just rattle?" Loam: excommunicated from the Chapel of Mulch for
   preaching on a snowmobile, yet here we are. Side-job tease (Tessie): Loam: "A castaway at Loch Moss keeps sending
   snails about a turtle. Big as a barn." End: player on foot near (0, -334).

3. 'kiln-resin-intro' (giver fells-basin, exit (0, -334)). Stage birdbath-basin, cut to kiln-shrine and to the
   salt-plow-blockade. Music 'frost'. Beats: Loam stirring Kiln-Resin on the stove (held 'clay-jar'); Pip's arm in a
   sling. Loam: fetch Kiln-Resin from the northern shrine; cut to the shrine (wide, mystery sting); clear the HOA
   salt-plow crew; cut to two salt-plow drivers by their vans; then hold the basin for ninety seconds while he cures
   Pip's glaze. Pip: "Ninety seconds? I've glued a hat in less." End: player on foot near (0, -334).

4. 'kiln-resin-outro' (quest ends at Thermos Theo's barrel (40, -330)). Stage theo-camp. Music 'warm' -> 'mystery'.
   Beats: Thermos Theo (look { hat: 0x9e3b2a, shirt: 0x4a5a6a, beard: 0xdddddd }, name 'Thermos Theo') pours tea by
   the burning barrel; Pip flexes his resin arm: "Good as new. Shinier, even." A racing snail (prop 'riding-snail',
   small) creeps up with a micro-scroll; Theo hands over the scroll ('rolled-scroll'). The player reads (Tansy's voice
   off screen): "Found the Stopping Stone. Dust Flats. Bring Pip. Bring snacks." Side-job tease: Theo: "Baroness
   Brenda's been asking for you down the canal. Something about a hose." End: player on foot near (40, -330).

5. 'tundra-intro' (giver fells-basin, exit (0, -334)). Stage birdbath-basin. Music 'frost' -> 'heist'. Beats: Pip and
   Loam strap ice-packed Black Dew barrels ('gta-dew-barrel' props) onto a Zero-Turn (kind 'zero-turn'); Pip: keep it
   clean, the loyal Carburettors need every drop; Loam blesses the mower with compost tea (gesture 'bow'); horn test.
   Pip: "Ring road east. Don't drift. ...Okay, drift a little." End: player on foot near (0, -334).

6. 'tundra-outro' (CHAPTER 3 CLOSER; quest ends at the Dust Flats Overlook after cracking the spotters (275, 45)).
   Stage dust-safehouse (east.ts). Music 'warm' -> 'turfton-dusk' -> 'villain'. Beats: dusk on the overlook; Tansy
   (preset 'tansy') steps out of the safehouse holding the Stopping Stone (held 'stopping-stone'); reunion: she sees
   Pip's resin arm, hugs him (gestures). Commander Diggs's Fort Sandpit walls glow in the distance (a wide shot towards
   (374, 44)). Far off, a deep machine horn (sfx 'alarm' low gain, shake 0.05): the Grand Combine has fired up.
   Tansy: "Vesper's put the acorn in it. We can't outdrive that thing." Pip looks at the sky: "Then we don't drive."
   Tansy: "Fort Sandpit has a Whirligig." Title 'END OF CHAPTER 3'. Side-job tease: Burt the ex-HOA citation writer
   asked about an audit (one line). End: player on foot near (276, 40).

## Done when
Common checks 1-4 pass for all six ids (and the 390x844 watch for salvage-raid-intro).

## Out of scope
Every other file.
~~~~

~~~~text
Issue 1F: Chapter 4 Sandpit Protocol  (file: src/cutscene/scenes/story/ch4.ts)
Epic: 1. Story scenes
Depends on: none

## Change
CH4_SCENES gets five scenes. Stages (east.ts): dust-safehouse, airfield-apron, fort-sandpit-gate, fort-sandpit-pad.

1. 'runway-intro' (CHAPTER 4 OPENER; giver dust-overlook, exit (276, 40)). Music 'sandpit', ambience 'wind'. Beats:
   wide crane over the Dust Flats to Fort Sandpit's walls; title 'CHAPTER 4 — SANDPIT PROTOCOL' + stinger 'chapter'.
   At the safehouse map table ('map-table' prop or the stage's set), Tansy: "I've got the Stopping Stone. We're not
   driving a combine through Fort Sandpit's front gate." Pip: clear the Spade Guard apron patrols at the Desert
   Airfield, steal a Crop Duster, buzz the Dust Flats to signal the Unmowed team. Cut to the airfield apron:
   Wind-Sock Wally (preset 'wally') in his lawn chair with binoculars ('loch-binoculars'), chili pot, the Crop Duster
   (kind 'plane') on the apron; two Spade Guards (look { hat: 0x4b6329, shirt: 0x556b2f }) patrol. Wally reads the
   windsock aloud; "Stall speed's 22, kid. Don't clip my lawn chair on the way up." Back at the safehouse: Pip has a
   golden kazoo muzzle from Ammu-Gnation on his pistol (held 'ammu-golden-kazoo'); toots it (stinger 'comic'). End:
   player on foot near (276, 40).

2. 'sandpit-drop-intro' (giver dust-overlook, exit (276, 40)). Music 'heist'. Beats: Pip's plan on the map table:
   five Spade Guard snipers watch the gate, so they fly a Crop Duster over the wall and bail out "without checking the
   parachute". Tansy: land on the Whirligig pad, the chopper Vesper cited for "unauthorized verticality". Show the pad
   (fort-sandpit-pad stage): the Whirligig (kind 'whirligig') under a guard's eye. Pip: "Parachutes are just umbrellas
   with ambition." End: player on foot near (276, 40).

3. 'sandpit-drop-outro' (quest ends at the safehouse (280, 40), the player flies the Whirligig in: vehicle
   { id: 'ride', kind: 'whirligig', from: 'player', at: [x, y, z] } descending with a `drive` on [x, y, z] points to the
   ground). Music 'triumph' -> 'danger'. Beats: the Whirligig lands in a dust cloud (shake), the crew cheers. Then an
   engine scream: Commander Diggs (preset 'diggs') tears out of the fort gate on his olive Zero-Turn (rideOf('diggs'))
   along the stage path diggs-to-gate reversed or a road towards the safehouse, track + follow shots, music 'chase',
   skids to a stop (sfx 'skid'), rifle up. Diggs: "Fifteen years I've guarded that chopper. Fifteen years nobody's
   been allowed to turn it on." Stinger 'danger'. Hold on the standoff (cliffhanger). End: player on foot near the
   safehouse (276, 40).

4. 'spade-truce-intro' (giver dust-overlook, exit (276, 40)). Music 'tension' -> 'sandpit'. Beats: the standoff
   continues; Diggs's radio crackles (sfx 'phone'); Vesper's voice off screen (hz 92): the armory is locked remotely,
   the Spade Guard is "redundant", effective immediately. Diggs lowers the rifle slowly. Diggs: "Redundant." Tansy:
   "Nobody fires the Guard. Especially not a guy in a porcelain hat." Diggs: "Roll with me back to the gate and help me
   take my armory back." He climbs on his Zero-Turn. End: player on foot near (276, 40).

5. 'spade-truce-outro' (CHAPTER 4 CLOSER; quest ends at the armory inside the gate (374, 10)). Stages fort-sandpit-pad
   / fort-sandpit-gate, then a cut far north to the Turfton meridian. Music 'sandpit' -> 'triumph' -> 'villain'.
   Beats: Diggs throws the armory doors (sfx 'door', then 'cheer' gestures); Spade Guards salute. Arrivals montage at
   the gate, one track shot each: Granny on her lilac Ride-On (rideOf('granny')) with pies; Elder Bracken on foot (he
   rides nothing); Tansy and Pip on their Zero-Turns (rideOf('tansy'), rideOf('pip')). Diggs: "Spade Guard, Unmowed,
   Carburettors, Cloverfield. In one sandbox." Granny: "I brought pie." Then the ground shakes (shake 0.15, sfx
   'boom' low): cut to the north end of Turfton's x = 0 meridian (around (0, -230), look south): the Grand Combine prop
   ('grand-combine-boss', size ~14 m) seen low and huge, headlights; Vesper's voice over a PA (hz 92): "Tonight, Turfton
   achieves zero-millimetre perfection." Stinger 'villain'. Title 'END OF CHAPTER 4'. Side-job tease (Porcelain
   Support): Clara's refugees need a lift (one line from Tansy). End: player actor on foot at the fort before the
   meridian cut.

## Done when
Common checks 1-4 pass for all five ids (and the 390x844 watch for runway-intro).

## Out of scope
Every other file.
~~~~

~~~~text
Issue 1G: Chapter 5 The Even Cut: opener and the epilogue  (file: src/cutscene/scenes/story/ch5.ts)
Epic: 1. Story scenes
Depends on: none

## Change
CH5_SCENES gets two long set pieces (60-100 s each). Stages: dust-safehouse (east.ts), meridian-finale,
city-hall-steps, side-valve-bay, bodega-front, gnomecino-door (turfton*.ts), brenda-throne (cloverfield.ts).

1. 'even-cut-intro' (CHAPTER 5 OPENER; giver dust-overlook, exit (276, 40)). Music 'villain' -> 'finale'. Beats:
   Night at the safehouse. Tansy: the Grand Combine just crossed z = -300 on the centre meridian; four minutes to
   downtown, set to zero-millimetre scalp. Cut: the Combine prop ('grand-combine-boss', ~14 m) rolling south along
   x = 0 around z = -250 (a moving prop: spawn it at successive points, or a slow dolly past a still prop), HOA vans
   escorting (kind 'hoa-van' driving the meridian). Cut: Baroness Brenda's canal throne (brenda-throne): Granny with
   her Cloverfield girls and Brenda's push-bike gang: "We're holding the south canal. Jam that intake, sugar!" Cut:
   Diggs: "Nobody levels my sandbox, or your city, without a permit." Vesper's PA over everything (hz 92): "Look at
   yourselves. Chipped! Muddy! Unregulated!" Back at the safehouse, running-joke payoff: Tansy opens the cigar box and
   takes out the forty-eighth wrench, the brass one (held 'salvage-wrench-pack' or 'iron-trowel' if no wrench prop:
   check prefabs for a wrench); "For a big heist." Pip: "Let's go jam a god-machine with a rock!" Title
   'CHAPTER 5 — THE EVEN CUT' with stinger 'chapter', music 'finale'. Final cut: Bodega & Sons, the neon window
   rattling as the Combine's shadow passes (shake 0.05), John Bodega: "Asphalt hops down off the counter. She's never
   done that." End: player on foot near (276, 40).

2. 'even-cut-outro' (THE EPILOGUE; the quest ends at the jammed Combine on the meridian (around (0, 0)). The choice
   (Unmowed Monument or Turfton Rewired) was already shown in a toast; keep the epilogue true for both endings).
   Music 'turfton-dusk' -> 'turfton' -> 'triumph'. Beats (a montage, one place per shot, each with motion):
   - Meridian at dawn: the Grand Combine prop silent, jammed, the Stopping Stone in its intake; Juniper Vance with
     Reginald, who quietly measures the scar and for once says nothing; Vesper's porcelain hat lies cracked on the road
     (a hat prefab, e.g. 'pointy-hat' tinted dark is not possible: use any hat prop). Tansy: "The Even Cut. Everybody
     gets the same lawn: their own."
   - Side-Valve Salvage rebuilt with Baroness Brenda's zip-tied lawn chairs, Tansy hangs the brass wrench back up: 48.
   - City Hall: Mayor Mulch freshly painted a third glossy red coat, waving at nobody: "I was on your side the whole
     time!" (stinger 'comic').
   - The Gnomecino: Commander Diggs off duty with Big Lou (preset 'big lou') at the velvet rope.
   - Mabel Kerbstone's yellow taxi (kind 'ride-on', tint 0xf2c230) pulls up beside the player at the bus stop:
     "Central Bus Stop, dear? This one's on the house." Payoff of the running gag.
   - Pip and the player on the kerb; the player's phone buzzes (sfx 'phone'): a text from Club Gnome, read as a
     caption: "Heard you're good with heavy machinery. Need a gnome for a bowling alley." Pip: "Bowling? What could
     possibly go wrong." Title 'THE END' with music 'triumph', then 'GNOME THEFT AUTO'.
   The player actor ends on foot (the game leaves the player there; pick the bus stop area around (-8, 18)).

## Done when
Common checks 1-4 pass for both ids (and the 390x844 watch for both).

## Out of scope
Every other file.
~~~~

## Wiring (planner, after the epic)

| Quest | cutscene | outro | visit scene |
| --- | --- | --- | --- |
| prologue-fresh-kiln | prologue-intro | prologue-outro | |
| first-contract | (contract posters, unchanged) | first-contract-outro | |
| ch1-mowers-keepers | mowers-keepers-intro | mowers-keepers-outro | |
| ch1-two-coat-tail | two-coat-intro | two-coat-outro | two-coat-handover (Patio Heights) |
| ch1-tax-break-in | tax-break-in-intro | tax-break-in-outro | |
| ch1-founders-boot | founders-boot-intro | founders-boot-outro | |
| ch2-dew-run | dew-run-intro | dew-run-outro | |
| ch2-sprinkler-gauntlet | sprinkler-intro | sprinkler-outro | |
| ch2-vespers-offer | vespers-offer-intro | | vesper-diner (the diner) |
| ch2-unmowed-tablet | tablet-intro | tablet-outro | compost-forge (scouting) |
| ch3-salvage-raid | salvage-raid-intro | salvage-raid-outro | |
| ch3-kiln-resin-ice | kiln-resin-intro | kiln-resin-outro | |
| ch3-tundra-drift-run | tundra-intro | tundra-outro | |
| ch4-runway-flares | runway-intro | | |
| ch4-sandpit-drop | sandpit-drop-intro | sandpit-drop-outro | |
| ch4-spade-truce | spade-truce-intro | spade-truce-outro | |
| ch5-even-cut | even-cut-intro | even-cut-outro | |
