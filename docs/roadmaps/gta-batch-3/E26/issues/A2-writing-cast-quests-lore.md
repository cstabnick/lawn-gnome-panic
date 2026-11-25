Epic: A (foundations) — E26 street racing
Depends on: none
Agent: Sonnet (writing)

(Paste `_env.md` here.)

## Goal
The people, words and lore of Turfton's street racing: three meets' cast (`streetRace/cast.ts`), a five-quest
street-racing side questline with one rival (`quests/streetRaces.ts`), and lore entries plus rulings that record it.

## Read first
- `docs/lore/canon.md`, `docs/lore/rulings.md` (last ruling is R-214; yours start at R-215), and these entries in
  `docs/lore/entries/apocrypha/`: `the-carburettors.md`, `lugnut-lulu.md`, `the-rutbottom-regulars.md`,
  `clary-mudguard.md`, `fizz-cup.md`, `turfton-street-life.md`, `dandelion-fizz.md`, `neon-moth-nina.md`,
  `fence-line-overlook.md`. Search more with `npm run lore -- find <word>` (repo root). `docs/lore/README.md` (if any)
  or any entry for the front-matter format.
- `docs/roadmaps/gta-batch-3/E04/spine.md` rows #5 (m05: Cam runs a part to the Carburettors' night meet on the Skyway;
  Lugnut Lulu wins a race there; night), #30, #40, #42, and the cast table: do not contradict them.
- `games/gnome-theft-auto/src/quests/dirtRaces.ts`: the exact QuestDef / RaceRival / dialogue style to copy.
- `games/gnome-theft-auto/src/quests/types.ts`: the `race` objective (fields `raceId, trackId, vehicle, laps, rivals,
  mustPlace, hint, tint, timeAchievement, night, closedRoad`), `QuestDef` (`hoa`), `RaceRival`.
- `games/gnome-theft-auto/src/streetRace/types.ts`: `MeetCast`, `MeetPerson`, `MeetVignette` (your cast.ts shape).

## The setting (decided; write within it)
- Three meets: **the Skyway Foot** (the Carburettors' night meet at the west foot of the Turfton Skyway, Turfton; lively
  after dark), **Pardonlin** (a sanctioned closed-road event in the European town, marshals and cones, very proper),
  **Saltbucket** (a roadside lay-by meet on the band road out to the coast: sand, gulls, a snack van).
- Routes (fixed ids and names): `kerb-row-circuit` Kerb Row Circuit (downtown), `skyway-sprint` The Skyway Sprint,
  `ring-road-run` The Ring Road Run (lore: the Carburettors' illicit Ring Road time trials), `pardonlin-boucle`
  La Boucle de Pardonlin, `saltbucket-dash` The Saltbucket Dash.
- Each meet has an organiser (quest giver id `street-skyway-foot`, `street-pardonlin`, `street-saltbucket`), a bookie
  (takes wagers in Acorns for repeatable pickup races), a flag-dropper, two residents doing something specific to the
  place, a crowd. Invent new characters (check names with `npm run lore -- find`); Lugnut Lulu and Two-Ton Teasel may
  cameo (Lulu may be at the Skyway Foot; she is the Carburettors' captain), but the organisers are new.
- One rival for the questline (new character, a street racer with a grudge or a charter, whose arc ends at the Ring
  Road). The rival drives in quests 2 and 5 at least.

## Change
- `games/gnome-theft-auto/src/streetRace/cast.ts`: replace the stub; export `MEET_CAST: Readonly<Record<MeetId,
  MeetCast>>` with, per meet: organiser (id = `street-<meet id>`), bookie (id `street-<meet id>-bookie`, 3+ take/win/lose
  lines each), flagger (id `street-<meet id>-flagger`), 2 residents (`does` says what they do, e.g. "polishing a hubcap
  that is not attached to anything"), roster of 3 RaceRivals (pace 0.9..1.02, grip 0.9..1.1, line -2..2, aggression
  0.2..0.7, 2 taunts each), `pickupVehicle` (a VehicleKind: 'lowrider', 'zero-turn', 'ride-on', 'euro-hatch', 'wespa',
  'deux-pots'... check `src/types.ts` VehicleKind), 4 signs (joke text fitting the place; `sub` optional), 3 vignettes
  (story + 3..6 props each: prefab ids that EXIST in `packages/prefabs/src/catalog/*.ts` — grep each id — with dx/dz
  offsets within 4 m), 4+ crowdLooks. Looks: `Partial<GnomeLook>` like dirtRaces.ts (hat, shirt, pants, beard, ...).
  `idle` values must be AnimIds from `src/anim/types.ts` (e.g. 'cross-arms', 'look-around', 'idle-jaunty'; check).
- `games/gnome-theft-auto/src/quests/streetRaces.ts` (new): `export const STREET_QUEST_IDS = ['sr-kerb-row',
  'sr-skyway-midnight', 'sr-boucle', 'sr-saltbucket-dash', 'sr-ring-road'] as const;` and
  `export const STREET_QUESTS: readonly QuestDef[]` in that order, a chain by `prereq` (each needs the one before):
  1. `sr-kerb-row` (giver street-skyway-foot): kerb-row-circuit, 2 laps, podium (mustPlace 3), through live traffic,
     achievement `gta-street-first`, `hoa: { cap: 1 }`.
  2. `sr-skyway-midnight` (street-skyway-foot): skyway-sprint, laps 1, `night: true`, win (mustPlace 1) against the
     rival, achievement `gta-street-night`, `hoa: { cap: 1 }`.
  3. `sr-boucle` (street-pardonlin): pardonlin-boucle, 2 laps, `closedRoad: true`, podium, `hoa: 'off'`, vehicle a
     euro ride ('euro-hatch' or 'deux-pots').
  4. `sr-saltbucket-dash` (street-saltbucket): saltbucket-dash, laps 1, win, through traffic, `hoa: { cap: 1 }`.
  5. `sr-ring-road` (street-skyway-foot): ring-road-run, 2 laps, win against the rival (the finale),
     achievement `gta-street-champion`, `hoa: { cap: 1 }`, rewardAcorns highest.
  Each: title, rewardAcorns (300..900), a dialogue cutscene (`kind: 'dialogue', room: 'street'`, 3..5 lines, speakers
  with looks), objective `kind: 'race'` with `raceId` = quest id minus 'sr-', 3 rivals, `hint` (where the grid is,
  e.g. 'Skyway Foot grid, west Turfton'), `tint`, and a `doneText` with a joke. Import rival defs from cast.ts where
  they are meet regulars; define the rival here or in cast.ts (export it as `STREET_RIVAL`).
- `games/gnome-theft-auto/src/quests/streetRaces.test.ts` (new): ids match STREET_QUEST_IDS; every race objective's
  trackId is in STREET_TRACK_IDS (from `src/raceTrack/tracks.ts`); prereq chain; givers are the three ids above; every
  vignette prop id in MEET_CAST resolves with `getPrefab(id)` from `@lawn/prefabs` (not undefined).
- Lore (docs/lore/entries/apocrypha/, front matter like the others, `games: [gnome-theft-auto]`): one entry per meet
  (3), one per organiser and bookie (6, or fold bookies into the meet entries if you prefer), the rival (1), and the
  street-racing questline/concept ("Turfton street racing": the routes, wagers, how the Watch and the HOA see it) (1).
  Update `the-carburettors.md` "In the games" only if needed (one line pointing at the Skyway Foot).
- `docs/lore/rulings.md`: append R-215.. rulings (format like R-214: Question / Ruling / Applies to / Date
  2026-11-25 / Why) for anything decided: street racing's legal status (Watch notices but rarely chases; Pardonlin's is
  licensed), bookies and wagers in Acorns, the Skyway Foot as the night meet (E20's m05 stages there).

## Contract
`MEET_CAST` keys 'skyway-foot' | 'pardonlin' | 'saltbucket' (MeetId). `STREET_QUESTS`, `STREET_QUEST_IDS` as above.
Giver ids `street-skyway-foot`, `street-pardonlin`, `street-saltbucket`. Achievement ids as above (another worker adds
them to the catalog). Do not register the quests anywhere (another issue does).

## Done when
- `npx vitest run src/quests/streetRaces.test.ts` passes and `npx tsc --noEmit -p .` passes (games/gnome-theft-auto).
- `npm run lore` passes (repo root).
- Report: the cast names per meet, the rival, the five quest titles, the rulings added.

## Out of scope
`quests/defs.ts`, `quests/unlocks.ts`, stages, level json, `streetRace/meets.ts`, `streetRace/types.ts`.
