Epic: E30-B (Pardonlin content, all parallel)
Depends on: none

## Environment
Repo = the current working directory (a git worktree of lawn-gnome-panic). Git Bash; if `node` is not found:
`export PATH="/c/Program Files/nodejs:$PATH"`. Keep LF line endings. Do not commit. Other workers are editing other
files at the same time (another writes `gta-pardonlin-props.ts`); touch only the two files below.

## Goal
Pardonlin's three set-piece prefabs and five wearable achievement rewards exist, and five Pardonlin achievements are in
the shared catalog with those rewards.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: PrefabDef rules.
- `packages/prefabs/src/catalog/gta-euro-gear.ts`: three wearable rewards (head / back / neck): copy their structure
  and scale exactly (category 'armor', uses ['wear-head'] / ['wear-back'] / ['wear-neck'], sizes in metres for a 1 m
  gnome).
- A 'hand' slot reward for the pattern: `grep -rn "'wear-hand'\|uses: \['hold'" packages/prefabs/src/catalog/golf.ts`
  (the golden putter, reward slot 'hand'); `packages/achievements/README.md` (rewards and slots).
- `packages/achievements/src/catalog.ts`: find `gta-grand-tour` (about line 789): add yours right after
  `gta-petit-pois`, in the same format.
- `packages/prefabs/src/catalog/gta-pardonlin-gear.ts`: your file (empty, already registered in `catalog/index.ts`).

## Change
- `packages/prefabs/src/catalog/gta-pardonlin-gear.ts`, `GTA_PARDONLIN_GEAR` (each def with `about`, 4-5 `examine`
  lines in a gentle continental-satire voice, tags incl. 'gta' and 'pardonlin', `emoji: []`; no real places, brands
  or nationalities; nothing wet/soaked/dripping/bloody):
  1. `pl-bean-tower` (category 'prop', uses ['place']): the Bean Tower, Pardonlin's landmark: a giant Tall-One
     bean-pole wigwam. Six or eight bamboo canes (cyl, about 0.35 m thick, 30 m long) leaning in from a ring of radius
     7 m on the ground to meet near the top, tied with a big twine knot; green runner-bean vines spiralling up the canes
     (chains of small leaf 'ball's / boxes), red flowers, long green pods hanging; a little gnome-scale viewing platform
     ring (wood) at 10 m and a ladder up one cane. Origin at the ground centre. Keep part count under ~150 (merge
     repeats with a loop). Footprint about 16 x 16 m, height 30 m.
  2. `pl-pigeon-statue` (prop): "the Unknown Pigeon": a stone plinth (1.6 x 1.6 x 1.4 m) with a bronze-green
     pigeon (1.2 m tall) on top, one wing raised heroically, a little laurel wreath.
  3. `pl-swan-pedalo` (prop): a white swan pedal boat (3 m long, 1.6 m tall neck), two seats, pedals, origin at the
     waterline/ground.
  4. `queue-ticket-lanyard` (armor, uses ['wear-neck']): a red lanyard with a big numbered paper ticket (number 0001).
  5. `daily-baguette` (the hand-slot reward: copy the golden putter's category/uses): a baguette in a paper sleeve.
  6. `painters-beret` (armor, ['wear-head']): a black beret with a paint-smudged brim, a brush tucked in the band.
  7. `cello-case` (armor, ['wear-back']): a cello case on the back with straps, a sticker of the Bean Tower.
  8. `flaneur-cravat` (armor, ['wear-neck']): a silk cravat (tint) with a pin.
- `packages/achievements/src/catalog.ts`: add, after `gta-petit-pois`, with `game: 'gnome-theft-auto'`,
  `gameTitle: 'Gnome Theft Auto'` (ids, titles and descriptions exact):
  - `gta-pl-queue`, 'Queued for Nothing', 'Reach the front of the Grand Platz queue in Pardonlin. There is nothing at the front.', reward { slot: 'neck', prefabId: 'queue-ticket-lanyard', label: 'Queue Ticket' }
  - `gta-pl-baguette-round`, 'Daily Bread', "Deliver every baguette on Brigitte Levain's Baguette Round.", reward { slot: 'hand', prefabId: 'daily-baguette', label: 'Daily Baguette' }
  - `gta-pl-portrait`, 'Portrait of a Croissant', "Sit still for Odile Easelby's portrait on the Grand Platz.", reward { slot: 'head', prefabId: 'painters-beret', label: "Painter's Beret" }
  - `gta-pl-flaneur`, 'Flâneur', 'Stroll on foot through all four districts of Pardonlin.', target: 4, reward { slot: 'neck', prefabId: 'flaneur-cravat', label: 'Flâneur Cravat' }
  - `gta-pl-adagio`, 'Largo', 'Listen to Radio Adagio for three whole minutes.', reward { slot: 'back', prefabId: 'cello-case', label: 'Cello Case' }

## Done when
- `npm test -w packages/prefabs` and `npm test -w packages/achievements` pass.
- Report each prefab's size and part count.

## Out of scope
`catalog/index.ts`, `gta-pardonlin-props.ts`, anything in `games/`.
