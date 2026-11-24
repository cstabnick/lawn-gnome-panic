# Outline row format (issues 01-04)

You expand the spine's skeleton rows for one act into the full outline rows that build workers (E20, E21, E22) turn
into quest code. A build worker must be able to implement a row from the row plus the character's block alone, so every
row is concrete: who, where (a named place, never coordinates), what the player does, in what vehicle, what is seen.

## What exists in the game today (so rows ask for things that can be built)
- Objective kinds (`games/gnome-theft-auto/src/quests/types.ts`): `crack` (crack named targets), `visit` (reach a place;
  can raise heat or play a scene), `steal-deliver` (take a vehicle or item to a place), `chase-follow` (tail or chase a
  vehicle), `convoy-ambush`, `air-drop` (fly and bail out over a target), `survive-derby` (survive waves for a time),
  `boss-combine`, `choice` (two options), `race` (laps vs rivals), `checkpoints` (point to point with a timer, optional
  vehicle and damage limit), `probe` (a counted in-world action: photograph, hold, inspect), `tessie-*` (Tessie only).
  A beat that needs anything else is written `needs new kind: <name> (<epic>)`, using: `golf-hole` (E15), `jam-game`
  (E19), `skate-line` (E19), `ski-run` (E12), `tow-ski` (E11), `ride-passenger` (E11), `dig` (E17), `interior-visit`
  (E05), `roof-land` (E05), `farm-task` (E16). Always give a fallback with an existing kind in the notes.
- Vehicles: push-mower bike, Ride-On, Zero-Turn, Ride-On Lowrider, combine, Crop Duster plane, the Whirligig
  helicopter, boats, golf cart, barrow buggy; batch 3 adds dirt bike (E14), the Dewdrop (E18), dealership cars, boats
  and aircraft (E08). A quest spawns the player's vehicle nearby if it needs one.
- Cutscenes: each quest has an intro, optional mid scenes and an outro (`docs/design/gnome-theft-auto/direction/bible.md`
  sections 3-4: intros 30-60 s, outros 15-45 s, arrivals 10-35 s; one narrator line per scene). Connective quests get
  an intro and a short outro, or comms only. Every scene names a time of day: `dawn`, `day`, `dusk`, `night`. If it is
  not the time the quest is played at, E06's time-lapse handles it; write it anyway.
- Comms (`src/quests/comms.ts`): talking-head calls at quest start (step 0) and as objectives change; at most 16 words
  a line, one place name per call. Write the gist of each step, not the exact line.

## Rules for every row
- Context (L04): comms step 0 or the intro says who is asking, what they want, where, why now, and what the player
  gets, in the speaker's voice. Add a one-line **Previously** (for the journal) in the notes.
- No quest depends on a scene the player may have skipped: anything the player must know is also in comms or the
  objective text.
- World use (L83): give the region tag; the spine already keeps runs to two rows per region.
- L58: say when a beat picks someone up at, or drops them at, their home or workplace (homes are in spine section 6).
- Mobile: note any beat that would need a new touch control; story quests stay single-player.
- Prefabs: a unique object the quest needs is written `prefab needed: <name>`.
- Tension and comedy follow the bible's curve: sincere beats get no gag on top; never two sincere scenes in a row
  without a laugh between them.
- Kept quests (`keep`): describe them as they are today (read their def in `games/gnome-theft-auto/src/quests/chapterN.ts`)
  and note only the prereq change and any line that must change because of the new rows. `rewrite`: say exactly what
  changes (which scene, which line of intent, which objective), keeping the id, objective count and order unless the
  row says otherwise.

## Output file layout (write exactly this shape)

```
## Act <N>: <title> (rows a-b)

<act summary: 6-10 lines: premise, stakes, what the player wants and learns, emotional curve with tension numbers,
which characters change and how, which regions it visits>

### Quest table

| # | id | title | act | status | old id | giver (place) | region | prereq id | cast | beats | objective kinds | cutscenes | comms steps | reward and unlock | world change id | side quests it opens | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ... |

### Extended quest parts

| part id | row | title | objective(s) | cutscene (time of day) | cast | notes |
|---|---|---|---|---|---|---|

### Achievement candidates

| trigger (quest or part id) | name | condition | cosmetic reward (slot: head/back/neck/hand, prefab or "prefab needed: x") |
|---|---|---|---|
```

Cell formats (a pipe table cell cannot hold a line break; never use a `|` inside a cell):
- beats: 3 to 6 numbered beats inline: `(1) ... (2) ... (3) ...`
- objective kinds: in order, e.g. `visit; chase-follow; crack` (or `needs new kind: ...`)
- cutscenes: `intro: <scene id> (<time>) <one line>; mid: ...; outro: <scene id> (<time>) <one line>`. Scene ids:
  kebab-case `<quest slug>-intro`, `-mid`, `-outro`; for kept quests keep the existing scene ids (`even-cut-intro` etc.).
- comms steps: `0 <speaker>: <gist>; 1 <speaker>: <gist>; ...`
- reward and unlock: acorns (connective quests 150-400, setpieces 500-1,200, extended 1,500+), items, vehicles,
  achievements by name, what opens (a place, a shop, a vehicle)
- world change id: a spine id `W01`..`W17` or `-`
- side quests it opens: write `(schedule)`; the lead fills this column from the side-quest schedule
- notes: `Previously: ...; L58: ...; L83: <region tag>; fallback: ...; prefab needed: ...; mobile: ...`

The extended-parts table lists each part of your act's extended quests in order (`<row id>-p1`, `-p2`, ..., then the
final part with the row id itself).

Achievements: 3 to 6 for your act, at least one per extended quest; rewards are cosmetic gear for the gnome.
