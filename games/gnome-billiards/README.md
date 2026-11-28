# Gnome Billiards

Pool on the Gnomecino table in 3D (three.js): **8-Ball**, **9-Ball**, **Straight Pool**, **6-Ball Blitz**, and **Challenge Mode** (8 handcrafted trick-shot & run-out puzzles). Two gnomes walk round the table: yours, wearing your own gear, and your opponent's. Play four CPU tiers (Burdock, Big Lou, Velvet Vesper, and **The Chalk Phantom**), wager up to 50% of your `@lawn/oakcount` chips, pass and play with a friend on one device, find an online opponent (8-ball), or spectate two CPU gnomes with live `@lawn/mutter` table talk.

The question it answers: does a two-stroke cue (line up, then pull back and swipe through) feel like real skill on a phone?

## Run

```
npm install                            # once, from the repo root
npm run dev -w games/gnome-billiards   # http://localhost:5201 (also on your LAN, for a phone)
npm run build -w games/gnome-billiards
npm test -w games/gnome-billiards      # physics, rules, aim, walking and whole CPU games
```

Online needs the shared server: `npm run dev -w packages/mp-server` (ws://localhost:8787/ws). See `packages/mp/README.md`. In the Club Gnome town the table is in the Gnomecino (`npm run dev -w games/club-gnome`, then walk to the pool table).

URL: `#cpu` starts a match against Big Lou at once; `#spectate` watches two CPUs; `#mute` starts silent. M toggles sound. Esc opens the menu.

## Controls

**Walking.** Tap the floor (anywhere outside the table) to walk your gnome there. Gnomes route round the rails and keep clear of them. In pass and play, the gnome that walks and emotes is the one whose shot it is.

**A shot takes two strokes, both on the table:**

1. **Line up.** Press on the table and drag. The cue's line follows the pointer (the shot leaves the cue ball away from the pointer). Let go to lock the line.
   - **Fine Aim:** Toggle **🎯 Fine** (or hold **Shift** / press **F**) for 5.5× finer drag sensitivity and an extended target projection line. Use **◀ / ▶** (or **ArrowLeft / ArrowRight / A / D**) to micro-nudge by 0.2°.
2. **Strike.** Press, pull back along the line (further pull = more power, shown on a bar), then swipe forward through the ball and let go.
   - A forward swipe shorter than about 4 cm of table is a cancelled stroke: nothing happens.
   - A sideways drift between the pull and the release bends the shot, up to about 11°. Keep it straight to pot.
   - A tap with no pull sends you back to lining up, so you can re-aim.
   - The pull stops where the cue has room: the stick never passes through a rail or a ball behind it, so a shot from near a cushion is weaker.

Placing the cue ball after a foul: drag it onto the cloth and let go (red ghost = not legal there).

**Emotes.** The 😀 button in the bottom bar opens the emote row (your equipped emotes from `@lawn/emotes`, as in Club Gnome). Picking one plays it on your gnome and closes the row; keys 1-4 play them on desktop. Walking cancels an emote. Online, the emote is sent to the other player.

**Camera.** The bottom button cycles the view:
- **Follow** (default in a match): third person, from behind your gnome, looking across the table.
- **Table**: a fixed view of the whole table and both gnomes.
- **Orbit** (spectating only): the camera circles the table.

| | Phone and mouse | Keyboard |
|---|---|---|
| Walk | Tap the floor | Not needed: the tap is the control |
| Line up | Drag on the table, let go | Same |
| Strike | Press, pull back, swipe through, let go | Same |
| Emote | 😀 button, then an emote | Keys 1-4 play the equipped emotes |
| Camera | Camera button | Not bound |
| Menu | ☰ Menu button | Esc |
| Sound | 🔊 button | M |

## Spectating

**Watch Big Lou vs Gnome Two** from the menu. Both gnomes are CPUs: they wander, walk to their end of the table for each shot, and play. The orbit camera circles the table; the camera button also gives the table and follow views. The bottom bar and the message line say you are spectating.

Online spectating is not in: the matchmaking server (`@lawn/mp`) has no spectator role yet.

## Rules (what is and is not done)

- Racking: 15 object balls in a triangle, the 8 in the middle, the cue ball on the head string. The order is shuffled by a seed, so online players get the same rack.
- Groups: the first legal pot on an open table gives the shooter that group (solids 1-7, stripes 9-15).
- Fouls: the cue ball pocketed, no ball touched, the wrong group touched first, or the 8 touched first. The other player gets ball in hand.
- The turn continues after a clean pot of your own group. Pocketing an opponent's ball ends the turn.
- The 8: legal only after your group is cleared, and only without a foul. Pocketing it early, or fouling on it, loses. Pocketing your last ball and the 8 on the same shot also loses (a house rule, kept simple).
- Not done: the break re-spot (a pocketed 8 on the break loses here), the "must hit a rail after the break" rule, English and spin, and a foot-spot rule for ball in hand (the cue can go anywhere legal).

## 3D

- `scene.ts`: the room (a dark casino carpet), the table (wooden rails and legs, green cloth, rubber cushions broken at the pockets, six pockets, diamonds on the rails), balls with numbers and stripes drawn onto their own textures, rolling spin, the cue stick (clamped to its room) and the aim line, the gnomes (`createGnomeModel`, their own looks and gear, emote players), and the three camera modes.
- `gnomes.ts`: the walking. Floor geometry (the forbidden box round the rails, the walkable floor), path routing round its corners, and path-following walkers. Pure, and tested.
- `aim.ts`: pure aim geometry: the first ball the cue touches, and how far the cue stick has room behind it.
- The table is built in the game because its cloth has to match the physics exactly. The Gnomecino's `billiard-table` prefab is the same table as it stands in the town (see `packages/prefabs/src/catalog/casino.ts`).

## Online

2 players: the public queue waits 10 s, a room code 20 s. No host: the shooter's browser plays each shot (the cue position and the strike go to the other browser), and then sends the settled table. The other browser runs the same physics for the animation and then takes the shooter's table as the truth, so a small difference never sticks. Nobody joins mid-game; if the other player leaves, you win by default.

Your gnome's place goes to the other player a few times a second while it walks (`pose`), and the other player's gnome eases toward it. Emotes are sent by id only (validated on arrival with `isEmoteId`).

The physics only uses `+ - * /` and `sqrt` on the simulated values (IEEE-exact in every browser), and the steps are fixed (1/240 s), never frame time. That keeps both browsers on the same path between syncs.

## The CPU

Big Lou looks for the cleanest straight cut with a clear path both ways into a pocket on one of its group (or the 8 when its group is clear), and takes a slightly off-line shot. It walks to its end of the table, pauses so you can see whose turn it is, and places the cue ball itself after a foul. Between shots it wanders about the room.

## Mobile

Phones use the whole screen: the table camera fits the table and both gnomes to the screen, the follow camera stands behind your gnome, the seats sit along the top, and the emote row, message line and buttons sit at the bottom above the safe-area inset. Touch targets are 44 px. Pointer events everywhere (touch, mouse and pen alike), no hover-only UI.

## Achievements

Six in `packages/achievements/src/catalog.ts` (`billiards-*`): pot a ball, pot three on the break, scratch, beat Big Lou, win online, and finish five games. Spectated games count for nothing.

## Code

`config.ts` (table units and tuning), `physics.ts` (pure table: sub-steps, collisions, pockets, placement), `rules.ts` (rack, groups, `judge`, `applyVerdict`), `aim.ts` (aim line and cue room), `gnomes.ts` (walking), `cpu.ts` (Big Lou), `scene.ts` (three.js table, balls, cue, gnomes, camera), `hud.ts` (DOM seats, message, emote row, camera button, power meter, menu, game over), `net.ts` (online over `@lawn/mp`), `achievements.ts`, `sfx.ts` (WebAudio clacks, no files), `app.ts` (the controller: turns, input, the CPU, online sync). Tests: `physics.test.ts`, `rules.test.ts`, `aim.test.ts`, `gnomes.test.ts`, `match.test.ts` (whole CPU games).

The player's gnome wears its look (`getMyGnome()`); online opponents show with `resolveLook`.

## Not done yet

- Spin and English, the break re-spot, a shot clock, and a training mode.
- Online spectating (the matchmaking server has no spectator role).
- Music: the game plays only its sound effects (no `@lawn/music` theme yet).
- Keyboard walking (the tap is the control; keys could be added).
- Party slice: none yet (see the backlog in `packages/party/README.md`).
