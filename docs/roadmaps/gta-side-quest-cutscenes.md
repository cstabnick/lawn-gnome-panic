# Gnome Theft Auto: side-quest cutscenes (chunk G)

Goal: every side quest (the 11 Strangers & Freaks in `src/quests/sideQuests.ts` plus Tessie in `tessieQuest.ts`) gets
scripted scenes staged in the real world at the giver's stage spot (`src/quests/stages.ts`): an intro when you meet the
giver, a mid-quest beat where it helps, and a payoff. Each quest has its own tone and camera language; givers and extras
move about their routines; cast vehicles arrive and leave in their Pay 'n' Glaze looks; each scene hooks the player and
ties the side quest to the main story and the world.

## Step 0 (done by the planner, not an issue)

- Engine: `SceneScript.sky` ('noon' | 'golden' | 'night', world stages: held while the scene plays, app.ts `setSky`
  hook); `world: 'live'` comes from chunk F's engine commit (merged). The cutscene handle exposes `clock` for screenshot
  checks.
- Quests: `QuestDef.beats` (objective index -> scene id, played as that objective starts), `QuestDef.outro` (played on
  completion before the reward), `ChoiceOption.outro` (a choice ending's own payoff), `Run.outro()`; quests.ts plays
  them. A world-stage intro leaves the player where the scene's player actor ends (no teleport to the giver exit).
- `src/cutscene/scenes/side/`: `kit.ts` (markOf, camOf, stageCut, above, walkOf, pathOf, castRide), one file per quest
  (stubs), `index.ts` (SIDE_SCENES, spread into SCENES), `side.test.ts` (every quest names existing, live, world scenes).
- `sideQuests.ts` / `tessieQuest.ts` wired to the scene ids below.
- Exemplar: `sq-grid-truthers-intro` in `side/gridTruthers.ts`.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Side-quest scenes | `npm test -w games/gnome-theft-auto` passes (LOS check + side.test.ts), tsc clean | 7 (G1-G7), parallel, one file each (plus the giver's own lore entries) |
| Review (planner) | every scene watched at 960x600 and 390x844 and fixed; rulings R-065+ recorded; build, test, lore, smoke pass | - |

Collisions: each issue owns exactly one scene file and the lore entry files listed in it. Nobody edits
`sideQuests.ts`, `tessieQuest.ts`, `kit.ts`, `side/index.ts`, `docs/lore/rulings.md` or engine files; rulings are written
by the planner from the workers' reports.

## Common block (pasted into every issue)

~~~~text
## Environment
- Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a9ecedae59cd65da3 (a git worktree; stay in
  it, never cd elsewhere, never commit). Game: games/gnome-theft-auto. Node: in Git Bash run
  `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing. Dependencies are installed.
- Six other workers are writing scenes for other side quests in the same folder at the same time. Edit ONLY the files
  this issue lists. Do not start a dev server. Do not edit sideQuests.ts, tessieQuest.ts, kit.ts, side/index.ts,
  scenes/index.ts, docs/lore/rulings.md, or anything in src/cutscene/*.ts.

## How scenes work (read these files first)
- docs/design/gnome-theft-auto/cutscenes.md: the scene format (steps, camera shots, audio cues, vehicles, LOS check).
- games/gnome-theft-auto/src/cutscene/script.ts: every field and step, with comments. The source of truth.
- games/gnome-theft-auto/src/cutscene/scenes/side/kit.ts: helpers. markOf(stage, who) -> {at, yaw}; camOf(stage, camId)
  -> {pos, look, fov} absolute; stageCut(stage, camId); above(x, z, h) -> [x, groundY + h, z] (USE THIS for every camera
  position, ground heights vary); walkOf(stage, who) -> idle walk points; pathOf(stage, pathId) -> drive points;
  castRide(castId, id, at?, yaw?, extra?) -> that character's own vehicle with its glaze look.
- games/gnome-theft-auto/src/cutscene/scenes/side/gridTruthers.ts: the EXEMPLAR (paranoid surveillance intro). Copy its
  structure and quality bar, not its tone.
- games/gnome-theft-auto/src/quests/stages/<region>.ts: the stage spots named in your issue (marks, cameras, walks,
  vehicle marks, drive paths, set dressing). docs/design/gnome-theft-auto/environments.md has a readable section per
  stage (search for its id in backticks).
- Character presets (look, voice) for `preset:` are in src/cutscene/cast.ts CAST: pip, tansy, vesper, granny, diggs,
  bracken, loam, bodega, juniper, reginald, sorrel, clara, brenda, 'big lou', mossley, burt, driftwood, cedric, bramble,
  shelldon, wally. Anyone else (extras, HOA officers, porcelain gnomes, the Mayor) is an actor with `name` and a `look`
  (Partial<GnomeLook>: hat, shirt, pants, skin, beard, glasses, dress as hex numbers), e.g.
  `{ id: 'fan1', name: 'Snail Fan', look: { hat: 0x3a7d44, shirt: 0xd9c79e }, at: [x, z] }`.
- Props: any @lawn/prefabs id, as `props: [{ id, prefab, at, yaw, size? }]` or `held:` on an actor (keep held things
  small: espresso-cup, broom, ledger, folded-map, rolled-scroll, sealed-letter, wanted-poster, ruler-stick, field-camera,
  loch-binoculars, porcelain-lantern, stopping-stone, tinfoil-brim, microfiber-bowler, acorn, candle, torch, tin-pail,
  watering-can, megaphone-cap...). Large ones as props: tall-one-pencil, squeaky-hotdog-giant, hoa-dredger, sonar-buoy,
  turtle-egg-clutch, cursed-toaster, campfire, crate, barrel, bee, riding-snail, snail-shell, porcelain-cat. Check an id
  exists with `grep -rn "id: '<id>'" packages/prefabs/src/catalog`.
- Vehicles: any VehicleKind (src/types.ts). Passenger seat counts are `passengerSeats` in src/config.ts VEHICLES.

## Rules for every scene
- `stage: { kind: 'world' }`, `world: 'live'` (traffic and pedestrians keep moving around the scene), real world
  coordinates. Choose `sky: 'noon' | 'golden' | 'night'` to fit the scene's mood (the stage's `time` is a hint).
- Start with a `cam` step. Vary the camera language as your tone brief says; do not hold one shot longer than ~8 s.
- People move: the giver starts on their idle walk (walkOf) or doing their routine and keeps doing it (async walks,
  gestures) while others talk; at least one background extra does something (walks a loop, sweeps, queues, cheers).
  Use the giver's own vehicle (castRide) where it fits: arriving, leaving, parked in shot, or being worked on.
- Lines: one or two short sentences each, dry humour, no pop culture, no fourth-wall jokes, nothing gory (gnomes are
  clay: they chip and crack, never bleed). The player actor (`player: true`) speaks rarely and briefly.
- Every intro: a hook (a strange request, a twist, a reward tease), the objective made clear in-world, and at least one
  tie to the main story or the world (Vesper Thorne and the HOA, Pip and Tansy at Side-Valve Salvage, Don Compost, the
  Kiln-Debt, Hat Watch, Turfton FM, Ammu-Gnation the gun store, the Turfton Taxi and its driver Mabel Kerbstone, the
  Glaze Clinic). Lore before writing: `npm run lore -- find <word>` from the repo root, and docs/lore/canon.md. Facts
  that must hold: Ammu-Gnation gives guns away free (Fort Sandpit surplus, the list was lost so nobody counts them) and
  sells bolt-on mods for acorns; the Turfton Taxi is a yellow checker cab driven by Mabel Kerbstone, who calls everyone
  "dear" and only knows one address, the Central Bus Stop; the Tall Ones are never seen or heard; acorns are money.
- Mid-quest beats and payoffs play wherever the player is when the objective before them finishes (your issue says
  where). If the player may arrive in a vehicle, give the scene a `{ id, kind, from: 'player', at, yaw }` vehicle
  (falls back to spawning `kind` when on foot) with the player actor `seatedIn` it, then `exit`. A "meanwhile" scene
  (staged far from the player) has NO `player: true` actor, so the real player is not moved.
- Lengths at Normal text speed: intro 45-80 s (8-14 lines), beat 15-35 s (3-6 lines), payoff 30-60 s (5-10 lines).
- Phone portrait (390x844) shows a narrow slice of the frame: keep the speaker near the centre; for two people talking,
  use over-the-shoulder shots or alternate singles rather than a wide side-by-side two-shot.
- Each scene is an exported `const` SceneScript; the file ends with
  `export const <NAME>_SCENES: SceneScript[] = [ ...every scene ];` (keep that export name: side/index.ts imports it).

## Lore
- You may edit ONLY the lore entry files your issue lists (docs/lore/entries/apocrypha/...), to add facts your scenes
  introduce (a short paragraph or a line under "Loose threads"); keep the front-matter as it is. Do not edit rulings.md.
  In your final report, list any new fact that needs a ruling (one line each).

## Done when (run from games/gnome-theft-auto)
- `npx tsc --noEmit -p .` passes.
- `npx vitest run src/cutscene/scenes/scenes.test.ts -t <your scene prefix> --testTimeout=300000` prints "all shots pass"
  for every scene of yours (the line-of-sight and collision check). Fix failures by moving cameras (2+ m from
  buildings; use above()), shortening or rerouting walks onto open ground or pavement, moving drive paths onto roads.
  `PROBE="x,z" PROBE_R=30 npx vitest run src/quests/stages.probe.test.ts` prints an ASCII map of colliders (#), roads
  (=) and water (~) around a point.
- `npx vitest run src/cutscene/scenes/side/side.test.ts -t <your quest id>` passes for your quest(s).
- `npm run lore` (repo root) passes if you edited lore.
- Report: each scene id with its length in seconds (roughly), its tone, the lore entries you edited, and facts needing a
  ruling.
~~~~

## Epic 1: side-quest scenes

~~~~text
Issue G1: The Grid Truthers (rest) + The HOA Audit
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/gridTruthers.ts (keep GRID_TRUTHERS_INTRO as it is; add
two scenes), games/gnome-theft-auto/src/cutscene/scenes/side/hoaAudit.ts, docs/lore/entries/apocrypha/mossley-inkcap.md,
docs/lore/entries/apocrypha/burt-hoa.md, docs/lore/entries/apocrypha/tall-one-pencil.md.

Grid Truthers (giver Mossley "Plumb-Line" Inkcap, stage bodega-front in quests/stages/turfton.ts; objectives: survey
markers Alpha (-120,120), Beta (-120,-120), Gamma (120,-120), then the centre datum (0,0)). Tone: paranoid surveillance,
as the exemplar intro: long lenses (fov 22-34), a constant handheld `shake` amp 0.02-0.03, whispers, radio 0, 'mystery'
music, night.
- 'sq-grid-truthers-gamma' (beat, plays the moment the player reaches Gamma (120,-120) radius 10, on foot or in any
  vehicle): Mossley rides up on his own push-bike (castRide('mossley', 'bike', ...)) with his survey flag, keeps glancing
  over his shoulder, triangulates with the player: the markers point at (0,0), downtown. Something there has been
  "rubbed out" of the old maps. 20-30 s. Stage it on open ground near (120,-120) (probe it).
- 'sq-grid-truthers-outro' (payoff at (0,0), stage culvert-under-deck in quests/stages/turftonB.ts, centre (-9,-13)):
  the ground shakes, a storm grate gives, and the Tall-One Pencil (prop 'tall-one-pencil', spawn it hidden then `spawn`
  it) is revealed. Mossley whispers in awe, then the twist: the eraser end is worn down; someone has been rubbing things
  out of Turfton. He decides to chip off the graphite and sell it as artisan eyebrow pencil (canon, see
  tall-one-pencil.md) and retire. Tie: Vesper's HOA "corrects" maps; Turfton FM will call it a sinkhole. 35-55 s.

HOA Audit (giver Burt, ex-HOA citation writer; intro at bodega-front where he leans on the wall with a coffee
(markOf('bodega-front','burt')); his home stage is clay-mart-lot in quests/stages/turftonB.ts with his decommissioned
primer HOA van, castRide('burt', 'van')). Objective: crack five petty HOA citation officers across all five biomes.
Tone: deadpan bureaucrat. Locked-off, symmetrical, static shots (cut, no dolly or shake), long pauses (`wait`), no
music at first (scene `music` unset), then sparse 'mystery'; `sfx: 'thud'` as a rubber stamp; `title` cards like form
numbers ("FORM 404-B: GRIEVANCE"); John Bodega sweeps in the background; noon sky.
- 'sq-hoa-audit-intro': Burt rereads old citations, stamps one, explains in flat tones that the HOA stiffed him three
  weeks of overtime and that the Tall Ones are not on the board; five officers out ticketing cactuses and snowmen;
  crack them and bring the clipboards. Reward tease: his old badge. 50-70 s.
- 'sq-hoa-audit-outro' (meanwhile, NO player actor; plays wherever the last officer was cracked): at clay-mart-lot,
  Burt sorts five clipboards on the bonnet of his van, stamps each (thud), finds the letterhead on every forged
  "Tall-One" form: Thorne Lawn & Order LLC (Vesper's company; check `npm run lore -- find thorne`). Reginald "Quarter-
  Inch" Vance (preset 'reginald') pulls up in his HOA Code-Enforcement van (castRide('reginald', 'rvan', ...) driving in
  on a stage path), deadpan stand-off: "You're not on the board, Burt." / "Neither are the Tall Ones." Reginald drives
  off. 35-50 s.
~~~~

~~~~text
Issue G2: Snail-Racing Rigging + The Mulch Pyramid Scheme
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/snailRigging.ts,
games/gnome-theft-auto/src/cutscene/scenes/side/mulchPyramid.ts, docs/lore/entries/apocrypha/shelldon-mucilage.md,
docs/lore/entries/apocrypha/shelldon-dumpster-alley.md, docs/lore/entries/apocrypha/cedric-peat.md.

Snail-Racing Rigging (giver Shelldon "No-Trail" Mucilage, stage shelldon-alley in quests/stages/turfton.ts; he lives in a
retired snail-coach parked there, castRide('shelldon', 'coach'), and never steps on a paved road; objectives: sneak into
the downtown slug paddock (24,-14) radius 9 and swap the espresso slugs' lettuce for decaf dandelion greens, then escape
back to (-60,60) radius 10). Tone: spy thriller at snail height: cameras low (0.3-0.6 m up), slow creeping dollies,
'heist' music, whispered lines, an overhead shot (the stage has one), dawn feel (sky 'golden').
- 'sq-snail-rigging-intro': Shelldon feeding courier snails in the lettuce bed (props 'riding-snail' or 'snail-shell'),
  walking his loop between coach and lettuce, keeping to the grass; tells the player about the espresso-fed slug
  syndicate dusting his couriers in the alley heats; the plan; reward tease. 50-70 s.
- 'sq-snail-rigging-swap' (beat, the player has just reached the paddock (24,-14); stage snail-paddock in
  quests/stages/turfton.ts, night): close low shots of the swap (the player actor holds something leafy or a
  'tin-pail'), a slug yawns, a syndicate bookie extra turns, a whistle (sfx 'whistle'), stinger 'danger', the player
  legs it. 15-25 s.
- 'sq-snail-rigging-outro' (payoff, the player has reached (-60,60), 20 m east of the alley; stage shelldon-alley): a
  slapstick alley heat: Shelldon's courier snail vs a decaf-drowsy espresso slug, a few extras cheering (crowd
  ambience), camera dollies along at snail level at a crawl, comic stingers, a photo finish decided by a whisker. Shelldon
  hands over the Tinfoil Conspiracy Brim (held 'tinfoil-brim', `give`). 35-55 s.

The Mulch Pyramid Scheme (giver Cedric "Double-Bag" Peat, intro at bodega-front where he pitches "Artisanal Miracle
Mulch" to passers-by (walkOf('bodega-front','cedric')); his glitter-purple Mulch-Spreader is castRide('cedric',
'spreader'); objectives: drive the spreader to the Patio Heights drop (145,-145), then repo it back to Side-Valve
Salvage bay before the HOA seizes it). Tone: sleazy infomercial: bright noon, 'warm' music, quick cuts (3-4 s), ad-copy
`caption`s ("RESULTS NOT TYPICAL", "ACT NOW"), comic stingers, planted "satisfied customer" extras, a slow push-in on
the product.
- 'sq-mulch-pyramid-intro': Cedric's pitch to two extras, then to the player; "it's not a pyramid, it's an inverted
  compost funnel"; admits it is dyed sawdust and craft glitter and that wasps love it; the job. Tie: Patio Heights is
  Vesper's neighbourhood. 50-70 s.
- 'sq-mulch-pyramid-wasps' (beat, the player has just driven the spreader to (145,-145); stage patio-gate in
  quests/stages/turftonB.ts): the player's spreader (`from: 'player'`, kind 'mulch-spreader') in shot leaking glitter,
  wasps (props 'bee') swarming, Gate-Guard Gary (an extra in a guard look, reading a binder in the sentry box) calls the
  Hat Watch; the player must repo the rig now. 15-30 s.
- 'sq-mulch-pyramid-outro' (payoff, the player has just driven the spreader into the Side-Valve bay; stage
  side-valve-bay in quests/stages/turfton.ts): Tansy (preset 'tansy') under her smoking Zero-Turn, unimpressed; Cedric
  arrives, the scheme is busted (doneText: the Chapel of Mulch's glitter-sawdust quota scheme is busted wide open; check
  `npm run lore -- find "chapel of mulch"` and gospel-of-mulch / father-loam entries). Infomercial tone collapses into
  dry workshop realism. 35-55 s.
~~~~

~~~~text
Issue G3: Big Lou's Dry-Hat Embargo + The Great Hose-Pipe Tax Revolt
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/bigLou.ts,
games/gnome-theft-auto/src/cutscene/scenes/side/hoseRevolt.ts, docs/lore/entries/apocrypha/big-lou-gta.md,
docs/lore/entries/apocrypha/the-gnomecino.md, docs/lore/entries/apocrypha/baroness-brenda.md,
docs/lore/entries/apocrypha/patio-country-club.md.

Big Lou's Dry-Hat Embargo (giver Big Lou, bouncer at The Gnomecino velvet rope, stage gnomecino-door in
quests/stages/turfton.ts; his matte black Lowrider castRide('big-lou', 'lou'); objectives: crack three Red Cap
hooligans near (-82..-96, -26..-42) who stole his microfibre hat-towel crate, then chauffeur the VIP's Zero-Turn Racer
from (-90,-56) to the Gnomecino VIP entrance without a scratch). Tone: velvet-rope nightclub: night, neon, smooth
'heist' music, low-angle hero shots of Lou (camera ~0.6 m up looking up), slow orbits, Lou speaks little and slowly.
- 'sq-big-lou-embargo-intro': a queue of extras at the rope; Lou towels each hat dry; turns away one with a damp hat
  ("Felt. Not fleece."); the crate is gone, Red Caps took it; the job; tie: The Gnomecino's VIP tonight is the Mayor
  (Mayor Barnaby "Two-Coat" Mulch, an extra in a candy-red look; lore: mayor-barnaby-mulch). 50-75 s.
- 'sq-big-lou-embargo-vip' (beat, the player has just cracked the third Red Cap in the west alley around (-88,-42)):
  the recovered crate (prop 'crate'), the VIP's spotless Zero-Turn Racer (a 'zero-turn' vehicle with a show-car
  loadout) parked at (-90,-56) facing east; a phone rings (sfx 'phone'), Lou off-screen ("who: 'Big Lou'" with no actor
  on stage): bring it round, not a speck of mud. 15-25 s.
- 'sq-big-lou-embargo-outro' (payoff, the player has just driven the Zero-Turn to the VIP entrance; use `from: 'player'`
  kind 'zero-turn' arriving on the stage's pull-up): Lou's white-glove inspection (a slow dolly along the bodywork),
  the Mayor steps out of the dark and in through the rope, Lou hands the player a Microfiber Bowler (held
  'microfiber-bowler', `give`) and lifts the rope for them. 35-55 s.

The Great Hose-Pipe Tax Revolt (giver Baroness Brenda, on her zip-tied lawn-chair throne by the Southern Drainage
Canal, "the Sovereign Republic of New Puddle", stage brenda-throne in quests/stages/cloverfield.ts; her glitter-gold
Push-Mower Bike castRide('brenda', 'bike'); her gang rides pink push-bikes; objectives: kink four Tall-One garden hoses at
North Turfton (10,-112), the Greenhouse Strip (90,-45), the Patio Heights west gate (135,-135), and Vesper's
putting-green country club (185,-185), which floods it and brings 4-hat HOA heat). Tone: pompous royal proclamation:
'triumph' music, crowd ambience, low-angle throne shots, `title` cards ("DECREE THE FIRST"), a parade lap of her gang
(three or four push-bike vehicles driving a loop on the stage's paths), noon or golden.
- 'sq-hose-revolt-intro': the gang's parade lap; Brenda proclaims New Puddle sovereign and the hose tax abolished; the
  four hoses; the target: Vesper's putting-green club; reward tease (a Turf-Code violation medal of her own making).
  50-75 s.
- 'sq-hose-revolt-club' (beat, meanwhile, NO player actor; the player is at hose #3 (135,-135)): at stage
  putting-green in quests/stages/turftonB.ts, Vesper Thorne (preset 'vesper') measures the turf with calipers on his
  pristine green while porcelain-looking members putt; he hears a groan in the pipes; calm menace. 15-30 s.
- 'sq-hose-revolt-outro' (meanwhile, NO player actor; the player has just kinked hose #4 at the club and has 4-hat
  heat): at putting-green, a rumble (shake), splashes (sfx 'splash'), members flee, Vesper stands in mud, monocle
  steady; `fade` out and in; at brenda-throne Brenda receives the news and decrees a national holiday; the gang cheers.
  35-55 s.
~~~~

~~~~text
Issue G4: Biscuit's Lost Squeaky Toy + Castaway's Dry-Dock
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/biscuitHotdog.ts,
games/gnome-theft-auto/src/cutscene/scenes/side/castaway.ts, docs/lore/entries/apocrypha/farmer-bramble.md,
docs/lore/entries/apocrypha/squeaky-hotdog.md, docs/lore/entries/apocrypha/driftwood-castaway.md,
docs/lore/entries/apocrypha/driftwood-trailer.md.

Biscuit's Lost Squeaky Toy (giver Farmer Bramble, at Granny Gnertrude's barn, stage granny-barn in
quests/stages/cloverfield.ts; his Buck-Iron Combine castRide('bramble', 'combine'); Granny (preset 'granny') rocks on the
porch with her double-barrel; objective: drag Biscuit's city-bus-sized rubber squeaky hotdog out of the pawprint crater
(stage biscuits-nap, around (74,380)) back to the barn (-25,340) with a Combine). Biscuit is a giant dog (read
`npm run lore -- find biscuit` and giant-fetch-dog.md): NEVER show him; only his thumps (shake + sfx 'thud'), a distant
silence, everyone looking up. Tone: rural tall tale with western dread: golden sky, 'tension' music under 'wind', wide
low shots of the fields, slow, Bramble talks like a campfire storyteller ("Don't look up. Just listen.").
- 'sq-biscuit-hotdog-intro': Bramble ploughs in on the combine (drive along a stage path, then `exit`), Granny on the
  porch, the story of the hotdog, the job; tie: Granny fences relics for the crew; Mabel's taxi will not come out this
  far ("only knows the bus stop"). 50-75 s.
- 'sq-biscuit-hotdog-outro' (payoff, the player has just hauled it to (-25,340) in a combine: `from: 'player'` kind
  'combine'): the hotdog prop ('squeaky-hotdog-giant') by the barn; a deafening squeak (stinger 'comic' plus sfx), then
  the thumps start, closer; everyone freezes and looks up; the thumps stop, go away; Granny: pie. 35-55 s.

Castaway's Dry-Dock (giver Driftwood, six months lashed to a lawn-boat trailer in Cloverfield, stage driftwood-trailer in
quests/stages/cloverfield.ts; objective: haul his turf-raft with a Combine (spawned at (30,460) facing north) to the
Southern Drainage Canal (55,223), stage canal-raft, water). Tone: melancholy castaway: golden sky going to dusk, 'sad'
music, 'wind' then 'water' ambience, long slow wide shots, few words, a bell that never rings (sfx), quiet.
- 'sq-castaway-drydock-intro': Driftwood on the trailer looking at a sea of clover, ringing a bell nobody answers; the
  high-tide bell; the request; the combine parked nearby (a scene vehicle at (30,460)). Tie: Brenda's republic on the
  canal; the HOA drained the old ponds. 45-70 s.
- 'sq-castaway-drydock-outro' (payoff, the player has just driven the combine to (55,223): `from: 'player'` kind
  'combine'): the raft slides into the canal (a boat vehicle, e.g. 'walnut-dinghy' as his raft, on the water marks of
  canal-raft), Driftwood floats for the first time in six months, stops talking, then hears something deep singing
  through the hull, far north (a foreshadow of Tessie in Loch Moss; never name her here). He salutes; reward: Sea-Foam
  Mower Tint and Captain's Hat (prefab 'captain-cap'). 35-55 s.
~~~~

~~~~text
Issue G5: Porcelain Blues + The Porcelain Support Group
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/porcelainBlues.ts,
games/gnome-theft-auto/src/cutscene/scenes/side/porcelainSupport.ts, docs/lore/entries/apocrypha/clara-porcelain.md,
docs/lore/entries/apocrypha/tall-house-porch.md.

Both quests: giver Clara, porcelain, on the Tall House Porch, stage tall-house-porch in quests/stages/wilds.ts (Mossy
Wood, dusk). She never leaves the porch boards (keep her walks on the porch). Her pearl-white slammed Lowrider for refugee
runs is castRide('clara', 'clara'). Read `npm run lore -- find porcelain` and `find "tall house"`: porcelain does not
glue back like earthenware; one hard knock and it is gone. Vesper Thorne is porcelain and rumoured to have escaped The
Tall House.

Porcelain Blues (objectives: crack three HOA scavengers who stole three wax lanterns (two near the porch (-552,34),
(-566,48), one on the Mossy Wood trail (-470,15)), then return to Clara at (-550,40) radius 12). Tone: hushed gothic:
night or golden sky, 'mystery' music, 'wind' ambience, close slow shots, candle light, porcelain chinks (sfx 'glass'
quietly), long silences.
- 'sq-porcelain-blues-intro': Clara walks the porch lighting lanterns (props 'porcelain-lantern', `hold` 'candle'),
  three hooks are empty; her fear of chipping; the scavengers; the job; something knocks inside the house once. 45-70 s.
- 'sq-porcelain-blues-ledger' (beat, meanwhile, NO player actor; plays after the third scavenger is cracked): at stage
  glaze-tax-office in quests/stages/turfton.ts, Vesper at his counter reads a scavenger's report (held 'ledger'):
  "Porcelain belongs on a shelf." Calm, cold, still camera. 15-30 s.
- 'sq-porcelain-blues-outro' (payoff, the player is back at the porch on foot or in a vehicle: use `from: 'player'`
  with a fallback kind): the three lanterns go back up one by one (spawn the props), Clara's relief, the gift: a
  Porcelain-Glaze Charm; the knock from inside the house again, closer. 35-55 s.

The Porcelain Support Group (objective: drive four escaped porcelain refugees in Clara's shock-absorbed Lowrider (spawned
at (-550,36) facing east) to the padded bunker in Mossy Wood (-345,34) with under 15% damage). Tone: tender comedy,
group therapy: warm light (golden), 'warm' music, a slow circling shot of the circle of refugees, overlapping bickering.
- 'sq-porcelain-support-intro': four porcelain refugees (white-skinned extras: `look: { skin: 0xfafafa, ... }`) arguing
  whether a toaster (prop 'cursed-toaster') is a Tall-One altar or a warm box; Clara mediates; they board the Lowrider
  (check its passengerSeats in config.ts: seat as many as fit with `enter`, the rest "go in the back" off-screen). 45-70 s.
- 'sq-porcelain-support-outro' (payoff, the player has just driven the Lowrider to (-345,34): `from: 'player'` kind
  'lowrider' with refugees `seatedIn` it; stage unmowed-hollow in quests/stages/wilds.ts is beside it): they climb out
  (exit), Elder Bracken (preset 'bracken') receives them gruffly, the toaster gets a place of honour on a stone, the
  theology stays unresolved. 35-55 s.
~~~~

~~~~text
Issue G6: The Fescue Fugitive
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/fescueFugitive.ts,
docs/lore/entries/apocrypha/elder-bracken-gta.md, docs/lore/entries/apocrypha/patio-gallery.md.

Giver Elder Bracken at Unmowed Hollow, the standing-stone ring, stage unmowed-hollow in quests/stages/wilds.ts (dusk);
he refuses to touch anything with an engine; Sorrel Tillbrook (preset 'sorrel') broadcasts 88.7 Fescue Public Radio from
a crate booth nearby (stage sorrel-radio-booth). Objectives: (0) reach Vesper's Patio Heights gallery (the centre of
PATIO_HEIGHTS in src/config.ts; stage patio-gallery in quests/stages/turftonB.ts) and seize the Replica Stopping Stone
that Vesper uses as a doorstop; (1) a choice: return it to Bracken at (-350,34), or fence it to Granny Gnertrude at her
barn (-25,330) for extra acorns. Read `npm run lore -- find "stopping stone"` (the real Stopping Stone is Fescue's most
sacred thing; this one is a replica). Tone: solemn folk ritual: firelight (prop 'campfire'), slow orbits around the
standing stones, 'mystery' then 'sad' music, 'forest' ambience, chant-like measured lines, golden/dusk sky.
- 'sq-fescue-fugitive-intro': Bracken walks the ring touching each stone (his walk), Sorrel's radio murmurs, the request
  (a replica, but a replica of something holy is not a doorstop), the warning that Granny will bid for it. Tie: Vesper's
  gallery collects Fescue relics. 50-75 s.
- 'sq-fescue-fugitive-gallery' (beat, the player has just reached the gallery): the player picks up the stone (`hold`
  'stopping-stone'), an alarm (sfx 'alarm'), porcelain guard extras stir; a phone rings (sfx 'phone'): Granny, off
  screen (`who: 'Granny Gnertrude'` label, no actor), names her price. The choice is set up. 15-30 s.
- 'sq-fescue-fugitive-hollow' (ending A, the player arrives at (-350,34): `from: 'player'` with a fallback kind): the
  stone set in the ring, the fire flares (shake, stinger 'triumph'), Bracken bows to the player, Sorrel puts it on air.
  35-55 s.
- 'sq-fescue-fugitive-granny' (ending B, the player arrives at Granny's barn (-25,330); stage granny-barn in
  quests/stages/cloverfield.ts; Granny is preset 'granny'): Granny weighs the stone on her kitchen scale on the porch,
  laughs, pays out a crate of acorns (prop 'crate' or 'acorn'); dry: "Replica. Weighs like guilt." 30-50 s.
~~~~

~~~~text
Issue G7: The Loch Moss Monster (Tessie)
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/tessie.ts, docs/lore/entries/apocrypha/tessie.md,
docs/lore/entries/apocrypha/loch-moss.md. (driftwood-castaway.md belongs to another worker: do not edit it.)

Giver Driftwood at the Loch Moss dock, stage loch-dock in quests/stages/east.ts (golden hour); his walnut-shell dinghy
castRide('driftwood', 'dinghy'). Read src/config.ts TESSIE (dock (-715,-564), sightings, buoys, escort route, nest,
dredgerStart, rideTo (-713,-590), tabloidAt (-704,-548), secretAt (-742,-552)) and src/quests/tessieQuest.ts (the
objectives and endings). Tessie is a giant turtle and a vehicle kind ('tessie', a boat): spawn her as a scene vehicle on
the water and `drive` her slowly. The HOA wants to drain the loch for a golf course: an HOA patrol boat
('hoa-patrol-boat' vehicle) and a dredger (prop 'hoa-dredger'). Stages tessie-nest and loch-open-water (water) are in
east.ts. Tone: wonder and hush, a nature documentary: golden sky, 'water' ambience, 'mystery' music turning 'triumph'
only at the end, slow crane shots over the water, long holds on ripples, Driftwood speaks low.
- 'sq-tessie-intro': Driftwood in the dinghy at the dock humming, a ripple out on the loch, the HOA patrol boat crossing
  the far side; he tells of the singing through his hull (he heard it first on the canal after the player floated his
  raft); the request: take a boat out, follow the ripples, bring proof. 50-75 s.
- 'sq-tessie-eggs' (beat, the player is in a boat on the loch having just dropped the fourth buoy; stage tessie-nest):
  Tessie surfaces by the island, the egg clutch (prop 'turtle-egg-clutch'), the dredger's engine in the distance; the
  player's boat `from: 'player'` kind 'walnut-dinghy'. 20-35 s.
- 'sq-tessie-shore' (beat, the player has just ridden Tessie to (-713,-590) by the dock): Driftwood waiting on the dock
  with his binoculars; a Turfton Tattler photographer extra (lore: turfton-tattler) with a 'field-camera' and an acorn
  purse waiting on the gold ring (tabloidAt); Driftwood quiet on the cyan side (secretAt); the choice. 20-35 s.
- 'sq-tessie-tabloid' (ending A at tabloidAt): the photo flash (sfx 'cash' then a 'whoosh'), the photographer runs
  off, Tessie dives, Driftwood sighs ("Nobody believes the Tattler. That's the one mercy."). 25-40 s.
- 'sq-tessie-secret' (ending B at secretAt): Driftwood nods, Tessie rolls once in the shallows and is gone, he hands a
  small shell pack (held 'turtle-shell-pack' if it is small enough, else 'snail-shell'). 25-40 s.
~~~~
