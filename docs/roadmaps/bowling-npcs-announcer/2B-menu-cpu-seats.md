Epic: 2 Features
Depends on: none

## Environment
- Repo: `C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\bowling-npcs` (a git worktree). Work only inside it. Game: `games/gnome-bowling` (TypeScript + Vite, plain DOM menus). In Git Bash, if node is missing: `export PATH="/c/Program Files/nodejs:$PATH"`. Dependencies are installed.
- Five other workers are editing other files in this same game at the same time. Change only the files listed under Change. Do not run `vite build` / `npm run build`, and do not run any git command that writes (commit, stash, checkout, reset).
- Type-check: `cd games/gnome-bowling && npx tsc --noEmit -p .` . An error in a file you do not own is another worker mid-edit: ignore it and mention it in your report.
- A dev server is already running at http://localhost:5291/ (do not start or stop one). Screenshot the title menu:
  `bash /c/Users/cpsai/.claude/jobs/f4225e05/tmp/shot.sh "http://localhost:5291/#mute" "C:\Users\cpsai\.claude\jobs\f4225e05\tmp\2B-menu.png" 1500` then Read the png. The menu loads its seats from localStorage, which is empty in this headless profile, so you see one human seat; to see CPU seats in a screenshot temporarily change nothing — instead check the add/cycle logic by reading your code carefully, and use the smoke test below.
- Smoke test (page loads, no console errors): `bash tools/smoke.sh "http://localhost:5291/#mute" bm-root` from the repo root.
- Repo rule: UI modules append their own container under the shared `#ui`; never restyle `#ui`.

## Goal
The title menu can add CPU bowlers to a local game ("+ ADD CPU"), pick which CPU with the arrows, and has an announcer on/off toggle.

## Read first
- `games/gnome-bowling/src/menu.ts`: the whole file. The players panel (`Seat`, `loadSeats`, `saveSeats`, `renderPlayers`, `cycleLook`, `addSeat`, `removeSeat`), the BOWL! button, `onlineIdentity`, `refreshWho`, and the CSS block (`#bm-root ...`).
- `games/gnome-bowling/src/npc.ts`: `NPCS` (each has `id`, `name`, `title`, `look`, `color`), `NPC_ORDER`, `isNpcId`.
- `games/gnome-bowling/src/game.ts`: only these exports: `makePlayer(name, look, color, local = true, netId = -1, npc = null)` and `makeNpcPlayer(id: NpcId): Player`.
- `games/gnome-bowling/src/speech.ts`: `announcerOn(): boolean`, `setAnnouncerOn(on: boolean): void`, `speak(parts: SpeechPart[], interrupt = false)` where `SpeechPart = { text, voice?: 'gnome' | 'announcer', pitch?, rate?, volume? }`.

## Change
- `games/gnome-bowling/src/menu.ts` only:
  1. `interface Seat { name: string; look: LookId; npc?: NpcId }`. `loadSeats` keeps a saved seat's `npc` only if `isNpcId(o.npc)` (then name/look come from `NPCS[npc]`); `saveSeats` stores it as is.
  2. Under the seat cards, when `seats.length < MAX_LOCAL_PLAYERS`, show two buttons side by side (a flex row, each half width): the existing '+ ADD PLAYER' and a new '+ ADD CPU' (class `bm-btn ghost`). '+ ADD CPU' pushes `{ name: NPCS[id].name, look: NPCS[id].look, npc: id }` with id = the first of `NPC_ORDER` not already used by another seat (or `NPC_ORDER[0]` if all are used).
  3. A CPU seat's card: chip colour `NPCS[id].color`; instead of the name `<input>`, a non-editable name line (class `bm-cpuname`, bold 18px) plus a small grey title line `NPCS[id].title` (class `bm-cputitle`), and a small 'CPU' badge (class `bm-cpubadge`: 11px, 900 weight, padding 2px 6px, border-radius 6px, background #3ff0ff, color #14082a) after the name. The ◀ ▶ arrows cycle through `NPC_ORDER` (skipping ids used by other seats when possible) instead of looks; the swatch shows `NPCS[id].look`, the label shows `NPCS[id].name`. The ✕ remove button works as for humans.
  4. BOWL!: human seats are checked with `checkName` as now (errors only for humans); CPU seats become `makeNpcPlayer(seat.npc)`; human seats `makePlayer(name, look, SEAT_COLORS[i])` as now. An all-CPU game is allowed (watch mode).
  5. Online uses the first seat without `npc` (fall back to `defaultSeat(0)` when every seat is a CPU) in `onlineIdentity` and `refreshWho`. CPU seats never go online.
  6. Announcer toggle: a full-width ghost button under BOWL! (before the how-to list) reading '📣 ANNOUNCER: ON' or '📣 ANNOUNCER: OFF' from `announcerOn()`. Tapping it calls `setAnnouncerOn(!announcerOn())`, updates the label, plays `sfx('click')`, and when it turns on says `speak([{ text: 'Announcer, on!', voice: 'announcer', pitch: 0.4, rate: 0.85 }], true)`.
  7. Add the new CSS rules to the existing `CSS` string (all selectors start with `#bm-root`).

## Contract
`createMenu(ctx: Ctx): System` keeps its signature. Use `tap(el, fn)` for every new button (it already starts audio). The localStorage key stays `'gnome-bowling-players'`.

## Done when
- `cd games/gnome-bowling && npx tsc --noEmit -p .` has no errors in `src/menu.ts`.
- `bash tools/smoke.sh "http://localhost:5291/#mute" bm-root` prints SMOKE OK (run from the repo root).
- The screenshot of the title menu shows '+ ADD PLAYER' and '+ ADD CPU' side by side and the announcer toggle under BOWL!, fitting without horizontal scroll. Also shoot it at phone size by adding `--window-size` — shot.sh uses 900x700; for a phone check, copy shot.sh to `C:\Users\cpsai\.claude\jobs\f4225e05\tmp\shot-phone.sh` with `--window-size=390,844` and shoot again. List the png paths in your report.

## Out of scope
Every other file. Do not edit `npc.ts`, `game.ts`, `speech.ts`, `hud.ts`, `config.ts`.
