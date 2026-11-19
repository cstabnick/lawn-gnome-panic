Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/club-gnome/_env.md` first: environment and shared rules.)

## Goal
Two small DOM modules of `games/club-gnome`: `account.ts` (finish a sign-in, and a friendly guest card: "nothing is
saved without an account", sign in or keep playing as a guest; never forced) and `overlay.ts` (opens another arcade
game full screen over the town in an iframe, with a bar to come back).

## Read first
- `games/club-gnome/src/config.ts`: `GameLink`, `STORAGE.guestDismissed`.
- `games/club-gnome/src/account.ts` and `games/club-gnome/src/overlay.ts`: the stubs you replace (keep exports exactly).
- `packages/platform/src/session.ts`: `accountsEnabled()`, `hasStoredSession()` (cheap, no dependencies).
- `packages/platform/src/auth.ts`: `signIn()` (redirects to Keycloak, returns to this page) and `completeSignIn()`.

## Change
- `games/club-gnome/src/account.ts`:
  - `accountState()`: `{ enabled: accountsEnabled(), signedIn: hasStoredSession() }` imported from `@lawn/platform/session`.
  - `finishSignInIfReturning()`: only when `location.search` has `state` and (`code` or `error`):
    `const { completeSignIn } = await import('@lawn/platform'); await completeSignIn();` in try/catch. Never rejects.
    Do not import `@lawn/platform` (the heavy part) statically anywhere.
  - `showGuestPrompt(ui, force)`: return when `!enabled || signedIn`, or when `sessionStorage[STORAGE.guestDismissed]
    === '1'` and not `force` (storage in try/catch). Otherwise show a card in its own container appended to `ui`: a dim
    backdrop (tap on it = keep playing) and a centred card (max-width 340 px, rounded, warm parchment colour 0xfff4dc,
    dark text) with the title "Playing as a guest", the text "You can walk around, chat and play everything. But
    nothing is saved without an account: your gnome, achievements and progress stay only in this browser.", a primary
    button "Sign in with Google" and a secondary "Keep playing as a guest" (both at least 44 px tall). Sign in: disable
    the button, `const { signIn } = await import('@lawn/platform'); await signIn();` (on failure re-enable it and show
    "Couldn't reach sign-in. Try again later." in the card). Guest / backdrop / Escape: remove the card and set
    `sessionStorage[STORAGE.guestDismissed] = '1'`. Only one card at a time.
- `games/club-gnome/src/overlay.ts`:
  - `gameUrl(link)`: `const env = (import.meta as unknown as { env?: { DEV?: boolean } }).env;` on a dev server (`env?.DEV`)
    `${location.protocol}//${location.hostname}:${link.port}/`, else `../${link.game}/` (the built site puts every game in a
    sibling folder). Query: `link.query` plus this page's own `mp` and `platform` URL parameters if present, joined with `&`.
  - `createOverlay(ui)`: a container appended to `ui` (`position:fixed; inset:0; z-index:50; pointer-events:auto;
    display:none; background:#000; flex column`). A top bar 48 px tall plus `env(safe-area-inset-top)` padding: a back button
    (min 44 px, `← ${backLabel}`) on the left and the game title in the middle. Below it an `iframe` filling the rest
    (`border:0; width:100%; flex:1`, `allow="autoplay; fullscreen; pointer-lock; gamepad"`, `title` = game title).
    `open(link, backLabel)`: set `src = gameUrl(link)`, show, `isOpen` true (a getter), focus the iframe. Back button or
    `close()`: set `src` to `about:blank` (stops the game and its audio and its own server connection), hide, `isOpen`
    false, call every `onClose` listener. Escape on the town page (not inside the frame) also closes it.

## Contract
```ts
// account.ts
export interface AccountState { enabled: boolean; signedIn: boolean }
export function accountState(): AccountState;
export async function finishSignInIfReturning(): Promise<void>;
export function showGuestPrompt(ui: HTMLElement, force?: boolean): void;
// overlay.ts
export function gameUrl(link: GameLink): string;
export interface Overlay { readonly isOpen: boolean; open(link: GameLink, backLabel: string): void; close(): void; onClose(fn: () => void): void }
export function createOverlay(ui: HTMLElement): Overlay;
```

## Done when
- `npx tsc --noEmit -p games/club-gnome` shows no error in `account.ts` or `overlay.ts`.

## Out of scope
Every other file, and everything under `packages/`.
