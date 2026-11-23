# Gnome Theft Auto: re-directing the Side A cutscenes

Goal: every scene of the first six side quests (lane Side A in
`docs/design/gnome-theft-auto/direction/lanes.md`: Porcelain Blues, Grid Truthers, Fescue Fugitive, HOA Audit,
Castaway's Dry-Dock, Mulch Pyramid; 17 scenes, 202 pacing faults at the start) re-directed against the direction bible:
director's notes per scene, restaged and recut with `frame` coverage, lines cut and sharpened, night scenes lit, each
quest's own tone kept and sharpened, zero pacing faults, out of `pacing.baseline.ts`.

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Anchor (planner) | Porcelain Blues' three scenes pass the report and are watched; notes written as the worked side-quest example | done by the planner |
| 2. Five quests in parallel | each issue's scenes show OK in the report; `npx tsc --noEmit -p games/gnome-theft-auto` passes | 5 (one per quest file) |
| 3. Review (planner) | every scene watched at 960x600 and 390x844 and fixed; baseline entries removed; build, tests, lore, smoke pass | done by the planner |

Collisions: each issue owns one scene file and its notes files. `pacing.baseline.ts` is owned by the planner (workers do
not edit it; the planner removes ids in epic 3). Workers share one dev server on port 5313 (started by the planner) and
write contact sheets to their own file names, so nothing collides.

## Shared issue preamble (pasted into every issue)

~~~~text
## Environment
- Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-a4f61c3f147311d1e (a git worktree; use
  absolute paths). Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"` before npm/node. Do not commit, do not
  push, do not run `git stash`.
- Four other workers are editing OTHER scene files under games/gnome-theft-auto/src/cutscene/scenes/side/ at the same
  time. Touch only the files listed under "Change". Never edit games/gnome-theft-auto/src/cutscene/pacing.baseline.ts,
  direct.ts, kit.ts, the engine, or quests.
- A dev server is ALREADY running at http://localhost:5313/ (do not start another).

## What "re-directing" means here
Read these first, in this order (they are the standard you are held to):
1. docs/design/gnome-theft-auto/direction/bible.md: sections 1, 2 (your character's row), 4 (pacing numbers), 5
   (camera), 6 (sound), 7 (waivers).
2. docs/design/gnome-theft-auto/direction/TEMPLATE.md: the notes template.
3. The worked side-quest example, already done: games/gnome-theft-auto/src/cutscene/scenes/side/porcelainBlues.ts and
   docs/design/gnome-theft-auto/direction/scenes/sq-porcelain-blues-intro.md. Copy its patterns exactly.

The craft rules the checker enforces (pacing.ts), with the fix for each:
- `speaker-small` / `speaker-back` / `speaker-unseen`: never talk on a stage wide (`stageCut(...)`) or a hand-placed
  `{ kind: 'cut', pos, look }`. Every line is said on a `frame` shot of the speaker:
  `cut(T.single('who', 'mcu'))` from `const T = coverage('a', 'b', 1)` for a two-hander, or
  `cut(shot('who', 'ms', { toward: 'listener', side: 25 }))`. Before a two-hander, turn the actors to each other with
  `...exchangeLooks('a', 'b')` or give them facing yaws in `actors` (use
  `const towards = (a: Vec2, b: Vec2) => Math.atan2(b[0] - a[0], b[1] - a[1]);` as in porcelainBlues.ts).
  An off-screen voice with no actor (a phone call, `who: 'Granny Gnertrude'` not in `actors`) is not checked.
- `crosses-line`: use ONE `coverage(a, b, side)` object for all singles of a conversation.
- `line-long`: at most 16 words per line (aim 12). Split or cut.
- `lines-per-shot` (max 3) / `speaker-run` (max 3 lines by one speaker in a row): cut to a reaction
  (`...reaction('who', { toward: 'speaker', gesture: 'nod' })`) or a new angle between lines.
- `shot-long`: holds max close 7 s, medium 9 s, wide 6 s, moving (dolly/track/follow) 12 s. Cut on every speaker change.
- `shot-short` (min 0.8 s) and `dead-shot` (two `cam` steps in a row): one shot per idea; put a `wait`/line/beat
  between camera steps.
- `dead-air`: never more than 3 s with no line, move, sound or cut. `no-hook`: something happens by 3 s.
- `narration`: at most ONE caption or Narrator line per scene. `title` pills (top of screen) do NOT count: use
  `{ do: 'title', text: '...' }` / `{ do: 'title', text: null }` for ad copy, form numbers and place cards.
- `scene-long`: intro max 75 s (aim 30-60), outro max 60 (aim 15-45), arrival max 45 (aim 10-35). Cut lines first.
- `opens-on-narration`: open on a picture or a character.
- `repeat-line`: do not reuse a line said word for word in another scene.
Helpers (import from '../../direct'): `beat('tiny'|'beat'|'pause'|'silence')` (0.3/0.7/1.2/2.0 s), `shot`, `cut`,
`coverage`, `reaction`, `exchangeLooks`. Shot sizes: 'cu', 'mcu', 'ms', 'fs', 'ws'; `height: 'low'` for the powerful,
'high' for the cornered; `handheld: 0.02` adds operator drift to any shot. Emotes: flinch, slump, think, clutch, beckon,
tipHat, stomp, plus wave, point, shrug, nod, cheer, handsUp, lean, crossArms, facepalm, bow, sit, stand.
Every scene gets `direction: { notes: 'docs/design/gnome-theft-auto/direction/scenes/<id>.md', kind: '<intro|outro|arrival>' }`.
A deliberate rule break goes in `direction.waive: [{ code, match, why }]` with a written reason (at most two a scene).

Direction rules that are not checked but matter as much:
- Shape: hook in 3 s (an image or sound with a question in it), setup by 10 s, a TURN at about 60% (something goes
  wrong, an interruption, a reveal), a BUTTON in the last 3 s (a punchline, threat or look; never a walk-off, never a
  line that only gives directions). Quest intros put the objective in the character's own voice; one place name, never
  coordinates.
- Show, then react: if a line describes what is on screen, cut the line and stage the picture.
- Deadpan: nobody winks; at most one `comic` stinger a scene, only on a physical gag. At most two stingers a scene.
- The player ('you') is the straight man: lines of 2-6 words, mostly questions, at most one line in three.
- Night: never shoot dark on dark. Use `sky: 'golden'` (dusk) unless the scene truly needs night, and frame subjects
  against the sky or a light (headlights, a lantern). Do not put the camera under a roof or close to a building
  looking into its shadow.
- Givers and extras do business while they talk (walk a stage walk loop, sweep, gesture); vehicles drive in and out on
  stage paths (`pathOf`) rather than appearing.
- Music: one cue per beat, `music: null` (fade 0.4-0.8) before a reveal or a sincere line; ambience fits the place.
  `villain` music is Vesper's only.

## How to check your work (run all of these; they must pass for YOUR scenes)
1. Types: `cd C:/Users/cpsai/cstabnick/lawn-gnome-panic/.claude/worktrees/agent-a4f61c3f147311d1e && npx tsc --noEmit -p games/gnome-theft-auto`
2. Pacing report for your scenes (takes ~1-2 min):
   `bash C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/rep.sh <quest-key>`
   (quest-key below; it prints each of your scenes with its length and faults; you want `OK` on every one). The lines
   "FAIL ... every baseline entry is a real scene that still has faults" and "N in baseline" are EXPECTED once your
   scenes pass: the planner removes them from the baseline afterwards. Ignore other scenes' faults.
3. Line of sight: `cd games/gnome-theft-auto && npx vitest run src/cutscene/scenes/scenes.test.ts -t "<scene-id>"`
   for each of your scene ids (or run the file once and look for your ids). Must pass.
4. WATCH each scene: `node C:/Users/cpsai/AppData/Local/Temp/claude/04e3f93bf901b306/8c75f85d-7763-43da-a898-fa57687dc597/scratchpad/sheet.mjs <scene-id> <every-seconds> <count>`
   writes a contact sheet JPG (one frame every N seconds, labelled with time) and prints its path; open it with the
   Read tool. Example for a 45 s scene: `... sheet.mjs sq-castaway-drydock-intro 3.5 14`. Prefix `START=20` to begin
   at 20 s. Add ` 390 844` after count for a phone-sized check. Look for: a vehicle, prop, tree or wall in front of
   the speaker; frames that are mostly black or brown (too dark, camera under a roof); the speaker cut off; tiny
   people. Fix and re-watch. Check at least one phone-size sheet per scene.
5. Lore: names and facts in new lines must match docs/lore (`npm run lore -- find <word>` from the repo root). If you
   add a fact, add it to the right entry; then `npm run lore` must pass. New rulings (only if truly needed) use the ids
   given in your issue.

## Report back
For each scene: final length, faults before -> after, waivers used (with reasons), what you changed in one line, and
anything you could not fix.
~~~~

## Epic 2 issues

~~~~text
Issue S2-1: The Grid Truthers (3 scenes)
Epic: 2. Depends on: none. Quest key for rep.sh: grid-truthers. Rulings if needed: R-120, R-121.

## Goal
`sq-grid-truthers-intro`, `sq-grid-truthers-gamma` and `sq-grid-truthers-outro` re-directed: notes written, scenes
restaged, all OK in the report, watched.

## Change
- games/gnome-theft-auto/src/cutscene/scenes/side/gridTruthers.ts (the three scenes; keep export names
  GRID_TRUTHERS_INTRO, GRID_TRUTHERS_GAMMA, GRID_TRUTHERS_OUTRO, GRID_TRUTHERS_SCENES and the ids).
- New: docs/design/gnome-theft-auto/direction/scenes/sq-grid-truthers-intro.md, sq-grid-truthers-gamma.md,
  sq-grid-truthers-outro.md (from TEMPLATE.md, every section filled, like sq-porcelain-blues-intro.md).

## Read first
- games/gnome-theft-auto/src/quests/stages/turfton.ts: stage 'bodega-front' (marks mossley, player, burt, bodega; walks)
- games/gnome-theft-auto/src/quests/stages/turftonB.ts: stage 'culvert-under-deck'
- docs/lore/entries/apocrypha/mossley-inkcap.md, tall-one-pencil.md

## Tone (keep and sharpen)
Paranoid surveillance. Long lenses (frame `fov` 26-34), constant small handheld (`handheld: 0.02` on every shot instead
of one 90 s `shake`), whispers, radio 0, 'mystery' music. Mossley "Plumb-Line" Inkcap: whispers, numbers, instructions
about where not to look. Starting faults: intro 90.0 s / 17, gamma 48.2 s / 7, outro 70.0 s / 13.

## Direction calls (the planner's decisions; follow them)
- LIGHT (the known problem: too dark). Set `sky: 'golden'` on the intro and gamma (it is "dusk, before the streetlights",
  the paranoia does not need black). Keep the HOA van's `headlights: true`. Frame Mossley against the sky or the bodega
  front, never against dark ground from above.
- Intro (aim 45-55 s): cut the caption. Hook: a long-lens frame on Mossley at the kerb sighting along his ruler, his
  first whisper "Don't walk straight at me..." within 2 s. Setup: the sixty-units grid line; the player's flat
  "Somebody planned the roads." TURN: the Code-Enforcement van glides past with its lights on, Mossley freezes
  (`handsUp`), the camera tracks the van (track shot from beside Mossley), and the player, despite themself, freezes too.
  Then the plan in a whisper (four markers, then zero, zero), "What's at zero, zero?" / "Whatever they drew it with."
  Keep Burt's one line from the wall ("He's right about the vans. I used to drive one.": it plants the HOA Audit quest)
  as a reaction beat. CUT the three-line Ammu-Gnation free-gun exchange. BUTTON: after "Whatever they drew it with."
  Mossley looks up at the sky (`face` to a point above), the camera tilts with him (a short dolly or a cut to a low
  shot), mystery sting, hold 1.5 s. End with the player near PLAYER mark (they leave from there).
- Gamma (arrival, aim 20-30 s): Mossley's bike arrives (keep the track), he dismounts glancing over his shoulder. Keep at
  most 5 lines: the markers point at downtown, "something has been rubbed out of the old maps", the player's "Maps get
  redrawn.", and his "Look at me like you're bored. They'll think you're a tourist." (the button, on a frame of him
  doing his best bored face: `shrug`). Cut "Keep your voice down..." and the "grass remembers" line.
- Outro (payoff, aim 40-55 s): PICTURE FIRST. Open on the shake and the thud as the grate gives (hook by 1 s), the
  Pencil spawns, a `reveal` stinger, a slow low dolly up its length BEFORE anyone speaks (2-3 s, no line). Then Mossley's
  awe (one line), the player's "The eraser end is worn right down." (the turn), Mossley: "Somebody has been rubbing things
  out of Turfton." (music out before it, a held `beat('silence')` after it). Then the deflation: the artisan eyebrow
  pencil and "I retire today." Main-story tie, one line: Vesper's HOA will correct the maps by Friday (keep his name).
  BUTTON: Mossley, already chipping at the graphite with his ruler (`gesture` point or lean), the player looking at the
  pencil; Silt-Diver Sal can be the silent extra who walks past and does not look. Cut the "That's stealing from the
  Tall Ones" / "Nobody has ever seen a Tall One" pair only if you need the time.

## Out of scope
Every file not listed under Change; in particular hoaAudit.ts and mulchPyramid.ts (same stage, other workers).
~~~~

~~~~text
Issue S2-2: The Fescue Fugitive (4 scenes)
Epic: 2. Depends on: none. Quest key for rep.sh: fescue. Rulings if needed: R-122, R-123.

## Goal
`sq-fescue-fugitive-intro`, `sq-fescue-fugitive-gallery`, `sq-fescue-fugitive-hollow` and `sq-fescue-fugitive-granny`
re-directed: notes written, scenes restaged, all OK in the report, watched.

## Change
- games/gnome-theft-auto/src/cutscene/scenes/side/fescueFugitive.ts (keep export names FESCUE_INTRO, FESCUE_GALLERY,
  FESCUE_HOLLOW, FESCUE_GRANNY, FESCUE_FUGITIVE_SCENES and the ids).
- New notes: docs/design/gnome-theft-auto/direction/scenes/sq-fescue-fugitive-intro.md, -gallery.md, -hollow.md,
  -granny.md.

## Read first
- games/gnome-theft-auto/src/quests/stages/wilds.ts: stage 'unmowed-hollow'; turftonB.ts: 'patio-gallery';
  cloverfield.ts: 'granny-barn'
- bible section 2: Elder Bracken (archaic, heavy, accusations as statements; still, staff, stands higher: shoot low),
  Sorrel (radio host calm, dry asides about the schedule, never says "mower": she says "the one in the Shed"),
  Granny (warm, "sugar" or "lovey" at most once a scene, pie as currency)
- docs/lore: `npm run lore -- find "stopping stone"`, `find bracken`, `find sorrel`

## Tone
Solemn folk ritual: firelight, slow looks at the standing stones, chant-like measured lines, 'fescue' music for the
hollow (bible: `fescue` is Mossy Wood's theme; use it instead of 'mystery' in the hollow scenes), 'forest' ambience.
The gallery is a deadpan heist; Granny's barn is warm comedy. Starting faults: intro 85.3 s / 14, gallery 68.5 s / 12,
hollow 55.9 s / 7, granny 47.6 s / 8.

## Direction calls
- Intro (aim 45-60 s): cut the caption and the 9 s establishing dolly (open on a 2-3 s low wide of the ring at most, or
  straight on Bracken). Hook: Bracken's "Stop there. Don't step on the moss." on a LOW single as the player arrives.
  Setup: the replica doorstop under a sprinkler (his outrage as a statement). Sorrel's radio line once (shorten it to
  under 16 words). TURN: Bracken's "A replica of something holy is not a doorstop. It is a question." then the warning
  that Granny will bid ("Do not let her buy it with pie."). Keep the reward line. BUTTON: Bracken, looking at the
  player's parked vehicle or simply at the player: "Spend the blessing on nothing with an engine." on a low CU, hold.
  No long closing crane.
- Gallery (arrival, aim 30-40 s, max 45): open on the porcelain guards (low, symmetrical, deadpan). Guard 1 "Sir. Madam.
  Gnome. Are you on the list?" / player "I'm a visitor." / Guard 2 "Visitors are on the list. You are not on the list."
  each on a frame single. The grab: insert (frame on 'you' after `hold` 'stopping-stone'), the alarm, guard 1's line
  (vary it: "Porcelain does not glue back" is used elsewhere; e.g. "Put that down. That is a doorstop.").
  Granny's phone call: two short lines max, split the 23-word line, the choice said plainly (hollow for thanks, barn for
  cash). BUTTON: the player legs it (`walk` run) on a frame shot, alarm still going.
- Hollow (choice payoff, aim 30-45 s): sincere ritual, no gags from the camera. Hook: the stone thuds into the ring.
  Keep the fire flare (shake small, whoosh), Bracken's bow, Sorrel's one line (her calm). Bracken's forgiveness line is
  the heart ("You drove here. I can smell the engine on you. Sit by the fire and be forgiven." split under 16 words).
  Held silence once. BUTTON: Bracken's "Mind the moss." on a low single, or the ring with the stone, still.
- Granny (choice payoff, aim 30-40 s): warm comedy. Hook: Granny on the porch already watching the player arrive. The
  weigh-in gag (one `comic` stinger on the physical gag: she hefts it, it is clearly too light). Cut the caption. BUTTON:
  "Take a pie for the road. It's the only honest thing I sell." on her single.
- Cut every caption (each scene may keep at most one; prefer none).

## Out of scope
Every file not listed under Change.
~~~~

~~~~text
Issue S2-3: The HOA Audit (2 scenes)
Epic: 2. Depends on: none. Quest key for rep.sh: hoa-audit. Rulings if needed: R-124, R-125.

## Goal
`sq-hoa-audit-intro` and `sq-hoa-audit-outro` re-directed: notes written, scenes restaged, both OK, watched.

## Change
- games/gnome-theft-auto/src/cutscene/scenes/side/hoaAudit.ts (keep HOA_AUDIT_INTRO, HOA_AUDIT_OUTRO, HOA_AUDIT_SCENES,
  ids).
- New notes: docs/design/gnome-theft-auto/direction/scenes/sq-hoa-audit-intro.md, sq-hoa-audit-outro.md.

## Read first
- games/gnome-theft-auto/src/quests/stages/turfton.ts 'bodega-front'; turftonB.ts 'clay-mart-lot'
- bible section 2: Burt (nervous, corporate jargon, apologises mid-sentence) and Reginald "Quarter-Inch" Vance (municipal
  code, numbers, "four-oh-four dash B", calipers; shot high except when he is enforcing)
- `npm run lore -- find burt`, `find thorne` (Thorne Lawn & Order)

## Tone
Deadpan bureaucrat: locked-off, symmetrical STILL shots only (frame shots, no dolly, no handheld, no shake), long
pauses (`beat('pause')`), no music at first, then sparse 'mystery'; `sfx 'thud'` is the rubber stamp; form-number
`title` cards (titles do not count as narration). John Bodega sweeps in the background of the intro. Starting faults:
intro 56.7 s / 13, outro 77.9 s / 13 (over length).

## Direction calls
- Intro (aim 40-55 s): hook: the `title` "FORM 404-B: GRIEVANCE" and a stamp thud on a frame of Burt within 1.5 s.
  Burt's nerves: rewrite his lines in his voice (jargon, an apology mid-sentence, e.g. "Sorry. Per policy. Three weeks
  of overtime, docked."), each under 16 words. Split the cactus/snowman line. The job in his voice: five petty officers,
  crack them, bring the clipboards. TURN: Burt lowers his voice: the Tall Ones are not on the board; nobody has ever
  seen one ("I checked. Sorry. I checked twice."), music in under it. Reward: the badge. BUTTON: the player's "Deal.",
  a `beat('pause')`, THUD, Burt: "Stamped." (one word, locked off, symmetrical). Use one `coverage('burt','you',1)`.
- Outro (meanwhile, no player actor; aim 40-55 s, max 60): hook: the first stamp on a locked insert of the clipboards
  on the bonnet (a hand-placed `cut` on the props is fine for the insert because nobody talks on it), then four more
  stamps as fast cuts (insert / Burt single / insert...) instead of 4 s of thuds over one shot. Burt turns to face the
  camera side before talking (fix speaker-back: give him a yaw that faces the clerk or use `face`). The discovery:
  Thorne Lawn & Order on the "Tall-One" forms (keep Vesper's company name; this ties to the main story). Reginald's van
  drives in on a stage path (keep the track, but shorter than 12 s; cut to Reginald as he exits). The stand-off on one
  coverage('burt','reginald',1), Reginald shot HIGH in his singles except "Then I will be back with a laser level."
  (low: he is enforcing). Cut the drive-off to 2-3 s. BUTTON: Burt, alone, locked off: THUD, "Rejected. Stamped. Filed."

## Out of scope
Every file not listed under Change, in particular gridTruthers.ts and mulchPyramid.ts (same bodega stage).
~~~~

~~~~text
Issue S2-4: Castaway's Dry-Dock (2 scenes)
Epic: 2. Depends on: none. Quest key for rep.sh: castaway. Rulings if needed: R-126, R-127.

## Goal
`sq-castaway-drydock-intro` and `sq-castaway-drydock-outro` re-directed: notes written, scenes restaged, both OK,
watched.

## Change
- games/gnome-theft-auto/src/cutscene/scenes/side/castaway.ts (keep CASTAWAY_INTRO, CASTAWAY_OUTRO, CASTAWAY_SCENES,
  ids).
- New notes: docs/design/gnome-theft-auto/direction/scenes/sq-castaway-drydock-intro.md, sq-castaway-drydock-outro.md.

## Read first
- games/gnome-theft-auto/src/quests/stages/cloverfield.ts: stages 'driftwood-trailer' and 'canal-raft'
- `npm run lore -- find driftwood`, `find brenda`
- bible section 2: Driftwood (sun-bleached rambler: cut him short, give him one great line)

## Tone
Melancholy castaway: golden sky, 'sad' music, 'wind' then 'water' ambience, long slow wides ONLY for establishing (no
lines on them), few words, a bell nobody answers. Starting faults: intro 47.3 s / 10, outro 42.4 s / 9.

## Direction calls
- Intro (aim 35-50 s): cut the caption. Hook: Driftwood rings his bell (`sfx 'glass'` softly, `wave` gesture) at a sea
  of clover, on a frame of him from the front (he faces the clover, so place the camera on the clover side); nobody
  answers; 1.5 s hold. His one great line: "Tide's coming in. I can feel it in my hat." The player: "That's clover,
  Driftwood." (straight man). Then "That's the sea before it learns to swim." Keep the HOA-drained-ponds / Brenda's
  republic tie in ONE line under 16 words. The job in his voice (hitch the raft to the combine, haul it to the Southern
  Drainage Canal), split the 22-word lines. TURN: the sun is going: he looks at the sky, quietly "Sun's going." and the
  combine is shown (insert). BUTTON: "Mind the lawn sharks. Nobody believes me about the lawn sharks." on his single, a
  beat, then he rings the bell once more and nobody answers.
- Outro (payoff, aim 30-45 s): ends on an errand hook today ("Captain's hat's in the trailer"): give it a BUTTON. Order:
  the raft slides into the water (picture first, splash), "Oh. It floats." (Driftwood on a frame single, standing in the
  raft), the player one line, "Don't say anything. I'm not talking. I'm floating." Move the captain's-hat line EARLIER
  (before the turn), as a gruff aside. TURN: music out; something deep sings through the hull far to the north
  (stinger 'mystery', a low rumble: `sfx 'thud'` gain 0.3 plus a tiny shake 0.02); Driftwood's face (CU): "Hear that?
  Under the hull. Far north." BUTTON: he does not say anything else: a slow dolly out over the water northwards past him,
  hold 2 s, `sad` or 'mystery' back in. Never name Tessie. Keep his `bow`/salute if it reads. Max 3 Driftwood lines in a
  row: put a player reaction between them.

## Out of scope
Every file not listed under Change.
~~~~

~~~~text
Issue S2-5: The Mulch Pyramid Scheme (3 scenes)
Epic: 2. Depends on: none. Quest key for rep.sh: mulch-pyramid. Rulings if needed: R-128, R-129.

## Goal
`sq-mulch-pyramid-intro`, `sq-mulch-pyramid-wasps` and `sq-mulch-pyramid-outro` re-directed: notes written, scenes
restaged, all OK, watched.

## Change
- games/gnome-theft-auto/src/cutscene/scenes/side/mulchPyramid.ts (keep MULCH_PYRAMID_INTRO, MULCH_PYRAMID_WASPS,
  MULCH_PYRAMID_OUTRO, MULCH_PYRAMID_SCENES, ids).
- New notes: docs/design/gnome-theft-auto/direction/scenes/sq-mulch-pyramid-intro.md, -wasps.md, -outro.md.

## Read first
- games/gnome-theft-auto/src/quests/stages/turfton.ts 'bodega-front' and 'side-valve-bay'; turftonB.ts 'patio-gate'
- bible section 2: Cedric "Double-Bag" Peat (sales patter, never answers a question), Tansy (dry, low, short, works while
  she talks, three-clause orders), Pip (fast, loud, never cruel), Burt (nervous, jargon)
- `npm run lore -- find "chapel of mulch"`, `find cedric`, `find father-loam`

## Tone
Sleazy infomercial: bright noon, 'warm' music, quick cuts (3-4 s), ad copy as `title` pills (NOT captions: titles do
not count as narration) like "RESULTS NOT TYPICAL", "ACT NOW", "NOW WITH 40% MORE WASPS", a slow push-in on the
product (a dolly is fine when nobody is talking or on a single line under 12 s), planted "satisfied customers". The
outro collapses into dry workshop realism (no titles, locked shots). Starting faults: intro 58.8 s / 20, wasps 21.3 s /
6, outro 46.8 s / 10.

## Direction calls
- Intro (aim 40-55 s): Cedric's patter is a monologue that NEEDS REACTIONS: after every Cedric line cut to someone not
  buying it (Burt with his coffee, John Bodega sweeping, the player). Hook: Cedric turns to camera mid-pitch with the
  sack, title "RESULTS NOT TYPICAL", by 1 s. Burt is the first mark ("I have a lawn." / "I also have a citation book.
  Old habits."), John's "Don't sell him anything." Then the player. Cedric never answers a question: when the player
  asks "What is actually in the bags?", he answers a different question first, then admits "Dyed sawdust. Craft
  glitter." Title "NOW WITH 40% MORE WASPS" on the wasps line. TURN: the job is Patio Heights; the player's "That's
  Vesper Thorne's street." (keep: main-story tie), Cedric's unbothered sell. BUTTON: title "LIMITED TIME. LIMITED SOIL."
  over Cedric's frozen salesman smile (a `cheer` or `point` at camera), hold 1.5 s. Split the 26-word job line. End with
  the player near the PLAYER mark.
- Wasps (arrival, aim 15-25 s): "the wasp gag: lock off, hold it". Open on a locked FS/WS frame of the player's spreader
  with the wasps circling (keep the parallel spawn tracks) and let the gag play 2-3 s with no line. The player's line
  ("Glitter. It is in the wheels, the seat, and I think my ears.") on a frame single (the player is seated in the rig:
  frame them anyway). Gary on a frame single, shot low (enforcing), two lines max, split under 16 words. One `comic`
  stinger at most, on the wasps. BUTTON: the player's "We need to move the rig. Now." then the rig's horn or a wasp on
  Gary's hat (`flinch`).
- Outro (payoff, aim 30-45 s): workshop realism: locked singles, no titles. Hook: Tansy under/beside her Zero-Turn, a
  spanner (`held`), says her line without looking up. Cedric slides in with patter, Tansy cuts him down in three short
  clauses. Pip's line about Father Loam: keep it (it is Pip being right for once) but under 16 words. Split Tansy's
  26-word bust line into two lines with Cedric's reaction between. TURN: "It is glitter all the way down." BUTTON:
  "Can I at least keep the spreader?" / "No." / Cedric's `facepalm` on a locked two-shot or single, hold 1.5 s.
  Cut the opening caption.

## Out of scope
Every file not listed under Change, in particular gridTruthers.ts and hoaAudit.ts (same bodega stage).
~~~~
