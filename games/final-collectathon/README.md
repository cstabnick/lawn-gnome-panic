# The Final Collectathon

A job interview at the Club Gnome Annex that turns into the collectathon to end all collectathons: four floors of
escalating collectibles, fake achievements and a narrator in the ceiling. When everything has been collected, you tell
the secretary you are not taking the job and fly off to Shellshore, the beach planet.

## Run

```
npm run dev -w games/final-collectathon     # port 5205
npm run build -w games/final-collectathon   # type-check and build
npm test -w games/final-collectathon        # collect sim (and the party slice contract once it exists)
```

## Controls

| Action | Phone | Keyboard |
|---|---|---|
| Walk | Stick (drag on the left half) | WASD or arrows |
| Jump | Jump button | Space |
| Interact | Interact button | E or Enter |
| Advance dialogue | Tap | Enter or Space |

## URL flags

- `?chapter=prologue|ch1|ch2|ch3|ch4|ending` jumps to the start of a chapter.
- `?fast` shortens every wait and line (for testing and demos).
- `#minigame=hoard-rush` plays the party slice alone, once the slice exists.

## Demos

`demos/hello.json` (the prologue's "Hello."), `demos/collecting.json` (Clips on Floor 2), `demos/pointlessness.json`
(Floor ∞, the HUD overflowing) and `demos/phone.json` (Floor 2 at 390x844, the touch stick). With the dev server up:
`npm run demo -- games/final-collectathon/demos/<name>.json --gif`.

## Chapters

- **Prologue: Reception.** Primrose Paperweight says "Hello."; the position is Collector; take the lift to Floor 1.
- **Chapter 1: Orientation (Floor 1).** A tutorial parody: an acorn trail, Golden Acorns on the filing cabinets, a Skip
  Tutorial button that does nothing.
- **Chapter 2: Onboarding (Floor 2).** Clips, Sticky Squares and Gold Buttons, respawns, an upgrade kiosk, a goal of
  1,000 Clips. "Floor 2: 104%. We round up."
- **Chapter 3: Synergy (Floor 2½).** Collectibles rain from the ceiling and convert into Tokens, Stars and Badges; a
  fake achievement every 6 seconds; the multiplier and the music keep climbing.
- **Chapter 4: Everything (Floor ∞).** The furniture becomes collectible, the HUD overflows, the counter hits ∞, and
  then the Pointlessness: everything stops.
- **Ending: Reception.** "I'm not taking the job." The gnome walks out, flies up to Shellshore, and the credits roll
  on the beach.

## Files (`src/`)

| File | What |
|---|---|
| `main.ts` | Entry: `loadMyGnome()`, then the app (or the `#minigame` slice) |
| `app.ts` | Wiring: renderer, scene, camera, floor swap, frame loop, `window.fc` debug handle |
| `types.ts` | Every shared type (the contract between modules), including `ChapterCtx` |
| `config.ts` | Every tuning constant |
| `director.ts` | Implements `ChapterCtx`: runs chapters, waits, interactions, the lift, eggs, saving |
| `collect.ts` | Pure collecting sim: items, magnet, multiplier, counts, rain, `formatCount` (tested in `collect.test.ts`) |
| `walk.ts` | Pure walker physics (walk, jump, collide) |
| `player.ts` | The player gnome from `@lawn/gnome`: walk, jump, fly and scripted moves |
| `camera.ts` | Fixed-yaw third-person follow camera (pulls back in portrait) |
| `input.ts` | Keyboard, touch joystick, Jump and Interact buttons |
| `hud.ts` | Counters, goal, dialogue, choices, toasts, title cards, fades, credits, overflow, Skip button, mute |
| `items.ts` | Pickup visuals (`createDrop` from `@lawn/prefabs`) and pickup bursts |
| `office.ts` | Floor builder: walls, windows, lift, front door, props, NPCs, lights |
| `floors/*.ts` | One layout per floor: `lobby`, `f1`, `f2`, `f3` (Floor 2½), `f4` (Floor ∞) |
| `sky.ts` | The flight: sky, clouds and the planet Shellshore |
| `sfx.ts` | WebAudio blips and `@lawn/mutter` voices |
| `music.ts` | Music controller over the three `@lawn/music` themes (Hold Music, Synergy Loop, Shellshore) |
| `save.ts` | localStorage save (`final-collectathon.save.v1`): chapter reached, eggs found, finished |
| `chapters/*.ts` | One script per chapter: `prologue`, `ch1`, `ch2`, `ch3`, `ch4`, `ending` |
| `minigames/` | The `hoard-rush` party slice |

## Not online

Single-player on purpose: it is a narrative with one secretary, one interviewer and one ending. A shared office would
double the game, and the story beats (locked dialogue, the scripted flight) would be per-player anyway.

## Lore

Setting `apocrypha` (ruling R-040 in `docs/lore/rulings.md`). Entries in `docs/lore/entries/apocrypha/`: `the-annex`,
`bucketworth-and-sons`, `primrose-paperweight`, `the-interviewer`, `shellshore`, `the-pointlessness`. Design:
`docs/roadmaps/final-collectathon.md`.
