# Gnome Billiards

Eight-ball on the pool table in the Gnomecino, the Club Gnome casino. Drag back from the cue ball to shoot: the further you pull, the harder it hits. Play Big Lou (the CPU), pass and play with a friend on one device, or find an online opponent (or join a room code). The rules are real eight-ball: break the rack, take solids or stripes on your first pot, clear your group, then sink the 8. Scratch or hit the wrong ball first and you give the other player ball in hand.

The question it answers: does a drag-back-to-shoot cue feel right on a phone, and is eight-ball worth the online effort for two?

## Run

```
npm install                            # once, from the repo root
npm run dev -w games/gnome-billiards   # http://localhost:5201 (also on your LAN, for a phone)
npm run build -w games/gnome-billiards
npm test -w games/gnome-billiards      # physics and rules tests
```

Online needs the shared server: `npm run dev -w packages/mp-server` (ws://localhost:8787/ws). See `packages/mp/README.md`. In the Club Gnome town the table is in the Gnomecino (`npm run dev -w games/club-gnome`, then walk to the pool table).

`#mute` in the URL starts silent. M toggles sound. Esc opens the menu.

## Controls

| | Phone and mouse | Keyboard |
|---|---|---|
| Shoot | Press on the table and drag back from the cue ball; release to shoot. Pull further for more power (the bar shows it). | Not needed: the drag is the whole control |
| Place the cue ball (after a foul) | Drag it onto the cloth; release to place. Red ghost = not legal there. | Same |
| Menu | ☰ Menu button | Esc |
| Sound | 🔊 button | M |

Everything is a pointer drag, so there is no key a phone cannot reach.

## Rules (what is and is not done)

- Racking: 15 object balls in a triangle, the 8 in the middle, the cue ball on the head string. The order is shuffled by a seed, so online players get the same rack.
- Groups: the first legal pot on an open table gives the shooter that group (solids 1-7, stripes 9-15).
- Fouls: the cue ball pocketed, no ball touched, the wrong group touched first, or the 8 touched first. The other player gets ball in hand.
- The turn continues after a clean pot of your own group. Pocketing an opponent's ball ends the turn.
- The 8: legal only after your group is cleared, and only if you did not foul. Pocketing it early, or fouling on it, loses. Pocketing your last ball and the 8 on the same shot also loses (a house rule, kept simple).
- Not done: the break re-spot (a pocketed 8 on the break loses here), the "must hit a rail after the break" rule, English and spin, and a foot-spot rule for ball in hand (the cue can go anywhere legal).

## Online

2 players: the public queue waits 10 s, a room code 20 s. No host: the shooter's browser plays each shot (the cue position and the strike go to the other browser), and then sends the settled table. The other browser runs the same physics for the animation and then takes the shooter's table as the truth, so a small difference never sticks. Nobody joins mid-game; if the other player leaves, you win by default.

The physics only uses `+ - * /` and `sqrt` on the simulated values (IEEE-exact in every browser), and the steps are fixed (1/240 s), never frame time. That keeps both browsers on the same path between syncs.

## The CPU

Big Lou looks for the cleanest straight cut with a clear path both ways into a pocket on one of its group (or the 8 when its group is clear), and takes a slightly off-line shot with a little pause first so you can see whose turn it is. It places the cue ball itself after a foul.

## Mobile

Phones use the whole screen: the table turns on its side in portrait, the seats sit along the top, and the message and the buttons sit at the bottom above the safe-area inset. Touch targets are 44 px. Pointer events everywhere, no hover-only UI.

## Achievements

Six in `packages/achievements/src/catalog.ts` (`billiards-*`): pot a ball, pot three on the break, scratch, beat Big Lou, win online, and finish five games.

## Code

`config.ts` (table units and tuning), `physics.ts` (pure table: sub-steps, collisions, pockets, placement), `rules.ts` (rack, groups, `judge`, `applyVerdict`), `cpu.ts` (Big Lou), `render.ts` (canvas drawing and the view that fits the table on a phone), `hud.ts` (DOM seats, message, menu, game over), `net.ts` (online over `@lawn/mp`), `achievements.ts`, `sfx.ts` (WebAudio clacks, no files), `app.ts` (the controller). Tests: `physics.test.ts` (collisions, pockets, determinism, placement) and `rules.test.ts` (racking and every foul and win case).

The table, balls and cue are drawn in canvas, because they are game pieces; the pool table in the Gnomecino is the `billiard-table` prefab (`packages/prefabs/src/catalog/casino.ts`).

The player's gnome is wearing its look in the seats (`@lawn/gnome`, `getMyGnome()`), and online opponents show with `resolveLook`.

## Not done yet

- Spin and English, the break re-spot, a shot clock, and a training mode.
- Music: the game plays only its sound effects (no `@lawn/music` theme yet).
- Party slice: none yet (see the backlog in `packages/party/README.md`).
