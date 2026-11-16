Epic: 6, The Verge and the Battle of the Verge
Depends on: none

## Goal
Storyline 13, "The Cart That Came Back Empty", is playable: bringing King Gnorbert's cart home from the Even Cut's trophy ring.

## Read first
- `docs/design/gnomomia/storylines/13-the-kings-cart.md` (all; the spec)
- `games/gnomes-of-gnomomia/src/data/README.md` (canonical ids; verge layout: `kings-cart` -60,-10,8, `last-tuft` 0,80)

## Change
`src/data/packs/s13-the-kings-cart.ts`, prefix `s13-`, zone `verge`. Follow the content pack recipe:
- **Unlock:** the first quest unlocks after `c7-no-hats` is done.
- **Mabel at the Verge:** `mabel` is canon (ch4, Cloverfield). Use your own copy `s13-mabel` at the Verge, visible while this storyline is active.
- **Ironsod:** use the ch7 copy `c7-ironsod` through `topics`/`greetingsFirst`/`extraNodes`.
- **The cart:** an escort of an NPC copy of the cart, `s13-kings-cart` (`model: 'snail'`, named "The King's cart", scale 2), from `kings-cart` to `last-tuft`.
- **New NPC:** Bindweed Hobnail.
- **Enemy:** the Even Cut Sweeper (`s13-sweeper`, L26 normal fired).
- **Items:** the King's Good Hat, Marigold's Button and Gnorbert's Letters (quest items).
- **Flags:** `ironsod` = `faced` | `sent`, and `cart` = `haul` | `memorial`.

## Done when
- The content-pack done-when in the common section.

## Out of scope
ch7 pack.
