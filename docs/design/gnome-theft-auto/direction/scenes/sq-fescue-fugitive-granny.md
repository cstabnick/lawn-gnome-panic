# Director's notes: `sq-fescue-fugitive-granny`

| | |
| --- | --- |
| Scene | `sq-fescue-fugitive-granny` in `src/cutscene/scenes/side/fescueFugitive.ts` |
| Played by | quest `sq-fescue-fugitive` as its outro on the cash ending (option B: the stone on Granny's scale) |
| Kind and length | `outro`, aim 30-40 s, max 60 s; now about 36 s at Normal text speed (was 47.6 s, 8 faults) |
| Where, when | stage `granny-barn` (Cloverfield Farms), golden hour, `sky: 'golden'` |
| Before / after | before: the drive south to the barn with the stone. After: the cash in the van; the player is free to go |

## 1. Purpose in the story

The cash payoff. Granny buys the stone, weighs it, and pays five hundred acorns in cash. It is the warm comedy of the
quest: the stone is a replica, the barn is her bake shop, and the pie is her only honest currency.

The old scene had an 18 s moving track on the van and a 10.5 s wide, one of Granny's lines split across a crossed line,
a player with their back to the camera, and Granny at 14% of the frame.

## 2. The player's feeling

- **In:** tense from the chase, then amused by Granny (a porch, a crate, a pie).
- **Out:** paid, a little dirty from the road, and with a pie. The stone is gone; the quest is closed.

## 3. Characters: objective, obstacle, tactic

| Character | Objective | Obstacle | Tactic(s) | Change by the end |
| --- | --- | --- | --- | --- |
| Granny Gnertrude | to buy the stone cheap and be seen doing it | the player is in a hurry | warmth, a gag on the weight, the pie | from "don't drip" to paying in cash |
| The player | to get paid and go | Granny's pace | short replies | takes the cash |
| Bramble | to finish the combine's header check | nothing | keeps walking his loop | none |

## 4. Subtext

- Granny knows the stone is a replica: the weigh-in is a joke at her own bid. The cash is real.
- "I'm too old to lift it" is her honesty: she is paying to not carry anything.

## 5. Beat sheet

| # | Time | Beat | What happens |
| --- | --- | --- | --- |
| 1 | 0.0-3.0 | Hook | Granny on her porch, already watching the lane (the picture first). |
| 2 | 3.0-12.0 | Setup | The van drives in; the player climbs out and walks up to the porch. "You're the one with the stone. Don't drip on the porch." / "It's a replica." |
| 3 | 12.0-22.0 | Turn | The stone is given; Granny hefts it. "Replica. Weighs like guilt." (the comic stinger), cheer. |
| 4 | 22.0-32.0 | Turn | The crate: cash spawns with a sfx. "Five hundred acorns. Cash, out of the crate. I'm too old to lift it." |
| 5 | 32.0-36.0 | Button | Granny on her single: "Take a pie for the road. It's the only honest thing I sell." Held 2.5 s. |

## 6. Shot list

| # | Shot | Lens / distance | Move | On | Motivation |
| --- | --- | --- | --- | --- | --- |
| 1 | `shot('granny','ms',{toward:'you',side:30})` | 40 | locked | Granny | the hook: she is already watching |
| 2 | `track` on the van as it drives in | 40 | moving (short) | the van | the arrival |
| 3 | `BARN_TALK.single('granny','mcu')` | 35 | locked | Granny | "Don't drip" |
| 4 | `BARN_TALK.single('you','mcu')` | 35 | locked | the player | "It's a replica." |
| 5 | `BARN_TALK.single('granny','mcu')` | 35 | locked | Granny | the weigh-in |
| 6 | `BARN_TALK.single('granny','mcu')` (same, held) | 35 | locked | Granny | the cash line |
| 7 | the button, held on Granny | 35 | locked | Granny | the pie |

Side of the line: Granny and the player on `coverage('granny','you',1)`. The crate and the yard are not in the lines.

## 7. Dialogue pass

| Who | Line | Note |
| --- | --- | --- |
| Granny | You're the one with the stone. Don't drip on the porch. | the hook line; unchanged (11 words) |
| The player | It's a replica. | the straight man; shot from the front (was from behind) |
| Granny | Replica. Weighs like guilt. | the comic stinger on the physical gag: she hefts it, it is too light |
| Granny | Five hundred acorns. Cash, out of the crate. I'm too old to lift it. | was 16 words with "carry either"; sharpened to a tired joke |
| Granny | Take a pie for the road. It's the only honest thing I sell. | the button; unchanged |
| ~~Caption~~ | ~~Granny Gnertrude's barn. Golden hour. The pumpkins have opinions.~~ | cut: the pumpkins are in the picture |

Names checked: `npm run lore -- find granny`, `find cloverfield` (the barn and bake shop).

## 8. Music and sound

| Time | Cue | Why |
| --- | --- | --- |
| 0.0 | `wind` ambience, `warm` music | the farm, warm and easy |
| 13 | `comic` stinger on "Weighs like guilt." | the one comic stinger |
| 20 | `cash` sfx at the crate | the money |

## 9. Blocking and vehicles

- The van (the player's, a ride-on) drives in from (-28, 330) to (-46, 333.5); the player climbs out and walks to (-58.5, 334).
- Granny stands just in front of her rocking chair (-62.4, 334.4), already up to meet the stone: the chair model faces away from its stage yaw, so seating her in it put the chair back between her and the lens. The player stands in front of her, on the coverage line.
- Bramble walks his combine loop (async) behind the lines.
- The crate (the payout) is hidden until it is spawned at (-74, 336).
- The player ends at the porch step, beside Granny; the van stays in the yard.

## 10. The button

Granny on her single, a pie held out: "It's the only honest thing I sell." It is right because it is the warmest line of
the quest, and it sends the player out with a pie and not a lecture.

## 11. Self-check

- [x] Want, obstacle and turn (the weigh-in).
- [x] Hook in 1 s: Granny on her porch.
- [x] Every line under 16 words (longest 15).
- [x] Granny warm, one comic stinger; the player short.
- [x] Every speaker framed MS or closer, facing the camera.
- [x] One side of the line.
- [x] Music changes: `warm` through, one comic stinger, the cash sfx.
- [x] Golden hour held; the yard lit by the sky.
- [ ] Report OK and removed from `pacing.baseline.ts` (the planner removes the baseline entry).
- [ ] Watched at 960x600 and 390x844 (see the worker report).
- [x] `direction.notes` points here.
