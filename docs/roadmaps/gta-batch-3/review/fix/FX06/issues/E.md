Epic: FX06 epic 1, issue E: everyone stands on the decks; one look per coast character (G3#1, G3#2, G3#3, D58)
Depends on: none (dev port 5520)

## Goal
- On Saltbucket Boardwalk the player, residents (Spun Sugar Sal) and vehicles stand ON the planks, not 22 cm inside them.
- Reel Ruth stands on the Long Spoon Pier (on the handle rail, rod over the side), not buried under the spur deck;
  one or two crew stand on the Bathtub Queen's deck (a mop, a lookout).
- Driftwood, Marram Teaspoon and Captain Samphire Bilge each wear ONE look everywhere (the cutscene cast preset), and
  Ruth no longer wears Driftwood's colours.

## Already done by the lead (use it)
`src/ambientGnomes.ts` `AmbientGnomeDef` now has `y?: number` (absolute feet height, wins) and `surface?: 'rooftop'`
(stand on the highest walkable rooftop over (x, z): the pier spur/handle/bowl at y -3.0, the Queen's deck at -3.0,
and the boardwalk once you register it; falls back to the ground). `ambientFeetY(def)` resolves it each frame.

## The problem today
- `src/coast/boardwalk.ts` `buildBoardwalk`: `deckTop = y0 + bw.deckLift` (0.22, `src/coast/config.ts`), where
  `y0 = heightAt(centre)` of the flat `boardwalk` site; the deck is drawn but nothing walks on it: player, ambient
  gnomes and cars use `groundAt`/`heightAt` = the ground under the planks. The pier (`buildPier`) already registers its
  decks with `addRooftop({ id, name, minX, maxX, minZ, maxZ, y, solid: false, parapet: false })` (guarded by
  `rooftopById(id)` so a second build in tests does not throw); `terrain.ts groundAt(x, z, y)` stands bodies on such
  rooftops (`rooftopSurfaceBelow(x, z, y + SKYWAY.step, false)`).
- `src/coast/life.ts` `COAST_RESIDENTS`: Ruth ('coast-angler-spur') at (232, 1125) inside the spur rect
  (x 210-304, z 1120-1130, deck y -3.0) while posed on the ground (~-4.2); Sal at (-152, 1112) on the boardwalk.
  The comment above COAST_RESIDENTS says deck residents stand beside decks: now untrue, fix it.
- Looks: `src/cutscene/cast.ts` `CAST.driftwood` (teal 0x4f9d92 hat, sand 0xd9c79e shirt), `CAST.marram` (0xe8b83a hat,
  0x2f7f8f shirt, pigtails), `CAST.samphire` (0x2c3e50 hat, 0x3b2a1a shirt). Elsewhere: `src/quests/coastQuests.ts`
  `MARRAM_LOOK` (matches), `DRIFTWOOD_LOOK` (khaki 0x8a7a55 / 0xb0a07a: wrong), `BILGE_LOOK` (0x2b2b3a / red 0xd8342c:
  wrong); `src/coast/pirateShip.ts` `kit.npc({ id: 'samphire', look: { hat: 0x2b2b3a, shirt: 0xd8342c, ... } })`
  (wrong); `life.ts` residents Marram (blue/white: wrong), Driftwood (sand hat, green shirt: wrong), Bilge (matches);
  Ruth wears exactly Driftwood's cast colours (teal/sand).

## Read first
`src/coast/boardwalk.ts` (180-369), `src/coast/config.ts` (1-80), `src/coast/life.ts` (all), `src/cutscene/cast.ts`
(1-60, 90-120), `src/quests/coastQuests.ts` (1-30), `src/coast/pirateShip.ts` (150-185), `src/interiors/rooftops.ts`,
the tests `src/coast/*.test.ts`. Lore: `npm run lore -- find ruth`, `docs/lore/entries/apocrypha/reel-ruth.md`,
`the-bathtub-queen.md`, `samphire-bilge.md`, `docs/lore/canon.md` (skim), `docs/lore/rulings.md` (format of the last
ruling, R-237).

## Change
1. Boardwalk deck (G3#1), `boardwalk.ts`: register the promenade as a walkable rooftop at `deckTop` (id
   `saltbucket-boardwalk`, same guard as the pier). The three stair flights at STAIR_X and the ramp to the spur must
   still let a walker step up (the deck is 0.22 above the ground; check `SKYWAY.step` in `src/config.ts`). Keep
   `deckLift` 0.22 unless a lower lift is clearly better (then change only `COAST.boardwalk.deckLift` in config.ts and
   keep the planks from z-fighting the ground). Re-check: Sal, the vignettes (`surfaceY('boardwalk')` already adds
   deckLift), the lamps/stalls/benches and any parked or spawned cars on the rect (grep `1092`/`boardwalk` in
   `src/coast/` and `src/traffic*`/`parked*` to find them; read only, report if something outside your files needs a
   change).
2. Residents (G3#2), `life.ts`: Sal gets `surface: 'rooftop'`. Ruth moves onto the pier handle by the west or east
   rail (handle x 296-304, rails 0.45 m inside; z between 1140 and 1230), facing out over the side, `surface:
   'rooftop'`, idle 'fish' (check that the fishing pose's rod points over the rail; pick the yaw that does). Add one or
   two Bathtub Queen crew on its deck (`COAST.ship.deck` x 276-324, z 1260-1276, y -3.0; keep clear of the
   `COAST_VIGNETTES` ship props and the cabin door at (288, 1268)): a deckhand with a mop (idle 'sweep') and/or a
   lookout (idle 'look-around'), `surface: 'rooftop'`. Search the lore for existing crew names first and use them;
   if there are none, name them in the setting's voice (gentle humour, the HOA as the butt of jokes) and record them
   (see 4). Bubble lines: short, one joke each, in the voice of the existing lines. Remove the old "beside the deck"
   comment. Marram stays at the Spokewheel (no time-of-day switching: no new systems).
3. One look per character (G3#3): export nothing new from cast.ts unless needed (`CAST` is exported). In
   `coastQuests.ts` replace the three `*_LOOK` constants with `CAST.marram.look`, `CAST.driftwood.look`,
   `CAST.samphire.look`; in `pirateShip.ts` the samphire npc uses `CAST.samphire.look`; in `life.ts` Marram,
   Driftwood and Bilge residents use the cast looks. Watch for import cycles (cast.ts imports quests/types,
   voice/voices, golf/types, sports/types: check `npx tsc` and the tests; if a cycle bites, import `CAST` lazily
   inside a function or move nothing and report). Recolour Ruth to a look of her own that keeps the lore's "glasses, a
   grey beard" (e.g. a rust or mustard oilskin sou'wester hat and a navy jumper); check it against every CAST preset
   so it is nobody else's.
4. Lore (GR1: positions and colours change the lore): update `docs/lore/entries/apocrypha/reel-ruth.md` (look + where
   she stands: "on the Long Spoon Pier's handle"; keep the voice) and append ONE ruling `## R-239` to
   `docs/lore/rulings.md` in the existing format covering: Ruth's new look and spot, the Queen's deck crew (names, if
   new), and "Driftwood, Marram and Samphire Bilge wear their cast looks everywhere". If you create new crew, add a
   short entry for them only if the lore index expects one for named residents (look at how other coast residents
   are recorded). `npm run lore` must pass.
5. Tests: a new `src/coast/castLooks.test.ts`: the three coast characters resolve to their cast preset look in all
   four places (cast, coastQuests dialogue lines' `look` for that speaker, pirateShip cabin npc if it is reachable from
   a pure export (else assert on the quest + residents only, and say so), and `COAST_RESIDENTS`); Ruth's look differs
   from every CAST preset look. Extend `src/coast/life.test.ts` / `boardwalk.test.ts`: Ruth and the crew resolve via
   `ambientFeetY` to the deck y (register rooftops by calling the builder or `addRooftop` in the test); a point on the
   boardwalk resolves `groundAt(x, z, deckTop + 0.1)` to deckTop.

## Done when
- `cd games/gnome-theft-auto && npx vitest run src/coast src/quests` passes; `npm run lore` (repo root) passes;
  `npx tsc --noEmit -p games/gnome-theft-auto` clean in your files.
- Screenshots (dev server on 5520) vs `...\shots\G3\`: `a02-bwmid` (0, 1115 facing west, yaw -Math.PI/2),
  `b09-sal` (about -152, 1118 facing north, yaw Math.PI), `a06-spur` (240, 1125 facing east), Ruth on the handle, the
  Queen's deck from the bowl (300, 1250 facing south, yaw 0), and `p01-phone-bw` (`--size 390x844` on the boardwalk).
  Boots on the planks; Ruth and the crew visible on their decks.

## Out of scope
`ambientGnomes.ts` (another worker edits its bubble code; you only use `y`/`surface`), every file not listed above.
