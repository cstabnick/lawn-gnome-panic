# Paragnormal

A first-person gnome horror prototype. You play as a tiny garden gnome trapped inside a dark, procedurally generated house full of towering furniture and giant Gnome-Soul monsters.

## Controls

- `W A S D`: Move
- `Mouse` (click to lock pointer) or `Arrow Left / Right / Up / Down`: Look around
- `Shift`: Sprint (costs stamina, and carries farther than you think)
- `C`: Crouch (slip under giant tables, beds and armchairs to hide). Ctrl is not bound: Ctrl+W closes the browser tab.
- `F`: Toggle ceramic lantern (off = harder to spot in the dark; on = a beacon, and it gutters now and then)
- `E`: Interact (collect shards/acorn, crack wards, spring traps, ring bells, escape)
- `P`: Pause

### Phone and touch screens

On a touch screen the controls appear on the screen during a run:

- **Left stick**: move.
- **Drag the right side** of the screen: look around.
- **Buttons, bottom right**: `F` Lantern, `C` Crouch (hold), `Shift` Sprint (hold), `E` Use.
- **Pause**, top right.

The controls show only while a run is being played, so they never cover a menu button. Add `?touch` to the URL to force them on in a desktop browser for testing.

## The house

- Each house has three Gnome-Souls: the Hollow Gardener and the Porcelain Watcher, plus one drawn from the seed: the **Lamplighter** (sees a lit lantern from across a room, blind in the dark), the **Dripping Nanny** (crawls under the furniture, so hiding does not stop it) or **the Hush** (almost blind, hears a sprint from far off, and silences the house around it).
- The lantern gutters out now and then, more often as the house gets tense and the wick wears. The house's seed decides when.
- Furniture: tables, chairs, beds, benches, wardrobes, cupboards, hearths, lamps, armchairs, rocking chairs, side tables, chests of drawers, candelabra and grandfather clocks. The clock ticks at you across the room.
- Lore for the house and its monsters lives in `docs/lore/entries/the-tall-house/`.

## Achievements

Paragnormal unlocks four achievements through `@lawn/achievements`: Garden Air (escape), Lights Out (three lantern gutters in one house), Shh (be brushed past by the Hush while hiding), and Three Bells (ring all three Soul-Bells).

## Run & Test

```sh
npm run dev -w games/paragnormal
npm run build -w games/paragnormal
npm test -w games/paragnormal
```
