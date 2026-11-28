Epic: E13-A (Rootwell, parallel wave)
Depends on: none
Agent: general-purpose (Sonnet): lore writing

Read `docs/roadmaps/gta-batch-3/E13/issues/_env.md` first (environment, rules).

## Goal
The lore knowledge base records what E13 builds: four new rulings (R-199..R-202), a new entry for Dean's Leap, and the
"In the games" sections of the existing Rootwell and Pinwheel Ridge entries brought up to date. `npm run lore` passes.

## What E13 builds (facts to record; coordinates are world metres, +x east, +z south)
- **Rootwell University** (site `campus`, x 980..1300, z -350..-50): the twelve buildings stand round a quad lawn
  (x 1080..1210, z -265..-140) with the founder's statue (a bronze gnome holding out a plumb bob) at its centre (1145,
  -202): north side the Long Shelf (library, (1110, -290)) and Plumbob Hall ((1180, -292), flat roof with a helipad,
  clock tower with a plumb bob under its arch); south side Tilth Hall (lecture hall, (1110, -112), walkable roof reached
  by stairs from inside) and the Crucible Block (labs, (1180, -110)); east the Trencher (refectory, (1245, -215), the
  sugar store behind it at (1265, -224)), the Cold Frame Club ((1250, -160)) and the Cloche (glasshouse, (1285, -215));
  further out Bedstraw House (dorm, (1030, -315)), Bodger's Shed ((1262, -318)), the Heap Barn ((1265, -85)), Wicket
  Lodge (the gate lodge on the drive, (1000, -214)), the Clod (a small pitch between two grandstands, (1040, -95)) and
  the Dean's lodge ((1055, -245), facing the quad; Dean Lovage Inkwell lives here). The drive runs in from the east-band
  road at x ~945 along z -200 to the quad, with a car park south of it. The Long Shelf, the Crucible Block and Tilth
  Hall can be entered (interiors `uni-library`, `uni-lab`, `uni-lecture`). Students walk the quad; the university bell
  rings. All buildings are built at gnome scale from stone, clay brick and slate.
- **The Anthill** (site `observatory-mound`, a 45 m mound centred (1240, 150)): earth-coloured flanks, a gravel forecourt
  on the flattened summit (radius 30), the Anthill Observatory (a white dome with a slit, 18 m across, door facing west,
  enterable: interior `anthill-observatory` with the great brass telescope; Professor Betony Sextant's desk) at (1258,
  158), a dirt road (`trail/anthill-road`) spiralling up from the east-band road, three round wooden ant doors at the foot
  (north (1172, 82), east (1338, 170), south (1236, 256)), single ants carrying sugar cubes in lines, and **Dean's Leap**,
  a wedge ramp on the north rim of the summit (stunt ramp `deans-leap`, 8 m wide, ~4.5 m high) that throws a car north
  toward the campus over the mound's north slope. Achievement "Not Termites" for landing it.
- **Rootwell Field** (site `runway-2`): a 420 m north-south runway at x 1300 (centre (1300, 600)), an apron west of it
  with two Crop Dusters, a Hedge-Hopper and a Sycamore Copter, a pad, a hangar, the "very small tower" (a brick stalk
  with a glazed cab) and an orange-and-white windsock, runway edge lights lit at night. The aeronautics department's
  Hedge-Hopper flies circuits from it (NPC sky traffic, "Rootwell Aeronautics Circuit"); Wally's Charters sometimes fly a
  visiting professor there. Achievement "Touch and Go" for landing on it.
- **Pinwheel Ridge** (site `wind-farm`): ten giant garden pinwheels (ids `pinwheel-1` to `pinwheel-10`, red, yellow and
  blue in turn, each on a 24 m white-and-red mast with a ladder, vanes 9 m long) 30 m apart along the crest from x 715 to
  985 at z ~-1202, all facing south, always turning; Ragwort Coilspring's control hut (860, -1234) and a substation
  (905, -1236) on the north flank below the crest; a gravel service track up from the north-band-east road. Achievement "Windfall" for
  flying along the ridge between them.
- Side quests (built by another worker, unlocked after the chapter-4 quest `ch4-spade-truce` until the act-III story
  quests exist): `sq-rootwell-lost-essay` "The Lost Essay" (Dean Inkwell is sure the player is a student and wants
  the essay on level lines that blew away; its pages are found in the Long Shelf, the Cloche and on the Clod's pitch)
  and `sq-anthill-rent` "Rent for the Landlords" (Professor Sextant: the university is late with the ants' sugar; take
  sugar from the store behind the Trencher to the ants' north door).

## Read first
- `docs/lore/README.md` (or the top of `docs/lore/canon.md`): entry format and rules; `tools/lore.mjs` checks (run
  `npm run lore` to see them).
- `docs/lore/rulings.md`: the last rulings (R-184..R-188) for the exact format (`## R-nnn`, Question, Ruling, Applies to,
  Date, Why).
- `docs/lore/entries/apocrypha/rootwell-university.md`, `the-anthill.md`, `anthill-observatory.md`, `rootwell-field.md`,
  `pinwheel-ridge.md` (and skim `ragwort-coilspring.md`, `betony-sextant.md`, `lovage-inkwell.md`).
- Run `npm run lore -- find deans` and `npm run lore -- find sugar` first so you do not duplicate an entry.

## Change
- `docs/lore/rulings.md`: append **R-199** (Rootwell University's layout: the twelve buildings and the Dean's lodge as
  above, which can be entered, the founder's statue), **R-200** (the Anthill as built: earth flanks, the summit forecourt,
  the three ant doors, the ants only ever seen singly carrying sugar and never speaking, Dean's Leap on the north rim),
  **R-201** (Rootwell Field as built: the runway, the apron's four aircraft against "one working plane and four
  students" (decide: the department owns one airworthy plane on paper; the rest are "on loan from Wally", or similar;
  keep the satire light), the circuit and charters), **R-202** (Pinwheel Ridge as built: ten pinwheels, their colours and
  numbering, Ragwort's hut, the substation). Date 2026-11-25. Applies to: apocrypha, gnome-theft-auto.
- New entry `docs/lore/entries/apocrypha/deans-leap.md` (kind place or thing, as the format allows; tier apocrypha,
  status draft, games [gnome-theft-auto], related [the-anthill, anthill-observatory, lovage-inkwell], sources incl.
  `docs/lore/rulings.md#r-190` and `games/gnome-theft-auto/src/stunts.ts`): what it is, what gnomes say (2 dry lines),
  the truth ("a ramp cut for a stunt nobody remembers"; the Dean claims it was a wheelchair ramp for a very ambitious
  professor), in the games.
- Update the "In the games" section (and `sources`/`related` where needed) of rootwell-university, the-anthill,
  anthill-observatory, rootwell-field and pinwheel-ridge with the built facts above (replace "planned (batch 3)" with
  what is now in the game; keep the story-row notes).
- `docs/lore/settings.md`: only if Rootwell has no row yet, add one in the existing format.

## Contract
Ruling numbers R-199..R-202 (if `rulings.md` already has any of them when you start, take the next free numbers and say
so in your report).

## Done when
- `npm run lore` passes (from the repo root).
- `npm run lore -- find deans` finds the new entry.

## Out of scope
Everything outside `docs/lore/`.
