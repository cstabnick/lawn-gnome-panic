# Gnome Golf

3D golf on a little island, played by gnomes. A fairly pure golf game: 9 holes, real club ranges, wind, lies, water penalties. Works on a phone.

The question it answers: is a classic three-tap swing meter with honest club ranges fun on a phone screen?

## Run

```
npm install            # once, from the repo root
npm run dev -w games/gnome-golf    # http://localhost:5184 (also on your LAN, for a phone)
npm run build -w games/gnome-golf
```

Debug: `#hole=5` in the URL starts on hole 5. `#disc` starts in Gnome Disc mode (`#disc&hole=5` works too). `#putt=6` puts the ball 6 yd short of the pin. `window.golf` is the game state.

## Controls

| | Phone | Keyboard |
|---|---|---|
| Aim | drag the view left/right | ← → (Shift = fine) |
| Club | ◀ ▶, or tap the club for the whole bag with ranges | ↑ ↓ |
| Swing | tap SWING three times: start, power, accuracy | Space ×3 |
| View | TOP/BACK button, or tap the minimap | V |
| Light a cigarillo | 🚬 button | C |
| Golf water | 🍺 button | B |
| Music on/off | ♪ button | N |

The swing meter: the marker rises; tap to set power (past the red line is an overswing: more distance, less control). It falls back; tap on the accuracy line. Early pulls/hooks left, late pushes/slices right. Rough and sand make mishits worse and shots shorter.

Consumables: 3 cigarillos per round. A lit one hangs in your gnome's mouth for 3 shots and slows the swing meter to 60% speed, so timing is easier. 6 cans of golf water (it's beer): no effect at all, but your partner joins you for a sip.

Every club's range is shown in the club selector, the bag list, the landing ring on the course and the minimap. Ranges are calibrated from the same physics the ball uses: a perfect full swing on flat ground with no wind carries exactly what it says.

## Gnome Disc mode

Pick **GNOME DISC** on the title screen (or open `#disc`). Same island, same 9 holes and pars, but there are no clubs and no ball. Disco, a living frisbee with googly eyes and noodle arms, grabs your gnome by the boots and whirls him round hammer-throw style. The gnome flies flat and spinning like a disc toward a chain basket at the pin.

| | Phone | Keyboard |
|---|---|---|
| Aim | drag the view | ← → |
| Tilt (hyzer bends left, anhyzer bends right) | ↶ ↷ buttons | Q / E or ↑ ↓ |
| Throw | hold WHIRL, let go | hold Space, let go |
| Flail mid-air (2 per throw) | tap FLAIL | Space or F |

- **Whirl:** the longer you hold, the harder the throw (the ring fills; full at 2 s, a bit more past that). The gnome orbits Disco faster as power builds, so a long throw is harder to time. Let go when the gnome dot on the dial is in the green wedge. Early sends it right, late sends it left. Hold too long (about 3 s) and Disco gets dizzy and lets go on his own, in a random direction.
- **Flight:** lift comes from spin and speed. A flat throw goes straight, then fades left at the end. Tilt banks the gnome so it bends. Wind pushes it. The orange dotted path shows a perfect release with no wind at the current power.
- **Flail:** while the gnome is still in the air, tap to make him flap. He gets a little height and spin back but loses a little speed, so it stretches a throw that is dying.
- **Basket:** the gnome has to reach the chains, 0.25 to 1.65 yd off the ground within 0.85 yd of the pole. Too fast (a full-power drive) and he chains out and bounces back. Below the chains he skids past.
- Cigarillos slow the whirl. Water costs a throw, as in golf.

Tuning is in `DISC` in `src/config.ts`; flight is in `src/discPhysics.ts`; Disco, the gnome, the basket and the UI are in `src/disc.ts`.

## World

- Music: a slow, relaxing ambient track generated in code (`buildGolfAmbient` in `packages/music`), different arrangement each load.
- The course is on an island. Other gnome groups play the other holes in the distance, gulls circle the shore, and every minute or two the castaway from Gnaft drifts by on his grass raft.
- The golf cart is a riding lawn mower. At every shot it is parked just off to the golfer's left with your playing partner; between shots you both ride it to the ball, routed around ponds and the sea and kept off greens and bunkers (grid A* in `round.ts`, `planDrive`).

## Code

- `src/config.ts`: clubs, lies, holes, tuning. Change numbers here.
- `src/course.ts`: the island as pure functions (`heightAt`, `lieAt`). `src/physics.ts`: ball flight, bounce, roll, range estimates. `src/round.ts`: phases, scoring, party placement.
- One file per system: `world`, `ambient`, `party` (+ `cartModel`), `ball`, `camera`, `controls`, `hud`, `minimap`, `audio`, `music`.

## Online

ONLINE on the title screen: pick a name, then play in the public lobby or a room code (up to 12 players, golf
or Gnome Disc). The first player hosts the lobby and picks the game and the format, then starts the round.
Friends can join mid-round; the scorecard notes the hole they joined on.

- **Together**: one group. Everyone plays their own ball, whoever is farthest from the pin plays next, and the
  convoy of 4-seat carts (the back bench faces backwards) drives to that ball so everyone watches.
- **Gnome w/ Friends**: everyone plays their own round at once, in their own cart; first to finish wins.

Code: `src/online.ts` (lobby, turns, relays; the shared server in `packages/mp-server` only relays),
`src/lobby.ts` (online panel and lobby), `src/remotes.ts` (other players in Gnome w/ Friends). Balls and thrown
gnomes bounce off trees and parked carts (`src/obstacles.ts`, trees placed in `src/trees.ts`).
Debug: `window.golfOnline` is the online API; `#norender` skips drawing (headless logic tests).

Not done yet: saving a round, chat. The other gnome groups' carts still drive in straight lines.
