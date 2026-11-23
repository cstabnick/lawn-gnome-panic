# GTA: parties

Goal ("gta - add parties. just let people group up"): players in the same online Gnome Theft Auto town form a party
(invite a player, or join by a 4-letter code), see party members on the map (green, leader starred), chat and ping
inside the party, and hop to a member's side on foot.

Design: GTA online has no host; every player relays their own state through `@lawn/mp`. A party is a shared code each
member broadcasts (`{ k: 'pty', d: { o: 'code', c } }`, resent to each joiner). Everyone showing the same code is in the
same party; the lowest player id among them leads. Invites, chat and pings are relayed point to point. The server only
relays; nothing new on it. Chat is tidied and censored on receive (`@lawn/mp/textFilter`).

Foundation (written by the planner, verbatim, before epic 1):

- `src/party/protocol.ts`: `PartyMsg`, `parsePartyMsg`, `newPartyCode`, `normaliseCode`, `cleanChat`, `PARTY_MAX`.
- `src/net.ts` (additive): `GtaMsg` gains `{ k: 'pty'; d: PartyMsg }`, `NetEvents.onParty?`, `GtaNet.sendParty(to, d)`.
- `src/party/index.ts`: `createParty(deps)`, the glue (book + panel + net + map blips + toasts).
- Stubs: `src/party/state.ts` (`createPartyBook`), `src/party/panel.ts` (`createPartyPanel`).

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Book and panel | state.test.ts passes, tsc clean for src/party | 2 (parallel) |
| 2. Wiring (planner) | app.ts creates the party, map blips use it, remotes.blips carries ids | planner |

Not done (doesn't fit easily): shared mission credit, leader-follow waypoints, party voice.

## Epic 1
### 1A: party book (src/party/state.ts)

~~~~text
Epic: 1 (GTA parties: book and panel)
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other agents are editing OTHER files in this same worktree at the same time. Do NOT commit, push, stash, switch branches,
run `npm install`, run `vite build` or start a dev server. Touch only the files listed under Change.
This worktree may have no node_modules. If `node_modules` is missing at the repo root, type-check with
  node ../dovekie/node_modules/typescript/bin/tsc --noEmit -p games/gnome-theft-auto 2>&1 | grep "src/party/"
and ignore "Cannot find module" (TS2307) errors and errors they cause; every other error in src/party/state*.ts must be fixed.
If node_modules exists, use `npx tsc --noEmit -p games/gnome-theft-auto` and `npm test -w games/gnome-theft-auto -- src/party/state.test.ts`.

## Goal
Replace the stub in games/gnome-theft-auto/src/party/state.ts with the real "party book": pure data (no DOM, no
network, no timers) tracking which online player is in which party, who leads, and pending invites. Add a vitest file.

## Background
Online GTA has no host. A party is a 4-letter code. Each player broadcasts the code of the party they are in ('' = none).
Every player showing the same code as me is in my party. The leader is the lowest player id among the members, me
included. Another module (src/party/index.ts, already written, do not edit) calls the book; you only implement it.

## Read first
- games/gnome-theft-auto/src/party/state.ts: the stub. Its exported names, interfaces and doc comments ARE the contract.
- games/gnome-theft-auto/src/party/protocol.ts: PARTY_MAX (8), newPartyCode(rand), PARTY_CODE_RE. Do not edit.
- games/gnome-theft-auto/src/atmosphere.test.ts (first 20 lines only): how tests import vitest here (`import { describe, expect, it } from 'vitest';`).

## Change
- games/gnome-theft-auto/src/party/state.ts: implement createPartyBook() keeping every exported name and signature exactly
  (INVITE_TTL_MS, PartyMember, PartyInvite, PartyBook, createPartyBook). Remove the "STUB" wording from the top comment.
  Internal state: `myId: number|null`, `myName: string`, `code: string|null`,
  `peers: Map<number, { name: string; code: string }>` (code '' = none), `invites: Map<number, PartyInvite>`.
  Rules, method by method:
  - setMe(id, name): store both.
  - peerJoin(id, name): add with code '' if not present (if present, update name only). Never add my own id.
  - peerLeave(id): delete the peer and their invite.
  - peerCode(id, code): set the peer's code if the peer is known; ignore otherwise.
  - reset(): clear peers and invites; keep code, myId, myName.
  - create(rand?): if code is null, code = newPartyCode(rand). Return code.
  - join(c): if c === code return true. If sizeOf(c) >= PARTY_MAX return false (no change). Else code = c; delete any
    invite whose code is c; return true.
  - leave(): code = null.
  - addInvite(from, c, now): ignore if from is not a known peer or c === code. Else invites.set(from, { from, name: peer name, code: c, at: now }).
  - takeInvite(from): remove and return it, or null.
  - invites(now): first delete every invite with now - at > INVITE_TTL_MS, then return the rest sorted by `at` ascending.
  - members(): [] when code is null. Else every peer whose code === code as { id, name, leader, me: false }, plus me as
    { id: myId, name: myName, me: true } when myId !== null; sorted by id ascending; leader is true only for the member whose
    id === leaderId().
  - isMember(id): code !== null && id !== myId && peers.get(id)?.code === code.
  - leaderId(): null when code is null or myId is null; else the minimum of myId and the ids of peers with my code.
  - sizeOf(c): count of peers with code c, +1 when c === code (and code is not null).
  - others(): peers whose code !== code (or all peers when code is null), as { id, name }, sorted by id.
  - nameOf(id): peer name or null.
- games/gnome-theft-auto/src/party/state.test.ts (new): vitest tests covering at least: create gives a valid code and is
  idempotent; two peers with my code are members and the lowest id leads (me or a peer); a peer with another code is in
  others(), not members(); join returns false when 8 already hold the code; invites ignore unknown senders and my own code,
  expire after INVITE_TTL_MS, and are removed by takeInvite; join(c) removes an invite for c; peerLeave removes membership;
  reset keeps my code but forgets peers; leave empties members() and leaderId().

## Contract
Keep the exported signatures of src/party/state.ts exactly as in the stub (other files compile against them now).

## Done when
- The type-check command from Environment shows no errors in src/party/state.ts or src/party/state.test.ts (other than TS2307 when node_modules is missing).
- If node_modules exists: `npm test -w games/gnome-theft-auto -- src/party/state.test.ts` passes.

## Out of scope
Do not edit any other file: not src/party/protocol.ts, index.ts, panel.ts, net.ts, app.ts.
~~~~

### 1B: Party button and panel (src/party/panel.ts)

~~~~text
Epic: 1 (GTA parties: book and panel)
Depends on: none

## Environment
Working directory: C:\Users\cpsai\orca\workspaces\lawn-gnome-panic\elkhorn (Windows, Git Bash). Game: games/gnome-theft-auto.
If node is not found: export PATH="/c/Program Files/nodejs:$PATH".
Other agents are editing OTHER files in this same worktree at the same time. Do NOT commit, push, stash, switch branches,
run `npm install`, run `vite build` or start a dev server. Touch only the file listed under Change.
This worktree may have no node_modules. If `node_modules` is missing at the repo root, type-check with
  node ../dovekie/node_modules/typescript/bin/tsc --noEmit -p games/gnome-theft-auto 2>&1 | grep "src/party/"
and ignore "Cannot find module" (TS2307) errors and errors they cause; every other error in src/party/panel.ts must be fixed.
If node_modules exists, use `npx tsc --noEmit -p games/gnome-theft-auto`.
Repo rules that apply: UI modules get the shared `#ui` element as a parent: append your own container to it, never
restyle or hide `#ui` itself. Mobile by default: every button at least 44x44 px, no hover-only UI, fits a 390x844
portrait and a 844x390 landscape phone, safe-area insets respected.

## Goal
Replace the stub in games/gnome-theft-auto/src/party/panel.ts with the real Party button and panel for Gnome Theft Auto
online: plain DOM (no framework), no game state of its own. It shows the view it is given and calls the actions.

## Read first
- games/gnome-theft-auto/src/party/panel.ts: the stub. Its exported names, interfaces and doc comments ARE the contract.
- games/gnome-theft-auto/src/taxi.ts: lines ~175-200 only (search for `#gta-taxi-btn`), the style of a small round HUD
  button injected with a <style> element, for the look (dark translucent, white 2px border).

## Change
- games/gnome-theft-auto/src/party/panel.ts: implement createPartyPanel(ui, actions), keeping every exported name and
  signature exactly (PartyPanelView, PartyPanelActions, PartyPanel, createPartyPanel). Remove "STUB" from the top comment.
  Build:
  - One <style> element appended to document.head once (id `gta-party-style`; skip if already present). All selectors
    start with `#gta-party`.
  - A root `<div id="gta-party">` appended to `ui`, with `pointer-events:none` on the root and `pointer-events:auto` on
    the button and the panel, so it never blocks the game elsewhere.
  - The button: `<button type="button" class="gta-party-btn" aria-label="Party">`, text "👥", 44x44 circle, position:fixed;
    right:calc(env(safe-area-inset-right) + max(18px,4vw)); top:calc(env(safe-area-inset-top) + max(18px,4vw) + var(--gta-map,128px) + 146px);
    z-index:30; touch-action:manipulation. A badge (small red pill, top-right corner of the button) shows setBadge(n)'s n; hidden at 0.
    Clicking it calls toggle().
  - The panel: position:fixed, z-index:31, dark (rgba(16,18,22,.94)), white text, 14px system-ui, border-radius 12px,
    padding 12px, overflow-y:auto. Desktop: right:calc(env(safe-area-inset-right) + 70px); top:calc(env(safe-area-inset-top) + 18px);
    width:320px; max-height:calc(100vh - 36px). At `@media (max-width:600px)`: left:16px; right:16px; width:auto;
    top:calc(env(safe-area-inset-top) + 16px); max-height:70vh. Hidden unless open (`display:none` / a class).
  - Panel content, re-rendered by render(v) (rebuild innerHTML-free with createElement + textContent; never put names or
    chat text into innerHTML: they come from other players):
    1. Header row: title "Party" and a close button "✕" (44x44) that calls toggle(false).
    2. If v.invites is not empty: a section "Invites", one row per invite: "<name> · <code>" with buttons "Join" -> actions.accept(from) and "No" -> actions.decline(from).
    3. If v.code is null: a "Start a party" button -> actions.create(); and a join row: <input type="text" maxlength="4"
       placeholder="CODE" autocapitalize="characters" autocomplete="off"> with a "Join" button -> actions.join(input.value)
       (Enter in the input does the same).
       If v.code is set: "Party code: <code>" (big, letter-spaced) and buttons "📍 Ping" -> actions.ping() and "Leave" -> actions.leave().
       Then the member list: one row per v.members entry: "★ " before the leader's name, "(you)" after mine, the distance
       as e.g. "120 m" when dist is not null, and a "Go" button -> actions.warp(id) on every row that is not me.
    4. A section "Online" listing v.others: name and an "Invite" button -> actions.invite(id). If empty: "No other gnomes online." in a muted line.
    5. If v.code is set: a chat log (max-height 140px, scrolls, newest at the bottom; scroll it to the bottom after render)
       with "<name>: <text>" lines (mine in a different colour, e.g. #ffd23f for the name), and a row with
       <input type="text" maxlength="120" placeholder="Say something"> and a "Send" button -> actions.say(input.value),
       then clear the input (Enter does the same).
  - Every button is at least 44px tall (min-height:44px; min-width:44px), padding 0 12px, border-radius 22px,
    border 2px solid rgba(255,255,255,.7), background rgba(40,40,40,.8), color #fff, font 700 13px system-ui.
    Inputs are 44px tall, font-size 16px (stops iOS zoom).
  - Keyboard: the game's input listens to `keydown`/`keyup` on `window`. On both text inputs, add keydown and keyup listeners that
    call e.stopPropagation() so typing (space, letters) does not drive the gnome. Enter handling goes in that keydown listener.
  - render(v): compute `const key = JSON.stringify(v)`; if it equals the last key, return. Otherwise rebuild the panel body,
    but DO NOT destroy the two <input> elements: create them once in createPartyPanel and re-append the same elements on
    each rebuild, so typed text and focus survive (if one had focus before the rebuild, call .focus() on it after).
  - setBadge(n), get isOpen, toggle(open?) (no argument flips), setVisible(v) (v false: hide the button and the panel by
    setting the root's style.display = 'none'; true: ''. Hiding does not change isOpen).

## Contract
Keep the exported signatures of src/party/panel.ts exactly as in the stub (src/party/index.ts compiles against them now).

## Done when
- The type-check command from Environment shows no errors in src/party/panel.ts (other than TS2307 when node_modules is missing).
- Reading the code: all buttons and inputs are >= 44px tall; no player text goes through innerHTML; the inputs stop key propagation.

## Out of scope
Do not edit any other file: not src/party/state.ts, index.ts, protocol.ts, hud.ts, app.ts. No tests needed for this file.
~~~~

## Epic 2 (planner)

app.ts: createParty after createNet, net events onPeerJoin/onPeerLeave/onPeerPose/onParty/onReset forward to it, party.update in the frame loop, party.blips() on the map; remotes.blips() gains `id` so party members are drawn green instead of cyan.
