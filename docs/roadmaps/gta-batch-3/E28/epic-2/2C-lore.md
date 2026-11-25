Epic: E28-2 Fill (GTA batch 3, world expansion II)
Depends on: none

(Read `docs/roadmaps/gta-batch-3/E28/epic-2/_env.md` first: environment, coordinates and the new places.)

## Goal
The lore knowledge base knows the second expansion: rulings that settle Pardonlin, the Thymes, the Wickets, the Unmown,
roundabouts and the traffic-hat gnomes; one entry per new place; the settings row updated; `npm run lore` passes.

## Read first
- `docs/lore/canon.md` (house style: names, renamed objects, dry jokes, no pop culture, no humans on screen, leave
  threads loose) and `docs/lore/rulings.md` (format at the top; the latest rulings are R-158..R-169 at the end).
- `docs/lore/entries/apocrypha/trellisdown.md` and `docs/lore/entries/apocrypha/hedgeworth.md` (if present; else
  `capwood.md`): the entry format (front matter keys `id, name, kind, tier, setting, era, status, games, aliases,
  sources, related`; sections What gnomes say / The truth / In the games / Look and motifs / Loose threads).
- `docs/lore/settings.md`: the `apocrypha` row's long `games/gnome-theft-auto` bullet.
- Run `npm run lore -- find hedgeworth`, `npm run lore -- find fence` and `npm run lore -- find hoa` from the repo root
  to see what already exists before writing (do not contradict R-161 Hedgeworth or the HOA entries).

## Decided facts to write up (do not change them; add colour, jokes and loose threads)
- **Pardonlin**: another Tall One's garden west of Trellisdown, laid out as a continental formal garden: gravel walks,
  box-hedge parterres, clipped limes, terracotta pots, a long ornamental rill. The gnomes who live there are **the
  Continentals**: polite to a fault ("pardon" is the town's name and its first word), long lunches, strong opinions on
  bread, queue for everything, cycle everywhere, a dozen ways to say "it is not done". A satirical Paris/London/Berlin
  mash (stereotypes gently, never nationalities by name, no real cities, no pop culture). Districts: the old town on the
  east bank, the Left Bank on the west, **the Jardin** (the formal garden north of town), the Little Gardens
  (allotments) and **Pardonlin Basin** with **Basin Quay** to the south.
- **The Thymes**: the Tall One's garden rill, a slow green river running north to south through Pardonlin into the
  Basin; rises at a garden tap at the north end of the Jardin (the Source). Bridges: Pont Nord, Pont Neuf, Pont Sud,
  the Basin Bridge.
- **The Wickets**: the old perimeter fence still stands between Trellisdown and Pardonlin; where the three roads pass,
  the Continentals took out fence panels and hung proper gates, each with a customs hut that stamps a visitor's hat.
  **The Grand Wicket** (on Vineyard Lane, z -30), the North Wicket (z -500) and the Harbour Wicket (z 1000).
  Turfton gnomes used to think the perimeter fence was the end of the world; the Continentals think the same of theirs.
  What is beyond Pardonlin's own west fence stays a loose thread.
- **Places reserved for later** (name them in the Pardonlin entry, content comes later): **the Bean Tower** (a giant
  Tall-One bean-pole wigwam, the town's landmark), **the Grand Platz** (main square), **Teacup Row** (cafe street),
  **Radio Adagio** (the classical-music radio station), **the Beetle Market**, **the Hatwheel** (the great roundabout,
  six roads) and **Place du Pot** (the small one).
- **The Unmown**: the north-west corner the Tall One stopped mowing years ago, now a nature preserve kept by rangers:
  waist-high meadow (**the Long Meadow**), reed beds (**Reedmere**), old trees (**Oldroot Wood**), three bird hides and
  **the Unmown Ranger Station**. Gnomes find it frightening and wonderful at once (a place no mower goes). The HOA hates
  it (it is the opposite of the Even Cut). Why the Tall One stopped mowing stays a loose thread. A rusting mower the
  grass swallowed sits at the entrance.
- **Roundabouts**: the Continentals brought them; Turfton built two on its ring road (**Trellis Cross** and **the
  Anthill Ring**). Traffic goes round anticlockwise; gnomes who have never used one go round three times.
- **Traffic-hat gnomes**: HOA wardens in tall striped hats who stand on a podium in the middle of a busy crossing and
  wave one road through while holding the other with a stop/go paddle. Named wardens: Sedge Pennyroyal (Turfton,
  hospital crossing), Burnet Gatepost (by the Mulch Club), Agrimony Kerb (south crossing) and Lupin Pardoux (Pardonlin
  High Street, on loan from the Continentals, who think the HOA's hats are too short). Hat Watch is a different HOA
  thing: the wardens never chase anyone.
- Pushed-out places (one sentence each in the existing entries' "In the games" sections is enough): Snowcap Rise now
  reaches the north edge (the High Tarn), Rootwell the east edge (Rootwell Field Station), the Saltwater the south edge.

## Change
- `docs/lore/rulings.md`: append R-170 (Pardonlin and the Wickets), R-171 (the Thymes and its bridges), R-172 (the
  Unmown), R-173 (roundabouts), R-174 (traffic-hat wardens), R-175 (where the second expansion's places stand: Pardonlin
  x -1800..-1400, z -900..1100; the Unmown north-west; the bands pushed to the edge; world 3600 m), date 2026-11-25,
  Applies to: apocrypha, gnome-theft-auto.
- New entries in `docs/lore/entries/apocrypha/`: `pardonlin.md` (kind place), `the-thymes.md` (place), `the-wickets.md`
  (place), `the-unmown.md` (place), `traffic-hat-wardens.md` (group or the kind other group entries use), each citing
  the rulings and `games/gnome-theft-auto/src/data/levels/pardonlin.level.json` / `the-unmown.level.json` in `sources`.
  Pardonlin's and the Unmown's "Look and motifs" match `src/data/regionThemes.json` themes `pardonlin` / `the-unmown`.
- Existing entries: one line each in the "In the games" section of `trellisdown.md`, `snowcap-rise.md` (or the north
  band's entry), the Rootwell and Saltbucket Shore entries (find them with `npm run lore -- find rootwell` etc.).
- `docs/lore/settings.md`: in the apocrypha row's gnome-theft-auto bullet, add "the second expansion: Pardonlin through
  the Wickets west of Trellisdown, the Thymes, and the Unmown preserve in the north-west (R-170..R-175)".

## Done when
- `npm run lore` (repo root) passes.
- `npm run lore -- find pardonlin` lists the new entry.

## Out of scope
Any file outside `docs/lore/`. No code.
