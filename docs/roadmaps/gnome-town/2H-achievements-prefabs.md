Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/gnome-town/_env.md` first: environment and shared rules.)

## Goal
Two new prefabs (a blackjack table for the Gnomecino, and a dealer's visor as a reward), Gnome Town's achievements in
the shared catalog, and `games/gnome-town/src/achievements.ts` that unlocks them from the town's events.

## Read first
- `docs/roadmaps/prefab-library/_common.md`: the prefab modelling rules and examine-text voice.
- `packages/prefabs/src/catalog/casino.ts`: the format (`PrefabDef`, parts `{ s, d, at, rot, c }`, colour names).
- `packages/prefabs/src/catalog/armor.ts`: the `golf-visor` def (a `wear-head` item to copy the shape of).
- `packages/achievements/README.md` ("Adding achievements for a new game") and `packages/achievements/src/catalog.ts`.
- `packages/achievements/src/tracker.ts`: `createAchievementTracker({ game, ui })`, `unlock(id)`, `increment(id, by)`.
- `games/gnome-town/src/achievements.ts`: the stub you replace; `games/gnome-town/src/config.ts`: `GameKey`, `MapId`, `MAP_IDS`, `STORAGE.visited`.

## Change
- `packages/prefabs/src/catalog/casino.ts`: append
  - `blackjack-table`: category 'furniture', uses ['place'], tags include 'casino', 'blackjack', 'cards', 'table';
    emoji ['🃏']. A half-moon card table about 2.6 wide, 0.95 high, 1.5 deep (largest side must stay under 3): a green
    felt top (a flattened cylinder cut to a half disc, or a box plus a half cylinder) with a padded dark rim, a wooden
    base, the dealer's straight edge at -z and the players' curve toward +z, a chip tray and a card shoe on the dealer
    side, a few chip stacks on the felt. Origin on y = 0, centred. 4-6 examine lines in the catalog's voice (Gnomecino
    mentions welcome: it is the casino in Gnome Town).
  - `dealer-visor`: category 'armor', uses ['wear-head'], a translucent green dealer's eyeshade on a band (shape like
    `golf-visor`); 4-6 examine lines.
- `packages/achievements/src/catalog.ts`: a `// ---- Gnome Town ----` block, `game: 'gnome-town'`, `gameTitle: 'Gnome Town'`:
  - `town-welcome` "New in Town": Walk into Gnome Town for the first time. reward neck, reuse an existing wear-neck prefab.
  - `town-explorer` "Town Explorer": Visit all four places: Town Square, the Gnomecino, the Arcade and Links Park. target 4. reward back (existing prefab).
  - `town-high-roller` "High Roller": Sit at the High Rollers table in the Gnomecino. reward head `dealer-visor` (label 'Dealer Visor').
  - `town-regular` "Regular": Open 10 games from Gnome Town. target 10. reward hand (existing holdable prefab).
  - `town-chatterbox` "Chatterbox": Send 25 chat lines in Gnome Town. target 25. no reward needed.
  - `town-crowd` "Crowd Pleaser": Be in one place with 5 other gnomes. reward head (existing prefab).
  Prefer reward prefabs no other achievement already uses; the test checks each fits its slot.
- `games/gnome-town/src/achievements.ts`: keep every stub export and signature. `initAchievements(ui)` creates
  `createAchievementTracker({ game: 'gnome-town', ui })` from `@lawn/achievements`. `onVisitMap(map)`: unlock
  `town-welcome`; keep the visited maps as a JSON array in `localStorage[STORAGE.visited]` (try/catch) and
  `increment('town-explorer')` only for a map not seen before. `onOpenGame(game)`: increment `town-regular`; game
  `'blackjackHigh'` also unlocks `town-high-roller`. `onChatSent()`: increment `town-chatterbox`. `onEmoteSent()`:
  nothing yet (keep the export). `onCrowd(others)`: `others >= 5` unlocks `town-crowd`. Calls before `initAchievements`
  are ignored; never let a rejected promise escape (`void p.catch(() => {})`).

## Contract
```ts
export function initAchievements(ui: HTMLElement): void;
export function onVisitMap(map: MapId): void;
export function onOpenGame(game: GameKey): void;
export function onChatSent(): void;
export function onEmoteSent(): void;
export function onCrowd(others: number): void;
```
Prefab ids exactly `blackjack-table` and `dealer-visor` (the maps use `blackjack-table`).

## Done when
- `npm test -w packages/prefabs` passes.
- `npm test -w packages/achievements` passes.
- `npx tsc --noEmit -p games/gnome-town` shows no error in `achievements.ts`.

## Out of scope
Every other file of `games/gnome-town`; other prefab catalog files except reading them; other games.
