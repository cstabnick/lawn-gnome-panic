# @lawn/trickboard: the skate trick layer

Aether Board's trick layer with no three.js, so any game with a skateboard can score tricks the same way. Moved out of
`games/aether-board` unchanged; the game re-exports it.

- `tables.ts`: `BOARD_TRICKS` (name, flip, shove, duration, points), `GROUND_GESTURES` and `AIR_GESTURES` (how the trick
  stick does each trick), `zoneOf`, `GRABS` / `grabFor`, `GRINDS` / `grindFor`, `ASSIST` (perk-driven multipliers the
  combo reads; mutate the one object), `BIG_AIR_S`, `CLOSE_CALL_M`, `CLOSE_CALL_POINTS`, and the types `TrickCmd`,
  `Mode`, `PhysEvent`, `ComboView`.
- `tricks.ts`: `createRecognizer()` turns the trick stick into `TrickCmd`s; `createCombo()` scores `PhysEvent`s.

## Stick convention

The trick stick is a unit disc: x right, y up (= forward). Zones are the 8 compass directions plus `C` (centre,
below 0.5). A ground trick is: pull back (S), then flick along a gesture path; a grab held on the pop picks the harder
version. In the air a quick flick from centre does a board trick; with a grab held the stick picks the grab instead.

## Feeding the combo

```ts
import { createCombo, createRecognizer } from '@lawn/trickboard';
const rec = createRecognizer(), combo = createCombo();
const cmd = rec.feed(stick, mode, dt, grabHeld);           // each fixed step; a 'pop' or 'air' command, or null
combo.event({ e: 'takeoff', speed, ollie: true }, player); // build PhysEvents from your own controller
combo.tick(dt, player);                                    // player: { t: seconds, mode }
const v = combo.view();                                    // lines, points, mult, linkLeft, total, best, last
```

Points: each trick adds its `points`; spins, flips, grabs (base + per second held), grinds (base + per second, x1.3 on a
ley-line), manuals, Perfect, Close Call and Big Air add lines. The banked score is the combo points times the line
count, banked when the link time (1.4 s on the ground) runs out. A bail or skyfall loses it.

Test: `npm test -w packages/trickboard`.
