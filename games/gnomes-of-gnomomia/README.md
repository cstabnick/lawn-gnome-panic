# Gnomes of Gnomomia

An old-school, click-to-move 3D RPG with gnomes: Elder Scrolls rules (skills that grow when you use them, ten skill-ups to a level) with a RuneScape feel (click to walk, right-click menus, hitsplats, a 28-slot inventory).

The question it answers: is a small, quest-driven gnome RPG fun to click around in?

## Run

```
npm install
npm run dev -w games/gnomes-of-gnomomia   # http://localhost:5291
```

## Play

- **Left-click** the ground to walk; click an enemy to attack, an NPC to talk, a loot pile to take it.
- **Right-click** anything for its menu (Attack, Talk-to, Take, Examine, Walk here).
- **Arrow keys**, **middle-drag** or a **left-drag** turn the camera; the **wheel** zooms.
- **Tutorial**: a new character gets a short step card (walk, talk, cast, menus, growth) from `src/ui/tutorial.ts`; Skip or finishing sets the `tutorial-done` flag so it never returns.
- **1-8** use the hotbar: Flare and Mend on 1-2, class abilities after your Calling in Thatchford (right-click a slot to assign).
- The side panel has tabs for the inventory, worn gear, stats, quests, spells and talents (key T).

### On a phone or tablet

- **Tap** to walk, attack, talk or take; **long-press** anything (ground, hotbar slot, inventory item) for its menu. A long-press on an item also shows its tooltip.
- **Drag one finger** to turn the camera, **pinch** to zoom.
- Phones (either way up) get a compact layout: hotbar at the bottom, the chat log above it, and the side panel behind the **🎒** button in the top-left row next to **💬** (chat). The chat line opens at the top so the keyboard never covers it. The layout lives in `src/ui/layout.ts`.

Start by talking to Elder Fernwick by the well in Mossbottom.

## Online (MMO)

After the title you join the one shared world on the matchmaking server (`packages/mp-server`, game id `gnomomia`): everyone in the public queue drops into the same running room; when it is full (40) the next player opens a new shard.

- You see every other gnome within 450 m, in any zone, at their real height (on a deck or the ground); name, level, class and HP show over the heads of those within 60 m. The pill top-left shows who is near and online; click it for the list.
- **Enter** or the **💬** button opens the chat line (world-wide), with a Send button and one-tap quick lines. What a gnome says also shows in a speech bubble over their head for a few seconds (yours too; others' within 60 m). Commands: `/name <new name>`, `/who`, `/offline`, `/online`.
- **Who owns what:** each player owns their own character (`src/state.ts`, saved in localStorage as before) and relays a public card (level, class, HP) and their position (`src/net/protocol.ts`). Enemies, loot and quests stay per player. Nothing is authoritative yet, so it is trivially cheatable; moving characters to the server means the server keeps `GameState` by the card's `cid` (a per-browser character id) and builds the card itself.
- Local play: `npm run dev -w packages/mp-server` alongside the game (it uses ws://localhost:8787/ws), or `?mp=ws://host/ws`. `?offline` skips joining.

## The world (Fescue)

Seven zones plus the three-wing Drainpipe Deeps, levels 1-30: Mossbottom Vale, Thatchford Downs, Birdbath Keep, Cloverfield, Hedgewood, the Rockery and the Verge. Eight story chapters end in the Battle of the Verge against the Mower; 14 side storylines change who stands with you there. The design lives in `docs/design/gnomomia/`.

**Open world.** The seven outdoor zones sit side by side in one continuous world (`src/data/layout.ts`), streamed in 64 m chunks around you with a view of about 640 m. Ridges separate the zones; roads cross them through passes, and a pass stays gated until the story opens it. Watchtowers and wall-walks (decks) let you climb up and look out. The Drainpipe Deeps is an instance: the stairs under the Keep still take you there. Zone files are still written around (0, 0); `content.ts` moves them into place. How it all fits: [docs/design/gnomomia/open-world.md](../../docs/design/gnomomia/open-world.md).

## Interiors and lore

- **Every house can be entered.** Click its doormat. A door only opens when you stop on the mat or walk to it, so walking past is safe. Each interior is an instance (like the Deeps) with the zone id `<zone>/<house id>` (for example `thatchford/tipsy-toadstool`, or `thatchford/h12` for an unnamed house), parked 1 km from every other one beyond the Deeps, so `?zone=` works for it too and only gnomes in the same house see each other.
- **Templates are shared, every house differs.** `src/data/interiors.ts` holds nine room templates (cottage, mushroom-home, hall, workshop, chapel, tent, tavern, library, shop) and picks one by house style. A seed taken from the zone id varies each house: palette, mirrored plan, which furniture fills each slot, clutter and a family name ("the Potherb cap-house").
- **Per-house uniqueness is data.** Add `id` and `interior: { template, name, seed, palette, add, remove, books }` to a house in a zone file, or place NPCs and objects with `zone: '<zone>/<house id>'` (room coordinates, door at +z). Generated furniture keeps clear of anything a pack puts there. `interior: false` keeps a house shut. Doors that face a neighbour, water, a wall or a deck are turned to a clear side automatically.
- **Lore.** Packs add `books` (book, journal, letter, note, scroll, plaque). Bookshelves and lecterns in interiors hold the house's own `books` first, then random `common` books (narrowed by `where`). Any object with `book` opens the reader. Everything you have read is in the Lore tab (L).
- The lore packs are `src/data/packs/lore-*.ts`; the room meshes are built in `src/interiors.ts` only while you are inside.

## Rules (src/rules.ts, src/combat.ts, src/progression.ts)

The formulas are in `docs/design/gnomomia/combat.md`. In short: XP from kills and quests raises your level (cap 30); skills still grow by use but are capped at 5 + 4 × level; to-hit is a d20 against the target's level and defense; armor is percentage mitigation; damage types meet creature families (Crush cracks shells, Sun burns plants); three classes (Warden, Slinger, Hedge-Mage) each have 3 talent branches.

## Files

- `config.ts`: types and tuning only.
- `src/data/`: all content. `packs/*.ts` (one per chapter or storyline) and the zones (JSON level documents in `data/levels/<zone>.level.json`, loaded by `zones/*.ts`), merged by `content.ts`; `data/README.md` lists the canonical ids and zone layouts. Edit zones in the level editor (`npm run level-editor`) or by hand; after changing zone data run `npm run bake-walk` (the walkability bake; `build` fails when it is stale).
- One system per file (`combat.ts`, `zones.ts`, `quests.ts`, `talents.ts`, `mower.ts`, ...); `main.ts` only wires them.

## Prefabs (`@lawn/prefabs`)

Use `@lawn/prefabs` whenever possible for 3D game objects — held props, consumables, equipped gear, furniture, outdoor props, pickups, and item icons — instead of hand-building raw Three.js geometries in game code.

- **Check the catalog first**: `packages/prefabs/src/catalog/` already has ~190 prefabs (weapons, armor, consumables, food, materials, trinkets, tools, containers, furniture, props). Browse them in `npm run dev -w games/prefab-gallery` or search `packages/prefabs/src/catalog/`.
- **If a prefab does not exist yet**, add a `PrefabDef` to the matching file in `packages/prefabs/src/catalog/` (and run `npm test -w packages/prefabs`) rather than writing one-off `THREE.Mesh` builders in `games/gnomes-of-gnomomia/`.
- **Build & attach**: use `buildPrefab(id)` for standing objects, `buildHeld(id)` for items held in a hand or mouth (centred on `grip`), and `itemPrefab(def)` / `itemIcon(def, px)` (`src/itemArt.ts`) for UI icons and examine lines. Set `prefab: '<id>'` on an `ItemDef` when an item should bind to a specific prefab.
- **Never dispose prefab meshes**: geometries and materials are cached and shared across copies (skip any `userData.prefab` root during scene teardown).

## Checking content and balance

- `npm run lint:content -w games/gnomes-of-gnomomia` (or `node games/gnomes-of-gnomomia/scripts/lint-content.mjs [packId]`): ids nobody defines, broken dialogue links, quests nothing starts, NPCs or objects placed inside houses or lakes, exits that bounce you straight back.
- **Gameplay & balance simulations** ([docs/design/gnomomia/balance-sim.md](../../docs/design/gnomomia/balance-sim.md), roadmap in [docs/roadmaps/gnomomia-balance-sim.md](../../docs/roadmaps/gnomomia-balance-sim.md)): headless 2D arena and behavioral strategy agents (`TacticalPlayer`, `GreedyBerserker`, `PassiveTurtler`, `FaceTanker`, `KitingRanger`) that test combat formulas, class parity, and boss counterplay via `npm test -w games/gnomes-of-gnomomia` and `npm run sim -w games/gnomes-of-gnomomia`.
- **Scenario visualizer & demo rendering**: open `http://localhost:5291/?sim=boss-mole-king` (supports `policy`, `class`, `tier`, `level`, `seed`, `speed`, `cam`, `controls=0`, `nohud`) to watch any sim scenario in 3D with live telegraphs, hitsplats, and playback controls. Record MP4/GIF demos using the repo's demo generator (`npm run demo -- games/gnomes-of-gnomomia/demos/boss-mole-king.json --gif`) or in one command with `npm run sim:demo -w games/gnomes-of-gnomomia -- --scenario=boss-mole-king --gif`.
- In `npm run dev`, `?zone=<id>` (e.g. `http://localhost:5291/?zone=verge`) skips the title and drops a fresh character into that zone without touching your save. `bash tools/smoke.sh "http://localhost:5291/?zone=verge" game ui` checks a zone builds without errors.
- Freezes or stutters: add `?profile` (or `?profile=50` for a 50 ms threshold; the old `?hitches` still works) to the URL, dev or deployed. Every frame or long task over the threshold logs a `[hitch]` console warning naming the systems that took the time (e.g. `[hitch] frame 1650ms: updateCompanions 1643ms [zone=mossbottom]`); `__lawnProfile.summary()` in the console tables the worst systems, and `?profile=upload` sends the reports to the mp-server. Flags: `packages/profiler/README.md`. A Tone.js "Start time must be strictly greater than previous start time" error is a symptom of such a freeze, not its cause: notes scheduled during the stall all land on the same moment.
