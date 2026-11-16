# Gnome Bowling: CPU bowlers, robot announcer, vintage alley cartoons

Goal: in `games/gnome-bowling`, add CPU (NPC) bowlers to local games, an over-the-top robot PA announcer with voice
effects and WebAudio stingers, and an expandable registry of vintage score-monitor cartoons (strikes, turkeys, spares, gutters).

Voice effects note: the browser's speech synthesis (the Microsoft robot voices on Windows) cannot be routed through
WebAudio, so neither WebAudio nor Tone.js can put effects on it. A SAM-style software voice (`sam-js`) would allow real
effects but its license is "see README" (a reverse-engineered commercial program), which fails the free-and-clear rule.
So the effects come from the speech itself (deep pitch, slow rate, stretched spellings, quieter echo repeats) plus
WebAudio stingers around it (air horn, organ, sad trombone, drum roll, PA thump).

## Shape

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written by the planner) | Build passes; `#cpu` plays a CPU-vs-CPU game; `#preview=bowled-over` shows the CRT cartoon | 0 (direct) |
| 2. Features | Build passes; smoke test passes; every cartoon previews without errors | 6, parallel |

Epic 1 added: `Player.npc`, NPC looks, `BallResult.cartoon/streak`, `ROUND.cartoonSeconds`, `CARTOON_CHANCE`, `NPC_TUNING`
(config.ts); CPU turns and cartoon picking (game.ts); `src/npc.ts` roster + stubs; `src/speech.ts` shared speech queue;
`src/announcer.ts` stub; audio.ts routed through speech.ts with `audioOut()`; `src/cartoons/` (types, crt helpers,
registry, example `bowled-over`, empty packs); the CRT monitor in celebrate.ts with `#preview=<id>&at=<s>`.

## Epic 2 issues

Each issue is one file, given verbatim to one `haiku-worker`. All six run in parallel; each owns different files.

| Issue | Owns | File |
|---|---|---|
| 2A CPU bowler AI and quips | `src/npc.ts`, `src/npc.test.ts` | [2A-npc-ai.md](bowling-npcs-announcer/2A-npc-ai.md) |
| 2B Menu: CPU seats, announcer toggle | `src/menu.ts` | [2B-menu-cpu-seats.md](bowling-npcs-announcer/2B-menu-cpu-seats.md) |
| 2C Announcer | `src/announcer.ts` | [2C-announcer.md](bowling-npcs-announcer/2C-announcer.md) |
| 2D Strike cartoons | `src/cartoons/strike.ts` | [2D-strike-cartoons.md](bowling-npcs-announcer/2D-strike-cartoons.md) |
| 2E Turkey cartoons | `src/cartoons/turkey.ts` | [2E-turkey-cartoons.md](bowling-npcs-announcer/2E-turkey-cartoons.md) |
| 2F Spare and gutter cartoons | `src/cartoons/spare.ts`, `src/cartoons/gutter.ts` | [2F-spare-gutter-cartoons.md](bowling-npcs-announcer/2F-spare-gutter-cartoons.md) |

Shared check resources: one dev server on port 5291 started by the planner (workers only read from it);
screenshots go to distinct `<issue>-*.png` names.
