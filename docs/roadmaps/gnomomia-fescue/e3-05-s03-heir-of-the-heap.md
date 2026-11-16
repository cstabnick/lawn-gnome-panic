Epic: 3, Thatchford Downs and the Calling
Depends on: none

## Goal
Storyline 03, "Heir of the Heap", is playable at the Compost Heap and in Thatchford's cellars.

## Read first
- `docs/design/gnomomia/storylines/03-heir-of-the-heap.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; thatchford layout: `compost-heap` 65,45,18, `tipsy-toadstool` -8,6,4)

## Change
`src/data/packs/s03-heir-of-the-heap.ts`, prefix `s03-`, zone `thatchford`. Follow the content pack recipe:
- New NPCs Dock Crumbtin and Gristle: rats, so use `model: 'rat'`. Plus the storyline's quests, items and objects, with both the truce and the war versions of quests 4 and 5.
- The first quest unlocks after `c2-the-heap` is done.
- Flag `heap` = `truce` | `war`.
- Rat enemies may reuse canon `heap-rat` and `brown-rat`.
- The Heap diggers ally: `allies: [{ id: 's03-heap-diggers', name: 'Heap diggers', when: { flag: { name: 'heap', value: 'truce' } }, effect: 'ramp-faster' }]`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch2-thatchford.ts.
