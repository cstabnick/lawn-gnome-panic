Epic: 8 Integration (Gnome Theft Auto Wild World)
Depends on: none

## Environment
Working directory `C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\pomfret` (a git worktree; stay in it, do not commit).
Git Bash: if `node` is not found, `export PATH="/c/Program Files/nodejs:$PATH"`. Another worker is adding entries to
`packages/achievements/src/catalog.ts` at the same time: do not edit it. You own `packages/achievements/src/sync.ts`
and `packages/achievements/src/sync.test.ts` (and `store.ts` only if the fix truly belongs there).

## Goal
Prove (with a test) that the signed-in `SyncedAchievementStore` keeps both of two unlocks made in the same moment, and
fix it if it does not. The same bug was found and fixed in `LocalAchievementStore`: two unlocks in the same tick each
read the state before the other saved, and the second save dropped the first.

## Read first
- `packages/achievements/src/store.ts`: `LocalAchievementStore` (`getState`, `unlock`, `increment`, and `save`, which
  now merges with its in-memory `cache` unless `replace`).
- `packages/achievements/src/sync.ts`: `SyncedAchievementStore`. Note `this.local` is replaced by a NEW
  `LocalAchievementStore` (empty cache) in `onLocalChanged` (a cloud pull wrote the local save) and after `ready()`.
  An unlock that is mid-flight on the old instance, or a cloud pull landing between two unlocks, may lose a record.
- `packages/achievements/src/sync.test.ts`: `FakeStorage`, `makePlatform(remote)`, `slotDeps(storage, platform)` and
  the "pushes an unlock to the account right away" test, to build a store the same way.
- `packages/achievements/src/achievements.test.ts`: the LocalAchievementStore same-tick test (search for "same tick"
  or `Promise.all`) to copy its shape.

## Change
- `src/sync.test.ts`: add tests, each building `new SyncedAchievementStore({ storage, slotDeps: slotDeps(storage, platform) })`:
  1. `await Promise.all([store.unlock('golf-nice'), store.unlock('golf-how')])`: both are unlocked in
     `store.getState()`, in the local storage text under `ACHIEVEMENTS_STORAGE_KEY`, and (after awaiting pending
     microtasks/timers the way the existing push test does) in the last `putSave` data.
  2. The same with an `increment` and an `unlock` in one `Promise.all`.
  3. Two unlocks where the remote account save already has a third achievement: all three end up in local storage.
- `src/sync.ts` (only if a test fails): make the store keep every record. Simplest correct fix: never replace
  `this.local` with a fresh instance; instead keep one `LocalAchievementStore` and have `onLocalChanged` / `ready()`
  make it re-read storage merged with its memory (e.g. call `await this.local.getState()`, which already merges the
  stored save with its cache). If `LocalAchievementStore` needs a public method for that, add
  `refresh(): Promise<AchievementState>` to `store.ts` that does exactly what `getState()` does, and document it.
  Keep `mergeAchievementStates` and every exported name unchanged.

## Contract
No change to exported signatures of `SyncedAchievementStore`, `LocalAchievementStore`, `mergeAchievementStates`,
`createAchievementStore`. Adding `LocalAchievementStore.refresh()` is allowed.

## Done when
- `npm test -w packages/achievements` passes (if only a catalog test fails because the other worker is mid-edit on
  `catalog.ts`, say so; your `sync.test.ts` must pass: `cd packages/achievements && npx vitest run src/sync.test.ts`).
- Your report says whether the race existed before your fix (did test 1 fail first?).

## Out of scope
`catalog.ts`, `tracker.ts`, `toast.ts`, every game.
