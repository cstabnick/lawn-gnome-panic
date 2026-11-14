# Gnome Golf

3D golf on a little island, played by gnomes. A fairly pure golf game: 9 holes, real club ranges, wind, lies, water penalties. Works on a phone.

The question it answers: is a classic three-tap swing meter with honest club ranges fun on a phone screen?

## Run

```
npm install            # once, from the repo root
npm run dev -w games/gnome-golf    # http://localhost:5184 (also on your LAN, for a phone)
npm run build -w games/gnome-golf
```

Debug: `#hole=5` in the URL starts on hole 5. `window.golf` is the game state.

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

## World

- Music: a slow, relaxing ambient track generated in code (`buildGolfAmbient` in `packages/music`), different arrangement each load.
- The course is on an island. Other gnome groups play the other holes in the distance, gulls circle the shore, and every minute or two the castaway from Gnaft drifts by on his grass raft.
- The golf cart is a riding lawn mower. At every shot it is parked just off to the golfer's left with your playing partner; between shots you both ride it to the ball.

## Code

- `src/config.ts`: clubs, lies, holes, tuning. Change numbers here.
- `src/course.ts`: the island as pure functions (`heightAt`, `lieAt`). `src/physics.ts`: ball flight, bounce, roll, range estimates. `src/round.ts`: phases, scoring, party placement.
- One file per system: `world`, `ambient`, `party` (+ `cartModel`), `ball`, `camera`, `controls`, `hud`, `minimap`, `audio`, `music`.

Not done yet: multiplayer, tree collisions, green-reading grid, saving a round.
