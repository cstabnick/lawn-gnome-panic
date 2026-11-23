# Director's notes: `sq-snail-rigging-swap`

The arrival at the downtown slug paddock: a heist at night, low and quiet. Re-directed against [../bible.md](../bible.md);
the template is [../TEMPLATE.md](../TEMPLATE.md). Watch it at `http://localhost:5310/?no-intro&cutscene=sq-snail-rigging-swap`.

| | |
| --- | --- |
| Scene | `sq-snail-rigging-swap` in `src/cutscene/scenes/side/snailRigging.ts` |
| Played by | quest `sq-snail-rigging`, its visit beat at the paddock (the `snail-paddock` visit objective) |
| Kind and length | `arrival`, aim 10-35 s; now about 20 s at Normal text speed (was 21.8 s, 2 faults) |
| Where, when | stage `snail-paddock` (The Downtown Slug Paddock), night, under one sodium lamp; `sky: 'night'` |
| Before / after | before: the player walks in from the z = 0 road through the fence gap (the intro sent them). After: the player runs out of the paddock toward the z = 0 road; the outro's photo finish is back in the alley |

## 1. Purpose in the story

The heist. The player is inside the rival's pen with a bowl, and the guard slug (the wrangler) and the bookie are
nearby. It pays the quest's visit objective and makes the bookies a real threat, which the outro then leans on.

The old scene held a 45-second dolly and had the player talk to the pen from behind. It was a stop-motion set piece
without a point of view.

## 2. The player's feeling

- **In:** tense, crouched, a bowl in hand, the lamp hanging over them.
- **Out:** caught, and running. The bookie's line is the joke that sends them off.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| The player | to swap one bowl and be gone | the wrangler, the pen's lamp | a whisper, a bluff ("I'm lettuce") | caught, and runs |
| Slug Wrangler | to keep the pen quiet | a stranger in the pen | a stick, a whistle, a question | sees the player, calls it in |
| Slug Bookie | to keep the odds | anyone who is not a bettor | deadpan, the sharp observation | sees the hat, and the player flees |

## 4. Subtext

- The wrangler is more suspicious than he sounds: "Who's in the pen?" is a real question, not a joke.
- The bookie notices things. He is the one who says "Lettuce doesn't wear a hat", which means he saw the player's hat.

## 5. Beat sheet

| # | Time | Beat | What happens (picture first, then words) |
| --- | --- | --- | --- |
| 1 | 0-4 | Hook | A low creep over the grass toward the bowl; the player walks in (a move) at once. |
| 2 | 4-8 | Setup | The player whispers the job: "Decaf dandelion. One bowl. Three seconds. Don't look at the slugs." |
| 3 | 8-10 | Insert | A close insert on the slug that is not asleep. |
| 4 | 10-14 | Turn | A whistle (`whistle` at the wrangler), a `danger` stinger, a held breath. The wrangler turns: "Oi. Who's in the pen?" |
| 5 | 14-17 | Bluff | "Nobody. I'm lettuce." |
| 6 | 17-19 | Button | The bookie, from his stall: "Lettuce doesn't wear a hat." |
| 7 | 19-20 | Run | A low track after the player, who runs for the z = 0 road. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `dolly` low, 0.35 m, over the grass, 4 s | 34 | creeps in | the bowl | snail height, the heist tension |
| 2 | `shot('you','mcu')` | 35 | locked | the player | straight-on single, never the back of a hat |
| 3 | `cut` insert on `slug1` | 40 | locked, 1.2 s | the slug | the one slug that is not asleep |
| 4 | `PEN.single('wrangler','mcu')` | 35 | locked | the wrangler | on the eyeline to the player, the same side as the player's singles |
| 5 | `PEN.single('you','mcu')` | 35 | locked | the player | the bluff, the same side of the line |
| 6 | `shot('bookie','mcu',{toward:'you'})` | 35 | locked | the bookie | the punchline on his face |
| 7 | `track` low on the player | 42 | follows | the player | the getaway |

One side of the line for the pen exchange: `coverage('you', 'wrangler', 1)`. The bookie is 14 m away, outside the line
of the exchange, so his single does not cross it.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Player | Decaf dandelion. One bowl. Three seconds. Don't look at the slugs. | the job, said to the slugs (a straight-on single) |
| Wrangler | Oi. Who's in the pen? | the turn; a real question |
| Player | Nobody. I'm lettuce. | the bluff |
| Bookie | Lettuce doesn't wear a hat. | the button; a sharp observation, not a joke |

Names checked: `npm run lore -- find "slug"` (the downtown slug syndicate, the paddock, decaf dandelion greens are in
the intro's notes). No new names.

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0 | `night` ambience; `heist` music | the heist has a track |
| 10 | `whistle` sfx at the wrangler; `danger` stinger; a `pause` beat | the turn: the held breath |
| 19 | the run (the track); no music change | the chase is sound enough |

## 9. Blocking and vehicles

- The player walks from (24, -14.5) to (24.8, -13.2) at the bowl: a creep, not a run.
- The wrangler loops the pen; he is turned to the player (`face`) for his line.
- The bookie walks his stall; he is turned to the player (`face`) for his line.
- The player runs at the end: (22, -15.5), (12, -15), (2, -10), at 4 m/s. The lowrider is parked on the road, not in
  the scene's lines of sight.

## 10. The button

The bookie, from his stall, deadpan: "Lettuce doesn't wear a hat." It is the right last moment: the player is caught by
the one detail they forgot, and the chase follows. It is a look as much as a line.

## 11. Self-check

- [x] The scene has a want (the bowl), an obstacle (the wrangler) and a turn (the whistle).
- [x] The hook lands in 3 s: the walk starts at once; no opening narration.
- [x] Every line under 16 words (longest 11); nobody says what the picture shows.
- [x] Voices: the player's two short lines; the wrangler's question; the bookie's one sharp line.
- [x] Every speaker MCU, facing the player for their line (`face` before each cut).
- [x] One side of the line for the pen exchange (`coverage('you','wrangler',1)`).
- [x] Music: `heist` throughout; one stinger (`danger`); one `pause` (a held breath under 3 s).
- [x] Night scene: the lamp and the pen are lit by the sodium lamp; `sky: 'night'`.
- [ ] `npm run cutscene-report` and line of sight: see the issue report.
- [x] `direction.notes` points here.
