Epic: 3, Thatchford Downs and the Calling
Depends on: none

## Goal
Chapter 2, "It's Always Carts", is playable: Thatchford's people, shops and trainers, the three class trials (the Calling), the Tremor Tally, the Fountains, the Compost Heap with Rotgut, the letter to the Queen, and the Chapter 2 side quests.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 2 (all of it)
- `docs/design/gnomomia/places-and-people.md` §2 (people table, sub-areas)
- `docs/design/gnomomia/bestiary.md`, the Thatchford Downs table; `items.md` (Thatchford row; Glaze pot, Salt pinch)
- `docs/design/gnomomia/classes.md`, "The Calling" (trial and class choice)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids, zone layout); `src/data/packs/mossbottom.ts` (example pack)

## Change
`src/data/packs/ch2-thatchford.ts`, prefix `c2-`, zone `thatchford`.
- **NPCs** (canonical ids, no prefix): `burlap stoutpot twitchett dimm puddleby grindwell nettle sedge clementine`. Give each a look (the `look` helper in config), a position in the matching region, `examine` and lines from places-and-people.
  - `stoutpot`, `twitchett` and `dimm` stand in the `guildhall` with `trainer: 'warden' | 'slinger' | 'mage'`.
  - Shops: a smith (sells the Thatchford row from items.md: Hand fork, Bricklayer's mallet, the Bottlecap plate set, Ash slingshot, Hollow-stem blowpipe, Mole-hide jerkins, Hazel staff, Petal-silk smocks, all ilvl 7-10 plain), and `puddleby` (Inn) sells food. Add `glaze-pot` and `salt-pinch` to a General stock on `clementine`.
- **Enemies** (canonical ids): `water-beetle hose-leech muck-sprite brown-rat magpie-thief earthworm heap-rat grub-swarm rotgut`, with the bestiary's levels, ranks and families. Rotgut is a boss with moves Belly Flop (ring, radius 4, stagger), Rat Pack (summon 3 `heap-rat`, below 0.6 HP) and Steaming Rot (pool, poisoned). He drops `c2-rotguts-fork` (heirloom, ilvl 11, 2-hand pierce). Spawns in the matching regions.
- **Main quests**, ids as canonical: `c2-word-to-the-reeve`, `c2-calling`, `c2-tremor-tally`, `c2-pressures-wrong`, `c2-the-heap`, `c2-letter-for-the-queen` (finale). `c2-word-to-the-reeve` unlocks after `mb-what-moles-know` is done.
  - **The Calling**, `c2-calling` (needs `minLevel: 5`):
    - Stage 1: a `choice` on flag `c2-trial` (values `warden`/`slinger`/`mage`), set by picking a trainer.
    - Then three branch quests, `c2-trial-warden`, `c2-trial-slinger` and `c2-trial-mage`, each offered only when `flag c2-trial` matches:
      - Warden: `defend` the ford (0,0, r 6, 60 s, waves of `water-beetle` 3 at 0, 3 at 20, 4 at 40).
      - Slinger: `kill` 4 `magpie-thief`.
      - Mage: `kill` 6 `muck-sprite`.
    - Each trial's last stage is `talk` to its trainer, whose turn-in dialogue runs `{ type: 'chooseClass', classId }` and gives a Sprouted class weapon (`c2-warden-trowel`, `c2-slinger-sling`, `c2-mage-staff`, ilvl 6).
  - **Pressure's Wrong**: 4 `valve` objects in `spinning-fountains` (`c2-fountain-valve-1..4`); the quest needs `interact` with each. Use 4 stages of count 1, or one object type with count 4 placed 4 times (ids must be unique, so use 4 stages).
  - **Tremor Tally**: a `c2-mill-wheel` object at `mill`. `tremor-tally` is a questItem given on turn-in.
- **Side quests:** `c2-empty-table` (an `interact` with object `c2-laid-table` in the inn; sets flag `c2-forty-list`=`yes`), `c2-postage-due`, `c2-sedge-pamphlets` (a `choice` setting flag `sedge` = `trusted` | `wary`), and `c2-cracked-pots`, as quests.md describes.
- Bounty board: skip.

## Contract
The canonical NPC, enemy, item (`tremor-tally glaze-pot salt-pinch`) and quest ids above must exist with these exact ids. Other packs reference them.

## Done when
- The content-pack done-when in the common section.

## Out of scope
data/zones/thatchford.ts (another worker; read the coordinates from `src/data/README.md`), storyline packs s01-s03.
