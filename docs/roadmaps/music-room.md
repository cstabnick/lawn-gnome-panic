# Music Room

Goal: `games/music-room`, a multiplayer jam room. Each player picks the drums, the keyboard or the cowbell and plays it
from their computer keyboard (or by tapping pads). Notes are relayed to everyone in the room over the shared server
(`packages/mp-server`, game id `music-room`: 1-16 players, opens at once, drop-in). No host logic: every client plays
the notes it receives. All sounds are synthesized with Web Audio; no assets.

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | `npm run build -w games/music-room` passes with stubs; server knows `music-room` | 0 (done directly) |
| 2. Systems | build passes, smoke test finds `#mr-lobby`, `#mr-stage`, no console errors; two tabs hear each other | 4, parallel |

Epic 1 (done directly): `packages/mp/src/protocol.ts` GAMES entry, server test, scaffold, `src/config.ts` (all
contracts), `src/main.ts` (wiring + key input), stubs `audio.ts`, `net.ts`, `stage.ts`, `lobby.ts`.

Epic 2 issues: each owns exactly one file and must keep the stub's exported signatures.

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\music-room (a git worktree; run every command from here, never cd elsewhere).
Git Bash: if `node`/`npx` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
Dependencies are installed. Do not run npm install, vite build or a dev server. Do not git commit.
Three other workers are editing other files of games/music-room at the same time (net.ts, stage.ts, lobby.ts). Only edit the file named below.

## Goal
games/music-room/src/audio.ts plays synthesized drums, a keyboard and a cowbell with the Web Audio API (no samples, no libraries).

## Read first
- games/music-room/src/audio.ts: the stub; keep both exported signatures exactly.
- games/music-room/src/config.ts: InstrumentId, PADS (pad order per instrument), KEYS_BASE_MIDI.

## Change
- games/music-room/src/audio.ts: replace the stub bodies.
  - One lazily created `AudioContext` (module-level `let ctx: AudioContext | null`). `unlockAudio()` creates it if missing and calls `ctx.resume()` if `ctx.state === 'suspended'`. `playNote` calls `unlockAudio()` first, then returns if ctx is still null.
  - A master chain created with the context: `GainNode` (gain 0.8) -> `DynamicsCompressorNode` (threshold -12, ratio 4) -> `ctx.destination`. Every voice connects to the master gain.
  - `playNote(i, n, gain = 1)`: switch on i. Every voice is short-lived: build nodes, schedule with `ctx.currentTime`, `stop()` the sources, so nothing leaks. Use `gainNode.gain.setValueAtTime` and `exponentialRampToValueAtTime(0.001, t + decay)` (never ramp exponentially to 0).
  - drums (n is the pad index; PADS.drums order): 0 Kick, 1 Snare, 2 Hi-hat (closed), 3 Open hat, 4 Low tom, 5 High tom, 6 Crash, 7 Kick (same as 0). Ignore other n.
    - Kick: sine OscillatorNode, frequency 150 -> 45 Hz exponential over 0.12 s, gain 1 -> 0.001 over 0.45 s.
    - Snare: white-noise buffer (one shared 1 s AudioBuffer of Math.random()*2-1, created once) through a highpass BiquadFilterNode at 1200 Hz, gain 0.7 -> 0.001 over 0.18 s; plus a triangle osc at 190 Hz, gain 0.5 -> 0.001 over 0.1 s.
    - Closed hat: noise through highpass 7000 Hz, gain 0.4 -> 0.001 over 0.05 s. Open hat: same, decay 0.35 s.
    - Toms: sine, start freq 140 (low) / 220 (high), dropping to 0.6x over 0.25 s, gain 0.9 -> 0.001 over 0.35 s.
    - Crash: noise through highpass 4000 Hz plus bandpass 6000 Hz Q 0.7, gain 0.45 -> 0.001 over 1.4 s.
  - keys (n is a MIDI note number, freq = 440 * 2 ** ((n - 69) / 12)): an electric-piano-ish voice: two oscillators (triangle at freq, sine at 2*freq with gain 0.3) into a lowpass BiquadFilterNode (frequency 3000 -> 900 over 0.6 s), envelope gain 0 -> 0.5 in 0.005 s, then exponential to 0.001 over 1.2 s; stop at t + 1.3.
  - cowbell (n is the pad index; PADS.cowbell order): 0 Cowbell, 1 Low bell, 2 High bell, 3 Muted bell. Classic 808 cowbell: two square oscillators at 540 and 800 Hz (multiply both by 0.8 for Low bell, 1.25 for High bell), each through its own GainNode (0.5), summed into a bandpass BiquadFilterNode with frequency = 1.4 x the higher osc freq and Q 1.2, then a gain envelope 0.6 -> 0.001 over 0.6 s (0.12 s for Muted bell).
  - Multiply each voice's peak gain by the `gain` argument.

## Contract
Keep exactly:
export function unlockAudio(): void
export function playNote(i: InstrumentId, n: number, gain = 1): void
Import only from './config' (types/constants). No new dependencies.

## Done when
- `npx tsc --noEmit -p games/music-room` reports no error in src/audio.ts (errors in other files are other workers' in-progress edits; ignore them).
- Every drum/cowbell pad index from config.ts PADS has a sound; keys accepts any MIDI note 24..108.

## Out of scope
config.ts, main.ts, net.ts, stage.ts, lobby.ts, index.html, package.json.
~~~~

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\music-room (a git worktree; run every command from here, never cd elsewhere).
Git Bash: if `node`/`npx` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
Dependencies are installed. Do not run npm install, vite build or a dev server. Do not git commit.
Three other workers are editing other files of games/music-room at the same time (audio.ts, stage.ts, lobby.ts). Only edit the file named below.

## Goal
games/music-room/src/net.ts connects to the shared matchmaking server, joins a room and relays notes and instrument choices between players.

## Read first
- games/music-room/src/net.ts: the stub; keep the RoomNet interface and createRoomNet() signature exactly.
- games/music-room/src/config.ts: GAME_ID, RoomMsg, HEARTBEAT_MS, Member, NetState, isInstrument, isValidNote.
- packages/mp/src/client.ts: serverUrl() and createNetClient(url, game, hello) -> NetClient (connect(), queue(code, character, name), leave(), send(to, d), drop(), onMessage, onClose, id).
- packages/mp/src/protocol.ts: ServerMsg shapes ('welcome', 'match', 'joined', 'left', 'relay', 'ended', 'error'), PlayerInfo { id, name, character, color }.

## Change
- games/music-room/src/net.ts: implement createRoomNet().
  - Imports: `import { createNetClient, serverUrl, type NetClient } from '@lawn/mp/client';` and `import type { PlayerInfo, ServerMsg } from '@lawn/mp/protocol';` plus config.ts.
  - `available` = `serverUrl() !== ''` (compute once).
  - State object starts `{ status: 'offline', message: available ? 'Not in a room' : 'Offline build: playing solo', me: -1, code: null, players: [] }`. Mutate it in place (main.ts holds the reference) and call every onChange listener after each change.
  - join(code, name, instrument): if !available return. Remember instrument as `mine`. If a client exists, drop() it first. Create `createNetClient<RoomMsg>(serverUrl(), GAME_ID, { name, character: instrument })` (GAME_ID is typed string in config.ts; cast it: `GAME_ID as 'music-room'`). Set status 'connecting', message 'Connecting...', code. Register onMessage/onClose, then `await client.connect()` inside try/catch (on failure: status 'error', message = the error's message), then `client.queue(code, mine, name)`.
  - Ignore events from a client that is no longer the current one (keep `let link: NetClient<RoomMsg> | null`).
  - 'match': me = m.you; players = m.players mapped to Member (instrument = isInstrument(p.character) ? p.character : 'keys', me = p.id === m.you); status 'in-room'; message = code ? `Room ${code}` : 'Public room'. Send `{ k: 'here', i: mine }` to everyone (send(null, ...)). Start a setInterval every HEARTBEAT_MS sending the same 'here' (clear any previous interval).
  - 'joined': add the member (same mapping), then send my 'here' once so the newcomer learns my instrument.
  - 'left': remove the member with that id.
  - 'relay': d = m.d as RoomMsg. If d.k === 'here' and isInstrument(d.i): set that member's instrument (notify only if changed). If d.k === 'note' and isInstrument(d.i) and isValidNote(d.i, d.n): call every onNote listener with (m.from, d.i, d.n). Drop anything else.
  - 'ended': reset to not-in-room (players [], me -1, clear interval), status 'offline', message `Room closed: ${m.reason}`, drop the client.
  - 'error': if status is 'connecting', status 'error' and message = m.message, and drop the client; otherwise ignore (chat-rate etc.).
  - onClose (current link only): if status was 'in-room' or 'connecting', reset as for 'ended' with status 'error', message 'Connection lost'.
  - leave(): link?.leave(); link?.drop(); link = null; clear interval; reset players/me/code; status 'offline'; message 'Not in a room'; notify.
  - sendNote(i, n): if status === 'in-room' and link, link.send(null, { k: 'note', i, n }).
  - setInstrument(i): mine = i; update my member's instrument; if in room send { k: 'here', i }; notify.
  - When the page is hidden for a long time the server may drop us; that is fine (the 'ended'/'error' path covers it).

## Contract
Keep exactly the exported `RoomNet` interface and `export function createRoomNet(): RoomNet` from the stub.
Relay payloads are config.ts RoomMsg: { k: 'note'; i: InstrumentId; n: number } | { k: 'here'; i: InstrumentId }, always sent to everyone (to = null).

## Done when
- `npx tsc --noEmit -p games/music-room` reports no error in src/net.ts (errors in other files are other workers' in-progress edits; ignore them).

## Out of scope
config.ts, main.ts, audio.ts, stage.ts, lobby.ts, anything under packages/.
~~~~

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\music-room (a git worktree; run every command from here, never cd elsewhere).
Git Bash: if `node`/`npx` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
Dependencies are installed. Do not run npm install, vite build or a dev server. Do not git commit.
Three other workers are editing other files of games/music-room at the same time (audio.ts, net.ts, lobby.ts). Only edit the file named below.

## Goal
games/music-room/src/stage.ts draws the room: three instrument stations (Drums, Keyboard, Cowbell) with clickable pads labelled with their keys, who holds each instrument, and coloured flashes when anyone plays.

## Read first
- games/music-room/src/stage.ts: the stub; keep the Stage interface and createStage(parent) signature exactly. It already appends `<div id="mr-stage">` to parent: keep that id.
- games/music-room/src/config.ts: INSTRUMENTS, INSTRUMENT_NAMES, INSTRUMENT_KEYS, PADS (PadDef: code, label, name, black?), padForNote, OCTAVE_DOWN_CODE/OCTAVE_UP_CODE, Member, cssColor.
- games/music-room/index.html: page background #1b1420, text #f4ecdf; `#ui` is a full-height flex column. Do not restyle #ui.

## Change
- games/music-room/src/stage.ts: plain DOM + one injected `<style>` element (create it once, id 'mr-stage-style', appended to document.head). All class names prefixed `mr-`.
  - Layout: #mr-stage is `flex:1`, a responsive row of three station cards (`display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; padding:16px`), stacking to one column on phones. Each station card has a header, a "players" line and a pad area.
  - Header: instrument name (INSTRUMENT_NAMES) and a key hint like "press 1" (INSTRUMENT_KEYS: 'Digit1' -> '1'). The whole header is a <button>; click calls the onPick listeners with that instrument. Show a small emoji icon: drums 🥁, keys 🎹, cowbell 🔔.
  - setMine(i): the matching card gets class `mr-mine` (bright border, e.g. 3px solid #ffd54f, and a "you are playing this" tag); others lose it. Only my instrument's pads show their key-cap letters strongly; other cards dim theirs (opacity .45) since keys only play the selected instrument.
  - Pads: one <button class="mr-pad"> per PADS[i] entry, showing pad.label (key cap, bold) and pad.name (small). On `pointerdown` (call e.preventDefault()) call the onPad listeners with (i, padIndex).
    - Drums: a 4x2 grid of round-ish pads.
    - Keys: a piano: white keys (black falsy) in a row, black keys absolutely positioned over the gaps between white keys (narrower, darker). 8 white keys across the card width.
    - Cowbell: one big bell pad for pad 0 and three smaller pads below for the rest.
  - setOctave(o): the Keyboard card shows "Octave +1" style text (o > 0 shows +o) and a hint "Z / X".
  - setPlayers(players): each card's players line lists names of members whose instrument matches, each as a small chip coloured with cssColor(member.color), with " (you)" after the name when member.me. Empty -> "nobody yet".
  - flash(i, n, color, name): pad = padForNote(i, n); if PADS[i][pad] exists, set that pad's background/box-shadow to cssColor(color) and remove it after 140 ms (restart if flashed again: keep a timer per pad). Also add a scale(0.94) pressed look during the flash. Show `name` in a small floating label on the card for 600 ms (latest name wins). Drums and cowbell cards also do a short whole-card shake/pulse (CSS class with a 120 ms animation, re-triggered by removing the class, forcing reflow via `void el.offsetWidth`, then re-adding it).
  - Before any setPlayers call the cards still render fully (main.ts calls setMine/setOctave/setPlayers right after createStage).

## Contract
Keep exactly the exported `Stage` interface and `export function createStage(parent: HTMLElement): Stage` from the stub. Keep the root id `mr-stage`.
Do not listen for keyboard events (main.ts owns key input). Do not import audio.ts or net.ts.

## Done when
- `npx tsc --noEmit -p games/music-room` reports no error in src/stage.ts (errors in other files are other workers' in-progress edits; ignore them).

## Out of scope
config.ts, main.ts, audio.ts, net.ts, lobby.ts, index.html.
~~~~

~~~~text
Epic: 2 Systems
Depends on: none

## Environment
Working directory: C:\Users\cpsai\cstabnick\lawn-gnome-panic\.claude\worktrees\music-room (a git worktree; run every command from here, never cd elsewhere).
Git Bash: if `node`/`npx` is not found, run `export PATH="/c/Program Files/nodejs:$PATH"` first.
Dependencies are installed. Do not run npm install, vite build or a dev server. Do not git commit.
Three other workers are editing other files of games/music-room at the same time (audio.ts, net.ts, stage.ts). Only edit the file named below.

## Goal
games/music-room/src/lobby.ts is the top bar: title, player name, optional room code, Join / Leave buttons, the connection status and a one-line controls help.

## Read first
- games/music-room/src/lobby.ts: the stub; keep the Lobby interface and createLobby(parent) signature exactly. It already appends `<div id="mr-lobby">` to parent: keep that id.
- games/music-room/src/config.ts: NetState, NAME_KEY.
- packages/mp/src/textFilter.ts: `checkName(name)` returns `{ ok: true, name } | { ok: false, reason }` (check the exact return type there). Import it as `import { checkName } from '@lawn/mp/textFilter';`.
- packages/mp/src/protocol.ts: ROOM_CODE_RE (/^[A-Z0-9]{4,8}$/). Import as `import { ROOM_CODE_RE } from '@lawn/mp/protocol';`.

## Change
- games/music-room/src/lobby.ts: plain DOM + one injected `<style>` (id 'mr-lobby-style', appended to document.head once). Class names prefixed `mr-`. Page background is #1b1420, text #f4ecdf; use a slightly lighter bar (#2a2030), padding 12px 16px, flex-wrap so it works at phone width.
  - Contents, left to right: title "🎵 Music Room"; a name <input> (maxlength 16, placeholder "Your name", value loaded from localStorage NAME_KEY inside try/catch, default ''); a room code <input> (maxlength 8, placeholder "Room code (optional)", upper-cases itself on input and strips characters outside A-Z0-9); a "Join" button; a "Leave" button; a status <span>; then on its own full-width line a help text: "Pick an instrument with 1 2 3 (or click it). Drums: A S D F J K L, Space. Keyboard: A W S E D F T G Y H U J K, Z / X octave. Cowbell: Space F J B."
  - Join click: name = input value trimmed; c = checkName(name); if not ok show c.reason in the status span (red #ff8a8a) and stop. code = room input value; if code !== '' and !ROOM_CODE_RE.test(code), show "Room codes are 4-8 letters or digits." and stop. Save the cleaned name to localStorage NAME_KEY (try/catch). Call every onJoin listener with (code === '' ? null : code, cleaned name). Pressing Enter in either input does the same as clicking Join. After a successful Join click, blur the focused input (so key presses play instruments again).
  - Leave click: call every onLeave listener.
  - update(state, available):
    - available false: hide inputs and both buttons; status text = state.message.
    - status 'offline' or 'error': inputs and Join visible and enabled, Leave hidden. Status = state.message ('error' shown in #ff8a8a).
    - 'connecting': Join disabled, Leave visible. Status = state.message.
    - 'in-room': inputs disabled, Join hidden, Leave visible. Status = `${state.message} · ${state.players.length} playing` in #9be08a.
    - Always redraw everything from state on update (a validation message is replaced by the next update).

## Contract
Keep exactly the exported `Lobby` interface and `export function createLobby(parent: HTMLElement): Lobby` from the stub. Keep the root id `mr-lobby`.
Do not listen for global keyboard events (main.ts owns key input; it already ignores key presses whose target is an INPUT).

## Done when
- `npx tsc --noEmit -p games/music-room` reports no error in src/lobby.ts (errors in other files are other workers' in-progress edits; ignore them).

## Out of scope
config.ts, main.ts, audio.ts, net.ts, stage.ts, index.html, anything under packages/.
~~~~
