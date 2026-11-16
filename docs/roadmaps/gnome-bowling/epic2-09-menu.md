Epic: 2 (systems, all parallel)
Depends on: none

## Environment
Read `docs/roadmaps/gnome-bowling/_common.md` first (environment, rules, world conventions). Other workers edit other files at the same time.

## Goal
`src/menu.ts` is the title screen: set up 1-4 local players (name + bowl-cut gnome look) and play, or go online (quick match or room code), plus the online lobby screen while waiting for a match.

## Read first
- `games/gnome-bowling/src/config.ts`: `LOOKS`, `LOOK_ORDER`, `LookId`, `SEAT_COLORS`, `MAX_LOCAL_PLAYERS`, `NetApi`, `NetStatus`, `GameState`, `Ctx`
- `games/gnome-bowling/src/game.ts`: `makePlayer`, `newGame`, `toLobby`, `toTitle`
- `packages/mp/src/textFilter.ts`: `checkName(raw)` → `{ ok: true; name } | { ok: false; reason }` (import from `'@lawn/mp/textFilter'`; names 2-18 chars)

## Change
- `games/gnome-bowling/src/menu.ts`: `createMenu(ctx): System`. Container `#bm-root` in `ctx.ui`; CSS selectors start with `#bm-`. Visible only in phases 'title' and 'lobby'.

## Title screen (phase 'title')
- Full-screen overlay with a translucent dark-purple gradient (the 3D alley shows through, the camera orbits behind it). Logo: "GNOME" over "BOWLING" in huge italic 900 with neon pink/cyan glow (`text-shadow` layers) and a 🎳; a tag line "Bowl-cut gnomes. Ten pins. Zero dignity."
- **Players** panel: 1-4 player cards (start with 1; "+ ADD PLAYER" up to MAX_LOCAL_PLAYERS; "✕" removes). Each card: colour chip `SEAT_COLORS[i]`, name input (max 12 chars, default `LOOKS[look].name`), and a look picker (◀ name ▶ cycling `LOOK_ORDER`; show the look's name and a small CSS-drawn swatch of its shirt and bowl-cut colours: a circle in `bowlCut` colour on top of a rectangle in `shirt` colour). Different default looks per seat (seat i → LOOK_ORDER[i]).
- **BOWL!** big button: validates names with `checkName` (show `reason` under the bad field and stop if it fails), then `newGame(state, players.map((p, i) => makePlayer(p.name, p.look, SEAT_COLORS[i])), 'local')`, `startAudio()`, `sfx('click')`.
- **Online** panel (only if `ctx.net.available()`; otherwise a grey note "Online play needs the game server"): uses player 1's name and look. Buttons: **QUICK MATCH** → `ctx.net.quickMatch(name, look)`; a 4-8 char room code input (upper-cased, A-Z 0-9 only) + **JOIN ROOM** → `ctx.net.joinRoom(code, name, look)`; **NEW ROOM** fills the input with a random 5-char code (letters/digits, no 0/O/1/I) and joins it. net.ts switches the phase to 'lobby' itself.
- Persist the local player setup in `localStorage` key `gnome-bowling-players` (try/catch every access; render fine without it).
- Show "How to play" in 3 short lines: "◀ ▶ step, ↺ ↻ aim", "Swipe up to bowl — faster swipe, faster ball", "Curl your swipe or set SPIN to hook into the pocket".

## Lobby (phase 'lobby')
- Shows `state.net.status` / `state.net.message`, the room code big (if `state.net.code`) with "Tell your friends this code", players waiting `state.net.waiting` / 4 and "Starting in Ns" (`state.net.startsInS`) while 'queued'; a spinner while 'connecting'; the message in red on 'error' with a BACK button. A **CANCEL** button: `ctx.net.leave(); toTitle(state)`.
- Optional `?room=CODE` in the URL: on load, if present and online is available, prefill the room code input.

## Mobile
Must fit 390x844 portrait (scroll inside the panel if needed: put `data-scroll` attribute on the scrollable element, main.ts lets those scroll natively) and 844x390 landscape (two columns: players | online). Inputs font-size ≥ 16px (stops iOS zoom). Buttons ≥ 48px, pointer events (`pointerup`), and also `click` is fine for inputs.

## Contract
`export function createMenu(ctx: Ctx): System`. Nothing else exported.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` shows no errors in menu.ts
- The title screen shows on load; BOWL! starts a local game with the chosen players; the online buttons call the NetApi; the lobby screen shows NetStatus.

## Out of scope
net.ts implements the NetApi; hud.ts owns the final standings. Do not edit any other file.
