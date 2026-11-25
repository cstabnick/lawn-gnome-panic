Epic: E06-2 Fill (Sky, weather and time), issue 2E planes come and go (L20)
Depends on: none
Worker: haiku

## Environment
- Repo worktree: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\agent-af81e1111bb59e80b`, game `games/gnome-theft-auto`. Use absolute paths; Git Bash; if `node` is missing: `export PATH="/c/Program Files/nodejs:$PATH"`.
- Other workers are editing other files of this game at the same time. Only touch the files listed under Change. Do not commit. Keep LF line endings.

## Goal
User request (L20): "make some of the world stuff like the planes not always present and sometimes make appearances".
Today the looping sky behaviours (the banner tow above all) respawn 30-60 s after they leave, so one is up whenever the
player is near. After this issue each looping behaviour flies for a while, leaves, and stays away for minutes.

## Read first
- `games/gnome-theft-auto/src/skyTraffic/types.ts`: `interface SkyBehaviourDef` (line ~112).
- `games/gnome-theft-auto/src/skyTraffic/behaviours.ts`: `SKY_BEHAVIOURS` (ids: banner-tow, airfield-circuit, crop-duster, scenic-copter, sky-writer, news-copter, mail-drop, balloon, watch-copter, air-ambulance).
- `games/gnome-theft-auto/src/skyTraffic/runtime.ts`: `interface Rec` (~line 158), `cooldownUntil` map (~191), `spawn(def, forced)` (~224), `leave(rec)` (~285), `think()` (~298), `releaseAt` (~334: `cooldownUntil.set(rec.def.id, time + rec.def.cooldown)`), the leaving removal (~545: `if (rec.leaveT > SKY.leaveFor) { removeAt(i); cooldownUntil.set(rec.def.id, time + rec.def.cooldown); ... }`). `time` is the runtime's own seconds counter.
- `games/gnome-theft-auto/src/skyTraffic/runtime.test.ts`: existing expectations you must keep green.

## Change
- `games/gnome-theft-auto/src/skyTraffic/types.ts`: add to `SkyBehaviourDef`:
  ```ts
  /** L20: once it appears it stays up for onFor seconds, then leaves and is away for offFor seconds ([min, max], rolled
   *  each time). Absent: as before (back after `cooldown`). Forced spawns (trainer, ?sky=) ignore it. */
  presence?: { onFor: readonly [number, number]; offFor: readonly [number, number] };
  ```
- New `games/gnome-theft-auto/src/skyTraffic/presence.ts` (pure, no three.js):
  ```ts
  export function rollRange(r: readonly [number, number], rnd: () => number): number; // r[0] + (r[1] - r[0]) * rnd()
  /** Absolute time it should leave: Infinity when forced or without presence. */
  export function presenceUntil(def: SkyBehaviourDef, time: number, forced: boolean, rnd: () => number): number;
  /** Seconds it stays away after leaving: rolled offFor with presence, else def.cooldown. */
  export function awayFor(def: SkyBehaviourDef, rnd: () => number): number;
  /** Start-of-session delay so not every behaviour is up at once: rollRange([0, presence.offFor[0]]) with presence, else 0. */
  export function initialDelay(def: SkyBehaviourDef, rnd: () => number): number;
  ```
- `games/gnome-theft-auto/src/skyTraffic/runtime.ts`:
  - `Rec` gains `onUntil: number; away: number;`, set in `spawn`: `onUntil: presenceUntil(def, time, forced, Math.random)`, `away: awayFor(def, Math.random)`.
  - Right after `const cooldownUntil = new Map<string, number>();` seed it: `for (const def of SKY_BEHAVIOURS) { const d = initialDelay(def, Math.random); if (d > 0) cooldownUntil.set(def.id, d); }` (time starts at 0).
  - In `think()`, inside the loop over records: `if (!r.forced && r.state === 'flying' && time >= r.onUntil) leave(r);`.
  - In the leaving removal (`rec.leaveT > SKY.leaveFor`) and in `releaseAt`, use `time + rec.away` instead of `time + rec.def.cooldown`. Leave the far-despawn (+20) and downed cooldowns as they are.
- `games/gnome-theft-auto/src/skyTraffic/behaviours.ts`: add `presence` to the looping/rebuilding civilian behaviours (seconds):
  banner-tow `{ onFor: [100, 140], offFor: [180, 300] }`; airfield-circuit `{ onFor: [150, 240], offFor: [90, 180] }`;
  crop-duster `{ onFor: [120, 200], offFor: [120, 240] }`; scenic-copter `{ onFor: [120, 200], offFor: [120, 240] }`;
  sky-writer `{ onFor: [90, 150], offFor: [150, 270] }`; balloon `{ onFor: [180, 300], offFor: [180, 360] }`;
  news-copter `{ onFor: [90, 150], offFor: [150, 300] }`. No presence for watch-copter (it follows heat), mail-drop and air-ambulance (one-shot).
- New `games/gnome-theft-auto/src/skyTraffic/presence.test.ts`: rollRange bounds; presenceUntil is Infinity when forced or without presence and inside `time + onFor` otherwise; awayFor falls back to `cooldown`; the banner tow's onFor is about 2 minutes (100..140) and offFor 3..5 minutes; every def with presence has min <= max and positive numbers; watch-copter has none.

## Contract
`SkyBehaviourDef.presence?: { onFor: readonly [number, number]; offFor: readonly [number, number] }` and the four presence.ts functions above. Online mirrors (`src/online/skySync.ts`) only mirror what the owning runtime spawned; nothing to change there. `gta-sky-v1` progress keys are untouched.

## Done when
- `cd games/gnome-theft-auto && npx tsc --noEmit -p .` passes.
- `npx vitest run src/skyTraffic` passes (all files in it).

## Out of scope
`src/online/*`, `app.ts`, every file outside `src/skyTraffic/`.
