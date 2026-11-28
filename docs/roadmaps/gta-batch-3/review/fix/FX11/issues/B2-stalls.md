Epic: FX11 B (placement, parallel) · Issue B2: six stalls, six trades, six keepers (G3#7; G3#22 sign)
Depends on: epic A · Agent: Sonnet · Dev port 5542

(The Environment section the lead gave you applies.)

## Goal
Editor (G3#7): "Every stall is `boardwalk-stall` with a tint and a name board. Counters are empty and only Sal has a keeper. The lore gives each stall its wares, a sign and a keeper: Plank & Pickle's barrel and its 'Ask about the brine' sign, Scoop & Spade's cones in tin buckets, the Lucky Limpet's shell of fortunes, the ledger shelf in Marram's Office, and Tin Shy's sulking keeper." Fix: "Per-stall counter dressing, each stall's lore sign, and one keeper gnome per stall using the lore lines." G3#22: the LOST PROPERTY sign and the pile of hats were 20 m apart: the sign now goes on Marram's Office counter (another worker piles the hats in front of it at x 149-151.5, z 1107.2-1108).

## Read first
- `games/gnome-theft-auto/src/coast/stalls.ts` (yours: `buildStalls(scene, boxes, deckTop)` places the six kiosks with name boards, Tin Shy's tins, Sal's cart and two signs; `STALL_KEEPERS: AmbientGnomeDef[]` is empty: life.ts already adds it to the coast residents).
- `games/gnome-theft-auto/src/coast/config.ts` `COAST.boardwalk.stalls` (x -150, -95, -40, 40, 95, 150 at z 1105.5, fronts facing +z) and the deck (z 1102..1132, deck top = ground + 0.22).
- `packages/prefabs/src/catalog/gta-coast-kit.ts` `boardwalk-stall` (at scale 2.4: counter 3.84 m wide (x +-1.92), 1.2 m high, from local z 0.15 +- 0.3 => world z about 1105.1..1106.6; back wall at z about 1104.7; awning about 3.5 m up), `tin-shy`, `candyfloss-cart`.
- `packages/prefabs/src/catalog/gta-coast-town.ts` (new: `pickle-barrel`, `cone-bucket-tray`, `fortune-shell`, `stub-shelf`, `rubber-seagull`, ... read each `about:` for size). Also existing props: `barrel`, `ledger-book`, `bookshelf`, `gta-can-cola`, `tennis-ball`, `saltbucket-boater`, `straw-boater`.
- `games/gnome-theft-auto/src/ambientGnomes.ts` (`AmbientGnomeDef`: id, name, x, z, yaw, look, bubble, idle?, `surface: 'rooftop'` to stand on the deck) and `src/anim/types.ts` / the existing residents in `src/coast/life.ts` for idle ids (`vendor-call`, `look-around`, `point`, `guard-stand`, ...).
- Lore: `docs/lore/entries/apocrypha/the-boardwalk-stalls.md` (wares, prices, signs, house rules), `spun-sugar-sal.md`, `marram-teaspoon.md`.

## Keepers (decided by the lead; the lore worker records them)
| Stall | Keeper | Look idea | Bubble (one line, dry, not repeating a sign next to them) |
|---|---|---|---|
| Plank & Pickle | Gil Brinewater | green apron, white hat | e.g. "Two acorns a cup. Three with a fork. The fork is the expensive part." |
| Tin Shy | Tam Tinsley (sulks when anyone wins) | | e.g. "Nobody has won today. I am in a very good mood." |
| Scoop & Spade | Dot Scoopwell | | e.g. "Vanilla, sand-coloured, or whichever is left. It is usually whichever." |
| The Lucky Limpet | Madame Limpet | shawl colours, glasses | e.g. "Something will turn up. That will be one acorn." |
| Marram's Office | Penny Stubbs (counts the change for Marram) | glasses | e.g. "Every fare since the bucket sank. I have read them all twice." |
Spun Sugar Sal already exists (life.ts `coast-sal-candyfloss`): do not add her again.
Ids `coast-keeper-<stall id>`, `surface: 'rooftop'`, standing beside or just in front of their counter (the gap behind the counter is too narrow), facing the walkway (yaw about 0, +-0.4), at least 1.5 m clear of the counter front so nobody stands in a prop.

## Change: `src/coast/stalls.ts` (+ `src/coast/stalls.test.ts`)
1. Counter dressing per stall (prefabs at `placeAt(scene, id, x, deckTop + counterTop, z, yaw, scale)` from `deckKit.ts`; counter top = deckTop + 1.2): Plank & Pickle: a `pickle-barrel` on the counter and a `barrel` beside the stall; Scoop & Spade: a `cone-bucket-tray` on the counter; The Lucky Limpet: a `fortune-shell` on the counter; Marram's Office: a `stub-shelf` on the back wall (facing +z, 0.03 m off the wall) and a `ledger-book` on the counter; Tin Shy: its keeper and prizes (`rubber-seagull` on the counter end, a nearly-hat); Sal's: leave the cart, add nothing on her counter but a stack of paper cones if you like. Hand-place with small yaws; nothing hangs off the counter edge.
2. Each stall's lore sign (via `signAt` with small boards, `post: 0` fixed to the stall or `post` 1.0 free-standing beside it; both faces print by default): Plank & Pickle over the barrel `"Ask about the brine.\nDo not ask what is in the brine."`; Sal's house rule `"NO DIPPING HATS"`; Tin Shy `"3 CHIPPED ACORNS: 1 ACORN\nPrizes: a seagull, a hat (nearly), nothing"`; Scoop & Spade `"Vanilla. Sand-coloured.\nWhichever is left."`; The Lucky Limpet `"FORTUNES 1 ACORN\nSomething will turn up."`; Marram's Office: move `LOST PROPERTY / Hats, mostly` from its post onto the office counter front (a plate fixed 0.03 m in front of the counter's front face at about z 1106.65, `post: 0`, w about 1.6, h 0.55, at counter height). Keep "CANDYFLOSS IS A VEGETABLE (Sal says so)" where it is.
3. `STALL_KEEPERS`: the five keepers above.
4. Test: every keeper stands on the deck rect, at least 1.4 m from every stall's counter box, and has a unique id starting `coast-keeper-`.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast` passes; `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Shots (port 5542), each from the walkway in front of the stall looking at it (yaw PI = facing north): `pickle:-95,1118,3.14159 scoop:40,1118,3.14159 office:150,1118,3.14159 limpet:95,1118,3.14159 tinshy:-40,1118,3.14159 sal:-150,1118,3.14159`, plus `stallsP:-95,1120,3.14159 --size 390x844`. Compare the editors' `b02-pickle.png`, `b03-scoop.png`, `b04-office.png`. Each stall must say what it sells at a glance. Iterate.

## Out of scope
`life.ts` (the hats pile, Sal, vignettes), `promenade.ts` (the south side), `boardwalk.ts`.
