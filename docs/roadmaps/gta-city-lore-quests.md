# Gnome Theft Auto: Turfton city lore, city contracts and the Kerbside Exchange hub

Workstream "city-lore-and-quests" of the GTA batch. User's words: "add lore for the city and such and make a few quests
there and pull some other quests into it and make it integrated."

## Goal

1. A proper lore pass for Turfton: its districts, history, civic institutions, towers, transport, slang and a recurring
   city cast, as entries under `docs/lore/entries/apocrypha/` plus rulings R-147..R-152, indexed by `turfton-gazetteer`.
2. Five new city quests ("city contracts"), handed out at a new hub, the **Kerbside Exchange** (Dot Pennywort's job
   board by the Central Bus Stop), each with a scripted intro and payoff, talking-head comms, a perk, and (three of
   them) an achievement with a unique cosmetic reward.
3. The city becomes the hub: the Exchange board (a phone app) lists every open side contract in and around Turfton,
   labelled by district; existing side quests are re-labelled to the district lore; Shelldon gives his job from his own
   alley; the journal shows where each job is.

## Decisions (recorded as rulings R-147..R-152 in docs/lore/rulings.md)

- **Districts** (R-147): the six of `src/districts.ts` (Downtown Turfton, Greenhouse Strip, Patio Heights, Old Brick
  Quarter, Turfton Park & Arts, Clay-Mart Industrial) plus "the Ring Blocks" for every block outside them (Pay 'n' Glaze
  is in the Ring Blocks). `src/city/places.ts placeName(x, z)` is the one function that names a point.
- **History** (R-148): Flat Patch, Grid Night, the Pot Rush, the Great Sprinkler Scare, the Pour (Skyway + strike), Now.
- **Institutions** (R-149): the Council (Mayor Mulch, five-seat Zoning Board, Juniper the one dissent), the Patio
  Heights HOA (Vesper via Thorne Lawn & Order; not Gnome Company's `hoa`), the Hat Watch (Watch House north of City
  Hall), the Kiln (the Clay-Mart Kilnworks fires and bills newcomers: that is the Kiln-Debt), transport (Snail-Coach line,
  Mabel's taxi, Local 404 roads and the Skyway, Snail-Mail Express and Pigeon-Drop).
- **Hub** (R-150): the Kerbside Exchange at giver marker (-9, 45), stage `kerb-exchange`, run by Dot Pennywort. Every
  open side job is on her board (phone app); other givers keep their jobs. Shelldon's job moves to his alley.
- **Cast** (R-151, `src/city/cityCast.ts`): Dot, Hedda Galley (Tattler editor, new), Neon-Moth Nina, Big Wrench Grout,
  Pip, Tansy, John Bodega, Juniper, Big Lou, Shelldon, Mossley, Mabel. New speaker keys: `dot`, `hedda`, `nina`,
  `grout`, `mabel` (preset + voice + caller name).
- **Skyway** (R-152): the HOA moves Local 404's seized strike-fund ledger by the ground road; the Skyway Job beats it.
- **Outskirts town**: another planner adds a new minor town (docs/roadmaps/gta-outskirts-town.md). Our entries link to
  its lore only if it exists when the lore issue runs; nothing here contradicts or touches it.
- **Online**: quests are single-player per browser, like every GTA quest; no change to net code.
- **Mobile**: the Exchange board is a phone app with 44 px rows; nothing new needs a key.

## The city contracts (src/quests/cityQuests.ts, written in Epic 0)

| id | title | client | unlock after (story) | prereq | objectives | reward | perk | achievement |
|---|---|---|---|---|---|---|---|---|
| city-kerbside-rounds | Kerbside Rounds | Dot | ch1-mowers-keepers | - | visit Bodega (Old Brick), Nina's stoop (Greenhouse), City Hall (Downtown), back to Exchange | 300 | conductor-punch (taxi -10%) | - |
| city-impound-run | Impound Run | Pip | ch1-tax-break-in | kerbside | crack 2 HOA impound clerks (Clay-Mart yard); drive Pip's Zero-Turn to Pay 'n' Glaze | 550 | impound-key (Sling-Lift -25%) | - |
| city-glow-band-express | Glow-Band Express | Nina | ch1-founders-boot | kerbside | checkpoints (90 s, push-bike): Nina's stoop, Gnomecino, Bodega, Amphitheater | 500 | glow-band (heat cools faster Downtown/Greenhouse) | gta-glow-runner |
| city-penthouse-exclusive | Penthouse Exclusive | Hedda | ch2-vespers-offer | kerbside | checkpoints in the air round Thorne Tower (Sycamore Copter); back to Exchange | 700 | press-pass (event rewards +10%) | gta-front-page |
| city-skyway-robbery | The Skyway Job | Grout | ch3-salvage-raid | impound | checkpoints (45 s, Zero-Turn) along the Skyway deck; crack 3 HOA couriers; HOA van to Union Hall | 1000 | union-card (+20 Acorns / 3 min) | gta-skyway-robbery |

Plus `gta-kerbside-fixture`: all five city contracts done (unlocked by the Exchange app).

Scenes (ids named in cityQuests.ts): `<quest-id>-intro` at stage `kerb-exchange` (Dot + client + player), and
`<quest-id>-outro` at: kerbside-rounds -> `kerb-exchange`; impound-run -> `pay-n-glaze`; glow-band-express ->
`amphitheater`; penthouse-exclusive -> `kerb-exchange`; skyway-robbery -> `clay-mart-lot`.

## Re-homing audit (existing quests)

| quest | where it happens | decision |
|---|---|---|
| prologue + ch1 (5 quests) | all Turfton | Story plot unchanged. The Exchange's unlock beats hang off ch1 quests; city comms cross-reference them. |
| ch2-ch5 | outer biomes | Unchanged. Penthouse/Skyway unlocks hang off ch2-vespers-offer and ch3-salvage-raid. |
| sq-grid-truthers | 4 markers in Turfton | Texts/hints renamed to districts (Clay-Mart Industrial, Park & Arts, Patio Heights, Downtown). |
| sq-snail-rigging | Shelldon's alley, Downtown paddock | **Giver moved** from 'strangers' (Bodega pavement) to new 'strangers-shelldon' at his alley, where its intro is staged. Texts renamed. |
| sq-big-lou-embargo | Park & Arts alley, Gnomecino | Texts/hints renamed (Park & Arts back alley). |
| sq-mulch-pyramid | Old Brick -> Patio Heights -> Side-Valve | Hints name the districts. |
| sq-hose-revolt | Ring Blocks, Greenhouse, Patio Heights | Texts/hints and Brenda's comms renamed (no "North Turfton"). |
| sq-hoa-audit | Downtown + biomes | Downtown target hint renamed. |
| sq-fescue-fugitive, porcelain x2, castaway, biscuit, tessie, races | outside the city | Unchanged; listed on the Exchange board with their region name. |

Save format: unchanged. Quest ids are unchanged; new quests are new ids; moving a giver does not touch saves.

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 0 Foundation (planner) | tsc clean; quest data, givers, markers, unlocks, perks, bulletins, stubs, rulings in place | written by the planner |
| 1 Lore, systems, stage, cast, hub | `npm run lore`; `npx tsc --noEmit -p games/gnome-theft-auto`; quest/stage/comms/perk/achievement tests | 8 |
| 2 Scenes | pacing + scenes tests pass for the 10 new scenes | 5 |
| 3 Wire-up (planner) | app.ts hook, full test, smoke, play the first steps | planner |

Epic 0 files (done): `src/quests/types.ts` ('checkpoints' kind, CheckpointDef), `src/quests/objectivesCity.ts` (stub),
`src/quests/quests.ts` (OBJECTIVE_KINDS), `src/quests/cityQuests.ts`, `src/quests/defs.ts` (givers kerb-exchange,
strangers-shelldon; CITY_QUESTS), `src/data/levels/turfton.level.json` (two giver markers), `src/quests/unlocks.ts`,
`src/quests/sideQuests.ts` (snail giver), `src/perks.ts`, `src/perkEffects.ts`, `src/perks.test.ts`,
`src/radio/content.ts` (bulletins), `src/quests/quests.test.ts`, `src/quests/unlocks.test.ts`,
`src/cutscene/scenes/city/*` (stubs), `src/cutscene/scenes/index.ts`, `src/city/cityCast.ts`, `src/city/places.ts`,
`docs/lore/rulings.md` (R-147..R-152).

## Epic 1 issues

~~~~text
Epic: 1 (lore, systems, stage, cast, hub). Issue 1-1: Lore, Turfton districts and places
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Use absolute paths.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
- Other workers (and other planners) edit other files in this same worktree right now. Edit ONLY the files listed
  under Change. Do not commit, stash, switch branches, run vite build or start servers.
- Lore rules: read docs/lore/README.md (entry schema, tiers) and docs/lore/canon.md (house style: plain, short,
  concrete). Rulings R-147..R-152 at the end of docs/lore/rulings.md are the decisions to write up; do not contradict
  them or existing entries. Search before writing: `npm run lore -- find <word>` (from the repo root).

## Goal
Every Turfton district has a lore entry (name, character, landmarks, factions, rumours, local slang), plus the Ring
Blocks, the Kerbside Exchange, and a gazetteer entry that links every Turfton entry so `npm run lore -- find` finds
them all.

## Read first
- docs/lore/README.md (schema), docs/lore/rulings.md R-147..R-152 (the decisions)
- docs/lore/entries/apocrypha/turfton.md, greenhouse-strip.md, patio-heights.md, turfton-skyway.md, bodega-and-sons.md,
  side-valve-salvage.md, turfton-amphitheater.md, clay-mart-warehouse.md, local-404-union-hall.md
- docs/design/gnome-theft-auto/world-lore.md (section 1 Turfton) and society.md
- games/gnome-theft-auto/src/districts.ts (DISTRICT_NAMES, districtAt borders)

## Change
New entries in docs/lore/entries/apocrypha/ (frontmatter: kind place unless said, tier apocrypha, setting apocrypha,
era now, status draft, games [gnome-theft-auto], sources must be real repo paths, e.g.
docs/lore/rulings.md, games/gnome-theft-auto/src/districts.ts, games/gnome-theft-auto/src/quests/cityQuests.ts).
Each district entry has these body sections: one-paragraph summary; "## Character"; "## Landmarks" (bullets with
world x, z from the facts below); "## Factions"; "## What gnomes say" (2-3 rumours, in quotes); "## Local slang"
(exactly the terms below, each with a one-line meaning); "## In the games"; "## Loose threads".
- downtown-turfton.md "Downtown Turfton" (aliases [Downtown, The Core]): x and z within 45 of (0,0), and the rest of
  the |x|,|z| <= 95 square not taken by another district. Landmarks: City Hall steps (0, -72); Thorne Tower (30, -30),
  86 m, Vesper's Penthouse Pot on top; the Mulch Club (-30, -30); Glaze Clinic Hospital (30, 30); Central Bus Stop
  (-6, 14); Kerbside Exchange (-9, 45); Gnoma's food truck (13, 44); the slug paddock (24, -14); the Watch House on the
  x = 0 road north of City Hall (lore only); Gnorwin Clayfoot Park. Factions: City Hall, the Hat Watch, Don Compost's
  Mulch Club, Thorne Lawn & Order. Slang: "on the grid" (working a legal job), "a two-coat" (a politician who repaints
  after a scandal), "kerb-sitting" (waiting at the Exchange for work). related: [turfton, turfton-gazetteer,
  turfton-city-hall, thorne-tower, kerbside-exchange, turfton-bus-stop, watch-house].
- old-brick-quarter.md "Old Brick Quarter" (aliases [Old Brick, The Quarter]): x -185..-45, z 45..125; the Flat
  Patch's footpaths became its lanes (R-148). Landmarks: Bodega & Sons (-90, 90; shopfront -76, 90), Side-Valve
  Salvage (-150, 90; bay -150, 72), Shelldon's dumpster alley (-80, 72), Mossley's survey table outside Bodega & Sons.
  Factions: Red Caps (corner crews), Side-Valve crew, Shelldon's couriers. Slang: "no sons" (honest, after Bodega &
  Sons), "the paving's listening" (keep your voice down), "pulls left" (a plan or a mower that is a bit off).
  related: [bodega-and-sons, side-valve-salvage, shelldon-dumpster-alley, red-cap-corners, turfton-gazetteer].
- turfton-park-and-arts.md "Turfton Park & Arts" (aliases [Park & Arts, The Arts]): x -135..-5, z -125..65 outside
  Downtown. Landmarks: the Amphitheater (-90, -90); the back alleys the Red Caps use (around -88, -34); busking
  pitches; the Velvet Toadstools' rehearsal room (lore only). Slang: "a toadstool encore" (something that goes on too
  long), "cracked in the rain" (melodrama, after Sir Reginald Clayfoot's play), "a tier-sitter" (a critic).
  related: [turfton-amphitheater, the-velvet-toadstools, sir-reginald-clayfoot, turfton-gazetteer].
- clay-mart-industrial.md "Clay-Mart Industrial" (aliases [The Industrial, The Yards]): x -215..-115, z 115..215.
  Landmarks: Clay-Mart warehouse (-150, 150), its returns yard and the HOA impound (-130, 150), the Clay-Mart Kilnworks
  (lore only, behind the warehouse), the Local 404 Union Hall (behind Clay-Mart on the z = 180 road, around -150, 180),
  the canal culvert into the Under-Deck (-195, 195). Factions: Local 404, Clay-Mart Collections, the HOA impound.
  Slang: "fired and billed" (a newcomer), "forty-eight hours" (a strike threat), "on the meter" (in debt).
  related: [clay-mart-warehouse, clay-mart-kilnworks, local-404-union-hall, big-wrench-grout, under-deck, turfton-gazetteer].
- ring-blocks.md "The Ring Blocks" (aliases [Ring Blocks]): every grid block outside the six districts: pot-street
  housing; Pay 'n' Glaze (90, 150) and the hose main north of City Hall (10, -112) stand here; Ammu-Gnation is on the
  east edge. Slang: "pot-street" (an ordinary home), "a ring-blocker" (someone from no district in particular).
  related: [turfton, pay-n-glaze, ammu-gnation, turfton-gazetteer].
- kerbside-exchange.md "The Kerbside Exchange" (aliases [The Exchange, Dot's Board]): R-150. A cork notice-board and a
  folding desk at (-9, 45) on the x = 0 road pavement, south of the Central Bus Stop; Dot Pennywort punches a ticket
  for every job. In the games: giver 'kerb-exchange' in games/gnome-theft-auto/src/quests/defs.ts, its five contracts in
  src/quests/cityQuests.ts (Kerbside Rounds, Impound Run, Glow-Band Express, Penthouse Exclusive, The Skyway Job), the
  phone app "Kerbside Exchange" listing every open side job. related: [dot-pennywort, turfton-bus-stop,
  downtown-turfton, turfton-gazetteer, hedda-galley, neon-moth-nina, big-wrench-grout, pip-potsworth].
- turfton-gazetteer.md "Turfton Gazetteer" (kind concept, aliases [Turfton Index]): one line per Turfton entry, grouped:
  Districts (the six + ring-blocks), History (turfton-timeline), Institutions (turfton-council, patio-heights-hoa,
  hat-watch, watch-house, clay-mart-kilnworks, turfton-transit, turfton-skyway, turfton-ring-road), Buildings and towers
  (turfton-towers, thorne-tower, turfton-city-hall, the-gnomecino, the-mulch-club, glaze-clinic-hospital, ...),
  People (the recurring cast of R-151), Language (turfton-slang), Beyond the grid (southern-drainage-canal, loch-moss,
  desert-airfield, the outskirts town if an entry for it exists: check `npm run lore -- find town` and
  docs/roadmaps/gta-outskirts-town.md; if it does not exist yet, write "the outskirts town (planned)" with no link).
  Use markdown links `[Name](id.md)`. related: all the district ids plus turfton.
Edits:
- greenhouse-strip.md and patio-heights.md: add "## Local slang" and "## Landmarks" sections and related
  turfton-gazetteer; do not remove text. Greenhouse slang: "under the glass" (out for the night), "moth-bait" (a
  show-off in neon), "sugar" (Nina's word for anyone). Patio Heights slang: "curb appeal" (said like a threat), "a
  quarter-inch" (any petty fine, after Reginald Vance), "flagstoned" (foreclosed). Greenhouse note: Pay 'n' Glaze's
  shop stands south in the Ring Blocks (R-147).
- turfton.md: add a "## Districts" section listing the six districts and the Ring Blocks with links, and add
  turfton-gazetteer, turfton-timeline to related. Keep the Loose thread about the grid.
- docs/lore/settings.md: in the `apocrypha` games list, the gnome-theft-auto sentence gets "; Turfton's districts,
  history, institutions and the Kerbside Exchange; R-147..R-152" before its closing parenthesis.

Ids owned by issue 1-2 (being written at the same time; you may put them in `related` and links): turfton-timeline,
turfton-council, patio-heights-hoa, watch-house, clay-mart-kilnworks, turfton-transit, turfton-towers, turfton-slang,
dot-pennywort, hedda-galley.

## Done when
- `npm run lore -- check` (repo root) reports no error in YOUR files. Errors that only name the issue-1-2 ids above as
  missing related ids are expected until 1-2 lands; list them in your report.
- `npm run lore -- find "Old Brick"` lists old-brick-quarter; `npm run lore -- find Exchange` lists kerbside-exchange.

## Out of scope
docs/lore/rulings.md (do not edit), INDEX.md (regenerated by `npm run lore`, fine if it changes), any game code, the
issue 1-2 files listed above.
~~~~

~~~~text
Epic: 1. Issue 1-2: Lore, Turfton history, institutions and the city cast
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Use absolute paths.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
- Other workers (and other planners) edit other files in this same worktree right now. Edit ONLY the files listed
  under Change. Do not commit, stash, switch branches, run vite build or start servers.
- Lore rules: read docs/lore/README.md (entry schema) and docs/lore/canon.md (house style: plain, short, concrete).
  Rulings R-147..R-152 at the end of docs/lore/rulings.md are the decisions to write up; do not contradict them or
  existing entries. Search first: `npm run lore -- find <word>` (repo root).

## Goal
Turfton's history, civic institutions, towers, transport and slang each have an entry, and the recurring city cast
(R-151) is complete: two new people (Dot Pennywort, Hedda Galley) and "In the games" updates for the existing ones the
new city quests use.

## Read first
- docs/lore/README.md, docs/lore/rulings.md R-147..R-152
- docs/design/gnome-theft-auto/world-lore.md (section 1) and society.md
- docs/lore/entries/apocrypha/: turfton.md, hat-watch.md, hoa.md, thorne-lawn-and-order.md, kiln-debt.md,
  clay-mart.md, turfton-city-hall.md, thorne-tower.md, turfton-skyway.md, turfton-taxi.md, snail-coach.md
- games/gnome-theft-auto/src/city/cityCast.ts (the cast: voice, persona, home, quests)
- games/gnome-theft-auto/src/quests/cityQuests.ts (the five city contracts)

## Change
New entries in docs/lore/entries/apocrypha/ (tier apocrypha, setting apocrypha, era now, status draft,
games [gnome-theft-auto]; sources real repo paths, always including docs/lore/rulings.md; body: summary paragraph,
then the sections that apply from: "## What gnomes say", "## The truth", "## In the games", "## Loose threads").
- turfton-timeline.md "The Turfton Chronicle" (kind era, aliases [Turfton history]): the five eras of R-148 in order,
  one short paragraph each, then "Now". Loose thread: who laid the grid.
- turfton-council.md "Turfton Council" (kind faction, aliases [The Zoning Board, The Council]): R-149.
- patio-heights-hoa.md "Patio Heights Homeowners' Association" (kind faction, aliases [The Patio Heights HOA]):
  R-149; say it is not Gnome Company's HOA (related hoa); fines end at the Glaze & Tax Office; Reginald Vance is its
  enforcer. related [thorne-lawn-and-order, vesper-thorne, reginald-vance, patio-heights, hoa].
- watch-house.md "The Watch House" (place): the Hat Watch station on the x = 0 road north of City Hall (lore only, not
  built in the game). related [hat-watch, three-hat-heat, downtown-turfton].
- clay-mart-kilnworks.md "Clay-Mart Kilnworks" (place, aliases [The Kilnworks]): R-149; behind the Clay-Mart
  warehouse in Clay-Mart Industrial; fires and glazes newcomers for the Snail-Coach line; bills them: the Kiln-Debt.
  Lore only. related [clay-mart, kiln-debt, clay-mart-industrial, snail-coach].
- turfton-transit.md "Getting around Turfton" (concept, aliases [Turfton transport]): Snail-Coach line to the Central
  Bus Stop, Mabel's Turfton Taxi (always back to the Bus Stop), Local 404's roads, Ring Road and Skyway (R-152: the HOA
  will not drive the Skyway), Snail-Mail Express, Pigeon-Drop, the Sling-Lift (Tansy's Lock-Up, called from the
  phone). related [snail-coach, turfton-taxi, turfton-skyway, turfton-ring-road, snail-mail-express,
  pigeon-drop-couriers, side-valve-lock-up].
- turfton-towers.md "The Pot Towers" (concept): the stacked-pot towers of the Pot Rush and who owns the notable ones:
  Thorne Tower (Thorne Lawn & Order, Vesper's Penthouse Pot), City Hall (the council), the Kiln-Shield billboards'
  tower, the Gnomecino's glasshouse block, Clay-Mart's warehouse. Keep looks general (another team is restyling the
  tower models now): no colours or heights except Thorne Tower's 86 m.
- turfton-slang.md "Turfton slang" (term): every district's slang, exactly these: Downtown: "on the grid", "a
  two-coat", "kerb-sitting". Greenhouse Strip: "under the glass", "moth-bait", "sugar". Patio Heights: "curb appeal",
  "a quarter-inch", "flagstoned". Old Brick Quarter: "no sons", "the paving's listening", "pulls left". Park & Arts:
  "a toadstool encore", "cracked in the rain", "a tier-sitter". Clay-Mart Industrial: "fired and billed",
  "forty-eight hours", "on the meter". Ring Blocks: "pot-street", "a ring-blocker". Meanings: "on the grid" working a
  legal job; "a two-coat" a politician who repaints after a scandal; "kerb-sitting" waiting at the Exchange for work;
  "under the glass" out for the night; "moth-bait" a show-off in neon; "sugar" anyone (Nina's word); "curb appeal"
  said like a threat; "a quarter-inch" any petty fine; "flagstoned" foreclosed; "no sons" honest; "the paving's
  listening" keep your voice down; "pulls left" a bit off; "a toadstool encore" something that goes on too long;
  "cracked in the rain" melodrama; "a tier-sitter" a critic; "fired and billed" a newcomer; "forty-eight hours" a
  strike threat; "on the meter" in debt; "pot-street" an ordinary home; "a ring-blocker" someone from no district.
- dot-pennywort.md "Dot Pennywort" (person, aliases [Dorrit Pennywort, Dot]): R-150; retired Snail-Coach conductor,
  punches a ticket for every job, "the city pays me in gossip"; voice: calls stops ("Next!", "Fares, please."). In the
  games: giver 'kerb-exchange', quests city-kerbside-rounds (her own) and the rest of cityQuests.ts.
- hedda-galley.md "Hedda Galley" (person, aliases [The Editor]): R-151; edits the Turfton Tattler; talks in headlines;
  never photographed; never printed a correction. In the games: client of city-penthouse-exclusive. related
  [turfton-tattler, kerbside-exchange].
Edits (append an "## In the games" bullet or a short paragraph; never remove text):
- big-wrench-grout.md: client of city-skyway-robbery (R-152), the strike-fund ledger.
- local-404-union-hall.md: location (behind Clay-Mart on the z = 180 road, R-152); the ledger's story; keep the loose
  thread about what is written in it.
- neon-moth-nina.md: client of city-glow-band-express; her stoop on the Greenhouse Strip (51, -41).
- turfton-tattler.md: Hedda Galley edits it (R-151); city-penthouse-exclusive.
- mabel-kerbstone.md: part of the recurring city cast (R-151); she drops every fare at the Central Bus Stop, next to
  the Kerbside Exchange.
- pip-potsworth.md: client of city-impound-run (his Zero-Turn impounded by the HOA, resprayed at Pay 'n' Glaze).

Ids owned by issue 1-1 (written at the same time; fine to link): downtown-turfton, old-brick-quarter,
turfton-park-and-arts, clay-mart-industrial, ring-blocks, kerbside-exchange, turfton-gazetteer. Every new entry of
yours lists turfton-gazetteer in related.

## Done when
- `npm run lore -- check` (repo root) reports no error in YOUR files (errors naming only the 1-1 ids above as missing
  related ids are expected until 1-1 lands; say so in your report).
- `npm run lore -- find Pennywort`, `find Kilnworks`, `find slang` each list your entry.

## Out of scope
docs/lore/rulings.md, settings.md, turfton.md, greenhouse-strip.md, patio-heights.md (issue 1-1), any game code.
~~~~

~~~~text
Epic: 1. Issue 1-3: The 'checkpoints' objective runner
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH". Run tests from games/gnome-theft-auto:
  `npx vitest run src/quests/objectivesCity.test.ts`.
- Other workers edit other files in this worktree now. Edit ONLY the files under Change. Do not commit, stash, run
  vite build or start servers.

## Goal
`src/quests/objectivesCity.ts` replaces its stub with a working runner for the 'checkpoints' objective: gates in
order, an optional clock, an optional spawned ride, air gates (Skyway deck, rooftop rings).

## Read first
- src/quests/types.ts: the 'checkpoints' member of ObjectiveDef, CheckpointDef, Run, QuestDeps (verbatim below)
- src/quests/objectivesAction.ts: airDropRun (spawns a vehicle, rings, beacon, cleanup that keeps a vehicle the player
  sits in) and its makeRing / makeBeacon helpers: copy those two small helpers into your file
- src/quests/objectivesDrive.ts lines 141-250 (stealDeliverRun: maxDamage check `1 - v.hp > maxDamage`, respawn)
- src/quests/cityQuests.ts: the three quests that use it (how the data looks)

## Contract (already in src/quests/types.ts; do not change it)
```ts
| { kind: 'checkpoints'; text: string; points: CheckpointDef[]; seconds?: number;
    vehicle?: { kind: VehicleKind; at: [number, number, number] }; requireVehicle?: VehicleKind;
    maxDamage?: number; heatOnStart?: number; hint: string };
export interface CheckpointDef { at: [number, number]; radius: number; height?: number; label: string }
```
Keep the stub's export exactly: `export function checkpointsRun(obj, deps: QuestDeps, changed: () => void,
say: (t: string) => void): Run` (quests.ts already calls it).

## Change
- src/quests/objectivesCity.ts:
  - Export pure helpers (tested):
    `export function gateHit(g: CheckpointDef, x: number, y: number, z: number, groundY: number): boolean` = horizontal
    distance to g.at <= g.radius AND (g.height === undefined OR |y - (groundY + g.height)| <= g.radius).
    `export function clockLeft(seconds: number | undefined, startedAt: number | null, now: number): number | null` =
    null when no clock (seconds absent or 0) or not started, else seconds - (now - startedAt) (may be negative).
  - checkpointsRun: state `next` (index of the gate to reach), `t` (time, += dt), `startedAt` (t when gate 0 was passed,
    null before), `ride` (spawned vehicle or null), `doneFlag`.
    - Spawn: if obj.vehicle and deps.vehicles: `const p = pushOutOfBoxes(x, z, VEHICLES[kind].radius, deps.world.boxes, 0)`
      (import pushOutOfBoxes from '../collide', VEHICLES from '../config'), `ride = createVehicle(deps.scene, kind, p.x,
      p.z, yaw)`, push into deps.vehicles.
    - Gate meshes: one for the NEXT gate only (rebuild when `next` changes). Ground gate (no height): copy makeRing
      (flat ring on the ground, colour 0xffd23f) plus makeBeacon. Air gate: a vertical THREE.TorusGeometry(radius,
      0.35, 8, 40) with MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.7 }) at
      y = heightAt(x, z) + height, rotated to face the previous gate (yaw = Math.atan2(dx, dz) of previous->this; for
      gate 0 face the player) plus a beacon. Dispose geometry and material when replaced.
    - update(dt, px, pz): t += dt; let p = deps.player; y = p?.vehicle ? p.vehicle.y : (p?.y ?? 0).
      - If ride and obj.maxDamage !== undefined and (ride.exploded or 1 - ride.hp > obj.maxDamage): remove it
        (removeVehicle(deps.scene, ride) and splice from deps.vehicles) unless the player sits in it (then just make
        a new one anyway after the player is out? Simplest: always spawn a fresh one at the start point; if the player
        is in the old one, leave the old one in the world), next = 0, startedAt = null, say('Too much damage! A fresh
        ride is waiting at the start.').
      - If requireVehicle and p?.vehicle?.kind !== requireVehicle: no gate counts.
      - If gateHit(points[next], px, y, pz, heightAt(px, pz) ... use heightAt(points[next].at) for groundY): if next
        === 0 { startedAt = t; if obj.heatOnStart deps.watch?.addHeat(obj.heatOnStart) }; say(`Checkpoint: ${label}`);
        deps.play('whistle'); next++; if next === points.length { doneFlag = true; changed(); return }.
      - Clock: const left = clockLeft(obj.seconds, startedAt, t); if left !== null && left <= 0: next = 0,
        startedAt = null, say(`Out of time! Back to ${points[0].label}.`).
    - lines(): [obj.text, `Next: {{${label}}} (${next + 1}/${n})` + (left !== null ? ` · ${Math.ceil(left)}s` : '')];
      when requireVehicle is set and the player is not in it, the second line is `Get in the {{<VEHICLES[kind].name>}}`.
    - blips(): doneFlag ? [] : [{ x, z, color: '#ff7a00', quest: label }] for the next gate.
    - onCracked() {}, cracked: () => [], done: () => doneFlag.
    - cleanup(): remove and dispose meshes; remove the ride unless deps.player?.vehicle === ride (same as airDropRun).
- src/quests/objectivesCity.test.ts (new): tests for gateHit (ground gate in/out; air gate: right height passes,
  ground level under it fails, e.g. g = { at: [0, 0], radius: 5, height: 7.5 }, groundY 0: y 7.5 true, y 0 false) and
  clockLeft (no seconds -> null, not started -> null, 45 s started at 10, now 20 -> 35). The runner module imports
  vehicle code that touches `window` at load: start the test file with
  ```ts
  import { describe, expect, it, vi } from 'vitest';
  vi.hoisted(() => { (globalThis as { window?: unknown }).window = { addEventListener() {}, removeEventListener() {} }; });
  const { gateHit, clockLeft } = await import('./objectivesCity');
  ```

## Done when
- `npx vitest run src/quests/objectivesCity.test.ts` passes (from games/gnome-theft-auto).
- `npx tsc --noEmit -p games/gnome-theft-auto` (repo root) shows no error in objectivesCity.ts / its test (errors in
  files you do not own: report them, do not fix them).

## Out of scope
types.ts, quests.ts, cityQuests.ts (fixed contract), every other file.
~~~~

~~~~text
Epic: 1. Issue 1-4: The Kerbside Exchange stage, cast routines and stage marks for the city scenes
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH". Run from games/gnome-theft-auto:
  `npx vitest run src/quests/stages.test.ts` (builds the real world; ~10 s; lists every failing spot with a nearby
  clear position).
- Other workers edit other files in this worktree now. Edit ONLY the files under Change. Do not commit, stash, run
  vite build or start servers.

## Goal
A new stage spot 'kerb-exchange' (Dot Pennywort's job board by the Central Bus Stop) exists and passes the stage
checks; the new city cast have routines; existing stages get the marks and usedBy entries the city scenes need; the
test "every giver and every quest has a stage" passes.

## Read first
- src/quests/stages/kit.ts (Stage, ActorMark, CameraSpot, IdleWalk, VehicleMark, DrivePath, SetProp; mark, cam, car)
- src/quests/stages/turfton.ts: the 'bus-stop' stage (lines 1-47) and 'shelldon-alley', 'bodega-front' (style to copy)
- src/quests/stages.ts: CAST (CastMember list) and the STAGES line (line ~225)
- src/quests/stages.test.ts (what is checked)
- src/quests/cityQuests.ts (quest ids) and src/city/cityCast.ts (who lives where)

## Change
- src/quests/stages/turftonC.ts (new): `export const TURFTON_C_STAGES: readonly Stage[] = [ ... ]` with one stage:
  id 'kerb-exchange', name 'The Kerbside Exchange, Central Bus Stop', region 'turfton', center [-14, 45], radius 12,
  facing -Math.PI / 2, time 'day', built 'new', givers ['kerb-exchange'], usedBy ['city-kerbside-rounds',
  'city-impound-run', 'city-glow-band-express', 'city-penthouse-exclusive', 'city-skyway-robbery'], look/sounds lines
  (a cork notice-board covered in job slips, a folding desk with a ticket punch and a stool, a flower-pot, a bench,
  the bus stop up the road; sounds: a ticket punch, pinned paper flapping, snail-coach air brakes up the road).
  Marks (names exactly): 'dot' behind the desk around [-12, 45] facing the player; 'player' around [-8.5, 45] facing
  Dot (the giver marker is at [-9, 45]); 'client' around [-12, 48.5] facing between them (the job's client stands
  here in every intro); 'hedda' around [-15, 42] (she reads the board in the penthouse outro).
  Cameras (ids exactly): 'wide' (establishing, from the x = 0 road side, ~6 m up), 'two-shot' (over the player's
  shoulder onto Dot and the client), 'board' (close on the notice-board). Walks: dot (desk to board and back,
  pauseS 4). Vehicles: none needed (vehicles: []), paths: []. set: prefab 'notice-board' (behind Dot, solid),
  'office-desk' (in front of Dot, solid), 'chair' behind the desk, 'flower-pot', 'bench'. Check prefab ids exist with
  `grep -rn "id: 'notice-board'" packages/prefabs/src/catalog` (repo root); swap for 'cork-pinboard' / 'table' if not.
  The probe of this block: x -30..-4, z 42..48 is open ground; the bus-stop shelter boxes are at about x -8.7..-6.9,
  z 34..38; a lamp at x -7.3..-6.7, z 52.7..53.3. Run the stage test and move anything it reports.
- src/quests/stages.ts: import TURFTON_C_STAGES from './stages/turftonC' and add `...TURFTON_C_STAGES` to STAGES after
  TURFTON_B_STAGES. Append four CastMember entries to CAST (vehicle null for all):
  { id: 'dot', name: 'Dorrit "Dot" Pennywort', preset: 'dot', home: 'kerb-exchange', haunts: ['bus-stop'], routine:
  'Opens the Exchange with the first snail-coach, punches a ticket for every job, eats lunch on the bus-stop bench,
  closes when the board is empty, which it never is.' }; { id: 'hedda', name: 'Hedda Galley', preset: 'hedda', home:
  'kerb-exchange', haunts: ['city-hall-steps'], routine: ... }; { id: 'grout', name: 'Union Boss "Big Wrench" Grout',
  preset: 'grout', home: 'clay-mart-lot', haunts: [], routine: ... }. (nina already exists in CAST: leave her.)
  If CAST has an `id: 'mabel'` already, skip it; otherwise add { id: 'mabel', name: 'Mabel Kerbstone', home:
  'bus-stop', haunts: [], routine: 'Drives the one Turfton Taxi; every fare ends at the Central Bus Stop.', vehicle:
  null }.
- src/quests/stages/turfton.ts: in stage 'shelldon-alley' add `givers: ['strangers-shelldon'],` (its giver marker is
  at [-77, 70]); in 'bodega-front' add 'city-kerbside-rounds' to usedBy.
- src/quests/stages/turftonB.ts: add to usedBy: 'greenhouse-strip' += 'city-kerbside-rounds', 'city-glow-band-express';
  'amphitheater' += 'city-glow-band-express'; 'pay-n-glaze' += 'city-impound-run'; 'clay-mart-lot' += 'city-impound-run',
  'city-skyway-robbery'; 'city-hall-steps' is in turfton.ts: add 'city-kerbside-rounds' there.
  Add marks: 'amphitheater' gets mark('nina', ...) on the arena floor near the player mark and mark('toadstool', ...) x2
  on the dais (lift like reginald's 1.2); 'pay-n-glaze' gets mark('pip', ...) beside the bay; 'clay-mart-lot' gets
  mark('grout', ...) in the yard facing the player. Every new mark must pass the stage test.

## Done when
- `npx vitest run src/quests/stages.test.ts` passes (all stage spots, "every giver and every quest has a stage", cast
  references).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.

## Out of scope
cutscene files, cityQuests.ts, defs.ts, the level JSON, every other stage's existing marks/cameras (add only).
~~~~

~~~~text
Epic: 1. Issue 1-5: City cast presets, voices and mission comms
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH". Tests from games/gnome-theft-auto:
  `npx vitest run src/quests/comms.test.ts src/voice`.
- Other workers edit other files in this worktree now. Edit ONLY the files under Change. Do not commit, stash, run
  vite build or start servers.

## Goal
The new city speakers (dot, hedda, nina, grout, mabel) have a cutscene preset, a distinct voice and a comms name, the
five city contracts have talking-head comms, and existing side-quest comms name Turfton's districts.

## Read first
- src/cutscene/cast.ts (CAST presets: look, hz, held, scale)
- src/voice/voices.ts (VOICES; header rule: no two entries share (wave, style, rounded formant)) and its test in
  src/voice/
- src/quests/comms.ts (CALLER_NAMES, COMMS, brief/call helpers, the 16-word rule)
- src/quests/cityQuests.ts (the five quests and their objectives, index = step)
- src/city/cityCast.ts (each speaker's voice note and persona)

## Change
- src/cutscene/cast.ts: add presets (only if the key is missing): dot: { look: { hat: 0x2a4d7a, shirt: 0x7a2a2a,
  pants: 0x2b2b33, beard: null, glasses: true, hair: { color: 0xbdbdbd, style: 'pigtails' } }, hz: 128, held:
  'ticket-stub', scale: 1.4 }; hedda: { look: { hat: 0x1c1c1c, shirt: 0xe9e4d4, pants: 0x2b2b2b, beard: null,
  glasses: true, hair: { color: 0x2a1a12, style: 'pigtails' } }, hz: 124, scale: 1.42 }; nina: { look: { hat:
  0x7a3cff, shirt: 0x1c1c2a, beard: null, hair: { color: 0x39ff88, style: 'pigtails' } }, hz: 136, held: 'glow-stick',
  scale: 1.38 }; grout: { look: { hat: 0x3d4a5c, shirt: 0x5b6b3a, pants: 0x2f3a4a, beard: 0x4a3a2a }, hz: 74, held:
  'pipe-wrench', scale: 1.58 }; mabel: { look: { hat: 0xf2c200, shirt: 0x222222, beard: null, glasses: true, hair:
  { color: 0xc0c0c0, style: 'pigtails' } }, hz: 140, scale: 1.4 }. Check every `held` id exists:
  `grep -rn "id: 'ticket-stub'" packages/prefabs/src/catalog` (repo root); drop `held` where it does not (do not
  invent prefab ids). Check the hair style values allowed by GnomeLook (packages/gnome) before using 'pigtails'.
- src/voice/voices.ts: VOICES entries for dot (hz 128, crisp, quick, a conductor calling stops), hedda (hz 124,
  clipped, headline rhythm), nina (hz 136, fast and sly), grout (hz 74, slow growl, style 'words' is taken by others:
  check uniqueness), mabel exists already (keep it). Each `hz` equals its cast.ts hz. Keep the uniqueness rule in the
  file header; run the voices test.
- src/quests/commsCity.ts (new):
  ```ts
  import type { CommsCall } from './comms';
  export const CITY_CALLER_NAMES: Readonly<Record<string, string>> = { dot: 'Dot Pennywort', hedda: 'Hedda Galley',
    nina: 'Neon-Moth Nina', grout: 'Big Wrench Grout' };
  export const CITY_COMMS: Readonly<Record<string, Readonly<Record<number, CommsCall>>>> = { ... };
  ```
  (type-only import, so no import cycle; write your own `brief`/`call` helpers in this file like comms.ts's). One
  entry per city quest: step 0 a 'briefing' (2-3 lines: what, why, who), later steps a 'call' (1-2 lines) where the
  objective changes. Lines: at most 16 words (aim for 12), the speaker's own voice (cityCast.ts), ONE place name per
  call, name the district. Speakers: dot, hedda, nina, grout, pip, tansy, bodega, juniper, mabel ('mabel' is already
  in CALLER_NAMES? if not, add 'Mabel Kerbstone' to CITY_CALLER_NAMES). Cross-reference the cast: e.g. kerbside step 1
  bodega, step 2 nina, step 3 juniper; impound step 0 pip, step 1 tansy (mention the Lock-Up and the Sling-Lift);
  glow-band step 0 nina; penthouse step 0 hedda, step 1 dot; skyway step 0 grout, step 1 grout ("crack the crew"),
  step 2 tansy or pip (get the van home to the Union Hall in Clay-Mart Industrial). No words wet/soak/blood/gore.
- src/quests/comms.ts: spread the city tables in (two additive lines): inside CALLER_NAMES add
  `...CITY_CALLER_NAMES,` and at the end of the COMMS object add `...CITY_COMMS,`; import them from './commsCity'.
  Re-label existing side-quest comms to the district lore (R-147) where a line names a vague place: 'sq-hose-revolt'
  step 0 says "North Turfton first" -> "The Ring Blocks main first" (keep it <= 16 words); check sq-grid-truthers,
  sq-snail-rigging, sq-big-lou-embargo lines for "downtown"/"north Turfton" and name the district instead (Downtown,
  Old Brick Quarter, Park & Arts). Do not change story (chapter) comms.

## Done when
- `npx vitest run src/quests/comms.test.ts src/voice` passes (from games/gnome-theft-auto).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.

## Out of scope
cityQuests.ts, sideQuests.ts, stages, scenes, every other file.
~~~~

~~~~text
Epic: 1. Issue 1-6: Re-home the city side quests: district labels, journal place line, Exchange map blip
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH". Tests from games/gnome-theft-auto.
- Other workers (and another planner who also adds map places) edit files in this worktree now. Edit ONLY the files
  under Change, and only additively in mapIcons.ts / mapPois.ts. Do not commit, stash, run vite build or start servers.

## Goal
Existing city side quests name Turfton's districts (lore R-147), the Quest Journal shows where each job is, and the
map shows the Kerbside Exchange.

## Read first
- src/quests/sideQuests.ts
- src/city/places.ts (`placeName(x, z)`: "Old Brick Quarter", "Ring Blocks", "The Dust Flats"...)
- src/quests/journal.ts (how Active / Available / Locked items are rendered: the `j-item-sub` lines)
- src/mapIcons.ts (PlaceKind, PLACE_STYLE, drawPlaceIcon / the glyph switch) and src/mapIcons.test.ts
- src/mapPois.ts

## Change
- src/quests/sideQuests.ts (text and hint strings only; never ids, coordinates, kinds or order):
  - sq-grid-truthers: objective 0 text 'Inspect Survey Marker Alpha in Clay-Mart Industrial', hint 'Survey Marker
    Alpha (Clay-Mart Industrial)'; 1: 'Inspect Survey Marker Beta in Turfton Park & Arts', hint 'Survey Marker Beta
    (Park & Arts)'; 2: 'Inspect Survey Marker Gamma at the Patio Heights fence', hint 'Survey Marker Gamma (Patio
    Heights)'; 3: 'Uncover the buried Tall-One Pencil under the Center Datum, Downtown', hint 'Center Datum (Downtown)'.
  - sq-hoa-audit: target 'audit-turfton' hint 'Downtown (City Hall block)'.
  - sq-snail-rigging: objective 0 text 'Sneak into the Downtown slug paddock and swap the espresso slugs\' lettuce',
    hint 'Slug paddock (Downtown)'; objective 1 text 'Escape back to Shelldon\'s alley in the Old Brick Quarter',
    hint 'Shelldon\'s Alley (Old Brick Quarter)'.
  - sq-hose-revolt: objective 0 text 'Kink Pressurized Hose #1 in the Ring Blocks north of City Hall', hint 'Ring
    Blocks Hose Valve (north of City Hall)'; objective 1 text 'Kink Pressurized Hose #2 on the Greenhouse Strip'.
  - sq-big-lou-embargo: the three Red Cap target hints 'Park & Arts back alley'; objective 1 text 'Chauffeur the VIP
    Zero-Turn Racer from Park & Arts to The Gnomecino without a single smudge'.
  - sq-mulch-pyramid: objective 1 hint 'Side-Valve Salvage Bay (Old Brick Quarter)'.
  - Update the file's top comment: "Strangers & Freaks: the 11 side quests; the city ones are labelled by district
    (lore R-147). The Kerbside Exchange's own contracts are in cityQuests.ts."
- src/quests/journal.ts: wherever an item shows the giver's name ("From: <name>"), append ` · <placeName(g.x, g.z)>`
  when the giver is known (import { placeName } from '../city/places'). Keep the 44 px rows and existing layout.
- src/mapIcons.ts: add PlaceKind 'exchange' and PLACE_STYLE entry exchange: { name: 'Kerbside Exchange (jobs)',
  color: '#ffb347' } (the colour must be unique among PLACE_STYLE colours: check), and a glyph case in the icon
  switch: a small white ticket (a rounded rectangle with a notch) or the letter 'E', in the same style as the others.
  Add 'exchange' to RIM_PLACES (it is a service you go to).
- src/mapPois.ts: add `at('exchange', -9, 45, 'Kerbside Exchange'),` to placeBlips() (after the hospital line).

## Done when
- From games/gnome-theft-auto: `npx vitest run src/mapIcons.test.ts src/quests/quests.test.ts src/quests/sideQuests`
  (the last pattern may match nothing; that is fine) passes.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.

## Out of scope
comms.ts (issue 1-5), stages (1-4), cityQuests.ts, defs.ts, unlocks.ts.
~~~~

~~~~text
Epic: 1. Issue 1-7: The Kerbside Exchange phone app (the city's contract board)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH". Tests from games/gnome-theft-auto.
- Other workers edit other files in this worktree now. Create only the files under Change. Do not edit app.ts (the
  planner wires your module in). Do not commit, stash, run vite build or start servers.
- UI rule: append your own container to the `ui` element passed in; never restyle or hide #ui. Mobile: 44 px touch
  targets, fits 390x844 portrait and landscape, safe-area insets, no hover-only UI.

## Goal
A phone app "Kerbside Exchange" opens a board listing every non-story contract (city contracts first), with who
offers it, where (district or region), its reward and state; tapping an open one pins its giver as the map waypoint.
It also unlocks the achievement 'gta-kerbside-fixture' when all five city contracts are done.

## Read first
- src/phone/phone.ts (PhoneApp: id, label, icon, detail(), run(); Phone.addApp)
- src/quests/quests.ts: the Quests interface (getJournal() returns { activeId, activeStep, activeLines, saves, quests,
  givers, pinned }; pinGiver(id | null)); isQuestAvailable(q, saves)
- src/quests/unlocks.ts (unlockRule(id).after, unlockMet), src/quests/defs.ts (questById), src/perks.ts (perkForQuest)
- src/quests/journal.ts (overlay CSS pattern to copy: fixed overlay, card, 44 px buttons, open/close)
- src/city/places.ts (placeName), src/city/cityCast.ts (clientOf(questId))
- src/quests/cityQuests.ts (CITY_QUESTS, EXCHANGE_GIVER)

## Change
- src/city/exchangeApp.ts (new):
  ```ts
  export type ExchangeState = 'active' | 'open' | 'locked' | 'done';
  export interface ExchangeRow { questId: string; title: string; giverId: string; who: string; place: string;
    reward: number; state: ExchangeState; city: boolean; note: string }
  /** Pure. Every quest without a `chapter` (side quests, city contracts, Tessie, races). city = from CITY_QUESTS.
   *  who = clientOf(q.id)?.name ?? givers[q.giver]?.name ?? q.giver. place = placeName(giver.x, giver.z).
   *  reward = q.rewardAcorns ?? 250. state: activeId === q.id -> 'active'; saves[q.id]?.state === 'done' -> 'done';
   *  isQuestAvailable -> 'open'; else 'locked'. note: locked -> `After "<title of unlockRule(q.id).after or
   *  q.prereq>"`; open/active -> perkForQuest(q.id) ? `Perk: <name>` : ''; done -> 'Done'.
   *  Sort: active, then open (city first, then by place name), then locked (city first), then done. */
  export function exchangeRows(quests: readonly QuestDef[], givers: Record<string, GiverDef>,
    saves: Record<string, QuestSave>, activeId: string | null): ExchangeRow[];
  export const CITY_FIXTURE_ACHIEVEMENT = 'gta-kerbside-fixture';
  /** Pure: all CITY_QUESTS are 'done' in saves. */
  export function allCityDone(saves: Record<string, QuestSave>): boolean;
  export interface ExchangeDeps {
    ui: HTMLElement;
    phone: { addApp(app: PhoneApp): void };
    quests: Pick<Quests, 'getJournal' | 'pinGiver'>;
    hud: { toast(text: string, ms?: number): void };
    unlock(id: string): void;
  }
  export interface Exchange { isOpen(): boolean; open(): void; close(): void; update(dt: number): void }
  export function installKerbsideExchange(deps: ExchangeDeps): Exchange;
  ```
  installKerbsideExchange: injects its CSS once, appends `#gta-exchange` (hidden overlay) to deps.ui, adds the phone
  app { id: 'kerbside-exchange', label: 'Kerbside Exchange', icon: '📌', detail: () => `${n} open jobs`, run: open }.
  The board: title "Kerbside Exchange", subtitle "Dot Pennywort's board · Central Bus Stop", a close button (44 px),
  sections Active / Open / Locked / Done (Done collapsed to a count line), each row a 44 px+ button showing title,
  "who · place", reward and note. Tapping an Active or Open row calls deps.quests.pinGiver(row.giverId), toasts
  `Pinned: ${who} (${place}). Follow the route.` and closes. Locked/done rows are not buttons. Escape closes it.
  update(dt): every 2 s, if allCityDone(getJournal().saves) and not yet sent this session, deps.unlock(
  CITY_FIXTURE_ACHIEVEMENT) once.
  Note: pinGiver only routes to a giver while it has a quest waiting; the Active row's giver may have none, so for the
  active row just toast "That job is on: follow the orange marker." instead of pinning.
- src/city/exchangeApp.test.ts (new): exchangeRows with a tiny fake quest list and givers (two side quests, one with
  chapter 1 that must be excluded): states, sorting, locked note; allCityDone true/false. If importing quests.ts
  pulls in three.js/DOM code that fails in the test, add `installFakeDom()` from '../testing/fakeDom' and dynamic
  imports as src/quests/stages.test.ts does.

## Done when
- `npx vitest run src/city/exchangeApp.test.ts` passes (from games/gnome-theft-auto).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your files.

## Out of scope
app.ts, phone.ts, journal.ts, quests.ts and every other existing file.
~~~~

~~~~text
Epic: 1. Issue 1-8: Achievements for the city contracts (unique cosmetic rewards)
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash).
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
- Other workers and other planners edit files in this worktree now, possibly also the achievements catalog: make
  only additive edits in one block, re-read the file just before editing. Do not commit, stash, run vite build or
  start servers.

## Goal
Four Gnome Theft Auto achievements exist for the Turfton city contracts, each with a cosmetic reward prefab no other
achievement uses.

## Read first
- packages/achievements/README.md ("Adding achievements": slot, prefabId, unique reward rule, exclusive)
- packages/achievements/src/catalog.ts (the gnome-theft-auto entries, e.g. 'gta-snail-saboteur')
- packages/achievements/src/achievements.test.ts (what is checked: prefab exists, has the slot's wear use, unique)
- packages/prefabs/README.md and docs/roadmaps/prefab-library/_common.md (only if you must add a prefab)

## Change
- packages/achievements/src/catalog.ts: add, next to the other gta entries (game 'gnome-theft-auto', gameTitle
  'Gnome Theft Auto'):
  - 'gta-glow-runner' "Glow-Band Express": "Run Neon-Moth Nina's glow-bands across Turfton before the Velvet
    Toadstools go on." reward slot 'neck' or 'head': a glow-band / neon item.
  - 'gta-front-page' "Front Page": "Photograph Vesper's penthouse from a Sycamore Copter for the Turfton Tattler."
    reward: a press hat / camera (head or neck).
  - 'gta-skyway-robbery' "The Skyway Job": "Beat the HOA ledger van along the Turfton Skyway and bring Local 404's
    strike fund home." reward: a union / hard-hat / wrench item; exclusive: true.
  - 'gta-kerbside-fixture' "Kerbside Fixture": "Finish every job Dot Pennywort pins to the Kerbside Exchange."
    reward: a conductor's cap / ticket punch item.
  Find candidate prefabs: `grep -rn "wear-head\|wear-neck\|wear-back" packages/prefabs/src/catalog | grep -i
  "glow\|neon\|press\|camera\|hard-hat\|union\|wrench\|conductor\|ticket\|cap"` and make sure none is already a
  reward (`grep -n "<id>" packages/achievements/src/catalog.ts` returns nothing). If no unused prefab fits, add one
  PrefabDef per missing reward to packages/prefabs/src/catalog/gta-story-props.ts (or the right file per
  _common.md) with the matching `uses` tag, and run `npm test -w packages/prefabs`.

## Done when
- `npm test -w packages/achievements` passes.
- `npm test -w packages/prefabs` passes if you added a prefab.

## Out of scope
Any game code (the game unlocks these ids already: quests' `achievement` field and the Exchange app).
~~~~

## Epic 2 issues (scenes)

The five scene issues share this text block (pasted into each):

~~~~text
Epic: 2 (scenes). Issue 2-N: <QUEST TITLE> intro and payoff scenes
Depends on: Epic 1 (stage 'kerb-exchange', marks, cast presets: all landed)

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH". Tests from games/gnome-theft-auto.
- Four other workers write the other city scene files at the same time. Edit ONLY your scene file. Do not commit,
  stash, run vite build or start servers.

## Goal
Two real-world scripted scenes for one city contract: `<id>-intro` (staged at the Kerbside Exchange, stage
'kerb-exchange': Dot, the client, the player) and `<id>-outro` (the payoff at the client's place), passing the
pacing checker with no faults.

## Read first
- src/cutscene/scenes/side/snailRigging.ts (the model: imports, markOf/stageCut/above/castRide from ./kit, coverage,
  cut, beat, shot, exchangeLooks from ../../direct, step kinds 'say', 'cam', 'walk', 'gesture', 'sfx', 'music',
  'wait'). Copy its structure.
- src/cutscene/scenes/side/kit.ts (helpers; import them as '../side/kit')
- src/quests/stages/turftonC.ts ('kerb-exchange' marks: dot, player, client, hedda; cameras wide, two-shot, board)
  and your outro stage in src/quests/stages/turfton.ts or turftonB.ts (its marks and cameras)
- src/quests/cityQuests.ts (your quest: objectives, doneText), src/city/cityCast.ts (voices), src/quests/commsCity.ts
  (do not repeat a comms line word for word in a scene)
- docs/design/gnome-theft-auto/direction/bible.md (skim the rules)

## Pacing rules (src/cutscene/pacing.ts PACING; faults fail the test)
- Lines at most 16 words (aim 12). At most 3 lines in one shot before a cut; at most 3 lines in a row by one speaker.
- Something happens (a line, a move, a sound) within 3 s of the start, and never 3 s of dead air.
- Shots: not shorter than 0.8 s; close shots hold at most 7 s, medium 9 s, wide 6 s, moving 12 s.
- Cut to the speaker (cut(TALK.single(who, 'mcu'))) before their line; never film the back of a hat; a talking gnome
  fills at least a quarter of the frame. At most 1 narrator line.
- Length: intro 30-60 s (fault above 75), outro 15-45 s (fault above 60).
- No words wet / soak / blood / gore.

## Change
- src/cutscene/scenes/city/<file>.ts: replace the stub with `export const <NAME>_SCENES: SceneScript[] = [INTRO,
  OUTRO]` where both have `stage: { kind: 'world' }`, `world: 'live'`, a `title` (the quest title, intro only), `sky`,
  `music`, `ambience`, actors with `preset` for cast keys (dot, hedda, nina, grout, pip, tansy, bodega, juniper...),
  `{ id: 'you', player: true, ... }` for the player. Put actors on the stage marks via markOf(stage, who). Keep the
  existing export name.

## Done when (from games/gnome-theft-auto)
- `CUTSCENE_REPORT=1 npx vitest run src/cutscene/pacing.test.ts -t "<your intro id>|<your outro id>"` passes, and the
  report shows no fault for your two ids.
- `npx vitest run src/cutscene/scenes/scenes.test.ts` passes for your scenes (line of sight / collisions). If it fails
  only on scenes that are not yours, say so.
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in your file.
- If after real effort a scene cannot pass, leave it out of the exported array, and say which in your report.

## Out of scope
Every file except your scene file.
~~~~

Per-scene specifics (the "Story" section pasted under each):

- 2-1 kerbsideRounds.ts, KERBSIDE_ROUNDS_SCENES, city-kerbside-rounds. Intro (day): Dot behind the desk punches a
  ticket at the player ("kerb-sitting" newcomer), explains the board: every job in Turfton comes past her; first job:
  carry the Tattler round three districts (Bodega in the Old Brick Quarter, Nina on the Greenhouse Strip, City Hall).
  The client mark is empty (no client). Button: "Fares, please." / the punch. Outro (golden, kerb-exchange): Dot
  punches the ticket's last hole, pins the player's name on the board; Mabel's taxi horn off-screen (sfx); Dot: every
  open job in town is on the board now, on your phone.
- 2-2 impoundRun.ts, IMPOUND_RUN_SCENES, city-impound-run. Intro at kerb-exchange: Pip (client mark) bursts in out of
  breath: the HOA towed his red Zero-Turn into the impound behind Clay-Mart; Dot drily lists the impound clerks' names
  (Tare and Gross). Outro at stage 'pay-n-glaze' (marks pip, player, glaze-tech): the Zero-Turn rolls out of the bay
  re-sprayed; Pip hugs it; tells the player to keep it in Tansy's Lock-Up and call the Sling-Lift from the phone.
  Vehicle: castRide('pip', 'zt') placed at the pay-n-glaze bay.
- 2-3 glowBand.ts, GLOW_BAND_SCENES, city-glow-band-express. Intro at kerb-exchange (night): Nina (client) with a tray
  of glow-bands; the Velvet Toadstools' reunion gig at the Amphitheater; four stops, ninety seconds, the moth (Barnaby
  Jr.) keeps interrupting. Outro at stage 'amphitheater' (night; marks nina, toadstool x2, player): the band on the
  dais, every hat in the tiers glowing, Nina counting the take; button: the band starts "Don't Mow My Baby Down" again.
- 2-4 penthouse.ts, PENTHOUSE_SCENES, city-penthouse-exclusive. Intro at kerb-exchange (dusk): Hedda (client) talks in
  headlines: Vesper's penthouse, nobody has a photo, the Tattler's Sycamore Copter is parked in the garden behind the
  Exchange (prop or castless vehicle { id: 'copter', kind: 'sycamore-copter', at: [-22, 45], yaw: Math.PI }), Dot
  warns about the Watch. Outro at kerb-exchange (night; marks hedda, dot, player): Hedda holds up the front page
  (held prop if one exists, else none), reads the headline "VESPER'S PENTHOUSE HAS NO GRASS"; Dot pins it to the
  board.
- 2-5 skywayJob.ts, SKYWAY_JOB_SCENES, city-skyway-robbery. Intro at kerb-exchange (day): Grout (client) explains the
  HOA seized Local 404's strike-fund ledger after the strike, moves it by the ground road to Fort Sandpit "because the
  HOA won't drive a union road"; take the Skyway, beat the van to the east off-ramp; Dot: the Zero-Turn at the kerb.
  Outro at stage 'clay-mart-lot' (golden; marks grout, burt, player): the HOA van at the Union Hall, Grout takes the
  ledger, does not open it in front of anyone; says the Skyway is paid for; Burt (existing cast) raises his coffee.
  Never reveal what is in the ledger (R-152).

## Added scope: the Newcomers' Card (tutorial side quests for the new activities)

User request (relayed): short tutorial-style side quests, one per new activity, 2-4 steps, friendly, each ending in a
small perk, unlocking in a sensible order, framed as one thread run by the recurring city cast, with comms.

Decisions:
- **Thread:** "the Newcomers' Card", handed out by **Mabel Kerbstone** at the Central Bus Stop between fares (giver
  `newcomers-club` at (-13, 28), letter N). Each stamp sends the player to the hobby's own host (Dot, Nina, Pip, Tansy,
  Juniper, Wenna Gudgeon, Big Wrench Grout, Wind-Sock Wally, Hedda, Hazel Mattock, Dunnock Pell, Mabel herself for
  Kerbstone Cabs and Pebblewick). Mabel also dispatches Kerbstone Cabs in the sim-jobs workstream (jobs/defs.ts): we own
  the cast, they consume it. Intro = a talking-head dialogue (cheap; dialogue cutscenes are not pacing-checked);
  comms = the host's tip per step (`src/quests/commsNewcomers.ts`).
- **Checks:** new objective kind `probe` (`src/quests/objectivesCity.ts probeRun`) watching `src/city/probes.ts`:
  each activity's own save/store API (hunting, birding, fishing stores; the mowing save; `jobStats()` of the sim jobs),
  economy spend/earn counts by reason (`spend:Sling-Lift`, `spend:Pebblewick Hopper`...), and live getters/counters
  app.ts provides through `src/city/install.ts` (weapon wheel, Pocket Kit, Lock-Up, banner plane distance, party,
  boat, golf cart, emotes, pair emotes, street events). No activity file was edited.
- **Quests** (`src/quests/newcomerQuests.ts`, 15): nc-good-neighbour (street events), nc-strike-a-pose (emotes + pair
  emote), nc-wheel-and-kit (weapon wheel, Pocket Kit, Ammu-Gnation), nc-lockup (store, Sling-Lift), nc-party (online,
  optional, not on the card), nc-mind-the-verges (mowing plants, golf cart), nc-bent-pin (fishing), nc-skyway (deck +
  the Unfinished Span jump), nc-odd-jobs (sim jobs), nc-take-off (aircraft + Wingwright's Slipway), nc-sky-spotting
  (banner plane), nc-tuft-and-tally (hunting), nc-last-stop-pebblewick (Pebblewick + Hopper), nc-reedwatch (birding),
  nc-hangar-and-boathouse (Hangar Two, Mossbank Boathouse, a boat). Unlock beats in unlocks.ts (at most 2 per story
  beat, counted separately from contracts). Perks: one each (perks.ts; new EARN_PERKS table for earnings by reason).
  Achievement `gta-newcomer-card` for every stamp but the party one.
- **Not covered**: the Save Trainer (as asked). Street-event and emote counters start at 0 each session (a resumed
  step re-baselines; saves stay compatible).

~~~~text
Epic: N (Newcomers). Issue N-1: Lore for the Newcomers' Card
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Use absolute paths.
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
- Other workers and planners edit files in this worktree now. Edit ONLY the files under Change. Do not commit, stash,
  switch branches, run vite build or start servers.
- Lore rules: docs/lore/README.md (schema) and canon.md (plain, short, concrete). Search first: `npm run lore -- find
  <word>` from the repo root.

## Goal
The Newcomers' Card exists in the lore: a ruling, an entry, and links from Mabel and the gazetteer.

## Read first
- games/gnome-theft-auto/src/quests/newcomerQuests.ts (the 15 stamps, hosts, perks in doneText)
- docs/lore/entries/apocrypha/mabel-kerbstone.md, turfton-gazetteer.md, kerbside-exchange.md, pebblewick.md
- the end of docs/lore/rulings.md (format)

## Change
- docs/lore/rulings.md: append ONE ruling with the next free number (check the highest `## R-` right before you
  write; it was R-155 when this issue was written). Question: "New players meet a dozen hobbies and systems (hunting,
  birding, fishing, the Lock-Up, aircraft, the Skyway, sim jobs, Pebblewick...). Who shows them round?" Ruling: Mabel
  Kerbstone keeps a Newcomers' Card at the Central Bus Stop: a punch-card of stamps, one per hobby club or trade, each
  stamped by its host (list the hosts and hobbies from newcomerQuests.ts); she does it between fares because every
  newcomer steps off at her stop; a full card is a Turfton welcome (achievement gta-newcomer-card). Mabel also
  dispatches Kerbstone Cabs (the sim-jobs taxi job). Applies to: apocrypha, gnome-theft-auto. Why: the user asked for
  tutorial jobs that feel part of the city, not a list.
- docs/lore/entries/apocrypha/newcomers-card.md (new; kind object; tier apocrypha; setting apocrypha; era now; status
  draft; games [gnome-theft-auto]; aliases [The Newcomers' Card, Mabel's Card]; sources [docs/lore/rulings.md,
  games/gnome-theft-auto/src/quests/newcomerQuests.ts]; related [mabel-kerbstone, turfton-bus-stop, kerbside-exchange,
  turfton-gazetteer, hazel-mattock, wind-sock-wally, pebblewick] plus the ids of the other hosts if entries exist:
  find Dunnock Pell and Wenna Gudgeon with `npm run lore -- find`). Body: summary; "## What gnomes say" (2 lines);
  "## In the games" (one bullet per stamp: title, host, what it teaches); "## Loose threads" (what the last, unprinted
  stamp on the card is for).
- docs/lore/entries/apocrypha/mabel-kerbstone.md: append an "In the games" bullet (the Newcomers' Card, giver
  'newcomers-club'; Kerbstone Cabs dispatcher) and add newcomers-card to related. Keep everything else.
- docs/lore/entries/apocrypha/turfton-gazetteer.md: add newcomers-card under a fitting group, and Pebblewick under
  "Beyond the grid" as a real link now that pebblewick.md exists (replace any "(planned)" text).
- Run `npm run lore` (rewrites INDEX.md).

## Done when
- `npm run lore -- check` reports no error in your files (errors in other planners' files: list them, do not fix).
- `npm run lore -- find "Newcomers"` lists newcomers-card.

## Out of scope
Every game file, every other lore entry.
~~~~

~~~~text
Epic: N (Newcomers). Issue N-2: The Newcomers' Card achievement and its reward
Depends on: none

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash).
- If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
- Other workers and planners edit the achievements catalog and prefab catalogs now: re-read before editing, additive
  edits in one block only. Do not commit, stash, switch branches, run vite build or start servers.

## Goal
Achievement 'gta-newcomer-card' exists with its own unique cosmetic reward.

## Read first
- packages/achievements/README.md ("Adding achievements"), packages/achievements/src/catalog.ts (the gta entries,
  e.g. 'gta-kerbside-fixture' and its reward 'conductor-ticket-cap')
- packages/prefabs/src/catalog/gta-story.ts (where 'conductor-ticket-cap' and 'local-404-strike-scarf' were added:
  copy their structure)

## Change
- packages/prefabs/src/catalog/gta-story.ts: add one PrefabDef 'newcomers-card-lanyard' (name "Newcomers' Card
  Lanyard", uses ['wear-neck'], a cord with a punched card hanging from it, same style as 'local-404-strike-scarf').
- packages/achievements/src/catalog.ts: add next to 'gta-kerbside-fixture': { id: 'gta-newcomer-card', game:
  'gnome-theft-auto', gameTitle: 'Gnome Theft Auto', title: "Newcomers' Card", description: "Get every stamp on Mabel
  Kerbstone's Newcomers' Card.", reward: { slot: 'neck', prefabId: 'newcomers-card-lanyard', label: "Newcomers' Card
  Lanyard" } }.

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/achievements` passes, or fails only on a duplicate reward that is not yours (name it).

## Out of scope
Any game code.
~~~~
