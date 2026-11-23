# Credits

No external assets. Everything DayG shows is one of these:

- `@lawn/prefabs` prefabs (CC0 or self-generated, see `docs/assets.md`). Item and scenery ids used by DayG:
  - Items (each item's prefab id is its item id): acorn-club, blackberry, bread-loaf, bucket-helm, button, candle,
    cheese-wedge, clay-chunk, clay-jar, crab-apple, flint-striker, glaze-pot, gold-coins, hand-fork, ladder, loot-sack,
    moss-clump, old-trowel, red-mushroom, rope-coil, salt-pinch, seed-cake, slug-slime, spider-silk, spigot-water,
    stone-chunk, stout-tankard, thorn-dagger, timber-log, tin-pail, torch, twig-bundle, wool-scarf.
  - Containers (`src/config.ts`, CONTAINER_PREFAB): flower-pot, compost-bin, wicker-basket, crate, sack, wooden-chest,
    loot-sack.
  - Scenery: campfire, rain-catcher, standpipe.
- `@lawn/gnome` models: the player's gnome (`loadMyGnome`, `createGnomeModel`), the Hatless (`scene/hatless.ts`) and the
  NPC gnomes (`scene/gnomes.ts`, `scene/npcActors.ts`).
- Boxes and ground, stone and sky shapes generated in code (`scene/worldBuilder.ts`, `scene/sky.ts`).
