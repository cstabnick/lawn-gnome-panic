# Gnome Billiards

Eight-ball on the pool table in the Gnomecino, the Club Gnome casino, in 3D (three.js). Two gnomes lean on the ends of the table: yours, wearing your own gear, and Big Lou's. You play against Big Lou (the CPU), pass and play with a friend on one device, or find an online opponent (or join with a room code).

The question it answers: does a two-stroke cue (line up, then pull back and swipe through) feel like real skill on a phone?

## Run

```
npm install                            # once, from the repo root
npm run dev -w games/gnome-billiards   # http://localhost:5201 (also on your LAN, for a phone)
npm run build -w games/gnome-billiards
npm test -w games/gnome-billiards      # physics, rules, aim and whole CPU games
```

Online needs the shared server: `npm run dev -w packages/mp-server` (ws://localhost:8787/ws). See `packages/mp/README.md`. In the Club Gnome town the table is in the Gnomecino (`npm run dev -w games/club-gnome`, then walk to the pool table).

`#cpu` in the URL starts a match against Big Lou at once. `#mute` starts silent. M toggles sound. Esc opens the menu.

## Controls: two strokes per shot

1. **Line up.** Press on the table and drag. The cue's line follows your pointer (the shot leaves the cue ball away from the pointer). Let go to lock the line. The aim line shows through the cue ball to the first ball it hits.
2. **Strike.** Press anywhere and **pull back** along the line: the further you pull, the more power (the bar shows it). Then **swipe forward** through the ball and let go.
   - A swipe that is too short going forward (under about 4 cm of table) is a cancelled stroke; nothing happens.
   - A swipe that drifts sideways between the pull and the release bends the shot. The more it drifts, the further off line the ball goes (capped at about 11°). Keep it straight to pot.
   - A tap with no pull sends you back to lining up, so you can re-aim.

Placing the cue ball after a foul: drag it onto the cloth and let go (red ghost = not legal there).

| | Phone and mouse | Keyboard |
|---|---|---|
| Line up | Drag on the table, let go | Not needed: the drag is the control |
| Strike | Press, pull back, swipe through, let go | Same |
| Menu | ☰ Menu button | Esc |
| Sound | 🔊 button | M |

Everything is a pointer drag, so there is no key a phone cannot reach.

## Rules (what is and is not done)

- Racking: 15 object balls in a triangle, the 8 in the middle, the cue ball on the head string. The order is shuffled by a seed, so online players get the same rack.
- Groups: the first legal pot on an open table gives the shooter that group (solids 1-7, stripes 9-15).
- Fouls: the cue ball pocketed, no ball touched, the wrong group touched first, or the 8 touched first. The other player gets ball in hand.
- The turn continues after a clean pot of your own group. Pocketing an opponent's ball ends the turn.
- The 8: legal only after your group is cleared, and only without a foul. Pocketing it early, or fouling on it, loses. Pocketing your last ball and the 8 on the same shot also loses (a house rule, kept simple).
- Not done: the break re-spot (a pocketed 8 on the break loses here), the "must hit a rail after the break" rule, English and spin, and a foot-spot rule for ball in hand (the cue can go anywhere legal).

## 3D

- `scene.ts`: the room (a dark casino carpet), the table (wooden rails and legs, green cloth, rubber cushions broken at the pockets, six pockets, diamonds on the rails), balls with numbers and stripes drawn onto their own textures, rolling spin as they move, the cue stick, the aim line, and the two gnomes built with `@lawn/gnome`'s `createGnomeModel` from each player's look.
- The table is built in the game because its cloth has to match the physics exactly. The Gnomecino's `billiard-table` prefab is the same table as it stands in the town (see `packages/prefabs/src/catalog/casino.ts`).
- Table units map to the floor: the table is centred on the origin, its long side along x.

## Online

2 players: the public queue waits 10 s, a room code 20 s. No host: the shooter's browser plays each shot (the cue position and the strike go to the other browser), and then sends the settled table. The other browser runs the same physics for the animation and then takes the shooter's table as the truth, so a small difference never sticks. Nobody joins mid-game; if the other player leaves, you win by default.

The physics only uses `+ - * /` and `sqrt` on the simulated values (IEEE-exact in every browser), and the steps are fixed (1/240 s), never frame time. That keeps both browsers on the same path between syncs.

## The CPU

Big Lou looks for the cleanest straight cut with a clear path both ways into a pocket on one of its group (or the 8 when its group is clear), and takes a slightly off-line shot with a little pause first so you can see whose turn it is. It places the cue ball itself after a foul.

## Mobile

Phones use the whole screen: the camera fits the table and both gnomes to the screen's width or height, the seats sit along the top, and the message and the buttons sit at the bottom above the safe-area inset. Touch targets are 44 px. Pointer events everywhere (touch, mouse and pen alike), no hover-only UI.

## Achievements

Six in `packages/achievements/src/catalog.ts` (`billiards-*`): pot a ball, pot three on the break, scratch, beat Big Lou, win online, and finish five games.

## Code

`config.ts` (table units and tuning), `physics.ts` (pure table: sub-steps, collisions, pockets, placement), `rules.ts` (rack, groups, `judge`, `applyVerdict`), `aim.ts` (pure aim line: first ball touched and where), `cpu.ts` (Big Lou), `scene.ts` (three.js table, balls, cue, gnomes), `hud.ts` (DOM seats, message, power meter, menu, game over), `net.ts` (online over `@lawn/mp`), `achievements.ts`, `sfx.ts` (WebAudio clacks, no files), `app.ts` (the controller and the two-stroke input). Tests: `physics.test.ts`, `rules.test.ts`, `match.test.ts` (whole CPU games).

The player's gnome wears its look in the seats (`getMyGnome()`), and online opponents show with `resolveLook`.

## Not done yet

- Spin and English, the break re-spot, a shot clock, and a training mode.
- Music: the game plays only its sound effects (no `@lawn/music` theme yet).
- Gnome animation: the gnomes idle and lean on the rail; they do not play emotes.
- Party slice: none yet (see the backlog in `packages/party/README.md`).
