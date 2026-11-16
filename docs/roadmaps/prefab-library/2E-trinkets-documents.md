Epic: 2 Catalog
Depends on: none

First read and follow `docs/roadmaps/prefab-library/_common.md` (environment, format, modelling rules, examine voice, checks, out of scope).

## Goal
`packages/prefabs/src/catalog/trinkets.ts` and `packages/prefabs/src/catalog/documents.ts` hold about 12 trinket/key prefabs and 10 document prefabs covering the emoji Gnomes of Gnomomia uses for them.

## Change
- `packages/prefabs/src/catalog/trinkets.ts`: keep `brass-key`, append to `TRINKETS`. Category `'trinket'` (uses `wear-finger`, `wear-neck`, `collect` as fits) or `'key'` (uses `['unlock', 'hold']`, needs `grip`).
- `packages/prefabs/src/catalog/documents.ts`: keep `sealed-letter`, append to `DOCUMENTS`. Category `'document'`, uses `['read', 'collect']`. Paper lies flat or rolled; books stand or lie closed.

Trinkets (`trinkets.ts`):

| id | name | emoji | look | stands in for items named |
|---|---|---|---|---|
| tin-ring | Tin Ring | 💍 | a plain grey ring standing on edge with a tiny bead | Tin ring |
| tall-eye-charm | Tall-eye Charm | 🧿 | a glass marble (glowing swirl) in a wire cage on a cord loop | Tall-eye charm |
| reed-charm | Reed Charm | 🌾 | a little woven reed knot with a dangling seed | Reed Charm |
| honeycomb-charm | Honeycomb Charm | 🍯 | a hexagon-cell wax plate on a cord (offhand charm) | Honeycomb charm |
| mole-crown | Mole Crown | 👑 | a crude crown of bent claws and pebbles | Mole crown |
| feral-totem | Feral Totem | 🗿 | a squat carved clay idol with a big hat and shell eyes | Feral totem |
| riding-snail | Riding Snail | 🐌 | a small snail figure (shell + body) wearing a saddle; category 'trinket', uses ['collect'] | Riding snail |
| stag-beetle | Tamed Stag Beetle | 🪲 | a beetle figure with big antler jaws and a tiny bridle | Tamed stag beetle |
| bead-necklace | Bead Necklace | 📿 | a loop of clay beads lying flat | (none yet) |
| name-tag | Name-Tag | 🏷 | a tin tag with a hole and a loop of string, scratched letters | Pipewright Name-Tag |
| signal-horn | Signal Horn | 📯 | a curled horn with a brass mouthpiece | (none yet) |
| iron-key | Iron Key | 🗝 | a heavy black key with a ring bow and big teeth (category 'key') | (none yet) |
| clay-whistle | Clay Whistle | | a little bird-shaped clay whistle | (none yet) |

Documents (`documents.ts`):

| id | name | emoji | look | stands in for items named |
|---|---|---|---|---|
| rolled-scroll | Rolled Scroll | 📜 | a parchment roll with two wooden end knobs and a ribbon | Snail-cart Writ |
| red-book | Red Book | 📕 | a closed book with a red cover and cream page edges, lying flat | Primer |
| folded-map | Folded Map | 🗺 | a partly unfolded map with drawn paths and a red X | Valve Maps |
| ticket-stub | Ticket | 🎫 | a small stiff card with a punched hole and torn edge | Snail-cart ticket |
| scribbled-note | Scribbled Note | 📝 | a sheet of paper with ink lines and a quill lying on it | (notes) |
| ledger | Ledger | 🧀 | a thick account book with a strap, standing on its spine | Cheese ledger list (list 🧀 so this item gets a book; tags 'ledger', 'list') |
| letter-of-passage | Letter of Passage | 📨 | a folded letter with a big seal and a hanging ribbon | Letter of passage |
| soggy-letter | Soggy Letter | ✉ | a crumpled, water-stained letter with a smudged seal | Soggy letter |
| wanted-poster | Wanted Poster | | a nailed sheet with a crude gnome face drawing | (none yet) |
| recipe-card | Recipe Card | | a small card with a mushroom sketch | (none yet) |

## Contract
`export const TRINKETS: PrefabDef[]` and `export const DOCUMENTS: PrefabDef[]` stay the export names and types.

## Done when
- `npx tsc --noEmit -p packages/prefabs` shows no error in `trinkets.ts` or `documents.ts`.
- `npm test -w packages/prefabs` passes every test for the ids above.
