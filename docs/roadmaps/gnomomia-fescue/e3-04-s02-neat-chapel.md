Epic: 3, Thatchford Downs and the Calling
Depends on: none

## Goal
Storyline 02, "The Even Lawn", is playable at the Neat Chapel in Thatchford Downs.

## Read first
- `docs/design/gnomomia/storylines/02-neat-chapel.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; the thatchford layout: `neat-chapel` 35,10,14 and `long-bank` 35,-15,10)

## Change
`src/data/packs/s02-neat-chapel.ts`, prefix `s02-`, zone `thatchford`. Follow the content pack recipe:
- The new NPCs Plantain Pail, Chickweed Mattock and Sprig Lintel, plus the Lawn Warden enemy, items, objects and quests from the storyline.
- Brother Sedge is canon NPC `sedge` (owned by ch2). Add his lines through `topics`/`greetingsFirst`/`extraNodes`.
- Read flag `sedge` (`trusted`/`wary`) as the storyline says.
- The first quest unlocks after `c2-sedge-pamphlets` is done.
- The "cut a blade of their grass" joke: an object `s02-chapel-lawn` (verb Cut, `setFlag: { flag: 's02-lawn-cut', value: 'yes' }`), with no quest attached. Add a spawn group of the Lawn Warden with `when: { flagSet: 's02-lawn-cut' }`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch2-thatchford.ts.
