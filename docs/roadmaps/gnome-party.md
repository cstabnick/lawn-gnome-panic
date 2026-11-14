# Gnome Party

Goal: a board-game party (Mario Party style) for 4 gnomes, online through the shared server, CPUs filling empty seats. Players roll and hop around a loop board, collecting coins and buying stars; after every round all four play one short minigame, and the places pay coins. Most stars (then coins) after the last round wins.

Question it answers: is a 10-minute board party, with 45-second minigames cut from our own games, fun online with friends?

## The idea: games surface a party slice, the party only collects them

- **Games stay independent.** Each game still builds, runs and ships alone. Gnome Party never edits a game and never copies its code.
- **A game opts in by surfacing a party-sized slice** that follows one shared interface, `MinigameDef` from the new package `@lawn/party`. It lives in the game, at `games/<game>/src/minigames/index.ts`: `export const minigames: AnyMinigame[]`. Example: Gnome Golf surfaces "Golf Hole", one random par 3 of its own island, with its own ball physics, course and gnome.
- **The slice is built from the game's own modules** (golf's `simulateShot`, `heightAt`, the course builder), never from a copy. So when golf changes later, party mode gets the change for free.
- **One refactor per game, done once:** make the modules the slice needs callable without the game's `Ctx` or `main.ts` side effects, and add the slice. Golf and Bowling in epic 2; every other game later, one issue each.
- **The slice works in the base game too.** `games/<game>/#minigame` plays it against 3 CPUs inside the game itself, through `playMinigame` from `@lawn/party`. The same code runs in the party.
- **The game owns its slice's health.** Its `npm test` runs `testMinigame(def)` from `@lawn/party/testkit`: a headless 4-CPU run that checks the contract (finishes in time, valid places, JSON state under 2 KB, deterministic for a seed). Breaking the slice fails the game's own tests, not the party.
- **No registration.** Gnome Party finds every `games/*/src/minigames/index.ts` with `import.meta.glob`. Deleting a game removes its slices.
- **No netcode in a slice.** The author writes a pure simulation (`init`, `step`, `cpu`, `result`) and a view (`render`, `input`). `@lawn/party`'s runner runs it on the host, feeds it CPU and remote inputs, broadcasts snapshots, and handles the countdown, the time cap, a host leaving and cleanup.
- **Party-sized is a rule, not a hope.** The size rules live in `packages/party/README.md`: 20-60 s, one verb, four at once, small state. The backlog there names a slice for every game. New games add their row (rule in `CLAUDE.md` and the decompose skill; `npm run new` prints a reminder). `npm run new-mini -- <game> <id>` scaffolds one.

Decisions (2026-11-14): Three.js; a full board game; online through `@lawn/mp` from day one; games surface slices through a shared interface; each game is refactored once, so its later changes reach party mode.

Phaser games (`sample-dodge`, `mower-chain`, `faster-than-lawn`) cannot hand over a Three.js view. Their slices reuse the game's pure simulation (`mower-chain/src/sim.ts`, for example) with a small Three.js view written in the slice. That comes later; nothing here blocks it.

Not in this plan: branching paths, items, board events, 2v2 or 1v3 minigames, chat, music, a quick-play button in each game's menu (epic 3 polish; the `#minigame` hash comes first).

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | `packages/party` (contract, testkit, template, stubs), `games/gnome-party` scaffold (config, discovery, `main.ts`, stubs), `gnome-party` in the server's `GAMES`, README + process rules; `npm run build -w games/gnome-party` passes | 0 (direct) |
| 2. Systems + the golf and bowling slices | Every stub filled; Golf and Bowling refactored once and surfacing a slice; all builds and tests pass, including `npm run build` and `npm test` for gnome-golf and gnome-bowling; `#minigame` works in both games; a solo party runs to the final screen | 10 |
| 3. Online proof | Two-browser e2e (room code, same board, host leaves and the party continues); README/CREDITS/site card; quick-play buttons; fixes from playing | 2 + fixes |
| 4+. More slices | One issue per game in the backlog, all parallel; each owns only its own game | n |

Epic 2 issues are in `docs/roadmaps/gnome-party/`, all parallel. Paste `_common.md` and the issue file into each `haiku-worker` prompt.

| Issue | Owns |
|---|---|
| 2A-rules | `games/gnome-party/src/board/rules.ts`, `rules.test.ts` |
| 2B-board-view | `games/gnome-party/src/board/view.ts` |
| 2C-flow | `games/gnome-party/src/party/flow.ts`, `flow.test.ts` |
| 2D-net | `games/gnome-party/src/net.ts` |
| 2E-menu | `games/gnome-party/src/ui/menu.ts` |
| 2F-hud | `games/gnome-party/src/ui/hud.ts` |
| 2G-runner | `packages/party/src/runner.ts`, `runner.test.ts`, `pad.ts`, `standalone.ts` |
| 2H-golf-slice | `games/gnome-golf/**` (the one-time refactor + `src/minigames/`) |
| 2I-bowling-slice | `games/gnome-bowling/**` (the one-time refactor + `src/minigames/`) |
| 2J-new-mini-tool | `tools/new-minigame.mjs`, root `package.json` (`new-mini` script), one line in `tools/new-game.mjs` |

Collisions: none. 2H and 2I each own one whole game, and nobody else edits either game. 2G owns three files of `packages/party`; the contract (`types.ts`) and `testkit.ts` are foundation files and nobody edits them. Only 2D may start a server (mp-server on 8787). Nobody runs `vite`. 2H and 2I may run their own game's `vite build` at the end (each writes only its own `dist/`). 2J's check creates and deletes a throwaway game, `games/zz-tool-check` (copied from gnome-creator, which no one edits).

Dependency check: 2H and 2I call `playMinigame` (a stub until 2G lands) only from the `#minigame` entry. Their tests use `testMinigame` (foundation, real), so they pass before 2G is done.

---

## Epic 1: foundation (planner writes it directly)

### `packages/party` (`@lawn/party`)

`package.json`: name `@lawn/party`, `type: module`, exports `"."` → `./src/index.ts`, `"./testkit"` → `./src/testkit.ts`; deps `three@0.187.0`, `@lawn/gnome`; dev `@types/three`, `typescript@7.0.2`, `vitest@5.1.0`; scripts `typecheck`, `test`.

| File | Content |
|---|---|
| `src/types.ts` | The contract, verbatim below |
| `src/rng.ts` | `mulberry32(seed)`, `seedFrom(...parts)` |
| `src/index.ts` | Re-exports types, rng, `startMinigame` (runner.ts), `createPad` (pad.ts), `playMinigame` (standalone.ts) |
| `src/testkit.ts` | `runHeadless(def, seed, seats?)`: 4 CPU seats, `init` → fixed 1/60 s `step` with `cpu` inputs → `result`, up to `maxSeconds` then `result(s, true)`; asserts at most 15..90 s, places length 4 with integers 0..3, `JSON.parse(JSON.stringify(s))` equals `s`, size < 2048 bytes, same seed gives the same places. `testMinigame(def)` wraps it in vitest `describe`/`it` for seeds 1..5. Real code, not a stub. |
| `src/runner.ts`, `src/pad.ts`, `src/standalone.ts` | Stubs with the final signatures (issue 2G) |
| `template/minigame.ts` | A working "Mash" slice (most A presses in 10 s), every contract rule in comments; placeholders `__ID__`, `__TITLE__`, `__GAME__` |
| `README.md` | Size rules (between `<!-- size-rules -->` markers); a section "How a game surfaces a slice" (the five files and the 5-line `main.ts` split, as in issue 2H); the backlog |

### `packages/party/src/types.ts` (verbatim)

```ts
// The party minigame contract. A game surfaces party-sized slices of itself by exporting
//   export const minigames: AnyMinigame[]   from games/<game>/src/minigames/index.ts
// built from the game's OWN modules (not copies). The runner does everything else: seats, CPUs, net sync,
// countdown, time cap, cleanup. Size rules: packages/party/README.md.
import type * as THREE from 'three';
import type { GnomeLook } from '@lawn/gnome';

export type SeatIndex = 0 | 1 | 2 | 3;
export const SEAT_COUNT = 4;

export interface SeatInfo {
  seat: SeatIndex;
  name: string;
  /** Model look, hat already in the seat colour. Pass to createGnomeModel. */
  look: GnomeLook;
  /** 0xRRGGBB, the seat's colour everywhere. */
  color: number;
  cpu: boolean;
}

export interface MinigameMeta {
  /** Unique across all games, kebab-case: '<short game>-<slice>' reads best ('golf-hole'). */
  id: string;
  title: string;
  /** The game folder that surfaces it ('gnome-golf'). */
  game: string;
  /** One sentence: how you win. */
  goal: string;
  /** One sentence: the controls, for touch and keyboard. */
  controls: string;
  /** Hard time cap, 15..90. The runner ends the slice here with result(s, true). */
  maxSeconds: number;
}

/** The input device every slice reads; filled from keyboard, mouse and touch. */
export interface PadState {
  /** Stick, -1..1 each, +x right, +y up (WASD / arrows, or a touch drag from where the finger went down). */
  x: number;
  y: number;
  /** Primary button held: Space, Enter, or a pointer held on the canvas. */
  a: boolean;
  /** True only on the frame a went down. */
  aPressed: boolean;
  /** Pointer in normalised device coordinates (-1..1, +y up), or null if none seen yet. */
  pointer: { x: number; y: number; down: boolean } | null;
}

export interface ViewCtx {
  /** A fresh, empty scene. Add your own lights and sky. Every geometry, material and texture in it is disposed afterwards. */
  scene: THREE.Scene;
  /** Its aspect is kept right for you; you place and aim it. */
  camera: THREE.PerspectiveCamera;
  /** For capabilities (anisotropy, max texture size) and shadows settings. Never resize it or change its target. */
  renderer: THREE.WebGLRenderer;
  /** An empty div for your overlay. Removed afterwards. */
  ui: HTMLElement;
  seats: readonly SeatInfo[];
  /** My seat, or null when watching. */
  mySeat: SeatIndex | null;
}

export interface MinigameView<S, I> {
  /** Every frame on every screen. s is the host's live state, or the latest snapshot (15 a second) elsewhere:
   *  smooth movement yourself (obj.position.lerp(target, 1 - Math.exp(-dt * 15))), or replay a deterministic
   *  simulation from data in s (a shot's inputs and start time). */
  render(s: Readonly<S>, dt: number): void;
  /** Every frame while mySeat !== null and the slice runs. Input is a LEVEL sampled 15 times a second online:
   *  for a one-off action use a counter (shots: number) incremented here, never a one-frame true. */
  input(pad: Readonly<PadState>, s: Readonly<S>): I;
  dispose?(): void;
}

/** S and I are plain JSON (numbers, strings, booleans, null, arrays, objects). S stays under 2 KB. */
export interface MinigameDef<S, I> {
  meta: MinigameMeta;
  /** Host only. Use rng, never Math.random, in init, step and cpu. */
  init(seats: readonly SeatInfo[], rng: () => number): S;
  /** Host only, fixed steps of 1/60 s. inputs[seat] = that seat's latest input, null until it sends one. Mutate s. */
  step(s: S, inputs: readonly (I | null)[], dt: number, rng: () => number): void;
  /** Host only, once per step for each CPU seat. Memory a CPU needs lives in S, updated by step. */
  cpu(s: Readonly<S>, seat: SeatIndex, rng: () => number): I;
  /** Host only, after every step: null while playing, else places[seat] (0 = 1st, ties share).
   *  Must return places when timeUp is true. */
  result(s: Readonly<S>, timeUp: boolean): number[] | null;
  /** Never called by init/step/cpu/result, so a headless test needs no WebGL. */
  createView(ctx: ViewCtx): MinigameView<S, I>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyMinigame = MinigameDef<any, any>;
```

### `games/gnome-party`

Scaffold as `games/gnome-bowling` (port **5191**, `host: true`; tsconfig plus `"types": ["vite/client"]`; deps `@lawn/party`, `@lawn/gnome`, `@lawn/mp`, `three`; dev adds `vitest`).

| File | Content |
|---|---|
| `src/config.ts` | Party constants and types, verbatim below |
| `src/minigames.ts` | Discovery: `import.meta.glob<AnyMinigame[]>('../../*/src/minigames/index.ts', { eager: true, import: 'minigames' })`, flattened and sorted by id. A duplicate id is a `console.error` and the second is skipped. Exports `MINIGAMES`, `minigameById(id)`, `pickMinigame(rng, recent)` (uniform among those not in the last 2 of `recent`). |
| `src/main.ts` | Wiring, behaviour below |
| stubs | `board/rules.ts`, `board/view.ts`, `party/flow.ts`, `net.ts`, `ui/menu.ts`, `ui/hud.ts` with the signatures from their issues |

`packages/mp/src/protocol.ts`: `'gnome-party'` in `GameId` and
`'gnome-party': { minPlayers: 1, maxPlayers: 4, publicWaitS: 20, privateWaitS: 60, lateJoin: false }` in `GAMES`, with a row in `packages/mp/README.md`.

### `games/gnome-party/src/config.ts` (verbatim)

```ts
// Gnome Party: tuning numbers and every shared type. Tweak numbers here, not in the modules.
import type { SeatIndex, SeatInfo } from '@lawn/party';

export const GAME_ID = 'gnome-party' as const;

/** Offline seat colours (online seats use the server's PlayerInfo.color). */
export const SEAT_COLORS: readonly number[] = [0xff5a5a, 0x4fd8ff, 0x5cff7a, 0xffd54f];
export const CPU_NAMES: readonly string[] = ['Gnorbert', 'Gnelly', 'Gnash', 'Gnina'];

export const BOARD = {
  spaces: 24,
  redShare: 0.25,
  startCoins: 10,
  blueCoins: 3,
  redCoins: -3,
  starCost: 20,
  dieSides: 6,
  /** Coins by place, 1st..4th. Tied seats each get the better place's coins. */
  miniCoins: [10, 5, 2, 0] as readonly number[],
  roundChoices: [3, 6, 10] as readonly number[],
  defaultRounds: 6,
} as const;

export const TIMING = {
  rollAutoS: 10,
  cpuRollDelayS: 1.0,
  hopS: 0.35,
  afterMoveS: 1.2,
  introS: 6,
  resultsS: 5,
  partyResendS: 1,
} as const;

export type SpaceKind = 'blue' | 'red';
export interface PlayerBoard { space: number; coins: number; stars: number }
export interface BoardState {
  spaces: SpaceKind[];
  starAt: number;
  /** Indexed by seat. */
  players: PlayerBoard[];
  /** 1-based. */
  round: number;
  rounds: number;
  /** Whose move it is this round; seats move in order 0..3. */
  turn: SeatIndex;
}

export type MoveEvent =
  | { e: 'hop'; to: number }
  | { e: 'star'; bought: boolean }
  | { e: 'starMoved'; to: number }
  | { e: 'coins'; delta: number };

/** playerId null = CPU (or the local player offline). */
export interface Seat extends SeatInfo { playerId: number | null }

/** `left` = seconds left in the phase; the host counts it down, other screens count down locally between broadcasts. */
export type Phase =
  | { p: 'roll'; seat: SeatIndex; left: number }
  | { p: 'move'; seat: SeatIndex; die: number; events: MoveEvent[]; left: number; total: number }
  | { p: 'intro'; mini: string; left: number }
  | { p: 'mini'; mini: string; seed: number }
  | { p: 'results'; mini: string; places: number[]; coins: number[]; left: number }
  | { p: 'final'; order: SeatIndex[] };

export interface PartyState {
  /** Increments on every change; screens ignore older states. */
  v: number;
  seed: number;
  seats: Seat[];
  board: BoardState;
  phase: Phase;
  /** Minigame ids played, oldest first (last 5). */
  recent: string[];
}

/** Relay messages (the `d` of an @lawn/mp relay). */
export type PartyMsg =
  | { k: 'party'; s: PartyState }                     // host -> all, on change and every partyResendS
  | { k: 'snap'; v: number; t: number; s: unknown }   // host -> all, 15/s during a minigame
  | { k: 'in'; v: number; i: unknown }                // client -> host, 15/s during a minigame
  | { k: 'roll' }                                     // client -> host
  | { k: 'ping' };                                    // client -> host every 2 s outside minigames
```

### `main.ts` behaviour

- `await loadMyGnome()`, the touch-cancel block from bowling, renderer, one camera, resize, `pad = createPad(canvas)`.
- Solo: seats = me + 3 CPUs; `newParty(seats, rounds, seed)`; `createFlow(state, onChange)`; I am host.
- Online: `net.onMatch` builds seats from `players` in order (`playerId` set, look `resolveLook(p) ?? GNORMAN_LOOK`, hat `p.color`) and fills CPUs to 4. The host creates the flow; the others wait for `{k:'party'}`.
- `onChange(s)` (host): apply it here, and online `net.broadcast({k:'party', s})`. `apply(s)` drops a stale `v`; phase `mini` starts `startMinigame` (from `@lawn/party`) in a fresh scene; any other phase disposes the runner; `hud.show(s, mySeat)`.
- Loop: host `flow.update(dt)`; a runner → `runner.update(dt)` and render its scene, else `boardView.render` and the board scene; `hud.update(dt)`.
- Net: host gets `roll` → `flow.roll`, `in` → `runner.receiveInput`; clients get `party` → apply, `snap` → `runner.receiveSnapshot`. `onLeft` → `flow.setCpu` + `runner.setCpu`. `onHost` to me → `createFlow(lastState)` + `runner.becomeHost()`. Runner `onDone` → `flow.miniFinished`.
- Dev: `#mini=<id>` loops one slice vs 3 CPUs; `#rounds=<n>`; `#cpu`; `window.party`.

### README size rules (`packages/party/README.md`)

<!-- size-rules -->
A party slice is **party-sized**:

- **One round of 20-60 seconds** (`maxSeconds` 15-90). One hole of golf, not a course. One bowling frame, not a game.
- **One verb**, explained by the one-sentence `controls`: putt, bowl, dodge, aim, mash, steer.
- **All four seats play at the same time**, and every seat ends with a place. Nobody who is knocked out waits more than ~20 s.
- **Built from the game's own modules.** If what the slice needs is tangled in the game's `Ctx` or `main.ts`, refactor the game once so it is callable on its own. Never copy it. Slice-only code (CPU, scoring, view glue) stays small: about 300 lines in all.
- **State is small JSON** (< 2 KB); input is a level, and one-off actions are counters. Replay deterministic simulations from their inputs rather than sending trajectories.
- **No** menus, levels, progression, saving, its own netcode or its own music. The slice's modules must not touch the DOM or `window` at import time.
- **Tested by the game:** `src/minigames/minigames.test.ts` calls `testMinigame(def)` for every slice, so the game's `npm test` keeps the slice working.
<!-- /size-rules -->

Backlog (every new game adds its row):

| Slice | Game | Idea | Status |
|---|---|---|---|
| golf-hole | gnome-golf | One random par 3 of the island, all four play at once, fewest strokes | epic 2 |
| bowl-frame | gnome-bowling | One frame, four lanes side by side, most pins | epic 2 |
| golf-disc | gnome-golf | Gnome Disc: one throw each, closest to the basket | backlog |
| lawn-dodge | sample-3d | Dodge mowers crossing a yard, last gnome standing | backlog |
| chain-sprint | mower-chain | 40 s mower snake in a small pen, longest chain (Phaser sim + Three view) | backlog |
| raft-fish | gnaft | First to reel in three fish | backlog |
| front-flag | gnome-front | Hold the one flag longest in 45 s | backlog |
| lawn-race | faster-than-lawn | Mow the most of a shared lawn in 30 s (Phaser sim + Three view) | backlog |
| dodge-drops | sample-dodge | Dodge falling objects, last one standing (Phaser sim + Three view) | backlog |

### Process rules

Already done on 2026-11-14, ahead of epic 1: `SOUL.md` (every game can lend a party slice), `CLAUDE.md` (layout, plus the slice rules: decided without asking, never forced, never retrofitted, built from the game's own modules, kept green by `npm test`), `.claude/skills/decompose/SKILL.md` (a slice check before decomposing, and how to cut a slice issue), and `prompts/worker.md` (workers run the game's `npm test` when it has slices). Epic 1 only needs to create `packages/party/README.md`, which those docs point to.

---

## Epic 3: online proof

- **3A e2e** (worker): `tools/gnome-party-mp-e2e.mjs`, shaped like `tools/gnome-front-mp-e2e.mjs` but launching Chromium through Playwright (fall back to the Edge path on Windows). Two pages join room `E2EP`. Check:
  - both reach phase `roll` with the same `window.party.seats` (2 humans, 2 CPUs);
  - both see snapshots in a `mini` phase;
  - closing the host page makes the other page host, and `window.party.v` keeps rising.
- **3B polish** (planner): README, CREDITS, `gnome-party` first in `ORDER` in `tools/build-site.mjs`, and a demo clip. Each surfacing game gets a "QUICK PLAY" title-menu button that opens `#minigame`.
- Fix issues written from playing a solo and an online party.

## Epic 4+: more slices

One issue per backlog row, all parallel. Each owns exactly one game: refactor what the slice needs once, add `src/minigames/`, `#minigame` and the contract test, starting from `npm run new-mini -- <game> <id>`. Done when the game's `npm run build` and `npm test` pass and `#minigame` plays.
