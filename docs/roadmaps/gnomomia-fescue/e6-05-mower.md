Epic: 6, The Verge and the Battle of the Verge
Depends on: none

## Goal
The Battle of the Verge runs in three phases (Mud, Jam, Heartspark) against the giant lawnmower. Allies earned through the story change the fight.

## Read first
- `docs/design/gnomomia/quests.md`, Chapter 8 (allies table, phases, ending); `bestiary.md`, the Mower boss sheet
- `games/gnomes-of-gnomomia/src/mower.ts` (stub), `src/content.ts` (`ALLIES`, `ENEMIES`), `src/quests.ts` (`checkCondition`, `questStatus`), `src/entities.ts` (`spawnEnemyAt`, `allEntities`, `killEntity`), `src/combat.ts` (`dealDamage`, `healPlayer`), `src/state.ts` (`setFlag`), `src/ui/epilogue.ts` (`showEpilogue`)
- The ch8 pack's ids (written this epic by another worker): enemies `mower-wheel mower-deck mower-heartspark mower-rope`; objects `c8-valve-head c8-stone-socket c8-stake-point`; quest `c8-turning-blade`, whose stages are 0 reach, 1 interact `c8-valve-head`, 2 interact `c8-stone-socket`, 3 kill `mower-heartspark`, 4 talk `c7-marigold`. Flag `c8-phase` values: `ready`, `mud`, `mud-open`, `jam-wait`, `jam`, `heart`, `heart-wait`, `done`. The object positions are `c8-valve-head` (-20,-45), `c8-stone-socket` (0,-68) and `c8-stake-point` (0,-64).

## Change
`src/mower.ts`:

- **`initMower(scene)`** listens to `quest-updated` and `interacted`.
- **`allyActive(effect)`**: true when any `ALLIES` row with that `effect` passes `checkCondition(row.when)`.

### Start (stage 1 of `c8-turning-blade`, zone verge)
`startMowerBattle()` runs:
1. `setFlag('c8-phase','mud')`.
2. Spawn `mower-deck` at (0,-115).
3. Spawn 4 `mower-wheel` at the deck's corners (±5, ±4 offsets). Each frame, move the wheels with the deck. Damage to wheels before phase 2 is ignored: heal them to full each frame until `jam`.
4. Say: "The Shed door bursts. The Mower rolls out onto the Verge."

### Phase 1, Mud
- The deck rolls south from (0,-115) at 1.2 m/s and **stops at z = -75** (the battle line). It stays there for the rest of the fight. Only its moves reach further.
- Every 12 s, spawn 2 `grass-bag-moth` and 1 `rust-rat` near the player. With `moth-archers`, moths die after 6 s (`killEntity`).
- **Barricades** are the 3 `post` objects at (-15,-20), (0,-22) and (15,-20). You track their HP locally. Each has 3 HP (×2 with `barricade-hp`). Each Rolling Charge whose lane crosses a barricade's x takes 1 HP. With `sapper-rebuild`, a broken barricade returns after 20 s.
- **Lose condition:** if all 3 barricades are broken, say "It's through the line!", rebuild them, and restart the 90 s phase timer. There is no game over.
- **Holding the line:** after 90 s of phase 1, `setFlag('c8-phase','mud-open')` and say "Ida: The valve's ready! Turn it, now!". The `c8-valve-head` object only shows on `mud-open`.
- The phase ends when the player uses `c8-valve-head` (the quest stage completes on its own). Then:
  - `setFlag('c8-phase','jam')`.
  - Say "Water bursts across the Shorn. The Mower bogs down in mud."
  - Deck attack timers × 1.5 from now on (bogged).
  - Stop resetting the wheels.
  - With `wheel-dig`, set every wheel's HP to 75%.

### Phase 2, Jam
- `setFlag('c8-phase','jam-wait')` at the start of phase 2.
- Each destroyed wheel lengthens the deck's attack timers by a further 15%.
- At deck HP ≤ 50%, Mabel's cart rolls in. It's a box mesh you own, moving from (0,60) to (0,-66) at 3 m/s (5 with `cart-speed`).
  - While it rolls, the deck's lane moves aim at the cart's path. The cart can't be destroyed; it's there for drama.
  - With `lane-warning`, say each charge 1 s early ("Sedge: Left lane! Now!").
  - With `ramp-faster` (the Heap diggers), the cart gets +1 m/s more (stacks with `cart-speed`). Any other ally effect id you meet is ignored.
  - When the cart arrives, `setFlag('c8-phase','jam')`. That is when `c8-stone-socket`, which sits fixed at (0,-68) in front of the deck, shows. Before then, set the flag to `jam-wait` during phase 2, and switch to `jam` on arrival.
- When the player uses `c8-stone-socket`:
  - `setFlag('c8-phase','heart')`.
  - `killEntity(deck)` and the wheels, and put a static red mower mesh you own (same shape as the `mower` model, built locally) where the deck stood. This stops all deck moves.
  - Say: "The Stone catches in the blade. The Turning Blade shudders and stops."
  - Spawn `mower-heartspark` at (0,-70), on the ground in front of the static mesh.

### Phase 3, Heartspark
- **Drive the Stake:** each use of `c8-stake-point` does `dealDamage(heartspark, 900, 'crush', { noRoll: true })`. Then hide it for 20 s: set `c8-phase` to `heart-wait` and back to `heart`.
- **Rain:** rain damage to the heartspark counts double. Listen to `hit` events with `damageType === 'rain'` on the heartspark, and apply the same damage again with `noRoll`.
- **Pull the Rope:** at 70% and again at 35% heartspark HP:
  - Spawn `mower-rope` at (6,-72).
  - Say "The Rope tightens. It's trying to start itself."
  - Start a 30 s timer (+15 s with `rope-pin`; also say "The Gleaner drops out of the sky and pins the Rope!").
  - If the rope is still alive when the timer ends, heal the heartspark 25% (set its hp) and say "It coughs. It catches. It ROARS."
- **Death:** if the player dies during the battle and `revive` is active, the first death is cancelled: set HP to 40% and say "The Ant Thousand carry you back up the line." Hook `player-died`, or check `state.hp <= 0` before combat.ts respawns. Prefer listening to `player-died` and calling `healPlayer`.
- **`potions`:** at start, `addItem('ruby-draught', 2)` and say "Potsworth hands out the treasury's potions. His hands are shaking."
- **The end:** when the heartspark dies:
  - `setFlag('c8-phase','done')`.
  - Say "The Mower falls silent. For the first time in three thousand years, it's quiet."
  - Remove the static deck after 10 s.

### Epilogue
When `c8-turning-blade` is done, call `showEpilogue(root)`. Get the root with `document.getElementById('ui')`.

### `src/ui/epilogue.ts` (you own it too)
- `showEpilogue(root)`: a full-screen dark overlay, appended to root. It shows `EPILOGUE` lines (import from `../data/packs/ch8-finale`, relative to `src/ui/`) whose `when` holds, one card at a time, each fading in, with a Next button.
- Then a last card: "Fescue is quiet. Beyond the Fence, someone has just started a second mower." and a "Continue playing" button that removes the overlay.

## Contract
`startMowerBattle`, `updateMower` and `initMower` as stubbed; `showEpilogue(root)`. Start the battle yourself in `updateMower` when stage 1 of `c8-turning-blade` is active, `state.zone === 'verge'`, and the battle isn't running.

## Done when
- `npx tsc --noEmit -p games/gnomes-of-gnomomia`: no errors in mower.ts or ui/epilogue.ts.

## Out of scope
ch8-finale.ts, bossmoves.ts, entities.ts, combat.ts.
