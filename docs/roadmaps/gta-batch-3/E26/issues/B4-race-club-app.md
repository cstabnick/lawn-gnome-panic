Epic: B (building) — E26 street racing
Depends on: epic A (RaceNet, save)
Agent: haiku-worker

(Paste `_env.md` here.)

## Goal
The "Race Club" Gnomlet app: the race-mode picker. It lists every registered track with its best time, starts a solo
time trial on any of them, and runs online lobbies (host, join, start, leave).

## Read first
- `games/gnome-theft-auto/src/streetRace/raceApp.ts` (stub: `RACE_APP_ID`, `RaceAppCtx`, `registerRaceClubApp`;
  keep them).
- `games/gnome-theft-auto/src/gnomlet/registry.ts`: `registerGnomletApp({ id, label, icon, group, order, detail,
  badge, open(root, ctx) })`, `GnomletCtx` (close, home, setTitle).
- `games/gnome-theft-auto/src/winter/winterApp.ts`: a full app in this style (cards, 44 px buttons, status line).
- `games/gnome-theft-auto/src/streetRace/types.ts`: `RaceSession.start(RaceModeStart)` returns null or a reason;
  `RaceNet` (online, lobbies, mine, host, join, leave, go, myId).
- `games/gnome-theft-auto/src/raceTrack/tracks.ts`: `TRACK_IDS`, `TRACKS[id].name`, `.closed`, `isStreetTrack`.

## Change (only `src/streetRace/raceApp.ts` and a new `src/streetRace/raceApp.test.ts`)
- Register `{ id: RACE_APP_ID, label: 'Race Club', icon: '🏁', group: 'fun', order: 20, detail: () => '<n> best
  times', badge: () => (open online lobbies count || null), open }`.
- Screen (scrollable column, `box-sizing: border-box`, width 100%):
  1. "Time trial": a card per track in TRACK_IDS order, street routes first then the rest: name, "Street" or "Track"
     tag, best time (m:ss.s or "—"), laps (closed: 2, open: 1), button "Time trial" →
     `ctx.session.start({ kind: 'trial', trackId, vehicle: ctx.drivingKind() ?? 'lowrider', laps })`; null → close
     the tablet, else show the reason in the status line. A line on top: "The Club drives you to the grid."
  2. "Online race" (only when `ctx.net()?.online()`, else a line "Online races need another player in your room."):
     when not in a lobby: a track picker (select element with all tracks, min-height 44 px) + "Host a race" →
     `net.host(trackId, laps, ctx.drivingKind() ?? 'lowrider')`; and the open lobbies list (host name, track name,
     members count) each with "Join" → `net.join(hostId)`. When in a lobby (`net.mine()`): track, members list,
     "Start" (host only, needs ≥ 2 members) → `net.go()` then `ctx.session.start({ kind: 'online', trackId, vehicle,
     laps })` and close; "Leave" → `net.leave()`. Joiners: when `net.started()` turns true while the app is open, start
     the session the same way. Re-render every 500 ms while open (setInterval cleared in the cleanup).
  3. A short footer: "Pickup races and wagers: see the bookies at the street-race meets (map: chequered flags)."
- If `ctx.session.active()`: show only "Racing now" + "Quit race" → `ctx.session.stop('quit')`.
- Test (node, fake DOM from `src/testing/fakeDom.ts` if needed, or test only pure helpers you export, e.g.
  `trackRows(store)` and `fmtTime(s)`): rows ordered street first; best times formatted.

## Done when
- `npx vitest run src/streetRace/raceApp.test.ts src/gnomlet/registry.test.ts` passes; `npx tsc --noEmit -p .` passes.

## Out of scope
session.ts, raceSync.ts, gnomlet registry, app.ts.
