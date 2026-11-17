# Generic Achievement & Equipment Unlock System (POC Design)

**Status:** Proof of Concept (PR for review)  
**Related Issue:** [#113 — achievement ideas](https://github.com/cstabnick/lawn-gnome-panic/issues/113)

## 1. Goal

Build a generic achievement system that:
1. Works across any game in the arcade with minimal per-game boilerplate.
2. Persists unlocks locally today (`localStorage`), behind an async interface that can be swapped to a backend platform service long-term.
3. Syncs unlocked rewards to the player's gnome in `games/gnome-creator` and renders them across games using `@lawn/prefabs` so no game reinvents equipment rendering.

## 2. Architecture Overview

```
  games/gnome-golf   ─┐
  games/gnome-bowling ┼─► @lawn/achievements (catalog, AchievementStore, tracker, toast)
  games/gnome-front  ─┘          │
                                 ▼ (gnome.achievements.v1)
  games/gnome-creator ───────────┴─► @lawn/gnome (Look.equipment + createGnomeModel)
                                            │
                                            ▼
                                     @lawn/prefabs (3D models & UI icons)
```

- **`packages/achievements` (`@lawn/achievements`)**:
  - `catalog.ts`: Central registry of `AchievementDef`s, each with `id`, `game`, `title`, `description`, optional `target` (for progressive achievements like 3 combine kills), and optional `reward` (`slot`, `prefabId`, `label`).
  - `store.ts`: `AchievementStore` async interface + `LocalAchievementStore` (`gnome.achievements.v1` in `localStorage`).
  - `tracker.ts` & `toast.ts`: `createAchievementTracker({ ui })` gives games a 2-line integration (`tracker.unlock(id)` / `tracker.increment(id)`) and renders a non-blocking `#ui` toast with the reward's 3D prefab icon.
- **`packages/gnome` (`@lawn/gnome`)**:
  - `Look` and `GnomeLook` gain an optional `equipment?: Partial<Record<'head' | 'back' | 'neck' | 'hand', string>>`.
  - `createGnomeModel(look)` builds and attaches equipped `@lawn/prefabs` directly onto `rig` (head, back, neck) and `armR` (hand via `buildHeld`), replacing the default cone hat when a `head` prefab is worn.
- **`packages/prefabs` (`@lawn/prefabs`)**:
  - Reuses existing prefabs (`bucket-helm`, `leaf-cloak`, `war-hoe`) and adds 6 game-themed prefabs (`golf-visor`, `caddie-bag`, `golden-putter`, `bowling-pin-hat`, `pilgrim-hat`, `bowling-ball`).
- **`games/gnome-creator`**:
  - Adds an **EQUIPMENT** section grouped by slot (`HEAD`, `BACK`, `HAND`) with `prefabIconElement` thumbnails, lock indicators (`🔒`) showing how to earn locked gear, and live 3D turntable previews.

## 3. Achievement & Reward Mapping (Issue #113)

| Game | Achievement | Condition | Reward Prefab | Slot | Existing/New |
|---|---|---|---|---|---|
| `gnome-golf` | **Nice** | Par on a hole | `golf-visor` (Golf Visor) | `head` | New |
| `gnome-golf` | **How?!?!?!!** | Par or better through 9 holes | `golden-putter` (Golden Putter) | `hand` | New |
| `gnome-golf` | **Ooops** | Hit a ball into the water | `bucket-helm` (Bucket Helm) | `head` | Existing |
| `gnome-golf` | **Off the beaten path** | Finish a hole with 0 fairway hits and ≥1 rough hit | `leaf-cloak` (Leaf Cloak) | `back` | Existing |
| `gnome-golf` | **Crisp In** | Chip in from off the green | `caddie-bag` (Caddie Bag) | `back` | New |
| `gnome-bowling` | **All gnomes down** | Bowl a strike | `bowling-pin-hat` (Pin Crown) | `head` | New |
| `gnome-bowling` | **Certified Pilgrim** | Bowl a turkey (3 strikes in a row) | `pilgrim-hat` (Pilgrim Hat) | `head` | New |
| `gnome-bowling` | **7-10 inconvenience store** | Leave a 7-10 split | `bowling-ball` (House Ball) | `hand` | New |
| `gnome-front` | **Harvest Season** | Mow down 3 gnomes in the combine (`target: 3`) | `war-hoe` (War Hoe) | `hand` | Existing |

## 4. Key Decisions & Trade-offs (For Review)

### Decision A: `@lawn/gnome` depends on `@lawn/prefabs`
- **Why:** If `createGnomeModel` attaches equipped prefabs itself, every game that already calls `createGnomeModel(mine?.look ?? ...)` gets cosmetic equipment for free—no per-game attachment code.
- **For:** Zero duplication across 3D games; `gnome-creator` preview and all games stay visually identical.
- **Against / Risk:** Every game using `@lawn/gnome` now pulls `@lawn/prefabs` into its dependency graph. Also, `@lawn/prefabs` caches geometries/materials globally, so any code that disposes a `GnomeModel` must skip `userData.prefab` subtrees (updated in `gnome-creator/src/preview.ts`; other games don't dispose `GnomeModel` mid-session, or should follow the same rule).

### Decision B: Separate `@lawn/achievements` package vs. folding into `@lawn/gnome`
- **Why:** `@lawn/gnome` owns identity and 3D appearance; `@lawn/achievements` owns unlock definitions, progress tracking, and toast UI.
- **For:** Clean separation of concerns; 2D/Phaser games can use `@lawn/achievements` without needing `@lawn/gnome`'s Three.js model code.
- **Against / Risk:** Adds one more workspace package (`packages/achievements`).

### Decision C: Keep `g1.` look codes (11 chars) unchanged for now
- **Why:** `PlayerInfo.character` in `@lawn/mp` is capped at 16 characters, and `g1.` is frozen.
- **For:** Zero breaking changes to multiplayer matchmaking or existing look codes.
- **Against / Risk:** Remote players in online matches will not see your equipped achievement gear until the platform service (`BatchGetGnomes`) replaces look codes as the source of truth—only the local player sees their equipped gear in-game today.

### Decision D: Central `ACHIEVEMENTS` catalog vs. per-game registration
- **Why:** `gnome-creator` needs to display *all* equipment rewards (including locked ones with unlock hints) even before the player has launched Golf, Bowling, or Gnome Front.
- **For:** Single source of truth, statically validated by `packages/achievements/src/achievements.test.ts` (checks that every `reward.prefabId` exists in `@lawn/prefabs` and has the matching `wear-*` / `hold` use tag).
- **Against / Risk:** Adding achievements for a new game requires editing `packages/achievements/src/catalog.ts`.

### Decision E: Local storage today (`gnome.achievements.v1`), service later
- **Why:** Matches `@lawn/gnome`'s `GnomeStore` pattern (`LocalGnomeStore` → future `ConnectGnomeStore`).
- **For:** Lets us ship and playtest achievement loops immediately with zero backend infra.
- **Against / Risk:** `localStorage` is per-browser and client-trusted; when the platform service is introduced, `createAchievementStore()` can swap to an RPC client (and optionally migrate local unlocks on first sign-in, just like `GnomeStore`).

## 5. Long-Term Service Migration Path

When the platform service is ready:
1. Implement `ConnectAchievementStore implements AchievementStore` in `packages/achievements/src/store.ts` and return it from `createAchievementStore()`.
2. Add `equipment` to the protobuf `GnomeLook` message so `BatchGetGnomes` syncs equipped prefabs to other players online.
3. No game code (`gnome-golf`, `gnome-bowling`, `gnome-front`) or `gnome-creator` UI code needs to change.
