# Gnome Theft Auto: re-directing Side B (the direction pass, lane Side B)

Goal: every Side B scene in [lanes.md](../design/gnome-theft-auto/direction/lanes.md) is re-directed against the
directing bible: a director's notes file per scene (from `direction/TEMPLATE.md`), restaged and recut with `frame`
coverage, rewritten dialogue, people and vehicles moving in their places, music by tone, a hook, a turn and a button.
Every scene passes the pacing checker with no unwaived fault and the line-of-sight check, and its id is gone from
`src/cutscene/pacing.baseline.ts`. Branch `gta-content/w3-side-b` (based on `gta-content/w3-direction-bible`).

## Step 0 (the planner, not an issue)

- **Races** (8 scenes from `raceIntro` / `racePodium` in `src/cutscene/scenes/speedway.ts`): one staging, each race's
  rival, stakes and turn as data (`RACE_INTROS`, `RACE_PODIUMS` in `src/quests/races.ts`); Burdock walks the grid counting
  it (his lore quirk) with his tea towel (new prefab `speedway-tea-towel`). Notes: `direction/scenes/race-scenes.md`.
- **Tessie** (5 scenes, `scenes/side/tessie.ts`): the anchor side quest. Notes: one file per scene.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0. Anchors (planner) | races and Tessie pass the report and LOS; watched at 960x600 and 390x844 | - |
| 1. Side quests | each issue's scenes show OK in the report and pass LOS; tsc clean | 5 (B1-B5), parallel, one scene file each |
| Review (planner) | every scene watched at both sizes and fixed; baseline entries removed; build, test, lore, smoke pass | - |

Collisions: each issue owns one scene file and its notes files. Nobody but the planner edits `pacing.baseline.ts`,
`kit.ts`, `direct.ts`, any engine file, `sideQuests.ts`, `docs/lore/rulings.md`.

## Common block (pasted into every issue)

~~~~text
## Environment
- Repo root: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a184f312275eff4c7 (a git worktree; stay in
  it, never cd elsewhere, never commit, never start a dev server). Game: games/gnome-theft-auto. Node: in Git Bash run
  `export PATH="/c/Program Files/nodejs:$PATH"` if node is missing. Dependencies are installed.
- Four other workers are re-directing other side quests' scene files at the same time. Edit ONLY the files this issue
  lists. Do NOT edit src/cutscene/pacing.baseline.ts (the planner removes your ids), kit.ts, direct.ts, script.ts or any
  other src/cutscene/*.ts, sideQuests.ts, scenes/index.ts, side/index.ts, docs/lore/rulings.md.
- Temp files: write them only under C:\Users\cpsai\AppData\Local\Temp\claude\04e3f93bf901b306\8c75f85d-7763-43da-a898-fa57687dc597\scratchpad\sideb\<your issue id>\ .

## The job
You are a film director re-directing cutscenes that already exist and work, but play badly: dialogue on tiny wide
shots, actors talking with their backs to camera, long lines, shots held for 15 s, briefings with no drama. For each
scene in this issue: write director's notes, then rewrite the scene to match them, then make the checkers pass.

## Read first (in this order)
1. docs/design/gnome-theft-auto/direction/bible.md: sections 1 (the five laws), 2 (your quest's character row in "Side
   cast", plus Granny / Vesper / Pip / Tansy if they appear), 4 (pacing numbers, the shape of a scene), 5 (camera), 6
   (sound), 7 (waivers).
2. docs/design/gnome-theft-auto/direction/TEMPLATE.md: the notes template. Fill EVERY section.
3. docs/design/gnome-theft-auto/direction/scenes/mowers-keepers-intro.md and its scene, `MOWERS_KEEPERS_INTRO` in
   games/gnome-theft-auto/src/cutscene/scenes/story/ch1.ts (lines ~216-291): the quality bar for notes and code.
4. games/gnome-theft-auto/src/cutscene/direct.ts (the helpers) and the "Directing" section of
   docs/design/gnome-theft-auto/cutscenes.md. Step and shot formats: games/gnome-theft-auto/src/cutscene/script.ts.
5. Your scene file (below), games/gnome-theft-auto/src/cutscene/scenes/side/kit.ts, and your stage(s) in
   games/gnome-theft-auto/src/quests/stages/<region>.ts (marks, cameras, walks, vehicles, paths, set dressing).

## How to direct a scene (the recipe)
- Hook in the first 3 s: a sound hit (`{ do: 'sfx', ... }`), a move (walk/drive/gesture) or a character line. Never open
  on a caption or a Narrator line. Captions and Narrator lines together: at most 1 per scene (prefer 0).
- Establish with ONE wide (a stage camera via `stageCut(stage, cam)` or a `cut`) for 2-4 s with NO dialogue on it, then
  cover every line with `frame` shots: `import { beat, coverage, cut, reaction, shot, exchangeLooks } from '../../direct';`
  `const TALK = coverage('giver', 'you', 1);` then `cut(TALK.single('giver', 'mcu'))` before the giver's line and
  `cut(TALK.single('you', 'mcu'))` before the player's. Keep the same `side` for the whole exchange (the 180-degree rule).
  `cut(TALK.ots('giver'))` = over the player's shoulder onto the giver. Low angle for power: `TALK.single('brenda', 'mcu',
  { height: 'low' })`. Before a two-hander: `...exchangeLooks('giver', 'you')` so they face each other.
- A speaker must be framed MCU/MS (>= 25% of frame height), inside the centre, facing the camera, for each line. So: cut
  to the speaker's single BEFORE their `say`. Every speaker change gets a cut. At most 2-3 lines per shot.
- Never two `cam` steps in a row (the first is a dead shot). No shot under 0.8 s. Close shots max 7 s, medium 9 s,
  wides 6 s, moving shots 12 s: cut to a reaction (`...reaction('pip', { toward: 'tansy', gesture: 'slump' })`).
- Lines: aim 12 words, NEVER more than 16. At most 3 lines in a row by one speaker; then someone else speaks or reacts.
  Cut lines before cutting shots. No line that describes what the picture shows; no coordinates; the HUD shows the
  waypoint, so name a place at most once. The player's lines: 2-6 words, dry questions, at most one line in three.
- Dead air: something new (a line, a move, a gesture, a sound, a cut) at least every 3 s. `beat('beat')` (0.7 s),
  `beat('pause')` (1.2 s), `beat('silence')` (2.0 s, once a scene).
- Shape: hook (0-3 s), setup (by 10 s: who wants what), a TURN at about 60% (an interruption, a reveal, a refusal, a
  new arrival: something goes wrong), and a BUTTON in the last 3 s (a punchline, a threat or a look; never a walk-off
  with nothing to see, never a line that only gives directions). The quest objective goes in the turn or the button, in
  the character's voice.
- Lengths at Normal text speed: intro aim 30-60 s (fault over 75), outro 15-45 (over 60), arrival 10-35 (over 45).
- Music: a reason at each change (`{ do: 'music', track, fade }`, `track: null` for silence before a reveal); at most
  two stingers a scene (`{ do: 'stinger', id }`); `comic` at most once and only on a physical gag. Ambience fits the
  place.
- People move: givers and extras do their routine (async walks, gestures) while others talk; vehicles arrive and
  leave. Keep a frame shot's camera away from parked scene vehicles and props: they are NOT in the line-of-sight
  colliders, so a "clear" shot can be filled by a mower. Swing it with `side` (degrees) or move the vehicle.
- Night or dark scenes: `sky: 'golden'` or a light behind the subject (headlights `lights`, a lit window).
- Each scene gets `direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/<scene-id>.md' }`. A rule broken
  on purpose: `waive: [{ code: 'dead-air', match: '<text in the fault>', why: '<reason>' }]` (rare; at most 2 a scene).
- Keep every `call` step (quest triggers) and the scene ids, exports and the file's final `export const ..._SCENES`
  array exactly as they are. Keep `stage: { kind: 'world' }`, `world: 'live'`. A scene with a `player: true` actor must
  still end with that actor where the quest expects (the intro: near the giver; a payoff: where it started or at its
  exit); a scene with no player actor ("meanwhile") must stay without one.
- Lore before writing names or facts: `npm run lore -- find <word>` (repo root). Facts that must hold: Ammu-Gnation gives
  guns away free; the Turfton Taxi is Mabel Kerbstone's yellow checker cab ("dear"; she only knows the Central Bus
  Stop); the Tall Ones are never seen or heard; acorns are money; gnomes are clay (they chip and crack, never bleed).

## Checks (run from games/gnome-theft-auto)
- `npx tsc --noEmit -p .` passes.
- Pacing report: `npm run cutscene-report > <your temp dir>/report.txt 2>&1` then
  `grep -A40 "] <scene-id>" <your temp dir>/report.txt`. Each of your scenes must print `OK` (scenes stay marked
  `[baseline]`; that is fine, the planner removes them). Fix every fault it lists, or waive it with a written reason.
- Line of sight: `npx vitest run src/cutscene/scenes/scenes.test.ts -t <scene prefix> --testTimeout=300000` passes for
  every scene of yours ("all shots pass"). Fix camera-inside / target-hidden by moving the camera (2+ m from buildings),
  changing a frame shot's `side`, or moving a walk onto open ground. `PROBE="x,z" PROBE_R=30 npx vitest run
  src/quests/stages.probe.test.ts` prints an ASCII map of colliders round a point.
- `npx vitest run src/cutscene/scenes/side/side.test.ts` passes.
- `npm run lore` (repo root) passes if you edited lore.

## Report (your final message)
Per scene: id, length before -> after (s), faults before -> after, any waiver and why, one line on the new staging. Then
any new lore fact that needs a ruling (one line each) and anything you could not fix.
~~~~

## Epic 1: side quests

~~~~text
Issue B1: Biscuit's Lost Squeaky Toy (Farmer Bramble)
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/biscuitHotdog.ts;
docs/design/gnome-theft-auto/direction/scenes/sq-biscuit-hotdog-intro.md and sq-biscuit-hotdog-outro.md (new);
docs/lore/entries/apocrypha/farmer-bramble.md, giant-fetch-dog.md, biscuits-nap.md (facts only).
Stage: granny-barn in games/gnome-theft-auto/src/quests/stages/cloverfield.ts. Quest sq-biscuit-hotdog in
games/gnome-theft-auto/src/quests/sideQuests.ts (read its objectives; do not edit).

Tone: a rural tall tale with western dread. Golden sky, `wind` ambience, `tension` music under it, low slow shots of the
fields. Biscuit is a giant dog and is NEVER shown: only his thumps (`{ do: 'shake' }` + sfx 'thud'), a distant silence,
everyone looking up. Farmer Bramble: trembling, whispered, from the storm cellar (bible: "Farmer Bramble ... Biscuit gone
before the barns go flat; trembling, whispered"). Granny Gnertrude (preset 'granny'): warm, "sugar" at most once, pie as
currency, sharpest fence in three biomes (bible section 2).

- sq-biscuit-hotdog-intro (intro, now 64.6 s, 23 faults: a whisper scene shot wide; dead shot at 0 s; Bramble at 1-8% of
  the frame and unseen; four lines of 17-19 words; wides held 10-12 s). Aim 40-55 s. A whisper scene wants close, low,
  still shots: Bramble's frightened face, Granny's calm one. Give it a turn: Biscuit thumps (shake + thud) mid-briefing
  and everyone freezes and looks up; the button is the next thump, or Granny's deadpan.
- sq-biscuit-hotdog-outro (outro, 29.9 s, 6 faults: Bramble unseen, the player small, a dead shot, Granny at 14%).
  Payoff: the hotdog home; Biscuit walks away (thumps getting fainter); Granny's last line as the button.
~~~~

~~~~text
Issue B2: The Snail-Racing Rigging (Shelldon "No-Trail" Mucilage)
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/snailRigging.ts;
docs/design/gnome-theft-auto/direction/scenes/sq-snail-rigging-intro.md, sq-snail-rigging-swap.md,
sq-snail-rigging-outro.md (new); docs/lore/entries/apocrypha/shelldon-mucilage.md, shelldon-dumpster-alley.md,
snail-mail-express.md (facts only).
Stages: shelldon-alley and snail-paddock in games/gnome-theft-auto/src/quests/stages/turfton.ts. Quest
sq-snail-rigging in games/gnome-theft-auto/src/quests/sideQuests.ts (read; do not edit).

Tone: a spy thriller at snail height. Cameras low (0.3-0.6 m up) for the establishing and insert shots, slow creeping
dollies, `heist` or `mystery` music, whispered lines. Shelldon: conspiracy capitals, refuses roads, never steps on paving
(bible: "Shelldon ... his snails winning; conspiracy capitals, refuses roads"). He also races in the Fizz Cup's Snail-Coach
Endurance at the Speedway on the gravel, so a nod to "the gravel is honest" fits.

- sq-snail-rigging-intro (intro, 57.9 s, 16 faults: one dolly held 44 s with 7 lines; Shelldon with his back to camera;
  four lines of 17-24 words). Cover it with frame singles; cut the plan to its bones (swap the slugs' espresso lettuce
  for decaf greens at the paddock); the reward (a tinfoil brim) and the catch ("the bookies") in the button.
- sq-snail-rigging-swap (arrival, 21.8 s, 2 faults: the player talks with their back to camera, twice). Fix the angles;
  keep the heist tension (a guard slug, a held breath).
- sq-snail-rigging-outro (outro, 48.2 s, 8 faults: wides held 11 and 24 s, crosses the line, lines of 17-21 words, the
  last line on Shelldon's back). The photo finish by a whisker: picture first (low, at snail level), then Shelldon's
  reaction; the button is his, deadpan.
~~~~

~~~~text
Issue B3: The Porcelain Support Group (Clara)
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/porcelainSupport.ts;
docs/design/gnome-theft-auto/direction/scenes/sq-porcelain-support-intro.md, sq-porcelain-support-outro.md (new);
docs/lore/entries/apocrypha/clara-porcelain.md (facts only).
Stages: the Tall House porch stage named in the file (grep `markOf(` / `stageCut(` in it) and unmowed-hollow in
games/gnome-theft-auto/src/quests/stages/wilds.ts. Quest sq-porcelain-support in sideQuests.ts (read; do not edit).

Tone: tender comedy, golden light, `warm` music. Clara is the SINCERE register (bible: "quiet, careful, every sentence
ends early; sincere register"): no gags on her lines, no comic stinger near her. The comedy is the four porcelain refugees'
bickering (one of them clutching a cursed toaster, a "Tall-One altar"), played straight and fast, each with one trait.
Elder Bracken (preset 'bracken', the outro): archaic, heavy, accusations as statements; shot low.

- sq-porcelain-support-intro (intro, 47.3 s, 16 faults: a 9 s wide with refugees at 5% of the frame; Clara unseen).
  Refugees bicker on MCU singles and quick reactions; the turn is Clara quietly stopping them (one held silence); the
  job is hers to say, gently.
- sq-porcelain-support-outro (outro, 38.9 s, 6 faults). The bunker: Bracken receives them gruffly, the toaster gets its
  place of honour; a sincere last look between Clara... (if she is not in the scene, between a refugee and the player).
~~~~

~~~~text
Issue B4: The Great Hose-Pipe Tax Revolt (Baroness Brenda)
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/hoseRevolt.ts;
docs/design/gnome-theft-auto/direction/scenes/sq-hose-revolt-intro.md, sq-hose-revolt-club.md, sq-hose-revolt-outro.md
(new); docs/lore/entries/apocrypha/baroness-brenda.md, new-puddle-marina.md (facts only).
Stages: brenda-throne in games/gnome-theft-auto/src/quests/stages/cloverfield.ts, putting-green in
games/gnome-theft-auto/src/quests/stages/turftonB.ts. Quest sq-hose-revolt in sideQuests.ts (read; do not edit).

Tone: a pompous royal decree. Brenda speaks in the royal "we", proclamations, her feather-duster sceptre (bible:
"Baroness Brenda ... sovereignty for New Puddle; royal we, proclamations, feather-duster sceptre"). SHOOT HER LOW: she is
royalty (`{ height: 'low' }` singles). Her pink push-bike gang parades. `triumph` music for the decree, `tension` at the
club. Title cards ("DECREE THE FIRST") are allowed as `title` steps (they are not captions).

- sq-hose-revolt-intro (intro, 49.4 s, 16 faults: dialogue on wides, people tiny). Open on the parade lap (movement as
  the hook), cut to Brenda low on her throne. Turn: the hose tax itself, or a gang member's objection overruled.
- sq-hose-revolt-club (arrival, "meanwhile", NO player actor; 30.0 s, 8 faults). Vesper's country club: keep any Vesper
  presence still and low (bible section 2: never runs, `villain` music only for him, once).
- sq-hose-revolt-outro (outro, "meanwhile", NO player actor; 25.4 s, 6 faults: the payoff wide shot keeps people tiny).
  The flood: show it at a size where people read (FS or closer on the faces reacting), then Brenda's decree as the button.
~~~~

~~~~text
Issue B5: Big Lou's Dry-Hat Embargo (Big Lou)
Files you own: games/gnome-theft-auto/src/cutscene/scenes/side/bigLou.ts;
docs/design/gnome-theft-auto/direction/scenes/sq-big-lou-embargo-intro.md, sq-big-lou-embargo-vip.md,
sq-big-lou-embargo-outro.md (new); docs/lore/entries/apocrypha/big-lou-gta.md, the-gnomecino.md (facts only).
Stage: gnomecino-door in games/gnome-theft-auto/src/quests/stages/turfton.ts. Quest sq-big-lou-embargo in
sideQuests.ts (read; do not edit).

Tone: velvet-rope nightclub noir: night, neon, low-angle hero shots of Lou, slow, few words. Big Lou: two-word
sentences, arms crossed, the rope (bible: "Big Lou ... his towels back, the door kept; two-word sentences, arms crossed,
the rope"). The scenes are TOO DARK now: use `sky: 'golden'` (dusk) or keep night and put a light behind the subject
(headlights on a parked car with `{ do: 'lights', vehicle, on: true }`, the club's lit door in the background).

- sq-big-lou-embargo-intro (intro, 51.1 s, 22 faults: Lou's back to camera for six lines; too dark). Turn Lou to the
  player and cover him low; his lines short; the job and the stakes (the Red Caps took his towel crate) in the button.
- sq-big-lou-embargo-vip (arrival, 8.3 s, 3 faults).
- sq-big-lou-embargo-outro (outro, 66.4 s, 10 faults: over the 60 s limit). Cut to under 45 s; Lou's one sentence longer
  than two words is the payoff (the rope lifted for the player).
~~~~
