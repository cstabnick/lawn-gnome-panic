# Items: generic things, deep verbs

## The item model

Like Project Zomboid, items are plain, generic and many. Unlike Zomboid, the rules never mention a specific item:
**recipes, actions and NPC needs ask for tags and properties**, so adding an item is one data row and it works
everywhere at once.

```ts
interface ItemDef {
  id: string;               // 'hand-saw'
  prefab: string;           // @lawn/prefabs id; the 3D model, the held model and the UI icon
  name: string;
  tags: Tag[];              // what it can do, see below
  weight: number;           // kg at gnome scale
  bulk: number;             // litres it takes in a container
  maxCondition: number;     // wears down with use
  props?: Partial<{
    damage: number; reach: number; swing: number; noise: number;      // weapons and tools
    capacity: number; liquidCap: number; seal: boolean;               // containers
    calories: number; water: number; spoilDays: number;               // food
    warmth: number; waterproof: number; armour: number;               // wear
    burnHours: number; light: number; smoke: number;                  // fuel and light
  }>;
  stack?: number;
}

// Per-instance state, everything the world remembers about one item.
interface ItemState { def: string; condition: number; wet: number; age: number; dirty: boolean;
                      contents?: ItemState[]; liquid?: { kind: string; litres: number }; owner?: FactionId; }
```

### Tags (the verbs)

| Tag | Lets you | Example items |
|---|---|---|
| CUT | cut cloth, rope, plants; butcher | `thorn-dagger`, `hedge-shears`, `hand-saw` |
| SAW | cut timber into planks | `hand-saw` |
| PRY | open sealed crates and crypt doors | `hand-fork`, `iron-pick`, `old-trowel` |
| DIG | dig caches, graves, pits, gardens | `dibber`, `old-trowel`, `ranch-spade` |
| HAMMER | build, barricade | `garden-mallet`, `mallet-head` |
| BLUNT / PIERCE / SLASH | melee damage types (cracks vs pierces glaze) | `acorn-club`, `royal-spear`, `iron-sword` |
| RANGED + AMMO_x | shoot | `twig-slingshot` + `pebble-pouch`, `reed-blowpipe` + thorns |
| HOLD_LIQUID | carry water, fuel | `tin-pail`, `clay-jar`, `watering-can` |
| CONTAINER | hold items | `loot-sack`, `wicker-basket`, `wooden-chest`, `crate` |
| COOK_VESSEL | boil water, cook | `pot`, `cauldron`, `tin-pail` |
| FUEL | burn | `twig-bundle`, `timber-log`, `candle`, Black Dew |
| LIGHT | light an area | `candle`, `torch`, `mushroom-lamp`, `candelabra` |
| FIRESTARTER | light fires | flint (to add), `torch` |
| BINDING | tie, splint, make rope | `spider-silk`, wreath wire (to add) |
| ADHESIVE / GLAZE | repair cracks | `slug-slime` (glue), `glaze-pot` |
| MEDICINE | treat Grit, moss | petals (to add), `salt-pinch`, `clover-tea` |
| READABLE | teach a recipe or skill | `red-book`, `recipe-card`, `rolled-scroll` |
| MAP | show a known area | `folded-map` |
| VALUABLE | money and trade | `acorn` (the currency), `gold-coins`, `tall-eye-shard` |

### How tags combine

- **A recipe** is inputs as tag queries plus a tool tag: *Plank* = `{ input: [timber ×1], tool: SAW, skill: Carpentry 0, time: 30 s }`.
  Any SAW works; better condition is faster.
- **An action** is offered when the held item has the tag and the target allows it: hold any PRY item, look at a sealed
  crypt door → "Pry open (noise 60, 20 s)".
- **Improvising**: if no item with the tag is around, a weaker one stands in with a penalty. A `ruler-stick` can PRY at
  half speed and breaks easily. This is where the "use whatever you have" Zomboid feeling comes from.
- **NPC needs are tag queries too**: a settlement that "needs medicine" pays for anything tagged MEDICINE, which is
  what makes the economy work across hundreds of item kinds ([economy.md](economy.md)).

## Containers and inventory

- Hands (2 slots), worn slots (head, back, neck, body, legs, feet; head/back/neck/hand match `@lawn/gnome`'s gear
  slots), and containers with capacity in bulk.
- Weight slows you down ([survival.md](survival.md)); bulk decides what fits. A backpack is the most important item
  in the early game.
- Containers in the world keep their contents for good and can be locked (`brass-key`, `iron-key`) or claimed by a
  faction (see ownership in [society.md](society.md)). Taking from a claimed container is theft, and NPCs who see it
  remember.

## Building

Bases are made of pieces placed on a grid (tile 4 gm, half-tile snapping): planks, walls, doors, barricades, rain
catchers, drying racks, garden beds, beds, a `hearth`, a `workbench`, storage. Pieces have health and get worn down by
Hatless herds pushing against them. NPC settlements build with the same pieces, so a faction's fortress is something the
player can take apart plank by plank.

## Prefab mapping

The first pass of the item list, all existing `@lawn/prefabs` catalog ids:

| Group | Prefabs |
|---|---|
| Melee | `old-trowel`, `iron-trowel`, `acorn-club`, `garden-mallet`, `hand-fork`, `hay-hook`, `iron-pick`, `war-hoe`, `ranch-spade`, `royal-spear`, `thorn-dagger`, `iron-sword`, `hedge-shears`, `willow-switch` |
| Ranged | `twig-slingshot`, `reed-blowpipe`, `marble-shooter`, `lasso-sling`, `lawn-dart`, `pebble-pouch` (ammo), `double-shotgun` (very rare, very loud) |
| Tools | `dibber`, `hand-saw`, `mallet-head`, `hand-rake`, `fishing-rod`, `ruler-stick`, `broom`, `shop-vac`, `weed-killer` (moss killer) |
| Light and fire | `candle`, `torch`, `mushroom-lamp`, `candelabra`, `lamp`, `campfire`, `hearth` |
| Containers | `loot-sack`, `wicker-basket`, `wooden-chest`, `crate`, `barrel`, `sack`, `tin-pail`, `clay-jar`, `watering-can`, `coin-purse`, `compost-bin` |
| Food and drink | `bread-loaf`, `seed-cake`, `cheese-wedge`, `crab-apple`, `blackberry`, `red-mushroom`, `toadstool-stew`, `pickled-slug`, `fresh-peelings`, `acorn-flour-sack`, `clover-tea`, `spigot-water`, `stout-tankard`, `honeydew-flask` |
| Medicine | `glaze-pot`, `salt-pinch`, `rust-oil`, `red-potion`, `rose-draught` |
| Materials | `timber-log`, `twig-bundle`, `clay-chunk`, `stone-chunk`, `iron-bar`, `scrap-gear`, `slug-slime`, `spider-silk`, `feather`, `snail-shell`, `beetle-shell`, `button`, `clover-seed`, `grain-sheaf`, `acorn` |
| Wear | `pointy-hat`, `acorn-cap`, `bucket-helm`, `thimble-helm`, `mushroom-hood`, `leather-jerkin`, `bottlecap-cuirass`, `shell-plate`, `bark-leggings`, `work-gloves`, `wool-scarf`, `leaf-cloak`, `moss-tunic`, `bin-lid-shield`, `pot-lid-shield` |
| Paper | `folded-map`, `red-book`, `recipe-card`, `rolled-scroll`, `scribbled-note`, `ledger`, `letter-of-passage`, `wanted-poster`, `sealed-letter` |
| Keys and trinkets | `brass-key`, `iron-key`, `name-tag`, `signal-horn`, `clay-whistle`, `tall-eye-charm` |
| Furniture (base pieces) | `bed`, `bedroll`, `table`, `stool`, `bench`, `workbench`, `anvil`, `loom`, `cauldron`, `pot`, `barrel`, `crate`, `rug`, `wardrobe`, `bookshelf`, `altar`, `pew` (the chapel) |
| Scenery | `gravestone`, `gnome-statue`, `garden-rock`, `tree-stump`, `flower-pot`, `giant-flower`, `flowering-bush`, `picket-fence`, `signpost`, `village-well`, `wheelbarrow`, `market-stall`, `stone-plaque`, `standing-stone`, `wooden-cart` |

### Prefabs to add

Added to `packages/prefabs/src/catalog/` (a new `dayg.ts` for the setting-specific ones) when the game is built:

- Survival tools: `compass`, `flint-striker`, `water-filter` (sand and charcoal in a thimble), `snare`, `noise-line`,
  `rope-coil`, `ladder`, `splint`, `drying-rack`, `rain-catcher`, `tarp-shelter`.
- Cemetery: `wreath-wire`, `petal-bundle` (medicine), `grave-lantern`, `headstone-giant` (a cliff-sized stamp), `urn`,
  `crypt-door`, `funeral-ribbon`, `memorial-candle-giant`.
- Building: `plank`, `plank-wall`, `barricade`, `garden-bed`.
- The Hatless are **not** prefabs: they are `@lawn/gnome` models (hat slot empty) with moss materials. Only
  `moss-clump` (a pickup) is a prefab.
