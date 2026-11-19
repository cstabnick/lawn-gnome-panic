# Hidden tabs: online games keep running, solo games pause to their menu

Goal: switching tab (or app) no longer gets an online player dropped by the server. Browsers stop
`requestAnimationFrame` in a hidden tab and throttle plain timers (1 Hz, then once a minute after ~5 min in Chrome),
so games that relay from the frame loop went silent and were removed after `MATCH_SILENT_S` (8 s). Online games now
step their simulation and net sends from `whileHidden` (`@lawn/mp/background`, a Worker-driven timer). Single-player
games that already have a pause menu open it when the tab is hidden.

Foundation (done by the planner, not an issue): `packages/mp/src/background.ts` with `steadyInterval`, `whileHidden`,
`HIDDEN_MAX_DT`, `onTabHidden`; exported as `@lawn/mp/background` and from `@lawn/mp`; README section "Hidden tabs".

Out of scope: `resumable` reconnect for games other than gnome-golf (each needs its own catch-up logic). Phones
suspend JS entirely in the background, so this fixes desktop tab/app switching, not a locked phone.

| Epic | Done when | Issues |
| --- | --- | --- |
| 1. Wire every game | every touched game builds; smoke check passes | 10, all parallel |

Every issue shares this Environment and Contract (pasted into each issue below).

~~~~text
## Environment (shared)
Working directory: /Users/alex/cstabnick/lawn-gnome-panic/.claude/worktrees/bg-tab (a git worktree; run every command
from here; never cd to the main checkout). macOS; node and npm are on PATH. Other workers are editing OTHER games at
the same time: touch only the files listed under Change. Do not commit. Do not start dev servers.

## Contract (shared): @lawn/mp/background, already written, do not edit it
import { whileHidden, steadyInterval, onTabHidden } from '@lawn/mp/background';
- steadyInterval(fn: () => void, ms: number): () => void
    Like setInterval, but keeps its rate in a hidden tab (Worker timer). Returns stop().
- whileHidden(step: (dt: number) => void, hz = 15): () => void
    Calls step(dt) ~hz times a second ONLY while document.hidden. dt is seconds, already capped at 0.1 per call
    (late ticks are split into several calls). Never call renderer.render from it. Returns stop().
- onTabHidden(fn: () => void): () => void
    Calls fn when the tab becomes hidden. Returns remove().
Why: requestAnimationFrame stops in a hidden tab; the server drops a match member who relays nothing for 8 s.
A hidden HOST must keep simulating and sending snapshots, or the match freezes for everyone.
~~~~

## Epic 1

~~~~text
Issue 1.1: sample-3d (Lawn Gnome Panic)
Epic: 1 Wire every game. Depends on: none
[Environment + Contract (shared) pasted]
## Goal
Online, the match keeps running while the tab is hidden; solo, hiding the tab opens the pause menu.
## Read first
- games/sample-3d/src/main.ts: pauseGame() (~line 193); the visibilitychange handler with BACKGROUND_LEAVE_MS and
  hiddenAt (~lines 1150-1212); netTick (~1425); the renderer.setAnimationLoop body (~1510-1525).
## Change (only games/sample-3d/src/main.ts)
- Add after the setAnimationLoop call:
    let lastHiddenTickAt = 0;
    whileHidden((dt) => {
      lastHiddenTickAt = performance.now();
      if (online && !online.over && (phase === 'playing' || phase === 'levelup' || phase === 'paused')) tickRun(dt, NO_INPUT);
      watchConnection();
      if (online && !online.over) netTick(dt);
    });
- In the existing visibilitychange handler: when the tab becomes hidden and !online and phase === 'playing', call
  pauseGame(). Change the forced leave on return so it only fires when the background ticker did NOT keep us going:
  replace `performance.now() - hiddenAt > BACKGROUND_LEAVE_MS` with
  `performance.now() - Math.max(hiddenAt, lastHiddenTickAt) > BACKGROUND_LEAVE_MS` (lastHiddenTickAt must be declared
  above the handler, so put `let lastHiddenTickAt = 0;` next to `let hiddenAt = 0;` instead).
## Done when
- npx tsc --noEmit -p games/sample-3d passes.
## Out of scope
Every other file. Do not change pauseGame/resumeGame themselves.
~~~~

~~~~text
Issue 1.2: gnome-front
[Environment + Contract (shared) pasted]
## Goal
Online the conquest match keeps simulating and syncing while hidden; solo, hiding the tab shows the paused overlay.
## Read first
- games/gnome-front/src/main.ts: `running` (~117), the pointerlockchange handler (~163-169) that pauses, the frame()
  function (~189-213).
## Change (only games/gnome-front/src/main.ts)
- Extract from frame() a function `simulate(dt: number, withPlayer: boolean): void` holding the `if ((running ||
  online) && !game.over) { ... }` block plus `session.update(dt)`; `withPlayer` gates the touch.update()/player.update
  lines (frame passes `running`). frame() calls simulate(dt, running) then does the rest (onlinePanel, hud, audio,
  render, input.endFrame) unchanged.
- whileHidden((dt) => { if (netState.role !== 'solo' && lobby.status === 'in') simulate(dt, false); });
- onTabHidden(() => { if (running && !game.over && !autoplay && !(netState.role !== 'solo' && lobby.status === 'in')) {
  running = false; touch.setVisible(false); hud.setOverlay('paused'); } }) (same three lines as the pointerlock handler).
## Done when
- npx tsc --noEmit -p games/gnome-front passes.
~~~~

~~~~text
Issue 1.3: gnaft
[Environment + Contract (shared) pasted]
## Goal
Co-op raft keeps running (host sim + net systems) while the tab is hidden.
## Read first
- games/gnaft/src/main.ts: step() (~106-117), `systems`, `hostOnly`, state.netRole; games/gnaft/src/save.ts.
## Change (only games/gnaft/src/main.ts)
- Split step() into `tick(dt)` (tickWorld + the systems loop) and step() (time, tick, input.endFrame, render).
- whileHidden((dt) => { if (state.netRole && state.netRole !== 'solo' (check the real type of netRole and use the value
  that means "online") ) { tick(dt); input.endFrame(); } }) — no render. After a hidden spell the next rAF frame's dt is
  already capped at 0.05 by step(); also set `last = performance.now()` inside the hidden callback so it does not jump.
- Find the net heartbeat/send code (grep -rn "send(" games/gnaft/src/net*); if any heartbeat uses setInterval, switch it
  to steadyInterval with the same ms.
## Done when
- npx tsc --noEmit -p games/gnaft passes.
## Out of scope: solo play (no pause menu exists; leave it).
~~~~

~~~~text
Issue 1.4: gnome-golf
[Environment + Contract (shared) pasted]
## Goal
Online golf/disc rounds keep ticking while hidden; heartbeat survives Chrome's throttling.
## Read first
- games/gnome-golf/src/app.ts: step() (~112-120), tickRound, systems. games/gnome-golf/src/online.ts: heartbeat
  setInterval (~147), state.online, reconnect tryOnce (~380).
## Change
- games/gnome-golf/src/online.ts: replace the heartbeat `setInterval(..., NET.heartbeatS * 1000)` with
  steadyInterval(same fn, NET.heartbeatS * 1000). Leave the reconnect logic as it is.
- games/gnome-golf/src/app.ts: whileHidden((dt) => { if (!state.online) return; last = performance.now();
  tickRound(state, dt); for (const s of systems) s.update(dt); }) — no render. (Check the exact name of the online flag
  on state; online.ts uses `state.online`.)
## Done when
- npx tsc --noEmit -p games/gnome-golf passes; npm test -w games/gnome-golf passes if the game has src/minigames/.
~~~~

~~~~text
Issue 1.5: gnome-bowling
[Environment + Contract (shared) pasted]
## Goal
Online bowling keeps ticking and pinging while hidden.
## Read first
- games/gnome-bowling/src/app.ts: step() and the frame loop (~100-142). games/gnome-bowling/src/net.ts: pingAcc,
  `playing`, the visibilitychange handler (~174), and the returned update(dt).
## Change
- games/gnome-bowling/src/app.ts: split step() into the simulation part (everything before renderer.render) and the
  render/debug part. whileHidden((dt) => { if (<online match is running: use the same condition net.ts uses, e.g.
  state.net.status === 'playing' — check the real status values>) simulateOnly(dt); }), and keep the rAF dt from
  jumping after a hidden spell (reset the `last` timestamp in the hidden callback).
- games/gnome-bowling/src/net.ts: only if pings are sent from a setInterval, switch it to steadyInterval.
## Done when
- npx tsc --noEmit -p games/gnome-bowling passes; npm test -w games/gnome-bowling passes if src/minigames/ exists.
~~~~

~~~~text
Issue 1.6: mower-chain (Phaser 4)
[Environment + Contract (shared) pasted]
## Goal
Online arena keeps simulating/sending while hidden. Phaser pauses its own loop on hidden (Game.onHidden ->
loop.pause()), so drive the session from whileHidden instead of Phaser's update.
## Read first
- games/mower-chain/src/scenes/GameScene.ts: create() and update(); `this.session.update(delta)` takes MILLISECONDS.
- games/mower-chain/src/online.ts: the session interface (update(dtMs), drainEvents).
## Change (only GameScene.ts)
- In create(): const stopHidden = whileHidden((dt) => { this.session.update(dt * 1000); this.session.drainEvents(); });
  and call stopHidden() in the existing shutdown/destroy handler (the one that calls this.view.destroy()).
  Only do this for online sessions if the session exposes that (check online.ts); offline solo may stay paused.
## Done when
- npx tsc --noEmit -p games/mower-chain passes.
~~~~

~~~~text
Issue 1.7: gnome-party
[Environment + Contract (shared) pasted]
## Goal
The board party (and the running minigame) keeps updating while hidden, so the host keeps broadcasting.
## Read first
- games/gnome-party/src/main.ts: frame() (~276-296), net.update, flow.update, runner.
## Change (only games/gnome-party/src/main.ts)
- Extract `function tick(dt)` = everything in frame() except the renderer.render / boardView.render calls (keep the
  "read runner again after updating" comment and behaviour). frame() calls tick(dt) then renders.
- whileHidden((dt) => { last = performance.now(); tick(dt); });  (boardView.render(state, dt) also animates; leave it
  in frame only.)
## Done when
- npx tsc --noEmit -p games/gnome-party passes.
~~~~

~~~~text
Issue 1.8: gnomes-of-gnomomia
[Environment + Contract (shared) pasted]
## Goal
The player's MMO character keeps relaying while hidden (no server drop).
## Read first
- games/gnomes-of-gnomomia/src/main.ts: frame() (~103-136), updateMmo. games/gnomes-of-gnomomia/src/net/: find where
  the relay send happens and whether it uses a timer or the frame dt.
## Change
- games/gnomes-of-gnomomia/src/main.ts: whileHidden((dt) => { last = performance.now(); if (running) updateMmo(dt); }).
  Do not run combat/entities while hidden (solo world parts may freeze; only the net presence must continue).
- If a heartbeat in src/net uses setInterval, switch it to steadyInterval (same ms).
## Done when
- npx tsc --noEmit -p games/gnomes-of-gnomomia passes.
~~~~

~~~~text
Issue 1.9: gnome-blackjack and music-room (timer swaps)
[Environment + Contract (shared) pasted]
## Goal
Both already keep going in hidden tabs with setInterval; switch to Worker timers so Chrome's 5-minute intensive
throttling (1 tick/min) cannot trip the server's 8 s limit.
## Change
- games/gnome-blackjack/src/app.ts (~450): replace `setInterval(() => { if (document.hidden) step(false); }, 1000);`
  with `whileHidden(() => step(false), 4);` (step computes its own dt; keep it as is).
- games/gnome-blackjack/src/net.ts (~97): `setInterval(() => ping(false), 1000)` -> `steadyInterval(() => ping(false), 1000)`.
- games/music-room/src/net.ts (~95): the heartbeat `timer = setInterval(...)` -> steadyInterval; `timer` becomes the
  returned stop function, and stopHeartbeat() calls it instead of clearInterval (adjust the variable's type).
## Done when
- npx tsc --noEmit -p games/gnome-blackjack and -p games/music-room pass.
~~~~

~~~~text
Issue 1.10: paragnormal and tribute-schedule (solo: pause on tab hidden)
[Environment + Contract (shared) — only onTabHidden is used]
## Goal
Hiding the tab mid-run opens the existing pause menu.
## Read first
- games/paragnormal/src/main.ts: loop() (~57-80): the `input.consumePauseToggle()` branch that sets paused and calls
  hud.showPause(onResume, onRestart).
- games/tribute-schedule/src/main.ts: same pattern (~60-85).
## Change (each main.ts)
- Extract the "open pause" branch into `function openPause(): void` (paused = true; exitPointerLock; hud.showPause(...)
  with the same callbacks) and call it from the toggle branch.
- onTabHidden(() => { if (running && !paused && !ended) openPause(); });
- Add "@lawn/mp": "*" to that game's package.json dependencies only if it is not already importable; check how other
  games list it (grep '"@lawn/mp"' games/*/package.json) and match the version string.
## Done when
- npx tsc --noEmit -p games/paragnormal and -p games/tribute-schedule pass.
~~~~
