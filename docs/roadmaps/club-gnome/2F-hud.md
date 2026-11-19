Epic: 2 (modules)
Depends on: none

(Read `docs/roadmaps/club-gnome/_env.md` first: environment and shared rules.)

## Goal
`games/club-gnome/src/hud.ts` is the town's on-screen interface, phone-first: where you are and who is online, the
map picker, the account button, the big action button, the chat log, chat input and emote picker.

## Read first
- `games/club-gnome/src/config.ts`: `MAP_IDS`, `MAP_NAMES`, `MAP_BLURBS`, `MapId`, `EMOTES`, `EMOTE_IDS`, `EmoteId`, `NetStatus`, `CHAT.logLines`.
- `games/club-gnome/src/hud.ts`: the stub you replace (keep `HudHandlers`, `Hud`, `createHud` exactly).

## Change
`games/club-gnome/src/hud.ts` (DOM only, styles in one injected `<style>` with classes prefixed `th-`):
- Root `div.th-root` appended to `ui`: `position:fixed; inset:0; pointer-events:none`, padding
  `env(safe-area-inset-top/right/bottom/left)` plus 8 px. Interactive children set `pointer-events:auto`.
- Top left: a dark translucent pill with the map name (bold) and a status line: online `🟢 {inRoom} here · {inTown} in
  town`; connecting `🟡 Connecting…`; retrying `🟠 Reconnecting…`; unavailable `⚪ Offline: just you`.
- Top right: two buttons (min 44 x 44 px): `🗺️ Map` and the account button (label from `setAccount`, default `👤 Guest`).
  Map opens a centred panel (max-width 360 px, scrolls if tall) titled "Where to?", one big button per `MAP_IDS` entry
  (name bold + blurb small; the current map marked "you are here" and disabled), and a ✕ close button. Picking calls
  `h.onTravel(id)` and closes. Account calls `h.onAccount()`.
- Bottom: the chat bar, full width up to 640 px, centred: a log above it (last `CHAT.logLines` lines kept; shows about 5
  lines, scrolls, newest at the bottom, auto-scrolls; dark translucent; a line is `name: text` with the name bold in
  `#rrggbb` of its colour; system lines grey italic), then a row: an emote toggle button `😀`, the text input
  (`maxlength` 120, placeholder "Say something…", font-size 16 px so iOS does not zoom), and a `Send` button. The emote
  toggle opens a row of buttons, one per `EMOTE_IDS` with its `EMOTES` emoji; tapping one calls `h.onEmote(id)` and
  closes the row.
  - Enter in the input sends (trimmed, skipped when empty), clears it and keeps focus on desktop, blurs on touch
    (`matchMedia('(pointer: coarse)')`); Escape blurs. Stop key events in the input from propagating.
  - A small `▾`/`▴` button collapses the log to 2 lines (remembered in `localStorage` key `club-gnome.log-collapsed`, try/catch).
- Action button: centred above the chat bar, min-height 52 px, bold, gold (#ffcc33) with dark text, rounded, a little
  bounce animation on show. `setAction(label)` is called every frame: touch the DOM only when the label changes.
  Tapping calls `h.onAction()`.
- `typing`: a getter, `document.activeElement === input`. `focusChat()`: focus the input.
- `setVisible(v)`: `display` of the root.
- Layout must fit a portrait phone (390 x 844) and a landscape phone (844 x 390): in landscape (height < 500 px) the
  log shows 3 lines and the top pill is compact; nothing overlaps the action button.
- Text only through `textContent`.

## Contract
```ts
export interface HudHandlers {
  onChat(text: string): void; onEmote(e: EmoteId): void; onAction(): void; onAccount(): void; onTravel(map: MapId): void;
}
export interface Hud {
  setMapName(name: string): void;
  setStatus(status: NetStatus, inRoom: number, inTown: number): void;
  setAction(label: string | null): void;
  log(name: string, color: number, text: string): void;
  system(text: string): void;
  setAccount(label: string): void;
  readonly typing: boolean;
  focusChat(): void;
  setVisible(visible: boolean): void;
}
export function createHud(ui: HTMLElement, h: HudHandlers): Hud;
```

## Done when
- `npx tsc --noEmit -p games/club-gnome` shows no error in `hud.ts`.

## Out of scope
Every other file. Do not style or hide `#ui` or `body`.
