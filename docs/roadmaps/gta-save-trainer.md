# GTA: Save Trainer

Request: "modify save import/export into save trainer pop-out that gives access to configure all character settings and
set/reset character traits and spawn in stuff. this will be used for debugging things and trying things out. also
should give option to play cutscenes."

Goal: the Options > Experimental save buttons become one **Save Trainer** pop-out (games/gnome-theft-auto/src/trainer/)
with tabs: Save, Character, Spawn, Garage, World, Cutscenes, Animations. Built as a registry so later systems plug in.
Import/export keep the same file (`gta-save.json`) and format (`gta-save/v1`); old exports still import.

## How to open it

- F9 or ` (backquote) on a keyboard (keys.ts `trainer`, `trainerAlt`).
- Options (gear, O, or Start on a pad) > Experimental > **Save Trainer** (pad: D-pad to it, A).
- `?debug`: a 🛠 button under the options gear, always shown. `?trainer` or `?trainer=<tab id>` opens it at start.
- In the panel: tap / click; pad: D-pad up/down moves focus, left/right or LB/RB switch tabs, A activates, B or Start closes; Esc closes.

Cost when closed: `trainer/install.ts` (key listener, event listener, the ?debug button) is all that loads. The panel,
sections and their imports are a lazy chunk loaded on first open; no per-frame work at all while closed (the pad loop
runs only while open).

## Cloud save and achievements (decision)

- Trainer edits to progress (quests, Acorns, hunting, Lock-Up, raw keys) go through the normal save keys and sync like
  normal play. Before the FIRST such edit on a save, the trainer copies the whole bundle to `gta-trainer-backup-v1`
  (this device only); Save > "Restore pre-trainer backup" re-imports it.
- `gta-trainer-v1` (new, in `GTA_SAVE_KEYS`, merge = newer wins) marks a trained save: count, first/last time, last 20
  changes. It travels with exports and the cloud copy; only Reset clears it. The panel header shows "Trained save".
- Save > "Cloud sync: paused" (`gta-cloud-paused-v1`, this device only, `cloudSave.ts` `setCloudPaused`) stops pulling
  and pushing entirely. Needed for quest rewinds while signed in: the cloud merge keeps the furthest quest progress.
- Achievements (`@lawn/achievements`) are account-wide and shared by every game: the trainer only READS them. Their gear
  (and every other wearable prefab) can be tried on for the session (Character > Gear try-on); nothing is saved.
- Perk grants/revokes (`perks.ts`) are per device already (`gta-perks-v1` is not in the bundle): no mark.
- Session-only (never marked): health, heat, spawns, props, weapons and session gun mods, time of day, teleports, cutscenes, animations.

## Shape

| Epic | Done when | Issues |
| --- | --- | --- |
| 0 Foundation (planner, done) | tsc clean; `vitest run src/trainer src/saveIO.test.ts src/cloudSave.test.ts src/keys.test.ts` | written by the planner |
| 1 Panel and sections | `npm test -w games/gnome-theft-auto`; tsc; build at the end (orchestrator) | 8, parallel |

Foundation (written directly, verbatim code): `trainer/types.ts` (TrainerCtx, TrainerSection, TrainerSpawnable,
TrainerSpot), `trainer/registry.ts`, `trainer/mark.ts` (+ `mark.test.ts`), `trainer/aim.ts`, `trainer/ui.ts`,
`trainer/install.ts`, `trainer/sections/index.ts`, stubs for `trainer/panel.ts` and every section file.

Hot-file edits (all small, additive):
- `saveIO.ts`: `'gta-trainer-v1'` added to `GTA_SAVE_KEYS`. `saveIO.test.ts`: the round-trip fixture has it.
- `cloudSave.ts`: `MERGES['gta-trainer-v1'] = null`; `CLOUD_PAUSE_KEY`, `cloudPaused()`, `setCloudPaused()`, an early
  return in `startCloudSave` when paused, and the paused line in `cloudStatusText`.
- `keys.ts`: `trainer: 'F9'`, `trainerAlt: 'Backquote'`.
- `options.ts`: the Experimental export/import/paste/reset block (and its saveIO import) replaced by one "Save Trainer"
  button (dispatches `gta:trainer`).
- `app.ts`: `import { installTrainer } from './trainer/install'` and one `installTrainer({...})` call just before the `?debug` block.

## Epic 1 issues (one haiku-worker each, all in parallel)

Each issue file is complete; `_env.md` is the shared environment every issue starts from.

1. [1-panel.md](gta-save-trainer/1-panel.md): `trainer/panel.ts` (tabs, badge, gamepad, Esc).
2. [2-save.md](gta-save-trainer/2-save.md): `sections/save.ts`.
3. [3-character.md](gta-save-trainer/3-character.md): `sections/character.ts`.
4. [4-progress.md](gta-save-trainer/4-progress.md): `sections/progress.ts`, `trainer/progressEdit.ts` (+ test).
5. [5-spawn.md](gta-save-trainer/5-spawn.md): `sections/spawn.ts`.
6. [6-spawn-extras.md](gta-save-trainer/6-spawn-extras.md): `sections/spawnExtras.ts`.
7. [7-garage-world.md](gta-save-trainer/7-garage-world.md): `sections/garage.ts`, `sections/world.ts`.
8. [8-cutscenes-anims.md](gta-save-trainer/8-cutscenes-anims.md): `sections/cutscenes.ts`, `sections/animations.ts`.

Files per issue are disjoint. Cross-issue calls go only through stubs that already have their final signatures
(`buildStoryEditor`, `buildHuntEditor`, `buildSpawnExtras`, `closeTrainerPanel`, `refreshTrainerTab`).

## Extension points (for the birding and hangar/boathouse workstreams)

Register from your own module at load time (import-light: `trainer/registry.ts` pulls in nothing):

```ts
import { registerTrainerSection, registerTrainerSpawnable } from '../trainer/registry';
import { heading, button, grid, note, status } from '../trainer/ui'; // inside build only

// A Spawn-tab group: one button per id. `at` = ground under the crosshair, `ctx` = TrainerCtx.
for (const s of BIRD_SPECIES) {
  registerTrainerSpawnable('Birds', s.id, s.name, (at, ctx) => { birding.spawn(s.id, at.x, at.z); return `${s.name} spawned`; });
}

// A whole tab (built each time it is shown; order 45 puts it between Garage and World).
registerTrainerSection({
  id: 'birding', label: 'Birds', order: 45,
  build(el, ctx) {
    const st = status();
    el.append(st.el, heading('Bird book'), grid(button('Mark all seen', () => { birding.markAllSeen(); st.set('All marked seen'); })));
  },
});
```

If the module needs live objects the TrainerCtx does not carry, add a field to `TrainerCtx` (trainer/types.ts) and
pass it in the `installTrainer({...})` call in app.ts. A change that writes saved progress calls
`markTrainerModified('what')` from `trainer/mark.ts`. A new save key goes into `GTA_SAVE_KEYS` and `MERGES` as before.
The Garage tab already lists every `STORAGE_KINDS` kind through `lockup.list(kind)`, so hangar and boathouse contents
show without changes; estates (deeds) can get their own block or section the same way.

## Not done / later

- No weather to set (Turfton has none); World says so.
- Spawned vehicles and critters cannot be despawned from the trainer (no public remove for them); props can.
- Achievements are read-only by design (see above).
