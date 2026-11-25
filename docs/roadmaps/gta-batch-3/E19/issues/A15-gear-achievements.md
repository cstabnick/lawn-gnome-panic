Epic: E19-A (courts and skate park: parallel modules)
Depends on: none
Agent: haiku-worker

## Environment
Read `docs/roadmaps/gta-batch-3/E19/issues/_env.md` first (worktree, toolchain, rules). You touch
`packages/prefabs/src/catalog/gta-sports-gear.ts` (an empty, already registered file) and
`packages/achievements/src/catalog.ts`. Others fill other catalog files at the same time.

## Goal
Six wearable rewards for Founders' Green (Drainpipe Court basketball, the Gutter Bowls skate park) and the six
achievements that give them.

## Read first
- `docs/roadmaps/prefab-library/_common.md` (modelling rules; ignore its "Environment" section).
- `packages/prefabs/src/types.ts` and `packages/prefabs/src/palette.ts`.
- `packages/prefabs/src/catalog/gta-golf-gear.ts`: finished GTA rewards to copy the style of (head pieces with
  `min.y = 0`, a back piece, a neck piece, a held `hand` item; `category`, `uses`, `about`, tags with 'reward').
- `packages/achievements/src/catalog.ts`: the GTA entries ending with `gta-groundskeepers-secret` (and whatever E24/E25
  added after it: put yours at the end of the GTA block).
- `packages/gnome/README.md` (equipment slots and fit) and run `npm test -w packages/gnome` once to see the fit test.

## Change
- `gta-sports-gear.ts`, `GTA_SPORTS_GEAR` (worn: `category: 'armor'`, `uses: ['wear-head']` / `['wear-back']` /
  `['wear-neck']`; held: like `driver-cane`), five examine lines each, tags with 'gta', 'reward':
  - `drainpipe-sweatband` (head): a terry sweatband in orange with a grey drainpipe stripe round it, worn low on the
    hat brim line (a short wide `cyl` ring), a little embroidered hoop on the front.
  - `spare-basketball` (hand): a scuffed orange street ball with dark seam lines held at the grip origin ("Bring a spare").
  - `swish-net-scarf` (neck): a white basketball net worn as a scarf: a ring of white net (thin `ring`s and short
    diagonal boxes) round the neck with two dangling net ends. The hoop at Drainpipe Court has no net: Swish wears it.
  - `gutter-skate-helmet` (head): a round skate helmet in sky blue, vent slots (thin dark boxes), a chin strap, an acorn
    sticker on the side.
  - `gutter-deck-sling` (back): a wooden skateboard slung diagonally across the back on a webbing strap (deck, grip
    tape, two trucks, four small cream wheels).
  - `skate-tool-lanyard` (neck): a lanyard with a T-shaped skate tool and a tiny wax block hanging from it.
- `packages/achievements/src/catalog.ts`: six entries at the end of the GTA block, each `game: 'gnome-theft-auto',
  gameTitle: 'Gnome Theft Auto'`:
  - `gta-drainpipe-dunk` "Down the Drainpipe": "Dunk in a pickup game at Drainpipe Court." reward
    `{ slot: 'head', prefabId: 'drainpipe-sweatband', label: 'Drainpipe Sweatband' }`.
  - `gta-drainpipe-three` "Bring a Spare": "Make a three at Drainpipe Court." reward
    `{ slot: 'hand', prefabId: 'spare-basketball', label: 'Spare Basketball' }`.
  - `gta-drainpipe-win` "Nobody Owns the Court": "Win a pickup game at Drainpipe Court." reward
    `{ slot: 'neck', prefabId: 'swish-net-scarf', label: 'Swish Net Scarf' }`.
  - `gta-first-ollie` "Both Wheels Off": "Land an ollie on a skateboard." reward
    `{ slot: 'head', prefabId: 'gutter-skate-helmet', label: 'Gutter Skate Helmet' }`.
  - `gta-five-trick-combo` "Five in the Gutter": "Land a combo of five tricks or more." reward
    `{ slot: 'back', prefabId: 'gutter-deck-sling', label: 'Deck Sling' }`.
  - `gta-full-rail` "End to End": "Grind a rail from one end to the other." reward
    `{ slot: 'neck', prefabId: 'skate-tool-lanyard', label: 'Skate Tool Lanyard' }`.

## Contract
Achievement ids, titles and reward prefab ids exactly as above. Prefab ids `swish-net-scarf`, `drainpipe-sweatband`,
`gutter-deck-sling`, `gutter-skate-helmet` are also worn by the regulars in the game.

## Done when
- `npm test -w packages/prefabs`, `npm test -w packages/achievements` and `npm test -w packages/gnome` pass.
- `npx tsc --noEmit -p packages/prefabs` and `-p packages/achievements` show no errors in your files.

## Out of scope
Other catalog files, `catalog/index.ts`, the game.
