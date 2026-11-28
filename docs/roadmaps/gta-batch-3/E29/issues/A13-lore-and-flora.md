Epic: E29-A European kit (all parallel)
Depends on: none

## Environment
Read the "Environment" section of `docs/roadmaps/gta-batch-3/E29/_common.md` (working directory, node path, do not
commit, other workers edit other files).

## Goal
Each of the five European rides has a lore entry, and the European plants are in Gnome Theft Auto's flora table.

## Read first
- `docs/lore/entries/apocrypha/pot-rod.md` and `docs/lore/entries/apocrypha/barrow-buggy.md` (entry format: front matter
  fields, sections "Field Notes", "What gnomes say", "Loose threads")
- `docs/lore/README.md` (entry rules; skim for the front-matter fields and what `npm run lore` checks)
- `games/gnome-theft-auto/src/flora/kinds.ts` (`PLANT_KINDS`) and `games/gnome-theft-auto/src/flora/kinds.test.ts`

## Change
- New files in `docs/lore/entries/apocrypha/`, one per ride, same front matter shape as `pot-rod.md`
  (`id`, `name`, `kind: object`, `tier: apocrypha`, `setting: apocrypha`, `era: now`, `status: draft`,
  `games: [gnome-theft-auto]`, `aliases`, `sources: [games/gnome-theft-auto/src/config.ts]`, `related: [burls-forecourt]`
  — only list related ids that exist as entries; check with `ls docs/lore/entries/apocrypha/`):
  - `petit-pois.md` — Petit Pois: a pea-green city hatchback small enough to park in the gap between two other parked
    cars, sideways. Top speed 24. Achievement "Small Is Beautiful" gives the Riviera Scarf.
  - `deux-pots.md` — Deux-Pots: a corrugated tin car with a roll-back canvas roof that leans in corners as if listening to
    gossip; it was designed to cross a ploughed field with a basket of eggs and not break one. Top speed 20.
  - `wespa.md` — Wespa: a wasp-striped scooter, mostly noise; two up, one argument. Top speed 26.
  - `baguette-trike.md` — Baguette Trike: a three-wheeled bakery delivery trike; the bread in the box is always one loaf
    short of the order. Top speed 15. Achievement "Baguette Run" gives the Baguette Quiver.
  - `crepe-van.md` — Crepe Van: a ribbed grey food van with a serving hatch; it smells of batter for ever. Top speed 19.
  Each entry: one-line summary paragraph, "Field Notes" (2 short paragraphs: what it is, where it turns up — in the
  European yard's traffic and at Burl's Forecourt; the yard itself stays unnamed: "the old yard across the path"),
  "What gnomes say" (one quote), "Loose threads" (one open question; plus the Grand Tour line: "Grand Tour is the
  achievement for driving all five European rides. Its reward is the Tour Beret."). Dry, understated; no real places,
  brands, countries or people.
- `games/gnome-theft-auto/src/flora/kinds.ts` `PLANT_KINDS`: add a `// European plants (E29).` group:
  - mowable: `{ id: 'euro-geranium-bed', name: 'Geraniums', size: 'small', mowable: true, slow: 0.97, clip: 0xd8342c, regrow: [70, 110], sound: 'mow-snip', longGrass: false }`
  - not mowable (`size: 'big', mowable: false, ...NEVER`): `'euro-box-hedge'` ('Box hedge'), `'euro-topiary-spiral'`
    ('Spiral topiary'), `'euro-topiary-lollipop'` ('Bay tree'), `'euro-espalier-pear'` ('Espalier pear'), `'euro-plane-tree'` ('Plane tree').
  Put the mowable row in the mowable section and the others in the "Not mowable" section.

## Contract
Prefab ids above are being built by other workers right now (`packages/prefabs/src/catalog/gta-euro-garden.ts`); the
flora test "names real prefabs, once each" will only pass once they land. That is expected: report it.

## Done when
- `npm run lore` passes (run from the repo root).
- `npx tsc --noEmit -p games/gnome-theft-auto` shows no error in `flora/kinds.ts`.
- `cd games/gnome-theft-auto && npx vitest run src/flora/kinds.test.ts`: passes, or fails only because a `euro-*` prefab
  does not exist yet.

## Out of scope
Every other file in `docs/lore/` (do not edit existing entries), every other game file, `packages/`.
