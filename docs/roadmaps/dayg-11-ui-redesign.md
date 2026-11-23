# DayG roadmap 11: UI redesign from user stories

Design: `docs/design/dayg/ui/` ([user-stories.md](../design/dayg/ui/user-stories.md) S01-S40,
[current-ui.md](../design/dayg/ui/current-ui.md), [design.md](../design/dayg/ui/design.md)). Game folder
`games/dayg` (three.js, DOM UI in `src/ui`), dev port **5206**. Issues are numbered 11.1 to 11.18 and grouped in
epics 11A to 11D, one epic per round.

## 1. Goal

DayG's UI was built screen by screen, each module with its own colours, sizes and zones, and it fails the players the
persona reviews describe: phone players with one thumb, veterans who want numbers on demand, and anyone who needs large
text, high contrast or a screen reader. This roadmap puts every screen on one theme (tokens with a dark and a
high-contrast theme and a text scale), one layout module (zones and sheets) and one set of focus, label and live-region
helpers, then rebuilds the HUD, prompt, touch controls, pack, recap and camera on them and adds the status, settings,
map, action-list and hint screens. It is done when the 40 stories' tests pass at 390x844, 844x390 and 1280x800, checked
by a scripted UI audit.

### In scope

- Theme tokens (`src/ui/theme.ts`), UI preferences (`src/ui/prefs.ts`), layout zones and sheets (`src/ui/layout.ts`),
  focus, label and live-region helpers (`src/ui/a11y.ts`), and two scripts: `scripts/ui-audit.mjs` (names, target
  sizes, font sizes, overflow, overlap, dialogs, motion) and `scripts/ui-shot.mjs` (Edge screenshots, 390 px through an
  iframe wrapper).
- Rebuilt: HUD, interaction prompt with an action list, touch controls and keyboard input, pack sheet, recap, camera
  follow mode.
- New: status sheet, settings sheet, map sheet (memory map, no markers), first-hour hints.
- The panels from [dayg-phases-4-8.md](dayg-phases-4-8.md) (talk, board, ledger, room, build) moved onto the shared
  sheet in round 4.

### Out of scope

- New items or 3D objects (this roadmap is UI only; no prefab is added). A `folded-map` or `compass` item is later.
- Interiors themselves: the prompt supports `kind: 'enter'` and the camera keeps its pull-in, so interiors can use them
  when they land.
- Drag and drop in the pack; gamepad support; translation; a blind-playable 3D view (the DOM UI is accessible, the
  canvas is not).
- Online play: no change. Roadmap 11 touches no net code; remote players see nothing of another player's UI.
- A Gnome Party slice: no change to the `last-ladder` backlog row (still "later").
- Achievements: none planned. This roadmap changes how existing things are shown and adds no new player feat (stated in
  the PR).

### Preconditions

- **Roadmap 11 starts after [dayg-09-base-building.md](dayg-09-base-building.md),
  [dayg-10-building-interiors.md](dayg-10-building-interiors.md) and [dayg-phases-4-8.md](dayg-phases-4-8.md) are
  merged.** They edit `src/ui/hud.ts`, `src/ui/recap.ts`, `src/ui/touch.ts`, `src/game/camera.ts` and `src/main.ts`,
  and round 4 here rewrites the panels they create: the build mode and chest UI from roadmap 9 (`src/base/buildUi.ts`,
  `src/base/chestUi.ts`) and the talk, board, ledger and room panels from phases 4-8. Roadmap 9 replaces the phases 4-8
  building line, so the build menu is `src/base/buildUi.ts`; if a phases 4-8 `src/ui/buildPanel.ts` also exists, the
  planner adds it to issue 11.17. If round 4 starts and a panel file named in it does not exist, the planner drops that
  part and says so in the PR.
- Roadmap 10 makes interiors walk-in (no enter menu) and owns the indoor camera rules. Roadmap 11 builds on them: the
  interior prompt is information only (the building's name and what is known of the inside, shown at the doorway), and
  camera follow (11.13) is added on top of roadmap 10's camera without changing its indoor rules.
- Every path and signature in the issues below was confirmed against commit `0782730` plus the branch's uncommitted
  work on 2026-11-22. Before each round the planner re-reads the files the round's issues name and corrects the issue
  text (decompose step 4), because phases 4-8 will have changed `main.ts`, `game/types.ts` and `hud.ts`.

## 2. Shape

| Epic | Name | Done when | Issues |
|---|---|---|---|
| 11.0 | Step 0, foundation (planner) | `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`; smoke at `?seed=1` finds `dayg-root dayg-hud dayg-touch dayg-prompt` | 0 (planner) |
| 11A | Shared foundation: theme, prefs, layout, a11y helpers, audit and shot scripts | the above, plus `cd games/dayg && npx vitest run src/ui`, `node games/dayg/scripts/ui-audit.mjs --self-test`, `?layout-demo=1` screenshots at three sizes | 4 |
| 11B | Play screen: HUD, prompt and action list, touch and input, status sheet, settings sheet | the above, plus the audit passes (scoped to these modules) at three sizes for `?open=` none, `actions`, `status`, `settings`, with `ui-scale=2` and `ui-theme=contrast` | 5 |
| 11C | Sheets and the camera: pack, map, recap, camera follow, hints | the above, plus the audit passes unscoped for `?open=` none, `pack`, `map`, `status`, `settings`, `actions`, `recap` at three sizes, scales 1 and 2, both themes | 5 |
| 11D | Phases 4-8 panels on the sheet, phone pass and gate | the above for every `?open=` value including `talk`, `board`, `ledger`, `room`, and `buildui=1`, `buildui=claim`, `chestui=1`; PLAYTEST.md updated; PR open | 4 |

### Rounds

A round starts only after the previous round's end-of-round check passes (the planner runs it and fixes `main.ts`).

| Round | Epic | Issues (all parallel within the round) |
|---|---|---|
| 0 | 11.0 | Step 0 (planner) |
| 1 | 11A | 11.1 Theme tokens and prefs, 11.2 Layout zones and sheets, 11.3 Focus, label and live-region helpers, 11.4 UI audit and screenshot scripts |
| 2 | 11B | 11.5 HUD, 11.6 Prompt and action list, 11.7 Touch controls and input, 11.8 Status sheet, 11.9 Settings sheet |
| 3 | 11C | 11.10 Pack sheet, 11.11 Map sheet, 11.12 Recap, 11.13 Camera follow, 11.14 First-hour hints |
| 4 | 11D | 11.15 Talk and board panels, 11.16 Ledger and room panels, 11.17 Build mode and chest UI, 11.18 Phone pass and gate |

Total: 18 issues.

### Dependencies that remain

- **The whole roadmap waits for roadmaps 9, 10 and phases 4-8.** They edit `hud.ts`, `recap.ts`, `touch.ts`,
  `camera.ts` and `main.ts`; running them at once would make two owners of each.
- **Round 4 panels (11.15-11.17) depend on files this planner could not read** (`talkPanel.ts`, `boardPanel.ts`,
  `ledgerPanel.ts`, `roomPanel.ts` from phases 4-8; `src/base/buildUi.ts`, `src/base/chestUi.ts` from roadmap 9: they
  are planned, not written). Their issues give a migration recipe instead of exact code; the planner re-checks them
  against the real files before round 4.
- **11.13 (camera follow) depends on roadmap 10's camera** (`close` flag, the interior parameter, its tests in
  `camera.test.ts`); the issue adds its own test file and must leave roadmap 10's rules and tests unchanged.
- **The doorway prompt needs roadmap 10's building data** (door positions and names); the planner wires it in
  `main.ts` at the end of round 2, not a worker.
- **Inside a round, none.** Stubs from Step 0 carry every cross-module signature, so each issue compiles against the
  stubs while its neighbours fill theirs.
- **The audit scripts (11.4) are written in round 1** in parallel with the modules they check; round-1 issues use
  `tsc`, unit tests and the inline screenshot recipe instead.

## 3. Stories to issues

| Story | Issues | Story | Issues |
|---|---|---|---|
| S01, S02, S03, S07 | 11.5 | S21 | 11.10 |
| S04, S05, S06 | 11.5, 11.8 | S22 | 11.2, 11.7, Step 0 (pointer lock) |
| S08 | 11.2, 11.5 | S23 | 11.2, 11.15, 11.16, 11.17 |
| S09 | 11.14 | S24 | 11.17 |
| S10 | 11.1, 11.3, 11.5 | S25, S26, S27 | 11.11 |
| S11, S12 | 11.6, 11.7 | S28 | 11.4, 11.7, 11.18 |
| S13 | 11.6, Step 0 (blocked climb view) | S29, S32 | 11.7 |
| S14 | 11.6 | S30 | 11.7, 11.13 |
| S15 | 11.13 | S31 | 11.7, 11.9 |
| S16, S17, S18 | 11.10 | S33, S34, S35 | 11.12 |
| S19 | 11.5, 11.10 | S36 | 11.1, 11.2, 11.18 |
| S20 | 11.2, 11.10 | S37 | 11.1, 11.9 |
| | | S38 | 11.3, 11.4, every UI issue |
| | | S39 | 11.3, 11.5, 11.6, 11.12 |
| | | S40 | 11.1, 11.3, 11.9 |

## 4. File owners

### `games/dayg/src/ui/`

| File | Written by | Filled or changed by |
|---|---|---|
| `types.ts` (new: UI contracts) | planner, Step 0 (full) | planner only |
| `theme.ts`, `prefs.ts`, `theme.test.ts` (new) | planner stub | 11.1; round 4: 11.18 (`theme.ts` token values only) |
| `layout.ts` (new) | planner stub (working minimum) | 11.2; round 4: 11.18 (zone geometry only) |
| `a11y.ts`, `a11y.test.ts` (new) | planner stub | 11.3 |
| `hud.ts` | existing | 11.5 |
| `prompt.ts`, `actionList.ts` (new) | planner stub (prompt: working minimum) | 11.6 |
| `touch.ts` | existing (Step 0: three no-op methods) | 11.7 |
| `statusPanel.ts` (new) | planner stub | 11.8 |
| `settingsPanel.ts` (new) | planner stub | 11.9 |
| `inventoryPanel.ts` | existing | 11.10 |
| `mapPanel.ts`, `mapPanel.test.ts` (new) | planner stub | 11.11 |
| `recap.ts` | existing | 11.12 |
| `hints.ts`, `hints.test.ts` (new) | planner stub | 11.14 |
| `talkPanel.ts`, `boardPanel.ts` | phases 4-8 | 11.15 |
| `ledgerPanel.ts`, `roomPanel.ts` | phases 4-8 | 11.16 |
| `buildPanel.ts` (only if phases 4-8 wrote it) | phases 4-8 | 11.17 |

### Other files

| File | Owner |
|---|---|
| `src/main.ts`, `src/config.ts`, `src/game/types.ts`, `src/game/interact.ts` | planner (Step 0 and every end-of-round fix). No worker edits them. |
| `src/game/input.ts` | 11.7 |
| `src/game/camera.ts` (roadmap 10's), `src/game/cameraFollow.test.ts` (new) | 11.13 (`camera.test.ts` stays roadmap 10's: read, do not edit) |
| `src/base/buildUi.ts`, `src/base/chestUi.ts` (roadmap 9's) | 11.17 |
| `games/dayg/scripts/ui-audit.mjs`, `games/dayg/scripts/ui-shot.mjs` (new) | 11.4 |
| `games/dayg/PLAYTEST.md` | 11.18 |
| `games/dayg/README.md`, `AGENT_INDEX.md` | planner (after round 4) |

### Ports (one per issue, never shared)

11.2: 5311, 11.3: 5312, 11.4: 5313, 11.5: 5314, 11.6: 5315, 11.7: 5316, 11.8: 5317, 11.9: 5318, 11.10: 5319,
11.11: 5320, 11.12: 5321, 11.13: 5322, 11.14: 5323, 11.15: 5324, 11.16: 5325, 11.17: 5326, 11.18: 5327. The planner
uses 5206. Start a server with `cd games/dayg && npx vite --port <port> --strictPort` in the background; stop it when
done.

### Debug URL parameters (Step 0 adds them to `main.ts`)

| Parameter | Effect |
|---|---|
| `open=pack\|map\|status\|settings\|actions\|recap` | opens that screen after the first frame (`actions` opens the list with "Drink from the Tap" and "Fill your containers"; `recap` shows a Hatless death). Phases 4-8 values (`talk`, `board`, `ledger`, `room`, `build`) are kept. |
| `prompt=enter` | forces the prompt to `{ primary: { id: 'demo', label: 'The Bier House' }, more: 0, note: 'Walk in. Dark inside.', kind: 'enter' }` |
| `buildui=1`, `buildui=claim`, `chestui=1` | roadmap 9's sample states for the build mode and chest UI (kept) |
| `debug-infect=<BodyPart>` | starts with `{ part, hours: 3.5, stage: 1 }` moss infection |
| `layout-demo=1` | handled inside `layout.ts` (11.2): outlines every zone and opens a demo sheet |
| `ui-theme`, `ui-scale`, `ui-hand`, `ui-motion`, `ui-follow`, `ui-hints` | preference overrides, handled in `prefs.ts` (11.1) |
| `touch=1`, `inv=1`, `seed=` | as today |

---

## 5. Step 0: foundation (planner-written)

The planner writes all of this before round 1 and runs the Step 0 checks. Nothing renames an existing type; `Hud`
loses `prompt` (moved to `PromptBar`).

### 5.1 `src/config.ts`

```ts
export const DOM = {
  hud: 'dayg-hud', inv: 'dayg-inv', touch: 'dayg-touch', recap: 'dayg-recap',
  root: 'dayg-root', prompt: 'dayg-prompt', actions: 'dayg-actions', status: 'dayg-status',
  settings: 'dayg-settings', map: 'dayg-map', hints: 'dayg-hints',
  livePolite: 'dayg-live-polite', liveAssertive: 'dayg-live-assertive',
} as const;
```

(Keep any ids phases 4-8 added.) `LAYOUT` stays for code that still reads it; new code reads `layout.ts`.

### 5.2 `src/game/types.ts`

```ts
export interface InputState {
  // ...existing fields unchanged...
  map: boolean;          // edge: open or close the map (M)
  back: boolean;         // edge: Esc
  actionHold: boolean;   // edge: E held 0.45 s, or ACT long-pressed
}
export interface TouchSource {
  root: HTMLElement; read(): Partial<InputState>; setVisible(on: boolean): void; setClimbHint(on: boolean): void; active(): boolean;
  setActionLabel(label: string | null): void;   // full prompt label, or null when nothing is in reach
  setStance(stance: Stance): void;
}
export interface HudState {
  // ...existing fields unchanged...
  noise: number;                      // player.noise, radius in gm of the last step
  infectionHoursLeft: number | null;  // null until the body system exposes it
}
export interface Hud { root: HTMLElement; update(s: HudState): void; toast(text: string, seconds?: number): void }
```

`touch.ts` gets `setActionLabel() {}` and `setStance() {}` no-ops; `input.ts` returns `map: false, back: false,
actionHold: false`. `hud.ts` gets a second parameter `deps: HudDeps` (unused) and its `prompt` method removed.

### 5.3 `src/game/interact.ts`

```ts
export interface Interact {
  add(i: Interactable): () => void;
  update(pos: Vec3): Interactable | null;
  current(): Interactable | null;
  nearby(): readonly Interactable[];   // every labelled interactable in reach at the last update, nearest first
  trigger(): boolean;
  triggerId(id: string): boolean;      // runs the nearby interactable with this id; false if it is not nearby
}
```

### 5.4 `src/ui/types.ts` (new, full)

```ts
// UI contracts shared by the src/ui modules. Planner-owned: workers read it and never edit it.
import type { HudState } from '../game/types';

export type ThemeName = 'dark' | 'contrast';
export type TextScale = 1 | 1.25 | 1.5 | 2;
export type Hand = 'right' | 'left';
export interface UiPrefs {
  theme: ThemeName; textScale: TextScale; reduceMotion: boolean; hand: Hand;
  cameraFollow: boolean; hints: boolean; announce: boolean;
}

export type Orientation = 'portrait' | 'landscape';
export type Zone = 'status' | 'clock' | 'corner' | 'alerts' | 'busy' | 'prompt' | 'controls';
export interface SheetOpts { id: string; title: string; size?: 'tall' | 'full'; onClose?: () => void }
export interface Sheet {
  root: HTMLElement; header: HTMLElement; body: HTMLElement; footer: HTMLElement;
  open(): void; close(): void; isOpen(): boolean; setTitle(title: string): void;
}
export interface Layout {
  root: HTMLElement;                                   // #dayg-root inside #ui
  zone(z: Zone): HTMLElement;
  orientation(): Orientation;
  sheet(opts: SheetOpts): Sheet;                       // hidden until open(); one sheet open at a time
  openSheet(): Sheet | null;
  closeAll(): boolean;                                 // true if a sheet was open
  onSheet(cb: (open: Sheet | null) => void): () => void;
  onOrientation(cb: (o: Orientation) => void): () => void;
}

export type MenuId = 'pack' | 'map' | 'status' | 'settings';
export interface HudDeps { onMenu(which: MenuId): void }

export type PromptKind = 'act' | 'climb' | 'enter' | 'blocked';
export interface PromptView { primary: { id: string; label: string } | null; more: number; note?: string | null; kind?: PromptKind }
export interface PromptDeps { onPrimary(): void; onMore(): void }
export type InputDevice = 'keys' | 'touch';
export interface PromptBar { root: HTMLElement; show(view: PromptView | null): void; setDevice(device: InputDevice): void }

export interface ActionChoice { id: string; label: string; disabled?: string | null }
export interface ActionList { open(title: string, choices: readonly ActionChoice[], onPick: (id: string) => void): void; close(): void; isOpen(): boolean }

export interface StatusPanel { open(): void; close(): void; isOpen(): boolean; update(s: HudState): void }
export interface SettingsPanel { open(): void; close(): void; isOpen(): boolean }

export interface MapRegionView { id: string; name: string; rect: { x0: number; x1: number; z0: number; z1: number }; haven: boolean }
export interface MapDeps {
  outline: readonly (readonly [number, number])[];
  regions: readonly MapRegionView[];
  regionAt(x: number, z: number): string | null;
  player(): { x: number; z: number; facing: number };   // facing: yaw, forward = (sin f, 0, cos f)
}
export interface MapPanel { open(): void; close(): void; isOpen(): boolean; toggle(): void; update(): void }

export interface HintInput {
  device: InputDevice; moved: boolean; regionId: string | null; nearContainer: boolean;
  water: number; hourOfDay: number; night: boolean; firesLit: number; inHaven: boolean;
}
export interface Hints { update(s: HintInput, dt: number): void }
```

### 5.5 Stubs (each exports its final signature)

| File | Stub |
|---|---|
| `ui/theme.ts` | `THEMES` with the dark and contrast values from issue 11.1, `T` with the var names from 11.1, `MIN_FONT_PX = 14`, `cssVars` returning `{}`, `applyTheme` no-op, `contrastRatio` returning 21 |
| `ui/prefs.ts` | `PREFS_KEY`, `DEFAULT_PREFS`, `parsePrefs` returning `{ ...DEFAULT_PREFS }`, `prefsFromSearch` returning `base`, `systemDefaults`, `loadPrefs`, `getPrefs` returning defaults, `setPrefs` returning defaults, `onPrefs` returning a no-op |
| `ui/layout.ts` | working minimum: `initLayout(ui)` appends `div#dayg-root` (`position:fixed;inset:0;pointer-events:none`); `zone()` returns the root; `sheet()` returns a hidden `section` with the given id whose `open`/`close` toggle `display`; `layout()`; `CONTROLS_PORTRAIT_H = 232`, `CONTROLS_W = 220` |
| `ui/a11y.ts` | every export from issue 11.3 with a trivial body (`makeButton` returns a plain `<button>` with the text and the handler) |
| `ui/prompt.ts` | working minimum: a `div#dayg-prompt` in `zone('prompt')` showing `view.primary.label` |
| `ui/actionList.ts`, `ui/statusPanel.ts`, `ui/settingsPanel.ts`, `ui/mapPanel.ts`, `ui/hints.ts` | factories returning no-op objects |

Factories: `createPromptBar(deps: PromptDeps): PromptBar`, `createActionList(): ActionList`,
`createStatusPanel(): StatusPanel`, `createSettingsPanel(): SettingsPanel`, `createMapPanel(deps: MapDeps): MapPanel`,
`createHints(): Hints`, `initLayout(ui: HTMLElement): Layout`, `layout(): Layout`.

### 5.6 `src/main.ts`

- `loadPrefs()`, then `const L = initLayout(ui)`; pass `L.root` (not `ui`) to `createTouchControls`,
  `createInventoryPanel`, `createRecap` and phases 4-8 panels; `createHud(L.root, { onMenu })` where `onMenu` opens the
  pack, map, status or settings. Achievements keep `ui`.
- `L.onSheet((s) => { touch.setVisible(!s && player.alive); input.setPointerLockAllowed(!s); })`; the frame loop's
  "panel open" test becomes `L.openSheet() !== null` (plus the old checks).
- Input: `inp.back` → `L.closeAll() || settings.open()`; `inp.map` → `map.toggle()`; `inp.inventory` → pack toggle.
- Prompt: `const near = interact.nearby()`. With `near[0]`: `{ primary: { id, label: label()! }, more: near.length - 1,
  kind: 'act' }`. Else the climb hint: `too-high` → `{ primary: { id: 'climb', label: 'Too high to climb' }, more: 0,
  note: 'Needs a rope or a ladder', kind: 'blocked' }`, other kinds `kind: 'climb'` with the existing words. `onPrimary`
  → `interact.trigger()` (or the climb edge); `onMore` and `inp.actionHold` → `actions.open('Actions', near.map(...),
  (id) => interact.triggerId(id))`. `touch.setActionLabel(view && view.kind !== 'blocked' ? view.primary!.label : null)`,
  `touch.setStance(player.stance)`, `promptBar.setDevice(touch.active() ? 'touch' : 'keys')`.
- HUD state adds `noise: player.noise, infectionHoursLeft: null`; `status.update(state)` and `map.update()` every
  frame; hints get a `HintInput` built from the player, needs, clock, `camp.firesLit()` and
  `near.some((i) => i.id.startsWith('container:'))`.
- Pause: while Settings is open or `document.hidden`, skip `clock.update` (solo only).
- The debug parameters in section 4.
- Map deps: `outline: MAP_OUTLINE`, `regions: REGIONS.map((r) => ({ id: r.id, name: r.name, rect: r.rect, haven:
  r.traits.includes('HAVEN') }))` (or the full-map list if phases 4-8 made one), `regionAt`, and the player position
  and facing.

### 5.7 Step 0 checks

`npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`, then with the dev server on
5206: `bash tools/smoke.sh "http://localhost:5206/?seed=1" dayg-root dayg-hud dayg-touch dayg-prompt`.

---

## 6. Shared text pasted into issues

These blocks are repeated inside each issue that needs them (workers cannot see this section).

- **ENV**: the Environment section.
- **TOKENS**: the `T` token list.
- **A11Y**: the `a11y.ts` contract.
- **LAYOUT**: the layout contract.
- **SHOTS** and **AUDIT**: how to check a screen (rounds 2-4; round 1 uses the inline iframe recipe).

---

## 7. Epic 11A: shared foundation (round 1)

~~~~text
Epic: 11A Shared foundation (issue 11.1 Theme tokens and prefs)
Depends on: none (Step 0 stubs exist)
Stories: S10, S36, S37, S40

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only the files under Change. Never edit src/main.ts, src/config.ts, src/game/types.ts
  or src/ui/types.ts (planner-owned).
- Tests run under vitest in Node (no DOM): importing your modules must not touch `document`, `window`,
  `localStorage` or `matchMedia` at import time; guard every use with `typeof x !== 'undefined'` and try/catch.
- Do not commit.

## Goal
`src/ui/theme.ts` holds every colour, type size, spacing, target size and radius as tokens in a dark and a
high-contrast theme, applies them as CSS custom properties with a text scale, and a test proves the contrast ratios.
`src/ui/prefs.ts` loads, saves and broadcasts the player's UI preferences.

## Read first
- games/dayg/src/ui/types.ts: `ThemeName`, `TextScale`, `UiPrefs` (do not edit).
- games/dayg/src/ui/theme.ts and games/dayg/src/ui/prefs.ts: the planner's stubs; keep every exported name.
- games/dayg/src/ui/hud.ts: the colours in use today (for reference only).

## Change
- games/dayg/src/ui/theme.ts: fill in.
- games/dayg/src/ui/prefs.ts: fill in.
- games/dayg/src/ui/theme.test.ts (new): tests for both modules.

## Contract
```ts
import type { ThemeName, TextScale, UiPrefs } from './types';

export type ColorKey = 'bg' | 'plate' | 'plateStrong' | 'plateHud' | 'text' | 'textDim' | 'accent' | 'accentText'
  | 'ok' | 'warn' | 'danger' | 'focus' | 'border' | 'disabled';
export type FontKey = 'small' | 'hud' | 'label' | 'body' | 'title';
export interface ThemeTokens {
  color: Record<ColorKey, string>;
  font: { family: string } & Record<FontKey, number>;          // px at text scale 1
  space: { xs: number; s: number; m: number; l: number; xl: number };
  target: { min: number; touch: number; big: number };
  radius: { s: number; m: number; pill: number };
  motion: { fast: number; slow: number };                       // ms
}
export const MIN_FONT_PX = 14;
export const THEMES: Record<ThemeName, ThemeTokens>;
export const T: {
  color: Record<ColorKey, string>;                               // 'var(--dg-color-text)' etc.
  font: { family: string } & Record<FontKey, string>;            // 'var(--dg-font-body)', family 'var(--dg-font-family)'
  space: Record<'xs' | 's' | 'm' | 'l' | 'xl', string>;          // 'var(--dg-space-m)'
  target: Record<'min' | 'touch' | 'big', string>;               // 'var(--dg-target-min)'
  radius: Record<'s' | 'm' | 'pill', string>;                    // 'var(--dg-radius-m)'
};
export function cssVars(theme: ThemeName, scale: TextScale, reduceMotion?: boolean): Record<string, string>;
export function applyTheme(el: HTMLElement, prefs: Pick<UiPrefs, 'theme' | 'textScale' | 'reduceMotion'>): void;
export function contrastRatio(fg: string, bg: string): number;  // '#rgb' or '#rrggbb'; WCAG 2 formula
```
Var names: `--dg-color-<key>` with the key in kebab case (`plateStrong` → `--dg-color-plate-strong`,
`plateHud` → `--dg-color-plate-hud`, `textDim` → `--dg-color-text-dim`, `accentText` → `--dg-color-accent-text`),
`--dg-font-family`, `--dg-font-<key>`, `--dg-space-<key>`, `--dg-target-<key>`, `--dg-radius-<key>`,
`--dg-motion-fast`, `--dg-motion-slow`, `--dg-scale`.

Values:

| key | dark | contrast |
|---|---|---|
| bg | #121814 | #000000 |
| plate | #1c2420 | #000000 |
| plateStrong | #26302a | #1a1a1a |
| plateHud | rgba(28,36,32,0.88) | rgba(0,0,0,1) |
| text | #f2f5ef | #ffffff |
| textDim | #b8c4b6 | #e6e6e6 |
| accent | #e8c35a | #ffe14d |
| accentText | #1a1a10 | #000000 |
| ok | #8fc26a | #7dff7d |
| warn | #f0b43c | #ffd000 |
| danger | #ff7a66 | #ff8c8c |
| focus | #ffd75e | #00e5ff |
| border | #6d7f66 | #ffffff |
| disabled | #7b857a | #bdbdbd |

Both themes: family `system-ui, -apple-system, "Segoe UI", sans-serif`; font small 14, hud 14, label 15, body 16,
title 20; space 4, 8, 12, 16, 24; target 44, 56, 72; radius 6, 10, 999; motion fast 120, slow 300.

`cssVars`: colours as given; each font size `${round1(px * scale)}px`; space, target and radius in px, not scaled;
motion `0ms` for both when `reduceMotion`, else the values in ms; `--dg-scale` as `String(scale)`.
`applyTheme`: sets every entry of `cssVars(...)` with `el.style.setProperty(name, value)`, then
`el.dataset.theme = theme` and `el.dataset.reduceMotion = reduceMotion ? '1' : '0'`.

prefs.ts:
```ts
export const PREFS_KEY = 'dayg.ui.prefs';
export const DEFAULT_PREFS: UiPrefs = { theme: 'dark', textScale: 1, reduceMotion: false, hand: 'right', cameraFollow: false, hints: true, announce: true };
export function parsePrefs(raw: unknown, base?: UiPrefs): UiPrefs;          // copies only valid fields of raw over base (default DEFAULT_PREFS)
export function prefsFromSearch(search: string, base: UiPrefs): UiPrefs;    // URL overrides
export function systemDefaults(): UiPrefs;
export function loadPrefs(search?: string): UiPrefs;                         // sets and returns the current prefs
export function getPrefs(): UiPrefs;                                         // a copy; DEFAULT_PREFS before loadPrefs
export function setPrefs(patch: Partial<UiPrefs>): UiPrefs;                  // merge (through parsePrefs), save, notify
export function onPrefs(cb: (p: UiPrefs) => void): () => void;              // returns unsubscribe
```
- Valid values: theme `dark|contrast`; textScale `1|1.25|1.5|2`; hand `right|left`; booleans for the rest.
- URL overrides: `ui-theme=dark|contrast`, `ui-scale=1|1.25|1.5|2`, `ui-hand=right|left`, `ui-motion=reduce|full`,
  `ui-follow=1|0`, `ui-hints=1|0`; invalid values are ignored.
- `systemDefaults()`: DEFAULT_PREFS, then if `matchMedia` exists: `(prefers-contrast: more)` → theme contrast,
  `(prefers-reduced-motion: reduce)` → reduceMotion true, `(pointer: coarse)` → cameraFollow true.
- `loadPrefs(search = location.search when defined, else '')`: systemDefaults → stored JSON at PREFS_KEY (try/catch;
  bad JSON ignored) → URL overrides.
- `setPrefs`: saves JSON to localStorage in try/catch; calls every listener with a copy.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- `cd games/dayg && npx vitest run src/ui/theme.test.ts` passes, with tests for:
  - dark: text and textDim at least 4.5:1 on plate and on plateStrong; ok, warn, danger and accent at least 4.5:1 on
    plate; accentText at least 4.5:1 on accent; focus, border and disabled at least 3:1 on plate.
  - contrast: text, textDim, ok, warn, danger and accent at least 7:1 on plate and plateStrong; accentText at least 7:1
    on accent; focus, border and disabled at least 4.5:1 on plate.
  - `contrastRatio('#000000', '#ffffff')` is 21 (within 0.01); `contrastRatio('#777', '#777')` is 1.
  - every font size in both themes is at least MIN_FONT_PX; `cssVars('dark', 2)['--dg-font-body']` is `'32px'`;
    `cssVars('dark', 1, true)['--dg-motion-fast']` is `'0ms'`.
  - `parsePrefs({ theme: 'neon', textScale: 3, hand: 'left' })` keeps default theme and scale and hand `left`.
  - `prefsFromSearch('?ui-theme=contrast&ui-scale=1.5&ui-motion=reduce', DEFAULT_PREFS)` gives contrast, 1.5, true.
- Every T string matches its var name (a test loops over `Object.keys(cssVars('dark', 1))` and checks each T value's
  var name is among them).

## Out of scope
Every other file in games/dayg, including src/ui/layout.ts (issue 11.2) and src/ui/a11y.ts (11.3), which import your
exports through the stubs' signatures.
~~~~

~~~~text
Epic: 11A Shared foundation (issue 11.2 Layout zones and sheets)
Depends on: none (Step 0 stubs exist)
Stories: S08, S20, S22, S23, S36

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only games/dayg/src/ui/layout.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts (planner-owned).
- Repo rules: UI modules append their own container to the element they are given and never restyle or hide `#ui`;
  every control at least 44 px; colours, font sizes, spacing and target sizes come from tokens, never literals.
- theme.ts, prefs.ts and a11y.ts are being written by other workers now; call them only through the signatures in the
  Contract below (the stubs already export them).
- Dev server for your checks: port 5311 only (`cd games/dayg && npx vite --port 5311 --strictPort`, in the
  background; stop it when done). Do not commit.

## Goal
`src/ui/layout.ts` owns the DayG UI root, the screen zones every module mounts into, and the sheet (the one panel shape
every screen uses: dialog role, titled header with a Close button, scrolling body, footer, Esc, focus trap).

## Read first
- games/dayg/src/ui/types.ts: `Zone`, `Orientation`, `SheetOpts`, `Sheet`, `Layout` (do not edit).
- games/dayg/src/ui/layout.ts: the planner's working stub; keep every export.
- games/dayg/src/ui/theme.ts, games/dayg/src/ui/a11y.ts: stub signatures only.
- games/dayg/index.html: `#ui` is `position:fixed;inset:0;pointer-events:none`.

## Change
- games/dayg/src/ui/layout.ts: the full module.

## Contract
```ts
import type { Layout, Orientation, Sheet, SheetOpts, Zone } from './types';
export const CONTROLS_PORTRAIT_H = 232;   // touch block height, px
export const CONTROLS_W = 220;            // touch block width, px
export const PROMPT_BOTTOM_PORTRAIT = 244; // CONTROLS_PORTRAIT_H + 12
export const SHEET_Z = 50;
export function initLayout(ui: HTMLElement): Layout;   // idempotent: a second call returns the same Layout
export function layout(): Layout;                       // throws Error('initLayout first') before initLayout
```
Uses (signatures fixed; other workers fill the bodies):
```ts
import { applyTheme, T } from './theme';          // applyTheme(el, { theme, textScale, reduceMotion }): void; T.color.plate etc. are 'var(--dg-...)' strings
import { getPrefs, onPrefs } from './prefs';      // getPrefs(): UiPrefs; onPrefs(cb): () => void
import { makeButton, trapFocus, focusFirst, injectBaseCss } from './a11y';
// makeButton({ text, label?, size?: 'min'|'touch'|'big', variant?, onPress }): HTMLButtonElement
// trapFocus(container): () => void (release); focusFirst(container): boolean; injectBaseCss(): void
```
Tokens (CSS var strings): T.color.{bg, plate, plateStrong, plateHud, text, textDim, accent, accentText, ok, warn,
danger, focus, border, disabled}; T.font.{family, small, hud, label, body, title}; T.space.{xs, s, m, l, xl};
T.target.{min, touch, big}; T.radius.{s, m, pill}.

Behaviour:
- `initLayout(ui)`: create `div#dayg-root` (`position:fixed;inset:0;pointer-events:none;font-family:${T.font.family};
  color:${T.color.text}`), append to `ui`; `injectBaseCss()`; `applyTheme(root, getPrefs())` and re-apply on
  `onPrefs`. Inject one `<style id="dayg-layout-style">` into `document.head` with the zone and sheet CSS.
- Zones: one `div` each, id `dayg-zone-<name>`, class `dg-zone`, `position:absolute;pointer-events:none`. Children that
  are controls set `pointer-events:auto` themselves. z-index: zones 10, `alerts` 25, `controls` 20.
  - `status`: top `calc(env(safe-area-inset-top,0px) + 8px)`, left `calc(env(safe-area-inset-left,0px) + 8px)`,
    `max-width:46vw` (landscape `30vw`), flex column, gap `T.space.xs`.
  - `clock`: same top, right `calc(env(safe-area-inset-right,0px) + 8px)`, `max-width:50vw` (landscape `34vw`), flex
    column, `align-items:flex-end`, `text-align:right`, gap `T.space.xs`.
  - `corner`: a child of the `clock` zone (its last child): flex row with `flex-wrap:wrap`, gap `T.space.s`,
    `justify-content:flex-end`, `margin-top:${T.space.s}` (it holds PACK, MAP, ☰ and, in build mode, BUILD).
  - `alerts`: portrait `left:16px;right:16px;top:calc(env(safe-area-inset-top,0px) + var(--dg-top-h,140px))`;
    landscape `left:33.333%;right:33.333%;top:calc(env(safe-area-inset-top,0px) + 8px)`; flex column, centred items,
    gap `T.space.xs`.
  - `prompt`: portrait `left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 244px)`; landscape
    `left:33.333%;right:33.333%;bottom:calc(env(safe-area-inset-bottom,0px) + 16px)`; flex column, centred.
  - `busy`: as `prompt` but `bottom` adds `var(--dg-prompt-h,0px) + 8px`.
  - `controls`: `inset:0`.
  - A `ResizeObserver` on `status`, `clock` and `prompt` sets `--dg-top-h` on the root to
    `max(status.bottom, clock.bottom) + 8 - safeTop` px (use `getBoundingClientRect().bottom` minus the root's top)
    and `--dg-prompt-h` to the prompt zone's height in px. This keeps zones apart at any text scale.
- `orientation()`: `innerHeight > innerWidth ? 'portrait' : 'landscape'`; `resize` fires `onOrientation` listeners
  only when it changes.
- `sheet(opts)`: a `section` with `id = opts.id`, class `dg-sheet dg-sheet-<size>` (size default `tall`),
  `role="dialog"`, `aria-modal="true"`, `aria-labelledby="<id>-title"`, `display:none`, `pointer-events:auto`,
  `z-index:${SHEET_Z}`, `background:${T.color.plate}`, `color:${T.color.text}`, flex column, appended to the root.
  - header: `h2#<id>-title` (font `T.font.title`, margin 0, flex 1) and a Close button
    `makeButton({ text: '✕', label: 'Close ' + title, size: 'min', onPress: close })` styled 48 x 48. Header padding
    `T.space.m`, `border-bottom:1px solid ${T.color.border}`.
  - body: `div.dg-sheet-body` (`flex:1;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;
    padding:${T.space.m}`); footer: `div.dg-sheet-footer` (padding `T.space.m`, hidden by CSS when `:empty`).
  - Geometry, portrait: `left:0;right:0;bottom:0;height:85%` (`full`: `top:0;height:100%`),
    `border-radius:${T.radius.m} ${T.radius.m} 0 0`. Landscape: `top:0;right:0;bottom:0;width:62%` (`full`:
    `left:0;width:100%`); when the viewport is at least 1100 px wide, `tall` is `width:min(720px,62%)`. Padding adds
    the safe-area insets on the outer edges.
  - `open()`: close any other open sheet first; remember `document.activeElement`; `display:flex`;
    `release = trapFocus(section)`; `focusFirst(body) || closeButton.focus()`; listen for `keydown` Escape on the
    section (call `close()`, `stopPropagation()`); notify `onSheet` listeners with this sheet.
  - `close()`: `display:none`; `release()`; refocus the remembered element if it is still connected; `opts.onClose?.()`;
    notify `onSheet` listeners with `null`. Closing a closed sheet does nothing.
  - `setTitle(t)` updates the h2 and the Close button's `aria-label`.
- `closeAll()`: closes the open sheet; returns whether one was open.
- `?layout-demo=1` (read from `location.search` inside `initLayout`): put a dashed outline and a text label (the zone
  name, font `T.font.small`) in every zone except `controls`, and open a demo sheet `{ id: 'dayg-layout-demo', title:
  'Layout demo' }` holding three makeButton buttons ("One", "Two", "Three") and 40 lines of text so the body scrolls.

## Done when
- `npx tsc --noEmit -p games/dayg` passes (other workers' files may be mid-edit; your file must not add errors).
- With the server on 5311, screenshots via the iframe recipe below of `http://localhost:5311/?seed=1&touch=1&layout-demo=1`
  at 390x844 and 844x390, and of `http://localhost:5311/?seed=1&layout-demo=1` at 1280x800 directly: read the PNGs.
  Portrait: the sheet covers the bottom 85% with its title and ✕ in the header; landscape: the sheet is the right 62%;
  desktop: the sheet is 720 px wide on the right. Zone labels in the top corners do not overlap each other.
- Repeat the portrait shot with `&ui-scale=2`: the zone labels still do not overlap and the alerts label sits below
  both top zones.
- `bash tools/smoke.sh "http://localhost:5311/?seed=1&layout-demo=1" dayg-root dayg-zone-status dayg-zone-prompt dayg-layout-demo`
  prints SMOKE OK.

Iframe recipe (headless Edge will not make a window narrower than about 492 px, so a 390 px page goes in an iframe):
```sh
W=390; H=844; URL="http://localhost:5311/?seed=1&touch=1&layout-demo=1"; OUT="$(cygpath -m "$TEMP")"
printf '<!doctype html><body style="margin:0;background:#000"><iframe src="%s" width="%s" height="%s" style="border:0;display:block"></iframe></body>' "$URL" $W $H > "$TEMP/dayg-11.2-wrap.html"
"/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader \
  --window-size=$(( W < 520 ? 520 : W )),$(( H < 520 ? 520 : H )) --virtual-time-budget=9000 \
  --screenshot="$OUT/dayg-11.2-${W}x${H}.png" "file:///$OUT/dayg-11.2-wrap.html"
```
The page is the top-left W x H of the PNG. Repeat with W=844 H=390.

## Out of scope
theme.ts, prefs.ts (11.1), a11y.ts (11.3), the scripts (11.4), every existing UI module (they move onto zones and
sheets in later rounds), main.ts.
~~~~

~~~~text
Epic: 11A Shared foundation (issue 11.3 Focus, label and live-region helpers)
Depends on: none (Step 0 stubs exist)
Stories: S10, S38, S39, S40

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only the files under Change. Never edit src/main.ts, src/config.ts, src/game/types.ts
  or src/ui/types.ts (planner-owned).
- Tests run under vitest in Node (no DOM): importing a11y.ts must not touch `document` at import time.
- theme.ts and prefs.ts are being written by another worker; use only `T` and `getPrefs()` as given below.
- Do not commit.

## Goal
`src/ui/a11y.ts` gives every DayG screen the same accessible button, focus handling, visually hidden live regions and
words for need levels, so no screen signals by colour alone and every control has a name.

## Read first
- games/dayg/src/ui/a11y.ts: the planner's stub; keep every export name and signature.
- games/dayg/src/ui/types.ts: `UiPrefs` (field `announce`).
- games/dayg/src/config.ts: `DOM.livePolite` (`'dayg-live-polite'`), `DOM.liveAssertive`, `DOM.root` (`'dayg-root'`).
- games/dayg/src/ui/inventoryPanel.ts: its `button()` helper, the pattern you replace (reference only).

## Change
- games/dayg/src/ui/a11y.ts: the full module.
- games/dayg/src/ui/a11y.test.ts (new): unit tests for `needLevel`.

## Contract
```ts
export interface ButtonOpts {
  text: string; label?: string; icon?: HTMLElement;
  size?: 'min' | 'touch' | 'big';            // min height and width: T.target.min / touch / big (default 'min')
  variant?: 'plain' | 'primary' | 'danger';  // default 'plain'
  onPress: () => void;
}
export function makeButton(o: ButtonOpts): HTMLButtonElement;
export function setButtonEnabled(b: HTMLButtonElement, enabled: boolean, reason?: string): void;
export function focusables(container: HTMLElement): HTMLElement[];
export function focusFirst(container: HTMLElement): boolean;
export function trapFocus(container: HTMLElement): () => void;
export function announce(text: string, mode?: 'polite' | 'assertive'): void;
export function srOnly(el: HTMLElement): void;
export type NeedLevel = 'ok' | 'low' | 'critical' | 'zero';
export function needLevel(value: number): { level: NeedLevel; mark: '' | '!' | '!!'; word: string };
export function injectBaseCss(): void;
```
Uses: `import { T } from './theme'` (T.color.plateStrong etc. are `var(--dg-...)` strings; keys: bg, plate,
plateStrong, plateHud, text, textDim, accent, accentText, ok, warn, danger, focus, border, disabled; T.font.{family,
small, hud, label, body, title}; T.space.{xs,s,m,l,xl}; T.target.{min,touch,big}; T.radius.{s,m,pill}) and
`import { getPrefs } from './prefs'` (`getPrefs().announce: boolean`).

Behaviour:
- `makeButton`: `<button type="button" class="dg-btn dg-btn-<variant> dg-size-<size>">`; optional icon (set
  `aria-hidden="true"` on it) then a `span` with the text; `aria-label` = `label` when given; `pointer-events:auto`;
  `touch-action:manipulation`. Stop propagation of `pointerdown` and `click` (so the touch layer under it never sees the
  press). `click` calls `onPress` unless `aria-disabled="true"`. Enter and Space work because it is a real button.
- `setButtonEnabled(b, false, reason)`: `aria-disabled="true"`, class `dg-disabled`, `title = reason ?? ''`; the button
  stays focusable. `true` removes all three.
- `focusables(c)`: `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])` inside `c` that are not
  `disabled` and have a client rect (visible), in DOM order.
- `focusFirst(c)`: focuses the first of `focusables(c)`; returns whether it found one.
- `trapFocus(c)`: a `keydown` listener on `c`: Tab on the last focusable wraps to the first, Shift+Tab on the first
  wraps to the last (`preventDefault`); returns a function that removes the listener.
- `announce(text, mode = 'polite')`: do nothing if `getPrefs().announce` is false or `document` is undefined. Find or
  create `div#dayg-live-polite` (`role="status"`, `aria-live="polite"`) or `div#dayg-live-assertive` (`role="alert"`,
  `aria-live="assertive"`), made `srOnly`, appended to `#dayg-root` if it exists, else `document.body`. Skip the call
  if the same text went to the same region less than 3000 ms ago. Set `textContent = ''`, then after 50 ms the text.
- `srOnly(el)`: adds class `dg-sr-only`.
- `needLevel(v)`: `v <= 0` → `{ level: 'zero', mark: '!!', word: 'harming you' }`; `v < 10` → `critical`, `!!`,
  `'critical'`; `v < 30` → `low`, `!`, `'low'`; else `ok`, `''`, `'fine'`.
- `injectBaseCss()`: once, `<style id="dayg-a11y-style">` in `document.head` with:
  - `.dg-sr-only{position:absolute!important;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;padding:0}`
  - `#dayg-root :focus-visible{outline:3px solid var(--dg-color-focus);outline-offset:2px}`
  - `.dg-btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--dg-space-xs);box-sizing:border-box;min-width:var(--dg-target-min);min-height:var(--dg-target-min);padding:var(--dg-space-s) var(--dg-space-m);border:2px solid var(--dg-color-border);border-radius:var(--dg-radius-m);background:var(--dg-color-plate-strong);color:var(--dg-color-text);font:600 var(--dg-font-label)/1.2 var(--dg-font-family);cursor:pointer}`
  - `.dg-size-touch{min-width:var(--dg-target-touch);min-height:var(--dg-target-touch)}`, `.dg-size-big{min-width:var(--dg-target-big);min-height:var(--dg-target-big)}`
  - `.dg-btn-primary{background:var(--dg-color-accent);color:var(--dg-color-accent-text);border-color:var(--dg-color-accent)}`, `.dg-btn-danger{color:var(--dg-color-danger);border-color:var(--dg-color-danger)}`
  - `.dg-btn[aria-pressed="true"],.dg-btn[aria-checked="true"],.dg-btn[aria-selected="true"]{outline:3px solid var(--dg-color-accent);outline-offset:-5px}` (a shape, not only a colour)
  - `.dg-disabled{border-style:dashed;color:var(--dg-color-disabled);cursor:default}`
  - `[data-reduce-motion="1"] *,[data-reduce-motion="1"] *::before,[data-reduce-motion="1"] *::after{animation:none!important;transition:none!important}`
  - `@media (prefers-reduced-motion: reduce){#dayg-root *{animation:none!important;transition:none!important}}`

## Done when
- `npx tsc --noEmit -p games/dayg` passes (your file adds no errors).
- `cd games/dayg && npx vitest run src/ui/a11y.test.ts` passes: needLevel at 100, 30, 29.9, 10, 9.9, 0.1, 0 and -5
  gives fine, fine, low, low, critical, critical, harming you, harming you, with marks '', '', '!', '!', '!!', '!!',
  '!!', '!!'.
- `grep -n "document\." games/dayg/src/ui/a11y.ts` shows no use at module top level (only inside functions).

## Out of scope
theme.ts and prefs.ts (11.1), layout.ts (11.2), the scripts (11.4), every other UI module.
~~~~

~~~~text
Epic: 11A Shared foundation (issue 11.4 UI audit and screenshot scripts)
Depends on: none
Stories: S28, S36, S38, S40 (the checks every later issue runs)

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed (`puppeteer-core` 24 is in the root
  node_modules); do not run npm install and do not edit any package.json.
- Edge is at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.
- Other workers are editing games/dayg/src right now: change only the two new scripts. Dev server for your checks:
  port 5313 only (`cd games/dayg && npx vite --port 5313 --strictPort`, in the background; stop it when done).
- Do not commit.

## Goal
Two scripts every DayG UI issue uses: `ui-audit.mjs` loads the game in headless Edge at given viewport sizes and fails
on unnamed controls, small targets, small text, controls off screen, overlapping controls, bad dialogs, running
animations and console errors; `ui-shot.mjs` takes screenshots at exact sizes, wrapping narrow pages in an iframe.

## Read first
- tools/zfight.mjs: how it finds the browser (`BROWSERS` list) and calls `puppeteer.launch({ executablePath, ... })`;
  copy that pattern.
- tools/smoke.sh: the Edge flags used for headless WebGL (`--headless=new --use-angle=swiftshader
  --enable-unsafe-swiftshader`).

## Change
- games/dayg/scripts/ui-audit.mjs (new).
- games/dayg/scripts/ui-shot.mjs (new).

## Contract
ui-audit.mjs:
```
node games/dayg/scripts/ui-audit.mjs --url "<url>" [--sizes 390x844,844x390,1280x800] [--scope "<css>,<css>"]
                                     [--wait 6000] [--motion] [--json]
node games/dayg/scripts/ui-audit.mjs --self-test
```
- Defaults: sizes `390x844,844x390,1280x800`, wait 6000 ms.
- Per size: new page, `page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 900, hasTouch:
  width < 900 })`, collect `console` messages of type `error` and `pageerror`, `goto(url, { waitUntil: 'load' })`,
  wait `--wait` ms, run the checks in `page.evaluate`.
- Elements checked: inside `#dayg-root` (else `#ui`, else `body`). If any visible `[role=dialog][aria-modal=true]` or
  `[role=alertdialog]` exists, only elements inside the topmost one (highest z-index, last in DOM on ties) are checked.
  With `--scope`, only elements inside an element matching one of the selectors.
- Visible: has a client rect of non-zero size, computed `visibility` is not `hidden`, `opacity` above 0 for it and every
  ancestor, and no ancestor has `aria-hidden="true"` or `display:none`.
- Interactive: `button, a[href], input, select, textarea, [role=button], [role=tab], [role=radio], [role=switch],
  [tabindex]:not([tabindex="-1"])`.
- Checks (name: rule):
  - `name`: every visible interactive element has an accessible name: `aria-label`, or the text of the elements named
    by `aria-labelledby`, or trimmed `textContent`, or `title`.
  - `target`: every visible interactive element is at least 44 x 44 CSS px (0.5 px tolerance).
  - `font`: every visible element that has a direct non-whitespace text-node child has computed `font-size` of at least
    14 px.
  - `offscreen`: every visible interactive element lies inside the viewport (1 px tolerance); for one inside a
    scrolling ancestor (`overflow-x` or `overflow-y` auto or scroll), only the horizontal bounds of the viewport count.
  - `overlap`: no two visible elements from the set (interactive elements plus `[data-audit-box]` elements) intersect by
    more than 16 px², unless one contains the other in the DOM.
  - `dialog`: every visible `[role=dialog]` has `aria-modal="true"` and an `aria-labelledby` pointing to an element with
    text; every `[role=alertdialog]` has `aria-labelledby` likewise.
  - `motion` (only with `--motion`): `document.getAnimations().filter((a) => a.playState === 'running')` is empty.
  - `console`: no console error or page error was logged.
- Output: one line per failure, `FAIL <W>x<H> <check> <element> <detail>`, where `<element>` is
  `tag#id.class1.class2` plus `"<first 30 chars of the accessible name>"`; then `<n> failures` or `UI AUDIT OK`.
  `--json` prints `{ failures: [{ size, check, element, detail }] }` instead. Exit 1 on any failure, 2 on a usage error.
- `--self-test`: build a data URL page (no game) with `<div id="dayg-root">` holding: a named 48 px button (passes), an
  unnamed 48 px button (`name`), a named 30 px button (`target`), a 12 px text span (`font`), a named 48 px button at
  `left:-100px` (`offscreen`), two named 48 px buttons at the same spot (`overlap`), a `role=dialog` without
  `aria-modal` (`dialog`), and a running CSS animation (`motion`). Run all checks (with motion) at 800x600 and assert
  the failure set is exactly those checks on those elements. Print `SELF-TEST OK` and exit 0, or the difference and
  exit 1.

ui-shot.mjs:
```
node games/dayg/scripts/ui-shot.mjs --url "<url>" --name <prefix> [--sizes 390x844,844x390,1280x800] [--out <dir>]
```
- Default out: `os.tmpdir()`. For each W x H: if W < 520 or H < 520, write `<out>/<prefix>-wrap-<W>x<H>.html`:
  `<!doctype html><body style="margin:0;background:#000"><iframe src="<url>" width="W" height="H" style="border:0;display:block"></iframe></body>`
  and shoot `file:///<that path with forward slashes>` with window `max(W,520) x max(H,520)`; else shoot the URL with
  window W x H. Shoot with `execFileSync(edge, ['--headless=new', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=<w>,<h>', '--virtual-time-budget=9000',
  '--screenshot=<out>/<prefix>-<W>x<H>.png', target])`. Print each PNG path. The page is the top-left W x H of the PNG.
  Headless Edge will not make a window narrower than about 492 px, which is why narrow pages go in the iframe.

## Done when
- `node games/dayg/scripts/ui-audit.mjs --self-test` prints SELF-TEST OK and exits 0.
- With the server on 5313: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5313/?seed=1&touch=1" --sizes 390x844`
  finishes in under 90 s and reports at least one `font` failure (today's HUD labels are 12 px); this shows the checks
  work against the game. Exit code 1 is expected here.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5313/?seed=1&touch=1" --name dayg-11.4` prints three
  PNG paths; read the 390x844 one: the game fills the top-left 390 x 844 with no black band inside it.

## Out of scope
Everything under games/dayg/src, tools/, every package.json.
~~~~

### End of round 1 (planner)

`npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`,
`node games/dayg/scripts/ui-audit.mjs --self-test`, the `?layout-demo=1` shots at three sizes and smoke at 5206. Then
move `main.ts` onto the real layout (Step 0 already passes `L.root`), and re-check round 2's issues against the code.

---

## 8. Epic 11B: play screen (round 2)

~~~~text
Epic: 11B Play screen (issue 11.5 HUD)
Depends on: none (round 1 done)
Stories: S01, S02, S03, S04, S05, S06, S07, S08, S10, S19, S39

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now (prompt.ts, actionList.ts, touch.ts, input.ts, statusPanel.ts, settingsPanel.ts): change only
  games/dayg/src/ui/hud.ts. Never edit src/main.ts, src/config.ts, src/game/types.ts or src/ui/types.ts.
- Repo rules: mount into the layout zones, never restyle or hide `#ui`; every control at least 44 px; no colour-only
  signal; colours, font sizes, spacing and targets from tokens `T`, never hex or px font literals.
- Dev server: port 5314 only (`cd games/dayg && npx vite --port 5314 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
The HUD is quiet and readable: four need rows with words and marks, a noise line, the body figure with a words line,
clock and weather, a SAFE badge, PACK/MAP/settings corner buttons, and on-demand stamina, carry, place, busy bar and
alerts, all in the layout zones and all on theme tokens.

## Read first
- games/dayg/src/ui/hud.ts: the current HUD; keep `buildFigure`, `crackPath`, `veinPath` and the change cache `put`.
- games/dayg/src/game/types.ts: `HudState` (now with `noise: number` and `infectionHoursLeft: number | null`), `Hud`
  (`root`, `update`, `toast`; no `prompt`), `BodyState`, `BodyPart`, `CrackLevel`, `InfectionStage`.
- games/dayg/src/ui/types.ts: `HudDeps`, `MenuId`.
- games/dayg/src/ui/a11y.ts: `makeButton`, `needLevel`, `announce`, `srOnly`.
- games/dayg/src/ui/layout.ts: `layout().zone(...)`.

## Change
- games/dayg/src/ui/hud.ts: rewrite as below.

## Contract
```ts
export function createHud(ui: HTMLElement, deps: HudDeps): Hud;   // ui = the layout root; mount into zones instead
```
Uses: `layout().zone('status' | 'clock' | 'corner' | 'alerts' | 'busy')`; `makeButton({ text, label?, size?, variant?,
onPress })`; `needLevel(v) → { level: 'ok'|'low'|'critical'|'zero', mark: ''|'!'|'!!', word }`;
`announce(text, 'polite' | 'assertive')`. Tokens (CSS var strings): T.color.{plate, plateStrong, plateHud, text,
textDim, accent, accentText, ok, warn, danger, focus, border, disabled}; T.font.{family, small, hud, label, body,
title}; T.space.{xs, s, m, l, xl}; T.target.{min, touch, big}; T.radius.{s, m, pill}.

Layout:
- `root` = `div#dayg-hud` in `zone('status')` holding the status cluster: one `<button type="button"
  class="dg-status-btn" data-audit-box>` (`pointer-events:auto`, plate `T.color.plateHud`, radius `T.radius.m`,
  padding `T.space.s`, min 44 px, `onclick` → `deps.onMenu('status')`) with:
  - four rows Warm, Water, Food, Calm (`needs.warmth`, `.water`, `.food`, `.calm`): name (font `T.font.hud`), an 8 px
    bar (track `T.color.plateStrong`, fill by level: ok `T.color.ok`, low `T.color.warn`, critical and zero
    `T.color.danger`), then when not ok the mark and the word (`! low`, `!! critical`, `!! harming you`). Zero pulses
    (CSS animation `dg-pulse`, 1 s) unless reduce motion (the base CSS already stops animations then).
  - Stamina row, the same shape, only while `stamina < 99.5`.
  - Noise line: `Noise: quiet` when `noise < 8`, `heard nearby` when below 16, else `loud`.
  - The figure SVG to the right of the rows, and under the rows one line naming the worst condition: if
    `body.infection`, `Moss: <stage word>` (0 exposed, 1 rooting, 2 spreading, 3 taking); else the part with the
    highest crack level, `<Part> <word>` (parts head Head, chest Chest, armL Left arm, armR Right arm, legL Left leg,
    legR Right leg; levels 1 chipped, 2 cracked, 3 deep crack); nothing when whole.
  - `aria-label` on the button: `Status. Warm fine. Water low, 24. Food fine. Calm fine. Noise quiet. Left leg cracked.`
    (values rounded; built from the same words; set only when it changes).
- `zone('clock')`: a plate line `hh:mm · Day n` (with `☾ ` before it at night and `aria-label` `hh:mm, night, Day n`),
  a weather word line, a SAFE badge `⛨ SAFE · <haven name>` (plate, border `T.color.ok`, text `T.color.text`) while
  `haven` is set (names: waystation `Lychgate Waystation`, tap `The Tap`; keep `HAVEN_NAME` wherever it is imported
  from now), the region name for 4 s after it changes, and the carry line only when `carry.weight > 0.8 *
  carry.capacity`: `Heavy 7.1 / 8 kg`, or `Overloaded 9.2 / 8 kg` past capacity (warn colour plus the word). Every
  text sits on a `T.color.plateHud` plate; no text-shadow.
- `zone('corner')`: three `makeButton` buttons, each 48 x 48: `PACK` (label `Open pack`), `MAP` (label `Open map`),
  `☰` (label `Open settings`), calling `deps.onMenu('pack' | 'map' | 'settings')`.
- `zone('busy')`: shown only while `busy`: a plate with `role="progressbar"`, `aria-valuemin="0"`,
  `aria-valuemax="100"`, `aria-valuenow` = percent, text `<label> · <percent>%` and an 8 px bar.
- `toast(text, seconds = 3)`: a `div.dg-alert` with `data-audit-box` in `zone('alerts')` (plate, padding `T.space.s`,
  font `T.font.body`); at most 3 (drop the oldest); fade out over `var(--dg-motion-slow)` then remove after `seconds`;
  `announce(text, 'polite')`.
- Announce need changes: when a need's level becomes `low` → `announce('<Name> low')`; `critical` or `zero` →
  `announce('<Name> critical', 'assertive')`. Only on the change, not every frame.
- Remove the prompt code (the prompt is now `ui/prompt.ts`). Keep the change cache so the DOM changes only when a
  value does.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5314: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5314/?seed=1&touch=1" --scope "#dayg-hud,#dayg-zone-clock,#dayg-zone-alerts,#dayg-zone-busy"`
  prints UI AUDIT OK (three sizes). Repeat with `&ui-scale=2`, with `&ui-theme=contrast`, and with `&ui-motion=reduce`
  plus `--motion`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5314/?seed=1&touch=1&debug-infect=legL" --name dayg-11.5`
  and the same without `touch=1` at `--sizes 1280x800`: read the PNGs. The four need rows, the figure with
  "Moss: rooting" under it, the clock, "SAFE · Lychgate Waystation" and the three corner buttons are visible and do not
  overlap at 390x844, 844x390 and 1280x800.
- `bash tools/smoke.sh "http://localhost:5314/?seed=1" dayg-hud dayg-zone-corner` prints SMOKE OK.

## Out of scope
prompt.ts and actionList.ts (11.6), touch.ts and input.ts (11.7), statusPanel.ts (11.8), settingsPanel.ts (11.9),
layout.ts, theme.ts, a11y.ts, main.ts.
~~~~

~~~~text
Epic: 11B Play screen (issue 11.6 Prompt and action list)
Depends on: none (round 1 done)
Stories: S11, S12, S13, S14, S39

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now (hud.ts, touch.ts, input.ts, statusPanel.ts, settingsPanel.ts): change only the two files
  under Change. Never edit src/main.ts, src/config.ts, src/game/types.ts or src/ui/types.ts.
- Repo rules: mount into the layout zones, never restyle or hide `#ui`; every control at least 44 px; no colour-only
  signal; colours, font sizes, spacing and targets from tokens `T`.
- Dev server: port 5315 only (`cd games/dayg && npx vite --port 5315 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
The prompt names the verb, the key or the tap, the number of other actions in reach and a note (dirty water, dark
inside, needs a rope); "+n", hold E or a long press opens the action list sheet with every action at the spot.

## Read first
- games/dayg/src/ui/types.ts: `PromptView`, `PromptKind`, `PromptDeps`, `PromptBar`, `InputDevice`, `ActionChoice`,
  `ActionList`, `Sheet`.
- games/dayg/src/ui/prompt.ts and games/dayg/src/ui/actionList.ts: the planner's stubs; keep the exports.
- games/dayg/src/ui/a11y.ts: `makeButton`, `setButtonEnabled`, `announce`.
- games/dayg/src/ui/layout.ts: `layout().zone('prompt')`, `layout().sheet(opts)`.
- games/dayg/src/config.ts: `DOM.prompt` (`'dayg-prompt'`), `DOM.actions` (`'dayg-actions'`).

## Change
- games/dayg/src/ui/prompt.ts: the prompt bar.
- games/dayg/src/ui/actionList.ts: the action list sheet.

## Contract
```ts
export function createPromptBar(deps: PromptDeps): PromptBar;   // prompt.ts
export function createActionList(): ActionList;                 // actionList.ts
```
Types (from ui/types.ts): `PromptView { primary: { id; label } | null; more: number; note?: string | null; kind?:
'act' | 'climb' | 'enter' | 'blocked' }`; `PromptDeps { onPrimary(): void; onMore(): void }`; `PromptBar { root;
show(view | null); setDevice('keys' | 'touch') }`; `ActionChoice { id; label; disabled?: string | null }`;
`ActionList { open(title, choices, onPick(id)); close(); isOpen() }`.
Uses: `makeButton({ text, label?, size?: 'min'|'touch'|'big', variant?, onPress })`, `setButtonEnabled(b, enabled,
reason?)`, `announce(text, mode?)`, `layout().zone('prompt')`, `layout().sheet({ id, title, size?: 'tall'|'full' })`
returning `Sheet { root, header, body, footer, open, close, isOpen, setTitle }`. Tokens: T.color.{plateHud,
plateStrong, text, textDim, accent, border, disabled}, T.font.{hud, label, body, small}, T.space.{xs,s,m},
T.target.{min, touch}, T.radius.{m, pill}.

Prompt bar:
- `root` = `div#dayg-prompt` with `data-audit-box` in `zone('prompt')`: flex row, centred, gap `T.space.s`,
  `max-width:100%`.
- Main part: a `<button type="button" class="dg-prompt-main">` (plate `T.color.plateHud`, border 2px `T.color.border`,
  radius `T.radius.pill`, `min-height: T.target.touch`, padding `T.space.s T.space.m`, `pointer-events:auto`) holding:
  with device `keys` a key cap `<kbd>E</kbd>` (`aria-hidden`, border, font `T.font.hud`); the label (font
  `T.font.body`); and, when `note`, a second line (font `T.font.small`, colour `T.color.textDim`; prefix `⌂ ` for kind
  `enter`). `aria-label`: `<label>, press E` (keys) or `<label>, tap to do it` (touch), plus `. <note>` when there is
  one. Click → `deps.onPrimary()`.
- Kind `blocked`: `setButtonEnabled(main, false, note ?? label)`; clicks do nothing.
- Kind `enter` (a doorway: interiors are walk-in, there is no enter action): the main part is a `div` (not a button,
  `role="status"`) with the label (a building name), the note line with the `⌂ ` prefix, no key cap, no "+n", and no
  `onPrimary` call.
- More: when `more > 0`, a `makeButton` after the main part: text `+<n>` (touch) or `Hold E · +<n>` (keys), label
  `<n> more actions`, size `min`, `onPress: deps.onMore`.
- `show(null)` hides the root (`display:none`). `show(view)` rebuilds only when `JSON.stringify(view)` or the device
  changed.
- Announce: on a new label (not a repeat), `announce(label + (note ? '. ' + note : ''))`, at most once every 1500 ms
  (skip, do not queue).

Action list:
- One sheet made at construction: `layout().sheet({ id: 'dayg-actions', title: 'Actions', size: 'tall' })`.
- `open(title, choices, onPick)`: `setTitle(title)`; body gets a `ul` (`role="list"`, no bullets, gap `T.space.s`);
  per choice an `li` with `makeButton({ text: '<i+1>. <label>', label, size: 'touch', onPress })`, width 100%,
  left-aligned; a disabled choice gets `setButtonEnabled(b, false, reason)` and the reason as visible text under it
  (font `T.font.small`). Picking: `close()` then `onPick(id)`. While open, keys `Digit1`..`Digit9` on the sheet root
  pick that choice (`stopPropagation`). Then `sheet.open()`.
- `close()` and `isOpen()` pass through to the sheet.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5315:
  `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5315/?seed=1&touch=1&prompt=enter" --scope "#dayg-prompt"`
  and `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5315/?seed=1&touch=1&open=actions"` print
  UI AUDIT OK; repeat both with `&ui-scale=2`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5315/?seed=1&touch=1&prompt=enter" --name dayg-11.6`
  and the desktop size without `touch=1`: read the PNGs. Both show "The Bier House" with "⌂ Walk in. Dark inside." under
  it and no key cap; at a container (walk to the forecourt crate, or read the code path) desktop shows the E key cap
  first. With `&open=actions` the sheet lists "1. Drink from the Tap" and
  "2. Fill your containers".

## Out of scope
hud.ts (11.5), touch.ts and input.ts (11.7), statusPanel.ts (11.8), settingsPanel.ts (11.9), interact.ts, main.ts.
~~~~

~~~~text
Epic: 11B Play screen (issue 11.7 Touch controls and input)
Depends on: none (round 1 done)
Stories: S11, S12, S22, S28, S29, S30 (touch side), S31, S32

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now (hud.ts, prompt.ts, actionList.ts, statusPanel.ts, settingsPanel.ts): change only
  games/dayg/src/ui/touch.ts and games/dayg/src/game/input.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Repo rules: touch for every action, targets at least 44 px inside the safe-area insets, portrait and landscape; no
  colour-only signal; colours, font sizes and targets from tokens `T`.
- Dev server: port 5316 only (`cd games/dayg && npx vite --port 5316 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
The touch block is a fixed thumb arc (ACT and HIT 72 px, CROUCH and UP 56 px, VIEW 48 px) whose buttons never move,
show their state in words (the ACT verb, CROUCH/STAND, CLIMB/UP), support a long press on ACT and a left-handed
mirror; the keyboard gains M (map), Esc (back) and hold E (action list), and stops eating keys inside open sheets.

## Read first
- games/dayg/src/ui/touch.ts: the current controls; keep the stick and look-drag logic.
- games/dayg/src/game/input.ts: the keyboard and mouse source.
- games/dayg/src/game/types.ts: `InputState` (now with `map`, `back`, `actionHold`), `TouchSource` (now with
  `setActionLabel(label: string | null)` and `setStance(stance: Stance)`), `Stance` (`'stand' | 'crouch'`).
- games/dayg/src/ui/types.ts: `UiPrefs` (`hand: 'right' | 'left'`).

## Change
- games/dayg/src/ui/touch.ts.
- games/dayg/src/game/input.ts.

## Contract
```ts
export function createTouchControls(ui: HTMLElement): TouchSource;      // unchanged signature
export function createInput(canvas: HTMLCanvasElement, touch: TouchSource): Input;  // unchanged signature
```
Uses: `import { layout, CONTROLS_W, CONTROLS_PORTRAIT_H } from './layout'` (220 and 232; mount the touch root into
`layout().zone('controls')` instead of `ui`); `import { getPrefs, onPrefs } from './prefs'` (`getPrefs().hand`,
`onPrefs(cb)` returns unsubscribe); `import { T } from './theme'` with T.color.{plateHud, text, textDim, border,
accent, accentText, disabled}, T.font.{hud, family}, T.target.{min, touch, big}.

Touch (touch.ts):
- Block `CONTROLS_W x CONTROLS_PORTRAIT_H` (220 x 232) anchored `calc(env(safe-area-inset-bottom,0px) + 12px)` from
  the bottom and `calc(env(safe-area-inset-right,0px) + 12px)` from the right; with `hand === 'left'` from the left
  instead, and the stick zone becomes `clientX > innerWidth * (1 - LAYOUT.stickZone)` (bottom 60% as today).
- Positions inside the block for the right hand (x, y from the block's top-left; w x h): VIEW (164, 20, 48 x 48);
  CROUCH (52, 88, 76 x 56, pill); UP (156, 88, 56 x 56); ACT (60, 160, 72 x 72); HIT (148, 160, 72 x 72). Left hand:
  `x' = 220 - x - w`. Re-place on `onPrefs`. Remove PACK (it is now in the HUD corner).
- Style from tokens: background `T.color.plateHud`, border 2px `T.color.border`, text `T.color.text`, font
  `700 var(--dg-font-hud)/1 var(--dg-font-family)` (at least 14 px). Pressed: scale 0.92 (stays, reduce motion only
  removes the transition).
- ACT: text = the first word of the label in capitals, at most 7 letters (`'Search the crate'` → `SEARCH`); with
  `null`, text `ACT`, class `dg-dim` (colour `T.color.disabled`, dashed border) and `aria-label="Act (nothing in
  reach)"`; else `aria-label="Act: <label>"`. ACT fires on release: `pointerdown` starts a 450 ms timer; if it fires,
  queue `actionHold` and mark the press as held; on `pointerup`, queue `action` only if not held.
- CROUCH: `setStance('stand')` → text `CROUCH`, `aria-pressed="false"`; `'crouch'` → `STAND`, `aria-pressed="true"`.
- UP: `setClimbHint(true)` → text `CLIMB`, class `dg-bright` (background `T.color.accent`, text `T.color.accentText`);
  false → text `UP`, class `dg-dim`. Its rectangle never changes.
- Every button has an `aria-label` (Act..., Crouch, Climb, Hit, Toggle view). The stick base and knob are
  `aria-hidden="true"`; the base border turns `T.color.accent` while sprinting.
- `read()` adds `actionHold`, and `map: false`, `back: false`.

Keyboard (input.ts):
- `KeyM` → `map` edge; `Escape` → `back` edge.
- `KeyE`: keydown (not repeat) records the time; keyup within 450 ms → `action` edge; if still held at 450 ms (checked in
  `read()`), one `actionHold` edge and no `action` on release.
- When the key event's target is inside `[role="dialog"]` or `[role="alertdialog"]`, ignore every key except `Escape`
  (no edge, no `preventDefault`), so Tab, Enter, Space and digits work in sheets.
- Merge the touch source's `actionHold`, `map` and `back` with `||=` like the other edges.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5316: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5316/?seed=1&touch=1" --sizes 390x844,844x390 --scope "#dayg-touch"`
  prints UI AUDIT OK; repeat with `&ui-hand=left`, with `&ui-scale=2` and with `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5316/?seed=1&touch=1" --name dayg-11.7 --sizes 390x844,844x390`,
  and again with `&ui-hand=left`: read the PNGs. Right hand: the arc is bottom-right inside the screen; left hand:
  bottom-left. Labels are readable on their plates.
- In a desktop browser tab (or by reasoning through the code if none is available): E tapped runs the action; E held
  0.5 s sends `actionHold` once; Tab inside an open sheet moves focus instead of toggling the pack.

## Out of scope
hud.ts (11.5), prompt.ts and actionList.ts (11.6), statusPanel.ts, settingsPanel.ts, camera.ts (11.13 in round 3),
main.ts, types.ts.
~~~~

~~~~text
Epic: 11B Play screen (issue 11.8 Status sheet)
Depends on: none (round 1 done)
Stories: S04, S05, S06

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only games/dayg/src/ui/statusPanel.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Repo rules: no colour-only signal; colours, font sizes, spacing and targets from tokens `T`.
- Dev server: port 5317 only (`cd games/dayg && npx vite --port 5317 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
Tapping the HUD's status cluster opens a sheet with every number the HUD hides: each need with its value, word and
what makes it fall and recover; the six body parts in words; the moss stage, part, hours and treatment; the full clock,
place, stance, carry and noise.

## Read first
- games/dayg/src/ui/statusPanel.ts: the planner's stub; keep the export.
- games/dayg/src/game/types.ts: `HudState`, `Needs`, `BodyState`, `BodyPart`, `CrackLevel`, `Infection`
  (`{ part, hours, stage }`), `InfectionStage`.
- games/dayg/src/ui/types.ts: `StatusPanel`.
- games/dayg/src/ui/a11y.ts: `needLevel`.
- games/dayg/src/ui/layout.ts: `layout().sheet(opts)`.

## Change
- games/dayg/src/ui/statusPanel.ts.

## Contract
```ts
export function createStatusPanel(): StatusPanel;   // { open(); close(); isOpen(); update(s: HudState) }
```
Uses: `layout().sheet({ id: 'dayg-status', title: 'Status', size: 'tall' })` → `Sheet { root, header, body, footer,
open, close, isOpen, setTitle }`; `needLevel(v) → { level, mark, word }`. Tokens: T.color.{text, textDim, ok, warn,
danger, plateStrong, border}, T.font.{small, body, label, title}, T.space.{xs, s, m, l}.

Content (rebuilt at most every 500 ms while open, and only when the text changed; `update` just stores the state):
- `h3` Needs, then a `dl`: per need (Warm `warmth`, Water `water`, Food `food`, Calm `calm`): `dt` the name; `dd`
  `<value rounded> / 100 · <word>` with the mark, and a second line in `T.color.textDim`:
  - Warm: "Falls with cold, wet, wind and worn glaze. Restored by clothes, fire and shelter."
  - Water: "Falls with time, heat and effort. Restored by clean water; dirty water risks Grit unless boiled."
  - Food: "Falls with time, effort and cold. Restored by food; fresh food spoils."
  - Calm: "Falls with danger, darkness and being alone. Restored by company, light and safety."
  - Below 30 a need hurts how you move and act; at 0 it does damage (one line under the list).
- `h3` Body: a `ul` of the six parts (Head, Chest, Left arm, Right arm, Left leg, Right leg) with words for the crack
  level (0 fine, 1 chipped, 2 cracked, 3 deep crack). If `body.shattered`: "Shattered".
- `h3` Moss (only with `body.infection`): `Moss in the <part>: <stage word>, stage <stage + 1> of 4.` (0 exposed,
  1 rooting, 2 spreading, 3 taking); `<hours to one decimal> h since the bite.`; when `infectionHoursLeft !== null`:
  `About <h> h before it takes.`; treatment: stage 0-1 "Scrape and seal it: salt wash or spirit (Make tab in your
  pack).", stage 2 "Scrape it out now: it will leave a deep crack.", stage 3 "Too late: nothing works now."
- `h3` Time and place: `hh:mm`, `Day n`, season, weather, region name (or "unknown ground"), haven ("in a haven: <id>"
  or "not in a haven").
- `h3` You: stance (standing or crouched), carry `w / cap kg` with "Overloaded" when over, noise word (under 8 quiet,
  under 16 heard nearby, else loud).
- Every colour sits beside its word. Headings `T.font.label` bold; text `T.font.body`.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5317: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5317/?seed=1&touch=1&open=status&debug-infect=armL"`
  prints UI AUDIT OK; repeat with `&ui-scale=2` and `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5317/?seed=1&touch=1&open=status&debug-infect=armL" --name dayg-11.8`
  and the desktop size without `touch=1`: read the PNGs; the Moss block reads "Moss in the Left arm: rooting, stage 2
  of 4" and "3.5 h since the bite".

## Out of scope
hud.ts (11.5), every other UI module, main.ts, types.ts.
~~~~

~~~~text
Epic: 11B Play screen (issue 11.9 Settings sheet)
Depends on: none (round 1 done)
Stories: S31, S36, S37, S40, S22 (controls list)

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only games/dayg/src/ui/settingsPanel.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Repo rules: no colour-only signal; colours, font sizes, spacing and targets from tokens `T`; targets at least 44 px.
- Dev server: port 5318 only (`cd games/dayg && npx vite --port 5318 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
A Settings sheet (Esc with nothing open, or the ☰ corner button) where the player picks theme, text size, hand,
reduce motion, camera follow, hints and spoken alerts, and reads the full controls list for keys and touch.

## Read first
- games/dayg/src/ui/settingsPanel.ts: the planner's stub; keep the export.
- games/dayg/src/ui/types.ts: `UiPrefs`, `SettingsPanel`.
- games/dayg/src/ui/prefs.ts: `getPrefs`, `setPrefs`, `onPrefs`.
- games/dayg/src/ui/a11y.ts: `makeButton`.
- games/dayg/src/ui/layout.ts: `layout().sheet(opts)`.

## Change
- games/dayg/src/ui/settingsPanel.ts.

## Contract
```ts
export function createSettingsPanel(): SettingsPanel;   // { open(); close(); isOpen() }
```
Uses: `layout().sheet({ id: 'dayg-settings', title: 'Settings', size: 'tall' })`; `getPrefs(): UiPrefs`,
`setPrefs(patch): UiPrefs`, `onPrefs(cb): () => void`; `makeButton({ text, label?, size?, variant?, onPress })`.
Tokens: T.color.{text, textDim, border, plateStrong}, T.font.{label, body, small}, T.space.{xs, s, m, l}.

- Choice groups: a `div` with `role="radiogroup"` and `aria-labelledby` its visible label; each option a
  `makeButton` with `role="radio"` and `aria-checked` (true for the current value):
  - Theme: Dark (`dark`), High contrast (`contrast`).
  - Text size: 100% (1), 125% (1.25), 150% (1.5), 200% (2).
  - Hand: Right, Left.
  Pressing an option: `setPrefs({ <field>: value })`.
- Toggles: `makeButton` with `aria-pressed` and text `<Name>: On` or `<Name>: Off`: Reduce motion (`reduceMotion`),
  Camera follows (`cameraFollow`), Hints (`hints`), Read alerts aloud (`announce`).
- After any change (via `onPrefs`), update `aria-checked`, `aria-pressed` and texts in place (do not rebuild the body,
  so focus stays where it is).
- Controls: `h3` Controls and a `table` (`th` scope col: Action, Keys, Touch) with rows:
  Move | W A S D | left stick; Look | mouse | drag on the right; Sprint | Shift | push the stick to the edge;
  Crouch | C | CROUCH; Act | E | ACT, or tap the prompt; More actions | hold E | hold ACT, or tap +n;
  Climb or vault | Space | UP; Hit | left click | HIT; Pack | Tab or I | PACK; Map | M | MAP; View | V | VIEW;
  Status | click the status | tap the status; Settings or close | Esc | ☰ or ✕.
  With "Hand: Left" the touch column says "right stick" and "drag on the left" instead.
- Fonts at least `T.font.body` for text, `T.font.label` for group labels.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5318: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5318/?seed=1&touch=1&open=settings"`
  prints UI AUDIT OK; repeat with `&ui-scale=2` and `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5318/?seed=1&touch=1&open=settings" --name dayg-11.9`
  and the desktop size without `touch=1`: read the PNGs; the current choices show a visible outline (not colour only).

## Out of scope
prefs.ts and theme.ts (11.1, done), hud.ts, touch.ts, every other UI module, main.ts.
~~~~

### End of round 2 (planner)

Wire `main.ts` to the real prompt, action list, status and settings (Step 0 already calls their stubs). Add the
doorway prompt from roadmap 10's building data: when no interactable is in reach and the player stands within 2 gm
outside a building's door, show `{ primary: { id: 'door', label: <building name> }, more: 0, note: 'Walk in.' + (night
? ' Dark inside.' : '') + (Hatless within 15 gm of the door ? ' Something moved inside.' : ''), kind: 'enter' }`. Then
run
`npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`, smoke at 5206 and
`node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5206/?seed=1&touch=1<open>"` for `<open>` in none,
`&open=actions`, `&open=status`, `&open=settings`, each also with `&ui-scale=2` and `&ui-theme=contrast`. The pack,
map and recap still fail the unscoped audit until round 3; scope those runs with
`--scope "#dayg-hud,#dayg-zone-clock,#dayg-prompt,#dayg-touch,#dayg-actions,#dayg-status,#dayg-settings"`.

---

## 9. Epic 11C: sheets and the camera (round 3)

~~~~text
Epic: 11C Sheets and the camera (issue 11.10 Pack sheet)
Depends on: none (round 2 done)
Stories: S16, S17, S18, S19, S20, S21, S22, S23, S38

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now (mapPanel.ts, recap.ts, camera.ts, hints.ts): change only
  games/dayg/src/ui/inventoryPanel.ts. Never edit src/main.ts, src/config.ts, src/game/types.ts or src/ui/types.ts.
- Repo rules: item icons through `prefabIconElement` from `@lawn/prefabs` (as today); no drag needed; targets at least
  44 px; no colour-only signal; colours, font sizes, spacing and targets from tokens `T`.
- Dev server: port 5319 only (`cd games/dayg && npx vite --port 5319 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
The pack is a layout sheet with tabs (You, the container being searched, Make), filter chips, one readable row per
stack (icon, name, count, weight, condition word), inline item actions, Take and Take all, recipes with their missing
input in words, and a totals footer; portrait is one column, landscape and desktop two.

## Read first
- games/dayg/src/ui/inventoryPanel.ts: the current panel; keep `createInventoryPanel`'s signature, the returned
  `InventoryPanel`, `?inv=1`, `inv.onChange` re-render and the 200 ms busy ticker.
- games/dayg/src/game/types.ts: `InventoryPanel`, `InventorySystem`, `UseApi` (`actionsFor`, `recipes`, `start`,
  `busy`), `UseAction`, `StackRef`, `RecipeDef`.
- games/dayg/src/items/defs.ts: `getItem(id)` → `ItemDef { name, prefab, weight, bulk, resource, tags }`.
- games/dayg/src/ui/a11y.ts: `makeButton`, `setButtonEnabled`.
- games/dayg/src/ui/layout.ts: `layout().sheet(opts)`, `layout().orientation()`, `layout().onOrientation(cb)`.

## Change
- games/dayg/src/ui/inventoryPanel.ts.

## Contract
```ts
export function createInventoryPanel(ui: HTMLElement, deps: { inv: InventorySystem; use: UseApi }): InventoryPanel;
// InventoryPanel { root; toggle(); open(); close(); isOpen(); showLoot(title, items, onTake(index)) } — unchanged
```
Uses: `layout().sheet({ id: 'dayg-inv', title: 'Pack', size: 'tall', onClose })` → `Sheet { root, header, body,
footer, open, close, isOpen, setTitle }` (`root` of the panel is `sheet.root`); `makeButton({ text, label?, icon?,
size?, variant?, onPress })`; `setButtonEnabled(b, enabled, reason?)`. Tokens: T.color.{plate, plateStrong, text,
textDim, ok, warn, danger, accent, border}, T.font.{small, label, body, title}, T.space.{xs, s, m, l},
T.target.{min, touch}, T.radius.{s, m}.

Structure:
- Tabs (`role="tablist"`; each tab a `makeButton` with `role="tab"`, `aria-selected`, `aria-controls` its panel id;
  panels `role="tabpanel"`): `You`, the loot title (only while searching), `Make`.
  - Portrait (`layout().orientation() === 'portrait'`): one column; tabs You, <container>, Make. `showLoot` selects
    the container tab.
  - Landscape and desktop: left column always You; right column tabs <container> (when searching) and Make, default
    the container when searching, else Make.
  - Re-render on `onOrientation`.
- Filter chips under the tabs (a `div role="group" aria-label="Filter"`, scrolls sideways): All, Food, Water,
  Medicine, Tools, Fuel, Materials, matching `ItemDef.resource` (`food`, `water`, `medicine`, `tools`, `fuel`,
  `materials`; `valuables` only under All). Chips are `makeButton` with `aria-pressed`. The filter applies to pack and
  container rows; hands and worn always show.
- You: a slot row (56 px buttons) Hand, Hand 2, Head, Back, Neck, Body with `aria-label` `<slot>: <item name or
  empty>`; then the pack rows.
- Row (pack and container): a full-width button (`min-height: T.target.touch`) in a grid: icon
  (`prefabIconElement(def.prefab, '📦', 40)`, `aria-hidden`), name and `×count` (and `· <litres> L` for liquids),
  weight `<def.weight × count, 1 decimal> kg`, condition word (over 0.5 good, over 0.2 worn, else failing) beside a 4 px
  bar. `aria-label` `<name>, <count>, <kg> kg, <word>`. Selected: `aria-pressed="true"` (outline from the base CSS).
  Tapping a pack row toggles selection; under the selected row a `div role="group" aria-label="<name> actions"` with a
  `makeButton` per `use.actionsFor(ref)` (`use.start(action)`; then clear the selection).
- Container rows: the row plus a `Take` button (`label: 'Take <name>'`); a `Take all` button above the list
  (`variant: 'primary'`); "Nothing left." when empty.
- Make: one row per `use.recipes()`: a `makeButton` with the recipe name (`size: 'touch'`), disabled with
  `setButtonEnabled(b, false, why)` when `!ok` or busy, and the reason as visible text in the row (font `T.font.small`,
  `T.color.textDim`), plus the time `<seconds> s`.
- Footer (`sheet.footer`): `<w> / <cap> kg · <b> / <cap> L`, followed by `· Overloaded` (warn colour plus the word)
  when weight is over capacity; and while `use.busy()`, a `role="progressbar"` line `<label> · <percent>%` with a bar.
- Focus: before re-rendering, remember the focused element's `data-key` (set `data-key` on tabs, chips, rows and
  buttons, e.g. `row:pack:3`, `act:eat`); after, focus the element with the same key if it exists.
- Remove the old close button, `applyLayout` and the old sheet geometry: the layout sheet does all of that.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5319: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5319/?seed=1&touch=1&open=pack"`
  prints UI AUDIT OK; repeat with `&ui-scale=2`, `&ui-theme=contrast`, and with `?seed=1&inv=1` (desktop size only).
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5319/?seed=1&touch=1&open=pack" --name dayg-11.10` and
  the desktop size without `touch=1`: read the PNGs. Portrait: tabs, chips and rows with kg and condition words;
  landscape: the sheet is the right 62% with two columns; desktop: two columns, 720 px wide.
- By reading the code: searching a container calls `showLoot`, which opens the sheet on the container tab.

## Out of scope
mapPanel.ts (11.11), recap.ts (11.12), camera.ts (11.13), hints.ts (11.14), useItem.ts, inventory.ts, main.ts.
~~~~

~~~~text
Epic: 11C Sheets and the camera (issue 11.11 Map sheet)
Depends on: none (round 2 done)
Stories: S25, S26, S27

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only the two files under Change. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Tests run under vitest in Node (no DOM): the pure helpers must not touch `document` at import time.
- Repo rules: no quest markers; targets at least 44 px; no colour-only signal; colours and fonts from tokens `T`.
- Dev server: port 5320 only (`cd games/dayg && npx vite --port 5320 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
M or the MAP corner button opens a full sheet with a memory map: the cemetery outline, regions you have stood in named
and filled, both havens always named, your position and facing as an arrow, north up, zoom, and a text list of known
places with distance and bearing.

## Read first
- games/dayg/src/ui/mapPanel.ts: the planner's stub; keep the export.
- games/dayg/src/ui/types.ts: `MapDeps`, `MapRegionView`, `MapPanel`.
- games/dayg/src/sim/regions.ts: `REGIONS` and `MAP_OUTLINE` (for the coordinate range only; x 0..560, z 0..520 in
  the slice; do not import them, main passes them in).
- games/dayg/src/ui/a11y.ts: `makeButton`.
- games/dayg/src/ui/layout.ts: `layout().sheet(opts)`.

## Change
- games/dayg/src/ui/mapPanel.ts.
- games/dayg/src/ui/mapPanel.test.ts (new).

## Contract
```ts
export function createMapPanel(deps: MapDeps): MapPanel;   // { open(); close(); isOpen(); toggle(); update() }
export function bearingWord(dx: number, dz: number): string;   // north is -z, east is +x
export function distanceText(d: number): string;               // gm, rounded to 10; under 10 → 'here'
```
`MapDeps { outline: readonly (readonly [number, number])[]; regions: readonly MapRegionView[]; regionAt(x, z):
string | null; player(): { x; z; facing } }`; `MapRegionView { id; name; rect: { x0; x1; z0; z1 }; haven: boolean }`.
Uses: `layout().sheet({ id: 'dayg-map', title: 'Map', size: 'full' })`; `makeButton({ text, label?, size?, onPress })`.
Tokens: T.color.{plate, plateStrong, text, textDim, accent, border, ok}, T.font.{small, body, label},
T.space.{s, m}, T.target.{min}.

- `bearingWord`: angle `atan2(dx, -dz)` (0 = north, clockwise), eight sectors of 45° centred on north, north-east,
  east, south-east, south, south-west, west, north-west.
- `distanceText(d)`: `'here'` under 10, else `'<round(d/10)*10> gm'`.
- `update()` (called every frame): `regionAt(player)` joins the visited set (start with it empty plus every
  `haven: true` region as known); if open, redraw the arrow at most 5 times a second.
- Picture (an inline `<svg>` filling the body, `role="img"`, `aria-label="Map of the places you know"`): `viewBox` the
  outline's bounds plus 10 gm; screen y is z (north, -z, is up). The outline as a polygon (stroke `T.color.border`).
  Regions: visited and havens filled `T.color.plateStrong`, solid border, name as `<text>` (font `T.font.small`; havens
  add ` (haven)`); unvisited regions dashed border, no fill, no name. The player arrow: a triangle pointing +x rotated by
  `atan2(cos f, sin f)` in degrees (screen vector `(sin f, cos f)`), fill `T.color.accent`, a dark outline. An `N` with
  an up arrow in the top-left corner.
- Zoom: buttons `+` (label `Zoom in`) and `−` (label `Zoom out`), levels 1, 2, 4; above 1 the view is centred on the
  player.
- List toggle: a `makeButton` `List` / `Picture` (`aria-pressed`). The list is a `ul role="list"` of known places
  (visited and havens) sorted by distance: `<name>: <distanceText> <bearingWord>` (to the region rect's centre;
  `here` when inside), font `T.font.body`.
- No marker of any kind beyond the player arrow and names.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- `cd games/dayg && npx vitest run src/ui/mapPanel.test.ts` passes: `bearingWord(0, -10)` north, `(10, 0)` east,
  `(0, 10)` south, `(-10, 0)` west, `(10, -10)` north-east, `(-10, 10)` south-west; `distanceText(4)` here,
  `distanceText(184)` `180 gm`.
- With the server on 5320: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5320/?seed=1&touch=1&open=map"`
  prints UI AUDIT OK; repeat with `&ui-scale=2` and `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5320/?seed=1&touch=1&open=map" --name dayg-11.11` and the
  desktop size: read the PNGs; Gate Roof, Lychgate Waystation and The Tap are named, other regions are dashed and
  unnamed, the arrow is on the Gate Roof.

## Out of scope
inventoryPanel.ts (11.10), recap.ts (11.12), camera.ts (11.13), hints.ts (11.14), sim/regions.ts, main.ts.
~~~~

~~~~text
Epic: 11C Sheets and the camera (issue 11.12 Recap)
Depends on: none (round 2 done)
Stories: S33, S34, S35, S38, S39

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only games/dayg/src/ui/recap.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Repo rules: targets at least 44 px; colours, fonts and spacing from tokens `T`. Lore: the tip lines below are already
  checked against docs/lore; do not invent new names.
- Dev server: port 5321 only (`cd games/dayg && npx vite --port 5321 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
Death shows an accessible recap: the cause, the last events as an ordered list, where and when, the life's statistics,
one tip for the cause, and two large buttons, Walk again (new world) and Same world.

## Read first
- games/dayg/src/ui/recap.ts: the current card; keep `createRecap(ui, log)`, `TITLES`, `clockText`, the once-only
  `shown` guard, and any respawn options the file has gained since (keep them, restyled as below).
- games/dayg/src/game/types.ts: `Recap`, `EventLog` (`lines(seconds)`, `stats()`).
- games/dayg/src/sim/types.ts: `DeathCause`.
- games/dayg/src/ui/a11y.ts: `makeButton`, `trapFocus`, `announce`.

## Change
- games/dayg/src/ui/recap.ts.

## Contract
```ts
export function createRecap(ui: HTMLElement, log: EventLog): Recap;   // Recap.show(cause, where, day, hourOfDay) unchanged
```
Uses: `makeButton({ text, label?, size?: 'min'|'touch'|'big', variant?: 'plain'|'primary'|'danger', onPress })`,
`trapFocus(container): () => void`, `announce(text, 'assertive')`. Tokens: T.color.{bg, plate, text, textDim, accent,
border}, T.font.{body, small, title}, T.space.{s, m, l, xl}, T.target.{touch}, T.radius.{m}.

- Overlay: `div#dayg-recap` appended to `ui` (the layout root), `position:absolute;inset:0;z-index:60;
  pointer-events:auto`, background `T.color.bg` at 0.85 alpha (use `color-mix(in srgb, var(--dg-color-bg) 85%,
  transparent)`), centring a card (`width:min(480px, 100% - 24px)`, `max-height:calc(100% - 24px)`, `overflow-y:auto`,
  plate background, border, radius, padding `T.space.l`).
- The card: `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby="dayg-recap-title"`,
  `aria-describedby="dayg-recap-events"`.
- Content in order: `h2#dayg-recap-title` (`tabindex="-1"`, font `T.font.title`, colour `T.color.accent`) with the
  title; `ol#dayg-recap-events` with up to 8 of `log.lines(60)` (latest last), or one item "The last minute is blank.";
  the stamp line `Day n, hh:mm, in the <where>.`; the statistics line `Hatless cracked: a. Containers searched: b.
  Climbs: c.`; a tip line `Tip: <tip>`; for `hatless` and `moss` the line "You will rise as a Hatless in your gear.".
- Tips by cause:
  - hatless: "Climb when a herd comes: the Hatless cannot follow you up."
  - gnome: "Strangers read your gear. Keep to the havens until you know who is who."
  - moss: "Scrape and seal a bite within hours: salt wash or spirit, from the Make tab."
  - fall: "Past 12 gm a fall cracks you; past 25 it can shatter. Climb down, do not jump."
  - cold: "Get out of the wet and light a fire before dark. Warmth goes first in a storm."
  - thirst: "Fill your containers at the Tap. Puddle water needs boiling."
  - hunger: "Search containers early and keep a loaf for the walk back."
- Buttons, full width, `size: 'touch'` (56 px): `Walk again` (`variant: 'primary'`, label `Walk again in a new world`;
  sets a new random `seed` in the URL as today) and `Same world` (label `Walk again in the same world`;
  `location.reload()`, the URL keeps its seed).
- On show: display the overlay, `trapFocus(card)`, focus the title, `announce('<title>. ' + tip, 'assertive')`. No Esc
  close and no ✕: the buttons are the only way out.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5321: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5321/?seed=1&touch=1&open=recap"`
  prints UI AUDIT OK; repeat with `&ui-scale=2` and `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5321/?seed=1&touch=1&open=recap" --name dayg-11.12` and
  the desktop size: read the PNGs; the title, the numbered list, the tip and both buttons fit without overlap (the card
  scrolls at 844x390 if needed).

## Out of scope
inventoryPanel.ts, mapPanel.ts, camera.ts, hints.ts, eventLog.ts, main.ts.
~~~~

~~~~text
Epic: 11C Sheets and the camera (issue 11.13 Camera follow)
Depends on: none (round 2 done)
Stories: S15, S30, S32

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js 0.187 + TypeScript). Other workers are editing other files in games/dayg right now:
  change only games/dayg/src/game/camera.ts and the new test games/dayg/src/game/cameraFollow.test.ts. Never edit
  src/main.ts, src/config.ts, src/game/types.ts, src/ui/types.ts or src/game/camera.test.ts (the indoor camera tests;
  they must keep passing).
- Tests run under vitest in Node: `followYaw` must be pure.
- Dev server: port 5322 only (`cd games/dayg && npx vite --port 5322 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
With "Camera follows" on (default on touch devices), the third-person camera eases round behind the direction the
gnome walks after 1.2 s without look input, so a one-thumb player never needs to drag to look; the indoor rules
(cutaway, padded pull-in, ceiling clamp, close-follow), the pull-in near walls and the first-person toggle are
unchanged.

## Read first
- games/dayg/src/game/camera.ts: `createCameraRig` with the indoor rules; find where the third-person yaw is used
  before the ray is cast, and the `close` flag (close-follow in tight spots).
- games/dayg/src/game/camera.test.ts: the indoor tests that must stay green (read only).
- games/dayg/src/game/types.ts: `CameraRig`, `InputState` (`lookX`, `lookY`).
- games/dayg/src/ui/prefs.ts: `getPrefs().cameraFollow`.

## Change
- games/dayg/src/game/camera.ts.
- games/dayg/src/game/cameraFollow.test.ts (new).

## Contract
```ts
// createCameraRig keeps the exact signature it has in the file (roadmap 10 added an interior parameter).
export const FOLLOW = { idleSeconds: 1.2, minSpeed: 0.5, maxAngle: 1.3, rate: 1.5 } as const;
export function followYaw(yaw: number, dx: number, dz: number, dt: number, idleSeconds: number): number;
```
- `followYaw`: return `yaw` unchanged when `dt <= 0`, when `idleSeconds < FOLLOW.idleSeconds`, or when
  `hypot(dx, dz) / dt < FOLLOW.minSpeed`. Else `w = atan2(dx, dz)` (forward is `(sin yaw, cos yaw)`), `d = wrap(w -
  yaw)` into (-π, π]; if `|d| > FOLLOW.maxAngle` (walking backwards or hard sideways) return `yaw`; else return
  `yaw + d * (1 - exp(-FOLLOW.rate * dt))`.
- In the rig: keep `idle` seconds (reset to 0 when `input.lookX !== 0 || input.lookY !== 0`, else `+= dt`) and the last
  target position. In third person, when `getPrefs().cameraFollow` and the rig is not in close-follow (`close` is
  false), apply `rig.yaw = followYaw(rig.yaw, target.x - lastX, target.z - lastZ, dt, idle)` before the yaw is used
  for the ray. Then store the target. First person: no follow.
- Every indoor rule, the pull-in loop and the snap rules stay exactly as they are.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- `cd games/dayg && npx vitest run src/game/camera.test.ts` still passes (roadmap 10's indoor tests, unchanged).
- `cd games/dayg && npx vitest run src/game/cameraFollow.test.ts` passes: no change when idle is 1.0; no change when the
  speed is 0.3 gm/s; walking straight ahead (w equals yaw) leaves yaw unchanged; walking at 45° right of the view
  moves yaw toward it by `0.785 * (1 - exp(-1.5 * dt))` (within 1e-6); walking straight back (180°) leaves it
  unchanged; the result is wrapped correctly across ±π (yaw 3.0, walk direction -3.0 moves yaw up past π, not down).
- With the server on 5322: `bash tools/smoke.sh "http://localhost:5322/?seed=1&ui-follow=1" dayg-hud` prints SMOKE OK.

## Out of scope
input.ts and touch.ts (round 2, done), every UI module, main.ts.
~~~~

~~~~text
Epic: 11C Sheets and the camera (issue 11.14 First-hour hints)
Depends on: none (round 2 done)
Stories: S09

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now: change only the two files under Change. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Tests run under vitest in Node: `nextHint` must be pure and the module must not touch `document` or `localStorage` at
  import time.
- Lore: the hint texts below use names that already exist in the game (the Tap, the Forecourt, the Waystation, the
  Gate Roof); do not add new names.
- Dev server: port 5323 only (`cd games/dayg && npx vite --port 5323 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
A first-time player gets one short "what now" card at a time for the first hour (walk, climb down, search, water,
fire, sleep), each shown once per profile, with "Got it" and "No more hints".

## Read first
- games/dayg/src/ui/hints.ts: the planner's stub; keep the export.
- games/dayg/src/ui/types.ts: `HintInput`, `Hints`, `InputDevice`.
- games/dayg/src/ui/a11y.ts: `makeButton`, `announce`.
- games/dayg/src/ui/prefs.ts: `getPrefs().hints`, `setPrefs`.

## Change
- games/dayg/src/ui/hints.ts.
- games/dayg/src/ui/hints.test.ts (new).

## Contract
```ts
export type HintId = 'walk' | 'climb-down' | 'search' | 'water' | 'fire' | 'sleep';
export const HINTS_KEY = 'dayg.ui.hints';
export function hintText(id: HintId, device: InputDevice): string;
export function nextHint(s: HintInput, done: ReadonlySet<HintId>, stillSeconds: number): HintId | null;
export function createHints(): Hints;   // { update(s: HintInput, dt: number) }
```
- Conditions, checked in this order; the first not in `done` whose condition holds wins:
  - walk: `!s.moved && stillSeconds >= 10`
  - climb-down: `s.moved && s.regionId === 'gate-roof'`
  - search: `s.nearContainer`
  - water: `s.water < 60`
  - fire: `s.hourOfDay >= 18 && !s.night && s.firesLit === 0`
  - sleep: `s.night && !s.inHaven`
- Texts (keys / touch):
  - walk: "Walk with W A S D and look with the mouse." / "Drag on the left side of the screen to walk."
  - climb-down: "The ladder at the roof's edge takes you down. Walk up to it and press E." / "... and tap ACT."
  - search: "Search it: press E. What you find goes in your pack." / "Search it: tap ACT. What you find goes in your pack."
  - water: "Thirsty? The Tap has clean water, north of the Forecourt." (both)
  - fire: "Dark comes at 22:00. Lay a fire from the Make tab in your pack." (both)
  - sleep: "Night is when the Hatless hunt. Sleep in a haven: the Waystation or the Tap." (both)
- `createHints()`: card `div#dayg-hints` (`role="region"`, `aria-label="Hint"`, `data-audit-box`, plate
  `T.color.plateHud`, border `T.color.accent`, padding `T.space.m`, font `T.font.body`) in `layout().zone('alerts')`,
  hidden when there is no hint. `update(s, dt)`: do nothing when `getPrefs().hints` is false (hide the card). Track
  `stillSeconds` (reset when `s.moved` first becomes true). Load `done` from localStorage `HINTS_KEY` (a JSON array;
  try/catch) once. Show `nextHint(...)` when no card is up: the text and two buttons, `Got it` (adds the id to `done`,
  saves, hides) and `No more hints` (`setPrefs({ hints: false })`, hides); `announce(text)`. If the shown hint's
  condition has been false for 5 s, mark it done and hide it.
- Tokens: T.color.{plateHud, accent, text}, T.font.{body}, T.space.{s, m}; `makeButton({ text, size: 'min', onPress })`.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- `cd games/dayg && npx vitest run src/ui/hints.test.ts` passes: walk only after 10 s still; climb-down on the Gate
  Roof once moved; done ids are skipped; water at 59 but not 60; fire at 18:30 by day with no fires, not at night;
  sleep at night outside a haven; `hintText('walk', 'touch')` mentions "left side".
- With the server on 5323: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5323/?seed=1&touch=1" --wait 13000 --scope "#dayg-hints"`
  prints UI AUDIT OK and the shot (`ui-shot.mjs ... --name dayg-11.14`, same URL) shows the walk hint card under the HUD
  without covering a button.

## Out of scope
inventoryPanel.ts, mapPanel.ts, recap.ts, camera.ts, main.ts (the planner builds `HintInput` there).
~~~~

### End of round 3 (planner)

Wire the map (`deps` from `REGIONS`, `MAP_OUTLINE`, `regionAt`), hints and the pack's new `open=pack` path in
`main.ts`; then `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`, smoke, and
the unscoped audit for `?seed=1&touch=1` plus `&open=` pack, map, status, settings, actions, recap, each at scales 1
and 2 and both themes, and `--motion` with `&ui-motion=reduce` once. `npm run zfight -- "http://localhost:5206/?seed=1"`
once (no scenery changed, so it should be unchanged).

---

## 10. Epic 11D: phases 4-8 panels, phone pass and gate (round 4)

The planner re-reads `talkPanel.ts`, `boardPanel.ts`, `ledgerPanel.ts`, `roomPanel.ts`, `src/base/buildUi.ts` and `src/base/chestUi.ts` before this
round and pastes each one's real export signature, root id, title and debug `open=` value into the issues below
(placeholders are marked `<...>`). A panel file that does not exist drops its issue.

~~~~text
Epic: 11D Panels and gate (issue 11.15 Talk and board panels on the shared sheet)
Depends on: none (round 3 done)
Stories: S23, S38

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now (ledgerPanel.ts, roomPanel.ts, base/buildUi.ts, base/chestUi.ts, layout.ts, theme.ts, PLAYTEST.md): change only
  games/dayg/src/ui/talkPanel.ts and games/dayg/src/ui/boardPanel.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Repo rules: targets at least 44 px; no colour-only signal; colours, fonts, spacing and targets from tokens `T`.
- Dev server: port 5324 only (`cd games/dayg && npx vite --port 5324 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
The talk and board panels open, close, focus and look like every other DayG sheet, with no change to what they do.

## Read first
- games/dayg/src/ui/talkPanel.ts and games/dayg/src/ui/boardPanel.ts: the panels as they are.
- games/dayg/src/ui/inventoryPanel.ts: a finished example of a panel on the layout sheet (how it creates the sheet,
  uses makeButton and tokens).
- games/dayg/src/ui/a11y.ts: `makeButton`, `setButtonEnabled`.
- games/dayg/src/ui/layout.ts: `layout().sheet(opts)`.

## Change
- games/dayg/src/ui/talkPanel.ts.
- games/dayg/src/ui/boardPanel.ts.

## Contract
- Keep each file's exported factory signature and returned interface exactly:
  `<createTalkPanel signature from the file>`, `<createBoardPanel signature from the file>`.
- Recipe for each panel:
  1. Create the sheet once: `const sheet = layout().sheet({ id: '<existing root id, e.g. dayg-talk>', title:
     '<existing title>', size: 'tall' })`; put the content in `sheet.body` (fixed bottom actions in `sheet.footer`).
     If the interface exposes `root`, return `sheet.root`.
  2. Replace the panel's own show/hide, close button, Esc handling and geometry with `sheet.open()`, `sheet.close()`,
     `sheet.isOpen()`. Keep any `onClose` side effect by passing it as `onClose` to `sheet(...)`.
  3. Replace every hand-built button with `makeButton({ text, label?, size?: 'min'|'touch', variant?, onPress })`
     (same text and handler); disabled ones use `setButtonEnabled(b, false, reason)` and show the reason as visible
     text (font `T.font.small`).
  4. Lists become `ul role="list"`; tabs become `role="tablist"`/`role="tab"` with `aria-selected`; selected or
     chosen states use `aria-pressed` or `aria-checked` (the base CSS draws an outline).
  5. Replace hex colours and px font sizes with tokens: T.color.{plate, plateStrong, text, textDim, accent,
     accentText, ok, warn, danger, border, disabled}, T.font.{small, label, body, title}, T.space.{xs, s, m, l},
     T.target.{min, touch}, T.radius.{s, m}. No text under `T.font.small`.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5324: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5324/?seed=1&touch=1&open=<talk>"`
  and the same with `open=<board>` print UI AUDIT OK; repeat with `&ui-scale=2` and `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs` for both panels (`--name dayg-11.15-talk`, `dayg-11.15-board`), phone sizes
  with `touch=1` and the desktop size without: read the PNGs; both look like the Pack sheet (same header and ✕).
- `npm test -w games/dayg` passes (no behaviour changed).

## Out of scope
ledgerPanel.ts, roomPanel.ts (11.16), base/buildUi.ts and base/chestUi.ts (11.17), layout.ts and theme.ts (11.18), every game/ and sim/
file, main.ts.
~~~~

~~~~text
Epic: 11D Panels and gate (issue 11.16 Ledger and room panels on the shared sheet)
Depends on: none (round 3 done)
Stories: S23, S38

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript; the DOM UI is in src/ui). Other workers are editing other files in
  games/dayg right now (talkPanel.ts, boardPanel.ts, base/buildUi.ts, base/chestUi.ts, layout.ts, theme.ts, PLAYTEST.md): change only
  games/dayg/src/ui/ledgerPanel.ts and games/dayg/src/ui/roomPanel.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts or src/ui/types.ts.
- Repo rules: targets at least 44 px; no colour-only signal; colours, fonts, spacing and targets from tokens `T`.
- Dev server: port 5325 only (`cd games/dayg && npx vite --port 5325 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
The ledger (standing, quests, skills) and room (online room code, members, mode) panels open, close, focus and look
like every other DayG sheet, with no change to what they do.

## Read first
- games/dayg/src/ui/ledgerPanel.ts and games/dayg/src/ui/roomPanel.ts: the panels as they are.
- games/dayg/src/ui/inventoryPanel.ts: a finished example of a panel on the layout sheet.
- games/dayg/src/ui/a11y.ts: `makeButton`, `setButtonEnabled`.
- games/dayg/src/ui/layout.ts: `layout().sheet(opts)`.

## Change
- games/dayg/src/ui/ledgerPanel.ts.
- games/dayg/src/ui/roomPanel.ts.

## Contract
- Keep each file's exported factory signature and returned interface exactly:
  `<createLedgerPanel signature from the file>`, `<createRoomPanel signature from the file>`.
- Recipe for each panel:
  1. Create the sheet once: `const sheet = layout().sheet({ id: '<existing root id>', title: '<existing title>',
     size: 'tall' })`; content in `sheet.body`, fixed bottom actions in `sheet.footer`. If the interface exposes
     `root`, return `sheet.root`.
  2. Replace the panel's own show/hide, close button, Esc handling and geometry with `sheet.open()`, `sheet.close()`,
     `sheet.isOpen()`; pass any close side effect as `onClose`.
  3. Replace every hand-built button with `makeButton({ text, label?, size?, variant?, onPress })`; disabled ones use
     `setButtonEnabled(b, false, reason)` with the reason as visible text.
  4. The ledger's tabs become `role="tablist"`/`role="tab"` with `aria-selected`; lists become `ul role="list"`;
     standing numbers keep a word beside any colour (e.g. `+12 friendly`).
  5. The room code field is an `input` with a visible `label` (`for`), at least 44 px tall, font `T.font.body`;
     copy and join buttons say what they do in text.
  6. Tokens only: T.color.{plate, plateStrong, text, textDim, accent, accentText, ok, warn, danger, border, disabled},
     T.font.{small, label, body, title}, T.space.{xs, s, m, l}, T.target.{min, touch}, T.radius.{s, m}.

## Done when
- `npx tsc --noEmit -p games/dayg` passes.
- With the server on 5325: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5325/?seed=1&touch=1&open=<ledger>"`
  and with `open=<room>` print UI AUDIT OK; repeat with `&ui-scale=2` and `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs` for both (`--name dayg-11.16-ledger`, `dayg-11.16-room`), phone and desktop:
  read the PNGs.
- `npm test -w games/dayg` passes.

## Out of scope
talkPanel.ts, boardPanel.ts (11.15), base/buildUi.ts and base/chestUi.ts (11.17), layout.ts and theme.ts (11.18), net/, game/, sim/,
main.ts.
~~~~

~~~~text
Epic: 11D Panels and gate (issue 11.17 Build mode and chest UI)
Depends on: none (round 3 done)
Stories: S23, S24, S28, S38

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg (three.js + TypeScript). Other workers are editing other files in games/dayg right now
  (talkPanel.ts, boardPanel.ts, ledgerPanel.ts, roomPanel.ts, layout.ts, theme.ts, PLAYTEST.md): change only
  games/dayg/src/base/buildUi.ts and games/dayg/src/base/chestUi.ts. Never edit src/main.ts, src/config.ts,
  src/game/types.ts, src/ui/types.ts, src/base/types.ts, src/base/config.ts or src/base/build.ts.
- Repo rules: targets at least 44 px; no colour-only signal; colours, fonts, spacing and targets from tokens `T`.
  Building pieces are prefabs already (`prefabIconElement` from `@lawn/prefabs`); this issue adds none.
- Dev server: port 5326 only (`cd games/dayg && npx vite --port 5326 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
Build mode and the base chest use the shared layout: the BUILD toggle sits in the HUD corner row, the piece strip in
the alerts band, the action row and status line above the touch block, the claim card and the chest as sheets; every
piece shows its cost as "Needs 3 planks (you have 1)" and every disabled control says why in words.

## Read first
- games/dayg/src/base/buildUi.ts: the build mode UI as it is (`BuildUiState`, `BuildUiHandlers`, `BuildUi`,
  `createBuildUi(ui, h)`; BUILD button, piece strip, action row, status panel, claim card).
- games/dayg/src/base/chestUi.ts: the chest panel as it is (`ChestUi`, `createChestUi(ui, deps)`).
- games/dayg/src/ui/inventoryPanel.ts: a finished example of a panel on the layout sheet with rows, Take and a footer.
- games/dayg/src/ui/a11y.ts: `makeButton`, `setButtonEnabled`.
- games/dayg/src/ui/layout.ts: `layout().zone(...)`, `layout().sheet(opts)`, `CONTROLS_W`, `CONTROLS_PORTRAIT_H`.

## Change
- games/dayg/src/base/buildUi.ts.
- games/dayg/src/base/chestUi.ts.

## Contract
- Keep `createBuildUi(ui: HTMLElement, h: BuildUiHandlers): BuildUi`, `BuildUiState`, `BuildUiHandlers`, `BuildUi`,
  `createChestUi(ui, deps): ChestUi` and `ChestUi` exactly as the files have them; keep the root ids
  (`BASE_DOM.build` `'dayg-build'`, `'dayg-chest'`), `update(s)` re-rendering only on change, `setVisible(on)`, and
  the `?buildui=1`, `?buildui=claim`, `?chestui=1` sample states.
- Uses: `layout().zone('corner' | 'alerts' | 'prompt')`, `layout().sheet({ id, title, size?: 'tall' | 'full',
  onClose? })` → `Sheet { root, header, body, footer, open, close, isOpen, setTitle }`; `makeButton({ text, label?,
  icon?, size?: 'min' | 'touch' | 'big', variant?: 'plain' | 'primary' | 'danger', onPress })`;
  `setButtonEnabled(b, enabled, reason?)`. Tokens: T.color.{plate, plateStrong, plateHud, text, textDim, warn, danger,
  accent, accentText, border, disabled}, T.font.{small, label, body, title}, T.space.{xs, s, m},
  T.target.{min, touch, big}, T.radius.{s, m}. No font under `T.font.small` (14 px).
- Build UI placement:
  - BUILD: `makeButton({ text: 'BUILD', label: 'Build', size: 'min', onPress: h.toggle })` (48 x 48) appended to
    `zone('corner')` while `canBuild` and mode `off`; removed otherwise.
  - Piece strip (build mode): a `div role="listbox" aria-label="Pieces"` appended to `zone('alerts')`, one row,
    horizontal scroll (`overflow-x:auto;touch-action:pan-x`); cards `makeButton` 72 x 88 (`role="option"`,
    `aria-selected` for the selected piece) with the icon (`prefabIconElement(prefab, '▦', 32)`), the name
    (`T.font.small`) and the cost line `Needs <n> <tag> (you have <m>)` per input (warn colour and `!` when short);
    unaffordable cards keep full opacity and add the word "short". Desktop key hint `1`..`9` as visible text.
  - Status line and base HP (build mode): a plate under the strip in the same zone, `T.font.body`; the HP bar has
    `role="progressbar"` and text `Base <hp> / <max>`.
  - Action row (build mode): a flex row appended to `zone('prompt')` above the prompt bar: EXIT, TAKE DOWN, REPAIR, the
    target action (when set), PLACE (`variant: 'primary'`, `size: 'big'`); others `size: 'touch'`. Disabled ones use
    `setButtonEnabled(b, false, reason)` with reasons "Nothing to repair", "Cannot take this down", the action's own
    reason. Keyboard hints as visible text (`F`, `G`, `X`, `Esc`).
  - Claim card (claim mode): a sheet `{ id: 'dayg-build-claim', title: 'Claim this plot?', size: 'tall' }` with the
    `claim.why` text when not ok, CLAIM (`variant: 'primary'`, disabled with the reason unless ok) and EXIT.
  - Remove the old absolute positions (276 px, 236 px, 72 px, 152 px) and the old injected style rules that set them.
- Chest UI: a sheet `{ id: 'dayg-chest', title: 'Chest', size: 'tall' }` laid out like the pack: one row per stack
  (icon, name and count, kg) with `Take` in the chest list and `Store` in the pack list (portrait: tabs Chest and Pack,
  `role="tablist"`; landscape: two columns), and a footer `<used> / <capacityBulk> L`.

## Done when
- `npx tsc --noEmit -p games/dayg` passes and `npm test -w games/dayg` passes.
- With the server on 5326: `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5326/?seed=1&touch=1&buildui=1"`,
  then with `buildui=claim` and with `chestui=1`, print UI AUDIT OK; repeat each with `&ui-scale=2` and
  `&ui-theme=contrast`.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5326/?seed=1&touch=1&buildui=1" --name dayg-11.17` and
  the desktop size, and the same for `chestui=1`: read the PNGs. BUILD-mode controls do not cover the touch block or
  the HUD; a wall card reads "Needs 3 PLANK (you have ...)".

## Out of scope
src/base/build.ts, system.ts, actions.ts and every other base/, game/ and sim/ file, the other panels, layout.ts,
theme.ts, main.ts.
~~~~

~~~~text
Epic: 11D Panels and gate (issue 11.18 Phone pass and gate)
Depends on: none (round 3 done)
Stories: S28, S36, S37 (the full sweep), and the PLAYTEST checks for every story

## Environment
- Repo: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\encantado, Git Bash. If `node` is not found:
  `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed; do not run npm install.
- Game: games/dayg. Other workers are editing talkPanel.ts, boardPanel.ts, ledgerPanel.ts, roomPanel.ts and
  src/base/buildUi.ts and chestUi.ts right now: do not audit or edit those. Change only games/dayg/src/ui/layout.ts (zone geometry: the
  CSS positions, max widths and the four exported constants), games/dayg/src/ui/theme.ts (token values only; names and
  signatures stay) and games/dayg/PLAYTEST.md.
- Dev server: port 5327 only (`cd games/dayg && npx vite --port 5327 --strictPort`, in the background; stop it when
  done). Do not commit.

## Goal
Every screen built in rounds 1-3 passes the audit at 390x844, 844x390 and 1280x800, at text scales 1, 1.5 and 2, in
both themes and with reduced motion; any remaining failure is fixed in zone geometry or token values or listed in the
report; PLAYTEST.md asks testers about the new UI.

## Read first
- games/dayg/scripts/ui-audit.mjs: usage at the top of the file (`--url`, `--sizes`, `--scope`, `--wait`, `--motion`).
- games/dayg/src/ui/layout.ts: zone CSS and constants.
- games/dayg/src/ui/theme.ts: token values.
- games/dayg/src/ui/theme.test.ts: contrast tests that must stay green.
- games/dayg/PLAYTEST.md: the current session and phone checks.

## Change
- games/dayg/src/ui/layout.ts: geometry only.
- games/dayg/src/ui/theme.ts: values only.
- games/dayg/PLAYTEST.md.

## Contract
- Do not rename or remove any export of layout.ts or theme.ts; do not change `Layout`, `Sheet` or `T`.
- The sweep (each command must print UI AUDIT OK):
  for OPEN in "" "&open=pack" "&open=map" "&open=status" "&open=settings" "&open=actions" "&open=recap";
  for EXTRA in "" "&ui-scale=1.5" "&ui-scale=2" "&ui-theme=contrast" "&ui-hand=left":
  `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5327/?seed=1&touch=1$OPEN$EXTRA"`;
  then once `node games/dayg/scripts/ui-audit.mjs --url "http://localhost:5327/?seed=1&touch=1&ui-motion=reduce" --motion`.
  Write the loop as a bash for-loop; collect the failures.
- Allowed fixes: zone positions, max widths, gaps and the constants `CONTROLS_PORTRAIT_H`, `CONTROLS_W`,
  `PROMPT_BOTTOM_PORTRAIT` (if you change these, the touch block in touch.ts reads them, so check `#dayg-touch` again);
  token values (font sizes may only grow; colours must keep `npx vitest run src/ui/theme.test.ts` green). Anything
  that needs a change in another module: list it in your report with the failing command and line, do not edit it.
- PLAYTEST.md "Phone checks": replace the button list with: move stick, ACT (does it show the verb?), long press ACT
  (action list), HIT, CROUCH/STAND, CLIMB/UP, VIEW, and the PACK, MAP and ☰ corner buttons; add: "Did a hint tell you
  what to do next, and could you turn hints off?", "Try Settings: text size 200% and High contrast. Could you still
  read and reach everything?", "Try Hand: Left.", "With Camera follows on, could you play with one thumb?". Add to the
  form: "7. Was any text too small or any colour hard to tell apart?" Keep everything else.

## Done when
- The sweep prints UI AUDIT OK for every combination, or every remaining failure is listed in the report with the reason
  it needs another module.
- `cd games/dayg && npx vitest run src/ui` passes and `npx tsc --noEmit -p games/dayg` passes.
- `node games/dayg/scripts/ui-shot.mjs --url "http://localhost:5327/?seed=1&touch=1&ui-scale=2" --name dayg-11.18-s2`
  and `--url "http://localhost:5327/?seed=1&touch=1&ui-theme=contrast&open=pack" --name dayg-11.18-hc`: read the PNGs
  and confirm nothing is cut off.

## Out of scope
The five phases 4-8 panels (11.15-11.17), hud.ts, touch.ts, prompt.ts and every other module (report, do not edit),
main.ts.
~~~~

### End of round 4 (planner)

1. `npx tsc --noEmit -p games/dayg`, `npm run build -w games/dayg`, `npm test -w games/dayg`.
2. The 11.18 sweep at port 5206, extended with `&open=` for each phases 4-8 panel and `buildui=1`, `buildui=claim`, `chestui=1`; fix or file what remains.
3. `bash tools/smoke.sh "http://localhost:5206/?seed=1" dayg-root dayg-hud dayg-touch dayg-prompt` and
   `npm run zfight -- "http://localhost:5206/?seed=1"`.
4. Update `games/dayg/README.md` (controls and settings) and `AGENT_INDEX.md` (the two scripts).
5. Commit, push, open the PR against `main` on `cstabnick/lawn-gnome-panic` with: what changed (by story), how to run
   (`npm run dev -w games/dayg`, the `ui-*` URL parameters), what was tested (the audit sweep, unit tests, Edge
   screenshots at three sizes) and what was not (no real phone, no real screen reader), mobile yes, online unchanged,
   no achievements and why. Demo: record with `npm run demo -- <demo.json> --gif` (no `--pr`), upload through the
   media-upload MCP and put the URL in the description.
