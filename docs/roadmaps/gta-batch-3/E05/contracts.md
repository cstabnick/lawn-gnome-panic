# E05 contracts: interiors and rooftops

What E05 gives every later batch-3 epic (E10 homes, E11 coast, E13 campus, E15 clubhouse, E17 underground, E18 and
E24 kitchens and stages, E20+ story). Code: `games/gnome-theft-auto/src/interiors/` (import from `./interiors` or the
file). World coordinates: +x east, +z south, metres. "Local" = inside one interior, origin at the room centre on the floor.

## Defining an interior

```ts
import { defineInterior } from '../interiors';

defineInterior({
  id: 'uni-library',                          // stable: saves, quests and online use the id
  name: 'Rootwell Library',
  door: { x: 1100, z: -210, yaw: 0 },         // world: where "Enter <name>" shows (outside the building, on walkable ground)
  exit: { x: 1100, z: -208, yaw: 0 },         // world: where the player is put on leaving
  size: { w: 20, d: 14, h: 5 },               // inner room size; > 180 on a side = a large pocket (max 600)
  theme: 'office',                            // 'shop' | 'club' | 'flat' | 'office' | 'burrow' | InteriorTheme colours
  ambience: 'campus',                         // optional: a biome ambience bed heard inside, or 'silent' (default)
  prompt: 'Enter the library',                // optional (default `Enter <name>`)
  locked: () => (ownsProperty('x') ? null : 'Locked.'),   // optional: a reason keeps the door shut (toast)
  hiddenDoor: false,                          // optional: true = no world door (reached by enterInterior / a lift only)
  onEnter() {}, onLeave() {},                 // optional
  build(kit) {                                // called on EVERY entry: the room is built on entry, disposed on leaving
    kit.room();                               // floor, walls (colliders), ceiling; walls are see-through from outside
    kit.door(9.8, 0, -Math.PI / 2);           // the way out ("Leave <name>") + default spawn 1.5 m in front
    kit.put('bookshelf', -9, 3, Math.PI / 2); // a @lawn/prefabs prefab on the floor (collider from its bounds)
    kit.put('ledger', 2, 1, 0, { y: 1, solid: false });      // on a table top
    kit.block(3, 1, 1, 0, -5, { color: 0x6d4c41 });         // architecture only (counters, a dais)
    kit.window(-4, -6.95, 0);                 // a pane on the north wall, day/night tinted
    kit.sign('QUIET PLEASE', 0, 2.5, -6.95, 0, { w: 2, h: 0.5 });
    kit.npc({ id: 'librarian', name: 'Librarian', x: 1, z: -4, yaw: 0, line: 'Shh.' });   // "Talk to" spot when line given
    kit.spot({ id: 'desk', x: 1, z: -3, prompt: 'Borrow a book', run: () => { /* ... */ } });
    kit.stairsTo(-9, -5, 'uni-library-upper', 'Go upstairs');                 // to another interior
    kit.stairsTo(-9, 5, { x: 1100, y: 30, z: -220, yaw: 0 }, 'Roof access');  // out to a world point (a roof)
  },
});
```

Rules: define at import time from your own module and import it once (e.g. from your epic's index, or add it to
`src/interiors/index.ts`'s showcase list only for E05's own rooms). Objects are prefabs (`kit.put`), per AGENTS.md.
Keep rooms at least ~10 x 8 m so the follow camera has room. A spot's `run` may toast through
`window.dispatchEvent(new CustomEvent('gta:interior-say', { detail: { name, line } }))`.
Furniture slots: E05 has no slot system; `showcase/flat3b.ts` exports `FLAT_3B_FURNISH_SLOTS` (local poses) for E10,
which rebuilds the flat's `build()` from its own furniture state (the room is rebuilt on every entry, so a changed
layout shows next time in).

## Runtime (module functions; the game installs one runtime in app.ts)

```ts
enterInterior(id): boolean          // false when locked, wanted (heat >= 1), in a vehicle, unknown, or mid-fade
leaveInterior(to?: { x, y, z, yaw }) // to the def's exit, or to a world point (y = stand height, e.g. a roof)
currentInterior(): string | null
onInteriorChange(cb: (id: string | null) => void): () => void   // safe to call at import time
interiorToWorld(id, lx, lz): [x, z]  // local -> world (call at run time, not module top level)
interiorById(id), listInteriors(), interiorAt(x, z), onInteriorDefined(cb)
isInteriorPoint(x, z)                // x >= 5000 (INTERIOR_MIN_X): interior space
```

- Doors: every defined interior gets a world door prompt through `interactables.ts addInteractSpot` (E key, gamepad,
  and the touch action button, which now shows the first word of any E prompt: "Enter", "Buy", "Sit"...).
- Pockets: interior n (definition order) is centred at (5100 + (n % 8) * 200, 0, 5100 + floor(n / 8) * 200); large rooms at
  (5350 + (k % 4) * 700, 0, 12350 + floor(k / 4) * 700). Floors are at y 0 (`terrain.ts heightAt` returns 0 and
  `waterAt` null at x >= 5000). `clampToWorld` never pulls a body in interior space back onto the map.
- **Large underground cell (E17): supported.** A mole hall up to 600 x 600 m is one interior (`theme: 'burrow'`). Several
  linked halls are interiors joined with `kit.stairsTo(..., '<other id>')`. The surface above is not tunnelled.
- While inside: the world (traffic, gnomes, Hat Watch, atmosphere, minimap marker, online pose) runs round the
  interior's `exit`, like the Pay 'n' Glaze stage; quests see the real position. The indoor light is the scene's
  hemisphere tinted to the theme (no new three.js lights). Unlocks `gta-home-sweet-hovel` on entry.
- Online: a player inside is relayed standing still at the interior's exit (no protocol change, `POS_BOUND` unchanged);
  shared rooms are not supported yet.
- Police and vehicles: doors refuse vehicles and wanted players, so nothing chases into a pocket. Weapons are not
  holstered inside (E18 may add it).
- Save: the game has no position save; if E07 adds one, store `currentInterior()` and place the player at that
  interior's `exit` on load.

## Quest gate (`quests/types.ts`)

Optional `interior: <id>` on `GiverDef`, the `visit` objective and `CheckpointDef`. When set, the position (`x, z,
exit` / `at`) is **local** to that interior; the map blip points at the interior's door until the player is inside;
the quest simulator treats it as reachable. This is E04's "interior-visit" objective type:
`{ kind: 'visit', text, at: [0, -3], radius: 2, hint: 'Bodega & Sons', interior: 'bodega' }`.

## Rooftops (`interiors/rooftops.ts`)

```ts
interface Rooftop { id; name?; minX; maxX; minZ; maxZ; y; solid: boolean; parapet: boolean | ('n'|'s'|'e'|'w')[]; pad?: { x, z, r } }
ROOFTOPS: readonly Rooftop[]
addRooftop(def): Rooftop            // before buildRooftops runs to get parapets built; otherwise build your own
rooftopById(id), rooftopAt(x, z, y, tol = 0.6), rooftopSurfaceBelow(x, z, maxY, includeSolid = true)
landingPads(): { id, name?, x, y, z, r }[]   // for the map and missions ("land on the Thorne Helipad")
```

- Every downtown tower roof is a rooftop (`solid: true`: the tower box already holds the player; the entry lets
  aircraft land, `craft/aircraft.ts floorUnder`), id = landmark id or `tower-<n>`, with a 1.1 m parapet; towers with a
  helipad crown have a `pad`.
- `double-pot-slab` ("Thorne Helipad (the Double Pot)"): the tunnel-roof slab, y 9, `solid: false` (no collider: the
  street runs under it; `terrain.ts groundAt` stands bodies on it only when their height is known), pad at (120, -92) r 7,
  parapets on its two open ends, a lift kiosk to the Thorne Even-Estates sales floor.
- A box-less roof your epic adds (`solid: false`) is walkable at once; a building with a box collider of its own uses
  `solid: true` so only aircraft read the entry. Getting up: by aircraft, or a lift (`kit.stairsTo(x, z, { x, y, z, yaw })`
  from an interior, and an `addInteractSpot({ x, z, y, prompt, run })` with `y` on the roof to come back down;
  `y` keeps people on the ground below from seeing the roof prompt).
- Achievements: `gta-roof-rat` (land an aircraft on a roof), `gta-rooftop-run` (stand on 5 different roofs,
  localStorage `gta-roofs-visited-v1`).

## Showcase interiors (ids)

`bodega` (Bodega & Sons, door (-79.5, 92)), `mulch-club-lobby` (members' side door (-30, -17.5); the front-door quest
giver is unchanged), `flat-3b` (Flat 3B, Saucer Court, door (30, 112.6), unfurnished, unlocked: E10 locks and furnishes
it and may move the door with its block rebuild), `double-pot-sales` (Thorne Even-Estates sales floor, door in the
Double Pot Tunnel at (112.4, -84), lift to the slab). Lore: rulings R-170, R-171.
