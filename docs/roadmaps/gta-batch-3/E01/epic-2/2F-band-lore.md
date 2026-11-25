Epic: E01-2 Fill (GTA batch 3, world expansion)
Depends on: none

## Environment
- Repo root: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af7a6a91d2dd2fbef` (a git worktree).
- Git Bash. If `node` is not found: `export PATH="/c/Program Files/nodejs:$PATH"`. `node_modules` is installed.
- Other workers are editing game code at the same time; you only touch `docs/lore/`. Do not commit.
- Keep each existing file's line endings (use the Edit tool).

## Goal
Gnome Theft Auto's map grew from 1800 to 2800 m square (epic E01 built the ground). The story epic (E04) already wrote
draft lore entries for the new places from a plan; now the ground exists, so the four region entries should say where
things actually are, and one ruling records E01's geometry where it differs from E04's plan.

The four bands (world coordinates; north is -z, east is +x):
| region id (code) | name | lore entry | area | roads |
|---|---|---|---|---|
| `north-highlands` | Snowcap Rise | `docs/lore/entries/apocrypha/snowcap-rise.md` | x -1400..1400, z -1400..-900 | `north-band` (on from the north highway at (20, -870), west to (-950, -950)), `north-band-east` (east along the top edge to Pinwheel Ridge's end) |
| `south-shore` | Saltbucket Shore | `saltbucket-shore.md` | x -1400..1400, z 900..1400 | `south-band` (on from Route South at (0, 870), west), `south-band-east`, `coast-spur` (south to the boardwalk) |
| `east-campus` | Rootwell (Rootwell University's country) | `rootwell-university.md` | x 900..1400, z -900..900 | `east-band` (on from Route East at (870, 50), north along x 950), `east-band-south`, `runway-spur` |
| `west-estates` | Trellisdown | `trellisdown.md` | x -1400..-900, z -900..900 | `west-band` (on from the west highway at (-870, -30), north along x -950), `west-band-south` |
The band roads join into one ring road round the old map.

Where E01 put each place (centre, size in metres):
- Snowcap Rise: Snowdrop Slope (-350, -1150) 220 x 300 on a mountain peaking ~65 m near (-350, -1340); Pail Pond (-640, -1060) 180 x 140; Capwood (250, -1180) 300 x 200 on the Fells mountain's north side; Pinwheel Ridge (850, -1200) 300 x 90 on a ridge; the Capwood Run starts at a paddock (90, -760) in Frostbite Fells and finishes near (150, -1300).
- Saltbucket Shore: the Saltwater along the whole south edge (z 1190..1390), a beach z 1140..1190, Saltbucket Boardwalk (0, 1115) 420 x 50 at the end of the coast spur, the Spokewheel (-260, 1100), the Bathtub Queen offshore at (300, 1280).
- Rootwell: Rootwell University's ground (1140, -200) 320 x 300; the Anthill mound (1240, 150), ~45 m high; Rootwell Field runway (1300, 600) running north-south; the Rutbottom Dirt Bowl (1150, -650) 300 x 200; an aircraft dealership beside the runway (1150, 640).
- Trellisdown: Trellisdown Vineyard (-1140, -170) 300 x 220 on a gentle hill, Brassknock Manor (-1150, 40); Wader's Rest (-1130, -640) 180 x 180 (about 400 m west of Loch Moss, not on its shore); the Burrow Door (-1000, 300) just across the west road from Mossy Wood's western edge; Hedgeworth Links (-1180, 620) 360 x 420, entered through the Kicked Board at (-895, 640).
- Turfton: Founders' Green is three blocks: Gnorwin's park block (-30, 30) plus (-90, 30) and (-30, 90); Drainpipe Court is inside it at (-90, 30) and the Gutter Bowls at (-30, 90) (E04's plan had them in other blocks). The Double Pot spans blocks (90, -90) and (150, -90) with the Double Pot Tunnel carrying street x = 120 under it. Saucer Court is the block at (30, 90). The Underspan's ground is beside the Unfinished Span at (580, -26). Thorne Even-Estates' three sites: (-295, -120) by the west highway, (195, 325) by Route South, (1050, 250) in Rootwell. Windfall Croft's plot: (100, 535) in Cloverfield Farms. A car dealership (35, 320) on Route South, a boat dealership on Loch Moss's south shore (-640, -530).
- Region looks (from `games/gnome-theft-auto/src/data/regionThemes.json`): Snowcap Rise "bare high ground above the Fells: drystone walls, cairns, wind-bent pines, slate bothies"; Saltbucket Shore "dunes and marram grass, weathered picket fences, palms, bright beach huts"; Rootwell "mown lawns, clipped hedges and iron railings round old learned halls"; Trellisdown "old money: long clipped hedges, topiary, gravel drives and rose beds".

## Read first
- `docs/lore/README.md` (entry schema), `docs/lore/canon.md` (house style).
- The four region entries named above, plus `founders-green.md`, `the-double-pot.md`, `drainpipe-court.md`,
  `the-gutter-bowls.md`, `the-underspan.md`, `waders-rest.md`, `the-burrow-door.md` in `docs/lore/entries/apocrypha/`.
- The last rulings in `docs/lore/rulings.md` (R-158..R-167 are E04's; yours is R-168).

## Change
- In each of the four region entries: rewrite the "In the games" section (keep the quest-row sentences E04 wrote) to
  say where it is and what stands where, from the lists above, in plain words; add the code region id and
  `games/gnome-theft-auto/src/data/levels/<region id>.level.json` and `games/gnome-theft-auto/src/sites.ts` to `sources`;
  add a "Look and motifs" section (motif list, palette, "In the game: theme `<region id>` in `src/data/regionThemes.json`")
  if the entry has none.
- In `founders-green.md`, `drainpipe-court.md`, `the-gutter-bowls.md`, `the-double-pot.md`, `the-underspan.md`,
  `waders-rest.md`: correct any location sentence that disagrees with the list above (only the location; keep the rest).
- `docs/lore/rulings.md`: append `## R-168` in the file's format. **Question:** "Where exactly do the batch-3 places
  stand, and where does the ground differ from the story plan (E04 spine)?" **Ruling:** the four bands and their roads as
  above; Drainpipe Court and the Gutter Bowls are inside Founders' Green; the Underspan's ground is beside the Unfinished
  Span; Wader's Rest is in Trellisdown, west of Loch Moss; slot ids in `src/sites.ts` stay as they are and carry these
  names as labels. **Applies to:** apocrypha, gnome-theft-auto. **Date:** 2026-11-24. **Why:** E01 built the ground
  after E04 named the places.
- Do not edit `docs/lore/INDEX.md` by hand: `npm run lore` regenerates it.

## Done when
- `npm run lore` passes from the repo root (keep the INDEX.md it regenerates).
- `npm run lore -- find Saltbucket` still finds the shore entry.

## Out of scope
- Game code, `regionThemes.json`, other entries' prose.
