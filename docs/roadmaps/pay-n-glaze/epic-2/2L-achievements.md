Epic: 2 (Gnome Theft Auto adopts Pay 'n' Glaze)
Depends on: none (epic 1 has landed: the five reward prefabs exist)

## Environment
Read `docs/roadmaps/pay-n-glaze/_common.md` and `docs/roadmaps/pay-n-glaze/epic-2/_common2.md` first. You own only: `packages/achievements/src/catalog.ts` (add entries at the end of the Gnome Theft Auto block; touch nothing else in it), `games/gnome-theft-auto/src/glazeAchievements.ts` (new) and `games/gnome-theft-auto/src/glazeAchievements.test.ts` (new).

## Goal
Pay 'n' Glaze achievements, each with a cosmetic reward for the gnome in every game, and the pure function that decides which ones a purchase unlocks.

## Read first
- `packages/achievements/src/catalog.ts` (the shape of an entry; read the `gta-bee-line` and `gta-captain-clay` entries near line 563; achievements with `target` are progress counters) and `packages/achievements/src/types.ts` (`AchievementDef`, `AchievementReward`: `slot` is `head | back | neck | hand`; `exclusive` marks a hard-to-get item).
- `packages/achievements/src/achievements.test.ts` (what the package test enforces, e.g. every reward prefab must exist: run it).
- `games/gnome-theft-auto/src/wildAchievements.ts` (how this game maps events to achievement ids) and how `app.ts` calls `achievements.unlock(id)` / `achievements.increment(id, by)`.
- The reward prefabs (they exist; ids exactly): `glaze-pit-crew-cap` (head), `glaze-chequered-scarf` (neck), `glaze-spray-bandolier` (back), `glaze-spray-can` (hand), `glaze-gold-spray-can` (hand).
- `packages/glaze/src/types.ts` (`Loadout`) and `packages/glaze/src/loadout.ts` (`defaultLoadout`, `isStockLoadout`).

## Change
- `packages/achievements/src/catalog.ts`: add these five entries (`game: 'gnome-theft-auto'`, `gameTitle: 'Gnome Theft Auto'`):
  1. `gta-new-coat`: title "New Coat. Who Dis?", description "Buy your first job at Pay 'n' Glaze.", reward `{ slot: 'head', prefabId: 'glaze-pit-crew-cap', label: 'Pit-Crew Cap' }`.
  2. `gta-slammed`: title "Slammed", description "Buy a ride height at the bottom of the dial.", reward `{ slot: 'neck', prefabId: 'glaze-chequered-scarf', label: 'Chequered Scarf' }`.
  3. `gta-camber-gang`: title "Camber Gang", description "Lean both axles in by 15 degrees or more.", reward `{ slot: 'back', prefabId: 'glaze-spray-bandolier', label: 'Spray-Can Bandolier' }`.
  4. `gta-show-pony`: title "Show Pony", description "Own a spoiler, a hood ornament, a seat, a spray and two extras on one vehicle.", reward `{ slot: 'hand', prefabId: 'glaze-spray-can', label: 'Spray Can' }`.
  5. `gta-full-glaze`: title "Full Glaze", description "Spend 1,000 Acorns at Pay 'n' Glaze.", `target: 1000`, reward `{ slot: 'hand', prefabId: 'glaze-gold-spray-can', label: 'Gold Spray Can', exclusive: true }`.
- `games/gnome-theft-auto/src/glazeAchievements.ts`: export
  ```ts
  export interface GlazePurchase { kind: VehicleKind; before: Loadout; after: Loadout; spent: number }
  export interface AchievementSink { unlock(id: string): unknown; increment(id: string, by?: number): unknown }
  export function glazeAchievements(p: GlazePurchase, sink: AchievementSink): void
  ```
  Rules (call the sink; unlocking an already-unlocked achievement is harmless): `spent > 0` -> `unlock('gta-new-coat')` and `increment('gta-full-glaze', p.spent)`; `after.rideHeight <= -0.95` and `before.rideHeight > -0.95` -> `unlock('gta-slammed')`; `after.camberFront <= -15 && after.camberRear <= -15` -> `unlock('gta-camber-gang')`; `after.spoiler !== 'none' && after.ornament !== 'none' && after.seat !== 'none' && after.decal !== 'none' && after.extras.length >= 2` -> `unlock('gta-show-pony')`. Nothing for a purchase that spent 0 (the shop's "nothing to change"). Also export `GLAZE_ACHIEVEMENT_IDS: readonly string[]` listing the five ids.
- `glazeAchievements.test.ts` (new): a fake sink recording calls; cover each rule (and each negative), `spent: 0` does nothing, `increment` receives `spent`, and `GLAZE_ACHIEVEMENT_IDS` equals the ids you added to the catalog (import `ACHIEVEMENTS` from `@lawn/achievements` and check each id exists with `game === 'gnome-theft-auto'` and a reward whose prefab exists via `getPrefab` from `@lawn/prefabs`).

## Contract
Achievement ids exactly as above. `glazeAchievements(p, sink)` as above (called by `app.ts` from the shop's purchase callback; another issue wires it).

## Done when
- `npx tsc --noEmit -p games/gnome-theft-auto` and `npx tsc --noEmit -p packages/achievements` pass.
- `npx vitest run packages/achievements games/gnome-theft-auto/src/glazeAchievements.test.ts` passes.

## Out of scope
Every other file.
