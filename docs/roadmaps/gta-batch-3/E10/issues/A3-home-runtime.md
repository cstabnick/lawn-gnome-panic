Epic: E10-A (homes, parallel wave)
Depends on: none (foundation in place)

Read `docs/roadmaps/gta-batch-3/E10/issues/_env.md` first (environment, rules).

## Goal
The home's game logic in one module: the flat is a registered property; the 1,500-Acorn loan is signed at the First Kiln Bank
during the move-in quest; sleeping in your bed passes time and saves; probes and achievements;
a "Home" app on the Gnomlet tablet.

## Read first
- `games/gnome-theft-auto/src/home/types.ts` (`FLAT_ID`, `FLAT_PROPERTY`) and `games/gnome-theft-auto/src/home/layout.ts`
  (`loadLayout`, `addStored`, `commitLayout`, `onHomeChange`, `setHomeHooks`, `placedCount`).
- `games/gnome-theft-auto/src/ownership.ts`: `registerProperty`, `buyProperty(id): { ok: true } | { ok: false; error }`,
  `ownsProperty`, `onPropertyChange` (module-level functions).
- `games/gnome-theft-auto/src/gnomlet/registry.ts`: `registerGnomletApp`, `GnomletApp`, `GnomletCtx`.
- `games/gnome-theft-auto/src/city/probes.ts`: `registerProbe(id, fn)`.

## Change
- New `games/gnome-theft-auto/src/home/runtime.ts`:
  ```ts
  import type { Economy } from '../economy';
  import type { DecorPanel } from './decorUi';   // type-only: another worker writes decorUi.ts
  export const HOME_QUEST_ID = 'm02-roof-on-credit';
  export interface HomeDeps {
    hud: { toast(text: string, ms?: number): void };
    economy: Pick<Economy, 'state'>;
    /** The player's health (0..1 of full); sleeping sets it to 1. */
    heal(): void;
    /** atmosphere.advanceWorldTime, or null without a sky. */
    advanceWorldTime: ((mode: 'noon' | 'night', seconds?: number) => { done: Promise<void> }) | null;
    nightFactor(): number;
    unlock(id: string): void;
    increment(id: string, by: number): void;
    /** The active quest id (quests.getJournal().activeId), or null. */
    activeQuestId(): string | null;
    /** The current interior id (interiors currentInterior), or null. */
    currentInterior(): string | null;
    decor: DecorPanel;
  }
  export interface HomeRuntime { update(dt: number): void }
  export function installHome(deps: HomeDeps): HomeRuntime;
  ```
  If `./decorUi` does not exist yet when you type-check, create nothing there: write the type locally instead
  (`interface DecorPanel { open(tab?: 'room' | 'shop' | 'colours'): void; close(): void; isOpen(): boolean }`) and
  export it from runtime.ts as `HomeDecorPanel`; use that in `HomeDeps`.
  - At module top level: `registerProperty(FLAT_PROPERTY)` (so the Ledger lists the flat from the start; its
    `buyHint` replaces the Buy button there).
  - **Signing the loan** (the quest `m02-roof-on-credit`, written by another worker, has a `visit` step at the First
    Kiln Bank counter; when the step after it starts, the loan is signed). Export
    `export function signFlatLoan(deps: Pick<HomeDeps, 'hud' | 'unlock'>): boolean`: if `ownsProperty(FLAT_ID)` return
    false; `buyProperty(FLAT_ID)`; on ok: toast `'Parsley Inkpot stamps it: "1,500 Acorns, on your ledger beside the Kiln-Debt. Mind the walls."'`
    (6000 ms), `deps.unlock('gta-home-sweet-loan')`, housewarming gifts into storage: `const l = loadLayout();
    addStored(l, 'armchair'); addStored(l, 'plant'); commitLayout(l)` and a toast "Pip left you an armchair, Hyssop a
    plant. They are in storage: Decorate the flat to place them."; return true. On error toast the error, return false.
  - `HomeRuntime` gets two more methods the lead wires from app.ts:
    - `onQuestStep(questId: string, step: number): void`: when `questId === HOME_QUEST_ID && step >= HOME_SIGN_STEP`
      call `signFlatLoan(deps)`. Export `HOME_SIGN_STEP = 2` (the objective index right after the bank visit).
    - `catchUp(saves: Record<string, { state: 'active' | 'done'; step: number }>): void`: at load, if
      `saves[HOME_QUEST_ID]` is done, or active with `step >= HOME_SIGN_STEP`, and the flat is not owned, sign quietly
      (same as `signFlatLoan` but without toasts: give it an optional `quiet` flag).
  - **Hooks**: `setHomeHooks({ sleep, decorate })`:
    - `decorate()`: `deps.decor.open('room')`.
    - `sleep()`: only when `deps.currentInterior() === FLAT_ID` (else return). Guard against double use while a sleep is
      running. If `deps.nightFactor() > 0.5` sleep till `'noon'`, else till `'night'`:
      `await deps.advanceWorldTime?.(mode, 3)?.done`; then `deps.heal()`, `notifySaveChanged()` (from `../saveHook`),
      toast `mode === 'noon' ? 'Morning. You slept like a fired pot. (Game saved.)' : 'You nap until dark. (Game saved.)'`,
      `deps.unlock('gta-forty-winks')`.
  - **Probes**: `registerProbe('home-owned', () => (ownsProperty(FLAT_ID) ? 1 : 0))`,
    `registerProbe('home-furnished', () => placedCount(loadLayout()))`.
  - **Interior Decorator**: remember `loadLayout().placedEver` at install; on every `onHomeChange(l)`, if
    `l.placedEver` grew, `deps.increment('gta-interior-decorator', grown)`.
  - **Gnomlet app**: `registerGnomletApp({ id: 'home', label: 'Home', icon: '🏠', group: 'money', order: 35, detail, open })`.
    - `detail()`: owned → `` `${placedCount} pieces · loan ${remaining} 🌰` `` (remaining =
      `deps.economy.state().loans.find((l) => l.id === FLAT_ID)?.remaining ?? 0`, or "loan paid" at 0); not owned →
      'No home yet'.
    - `open(root, ctx)`: build plain DOM inside `root` (no global CSS; inline styles; buttons >= 44 px tall):
      not owned → a short paragraph "Pip says the bench at Side-Valve is not a home. Ask him about a roof." and nothing
      else. Owned → the address "Flat 3B, Saucer Court", the loan line, "Pieces placed: n", "In storage: n", and three
      buttons: "Arrange furniture" (`ctx.close(); deps.decor.open('room')`), "Furniture shop" (`... open('shop')`),
      "Paint" (`... open('colours')`). Return a cleanup that removes listeners.
- New `games/gnome-theft-auto/src/home/runtime.test.ts`: with stub deps (a fake decor panel recording calls, a toast
  array, `activeQuestId: () => HOME_QUEST_ID`), `installHome(deps)`; check `listProperties()` contains `FLAT_ID`; after
  `installOwnership(createOwnership({ economy: createEconomy() ... }))` (read ownership.test.ts for how it is set up),
  call `runtime.onQuestStep(HOME_QUEST_ID, 2)` and assert `ownsProperty(FLAT_ID)` and
  `loadLayout().stored.armchair === 1`. Use `resetLayoutCache()` + `loadLayout(undefined)` first.

## Contract
- `installHome(deps): HomeRuntime` (`update`, `onQuestStep`, `catchUp`), `HOME_QUEST_ID = 'm02-roof-on-credit'`, `HOME_SIGN_STEP = 2`, `signFlatLoan(deps, quiet?): boolean`.
- Probes `home-owned` (0/1) and `home-furnished` (pieces placed) for quests (E20).
- Achievement ids (another worker adds them to the catalog): `gta-home-sweet-loan`, `gta-interior-decorator`
  (target 10), `gta-forty-winks`.

## Done when
- `npx tsc --noEmit -p .` passes for your files; `npx vitest run src/home/runtime.test.ts` passes.

## Out of scope
app.ts (the lead wires `installHome`), home/layout.ts, home/types.ts, ownership.ts, ledger.ts, quests.
