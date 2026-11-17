# Open world: how Gnomomia's world fits together

Fescue is one continuous world. You walk from Mossbottom to the Verge without a loading step, and from a raised floor
you see every player and everything out to the fog (about 640 m). Interiors are instances. This page explains the
architecture and why it is shaped this way.

## One coordinate space, zones as authoring units

- **Zones stay as they are written.** Each `src/data/zones/*.ts` is authored around (0, 0), and so is every NPC,
  spawn, object, quest point and `travel` action placed in it. Nothing in the content had to be rewritten.
- **The layout places the zones.** `src/data/layout.ts` gives each zone an origin, the world position of its centre.
  The squares never overlap. The gaps between them are the Wilds.
- **The loader moves everything once.** `content.ts` (pass 3) shifts every position by its zone's origin, copying
  objects rather than editing them in place. At runtime the game only ever sees world positions.
- **A zone is a place, not a level.** `state.zone` is the zone whose square you stand in (`terrain.zoneAt`). In the
  Wilds it keeps the last one. Quests (`state.zone === o.zone`), NPC placements, spawns and respawn shrines all keep
  working unchanged.

```
x:  -340      -160  -80  0  40    120    280
     |  Verge (-20,-1020)                   |
     | Rockery (-180,-760)    Hedgewood (160,-680)
     | Cloverfield (-210,-490)  Keep (0,-440)
     |                    Thatchford (0,-240)
     |                    Mossbottom (0,0)      Deeps instance: (0, 3000)
```

## Instances are just far away

Interiors (the Drainpipe Deeps and every house) are ordinary zones with `indoor: true`, parked at
`z = WORLD.instanceZ` (3000 m) and beyond. That is far outside the overworld's view distance, so nobody inside sees out
and nobody outside sees in. No second scene and no special network channel are needed. Exits into or out of an instance
(and the hatches inside one) still teleport.

**House interiors** are generated, not written: content.ts (pass 2b) makes one indoor zone `<zone>/<house id>` per house
from a shared room template (`src/data/interiors.ts`), gives it its own origin on a grid 1 km apart starting at
(2000, 4000) (so no house sees another, or the players in it), and joins it to its house with a doormat exit each way.
terrain.ts gives a room a flat floor with a dark pit round it, its wall and furniture colliders, and no flora;
`src/interiors.ts` builds the walls and furniture only for the room you are in.

## Terrain: one height field (`src/terrain.ts`)

terrain.ts is pure data (no three.js), so the renderer, the player, enemies, pathfinding, the camera and the content
linter all agree on the same answers.

- **Heights blend at borders.** Each zone keeps its own rolling hills, flattened regions and lakes. Near a border,
  neighbouring zones' heights blend over `WORLD.blend` (40 m), and the Wilds use plain hills.
- **A ridge separates zones.** It is `WORLD.ridge` (9 m) high over the last 28 m of every zone and across the Wilds.
- **Roads cut passes.** An exit between two outdoor zones is no longer a teleport. It marks where the road leaves the
  zone, and the two matching exits are joined by a road. Along it the ridge is cut away and the road becomes a
  causeway that never sits below 0.4 m.
- **Story gates are real gates.** A pass is open when both exits' `when` conditions hold (Mossbottom → Thatchford
  opens after the Mole King). A closed pass has a gate across it (`dressing.ts`) and blocks walking.
- **Walkable areas.** You can walk inside a zone's square (more than 2 m from its edge) or on an open pass road. The
  Wilds and zone edges are off limits. That keeps the story's order while still letting you see across.
- **Raised floors (decks).** `ZoneDef.decks` adds axis-aligned platforms on posts, each with one ramp. `surfacesAt`
  lists the ground plus any deck or ramp above a point. `standY(x, z, fromY)` says where a walker at height `fromY`
  ends up (within a 0.6 m step) or that it cannot go there. Railings come for free: a deck's edge has no surface
  within a step of the deck. Ground walkers pass under decks; the posts and ramp bodies are colliders.
- **Flora by chunk.** `chunkFlora(ci, cj)` places trees, grass and rocks in each 64 m chunk with a seed taken from the
  chunk, so the layout is the same every time and on every client. Colliders are created on first use, so blocking
  works even where nothing is drawn yet.

## Drawing: streamed chunks (`src/world.ts`, `src/dressing.ts`)

- **Terrain chunks.** Chunks of 64 m are built around the player, at most two per frame. Within 192 m they use 2 m
  cells and instanced flora; out to 640 m they use 8 m cells and no flora. Chunks are dropped beyond 704 m.
- **Set pieces are built once.** Houses, shrines, lakes, walls, decks, gates and teleport rings for every zone are
  built at startup. There are only a few hundred of them, and three.js culls what is off screen.
- **Sun, sky and fog follow you.** The sun and its shadow box follow the player, sky and fog blend to the theme of the
  zone you are in, and instances switch to dim indoor light.

## Living things near you (`src/zones.ts`)

- **Nearby zones are live.** The NPCs, enemy groups and world objects of every zone within 200 m of the player are
  spawned. They despawn beyond 260 m; enemies still fighting stay until the fight ends.
- **Enemies are synced per zone (`src/net/mmo.ts`).** A deterministic per-zone authority (lowest player id in or near the zone, with `ehand` handoffs) simulates enemies against all players in the zone and broadcasts snapshots (`esync`), kills (`ekill`), and dynamic spawns (`espawn`). Only the player who lands the killing blow gets XP, quest credit, and loot.

## Players: seen by distance (`src/net/*`)

- **Distance, not zone.** You see every other gnome within 450 m, whatever zone either of you is in. Name plates show
  within 60 m.
- **Height is sent.** The pose carries y, so someone on a deck is drawn on the deck (`NET_VERSION` 2).
- **The server is unchanged.** The room relays everything to everyone, which is fine at 40 players per shard.

## Next steps, in order of need

1. **Relay interest management (short-term scaling).** Sort players into zones or 64 m cells on `packages/mp-server` so `pos`, `comp`, and `esync` are only forwarded to players in view rather than broadcast to all 40 players in the room, and exempt `'gnomomia'` from `MATCH_MAX_MS` (30 min) in `packages/mp-server/src/matchmaker.ts`.
2. **Authoritative headless server (long-term client-server migration).** The current relay + per-zone authority model works for small-to-medium groups, but does not scale to crowded persistent shards due to:
   - **O(N²) broadcast fan-out** (`link.send(null, ...)` relays to the whole room; receiver filters by `remoteViewRadius`).
   - **Client trust** (`ehit` damage, `CharacterCard`, inventory, and quests are client-owned in `localStorage`).
   - **Authority churn** (tab-outs, disconnects, or zone-border crossings can drop transient DoTs or boss-phase timers during `ehand` handoffs).
   - **Incremental path when ready:**
     - Reuse the headless simulation already decoupled for `src/sim/` (Vitest) in a dedicated Node world server ticking active zones at 10–20 Hz.
     - Switch clients from sending outcomes (`ehit`, `card`) to sending intents (`move`, `attack(syncKey)`, `cast`), with server-side `GameState` persistence keyed by `CharacterCard.cid`.
     - Scale horizontally beyond one Node process via sharding (already 40/shard) or one worker per zone behind a WebSocket gateway.
3. Decks on more buildings (house interiors are done; see above).
4. **Enemies on decks.** Entities walk with `isBlocked` (ground only); give them `standY` so they follow you up a ramp.
5. **Snail-cart and robin travel** across the now-connected world (`travel` actions already take world positions).
