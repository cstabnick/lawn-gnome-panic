Epic: FX12 · Issue D: the bears are chill, never dead (napping bear, cocoa mug, the Bear Deck)
Depends on: none
Model: Sonnet (staging, taste)
Port: 5525

(Paste of `_env.md` goes here when launched.)

## Goal
- G4#13 (**must**, decision D24): the `pond-nap` bear at (-662, -1078) on Pail Pond lies flat on its back with its legs
  splayed and reads as a carcass. Curl it on its side or belly with its head on its paws, add a small "Zzz" puff
  rising from it, and a towel under it (prefab `caddie-towel`, scaled up and tinted, e.g. red-and-white) plus a folded
  newspaper or a pushed-up pair of sunglasses if a prefab fits (grep `id: '` in `packages/prefabs/src/catalog/`, e.g.
  `newspaper`, `sunglasses`). At 390x844 from the shore it must read as asleep. Nothing dies in this world.
- G4#15: the `lodge-mug` bear's cocoa mug (prefab `cocoa-mug` at scale 0.3) is invisible. Scale it to bear scale
  (about 0.6 or what reads), put it in the bear's paw (attach it to the paw/arm part if the critter model has named
  parts — see `part(c, name)`), and add a small steam puff.
- G4#14: the Bear Deck on Frostbite Fells (`critters/fells.ts`, five polar bears in deck chairs at about (330, -640))
  has no deck, and its sign (`addBearDeck` in `critters/snowcap.ts`, at `BEAR_DECK.z + 9`, right in front of the
  centre bear) hides the middle bear. Lay a timber deck under the chairs (prefab `bear-deck`, which another worker is
  adding to `@lawn/prefabs` right now: a ~22 x 6 m plank platform about 0.25 m high with a low rail on three sides,
  open on its +z (front) side; guard with `getPrefab('bear-deck')` so nothing breaks before it lands), two parasols
  (`beach-umbrella`), a cool box of sardines (`bait-cooler` with a `sardine-tin` or two beside it). Chairs and bears
  stand on the deck top, not sunk in it. Move the sign 6-8 m to the side of the approach path, angled toward it, so
  every bear is visible from the approach. Keep the sign text exactly ("They are not asleep." is the joke).

## Read first
- `src/critters/snowcap.ts` (all: `addPoseProps`, `addBearDeck`, `snowcapLife`, the pose code in `update` ~line
  130-175 for `'nap'` and `'mug'`).
- `src/critters/fells.ts` lines 1-60 and 170-260 (the deck: `DECK_CX`, `DECK_CZ`, `openSpot`, the chairs, the bears
  spawned with `rt.spawn('polar-bear', x, z, { mode: 'script', ... })`, how their pose/height is set).
- The critter runtime types (`CritterRuntime`, `Critter`, `critterMesh`) where snowcap.ts imports them from, and the
  polar-bear model (grep `'polar-bear'` under `src/critters/`) to learn its part names and how a pose rotates it.
- `src/winter/types.ts` `SNOWCAP_BEARS`, `BEAR_DECK`, `HUG_RANGE` (read only; keep the bears' spots: Bear Hug counts
  them by position).

## Change
- `src/critters/snowcap.ts` and `src/critters/fells.ts` (you own both). Puffs (Zzz, steam) are small sprites with a
  CanvasTexture (`depthWrite: false`, transparent), updated only when the player is within ~150 m. Flat things on the
  ground (towel) take `flatLayer(material, LAYER.<x>)` if they are flat meshes; a prefab with thickness is fine as is.
- Tests: keep `src/critters/*.test.ts` passing (if there is a snowcap or fells test, extend it: the sign is ≥ 6 m from
  the deck centre's x; the mug's scale ≥ 0.5).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` has no errors in your files; `cd games/gnome-theft-auto && npx vitest
  run src/critters src/winter/pond.test.ts` passes.
- Shots on port 5525 at 960x600 and `--size 390x844`: `pondMid` (-640,-1040,3.14) and `napClose` (-662,-1068,3.14),
  `mug` (-432,-1035,-1.57), `deckClose` (330,-622,3.14), `bearDeck` (330,-600,3.14). Compare with the editor's
  `pondMid.png`, `deckClose.png`, `bearDeck.png`: the nap bear reads as asleep, the mug is visible, there is a deck and
  no bear is hidden by the sign. If the `bear-deck` prefab has not landed when you shoot, note it and shoot again at
  the end.

## Out of scope
`src/winter/*` (pond scenery belongs to another worker), the prefab catalog, types.ts.
