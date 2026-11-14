# Roadmap: gnome-golf

Goal: 3D island golf with gnomes, playable on a phone. PGA-style controls (drag to aim, club select, three-tap power/accuracy meter), a range estimate for every club, a riding-mower golf cart parked with the party beside every shot, and a living background: gnome foursomes on other holes, gulls, and the Gnaft castaway drifting past on his raft. Single player for now; multiplayer later.

| Epic | Done when | Issues |
|---|---|---|
| 1. Foundation (written directly) | `config.ts` (types, clubs, lies, 9 holes, tuning), `course.ts` (height and lie functions), `physics.ts` (calibrated flight/bounce/roll, range estimates), `round.ts` (phase machine, scoring, party spots, mower pose), `main.ts`, copied gnome/mower models, stubs for every system; game builds | 0 |
| 2. Systems | world, ball + aim preview, camera, party + cart, ambient life, controls + swing meter, HUD, minimap, audio; game builds and a headless browser run plays a hole without console errors | 9 |

Epic 2 issues are `docs/roadmaps/gnome-golf/epic2-*.md`; each worker gets `_common.md` (environment, UI rules, world conventions) plus its issue.
